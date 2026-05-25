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
      if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.json') || file.endsWith('.html')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        // regex for emails
        const matches = content.match(/[\w.-]+@[\w.-]+\.\w+/g);
        if (matches) {
          matches.forEach(email => {
            if (!email.includes('studio.com') && !email.includes('ojonquecortou.com.br') && !email.includes('example')) {
              console.log(`Found email: ${email} in ${fullPath}`);
            }
          });
        }
      }
    }
  });
}

search(baseDir);
