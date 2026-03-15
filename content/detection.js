// ===== TAROT QUICKSALE — PAGE & PLATFORM DETECTION =====
// Auto-detects which fanpage and which platform (FB/Insta)
// from the current Facebook Business Suite URL and DOM.

(function () {
  "use strict";
  const T = window.TQS;

  // Detect which page (CA/DUA/POBO) from current URL params
  function detectPageFromURL() {
    const url = window.location.href;
    const params = new URLSearchParams(window.location.search);
    const pageId =
      params.get("page_id") ||
      params.get("asset_id") ||
      params.get("business_id") ||
      new URLSearchParams(window.location.hash.slice(1)).get("asset_id");
    if (pageId && T.PAGE_IDS[pageId]) return T.PAGE_IDS[pageId];
    for (const [id, page] of Object.entries(T.PAGE_IDS)) {
      if (url.includes(id)) return page;
    }
    return null;
  }

  // Detect if current conversation is Instagram or Facebook
  function detectSourcePlatform() {
    try {
      const url = window.location.href;
      if (
        url.includes("instagram") ||
        url.includes("ig_thread") ||
        url.includes("channel=instagram")
      ) {
        return "instagram";
      }
      const conversationHeader = document.querySelector(
        '[data-testid="inbox-thread-header"], [class*="thread-header"], [class*="conversation-header"]',
      );
      if (conversationHeader) {
        if (/instagram/i.test(conversationHeader.textContent || ""))
          return "instagram";
      }
      const igIndicators = document.querySelectorAll(
        '[aria-label*="Instagram"], [data-channel="instagram"], img[alt*="Instagram"], [title*="Instagram"]',
      );
      for (const el of igIndicators) {
        if (!el.closest("#tarot-quicksale-panel")) return "instagram";
      }
      const channelBadges = document.querySelectorAll(
        '[class*="channel"], [class*="platform"], [class*="source"]',
      );
      for (const badge of channelBadges) {
        if (badge.closest("#tarot-quicksale-panel")) continue;
        if (
          /instagram/i.test(
            badge.textContent || badge.getAttribute("aria-label") || "",
          )
        ) {
          return "instagram";
        }
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

  // Export
  T.detection = { detectPageFromURL, detectSourcePlatform, tryAutoFillCustomer };
})();
