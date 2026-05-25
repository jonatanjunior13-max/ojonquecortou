const fs = require('fs');
const path = require('path');

const file00 = 'C:/Users/jonat/Downloads/00 _ Pedido recebido _ aguardando.html';
const content00 = fs.readFileSync(file00, 'utf8');

// Strip styles and script tags first
let clean = content00.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
clean = clean.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
// Strip HTML tags
clean = clean.replace(/<[^>]+>/g, ' ');
// Normalize spacing
clean = clean.replace(/\s+/g, ' ');

console.log('=== Extracted Text Content (first 2000 chars) ===');
console.log(clean.substring(0, 2000));
