const fs = require('fs');
const path = require('path');

function searchCSSFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  // Match any block of CSS that contains 'btn'
  const regex = /([^\r\n}]+btn[^{]*{[^}]+})/gi;
  let match;
  while ((match = regex.exec(content)) !== null) {
    console.log(`--- MATCH IN ${filePath} ---`);
    console.log(match[1].trim());
  }
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
