import fs from 'fs';

const file = 'src/utils/emailTemplates.js';
let content = fs.readFileSync(file, 'utf8');

// Replace <div class="tag">.*</div> including newlines if any
content = content.replace(/<div class="tag">[\s\S]*?<\/div>/g, '');

fs.writeFileSync(file, content);
console.log('Tags removed');
