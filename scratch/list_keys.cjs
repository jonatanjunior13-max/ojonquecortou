const fs = require('fs');
const path = require('path');

async function run() {
  const templatesPath = path.resolve('C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/src/utils/emailTemplates.js');
  const mod = await import(`file://${templatesPath}`);
  
  console.log('Exported modules keys:', Object.keys(mod));
  if (mod.HTML_TEMPLATES) {
    console.log('HTML_TEMPLATES keys:', Object.keys(mod.HTML_TEMPLATES));
  }
  if (mod.ADMIN_HTML_TEMPLATES) {
    console.log('ADMIN_HTML_TEMPLATES keys:', Object.keys(mod.ADMIN_HTML_TEMPLATES));
  }
}

run().catch(console.error);
