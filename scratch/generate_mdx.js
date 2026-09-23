const fs = require('fs');
const path = require('path');

let content = fs.readFileSync('c:\\Users\\Admin\\Downloads\\quang-duong-do-dich-chuyen-sbt.md', 'utf8');

// Replace corrupted escape sequences safely
content = content.replace(/\t(ext|an|heta)/g, (m, p1) => '\\\\' + 't' + p1);
content = content.replace(/\f(rac)/g, (m, p1) => '\\\\' + 'f' + p1);
content = content.replace(/\x07(pprox|lpha)/g, (m, p1) => '\\\\' + 'a' + p1);
content = content.replace(/\v(ec)/g, (m, p1) => '\\\\' + 'v' + p1);
content = content.replace(/\r(ightarrow)/g, (m, p1) => '\\\\' + 'r' + p1);

// Remove the top two headers (the user's title)
content = content.replace(/^# SÁCH BÀI TẬP VẬT LÍ 10 - CHƯƠNG TRÌNH GDPT 2018 & HALLIDAY PHYSICS\n/m, '');
content = content.replace(/^## BÀI 1: QUÃNG ĐƯỜNG VÀ ĐỘ DỊCH CHUYỂN \(Kho Luyện Tập Chuyên Sâu 45 Câu\)\n/m, '');

// Prepend the page layout
const mdxHeader = `
<span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded uppercase tracking-wide">Vật lý 10 - Động học (Bài tập)</span>
<h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-800 mt-2 mb-2">Bài 1: Quãng đường & Độ dịch chuyển</h1>
<p className="text-gray-500 mb-8 border-b-2 border-gray-200 pb-4 text-base italic">Kho Luyện Tập Chuyên Sâu 45 Câu (GDPT 2018 & Halliday Physics)</p>
`;

const targetDir = 'd:\\Board\\hockage-board\\app\\lesson\\bai-1\\bai-tap';
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

fs.writeFileSync(path.join(targetDir, 'page.mdx'), mdxHeader + content);
console.log('Successfully wrote page.mdx');
