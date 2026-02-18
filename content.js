// ===== TAROT QUICKSALE CONTENT SCRIPT V1.1 =====
(function () {
  ("use strict");

  // Check if already injected
  if (document.getElementById("tarot-quicksale-panel")) return;

  // ===== PAGE DETECTION CONFIG =====
  const PAGE_IDS = {
    918768421315641: "POBO", // Pờ Bơ
    513140915211900: "DUA", // Dừa
    105889999207829: "CA", // Cá
  };

  // Messenger group for sending messages
  const MESSENGER_GROUP_URL = "https://www.messenger.com/t/623973524119607";

  // ===== DATA STRUCTURE (synced with price.json) =====
  const PRICING_DATA = {
    CA: {
      name: "CÁ",
      note: "Trải Đặc Biệt kết hợp Tarot và Lenormand giúp đào sâu vấn đề.",
      services: {
        "Câu Lẻ": { "Y/N": 9, "CS Tarot": 20, "CS Đặc Biệt": 25 },
        "Combo 3 Câu": { "CS Tarot": 50, "CS Đặc Biệt": 70 },
        "Combo Full 6 Câu": { "CS Tarot": 90, "CS Đặc Biệt": 120 },
      },
    },
    DUA: {
      name: "DỪA",
      services: {
        "Trải Tarot": {
          "1 Y/N": 9,
          "3 CB": 40,
          "6 CB": 65,
          "1 CS": 20,
          "3 CS": 55,
          "4 CS": 70,
          "6 CS": 100,
        },
        Lenormand: {
          "1 Y/N": 15,
          "3 CB": 60,
          "6 CB": 95,
          "1 CS": 30,
          "3 CS": 85,
          "4 CS": 110,
          "6 CS": 155,
        },
        "Bài Tây": {
          "1 Y/N": 20,
          "3 CB": 70,
          "6 CB": 115,
          "1 CS": 40,
          "3 CS": 110,
          "4 CS": 145,
          "6 CS": 210,
        },
        "⏱ Gói 30 Phút": { Tarot: 140, Lenormand: 160, "Bài Tây": 200 },
        "⏱ Gói 45 Phút": { Tarot: 200, Lenormand: 230, "Bài Tây": 280 },
        "⏱ Gói 60 Phút": { Tarot: 270, Lenormand: 300, "Bài Tây": 380 },
      },
    },
    POBO: {
      name: "PỜ BƠ",
      services: {
        Tarot: {
          "1 Y/N": 9,
          "1 CS": 20,
          "3 CS": 55,
          "5 CS": 85,
          "7 CS": 115,
        },
        Lenormand: {
          "1 Y/N": 12,
          "1 CS": 25,
          "3 CS": 70,
          "5 CS": 110,
          "7 CS": 145,
        },
        "Bài Tây": {
          "1 Y/N": 18,
          "1 CS": 35,
          "3 CS": 95,
          "5 CS": 155,
          "7 CS": 200,
        },
        "⏱ Gói Thời Gian": {
          "30 Phút": 150,
          "45 Phút": 200,
          "60 Phút": 250,
          "+ Lenormand": 15,
          "+ Bài Tây": 20,
        },
      },
    },
  };

  // Abbreviations for output message
  const SERVICE_ABBR = {
    "Trải Tarot": "TA",
    Tarot: "TA",
    Lenormand: "LENOR",
    "Bài Tây": "TÂY",
    "Câu Lẻ": "",
    "Combo 3 Câu": "3C",
    "Combo Full 6 Câu": "6C",
    "⏱ Gói 30 Phút": "30p",
    "⏱ Gói 45 Phút": "45p",
    "⏱ Gói 60 Phút": "60p",
    "⏱ Gói Thời Gian": "",
  };

  const PACKAGE_ABBR = {
    "Y/N": "Y/N",
    "CS Tarot": "CS",
    "CS Đặc Biệt": "ĐB",
    "1 Y/N": "1 Y/N",
    "1 CS": "1 CS",
    "3 CB": "3 CB",
    "6 CB": "6 CB",
    "3 CS": "3 CS",
    "4 CS": "4 CS",
    "5 CS": "5 CS",
    "6 CS": "6 CS",
    "7 CS": "7 CS",
    Tarot: "TA",
    Lenormand: "LENOR",
    "Bài Tây": "TÂY",
    "30 Phút": "30p",
    "45 Phút": "45p",
    "60 Phút": "60p",
    "+ Lenormand": "+LENOR",
    "+ Bài Tây": "+TÂY",
  };

  // ===== STATE =====
  let currentPrice = 0;
  let shiftOrders = [];
  let shiftStartTime = null;
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };
  let detectedPage = null;

  // Reader state
  let readerList = []; // e.g. ['Hậu', 'Mai']
  let activeReaderIdx = 0; // current reader index
  let dualReaderMode = false; // 2-reader shuffle mode

  // Schedule auto-tag state
  let scheduleSlots = []; // [{startH, startM, endH, endM, readers: ['A','B']}, ...]
  let scheduleRaw = ""; // raw pasted text
  let scheduleMode = false; // toggle: true=auto, false=manual
  let slotReaderIdx = {}; // {slotKey: nextReaderIdx} for multi-reader rotation
  let scheduleTimerId = null; // setInterval for auto-check
  const TRANSITION_MINUTES = 5; // minutes before shift end to switch

  // ===== DETECT PAGE FROM URL =====
  function detectPageFromURL() {
    const url = window.location.href;
    const params = new URLSearchParams(window.location.search);

    // Check page_id or asset_id
    const pageId = params.get("page_id") || params.get("asset_id");

    if (pageId && PAGE_IDS[pageId]) {
      return PAGE_IDS[pageId];
    }

    // Fallback: check URL for any matching ID
    for (const [id, page] of Object.entries(PAGE_IDS)) {
      if (url.includes(id)) {
        return page;
      }
    }

    return null;
  }

  // ===== CREATE HTML =====
  function createPanelHTML() {
    const detected = detectPageFromURL();
    detectedPage = detected;

    return `
      <div class="tqs-header" id="tqs-drag-handle">
        <div class="tqs-logo">
          <span class="tqs-logo-icon">🔮</span> Tarot QuickSale
        </div>
        <div class="tqs-header-actions">
          ${detected ? `<span class="tqs-page-badge">${PRICING_DATA[detected].name}</span>` : ""}
          <button class="tqs-header-btn tqs-minimize" id="tqs-minimize">─</button>
          <button class="tqs-header-btn tqs-close" id="tqs-close">✕</button>
        </div>
      </div>

      <div class="tqs-body">
        <!-- LEFT: Stats & History -->
        <div class="tqs-panel-left">
          <div class="tqs-stats-grid">
            <div class="tqs-stat-item">
              <div class="tqs-stat-val highlight" id="tqs-total-orders">0</div>
              <div class="tqs-stat-lbl">Đơn</div>
            </div>
            <div class="tqs-stat-item">
              <div class="tqs-stat-val" id="tqs-total-revenue">0k</div>
              <div class="tqs-stat-lbl">Tiền</div>
            </div>
          </div>
          
          <div class="tqs-history" id="tqs-order-list">
            <!-- Order items will be injected here -->
            <div style="padding:16px;text-align:center;color:#64748b;font-size:11px">Chưa có đơn</div>
          </div>

          <div class="tqs-left-actions">
            <button class="tqs-action-btn" id="tqs-report">📋 Báo Cáo</button>
            <button class="tqs-action-btn" id="tqs-reset">🔄 Reset Ca</button>
          </div>
        </div>

        <!-- RIGHT: Form Controls -->
        <div class="tqs-panel-right">
          
          <!-- READER SECTION -->
          <div class="tqs-section-label">
            <span>Reader</span>
            <span class="tqs-custom-toggle" id="tqs-dual-mode-wrap">
              <input type="checkbox" id="tqs-dual-mode">
              <span class="tqs-check"></span> 2R Mode
            </span>
          </div>

          <div class="tqs-reader-card" id="tqs-reader-card">
            <div class="tqs-reader-info">
              <div class="tqs-reader-avatar">👤</div>
              <div>
                <div class="tqs-reader-name" id="tqs-active-reader-name">Chưa chọn</div>
                <div style="display:flex;align-items:center;gap:6px">
                   <div style="font-size:10px;color:#64748b" id="tqs-reader-status">Nhập tên hoặc paste lịch</div>
                   <label class="tqs-custom-toggle" style="transform:scale(0.8);margin:0" title="Bật/Tắt Lịch">
                      <input type="checkbox" id="tqs-schedule-mode-toggle">
                      <span class="tqs-check"></span> Auto
                   </label>
                </div>
              </div>
            </div>
            <div class="tqs-reader-actions">
              <button class="tqs-icon-action" id="tqs-schedule-btn" title="Paste Lịch">📅</button>
              <button class="tqs-icon-action" id="tqs-manual-config-btn" title="Sửa tên">✏️</button>
            </div>
          </div>

          <!-- HIDDEN CONFIGS -->
          <div id="tqs-manual-inputs" class="tqs-input-group tqs-hidden" style="margin-top:8px">
            <input type="text" class="tqs-input" id="tqs-reader-1" placeholder="Tên Reader 1">
            <input type="text" class="tqs-input tqs-hidden" id="tqs-reader-2" placeholder="Tên Reader 2 (nếu 2R)">
            <button class="tqs-btn tqs-btn-secondary" id="tqs-reader-save" style="padding:6px">Lưu tên Reader</button>
          </div>

          <!-- FORM INPUTS -->
          <div class="tqs-section-label" style="margin-top:4px">Đơn Hàng</div>
          
          <div class="tqs-input-group">
            <input type="text" class="tqs-input" id="tqs-customer" placeholder="Tên Khách Hàng">
          </div>

          <div class="tqs-row">
            <div class="tqs-col">
              <select class="tqs-select" id="tqs-service">
                <option value="">-- Dịch vụ --</option>
              </select>
            </div>
            <div class="tqs-col">
              <select class="tqs-select" id="tqs-package">
                <option value="">-- Gói --</option>
              </select>
            </div>
          </div>

          <div class="tqs-section-label" style="margin-top:4px">Tùy Chọn</div>
          
          <label class="tqs-custom-toggle">
            <input type="checkbox" id="tqs-custom-mode">
            <span class="tqs-check"></span> Gói tùy chỉnh (Custom)
          </label>

          <div id="tqs-custom-inputs" class="tqs-hidden tqs-row" style="margin-top:8px">
             <input type="text" class="tqs-input" id="tqs-custom-name" placeholder="Tên gói custom" style="flex:2">
             <input type="number" class="tqs-input" id="tqs-custom-price" placeholder="Giá" style="flex:1">
          </div>

          <input type="text" class="tqs-input" id="tqs-note" placeholder="Ghi chú thêm..." style="margin-top:8px">

          <!-- ACTIONS -->
          <div class="tqs-price-tag" id="tqs-price">0k</div>

          <div class="tqs-main-actions">
            <button class="tqs-btn tqs-btn-primary" id="tqs-copy-save">📋 Copy & Lưu</button>
            <button class="tqs-btn tqs-btn-secondary" id="tqs-send-msg">📤 Gửi Msg</button>
          </div>

          <!-- Platform Selector (subtle) -->
          <div class="tqs-platform-row" style="margin-top:4px; opacity:0.6; transform:scale(0.9); transform-origin:left center">
             <label class="tqs-platform-btn"><input type="radio" name="platform" value="facebook" checked> FB</label>
             <label class="tqs-platform-btn"><input type="radio" name="platform" value="messenger"> Msg</label>
          </div>

        </div>
      </div>

      <!-- EDIT MODAL -->
      <div class="tqs-edit-overlay tqs-hidden" id="tqs-edit-modal">
        <div class="tqs-edit-card">
          <div class="tqs-edit-title">✏️ Sửa đơn</div>
          <input type="text" class="tqs-input" id="tqs-edit-customer" placeholder="Khách">
          <div class="tqs-row">
             <input type="text" class="tqs-input" id="tqs-edit-reader" placeholder="Reader">
             <input type="number" class="tqs-input" id="tqs-edit-price" placeholder="Giá">
          </div>
          <input type="text" class="tqs-input" id="tqs-edit-package" placeholder="Gói">
          <input type="text" class="tqs-input" id="tqs-edit-note" placeholder="Note">
          <div class="tqs-edit-btns">
            <button class="tqs-ebtn tqs-ebtn-cancel" id="tqs-edit-cancel">Hủy</button>
            <button class="tqs-ebtn tqs-ebtn-save" id="tqs-edit-save">Lưu</button>
          </div>
        </div>
      </div>

      <!-- SCHEDULE MODAL -->
      <div class="tqs-modal tqs-hidden" id="tqs-schedule-modal">
        <div class="tqs-modal-content">
          <div class="tqs-edit-title">📅 Cập nhật lịch làm việc</div>
          <textarea class="tqs-textarea" id="tqs-schedule-input" placeholder="Paste lịch ca vào đây..."></textarea>
          <div class="tqs-edit-btns">
            <button class="tqs-ebtn tqs-ebtn-cancel" id="tqs-schedule-close">Đóng</button>
            <button class="tqs-ebtn tqs-ebtn-save" id="tqs-schedule-parse">Cập nhật</button>
          </div>
        </div>
      </div>
    `;
  }
  // ===== CREATE TOAST =====
  function createToast() {
    const toast = document.createElement("div");
    toast.className = "tqs-toast";
    toast.id = "tqs-toast";
    document.body.appendChild(toast);
    return toast;
  }

  // ===== CREATE TOGGLE BUTTON =====
  function createToggleButton() {
    const btn = document.createElement("button");
    btn.id = "tarot-quicksale-toggle";
    btn.innerHTML = "🔮";
    btn.title = "Mở Tarot QuickSale";
    document.body.appendChild(btn);
    return btn;
  }

  // ===== INJECT PANEL =====
  function injectPanel() {
    const panel = document.createElement("div");
    panel.id = "tarot-quicksale-panel";
    panel.innerHTML = createPanelHTML();
    document.body.appendChild(panel);

    createToast();
    const toggleBtn = createToggleButton();
    toggleBtn.classList.add("tqs-hidden");

    return panel;
  }

  // ===== ELEMENTS =====
  const panel = injectPanel();
  const els = {
    panel: panel,
    header: panel.querySelector("#tqs-drag-handle"),
    closeBtn: panel.querySelector("#tqs-close"),
    minimizeBtn: panel.querySelector("#tqs-minimize"),

    // Left Panel
    totalOrders: panel.querySelector("#tqs-total-orders"),
    totalRevenue: panel.querySelector("#tqs-total-revenue"),
    orderList: panel.querySelector("#tqs-order-list"),
    reportBtn: panel.querySelector("#tqs-report"),
    resetBtn: panel.querySelector("#tqs-reset"),

    // Reader Section
    readerCard: panel.querySelector("#tqs-reader-card"),
    activeReaderName: panel.querySelector("#tqs-active-reader-name"),
    readerStatus: panel.querySelector("#tqs-reader-status"),
    scheduleBtn: panel.querySelector("#tqs-schedule-btn"),
    manualConfigBtn: panel.querySelector("#tqs-manual-config-btn"),

    dualModeToggle: panel.querySelector("#tqs-dual-mode"),
    manualInputs: panel.querySelector("#tqs-manual-inputs"),
    reader1Input: panel.querySelector("#tqs-reader-1"),
    reader2Input: panel.querySelector("#tqs-reader-2"),
    readerSaveBtn: panel.querySelector("#tqs-reader-save"),

    // Form
    customerInput: panel.querySelector("#tqs-customer"),
    serviceSelect: panel.querySelector("#tqs-service"),
    packageSelect: panel.querySelector("#tqs-package"),
    noteInput: panel.querySelector("#tqs-note"),

    customMode: panel.querySelector("#tqs-custom-mode"),
    customInputs: panel.querySelector("#tqs-custom-inputs"),
    customName: panel.querySelector("#tqs-custom-name"),
    customPrice: panel.querySelector("#tqs-custom-price"),

    priceDisplay: panel.querySelector("#tqs-price"),
    copySaveBtn: panel.querySelector("#tqs-copy-save"),
    sendMsgBtn: panel.querySelector("#tqs-send-msg"),

    // Modals
    editModal: panel.querySelector("#tqs-edit-modal"),
    editCustomer: panel.querySelector("#tqs-edit-customer"),
    editReader: panel.querySelector("#tqs-edit-reader"),
    editPackage: panel.querySelector("#tqs-edit-package"),
    editPrice: panel.querySelector("#tqs-edit-price"),
    editNote: panel.querySelector("#tqs-edit-note"),
    editCancel: panel.querySelector("#tqs-edit-cancel"),
    editSave: panel.querySelector("#tqs-edit-save"),

    scheduleModal: panel.querySelector("#tqs-schedule-modal"),
    scheduleInput: panel.querySelector("#tqs-schedule-input"),
    scheduleClose: panel.querySelector("#tqs-schedule-close"),
    scheduleParse: panel.querySelector("#tqs-schedule-parse"),

    scheduleModeToggle: panel.querySelector("#tqs-schedule-mode-toggle"),

    toast: document.querySelector("#tqs-toast"),
    toggleBtn: document.querySelector("#tarot-quicksale-toggle"),
  };

  let editingOrderId = null;

  // ===== READER LOGIC =====
  function getActiveReader() {
    // 1. Try Schedule First (Only if enabled)
    if (scheduleMode && scheduleSlots.length > 0) {
      const slotData = getScheduleReader();
      if (slotData) return slotData;
    }

    // 2. Fallback to Manual
    if (readerList.length > 0) {
      return readerList[activeReaderIdx] || readerList[0];
    }
    return "Chưa set tên";
  }

  function updateReaderDisplay() {
    const reader = getActiveReader();
    const isSchedule =
      scheduleMode && scheduleSlots.length > 0 && getCurrentSlot();

    if (els.activeReaderName) {
      els.activeReaderName.textContent = reader.startsWith("@")
        ? reader
        : "@" + reader;
      els.activeReaderName.style.color = isSchedule
        ? "var(--amber)"
        : "var(--accent)";
    }

    if (els.readerStatus) {
      if (isSchedule) {
        const result = getCurrentSlot();
        if (result) {
          els.readerStatus.textContent = `📅 Theo lịch (${result.slot.startH}h-${result.slot.endH}h)`;
        }
      } else {
        els.readerStatus.textContent = "✏️ Chế độ thủ công";
      }
    }
  }

  function setupReaders() {
    const r1 = els.reader1Input ? els.reader1Input.value.trim() : "";
    const r2 = els.reader2Input ? els.reader2Input.value.trim() : "";

    readerList = [];
    if (r1) readerList.push(r1);
    if (dualReaderMode && r2) readerList.push(r2);

    activeReaderIdx = 0;

    chrome.storage.local.set({
      savedReaders: readerList,
      dualReaderMode: dualReaderMode,
    });

    if (els.manualInputs) els.manualInputs.classList.add("tqs-hidden");
    updateReaderDisplay();
    showToast(`✓ Đã lưu ${readerList.length} Reader`);
  }

  function rotateReader() {
    if (scheduleSlots.length > 0) {
      rotateScheduleReader();
    } else if (dualReaderMode && readerList.length > 1) {
      activeReaderIdx = (activeReaderIdx + 1) % readerList.length;
    }
    updateReaderDisplay();
  }

  // ===== SCHEDULE AUTO-TAG SYSTEM =====
  function parseSchedule(text) {
    const lines = text.split("\n").filter((l) => l.trim());
    const slots = [];

    for (const line of lines) {
      // Match time pattern: Xh - Yh or X:MM - Y:MM or X -> Y
      // Separator can be -, –, or > or ->
      const timeMatch = line.match(
        /(\d{1,2})(?:h|:(\d{2}))?\s*(?:[-–]|->?)\s*(\d{1,2})(?:h|:(\d{2}))?/i,
      );
      if (!timeMatch) continue;

      const startH = parseInt(timeMatch[1]);
      const startM = parseInt(timeMatch[2]) || 0;
      const endH = parseInt(timeMatch[3]);
      const endM = parseInt(timeMatch[4]) || 0;

      // Extract reader names from the ENTIRE line (location agnostic)
      // Regex: match @Name
      // We look for @ followed by at least 2 chars of name, ending at separator or end of line.
      const readerMatches =
        line.match(/@([a-zA-ZÀ-ỹ0-9\s']{2,})(?=$|[-–,;(\n✨@:])/g) ||
        line.match(/@[^\s@][^@]*/g); // fallback

      if (!readerMatches || readerMatches.length === 0) continue;

      const readers = readerMatches
        .map((r) => r.replace(/^@/, "").trim())
        .filter((r) => r.length > 0);

      if (readers.length === 0) continue;

      slots.push({ startH, startM, endH, endM, readers });
    }

    // Sort by start time (handle overnight: treat 0-7h as 24-31h for sorting)
    slots.sort((a, b) => {
      const aStart = a.startH < 8 ? a.startH + 24 : a.startH;
      const bStart = b.startH < 8 ? b.startH + 24 : b.startH;
      return aStart * 60 + a.startM - (bStart * 60 + b.startM);
    });

    return slots;
  }

  /**
   * Convert slot time to today's Date (handle overnight)
   */
  function slotToDate(hour, minute, isEnd, startH) {
    const now = new Date();
    const d = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hour,
      minute,
      0,
    );
    // If end time < start time, it's next day (e.g., 23h - 2h)
    if (isEnd && hour < startH) {
      d.setDate(d.getDate() + 1);
    }
    // If current time is past midnight and we're looking at an evening slot
    if (now.getHours() < 8 && hour >= 20) {
      d.setDate(d.getDate() - 1); // slot was yesterday
    }
    return d;
  }

  /**
   * Get the CURRENT active slot based on time, with 5-min pre-transition
   * Returns: { slot, slotIdx, isTransition, nextSlot } or null
   */
  function getCurrentSlot() {
    if (scheduleSlots.length === 0) return null;

    const now = new Date();

    for (let i = 0; i < scheduleSlots.length; i++) {
      const slot = scheduleSlots[i];
      const slotStart = slotToDate(
        slot.startH,
        slot.startM,
        false,
        slot.startH,
      );
      const slotEnd = slotToDate(slot.endH, slot.endM, true, slot.startH);
      const transitionPoint = new Date(
        slotEnd.getTime() - TRANSITION_MINUTES * 60 * 1000,
      );

      if (now >= slotStart && now < slotEnd) {
        // We're in this slot
        if (now >= transitionPoint) {
          // In transition zone - use NEXT slot's readers
          const nextSlot = scheduleSlots[i + 1] || null;
          if (nextSlot) {
            return {
              slot: nextSlot,
              slotIdx: i + 1,
              isTransition: true,
              currentSlot: slot,
              nextSlot,
            };
          }
        }
        return {
          slot,
          slotIdx: i,
          isTransition: false,
          currentSlot: slot,
          nextSlot: scheduleSlots[i + 1] || null,
        };
      }
    }

    // No slot matches - might be before first or after last
    return null;
  }

  /**
   * Get the current reader based on schedule
   */
  function getScheduleReader() {
    const result = getCurrentSlot();
    if (!result) return getManualReader();

    const { slot, slotIdx } = result;
    const key = `slot_${slotIdx}`;

    if (slot.readers.length === 1) {
      return slot.readers[0];
    }

    // Multi-reader: use rotation
    const idx = slotReaderIdx[key] || 0;
    return slot.readers[idx % slot.readers.length];
  }

  function getManualReader() {
    if (readerList.length === 0) return "";
    return readerList[activeReaderIdx] || readerList[0];
  }

  function startScheduleTimer() {
    if (scheduleTimerId) clearInterval(scheduleTimerId);
    scheduleTimerId = setInterval(() => {
      updateReaderDisplay();
    }, 60000);
    updateReaderDisplay();
  }

  // ===== UTILITY FUNCTIONS =====
  function showToast(message, type = "success") {
    if (!els.toast) return;
    els.toast.textContent = message;
    els.toast.className =
      "tqs-toast tqs-show" + (type !== "success" ? " tqs-" + type : "");
    setTimeout(() => {
      els.toast.className = "tqs-toast";
    }, 2500);
  }

  // ===== DROPDOWN LOGIC =====
  function populateServices() {
    const page = detectedPage;
    if (!page || !PRICING_DATA[page]) return;
    const services = PRICING_DATA[page].services;

    els.serviceSelect.innerHTML = '<option value="">-- Chọn --</option>';
    Object.keys(services).forEach((s) => {
      els.serviceSelect.innerHTML += `<option value="${s}">${s}</option>`;
    });

    els.packageSelect.innerHTML = '<option value="">-- Chọn --</option>';
    currentPrice = 0;
    els.priceDisplay.textContent = "0k";
  }

  function populatePackages() {
    const page = detectedPage;
    if (!page || !PRICING_DATA[page]) return;
    const service = els.serviceSelect.value;

    els.packageSelect.innerHTML = '<option value="">-- Chọn --</option>';

    if (!service) {
      currentPrice = 0;
      els.priceDisplay.textContent = "0k";
      return;
    }

    const packages = PRICING_DATA[page].services[service];
    if (!packages) return;
    Object.entries(packages).forEach(([pkg, price]) => {
      els.packageSelect.innerHTML += `<option value="${pkg}" data-price="${price}">${pkg} - ${price}k</option>`;
    });

    currentPrice = 0;
    els.priceDisplay.textContent = "0k";
  }

  function updatePrice() {
    if (els.customMode && els.customMode.checked) {
      currentPrice = parseInt(els.customPrice?.value) || 0;
    } else {
      const opt = els.packageSelect?.options[els.packageSelect.selectedIndex];
      currentPrice = opt && opt.dataset.price ? parseInt(opt.dataset.price) : 0;
    }
    if (els.priceDisplay) els.priceDisplay.textContent = currentPrice + "k";
  }

  function rotateScheduleReader() {
    const result = getCurrentSlot();
    if (!result || result.slot.readers.length <= 1) return;

    const key = `slot_${result.slotIdx}`;
    const current = slotReaderIdx[key] || 0;
    slotReaderIdx[key] = (current + 1) % result.slot.readers.length;
    updateReaderDisplay();
  }

  // ===== TOGGLE CUSTOM MODE =====
  function toggleCustomMode() {
    if (!els.customMode) return;
    const isCustom = els.customMode.checked;
    if (els.customInputs)
      els.customInputs.classList.toggle("tqs-hidden", !isCustom);
    if (els.serviceSelect) els.serviceSelect.disabled = isCustom;
    if (els.packageSelect) els.packageSelect.disabled = isCustom;
    updatePrice();
  }

  // ===== DASHBOARD =====
  function updateDashboard() {
    const total = shiftOrders.length;
    const revenue = shiftOrders.reduce((s, o) => s + o.price, 0);

    if (els.totalOrders) els.totalOrders.textContent = total;
    if (els.totalRevenue) els.totalRevenue.textContent = revenue + "k";

    renderOrderList();
  }

  // ===== ORDER LIST =====
  function renderOrderList() {
    if (!shiftOrders.length) {
      els.orderList.innerHTML =
        '<div class="tqs-order-empty">Chưa có đơn nào</div>';
      return;
    }

    const fmtTime = (d) =>
      new Date(d).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });

    let html = "";
    shiftOrders.forEach((o, i) => {
      html += `<div class="tqs-order-item" data-id="${o.id}">
        <div class="tqs-order-num">${i + 1}</div>
        <div class="tqs-order-info">
          <div class="tqs-order-main">
            <span class="tqs-order-page">[${o.pageName}]</span>
            <span class="tqs-order-pkg">${o.packageDisplay}</span>
            <span class="tqs-order-price">${o.price}k</span>
          </div>
          <div class="tqs-order-detail">
            ${o.customer} • @${o.reader} • ${fmtTime(o.timestamp)}
          </div>
        </div>
        <div class="tqs-order-actions">
          <button class="tqs-order-btn tqs-edit-btn" data-id="${o.id}" title="Sửa">✏️</button>
          <button class="tqs-order-btn tqs-delete-btn" data-id="${o.id}" title="Xóa">✕</button>
        </div>
      </div>`;
    });
    els.orderList.innerHTML = html;
  }

  // ===== EDIT ORDER =====
  function openEditOrder(id) {
    const order = shiftOrders.find((o) => o.id === id);
    if (!order) return;

    editingOrderId = id;
    els.editCustomer.value = order.customer;
    els.editReader.value = order.reader;
    els.editPackage.value = order.packageDisplay;
    els.editPrice.value = order.price;
    els.editNote.value = order.note || "";
    els.editModal.classList.remove("tqs-hidden");
  }

  async function saveEditOrder() {
    if (editingOrderId === null) return;

    // Read latest from storage to avoid overwriting other tabs
    const data = await chrome.storage.local.get(["shiftOrders"]);
    const latest = data.shiftOrders || [];
    const idx = latest.findIndex((o) => o.id === editingOrderId);
    if (idx === -1) {
      showToast("Đơn không tồn tại!", "error");
      els.editModal.classList.add("tqs-hidden");
      editingOrderId = null;
      return;
    }

    latest[idx].customer = els.editCustomer.value.trim();
    latest[idx].reader = els.editReader.value.trim();
    latest[idx].packageDisplay = els.editPackage.value.trim();
    latest[idx].price = parseInt(els.editPrice.value) || 0;
    latest[idx].note = els.editNote.value.trim();

    shiftOrders = latest;
    await chrome.storage.local.set({ shiftOrders });
    els.editModal.classList.add("tqs-hidden");
    editingOrderId = null;
    updateDashboard();
    showToast("✓ Đã sửa!");
  }

  async function deleteOrder(id) {
    // Read latest from storage
    const data = await chrome.storage.local.get(["shiftOrders"]);
    const latest = data.shiftOrders || [];
    const idx = latest.findIndex((o) => o.id === id);
    if (idx === -1) return;
    const o = latest[idx];
    if (!confirm(`Xóa đơn: ${o.customer} - ${o.price}k?`)) return;

    latest.splice(idx, 1);
    shiftOrders = latest;
    await chrome.storage.local.set({ shiftOrders });
    updateDashboard();
    showToast("✓ Đã xóa!");
  }

  // ===== GENERATE MESSAGE =====
  function generateMessage() {
    const page = detectedPage;
    const pageName = PRICING_DATA[page]?.name || page;
    const customer = (els.customerInput?.value || "").trim();
    const reader = getActiveReader();
    const note = (els.noteInput?.value || "").trim();

    let packageDisplay = "";

    if (els.customMode.checked) {
      packageDisplay = els.customName.value.trim();
    } else {
      const service = els.serviceSelect.value;
      const pkg = els.packageSelect.value;
      const serviceAbbr = SERVICE_ABBR[service] || service;
      const pkgAbbr = PACKAGE_ABBR[pkg] || pkg;

      if (page === "CA") {
        // CÁ: "Câu Lẻ" → "Y/N" / "CS" / "ĐB"
        //      "Combo 3 Câu" → "3C CS" / "3C ĐB"
        //      "Combo Full 6 Câu" → "6C CS" / "6C ĐB"
        if (service === "Câu Lẻ") {
          packageDisplay = pkgAbbr;
        } else {
          packageDisplay = `${serviceAbbr} ${pkgAbbr}`;
        }
      } else if (service.startsWith("⏱")) {
        // Time-based packages: "30p TA" / "45p LENOR" / "+LENOR"
        if (serviceAbbr) {
          packageDisplay = `${serviceAbbr} ${pkgAbbr}`;
        } else {
          packageDisplay = `${pkgAbbr}`;
        }
      } else {
        // DỪA / PỜ BƠ standard: "1 CS TA" / "3 CB LENOR" / "7 CS TÂY"
        packageDisplay = `${pkgAbbr} ${serviceAbbr}`;
      }
    }

    // Format: [PAGE] PACKAGE - PRICEk CUSTOMER @READER
    let msg = `[${pageName}] ${packageDisplay} - ${currentPrice}k ${customer} @${reader.replace("@", "")}`;

    if (note) {
      msg += ` ${note}`;
    }

    return msg;
  }

  // ===== VALIDATE FORM =====
  function validateForm() {
    if (!els.customerInput || !els.customerInput.value.trim()) {
      showToast("Nhập tên khách!", "error");
      if (els.customerInput) els.customerInput.focus();
      return false;
    }
    if (
      readerList.length === 0 &&
      !(scheduleMode && scheduleSlots.length > 0)
    ) {
      showToast("Thiết lập Reader trước!", "error");
      return false;
    }

    if (els.customMode.checked) {
      if (!els.customName.value.trim()) {
        showToast("Nhập tên gói!", "error");
        els.customName.focus();
        return false;
      }
      if (!els.customPrice.value || parseInt(els.customPrice.value) <= 0) {
        showToast("Nhập giá!", "error");
        els.customPrice.focus();
        return false;
      }
    } else {
      if (!els.serviceSelect.value) {
        showToast("Chọn nhóm dịch vụ!", "error");
        return false;
      }
      if (!els.packageSelect.value) {
        showToast("Chọn gói!", "error");
        return false;
      }
    }

    return true;
  }

  // ===== COPY AND SAVE =====
  async function copyAndSave() {
    if (!validateForm()) return;

    const message = generateMessage();

    try {
      await navigator.clipboard.writeText(message);
      saveOrder();
      showToast("✓ Đã copy!");
      resetForm();
    } catch (err) {
      console.error(err);
      showToast("Lỗi!", "error");
    }
  }

  // ===== SEND TO MESSENGER (INSTANT) =====
  async function sendToMessenger() {
    if (!validateForm()) return;

    const message = generateMessage();

    // Get selected platform
    const platformRadio = panel.querySelector('input[name="platform"]:checked');
    const platform = platformRadio ? platformRadio.value : "facebook";

    try {
      // Copy to clipboard as backup
      await navigator.clipboard.writeText(message);

      // Show sending status
      showToast("⏳ Đang gửi...", "warning");
      els.sendMsgBtn.disabled = true;
      els.sendMsgBtn.textContent = "⏳ Đang gửi...";

      // Send instant message via background
      chrome.runtime.sendMessage(
        {
          action: "instantSend",
          message: message,
          platform: platform,
        },
        (response) => {
          els.sendMsgBtn.disabled = false;
          els.sendMsgBtn.textContent = "📤 GỬI NGAY";

          if (response && response.success) {
            saveOrder();
            showToast("✓ Đã gửi tin nhắn!");
            resetForm();
          } else {
            // Fallback - message is in clipboard
            saveOrder();
            const errMsg = response?.error || "Paste Ctrl+V và Enter";
            showToast("📋 " + errMsg, "warning");
            resetForm();
          }
        },
      );
    } catch (err) {
      console.error(err);
      els.sendMsgBtn.disabled = false;
      els.sendMsgBtn.textContent = "📤 GỬI MESSENGER";
      showToast("Lỗi! Đã copy tin nhắn.", "error");
    }
  }

  // ===== SAVE ORDER (atomic read-write for multi-tab safety) =====
  async function saveOrder() {
    if (!shiftStartTime) {
      shiftStartTime = new Date().toISOString();
    }

    const order = {
      id: Date.now(),
      page: detectedPage,
      pageName: PRICING_DATA[detectedPage]?.name || detectedPage,
      customer: els.customerInput.value.trim(),
      reader: getActiveReader(),
      service: els.customMode.checked ? "Custom" : els.serviceSelect.value,
      package: els.customMode.checked
        ? els.customName.value.trim()
        : els.packageSelect.value,
      packageDisplay: els.customMode.checked
        ? els.customName.value.trim()
        : `${els.serviceSelect.value} ${els.packageSelect.value}`,
      price: currentPrice,
      note: els.noteInput.value.trim(),
      timestamp: new Date().toISOString(),
    };

    // Read latest from storage to merge with other tabs
    const data = await chrome.storage.local.get([
      "shiftOrders",
      "shiftStartTime",
    ]);
    const latest = data.shiftOrders || [];
    latest.push(order);
    shiftOrders = latest;
    if (!shiftStartTime && data.shiftStartTime)
      shiftStartTime = data.shiftStartTime;

    await chrome.storage.local.set({
      shiftOrders: shiftOrders,
      shiftStartTime: shiftStartTime,
    });

    updateDashboard();
    rotateReader();
  }

  // ===== RESET FORM =====
  function resetForm() {
    if (els.customerInput) els.customerInput.value = "";
    if (els.customMode && !els.customMode.checked) {
      if (els.serviceSelect) els.serviceSelect.value = "";
      if (els.packageSelect)
        els.packageSelect.innerHTML = '<option value="">-- Chọn --</option>';
    } else {
      if (els.customName) els.customName.value = "";
      if (els.customPrice) els.customPrice.value = "";
    }
    if (els.noteInput) els.noteInput.value = "";
    currentPrice = 0;
    if (els.priceDisplay) els.priceDisplay.textContent = "0k";
    if (els.customerInput) els.customerInput.focus();
  }

  // ===== BUILD REPORT =====
  function buildReport() {
    const revenue = shiftOrders.reduce((s, o) => s + o.price, 0);
    const salary = Math.floor(revenue * 0.05);
    const now = new Date();
    const startTime = shiftStartTime ? new Date(shiftStartTime) : now;
    const fmtDate = (d) =>
      d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    const fmtTime = (d) =>
      d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

    // Group by page
    const byPage = {};
    shiftOrders.forEach((o) => {
      if (!byPage[o.pageName]) byPage[o.pageName] = [];
      byPage[o.pageName].push(o);
    });

    let report = "";
    report += `═══════════════════════════════════════\n`;
    report += `  📊 BÁO CÁO CA TAROT\n`;
    report += `  📅 ${fmtDate(startTime)}  ⏰ ${fmtTime(startTime)} → ${fmtTime(now)}\n`;
    report += `═══════════════════════════════════════\n\n`;

    // Per-page detail
    let orderNum = 0;
    for (const [pageName, orders] of Object.entries(byPage)) {
      const pageRevenue = orders.reduce((s, o) => s + o.price, 0);
      report += `┌─── ${pageName} (${orders.length} đơn • ${pageRevenue}k) ───\n`;
      report += `│\n`;
      orders.forEach((o) => {
        orderNum++;
        const time = new Date(o.timestamp);
        report += `│  ${orderNum}. ${o.packageDisplay} - ${o.price}k\n`;
        report += `│     ${o.customer}  @${o.reader}\n`;
        report += `│     ${fmtTime(time)}\n`;
        if (o.note) report += `│     📝 ${o.note}\n`;
      });
      report += `│\n`;
      report += `└─── Tổng ${pageName}: ${pageRevenue}k\n\n`;
    }

    // Total
    report += `═══════════════════════════════════════\n`;
    report += `  📈 TỔNG KẾT\n`;
    report += `  Đơn:    ${shiftOrders.length}\n`;
    report += `  Tiền:   ${revenue}k\n`;
    report += `  Lương:  ${salary}k (5%)\n`;
    report += `═══════════════════════════════════════\n`;

    return report;
  }

  // ===== COPY REPORT =====
  async function copyReport() {
    if (shiftOrders.length === 0) {
      showToast("Chưa có đơn!", "warning");
      return;
    }
    try {
      await navigator.clipboard.writeText(buildReport());
      showToast("✓ Đã copy báo cáo!");
    } catch (err) {
      showToast("Lỗi!", "error");
    }
  }

  // ===== DOWNLOAD REPORT AS TXT =====
  function downloadReport() {
    if (shiftOrders.length === 0) {
      showToast("Chưa có đơn!", "warning");
      return;
    }

    const report = buildReport();
    const now = new Date();
    const dateStr = now
      .toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, "-");
    const timeStr = now
      .toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
      .replace(":", "h");
    const filename = `BaoCao_${dateStr}_${timeStr}.txt`;

    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`✓ Đã lưu ${filename}`);
  }

  // ===== RESET SHIFT (archive + clear) =====
  async function resetShift() {
    if (shiftOrders.length === 0) {
      showToast("Chưa có đơn!", "warning");
      return;
    }

    const total = shiftOrders.reduce((s, o) => s + o.price, 0);
    if (
      !confirm(
        `Reset ca?\n${shiftOrders.length} đơn - ${total}k\n\nBáo cáo sẽ được lưu vào lịch sử.`,
      )
    )
      return;

    // Archive this shift
    const archive = {
      id: Date.now(),
      startTime: shiftStartTime || new Date().toISOString(),
      endTime: new Date().toISOString(),
      orders: [...shiftOrders],
      totalOrders: shiftOrders.length,
      totalRevenue: total,
    };

    const data = await chrome.storage.local.get(["shiftHistory"]);
    const history = data.shiftHistory || [];
    history.unshift(archive); // newest first
    // Keep max 30 shifts
    if (history.length > 30) history.length = 30;

    shiftOrders = [];
    shiftStartTime = null;
    await chrome.storage.local.set({
      shiftOrders: [],
      shiftStartTime: null,
      shiftHistory: history,
    });
    updateDashboard();
    showToast("✓ Đã lưu và reset!");
  }

  // ===== VIEW HISTORY =====
  async function viewHistory() {
    const data = await chrome.storage.local.get(["shiftHistory"]);
    const history = data.shiftHistory || [];

    if (history.length === 0) {
      showToast("Chưa có lịch sử!", "warning");
      return;
    }

    const fmtDate = (d) =>
      new Date(d).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      });
    const fmtTime = (d) =>
      new Date(d).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });

    let txt = "📂 LỊCH SỬ CA (gần nhất)\n\n";
    history.slice(0, 10).forEach((shift, i) => {
      txt += `${i + 1}. ${fmtDate(shift.startTime)} ${fmtTime(shift.startTime)}-${fmtTime(shift.endTime)}`;
      txt += ` | ${shift.totalOrders} đơn | ${shift.totalRevenue}k\n`;
    });

    try {
      await navigator.clipboard.writeText(txt);
      showToast("✓ Đã copy lịch sử!");
    } catch (err) {
      alert(txt);
    }
  }

  // ===== LOAD DATA =====
  async function loadData() {
    try {
      const data = await chrome.storage.local.get([
        "savedReaders",
        "dualReaderMode",
        "schedule", // Raw text
        "scheduleSlots",
        "scheduleMode",
        "shiftOrders",
        "shiftStartTime",
      ]);

      // Restore Manual Readers
      if (data.savedReaders && Array.isArray(data.savedReaders)) {
        readerList = data.savedReaders;
        if (els.reader1Input) els.reader1Input.value = readerList[0] || "";
        if (els.reader2Input) els.reader2Input.value = readerList[1] || "";
      }

      // Restore Dual Mode
      if (data.dualReaderMode) {
        dualReaderMode = true;
        if (els.dualModeToggle) els.dualModeToggle.checked = true;
        if (els.reader2Input) els.reader2Input.classList.remove("tqs-hidden");
      }

      // Restore Schedule
      if (data.schedule) {
        scheduleRaw = data.schedule;
        if (els.scheduleInput) els.scheduleInput.value = scheduleRaw;
      }
      if (data.scheduleSlots && Array.isArray(data.scheduleSlots)) {
        scheduleSlots = data.scheduleSlots;
        slotReaderIdx = {};
        startScheduleTimer();
      }

      // Restore Schedule Mode
      if (typeof data.scheduleMode !== "undefined") {
        scheduleMode = data.scheduleMode;
      } else {
        // Default to true if schedule exists
        scheduleMode = scheduleSlots.length > 0;
      }
      if (els.scheduleModeToggle) els.scheduleModeToggle.checked = scheduleMode;

      // Restore Shift Data
      if (data.shiftStartTime) shiftStartTime = data.shiftStartTime;
      if (data.shiftOrders && Array.isArray(data.shiftOrders)) {
        shiftOrders = data.shiftOrders;
      }

      updateReaderDisplay();
      updateDashboard();
    } catch (err) {
      console.error("Load Error:", err);
    }
  }

  // ===== CHECK FOR PENDING MESSAGE (auto-paste on Messenger) =====
  async function checkPendingMessage() {
    if (!window.location.href.includes("messenger.com")) return;

    try {
      const data = await chrome.storage.local.get(["pendingMessage"]);
      if (data.pendingMessage) {
        // Wait for Messenger to load
        setTimeout(() => {
          // Try to find the message input
          const input =
            document.querySelector(
              '[contenteditable="true"][role="textbox"]',
            ) ||
            document.querySelector('[data-lexical-editor="true"]') ||
            document.querySelector('[aria-label*="Message"]');

          if (input) {
            input.focus();
            // Paste the message
            document.execCommand("insertText", false, data.pendingMessage);
            showToast("✓ Đã paste tin nhắn!");
          }

          // Clear pending message
          chrome.storage.local.remove(["pendingMessage"]);
        }, 2000);
      }
    } catch (err) {
      console.error(err);
    }
  }

  // ===== DRAG FUNCTIONALITY =====
  function initDrag() {
    els.header.addEventListener("mousedown", (e) => {
      if (e.target.closest(".tqs-header-btn")) return;
      isDragging = true;
      const rect = panel.getBoundingClientRect();
      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;
      panel.style.transition = "none";
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      e.preventDefault();

      let x = e.clientX - dragOffset.x;
      let y = e.clientY - dragOffset.y;

      x = Math.max(0, Math.min(x, window.innerWidth - panel.offsetWidth));
      y = Math.max(0, Math.min(y, window.innerHeight - panel.offsetHeight));

      panel.style.left = x + "px";
      panel.style.top = y + "px";
      panel.style.right = "auto";
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
      panel.style.transition = "";
    });
  }

  // ===== PANEL CONTROLS =====
  function initControls() {
    els.closeBtn.addEventListener("click", () => {
      panel.classList.add("tqs-hidden");
      els.toggleBtn.classList.remove("tqs-hidden");
    });

    els.minimizeBtn.addEventListener("click", () => {
      panel.classList.toggle("tqs-minimized");
      els.minimizeBtn.textContent = panel.classList.contains("tqs-minimized")
        ? "□"
        : "─";
    });

    els.toggleBtn.addEventListener("click", () => {
      panel.classList.remove("tqs-hidden");
      els.toggleBtn.classList.add("tqs-hidden");
    });
  }

  // ===== EVENT LISTENERS =====
  function initEvents() {
    // 1. Core Actions
    if (els.serviceSelect)
      els.serviceSelect.addEventListener("change", populatePackages);
    if (els.packageSelect)
      els.packageSelect.addEventListener("change", updatePrice);

    // 2. Custom Mode
    if (els.customMode)
      els.customMode.addEventListener("change", toggleCustomMode);
    if (els.customPrice) els.customPrice.addEventListener("input", updatePrice);

    // 3. Reader Logic
    if (els.scheduleBtn) {
      els.scheduleBtn.addEventListener("click", () => {
        els.scheduleModal.classList.remove("tqs-hidden");
        els.scheduleInput.focus();
      });
    }

    if (els.manualConfigBtn) {
      els.manualConfigBtn.addEventListener("click", () => {
        els.manualInputs.classList.toggle("tqs-hidden");
      });
    }

    if (els.readerSaveBtn) {
      els.readerSaveBtn.addEventListener("click", setupReaders);
    }

    if (els.dualModeToggle) {
      els.dualModeToggle.addEventListener("change", () => {
        dualReaderMode = els.dualModeToggle.checked;
        if (els.reader2Input)
          els.reader2Input.classList.toggle("tqs-hidden", !dualReaderMode);
        chrome.storage.local.set({ dualReaderMode });

        // If switching OFF and we manually had 2 readers, reset to 1
        if (!dualReaderMode && readerList.length > 1) {
          setupReaders();
        }
      });
    }

    // 4. Schedule Events
    if (els.scheduleModeToggle) {
      els.scheduleModeToggle.addEventListener("change", () => {
        scheduleMode = els.scheduleModeToggle.checked;
        chrome.storage.local.set({ scheduleMode });
        updateReaderDisplay();
      });
    }

    if (els.scheduleClose) {
      els.scheduleClose.addEventListener("click", () => {
        els.scheduleModal.classList.add("tqs-hidden");
      });
    }

    if (els.scheduleParse) {
      els.scheduleParse.addEventListener("click", () => {
        const text = els.scheduleInput.value;
        console.log("[TQS] Parsing schedule text length:", text.length);

        const slots = parseSchedule(text);
        console.log("[TQS] Parsed slots:", slots);

        if (slots.length > 0) {
          scheduleRaw = text;
          scheduleSlots = slots;
          scheduleMode = true;

          if (els.scheduleModeToggle) els.scheduleModeToggle.checked = true;

          chrome.storage.local.set({
            schedule: text,
            scheduleSlots: slots,
            scheduleMode: true,
          });

          showToast(`✓ Đã nhận ${slots.length} ca làm việc`);
          els.scheduleModal.classList.add("tqs-hidden");

          startScheduleTimer();
          updateReaderDisplay();
        } else {
          console.warn("[TQS] Parse failed. Input text:", text);
          showToast("⚠️ Không tìm thấy ca/reader nào!", "error");
        }
      });
    }

    // 5. Main Buttons
    if (els.copySaveBtn) els.copySaveBtn.addEventListener("click", copyAndSave);
    if (els.sendMsgBtn)
      els.sendMsgBtn.addEventListener("click", sendToMessenger);
    if (els.resetBtn) els.resetBtn.addEventListener("click", resetShift);
    if (els.reportBtn) els.reportBtn.addEventListener("click", copyReport);
    if (els.downloadBtn)
      els.downloadBtn.addEventListener("click", downloadReport);
    if (els.historyBtn) els.historyBtn.addEventListener("click", viewHistory);

    // 6. List Interaction (Event Delegation)
    if (els.orderList) {
      els.orderList.addEventListener("click", (e) => {
        const editBtn = e.target.closest(".tqs-edit-btn");
        const deleteBtn = e.target.closest(".tqs-delete-btn");
        if (editBtn) openEditOrder(parseInt(editBtn.dataset.id));
        if (deleteBtn) deleteOrder(parseInt(deleteBtn.dataset.id));
      });
    }

    // 7. Edit Modal
    if (els.editSave) els.editSave.addEventListener("click", saveEditOrder);
    if (els.editCancel) {
      els.editCancel.addEventListener("click", () => {
        els.editModal.classList.add("tqs-hidden");
        editingOrderId = null;
      });
    }

    // 7. Shortcuts
    const handleEnter = (e, callback) => {
      if (e.key === "Enter") callback();
    };

    if (els.customerInput) {
      els.customerInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") els.serviceSelect.focus();
      });
    }
    if (els.noteInput)
      els.noteInput.addEventListener("keypress", (e) =>
        handleEnter(e, copyAndSave),
      );
    if (els.customPrice)
      els.customPrice.addEventListener("keypress", (e) =>
        handleEnter(e, copyAndSave),
      );
  }

  // ===== CROSS-TAB SYNC (critical for multi-page) =====
  if (
    typeof chrome !== "undefined" &&
    chrome.storage &&
    chrome.storage.onChanged
  ) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      if (changes.shiftOrders) {
        shiftOrders = changes.shiftOrders.newValue || [];
        updateDashboard();
      }
      if (changes.scheduleSlots) {
        scheduleSlots = changes.scheduleSlots.newValue || [];
        slotReaderIdx = {};
        updateReaderDisplay();
      }
      if (changes.scheduleMode) {
        scheduleMode = changes.scheduleMode.newValue;
        if (els.scheduleModeToggle)
          els.scheduleModeToggle.checked = scheduleMode;
        updateReaderDisplay();
      }
      if (changes.savedReaders) {
        readerList = changes.savedReaders.newValue || [];
        updateReaderDisplay();
      }
    });
  }

  // ===== LISTEN FOR TOGGLE FROM EXTENSION ICON =====
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "togglePanel") {
      panel.classList.toggle("tqs-hidden");
      els.toggleBtn.classList.toggle(
        "tqs-hidden",
        !panel.classList.contains("tqs-hidden"),
      );
    }
  });

  // ===== INIT =====
  async function init() {
    await loadData();
    populateServices();
    initDrag();
    initControls();
    initEvents();
    if (els.customerInput) els.customerInput.focus();

    checkPendingMessage();
  }

  init();
})();
