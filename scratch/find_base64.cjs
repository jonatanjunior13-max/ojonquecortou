const fs = require('fs');
const path = require('path');

const filePath = 'C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/email_01.html';
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  const regex = /data:image\/[^;]+;base64,([^"]*)/gi;
  let match;
  let count = 0;
  while ((match = regex.exec(content)) !== null) {
    count++;
    console.log(`Base64 image ${count} found at index ${match.index}, length: ${match[1].length} characters`);
  }
} else {
  console.log("File not found");
}
