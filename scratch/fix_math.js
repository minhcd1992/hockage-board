const fs = require('fs');
let text = fs.readFileSync('app/lesson/bai-2/page.mdx', 'utf-8');

// Fix 1 giờ
text = text.replace(/<Math inline>\{"1\\\\text\{ giờ\}"\}<\/Math>/g, '<Math inline>{"1"}</Math> giờ');

// Fix 2 giờ, 3 giờ, 10 giờ in the quizzes
text = text.replace(/<Math inline>\{"2\\\\text\{ giờ\}"\}<\/Math>/g, '<Math inline>{"2"}</Math> giờ');
text = text.replace(/<Math inline>\{"3\\\\text\{ giờ\}"\}<\/Math>/g, '<Math inline>{"3"}</Math> giờ');
text = text.replace(/<Math inline>\{"10\\\\text\{ giờ\}"\}<\/Math>/g, '<Math inline>{"10"}</Math> giờ');

// Fallback for any other " giờ"
text = text.replace(/\\\\text\{ giờ\}/g, '\\\\text{ h}');

// Fix tốc độ, vận tốc in \text
text = text.replace(/\\\\text\{tốc độ\}/g, '\\\\text{toc do}');
text = text.replace(/\\\\text\{vận tốc\}/g, '\\\\text{van toc}');

fs.writeFileSync('app/lesson/bai-2/page.mdx', text, 'utf-8');
console.log('Fixed page.mdx');
