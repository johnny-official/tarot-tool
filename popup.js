// ===== DOM ELEMENTS =====
const els = {
  pageSelect: document.getElementById("pageSelect"),
  readerName: document.getElementById("readerName"),
  customerName: document.getElementById("customerName"),
  serviceGroup: document.getElementById("serviceGroup"),
  packageSelect: document.getElementById("packageSelect"),
  showCards: document.getElementById("showCards"),
  noteInput: document.getElementById("noteInput"),
  priceDisplay: document.getElementById("priceDisplay"),
  copyAndSaveBtn: document.getElementById("copyAndSaveBtn"),
  totalOrders: document.getElementById("totalOrders"),
  totalRevenue: document.getElementById("totalRevenue"),
  salaryValue: document.getElementById("salaryValue"),
  resetShiftBtn: document.getElementById("resetShiftBtn"),
  copyReportBtn: document.getElementById("copyReportBtn"),
  toast: document.getElementById("toast"),
};

// ===== STATE =====
let PRICING_DATA = {}; // loaded from price.json
let currentPrice = 0;
let shiftOrders = [];
let resetPending = false;

// Abbreviation mappings — only entries that actually shorten the text
const ABBREVIATIONS = {
  "Trải Tarot": "TA",
  Tarot: "TA",
  Lenormand: "LENOR",
  "Bài Tây": "TÂY",
  "Câu Lẻ": "",
  "Combo 3 Câu": "3C",
  "Combo 4 Câu": "4C",
  "Combo Full 6 Câu": "6C",
  "⏱ Gói 30 Phút": "30p",
  "⏱ Gói 45 Phút": "45p",
  "⏱ Gói 60 Phút": "60p",
  "⏱ Gói Thời Gian": "",
  "CS Đặc Biệt": "ĐB",
  "CS Tarot": "CS",
};

function getAbbreviation(text) {
  return text in ABBREVIATIONS ? ABBREVIATIONS[text] : text;
}

// ===== TOAST =====
let _toastTimer = null;
function showToast(message, type = "success") {
  clearTimeout(_toastTimer);
  els.toast.textContent = message;
  els.toast.className = "toast show " + type;
  _toastTimer = setTimeout(() => {
    els.toast.className = "toast";
  }, 2500);
}

// ===== DROPDOWN POPULATION =====
function populateServiceGroups() {
  const page = els.pageSelect.value;
  const services = PRICING_DATA[page]?.services;
  if (!services) return;

  const frag = document.createDocumentFragment();
  const defaultOpt = document.createElement("option");
  defaultOpt.value = "";
  defaultOpt.textContent = "-- Chọn nhóm --";
  frag.appendChild(defaultOpt);

  Object.keys(services).forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    frag.appendChild(opt);
  });

  els.serviceGroup.innerHTML = "";
  els.serviceGroup.appendChild(frag);
  els.packageSelect.innerHTML = '<option value="">-- Chọn gói --</option>';
  currentPrice = 0;
  els.priceDisplay.textContent = "0k";

  // Persist page selection
  chrome.storage.local.set({ currentPage: page });
}

function populatePackages() {
  const page = els.pageSelect.value;
  const service = els.serviceGroup.value;

  els.packageSelect.innerHTML = '<option value="">-- Chọn gói --</option>';
  currentPrice = 0;
  els.priceDisplay.textContent = "0k";

  if (!service) return;

  const packages = PRICING_DATA[page]?.services?.[service];
  if (!packages) return;

  const frag = document.createDocumentFragment();
  Object.entries(packages).forEach(([pkg, price]) => {
    const opt = document.createElement("option");
    opt.value = pkg;
    opt.textContent = `${pkg} — ${price}k`;
    opt.dataset.price = price;
    frag.appendChild(opt);
  });
  els.packageSelect.appendChild(frag);
}

function updatePrice() {
  const opt = els.packageSelect.options[els.packageSelect.selectedIndex];
  currentPrice = opt?.dataset.price ? parseInt(opt.dataset.price) : 0;
  els.priceDisplay.textContent = currentPrice + "k";
  if (currentPrice > 0) {
    els.priceDisplay.classList.add("has-price");
  } else {
    els.priceDisplay.classList.remove("has-price");
  }
}

// ===== DASHBOARD =====
function updateDashboard() {
  const totalRevenue = shiftOrders.reduce((s, o) => s + o.price, 0);
  els.totalOrders.textContent = shiftOrders.length;
  els.totalRevenue.textContent = totalRevenue + "k";
  els.salaryValue.textContent = Math.floor(totalRevenue * 0.05) + "k";
}

// ===== GENERATE MESSAGE =====
function generateMessage() {
  const page = els.pageSelect.value;
  const pageName = PRICING_DATA[page]?.name || page;
  const serviceGroup = els.serviceGroup.value;
  const packageName = els.packageSelect.value;
  const customerName = els.customerName.value.trim();
  const readerName = els.readerName.value.trim();
  const showCards = els.showCards.checked;
  const note = els.noteInput.value.trim();

  const serviceAbbr = getAbbreviation(serviceGroup);
  const packageAbbr = getAbbreviation(packageName);
  const fullAbbr = [serviceAbbr, packageAbbr].filter(Boolean).join(" ");

  let msg = `[${pageName}] ${fullAbbr} - ${currentPrice}k\nKH: ${customerName}\nReader: @${readerName}`;
  if (showCards) msg += "\n(Có Show bài)";
  if (note) msg += `\nNote: ${note}`;
  return msg;
}

// ===== COPY & SAVE =====
async function copyAndSave() {
  const customer = els.customerName.value.trim();
  const reader = els.readerName.value.trim();

  if (!customer) {
    showToast("Nhập tên khách hàng!", "error");
    els.customerName.focus();
    return;
  }
  if (!reader) {
    showToast("Nhập tên Reader!", "error");
    els.readerName.focus();
    return;
  }
  if (!els.serviceGroup.value) {
    showToast("Chọn nhóm dịch vụ!", "error");
    return;
  }
  if (!els.packageSelect.value) {
    showToast("Chọn gói!", "error");
    return;
  }

  const message = generateMessage();

  try {
    await navigator.clipboard.writeText(message);

    const order = {
      id: Date.now(),
      page: els.pageSelect.value,
      pageName: PRICING_DATA[els.pageSelect.value]?.name,
      customer,
      reader,
      serviceGroup: els.serviceGroup.value,
      package: els.packageSelect.value,
      price: currentPrice,
      showCards: els.showCards.checked,
      note: els.noteInput.value.trim(),
      timestamp: new Date().toISOString(),
    };

    shiftOrders.push(order);
    await chrome.storage.local.set({ shiftOrders, currentReader: reader });
    updateDashboard();

    // Reset form (keep page, reader)
    els.customerName.value = "";
    els.serviceGroup.value = "";
    els.packageSelect.innerHTML = '<option value="">-- Chọn gói --</option>';
    els.showCards.checked = false;
    els.noteInput.value = "";
    currentPrice = 0;
    els.priceDisplay.textContent = "0k";
    els.priceDisplay.classList.remove("has-price");

    showToast("✓ Đã copy & lưu đơn!");
    els.customerName.focus();
  } catch {
    showToast("Có lỗi xảy ra!", "error");
  }
}

// ===== RESET SHIFT (inline confirm) =====
async function resetShift() {
  if (shiftOrders.length === 0) {
    showToast("Chưa có đơn nào!", "warning");
    return;
  }

  if (!resetPending) {
    resetPending = true;
    const total = shiftOrders.reduce((s, o) => s + o.price, 0);
    showToast(
      `Bấm lại để reset ${shiftOrders.length} đơn — ${total}k`,
      "warning",
    );
    setTimeout(() => {
      resetPending = false;
    }, 3000);
    return;
  }

  resetPending = false;
  shiftOrders = [];
  await chrome.storage.local.set({ shiftOrders: [] });
  updateDashboard();
  showToast("Đã reset ca!");
}

// ===== COPY REPORT =====
async function copyReport() {
  if (shiftOrders.length === 0) {
    showToast("Chưa có đơn nào!", "warning");
    return;
  }

  const totalRevenue = shiftOrders.reduce((s, o) => s + o.price, 0);
  const salary = Math.floor(totalRevenue * 0.05);
  const reader = els.readerName.value.trim();

  let report = `📊 BÁO CÁO CA — ${new Date().toLocaleDateString("vi-VN")}\n`;
  if (reader) report += `Reader: ${reader}\n`;
  report += `═══════════════════════\n\n`;

  shiftOrders.forEach((order, i) => {
    const sAbbr = getAbbreviation(order.serviceGroup);
    const pAbbr = getAbbreviation(order.package);
    const abbr = [sAbbr, pAbbr].filter(Boolean).join(" ");
    report += `${i + 1}. [${order.pageName}] ${abbr} — ${order.price}k\n`;
    report += `   KH: ${order.customer}\n`;
    if (order.showCards) report += `   (Có Show bài)\n`;
    if (order.note) report += `   Note: ${order.note}\n`;
    report += "\n";
  });

  report += `═══════════════════════\n`;
  report += `📈 TỔNG KẾT:\n`;
  report += `• Tổng đơn: ${shiftOrders.length}\n`;
  report += `• Tổng tiền: ${totalRevenue}k\n`;
  report += `• Lương (5%): ${salary}k\n`;

  try {
    await navigator.clipboard.writeText(report);
    showToast("✓ Đã copy báo cáo!");
  } catch {
    showToast("Có lỗi xảy ra!", "error");
  }
}

// ===== LOAD DATA =====
async function loadPricingData() {
  const url = chrome.runtime.getURL("price.json");
  const res = await fetch(url);
  const data = await res.json();
  // Strip _comment key
  const { _comment, ...pricing } = data;
  return pricing;
}

async function loadSavedState() {
  const data = await chrome.storage.local.get([
    "currentReader",
    "currentPage",
    "shiftOrders",
  ]);
  if (data.currentReader) els.readerName.value = data.currentReader;
  if (
    data.currentPage &&
    els.pageSelect.querySelector(`option[value="${data.currentPage}"]`)
  ) {
    els.pageSelect.value = data.currentPage;
  }
  if (Array.isArray(data.shiftOrders)) {
    shiftOrders = data.shiftOrders;
    updateDashboard();
  }
}

// ===== EVENT LISTENERS =====
function initEventListeners() {
  els.pageSelect.addEventListener("change", populateServiceGroups);
  els.serviceGroup.addEventListener("change", populatePackages);
  els.packageSelect.addEventListener("change", updatePrice);
  els.readerName.addEventListener("blur", () => {
    const v = els.readerName.value.trim();
    if (v) chrome.storage.local.set({ currentReader: v });
  });

  els.copyAndSaveBtn.addEventListener("click", copyAndSave);
  els.resetShiftBtn.addEventListener("click", resetShift);
  els.copyReportBtn.addEventListener("click", copyReport);

  // Keyboard flow: Enter advances to next field
  els.readerName.addEventListener("keypress", (e) => {
    if (e.key === "Enter") els.customerName.focus();
  });
  els.customerName.addEventListener("keypress", (e) => {
    if (e.key === "Enter") els.serviceGroup.focus();
  });
  els.noteInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") copyAndSave();
  });
}

// ===== INIT =====
async function init() {
  try {
    PRICING_DATA = await loadPricingData();
  } catch {
    showToast("Lỗi load dữ liệu giá!", "error");
    return;
  }

  await loadSavedState();
  populateServiceGroups();
  initEventListeners();
  els.customerName.focus();
}

init();
