const fs = require('fs');
const path = require('path');

const filePath = 'C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/email_00_super_clean_final.html';
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  console.log('Size:', content.length, 'bytes');
  console.log(content.substring(0, 1500));
} else {
  console.log('File not found:', filePath);
}
