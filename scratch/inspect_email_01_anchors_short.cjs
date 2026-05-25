const fs = require('fs');
const path = require('path');

const filePath = 'C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/email_01.html';
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Find all <a ...>...</a> tags and print their href and text content
  const regex = /<a\s+[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  let count = 0;
  while ((match = regex.exec(content)) !== null) {
    count++;
    const href = match[1];
    const text = match[2].replace(/<[^>]*>/g, '').trim();
    console.log(`Link ${count}: text="${text}" href="${href}"`);
  }
} else {
  console.log("File not found");
}
