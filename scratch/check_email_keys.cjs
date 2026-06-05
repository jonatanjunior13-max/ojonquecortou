const fs = require('fs');
const src = fs.readFileSync('C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/ojonquecortou/.env.production', 'utf8');
const env = {};
src.split('\n').forEach(l => {
  const m = l.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/);
  if (m) {
    let v = (m[2] || '').trim().replace(/\r$/, '');
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    env[m[1]] = v;
  }
});

console.log('RESEND_API_KEY:', env.RESEND_API_KEY ? env.RESEND_API_KEY.slice(0, 20) + '...' : 'NAO DEFINIDA');
console.log('SMTP_USER    :', env.SMTP_USER || 'NAO DEFINIDA');
console.log('SMTP_HOST    :', env.SMTP_HOST || 'NAO DEFINIDA');
console.log('SMTP_FROM    :', env.SMTP_FROM || 'NAO DEFINIDA');
