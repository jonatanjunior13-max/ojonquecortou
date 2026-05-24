const fs = require('fs');
const path = require('path');

const files = ['email_00_clean.html', 'email_02_clean.html', 'email_06_clean.html'];

files.forEach(file => {
  const filePath = path.join('C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou', file);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${file}`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  console.log(`\n=== Inspecting ${file} ===`);
  
  // Find { and look ahead up to 300 characters for }
  const regex = /\{[\s\S]*?\}/g;
  let match;
  let count = 0;
  while ((match = regex.exec(content)) !== null) {
    count++;
    console.log(`Match ${count}: "${match[0].replace(/\r?\n/g, ' ')}"`);
  }
});
