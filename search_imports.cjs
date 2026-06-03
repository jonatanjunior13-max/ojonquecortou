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
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('legacy.css')) {
        console.log(`Found legacy.css import in: ${fullPath}`);
      }
    }
  });
}

searchDir('C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/src');
process.exit(0);
