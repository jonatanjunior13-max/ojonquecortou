const fs = require('fs');
const path = require('path');

async function run() {
  const templatesPath = path.resolve('C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/src/utils/emailTemplates.js');
  const { HTML_TEMPLATES } = await import(`file://${templatesPath}`);
  
  const keys = ['d1', 'd7', 'd21', 'd35', 'd60', 'd90', 'aniversario'];
  
  for (const key of keys) {
    const html = HTML_TEMPLATES[key];
    console.log(`\n================ ${key.toUpperCase()} ================`);
    if (!html) {
      console.log('Not found');
      continue;
    }
    
    // Simple HTML tag remover to read the text
    const text = html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
      
    console.log(text.slice(0, 800) + '...');
  }
}

run().catch(console.error);
