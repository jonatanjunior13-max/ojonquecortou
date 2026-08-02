import fs from 'fs';
import nodemailer from 'nodemailer';

const targetEmail = process.argv[2] || 'contato@ojonquecortou.com.br';
const targetName = process.argv[3] || 'Jon';

const transporter = nodemailer.createTransport({
  host: 'smtp.titan.email',
  port: 465,
  secure: true,
  auth: {
    user: 'contato@ojonquecortou.com.br',
    pass: '7956#Jon!'
  }
});

const htmlContent = fs.readFileSync('email_newsletter_finalizacao.html', 'utf8')
  .replace(/\{\$name\|default:'tudo bem'\}/g, targetName);

async function sendSmtp() {
  console.log(`Enviando via Titan SMTP para: ${targetEmail}`);
  const info = await transporter.sendMail({
    from: '"O Jon Que Cortou" <contato@ojonquecortou.com.br>',
    to: targetEmail,
    subject: '[TESTE DIRETO SMTP] O erro na finalização que tá roubando a definição do seu cacho',
    html: htmlContent
  });

  console.log('✅ E-mail enviado com sucesso via Titan SMTP!');
  console.log('Message ID:', info.messageId);
}

sendSmtp().catch(err => console.error('Erro no SMTP:', err.message));
