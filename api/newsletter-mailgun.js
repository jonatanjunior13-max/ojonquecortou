import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, query, where, updateDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

let app, db;
try {
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (e) {
  console.error('Firebase init error:', e);
}

// A chave do Mailgun está armazenada na variável RESEND_API_KEY na Vercel
const MAILGUN_API_KEY = (process.env.RESEND_API_KEY || '').trim();
const MAILGUN_DOMAIN = 'mg.ojonquecortou.com.br';
const FROM_EMAIL = '"O Jon Que Cortou" <contato@ojonquecortou.com.br>';
const UNSUBSCRIBE_BASE = 'https://ojonquecortou.com.br/api/unsubscribe?email=';

// Wrap newsletter HTML in a full email document
function wrapNewsletterHtml(subject, body) {
  // Remove the initial header table so previewText doesn't contain the logo "J Studio do Jon"
  const bodyWithoutHeader = body.replace(/<table[^>]*>[\s\S]*?<\/table>/i, '');
  const previewText = bodyWithoutHeader
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 140);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #EFE5D2; -webkit-font-smoothing: antialiased; font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1A1310;">
  <div style="display: none; max-height: 0px; overflow: hidden; font-size: 1px; line-height: 1px; color: #EFE5D2; opacity: 0;">${previewText}</div>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#EFE5D2" style="background-color: #EFE5D2;">
    <tr>
      <td align="center" style="padding: 40px 10px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FAF5E8" style="max-width: 620px; background-color: #FAF5E8; border-radius: 8px; overflow: hidden; border: 1px solid rgba(26,19,16,0.1); box-shadow: 0 4px 20px rgba(26,19,16,0.08);">
          <tr><td align="left">${body}</td></tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #EFE5D2; border-top: 1px solid rgba(26,19,16,0.1); text-align: center; font-family: 'Manrope', sans-serif;">
              <div style="font-size: 12px; color: #6B5A4B; line-height: 1.6; margin-bottom: 15px;">
                Rua Francisco Ovídio, 184 · Caiçara<br>Belo Horizonte · MG<br>Quarta a Sábado · 9h às 19h
              </div>
              <div style="margin-bottom: 15px; font-size: 11px; line-height: 1.6; color: #6B5A4B; background: rgba(0,0,0,0.012); padding: 12px 14px; border-radius: 6px; border: 1px solid rgba(26,19,16,0.08); text-align: left; display: inline-block; max-width: 440px; font-family: 'Manrope', sans-serif;">
                <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #C97B49; font-weight: 600; display: block; margin-bottom: 4px;">Preferências de Leitura</span>
                Os algoritmos costumam limitar o alcance das publicações. Se você deseja que os ensaios de visagismo e novidades do Studio cheguem até você no Chrome ou na busca, você pode indicar sua preferência de conteúdo <a href="https://google.com/preferences/source?q=https://www.ojonquecortou.com.br" target="_blank" style="color: #C97B49 !important; text-decoration: underline; font-weight: 600;">adicionando nosso site às suas fontes</a>. É rápido, simples e assegura que continuaremos nos comunicando.
              </div>
              <div style="font-size: 11px; color: #9A8A7A; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.06em; text-transform: uppercase;">
                © ${new Date().getFullYear()} Studio do Jon
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Send a single email via Mailgun REST API
async function sendMailgun(to, toName, subject, html) {
  const basicAuth = Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64');
  const url = `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`;

  const body = new URLSearchParams({
    from: FROM_EMAIL,
    to: toName ? `"${toName}" <${to}>` : to,
    subject,
    html,
    'h:List-Unsubscribe': `<${UNSUBSCRIBE_BASE}${encodeURIComponent(to)}>`,
    'h:List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    'o:tag': 'newsletter',
    'o:tracking': 'yes',
    'o:tracking-clicks': 'yes',
    'o:tracking-opens': 'yes'
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Mailgun ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.id || 'mailgun-ok';
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { email } = req.query;

    if (!email) {
      return res.status(400).send('Email ausente.');
    }

    try {
      if (!db) {
        return res.status(500).send('Firebase não inicializado');
      }
      const q = query(collection(db, 'client_profiles'), where('email', '==', email));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return res.status(200).send(`
          <html>
          <head><meta charset="utf-8"><title>Descadastrado</title></head>
          <body style="font-family: sans-serif; text-align: center; padding: 50px; background-color: #0a0a0a; color: #fff;">
            <h2>Tudo certo!</h2>
            <p>O email ${email} não receberá mais comunicações de marketing.</p>
          </body>
          </html>
        `);
      }

      const updates = [];
      snapshot.forEach((document) => {
        updates.push(updateDoc(doc(db, 'client_profiles', document.id), { unsubscribed: true }));
      });

      await Promise.all(updates);

      return res.status(200).send(`
        <html>
        <head><meta charset="utf-8"><title>Descadastrado</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px; background-color: #0a0a0a; color: #fff;">
          <h2>Inscrição Cancelada</h2>
          <p>O email <strong>${email}</strong> foi removido da nossa lista com sucesso.</p>
          <p>Você não receberá mais lembretes ou campanhas do Studio do Jon.</p>
        </body>
        </html>
      `);

    } catch (error) {
      console.error('Erro no unsubscribe:', error);
      return res.status(500).send('Erro interno do servidor.');
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple auth — same x-admin-token pattern
  const adminToken = req.headers['x-admin-token'];
  if (!adminToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { subject, htmlBody, newsletterId, testEmail } = req.body;

  if (!subject || !htmlBody) {
    return res.status(400).json({ error: 'subject e htmlBody são obrigatórios' });
  }

  if (!MAILGUN_API_KEY) {
    return res.status(500).json({ error: 'Chave Mailgun não configurada. Verifique RESEND_API_KEY nas variáveis de ambiente da Vercel.' });
  }

  const fullHtml = wrapNewsletterHtml(subject, htmlBody);

  // ── TEST MODE ─────────────────────────────────────────────────────────────
  if (testEmail) {
    try {
      const msgId = await sendMailgun(testEmail, 'Teste', subject, fullHtml);
      return res.status(200).json({ success: true, mode: 'test', messageId: msgId, sent: 1 });
    } catch (err) {
      console.error('Mailgun test error:', err.message);
      return res.status(500).json({ error: 'Falha no envio de teste', details: err.message });
    }
  }

  // ── PRODUCTION MODE: buscar todas as clientes com email no Firestore ──────
  if (!db) {
    return res.status(500).json({ error: 'Firebase não inicializado' });
  }

  let recipients = [];
  try {
    const snapshot = await getDocs(collection(db, 'client_profiles'));
    snapshot.forEach(docSnap => {
      const d = docSnap.data();
      if (d.email && d.email.includes('@') && d.newsletter !== false) {
        recipients.push({
          email: d.email.trim().toLowerCase(),
          name: (d.name || 'Cliente').split(' ')[0]
        });
      }
    });
  } catch (err) {
    console.error('Firestore error:', err);
    return res.status(500).json({ error: 'Erro ao buscar clientes no Firestore', details: err.message });
  }

  if (recipients.length === 0) {
    return res.status(200).json({ success: true, sent: 0, message: 'Nenhuma cliente com email cadastrado.' });
  }

  // Enviar em lote (Batch Sending) via Mailgun para evitar timeouts na Vercel
  try {
    const basicAuth = Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64');
    const url = `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`;

    // Substituir {nome} pelo placeholder de variáveis do Mailgun (%recipient.name%)
    const batchHtml = fullHtml.replace(/{nome}/g, '%recipient.name%');

    const CHUNK_SIZE = 950; // Limite de lote do Mailgun é 1000, 950 é seguro
    let sent = 0;
    let lastMessageId = '';

    for (let i = 0; i < recipients.length; i += CHUNK_SIZE) {
      const chunk = recipients.slice(i, i + CHUNK_SIZE);

      const recipientVariables = {};
      const toEmails = [];

      chunk.forEach(r => {
        toEmails.push(r.email);
        recipientVariables[r.email] = { name: r.name };
      });

      const bodyParams = new URLSearchParams();
      bodyParams.append('from', FROM_EMAIL);
      bodyParams.append('subject', subject);
      bodyParams.append('html', batchHtml);
      bodyParams.append('recipient-variables', JSON.stringify(recipientVariables));
      bodyParams.append('h:List-Unsubscribe', `<${UNSUBSCRIBE_BASE}%recipient.email%>`);
      bodyParams.append('h:List-Unsubscribe-Post', 'List-Unsubscribe=One-Click');
      bodyParams.append('o:tag', 'newsletter');
      bodyParams.append('o:tracking', 'yes');
      bodyParams.append('o:tracking-clicks', 'yes');
      bodyParams.append('o:tracking-opens', 'yes');

      // Adiciona cada destinatário deste lote
      toEmails.forEach(email => {
        bodyParams.append('to', email);
      });

      const resMailgun = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: bodyParams
      });

      if (!resMailgun.ok) {
        const errText = await resMailgun.text();
        throw new Error(`Mailgun Batch Error ${resMailgun.status} no lote ${Math.floor(i/CHUNK_SIZE) + 1}: ${errText}`);
      }

      const resData = await resMailgun.json();
      lastMessageId = resData.id || 'mailgun-batch-ok';
      sent += chunk.length;
    }

    // Salvar no Firestore
    if (db) {
      try {
        await addDoc(collection(db, 'newsletter_sends'), {
          newsletterId: newsletterId || 'newsletter',
          subject,
          sentAt: new Date().toISOString(),
          sentCount: sent,
          errors: 0,
          messageId: lastMessageId
        });
      } catch (e) {
        console.warn('Firestore save failed:', e.message);
      }
    }

    return res.status(200).json({
      success: true,
      mode: 'production',
      sent,
      total: recipients.length,
      errors: 0,
      messageId: lastMessageId
    });

  } catch (err) {
    console.error('Mailgun batch send error:', err.message);
    return res.status(500).json({ error: 'Falha no envio da newsletter em lote', details: err.message });
  }
}
