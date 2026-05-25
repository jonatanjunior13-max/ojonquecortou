const fs = require('fs');
const path = require('path');

const filePath = 'C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/email_00_clean.html';
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  const searchTerms = ['data', 'servico', 'horario'];
  searchTerms.forEach(term => {
    console.log(`\n=== Searching for "${term}" in email_00_clean.html ===`);
    const regex = new RegExp(`.{0,100}\\{${term}\\}.{0,100}`, 'gi');
    let match;
    let count = 0;
    while ((match = regex.exec(content)) !== null) {
      count++;
      console.log(`Match ${count}: "${match[0].replace(/\r?\n/g, ' ')}"`);
    }
  });
} else {
  console.log("File not found");
}
