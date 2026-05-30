const fs = require('fs');
const esbuild = require('esbuild');

try {
  const content = fs.readFileSync('C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/src/pages/admin/AdminMarketing.jsx', 'utf8');
  
  esbuild.transformSync(content, {
    loader: 'jsx',
    format: 'esm'
  });
  console.log('esbuild: Parse successful! No syntax errors.');
} catch (err) {
  console.error('esbuild Parse Error:', err.message);
}
