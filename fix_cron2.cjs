const fs = require('fs');
let code = fs.readFileSync('C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/api/cron-automations.js', 'utf8');

const startIdx = code.indexOf('const templates = {');
const endIdx = code.indexOf('export default async function handler', startIdx);

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

code = code.substring(0, startIdx) + newTemplates + '\n\n' + code.substring(endIdx);

fs.writeFileSync('C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/api/cron-automations.js', code);
console.log("Replaced templates object.");
