const fs = require('fs');
const path = require('path');

const file00 = 'C:/Users/jonat/Downloads/00 _ Pedido recebido _ aguardando.html';
const content00 = fs.readFileSync(file00, 'utf8');

const idx = 1433581;
console.log('=== Raw Bracket 53 Context ===');
console.log(content00.substring(idx - 100, idx + 11500));
