import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const {
    clientEmail,
    clientName,
    serviceName,
    date,
    time,
    duration,
    notes,
    professionalName,
    price
  } = req.body;

  // Validate the mandatory parameters
  if (!clientEmail || !clientName || !serviceName || !date || !time) {
    return res.status(400).json({ message: 'Campos obrigatórios ausentes: clientEmail, clientName, serviceName, date, time são necessários.' });
  }

  // Retrieve SMTP variables from environment
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT || '587';
  const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === '465';
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || 'agendamento@ojonquecortou.com.br';
  const smtpBcc = process.env.SMTP_BCC || '';

  // Fallback simulator if SMTP isn't configured yet
  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn('Servidor SMTP não configurado. Simulando envio de email para:', clientEmail);
    return res.status(200).json({
      success: true,
      simulated: true,
      message: 'Email de agendamento simulado com sucesso (configuração SMTP ausente no ambiente).'
    });
  }

  // Setup Nodemailer SMTP transport
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort, 10),
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  // Create the HTML template matching the brand's aesthetic colors:
  // background: #EFE5D2, surface: #FAF5E8, ink: #1A1310, accent: #B05A2E, accent-deep: #6E2F18
  const emailHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Informações do Agendamento - O Jon Que Cortou</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #EFE5D2;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: #1A1310;
        -webkit-font-smoothing: antialiased;
      }
      .wrapper {
        width: 100%;
        background-color: #EFE5D2;
        padding: 40px 0;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #FAF5E8;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 15px rgba(26, 19, 16, 0.08);
        border: 1px solid rgba(26, 19, 16, 0.08);
      }
      .header {
        padding: 30px 20px;
        text-align: center;
        border-bottom: 1px solid rgba(26, 19, 16, 0.08);
      }
      .logo-mark {
        display: inline-block;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: #1A1310;
        color: #EFE5D2;
        text-align: center;
        line-height: 40px;
        font-size: 22px;
        font-weight: bold;
        font-style: italic;
        font-family: Georgia, serif;
        margin-bottom: 10px;
      }
      .logo-text {
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: #1A1310;
      }
      .content {
        padding: 40px 30px;
      }
      .greeting {
        font-size: 16px;
        margin-bottom: 10px;
        color: #2E241E;
      }
      .status-title {
        font-size: 24px;
        font-weight: bold;
        color: #6E2F18;
        margin-top: 0;
        margin-bottom: 30px;
        letter-spacing: -0.01em;
      }
      .section-title {
        font-size: 14px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #B05A2E;
        margin-top: 0;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
      }
      .info-box {
        background-color: #F5EDDB;
        border-radius: 6px;
        padding: 20px;
        margin-bottom: 30px;
        border: 1px solid rgba(26, 19, 16, 0.05);
      }
      .info-table {
        width: 100%;
        border-collapse: collapse;
      }
      .info-table td {
        padding: 6px 0;
        font-size: 15px;
        vertical-align: top;
      }
      .info-label {
        font-weight: 600;
        color: #6B5A4B;
        width: 130px;
      }
      .info-value {
        color: #1A1310;
      }
      .btn {
        display: block;
        text-align: center;
        background-color: #1A1310;
        color: #EFE5D2 !important;
        text-decoration: none;
        padding: 14px 24px;
        border-radius: 30px;
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        margin: 30px 0;
        transition: background-color 0.2s ease;
      }
      .btn:hover {
        background-color: #6E2F18;
      }
      .establishment-title {
        font-size: 16px;
        font-weight: bold;
        color: #1A1310;
        margin-top: 0;
        margin-bottom: 6px;
      }
      .establishment-text {
        font-size: 14px;
        color: #6B5A4B;
        line-height: 1.5;
        margin: 0;
      }
      .establishment-link {
        color: #B05A2E;
        text-decoration: none;
        font-weight: 500;
      }
      .footer {
        padding: 30px 20px;
        background-color: #F5EDDB;
        border-top: 1px solid rgba(26, 19, 16, 0.08);
        text-align: center;
        font-size: 12px;
        color: #8A7866;
        line-height: 1.6;
      }
      .important-info {
        background-color: rgba(176, 90, 46, 0.06);
        border-left: 3px solid #B05A2E;
        padding: 15px;
        border-radius: 0 4px 4px 0;
        font-size: 13px;
        color: #6B5A4B;
        line-height: 1.5;
        margin-top: 25px;
      }
      .important-info ul {
        margin: 5px 0 0 0;
        padding-left: 20px;
      }
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
          <div class="greeting">Olá <strong>${clientName}</strong>,</div>
          <div class="status-title">Agendamento Confirmado!</div>
          
          <div class="section-title">
            <span style="margin-right: 8px;">📋</span> Resumo do Agendamento
          </div>
          <div class="info-box">
            <table class="info-table">
              <tr>
                <td class="info-label">Estabelecimento:</td>
                <td class="info-value">O Jon Que Cortou - Especialista em Cachos</td>
              </tr>
              <tr>
                <td class="info-label">Serviço:</td>
                <td class="info-value">${serviceName}</td>
              </tr>
              <tr>
                <td class="info-label">Profissional:</td>
                <td class="info-value">${professionalName || 'Jon'}</td>
              </tr>
              <tr>
                <td class="info-label">Data e Hora:</td>
                <td class="info-value">${date} às ${time}</td>
              </tr>
              <tr>
                <td class="info-label">Duração:</td>
                <td class="info-value">${duration || '60'} min</td>
              </tr>
              ${price ? `
              <tr>
                <td class="info-label">Valor:</td>
                <td class="info-value">R$ ${parseFloat(price).toFixed(2)}</td>
              </tr>
              ` : ''}
              ${notes ? `
              <tr>
                <td class="info-label">Observações:</td>
                <td class="info-value">${notes}</td>
              </tr>
              ` : ''}
            </table>
          </div>

          <a href="https://www.ojonquecortou.com.br/agendar" class="btn">Acompanhar meu agendamento</a>

          <div class="section-title">
            <span style="margin-right: 8px;">📍</span> Informações do Estabelecimento
          </div>
          <div class="info-box" style="margin-bottom: 0;">
            <div class="establishment-title">O Jon Que Cortou - Especialista em Cachos</div>
            <p class="establishment-text">
              Rua Francisco Ovidio, 184, Caiçara<br>
              Belo Horizonte, MG - 30770-040<br>
              Telefone: <a href="tel:3135866673" class="establishment-link">(31) 3586-6673</a><br>
              <a href="https://www.google.com/maps/search/?api=1&query=O+Jon+que+Cortou+-+Especialista+em+Cachos" target="_blank" class="establishment-link" style="display: inline-block; margin-top: 8px;">Ver no Google Maps →</a>
            </p>
          </div>

          <div class="important-info">
            <strong>Informações importantes:</strong>
            <ul>
              <li>Este é um e-mail automático, por favor, não responda diretamente a esta mensagem.</li>
              <li>Caso precise cancelar ou remarcar, pedimos a gentileza de fazê-lo com pelo menos 24h de antecedência pelo WhatsApp: (31) 3586-6673.</li>
              <li>Recomendamos chegar com 10 minutos de antecedência para garantir o seu horário.</li>
            </ul>
          </div>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} O Jon Que Cortou. Todos os direitos reservados.<br>
          Studio especializado em cabelos cacheados e crespos em Belo Horizonte.<br>
          Caiçara · BH
        </div>
      </div>
    </div>
  </body>
  </html>
  `;

  // Define email options
  const mailOptions = {
    from: `"O Jon Que Cortou" <${smtpFrom}>`,
    to: clientEmail,
    subject: `O Jon Que Cortou - Informações do Agendamento`,
    html: emailHtml
  };

  // If a BCC copy email is configured (for the barber/owner), add it to BCC
  if (smtpBcc) {
    mailOptions.bcc = smtpBcc;
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email enviado com sucesso:', info.messageId);
    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Erro ao enviar email via SMTP:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
