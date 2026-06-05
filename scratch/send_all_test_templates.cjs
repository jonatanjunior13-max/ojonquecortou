const fs = require('fs');
const path = require('path');
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

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(env.SMTP_PORT || '465', 10),
  secure: env.SMTP_PORT === '465',
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

const clientEmail = 'jonatanjunior13@gmail.com';
const clientName = 'Jonatan';

const SUBJECTS = {
  d1:  'Jonatan, como tá o fio hoje?',
  d7:  'A semana mais importante do seu cabelo (e quase ninguém fala sobre isso)',
  d21: '3 semanas de corte novo. Agora vem a parte boa.',
  d35: 'Um mês de corte (e o segredo para ele durar mais)',
  d60: 'Falta 1 mês para a sua janela de manutenção',
  d90: 'Últimos dias do valor especial de manutenção, Jonatan',
  aniversario: 'Seu aniversário tá chegando, Jonatan'
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
  console.log('🧪 Loading email templates dynamically...');
  
  // Dynamically import the ESM module from CJS
  const templatesPath = path.resolve('C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/src/utils/emailTemplates.js');
  const { HTML_TEMPLATES } = await import(`file://${templatesPath}`);
  
  const targetTemplates = ['d1', 'd7', 'd21', 'd35', 'd60', 'd90', 'aniversario'];
  
  console.log('Sending templates one by one with a 4s interval to prevent rate limit blocks...');
  
  for (const key of targetTemplates) {
    const rawHtml = HTML_TEMPLATES[key];
    if (!rawHtml) {
      console.warn(`✗ Template not found: ${key}`);
      continue;
    }
    
    // Replace name placeholders
    const html = rawHtml
      .replace(/{nome}/gi, clientName)
      .replace(/\[Nome\]/gi, clientName);
      
    const subject = `[TESTE DESIGN ${key.toUpperCase()}] ${SUBJECTS[key]}`;
    
    console.log(`📧 Sending ${key.toUpperCase()} test email...`);
    try {
      const info = await transporter.sendMail({
        from: `"O Jon Que Cortou" <${env.SMTP_FROM || env.SMTP_USER}>`,
        to: clientEmail,
        subject,
        html
      });
      console.log(`  ✅ Sent! Message ID: ${info.messageId}`);
    } catch (err) {
      console.error(`  ✗ Failed to send ${key.toUpperCase()}:`, err.message);
    }
    
    // Wait between emails
    await sleep(4000);
  }
  
  console.log('\nAll 7 test emails have been processed! ✨');
  process.exit(0);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
