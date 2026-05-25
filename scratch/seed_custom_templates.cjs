const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc } = require('firebase/firestore');

// Load environment variables manually from .env file
const envPath = path.join(__dirname, '../.env');
const envConfig = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const parts = line.trim().split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      envConfig[key] = val;
    }
  });
}

const firebaseConfig = {
  apiKey: envConfig.VITE_FIREBASE_API_KEY,
  authDomain: envConfig.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: envConfig.VITE_FIREBASE_PROJECT_ID,
  storageBucket: envConfig.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envConfig.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: envConfig.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const buildWrapper = (title, category, content) => {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #EFE5D2;
      font-family: 'Manrope', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1A1310;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #EFE5D2;
      padding: 40px 0;
      box-sizing: border-box;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #FAF5E8;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(26, 19, 16, 0.08);
      border: 1px solid rgba(26, 19, 16, 0.1);
    }
    .header {
      padding: 30px 40px 20px 40px;
      border-bottom: 1px solid rgba(26, 19, 16, 0.08);
    }
    .brand-container {
      margin-bottom: 8px;
    }
    .brand-name {
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #1A1310;
      font-family: 'Manrope', sans-serif;
    }
    .category-tag {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #C97B49;
      font-weight: 600;
    }
    .content {
      padding: 40px;
    }
    .eyebrow {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #C97B49;
      font-weight: 600;
      margin-bottom: 10px;
    }
    .display-title {
      font-size: 32px;
      line-height: 1.2;
      font-weight: 400;
      color: #1A1310;
      margin-top: 0;
      margin-bottom: 20px;
      font-family: 'DM Serif Display', 'Instrument Serif', Georgia, serif;
    }
    .display-title span {
      font-style: italic;
    }
    .lead {
      font-size: 16px;
      line-height: 1.6;
      color: #2E241E;
      margin-bottom: 25px;
      margin-top: 0;
    }
    .card {
      background-color: #F5EDDB;
      border: 1px solid rgba(26, 19, 16, 0.12);
      border-radius: 6px;
      padding: 20px;
      margin-bottom: 25px;
    }
    .card-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #6B5A4B;
      margin-bottom: 12px;
      font-weight: 600;
    }
    .card-when {
      font-size: 18px;
      font-weight: 600;
      color: #1A1310;
      margin: 0 0 6px 0;
    }
    .card-when span {
      color: #C97B49;
      font-style: italic;
      font-weight: 400;
      font-family: 'Instrument Serif', Georgia, serif;
    }
    .card-where {
      font-size: 13px;
      color: #6B5A4B;
      margin: 0 0 16px 0;
      line-height: 1.4;
    }
    .card-meta {
      border-top: 1px solid rgba(26, 19, 16, 0.08);
      padding-top: 14px;
      margin-top: 14px;
    }
    .meta-row {
      display: table;
      width: 100%;
    }
    .card-cell {
      display: table-cell;
      width: 50%;
      vertical-align: top;
    }
    .meta-lbl {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #8A7866;
      margin-bottom: 4px;
      font-weight: 600;
    }
    .meta-val {
      font-size: 14px;
      color: #1A1310;
      font-weight: 600;
    }
    .btn-row {
      margin: 25px 0;
      text-align: center;
    }
    .btn {
      display: inline-block;
      text-align: center;
      border: 2px solid #C97B49;
      color: #C97B49 !important;
      text-decoration: none;
      padding: 10px 20px;
      border-radius: 4px;
      font-size: 13px;
      font-weight: bold;
      margin: 5px;
    }
    .section-title {
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #C97B49;
      font-weight: 600;
      margin-bottom: 8px;
      margin-top: 25px;
    }
    .section-body {
      font-size: 15px;
      line-height: 1.6;
      color: #2E241E;
      margin-bottom: 15px;
      margin-top: 0;
    }
    .timeline {
      margin: 25px 0;
      border-left: 1px solid rgba(26, 19, 16, 0.12);
      padding-left: 20px;
    }
    .timeline-item {
      margin-bottom: 15px;
      position: relative;
    }
    .timeline-dot {
      position: absolute;
      left: -25px;
      top: 5px;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background-color: #C97B49;
      border: 2px solid #FAF5E8;
    }
    .timeline-num {
      font-size: 10px;
      color: #C97B49;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }
    .timeline-title {
      font-size: 14px;
      font-weight: 600;
      color: #1A1310;
      margin: 2px 0;
    }
    .signoff {
      margin-top: 35px;
      border-top: 1px solid rgba(26, 19, 16, 0.08);
      padding-top: 20px;
    }
    .sig-name {
      font-size: 20px;
      font-family: 'Instrument Serif', Georgia, serif;
      font-style: italic;
      color: #1A1310;
      margin-bottom: 4px;
    }
    .sig-meta {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #6B5A4B;
    }
    .footer {
      padding: 25px 40px;
      background-color: #FAF5E8;
      border-top: 1px solid rgba(26, 19, 16, 0.08);
      text-align: center;
      font-size: 12px;
      color: #6B5A4B;
      line-height: 1.6;
    }
    .footer a {
      color: #6B5A4B;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="brand-container">
          <span class="brand-name">O Jon Que Cortou</span>
        </div>
        <div class="category-tag">${category}</div>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <strong>Studio do Jon</strong> · Corte com leitura.<br>
        Rua Francisco Ovídio, 184 · Caiçara · Belo Horizonte · MG<br>
        Quarta a Sábado · 9h às 19h
      </div>
    </div>
  </div>
</body>
</html>`;
};

async function run() {
  console.log("Generating clean custom email templates from scratch...");

  // 1. solicitacao_recebida (Pedido em Espera)
  const content00 = `
    <span class="eyebrow">Em Análise</span>
    <h1 class="display-title">Recebemos seu pedido, <span>{nome}.</span></h1>
    <p class="lead">
      Anotei seu pedido por aqui. Antes de confirmar, vou dar uma olhada na agenda para garantir que esse horário está livre e sem conflitos. Te aviso assim que confirmar.
    </p>
    
    <div class="card">
      <div class="card-title">Horário solicitado a confirmar</div>
      <h2 class="card-when">{data} <span>às {horario}</span></h2>
      <div class="card-where">Rua Francisco Ovídio, 184 · Caiçara · Belo Horizonte</div>
      <div class="card-meta">
        <div class="meta-row">
          <div class="card-cell">
            <div class="meta-lbl">Serviço</div>
            <div class="meta-val">{servico}</div>
          </div>
          <div class="card-cell">
            <div class="meta-lbl">Duração Estimada</div>
            <div class="meta-val">2h00</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="section-title">O que acontece agora</div>
    <div class="timeline">
      <div class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-num">01 · agora</div>
        <div class="timeline-title">Você pediu o horário</div>
      </div>
      <div class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-num">02 · hoje</div>
        <div class="timeline-title">Eu confirmo em até 6h úteis</div>
      </div>
      <div class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-num">03 · depois</div>
        <div class="timeline-title">Te mando o e-mail de confirmação</div>
      </div>
    </div>
    
    <div class="section-title">Importante</div>
    <p class="section-body">
      Esse e-mail não garante o horário ainda. Só considere marcado quando chegar o próximo e-mail com a confirmação. Se precisar mudar algo antes ou se for urgente, me chama direto no WhatsApp.
    </p>
    
    <div class="btn-row">
      <a href="https://wa.me/553135866673" class="btn">Falar com o Jon no WhatsApp</a>
      <a href="https://www.ojonquecortou.com.br/agendar" class="btn">Sugerir outro horário</a>
    </div>
    
    <p class="section-body" style="font-size: 13px; color: #6B5A4B; font-style: italic;">
      P.S. Se eu não te confirmar em 6 horas úteis, pode me cobrar no WhatsApp — às vezes a notificação sumária some no meio do dia.
    </p>
    
    <div class="signoff">
      <div class="sig-name">Jon,</div>
      <div class="sig-meta">JONATAN JUNIOR · STUDIO DO JON</div>
    </div>
  `;
  const html00 = buildWrapper("Pedido Recebido", "Pedido · Aguardando", content00);

  // 2. horario_confirmado (Confirmação de Horário)
  const content01 = `
    <span class="eyebrow">Confirmado</span>
    <h1 class="display-title">Te espero, <span>{nome}.</span></h1>
    <p class="lead">
      Seu horário no Studio está confirmado. Antes de qualquer corte eu faço uma leitura do fio — porosidade, curvatura e histórico. Reserve uns 15 minutos a mais no relógio.
    </p>
    
    <div class="card">
      <div class="card-title">Agendamento Confirmado</div>
      <h2 class="card-when">{data} <span>às {horario}</span></h2>
      <div class="card-where">Rua Francisco Ovídio, 184 · Caiçara · Belo Horizonte</div>
      <div class="card-meta">
        <div class="meta-row">
          <div class="card-cell">
            <div class="meta-lbl">Serviço</div>
            <div class="meta-val">{servico}</div>
          </div>
          <div class="card-cell">
            <div class="meta-lbl">Duração</div>
            <div class="meta-val">2h00</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="section-title">Antes de vir</div>
    <p class="section-body">
      Lave o cabelo na <strong>noite anterior</strong> com seu shampoo de sempre. Sem creme, sem leave-in, sem prancha. Quero ler o fio do jeito que ele acorda — não o disfarce.
    </p>
    
    <div class="btn-row">
      <a href="https://www.ojonquecortou.com.br" class="btn">Adicionar à agenda</a>
      <a href="https://maps.google.com/?q=Rua+Francisco+Ovídio,+184,+Caiçara,+Belo+Horizonte" class="btn">Ver localização no Maps</a>
    </div>
    
    <div class="signoff">
      <div class="sig-name">Jon,</div>
      <div class="sig-meta">JONATAN JUNIOR · STUDIO DO JON</div>
    </div>
  `;
  const html01 = buildWrapper("Horário Confirmado", "Confirmação de Horário", content01);

  // 3. lembrete_24h (Lembrete)
  const content02 = `
    <span class="eyebrow">Lembrete</span>
    <h1 class="display-title">Te espero amanhã, <span>{nome}.</span></h1>
    <p class="lead">
      Passando para lembrar do seu horário marcado amanhã no Studio. Lembre-se de reservar uns 15 minutos a mais no relógio.
    </p>
    
    <div class="card">
      <div class="card-title">Agendamento de Amanhã</div>
      <h2 class="card-when">{data} <span>às {horario}</span></h2>
      <div class="card-where">Rua Francisco Ovídio, 184 · Caiçara · Belo Horizonte</div>
      <div class="card-meta">
        <div class="meta-row">
          <div class="card-cell">
            <div class="meta-lbl">Serviço</div>
            <div class="meta-val">{servico}</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="section-title">Lembrete importante</div>
    <p class="section-body">
      Lave o cabelo na <strong>noite anterior</strong> com seu shampoo de sempre. Sem creme, sem leave-in, sem prancha. Quero ler o fio do jeito que ele acorda.
    </p>
    
    <div class="btn-row">
      <a href="https://wa.me/553135866673" class="btn">Chamar no WhatsApp</a>
      <a href="https://www.ojonquecortou.com.br/agendar" class="btn">Preciso reagendar</a>
    </div>
    
    <div class="signoff">
      <div class="sig-name">Jon,</div>
      <div class="sig-meta">JONATAN JUNIOR · STUDIO DO JON</div>
    </div>
  `;
  const html02 = buildWrapper("Lembrete de Horário", "Lembrete 24h", content02);

  // 4. reativacao_5_meses (Reativação)
  const content06 = `
    <span class="eyebrow">Saudade</span>
    <h1 class="display-title">Faz tempo, <span>{nome}.</span></h1>
    <p class="lead">
      Já faz cerca de 5 meses desde o seu último corte no Studio. O cabelo ondulado, cacheado e crespo tem memória e perde a forma à medida que cresce.
    </p>
    
    <div class="section-title">Saúde dos Fios</div>
    <p class="section-body">
      Que tal agendar um horário para resgatar o corte, devolver a definição e cuidar da saúde dos fios? A agenda está aberta e te esperando.
    </p>
    
    <div class="btn-row">
      <a href="https://www.ojonquecortou.com.br/agendar" class="btn">Ver agenda completa</a>
      <a href="https://wa.me/553135866673" class="btn">Marcar pelo WhatsApp</a>
    </div>
    
    <div class="signoff">
      <div class="sig-name">Jon,</div>
      <div class="sig-meta">JONATAN JUNIOR · STUDIO DO JON</div>
    </div>
  `;
  const html06 = buildWrapper("Seu cabelo tem memória", "Reativação 5 Meses", content06);

  const updates = {
    'custom_automations.solicitacao_recebida': html00,
    'custom_automations.horario_confirmado': html01,
    'custom_automations.lembrete_24h': html02,
    'custom_automations.reativacao_5_meses': html06
  };

  console.log("Uploading newly generated templates to Firestore settings/studio...");
  await updateDoc(doc(db, 'settings', 'studio'), updates);
  console.log("Templates successfully seeded in Firestore!");
  
  // Write clean versions locally for backups
  fs.writeFileSync(path.join(__dirname, '../email_solicitacao_recebida_clean.html'), html00);
  fs.writeFileSync(path.join(__dirname, '../email_horario_confirmado_clean.html'), html01);
  fs.writeFileSync(path.join(__dirname, '../email_lembrete_24h_clean.html'), html02);
  fs.writeFileSync(path.join(__dirname, '../email_reativacao_5_meses_clean.html'), html06);
  console.log("Saved local backup files.");
}

run().then(() => {
  console.log("Completed!");
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
