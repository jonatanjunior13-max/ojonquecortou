const fs = require('fs');
const content = fs.readFileSync('C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/src/pages/ServicesPage.css', 'utf8');
const lines = content.split('\n');
console.log('Search results in ServicesPage.css:');
lines.forEach((line, index) => {
  if (line.includes('btn') || line.includes('primary') || line.includes('outline') || line.includes('border') || line.includes('background') || line.includes('color') || line.includes('btn-primary')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
process.exit(0);
