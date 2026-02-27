// Background service worker
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { action: "togglePanel" });
});

// ===== Load config (Page IDs, Chat IDs) from config.json =====
let MESSENGER_URLS = { facebook: "", messenger: "" };
let CHAT_IDS = { facebook: "", messenger: "" };

async function loadConfig() {
  try {
    const url = chrome.runtime.getURL("config.json");
    const res = await fetch(url);
    const cfg = await res.json();
    const fb = cfg.messenger.facebookChatId;
    const msg = cfg.messenger.messengerChatId;
    CHAT_IDS = { facebook: fb, messenger: msg };
    MESSENGER_URLS = {
      facebook: `https://www.facebook.com/messages/t/${fb}`,
      messenger: `https://www.messenger.com/t/${msg}`,
    };
  } catch {
    // config.json missing — use empty (send button will fail gracefully)
  }
}

// Init
loadConfig();


chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "instantSend") {
    handleInstantSend(msg.message, msg.platform || "facebook")
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

async function handleInstantSend(message, platform) {
  const targetUrl = MESSENGER_URLS[platform];
  const targetId = CHAT_IDS[platform];

  const patterns =
    platform === "messenger"
      ? [
          `https://www.messenger.com/t/${targetId}*`,
          "https://www.messenger.com/*",
        ]
      : [
          `https://www.facebook.com/messages/t/${targetId}*`,
          "https://www.facebook.com/messages/*",
        ];

  let allTabs = [];
  for (const pattern of patterns) {
    try {
      const tabs = await chrome.tabs.query({ url: pattern });
      allTabs = allTabs.concat(tabs);
    } catch {}
  }

  // Deduplicate
  const seen = new Set();
  allTabs = allTabs.filter((t) => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });

  const targetTab = allTabs.find((t) => t.url.includes(targetId)) || allTabs[0];

  if (!targetTab) {
    const newTab = await chrome.tabs.create({ url: targetUrl, active: false });
    await chrome.storage.local.set({ pendingMessage: message });
    await waitForTabComplete(newTab.id, 5000);

    try {
      await chrome.scripting.executeScript({
        target: { tabId: newTab.id },
        files: ["messenger.js"],
      });
      await sleep(2000);
      const response = await chrome.tabs.sendMessage(newTab.id, {
        action: "typeAndSend",
        message,
      });
      if (response?.success) {
        await chrome.storage.local.remove(["pendingMessage"]);
        return { success: true, method: "newTab" };
      }
    } catch {}

    return { success: false, error: "Tab mới mở - chờ 3s rồi thử lại" };
  }

  try {
    let ready = false;
    try {
      const ping = await chrome.tabs.sendMessage(targetTab.id, {
        action: "ping",
      });
      ready = ping?.ready;
    } catch {}

    if (!ready) {
      await chrome.scripting.executeScript({
        target: { tabId: targetTab.id },
        files: ["messenger.js"],
      });
      await sleep(1000);
    }

    const response = await chrome.tabs.sendMessage(targetTab.id, {
      action: "typeAndSend",
      message,
    });
    if (response?.success) return { success: true, method: response.method };
    return { success: false, error: response?.error || "Không gửi được" };
  } catch (e) {
    await chrome.storage.local.set({ pendingMessage: message });
    return { success: false, error: "Lỗi - Ctrl+V để paste" };
  }
}

function waitForTabComplete(tabId, timeout) {
  return new Promise((resolve) => {
    const start = Date.now();
    const check = async () => {
      try {
        const tab = await chrome.tabs.get(tabId);
        if (tab.status === "complete") {
          resolve(true);
          return;
        }
      } catch {
        resolve(false);
        return;
      }
      if (Date.now() - start > timeout) {
        resolve(false);
        return;
      }
      setTimeout(check, 300);
    };
    check();
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
