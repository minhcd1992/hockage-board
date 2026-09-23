# Cấu trúc và độ trễ nét bút

## Các phần chính

- `app/page.tsx`: màn hình bảng, thanh công cụ và danh sách tab. Mỗi tab giữ một `CanvasBoard` được mount; tab không chọn được ẩn bằng CSS.
- `store/useBoardStore.ts`: Zustand quản lý công cụ, màu, độ dày, camera và tab. Khi chuyển tab, lưu/khôi phục zoom, pan, nền của tab.
- `components/CanvasBoard.tsx`: kết nối input với engine; xử lý bút, highlight, laser, tẩy, hình, chữ, chọn/biến đổi, clipboard, cuộn, zoom, nhập tài liệu và xuất PDF.
- `input/PointerManager.ts`: pointer events, mẫu gộp (`getCoalescedEvents`), tọa độ tương đối, áp lực và pinch.
- `engine/Camera.ts`: chuyển tọa độ màn hình/thế giới, áp dụng zoom và DPR. `CanvasRenderer.ts` quản lý ba canvas: nền, đối tượng đã chốt và nét/đối tượng đang vẽ. `RenderLoop.ts` chạy requestAnimationFrame. `Scene.ts` giữ đối tượng, selection, clipboard và lịch sử undo/redo. `FloodFill.ts` hỗ trợ xử lý vùng ảnh.
- `objects/`: nét bút, hình học, chữ, ảnh và trang PDF; dùng chung giao diện `BoardObject` trong `types/` cho vẽ, hit test và biến đổi.
- `lib/pdfLoader.ts`: đọc PDF và tạo các trang `PdfObject`. HTML và bài giảng được hiển thị bằng iframe dưới lớp chú thích.
- `app/lesson/`: bài giảng/bài tập MDX. `components/lesson/` chứa khối nội dung, công thức và câu hỏi tương tác; `components/simulations/` chứa mô phỏng vật lý. Một số mô phỏng chạy animation/timer riêng.
- `next.config.ts`, `mdx-components.tsx`: tích hợp MDX, remark-math và KaTeX. `public/` chứa tài nguyên tĩnh; `scratch/` chủ yếu chứa script chuyển đổi nội dung và kiểm tra.

## Luồng nét bút

Pointer → các mẫu tọa độ/áp lực → đổi sang tọa độ thế giới → `Stroke.points` → canvas draft. Khi nhấc bút, nét được chốt, đưa vào Scene/history và vẽ trên canvas main bằng perfect-freehand. React/Zustand quản lý giao diện; không cần cập nhật React state cho từng điểm bút.

## Điểm phát hiện và sửa

1. Trước đây `pointermove` chỉ thêm điểm; phải đợi render loop mới vẽ. Bản sửa gọi chung bộ vẽ tăng dần ngay ở pointerdown/pointermove, vẫn giữ đường dự phòng trong render loop. Chỉ đoạn mới được gửi tới canvas, không vẽ lại toàn bộ nét trong mỗi sự kiện. Điều này bỏ bước chờ ở phía ứng dụng; trình duyệt vẫn quyết định lúc đưa canvas lên màn hình.
2. Comment cũ nói đường viền hoàn thiện chỉ tính một lần, nhưng thực tế mỗi `renderMain()` gọi lại perfect-freehand cho mọi nét. Bản sửa cache `Path2D`, làm mới khi thêm điểm, thay mảng điểm, đổi độ dày, đổi tỷ lệ render hoặc dịch chuyển. Đổi màu dùng lại hình học. Nếu sau này sửa trực tiếp tọa độ trong `points`, cần bổ sung invalidation cho đường sửa đó.
3. Đọc `getBoundingClientRect()` một lần cho mỗi batch input, thay vì từng mẫu bút. Bỏ qua pointer khác khi đang vẽ.
4. Tab ẩn bỏ qua công việc trong callback render loop. Việc này chưa dừng animation của các mô phỏng bên trong iframe.

Không thay đổi smoothing của nét hoàn thiện, cấu hình compositor hay độ phân giải canvas khi chưa có đo đạc. Bút highlight vẫn dùng cách tô tăng dần cũ: phần nối có thể đậm hơn trong lúc kéo do alpha chồng nhau.

## Giới hạn kết luận về Google Meet

Các điểm trên được xác nhận từ mã nguồn. Chưa có đo đạc CPU/GPU, trace trình duyệt hoặc kiểm thử trong cuộc họp để quy toàn bộ khoảng cách con trỏ–nét cho một nguyên nhân. Độ trễ trên màn hình người viết và độ trễ trên màn hình người xem cần được phân biệt. Bản sửa không bảo đảm loại bỏ độ trễ của capture/truyền hình hoặc driver bút.

## Kiểm tra

- `npx.cmd tsc --noEmit --incremental false`: đạt.
- `node scratch/check-ink.cjs`: đạt; kiểm tra cache reuse/invalidation, áp lực, tọa độ coalesced, số lần đọc layout và pointer khác. Đây là kiểm tra logic với canvas giả lập, không phải kiểm tra hiển thị trong trình duyệt.
- ESLint ba file sửa: không thêm lỗi; CanvasBoard vẫn có 43 lỗi tồn tại trước bản sửa.
- Cần thử bằng bút thật: bảng trống và bảng nhiều chữ; nét dài nhanh và nét ngắn liên tiếp; tap, highlight, zoom, dịch chuyển nét, undo/redo; viết trên PDF và bài giảng. So sánh khi Meet tắt/bật chia sẻ và phân biệt màn hình người viết/người xem. Dùng cùng trình duyệt, kích thước cửa sổ và mức zoom giữa hai bản.
