const fs = require('fs');
const path = require('path');

const filePath = 'C:/Users/jonat/Downloads/00 _ Pedido recebido _ aguardando.html';
const content = fs.readFileSync(filePath, 'utf8');

const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
if (styleMatch) {
  const css = styleMatch[1];
  console.log('Style block length:', css.length);
  
  // Find all instances of @media
  const mediaMatches = css.match(/@media[^{]*\{([\s\S]*?\n\s*\})/g);
  if (mediaMatches) {
    console.log(`Found ${mediaMatches.length} @media rules:`);
    mediaMatches.forEach((m, idx) => {
      console.log(`Media ${idx+1}:\n`, m);
    });
  } else {
    console.log('No @media rules found in CSS.');
  }
} else {
  console.log('No style block found.');
}
