const fs = require('fs');
const path = require('path');

const filePath = 'C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/email_00_clean.html';
if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  const regex = /\{<\/span>(<span[^>]+>)Nome(<\/span>)(<span[^>]+>)\}/g;
  let matchesCount = 0;
  content.replace(regex, (match) => {
    matchesCount++;
    console.log(`Match found ${matchesCount}`);
  });
  
  const newContent = content.replace(regex, '</span>$1{nome}$2$3');
  console.log("After replacement, checking if {nome} exists:");
  const testRegex = /\{nome\}/g;
  let testCount = 0;
  while (testRegex.exec(newContent) !== null) {
    testCount++;
  }
  console.log(`Found {nome} count: ${testCount}`);
} else {
  console.log("File not found");
}
