const fs = require('fs');
const path = require('path');

const filePath = 'C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/src/pages/admin/AdminMarketing.jsx';
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (line.includes('replace')) {
      console.log(`Line ${index + 1}: ${line.trim()}`);
    }
  });
} else {
  console.log("File not found");
}
