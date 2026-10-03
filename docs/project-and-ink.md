# Project và engine bút quadratic-v4.1

## Cấu trúc

- `components/CanvasBoard.tsx`: input, camera, tài liệu, clipboard và xuất PDF.
- `input/PointerManager.ts`: nhận mẫu raw/coalesced, fallback pointermove, loại mẫu cũ/hover và hủy thao tác khi mất capture.
- `engine/InkGeometry.ts`: hình học dùng chung cho nét đang viết, nét chốt, hit test và bounds.
- `engine/LiveInk.ts`: canvas nét đang viết, đệm phần ổn định và thay vùng đuôi.
- `objects/Stroke.ts`: lấy mẫu theo khoảng cách, cache, áp lực, clone.
- `engine/Scene.ts`: đối tượng/history/selection; `Camera.ts`: đổi tọa độ màn hình/thế giới.
- `app/lesson/`, `components/lesson/`, `components/simulations/`: bài giảng MDX trong iframe dưới lớp chú thích.

## Vì sao thay thuật toán

Người dùng vẫn gặp nét gấp khúc trên XP-Pen với spline-v3, trong khi cùng thiết lập driver viết ổn ở các phần mềm khác. Thuật toán cũ nội suy qua mọi mẫu của pen; chỉ mouse có hiệu chỉnh cục bộ tối đa 0,65 CSS pixel. Nội suy vẫn có thể giữ rung và bậc thang của tọa độ đầu vào.

quadratic-v4 thay nội suy cubic và bỏ `smoothMousePoint`. Cả pen lẫn mouse dùng cùng đường cong xấp xỉ quadratic qua trung điểm. Điểm đo là điểm điều khiển, không bắt buộc nằm trên đường cong. Đây là thay đổi hình học, không phải tăng hệ số lọc cũ.

## Lọc rung nhẹ — quadratic-v4.1

Giữ engine quadratic đã được người dùng chấp nhận và thêm `engine/InkStabilizer.ts`. Bộ lọc khớp đa thức cục bộ theo hướng nét, chỉ hiệu chỉnh vuông góc với hướng đi để tránh kéo lùi bút:

- Dùng tối đa 3 điểm điều khiển mỗi phía, giới hạn vùng xét 8 CSS pixel mỗi phía.
- Đoạn gần thẳng dùng mô hình đường thẳng; đoạn có độ cong dùng đa thức bậc hai. Chuyển tiếp liên tục giữa hai mô hình.
- Giới hạn hiệu chỉnh 1,25 CSS pixel; giữ nguyên áp lực, điểm đầu và điểm bút hiện tại. Bỏ lọc khi gặp góc gấp, quay đầu, mẫu thưa hoặc hệ phương trình không ổn định.
- Luôn khớp từ dữ liệu đo gốc, không lọc lại dữ liệu đã làm mượt. Mỗi event chỉ tính lại tối đa 4 điểm cuối.
- `Stroke.stableThrough` xác định phần hình học đã cố định; LiveInk giữ 4 đoạn đuôi có thể thay thế để không lưu nhầm điểm đang được bộ lọc hiệu chỉnh. Không làm mượt toàn nét lần nữa khi nhấc bút.

Cách khớp đa thức cục bộ có cùng cơ sở với [lọc Savitzky–Golay](https://docs.scipy.org/doc/scipy/reference/generated/scipy.signal.savgol_filter.html), nhưng ở đây dùng tọa độ chiếu thực tế cho mẫu cách nhau không đều và có giới hạn hiệu chỉnh riêng cho nét viết. Không thêm dependency.

`node scratch/check-ink-stabilizer.cjs` so sánh với mã Stroke v4 đóng băng trong `scratch/fixtures/quadratic-v4-stroke.txt`. Trên dữ liệu rung giả lập: sai số RMS nét thẳng 0,350 → 0,072 px; cung bán kính 40 px: 0,385 → 0,106 px; chữ S: 0,369 → 0,137 px. Kiểm tra thêm nhiều hướng nét, vòng nhỏ, đỉnh cong, góc gấp, quay đầu, áp lực, zoom, clone và phần nét đã ổn định.

[Ảnh so sánh v4/v4.1 trên cùng dữ liệu](../scratch/ink-stabilizer-comparison.png). Browser test kiểm tra từng mẫu rung, nét live so với full render, pen trong bài giảng, mouse, commit, undo/redo, highlight và tách nét. Kết quả giả lập không phải cam kết mọi nét viết thực đều trở thành đường hình học hoàn hảo.

## Luồng dựng nét

1. `Stroke.addPoint` giữ nguyên điểm đầu, đầu bút hiện tại và áp lực. Các điểm quá sát nhau dùng chung một đuôi có thể thay thế; khoảng cách tạo điểm điều khiển mới là 2 CSS pixel, quy đổi theo zoom lúc đặt bút. Không chờ timer/frame, không tạo điểm dự đoán.
2. Các đoạn quadratic gặp nhau tại trung điểm với cùng tiếp tuyến. Điểm cuối luôn tới tọa độ mới nhất. Quay đầu gần 180 độ giữ đỉnh thành cusp để không co mất nét đi ngược lại. Đường cong và áp lực được chia nhỏ theo sai số; không dùng kiểm tra khoảng cách đến đường thẳng đơn thuần vì nó có thể bỏ mất quay đầu thẳng hàng.
3. LiveInk giữ bốn đoạn cuối có thể thay thế theo cửa sổ lọc rung. Theo dõi revision thay vì chỉ đếm điểm để cập nhật được chuyển động nhỏ và thay đổi áp lực tại chỗ. Phần ổn định chỉ rasterize một lần, thay vùng đuôi bằng canvas đệm; không đọc pixel về CPU.
4. `Stroke._draw`, bounds, hit test, copy, undo/redo và xuất ảnh/PDF dùng cùng hình học. Khi nhấc bút không chạy một lượt làm mượt khác. Cache tọa độ thế giới dùng lại khi zoom.
5. Highlight vẽ opaque trên draft rồi áp opacity một lần; nét chốt cũng chỉ áp alpha một lần. Không có mối nối hoặc giao nét đậm hơn.
6. Raw/coalesced vẫn được xử lý trực tiếp ngoài React state và RAF chung. Giữ nguyên fallback, loại trùng raw/move, loại mẫu hover/cũ và tách hai lần đặt bút. Delegated Ink API vẫn tắt.
7. Commit chỉ thêm nét mới vào main. Camera, undo/redo hoặc sửa đối tượng vẫn dùng render đầy đủ.

Đánh đổi: đường cong xấp xỉ có thể bo góc và đi phía trong đường đi qua các điểm đo, nhất là khi mẫu thưa. Không cam kết đi qua mọi điểm giữa nét. Đầu/cuối giữ nguyên; không có trạng thái lọc truyền từ nét trước sang nét sau.

## Chẩn đoán

Thêm `?inkDebug=1`:

- `engine: quadratic-v4.1`, `smoothing: local-polynomial-quadratic`: xác nhận bản mới ở cả pen/mouse.
- `inputType`: driver báo pen hay mouse.
- `inputEvent`: raw hoặc pointermove fallback.
- `nativeInk: disabled`, `nativeUpdates: 0`.
- `maxInputAgeMs`: tuổi event tại lúc bắt đầu xử lý.
- `maxDrawMs`: thời gian JS gửi lệnh vẽ, không phải độ trễ từ con trỏ đến màn hình/Meet.

Không mở debug thì không có panel hay timer cập nhật panel.

## Kiểm thử

- `npm.cmd run build`, `npx.cmd tsc --noEmit`, ESLint các module engine đã sửa.
- `node scratch/check-ink.cjs`: cache, áp lực, raw/coalesced, fallback, cancellation, tách các nét, clone/bounds highlight và scheduler bài giảng.
- `node scratch/check-mouse-ink.cjs`: kiểm tra engine chung, giảm rung, đầu/cuối, prefix ổn định, thay đuôi khi số điểm không tăng, áp lực tại chỗ, zoom, clone, quay đầu và dữ liệu không hợp lệ.
- Baseline spline-v3 được đóng băng trong `scratch/fixtures/spline-v3.json`, không phụ thuộc HEAD của git. Kết quả v4 trước khi thêm lọc rung, với 160 mẫu đường chéo bị lượng tử hóa: sai lệch trung bình 0,252 → 0,167; tổng dao động hướng 62,00 → 8,24 rad (baseline mouse cũ: 39,42 rad). Chỉ là phép đo hình học trên dữ liệu giả lập.
- Browser test dùng production localhost:3100, Chrome CDP:9333, DPR 2 và CPU throttle 4x: `node scratch/check-ink-browser.cjs mouse`, `node scratch/check-ink-browser.cjs pen lesson`. Kiểm tra nét hiện trước pointerup, commit không clear main, undo/redo, pause/resume iframe, highlight, hủy nét và so sánh pixel live/full sau từng mẫu ở nhiều zoom/cỡ nét, gồm di chuyển dưới 2 pixel và thay đổi áp lực tại chỗ.
- `node scratch/check-boundaries-fullscreen-browser.cjs pen` (hoặc `mouse`): kiểm tra khoảng trống giữa hai nét và fullscreen.
- Ảnh cùng bộ dữ liệu: [spline-v3 và quadratic-v4](../scratch/ink-quadratic-comparison.png). Các chấm đen đánh dấu điểm đo của đường cong thưa.

Các kiểm tra tự động không thay thế thử trên XP-Pen thật với cùng driver, trình duyệt và buổi chia sẻ màn hình. Chưa có dữ liệu phần cứng để khẳng định đã hết gấp khúc hoặc đo độ trễ end-to-end.

## Bài giảng và toàn màn hình

`lib/lessonAnimation.ts` quản lý RAF riêng. Khi viết hoặc tab bị ẩn, iframe cùng origin dừng animation; nhấc bút thì tiếp tục, đồng hồ mô phỏng trừ thời gian pause. CSS animation cũng tạm dừng. Không can thiệp HTML bên ngoài.

Nút cạnh **Lưu thành PDF** đưa cả app vào toàn màn hình, bao gồm menu và các tab. Bấm lại hoặc Esc để thoát. Trạng thái theo `fullscreenchange`; lỗi yêu cầu được hiển thị ở thanh công cụ.
