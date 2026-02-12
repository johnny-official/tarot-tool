// Background service worker - handles messaging WITHOUT switching tabs
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { action: "togglePanel" });
});

// URLs for messaging
const MESSENGER_URLS = {
  facebook: "https://www.facebook.com/messages/t/623973524119607",
  messenger: "https://www.messenger.com/t/8164573853616965",
};

const CHAT_IDS = {
  facebook: "623973524119607",
  messenger: "8164573853616965",
};

// Listen for instant send request
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "instantSend") {
    handleInstantSend(msg.message, msg.platform || "facebook")
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

// Find existing tab and send message WITHOUT switching
async function handleInstantSend(message, platform) {
  const targetUrl = MESSENGER_URLS[platform];
  const targetId = CHAT_IDS[platform];

  console.log("[TQS] Searching for chat:", platform, targetId);

  // Find matching tabs
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
    } catch (e) {}
  }

  // Remove duplicates
  const seenIds = new Set();
  allTabs = allTabs.filter((tab) => {
    if (seenIds.has(tab.id)) return false;
    seenIds.add(tab.id);
    return true;
  });

  // Prioritize exact match
  const exactMatch = allTabs.find((tab) => tab.url.includes(targetId));
  const targetTab = exactMatch || allTabs[0];

  console.log("[TQS] Found tabs:", allTabs.length, "Target:", targetTab?.id);

  if (!targetTab) {
    // No tab - need to open one in background
    const newTab = await chrome.tabs.create({
      url: targetUrl,
      active: false, // Open in background!
    });

    await chrome.storage.local.set({ pendingMessage: message });

    // Wait for tab to load
    await waitForTabComplete(newTab.id, 5000);

    // Try to inject and send
    try {
      await chrome.scripting.executeScript({
        target: { tabId: newTab.id },
        files: ["messenger.js"],
      });

      await sleep(2000);

      const response = await chrome.tabs.sendMessage(newTab.id, {
        action: "typeAndSend",
        message: message,
      });

      if (response?.success) {
        await chrome.storage.local.remove(["pendingMessage"]);
        return { success: true, method: "newTab" };
      }
    } catch (e) {
      console.log("[TQS] New tab send failed:", e);
    }

    return { success: false, error: "Tab mới mở - chờ 3s rồi thử lại" };
  }

  // Found existing tab - send WITHOUT activating
  console.log("[TQS] Sending to tab:", targetTab.id, "URL:", targetTab.url);

  try {
    // First try to ping
    let ready = false;
    try {
      const ping = await chrome.tabs.sendMessage(targetTab.id, {
        action: "ping",
      });
      ready = ping?.ready;
    } catch (e) {}

    // Inject script if not ready
    if (!ready) {
      await chrome.scripting.executeScript({
        target: { tabId: targetTab.id },
        files: ["messenger.js"],
      });
      await sleep(1000);
    }

    // Send the message (without switching tabs)
    const response = await chrome.tabs.sendMessage(targetTab.id, {
      action: "typeAndSend",
      message: message,
    });

    console.log("[TQS] Response:", response);

    if (response?.success) {
      return { success: true, method: response.method };
    } else {
      return { success: false, error: response?.error || "Không gửi được" };
    }
  } catch (e) {
    console.error("[TQS] Error:", e);
    await chrome.storage.local.set({ pendingMessage: message });
    return { success: false, error: "Lỗi - Ctrl+V để paste" };
  }
}

// Wait for tab to finish loading
function waitForTabComplete(tabId, timeout) {
  return new Promise((resolve) => {
    const startTime = Date.now();

    const checkTab = async () => {
      try {
        const tab = await chrome.tabs.get(tabId);
        if (tab.status === "complete") {
          resolve(true);
          return;
        }
      } catch (e) {
        resolve(false);
        return;
      }

      if (Date.now() - startTime > timeout) {
        resolve(false);
        return;
      }

      setTimeout(checkTab, 300);
    };

    checkTab();
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
