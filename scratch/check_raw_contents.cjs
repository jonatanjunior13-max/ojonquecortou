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
  const size = fs.statSync(filePath).size;
  console.log(`=== File: ${fileName} (${size} bytes) ===`);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Extract style tags
  const styleMatches = content.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
  if (styleMatches) {
    console.log(`Found ${styleMatches.length} <style> tags.`);
    styleMatches.forEach((styleTag, i) => {
      console.log(`Style tag ${i + 1} length: ${styleTag.length} characters.`);
      // Print first 500 characters of style tag content
      console.log(`Snippet: ${styleTag.substring(0, 500)}...\n`);
    });
  } else {
    console.log('No <style> tags found.');
  }

  // Find occurrences of mail clients preview/header markers
  // e.g. "jon@ojonquecortou" or similar headers
  const headerIdx = content.indexOf('jon@ojonquecortou.com.br');
  if (headerIdx !== -1) {
    console.log(`Found "jon@ojonquecortou.com.br" at index ${headerIdx}. Context:`);
    console.log(content.substring(headerIdx - 100, headerIdx + 200));
  } else {
    console.log('Did not find "jon@ojonquecortou.com.br" in body.');
  }
  console.log('\n');
});
