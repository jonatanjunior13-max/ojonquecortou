const fs = require('fs');
const path = require('path');

const file00 = 'C:/Users/jonat/Downloads/00 _ Pedido recebido _ aguardando.html';
const content00 = fs.readFileSync(file00, 'utf8');

const regex = /Recebe/gi;
let match;
while ((match = regex.exec(content00)) !== null) {
  console.log(`Match at ${match.index}: "${content00.substring(match.index - 100, match.index + 200).replace(/\r?\n/g, ' ')}"`);
}
