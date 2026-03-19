// ===== TAROT QUICKSALE — MAIN ENTRY POINT =====
// Init sequence, event wiring, keyboard shortcuts, SPA observer.
// Loads LAST — all other modules must be loaded before this.

(function () {
  "use strict";
  const T = window.TQS;

  // Guard against double-injection
  if (document.getElementById("tarot-quicksale-panel")) return;

  // ===== EVENT WIRING =====
  function initEvents() {
    T.els.serviceSelect?.addEventListener("change", T.orders.populatePackages);
    T.els.packageSelect?.addEventListener("change", T.orders.updatePrice);
    T.els.customMode?.addEventListener("change", T.orders.toggleCustomMode);
    T.els.customPrice?.addEventListener("input", T.orders.updatePrice);

    T.els.scheduleBtn?.addEventListener("click", () => {
      T.els.scheduleModal.classList.remove("tqs-hidden");
      T.els.scheduleInput.focus();
    });

    T.els.readerAddInput?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        T.readers.addReader(T.els.readerAddInput.value);
        T.els.readerAddInput.value = "";
      }
    });

    T.els.readerChips?.addEventListener("click", (e) => {
      const xBtn = e.target.closest(".tqs-chip-x");
      if (xBtn) {
        e.stopPropagation();
        T.readers.removeReader(parseInt(xBtn.dataset.removeIdx));
        return;
      }
      const chip = e.target.closest(".tqs-chip");
      if (chip?.dataset.reader) {
        // Lưu vị trí gốc trước khi override (per-group)
        if (!T.manualReaderOverride) {
          T.preOverrideReaderIdx = T.readers.getGroupIdx();
        }
        T.manualReaderOverride = chip.dataset.reader;
        T.readers.updateReaderDisplay();
        T.ui.showToast(`🎯 1 lượt: @${chip.dataset.reader}`);
      }
    });

    T.els.autoRotateToggle?.addEventListener("change", () => {
      T.autoRotate = T.els.autoRotateToggle.checked;
      chrome.storage.local.set({ autoRotate: T.autoRotate });
      T.readers.updateReaderDisplay();
      T.ui.showToast(T.autoRotate ? "🔄 Tự đổi: Bật" : "🔒 Cố định: Tắt");
    });

    T.els.scheduleModeToggle?.addEventListener("change", () => {
      T.scheduleMode = T.els.scheduleModeToggle.checked;
      chrome.storage.local.set({ scheduleMode: T.scheduleMode });
      if (T.scheduleMode && T.scheduleSlots.length > 0) {
        T.readers.startScheduleTimer();
      } else if (T.scheduleTimerId) {
        clearInterval(T.scheduleTimerId);
        T.scheduleTimerId = null;
      }
      T.readers.updateReaderDisplay();
    });

    T.els.scheduleClose?.addEventListener("click", () =>
      T.els.scheduleModal.classList.add("tqs-hidden"),
    );

    T.els.scheduleParse?.addEventListener("click", () => {
      const text = T.els.scheduleInput.value;
      const slots = T.readers.parseSchedule(text);
      if (slots.length > 0) {
        T.scheduleSlots = slots;
        T.scheduleMode = true;
        const allReaders = [...new Set(slots.flatMap((s) => s.readers))];
        if (allReaders.length > 0) {
          T.readerList = allReaders;
          T.groupReaderIdx = { CA_DUA: 0, POBO: 0 };
          T.groupSlotReaderIdx = { CA_DUA: {}, POBO: {} };
          T.activeReaderIdx = 0;
        }
        if (T.els.scheduleModeToggle) T.els.scheduleModeToggle.checked = true;
        chrome.storage.local.set({
          schedule: text,
          scheduleSlots: slots,
          scheduleMode: true,
          savedReaders: T.readerList,
          groupReaderIdx: { ...T.groupReaderIdx },
          groupSlotReaderIdx: JSON.parse(JSON.stringify(T.groupSlotReaderIdx)),
        });
        T.ui.showToast(`✓ ${slots.length} ca · ${allReaders.join(", ")}`);
        T.els.scheduleModal.classList.add("tqs-hidden");
        T.readers.startScheduleTimer();
        T.readers.updateReaderDisplay();
      } else {
        T.ui.showToast("⚠️ Không tìm thấy ca/reader nào!", "error");
      }
    });

    T.els.copySaveBtn?.addEventListener("click", T.orders.copyAndSave);
    T.els.resetBtn?.addEventListener("click", T.orders.resetShift);
    T.els.reportBtn?.addEventListener("click", T.orders.copyReport);

    T.els.orderList?.addEventListener("click", (e) => {
      const editBtn = e.target.closest(".tqs-edit-btn");
      const delBtn = e.target.closest(".tqs-delete-btn");
      if (editBtn) T.orders.openEditOrder(parseInt(editBtn.dataset.id));
      if (delBtn) T.orders.deleteOrder(parseInt(delBtn.dataset.id));
    });

    T.els.editSave?.addEventListener("click", T.orders.saveEditOrder);
    T.els.editCancel?.addEventListener("click", () => {
      T.els.editModal.classList.add("tqs-hidden");
      T.editingOrderId = null;
    });

    T.els.customerInput?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") T.els.serviceSelect.focus();
    });
    T.els.noteInput?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") T.orders.copyAndSave();
    });
    T.els.customPrice?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") T.orders.copyAndSave();
    });
  }

  // ===== KEYBOARD SHORTCUTS =====
  function initShortcuts() {
    document.addEventListener("keydown", (e) => {
      // Bỏ qua nếu đang gõ trong input/textarea khác (ngoài panel)
      const tag = e.target.tagName;
      const inPanelInput = e.target.closest("#tarot-quicksale-panel");

      if (e.altKey && e.key === "t") {
        e.preventDefault();
        const isHidden = T.panel.classList.contains("tqs-hidden");
        T.panel.classList.toggle("tqs-hidden", !isHidden);
        T.els.toggleBtn.classList.toggle("tqs-hidden", isHidden);
        return;
      }

      // Alt+C — Quick Copy & Save
      if (e.altKey && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        if (!T.panel.classList.contains("tqs-hidden")) {
          T.orders.copyAndSave();
        }
        return;
      }

      // Alt+1..9 — Quick chọn gói (khi panel đang mở)
      if (e.altKey && e.key >= "1" && e.key <= "9" && !T.panel.classList.contains("tqs-hidden")) {
        e.preventDefault();
        const idx = parseInt(e.key);
        const pkgSelect = T.els.packageSelect;
        if (pkgSelect && pkgSelect.options.length > idx) {
          pkgSelect.selectedIndex = idx;
          T.orders.updatePrice();
        }
        return;
      }
    });

    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.action === "togglePanel") {
        T.panel.classList.toggle("tqs-hidden");
        T.els.toggleBtn.classList.toggle(
          "tqs-hidden",
          !T.panel.classList.contains("tqs-hidden"),
        );
      }
    });
  }

  // ===== SPA NAVIGATION OBSERVER =====
  function initSPAObserver() {
    let _lastURL = location.href;
    let _lastItemId = T.detection.getSelectedItemId();

    setInterval(() => {
      const currURL = location.href;
      const currItemId = T.detection.getSelectedItemId();
      const urlChanged = currURL !== _lastURL;
      const itemChanged = currItemId !== _lastItemId;

      if (urlChanged || itemChanged) {
        _lastURL = currURL;
        _lastItemId = currItemId;

        // Detect page change (page-level)
        if (urlChanged) {
          const newPage = T.detection.detectPageFromURL();
          if (newPage && newPage !== T.detectedPage) {
            T.detectedPage = newPage;
            T.ui.updatePageBadge();
            T.orders.populateServices();
            // Cập nhật reader display cho group mới
            T.readers.updateReaderDisplay();
          }
        }

        // Detect conversation change (item-level)
        T.sourcePlatform = T.detection.detectSourcePlatform();
        T.ui.updateSourceBadge();
        T.detection.tryAutoFillCustomer();
      }
    }, 2000);
  }

  // ===== INIT =====
  async function init() {
    // 1. Inject panel + collect DOM refs
    const panel = T.ui.injectPanel();
    if (!panel) return;
    T.ui.collectElements(panel);

    // 2. Parallel fetch: config + pricing + saved data
    try {
      const [, pricingData] = await Promise.all([
        T.storage.loadConfig(),
        T.storage.loadPricingData(),
      ]);
      T.PRICING_DATA = pricingData;
    } catch {
      T.ui.showToast("Lỗi load dữ liệu!", "error");
      return;
    }

    // 3. Detect page
    T.detectedPage = T.detection.detectPageFromURL();
    if (!T.detectedPage || !T.PRICING_DATA[T.detectedPage]) {
      const firstPage = Object.keys(T.PRICING_DATA)[0];
      if (firstPage) T.detectedPage = firstPage;
    }
    T.ui.updatePageBadge();
    T.sourcePlatform = T.detection.detectSourcePlatform();
    T.ui.updateSourceBadge();

    // 4. Load saved data from storage
    await T.storage.loadData();
    T.orders.populateServices();

    // 5. Init UI systems
    T.ui.initDrag();
    T.ui.initControls();
    initEvents();
    initShortcuts();
    T.storage.initCrossTabSync();
    initSPAObserver();

    // 6. Conversation observer (MutationObserver on main area)
    T.detection.initConversationObserver();

    // 7. Auto-fill customer + focus
    T.detection.tryAutoFillCustomer();
    if (T.els.customerInput) T.els.customerInput.focus();
  }

  init();
})();
