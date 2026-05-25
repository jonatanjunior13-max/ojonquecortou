const fs = require('fs');
const path = require('path');

const filePath = 'C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/email_01.html';
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`File size: ${content.length} bytes`);
  
  // Find title
  const titleMatch = content.match(/<title>([\s\S]*?)<\/title>/i);
  console.log(`Title: ${titleMatch ? titleMatch[1] : 'None'}`);
  
  // Find occurrences of Marina (case insensitive)
  const marinaRegex = /Marina/gi;
  let match;
  let count = 0;
  while ((match = marinaRegex.exec(content)) !== null) {
    count++;
    console.log(`Marina match ${count}: "${content.substring(match.index - 30, match.index + 30).replace(/\r?\n/g, ' ')}"`);
  }
  
  // Find potential split name tags {Nome} or {nome}
  const splitRegex = /\{[^}]*nome[^}]*\}/gi;
  let splitCount = 0;
  while ((match = splitRegex.exec(content)) !== null) {
    splitCount++;
    console.log(`Name tag match ${splitCount}: "${match[0]}"`);
  }

  // Let's search for links
  const linksRegex = /href="([^"]*)"/gi;
  let linkCount = 0;
  console.log("\n=== LINKS ===");
  while ((match = linksRegex.exec(content)) !== null && linkCount < 20) {
    linkCount++;
    console.log(`${linkCount}: ${match[1]}`);
  }
} else {
  console.log("File not found");
}
