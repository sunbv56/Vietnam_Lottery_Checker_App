# 🎫 Vietnam Lottery AI (LotteryAI) - Trợ Lý Dò Vé Số Thông Minh

Ứng dụng web cao cấp giúp tự động hóa việc kiểm tra vé số Việt Nam bằng sức mạnh của **Google Gemini 2.0 Flash**. Không còn phải đối chiếu từng con số thủ công, tất cả những gì bạn cần là một bức ảnh.

[![Deploy on Fly.io](https://img.shields.io/badge/Deploy-Fly.io-blueviolet?style=for-the-badge&logo=fly.io)](https://vietnam-lottery-checker-app.fly.dev/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-orange?style=for-the-badge&logo=pwa)](https://vietnam-lottery-checker-app.fly.dev/)

---

## ✨ Tính năng đột phá

- **🤖 OCR Đa Model (Gemini AI)**: Tự động nhận diện Tỉnh/Thành, Ngày mở thưởng và Dãy số từ ảnh. Hỗ trợ cơ chế Fallback thông minh giữa các đời model Gemini (2.0 Flash, 1.5 Flash, 2.0 Flash-Lite) để đảm bảo độ chính xác cao nhất.
- **⚡ Kiểm tra kết quả tức thì**: Tự động thu thập (cào) dữ liệu từ nguồn uy tín (Minh Ngọc) ngay khi có thông tin vé.
- **📊 Thống kê & Tài chính**: Theo dõi tổng số tiền trúng thưởng, số vé đã quét và tỉ lệ may mắn qua bảng dashboard trực quan.
- **📱 Trải nghiệm PWA (Progressive Web App)**: Cho phép cài đặt ứng dụng lên màn hình chính điện thoại như một app thực thụ, hỗ trợ offline cache cơ bản và tốc độ load cực nhanh.
- **📸 Quét Camera Chuyên dụng**: Tích hợp trình quét camera trực tiếp trên trình duyệt với khả năng chuyển đổi camera trước/sau, tối ưu cho việc quét vé bằng điện thoại.
- **✏️ Chỉnh sửa thủ công (Interactive Edit)**: Cho phép người dùng chỉnh sửa thông tin AI nhận diện sai trước khi thực hiện đối soát với nhà đài.
- **🔐 Bảo mật & Riêng tư**: Hỗ trợ sử dụng API Key cá nhân. Key được lưu trữ an toàn trong LocalStorage của trình duyệt, server hoàn toàn stateless và không lưu giữ bất kỳ thông tin nhạy cảm nào.
- **🎨 Giao diện Premium**: Thiết kế phong cách Glassmorphism hiện đại, hỗ trợ Dark Mode và các hiệu ứng micro-interaction mượt mà.

---

## 🛠️ Công nghệ sử dụng

- **Backend**: Python, Flask, BeautifulSoup4 (Scraping), Google Generative AI SDK.
- **Frontend**: HTML5, TailwindCSS, JavaScript (ES6+).
- **AI**: Google Gemini Pro Vision / Gemini 2.0 Flash.
- **Deployment**: Docker, Fly.io.
- **PWA**: Service Workers, Web Manifest.

---

## 🚀 Hướng dẫn cài đặt

### Chạy cục bộ (Local Development)

1. **Clone repository:**
   ```bash
   git clone https://github.com/sunbv56/Vietnam_Lottery_Checker_App.git
   cd Vietnam_Lottery_Checker_App
   ```

2. **Cài đặt môi trường:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Cấu hình API Key:**
   Tạo file `.env` tại thư mục gốc:
   ```env
   GEMINI_API_KEY=your_google_ai_studio_api_key
   ```

4. **Khởi chạy:**
   ```bash
   python app.py
   ```
   Ứng dụng sẽ chạy tại `http://localhost:5000`. Hệ thống cũng sẽ hiển thị địa chỉ IP LAN để bạn truy cập từ điện thoại trong cùng mạng WiFi.

---

## 📱 Sử dụng trên điện thoại

Để có trải nghiệm tốt nhất, hãy truy cập link ứng dụng trên trình duyệt Chrome (Android) hoặc Safari (iOS), sau đó chọn **"Thêm vào màn hình chính" (Add to Home Screen)** để cài đặt ứng dụng.

---

## 🔐 Chính sách bảo mật API Key

Chúng tôi coi trọng quyền riêng tư của bạn:
1. **Stateless Processing**: Server không lưu trữ API Key vào cơ sở dữ liệu hay file log.
2. **Local Storage**: Nếu bạn nhập API Key cá nhân trong phần cài đặt, nó chỉ được lưu tại trình duyệt của chính bạn.
3. **Transmission**: API Key chỉ được gửi kèm trong request HTTPS để gọi model AI và bị hủy ngay sau khi request kết thúc.

---

## 📝 Lưu ý

- Độ chính xác của việc nhận diện phụ thuộc vào ánh sáng và độ sắc nét của ảnh chụp.
- Hiện tại ứng dụng tối ưu nhất cho các đài miền Nam và miền Trung (vé 6 chữ số).
- Kết quả chỉ mang tính chất tham khảo, vui lòng đối chiếu lại với đại lý vé số chính thức trước khi lĩnh thưởng.

---

## 🤝 Đóng góp

Mọi ý kiến đóng góp hoặc báo lỗi vui lòng mở **Issue** hoặc gửi **Pull Request**. Chúng tôi luôn hoan nghênh sự giúp đỡ của cộng đồng!

---
*Phát triển bởi [sunbv56](https://github.com/sunbv56) với tình yêu dành cho công nghệ và sự may mắn!* 🍀