const fs = require('fs');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc } = require('firebase/firestore');

const envPath = 'C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/.env';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let val = match[2] || '';
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[key] = val.trim();
  }
});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const seqD150Body = `
<div style="background-color: #FAF5E8; padding: 56px 56px 48px; color: #1A1310; font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom: 1px solid rgba(26, 19, 16, 0.14); padding-bottom: 22px; margin-bottom: 40px;">
    <tr>
      <td align="left" valign="middle">
        <span style="display: inline-block; width: 26px; height: 26px; border-radius: 50%; background: #1A1310; color: #FAF5E8; text-align: center; line-height: 26px; font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 15px; margin-right: 10px;">J</span>
        <span style="font-family: 'DM Serif Display', Georgia, serif; font-size: 16px; letter-spacing: -0.01em; color: #1A1310;">Studio do Jon</span>
      </td>
    </tr>
  </table>

  <span style="font-family: 'JetBrains Mono', monospace; font-size: 10.5px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: #6B5A4B;">
    <span style="display: inline-block; width: 18px; height: 1px; background-color: #6B5A4B; vertical-align: middle; margin-right: 10px; opacity: 0.6;"></span>
    Saudade
  </span>
  <h1 style="font-family: 'DM Serif Display', Georgia, serif; font-weight: 400; font-size: 44px; letter-spacing: -0.018em; line-height: 1.1; color: #1A1310; margin: 20px 0 0; max-width: 14ch;">
    Faz tempo, <span style="font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-weight: 400; color: #6E2F18;">{nome}.</span>
  </h1>

  <hr style="border: 0; border-top: 1px solid rgba(26, 19, 16, 0.14); margin: 32px 0;" />

  <p style="font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 28px 0 0; max-width: 54ch;">
    Já faz cerca de 5 meses desde o seu último corte no Studio. O cabelo ondulado, cacheado e crespo tem memória e perde a forma à medida que cresce.
  </p>
  <p style="font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 12px 0 0; max-width: 54ch;">
    Que tal agendar um horário para resgatar o corte, devolver a definição e cuidar da saúde dos fios?
  </p>

  <div style="margin-top: 28px;">
    <a href="https://ojonquecortou.com.br/agendar" style="display: inline-block; background-color: #1A1310; color: #FAF5E8; padding: 14px 22px; border-radius: 999px; font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; text-decoration: none; border: 1px solid transparent;">Quero agendar meu horário →</a>
  </div>

  <hr style="border: 0; border-top: 1px solid rgba(26, 19, 16, 0.14); margin: 32px 0;" />
  <div style="margin-top: 36px;">
    <div style="font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 30px; line-height: 1; color: #6E2F18;">Jon</div>
  </div>
  <p style="font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.65; color: #6B5A4B; margin: 12px 0 0; max-width: 52ch;">
    <strong style="color: #1A1310; font-weight: 600;">Studio do Jon</strong><br />
    Especialista em corte para cabelos ondulados, cacheados e crespos com foco em visagismo em Belo Horizonte.
  </p>
  <p style="font-family: 'JetBrains Mono', monospace; font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase; color: #6B5A4B; margin: 12px 0 0;">
    @ojonquecortou · ojonquecortou.com.br/agendar
  </p>
  <div style="height: 48px;"></div>
</div>

<div style="background-color: #EFE5D2; padding: 36px 56px 44px; border-top: 1px solid rgba(26, 19, 16, 0.14); font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="font-family: 'DM Serif Display', Georgia, serif; font-size: 28px; line-height: 1; letter-spacing: -0.015em; color: #1A1310; margin: 0 0 10px;">
    Studio do Jon <span style="font-family: 'Instrument Serif', Georgia, serif; font-style: italic; color: #6E2F18; display: block; margin-top: 4px;">— corte com leitura.</span>
  </div>
  <p style="font-size: 13.5px; color: #6B5A4B; line-height: 1.5; margin: 0 0 20px 0;">
    Rua Francisco Ovídio, 184 · Caiçara<br>Belo Horizonte · MG · 30000-000<br>Quarta a Sábado · 9h às 19h
  </p>
  <div style="font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #6B5A4B; border-top: 1px solid rgba(26, 19, 16, 0.14); padding-top: 18px; margin-top: 18px;">
    © 2026 Studio do Jon
  </div>
</div>
`;

const launchE1Body = `
<div style="background-color: #FAF5E8; padding: 56px 56px 48px; color: #1A1310; font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom: 1px solid rgba(26, 19, 16, 0.14); padding-bottom: 22px; margin-bottom: 40px;">
    <tr>
      <td align="left" valign="middle">
        <span style="display: inline-block; width: 26px; height: 26px; border-radius: 50%; background: #1A1310; color: #FAF5E8; text-align: center; line-height: 26px; font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 15px; margin-right: 10px;">J</span>
        <span style="font-family: 'DM Serif Display', Georgia, serif; font-size: 16px; letter-spacing: -0.01em; color: #1A1310;">Studio do Jon</span>
      </td>
    </tr>
  </table>

  <span style="font-family: 'JetBrains Mono', monospace; font-size: 10.5px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: #6B5A4B;">
    <span style="display: inline-block; width: 18px; height: 1px; background-color: #6B5A4B; vertical-align: middle; margin-right: 10px; opacity: 0.6;"></span>
    Novidade
  </span>
  <h1 style="font-family: 'DM Serif Display', Georgia, serif; font-weight: 400; font-size: 44px; letter-spacing: -0.018em; line-height: 1.1; color: #1A1310; margin: 20px 0 0; max-width: 14ch;">
    Ficou mais fácil de <span style="font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-weight: 400; color: #6E2F18;">marcar.</span>
  </h1>

  <p style="font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 28px 0 0; max-width: 54ch;">
    Olá {nome},
  </p>
  <p style="font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 12px 0 0; max-width: 54ch;">
    O agendamento do Studio do Jon agora é online.
  </p>
  <p style="font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 12px 0 0; max-width: 54ch;">
    Você vê os horários disponíveis em tempo real, escolhe o serviço e confirma — sem precisar esperar resposta de WhatsApp, sem mensagem no direct, sem depender de alguém online pra marcar.
  </p>
  <p style="font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 12px 0 0; max-width: 54ch;">
    Funciona 24h. É só entrar no site.
  </p>
  <p style="font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 12px 0 0; max-width: 54ch;">
    Se você ainda não conhece o Studio: somos especializados em corte para cabelos ondulados, cacheados e crespos. Antes de qualquer tesoura tocar, eu faço uma leitura do fio — diagnóstico de padrão, histórico químico, análise a seco. O corte começa muito antes da cadeira.
  </p>
  <p style="font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 28px 0 0; max-width: 54ch;">
    Quer ver os horários disponíveis?
  </p>

  <div style="margin-top: 28px;">
    <a href="https://ojonquecortou.com.br/agendar" style="display: inline-block; background-color: #1A1310; color: #FAF5E8; padding: 14px 22px; border-radius: 999px; font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; text-decoration: none; border: 1px solid transparent;">Ver agenda online →</a>
  </div>

  <hr style="border: 0; border-top: 1px solid rgba(26, 19, 16, 0.14); margin: 32px 0;" />
  <div style="margin-top: 36px;">
    <div style="font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 30px; line-height: 1; color: #6E2F18;">Jon</div>
  </div>
  <p style="font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.65; color: #6B5A4B; margin: 12px 0 0; max-width: 52ch;">
    <strong style="color: #1A1310; font-weight: 600;">Studio do Jon</strong><br />
    Especialista em corte para cabelos ondulados, cacheados e crespos com foco em visagismo em Belo Horizonte.
  </p>
  <p style="font-family: 'JetBrains Mono', monospace; font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase; color: #6B5A4B; margin: 12px 0 0;">
    @ojonquecortou · ojonquecortou.com.br/agendar
  </p>
  <div style="height: 48px;"></div>
</div>

<div style="background-color: #EFE5D2; padding: 36px 56px 44px; border-top: 1px solid rgba(26, 19, 16, 0.14); font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="font-family: 'DM Serif Display', Georgia, serif; font-size: 28px; line-height: 1; letter-spacing: -0.015em; color: #1A1310; margin: 0 0 10px;">
    Studio do Jon <span style="font-family: 'Instrument Serif', Georgia, serif; font-style: italic; color: #6E2F18; display: block; margin-top: 4px;">— corte com leitura.</span>
  </div>
  <p style="font-size: 13.5px; color: #6B5A4B; line-height: 1.5; margin: 0 0 20px 0;">
    Rua Francisco Ovídio, 184 · Caiçara<br>Belo Horizonte · MG · 30000-000<br>Quarta a Sábado · 9h às 19h
  </p>
  <div style="font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #6B5A4B; border-top: 1px solid rgba(26, 19, 16, 0.14); padding-top: 18px; margin-top: 18px;">
    © 2026 Studio do Jon
  </div>
</div>
`;

const launchE2Body = `
<div style="background-color: #FAF5E8; padding: 56px 56px 48px; color: #1A1310; font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom: 1px solid rgba(26, 19, 16, 0.14); padding-bottom: 22px; margin-bottom: 40px;">
    <tr>
      <td align="left" valign="middle">
        <span style="display: inline-block; width: 26px; height: 26px; border-radius: 50%; background: #1A1310; color: #FAF5E8; text-align: center; line-height: 26px; font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 15px; margin-right: 10px;">J</span>
        <span style="font-family: 'DM Serif Display', Georgia, serif; font-size: 16px; letter-spacing: -0.01em; color: #1A1310;">Studio do Jon</span>
      </td>
    </tr>
  </table>

  <span style="font-family: 'JetBrains Mono', monospace; font-size: 10.5px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: #6B5A4B;">
    <span style="display: inline-block; width: 18px; height: 1px; background-color: #6B5A4B; vertical-align: middle; margin-right: 10px; opacity: 0.6;"></span>
    Valor do Método
  </span>
  <h1 style="font-family: 'DM Serif Display', Georgia, serif; font-weight: 400; font-size: 44px; letter-spacing: -0.018em; line-height: 1.1; color: #1A1310; margin: 20px 0 0; max-width: 14ch;">
    O que vem antes do <span style="font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-weight: 400; color: #6E2F18;">corte.</span>
  </h1>

  <p style="font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 28px 0 0; max-width: 54ch;">
    Olá {nome},
  </p>
  <p style="font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 12px 0 0; max-width: 54ch;">
    Você já saiu de um corte completamente diferente do que pediu?
  </p>
  <p style="font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 12px 0 0; max-width: 54ch;">
    Não é coincidência. E não é culpa do seu cabelo.
  </p>
  <p style="font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 12px 0 0; max-width: 54ch;">
    A maioria dos cabeleireiros chega com a tesoura antes de conhecer o fio. Não pergunta sobre química, não analisa o padrão a seco, não observa como o cacho se comporta sem produto. Corta pela referência da foto — não pela realidade do que tem na cabeça de quem tá sentada na cadeira.
  </p>
  <p style="font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 12px 0 0; max-width: 54ch;">
    No Studio do Jon, a tesoura é a última coisa que aparece.
  </p>
  <p style="font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 12px 0 0; max-width: 54ch;">
    Primeiro vem a escuta. Análise a seco, diagnóstico de couro, histórico químico, observação do padrão de queda natural. Isso é o Método Leitura de Fio — o processo que define como cada corte vai ser executado.
  </p>
  <p style="font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 12px 0 0; max-width: 54ch;">
    É o motivo pelo qual o resultado é diferente aqui.
  </p>

  <p style="font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 28px 0 0; max-width: 54ch;">
    Se você quiser experimentar:
  </p>

  <div style="margin-top: 28px;">
    <a href="https://ojonquecortou.com.br/agendar" style="display: inline-block; background-color: #1A1310; color: #FAF5E8; padding: 14px 22px; border-radius: 999px; font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; text-decoration: none; border: 1px solid transparent;">Agendar pelo novo sistema →</a>
  </div>

  <hr style="border: 0; border-top: 1px solid rgba(26, 19, 16, 0.14); margin: 32px 0;" />
  <div style="margin-top: 36px;">
    <div style="font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 30px; line-height: 1; color: #6E2F18;">Jon</div>
  </div>
  <p style="font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.65; color: #6B5A4B; margin: 12px 0 0; max-width: 52ch;">
    <strong style="color: #1A1310; font-weight: 600;">Studio do Jon</strong><br />
    Especialista em corte para cabelos ondulados, cacheados e crespos com foco em visagismo em Belo Horizonte.
  </p>
  <p style="font-family: 'JetBrains Mono', monospace; font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase; color: #6B5A4B; margin: 12px 0 0;">
    @ojonquecortou · ojonquecortou.com.br/agendar
  </p>
  <div style="height: 48px;"></div>
</div>

<div style="background-color: #EFE5D2; padding: 36px 56px 44px; border-top: 1px solid rgba(26, 19, 16, 0.14); font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="font-family: 'DM Serif Display', Georgia, serif; font-size: 28px; line-height: 1; letter-spacing: -0.015em; color: #1A1310; margin: 0 0 10px;">
    Studio do Jon <span style="font-family: 'Instrument Serif', Georgia, serif; font-style: italic; color: #6E2F18; display: block; margin-top: 4px;">— corte com leitura.</span>
  </div>
  <p style="font-size: 13.5px; color: #6B5A4B; line-height: 1.5; margin: 0 0 20px 0;">
    Rua Francisco Ovídio, 184 · Caiçara<br>Belo Horizonte · MG · 30000-000<br>Quarta a Sábado · 9h às 19h
  </p>
  <div style="font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #6B5A4B; border-top: 1px solid rgba(26, 19, 16, 0.14); padding-top: 18px; margin-top: 18px;">
    © 2026 Studio do Jon
  </div>
</div>
`;

const launchE3Body = `
<div style="background-color: #FAF5E8; padding: 56px 56px 48px; color: #1A1310; font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom: 1px solid rgba(26, 19, 16, 0.14); padding-bottom: 22px; margin-bottom: 40px;">
    <tr>
      <td align="left" valign="middle">
        <span style="display: inline-block; width: 26px; height: 26px; border-radius: 50%; background: #1A1310; color: #FAF5E8; text-align: center; line-height: 26px; font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 15px; margin-right: 10px;">J</span>
        <span style="font-family: 'DM Serif Display', Georgia, serif; font-size: 16px; letter-spacing: -0.01em; color: #1A1310;">Studio do Jon</span>
      </td>
    </tr>
  </table>

  <span style="font-family: 'JetBrains Mono', monospace; font-size: 10.5px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: #6B5A4B;">
    <span style="display: inline-block; width: 18px; height: 1px; background-color: #6B5A4B; vertical-align: middle; margin-right: 10px; opacity: 0.6;"></span>
    Janela de Acesso
  </span>
  <h1 style="font-family: 'DM Serif Display', Georgia, serif; font-weight: 400; font-size: 44px; letter-spacing: -0.018em; line-height: 1.1; color: #1A1310; margin: 20px 0 0; max-width: 14ch;">
    Garanta seu horário com <span style="font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-weight: 400; color: #6E2F18;">prioridade.</span>
  </h1>

  <p style="font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 28px 0 0; max-width: 54ch;">
    Olá {nome},
  </p>
  <p style="font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 12px 0 0; max-width: 54ch;">
    Com o lançamento do novo sistema de agendamento, estou separando horários de prioridade para quem entrar pelo link nos primeiros dias — antes de abrir a agenda completa.
  </p>
  <p style="font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 12px 0 0; max-width: 54ch;">
    Se você ainda não conhece o Studio: somos especializados em corte para cacheados, crespos e ondulados. Antes de cortar, eu leio o fio. Diagnóstico, padrão, histórico químico. O corte começa muito antes da tesoura.
  </p>
  <p style="font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 12px 0 0; max-width: 54ch;">
    Se quiser garantir seu horário antes da agenda abrir pra todo mundo:
  </p>

  <div style="margin-top: 28px;">
    <a href="https://ojonquecortou.com.br/agendar" style="display: inline-block; background-color: #1A1310; color: #FAF5E8; padding: 14px 22px; border-radius: 999px; font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; text-decoration: none; border: 1px solid transparent;">Quero meu horário com prioridade →</a>
  </div>

  <p style="font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.65; color: #6B5A4B; margin: 28px 0 0; max-width: 54ch;">
    Se não quiser mais receber meus emails, é só responder aqui. Sem drama.
  </p>

  <hr style="border: 0; border-top: 1px solid rgba(26, 19, 16, 0.14); margin: 32px 0;" />
  <div style="margin-top: 36px;">
    <div style="font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 30px; line-height: 1; color: #6E2F18;">Jon</div>
  </div>
  <p style="font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.65; color: #6B5A4B; margin: 12px 0 0; max-width: 52ch;">
    <strong style="color: #1A1310; font-weight: 600;">Studio do Jon</strong><br />
    Especialista em corte para cabelos ondulados, cacheados e crespos com foco em visagismo em Belo Horizonte.
  </p>
  <p style="font-family: 'JetBrains Mono', monospace; font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase; color: #6B5A4B; margin: 12px 0 0;">
    @ojonquecortou · ojonquecortou.com.br/agendar
  </p>
  <div style="height: 48px;"></div>
</div>

<div style="background-color: #EFE5D2; padding: 36px 56px 44px; border-top: 1px solid rgba(26, 19, 16, 0.14); font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="font-family: 'DM Serif Display', Georgia, serif; font-size: 28px; line-height: 1; letter-spacing: -0.015em; color: #1A1310; margin: 0 0 10px;">
    Studio do Jon <span style="font-family: 'Instrument Serif', Georgia, serif; font-style: italic; color: #6E2F18; display: block; margin-top: 4px;">— corte com leitura.</span>
  </div>
  <p style="font-size: 13.5px; color: #6B5A4B; line-height: 1.5; margin: 0 0 20px 0;">
    Rua Francisco Ovídio, 184 · Caiçara<br>Belo Horizonte · MG · 30000-000<br>Quarta a Sábado · 9h às 19h
  </p>
  <div style="font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #6B5A4B; border-top: 1px solid rgba(26, 19, 16, 0.14); padding-top: 18px; margin-top: 18px;">
    © 2026 Studio do Jon
  </div>
</div>
`;

async function run() {
  const docRef = doc(db, 'settings', 'studio');
  
  const updates = {
    'email_templates.seqD150': { subject: 'Seu cabelo tem memória, {nome}', body: seqD150Body },
    'email_templates.launchE1': { subject: 'Agendamento online no Studio do Jon. Acabou de mudar.', body: launchE1Body },
    'email_templates.launchE2': { subject: 'Antes de marcar em qualquer lugar, você precisa saber isso.', body: launchE2Body },
    'email_templates.launchE3': { subject: 'Primeiros agendamentos pelo novo site têm prioridade de horário.', body: launchE3Body },
    'automations.launchCampaignEnabled': true
  };
  
  console.log('Updating Firestore settings/studio doc with new templates...');
  await updateDoc(docRef, updates);
  console.log('Firestore settings updated successfully!');
  process.exit(0);
}

run().catch(console.error);
