// ===== TAROT QUICKSALE — SHARED STATE =====
// Loads FIRST. All modules read/write via window.TQS.
// Do NOT add logic here — only state declarations.

window.TQS = {
  // Page detection (populated from config.json)
  PAGE_IDS: {},
  PRICING_DATA: {},
  detectedPage: null,

  // Page groups — CÁ+DỪA đồng bộ, BƠ riêng
  PAGE_GROUPS: { CA: "CA_DUA", DUA: "CA_DUA", POBO: "POBO" },

  // Reader state
  readerList: [],
  activeReaderIdx: 0,
  autoRotate: true,
  manualReaderOverride: null,
  preOverrideReaderIdx: null,
  preOverrideSlotKey: null,

  // Per-group reader rotation index
  groupReaderIdx: { CA_DUA: 0, POBO: 0 },
  // Per-group schedule slot reader index
  groupSlotReaderIdx: { CA_DUA: {}, POBO: {} },

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

  // AI Chat state
  aiChatHistory: [],        // Array of { role: "user"|"model", text: string }
  aiChatApiKey: null,       // Gemini API key (loaded from chrome.storage.local)
  aiChatLoading: false,     // Request in-flight flag
  aiChatMaxHistory: 5,      // Max messages to keep in session (configurable)

  // DOM element refs (populated by ui.js)
  els: {},

  // Panel references (set by ui.js)
  wrapper: null,
  panel: null,
  aiChatPanel: null,

  // Drag state
  isDragging: false,
  dragOffset: { x: 0, y: 0 },
};

