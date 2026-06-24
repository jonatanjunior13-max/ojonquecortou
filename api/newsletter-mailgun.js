import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, query, where, updateDoc, doc } from 'firebase/firestore';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

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

// Check which mail API keys and configs are configured
const MAILGUN_API_KEY = (process.env.MAILGUN_API_KEY || (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.startsWith('re_') ? process.env.RESEND_API_KEY : '') || '').trim();
const RESEND_API_KEY = (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith('re_') ? process.env.RESEND_API_KEY : '').trim();

const smtpHost = (process.env.SMTP_HOST || '').trim();
const smtpPort = (process.env.SMTP_PORT || '587').trim();
const smtpUser = (process.env.SMTP_USER || '').trim();
const smtpPass = (process.env.SMTP_PASS || '').trim();
const smtpSecure = process.env.SMTP_SECURE === 'true';
const smtpFrom = (process.env.SMTP_FROM || 'contato@ojonquecortou.com.br').trim();
const hasSmtpConfig = Boolean(smtpHost && smtpUser && smtpPass);

const MAILGUN_DOMAIN = 'mg.ojonquecortou.com.br';
const FROM_EMAIL = smtpFrom || '"O Jon Que Cortou" <contato@ojonquecortou.com.br>';
const UNSUBSCRIBE_BASE = 'https://ojonquecortou.com.br/api/unsubscribe?email=';

// Wrap newsletter HTML in a full email document
function wrapNewsletterHtml(subject, body) {
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

function verifyMailgunSignature(signingKey, timestamp, token, signature) {
  if (!signingKey || !timestamp || !token || !signature) return false;
  const encodedToken = crypto
    .createHmac('sha256', signingKey)
    .update(timestamp.toString() + token)
    .digest('hex');
  return encodedToken === signature;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');

  // 1. GET Action: Check Bounces list
  if (req.method === 'GET') {
    const adminToken = req.headers['x-admin-token'] || req.query.token;
    if (!adminToken || adminToken !== 'studio-jon-admin') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      let bounces = [];

      if (MAILGUN_API_KEY) {
        // Fetch from Mailgun
        const basicAuth = Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64');
        const mailgunUrl = `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/bounces`;
        
        const resMailgun = await fetch(mailgunUrl, {
          method: 'GET',
          headers: { 'Authorization': `Basic ${basicAuth}` }
        });

        if (resMailgun.ok) {
          const mailgunData = await resMailgun.json();
          (mailgunData.items || []).forEach(b => {
            bounces.push({
              address: b.address,
              error: b.error,
              created_at: b.created_at
            });
          });
        }
      } else if (RESEND_API_KEY) {
        // Fetch from Resend Suppressions list
        const resResend = await fetch('https://api.resend.com/suppressions', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}` }
        });
        if (resResend.ok) {
          const resendData = await resResend.json();
          (resendData.data || []).forEach(s => {
            bounces.push({
              address: s.email,
              error: s.reason || 'Blocked/Bounced',
              created_at: s.created_at
            });
          });
        }
      }

      const snapshot = await getDocs(collection(db, 'client_profiles'));
      const clients = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.email) {
          clients.push({
            id: docSnap.id,
            name: data.name,
            email: data.email.trim().toLowerCase(),
            newsletter: data.newsletter
          });
        }
      });

      const matchedBounces = [];
      bounces.forEach(bounce => {
        const bounceEmail = bounce.address.trim().toLowerCase();
        const matchedClients = clients.filter(c => c.email === bounceEmail);
        
        if (matchedClients.length > 0) {
          matchedClients.forEach(c => {
            matchedBounces.push({
              name: c.name,
              email: c.email,
              phone: c.id,
              newsletterStatus: c.newsletter === false ? 'Desativado' : 'Ativo',
              error: bounce.error,
              createdAt: bounce.created_at
            });
          });
        } else {
          matchedBounces.push({
            name: 'Sem cliente ativa vinculada',
            email: bounceEmail,
            phone: null,
            newsletterStatus: 'N/A',
            error: bounce.error,
            createdAt: bounce.created_at
          });
        }
      });

      return res.status(200).json({
        success: true,
        totalBounces: bounces.length,
        matchedBouncesCount: matchedBounces.length,
        items: matchedBounces
      });

    } catch (err) {
      return res.status(500).json({ error: 'Falha no processamento de bounces', details: err.message });
    }
  }

  // 2. POST Action: Send Newsletter to all or Test
  if (req.method === 'POST') {
    const adminToken = req.headers['x-admin-token'];
    if (!adminToken || adminToken !== 'studio-jon-admin') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { subject, htmlBody, newsletterId, testEmail } = req.body;

    if (!subject || !htmlBody) {
      return res.status(400).json({ error: 'subject e htmlBody são obrigatórios' });
    }

    const hasAnySender = Boolean(MAILGUN_API_KEY || RESEND_API_KEY || hasSmtpConfig);
    if (!hasAnySender) {
      return res.status(500).json({ 
        error: 'Nenhum serviço de e-mail configurado. Configure RESEND_API_KEY, MAILGUN_API_KEY ou os parâmetros de SMTP (Titan) nas variáveis da Vercel.' 
      });
    }

    const fullHtml = wrapNewsletterHtml(subject, htmlBody);

    // ── TEST MODE ─────────────────────────────────────────────────────────────
    if (testEmail) {
      try {
        let messageId = 'test-send-ok';

        if (MAILGUN_API_KEY) {
          messageId = await sendMailgun(testEmail, 'Teste', subject, fullHtml);
        } else if (RESEND_API_KEY) {
          const resResend = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: FROM_EMAIL,
              to: [testEmail],
              subject,
              html: fullHtml
            })
          });
          if (!resResend.ok) {
            const errText = await resResend.text();
            throw new Error(`Resend Error ${resResend.status}: ${errText}`);
          }
          const resendData = await resResend.json();
          messageId = resendData.id || 'resend-ok';
        } else if (hasSmtpConfig) {
          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: parseInt(smtpPort, 10),
            secure: smtpSecure,
            auth: { user: smtpUser, pass: smtpPass },
            tls: { rejectUnauthorized: false }
          });
          const info = await transporter.sendMail({
            from: FROM_EMAIL,
            to: testEmail,
            subject,
            html: fullHtml
          });
          messageId = info.messageId || 'smtp-ok';
        }

        return res.status(200).json({ success: true, mode: 'test', messageId, sent: 1 });
      } catch (err) {
        console.error('Test email send error:', err.message);
        return res.status(500).json({ error: 'Falha no envio de teste', details: err.message });
      }
    }

    // ── PRODUCTION MODE ───────────────────────────────────────────────────────
    if (!db) {
      return res.status(500).json({ error: 'Firebase não inicializado' });
    }

    let recipients = [];
    try {
      const snapshot = await getDocs(collection(db, 'client_profiles'));
      snapshot.forEach(docSnap => {
        const d = docSnap.data();
        if (d.email && d.email.includes('@') && d.newsletter !== false && !d.emailInvalid && !d.unsubscribed) {
          recipients.push({
            email: d.email.trim().toLowerCase(),
            name: (d.name || 'Cliente').split(' ')[0]
          });
        }
      });
    } catch (err) {
      console.error('Firestore query error:', err);
      return res.status(500).json({ error: 'Erro ao buscar clientes no Firestore', details: err.message });
    }

    if (recipients.length === 0) {
      return res.status(200).json({ success: true, sent: 0, message: 'Nenhuma cliente elegível com email ativo.' });
    }

    let sent = 0;
    let errors = 0;
    let lastMessageId = '';

    try {
      if (MAILGUN_API_KEY) {
        // Mailgun Batch Sending
        const basicAuth = Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64');
        const url = `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`;
        const batchHtml = fullHtml.replace(/{nome}/g, '%recipient.name%');
        const CHUNK_SIZE = 950;

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

          toEmails.forEach(email => bodyParams.append('to', email));

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
            throw new Error(`Mailgun batch error ${resMailgun.status}: ${errText}`);
          }
          const resData = await resMailgun.json();
          lastMessageId = resData.id || 'mailgun-batch-ok';
          sent += chunk.length;
        }
      } 
      else if (RESEND_API_KEY) {
        // Resend Batch Sending
        const CHUNK_SIZE = 100; // Resend limit is 100 emails per batch call
        for (let i = 0; i < recipients.length; i += CHUNK_SIZE) {
          const chunk = recipients.slice(i, i + CHUNK_SIZE);
          const batchEmails = chunk.map(r => ({
            from: FROM_EMAIL,
            to: [r.email],
            subject: subject,
            html: fullHtml.replace(/{nome}/g, r.name),
            headers: {
              'List-Unsubscribe': `<${UNSUBSCRIBE_BASE}${encodeURIComponent(r.email)}>`
            }
          }));

          const resResend = await fetch('https://api.resend.com/emails/batch', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(batchEmails)
          });

          if (!resResend.ok) {
            const errText = await resResend.text();
            throw new Error(`Resend batch error ${resResend.status}: ${errText}`);
          }
          const resData = await resResend.json();
          lastMessageId = (resData.data && resData.data[0]?.id) || 'resend-batch-ok';
          sent += chunk.length;
        }
      } 
      else if (hasSmtpConfig) {
        // SMTP Sequential/Parallel sending (e.g. Titan Email)
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(smtpPort, 10),
          secure: smtpSecure,
          auth: { user: smtpUser, pass: smtpPass },
          tls: { rejectUnauthorized: false }
        });

        // Use sequential sending with a tiny delay to prevent SMTP server overload
        for (const r of recipients) {
          try {
            const info = await transporter.sendMail({
              from: FROM_EMAIL,
              to: r.email,
              subject: subject,
              html: fullHtml.replace(/{nome}/g, r.name),
              headers: {
                'List-Unsubscribe': `<${UNSUBSCRIBE_BASE}${encodeURIComponent(r.email)}>`
              }
            });
            lastMessageId = info.messageId || 'smtp-ok';
            sent++;
            // Tiny sleep (100ms) to play nice with Titan SMTP limits
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (smtpErr) {
            console.error(`Error sending email to ${r.email} via SMTP:`, smtpErr.message);
            errors++;
          }
        }
      }

      // Save to Firestore
      if (db) {
        try {
          await addDoc(collection(db, 'newsletter_sends'), {
            newsletterId: newsletterId || 'newsletter',
            subject,
            sentAt: new Date().toISOString(),
            sentCount: sent,
            errors: errors,
            messageId: lastMessageId
          });
        } catch (e) {
          console.warn('Firestore save log failed:', e.message);
        }
      }

      return res.status(200).json({
        success: true,
        mode: 'production',
        sent,
        total: recipients.length,
        errors,
        messageId: lastMessageId
      });

    } catch (err) {
      console.error('Batch send campaign error:', err.message);
      return res.status(500).json({ error: 'Falha no envio da campanha', details: err.message });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
