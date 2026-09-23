const fs = require('fs');
let content = fs.readFileSync('d:\\\\Board\\\\hockage-board\\\\scratch\\\\convert_interactive.js', 'utf8');

// Replace all JSON.stringify(mdToJsx(X)).replace(/^"|"$/g, '') with mdToJsx(X)
content = content.replace(/JSON\.stringify\(mdToJsx\((.*?)\)\)\.replace\(\/\^"\|"\$\/g, ''\)/g, 'mdToJsx($1)');

fs.writeFileSync('d:\\\\Board\\\\hockage-board\\\\scratch\\\\convert_interactive.js', content);
console.log('Fixed convert script');
