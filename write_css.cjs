const fs = require('fs');
const html = fs.readFileSync('C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/extracted_final.html', 'utf8');
const startIdx = html.indexOf('<style>/* ------------------------------------------------------------------');
const endIdx = html.indexOf('</style>', startIdx);
let css = html.substring(startIdx + 7, endIdx);

const fontCSS = "@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&family=Manrope:wght@300;400;500;600;700&display=swap');\n";

let templatesJs = "export const EMAIL_CSS = `\n" + fontCSS + css + "\n`;\n\n";

fs.writeFileSync('C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/src/utils/emailTemplates.js', templatesJs);
