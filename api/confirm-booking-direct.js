import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// Simple date formatter to display nicely
function getFormattedDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return `${parseInt(day, 10)} de ${months[parseInt(month, 10) - 1]} de ${year}`;
}

function renderHtmlResponse(title, icon, message, bookingDetails = null, isError = false) {
  return `
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Studio do Jon</title>
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&family=Outfit:wght@400;600&display=swap" rel="stylesheet">
    <style>
      body {
        margin: 0;
        padding: 0;
        min-height: 100vh;
        background-color: #EFE5D2;
        font-family: 'Manrope', sans-serif;
        color: #1A1310;
        display: flex;
        align-items: center;
        justify-content: center;
        -webkit-font-smoothing: antialiased;
      }
      .card {
        background-color: #FAF5E8;
        border: 1px solid rgba(26, 19, 16, 0.1);
        border-radius: 12px;
        padding: 40px 30px;
        width: 100%;
        max-width: 480px;
        box-sizing: border-box;
        box-shadow: 0 10px 30px rgba(26, 19, 16, 0.08);
        text-align: center;
        margin: 20px;
      }
      .icon-container {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        background-color: ${isError ? 'rgba(239, 93, 93, 0.1)' : 'rgba(201, 123, 73, 0.1)'};
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 24px auto;
        color: ${isError ? '#ef5d5d' : '#C97B49'};
      }
      .icon-container svg {
        width: 36px;
        height: 36px;
        fill: none;
        stroke: currentColor;
        stroke-width: 2.5;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      h1 {
        font-family: 'Outfit', sans-serif;
        font-size: 26px;
        font-weight: 600;
        margin: 0 0 12px 0;
        color: #1A1310;
      }
      p.description {
        font-size: 15px;
        line-height: 1.6;
        color: #6B5A4B;
        margin: 0 0 30px 0;
      }
      .details-box {
        background-color: #F5EDDB;
        border: 1px solid rgba(26, 19, 16, 0.08);
        border-radius: 8px;
        padding: 20px;
        text-align: left;
        margin-bottom: 30px;
      }
      .details-title {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: #8A7866;
        margin-bottom: 12px;
        font-weight: 700;
        border-bottom: 1px solid rgba(26, 19, 16, 0.06);
        padding-bottom: 6px;
      }
      .details-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 14px;
      }
      .details-row:last-child {
        margin-bottom: 0;
      }
      .details-label {
        color: #6B5A4B;
        font-weight: 600;
      }
      .details-value {
        color: #1A1310;
        font-weight: 700;
      }
      .btn {
        display: inline-block;
        background-color: #1A1310;
        color: #FAF5E8 !important;
        text-decoration: none;
        font-weight: 600;
        font-size: 14px;
        padding: 12px 28px;
        border-radius: 6px;
        transition: all 0.2s ease;
        border: 1px solid #1A1310;
        cursor: pointer;
      }
      .btn:hover {
        background-color: transparent;
        color: #1A1310 !important;
      }
      .footer-logo {
        margin-top: 30px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        color: rgba(26, 19, 16, 0.4);
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="icon-container">
        ${icon}
      </div>
      <h1>${title}</h1>
      <p class="description">${message}</p>
      
      ${bookingDetails ? `
        <div class="details-box">
          <div class="details-title">Resumo do Agendamento</div>
          <div class="details-row">
            <span class="details-label">Cliente:</span>
            <span class="details-value">${bookingDetails.clientName}</span>
          </div>
          <div class="details-row">
            <span class="details-label">Serviço:</span>
            <span class="details-value">${bookingDetails.serviceName}</span>
          </div>
          <div class="details-row">
            <span class="details-label">Data:</span>
            <span class="details-value">${getFormattedDate(bookingDetails.date)}</span>
          </div>
          <div class="details-row">
            <span class="details-label">Horário:</span>
            <span class="details-value">${bookingDetails.time}</span>
          </div>
        </div>
      ` : ''}
      
      <a href="https://ojonquecortou.com.br" class="btn">Ir para o Site</a>
      
      <div class="footer-logo">Studio do Jon</div>
    </div>
  </body>
  </html>
  `;
}

export default async function handler(req, res) {
  const checkIcon = `<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  const xIcon = `<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
  const alertIcon = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

  try {
    const { id } = req.query;

    if (!id) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(400).send(renderHtmlResponse(
        'Solicitação Inválida',
        xIcon,
        'O link acessado é inválido porque não possui o identificador do agendamento.',
        null,
        true
      ));
    }

    const bookingRef = doc(db, 'bookings', id);
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(404).send(renderHtmlResponse(
        'Agendamento não Encontrado',
        alertIcon,
        'Não encontramos nenhum agendamento com o código informado. Por favor, verifique se o link está correto.',
        null,
        true
      ));
    }

    const bookingData = bookingSnap.data();
    const serviceName = bookingData.serviceName || bookingData.service?.name || 'Serviço';

    if (bookingData.status === 'confirmado') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(renderHtmlResponse(
        'Já Confirmado',
        checkIcon,
        'Este horário já foi confirmado anteriormente e está ativo no sistema.',
        {
          clientName: bookingData.clientName,
          serviceName,
          date: bookingData.date,
          time: bookingData.time
        }
      ));
    }

    if (bookingData.status === 'cancelado') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(renderHtmlResponse(
        'Horário Cancelado',
        xIcon,
        'Este agendamento foi cancelado e não pode ser confirmado.',
        {
          clientName: bookingData.clientName,
          serviceName,
          date: bookingData.date,
          time: bookingData.time
        },
        true
      ));
    }

    // Update status in Firestore
    await updateDoc(bookingRef, {
      status: 'confirmado',
      confirmedVia: 'direct_whatsapp_link',
      confirmedAt: new Date().toISOString()
    });

    // Notify client by email calling /api/send-email
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const hostUrl = `${protocol}://${host}`;

    try {
      await fetch(`${hostUrl}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'horario_confirmado',
          clientEmail: bookingData.clientEmail,
          clientName: bookingData.clientName,
          serviceName,
          date: bookingData.date,
          time: bookingData.time,
          duration: bookingData.duration || bookingData.service?.duration || 60,
          price: bookingData.price || bookingData.service?.price || null
        })
      });
      console.log(`E-mail de confirmação disparado para o cliente ${bookingData.clientEmail}`);
    } catch (emailErr) {
      console.error('Erro ao disparar e-mail de confirmação:', emailErr);
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(renderHtmlResponse(
      'Confirmado com Sucesso',
      checkIcon,
      'O agendamento foi confirmado. O cliente receberá um e-mail de confirmação com as instruções de preparação para o corte.',
      {
        clientName: bookingData.clientName,
        serviceName,
        date: bookingData.date,
        time: bookingData.time
      }
    ));

  } catch (error) {
    console.error('Erro ao confirmar agendamento:', error);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(500).send(renderHtmlResponse(
      'Erro Interno',
      xIcon,
      'Ocorreu um erro ao processar a confirmação do agendamento. Por favor, tente novamente mais tarde.',
      null,
      true
    ));
  }
}
