// ===== MESSENGER HELPER =====
(function () {
  "use strict";

  if (window._tqsLoaded) return;
  window._tqsLoaded = true;

  console.log("[TQS] Loaded:", window.location.href);

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "typeAndSend") {
      typeAndSend(msg.message)
        .then((r) => sendResponse(r))
        .catch((e) => sendResponse({ success: false, error: e.message }));
      return true;
    }
    if (msg.action === "ping") {
      sendResponse({ ready: true });
      return true;
    }
  });

  async function typeAndSend(message) {
    console.log("[TQS] Starting...");

    const input = await waitForInput();
    if (!input) {
      return { success: false, error: "Khong tim thay o chat" };
    }

    input.focus();
    await sleep(100);
    input.innerHTML = "";

    document.execCommand("insertText", false, message);
    await sleep(300);

    if (!input.textContent || input.textContent.length < 5) {
      input.textContent = message;
      input.dispatchEvent(new InputEvent("input", { bubbles: true }));
      await sleep(200);
    }

    console.log("[TQS] Text inserted");

    const enterEvent = new KeyboardEvent("keydown", {
      key: "Enter",
      code: "Enter",
      keyCode: 13,
      which: 13,
      shiftKey: false,
      bubbles: true,
      cancelable: true,
    });

    input.dispatchEvent(enterEvent);
    console.log("[TQS] Sent");

    await sleep(500);
    return { success: true };
  }

  async function waitForInput() {
    const selectors = [
      'div[role="textbox"][contenteditable="true"]',
      'div[contenteditable="true"][data-lexical-editor]',
      'div[aria-label*="tin nh\u1eafn"][contenteditable]',
      'div[aria-label*="Message"][contenteditable]',
    ];

    for (let i = 0; i < 10; i++) {
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el && el.offsetWidth > 0) return el;
      }
      await sleep(300);
    }
    return null;
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async function checkPending() {
    await sleep(2500);
    try {
      const data = await chrome.storage.local.get(["pendingMessage"]);
      if (data.pendingMessage) {
        const result = await typeAndSend(data.pendingMessage);
        if (result.success) {
          await chrome.storage.local.remove(["pendingMessage"]);
        }
      }
    } catch (e) {}
  }

  checkPending();
})();
