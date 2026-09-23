const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'bai2-input.md');
const outputFile = path.join(__dirname, '..', 'app', 'lesson', 'bai-2', 'bai-tap', 'page.mdx');

// Ensure output directory exists
const outputDir = path.dirname(outputFile);
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

let content = fs.readFileSync(inputFile, 'utf8');

// Replace corrupted escape sequences safely
content = content.replace(/\t(ext|an|heta)/g, (m, p1) => '\\' + 't' + p1);
content = content.replace(/\f(rac)/g, (m, p1) => '\\' + 'f' + p1);
content = content.replace(/\s(in)/g, (m, p1) => '\\' + 's' + p1);
content = content.replace(/\c(os)/g, (m, p1) => '\\' + 'c' + p1);
content = content.replace(/\p(i)/g, (m, p1) => '\\' + 'p' + p1);
content = content.replace(/\D(elta)/g, (m, p1) => '\\' + 'D' + p1);
content = content.replace(/\a(lpha)/g, (m, p1) => '\\' + 'a' + p1);

function convertMath(text) {
    if (!text) return '';
    return text.replace(/\$([^$]+)\$/g, (match, p1) => {
        let tex = p1.trim();
        tex = tex.replace(/\\\\/g, '\\');
        return `<Math inline>{${JSON.stringify(tex)}}</Math>`;
    });
}
function convertMathBlock(text) {
    if (!text) return '';
    return text.replace(/\$\$([^$]+)\$\$/g, (match, p1) => {
        let tex = p1.trim();
        tex = tex.replace(/\\\\/g, '\\');
        return `<Math>{${JSON.stringify(tex)}}</Math>`;
    });
}
function mdToJsx(text) {
    if (!text) return '""';
    // Escape unescaped braces first if they are not part of JSX (very hard to do robustly)
    // Actually, just removing the brace escaping is safer.
    text = convertMathBlock(text);
    text = convertMath(text);
    text = text.replace(/\n/g, '<br/>');
    return `<>${text}</>`;
}
function convertTableToJsx(text) {
    // We don't have true markdown tables in Bai 2, but just in case
    return text;
}

let ansIndex = content.indexOf('PHẦN 5: ĐÁP ÁN');
if (ansIndex === -1) {
    console.error("Could not find PHẦN 5");
    process.exit(1);
}

let questionsPart = content.substring(0, ansIndex);
let answersPart = content.substring(ansIndex);

const parts = questionsPart.split(/^PHẦN [1-4]:.*$/m);

let part1Text = parts[1] || "";
let part2Text = parts[2] || "";
let part3Text = parts[3] || "";
let part4Text = parts[4] || "";

// ========================
// Parse Answers (Part 5)
// ========================
const answers = { part1: {}, part2: {}, part3: {}, part4: {} };

let p5Parts = answersPart.split(/^PHẦN [1-4]:.*$/m);
let ansP1 = p5Parts[1] || "";
let ansP2 = p5Parts[2] || "";
let ansP3 = p5Parts[3] || "";
let ansP4 = p5Parts[4] || "";

// P1 answers (sequential)
let p1Counter = 1;
ansP1.trim().split('\n').forEach(line => {
    let m = line.match(/^([A-D])\s*\|\s*(.*)$/);
    if (m) {
        answers.part1[p1Counter] = { ans: m[1], exp: m[2].trim() };
        p1Counter++;
    }
});

// P2 answers
let currentQ2 = null;
ansP2.split('\n').forEach(line => {
    let mQ = line.match(/^Câu (\d+):/);
    if (mQ) {
        currentQ2 = mQ[1];
        answers.part2[currentQ2] = {};
    }
    let mAns = line.match(/^([a-d])\)\s+(ĐÚNG|SAI):\s*(.*)$/);
    if (mAns && currentQ2) {
        answers.part2[currentQ2][mAns[1]] = { isTrue: mAns[2] === 'ĐÚNG', exp: mAns[3].trim() };
    }
});

// P3 answers (sequential starting at 31)
let p3Counter = 31;
ansP3.trim().split('\n').forEach(line => {
    let m = line.match(/^([^|]+)\|\s*(.*)$/);
    if (m) {
        answers.part3[p3Counter] = { ans: m[1].trim(), exp: m[2].trim() };
        p3Counter++;
    }
});

// P4 answers
let p4Blocks = ansP4.split(/^Câu (\d+):/m).slice(1);
for (let i = 0; i < p4Blocks.length; i += 2) {
    let qNum = p4Blocks[i];
    let exp = p4Blocks[i+1].trim();
    answers.part4[qNum] = exp;
}

// ========================
// Generate Output
// ========================
let finalContent = `import { Quiz } from '@/components/lesson/Quiz'\nimport { QuizTF } from '@/components/lesson/QuizTF'\nimport { QuizShort } from '@/components/lesson/QuizShort'\nimport { Math } from '@/components/lesson/Math'\n\n  BÀI 2: TỐC ĐỘ, VẬN TỐC VÀ THỰC HÀNH ĐO TỐC ĐỘ CỦA VẬT CHUYỂN ĐỘNG\n`;

// PART 1
finalContent += `## PHẦN 1: TRẮC NGHIỆM 4 PHƯƠNG ÁN (20 CÂU)\n*Thí sinh chọn 1 phương án đúng nhất trong mỗi câu.*\n\n`;
let q1Blocks = part1Text.split(/^Câu (\d+) \([^)]+\):\s*/m).slice(1);
for (let i = 0; i < q1Blocks.length; i += 2) {
    let qNum = q1Blocks[i];
    let block = q1Blocks[i+1];
    
    let partsA = block.split(/\n*A\.\s*/);
    let question = partsA[0].trim();
    if (!partsA[1]) continue;
    let partsB = partsA[1].split(/\n*B\.\s*/);
    let optA = partsB[0].trim();
    if (!partsB[1]) continue;
    let partsC = partsB[1].split(/\n*C\.\s*/);
    let optB = partsC[0].trim();
    if (!partsC[1]) continue;
    let partsD = partsC[1].split(/\n*D\.\s*/);
    let optC = partsD[0].trim();
    let optD = partsD[1].trim();
    
    let ansData = answers.part1[qNum] || { ans: "A", exp: "Đang cập nhật" };
    let cIndex = 0;
    if (ansData.ans === "B") cIndex = 1;
    if (ansData.ans === "C") cIndex = 2;
    if (ansData.ans === "D") cIndex = 3;
    
    finalContent += `<Quiz \n  question={<><strong>Câu ${qNum}: </strong>${mdToJsx(question).replace(/^<>/, '').replace(/<\/>$/, '')}</>}\n  options={[\n    ${mdToJsx(optA)},\n    ${mdToJsx(optB)},\n    ${mdToJsx(optC)},\n    ${mdToJsx(optD)}\n  ]}\n  correctIndex={${cIndex}}\n  explanation={${mdToJsx(ansData.exp)}}\n/>\n\n`;
}

// PART 2
finalContent += `## PHẦN 2: TRẮC NGHIỆM ĐÚNG/SAI (10 CÂU)\n*Thí sinh xét tính Đúng/Sai của từng ý a, b, c, d trong mỗi câu.*\n\n`;
let q2Blocks = part2Text.split(/^Câu (\d+):\s*/m).slice(1);
for (let i = 0; i < q2Blocks.length; i += 2) {
    let qNum = q2Blocks[i];
    let block = q2Blocks[i+1];
    
    let [context, tablePart] = block.split(/Ý\s+Mệnh đề\s+Đúng\s+Sai/);
    context = context ? context.trim() : "";
    
    let statementsStr = "";
    if (tablePart) {
        let lines = tablePart.trim().split('\n');
        for (let line of lines) {
            let m = line.match(/^([a-d])\)\s+(.*?)\s*$/);
            if (m) {
                let id = m[1];
                let text = m[2];
                let ansData = answers.part2[qNum] && answers.part2[qNum][id];
                if (ansData) {
                    statementsStr += `    {\n      id: "${id}",\n      text: ${mdToJsx(text)},\n      isTrue: ${ansData.isTrue},\n      explanation: ${mdToJsx(ansData.exp)}\n    },\n`;
                }
            }
        }
    }
    finalContent += `<QuizTF \n  question="Câu ${qNum}:"\n  context={${mdToJsx(context)}}\n  statements={[\n${statementsStr}  ]}\n/>\n\n`;
}

// PART 3
finalContent += `## PHẦN 3: TRẮC NGHIỆM TRẢ LỜI NGẮN (10 CÂU)\n*Thí sinh tính toán và điền kết quả dạng số.*\n\n`;
let q3Blocks = part3Text.split(/^Câu (\d+):\s*/m).slice(1);
for (let i = 0; i < q3Blocks.length; i += 2) {
    let qNum = q3Blocks[i];
    let block = q3Blocks[i+1];
    
    let [question, ...rest] = block.split(/Đáp số:/);
    question = question.trim();
    
    let ansData = answers.part3[qNum] || { ans: "0", exp: "Đang cập nhật" };
    
    finalContent += `<QuizShort \n  question="Câu ${qNum}:"\n  context={${mdToJsx(question)}}\n  answer="${ansData.ans}"\n  explanation={${mdToJsx(ansData.exp)}}\n/>\n\n`;
}

// PART 4
finalContent += `## PHẦN 4: TỰ LUẬN (5 CÂU)\n\n`;
let q4Blocks = part4Text.split(/^Câu (\d+) \([^)]+\):\s*/m).slice(1);
for (let i = 0; i < q4Blocks.length; i += 2) {
    let qNum = q4Blocks[i];
    let question = q4Blocks[i+1].trim();
    
    let exp = answers.part4[qNum] || "Đang cập nhật";
    
    finalContent += `**Câu ${qNum}:**\n<div className="mb-4 whitespace-pre-wrap">{${mdToJsx(question)}}</div>\n\n<details className="mb-8 border border-slate-300 rounded-lg bg-white overflow-hidden shadow-sm">\n  <summary className="font-semibold bg-slate-100 p-4 cursor-pointer hover:bg-slate-200 transition-colors select-none text-slate-700">\n    Xem lời giải chi tiết\n  </summary>\n  <div className="p-4 bg-white whitespace-pre-wrap leading-relaxed text-slate-800 border-t border-slate-200">\n    {${mdToJsx(exp)}}\n  </div>\n</details>\n\n`;
}

fs.writeFileSync(outputFile, finalContent);
console.log('Conversion completed.');
