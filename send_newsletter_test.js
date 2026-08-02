import fs from 'fs';
import path from 'path';

// Load MAILERSEND_API_KEY from .env.vercel.prod if process.env is empty
let apiKey = process.env.MAILERSEND_API_KEY;
if (!apiKey) {
  try {
    const envContent = fs.readFileSync('.env.vercel.prod', 'utf8');
    const match = envContent.match(/MAILERSEND_API_KEY=["']?([^"'\r\n]+)["']?/);
    if (match) {
      apiKey = match[1];
    }
  } catch (e) {
    console.error('Erro ao ler .env.vercel.prod:', e.message);
  }
}

if (!apiKey) {
  console.error('MAILERSEND_API_KEY não encontrada!');
  process.exit(1);
}

const targetEmail = process.argv[2] || 'contato@ojonquecortou.com.br';
const targetName = process.argv[3] || 'Jon';

console.log(`Iniciando disparo de teste via MailerSend para: ${targetEmail}`);

const htmlContent = fs.readFileSync('email_newsletter_finalizacao.html', 'utf8');

async function sendTest() {
  const res = await fetch('https://api.mailersend.com/v1/email', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: {
        email: 'contato@ojonquecortou.com.br',
        name: 'O Jon Que Cortou'
      },
      to: [
        {
          email: targetEmail,
          name: targetName
        }
      ],
      subject: '[TESTE] O erro na finalização que tá roubando a definição do seu cacho',
      html: htmlContent.replace(/\{\$name\|default:'tudo bem'\}/g, targetName)
    })
  });

  const responseText = await res.text();
  console.log(`Status HTTP MailerSend: ${res.status}`);
  if (res.ok) {
    console.log('✅ E-mail de teste enviado com SUCESSO via MailerSend!');
    console.log(`Response: ${responseText || '(sem corpo)'}`);
    console.log(`Header X-Message-Id: ${res.headers.get('x-message-id')}`);
  } else {
    console.error('❌ Erro no envio via MailerSend:');
    console.error(responseText);
  }
}

sendTest().catch(err => console.error('Exceção ao enviar:', err));
