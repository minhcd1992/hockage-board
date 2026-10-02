# Project và engine bút spline-v2

## Cấu trúc

- `app/page.tsx`: thanh công cụ và các tab bảng; `store/useBoardStore.ts`: công cụ, màu, kích thước, zoom/pan, tab.
- `components/CanvasBoard.tsx`: điều phối input, camera, tài liệu, clipboard và xuất PDF. Mỗi bảng có canvas nền, main chứa đối tượng đã chốt và draft chứa nét đang viết.
- `engine/Scene.ts`: đối tượng/history/selection; `Camera.ts`: đổi tọa độ màn hình/thế giới; `objects/`: nét, hình, chữ, ảnh và trang PDF.
- `app/lesson/`: MDX bài giảng/bài tập; `components/lesson/`: khối nội dung và câu hỏi; `components/simulations/`: mô phỏng. Bài giảng nằm trong iframe dưới lớp chú thích.

## Vì sao thay engine

Hai lần sửa trước vẫn không giải quyết trải nghiệm trên bảng vẽ rời, kể cả bảng trống; bài giảng lag nặng hơn. TypeScript, kiểm tra chức năng canvas và CPU throttle không chứng minh được độ trễ con trỏ–màn hình trong Google Meet. Bản này thay phần hình học và vòng đời nét, đồng thời giảm tải mô phỏng.

## Luồng mới

1. `PointerManager` nhận mẫu thực từ raw/coalesced events, dùng pointermove nếu không có raw. Không ghi trùng hai luồng. Mất capture, blur hoặc pointercancel hủy thao tác.
2. `InkGeometry` nội suy Bézier qua các mẫu, độ rộng theo áp lực. Hướng tiếp tuyến kết hợp hai đoạn lân cận; độ dài tay nắm bị giới hạn để tránh vòng xoắn khi mẫu phân bố không đều. Đường cong được chia nhỏ theo sai số hình học, không làm mất các điểm đầu vào.
3. `LiveInk` giữ các đoạn đã có đủ điểm lân cận trong canvas đệm. Đoạn cuối được vẽ tạm tới đúng điểm bút mới nhất, rồi cập nhật khi nhận thêm mẫu; chỉ vùng đuôi cũ/mới được thay, không dựng lại cả nét trong mỗi event. Không đọc pixel về CPU. Bút không đi qua React state hay vòng requestAnimationFrame chung. Highlight vẽ opaque rồi áp opacity một lần lên lớp để tránh nối nét đậm.
4. Khi nhấc bút, `Stroke` dùng cùng hình học lúc viết, không đổi nét qua perfect-freehand. `commitStroke` chỉ thêm nét mới lên main, không xóa/vẽ lại scene. Undo/redo, camera và sửa đối tượng vẫn dùng full render.
5. Cache hình học ở tọa độ thế giới nên zoom không cần dựng lại đường viền. Copy giữ đúng highlight; bounding box/hit test tính độ rộng highlight.
6. Không dùng delegated Ink API nữa: lớp nét tạm của hệ điều hành có vòng đời riêng, có thể gây vệt nối lóe giữa hai lần đặt bút. Toàn bộ nét hiển thị do canvas quản lý và xóa trạng thái khi bắt đầu nét mới. Raw/coalesced input, canvas desynchronized và nội suy spline vẫn giữ nguyên. Mẫu có timestamp trước lần đặt bút/mẫu đã nhận, hoặc thuộc trạng thái hover, không được thêm vào nét hiện tại.

Đã bỏ `InkPrediction` và việc chép/khôi phục vùng pixel dự đoán; không lưu điểm giả. Nét giữ áp lực nhưng kiểu nét có thể khác cách làm mượt cũ vì không dùng perfect-freehand nữa. Dependency chưa gỡ để tránh thay lockfile không cần thiết.

Tham khảo: [Ink API](https://wicg.github.io/ink-enhancement/), [Chrome: desynchronized canvas](https://developer.chrome.com/blog/desynchronized). Đây là progressive enhancement: API tồn tại chưa bảo đảm mọi tổ hợp trình duyệt/driver/GPU có cùng đường hiển thị nhanh hoặc cùng kết quả trong video chia sẻ màn hình.

## Giảm tải bài giảng

`lib/lessonAnimation.ts` quản lý riêng RAF của mô phỏng, không monkey-patch API toàn cục. Khi viết hoặc tab bài giảng bị ẩn, iframe nhận trạng thái từ đúng parent cùng origin và dừng animation. Nhấc bút thì tiếp tục. Đồng hồ mô phỏng trừ thời gian tạm dừng để không nhảy trạng thái. CSS animation cũng tạm dừng; interval đồng hồ tốc độ bỏ cập nhật khi paused. Vòng render bảng ẩn được dừng.

Đánh đổi có chủ ý: mô phỏng đứng hình trong thời gian đặt bút, rồi tiếp tục. Áp dụng bài giảng/bài tập của project, không can thiệp HTML bên ngoài.

## Chẩn đoán bản deploy

Thêm `?inkDebug=1` vào URL trang bảng rồi viết vài nét:

- `engine: spline-v2`: xác nhận đang chạy bản nét cong.
- `inputType`: driver gửi `pen` hay giả lập `mouse`.
- `inputEvent`: raw hay pointermove fallback.
- `nativeInk: disabled`, `nativeUpdates: 0`: xác nhận lớp nét tạm của trình duyệt đã tắt.
- `maxInputAgeMs`: tuổi event khi handler vẽ bắt đầu.
- `maxDrawMs`: thời gian JS gửi lệnh vẽ một batch, không bao gồm toàn bộ GPU/compositor/màn hình/Meet.

Các số max tính từ lúc mount bảng. Chế độ mặc định không có panel hoặc timer cập nhật panel.

## Kiểm thử

- Production build và TypeScript đạt. KaTeX còn cảnh báo sẵn có từ nội dung bài giảng.
- ESLint không tăng lỗi/cảnh báo ở các file sửa; ba module mới không có lỗi/cảnh báo.
- `node scratch/check-ink.cjs`: cache world-space, raw/move không trùng, fallback, cancellation, clone/bounds highlight, scheduler dừng/tiếp tục và loại trừ thời gian pause.
- `node scratch/check-ink-browser.cjs mouse` và `node scratch/check-ink-browser.cjs pen lesson`: Chrome headless, production localhost:3100, CDP:9333, DPR 2, CPU throttle 4x. Kiểm tra nét trước pointerup, commit không clear main, undo/redo, pause/resume iframe, fallback không có Ink API, hủy nét và alpha highlight không chồng đậm.
- Kết quả bản cũ trước khi tắt Ink API: lượt spline-v2 với pen trên lesson: 50 raw + 50 move, 51 batch gồm điểm đặt bút, 51 native updates thành công, 0 lần clear main trong thao tác. Đây là kiểm tra chức năng, không phải độ trễ end-to-end hay phiên Meet.
- Kiểm tra thêm spline qua từng điểm, giữ đúng đầu nét, đoạn đã ổn định không đổi khi có mẫu mới, tọa độ trùng/quay đầu/khoảng cách mẫu chênh lệch. So sánh pixel nét đang viết và nét chốt: khoảng 1% khác biệt ở ngưỡng alpha trong đường thử, chủ yếu do antialias khi tô từng đoạn. Bounding box và hit test dùng đường cong đã nội suy.
- Ảnh so sánh cùng dữ liệu điểm: [đoạn thẳng và spline](../scratch/ink-curve-comparison.png).
- Script có benchmark submission với 120 nét × 80 điểm: bản trước submit lại 120 nét mỗi lần chốt, bản mới submit 1 nét. Kết quả chỉ đo thời gian JS, có thể thấp hơn độ phân giải timer; không dùng làm tuyên bố FPS.

Cần đối chiếu trên đúng bảng vẽ rời/trình duyệt của người dùng sau deploy, cả bảng trống và bài giảng trong Meet. Nếu còn trễ, dữ liệu chẩn đoán giúp phân biệt dispatch input, xử lý JS và đường hiển thị/capture; chưa thể kết luận từ headless.

- `node scratch/check-boundaries-fullscreen-browser.cjs pen` (hoặc `mouse`, hoặc `pen lesson`): kiểm tra pixel vùng trống giữa hai nét lúc hover/đặt bút/di chuyển/nhấc bút, không đăng ký native presenter kể cả khi API có sẵn, bật/tắt fullscreen, thoát từ trình duyệt và xử lý yêu cầu fullscreen bị từ chối.

## Toàn màn hình

Nút cạnh **Lưu thành PDF** trên thanh công cụ đưa cả app vào toàn màn hình (bao gồm menu và các tab). Bấm lại hoặc Esc để thoát. Trạng thái nút theo `fullscreenchange`; lỗi/quyền từ chối được hiển thị tại thanh công cụ. Trình duyệt không hỗ trợ sẽ vô hiệu hóa nút.
