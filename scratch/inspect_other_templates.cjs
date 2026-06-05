const fs = require('fs');
const path = require('path');

async function run() {
  const templatesPath = path.resolve('C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/src/utils/emailTemplates.js');
  const mod = await import(`file://${templatesPath}`);
  
  console.log('--- ADMIN_HTML_TEMPLATES ---');
  for (const k of Object.keys(mod.ADMIN_HTML_TEMPLATES)) {
    console.log(k, ':', mod.ADMIN_HTML_TEMPLATES[k].length, 'chars');
  }
  
  console.log('\n--- LAUNCH_TEMPLATES ---');
  for (const k of ['launch_e1', 'launch_e2', 'launch_e3']) {
    console.log(k, ':', mod.HTML_TEMPLATES[k]?.length, 'chars');
  }
}

run().catch(console.error);
