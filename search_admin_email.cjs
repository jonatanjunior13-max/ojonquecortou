const fs = require('fs');
const path = require('path');

const baseDir = 'C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou';

function search(dir) {
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        search(fullPath);
      }
    } else {
      if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.json')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.toLowerCase().includes('jon@') || content.includes('SMTP_') || content.toLowerCase().includes('notific')) {
          console.log(`Match in ${fullPath}`);
          const lines = content.split('\n');
          lines.forEach((line, i) => {
            if (line.toLowerCase().includes('jon@') || line.includes('SMTP_') || line.toLowerCase().includes('notific')) {
              console.log(`  Line ${i + 1}: ${line.trim()}`);
            }
          });
        }
      }
    }
  });
}

search(baseDir);
