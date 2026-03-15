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
    return null;
  }

  // Detect if current conversation is Instagram or Facebook.
  // CONSERVATIVE: defaults to "facebook" unless strong Instagram signals found.
  // Only checks conversation-specific areas, NOT global sidebar/nav.
  function detectSourcePlatform() {
    try {
      // 1. URL-level signals (strongest)
      const url = window.location.href;
      if (
        url.includes("channel=instagram") ||
        url.includes("ig_thread") ||
        url.includes("instagram_id")
      ) {
        return "instagram";
      }

      // 2. Find the conversation thread container
      // FB Business Suite wraps the active conversation in a specific area
      const threadContainer =
        document.querySelector('[data-testid="inbox-thread-header"]')?.closest('[role="main"]') ||
        document.querySelector('[role="main"]');
      if (!threadContainer) return "facebook";

      // 3. Check for Instagram-specific data attributes within thread
      const igData = threadContainer.querySelector(
        '[data-channel="instagram"], [data-testid*="instagram"]'
      );
      if (igData) return "instagram";

      // 4. Look for Instagram icon/badge NEAR the conversation header
      // (within first 200px of thread — the header area, not entire page)
      const headerArea = threadContainer.querySelector(
        '[data-testid="inbox-thread-header"], [class*="thread-header"]'
      );
      if (headerArea) {
        // Check for IG icon SVG or small badges next to customer name
        const igBadge = headerArea.querySelector(
          'img[alt*="Instagram"], [aria-label*="Instagram"], svg[aria-label*="Instagram"]'
        );
        if (igBadge) return "instagram";

        // Check header text for "Instagram" label
        const headerText = headerArea.textContent || "";
        if (/\binstagram\b/i.test(headerText)) return "instagram";
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
