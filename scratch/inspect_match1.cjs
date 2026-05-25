const fs = require('fs');
const path = require('path');

const filePath = 'C:/Users/jonat/Downloads/00 _ Pedido recebido _ aguardando.html';
const content = fs.readFileSync(filePath, 'utf8');

const matchPos = 987613;
console.log('=== Surrounding HTML ===');
console.log(content.substring(matchPos - 2000, matchPos + 2000));
