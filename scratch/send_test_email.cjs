/**
 * send_test_email.cjs
 * Envia um email de teste com o template D+1 via API de produção
 */
const fs = require('fs');

const envPath = 'C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/ojonquecortou/.env.production';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/);
  if (m) {
    let val = (m[2] || '').trim().replace(/\r$/, '');
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[m[1]] = val;
  }
});

// Lê o template D+1 direto do arquivo
const tplSrc = fs.readFileSync('C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/src/utils/emailTemplates.js', 'utf8');

// Extrai o conteúdo do template d1
function extractTemplate(src, key) {
  const startTag = `  ${key}: \``;
  const si = src.indexOf(startTag);
  if (si < 0) return null;
  const ei = src.indexOf('`,', si + startTag.length);
  return src.substring(si + startTag.length, ei);
}

const d1Html = extractTemplate(tplSrc, 'd1');
if (!d1Html) {
  console.error('Template D+1 não encontrado!');
  process.exit(1);
}

const htmlWithName = d1Html.replace(/{nome}/gi, 'Jonatan');

async function run() {
  console.log('🧪 Enviando email de teste D+1 via API de produção...');
  console.log('   Template carregado:', d1Html.length, 'chars');
  
  const res = await fetch('https://ojonquecortou.com.br/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'campanha_raw',
      clientEmail: 'jonatanjunior13@gmail.com',
      clientName: 'Jonatan',
      subject: '[TESTE] Como tá o fio hoje? — Template D+1',
      htmlBody: htmlWithName
    })
  });
  
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch(_) {}
  
  if (res.ok) {
    console.log('✅ Email de teste enviado para jonatanjunior13@gmail.com!');
    if (json) console.log('   Resposta:', JSON.stringify(json));
  } else {
    console.log(`✗ Falha: HTTP ${res.status}`);
    console.log('   Resposta:', text.slice(0, 500));
  }
  
  process.exit(res.ok ? 0 : 1);
}

run().catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});
