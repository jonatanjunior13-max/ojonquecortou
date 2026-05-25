const fs = require('fs');
const path = require('path');

const filePath = 'C:/Users/jonat/Downloads/00 _ Pedido recebido _ aguardando.html';
const content = fs.readFileSync(filePath, 'utf8');

const bodyIdx = content.indexOf('<body');
if (bodyIdx !== -1) {
  console.log('=== body starts at index', bodyIdx);
  // print first 4000 chars after <body> tag
  const snippet = content.substring(bodyIdx, bodyIdx + 4000);
  console.log(snippet);
} else {
  console.log('No body tag found.');
}
