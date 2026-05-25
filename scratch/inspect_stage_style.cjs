const fs = require('fs');
const path = require('path');

const cleanPath = 'C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/email_00_clean.html';
const superPath = 'C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/email_00_super_clean2.html';

if (fs.existsSync(cleanPath) && fs.existsSync(superPath)) {
  const clean = fs.readFileSync(cleanPath, 'utf8');
  const superClean = fs.readFileSync(superPath, 'utf8');
  
  // Find mail-stage in clean
  const cleanStageIndex = clean.indexOf('class="mail-stage"');
  if (cleanStageIndex !== -1) {
    console.log("=== CLEAN MAIL-STAGE STYLE ===");
    console.log(clean.substring(cleanStageIndex, cleanStageIndex + 400));
  }
  
  // Find mail-stage in superClean
  const superStageIndex = superClean.indexOf('class="mail-stage"');
  if (superStageIndex !== -1) {
    console.log("\n=== SUPER CLEAN MAIL-STAGE STYLE ===");
    console.log(superClean.substring(superStageIndex, superStageIndex + 400));
  }
} else {
  console.log("Files not found");
}
