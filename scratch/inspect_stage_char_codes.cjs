const fs = require('fs');
const clean = fs.readFileSync('C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/email_00_clean.html', 'utf8');
const index = clean.indexOf('class="mail-stage"');
const styleStart = clean.indexOf('style="', index);
const styleEnd = clean.indexOf('"', styleStart + 7);

const styleStr = clean.substring(styleStart, styleEnd + 1);
console.log("Style substring:");
console.log(styleStr);

const props = styleStr.split(';');
console.log("\nProperties:");
props.forEach((p, i) => {
  if (p.includes('font-family') || p.includes('quot')) {
    console.log(`${i}: "${p}" (includes quot: ${p.includes('quot') || p.includes('&quot;')})`);
  }
});
