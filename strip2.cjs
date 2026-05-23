const fs = require('fs'); 
let html = fs.readFileSync('preview.html', 'utf8'); 
html = html.replace(/style="[^"]+"/g, ''); 
fs.writeFileSync('structure.html', html);
