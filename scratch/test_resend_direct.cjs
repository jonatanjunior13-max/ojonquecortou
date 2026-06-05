/**
 * test_resend_direct.cjs
 * Testa o Resend API diretamente, sem passar pela API do Vercel.
 * Mostra o ID do email enviado para poder rastrear.
 */
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

const RESEND_KEY = env.RESEND_API_KEY;
const SMTP_FROM  = env.SMTP_FROM || env.SMTP_USER;

// Template de teste simples mas bonito
const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Teste D+1</title>
</head>
<body style="margin:0;padding:0;background:#EFE5D2;font-family:'Manrope',sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#FAF5E8;border-radius:16px;padding:48px 40px;box-shadow:0 8px 32px rgba(26,19,16,0.08);">
    
    <!-- Logo/Header -->
    <div style="border-bottom:1px solid rgba(26,19,16,0.08);padding-bottom:20px;margin-bottom:40px;">
      <span style="display:inline-block;width:32px;height:32px;border-radius:50%;background:#1A1310;color:#FAF5E8;text-align:center;line-height:32px;font-style:italic;font-size:18px;margin-right:10px;vertical-align:middle;">J</span>
      <span style="font-size:18px;color:#1A1310;vertical-align:middle;font-weight:600;">Studio do Jon</span>
    </div>

    <!-- Content -->
    <p style="font-size:14px;letter-spacing:0.08em;text-transform:uppercase;color:#B05A2E;font-weight:600;margin:0 0 12px;">D+1 &mdash; Pós-corte</p>
    <h1 style="font-family:Georgia,serif;font-size:32px;line-height:1.2;color:#1A1310;margin:0 0 24px;">Jonatan, como tá o fio hoje?</h1>
    
    <p style="font-size:15px;line-height:1.7;color:#2E241E;">Este é um <strong>email de teste</strong> da régua de relacionamento automática do Studio do Jon.</p>
    <p style="font-size:15px;line-height:1.7;color:#2E241E;">Se chegou até aqui, os disparos automáticos estão funcionando corretamente.</p>
    <p style="font-size:15px;line-height:1.7;color:#2E241E;">O template real do D+1 está configurado e pronto para ser enviado automaticamente 1 dia após cada atendimento.</p>

    <div style="margin:32px 0;">
      <a href="https://ojonquecortou.com.br/agendar" style="display:inline-block;background:#1A1310;color:#FAF5E8;padding:14px 28px;border-radius:999px;font-size:13px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;text-decoration:none;">Agendar Horário</a>
    </div>
    
    <hr style="border:0;border-top:1px solid rgba(26,19,16,0.08);margin:40px 0 28px;">
    <div style="font-family:Georgia,serif;font-style:italic;font-size:32px;color:#B05A2E;">Jon</div>
    <p style="font-size:13px;color:#6B5A4B;margin:8px 0 0;"><strong style="color:#1A1310;">Studio do Jon</strong><br>Especialista em cortes para cabelos cacheados e crespos · Belo Horizonte</p>
  </div>
</body>
</html>
`;

async function run() {
  console.log('🧪 Enviando via Resend API diretamente...');
  console.log('   FROM:', SMTP_FROM);
  console.log('   TO:   jonatanjunior13@gmail.com');
  console.log('   KEY:  ', RESEND_KEY.slice(0,15) + '...');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: `"O Jon Que Cortou" <${SMTP_FROM}>`,
      to: ['jonatanjunior13@gmail.com'],
      subject: '[TESTE] D+1 — Como tá o fio hoje?',
      html
    })
  });

  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch(_) {}

  console.log('\nStatus HTTP:', res.status);
  console.log('Resposta:', text);

  if (res.ok) {
    console.log('\n✅ Resend aceitou o email!');
    console.log('   ID:', json?.id);
    console.log('\nSe não chegar em 2min, o problema é com o domínio remetente ou spam.');
    console.log('Verifique TAMBÉM a pasta de SPAM no Gmail.');
  } else {
    console.log('\n✗ Resend rejeitou:', json?.message || text);
    
    if (json?.message?.includes('domain') || json?.message?.includes('verified')) {
      console.log('\n⚠️  PROBLEMA: O domínio remetente não está verificado no Resend!');
      console.log('   FROM usado:', SMTP_FROM);
      console.log('   Domínio:', SMTP_FROM.split('@')[1]);
      console.log('\n   SOLUÇÃO: Verificar o domínio em https://resend.com/domains');
    }
  }

  process.exit(0);
}

run().catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});
