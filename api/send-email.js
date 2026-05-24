import nodemailer from 'nodemailer';
import { EMAIL_CSS } from '../src/utils/emailTemplates.js';

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

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
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (e) {}



// Helper function for the shared email template shell

function getStandaloneWrapper(title, content) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${EMAIL_CSS}</style>
</head>
<body style="margin: 0; padding: 0; background-color: #f0eee9; -webkit-font-smoothing: antialiased;">
  ${content}
</body>
</html>
`;
}

function getEmailWrapper(title, content) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
      body { margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #cccccc; -webkit-font-smoothing: antialiased; }
      .wrapper { width: 100%; background-color: #0a0a0a; padding: 40px 0; }
      .container { max-width: 600px; margin: 0 auto; background-color: #111111; border-radius: 8px; overflow: hidden; border: 1px solid #222222; }
      .header { padding: 40px 30px; text-align: center; border-bottom: 1px solid #222222; }
      .logo-mark { display: inline-block; width: 48px; height: 48px; border-radius: 50%; background-color: #c8852a; color: #0a0a0a; text-align: center; line-height: 48px; font-size: 26px; font-weight: bold; font-style: italic; font-family: Georgia, serif; margin-bottom: 15px; }
      .logo-text { font-size: 15px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: #ffffff; }
      .tag { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #888; margin-top: 10px; }
      
      .content { padding: 40px 30px; }
      
      .eyebrow { font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #c8852a; font-weight: 600; margin-bottom: 10px; }
      .display-title { font-size: 32px; font-weight: 400; color: #ffffff; margin-top: 0; margin-bottom: 20px; font-family: Georgia, serif; }
      .display-title span { font-style: italic; color: #c8852a; }
      
      .lead { font-size: 16px; line-height: 1.6; color: #cccccc; margin-bottom: 40px; }
      
      .appt-card { background-color: #1a1a1a; border: 1px solid #333; border-radius: 6px; padding: 30px; margin-bottom: 40px; }
      .appt-card .label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #888; margin-bottom: 15px; }
      .appt-card .when { font-size: 20px; font-weight: 600; color: #ffffff; margin: 0 0 5px 0; }
      .appt-card .when span { color: #c8852a; font-style: italic; font-weight: 400; font-family: Georgia, serif; }
      .appt-card .where { font-size: 14px; color: #999; margin: 0 0 25px 0; }
      
      .meta-row { display: table; width: 100%; }
      .cell { display: table-cell; width: 50%; }
      .lbl { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #888; margin-bottom: 4px; }
      .val { font-size: 15px; color: #fff; font-weight: 500; }
      
      .rule { border: 0; border-top: 1px solid #222; margin: 40px 0; }
      
      .btn { display: inline-block; text-align: center; border: 2px solid #c8852a; color: #c8852a !important; text-decoration: none; padding: 14px 24px; border-radius: 4px; font-size: 14px; font-weight: bold; margin: 30px 0; transition: background-color 0.2s ease; }
      
      .instructions-title { font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #c8852a; font-weight: 600; margin-bottom: 15px; }
      .instructions-body { font-size: 15px; line-height: 1.6; color: #ccc; }
      .instructions-body strong { color: #fff; }
      
      .signoff { margin-top: 50px; border-top: 1px solid #222; padding-top: 30px; }
      .signoff .sig-name { font-size: 24px; font-family: Georgia, serif; font-style: italic; color: #fff; margin-bottom: 10px; }
      .signoff .sig-meta { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #888; line-height: 1.5; }
      
      .footer { padding: 40px 30px; background-color: #111; border-top: 1px solid #222; text-align: center; }
      .footer-brand { font-size: 14px; font-weight: 600; color: #fff; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 15px; }
      .footer-brand span { font-style: italic; font-weight: 400; color: #c8852a; font-family: Georgia, serif; text-transform: none; letter-spacing: normal; }
      .addr { font-size: 13px; color: #777; line-height: 1.6; margin-bottom: 25px; }
      .legal { font-size: 11px; color: #555; }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="container">
        <div class="header">
          <div class="logo-mark">J</div>
          <div class="logo-text">O Jon Que Cortou</div>
          <div class="tag">Mensagem Automática</div>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <div class="footer-brand">Studio do Jon <span style="margin-left:5px;">— corte com leitura.</span></div>
          <div class="addr">Rua Francisco Ovídio, 184 · Caiçara<br>Belo Horizonte · MG · 30000-000<br>Quarta a Sábado · 9h às 19h</div>
          <div class="legal">© ${new Date().getFullYear()} Studio do Jon</div>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
}

function formatApptDate(dateString, timeString) {
  // Simplificado para formatação manual base, se precisar de pt-BR Intl, pode adicionar.
  if (!dateString) return '';
  const [y, m, d] = dateString.split('-');
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return `${d} de ${months[parseInt(m, 10)-1]}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const data = req.body;
  const { type = 'horario_confirmado', clientEmail, clientName, subject, htmlBody } = data;

  if (!clientEmail) {
    return res.status(400).json({ message: 'Campos obrigatórios ausentes: clientEmail' });
  }

  if (db && clientEmail) {
    try {
      const q = query(collection(db, 'client_profiles'), where('email', '==', clientEmail));
      const snap = await getDocs(q);
      if (!snap.empty) {
        if (snap.docs[0].data().unsubscribed === true) {
          console.log(`Opt-out ativo para ${clientEmail}. Ignorando envio.`);
          return res.status(200).json({ success: true, message: 'Usuário opt-out', unsubscribed: true });
        }
      }
    } catch (e) {
      console.warn('Erro ao checar opt-out:', e);
    }
  }


  // Retrieve SMTP variables from environment
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT || '587';
  const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === '465';
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || 'agendamento@ojonquecortou.com.br';

  const sendReal = process.env.SEND_REAL_EMAILS === 'true';
  if (!sendReal) {
    console.log('Simulação de envio ativa (SEND_REAL_EMAILS não é "true"). Para:', clientEmail);
    return res.status(200).json({ success: true, simulated: true, message: 'Simulado' });
  }

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn('Servidor SMTP não configurado. Simulando envio para:', clientEmail);
    return res.status(200).json({ success: true, simulated: true, message: 'Simulado' });
  }


  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort, 10),
    secure: smtpSecure,
    auth: { user: smtpUser, pass: smtpPass },
    tls: { rejectUnauthorized: false }
  });

  let emailSubject = 'O Jon Que Cortou';
  let emailContent = '';
  
  const firstName = clientName ? clientName.split(' ')[0] : 'Cliente';

  let currentType = type;

  // Carregar settings do Firestore se existir custom_automations para o type
  let settings = null;
  if (db) {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'studio'));
      if (settingsDoc.exists()) {
        settings = settingsDoc.data();
      }
    } catch (e) {
      console.warn('Erro ao carregar settings:', e);
    }
  }

  const customAutomationHtml = settings?.custom_automations?.[type];
  if (customAutomationHtml) {
    const formattedDate = data.date ? (data.date.includes('-') ? data.date.split('-').reverse().join('/') : data.date) : '';
    const formattedTime = data.time || '';
    const formattedService = data.serviceName || '';
    
    emailContent = customAutomationHtml
      .replace(/{nome}/g, firstName)
      .replace(/{data}/g, formattedDate)
      .replace(/{horario}/g, formattedTime)
      .replace(/{hora}/g, formattedTime)
      .replace(/{servico}/g, formattedService)
      .replace(/{email}/g, encodeURIComponent(clientEmail));
      
    emailSubject = subject || (
      type === 'solicitacao_recebida' ? 'Solicitação de Agendamento Recebida - O Jon Que Cortou' :
      type === 'lembrete_24h' ? 'Lembrete de Agendamento - O Jon Que Cortou' :
      type === 'reativacao_5_meses' ? 'Seu cabelo tem memória, {nome}'.replace(/{nome}/g, firstName) :
      'Mensagem do Studio do Jon'
    );
    currentType = 'campanha_raw';
  } else {
    switch (type) {
    case 'solicitacao_recebida':
      emailSubject = 'Solicitação de Agendamento Recebida - O Jon Que Cortou';
      emailContent = `
        <div class="eyebrow">Em Análise</div>
        <h1 class="display-title">Recebemos, <span>${firstName}.</span></h1>
        <p class="lead">Recebemos a sua solicitação de agendamento. Ela está atualmente em análise.</p>
        <p class="lead" style="margin-top:-20px;">Assim que o Jon confirmar a disponibilidade, você receberá um e-mail de confirmação definitiva com todas as instruções.</p>
        
        <div class="appt-card">
          <div class="label">Pré-agendamento</div>
          <p class="when">${formatApptDate(data.date, data.time)} <span>às ${data.time}</span></p>
          <div class="meta-row" style="margin-top:20px;">
            <div class="cell">
              <div class="lbl">Serviço</div>
              <div class="val">${data.serviceName}</div>
            </div>
          </div>
        </div>
        
        <div class="signoff">
          <div class="sig-name">Jon,</div>
          <div class="sig-meta"><div>JONATAN JUNIOR</div><div>STUDIO DO JON</div></div>
        </div>
      `;
      break;

    case 'horario_confirmado':
      emailSubject = `Está marcado — ${formatApptDate(data.date, data.time)} às ${data.time}`;
      emailContent = `
        <div class="eyebrow">Está marcado</div>
        <h1 class="display-title">Te espero, <span>${firstName}.</span></h1>
        <p class="lead">Seu horário no Studio está confirmado. Antes de qualquer corte eu faço uma leitura do fio — porosidade, curvatura e histórico. Reserve uns 15 minutos a mais no relógio.</p>
        
        <div class="appt-card">
          <div class="label">Agendamento</div>
          <p class="when">${formatApptDate(data.date, data.time)} <span>às ${data.time}</span></p>
          <p class="where">Rua Francisco Ovídio, 184 · Caiçara · Belo Horizonte</p>
          
          <div class="meta-row">
            <div class="cell">
              <div class="lbl">Serviço</div>
              <div class="val">${data.serviceName}</div>
            </div>
            <div class="cell">
              <div class="lbl">Duração</div>
              <div class="val">${data.duration || '60'} min</div>
            </div>
          </div>
        </div>
        
        <hr class="rule" />
        
        <div class="instructions-title">Antes de vir</div>
        <p class="instructions-body">Lave o cabelo na <strong>noite anterior</strong> com seu shampoo de sempre. Sem creme, sem leave-in, sem prancha. Quero ler o fio do jeito que ele acorda — não o disfarce.</p>
        
        <div class="signoff">
          <div class="sig-name">Jon,</div>
          <div class="sig-meta"><div>JONATAN JUNIOR</div><div>STUDIO DO JON</div></div>
        </div>
      `;
      break;

    case 'aniversario':
      emailSubject = 'Feliz Aniversário! 🎉 - O Jon Que Cortou';
      emailContent = `
        <div class="eyebrow" style="color: #c8852a;">Dia Especial</div>
        <h1 class="display-title">Parabéns, <span>${firstName}!</span></h1>
        <p class="lead">O Studio do Jon Que Cortou te deseja um dia repleto de alegrias, muito amor e cachos impecáveis!</p>
        <p class="lead" style="margin-top:-20px;">Para comemorar, temos um mimo especial para você. Que tal agendar um momento de autocuidado?</p>
        
        <div style="text-align: center;">
          <a href="https://www.ojonquecortou.com.br/agendar" class="btn">Garantir meu horário</a>
        </div>
        
        <div class="signoff">
          <div class="sig-name">Jon,</div>
          <div class="sig-meta"><div>JONATAN JUNIOR</div><div>STUDIO DO JON</div></div>
        </div>
      `;
      break;

    case 'campanha':
      emailSubject = subject || 'Novidades do Jon Que Cortou';
      // In this case, htmlBody is fully provided from the CRM
      emailContent = htmlBody;
      break;

    case 'campanha_raw':
      emailSubject = subject || 'Novidades do Jon Que Cortou';
      emailContent = htmlBody;
      break;

    case 'lembrete_24h':
      emailSubject = subject || `Lembrete de Agendamento — ${formatApptDate(data.date, data.time)} às ${data.time}`;
      emailContent = `
        <div class="eyebrow">Lembrete</div>
        <h1 class="display-title">Te espero amanhã, <span>${firstName}.</span></h1>
        <p class="lead">Passando para lembrar do seu horário marcado amanhã no Studio. Lembre-se de reservar uns 15 minutos a mais no relógio.</p>
        
        <div class="appt-card">
          <div class="label">Agendamento</div>
          <p class="when">${formatApptDate(data.date, data.time)} <span>às ${data.time}</span></p>
          <p class="where">Rua Francisco Ovídio, 184 · Caiçara · Belo Horizonte</p>
          
          <div class="meta-row">
            <div class="cell">
              <div class="lbl">Serviço</div>
              <div class="val">${data.serviceName}</div>
            </div>
            <div class="cell">
              <div class="lbl">Duração</div>
              <div class="val">${data.duration || '60'} min</div>
            </div>
          </div>
        </div>
        
        <hr class="rule" />
        
        <div class="instructions-title">Lembrete importante</div>
        <p class="instructions-body">Lave o cabelo na <strong>noite anterior</strong> com seu shampoo de sempre. Sem creme, sem leave-in, sem prancha. Quero ler o fio do jeito que ele acorda.</p>
        
        <div class="signoff">
          <div class="sig-name">Jon,</div>
          <div class="sig-meta"><div>JONATAN JUNIOR</div><div>STUDIO DO JON</div></div>
        </div>
      `;
      break;

    case 'reativacao_5_meses':
      emailSubject = subject || `Seu cabelo tem memória, ${firstName}`;
      if (data.fallbackBody) {
        emailContent = data.fallbackBody;
        currentType = 'campanha_raw';
      } else {
        emailContent = `
          <div class="eyebrow">Saudade</div>
          <h1 class="display-title">Faz tempo, <span>${firstName}.</span></h1>
          <p class="lead">Já faz cerca de 5 meses desde o seu último corte no Studio. O cabelo ondulado, cacheado e crespo tem memória e perde a forma à medida que cresce.</p>
          <p class="lead" style="margin-top:-20px;">Que tal agendar um horário para resgatar o corte, devolver a definição e cuidar da saúde dos fios?</p>
          
          <div style="text-align: center;">
            <a href="https://www.ojonquecortou.com.br/agendar" class="btn">Quero cortar meu cabelo</a>
          </div>
          
          <div class="signoff">
            <div class="sig-name">Jon,</div>
            <div class="sig-meta"><div>JONATAN JUNIOR</div><div>STUDIO DO JON</div></div>
          </div>
        `;
      }
      break;

    default:
      return res.status(400).json({ message: 'Tipo de e-mail inválido' });
  }

  }

  // Se for uma campanha manual customizada (htmlBody fornecido já vem com tags próprias se quiser, 
  // mas aqui vamos sempre envelopar no wrapper para garantir a estética da marca, exceto se type for 'campanha_raw')
  
  const unsubLink = `<div style="text-align: center; padding: 20px; font-size: 11px; color: #888; background-color: #0a0a0a; border-top: 1px solid #222;">
    Se não deseja mais receber nossos emails, <a href="https://ojonquecortou.com.br/api/unsubscribe?email=${clientEmail}" style="color: #888; text-decoration: underline;">clique aqui para descadastrar</a>.
  </div>`;
  const unsubLinkLight = `<div style="text-align: center; padding: 20px; font-size: 11px; color: #888; background-color: #f0eee9; border-top: 1px solid #ddd;">
    Se não deseja mais receber nossos emails, <a href="https://ojonquecortou.com.br/api/unsubscribe?email=${clientEmail}" style="color: #888; text-decoration: underline;">clique aqui para descadastrar</a>.
  </div>`;

  let finalHtml = currentType === 'campanha_raw' ? emailContent : (currentType === 'campanha' ? getStandaloneWrapper(emailSubject, emailContent) : getEmailWrapper(emailSubject, emailContent));
  
  if (!finalHtml.includes('/api/unsubscribe')) {
    if (currentType === 'campanha' || currentType === 'campanha_raw') {
      finalHtml = finalHtml.replace('</body>', unsubLinkLight + '</body>');
    } else {
      finalHtml = finalHtml.replace('</body>', unsubLink + '</body>');
    }
  }

  const mailOptions = {
    from: `"O Jon Que Cortou" <${smtpFrom}>`,
    to: clientEmail,
    subject: emailSubject,
    html: finalHtml
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Erro ao enviar email SMTP:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
