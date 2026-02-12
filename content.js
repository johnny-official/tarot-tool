// ===== TAROT QUICKSALE CONTENT SCRIPT V1.1 =====
(function () {
  "use strict";

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
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };
  let detectedPage = null;

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
        <span class="tqs-logo">🔮 Tarot QuickSale</span>
        <div class="tqs-header-buttons">
          <button class="tqs-header-btn tqs-minimize" id="tqs-minimize" title="Thu nhỏ">─</button>
          <button class="tqs-header-btn tqs-close" id="tqs-close" title="Đóng">✕</button>
        </div>
      </div>
      <div class="tqs-body">
        ${detected ? `<div class="tqs-detected-page">📍 Đang ở trang: <strong>${PRICING_DATA[detected].name}</strong></div>` : ""}
        
        <div class="tqs-form-row">
          <div class="tqs-form-group">
            <label>Page</label>
            <select class="tqs-select" id="tqs-page">
              <option value="CA" ${detected === "CA" ? "selected" : ""}>Cá</option>
              <option value="DUA" ${detected === "DUA" ? "selected" : ""}>Dừa</option>
              <option value="POBO" ${detected === "POBO" ? "selected" : ""}>Pờ Bơ</option>
            </select>
          </div>
          <div class="tqs-form-group">
            <label>Reader</label>
            <input type="text" class="tqs-input" id="tqs-reader" placeholder="@TênReader">
          </div>
        </div>

        <div class="tqs-form-group">
          <label>Tên Khách Hàng</label>
          <input type="text" class="tqs-input" id="tqs-customer" placeholder="Nguyễn Văn A">
        </div>

        <div class="tqs-form-row">
          <div class="tqs-form-group">
            <label>Nhóm DV</label>
            <select class="tqs-select" id="tqs-service">
              <option value="">-- Chọn --</option>
            </select>
          </div>
          <div class="tqs-form-group">
            <label>Gói</label>
            <select class="tqs-select" id="tqs-package">
              <option value="">-- Chọn --</option>
            </select>
          </div>
        </div>

        <div class="tqs-custom-section">
          <div class="tqs-custom-toggle">
            <label class="tqs-checkbox-label">
              <input type="checkbox" id="tqs-custom-mode">
              <span class="tqs-checkmark"></span>
              Tự nhập (Custom)
            </label>
          </div>
          <div class="tqs-custom-inputs tqs-hidden" id="tqs-custom-inputs">
            <div class="tqs-form-row">
              <div class="tqs-form-group">
                <label>Tên Gói (VD: 3C CS TÂY)</label>
                <input type="text" class="tqs-input" id="tqs-custom-name" placeholder="3C CS TÂY">
              </div>
              <div class="tqs-form-group">
                <label>Giá (k)</label>
                <input type="number" class="tqs-input" id="tqs-custom-price" placeholder="50">
              </div>
            </div>
          </div>
        </div>

        <div class="tqs-form-group">
          <label>Ghi chú (tùy chọn)</label>
          <input type="text" class="tqs-input" id="tqs-note" placeholder="">
        </div>

        <div class="tqs-action">
          <div class="tqs-price-display">
            <span class="tqs-price-label">Giá:</span>
            <span class="tqs-price-value" id="tqs-price">0k</span>
          </div>
          <div class="tqs-platform-select">
            <label class="tqs-platform-btn">
              <input type="radio" name="platform" value="facebook" checked>
              <span>FB Messages</span>
            </label>
            <label class="tqs-platform-btn">
              <input type="radio" name="platform" value="messenger">
              <span>Messenger</span>
            </label>
          </div>
          <div class="tqs-btn-group">
            <button class="tqs-btn-primary" id="tqs-copy-save">📋 COPY</button>
            <button class="tqs-btn-send" id="tqs-send-msg">📤 GỬI NGAY</button>
          </div>
        </div>

        <div class="tqs-dashboard">
          <div class="tqs-dashboard-title">📊 Thống Kê Ca</div>
          <div class="tqs-stats-grid">
            <div class="tqs-stat-card">
              <span class="tqs-stat-value" id="tqs-total-orders">0</span>
              <span class="tqs-stat-label">Đơn</span>
            </div>
            <div class="tqs-stat-card">
              <span class="tqs-stat-value" id="tqs-total-revenue">0k</span>
              <span class="tqs-stat-label">Tiền</span>
            </div>
            <div class="tqs-stat-card tqs-highlight">
              <span class="tqs-stat-value" id="tqs-salary">0k</span>
              <span class="tqs-stat-label">5%</span>
            </div>
          </div>
          <div class="tqs-dashboard-actions">
            <button class="tqs-btn-secondary" id="tqs-reset">🔄 Reset</button>
            <button class="tqs-btn-secondary" id="tqs-report">📄 Báo Cáo</button>
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
    pageSelect: panel.querySelector("#tqs-page"),
    readerInput: panel.querySelector("#tqs-reader"),
    customerInput: panel.querySelector("#tqs-customer"),
    serviceSelect: panel.querySelector("#tqs-service"),
    packageSelect: panel.querySelector("#tqs-package"),
    customMode: panel.querySelector("#tqs-custom-mode"),
    customInputs: panel.querySelector("#tqs-custom-inputs"),
    customName: panel.querySelector("#tqs-custom-name"),
    customPrice: panel.querySelector("#tqs-custom-price"),
    noteInput: panel.querySelector("#tqs-note"),
    priceDisplay: panel.querySelector("#tqs-price"),
    copySaveBtn: panel.querySelector("#tqs-copy-save"),
    sendMsgBtn: panel.querySelector("#tqs-send-msg"),
    totalOrders: panel.querySelector("#tqs-total-orders"),
    totalRevenue: panel.querySelector("#tqs-total-revenue"),
    salary: panel.querySelector("#tqs-salary"),
    resetBtn: panel.querySelector("#tqs-reset"),
    reportBtn: panel.querySelector("#tqs-report"),
    toast: document.querySelector("#tqs-toast"),
    toggleBtn: document.querySelector("#tarot-quicksale-toggle"),
  };

  // ===== UTILITY FUNCTIONS =====
  function showToast(message, type = "success") {
    els.toast.textContent = message;
    els.toast.className =
      "tqs-toast tqs-show" + (type !== "success" ? " tqs-" + type : "");
    setTimeout(() => {
      els.toast.className = "tqs-toast";
    }, 2500);
  }

  // ===== DROPDOWN LOGIC =====
  function populateServices() {
    const page = els.pageSelect.value;
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
    const page = els.pageSelect.value;
    const service = els.serviceSelect.value;

    els.packageSelect.innerHTML = '<option value="">-- Chọn --</option>';

    if (!service) {
      currentPrice = 0;
      els.priceDisplay.textContent = "0k";
      return;
    }

    const packages = PRICING_DATA[page].services[service];
    Object.entries(packages).forEach(([pkg, price]) => {
      els.packageSelect.innerHTML += `<option value="${pkg}" data-price="${price}">${pkg} - ${price}k</option>`;
    });

    currentPrice = 0;
    els.priceDisplay.textContent = "0k";
  }

  function updatePrice() {
    if (els.customMode.checked) {
      currentPrice = parseInt(els.customPrice.value) || 0;
    } else {
      const opt = els.packageSelect.options[els.packageSelect.selectedIndex];
      currentPrice = opt && opt.dataset.price ? parseInt(opt.dataset.price) : 0;
    }
    els.priceDisplay.textContent = currentPrice + "k";
  }

  // ===== TOGGLE CUSTOM MODE =====
  function toggleCustomMode() {
    const isCustom = els.customMode.checked;
    els.customInputs.classList.toggle("tqs-hidden", !isCustom);
    els.serviceSelect.disabled = isCustom;
    els.packageSelect.disabled = isCustom;

    if (isCustom) {
      updatePrice();
    } else {
      updatePrice();
    }
  }

  // ===== DASHBOARD =====
  function updateDashboard() {
    const total = shiftOrders.length;
    const revenue = shiftOrders.reduce((s, o) => s + o.price, 0);
    const salary = Math.floor(revenue * 0.05);

    els.totalOrders.textContent = total;
    els.totalRevenue.textContent = revenue + "k";
    els.salary.textContent = salary + "k";
  }

  // ===== GENERATE MESSAGE =====
  function generateMessage() {
    const page = els.pageSelect.value;
    const pageName = PRICING_DATA[page].name;
    const customer = els.customerInput.value.trim();
    const reader = els.readerInput.value.trim();
    const note = els.noteInput.value.trim();

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
    if (!els.customerInput.value.trim()) {
      showToast("Nhập tên khách!", "error");
      els.customerInput.focus();
      return false;
    }
    if (!els.readerInput.value.trim()) {
      showToast("Nhập tên Reader!", "error");
      els.readerInput.focus();
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

  // ===== SAVE ORDER =====
  function saveOrder() {
    const order = {
      id: Date.now(),
      page: els.pageSelect.value,
      pageName: PRICING_DATA[els.pageSelect.value].name,
      customer: els.customerInput.value.trim(),
      reader: els.readerInput.value.trim(),
      packageDisplay: els.customMode.checked
        ? els.customName.value.trim()
        : `${els.serviceSelect.value} ${els.packageSelect.value}`,
      price: currentPrice,
      note: els.noteInput.value.trim(),
      timestamp: new Date().toISOString(),
    };

    shiftOrders.push(order);

    chrome.storage.local.set({
      shiftOrders: shiftOrders,
      currentReader: els.readerInput.value.trim(),
    });

    updateDashboard();
  }

  // ===== RESET FORM =====
  function resetForm() {
    els.customerInput.value = "";
    if (!els.customMode.checked) {
      els.serviceSelect.value = "";
      els.packageSelect.innerHTML = '<option value="">-- Chọn --</option>';
    } else {
      els.customName.value = "";
      els.customPrice.value = "";
    }
    els.noteInput.value = "";
    currentPrice = 0;
    els.priceDisplay.textContent = "0k";
    els.customerInput.focus();
  }

  // ===== RESET SHIFT =====
  async function resetShift() {
    if (shiftOrders.length === 0) {
      showToast("Chưa có đơn!", "warning");
      return;
    }

    const total = shiftOrders.reduce((s, o) => s + o.price, 0);
    if (confirm(`Reset ca?\n${shiftOrders.length} đơn - ${total}k`)) {
      shiftOrders = [];
      chrome.storage.local.set({ shiftOrders: [] });
      updateDashboard();
      showToast("Đã reset!");
    }
  }

  // ===== COPY REPORT =====
  async function copyReport() {
    if (shiftOrders.length === 0) {
      showToast("Chưa có đơn!", "warning");
      return;
    }

    const revenue = shiftOrders.reduce((s, o) => s + o.price, 0);
    const salary = Math.floor(revenue * 0.05);

    let report = `📊 BÁO CÁO CA - ${new Date().toLocaleDateString("vi-VN")}\n`;
    report += `Reader: ${els.readerInput.value.trim()}\n`;
    report += `═══════════════════════\n\n`;

    shiftOrders.forEach((o, i) => {
      report += `${i + 1}. [${o.pageName}] ${o.packageDisplay} - ${o.price}k\n`;
      report += `   ${o.customer}\n`;
      if (o.note) report += `   ${o.note}\n`;
      report += "\n";
    });

    report += `═══════════════════════\n`;
    report += `📈 TỔNG: ${shiftOrders.length} đơn | ${revenue}k | Lương: ${salary}k\n`;

    try {
      await navigator.clipboard.writeText(report);
      showToast("✓ Đã copy báo cáo!");
    } catch (err) {
      showToast("Lỗi!", "error");
    }
  }

  // ===== LOAD DATA =====
  async function loadData() {
    try {
      const data = await chrome.storage.local.get([
        "currentReader",
        "shiftOrders",
      ]);
      if (data.currentReader) els.readerInput.value = data.currentReader;
      if (data.shiftOrders && Array.isArray(data.shiftOrders)) {
        shiftOrders = data.shiftOrders;
        updateDashboard();
      }
    } catch (err) {
      console.error(err);
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
    els.pageSelect.addEventListener("change", populateServices);
    els.serviceSelect.addEventListener("change", populatePackages);
    els.packageSelect.addEventListener("change", updatePrice);

    els.customMode.addEventListener("change", toggleCustomMode);
    els.customPrice.addEventListener("input", updatePrice);

    els.readerInput.addEventListener("blur", () => {
      if (els.readerInput.value.trim()) {
        chrome.storage.local.set({
          currentReader: els.readerInput.value.trim(),
        });
      }
    });

    els.copySaveBtn.addEventListener("click", copyAndSave);
    els.sendMsgBtn.addEventListener("click", sendToMessenger);
    els.resetBtn.addEventListener("click", resetShift);
    els.reportBtn.addEventListener("click", copyReport);

    // Enter key shortcuts
    els.customerInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") els.serviceSelect.focus();
    });
    els.noteInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") copyAndSave();
    });
    els.customPrice.addEventListener("keypress", (e) => {
      if (e.key === "Enter") copyAndSave();
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
    els.customerInput.focus();

    // Check for pending message on Messenger
    checkPendingMessage();
  }

  init();
})();
