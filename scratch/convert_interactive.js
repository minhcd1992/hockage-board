const fs = require('fs');
const path = require('path');

const filePath = 'c:\\\\Users\\\\Admin\\\\Downloads\\\\quang-duong-do-dich-chuyen-sbt.md';
let content = fs.readFileSync(filePath, 'utf8');

// Replace corrupted escape sequences safely
content = content.replace(/\t(ext|an|heta)/g, (m, p1) => '\\' + 't' + p1);
content = content.replace(/\f(rac)/g, (m, p1) => '\\' + 'f' + p1);
content = content.replace(/\x07(pprox|lpha)/g, (m, p1) => '\\' + 'a' + p1);
content = content.replace(/\v(ec)/g, (m, p1) => '\\' + 'v' + p1);
content = content.replace(/\r(ightarrow)/g, (m, p1) => '\\' + 'r' + p1);

// Remove the top two headers (the user's title)
content = content.replace(/^# SÁCH BÀI TẬP VẬT LÍ 10 - CHƯƠNG TRÌNH GDPT 2018 & HALLIDAY PHYSICS\n/m, '');
content = content.replace(/^## BÀI 1: QUÃNG ĐƯỜNG VÀ ĐỘ DỊCH CHUYỂN \(Kho Luyện Tập Chuyên Sâu 45 Câu\)\n/m, '');

// Helper to convert markdown to JSX
function mdToJsx(text) {
    if (!text) return '';
    // Replace math first
    text = text.replace(/\$([^$]+)\$/g, (m, p1) => {
        return '<Math inline>{' + JSON.stringify(p1) + '}</Math>';
    });
    // Replace bold
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Replace italic
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    // Replace newlines with <br/>
    text = text.replace(/\n/g, '<br/>');
    return '<>' + text + '</>';
}

// Split into parts
const parts = content.split(/---+\s*\n+## PHẦN/);

if (parts.length < 5) {
    console.error("Could not split into parts. Length:", parts.length);
    process.exit(1);
}

const header = parts[0];
const part1Text = '## PHẦN' + parts[1];
const part2Text = '## PHẦN' + parts[2];
const part3Text = '## PHẦN' + parts[3];
const part4Text = '## PHẦN' + parts[4];
const part5Text = '## PHẦN' + parts[5];

// Parse Answers (Part 5)
const answers = { part1: {}, part2: {}, part3: {}, part4: {} };

// Part 1 Answers
const p1Matches = part5Text.match(/### PHẦN 1:[\s\S]*?(?=### PHẦN 2:)/);
if (p1Matches) {
    const lines = p1Matches[0].split('\n');
    for (let line of lines) {
        const m = line.match(/^(\d+)\.\s*\*\*(A|B|C|D)\*\*\s*\|\s*(.*)$/);
        if (m) {
            answers.part1[m[1]] = { ans: m[2], exp: m[3] };
        }
    }
}

// Part 2 Answers
const p2Matches = part5Text.match(/### PHẦN 2:[\s\S]*?(?=### PHẦN 3:)/);
if (p2Matches) {
    let currentQ = null;
    const lines = p2Matches[0].split('\n');
    for (let line of lines) {
        let mQ = line.match(/^\*\*Câu (\d+):\*\*/);
        if (mQ) {
            currentQ = mQ[1];
            answers.part2[currentQ] = {};
        } else if (currentQ) {
            let mOpt = line.match(/^\*\s*\*\*([a-d])\)\s*(ĐÚNG|SAI):\*\*\s*(.*)$/);
            if (mOpt) {
                answers.part2[currentQ][mOpt[1]] = { isTrue: mOpt[2] === 'ĐÚNG', exp: mOpt[3] };
            }
        }
    }
}

// Part 3 Answers
const p3Matches = part5Text.match(/### PHẦN 3:[\s\S]*?(?=### PHẦN 4:)/);
if (p3Matches) {
    let currentQ = null;
    let expLines = [];
    const lines = p3Matches[0].split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let mQ = line.match(/^\*\*Câu (\d+):\*\*\s*\*\*`([^`]+)`\*\*/);
        if (mQ) {
            if (currentQ && expLines.length > 0) {
                answers.part3[currentQ].exp = expLines.join('\n');
            }
            currentQ = mQ[1];
            answers.part3[currentQ] = { ans: mQ[2], exp: '' };
            expLines = [];
        } else if (currentQ && line.trim() !== '') {
            if (line.startsWith('* *Giải:*')) {
                expLines.push(line.replace('* *Giải:*', '').trim());
            } else {
                expLines.push(line.trim());
            }
        }
    }
    if (currentQ && expLines.length > 0) {
        answers.part3[currentQ].exp = expLines.join('\n');
    }
}

// Generates Quiz for Part 1
let newPart1 = `## PHẦN 1: TRẮC NGHIỆM 4 PHƯƠNG ÁN (20 CÂU)\n*Thí sinh chọn 1 phương án đúng nhất trong mỗi câu.*\n\n`;
const q1Blocks = part1Text.split(/\*\*Câu \d+ \([^)]+\):\*\*/).slice(1);
const q1Titles = [...part1Text.matchAll(/\*\*Câu (\d+) \([^)]+\):\*\*/g)];

for (let i = 0; i < q1Blocks.length; i++) {
    const qNum = q1Titles[i][1];
    const block = q1Blocks[i].trim();
    // split by * **A.** 
    let [question, optsPart] = block.split(/\*\s*\*\*A\.\*\*/);
    if (!optsPart) continue;
    question = question.trim();
    
    let opts = [];
    let bSplit = optsPart.split(/\*\s*\*\*B\.\*\*/);
    opts.push(bSplit[0].trim());
    let cSplit = bSplit[1].split(/\*\s*\*\*C\.\*\*/);
    opts.push(cSplit[0].trim());
    let dSplit = cSplit[1].split(/\*\s*\*\*D\.\*\*/);
    opts.push(dSplit[0].trim());
    opts.push(dSplit[1].trim());

    const ansData = answers.part1[qNum];
    let correctIndex = ['A', 'B', 'C', 'D'].indexOf(ansData.ans);

    newPart1 += `<Quiz \n  question={${mdToJsx(`**Câu ${qNum}:** ` + question)}}\n  options={[\n    ${opts.map(o => mdToJsx(o)).join(',\n    ')}\n  ]}\n  correctIndex={${correctIndex}}\n  explanation={${mdToJsx(ansData.exp)}}\n/>\n\n`;
}

// Generate QuizTF for Part 2
let newPart2 = `## PHẦN 2: TRẮC NGHIỆM ĐÚNG/SAI (10 CÂU)\n*Thí sinh xét tính Đúng/Sai của từng ý a, b, c, d trong mỗi câu.*\n\n`;
const q2Blocks = part2Text.split(/\*\*Câu \d+:\*\*/).slice(1);
const q2Titles = [...part2Text.matchAll(/\*\*Câu (\d+):\*\*/g)];

for (let i = 0; i < q2Blocks.length; i++) {
    const qNum = q2Titles[i][1];
    const block = q2Blocks[i].trim();
    
    // context is everything before the table
    let [context, tablePart] = block.split(/\| Ý \|/);
    context = context.trim();
    
    // Parse table statements
    const statements = [];
    if (tablePart) {
        const tableLines = tablePart.split('\n');
        for (let line of tableLines) {
            let m = line.match(/^\|\s*\*\*([a-d])\)\*\*\s*\|\s*(.*?)\s*\|/);
            if (m) {
                let id = m[1];
                let text = m[2];
                let ansData = answers.part2[qNum] && answers.part2[qNum][id];
                if (ansData) {
                    statements.push(`    {\n      id: "${id}",\n      text: ${mdToJsx(text)},\n      isTrue: ${ansData.isTrue},\n      explanation: ${mdToJsx(ansData.exp)}\n    }`);
                }
            }
        }
    }
    
    newPart2 += `<QuizTF \n  question="Câu ${qNum}:"\n  context={${mdToJsx(context)}}\n  statements={[\n${statements.join(',\n')}\n  ]}\n/>\n\n`;
}

// Generate QuizShort for Part 3
let newPart3 = `## PHẦN 3: TRẮC NGHIỆM TRẢ LỜI NGẮN (10 CÂU)\n*Thí sinh tính toán và điền kết quả dạng số.*\n\n`;
const q3Blocks = part3Text.split(/\*\*Câu \d+:\*\*/).slice(1);
const q3Titles = [...part3Text.matchAll(/\*\*Câu (\d+):\*\*/g)];

for (let i = 0; i < q3Blocks.length; i++) {
    const qNum = q3Titles[i][1];
    let block = q3Blocks[i].trim();
    block = block.replace(/\*Đáp số:\* \.+/g, '').trim();
    
    const ansData = answers.part3[qNum];
    if (ansData) {
        newPart3 += `<QuizShort \n  question="Câu ${qNum}:"\n  context={${mdToJsx(block)}}\n  answer="${ansData.ans}"\n  explanation={${mdToJsx(ansData.exp)}}\n/>\n\n`;
    }
}

// Reconstruct the file (Excluding Part 5 as answers are now inlined, and Part 4 remains as is or formatted with details)
// Let's format Part 4 with details for answers
let newPart4 = `## PHẦN 4: TỰ LUẬN (5 CÂU)\n\n`;
const q4Blocks = part4Text.split(/\*\*Câu \d+ [^*]+\:\*\*/).slice(1);
const q4Titles = [...part4Text.matchAll(/\*\*Câu (\d+) ([^*]+)\:\*\*/g)];

// Parse Part 4 Answers
const p4Matches = part5Text.match(/### PHẦN 4:[\s\S]*/);
let p4AnsBlocks = [];
if (p4Matches) {
    p4AnsBlocks = p4Matches[0].split(/#### \*\*Câu \d+:\*\*/).slice(1);
}

function formatPart4(text) {
    if (!text) return '';
    // Fix math
    text = text.replace(/\$\$([^$]+)\$\$/g, (m, p1) => {
        return '<Math>{' + JSON.stringify(p1) + '}</Math>';
    });
    text = text.replace(/(?<!\$)\$([^$]+)\$(?!\$)/g, (m, p1) => {
        return '<Math inline>{' + JSON.stringify(p1) + '}</Math>';
    });
    // Convert table generic
    text = text.replace(/(?:^\|.*\|(?:\n|$))+/gm, (match) => {
        let lines = match.trim().split('\n');
        if (lines.length < 2) return match;
        // Check if second line is a valid separator like |---| or |:---:|
        if (!/^\|[\s\-\:\|]+\|$/.test(lines[1].trim())) return match;
        
        let html = '<div className="overflow-x-auto my-6"><table className="w-full max-w-3xl mx-auto text-center border-collapse border border-slate-300 shadow-sm rounded-lg">\n';
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            if (i === 1) continue; // Skip separator
            
            let cells = line.split('|').filter((s, idx, arr) => !(idx === 0 && s === '') && !(idx === arr.length - 1 && s === ''));
            
            if (i === 0) {
                html += '<thead><tr className="bg-slate-100">';
                for (let cell of cells) {
                    html += `<th className="border border-slate-300 p-3 font-semibold text-slate-700">${cell.trim()}</th>`;
                }
                html += '</tr></thead>\n<tbody>\n';
            } else {
                html += '<tr className="hover:bg-slate-50 transition-colors">';
                for (let j = 0; j < cells.length; j++) {
                    let cell = cells[j].trim();
                    let className = "border border-slate-300 p-3";
                    if (j === 0) className += " font-semibold bg-slate-50";
                    if (cell.includes('**')) {
                        className += " font-bold text-indigo-600";
                        cell = cell.replace(/\*\*/g, '');
                    }
                    html += `<td className="${className}">${cell}</td>`;
                }
                html += '</tr>\n';
            }
        }
        html += '</tbody></table></div>\n\n';
        return html;
    });
    return text;
}

for (let i = 0; i < q4Blocks.length; i++) {
    const qNum = q4Titles[i][1];
    const qTitle = q4Titles[i][2];
    let block = q4Blocks[i].trim();
    
    let ansBlock = p4AnsBlocks[i] ? p4AnsBlocks[i].trim().replace(/---/g, '').trim() : '';
    
    block = formatPart4(block);
    ansBlock = formatPart4(ansBlock);
    
    newPart4 += `**Câu ${qNum} ${qTitle}:**\n\n${block}\n\n`;
    newPart4 += `<details className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-4 mb-8">\n<summary className="font-bold text-indigo-600 cursor-pointer">Xem hướng dẫn giải</summary>\n<div className="mt-4">\n\n${ansBlock}\n\n</div>\n</details>\n\n`;
}

const finalContent = `import { Quiz } from '@/components/lesson/Quiz'
import { QuizTF } from '@/components/lesson/QuizTF'
import { QuizShort } from '@/components/lesson/QuizShort'

` + header + newPart1 + newPart2 + newPart3 + newPart4;
const outPath = 'd:\\\\Board\\\\hockage-board\\\\app\\\\lesson\\\\bai-1\\\\bai-tap\\\\page.mdx';
fs.writeFileSync(outPath, finalContent);
console.log('Conversion completed.');
