const fs = require('fs');
let filePath = 'd:\\\\Board\\\\hockage-board\\\\app\\\\lesson\\\\bai-1\\\\bai-tap\\\\page.mdx';
let content = fs.readFileSync(filePath, 'utf8');

// We want to replace non-ASCII characters inside math mode that are NOT wrapped in \text{}
// We want to replace non-ASCII characters inside math mode that are NOT wrapped in \text{}

function fixContent(mathContent) {
    mathContent = mathContent.replace(/_([a-zA-ZÀ-ỹ]+)/g, (m, p1) => {
        if (p1.length > 1 || /[^\x00-\x7F]/.test(p1)) {
            return '_{\\\\text{' + p1 + '}}';
        }
        return m;
    });

    mathContent = mathContent.replace(/_\{([a-zA-ZÀ-ỹ]+)\}/g, (m, p1) => {
        if (p1.length > 1 || /[^\x00-\x7F]/.test(p1)) {
            return '_{\\\\text{' + p1 + '}}';
        }
        return m;
    });
    
    mathContent = mathContent.replace(/(?<!\\\\text\{)đpcm(?!\})/g, '\\\\text{đpcm}');
    return mathContent;
}

// Math mode is between <Math inline>{" and "}</Math>
content = content.replace(/<Math inline>\{"([^"]+)"\}<\/Math>/g, (match, mathContent) => {
    return '<Math inline>{"' + fixContent(mathContent) + '"}</Math>';
});

// Math mode is between $$ and $$ (needs to be checked before single $)
content = content.replace(/\$\$([^$]+)\$\$/g, (match, mathContent) => {
    return '$$' + fixContent(mathContent) + '$$';
});

// Math mode is between $ and $
content = content.replace(/(?<!\$)\$([^$]+)\$(?!\$)/g, (match, mathContent) => {
    return '$' + fixContent(mathContent) + '$';
});

fs.writeFileSync(filePath, content);
console.log('Math subscripts fixed');
