import nodemailer from 'nodemailer';
import { EMAIL_CSS } from '../src/utils/emailTemplates.js';

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, getDoc, addDoc } from 'firebase/firestore';

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
      body { margin: 0; padding: 0; background-color: #EFE5D2; font-family: 'Manrope', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1A1310; -webkit-font-smoothing: antialiased; }
      .wrapper { width: 100%; background-color: #EFE5D2; padding: 40px 0; box-sizing: border-box; }
      .container { max-width: 600px; margin: 0 auto; background-color: #FAF5E8; border-radius: 8px; overflow: hidden; border: 1px solid rgba(26, 19, 16, 0.1); box-shadow: 0 4px 20px rgba(26, 19, 16, 0.08); }
      .header { padding: 30px 40px 20px 40px; text-align: left; border-bottom: 1px solid rgba(26, 19, 16, 0.08); }
      .logo-mark { display: inline-block; width: 36px; height: 36px; border-radius: 50%; background-color: #1A1310; color: #FAF5E8; text-align: center; line-height: 36px; font-size: 20px; font-weight: bold; font-style: italic; font-family: Georgia, serif; margin-bottom: 10px; }
      .logo-text { font-size: 15px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #1A1310; margin-left: 10px; display: inline-block; vertical-align: middle; }
      .tag { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #C97B49; font-weight: 600; }
      
      .content { padding: 40px; }
      
      .eyebrow { font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #C97B49; font-weight: 600; margin-bottom: 10px; }
      .display-title { font-size: 32px; font-weight: 400; color: #1A1310; margin-top: 0; margin-bottom: 20px; font-family: Georgia, serif; }
      .display-title span { font-style: italic; color: #C97B49; }
      
      .lead { font-size: 16px; line-height: 1.6; color: #2E241E; margin-bottom: 30px; }
      
      .appt-card { background-color: #F5EDDB; border: 1px solid rgba(26, 19, 16, 0.12); border-radius: 6px; padding: 20px; margin-bottom: 30px; }
      .appt-card .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #6B5A4B; margin-bottom: 12px; font-weight: 600; }
      .appt-card .when { font-size: 18px; font-weight: 600; color: #1A1310; margin: 0 0 6px 0; }
      .appt-card .when span { color: #C97B49; font-style: italic; font-weight: 400; font-family: Georgia, serif; }
      .appt-card .where { font-size: 13px; color: #6B5A4B; margin: 0 0 16px 0; }
      
      .meta-row { display: table; width: 100%; border-top: 1px solid rgba(26, 19, 16, 0.08); padding-top: 14px; margin-top: 14px; }
      .cell { display: table-cell; width: 50%; }
      .lbl { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #8A7866; margin-bottom: 4px; font-weight: 600; }
      .val { font-size: 14px; color: #1A1310; font-weight: 600; }
      
      .rule { border: 0; border-top: 1px solid rgba(26, 19, 16, 0.08); margin: 30px 0; }
      
      .btn { display: inline-block; text-align: center; border: 2px solid #C97B49; color: #C97B49 !important; text-decoration: none; padding: 10px 20px; border-radius: 4px; font-size: 13px; font-weight: bold; margin: 30px 0; transition: all 0.2s ease; }
      
      .instructions-title { font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; color: #C97B49; font-weight: 600; margin-bottom: 8px; }
      .instructions-body { font-size: 15px; line-height: 1.6; color: #2E241E; }
      .instructions-body strong { color: #1A1310; }
      
      .signoff { margin-top: 35px; border-top: 1px solid rgba(26, 19, 16, 0.08); padding-top: 20px; }
      .signoff .sig-name { font-size: 20px; font-family: Georgia, serif; font-style: italic; color: #1A1310; margin-bottom: 4px; }
      .signoff .sig-meta { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #6B5A4B; line-height: 1.5; }
      
      .footer { padding: 25px 40px; background-color: #FAF5E8; border-top: 1px solid rgba(26, 19, 16, 0.08); text-align: center; }
      .footer-brand { font-size: 14px; font-weight: 600; color: #1A1310; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 15px; }
      .footer-brand span { font-style: italic; font-weight: 400; color: #C97B49; font-family: Georgia, serif; text-transform: none; letter-spacing: normal; }
      .addr { font-size: 12px; color: #6B5A4B; line-height: 1.6; margin-bottom: 25px; }
      .legal { font-size: 11px; color: #8A7866; }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="container">
        <div class="header">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div class="logo-mark" style="display: inline-block; vertical-align: middle;">J</div>
              <div class="logo-text" style="display: inline-block; vertical-align: middle; margin-left: 8px;">O Jon Que Cortou</div>
            </div>
            <div class="tag">Mensagem Automática</div>
          </div>
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

async function sendAdminNotification(type, data, transporter, smtpFrom) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER || 'jon@studio.com';
  let subject = '';
  let body = '';
  const formattedDate = data.date ? (data.date.includes('-') ? data.date.split('-').reverse().join('/') : data.date) : '';
  const clientName = data.clientName || 'Cliente';
  const clientEmail = data.clientEmail || 'Não informado';
  const clientPhone = data.clientPhone || 'Não informado';
  const serviceName = data.serviceName || 'Serviço';
  const time = data.time || '';

  if (type === 'solicitacao_recebida') {
    subject = `[NOVO AGENDAMENTO] Solicitação de ${clientName}`;
    body = `
      <div class="eyebrow">Aviso de Agendamento</div>
      <h1 class="display-title">Nova Solicitação</h1>
      <p class="lead">Olá Jon, uma nova solicitação de agendamento online foi recebida.</p>
      
      <div class="appt-card">
        <div class="label">Detalhes da solicitação</div>
        <p class="when">${formattedDate} <span>às ${time}</span></p>
        <div class="meta-row" style="margin-top:20px;">
          <div class="cell">
            <div class="lbl">Cliente</div>
            <div class="val">${clientName}</div>
          </div>
          <div class="cell">
            <div class="lbl">E-mail</div>
            <div class="val">${clientEmail}</div>
          </div>
        </div>
        <div class="meta-row" style="margin-top:10px;">
          <div class="cell">
            <div class="lbl">Serviço</div>
            <div class="val">${serviceName}</div>
          </div>
          <div class="cell">
            <div class="lbl">Telefone</div>
            <div class="val">${clientPhone}</div>
          </div>
        </div>
      </div>
    `;
  } else if (type === 'horario_confirmado') {
    subject = `[AGENDAMENTO CONFIRMADO] Horário marcado para ${clientName}`;
    body = `
      <div class="eyebrow">Aviso de Confirmação</div>
      <h1 class="display-title">Agendamento Confirmado</h1>
      <p class="lead">Olá Jon, um agendamento foi confirmado ou criado no sistema.</p>
      
      <div class="appt-card">
        <div class="label">Agendamento</div>
        <p class="when">${formattedDate} <span>às ${time}</span></p>
        <div class="meta-row" style="margin-top:20px;">
          <div class="cell">
            <div class="lbl">Cliente</div>
            <div class="val">${clientName}</div>
          </div>
          <div class="cell">
            <div class="lbl">Serviço</div>
            <div class="val">${serviceName}</div>
          </div>
        </div>
      </div>
    `;
  } else if (type === 'agendamento_cancelado') {
    const cancelledByText = data.cancelledBy === 'client' ? 'pelo cliente' : 'pelo administrador';
    subject = `[AGENDAMENTO CANCELADO] Cancelamento de ${clientName}`;
    body = `
      <div class="eyebrow" style="color: #9e2a2b;">Aviso de Cancelamento</div>
      <h1 class="display-title" style="color: #ffffff;">Horário Cancelado</h1>
      <p class="lead">Olá Jon, um agendamento foi cancelado no sistema ${cancelledByText}.</p>
      
      <div class="appt-card" style="border-color: #9e2a2b;">
        <div class="label" style="color: #9e2a2b;">Agendamento Cancelado</div>
        <p class="when" style="color: #ffffff;">${formattedDate} <span>às ${time}</span></p>
        <div class="meta-row" style="margin-top:20px;">
          <div class="cell">
            <div class="lbl">Cliente</div>
            <div class="val">${clientName}</div>
          </div>
          <div class="cell">
            <div class="lbl">Serviço</div>
            <div class="val">${serviceName}</div>
          </div>
        </div>
      </div>
    `;
  } else {
    return; // No admin notifications for other generic types
  }

  const finalHtml = getEmailWrapper(subject, body);
  const mailOptions = {
    from: `"O Jon Que Cortou" <${smtpFrom}>`,
    to: adminEmail,
    subject: subject,
    html: finalHtml
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email de notificação enviado para o administrador: ${adminEmail}`);
    if (db) {
      try {
        await addDoc(collection(db, 'admin_notifications'), {
          timestamp: new Date().toISOString(),
          type: type,
          subject: subject,
          clientName: clientName,
          clientEmail: clientEmail,
          clientPhone: clientPhone,
          serviceName: serviceName,
          date: formattedDate,
          time: time,
          htmlBody: finalHtml
        });
        console.log('Notificação do admin registrada no Firestore');
      } catch (dbErr) {
        console.error('Falha ao salvar log de notificação no banco:', dbErr);
      }
    }
  } catch (err) {
    console.error('Falha ao enviar e-mail de notificação para o admin:', err);
  }
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
  const smtpFrom = process.env.SMTP_FROM || 'contato@ojonquecortou.com.br';

  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER || 'contato@ojonquecortou.com.br';
  
  // Se SMTP_HOST e USER estão configurados, assume que deve enviar e-mails reais
  const hasSmtpConfig = Boolean(smtpHost && smtpUser && smtpPass);
  const sendReal = process.env.SEND_REAL_EMAILS === 'false' ? false : hasSmtpConfig;

  if (!sendReal) {
    console.log('Simulação de envio ativa (SMTP não configurado ou desativado). Para:', clientEmail);
    if (type === 'solicitacao_recebida' || type === 'horario_confirmado' || type === 'agendamento_cancelado') {
      console.log('Simulação de notificação para o administrador:', adminEmail, 'Tipo:', type);
    }
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
      .replace(/{nome}/gi, firstName)
      .replace(/{data}/gi, formattedDate)
      .replace(/{horario}/gi, formattedTime)
      .replace(/{hora}/gi, formattedTime)
      .replace(/{servico}/gi, formattedService)
      .replace(/{email}/gi, encodeURIComponent(clientEmail));
      
    emailSubject = subject || (
      type === 'solicitacao_recebida' ? 'Solicitação de Agendamento Recebida - O Jon Que Cortou' :
      type === 'horario_confirmado' ? `Está marcado — ${formattedDate} às ${formattedTime}` :
      type === 'lembrete_24h' ? 'Lembrete de Agendamento - O Jon Que Cortou' :
      type === 'reativacao_5_meses' ? 'Seu cabelo tem memória, {nome}'.replace(/{nome}/gi, firstName) :
      type === 'agendamento_cancelado' ? 'Confirmação de Cancelamento - O Jon Que Cortou' :
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

    case 'agendamento_cancelado':
      emailSubject = 'Confirmação de Cancelamento - O Jon Que Cortou';
      emailContent = `
        <div class="eyebrow" style="color: #c8852a;">Cancelamento</div>
        <h1 class="display-title">Agendamento Cancelado, <span>${firstName}.</span></h1>
        <p class="lead">Confirmamos o cancelamento do seu agendamento no Studio do Jon.</p>
        
        <div class="appt-card" style="border-color: #333;">
          <div class="label">Agendamento Cancelado</div>
          <p class="when">${formatApptDate(data.date, data.time)} <span>às ${data.time}</span></p>
          <div class="meta-row" style="margin-top:20px;">
            <div class="cell">
              <div class="lbl">Serviço</div>
              <div class="val">${data.serviceName}</div>
            </div>
          </div>
        </div>
        
        <p class="lead">Se foi um imprevisto e você deseja escolher outro momento, sinta-se à vontade para agendar um novo horário.</p>
        
        <div style="text-align: center;">
          <a href="https://www.ojonquecortou.com.br/agendar" class="btn">Agendar novo horário</a>
        </div>
        
        <div class="signoff">
          <div class="sig-name">Jon,</div>
          <div class="sig-meta"><div>JONATAN JUNIOR</div><div>STUDIO DO JON</div></div>
        </div>
      `;
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
    
    // Enviar notificação para o administrador de forma assíncrona
    if (type === 'solicitacao_recebida' || type === 'horario_confirmado' || type === 'agendamento_cancelado') {
      sendAdminNotification(type, data, transporter, smtpFrom).catch(err => {
        console.error('Erro de background ao enviar notificação ao admin:', err);
      });
    }

    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Erro ao enviar email SMTP:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
