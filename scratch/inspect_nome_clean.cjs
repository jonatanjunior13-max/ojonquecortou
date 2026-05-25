const fs = require('fs');
const path = require('path');

const file00 = 'C:/Users/jonat/Downloads/00 _ Pedido recebido _ aguardando.html';
const content00 = fs.readFileSync(file00, 'utf8');

const regex = /Nome/gi;
let match;
console.log('=== Searches for "Nome" after index 880000 ===');
while ((match = regex.exec(content00)) !== null) {
  if (match.index > 880000) {
    console.log(`Match at ${match.index}: "${content00.substring(match.index - 50, match.index + 50).replace(/\r?\n/g, ' ')}"`);
  }
}
