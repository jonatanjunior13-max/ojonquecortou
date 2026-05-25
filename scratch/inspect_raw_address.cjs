const fs = require('fs');
const path = require('path');

const files = [
  '00 _ Pedido recebido _ aguardando.html',
  '01 _ Confirma_o (1).html',
  '02 _ Lembrete 24h _ dark (1).html',
  '06 _ Reativa_o (1).html'
];

files.forEach(fileName => {
  const filePath = path.join('C:/Users/jonat/Downloads', fileName);
  if (!fs.existsSync(filePath)) {
    console.log(`Not found: ${fileName}`);
    return;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`=== File: ${fileName} ===`);
  const regex = /Rua dos[^<]*/gi;
  let match;
  while ((match = regex.exec(content)) !== null) {
    console.log(`Found address match: "${match[0]}" at index ${match.index}`);
  }
});
