const fs = require('fs');
const path = require('path');

const filePath = 'C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/email_01.html';
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Search for date/time/service
  const searchTerms = ['18 de Junho', '14h00', '18/Jun', 'Corte', 'Caiçara', 'Francisco', 'Cacheados'];
  searchTerms.forEach(term => {
    console.log(`\n=== Matches for "${term}" ===`);
    const regex = new RegExp(`.{0,50}${term}.{0,50}`, 'gi');
    let m;
    let count = 0;
    while ((m = regex.exec(content)) !== null && count < 5) {
      count++;
      console.log(`Match ${count}: "${m[0].replace(/\r?\n/g, ' ')}"`);
    }
  });
} else {
  console.log("File not found");
}
