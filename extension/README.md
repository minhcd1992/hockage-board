# Hockage Ink Overlay — bản thử độc lập

Lớp vẽ nằm trong iframe thuộc origin extension, có HTML/CSS/JS riêng. Content script chỉ gắn hoặc ẩn iframe; không gọi engine, store hay React của trang bảng. Cách này tách ngữ cảnh vẽ khỏi trang; không bảo đảm trình duyệt cấp renderer process riêng hoặc loại bỏ độ trễ GPU/driver/chia sẻ màn hình.

## Cài và thử trên Chrome/Edge

1. Mở `chrome://extensions` (Edge: `edge://extensions`), bật **Developer mode**.
2. Chọn **Load unpacked**, chọn thư mục `D:\Board\hockage-board\extension`.
3. Mở trang bảng Vercel hoặc một trang HTTP/HTTPS khác. Bấm biểu tượng Hockage Ink, chọn **Bật / ẩn lớp vẽ**.
4. Viết bằng bảng vẽ rời. Dùng Esc/Ẩn để quay lại tương tác trang; bật lại qua biểu tượng extension để giữ các nét cũ.
5. So sánh cùng kích thước cửa sổ, cùng trang, cùng bảng vẽ: bút trong web và bút extension; lặp lại khi share Meet. Bút extension có thanh **Ink riêng**, mặc định màu đỏ.

Không cần deploy lại Vercel để thử extension. Không cần quyền đọc mọi trang: chỉ xin activeTab và scripting khi người dùng bấm. Không gửi dữ liệu ra mạng. Tham khảo cách cài: https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world

## Phạm vi bản thử

- Bút độ rộng cố định, tẩy, chọn màu/độ dày, hoàn tác, xóa hết; raw events nếu có, pointermove fallback và Ink API nếu có.
- Nét bám theo **khung nhìn**, không bám nội dung khi cuộn trang. Resize giữ tọa độ CSS cũ. Ẩn lớp vẽ ẩn cả nét; bật lại giữ nét.
- Nét chỉ nằm trong bộ nhớ extension frame của tab; reload/chuyển trang làm mất nét. Chưa đồng bộ với undo/save/export PDF của project.
- Không dùng trên trang nội bộ trình duyệt, Chrome Web Store hoặc PDF viewer được trình duyệt bảo vệ. PDF/bài giảng hiển thị bên trong trang bảng HTTP/HTTPS có thể được phủ lớp vẽ.
- Bản thử này chưa tự tạm dừng mô phỏng của trang bên dưới. Trình duyệt vẫn quyết định scheduling và compositing. Không coi việc extension chạy được là bằng chứng đã hết lag Meet.

Đây là phép so sánh để quyết định có tích hợp tiếp hay không. Nếu lớp extension cũng trễ như web, đổi engine Canvas lần nữa chưa có căn cứ; cần đo trên máy/bảng vẽ thực tế hoặc đánh giá ứng dụng overlay native.
