const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    if (file === 'node_modules' || file === '.git' || file === 'dist' || file === '.vercel') return;
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else {
      if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.json') || file.endsWith('.cjs') || file.endsWith('.html')) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

const allFiles = walk('C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou');
const query = 'email_horario_confirmado';

allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes(query)) {
    console.log(`Found in: ${file}`);
  }
});
