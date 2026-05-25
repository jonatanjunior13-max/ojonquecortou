const fs = require('fs');
const path = require('path');

const adminDir = 'C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/src/pages/admin';
const files = fs.readdirSync(adminDir);

files.forEach(file => {
  if (file.endsWith('.jsx')) {
    const filePath = path.join(adminDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('custom_automations') || content.includes('automations') || content.includes('Automac')) {
      console.log(`File: ${file}`);
      // Find matching line contexts
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes('custom_automations') || line.includes('automations') || line.includes('Automa') || line.includes('Email')) {
          if (line.includes('custom_automations') || line.includes('Automation') || line.includes('E-mail')) {
            console.log(`  Line ${idx+1}: ${line.trim()}`);
          }
        }
      });
    }
  }
});
