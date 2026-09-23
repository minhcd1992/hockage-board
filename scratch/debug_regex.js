const fs = require('fs'); 
let content = fs.readFileSync('d:\\Board\\hockage-board\\scratch\\bai2-input.md', 'utf8'); 
content = content.replace(/^Câu (\d+) \(([^)]+)\):/gm, '**Câu $1 ($2):**'); 
content = content.replace(/^Câu (\d+):/gm, '**Câu $1:**'); 
content = content.replace(/ A\. /g, '\nA. '); 

let ansIndex = content.indexOf('PHẦN 5: ĐÁP ÁN');
let questionsPart = content.substring(0, ansIndex);
const parts = questionsPart.split(/^PHẦN [1-4]:.*$/m);
let part1Text = parts[1];

const p1Matches = [...part1Text.matchAll(/\*\*Câu (\d+) \(([^)]+)\):\*\* (.*?)\n(A\..*?B\..*?C\..*?D\..*?)(?=\n\*\*Câu|$)/gs)];
console.log("Found matches:", p1Matches.length);
if (p1Matches.length > 0) {
    console.log(p1Matches[0][0]);
} else {
    // try to find where it fails
    const test = part1Text.match(/\*\*Câu (\d+) \(([^)]+)\):\*\*/g);
    console.log("Câu headers found:", test ? test.length : 0);
}
