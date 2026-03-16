// ===== TAROT QUICKSALE — CHROME STORAGE =====
// All chrome.storage.local operations: load, save, sync.

(function () {
  "use strict";
  const T = window.TQS;

  // ===== DEBOUNCED SAVE =====
  let _syncPending = {};
  let _syncTimer = null;
  function syncSave(data) {
    Object.assign(_syncPending, data);
    clearTimeout(_syncTimer);
    _syncTimer = setTimeout(() => {
      try {
        chrome.storage.local.set({ ..._syncPending });
      } catch { /* silent — quota or API error */ }
      _syncPending = {};
    }, 200);
  }

  // ===== LOAD CONFIG (PAGE_IDS) =====
  async function loadConfig() {
    try {
      const cfgUrl = chrome.runtime.getURL("config.json");
      const cfgRes = await fetch(cfgUrl);
      const cfg = await cfgRes.json();
      if (cfg.pages) {
        T.PAGE_IDS = {};
        for (const [key, val] of Object.entries(cfg.pages)) {
          T.PAGE_IDS[val.fbPageId] = key;
        }
      }
    } catch {
      if (T.ui?.showToast) T.ui.showToast("⚠️ Thiếu config.json!", "error");
    }
  }

  // ===== LOAD PRICING DATA =====
  async function loadPricingData() {
    const url = chrome.runtime.getURL("price.json");
    const res = await fetch(url);
    const data = await res.json();
    const { _comment, ...pricing } = data;
    return pricing;
  }

  // ===== LOAD ALL DATA FROM STORAGE =====
  async function loadData() {
    try {
      const data = await chrome.storage.local.get([
        "savedReaders",
        "activeReaderIdx",
        "autoRotate",
        "schedule",
        "scheduleSlots",
        "scheduleMode",
        "slotReaderIdx",
        "groupReaderIdx",
        "groupSlotReaderIdx",
        "shiftOrders",
        "shiftStartTime",
      ]);

      if (Array.isArray(data.savedReaders)) T.readerList = data.savedReaders;

      // Load per-group reader indices (với backward compat)
      if (data.groupReaderIdx && typeof data.groupReaderIdx === "object") {
        T.groupReaderIdx = { CA_DUA: 0, POBO: 0, ...data.groupReaderIdx };
      } else if (typeof data.activeReaderIdx === "number") {
        // Migration: cũ dùng 1 index → set cho tất cả groups
        const idx = T.readerList.length > 0 ? data.activeReaderIdx % T.readerList.length : 0;
        T.groupReaderIdx = { CA_DUA: idx, POBO: idx };
      }
      // Đồng bộ activeReaderIdx cho backward compat
      const g = T.PAGE_GROUPS[T.detectedPage] || "CA_DUA";
      T.activeReaderIdx = T.groupReaderIdx[g] || 0;

      if (typeof data.autoRotate !== "undefined") T.autoRotate = data.autoRotate;
      if (T.els.autoRotateToggle) T.els.autoRotateToggle.checked = T.autoRotate;

      if (data.schedule && T.els.scheduleInput)
        T.els.scheduleInput.value = data.schedule;

      if (Array.isArray(data.scheduleSlots)) {
        T.scheduleSlots = data.scheduleSlots;
        T.slotReaderIdx = data.slotReaderIdx || {};
        // Load per-group slot indices
        if (data.groupSlotReaderIdx && typeof data.groupSlotReaderIdx === "object") {
          T.groupSlotReaderIdx = { CA_DUA: {}, POBO: {}, ...data.groupSlotReaderIdx };
        } else {
          // Migration: cũ dùng 1 slotReaderIdx → copy cho tất cả groups
          T.groupSlotReaderIdx = {
            CA_DUA: { ...T.slotReaderIdx },
            POBO: { ...T.slotReaderIdx },
          };
        }
        T.readers.startScheduleTimer();
      }

      T.scheduleMode =
        typeof data.scheduleMode !== "undefined"
          ? data.scheduleMode
          : T.scheduleSlots.length > 0;
      if (T.els.scheduleModeToggle)
        T.els.scheduleModeToggle.checked = T.scheduleMode;

      if (data.shiftStartTime) T.shiftStartTime = data.shiftStartTime;
      if (Array.isArray(data.shiftOrders)) T.shiftOrders = data.shiftOrders;

      T.readers.updateReaderDisplay();
      T.orders.updateDashboard();
    } catch {
      /* silent fail */
    }
  }

  // ===== CROSS-TAB SYNC =====
  function initCrossTabSync() {
    if (typeof chrome === "undefined" || !chrome.storage?.onChanged) return;
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      let needsReader = false;
      let needsDash = false;

      if (changes.shiftOrders) {
        T.shiftOrders = changes.shiftOrders.newValue || [];
        needsDash = true;
      }
      if (changes.groupReaderIdx && typeof changes.groupReaderIdx.newValue === "object") {
        T.groupReaderIdx = { CA_DUA: 0, POBO: 0, ...changes.groupReaderIdx.newValue };
        const g = T.PAGE_GROUPS[T.detectedPage] || "CA_DUA";
        T.activeReaderIdx = T.groupReaderIdx[g] || 0;
        needsReader = true;
      }
      if (changes.savedReaders) {
        T.readerList = changes.savedReaders.newValue || [];
        needsReader = true;
      }
      if (changes.autoRotate) {
        T.autoRotate = changes.autoRotate.newValue;
        if (T.els.autoRotateToggle)
          T.els.autoRotateToggle.checked = T.autoRotate;
        needsReader = true;
      }
      if (changes.scheduleSlots) {
        T.scheduleSlots = changes.scheduleSlots.newValue || [];
        needsReader = true;
      }
      if (changes.groupSlotReaderIdx && typeof changes.groupSlotReaderIdx.newValue === "object") {
        T.groupSlotReaderIdx = { CA_DUA: {}, POBO: {}, ...changes.groupSlotReaderIdx.newValue };
        needsReader = true;
      }
      if (changes.slotReaderIdx) {
        T.slotReaderIdx = changes.slotReaderIdx.newValue || {};
        needsReader = true;
      }
      if (changes.scheduleMode) {
        T.scheduleMode = changes.scheduleMode.newValue;
        if (T.els.scheduleModeToggle)
          T.els.scheduleModeToggle.checked = T.scheduleMode;
        needsReader = true;
      }

      if (needsDash) T.orders.updateDashboard();
      if (needsReader) T.readers.updateReaderDisplay();
    });
  }

  // Export
  T.storage = {
    syncSave,
    loadConfig,
    loadPricingData,
    loadData,
    initCrossTabSync,
  };
})();
