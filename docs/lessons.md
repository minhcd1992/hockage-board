# Quản lý bài giảng và bài tập

Ba bài hiện tại thuộc **Vật lý lớp 10, chương Động học**:

- `bai-1`: Quãng đường & Độ dịch chuyển.
- `bai-2`: Tốc độ, vận tốc và thực hành đo tốc độ.
- `bai-3`: Gia tốc và chuyển động thẳng biến đổi đều.

## Sửa nội dung ở đâu?

```text
content/lessons/
  bai-1/
    meta.ts                  # Tên, lớp, môn, chương, thứ tự, mô tả
    theory.mdx               # Nội dung lý thuyết và câu hỏi trong bài
    exercises.mdx            # Bài tập luyện tập
    simulations/             # Mô phỏng riêng của bài
    components/              # Thành phần nội dung riêng (nếu cần)
  bai-2/
    meta.ts
    theory.mdx
    exercises.mdx
    simulations/
  bai-3/
    meta.ts
    theory.mdx
    exercises.mdx            # 45 câu bài tập và lời giải
    components/
      Lesson3Figures.tsx     # Các hình minh họa và đồ thị tương tác của bài
```

Mỗi bài cần **3 file chính**. Chỉ tạo thêm thư mục mô phỏng hoặc component khi cần.
`meta.ts` là nguồn thông tin chung cho thư viện, tiêu đề trang, nhãn lớp và điều hướng.
Không viết lại tên bài hoặc đường dẫn chuyển trang vào MDX.

`lib/lessons.ts` đăng ký danh sách bài và quản lý đường dẫn. Hai trang dùng chung trong
`app/lesson/[slug]/` tải nội dung tương ứng. Các URL cũ vẫn giữ nguyên:

- `/lesson/bai-1` và `/lesson/bai-1/bai-tap`.
- `/lesson/bai-2` và `/lesson/bai-2/bai-tap`.
- `/lesson/bai-3` và `/lesson/bai-3/bai-tap`.

Khối lớp là dữ liệu `grade`, không suy ra từ tên bài hay URL. Slug phải duy nhất trong
toàn bộ danh mục; có thể dùng `lop-11-bai-1` cho một bài lớp 11 sau này.

## Thêm bài mới

1. Tạo thư mục `content/lessons/bai-4/` và ba file sau.
2. Đăng ký metadata **một lần** trong `lib/lessons.ts`:
   thêm `import bai4 from '@/content/lessons/bai-4/meta';`, rồi thêm `bai4` vào mảng
   `[bai1, bai2, bai3, bai4]`. Thư viện và các trang dùng chung sẽ đọc danh mục này.
3. Chạy `npm run build` để kiểm tra MDX, TypeScript và việc tạo đủ trang.

Không cần tạo route mới hay sửa `TabsBar`, `TopMenu`, `mdx-components.tsx`.
Trong PowerShell nếu `npm.ps1` bị chặn, dùng `npm.cmd run build`.

### `meta.ts`

```ts
import type { LessonMeta } from '@/lib/lessons';

export default {
  slug: 'bai-4', // Trùng tên thư mục; dùng chữ thường, số và dấu gạch ngang.
  grade: 10,
  subject: 'Vật lý',
  chapter: 'Động học',
  order: 4,
  title: 'Bài 4: Tên bài học',
  description: 'Mô tả ngắn nội dung bài học.',
} satisfies LessonMeta;
```

### `theory.mdx`

```mdx
<Section title="A. Mục tiêu" icon="target">

Nội dung bài học viết bằng **Markdown**.

<InfoBox type="info" title="Ghi nhớ">
Tốc độ trung bình: <Math inline>{"v = \\frac{s}{t}"}</Math>.
</InfoBox>

</Section>
```

### `exercises.mdx`

```mdx
<Section title="Bài tập luyện tập" icon="edit">

<Quiz
  id="bai-4-exercises-001"
  question="Một vật đi 10 m trong 2 s. Tốc độ trung bình là bao nhiêu?"
  options={['2 m/s', '5 m/s', '10 m/s', '20 m/s']}
  correctIndex={1}
  explanation="Tốc độ trung bình bằng 10 / 2 = 5 m/s."
/>

</Section>
```

## Quy ước nội dung

- Dùng các khối chung: `Section`, `InfoBox`, `TwoColumns`, `Col`, `Math`,
  `CompareTable`, `Quiz`, `QuizTF`, `QuizShort`. Chúng đã có trong `mdx-components.tsx`.
- `InfoBox` nhận `type="info"` hoặc `type="warning"` và `title`.
- `CompareTable` nhận `title`, `columns` và `rows`. Bảng minh họa riêng về độ dịch
  chuyển của bài 1 nằm trong `bai-1/components/DisplacementComparison.tsx`.
- Mô phỏng riêng được import trực tiếp trong MDX của bài, ví dụ
  `import { BoatRiverSim } from './simulations/BoatRiverSim'`.
- Chỉ chuyển một mô phỏng sang thư mục dùng chung khi nhiều bài thực sự sử dụng nó.
  `AntExperimentSim` và `RealWorldSim` hiện được giữ lại cùng bài sở hữu nhưng chưa
  được nhúng trong nội dung hiện tại.
- Ưu tiên Markdown và component chung khi viết nội dung mới. Các bố cục minh họa
  đặc thù của hai bài cũ vẫn giữ JSX để bảo toàn cách trình bày.
- Nội dung được biên dịch cùng ứng dụng. Khi triển khai production, cần build và
  triển khai lại sau khi sửa; đây chưa phải trình soạn thảo bài học trên web.

## Câu hỏi và ID

Mỗi `Quiz`, `QuizTF`, `QuizShort` phải có `id` duy nhất, ví dụ
`bai-1-theory-001` hoặc `bai-1-exercises-001`.
Giữ ID khi sửa câu chữ hoặc đổi thứ tự; câu mới dùng ID mới, không đánh lại toàn bộ ID.
`correctIndex` của `Quiz` bắt đầu từ **0**. Mỗi mệnh đề trong `QuizTF` có `id` riêng
trong câu đó (ví dụ `a`, `b`, `c`, `d`).

Bài 3 có bốn câu vận dụng nhanh ở phần E của `bai-3/theory.mdx`, giữ các ID
`bai-3-check-001` đến `bai-3-check-004`. Bộ 45 câu riêng nằm trong
`bai-3/exercises.mdx` với ID `bai-3-exercises-001` đến `bai-3-exercises-045`.
Các lời giải đặt ngay ở từng câu; câu tự luận dùng khối mở/đóng `details`.
Hình đồ thị của bài tập nằm cùng các hình bài giảng trong `Lesson3Figures.tsx`.

Các nhóm radio dùng ID câu hỏi và ID của instance React, nên việc chọn câu này
không bỏ chọn câu khác. ID hiện chưa gắn với lưu tiến độ hay ngân hàng câu hỏi.
`Quiz` kiểm tra đáp án; `QuizTF` và `QuizShort` cho học sinh nhập/chọn rồi xem lời
giải, chưa tự chấm hoặc lưu kết quả.

## Kiểm tra sau khi sửa

- Chạy `npm run build`.
- Mở lý thuyết và bài tập, kiểm tra công thức, mô phỏng, câu hỏi và liên kết chuyển trang.
- Mở thư viện từ bảng, kiểm tra tên bài, nhãn lớp, hai nút Lý thuyết/Bài tập và tab.
- Khi chuyển nội dung sang thư mục mới, cập nhật `tailwind.config.ts` nếu thư mục
  nằm ngoài `content/`, `app/` và `components/`.

Kiểm tra hồi quy bằng Chrome: chạy server production trên cổng 3100, mở Chrome
với remote debugging ở cổng 9333 rồi chạy `node scratch/check-lessons.cjs`.
Script tạo một tab kiểm thử riêng và đóng tab đó khi xong.
