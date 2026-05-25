const fs = require('fs');
const clean = fs.readFileSync('C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/email_00_clean.html', 'utf8');

// Search for any base64 or data:
const base64Regex = /data:[^)]+/gi;
let m;
let count = 0;
while ((m = base64Regex.exec(clean)) !== null) {
  count++;
  console.log(`Match ${count}: length: ${m[0].length}`);
}
console.log(`Total base64 matches: ${count}`);
