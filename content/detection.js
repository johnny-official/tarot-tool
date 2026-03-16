// ===== TAROT QUICKSALE — PAGE & PLATFORM DETECTION =====
// Auto-detects which fanpage and which platform (FB/Insta)
// from the current Facebook Business Suite URL and DOM.

(function () {
  "use strict";
  const T = window.TQS;

  // Detect which page (CA/DUA/POBO) from current URL params
  function detectPageFromURL() {
    try {
      const url = window.location.href;
      const params = new URLSearchParams(window.location.search);
      const pageId =
        params.get("asset_id") ||
        params.get("page_id") ||
        params.get("mailbox_id") ||
        params.get("business_id") ||
        params.get("selected_asset_id") ||
        new URLSearchParams(window.location.hash.slice(1)).get("asset_id");
      if (pageId && T.PAGE_IDS[pageId]) return T.PAGE_IDS[pageId];
      for (const [id, page] of Object.entries(T.PAGE_IDS)) {
        if (url.includes(id)) return page;
      }
    } catch { /* silent */ }
    return null;
  }

  // Lấy selected_item_id từ URL (conversation ID duy nhất)
  function getSelectedItemId() {
    try {
      return new URLSearchParams(window.location.search).get("selected_item_id") || "";
    } catch { return ""; }
  }

  // Detect if current conversation is Instagram or Facebook.
  // CONSERVATIVE: defaults to "facebook" unless strong Instagram signals found.
  function detectSourcePlatform() {
    try {
      const url = window.location.href;
      const params = new URLSearchParams(window.location.search);

      // 1. URL PATH — tín hiệu mạnh nhất
      // FB Business Suite dùng /inbox/instagram_direct cho IG DM
      if (/\/inbox\/instagram/i.test(url)) {
        return "instagram";
      }

      // 2. URL PARAMS — thread_type, channel
      const threadType = (params.get("thread_type") || "").toUpperCase();
      if (threadType.includes("IG")) {
        return "instagram";
      }
      if (
        url.includes("channel=instagram") ||
        url.includes("ig_thread") ||
        url.includes("instagram_id")
      ) {
        return "instagram";
      }

      // 3. DOM TEXT — panel chi tiết bên phải
      // Instagram conversation hiện "Instagram profile"
      // Facebook conversation hiện "Facebook profile"
      const mainArea = document.querySelector('[role="main"]') || document.body;
      const allText = mainArea.textContent || "";
      if (/Instagram\s+profile/i.test(allText)) {
        return "instagram";
      }

      // 4. DOM ATTRIBUTES — fallback cho các signal khác
      const igData = mainArea.querySelector(
        '[data-channel="instagram"], [data-testid*="instagram"]'
      );
      if (igData) return "instagram";

      // 5. IG icon/badge trong header area
      const headerArea = mainArea.querySelector(
        '[data-testid="inbox-thread-header"], [class*="thread-header"]'
      );
      if (headerArea) {
        const igBadge = headerArea.querySelector(
          'img[alt*="Instagram"], [aria-label*="Instagram"], svg[aria-label*="Instagram"]'
        );
        if (igBadge) return "instagram";
      }
    } catch {
      /* silent */
    }
    return "facebook";
  }

  // Try to pre-fill customer name from FB Business Suite conversation header
  function tryAutoFillCustomer() {
    try {
      const nameEl = document.querySelector(
        '[data-testid="inbox-thread-header-name"], ' +
          '[class*="thread-header"] [class*="name"], ' +
          '[class*="conversation-header"] span[dir="auto"]',
      );
      if (nameEl && T.els.customerInput && !T.els.customerInput.value.trim()) {
        const name = (nameEl.textContent || "").trim();
        if (name && name.length > 1 && name.length < 50) {
          T.els.customerInput.value = name;
        }
      }
    } catch {
      /* silent */
    }
  }

  // ===== CONVERSATION CHANGE OBSERVER =====
  // MutationObserver theo dõi khi chuyển conversation trong FB Business Suite
  let _convDebounce = null;
  let _lastConvSignature = "";

  function _getConversationSignature() {
    try {
      const header = document.querySelector(
        '[data-testid="inbox-thread-header-name"], ' +
        '[class*="thread-header"] [class*="name"]'
      );
      const itemId = getSelectedItemId();
      return (itemId || "") + "|" + (header?.textContent || "").trim();
    } catch { return ""; }
  }

  function _onConversationChange() {
    const sig = _getConversationSignature();
    if (sig === _lastConvSignature || !sig) return;
    _lastConvSignature = sig;

    // Re-detect platform + auto-fill
    T.sourcePlatform = detectSourcePlatform();
    tryAutoFillCustomer();
  }

  function initConversationObserver() {
    const mainArea = document.querySelector('[role="main"]');
    if (!mainArea) return;

    _lastConvSignature = _getConversationSignature();

    const observer = new MutationObserver(() => {
      clearTimeout(_convDebounce);
      _convDebounce = setTimeout(_onConversationChange, 300);
    });

    observer.observe(mainArea, {
      childList: true,
      subtree: true,
      characterData: false,
      attributes: false,
    });

    T._convObserver = observer;
  }

  // Export
  T.detection = {
    detectPageFromURL,
    detectSourcePlatform,
    tryAutoFillCustomer,
    getSelectedItemId,
    initConversationObserver,
  };
})();

