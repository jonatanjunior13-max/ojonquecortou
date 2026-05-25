const fs = require('fs');
const path = require('path');

const rawPath = 'C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/email_00.html';
const cleanPath = 'C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/email_00_clean.html';

if (fs.existsSync(rawPath) && fs.existsSync(cleanPath)) {
  const rawContent = fs.readFileSync(rawPath, 'utf8');
  const cleanContent = fs.readFileSync(cleanPath, 'utf8');

  // Let's find "Recebi" in both
  console.log("=== RAW FILE matches for 'Recebi' ===");
  findAround(rawContent, 'Recebi');
  
  console.log("\n=== CLEAN FILE matches for 'Recebi' ===");
  findAround(cleanContent, 'Recebi');

  // Let's search for "ecebi" in clean file
  console.log("\n=== CLEAN FILE matches for 'ecebi' ===");
  findAround(cleanContent, 'ecebi');
} else {
  console.log("Files not found");
}

function findAround(content, term) {
  const regex = new RegExp(`.{0,50}${term}.{0,50}`, 'gi');
  let match;
  let count = 0;
  while ((match = regex.exec(content)) !== null) {
    count++;
    console.log(`Match ${count}: "${match[0].replace(/\r?\n/g, ' ')}"`);
  }
}
