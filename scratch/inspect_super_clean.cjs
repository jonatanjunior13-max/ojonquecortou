const fs = require('fs');
const path = require('path');

const filePath = 'C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/email_00_super_clean.html';
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Find all &quot; in the file
  const regex = /&quot;/g;
  let count = 0;
  while (regex.exec(content) !== null) {
    count++;
  }
  console.log(`Total occurrences of &quot; in email_00_super_clean.html: ${count}`);

  // Let's print matches for Recebi, Aguardando, {data}
  const terms = ['Recebi', 'Aguardando', '{data}'];
  terms.forEach(term => {
    console.log(`\n=== Matches for "${term}" ===`);
    const regex2 = new RegExp(`.{0,80}${term.replace(/\{/g, '\\{').replace(/\}/g, '\\}')}.{0,80}`, 'gi');
    let m;
    while ((m = regex2.exec(content)) !== null) {
      console.log(`Match: "${m[0].replace(/\r?\n/g, ' ')}"`);
    }
  });
} else {
  console.log("File not found");
}
