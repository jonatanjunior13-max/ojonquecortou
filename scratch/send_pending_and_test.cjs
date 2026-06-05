/**
 * Script: send_pending_and_test.cjs
 * 1. Aciona o cron de automações diretamente na produção (envia todos os pendentes)
 * 2. Envia um email de teste D+1 para jonatanjunior13@gmail.com
 */

const fs = require('fs');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, doc, getDoc, addDoc } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

const envPath = 'C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/ojonquecortou/.env.production';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/);
  if (match) {
    const key = match[1];
    let val = (match[2] || '').trim().replace(/\r$/, '');
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[key] = val;
  }
});

const HOST_URL = 'https://ojonquecortou.com.br';
const TEST_EMAIL = 'jonatanjunior13@gmail.com';
const CRON_SECRET = env.CRON_SECRET || '';

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function callApi(path, body = {}) {
  try {
    const res = await fetch(`${HOST_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Header usado pelo Vercel para proteger crons
        ...(CRON_SECRET ? { 'x-cron-secret': CRON_SECRET } : {})
      },
      body: JSON.stringify(body)
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch (_) {}
    return { ok: res.ok, status: res.status, json, text };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function run() {
  await signInWithEmailAndPassword(auth, env.CRON_FIREBASE_EMAIL, env.CRON_FIREBASE_PASSWORD);
  console.log('🔑 Autenticado no Firebase\n');

  // ─── 1. DISPARA O CRON DE AUTOMAÇÕES (PENDENTES) ─────────────────────
  console.log('🚀 Acionando cron de automações na produção...');
  console.log('   URL:', `${HOST_URL}/api/_crons/automations`);
  
  const cronResult = await callApi('/api/_crons/automations');
  
  if (cronResult.ok) {
    console.log('\n✅ Cron executado com sucesso!');
    if (cronResult.json) {
      console.log('   Data:', cronResult.json.todayStr);
      console.log('   Stats:', JSON.stringify(cronResult.json.stats));
      if (cronResult.json.logs && cronResult.json.logs.length > 0) {
        console.log('\n📋 Emails disparados:');
        cronResult.json.logs.forEach(l => console.log('   •', l));
      } else {
        console.log('   ℹ️  Nenhum email pendente encontrado para hoje.');
      }
    }
  } else {
    console.log(`\n⚠️  Cron retornou status ${cronResult.status}`);
    console.log('   Resposta:', cronResult.text?.slice(0, 500));
  }

  // ─── 2. EMAIL DE TESTE D+1 PARA JONATAN ──────────────────────────────
  console.log(`\n🧪 Enviando email de TESTE (D+1) para: ${TEST_EMAIL}`);
  await sleep(3000);

  const testResult = await callApi('/api/send-email', {
    type: 'sequence_test',
    clientEmail: TEST_EMAIL,
    clientName: 'Jonatan Teste',
    subject: '[TESTE] D+1 — Como tá o fio hoje?',
    templateKey: 'd1',
    firstName: 'Jonatan'
  });

  if (!testResult.ok) {
    // Tenta com campanha_raw usando o cron de reminders para pegar o template compilado
    // ou usa um fallback simples
    console.log('   ⚠ sequence_test não suportado, tentando via cron com destinatário de teste...');
    
    // Opção: chama send-email com type=campanha e bodyHtml básico
    const fallbackResult = await callApi('/api/send-email', {
      type: 'campanha_raw',
      clientEmail: TEST_EMAIL,
      clientName: 'Jonatan Teste',
      subject: '[TESTE TEMPLATE] D+1 - Como tá o fio?',
      // HTML mínimo com estilo do Studio
      htmlBody: `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Teste D+1</title></head><body style="margin:0;padding:0;background:#EFE5D2;font-family:'Manrope',sans-serif;"><div style="max-width:600px;margin:0 auto;background:#FAF5E8;padding:40px 32px;border-radius:16px;"><p style="font-size:28px;font-family:Georgia,serif;color:#1A1310;">Jonatan,</p><p style="font-size:16px;line-height:1.7;color:#2E241E;">Este é um email de <strong>teste</strong> para verificar o template da régua de relacionamento D+1 (<em>Como tá o fio hoje?</em>).</p><p style="font-size:15px;line-height:1.7;color:#2E241E;">Se você recebeu esse email, os disparos automáticos estão funcionando corretamente. 🎉</p><hr style="border:0;border-top:1px solid rgba(26,19,16,0.1);margin:32px 0;"><p style="font-family:Georgia,serif;font-style:italic;font-size:32px;color:#B05A2E;">Jon</p><p style="font-size:13px;color:#6B5A4B;"><strong>Studio do Jon</strong><br>Especialista em cortes para cabelos cacheados e crespos · BH</p></div></body></html>`
    });
    
    if (fallbackResult.ok) {
      console.log('✅ Email de teste enviado (versão simplificada)!');
    } else {
      console.log(`✗ Falha: ${fallbackResult.status} — ${fallbackResult.text?.slice(0, 300)}`);
    }
  } else {
    console.log('✅ Email de teste enviado!');
    if (testResult.json) console.log('   Resposta:', JSON.stringify(testResult.json));
  }

  console.log('\n─────────────────────────────────────────');
  console.log('Concluído.');
  process.exit(0);
}

run().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
