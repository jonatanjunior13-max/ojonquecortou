const fs = require('fs');
const path = require('path');

const filePath = 'C:/Users/jonat/Downloads/00 _ Pedido recebido _ aguardando.html';
const content = fs.readFileSync(filePath, 'utf8');

// Find all occurrences of "Studio do Jon" or "Studio"
const query = 'Studio do Jon';
let pos = content.indexOf(query);
let count = 0;
while (pos !== -1) {
  count++;
  console.log(`\n--- Match ${count} at index ${pos} ---`);
  console.log(content.substring(pos - 200, pos + 300));
  pos = content.indexOf(query, pos + 1);
}
