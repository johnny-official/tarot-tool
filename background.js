// ===== TAROT QUICKSALE — BACKGROUND SERVICE WORKER =====
// Minimal: only handles extension icon click → toggle panel.

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { action: "togglePanel" });
});
