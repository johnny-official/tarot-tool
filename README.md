# 🔮 Tarot QuickSale — Công cụ chốt đơn nhanh

> Extension Chrome giúp nhân viên sale Tarot **copy tin nhắn chuẩn format** chỉ trong 1 click trên Facebook Business Suite.

---

## ✨ Tính năng

- 🎯 **Chốt đơn siêu nhanh** — Chọn dịch vụ → chọn gói → bấm Copy → xong
- 🔍 **Tự nhận diện fanpage** — Tự biết đang ở Bơ, Dừa hay Cá từ URL
- 🔵🟣 **Phân biệt FB / Instagram** — Tự detect khách từ Facebook (🔵) hay Instagram (🟣)
- 👤 **Tự điền tên khách** — Lấy tên từ cuộc hội thoại, không cần gõ tay
- 🔄 **Tự xoay Reader** — Mỗi đơn tự chuyển sang reader kế tiếp
- 📅 **Lịch ca tự động** — Paste lịch ca → tự gán reader theo giờ
- 📊 **Dashboard + Báo cáo** — Đếm đơn, tính tiền, xuất báo cáo ca

---

## 📦 Cài đặt (từng bước)

### Bước 1: Tải code về
```bash
git clone https://github.com/YourUsername/tarot-tool.git
```
Hoặc bấm nút **Code → Download ZIP** trên GitHub, rồi giải nén.

### Bước 2: Cài vào Chrome

1. Mở Chrome → gõ `chrome://extensions` vào thanh địa chỉ → Enter
2. Bật **Developer mode** (Chế độ nhà phát triển) ở góc trên bên phải
3. Bấm **Load unpacked** (Tải tiện ích đã giải nén)
4. Chọn thư mục `tarot-tool` vừa tải về
5. Extension sẽ xuất hiện với icon 🔮

### Bước 3: Mở Facebook Business Suite

1. Vào [business.facebook.com](https://business.facebook.com)
2. Chọn **Hộp thư** (Inbox) của fanpage
3. Panel 🔮 QuickSale sẽ tự hiện ở góc phải

> **Mẹo:** Bấm `Alt + T` để ẩn/hiện panel nhanh.

---

## 🚀 Hướng dẫn sử dụng

### Chốt đơn (Copy tin nhắn)

1. Mở cuộc hội thoại với khách trên FB Business Suite
2. Panel sẽ tự **nhận diện fanpage** và **điền tên khách**
3. Chọn **loại bài** → chọn **gói** → giá tự hiện
4. Bấm **📋 Copy & Lưu**
5. Paste vào group chat!

### Output mẫu

**Page Bơ (Pờ Bơ):**
```
1CS TA - 20k 🔵Phương Thảo @Dương Thư Trâm
7CS LENOR - 145k 🟣Tuyet Nhii @Nguyễn Nguyên
```

**Page Cá:**
```
🐟[CÁ] CS TA - 20k 🔵Khách Hàng @Vănn Tài
```

**Page Dừa:**
```
🥥[DỪA] 3CS TA - 55k 🟣Khách IG @Ngọc Phan
```

- 🔵 = Khách từ **Facebook**
- 🟣 = Khách từ **Instagram**

---

### Quản lý Reader

**Thêm reader:** Gõ tên vào ô `Gõ tên → Enter` và nhấn Enter.

**Chọn reader tay:** Bấm vào chip tên reader. Đơn tiếp theo sẽ tự quay lại xoay vòng.

**Tự xoay:** Bật toggle 🔄 → mỗi đơn copy xong tự chuyển sang reader kế tiếp.

---

### 📅 Paste Lịch Ca

Bấm nút **📅** → paste lịch ca vào → bấm **Cập nhật**.

**Ví dụ lịch ca từ thông báo của quản lý:**

```
🎀🎀 CA LÀM VIỆC 🎀🎀
✨Ca Sáng: 9h - 11h : @Vănn Tài
✨Ca Sáng: 11h - 13h : @Ngọc Phan
✨Ca Chiều: 13h - 15h : @Tùng Yến
✨Ca Chiều: 15h - 17h : @Hương Ly
✨Ca Tối: 17h - 19h :  @Dương Thư Trâm
✨Ca Tối: 19h - 21h : @Dương Thư Trâm  @NP Quin's Cky
✨Ca Đêm: 21h - 23h : @An Du Trân @NP Quin's Cky
✨Ca Đêm : 23h - 2h : @Hà Vi
```

**Chỉ cần copy paste nguyên lịch** → extension tự parse ra:
- Ca nào, giờ nào, reader nào
- Nhiều reader 1 ca cũng được (tự xoay trong ca)
- Ca đêm qua ngày (23h - 2h) cũng hiểu

> **Lưu ý:** Tên reader phải có `@` ở trước. VD: `@Hà Vi`, `@Ngọc Phan`

---

### 📊 Báo cáo ca

- Bấm **📋** ở header → copy báo cáo ca chi tiết (đơn, tiền, reader)
- Bấm **🔄** ở header → reset ca mới (lịch sử tự lưu)

---

## ⚙️ Cấu hình

### Thay đổi giá dịch vụ

Sửa file `price.json` → reload extension.

```json
{
  "POBO": {
    "name": "PỜ BƠ",
    "icon": "🧈",
    "services": {
      "Tarot": {
        "1 Y/N": 9,
        "1 CS": 20,
        "3 CS": 55,
        "5 CS": 85,
        "7 CS": 115
      }
    }
  }
}
```

### Thêm/sửa fanpage

Sửa file `config.json`:

```json
{
  "pages": {
    "POBO": { "fbPageId": "918768421315641", "name": "PỜ BƠ" },
    "DUA":  { "fbPageId": "513140915211900", "name": "DỪA" },
    "CA":   { "fbPageId": "105889999207829", "name": "CÁ" }
  }
}
```

**Cách tìm Page ID:** Mở fanpage trên FB Business Suite → nhìn URL → copy số sau `asset_id=`.

---

## 🔧 Cập nhật Extension

Sau khi sửa code hoặc file JSON:

1. Mở `chrome://extensions`
2. Tìm **Tarot QuickSale**
3. Bấm nút 🔄 (Reload)
4. Refresh lại trang Facebook Business Suite

---

## ❓ Câu hỏi thường gặp

**Q: Panel không hiện?**
→ Kiểm tra đang ở `business.facebook.com`. Bấm `Alt+T` hoặc click icon 🔮 trên toolbar.

**Q: Giá không đúng?**
→ Sửa `price.json` → reload extension trên `chrome://extensions`.

**Q: Không nhận diện được fanpage?**
→ Kiểm tra `config.json` có đúng Page ID. Nhìn URL có `asset_id=...` khớp với ID trong config.

**Q: Copy ra icon 🟣 (tím) thay vì 🔵 (xanh)?**
→ Extension detect từ vùng chat. Nếu sai, check lại cuộc hội thoại có phải từ Instagram không.

---

## 📱 Liên hệ & Hỗ trợ

Mọi thắc mắc, góp ý, hoặc báo lỗi:

- 💬 **Telegram:** [@johnnyvv](https://t.me/johnnyvv)
- 📘 **Facebook:** [Johnny Vu](https://facebook.com)

---

## 📄 License

MIT — Thoải mái sử dụng và chỉnh sửa.
