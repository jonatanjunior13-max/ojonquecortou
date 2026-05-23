const fs = require('fs');
const html = fs.readFileSync('C:/Users/jonat/Downloads/Email Templates _standalone_ (1).html', 'utf8');

const idx = html.indexOf('__bundler/template">');
if (idx > -1) {
  const endIdx = html.indexOf('</script>', idx);
  const content = html.substring(idx + 20, endIdx);
  fs.writeFileSync('C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/extracted.txt', content);
  console.log('Extracted to extracted.txt');
} else {
  console.log('Not found');
}
