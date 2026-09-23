const fs = require('fs');
let content = fs.readFileSync('d:\\\\Board\\\\hockage-board\\\\scratch\\\\convert_interactive.js', 'utf8');

content = content.replace(/\$\{JSON\.stringify\(mdToJsx\((.*?)\)\)\.replace\(\/\^"\|"\$\/g, ''\)\}/g, '${mdToJsx($1)}');

fs.writeFileSync('d:\\\\Board\\\\hockage-board\\\\scratch\\\\convert_interactive.js', content);
console.log('Script updated successfully');
