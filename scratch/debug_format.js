const fs = require('fs'); 
let content = fs.readFileSync('d:\\Board\\hockage-board\\scratch\\bai2-input.md', 'utf8'); 
content = content.replace(/^Câu (\d+) \(([^)]+)\):/gm, '**Câu $1 ($2):**'); 
content = content.replace(/^Câu (\d+):/gm, '**Câu $1:**'); 
content = content.replace(/ A\. /g, '\nA. '); 

console.log(content.substring(0, 500));
