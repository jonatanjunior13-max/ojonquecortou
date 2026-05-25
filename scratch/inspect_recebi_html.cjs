const fs = require('fs');
const path = require('path');

const filePath = 'C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/email_00_clean.html';
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Let's print around "Recebi"
  const index = content.indexOf('Recebi');
  if (index !== -1) {
    console.log("=== HTML around Recebi ===");
    console.log(content.substring(index - 100, index + 150));
  } else {
    console.log("Recebi not found in clean file");
  }

  // Let's print around "Aguardando confirmação"
  const index2 = content.indexOf('Aguardando');
  if (index2 !== -1) {
    console.log("\n=== HTML around Aguardando ===");
    console.log(content.substring(index2 - 100, index2 + 150));
  } else {
    console.log("Aguardando not found in clean file");
  }

  // Let's print around "{data}"
  const index3 = content.indexOf('{data}');
  if (index3 !== -1) {
    console.log("\n=== HTML around {data} ===");
    console.log(content.substring(index3 - 100, index3 + 150));
  } else {
    console.log("{data} not found in clean file");
  }
} else {
  console.log("File not found");
}
