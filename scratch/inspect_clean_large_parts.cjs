const fs = require('fs');
const path = require('path');

const filePath = 'C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/email_01_clean.html';
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Find tags that are exceptionally long
  const regex = /<([^>]{500,})>/gi;
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
