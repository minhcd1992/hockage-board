# Thuộc tính và cursor công cụ

- Phím tắt và nút bấm đều gọi `setTool`: đổi công cụ, thoát sửa đối tượng, khôi phục thuộc tính riêng và cập nhật biểu tượng hình khối trong một lần cập nhật store.
- Mỗi công cụ nhớ màu, độ dày, kiểu nét, tô nền, hai đầu mũi tên, tham số sóng sin và font/cỡ chữ. Thiết lập được giữ khi đổi công cụ hoặc tab trong phiên hiện tại; chưa lưu qua lần tải lại trang.
- Thanh thuộc tính hiển thị tên công cụ hiện tại. Thuộc tính hai đầu chỉ hiện cho mũi tên; tô nền khi vẽ chỉ hiện cho chữ nhật và ellipse.
- Cursor bút/bút nhớ theo màu và cỡ nét; tẩy có biểu tượng riêng; hình dùng dấu cộng; chữ dùng con trỏ nhập văn bản; bàn tay dùng grab/grabbing. Cursor tạm khi kéo/chọn được khôi phục khi thả, hủy hoặc chuyển công cụ.
- Phím tắt không can thiệp khi nhập văn bản hoặc thao tác select. Thanh thuộc tính xuống dòng sẽ tự cập nhật kích thước canvas.

Kiểm tra: `node scratch/check-tool-settings.cjs`; `node scratch/check-tool-ux-browser.cjs` (production server cổng 3100 và Chrome CDP cổng 9333). Browser test bao gồm A → vẽ → L, Pen đỏ nét 1 ↔ chữ nhật xanh nét 2, sửa đối tượng rồi đổi công cụ, cursor và pan bằng nút chuột giữa.
