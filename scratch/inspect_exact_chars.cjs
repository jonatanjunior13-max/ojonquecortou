const fs = require('fs');
const path = require('path');

const filePath = 'C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/email_00_clean.html';
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Find "<span" tags and print the ones containing the words we are interested in
  const regex = /<span[^>]*>[^<]*?(?:Recebi|Aguardando|seu|\{data\}|\{servico\})[^<]*?<\/span>/gi;
  let match;
  let count = 0;
  while ((match = regex.exec(content)) !== null) {
    count++;
    console.log(`\nMatch ${count}:`);
    console.log(match[0]);
  }
} else {
  console.log("File not found");
}
