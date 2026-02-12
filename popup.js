// ===== DATA STRUCTURE =====
const PRICING_DATA = {
  CA: {
    name: "Cá",
    services: {
      "Gói 1 Câu": {
        "Y/N": 9,
        "Chuyên Sâu": 20,
        "Đặc Biệt": 25,
      },
      "Gói 3 Câu": {
        "Chuyên Sâu": 50,
        "Đặc Biệt": 70,
      },
      "Gói 4 Câu": {
        "Chuyên Sâu": 65,
        "Đặc Biệt": 85,
      },
      "Gói 6 Câu": {
        "Chuyên Sâu": 90,
        "Đặc Biệt": 120,
      },
    },
  },
  DUA: {
    name: "Dừa",
    services: {
      Tarot: {
        "1Y/N": 9,
        "1CT": 20,
        "3CT": 55,
        "6CT": 100,
      },
      Lenormand: {
        "1Y/N": 15,
        "1CT": 30,
        "3CT": 85,
      },
      "Tarot+Lenor": {
        "1Y/N": 15,
        "3CT": 85,
        "6CT": 155,
      },
      "Bài Tây": {
        "1Y/N": 20,
        "1CT": 40,
        "3CT": 110,
      },
    },
  },
  POBO: {
    name: "Pờ Bơ",
    services: {
      Tarot: {
        "1Y/N": 9,
        "1CT": 20,
        "3CT": 55,
        "5CT": 85,
        "7CT": 115,
      },
      Lenormand: {
        "1Y/N": 12,
        "1CT": 25,
        "3CT": 70,
        "5CT": 110,
      },
      "Bài Tây": {
        "1Y/N": 18,
        "1CT": 35,
        "3CT": 95,
        "5CT": 155,
      },
    },
  },
};

// Abbreviation mappings
const ABBREVIATIONS = {
  Tarot: "TA",
  Lenormand: "LENOR",
  "Tarot+Lenor": "TALE",
  "Bài Tây": "BT",
  "Gói 1 Câu": "1C",
  "Gói 3 Câu": "3C",
  "Gói 4 Câu": "4C",
  "Gói 6 Câu": "6C",
  "Chuyên Sâu": "CT",
  "Đặc Biệt": "ĐB",
  "Y/N": "Y/N",
  "1Y/N": "1Y/N",
  "1CT": "1CT",
  "3CT": "3CT",
  "5CT": "5CT",
  "6CT": "6CT",
  "7CT": "7CT",
};

// ===== DOM ELEMENTS =====
const elements = {
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
let currentPrice = 0;
let shiftOrders = [];

// ===== UTILITY FUNCTIONS =====
function showToast(message, type = "success") {
  elements.toast.textContent = message;
  elements.toast.className = "toast show " + type;
  setTimeout(() => {
    elements.toast.className = "toast";
  }, 2500);
}

function formatPrice(price) {
  return price + "k";
}

function getAbbreviation(text) {
  return ABBREVIATIONS[text] || text;
}

// ===== DROPDOWN POPULATION =====
function populateServiceGroups() {
  const page = elements.pageSelect.value;
  const services = PRICING_DATA[page].services;

  elements.serviceGroup.innerHTML = '<option value="">-- Chọn nhóm --</option>';

  Object.keys(services).forEach((service) => {
    const option = document.createElement("option");
    option.value = service;
    option.textContent = service;
    elements.serviceGroup.appendChild(option);
  });

  // Reset package dropdown
  elements.packageSelect.innerHTML = '<option value="">-- Chọn gói --</option>';
  currentPrice = 0;
  elements.priceDisplay.textContent = "0k";
}

function populatePackages() {
  const page = elements.pageSelect.value;
  const serviceGroup = elements.serviceGroup.value;

  elements.packageSelect.innerHTML = '<option value="">-- Chọn gói --</option>';

  if (!serviceGroup) {
    currentPrice = 0;
    elements.priceDisplay.textContent = "0k";
    return;
  }

  const packages = PRICING_DATA[page].services[serviceGroup];

  Object.entries(packages).forEach(([pkg, price]) => {
    const option = document.createElement("option");
    option.value = pkg;
    option.textContent = `${pkg} - ${price}k`;
    option.dataset.price = price;
    elements.packageSelect.appendChild(option);
  });

  currentPrice = 0;
  elements.priceDisplay.textContent = "0k";
}

function updatePrice() {
  const selectedOption =
    elements.packageSelect.options[elements.packageSelect.selectedIndex];

  if (selectedOption && selectedOption.dataset.price) {
    currentPrice = parseInt(selectedOption.dataset.price);
    elements.priceDisplay.textContent = formatPrice(currentPrice);
  } else {
    currentPrice = 0;
    elements.priceDisplay.textContent = "0k";
  }
}

// ===== DASHBOARD UPDATE =====
function updateDashboard() {
  const totalOrders = shiftOrders.length;
  const totalRevenue = shiftOrders.reduce((sum, order) => sum + order.price, 0);
  const salary = Math.floor(totalRevenue * 0.05);

  elements.totalOrders.textContent = totalOrders;
  elements.totalRevenue.textContent = formatPrice(totalRevenue);
  elements.salaryValue.textContent = formatPrice(salary);
}

// ===== GENERATE MESSAGE =====
function generateMessage() {
  const page = elements.pageSelect.value;
  const pageName = PRICING_DATA[page].name;
  const serviceGroup = elements.serviceGroup.value;
  const packageName = elements.packageSelect.value;
  const customerName = elements.customerName.value.trim();
  const readerName = elements.readerName.value.trim();
  const showCards = elements.showCards.checked;
  const note = elements.noteInput.value.trim();

  // Build abbreviated package name
  const serviceAbbr = getAbbreviation(serviceGroup);
  const packageAbbr = getAbbreviation(packageName);
  const fullAbbr = `${serviceAbbr} ${packageAbbr}`;

  let message = `[${pageName}] ${fullAbbr} - ${currentPrice}k\n`;
  message += `KH: ${customerName}\n`;
  message += `Reader: @${readerName}`;

  if (showCards) {
    message += "\n(Có Show bài)";
  }

  if (note) {
    message += `\nNote: ${note}`;
  }

  return message;
}

// ===== COPY AND SAVE =====
async function copyAndSave() {
  // Validation
  if (!elements.customerName.value.trim()) {
    showToast("Vui lòng nhập tên khách hàng!", "error");
    elements.customerName.focus();
    return;
  }

  if (!elements.readerName.value.trim()) {
    showToast("Vui lòng nhập tên Reader!", "error");
    elements.readerName.focus();
    return;
  }

  if (!elements.serviceGroup.value) {
    showToast("Vui lòng chọn nhóm dịch vụ!", "error");
    return;
  }

  if (!elements.packageSelect.value) {
    showToast("Vui lòng chọn gói!", "error");
    return;
  }

  const message = generateMessage();

  try {
    // Copy to clipboard
    await navigator.clipboard.writeText(message);

    // Save order
    const order = {
      id: Date.now(),
      page: elements.pageSelect.value,
      pageName: PRICING_DATA[elements.pageSelect.value].name,
      customer: elements.customerName.value.trim(),
      reader: elements.readerName.value.trim(),
      serviceGroup: elements.serviceGroup.value,
      package: elements.packageSelect.value,
      price: currentPrice,
      showCards: elements.showCards.checked,
      note: elements.noteInput.value.trim(),
      timestamp: new Date().toISOString(),
    };

    shiftOrders.push(order);

    // Save to storage
    await chrome.storage.local.set({
      shiftOrders: shiftOrders,
      currentReader: elements.readerName.value.trim(),
    });

    // Update dashboard
    updateDashboard();

    // Reset form (keep reader name)
    elements.customerName.value = "";
    elements.serviceGroup.value = "";
    elements.packageSelect.innerHTML =
      '<option value="">-- Chọn gói --</option>';
    elements.showCards.checked = false;
    elements.noteInput.value = "";
    currentPrice = 0;
    elements.priceDisplay.textContent = "0k";

    showToast("✓ Đã copy & lưu đơn!", "success");

    // Focus back to customer name for quick entry
    elements.customerName.focus();
  } catch (error) {
    console.error("Error:", error);
    showToast("Có lỗi xảy ra!", "error");
  }
}

// ===== RESET SHIFT =====
async function resetShift() {
  if (shiftOrders.length === 0) {
    showToast("Chưa có đơn nào!", "warning");
    return;
  }

  const confirmed = confirm(
    `Xác nhận reset ca?\nTổng: ${shiftOrders.length} đơn - ${shiftOrders.reduce((sum, o) => sum + o.price, 0)}k`,
  );

  if (confirmed) {
    shiftOrders = [];
    await chrome.storage.local.set({ shiftOrders: [] });
    updateDashboard();
    showToast("Đã reset ca!", "success");
  }
}

// ===== COPY REPORT =====
async function copyReport() {
  if (shiftOrders.length === 0) {
    showToast("Chưa có đơn nào!", "warning");
    return;
  }

  const totalRevenue = shiftOrders.reduce((sum, order) => sum + order.price, 0);
  const salary = Math.floor(totalRevenue * 0.05);

  let report = `📊 BÁO CÁO CA - ${new Date().toLocaleDateString("vi-VN")}\n`;
  report += `Reader: ${elements.readerName.value.trim()}\n`;
  report += `═══════════════════════\n\n`;

  shiftOrders.forEach((order, index) => {
    const serviceAbbr = getAbbreviation(order.serviceGroup);
    const packageAbbr = getAbbreviation(order.package);
    report += `${index + 1}. [${order.pageName}] ${serviceAbbr} ${packageAbbr} - ${order.price}k\n`;
    report += `   KH: ${order.customer}\n`;
    if (order.showCards) {
      report += `   (Có Show bài)\n`;
    }
    if (order.note) {
      report += `   Note: ${order.note}\n`;
    }
    report += "\n";
  });

  report += `═══════════════════════\n`;
  report += `📈 TỔNG KẾT:\n`;
  report += `• Tổng đơn: ${shiftOrders.length}\n`;
  report += `• Tổng tiền: ${totalRevenue}k\n`;
  report += `• Lương (5%): ${salary}k\n`;

  try {
    await navigator.clipboard.writeText(report);
    showToast("✓ Đã copy báo cáo!", "success");
  } catch (error) {
    console.error("Error:", error);
    showToast("Có lỗi xảy ra!", "error");
  }
}

// ===== LOAD SAVED DATA =====
async function loadSavedData() {
  try {
    const data = await chrome.storage.local.get([
      "currentReader",
      "shiftOrders",
    ]);

    if (data.currentReader) {
      elements.readerName.value = data.currentReader;
    }

    if (data.shiftOrders && Array.isArray(data.shiftOrders)) {
      shiftOrders = data.shiftOrders;
      updateDashboard();
    }
  } catch (error) {
    console.error("Error loading data:", error);
  }
}

// ===== SAVE READER NAME ON CHANGE =====
async function saveReaderName() {
  const readerName = elements.readerName.value.trim();
  if (readerName) {
    await chrome.storage.local.set({ currentReader: readerName });
  }
}

// ===== EVENT LISTENERS =====
function initEventListeners() {
  // Dropdown changes
  elements.pageSelect.addEventListener("change", populateServiceGroups);
  elements.serviceGroup.addEventListener("change", populatePackages);
  elements.packageSelect.addEventListener("change", updatePrice);

  // Save reader name on blur
  elements.readerName.addEventListener("blur", saveReaderName);

  // Action buttons
  elements.copyAndSaveBtn.addEventListener("click", copyAndSave);
  elements.resetShiftBtn.addEventListener("click", resetShift);
  elements.copyReportBtn.addEventListener("click", copyReport);

  // Enter key handling for quick workflow
  elements.customerName.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      elements.serviceGroup.focus();
    }
  });

  elements.noteInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      copyAndSave();
    }
  });
}

// ===== INITIALIZATION =====
async function init() {
  await loadSavedData();
  populateServiceGroups();
  initEventListeners();

  // Focus on customer name for quick entry
  elements.customerName.focus();
}

// Run initialization
init();
