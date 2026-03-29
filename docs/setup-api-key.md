# 🔑 Hướng dẫn lấy API Key Google Gemini

API Key dùng để kết nối tính năng **AI Chat** trong Tarot QuickSale với Google Gemini.

> **Hoàn toàn miễn phí** — Google cung cấp quota free cho Gemini API.

---

## Bước 1 — Truy cập Google AI Studio

1. Mở trình duyệt → vào **[aistudio.google.com/apikey](https://aistudio.google.com/apikey)**
2. Đăng nhập bằng tài khoản Google của bạn (Gmail)

---

## Bước 2 — Tạo API Key

1. Bấm nút **Create API Key** (Tạo API Key)
2. Chọn **Create API key in new project** (hoặc chọn project có sẵn)
3. Đợi vài giây → API Key hiện ra dạng:
   ```
   AIzaSyC_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
4. Bấm **Copy** để sao chép

> ⚠️ **Quan trọng:** Giữ API Key bí mật, không chia sẻ công khai. Nếu bị lộ, vào lại trang trên để xóa và tạo key mới.

---

## Bước 3 — Nhập vào Tarot QuickSale

1. Mở [business.facebook.com](https://business.facebook.com) → panel QuickSale hiện ra
2. Bấm nút **✦** trên header panel (hoặc nhấn **Alt + A**) để mở AI Chat
3. Bấm **⚙️** (biểu tượng cài đặt) trên header AI Chat
4. Paste API Key vào ô **"Paste Google Gemini API Key..."**
5. Bấm **Lưu**
6. Thấy thông báo **"✓ API Key đã lưu!"** → ✅ Xong!

---

## Bước 4 — Kiểm tra

1. Paste một tin nhắn khách hàng mẫu vào ô chat, ví dụ:
   ```
   Em muốn xem tình cảm với người yêu ạ, em với anh ấy đang có vấn đề,
   em muốn biết anh ấy có còn yêu em không, và tương lai 2 người thế nào ạ
   ```
2. Nhấn **Enter** hoặc bấm nút gửi
3. AI sẽ trả về phân tích dạng:
   ```
   📝 TÓM TẮT
   Khách muốn xem tình cảm, đang gặp vấn đề với người yêu.

   📊 PHÂN TÍCH (3 câu hỏi)
   1. Anh ấy có còn yêu em không?
   2. Tình cảm 2 người đang có vấn đề gì?
   3. Tương lai 2 người sẽ thế nào?

   🏷️ CHỦ ĐỀ: Tình cảm
   ```

Nếu thấy kết quả tương tự → API Key hoạt động tốt! 🎉

---

## Câu hỏi thường gặp

### API Key có mất phí không?

**Không.** Google Gemini API có quota miễn phí:
- **Gemini 2.5 Flash**: 500 requests/ngày (free tier)
- Đủ dùng cho cả ngày sale bình thường

### API Key lưu ở đâu?

Lưu trong **chrome.storage.local** (bộ nhớ cục bộ của trình duyệt). API Key:
- ❌ Không lưu vào file nào trong thư mục extension
- ❌ Không gửi đi đâu ngoài Google Gemini API
- ❌ Không xuất hiện trong source code
- ✅ Chỉ nằm trong trình duyệt Chrome của bạn

### Đổi máy tính thì sao?

Cần nhập lại API Key trên máy mới. Key cũ vẫn dùng được — chỉ cần paste lại.

### Muốn xóa API Key?

1. Mở AI Chat → ⚙️ Settings
2. Xóa trắng ô API Key → bấm Lưu

Hoặc vào [aistudio.google.com/apikey](https://aistudio.google.com/apikey) → xóa key và tạo key mới.

### AI trả lời sai / bịa câu hỏi?

1. Mở ⚙️ Settings trong AI Chat
2. **Tắt** toggle "Gửi ngữ cảnh" → mỗi tin nhắn sẽ được phân tích riêng biệt
3. Model đã được cấu hình `temperature: 0.2` (rất thấp) để giảm bịa đặt

---

## Tóm tắt nhanh

```
1. Vào aistudio.google.com/apikey → Create API Key → Copy
2. Mở QuickSale → bấm ✦ → bấm ⚙️ → Paste key → Lưu
3. Paste tin nhắn khách → Enter → Xem kết quả AI
```

---

[← Quay lại README](../README.md)
