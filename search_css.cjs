const fs = require('fs');
const content = fs.readFileSync('C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/src/index.css', 'utf8');
const lines = content.split('\n');
console.log('Search results in index.css:');
lines.forEach((line, index) => {
  if (line.includes('btn') || line.includes('sdc-btn') || line.includes('footer')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
process.exit(0);
