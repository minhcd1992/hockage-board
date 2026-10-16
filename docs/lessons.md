# Quản lý bài giảng và bài tập

Các bài hiện tại thuộc **Vật lý lớp 10**; bài 1–4 thuộc chương Động học, bài 5–6 thuộc chương Động lực học:

- `bai-1`: Quãng đường & Độ dịch chuyển.
- `bai-2`: Tốc độ, vận tốc và thực hành đo tốc độ.
- `bai-3`: Gia tốc và chuyển động thẳng biến đổi đều.
- `bai-4`: Rơi tự do và chuyển động ném.
- `bai-5`: Tổng hợp và phân tích lực.
- `bai-6`: Ba định luật Newton.

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
  bai-4/
    meta.ts
    theory.mdx
    exercises.mdx            # 45 câu bài tập và lời giải
    components/
      Lesson4Figures.tsx     # 7 mô phỏng, dùng chung đồng hồ và cách vẽ vectơ
  bai-5/
    meta.ts
    theory.mdx
    exercises.mdx            # 45 câu luyện tập và lời giải
    components/
      Lesson5Figures.tsx     # 6 hình, gồm thực hành theo bốn bước
  bai-6/
    meta.ts
    theory.mdx               # Ba định luật, hai ví dụ mẫu
    exercises.mdx            # 45 câu sách bài tập có lời giải
    components/
      Lesson6Figures.tsx     # 3 hình tĩnh và 3 mô phỏng tương tác
```

Mỗi bài cần **3 file chính**. Chỉ tạo thêm thư mục mô phỏng hoặc component khi cần.
`meta.ts` là nguồn thông tin chung cho thư viện, tiêu đề trang, nhãn lớp và điều hướng.
Không viết lại tên bài hoặc đường dẫn chuyển trang vào MDX.

`lib/lessons.ts` đăng ký danh sách bài và quản lý đường dẫn. Hai trang dùng chung trong
`app/lesson/[slug]/` tải nội dung tương ứng. Các URL cũ vẫn giữ nguyên:

- `/lesson/bai-1` và `/lesson/bai-1/bai-tap`.
- `/lesson/bai-2` và `/lesson/bai-2/bai-tap`.
- `/lesson/bai-3` và `/lesson/bai-3/bai-tap`.
- `/lesson/bai-4` và `/lesson/bai-4/bai-tap`.
- `/lesson/bai-5` và `/lesson/bai-5/bai-tap`.
- `/lesson/bai-6` và `/lesson/bai-6/bai-tap`.

Khối lớp là dữ liệu `grade`, không suy ra từ tên bài hay URL. Slug phải duy nhất trong
toàn bộ danh mục; có thể dùng `lop-11-bai-1` cho một bài lớp 11 sau này.

## Thêm bài mới

1. Tạo thư mục mới (ví dụ `content/lessons/bai-7/`) và ba file sau.
2. Đăng ký metadata **một lần** trong `lib/lessons.ts`:
   thêm `import bai7 from '@/content/lessons/bai-7/meta';`, rồi thêm `bai7` vào mảng
   `[bai1, bai2, bai3, bai4, bai5, bai6, bai7]`. Thư viện và các trang dùng chung sẽ đọc danh mục này.
3. Chạy `npm run build` để kiểm tra MDX, TypeScript và việc tạo đủ trang.

Không cần tạo route mới hay sửa `TabsBar`, `TopMenu`, `mdx-components.tsx`.
Trong PowerShell nếu `npm.ps1` bị chặn, dùng `npm.cmd run build`.

### `meta.ts`

```ts
import type { LessonMeta } from '@/lib/lessons';

export default {
  slug: 'bai-7', // Trùng tên thư mục; dùng chữ thường, số và dấu gạch ngang.
  grade: 10,
  subject: 'Vật lý',
  chapter: 'Động lực học',
  order: 7,
  title: 'Bài 7: Tên bài học',
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
  id="bai-7-exercises-001"
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

Bài 4 có bốn câu vận dụng nhanh ở phần E của `bai-4/theory.mdx`, giữ các ID
`bai-4-check-001` đến `bai-4-check-004`. Bộ 45 câu riêng nằm trong
`bai-4/exercises.mdx`, với ID `bai-4-exercises-001` đến `bai-4-exercises-045`.
Lời giải đặt ngay ở từng câu; năm câu tự luận dùng khối mở/đóng `details`.
Các mô phỏng lý thuyết bài 4 nằm cùng trong `Lesson4Figures.tsx`: có chạy/tạm dừng,
tua thời gian và tốc độ phát. Bốn mô phỏng chuyển động ném dùng chung một thành
phần, chuyển cả quỹ đạo và vận tốc sang hệ mặt đất, hệ chuyển động ngang đều
hoặc hệ có vận tốc tùy chỉnh. Riêng mục tiêu rơi có thêm hệ cùng rơi tự do.
Thay tham số vật lý bắt đầu lại lượt chạy; đổi hệ quy chiếu tạm dừng và giữ cùng
thời điểm để đối chiếu. Các mô phỏng tự ngừng ở va chạm đầu tiên, ngừng cập nhật
khi ngoài màn hình hoặc tab bị ẩn. Mô hình lực cản tuyến tính của giấy/đá chỉ
là minh họa định tính, với tốc độ tới hạn giả định đã ghi trong chú thích.
Các điểm hiệu đính từ tài liệu nguồn: câu 22b là Đúng; câu 38 dùng nghiệm dương
của phương trình thời gian rơi cộng thời gian truyền âm; câu 40 giữ số liệu và
cho kết quả xấp xỉ 4,0 m/s²; câu 43 phân biệt quỹ đạo kéo dài với chuyển động
sau va chạm đất; câu 44 phân biệt gặp trước và ngay khi chạm đất.

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

Bài 5 thuộc chương **Động lực học**, có ba ví dụ giải theo bốn bước và ba câu
luyện tập nhanh trong `bai-5/theory.mdx`. Ba câu cũ được chuyển từ trang bài tập
sang lý thuyết, giữ nguyên ID `bai-5-exercises-001` đến `bai-5-exercises-003`.
Bộ 45 câu mới trong `bai-5/exercises.mdx` dùng ID `bai-5-sbt-001` đến
`bai-5-sbt-045`: 20 trắc nghiệm, 10 đúng/sai, 10 trả lời ngắn và 5 tự luận.
Lời giải tự luận dùng khối mở/đóng; sơ đồ câu 41 và 45 nằm trong
`bai-5/components/Lesson5ExerciseFigures.tsx`.
Sáu hình lý thuyết nằm trong `bai-5/components/Lesson5Figures.tsx`; ba hình
cho phép đổi tham số: hợp lực, góc dốc và góc dây treo.

Hiệu đính lý thuyết: phân biệt Py âm với độ lớn thành phần nén dương; phân tích
duy nhất theo hai phương không song song; thí nghiệm cần dây đàn hồi đối kháng
và vòng tự do tại O; hướng hợp lực kéo không tự xác định quỹ đạo xà lan.
Hiệu đính bộ bài tập: khôi phục ký hiệu LaTeX bị lỗi ký tự điều khiển; câu 14
không mặc định thị sai luôn là sai số ngẫu nhiên; câu 21d là Đúng (6595 N là
số làm tròn); câu 29c giữ nguyên tải đứng; câu 32 dùng giá trị trung gian
4764,906 N; câu 34 tránh làm tròn hai lần; câu 41 thống nhất mô hình hai dây
và nêu cách đổi sang bốn dây, phân biệt tổng độ lớn thành phần ngang với hợp
lực và nội lực nén; câu 43 dùng N = −Py; câu 44 nêu quy ước cộng sai số và
kết luận phù hợp trong phạm vi sai số; câu 45 có Q ≈ 1060,03 N.

Sau lần rà soát hình bài 5: các khung rộng tối đa 600 px, SVG rộng tối đa
480 px và dùng chung cách vẽ vectơ/cung góc trong `Lesson5Diagram.tsx`.
Hình 5.1a chỉ minh họa bố trí tàu kéo và xà lan, dây nối mũi xà lan với đuôi tàu;
hình 5.1b là cấu tạo cầu dây văng và hướng lực tại một điểm neo, không lặp lại
sơ đồ ba lực của câu 41. Hình 5.2 chỉ tập trung phép cộng vectơ; hình 5.3 chỉ
phân tích trọng lực, bánh xe tiếp xúc mặt đường. Thí nghiệm 5.4 trong `ForceExperiment.tsx` có bốn bước: bố trí, kéo bằng hai lực,
tự chỉnh lực thay thế và đối chiếu. Vòng R tự do; O chỉ là mốc. Chỉ được ghi
kết quả khi vòng trở lại O; học sinh chọn góc 30°, 60° hoặc 90° cho mỗi lượt.
Mô hình cân bằng dùng dây đàn hồi tuyến tính, thang chỉnh lực 0,1 N và ngưỡng
trùng mốc tương ứng ±0,05 N khi đúng hướng. Đây là số liệu mô phỏng. Hình 5.5 giữ
chiều dài dây 2 m không đổi: hai đầu dịch ngang, độ võng bằng sin θ (m).
Các vectơ lực ở 5.2, 5.3, 5.5 và câu 41 dùng cùng tỉ lệ trong mỗi khung;
bản vẽ bố trí tàu, cầu và sơ đồ thanh ở câu 45 không biểu diễn độ lớn lực.

Công thức dùng thống nhất KaTeX 0.16.47 (phiên bản trực tiếp được khóa trong
`package.json` và `package-lock.json`), tương thích với `rehype-katex` 7.
Không nâng riêng CSS/KaTeX trực tiếp lên 0.18 khi MDX còn dùng 0.16: tên class
`base`, `strut`, `sizing` đã thay đổi và có thể làm chỉ số mất định dạng.
Script kiểm tra bài học đối chiếu phiên bản renderer và đo kích thước chỉ số
trên trình duyệt (scriptstyle bằng 70% cỡ chữ cha), cho cả MDX và `Math`.

Bài 6: `bai-6/theory.mdx` gồm ba định luật Newton, sáu hình (ba hình tĩnh,
ba mô phỏng tương tác), hai ví dụ bốn bước và bốn câu nền tảng có lời giải
(ID `bai-6-exercises-001` đến `004`). Trang `bai-6/exercises.mdx` là bộ 45 câu.
Các hình nằm trong `bai-6/components/Lesson6Figures.tsx`, khung tối đa 600 px,
SVG tối đa 480 px. Đệm khí và cảm biến có chạy/dừng/tua, ngừng tính thời gian
khi ngoài màn hình hoặc tab bị ẩn. Đổi tham số bắt đầu lại lượt chạy.
Đồ thị x–t của đệm khí dùng cùng thang 0–8 s để so sánh độ dốc; thời gian
kết thúc phụ thuộc tốc độ tại x = 4 m. Mô phỏng ô tô xét thời điểm xe đang
đi sang phải, lực cản ngược vận tốc, toàn bộ vectơ lực dùng cùng tỉ lệ.

Hiệu đính nguồn bài 6: bỏ thông số tăng tốc chưa kiểm chứng của VF8, dùng
ô tô điện và bộ số liệu giả định; phân biệt lực mặt đường với mômen động cơ;
không áp dụng trực tiếp F = d(mv)/dt cho riêng tên lửa mất khối lượng; cặp
lực–phản lực triệt tiêu khi xét cả hệ nhưng không cân bằng trên từng vật.
Ví dụ va chạm dùng lực/gia tốc trung bình, không suy ra mức biến dạng hoặc
chấn thương chỉ từ khối lượng. Câu vali cần điều kiện tàu đang đi về trước
để kết luận giảm tốc; câu bóng xét lực trung bình với giả thiết bỏ qua các
lực khác. Nguồn đối chiếu OpenStax/MIT được liên kết trong bài học.

Sách bài tập Bài 6 đã thay trang bốn câu bằng 45 câu mới, ID
`bai-6-sbt-001` đến `bai-6-sbt-045` (20 chọn đáp án, 10 đúng/sai, 10 trả lời
ngắn, 5 tự luận). Bốn câu nền tảng chuyển sang cuối lý thuyết, giữ các ID
`bai-6-exercises-001` đến `004`. Sơ đồ ngựa–xe–Trái Đất và máy Atwood
đặt trong `Lesson6ExerciseFigures.tsx`, chỉ mở cùng lời giải câu 42/43.

Hiệu đính SBT6: câu 4 dùng tàu thăm dò giả định thay vệ tinh địa tĩnh bay
thẳng đều; câu 5 bỏ điều kiện từ nghỉ để phương án gia tốc cùng vận tốc
không đồng thời đúng; câu 12 nêu đúng cách chọn hệ và dòng động lượng.
Câu 21d tiếp tục thẳng đều khi bỏ qua mọi cản; câu 22 phân biệt lực căng
với trọng lượng móc; câu 24 phân biệt gia tốc với vận tốc; câu 25 thêm
sàn nhẵn và hệ tịnh tiến; câu 27 dùng lực/gia tốc trung bình; câu 28 không
suy diễn phá hỏng cabin; câu 29 nêu mô hình cản tuyến tính; câu 30 quy ước
μ = −dm/dt > 0. Câu 31 kết quả 16049 N khi không làm tròn trung gian.
Câu 34 ghi rõ mô hình giật lùi lý tưởng và giả thiết khí thuốc; câu 41 phân
biệt bánh trượt lê với ABS, không đưa quy tắc khoảng cách an toàn phổ quát.
Câu 44 cho bổ sung Δa = 0,015 m/s², dùng a = 2s/t̄²; thực nghiệm lớn hơn
lý thuyết, ma sát/quán tính ròng rọc không giải thích riêng dấu chênh lệch.
Câu 45 giữ μ = 120 kg/s: F = 300 kN, tên lửa vẫn ở bệ và a = 0 trong
100 s đầu; tính lực đỡ bệ. μ = 500 kg/s là trường hợp mở rộng tách biệt.

`Lesson6Workbook.module.css` chỉ áp dụng cho SBT6: trên điện thoại, mỗi ý
đúng/sai xếp thành một khối có hai lựa chọn được gắn nhãn; bảng năm lần đo
giữ dạng bảng với cỡ chữ và khoảng đệm phù hợp. Các bài khác không đổi.
