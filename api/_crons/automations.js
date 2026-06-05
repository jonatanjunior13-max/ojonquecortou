import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, getDoc, addDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { HTML_TEMPLATES } from '../../src/utils/emailTemplates.js';

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
  <div style="background-color: #EFE5D2; padding: 40px 20px; min-height: 100vh;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin: 0 auto; background-color: #FAF5E8; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 48px rgba(26, 19, 16, 0.08), 0 1px 3px rgba(26, 19, 16, 0.04);">
      <tr>
        <td style="padding: 56px 48px 48px;">
          
          <!-- HEADER -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom: 1px solid rgba(26, 19, 16, 0.08); padding-bottom: 24px; margin-bottom: 48px;">
            <tr>
              <td align="left" valign="middle">
                <span style="display: inline-block; width: 32px; height: 32px; border-radius: 50%; background: #1A1310; color: #FAF5E8; text-align: center; line-height: 32px; font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 18px; margin-right: 12px; vertical-align: middle;">J</span>
                <span style="font-family: 'DM Serif Display', Georgia, serif; font-size: 18px; letter-spacing: -0.01em; color: #1A1310; vertical-align: middle;">Studio do Jon</span>
              </td>
            </tr>
          </table>

          <!-- CONTENT -->
          <div style="margin-top: 32px; font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15.5px; line-height: 1.65; color: #2E241E;">
            ${content}
          </div>
          
          <div style="margin-top: 32px; margin-bottom: 16px;">
            <a href="${linkUrl}" style="display: inline-block; background-color: #1A1310; color: #FAF5E8; padding: 14px 28px; border-radius: 999px; font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; text-decoration: none; box-shadow: 0 4px 12px rgba(26,19,16,0.15);">${linkText}</a>
          </div>

          <!-- SIGNATURE -->
          <hr style="border: 0; border-top: 1px solid rgba(26, 19, 16, 0.08); margin: 48px 0 32px;" />
          <div>
            <div style="font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 32px; line-height: 1; color: #B05A2E;">Jon</div>
          </div>
          <p style="font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.65; color: #6B5A4B; margin: 12px 0 0; max-width: 52ch;">
            <strong style="color: #1A1310; font-weight: 600;">Studio do Jon</strong><br />
            Especialista em corte para cabelos ondulados, cacheados e crespos com foco em visagismo em Belo Horizonte.
          </p>
          
        </td>
      </tr>
      <!-- FOOTER -->
      <tr>
        <td style="background-color: #1A1310; padding: 40px 48px; border-top: 1px solid rgba(250, 245, 232, 0.1);">
          <div style="font-family: 'DM Serif Display', Georgia, serif; font-size: 24px; line-height: 1.2; letter-spacing: -0.015em; color: #FAF5E8; margin: 0 0 12px;">
            Studio do Jon <span style="font-family: 'Instrument Serif', Georgia, serif; font-style: italic; color: #B05A2E; display: block; margin-top: 6px;">— corte com leitura.</span>
          </div>
          <p style="font-family: 'Manrope', sans-serif; font-size: 13px; color: rgba(250, 245, 232, 0.6); line-height: 1.6; margin: 0 0 24px 0;">
            Rua Francisco Ovídio, 184 &middot; Caiçara<br>Belo Horizonte &middot; MG &middot; 30000-000<br>Quarta a Sábado &middot; 9h às 19h
          </p>
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(250, 245, 232, 0.4); border-top: 1px solid rgba(250, 245, 232, 0.1); padding-top: 20px;">
            &copy; ${new Date().getFullYear()} Studio do Jon &middot; @ojonquecortou
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
`;


const templates = {
  'launchE1': { 
    subject: 'O Studio do Jon mudou (e por que isso importa para o seu cabelo)', 
    content: HTML_TEMPLATES['launch_e1'],
    linkUrl: 'https://ojonquecortou.com.br/agendar',
    linkText: 'Ver Novo Sistema'
  },
  'launchE2': { 
    subject: 'Por que você nunca deve pedir apenas um "corte de pontinhas"', 
    content: HTML_TEMPLATES['launch_e2'],
    linkUrl: 'https://ojonquecortou.com.br/agendar',
    linkText: 'Agendar Horário'
  },
  'launchE3': { 
    subject: 'Garanta seu horário com prioridade.', 
    content: HTML_TEMPLATES['launch_e3'],
    linkUrl: 'https://ojonquecortou.com.br/agendar',
    linkText: 'Agendar Horário'
  },
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
    subject: 'Um mês de corte (e o segredo para ele durar mais)', 
    content: HTML_TEMPLATES['d35'],
    linkUrl: 'https://ojonquecortou.com.br/agendar',
    linkText: 'Agendar Horário'
  },
  'd60': { 
    subject: 'Falta 1 mês para a sua janela de manutenção', 
    content: HTML_TEMPLATES['d60'],
    linkUrl: 'https://ojonquecortou.com.br/agendar',
    linkText: 'Agendar Horário'
  },
  'd90': { 
    subject: 'Últimos dias do valor especial de manutenção, {nome}', 
    content: HTML_TEMPLATES['d90'],
    linkUrl: 'https://ojonquecortou.com.br/agendar',
    linkText: 'Agendar Horário'
  },
  'aniversario': { 
    subject: 'Seu aniversário tá chegando, {nome}', 
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
    const sequenceEnabled = automations.sequenceEnabled !== false;

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
              type: 'launch_campaign',
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
            // Pausa de segurança de 5 segundos (Titan SMTP limits)
            await sleep(5000);
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

          const recentQ = query(
            collection(db, 'bookings'),
            where('clientPhone', '==', booking.clientPhone)
          );
          const recentSnap = await getDocs(recentQ);
          const hasRecent = recentSnap.docs.some(doc => {
            const b = doc.data();
            return b.date > targetDateStr && ['Concluído', 'Confirmado', 'finalizado'].includes(b.status);
          });

          if (!hasRecent) {
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
                  type: 'launch_campaign',
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
              // Pausa de segurança de 5 segundos (Titan SMTP limits)
              await sleep(5000);
            }
          }
        }
      }
    }

    // ==========================================
    // 3. CAMPANHA DE LANÇAMENTO (LISTA FRIA)
    // ==========================================
    if (automations.launchCampaignEnabled === true) {
      const profilesSnap = await getDocs(collection(db, 'client_profiles'));
      const launchTargets = [];
      
      for (const docSnap of profilesSnap.docs) {
        const p = docSnap.data();
        if (p.unsubscribed === true) continue;
        if (!p.email || p.email === 'Não informado' || !p.email.includes('@')) continue;
        // Alvos da lista fria (sem histórico de visita / getDaysAbsent(lastVisit) == Infinity)
        if (!p.lastVisit) {
          launchTargets.push(p);
        }
      }

      if (launchTargets.length > 0) {
        const MAX_LAUNCH_EMAILS_PER_RUN = 5;
        for (const target of launchTargets) {
          const logQ = query(collection(db, 'automation_logs'), where('email', '==', target.email));
          const logSnap = await getDocs(logQ);
          let gotE1 = null, gotE2 = null, gotE3 = null;
          
          logSnap.forEach(l => {
            const data = l.data();
            if (data.stage === 'launch_e1') gotE1 = new Date(data.timestamp);
            if (data.stage === 'launch_e2') gotE2 = new Date(data.timestamp);
            if (data.stage === 'launch_e3') gotE3 = new Date(data.timestamp);
          });
          
          let tplKey = null;
          let stageLabel = null;
          
          const now = new Date();
          const msPerDay = 1000 * 60 * 60 * 24;
          
          if (!gotE1) {
            tplKey = 'launchE1';
            stageLabel = 'launch_e1';
          } else if (!gotE2 && (now - gotE1) / msPerDay >= 5) {
            tplKey = 'launchE2';
            stageLabel = 'launch_e2';
          } else if (gotE1 && !gotE3 && (now - gotE1) / msPerDay >= 10) {
            tplKey = 'launchE3';
            stageLabel = 'launch_e3';
          }
          
          if (tplKey && automations[tplKey] !== false) {
             const firstName = (target.name || 'Cliente').split(' ')[0];
             const customTpl = settings?.email_templates?.[tplKey];
             const subject = (customTpl?.subject || templates[tplKey].subject).replace(/{nome}/g, firstName);
             const content = formatBody(customTpl?.body || templates[tplKey].content, firstName);
             
             // Os templates de lançamento já vêm com HTML completo se usarem o default
             const emailBody = customTpl?.body
                ? baseLayout(content, templates[tplKey].linkUrl, templates[tplKey].linkText)
                : content;
 
             const payload = {
                type: 'launch_campaign',
                subject: subject,
                htmlBody: emailBody,
                clientEmail: target.email,
                clientName: target.name
             };
             
             const ok = await dispatchEmail(payload, hostUrl);
             if (ok) {
                await addDoc(collection(db, 'automation_logs'), {
                  timestamp: new Date().toISOString(),
                  date: todayStr,
                  clientName: target.name,
                  email: target.email,
                  stage: stageLabel
                });
                stats.launchMails = (stats.launchMails || 0) + 1;
                logs.push(`Campanha de Lançamento (${stageLabel}) enviado para: ${target.name} (${target.email})`);
                
                if (stats.launchMails >= MAX_LAUNCH_EMAILS_PER_RUN) {
                  logs.push(`Limite diário de disparos da campanha de lançamento atingido (${MAX_LAUNCH_EMAILS_PER_RUN}). Interrompendo novos disparos hoje.`);
                  break;
                }
             }
             // Pausa de segurança de 5 segundos (Titan SMTP limits)
             await sleep(5000);
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
