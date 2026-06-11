import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import FormData from 'form-data';
import Mailgun from 'mailgun.js';

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

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || 'ojonquecortou.com.br';
const FROM_EMAIL = 'Studio do Jon <contato@ojonquecortou.com.br>';
const UNSUBSCRIBE_URL = 'https://ojonquecortou.com.br/api/unsubscribe?email=';

// Wrap newsletter HTML in full email document
function wrapNewsletterHtml(subject, body) {
  const previewText = body
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
  <!-- Hidden preheader -->
  <div style="display: none; max-height: 0px; overflow: hidden; font-size: 1px; line-height: 1px; color: #EFE5D2; opacity: 0;">${previewText}</div>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#EFE5D2" style="background-color: #EFE5D2;">
    <tr>
      <td align="center" style="padding: 40px 10px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FAF5E8" style="max-width: 620px; background-color: #FAF5E8; border-radius: 8px; overflow: hidden; border: 1px solid rgba(26,19,16,0.1); box-shadow: 0 4px 20px rgba(26,19,16,0.08);">
          <tr>
            <td align="left">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #EFE5D2; border-top: 1px solid rgba(26,19,16,0.1); text-align: center; font-family: 'Manrope', sans-serif;">
              <div style="font-size: 12px; color: #6B5A4B; line-height: 1.6;">
                Rua Francisco Ovídio, 184 · Caiçara<br>Belo Horizonte · MG<br>Quarta a Sábado · 9h às 19h
              </div>
              <div style="margin-top: 12px; font-size: 11px; color: #9A8A7A; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.06em; text-transform: uppercase;">
                © ${new Date().getFullYear()} Studio do Jon<br>
                <a href="%unsubscribe_url%" style="color: #9A8A7A; text-decoration: underline;">Cancelar inscrição</a>
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple auth check
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ') && !req.headers['x-admin-token']) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { subject, htmlBody, newsletterId, testEmail } = req.body;

  if (!subject || !htmlBody) {
    return res.status(400).json({ error: 'subject e htmlBody são obrigatórios' });
  }

  if (!MAILGUN_API_KEY) {
    return res.status(500).json({ error: 'MAILGUN_API_KEY não configurada. Adicione nas variáveis de ambiente da Vercel.' });
  }

  try {
    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({ username: 'api', key: MAILGUN_API_KEY });

    const fullHtml = wrapNewsletterHtml(subject, htmlBody);

    // ── TEST MODE: send only to one address ──────────────────────────────────
    if (testEmail) {
      const msgData = {
        from: FROM_EMAIL,
        to: [testEmail],
        subject,
        html: fullHtml,
        'o:tag': ['newsletter', 'test'],
        'h:List-Unsubscribe': `<${UNSUBSCRIBE_URL}${encodeURIComponent(testEmail)}>`
      };

      const result = await mg.messages.create(MAILGUN_DOMAIN, msgData);
      return res.status(200).json({
        success: true,
        mode: 'test',
        messageId: result.id,
        sent: 1
      });
    }

    // ── PRODUCTION MODE: fetch all clients with email ─────────────────────────
    if (!db) {
      return res.status(500).json({ error: 'Firebase não inicializado' });
    }

    const snapshot = await getDocs(collection(db, 'clients'));
    const recipients = [];
    snapshot.forEach(docSnap => {
      const d = docSnap.data();
      if (d.email && d.email.includes('@') && d.newsletter !== false) {
        recipients.push({
          email: d.email.trim().toLowerCase(),
          name: d.name || 'Querida cliente'
        });
      }
    });

    if (recipients.length === 0) {
      return res.status(200).json({ success: true, sent: 0, message: 'Nenhuma cliente com email cadastrado encontrada.' });
    }

    // Mailgun batch send — each recipient gets personalized email
    const recipientVars = {};
    const toList = recipients.map(r => {
      recipientVars[r.email] = { name: r.name.split(' ')[0] };
      return `${r.name.split(' ')[0]} <${r.email}>`;
    });

    const personalizedHtml = fullHtml.replace(/%recipient\.name%/g, '%recipient.name%');

    const msgData = {
      from: FROM_EMAIL,
      to: toList,
      subject,
      html: personalizedHtml,
      'recipient-variables': JSON.stringify(recipientVars),
      'o:tag': ['newsletter', newsletterId || 'leitura-de-fio'],
      'o:tracking': 'yes',
      'o:tracking-clicks': 'yes',
      'o:tracking-opens': 'yes',
      'h:List-Unsubscribe': '<https://ojonquecortou.com.br/api/unsubscribe?email=%recipient_email%>',
      'h:List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
    };

    const result = await mg.messages.create(MAILGUN_DOMAIN, msgData);

    return res.status(200).json({
      success: true,
      mode: 'production',
      messageId: result.id,
      sent: recipients.length,
      recipients: recipients.map(r => r.email)
    });

  } catch (error) {
    console.error('Mailgun error:', error);
    return res.status(500).json({
      error: 'Falha ao enviar newsletter',
      details: error.message || String(error)
    });
  }
}
