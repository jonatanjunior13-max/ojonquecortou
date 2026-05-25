const fs = require('fs');
const path = require('path');

const file00 = 'C:/Users/jonat/Downloads/00 _ Pedido recebido _ aguardando.html';
let content = fs.readFileSync(file00, 'utf8');

// Regex for split name tags
const nameRegex = /\{\s*<\/span>\s*<span[^>]*>\s*Nome\s*<\/span>\s*<span[^>]*>\s*\}/gi;

const matches = content.match(nameRegex);
console.log('Matches found with regex:', matches);

if (matches) {
  content = content.replace(nameRegex, '{nome}');
  console.log('Replaced successfully! Search for "{nome}" count:', (content.match(/{nome}/g) || []).length);
}
