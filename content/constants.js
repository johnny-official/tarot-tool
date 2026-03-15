// ===== TAROT QUICKSALE — CONSTANTS & ABBREVIATIONS =====
// Edit this file to change output text, abbreviations, emojis.
// No logic here — pure data.

(function () {
  "use strict";
  const T = window.TQS;

  // Service name → abbreviation in output message
  T.SERVICE_ABBR = {
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
  };

  // Package name → abbreviation in output message
  T.PACKAGE_ABBR = {
    "Y/N": "Y/N",
    "CS Tarot": "CS",
    "CS Đặc Biệt": "ĐB",
    "1 Y/N": "1Y/N",
    "1 CS": "1CS",
    "3 CB": "3CB",
    "6 CB": "6CB",
    "3 CS": "3CS",
    "4 CS": "4CS",
    "5 CS": "5CS",
    "6 CS": "6CS",
    "7 CS": "7CS",
    Tarot: "TA",
    Lenormand: "LENOR",
    "Bài Tây": "TÂY",
    "30 Phút": "30p",
    "45 Phút": "45p",
    "60 Phút": "60p",
    "+ Lenormand": "+LENOR",
    "+ Bài Tây": "+TÂY",
  };

  // Platform emoji for POBO output
  T.SOURCE_EMOJI = {
    facebook: "🔵",
    instagram: "🟣",
  };
})();
