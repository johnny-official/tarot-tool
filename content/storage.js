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
      chrome.storage.local.set({ ..._syncPending });
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
      T.ui.showToast("⚠️ Thiếu config.json!", "error");
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
        "shiftOrders",
        "shiftStartTime",
      ]);

      if (Array.isArray(data.savedReaders)) T.readerList = data.savedReaders;
      if (typeof data.activeReaderIdx === "number") {
        T.activeReaderIdx =
          T.readerList.length > 0
            ? data.activeReaderIdx % T.readerList.length
            : 0;
      }
      if (typeof data.autoRotate !== "undefined") T.autoRotate = data.autoRotate;
      if (T.els.autoRotateToggle) T.els.autoRotateToggle.checked = T.autoRotate;

      if (data.schedule && T.els.scheduleInput)
        T.els.scheduleInput.value = data.schedule;
      if (Array.isArray(data.scheduleSlots)) {
        T.scheduleSlots = data.scheduleSlots;
        T.slotReaderIdx = data.slotReaderIdx || {};
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
      if (
        changes.activeReaderIdx &&
        typeof changes.activeReaderIdx.newValue === "number"
      ) {
        T.activeReaderIdx = changes.activeReaderIdx.newValue;
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
        T.slotReaderIdx = {};
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
