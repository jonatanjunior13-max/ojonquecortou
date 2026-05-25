import nodemailer from 'nodemailer';
import { HTML_TEMPLATES, EMAIL_CSS } from './src/utils/emailTemplates.js';

const smtpFrom = process.env.SMTP_FROM || 'oi@ojonquecortou.com.br';
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT || 465;

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort == 465,
  auth: { user: smtpUser, pass: smtpPass }
});

const targetEmail = 'contato@ojonquecortou.com.br';

function getStandaloneWrapper(title, content) {
  // same wrapper from api/send-email.js
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${EMAIL_CSS}</style>
</head>
<body style="margin: 0; padding: 0; background-color: #f0eee9; -webkit-font-smoothing: antialiased; font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1A1310;">
  <div class="mail-stage" style="width: 100%; max-width: 640px; margin: 0 auto; display: flex; flex-direction: column;">
    ${content}
  </div>
</body>
</html>
`;
}

async function sendTest() {
  const tests = [
    { key: 'd1', title: 'Teste Visual - D+1' },
    { key: 'd90', title: 'Teste Visual - D+90 (Nova Copy)' },
    { key: 'aniversario', title: 'Teste Visual - Aniversário' }
  ];

  for (let t of tests) {
    let content = HTML_TEMPLATES[t.key]
      .replace(/{nome}/g, 'Jonatan')
      .replace(/{serviceName}/g, 'Corte e Secagem');
      
    let html = getStandaloneWrapper(t.title, content);
    console.log(`Enviando ${t.title}...`);
    try {
      await transporter.sendMail({
        from: `"Studio do Jon (Teste)" <${smtpFrom}>`,
        to: targetEmail,
        subject: t.title,
        html: html
      });
      console.log(`Enviado ${t.title}`);
    } catch (e) {
      console.error('Erro:', e.message);
    }
  }
}

sendTest();
