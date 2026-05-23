const fs = require('fs');
const html = fs.readFileSync('C:/Users/jonat/Downloads/Email Templates _standalone_ (1).html', 'utf8');

const match = html.match(/<script type="__bundler\/template">([^<]+)<\/script>/);
if (match) {
  try {
    const templateStr = JSON.parse(match[1]);
    fs.writeFileSync('C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/extracted_templates.html', templateStr);
    console.log('Extracted to extracted_templates.html');
  } catch (e) {
    console.log('Error parsing JSON:', e);
  }
} else {
  console.log('Template script not found');
}
