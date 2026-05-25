const fs = require('fs');
const path = require('path');

const file00 = 'C:/Users/jonat/Downloads/00 _ Pedido recebido _ aguardando.html';
const content00 = fs.readFileSync(file00, 'utf8');

// Find all occurrences of '{'
let pos = content00.indexOf('{');
let count = 0;
console.log('=== Opening brackets found ===');
while (pos !== -1) {
  count++;
  console.log(`Bracket ${count} at index ${pos}: "${content00.substring(pos, pos + 100).replace(/\r?\n/g, ' ')}"`);
  pos = content00.indexOf('{', pos + 1);
}
