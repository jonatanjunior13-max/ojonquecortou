const fs = require('fs');
const path = require('path');

const filePath = 'C:/Users/jonat/Downloads/00 _ Pedido recebido _ aguardando.html';
const content = fs.readFileSync(filePath, 'utf8');

// Find index of class="mail-body
const bodyIdx = content.indexOf('class="mail-body');
if (bodyIdx === -1) {
  console.log('No mail-body class found');
  process.exit(0);
}

// Let's print the last 2000 characters of the file to see how it ends
console.log('=== End of file ===');
console.log(content.substring(content.length - 2000));
