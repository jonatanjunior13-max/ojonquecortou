const fs = require('fs');
const path = require('path');

const file00 = 'C:/Users/jonat/Downloads/00 _ Pedido recebido _ aguardando.html';
const content00 = fs.readFileSync(file00, 'utf8');

const idx = 1444981;
// Print 100 characters before and 100 characters after idx, but including the tags
console.log('=== Raw segment ===');
console.log(content00.substring(idx - 400, idx + 400));
