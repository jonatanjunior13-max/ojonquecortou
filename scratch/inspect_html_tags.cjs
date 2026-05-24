const fs = require('fs');
const path = require('path');

const files = ['email_00_clean.html', 'email_02_clean.html', 'email_06_clean.html'];

files.forEach(file => {
  const filePath = path.join('C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou', file);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${file}`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Strip head style tag
  content = content.replace(/<style>[\s\S]*?<\/style>/i, '');
  // Strip all other HTML tags
  let text = content.replace(/<[^>]+>/g, ' ');
  // Decode HTML entities
  text = text.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  // Collapse whitespace
  text = text.replace(/\s+/g, ' ');
  
  console.log(`\n=== Text content of ${file} ===`);
  console.log(text.substring(0, 1000));
});
