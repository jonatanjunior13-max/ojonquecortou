const fs = require('fs'); 
let html = fs.readFileSync('C:/Users/jonat/Downloads/01 _ Confirma_o.html', 'utf8'); 
html = html.replace(/data:font\/[^;]+;base64,[^\)]+/g, '...'); 
html = html.replace(/data:image\/[^;]+;base64,[^\"]+/g, '...'); 
fs.writeFileSync('preview.html', html);
