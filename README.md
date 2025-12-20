# 🎫 Kiểm Tra Vé Số Việt Nam AI (Vietnam Lottery Checker)

Ứng dụng web hiện đại giúp bạn dò vé số Việt Nam tự động bằng công nghệ AI đỉnh cao từ **Google Gemini 2.5 Flash**. Không còn phải căng mắt đối chiếu từng con số, chỉ cần chụp ảnh hoặc tải lên, hệ thống sẽ làm phần còn lại!

## ✨ Tính năng nổi bật

- **🤖 OCR Thông minh**: Sử dụng Gemini 2.5 Flash để nhận diện Tỉnh/Thành, Ngày mở thưởng và dãy số trúng thưởng cực kỳ chính xác.
- **🔄 Cập nhật thời gian thực**: Tự động cào kết quả từ nguồn uy tín (Minh Ngọc) theo đúng ngày và đài trên vé.
- **📱 Đa thiết bị**: Hỗ trợ truy cập qua mạng LAN/WiFi, cho phép bạn sử dụng điện thoại làm máy quét.
- **📸 Camera & Drag-and-Drop**: Hỗ trợ chụp ảnh trực tiếp từ trình duyệt hoặc kéo thả ảnh có sẵn.
- **🎨 Giao diện cao cấp**: Thiết kế Glassmorphism hiện đại, tối ưu trải nghiệm người dùng.

## 🌐 Demo Trực Tuyến

Bạn có thể trải nghiệm ngay ứng dụng tại: [https://vietnam-lottery-checker-app.fly.dev/](https://vietnam-lottery-checker-app.fly.dev/)

## 🛠️ Yêu cầu hệ thống

- Python 3.8+
- API Key từ [Google AI Studio](https://aistudio.google.com/)

## 🚀 Hướng dẫn cài đặt

1. **Clone project hoặc tải về máy.**
2. **Cài đặt các thư viện cần thiết:**
   ```bash
   pip install -r requirements.txt
   ```
3. **Cấu hình API Key:**
   - Tạo file `.env` (hoặc sửa file có sẵn) trong thư mục gốc.
   - Thêm dòng sau:
     ```env
     GEMINI_API_KEY=your_api_key_here
     ```

## 💻 Cách sử dụng

1. **Chạy server:**
   ```bash
   python app.py
   ```
2. **Truy cập ứng dụng:**
   - Trên máy tính: `http://localhost:5000`
   - Trên điện thoại: Terminal sẽ hiển thị địa chỉ IP LAN của bạn (ví dụ: `http://192.168.1.15:5000`). Hãy đảm bảo điện thoại và máy tính dùng chung mạng WiFi.

3. **Dò vé số:**
   - Nhấn "Mở Camera" đi quét trực tiếp hoặc kéo thả ảnh vé số vào vùng quy định.
   - Chờ AI xử lý trong vài giây.
   - Xem kết quả trúng thưởng hiển thị ngay trên màn hình.

## 📝 Lưu ý quan trọng
- Để sử dụng Camera trên điện thoại qua địa chỉ IP, một số trình duyệt có thể yêu cầu thiết lập tin cậy hoặc sử dụng HTTPS. Tuy nhiên, hầu hết các mạng nội bộ vẫn cho phép thực hiện quyền này qua HTTP.
- Độ chính xác của OCR phụ thuộc vào chất lượng ảnh chụp (ánh sáng, độ nét).

## 🧰 Công nghệ sử dụng
- **Backend:** Flask, Python
- **Frontend:** HTML5, TailwindCSS, JavaScript
- **AI:** Google Gemini 2.5 Flash
- **Data Source:** Minh Ngọc Result Service

---
*Chúc bạn may mắn và trúng giải Đặc biệt!* 🍀