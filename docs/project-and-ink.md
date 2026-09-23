# Project và engine bút capsule-v1

## Cấu trúc

- `app/page.tsx`: thanh công cụ và các tab bảng; `store/useBoardStore.ts`: công cụ, màu, kích thước, zoom/pan, tab.
- `components/CanvasBoard.tsx`: điều phối input, camera, tài liệu, clipboard và xuất PDF. Mỗi bảng có canvas nền, main chứa đối tượng đã chốt và draft chứa nét đang viết.
- `engine/Scene.ts`: đối tượng/history/selection; `Camera.ts`: đổi tọa độ màn hình/thế giới; `objects/`: nét, hình, chữ, ảnh và trang PDF.
- `app/lesson/`: MDX bài giảng/bài tập; `components/lesson/`: khối nội dung và câu hỏi; `components/simulations/`: mô phỏng. Bài giảng nằm trong iframe dưới lớp chú thích.

## Vì sao thay engine

Hai lần sửa trước vẫn không giải quyết trải nghiệm trên bảng vẽ rời, kể cả bảng trống; bài giảng lag nặng hơn. TypeScript, kiểm tra chức năng canvas và CPU throttle không chứng minh được độ trễ con trỏ–màn hình trong Google Meet. Bản này thay phần hình học và vòng đời nét, đồng thời giảm tải mô phỏng.

## Luồng mới

1. `PointerManager` nhận mẫu thực từ raw/coalesced events, dùng pointermove nếu không có raw. Không ghi trùng hai luồng. Mất capture, blur hoặc pointercancel hủy thao tác.
2. `InkGeometry` nối mẫu bằng các đoạn đầu tròn, độ rộng theo áp lực. Mỗi đoạn kết thúc đúng tọa độ đã đo; không chờ mẫu tương lai để làm mượt, không lọc tọa độ khiến đầu nét chạy sau.
3. `LiveInk` trực tiếp vẽ phần mới trên draft. Bút không đi qua React state hay vòng requestAnimationFrame chung. Highlight vẽ opaque rồi áp opacity một lần lên lớp để tránh nối nét đậm.
4. Khi nhấc bút, `Stroke` dùng cùng hình học lúc viết, không đổi nét qua perfect-freehand. `commitStroke` chỉ thêm nét mới lên main, không xóa/vẽ lại scene. Undo/redo, camera và sửa đối tượng vẫn dùng full render.
5. Cache hình học ở tọa độ thế giới nên zoom không cần dựng lại đường viền. Copy giữ đúng highlight; bounding box/hit test tính độ rộng highlight.
6. Nếu có Ink API, đăng ký `navigator.ink.requestPresenter` và cập nhật điểm cuối đã vẽ bằng sự kiện thật. Trình duyệt/hệ thống có thể vẽ tiếp đầu nét giữa những lần ứng dụng nhận event. Không có API hoặc API lỗi thì dùng canvas. Không yêu cầu bật experimental flags.

Đã bỏ `InkPrediction` và việc chép/khôi phục vùng pixel dự đoán; không lưu điểm giả. Nét giữ áp lực nhưng kiểu nét có thể khác cách làm mượt cũ vì không dùng perfect-freehand nữa. Dependency chưa gỡ để tránh thay lockfile không cần thiết.

Tham khảo: [Ink API](https://wicg.github.io/ink-enhancement/), [Chrome: desynchronized canvas](https://developer.chrome.com/blog/desynchronized). Đây là progressive enhancement: API tồn tại chưa bảo đảm mọi tổ hợp trình duyệt/driver/GPU có cùng đường hiển thị nhanh hoặc cùng kết quả trong video chia sẻ màn hình.

## Giảm tải bài giảng

`lib/lessonAnimation.ts` quản lý riêng RAF của mô phỏng, không monkey-patch API toàn cục. Khi viết hoặc tab bài giảng bị ẩn, iframe nhận trạng thái từ đúng parent cùng origin và dừng animation. Nhấc bút thì tiếp tục. Đồng hồ mô phỏng trừ thời gian tạm dừng để không nhảy trạng thái. CSS animation cũng tạm dừng; interval đồng hồ tốc độ bỏ cập nhật khi paused. Vòng render bảng ẩn được dừng.

Đánh đổi có chủ ý: mô phỏng đứng hình trong thời gian đặt bút, rồi tiếp tục. Áp dụng bài giảng/bài tập của project, không can thiệp HTML bên ngoài.

## Chẩn đoán bản deploy

Thêm `?inkDebug=1` vào URL trang bảng rồi viết vài nét:

- `engine: capsule-v1`: xác nhận đang chạy engine mới.
- `inputType`: driver gửi `pen` hay giả lập `mouse`.
- `inputEvent`: raw hay pointermove fallback.
- `nativeInk`, `nativeUpdates`: API khởi tạo được và số lần gọi thành công; không phải phép đo native trail đã xuất hiện trên màn hình.
- `maxInputAgeMs`: tuổi event khi handler vẽ bắt đầu.
- `maxDrawMs`: thời gian JS gửi lệnh vẽ một batch, không bao gồm toàn bộ GPU/compositor/màn hình/Meet.

Các số max tính từ lúc mount bảng. Chế độ mặc định không có panel hoặc timer cập nhật panel.

## Kiểm thử

- Production build và TypeScript đạt. KaTeX còn cảnh báo sẵn có từ nội dung bài giảng.
- ESLint không tăng lỗi/cảnh báo ở các file sửa; ba module mới không có lỗi/cảnh báo.
- `node scratch/check-ink.cjs`: cache world-space, raw/move không trùng, fallback, cancellation, clone/bounds highlight, scheduler dừng/tiếp tục và loại trừ thời gian pause.
- `node scratch/check-ink-browser.cjs mouse` và `node scratch/check-ink-browser.cjs pen lesson`: Chrome headless, production localhost:3100, CDP:9333, DPR 2, CPU throttle 4x. Kiểm tra nét trước pointerup, commit không clear main, undo/redo, pause/resume iframe, fallback không có Ink API, hủy nét và alpha highlight không chồng đậm.
- Lượt pen trên lesson: 50 raw + 50 move, 51 batch gồm điểm đặt bút, 51 native updates thành công, 0 lần clear main trong thao tác. Max JS draw khoảng 0.8 ms trong lượt đó; đây không phải độ trễ end-to-end hay phiên Meet.
- Script có benchmark submission với 120 nét × 80 điểm: bản trước submit lại 120 nét mỗi lần chốt, bản mới submit 1 nét. Kết quả chỉ đo thời gian JS, có thể thấp hơn độ phân giải timer; không dùng làm tuyên bố FPS.

Cần đối chiếu trên đúng bảng vẽ rời/trình duyệt của người dùng sau deploy, cả bảng trống và bài giảng trong Meet. Nếu còn trễ, dữ liệu chẩn đoán giúp phân biệt dispatch input, xử lý JS và đường hiển thị/capture; chưa thể kết luận từ headless.
