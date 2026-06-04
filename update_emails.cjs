const fs = require('fs');
const path = require('path');

const filePath = path.join('C:', 'Users', 'jonat', '.gemini', 'antigravity', 'scratch', 'ojonquecortou', 'ojonquecortou', 'src', 'utils', 'emailTemplates.js');
let content = fs.readFileSync(filePath, 'utf8');

// The new HTML definitions
const launch_e1 = `<div style="background-color: #050505; padding: 60px 20px; font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-height: 100vh;">
  <!-- PREVIEW TEXT OCULTO -->
  <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all; opacity: 0; font-size: 0; line-height: 0;">
    O novo sistema de agendamento está no ar.
    &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin: 0 auto; background-color: #0A0A0A; border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); overflow: hidden; box-shadow: 0 24px 48px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.05);">
    <tr>
      <td style="padding: 56px 48px 48px;">
        
        <!-- HEADER -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom: 1px solid rgba(255, 255, 255, 0.05); padding-bottom: 24px; margin-bottom: 48px;">
          <tr>
            <td align="left" valign="middle">
              <span style="display: inline-block; width: 32px; height: 32px; border-radius: 50%; background: #FAF5E8; color: #050505; text-align: center; line-height: 32px; font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 18px; margin-right: 12px; vertical-align: middle;">J</span>
              <span style="font-family: 'DM Serif Display', Georgia, serif; font-size: 18px; letter-spacing: -0.01em; color: #FAF5E8; vertical-align: middle;">Studio do Jon</span>
            </td>
          </tr>
        </table>

        <!-- TAG -->
        <span style="font-family: 'JetBrains Mono', monospace; font-size: 10.5px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: #A39687;">
          <span style="display: inline-block; width: 18px; height: 1px; background-color: #A39687; vertical-align: middle; margin-right: 10px;"></span>
          Novo Sistema
        </span>

        <!-- TITLE -->
        <h1 style="font-family: 'DM Serif Display', Georgia, serif; font-weight: 400; font-size: 42px; letter-spacing: -0.018em; line-height: 1.1; color: #FAF5E8; margin: 24px 0 0; max-width: 14ch;">
          O seu agendamento, <span style='font-family: "Instrument Serif", Georgia, serif; font-style: italic; color: #D48C6A;'>elevado.</span>
        </h1>

        <!-- CONTENT -->
        <div style="margin-top: 32px; font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15.5px; line-height: 1.65; color: #A39687;">
          <p style="margin: 0 0 16px 0; max-width: 54ch;">Olá {nome},</p>
          <p style="margin: 0 0 16px 0; max-width: 54ch;">O Studio sempre foi sobre precisão e experiência. Agora, estendi isso para o momento de marcar o seu horário.</p>
          <p style="margin: 0 0 16px 0; max-width: 54ch;">Acabei de lançar o novo sistema de agendamento online. Mais rápido, sem esperas no WhatsApp, e com controle total dos seus horários.</p>
          <p style="margin: 0 0 16px 0; max-width: 54ch;">Você já pode acessar e conhecer a nova plataforma.</p>
          
          <!-- BUTTON -->
          <div style="margin-top: 40px; margin-bottom: 16px;">
            <a href="https://www.ojonquecortou.com.br/agendar" style="display: inline-block; background-color: #FAF5E8; color: #050505; padding: 16px 32px; border-radius: 999px; font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; text-decoration: none; box-shadow: 0 4px 12px rgba(250,245,232,0.15);">Conhecer o novo sistema &rarr;</a>
          </div>
        </div>

        <!-- SIGNATURE -->
        <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.05); margin: 48px 0 32px;" />
        <div>
          <div style="font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 32px; line-height: 1; color: #D48C6A;">Jon</div>
        </div>
        <p style="font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.65; color: #A39687; margin: 12px 0 0; max-width: 52ch;">
          <strong style="color: #FAF5E8; font-weight: 600;">Studio do Jon</strong><br />
          Especialista em corte para cabelos ondulados, cacheados e crespos com foco em visagismo em Belo Horizonte.
        </p>
      </td>
    </tr>
    <!-- FOOTER -->
    <tr>
      <td style="background-color: #050505; padding: 40px 48px; border-top: 1px solid rgba(255, 255, 255, 0.05);">
        <div style="font-family: 'DM Serif Display', Georgia, serif; font-size: 24px; line-height: 1.2; letter-spacing: -0.015em; color: #FAF5E8; margin: 0 0 12px;">
          Studio do Jon <span style="font-family: 'Instrument Serif', Georgia, serif; font-style: italic; color: #D48C6A; display: block; margin-top: 6px;">— corte com leitura.</span>
        </div>
        <p style="font-family: 'Manrope', sans-serif; font-size: 13px; color: rgba(250, 245, 232, 0.4); line-height: 1.6; margin: 0 0 24px 0;">
          Rua Francisco Ovídio, 184 &middot; Caiçara<br>Belo Horizonte &middot; MG &middot; 30000-000<br>Quarta a Sábado &middot; 9h às 19h
        </p>
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(250, 245, 232, 0.2); border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 20px;">
          &copy; 2026 Studio do Jon &middot; @ojonquecortou
        </div>
      </td>
    </tr>
  </table>
</div>`.replace(/\n/g, '\\n');

const launch_e2 = `<div style="background-color: #050505; padding: 60px 20px; font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-height: 100vh;">
  <!-- PREVIEW TEXT OCULTO -->
  <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all; opacity: 0; font-size: 0; line-height: 0;">
    Não é coincidência. E não é culpa do seu cabelo.
    &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin: 0 auto; background-color: #0A0A0A; border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); overflow: hidden; box-shadow: 0 24px 48px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.05);">
    <tr>
      <td style="padding: 56px 48px 48px;">
        
        <!-- HEADER -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom: 1px solid rgba(255, 255, 255, 0.05); padding-bottom: 24px; margin-bottom: 48px;">
          <tr>
            <td align="left" valign="middle">
              <span style="display: inline-block; width: 32px; height: 32px; border-radius: 50%; background: #FAF5E8; color: #050505; text-align: center; line-height: 32px; font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 18px; margin-right: 12px; vertical-align: middle;">J</span>
              <span style="font-family: 'DM Serif Display', Georgia, serif; font-size: 18px; letter-spacing: -0.01em; color: #FAF5E8; vertical-align: middle;">Studio do Jon</span>
            </td>
          </tr>
        </table>

        <!-- TAG -->
        <span style="font-family: 'JetBrains Mono', monospace; font-size: 10.5px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: #A39687;">
          <span style="display: inline-block; width: 18px; height: 1px; background-color: #A39687; vertical-align: middle; margin-right: 10px;"></span>
          Valor do Método
        </span>

        <!-- TITLE -->
        <h1 style="font-family: 'DM Serif Display', Georgia, serif; font-weight: 400; font-size: 42px; letter-spacing: -0.018em; line-height: 1.1; color: #FAF5E8; margin: 24px 0 0; max-width: 14ch;">
          O que vem antes do <span style='font-family: "Instrument Serif", Georgia, serif; font-style: italic; color: #D48C6A;'>corte.</span>
        </h1>

        <!-- CONTENT -->
        <div style="margin-top: 32px; font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15.5px; line-height: 1.65; color: #A39687;">
          <p style="margin: 0 0 16px 0; max-width: 54ch;">Olá {nome},</p>
          <p style="margin: 0 0 16px 0; max-width: 54ch;">Você já saiu de um corte completamente diferente do que pediu?</p>
          <p style="margin: 0 0 16px 0; max-width: 54ch;">Não é coincidência. E não é culpa do seu cabelo.</p>
          <p style="margin: 0 0 16px 0; max-width: 54ch;">A maioria dos profissionais chega com a tesoura antes de conhecer o fio. Não pergunta sobre química, não analisa o padrão a seco, não observa como o cacho se comporta no caimento natural.</p>
          <div style="background-color: rgba(255,255,255,0.02); border-left: 2px solid #D48C6A; padding: 24px; margin: 32px 0;">
            <p style="margin: 0; color: #FAF5E8; font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 22px; line-height: 1.4;">"No Studio do Jon, a tesoura é a última coisa que aparece."</p>
          </div>
          <p style="margin: 0 0 16px 0; max-width: 54ch;">Primeiro vem a escuta. Análise a seco, diagnóstico de couro, histórico químico, observação do padrão de queda. Isso é o <strong>Método Leitura de Fio</strong> — o processo que garante que o resultado não seja sorte, mas engenharia.</p>
          
          <div style="margin-top: 40px; margin-bottom: 16px;">
            <a href="https://www.ojonquecortou.com.br/agendar" style="display: inline-block; background-color: #FAF5E8; color: #050505; padding: 16px 32px; border-radius: 999px; font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; text-decoration: none; box-shadow: 0 4px 12px rgba(250,245,232,0.15);">Agendar pelo novo sistema &rarr;</a>
          </div>
        </div>

        <!-- SIGNATURE -->
        <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.05); margin: 48px 0 32px;" />
        <div>
          <div style="font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 32px; line-height: 1; color: #D48C6A;">Jon</div>
        </div>
        <p style="font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.65; color: #A39687; margin: 12px 0 0; max-width: 52ch;">
          <strong style="color: #FAF5E8; font-weight: 600;">Studio do Jon</strong><br />
          Especialista em corte para cabelos ondulados, cacheados e crespos com foco em visagismo em Belo Horizonte.
        </p>
      </td>
    </tr>
    <!-- FOOTER -->
    <tr>
      <td style="background-color: #050505; padding: 40px 48px; border-top: 1px solid rgba(255, 255, 255, 0.05);">
        <div style="font-family: 'DM Serif Display', Georgia, serif; font-size: 24px; line-height: 1.2; letter-spacing: -0.015em; color: #FAF5E8; margin: 0 0 12px;">
          Studio do Jon <span style="font-family: 'Instrument Serif', Georgia, serif; font-style: italic; color: #D48C6A; display: block; margin-top: 6px;">— corte com leitura.</span>
        </div>
        <p style="font-family: 'Manrope', sans-serif; font-size: 13px; color: rgba(250, 245, 232, 0.4); line-height: 1.6; margin: 0 0 24px 0;">
          Rua Francisco Ovídio, 184 &middot; Caiçara<br>Belo Horizonte &middot; MG &middot; 30000-000<br>Quarta a Sábado &middot; 9h às 19h
        </p>
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(250, 245, 232, 0.2); border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 20px;">
          &copy; 2026 Studio do Jon &middot; @ojonquecortou
        </div>
      </td>
    </tr>
  </table>
</div>`.replace(/\n/g, '\\n');

const launch_e3 = `<div style="background-color: #050505; padding: 60px 20px; font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-height: 100vh;">
  <!-- PREVIEW TEXT OCULTO -->
  <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all; opacity: 0; font-size: 0; line-height: 0;">
    Acesso antecipado ao novo sistema. Horários limitados.
    &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin: 0 auto; background-color: #0A0A0A; border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); overflow: hidden; box-shadow: 0 24px 48px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.05);">
    <tr>
      <td style="padding: 56px 48px 48px;">
        
        <!-- HEADER -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom: 1px solid rgba(255, 255, 255, 0.05); padding-bottom: 24px; margin-bottom: 48px;">
          <tr>
            <td align="left" valign="middle">
              <span style="display: inline-block; width: 32px; height: 32px; border-radius: 50%; background: #FAF5E8; color: #050505; text-align: center; line-height: 32px; font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 18px; margin-right: 12px; vertical-align: middle;">J</span>
              <span style="font-family: 'DM Serif Display', Georgia, serif; font-size: 18px; letter-spacing: -0.01em; color: #FAF5E8; vertical-align: middle;">Studio do Jon</span>
            </td>
          </tr>
        </table>

        <!-- TAG -->
        <span style="font-family: 'JetBrains Mono', monospace; font-size: 10.5px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: #A39687;">
          <span style="display: inline-block; width: 18px; height: 1px; background-color: #A39687; vertical-align: middle; margin-right: 10px;"></span>
          Janela de Acesso
        </span>

        <!-- TITLE -->
        <h1 style="font-family: 'DM Serif Display', Georgia, serif; font-weight: 400; font-size: 42px; letter-spacing: -0.018em; line-height: 1.1; color: #FAF5E8; margin: 24px 0 0; max-width: 14ch;">
          Garanta seu horário com <span style='font-family: "Instrument Serif", Georgia, serif; font-style: italic; color: #D48C6A;'>prioridade.</span>
        </h1>

        <!-- CONTENT -->
        <div style="margin-top: 32px; font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15.5px; line-height: 1.65; color: #A39687;">
          <p style="margin: 0 0 16px 0; max-width: 54ch;">Olá {nome},</p>
          <p style="margin: 0 0 16px 0; max-width: 54ch;">Com o lançamento do novo sistema, estou abrindo uma janela de <strong>acesso antecipado</strong> para quem acompanhou a novidade desde o primeiro e-mail.</p>
          <p style="margin: 0 0 16px 0; max-width: 54ch;">Se você ainda não agendou: este é o momento para escolher os melhores dias e horários antes da agenda ser aberta publicamente no Instagram.</p>
          <p style="margin: 0 0 16px 0; max-width: 54ch;">É simples, direto ao ponto e respeita o seu tempo.</p>
          
          <div style="margin-top: 40px; margin-bottom: 16px;">
            <a href="https://www.ojonquecortou.com.br/agendar" style="display: inline-block; background-color: #FAF5E8; color: #050505; padding: 16px 32px; border-radius: 999px; font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; text-decoration: none; box-shadow: 0 4px 12px rgba(250,245,232,0.15);">Quero meu horário com prioridade &rarr;</a>
          </div>
        </div>

        <!-- SIGNATURE -->
        <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.05); margin: 48px 0 32px;" />
        <div>
          <div style="font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 32px; line-height: 1; color: #D48C6A;">Jon</div>
        </div>
        <p style="font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.65; color: #A39687; margin: 12px 0 0; max-width: 52ch;">
          <strong style="color: #FAF5E8; font-weight: 600;">Studio do Jon</strong><br />
          Especialista em corte para cabelos ondulados, cacheados e crespos com foco em visagismo em Belo Horizonte.
        </p>
      </td>
    </tr>
    <!-- FOOTER -->
    <tr>
      <td style="background-color: #050505; padding: 40px 48px; border-top: 1px solid rgba(255, 255, 255, 0.05);">
        <div style="font-family: 'DM Serif Display', Georgia, serif; font-size: 24px; line-height: 1.2; letter-spacing: -0.015em; color: #FAF5E8; margin: 0 0 12px;">
          Studio do Jon <span style="font-family: 'Instrument Serif', Georgia, serif; font-style: italic; color: #D48C6A; display: block; margin-top: 6px;">— corte com leitura.</span>
        </div>
        <p style="font-family: 'Manrope', sans-serif; font-size: 13px; color: rgba(250, 245, 232, 0.4); line-height: 1.6; margin: 0 0 24px 0;">
          Rua Francisco Ovídio, 184 &middot; Caiçara<br>Belo Horizonte &middot; MG &middot; 30000-000<br>Quarta a Sábado &middot; 9h às 19h
        </p>
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(250, 245, 232, 0.2); border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 20px;">
          &copy; 2026 Studio do Jon &middot; @ojonquecortou
        </div>
      </td>
    </tr>
  </table>
</div>`.replace(/\n/g, '\\n');

const regex = /launch_e2:\s*`[\s\S]*?`,\s*launch_e3:\s*`[\s\S]*?`\n};/;
const replacement = `launch_e1: \`${launch_e1}\`,\n  launch_e2: \`${launch_e2}\`,\n  launch_e3: \`${launch_e3}\`\n};`;

if (content.match(regex)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully updated launch_e1, launch_e2, and launch_e3 in emailTemplates.js');
} else {
  console.log('Regex did not match');
}
