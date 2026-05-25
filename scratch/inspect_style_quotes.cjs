const fs = require('fs');
const path = require('path');

const filePath = 'C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/email_00_clean.html';
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Find all occurrences of &quot;
  const regex = /&quot;/g;
  let count = 0;
  while (regex.exec(content) !== null) {
    count++;
  }
  console.log(`Total occurrences of &quot; in email_00_clean.html: ${count}`);
  
  // Print a few examples of where they are
  const matches = content.match(/.{0,50}&quot;.{0,50}/g) || [];
  console.log("Examples:");
  matches.slice(0, 10).forEach((m, i) => {
    console.log(`${i+1}: "${m.replace(/\r?\n/g, ' ')}"`);
  });
} else {
  console.log("File not found");
}
