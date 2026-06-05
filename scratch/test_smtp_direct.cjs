const fs = require('fs');
const nodemailer = require('nodemailer');

const envPath = 'C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/ojonquecortou/.env.production';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/);
  if (m) {
    let val = (m[2] || '').trim().replace(/\r$/, '');
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[m[1]] = val;
  }
});

console.log('Credentials found in env:');
console.log('Host:', env.SMTP_HOST);
console.log('Port:', env.SMTP_PORT);
console.log('User:', env.SMTP_USER);
console.log('From:', env.SMTP_FROM);

async function testSMTP() {
  const isPort465 = env.SMTP_PORT === '465';
  console.log(`\nTesting SMTP connection with secure=${isPort465}...`);
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: parseInt(env.SMTP_PORT, 10),
    secure: isPort465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Verifying connection...');
    await transporter.verify();
    console.log('✅ SMTP Connection verified successfully!');

    console.log('Sending test email to jonatanjunior13@gmail.com...');
    const info = await transporter.sendMail({
      from: `"O Jon Que Cortou (SMTP Test)" <${env.SMTP_FROM}>`,
      to: 'jonatanjunior13@gmail.com',
      subject: 'Teste de SMTP Direto',
      text: 'Olá! Se você recebeu este email, significa que a conexão SMTP do Gmail com a senha de aplicativo está funcionando perfeitamente do script local.',
      html: '<p>Olá! Se você recebeu este email, significa que a conexão SMTP do Gmail com a senha de aplicativo está funcionando perfeitamente do script local.</p>'
    });
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (err) {
    console.error('✗ Connection or sending failed:', err);
  }
}

testSMTP().then(() => process.exit(0));
