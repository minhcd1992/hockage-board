# Chỉnh kích thước và hình dạng đối tượng

- Chọn một đường thẳng hoặc mũi tên: kéo nút tròn ở hai đầu để đổi chiều dài và hướng. Đầu còn lại đứng yên; độ dày nét và kích thước đầu mũi tên giữ nguyên. Giữ Shift để bắt góc theo bước 15°.
- Chọn đường Bézier: kéo hai đầu hoặc điểm điều khiển để chỉnh độ cong. Đường gạch nối thể hiện quan hệ giữa điểm điều khiển và hai đầu.
- Hình chữ nhật và ellipse chưa xoay: kéo khung để thay đổi chiều rộng/cao, giữ nguyên độ dày viền. Shift giữ tỷ lệ.
- Chữ, ảnh, PDF, cung tròn, sóng sin và hình đã xoay: resize giữ tỷ lệ. Với nhóm có các đối tượng này, cả nhóm giữ tỷ lệ để tránh kéo méo hoặc tạo biến dạng xiên mà mô hình đối tượng hiện tại không biểu diễn được.
- Nét bút và đường cong: resize các điểm hình học, giữ độ dày nét. Mũi tên trong nhóm cũng giữ kích thước đầu nhọn.
- Resize khung dừng ở tỷ lệ tối thiểu 1% của kích thước lúc bắt đầu kéo, không lật đối tượng khi kéo qua cạnh đối diện. Hai đầu đường thẳng/mũi tên vẫn di chuyển tự do.
- Đối tượng khóa không bị resize, xoay hoặc di chuyển. Mất thao tác con trỏ khi đang resize/chỉnh điểm sẽ khôi phục trạng thái trước khi kéo.

Logic nằm trong `engine/ObjectTransform.ts`; `CanvasRenderer` vẽ các nút chỉnh và `CanvasBoard` xử lý thao tác. Transform làm việc trên bản sao để giữ nguyên hình học trong lịch sử Undo. Vị trí thả con trỏ được áp dụng kể cả khi không có sự kiện di chuyển cuối.

Kiểm tra tự động: `node scratch/check-transform.cjs`, `node scratch/check-ink.cjs`, `npx tsc --noEmit`, `npm run build`. Các kiểm tra logic không thay thế việc thử cảm giác kéo bằng bảng vẽ thật.
