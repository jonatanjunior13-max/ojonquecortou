const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        searchDir(fullPath);
      }
    } else if (file.endsWith('.css')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('--color-')) {
        console.log(`Found --color- in file: ${fullPath}`);
        const matches = content.match(/--color-[a-zA-Z0-9_-]+/g);
        console.log('Matches:', [...new Set(matches)]);
      }
    }
  });
}

searchDir('C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou');
process.exit(0);
