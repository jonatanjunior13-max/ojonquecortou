const fs = require('fs');
let code = fs.readFileSync('C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/api/cron-automations.js', 'utf8');

const importStr = "import { HTML_TEMPLATES } from '../src/utils/emailTemplates.js';\n";
if (!code.includes('HTML_TEMPLATES')) {
  code = code.replace(/import \{ db \} from '\.\.\/src\/config\/firebase\.js';/, "import { db } from '../src/config/firebase.js';\n" + importStr);
}

const newTemplates = `
const templates = {
  'd1': { subject: '{nome}, como tá o fio hoje?', content: HTML_TEMPLATES['d1'] },
  'd7': { subject: 'A semana mais importante do seu cabelo (e quase ninguém fala sobre isso)', content: HTML_TEMPLATES['d7'] },
  'd21': { subject: '3 semanas de corte novo. Agora vem a parte boa.', content: HTML_TEMPLATES['d21'] },
  'd35': { subject: '{nome}, chegou a hora.', content: HTML_TEMPLATES['d35'] },
  'd60': { subject: 'Uma coisa que percebi depois de anos cortando cacheado', content: HTML_TEMPLATES['d60'] },
  'd90': { subject: 'Esse é o último email que mando, {nome}.', content: HTML_TEMPLATES['d90'] },
  'aniversario': { subject: 'Parabéns, {nome}.', content: HTML_TEMPLATES['aniversario'] }
};
`;

code = code.replace(/const templates = \{[\s\S]*?linkUrl: 'https:\/\/ojonquecortou\.com\.br\/agendar',[\s\S]*?linkText: 'Agendar Horário'[\s\S]*?\}[\s\S]*?\};\n/, newTemplates.trim() + '\n\n');

// Also update the fallback code
// The previous code had:
// let emailContent = \`\${bodyContent}<br><br><a href="\${linkUrl}" class="btn">\${linkText}</a>\`;
// Now, the bodyContent IS the entire content. We shouldn't append linkUrl and linkText anymore!

code = code.replace(
  /let emailContent = `\$\{bodyContent\}<br><br><a href="\$\{linkUrl\}" class="btn">\$\{linkText\}<\/a>`;/g,
  "let emailContent = bodyContent;"
);

code = code.replace(
  /let emailContent = `\$\{bodyContent\}<br><br><a href="\$\{campanhaData\.link_url\}" class="btn">\$\{campanhaData\.link_text\}<\/a>`;/g,
  "let emailContent = bodyContent;"
);

// We should also replace the body replace regex that previously wrapped in paragraphs, if it did.
// Let's check. Actually, it just did .replace(/{nome}/g, firstName).

fs.writeFileSync('C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/api/cron-automations.js', code);
console.log("Updated cron-automations.js");
