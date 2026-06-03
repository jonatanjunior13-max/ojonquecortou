const fs = require('fs');
const path = require('path');

function searchCSSFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (line.includes('sdc-btn') || line.includes('sdc-footer')) {
      console.log(`Found in ${filePath}:${index + 1}: ${line.trim()}`);
    }
  });
}

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        searchDir(fullPath);
      }
    } else if (file.endsWith('.css')) {
      searchCSSFile(fullPath);
    }
  });
}

searchDir('C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/src');
process.exit(0);
