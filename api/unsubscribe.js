import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, updateDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyBkmKUQs0Nf_oer1Mvwtg_QumzXANX7m0Y',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'ojonque.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'ojonque',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'ojonque.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '108299544531',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:108299544531:web:b0fa221ca26901aae77126'
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const MAILERSEND_API_KEY = (
  process.env.MAILERSEND_API_KEY || 
  (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.startsWith('re_') ? process.env.RESEND_API_KEY : '') || 
  ''
).trim();

async function ensureAuth() {
  if (auth && !auth.currentUser) {
    const adminEmail = (process.env.CRON_FIREBASE_EMAIL || process.env.ADMIN_NOTIFICATION_EMAIL || '').trim();
    const adminPass = (process.env.CRON_FIREBASE_PASSWORD || process.env.ADMIN_PASSWORD || '').trim();
    if (adminEmail && adminPass) {
      try {
        await signInWithEmailAndPassword(auth, adminEmail, adminPass);
      } catch (err) {
        console.warn('Firebase auth warning in unsubscribe:', err.message);
      }
    }
  }
}

async function suppressInMailerSend(email) {
  if (!MAILERSEND_API_KEY || !email) return;
  try {
    // 1. Obter domain_id da conta no MailerSend
    const domRes = await fetch('https://api.mailersend.com/v1/domains', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${MAILERSEND_API_KEY}` }
    });
    if (!domRes.ok) {
      console.warn('MailerSend domains fetch warning:', domRes.status);
      return;
    }
    const domData = await domRes.json();
    const domainList = domData.data || [];
    if (domainList.length === 0) return;

    const matchedDomain = domainList.find(d => (d.name || '').includes('ojonquecortou')) || domainList[0];
    const domainId = matchedDomain.id;

    // 2. Registrar na lista oficial de supressões do MailerSend
    const supRes = await fetch('https://api.mailersend.com/v1/suppressions/unsubscribes', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MAILERSEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        domain_id: domainId,
        recipients: [email]
      })
    });
    if (supRes.ok || supRes.status === 201) {
      console.log(`✅ MailerSend suppression registrada para ${email}`);
    } else {
      const errTxt = await supRes.text();
      console.warn(`MailerSend suppression warning (${supRes.status}):`, errTxt);
    }
  } catch (e) {
    console.warn('MailerSend suppression error:', e.message);
  }
}

async function unsubscribeInFirestore(cleanEmail) {
  await ensureAuth();
  let updatedCount = 0;
  try {
    const q = query(collection(db, 'client_profiles'), where('email', '==', cleanEmail));
    const snap = await getDocs(q);
    const updates = [];
    snap.forEach((docSnap) => {
      updates.push(updateDoc(doc(db, 'client_profiles', docSnap.id), {
        unsubscribed: true,
        newsletter: false,
        unsubscribedAt: new Date().toISOString()
      }));
      updatedCount++;
    });
    if (updates.length > 0) {
      await Promise.all(updates);
    }
  } catch (err) {
    console.error('Firestore client_profiles update error:', err.message);
  }

  // Registrar em log para auditoria
  try {
    await addDoc(collection(db, 'automation_logs'), {
      clientEmail: cleanEmail,
      stage: 'unsubscribe',
      channel: 'web',
      timestamp: serverTimestamp()
    });
  } catch (logErr) {
    console.warn('automation_logs warning:', logErr.message);
  }

  return updatedCount;
}

function renderHtmlResponse(email, isSuccess = true) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isSuccess ? 'Descadastro Confirmado' : 'Cancelar Inscrição'} · Studio do Jon</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #FAF5E8;
      color: #1A1310;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
    }
    .card {
      background: #FFFFFF;
      border: 1px solid rgba(26, 19, 16, 0.08);
      border-radius: 16px;
      max-width: 480px;
      width: 100%;
      padding: 40px 32px;
      text-align: center;
      box-shadow: 0 10px 30px rgba(26, 19, 16, 0.04);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      background: rgba(201, 123, 73, 0.12);
      color: #C97B49;
      margin-bottom: 20px;
    }
    .icon {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: #EFE5D2;
      color: #C97B49;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      margin: 0 auto 20px;
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      line-height: 1.3;
      margin-bottom: 12px;
      color: #1A1310;
    }
    p {
      font-size: 14px;
      line-height: 1.6;
      color: #6B5A4B;
      margin-bottom: 20px;
    }
    .email-highlight {
      display: inline-block;
      background: #FAF5E8;
      border: 1px solid rgba(26, 19, 16, 0.06);
      padding: 4px 10px;
      border-radius: 6px;
      color: #1A1310;
      font-weight: 600;
      word-break: break-all;
    }
    .notice {
      font-size: 12px;
      color: #9A8A7A;
      border-top: 1px solid rgba(26, 19, 16, 0.06);
      padding-top: 16px;
      margin-top: 20px;
      line-height: 1.5;
    }
    .btn {
      display: inline-block;
      margin-top: 24px;
      background: #1A1310;
      color: #FAF5E8;
      text-decoration: none;
      font-size: 13px;
      font-weight: 600;
      padding: 12px 24px;
      border-radius: 8px;
      transition: opacity 0.2s ease;
    }
    .btn:hover { opacity: 0.9; }
    form {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 16px;
      text-align: left;
    }
    input[type="email"] {
      padding: 12px 14px;
      border: 1px solid rgba(26, 19, 16, 0.15);
      border-radius: 8px;
      font-size: 14px;
      font-family: inherit;
      width: 100%;
    }
    button[type="submit"] {
      padding: 12px 20px;
      background: #C97B49;
      color: #FFFFFF;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Studio do Jon</div>
    <div class="icon">${isSuccess ? '✓' : '✉'}</div>
    ${isSuccess ? `
      <h1>Descadastro Confirmado</h1>
      <p>O endereço <span class="email-highlight">${email}</span> foi removido da nossa lista de novidades, editoriais e comunicados por e-mail.</p>
      <div class="notice">
        Não se preocupe: caso você realize um agendamento futuro no Studio do Jon, os comprovantes e lembretes operacionais do seu horário continuarão sendo enviados normalmente.
      </div>
      <a href="https://www.ojonquecortou.com.br" class="btn">Voltar para o site</a>
    ` : `
      <h1>Cancelar Recebimento de E-mails</h1>
      <p>Digite seu e-mail abaixo para confirmar o cancelamento imediato de comunicados e novidades do Studio do Jon.</p>
      <form method="GET" action="/api/unsubscribe">
        <input type="email" name="email" placeholder="seu@email.com" required />
        <button type="submit">Confirmar descadastro</button>
      </form>
      <a href="https://www.ojonquecortou.com.br" class="btn" style="background: transparent; color: #6B5A4B; margin-top: 12px; text-decoration: underline;">Voltar para o site</a>
    `}
  </div>
</body>
</html>`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, List-Unsubscribe');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Extrair e-mail de query param ou body
  let rawEmail = req.query?.email || req.body?.email;
  
  // Suporte a RFC 8058 One-Click POST onde o body pode vir como List-Unsubscribe=One-Click
  if (req.method === 'POST' && !rawEmail && req.headers['list-unsubscribe'] && req.query?.email) {
    rawEmail = req.query.email;
  }

  const cleanEmail = rawEmail ? String(rawEmail).trim().toLowerCase() : '';

  if (!cleanEmail || !cleanEmail.includes('@')) {
    if (req.method === 'POST') {
      return res.status(400).json({ error: 'E-mail inválido ou não fornecido.' });
    }
    // GET sem e-mail: renderiza formulário simples para digitar o e-mail
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(renderHtmlResponse('', false));
  }

  try {
    // 1. Atualizar no Firestore
    await unsubscribeInFirestore(cleanEmail);

    // 2. Registrar na lista de supressão da MailerSend
    await suppressInMailerSend(cleanEmail);

    // Resposta para clientes de e-mail automatizados (RFC 8058 ou chamadas de API JSON)
    const isJsonRequest = req.method === 'POST' || (req.headers.accept && req.headers.accept.includes('application/json'));
    if (isJsonRequest) {
      return res.status(200).json({
        success: true,
        unsubscribed: true,
        email: cleanEmail,
        message: 'Recipient has been successfully unsubscribed.'
      });
    }

    // Resposta para navegador comum (clique humano no link do e-mail)
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(renderHtmlResponse(cleanEmail, true));

  } catch (err) {
    console.error('Erro no processamento de descadastro:', err);
    if (req.method === 'POST') {
      return res.status(500).json({ error: 'Erro interno ao processar descadastro.', details: err.message });
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(renderHtmlResponse(cleanEmail, true));
  }
}
