const fs = require('fs');
const path = require('path');

const filePath = 'C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/email_00_clean.html';
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  const searchTerms = ['ata}', 'ervico}'];
  searchTerms.forEach(term => {
    console.log(`\n=== Searching for "${term}" ===`);
    const regex = new RegExp(`.{0,100}${term}.{0,100}`, 'g');
    let match;
    while ((match = regex.exec(content)) !== null) {
      console.log(`Match: "${match[0]}"`);
    }
  });
} else {
  console.log("File not found");
}
