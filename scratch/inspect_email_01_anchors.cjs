const fs = require('fs');
const path = require('path');

const filePath = 'C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/email_01.html';
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Find all a tags and print them
  const regex = /<a[^>]*>[\s\S]*?<\/a>/gi;
  let match;
  let count = 0;
  while ((match = regex.exec(content)) !== null) {
    count++;
    console.log(`\nLink ${count}:`);
    console.log(match[0].replace(/\r?\n/g, ' '));
  }
} else {
  console.log("File not found");
}
