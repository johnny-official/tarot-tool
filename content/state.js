// ===== TAROT QUICKSALE — SHARED STATE =====
// Loads FIRST. All modules read/write via window.TQS.
// Do NOT add logic here — only state declarations.

window.TQS = {
  // Page detection (populated from config.json)
  PAGE_IDS: {},
  PRICING_DATA: {},
  detectedPage: null,

  // Reader state
  readerList: [],
  activeReaderIdx: 0,
  autoRotate: true,
  manualReaderOverride: null,

  // Schedule state
  scheduleSlots: [],
  scheduleMode: false,
  slotReaderIdx: {},
  scheduleTimerId: null,

  // Source platform (FB vs Insta) — auto-detected
  sourcePlatform: "facebook",

  // Orders
  shiftOrders: [],
  shiftStartTime: null,
  currentPrice: 0,
  editingOrderId: null,

  // DOM element refs (populated by ui.js)
  els: {},

  // Panel reference (set by ui.js)
  panel: null,

  // Drag state
  isDragging: false,
  dragOffset: { x: 0, y: 0 },
};
