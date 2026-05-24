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

// Use fetch to call our own send-email API so we don't have to duplicate NodeMailer logic
function formatBody(body, name) {
  if (!body) return '';
  return body.replace(/{nome}/g, name);
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
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Studio do Jon</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #ffffff; -webkit-font-smoothing: antialiased; }
    .wrapper { width: 100%; background-color: #0a0a0a; padding: 40px 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #111111; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5); border: 1px solid #222222; }
    .header { padding: 30px 20px; text-align: center; border-bottom: 1px solid #222222; }
    .logo-mark { display: inline-block; width: 40px; height: 40px; border-radius: 50%; background-color: #c8852a; color: #0a0a0a; text-align: center; line-height: 40px; font-size: 22px; font-weight: bold; font-style: italic; font-family: Georgia, serif; margin-bottom: 10px; }
    .logo-text { font-size: 14px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: #ffffff; }
    .content { padding: 40px 30px; font-size: 16px; line-height: 1.6; color: #cccccc; }
    .content p { margin-top: 0; margin-bottom: 20px; }
    .btn { display: inline-block; text-align: center; background-color: transparent; color: #c8852a !important; text-decoration: none; padding: 14px 24px; border-radius: 4px; font-size: 14px; font-weight: bold; border: 2px solid #c8852a; margin: 10px 0; transition: all 0.2s ease; }
    .btn-container { text-align: center; margin-top: 30px; }
    .footer { padding: 30px 20px; background-color: #1a1a1a; border-top: 1px solid #222222; text-align: center; font-size: 12px; color: #888888; line-height: 1.6; }
    a { color: #c8852a; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo-mark">J</div>
        <div class="logo-text">O JON QUE CORTOU</div>
      </div>
      <div class="content">
        ${content}
        <div class="btn-container">
          <a href="${linkUrl}" class="btn">
            ${linkText}
          </a>
        </div>
      </div>
      <div class="footer">
        © ${new Date().getFullYear()} O Jon Que Cortou. Todos os direitos reservados.<br>
        Especialista em corte para cabelos ondulados, cacheados e crespos em Belo Horizonte.<br>
        <a href="https://instagram.com/ojonquecortou">@ojonquecortou</a>
      </div>
    </div>
  </div>
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

    const hostUrl = `https://${req.headers.host}`;

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
            const emailBody = baseLayout(content, templates.aniversario.linkUrl, templates.aniversario.linkText);


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
          }
        }
      }
    }

    // ==========================================
    // 2. RÉGUA DE RELACIONAMENTO
    // ==========================================
    // Array of days to check
    const windows = [1, 7, 21, 35, 50, 60, 90, 150];

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

        const q = query(collection(db, 'bookings'), where('date', '==', targetDateStr), where('status', '==', 'Concluído'));
        const snap = await getDocs(q);

        const processedPhones = new Set();

        for (const bDoc of snap.docs) {
          const booking = bDoc.data();
          if (!booking.phone || !booking.email || processedPhones.has(booking.phone)) continue;
          
          // Check if client is unsubscribed
          try {
            const profileDoc = await getDoc(doc(db, 'client_profiles', booking.phone));
            if (profileDoc.exists() && profileDoc.data().unsubscribed === true) {
              console.log(`Ignorando régua para cliente descadastrado: ${booking.clientName} (${booking.email})`);
              continue;
            }
          } catch (err) {
            console.warn('Erro ao verificar opt-out do cliente:', err);
          }
          if (!booking.email.includes('@')) continue;

          processedPhones.add(booking.phone);

          // Verify NO recent booking exists
          const recentQ = query(
            collection(db, 'bookings'),
            where('phone', '==', booking.phone),
            where('date', '>', targetDateStr),
            where('status', 'in', ['Concluído', 'Confirmado'])
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
                  clientEmail: booking.email,
                  clientName: booking.clientName,
                  subject: subject,
                  fallbackBody: content || null
                };
              } else {
                const subject = (customTpl?.subject || templates[tplKey].subject).replace(/{nome}/g, firstName);
                const content = formatBody(customTpl?.body || templates[tplKey].content, firstName);
                const emailBody = baseLayout(content, templates[tplKey].linkUrl, templates[tplKey].linkText);
                payload = {
                  type: 'campanha',
                  subject: subject,
                  htmlBody: emailBody,
                  clientEmail: booking.email,
                  clientName: booking.clientName
                };
              }

              const ok = await dispatchEmail(payload, hostUrl);

              if (ok) {
                await addDoc(collection(db, 'automation_logs'), {
                  timestamp: new Date().toISOString(),
                  date: todayStr,
                  clientName: booking.clientName,
                  email: booking.email,
                  stage: `D+${daysAgo}`
                });
                stats.sequenceMails++;
                logs.push(`Email D+${daysAgo} enviado para: ${booking.clientName} (${booking.email})`);
              }
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
