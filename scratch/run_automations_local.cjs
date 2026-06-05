/**
 * run_automations_local.cjs
 * Executa a régua de relacionamento diretamente via Node (sem Vercel).
 * - Usa SMTP do .env.production
 * - Envia todos os emails pendentes
 * - Envia 1 email de teste D+1 para jonatanjunior13@gmail.com
 */

const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { initializeApp } = require('firebase/app');
const {
  getFirestore, collection, query, where, getDocs,
  doc, getDoc, addDoc
} = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// ─── Carregar .env.production ────────────────────────────────────────────────
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

// ─── Firebase ─────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID
};
const fbApp = initializeApp(firebaseConfig);
const db    = getFirestore(fbApp);
const fbAuth = getAuth(fbApp);

// ─── SMTP ─────────────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST || 'smtp.titan.email',
  port: parseInt(env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS
  }
});

const REPLY_TO    = 'contato@ojonquecortou.com.br';
const FROM_NAME   = 'Studio do Jon';
const FROM_EMAIL  = env.SMTP_USER || 'contato@ojonquecortou.com.br';
const TEST_EMAIL  = 'jonatanjunior13@gmail.com';

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── Helpers de data (timezone BH) ───────────────────────────────────────────
function dateBR(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  const fmt = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit'
  });
  const parts = fmt.formatToParts(d);
  const day   = parts.find(p => p.type === 'day').value;
  const month = parts.find(p => p.type === 'month').value;
  const year  = parts.find(p => p.type === 'year').value;
  return `${year}-${month}-${day}`;
}

// ─── Templates inline (extraídos do emailTemplates.js) ───────────────────────
// Para não precisar do ESM import, lemos o arquivo e extraímos via regex
function loadTemplates() {
  const tplPath = path.join('C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/src/utils/emailTemplates.js');
  const src = fs.readFileSync(tplPath, 'utf8');
  // O arquivo exporta HTML_TEMPLATES = { d1: `...`, d7: `...`, ... }
  // Extraímos cada template usando a API de node com eval em modo seguro
  // Como o arquivo usa export (ESM), vamos fazer uma extração via string
  const templates = {};
  const keys = ['d1','d7','d21','d35','d60','d90','aniversario'];
  for (const key of keys) {
    // Pega o conteúdo entre `key: \`` e o próximo \`,
    const startTag = `  ${key}: \``;
    const si = src.indexOf(startTag);
    if (si < 0) {
      // Tenta sem indentação
      const si2 = src.indexOf(`${key}: \``);
      if (si2 < 0) { templates[key] = null; continue; }
      const ei2 = src.indexOf('`,', si2 + key.length + 3);
      templates[key] = src.substring(si2 + key.length + 3, ei2);
    } else {
      const ei = src.indexOf('`,', si + startTag.length);
      templates[key] = src.substring(si + startTag.length, ei);
    }
  }
  return templates;
}

// ─── Enviar email via SMTP ────────────────────────────────────────────────────
async function sendEmail({ to, name, subject, html }) {
  try {
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      replyTo: REPLY_TO,
      to,
      subject,
      html
    });
    return true;
  } catch (err) {
    console.error(`  ✗ SMTP erro: ${err.message}`);
    return false;
  }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function run() {
  await signInWithEmailAndPassword(fbAuth, env.CRON_FIREBASE_EMAIL, env.CRON_FIREBASE_PASSWORD);
  console.log('🔑 Firebase autenticado\n');

  // Carrega settings
  const settingsDoc = await getDoc(doc(db, 'settings', 'studio'));
  const settings    = settingsDoc.exists() ? settingsDoc.data() : {};
  const automations = settings.automations || {};

  // Carrega templates
  const TEMPLATES = loadTemplates();
  console.log('📄 Templates carregados:', Object.keys(TEMPLATES).filter(k => TEMPLATES[k]).join(', '));

  const todayStr = dateBR(0);
  console.log(`📅 Hoje: ${todayStr}\n`);

  const windows = [1, 7, 21, 35, 60, 90];
  const TPL_MAP = { 1: 'd1', 7: 'd7', 21: 'd21', 35: 'd35', 60: 'd60', 90: 'd90' };
  const SUBJECTS = {
    d1:  '{nome}, como tá o fio hoje?',
    d7:  'A semana mais importante do seu cabelo (e quase ninguém fala sobre isso)',
    d21: '3 semanas de corte novo. Agora vem a parte boa.',
    d35: 'Um mês de corte (e o segredo para ele durar mais)',
    d60: 'Falta 1 mês para a sua janela de manutenção',
    d90: 'Últimos dias do valor especial de manutenção, {nome}'
  };

  let totalSent = 0;
  let totalSkipped = 0;

  for (const daysAgo of windows) {
    const targetDate = dateBR(daysAgo);
    console.log(`\n── D+${daysAgo} → agendamentos de ${targetDate} ──`);

    // Busca agendamentos concluídos naquela data
    const q = query(
      collection(db, 'bookings'),
      where('date', '==', targetDate),
      where('status', 'in', ['Concluído', 'finalizado', 'Confirmado'])
    );
    const snap = await getDocs(q);
    
    if (snap.empty) { console.log('   (nenhum agendamento)'); continue; }
    console.log(`   ${snap.docs.length} agendamento(s) encontrado(s)`);

    const processedPhones = new Set();

    for (const bDoc of snap.docs) {
      const b = bDoc.data();
      if (!b.clientEmail || !b.clientEmail.includes('@')) continue;
      if (!b.clientPhone || processedPhones.has(b.clientPhone)) continue;

      // Opt-out
      try {
        const phoneKey = b.clientPhone.replace(/\D/g, '');
        const prof = await getDoc(doc(db, 'client_profiles', phoneKey));
        if (prof.exists() && prof.data().unsubscribed === true) {
          console.log(`   ↩ Descadastrado: ${b.clientName}`);
          continue;
        }
      } catch (_) {}

      processedPhones.add(b.clientPhone);

      // Verifica se já enviou hoje
      const logQ = query(
        collection(db, 'automation_logs'),
        where('email', '==', b.clientEmail),
        where('date', '==', todayStr),
        where('stage', '==', `D+${daysAgo}`)
      );
      const logSnap = await getDocs(logQ);
      if (!logSnap.empty) {
        console.log(`   ✓ Já enviado hoje: ${b.clientName}`);
        totalSkipped++;
        continue;
      }

      // Verifica se tem agendamento mais recente
      const recentQ = query(collection(db, 'bookings'), where('clientPhone', '==', b.clientPhone));
      const recentSnap = await getDocs(recentQ);
      const hasRecent = recentSnap.docs.some(d => {
        const rb = d.data();
        return rb.date > targetDate && ['Concluído', 'Confirmado', 'finalizado'].includes(rb.status);
      });
      if (hasRecent) {
        console.log(`   → ${b.clientName}: já tem agendamento posterior, pulando`);
        continue;
      }

      // Template
      const tplKey = TPL_MAP[daysAgo];
      if (!tplKey || !TEMPLATES[tplKey]) {
        console.log(`   ↩ Sem template para D+${daysAgo}`);
        continue;
      }
      const firstName = (b.clientName || 'Cliente').split(' ')[0];
      const dbKey = `seqD${daysAgo}`;
      const customTpl = settings?.email_templates?.[dbKey];
      const rawSubject = (customTpl?.subject || SUBJECTS[tplKey] || `Studio do Jon — D+${daysAgo}`);
      const subject = rawSubject.replace(/{nome}/gi, firstName);
      const html = (customTpl?.body || TEMPLATES[tplKey]).replace(/{nome}/gi, firstName);

      console.log(`   📧 Enviando D+${daysAgo} → ${b.clientName} (${b.clientEmail})`);
      const ok = await sendEmail({ to: b.clientEmail, name: b.clientName, subject, html });

      if (ok) {
        await addDoc(collection(db, 'automation_logs'), {
          timestamp: new Date().toISOString(),
          date: todayStr,
          clientName: b.clientName,
          email: b.clientEmail,
          stage: `D+${daysAgo}`,
          sentBy: 'manual_local_script'
        });
        totalSent++;
        console.log(`   ✅ Enviado!`);
      }
      await sleep(5000);
    }
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`📊 RESULTADO: ${totalSent} enviado(s) | ${totalSkipped} já enviados hoje`);

  // ─── EMAIL DE TESTE D+1 PARA JONATAN ──────────────────────────────────────
  console.log(`\n🧪 Enviando email de TESTE (D+1) para: ${TEST_EMAIL}`);
  const tplHtml = TEMPLATES['d1'] ? TEMPLATES['d1'].replace(/{nome}/gi, 'Jonatan') : '<p>Template D+1</p>';
  const testOk = await sendEmail({
    to: TEST_EMAIL,
    name: 'Jonatan',
    subject: '[TESTE] Como tá o fio hoje? — D+1 Studio do Jon',
    html: tplHtml
  });
  console.log(testOk ? '✅ Email de teste enviado! Verifique jonatanjunior13@gmail.com' : '✗ Falha no envio do teste');

  console.log('\nConcluído! ✨');
  process.exit(0);
}

run().catch(err => {
  console.error('\nErro fatal:', err.message);
  process.exit(1);
});
