const fs = require('fs');
const path = require('path');

const filePath = 'C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/email_01.html';
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check style tag length
  const styleStart = content.indexOf('<style>');
  const styleEnd = content.indexOf('</style>');
  if (styleStart !== -1 && styleEnd !== -1) {
    console.log(`<style> block length: ${styleEnd - styleStart} bytes`);
  }
  
  // Let's print the structure of the file: tags and their attributes
  // Let's see if there are any inline style blocks or other elements that are huge
  const bodyStart = content.indexOf('<body');
  const bodyEnd = content.indexOf('</body>');
  console.log(`<body> content length: ${bodyEnd - bodyStart} bytes`);
  
  // Let's find tags that are exceptionally long
  const regex = /<([^>]{1000,})>/gi;
  let match;
  let count = 0;
  while ((match = regex.exec(content)) !== null && count < 10) {
    count++;
    console.log(`\nLong tag ${count} found at index ${match.index}, length: ${match[1].length}`);
    console.log(match[1].substring(0, 200) + '...');
  }
} else {
  console.log("File not found");
}
