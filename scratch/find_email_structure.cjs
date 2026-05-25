const fs = require('fs');
const path = require('path');

const filePath = 'C:/Users/jonat/Downloads/00 _ Pedido recebido _ aguardando.html';
const content = fs.readFileSync(filePath, 'utf8');

const bodyIdx = content.indexOf('<body');
if (bodyIdx === -1) {
  console.log('No body found');
  process.exit(0);
}

const bodyContent = content.substring(bodyIdx);
// Find divs with class names
const divRegex = /<div\s+[^>]*class="([^"]+)"[^>]*>/gi;
let match;
let count = 0;
console.log('=== DIV elements found in body ===');
while ((match = divRegex.exec(bodyContent)) !== null && count < 20) {
  count++;
  console.log(`Div ${count}: class="${match[1]}" at relative index ${match.index}`);
  // Let's print a small snippet of the opening tag
  const tagSnippet = match[0].substring(0, 150);
  console.log(`   Tag snippet: ${tagSnippet}...`);
}
