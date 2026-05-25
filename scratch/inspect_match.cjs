const fs = require('fs');
const path = require('path');

const filePath = 'C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/email_00_super_clean2.html';
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  const index = content.indexOf('&quot;');
  if (index !== -1) {
    console.log("=== HTML around remaining &quot; ===");
    console.log(content.substring(index - 150, index + 250));
  } else {
    console.log("&quot; not found");
  }
}
