# Tarot QuickSale — AI Agent Context

> **Read this file before making any changes.** This file contains all information needed to understand the project.

---

## 1. Overview

**Chrome Extension (Manifest V3)** helping Tarot sales staff quickly finalize orders on **Facebook Business Suite**.

**Core features:**
- Inject floating panel into `business.facebook.com`
- Auto-detect fanpage (Bơ/Dừa/Cá) from URL
- Auto-detect customer source: Facebook (🔵) or Instagram (🟣)
- Select service → select package → copy formatted message
- Reader management (auto-rotation, schedule shifts)
- Page-group sync: CÁ + DỪA share rotation, POBO independent
- Order dashboard + shift reports

---

## 2. Tech Stack & Rules

| Rule | Details |
|------|---------|
| **Framework** | ❌ None. Vanilla JS only |
| **Build tool** | ❌ None. Direct load via manifest |
| **State** | All via `window.TQS` — no local vars for shared state |
| **Module pattern** | IIFE, export via `T.moduleName = { ... }` |
| **Storage** | `T.storage.syncSave()` — debounced 200ms |
| **DOM** | `DocumentFragment` for batch element creation |
| **CSS** | Use `var(--accent)`, `var(--green)`, etc. from `:root` |
| **Language** | UI text, toasts, comments = **Vietnamese** |
| **Debug** | ❌ No `console.log` |

---

## 3. File Architecture

```
tarot-tool/
├── manifest.json          ← Chrome extension config (v3)
├── background.js          ← Service Worker — toggle only (6 lines)
├── content.css            ← Minimal dark theme
├── config.json            ← Real page IDs (committed)
├── config.example.json    ← Template for newcomers
├── price.json             ← Pricing — SINGLE SOURCE OF TRUTH
│
├── content/               ← 8 JS modules, loaded in order ↓
│   ├── state.js           ← (1) window.TQS namespace + mutable state
│   ├── constants.js       ← (2) Service abbreviations, emoji, text config
│   ├── detection.js       ← (3) Auto-detect page, platform, customer name
│   ├── storage.js         ← (4) Chrome storage CRUD, cross-tab sync
│   ├── readers.js         ← (5) Reader CRUD, rotation, schedule, page-group sync
│   ├── orders.js          ← (6) Order CRUD, message gen, report
│   ├── ui.js              ← (7) Panel HTML, toast, modal, drag
│   └── main.js            ← (8) Init, events, SPA observer — LOAD LAST
│
├── popup.html + popup.js + style.css  ← Popup dashboard (unused)
└── icons/                 ← Extension icons (SVG)
```

### Load Order (critical!)

```
state → constants → detection → storage → readers → orders → ui → main
  ↑                                                                  |
  └──────────── All read/write via window.TQS ───────────────────────┘
```

**When adding a new module:** MUST update the `js` array in `manifest.json` in the correct order.

---

## 4. Module Details

### `state.js`
Global state declarations. **No logic here.**
- `PAGE_GROUPS` — maps page keys to sync groups: `{ CA: "CA_DUA", DUA: "CA_DUA", POBO: "POBO" }`
- `groupReaderIdx` — per-group rotation index: `{ CA_DUA: 0, POBO: 0 }`
- `groupSlotReaderIdx` — per-group schedule slot rotation

### `constants.js`
Abbreviation maps. Edit this file to change output text:
- `T.SERVICE_ABBR` — Tarot→"TA", Lenormand→"LENOR", Bài Tây→"TÂY"
- `T.PACKAGE_ABBR` — 1 CS→"1CS", 7 CS→"7CS", ...
- `T.SOURCE_EMOJI` — facebook→"🔵", instagram→"🟣"

### `detection.js`
- `detectPageFromURL()` — check `asset_id`, `page_id`, `mailbox_id` from URL
- `detectSourcePlatform()` — 5-layer detection:
  1. URL path `/inbox/instagram_direct`
  2. URL param `thread_type` containing "IG"
  3. URL params `channel=instagram`, `ig_thread`
  4. DOM text "Instagram profile" in conversation panel
  5. DOM attributes `data-channel`, `aria-label`
- `tryAutoFillCustomer()` — read customer name from conversation header
- `initConversationObserver()` — MutationObserver on `[role=main]`, debounce 300ms

### `storage.js`
- `syncSave(data)` — debounced 200ms write with try-catch
- `loadConfig()` — fetch `config.json` → build `T.PAGE_IDS` map
- `loadPricingData()` — fetch `price.json`
- `loadData()` — load all saved state, auto-migrate `activeReaderIdx` → `groupReaderIdx`
- `initCrossTabSync()` — listener `chrome.storage.onChanged` for group indices

### `readers.js`
- `getPageGroup(page)` — returns `"CA_DUA"` or `"POBO"`
- `getGroupIdx()` / `setGroupIdx()` — per-group reader rotation index
- `getActiveReader()` — priority: manual override > schedule > rotation
- `rotateReader()` — **if override: clear only, NO rotation** (override = one-time pick)
- `parseSchedule(text)` — parse "8h - 14h @Reader1 @Reader2" format
- `startScheduleTimer()` — auto-update every 60s

### `orders.js`
- `generateMessage()` — build formatted output text
- `copyAndSave()` — validate → detect platform → copy → save → rotate (with `_copying` lock)
- `populateServices()` / `populatePackages()` — dropdown logic
- `buildReport()`, `copyReport()`, `resetShift()`

### `ui.js`
- `createPanelHTML()` — full HTML template
- `injectPanel()` — inject into body
- `collectElements(panel)` — cache DOM refs into `T.els`
- `showToast()`, `showConfirm()` — feedback UI
- `initDrag()`, `initControls()` — panel behavior

### `main.js`
- `init()` — sequence: inject → loadConfig + loadPricing (parallel) → loadData → events
- `initEvents()` — wire all event listeners
- `initShortcuts()` — Alt+T toggle, Alt+C copy, Alt+1..9 package select
- `initSPAObserver()` — URL polling 2s + `selected_item_id` tracking
- `initConversationObserver()` — DOM-level conversation change detection

---

## 5. Page-Group Sync

CÁ + DỪA **share** reader rotation. POBO is **independent**.

| Group | Pages | Index |
|-------|-------|-------|
| `CA_DUA` | CÁ, DỪA | `groupReaderIdx.CA_DUA` |
| `POBO` | Pờ Bơ | `groupReaderIdx.POBO` |

Copy on CÁ → rotate CA_DUA index → DỪA sees the new reader.
Copy on POBO → rotate POBO index → CÁ/DỪA unaffected.

---

## 6. Data Model

### config.json
```json
{
  "pages": {
    "POBO": { "fbPageId": "918768421315641", "name": "PỜ BƠ" },
    "DUA":  { "fbPageId": "513140915211900", "name": "DỪA" },
    "CA":   { "fbPageId": "105889999207829", "name": "CÁ" }
  }
}
```

### price.json (edit this file to update prices)
```json
{
  "POBO": {
    "name": "PỜ BƠ", "icon": "🧈", "color": "purple",
    "services": {
      "Tarot": { "1 Y/N": 9, "1 CS": 20, "3 CS": 55, "5 CS": 85, "7 CS": 115 }
    }
  }
}
```

### chrome.storage.local keys

| Key | Type | Description |
|-----|------|-------------|
| `savedReaders` | `string[]` | Reader list |
| `groupReaderIdx` | `object` | Per-group rotation index `{ CA_DUA: n, POBO: n }` |
| `groupSlotReaderIdx` | `object` | Per-group schedule slot indices |
| `autoRotate` | `boolean` | Auto-rotate enabled |
| `shiftOrders` | `Order[]` | Orders in current shift |
| `shiftStartTime` | `string (ISO)` | Shift start time |
| `shiftHistory` | `Shift[]` | Shift history (max 30) |
| `schedule` | `string` | Raw schedule text |
| `scheduleSlots` | `Slot[]` | Parsed time slots |
| `scheduleMode` | `boolean` | Schedule mode active |

### Order object
```typescript
interface Order {
  id: number;            // Date.now()
  page: string;          // "CA" | "DUA" | "POBO"
  pageName: string;      // "CÁ" | "DỪA" | "PỜ BƠ"
  customer: string;
  reader: string;
  service: string;       // "Tarot" | "Custom" | ...
  package: string;       // "1 CS" | ...
  packageDisplay: string; // "1CS TA" (abbreviated for output)
  price: number;         // unit: k (thousands VND)
  note: string;
  timestamp: string;     // ISO
}
```

---

## 7. Output Format

### Tất cả page — format thống nhất (không icon trang)
```
1CS TA - 20k 🔵Phương Thảo @Dương Thư Trâm
7CS TA - 115k 🟣Tuyet Nhii @Nguyễn Nguyên
[CÁ] CS TA - 50k 🔵Khách Test @Reader1
3CS TA - 55k 🟣Khách IG @Reader2
```

**Chỉ CÁ có prefix `[CÁ]`** để phân biệt với DỪA. BƠ + DỪA dùng format đơn giản.

---

## 8. Module Pattern

```javascript
(function () {
  "use strict";
  const T = window.TQS;

  function myFunction() { /* ... */ }

  // Export public API
  T.moduleName = { myFunction };
})();
```

---

## 9. Code Change Checklist

- [ ] No framework / build tool
- [ ] Pricing from `price.json`, page IDs from `config.json`
- [ ] Storage writes via `T.storage.syncSave()`
- [ ] New DOM elements use `DocumentFragment`
- [ ] Cross-tab sync handled in `storage.js`
- [ ] CSS uses variables from `:root`
- [ ] UI text in Vietnamese
- [ ] Export API via `T.moduleName = { ... }`
- [ ] New module → update `manifest.json` JS array
- [ ] Test: reload extension on `chrome://extensions`

---

## 10. Quick Checks

```bash
# Syntax check all modules
for f in content/*.js; do node -c "$f" && echo "✅ $f"; done

# CSS brace balance
echo "{ $(grep -c '{' content.css)  } $(grep -c '}' content.css)"

# Cross-module refs
grep -rn "T\.\w\+ = {" content/*.js  # View exports
grep -rn "T\.\w\+\.\w\+" content/*.js  # View cross-calls
```

---

## 11. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt+T` | Toggle panel |
| `Alt+C` | Quick Copy & Save |
| `Alt+1..9` | Select package by index |

---

## 12. Known Limitations

- FB Business Suite is a SPA → panel uses **URL polling 2s** + **MutationObserver** to detect changes
- Facebook frequently changes DOM → detection selectors may need updates
- `config.json` must exist before loading extension
- Schedule only supports format: `8h - 14h @Reader1 @Reader2`
- Manual override = one-time pick, does not consume a rotation turn
