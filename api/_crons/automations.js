import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, getDoc, addDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { HTML_TEMPLATES } from '../src/utils/emailTemplates.js';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Use fetch to call our own send-email API so we don't have to duplicate NodeMailer logic
function formatBody(body, name) {
  if (!body) return '';
  return body.replace(/{nome}/gi, name);
}

async function dispatchEmail(payload, hostUrl) {
  try {
    const res = await fetch(`${hostUrl}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (err) {
    console.error('Erro ao chamar /api/send-email:', err);
    return false;
  }
}

// -------------------------------------------------------------
// TEMPLATES HTML (DARK THEME)
// -------------------------------------------------------------
const baseLayout = (content, linkUrl, linkText) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Studio do Jon</title>
</head>
<body style="margin: 0; padding: 0; background-color: #EFE5D2; font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1A1310; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#EFE5D2" style="background-color: #EFE5D2;">
    <tr>
      <td align="center" style="padding: 40px 10px;">
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#FAF5E8" style="max-width: 600px; background-color: #FAF5E8; border-radius: 8px; overflow: hidden; border: 1px solid rgba(26, 19, 16, 0.1); box-shadow: 0 4px 20px rgba(26, 19, 16, 0.08);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px 20px 40px; border-bottom: 1px solid rgba(26, 19, 16, 0.08);">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left">
                    <span style="display: inline-block; width: 36px; height: 36px; border-radius: 50%; background-color: #1A1310; color: #FAF5E8; text-align: center; line-height: 36px; font-size: 20px; font-weight: bold; font-style: italic; font-family: Georgia, serif; vertical-align: middle;">J</span>
                    <span style="display: inline-block; font-size: 15px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #1A1310; margin-left: 10px; vertical-align: middle; font-family: 'Manrope', sans-serif;">O Jon Que Cortou</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px; font-family: 'Manrope', sans-serif; color: #1A1310; font-size: 15.5px; line-height: 1.65;">
              ${content}
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 30px;">
                <tr>
                  <td align="center">
                    <a href="${linkUrl}" style="display: inline-block; text-align: center; border: 2px solid #C97B49; color: #C97B49 !important; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-size: 13px; font-weight: bold; font-family: 'Manrope', sans-serif; text-transform: uppercase; letter-spacing: 0.05em;">
                      ${linkText}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 25px 40px; background-color: #FAF5E8; border-top: 1px solid rgba(26, 19, 16, 0.08); text-align: center; font-family: 'Manrope', sans-serif; font-size: 12px; color: #6B5A4B; line-height: 1.6;">
              <div style="font-size: 14px; font-weight: 600; color: #1A1310; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 15px;">
                Studio do Jon <span style="font-style: italic; font-weight: 400; color: #C97B49; font-family: Georgia, serif; text-transform: none; letter-spacing: normal; margin-left: 5px;">— corte com leitura.</span>
              </div>
              <div style="margin-bottom: 15px;">
                Rua Francisco Ovídio, 184 · Caiçara · Belo Horizonte · MG
              </div>
              <div style="font-size: 11px; color: #8A7866; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.08em; text-transform: uppercase;">
                © ${new Date().getFullYear()} Studio do Jon
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;


const templates = {
  'd1': { 
    subject: '{nome}, como tá o fio hoje?', 
    content: HTML_TEMPLATES['d1'],
    linkUrl: 'https://ojonquecortou.com.br/agendar',
    linkText: 'Agendar Horário'
  },
  'd7': { 
    subject: 'A semana mais importante do seu cabelo (e quase ninguém fala sobre isso)', 
    content: HTML_TEMPLATES['d7'],
    linkUrl: 'https://ojonquecortou.com.br/agendar',
    linkText: 'Agendar Horário'
  },
  'd21': { 
    subject: '3 semanas de corte novo. Agora vem a parte boa.', 
    content: HTML_TEMPLATES['d21'],
    linkUrl: 'https://ojonquecortou.com.br/agendar',
    linkText: 'Agendar Horário'
  },
  'd35': { 
    subject: '{nome}, chegou a hora.', 
    content: HTML_TEMPLATES['d35'],
    linkUrl: 'https://ojonquecortou.com.br/agendar',
    linkText: 'Agendar Horário'
  },
  'd60': { 
    subject: 'Uma coisa que percebi depois de anos cortando cacheado', 
    content: HTML_TEMPLATES['d60'],
    linkUrl: 'https://ojonquecortou.com.br/agendar',
    linkText: 'Agendar Horário'
  },
  'd90': { 
    subject: 'Esse é o último email que mando, {nome}.', 
    content: HTML_TEMPLATES['d90'],
    linkUrl: 'https://ojonquecortou.com.br/agendar',
    linkText: 'Agendar Horário'
  },
  'aniversario': { 
    subject: 'Parabéns, {nome}.', 
    content: HTML_TEMPLATES['aniversario'],
    linkUrl: 'https://ojonquecortou.com.br/agendar',
    linkText: 'Agendar Horário'
  }
};



export default async function handler(req, res) {
  try {
    const adminEmail = process.env.CRON_FIREBASE_EMAIL;
    const adminPassword = process.env.CRON_FIREBASE_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return res.status(500).json({ error: 'Faltam credenciais CRON_FIREBASE_EMAIL e PASSWORD.' });
    }

    await signInWithEmailAndPassword(auth, adminEmail, adminPassword);

    const isLocal = req.headers.host.includes('localhost') || req.headers.host.includes('127.0.0.1');
    const hostUrl = `${isLocal ? 'http' : 'https'}://${req.headers.host}`;

    // Google Calendar Bidirectional Delta-Sync
    try {
      const gcalSyncResponse = await fetch(`${hostUrl}/api/gcal?action=syncAll`, {
        method: 'POST'
      });
      const gcalSyncData = await gcalSyncResponse.json();
      if (gcalSyncResponse.ok && gcalSyncData.success) {
        console.log('Cron triggered Google Calendar sync successfully:', gcalSyncData.stats);
      } else {
        console.warn('Cron triggered Google Calendar sync failed:', gcalSyncData);
      }
    } catch (gcalErr) {
      console.warn('Cron Google Calendar sync fetch error:', gcalErr);
    }

    // Load settings
    const settingsDoc = await getDoc(doc(db, 'settings', 'studio'));
    const settings = settingsDoc.exists() ? settingsDoc.data() : null;
    const automations = settings?.automations || {};
    
    // Fallback: enabled by default if undefined
    const sequenceEnabled = automations.retention30Enabled !== false;

    const formatter = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' });
    const parts = formatter.formatToParts(new Date());
    const day = parts.find(p => p.type === 'day').value;
    const month = parts.find(p => p.type === 'month').value;
    const year = parts.find(p => p.type === 'year').value;
    const todayStr = `${year}-${month}-${day}`;
    
    let logs = [];
    let stats = { birthdays: 0, sequenceMails: 0 };

    // ==========================================
    // 1. ANIVERSÁRIOS (D-5)
    // ==========================================
    if (automations.birthdayEnabled !== false) {
      const targetBdayDate = new Date();
      targetBdayDate.setDate(targetBdayDate.getDate() + 5); // 5 days in the future
      const bParts = formatter.formatToParts(targetBdayDate);
      const bDay = bParts.find(p => p.type === 'day').value;
      const bMonth = bParts.find(p => p.type === 'month').value;
      const monthDayStr = `${bMonth}-${bDay}`;

      const profilesSnap = await getDocs(collection(db, 'client_profiles'));
      for (const docSnap of profilesSnap.docs) {
        const p = docSnap.data();
        if (p.unsubscribed === true) continue;
        if (p.birthdate && p.email && p.email !== 'Não informado' && p.email.includes('@')) {
          if (p.birthdate.endsWith(`-${monthDayStr}`)) {
            const firstName = (p.name || 'Cliente').split(' ')[0];
            const customTpl = settings?.email_templates?.['birthdayEnabled'];
            const subject = (customTpl?.subject || templates.aniversario.subject).replace(/{nome}/g, firstName);
            const content = formatBody(customTpl?.body || templates.aniversario.content, firstName);
            const emailBody = customTpl?.body 
              ? baseLayout(content, templates.aniversario.linkUrl, templates.aniversario.linkText) 
              : content;


            const ok = await dispatchEmail({
              type: 'campanha',
              subject: subject,
              htmlBody: emailBody,
              clientEmail: p.email,
              clientName: p.name
            }, hostUrl);
            
            if (ok) {
              await addDoc(collection(db, 'automation_logs'), {
                timestamp: new Date().toISOString(),
                date: todayStr,
                clientName: p.name,
                email: p.email,
                stage: 'Aniversário'
              });
              stats.birthdays++;
              logs.push(`Aniversário (D-5) enviado para: ${p.name} (${p.email})`);
            }
            // Pausa de segurança de 15 segundos (Titan SMTP limits)
            await sleep(15000);
          }
        }
      }
    }

    // ==========================================
    // 2. RÉGUA DE RELACIONAMENTO
    // ==========================================
    // Array of days to check
    const windows = [1, 7, 21, 35, 50, 60, 90];

    const isChemistry = (serviceName) => {
      if (!serviceName) return false;
      return /(quimica|química|mechas|luzes|coloração|coloracao|descoloração|descoloracao|relaxamento|alisamento|botox|progressiva)/i.test(serviceName);
    };

    if (sequenceEnabled) {
      for (const daysAgo of windows) {
        const targetDateObj = new Date();
        targetDateObj.setDate(targetDateObj.getDate() - daysAgo);
        const tParts = formatter.formatToParts(targetDateObj);
        const tDay = tParts.find(p => p.type === 'day').value;
        const tMonth = tParts.find(p => p.type === 'month').value;
        const tYear = tParts.find(p => p.type === 'year').value;
        const targetDateStr = `${tYear}-${tMonth}-${tDay}`;

        const q = query(collection(db, 'bookings'), where('date', '==', targetDateStr), where('status', 'in', ['Concluído', 'finalizado']));
        const snap = await getDocs(q);

        const processedPhones = new Set();

        for (const bDoc of snap.docs) {
          const booking = bDoc.data();
          if (!booking.clientPhone || !booking.clientEmail || processedPhones.has(booking.clientPhone)) continue;
          
          // Check if client is unsubscribed
          try {
            const phoneKey = booking.clientPhone.replace(/\D/g, '');
            const profileDoc = await getDoc(doc(db, 'client_profiles', phoneKey));
            if (profileDoc.exists() && profileDoc.data().unsubscribed === true) {
              console.log(`Ignorando régua para cliente descadastrado: ${booking.clientName} (${booking.clientEmail})`);
              continue;
            }
          } catch (err) {
            console.warn('Erro ao verificar opt-out do cliente:', err);
          }
          if (!booking.clientEmail.includes('@')) continue;

          processedPhones.add(booking.clientPhone);

          // Verify NO recent booking exists
          const recentQ = query(
            collection(db, 'bookings'),
            where('clientPhone', '==', booking.clientPhone),
            where('date', '>', targetDateStr),
            where('status', 'in', ['Concluído', 'Confirmado', 'finalizado'])
          );
          const recentSnap = await getDocs(recentQ);

          if (recentSnap.empty) {
            // Determine which template to send based on daysAgo
            let tplKey = null;
            const chem = isChemistry(booking.serviceName || '');

            if (daysAgo === 1) tplKey = 'd1';
            else if (daysAgo === 7) tplKey = 'd7';
            else if (daysAgo === 21) tplKey = 'd21';
            else if (daysAgo === 35 && !chem) tplKey = 'd35'; // Rebooking normal
            else if (daysAgo === 50 && chem) tplKey = 'd35'; // Rebooking química
            else if (daysAgo === 60) tplKey = 'd60';
            else if (daysAgo === 90) tplKey = 'd90';
            else if (daysAgo === 150) tplKey = 'reativacao_5_meses';

            if (tplKey && automations[`seqD${daysAgo === 50 ? 35 : daysAgo}`] !== false) {
              const firstName = (booking.clientName || 'Cliente').split(' ')[0];
              const dbKey = `seqD${daysAgo === 50 ? 35 : daysAgo}`;
              const customTpl = settings?.email_templates?.[dbKey];
              
              let payload;
              if (tplKey === 'reativacao_5_meses') {
                const subject = (customTpl?.subject || 'Seu cabelo tem memória, {nome}').replace(/{nome}/g, firstName);
                const content = formatBody(customTpl?.body || '', firstName);
                payload = {
                  type: 'reativacao_5_meses',
                  clientEmail: booking.clientEmail,
                  clientName: booking.clientName,
                  subject: subject,
                  fallbackBody: content || null
                };
              } else {
                const subject = (customTpl?.subject || templates[tplKey].subject).replace(/{nome}/g, firstName);
                const content = formatBody(customTpl?.body || templates[tplKey].content, firstName);
                const emailBody = customTpl?.body
                  ? baseLayout(content, templates[tplKey].linkUrl, templates[tplKey].linkText)
                  : content;
                payload = {
                  type: 'campanha',
                  subject: subject,
                  htmlBody: emailBody,
                  clientEmail: booking.clientEmail,
                  clientName: booking.clientName
                };
              }

              const ok = await dispatchEmail(payload, hostUrl);

              if (ok) {
                await addDoc(collection(db, 'automation_logs'), {
                  timestamp: new Date().toISOString(),
                  date: todayStr,
                  clientName: booking.clientName,
                  email: booking.clientEmail,
                  stage: `D+${daysAgo}`
                });
                stats.sequenceMails++;
                logs.push(`Email D+${daysAgo} enviado para: ${booking.clientName} (${booking.clientEmail})`);
              }
              // Pausa de segurança de 15 segundos (Titan SMTP limits)
              await sleep(15000);
            }
          }
        }
      }
    }

    return res.status(200).json({
      message: 'Automações diárias processadas com nova régua.',
      todayStr,
      stats,
      logs
    });

  } catch (error) {
    console.error('Erro no cron-automations:', error);
    return res.status(500).json({ error: 'Erro interno no servidor.', details: error.message });
  }
}
