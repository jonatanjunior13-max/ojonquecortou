const fs = require('fs');
const path = require('path');

const FONT_SANS = "font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;";
const FONT_SERIF = "font-family: 'DM Serif Display', Georgia, serif;";
const FONT_SERIF_ITALIC = "font-family: 'Instrument Serif', Georgia, serif; font-style: italic;";
const FONT_MONO = "font-family: 'JetBrains Mono', monospace;";

const emailTemplatesPath = path.join(__dirname, '../src/utils/emailTemplates.js');

const EMAIL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&family=Manrope:wght@300;400;500;600;700&display=swap');
`;

const getBrandHeader = (bg, color, innerBg) => `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom: 1px solid rgba(26, 19, 16, 0.14); padding-bottom: 22px; margin-bottom: 40px;">
    <tr>
      <td align="left" valign="middle">
        <span style="display: inline-block; width: 26px; height: 26px; border-radius: 50%; background: ${innerBg}; color: ${color}; text-align: center; line-height: 26px; ${FONT_SERIF_ITALIC} font-size: 15px; margin-right: 10px;">J</span>
        <span style="${FONT_SERIF} font-size: 16px; letter-spacing: -0.01em; color: ${color};">Studio do Jon</span>
      </td>
    </tr>
  </table>
`;

const getBrandHeaderDark = () => `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom: 1px solid rgba(245, 237, 219, 0.14); padding-bottom: 22px; margin-bottom: 40px;">
    <tr>
      <td align="left" valign="middle">
        <span style="display: inline-block; width: 26px; height: 26px; border-radius: 50%; background: #FAF5E8; color: #1A1310; text-align: center; line-height: 26px; ${FONT_SERIF_ITALIC} font-size: 15px; margin-right: 10px;">J</span>
        <span style="${FONT_SERIF} font-size: 16px; letter-spacing: -0.01em; color: #FAF5E8;">Studio do Jon</span>
      </td>
    </tr>
  </table>
`;

const getBrandFooter = (bg, color, border) => `
<div style="background-color: ${bg}; padding: 36px 56px 44px; border-top: 1px solid ${border}; ${FONT_SANS}">
  <div style="${FONT_SERIF} font-size: 28px; line-height: 1; letter-spacing: -0.015em; color: ${color}; margin: 0 0 10px;">
    Studio do Jon <span style="${FONT_SERIF_ITALIC} color: ${color === '#FAF5E8' ? '#C97B49' : '#6E2F18'}; display: block; margin-top: 4px;">— corte com leitura.</span>
  </div>
  <p style="font-size: 13.5px; color: ${color === '#FAF5E8' ? 'rgba(245,237,219,0.6)' : '#6B5A4B'}; line-height: 1.5; margin: 0 0 20px 0;">
    Rua Francisco Ovídio, 184 · Caiçara<br>Belo Horizonte · MG · 30000-000<br>Quarta a Sábado · 9h às 19h
  </p>
  <div style="${FONT_MONO} font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: ${color === '#FAF5E8' ? 'rgba(245,237,219,0.45)' : '#6B5A4B'}; border-top: 1px solid ${border}; padding-top: 18px; margin-top: 18px;">
    © 2026 Studio do Jon
  </div>
</div>
`;

const d1 = `
<div style="background-color: #F5EDDB; padding: 56px 56px 48px; color: #1A1310; ${FONT_SANS}">
  ${getBrandHeader('#F5EDDB', '#1A1310', '#1A1310')}

  <span style="${FONT_MONO} font-size: 10.5px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: #6B5A4B;">
    <span style="display: inline-block; width: 18px; height: 1px; background-color: #6B5A4B; vertical-align: middle; margin-right: 10px; opacity: 0.6;"></span>
    24 horas depois
  </span>
  <h1 style="${FONT_SERIF} font-weight: 400; font-size: 44px; letter-spacing: -0.018em; line-height: 1.1; color: #1A1310; margin: 20px 0 0; max-width: 14ch;">
    {nome}, como tá o fio <span style="${FONT_SERIF_ITALIC} font-weight: 400; color: #6E2F18;">hoje?</span>
  </h1>

  <p style="${FONT_SANS} font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 28px 0 0; max-width: 54ch;">
    Ontem você saiu do Studio com o corte novo. Como tá se sentindo com ele hoje?
  </p>
  <p style="${FONT_SANS} font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 12px 0 0; max-width: 54ch;">
    Os primeiros <strong style="color: #1A1310; font-weight: 600;">2–3 dias</strong> o cacho ainda tá encontrando o padrão. Normal ter um dia estranho no começo — não é o corte que ficou ruim. É o fio se reorganizando depois de perder peso.
  </p>

  <div style="background-color: #FAF5E8; border: 1px solid rgba(26, 19, 16, 0.14); border-left: 3px solid #B05A2E; border-radius: 4px; padding: 22px 26px; margin: 28px 0;">
    <div style="${FONT_MONO} font-size: 10.5px; letter-spacing: 0.18em; text-transform: uppercase; color: #6E2F18; margin-bottom: 10px; font-weight: bold;">Essa semana</div>
    <p style="${FONT_SANS} font-size: 16px; line-height: 1.6; color: #2E241E; margin: 0;">
      Evita escova seca. Deixa o peso trabalhar sozinho. Quanto menos você manipular agora, <strong style="color: #1A1310; font-weight: 600;">mais rápido o padrão se define</strong>.
    </p>
  </div>

  <p style="${FONT_SANS} font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 28px 0 0; max-width: 54ch;">
    Se surgir qualquer dúvida sobre finalização, me chama no WhatsApp ou no direct. Tô aqui.
  </p>

  <div style="margin-top: 28px;">
    <a href="https://wa.me/553135866673" style="display: inline-block; background-color: #1A1310; color: #F5EDDB; padding: 14px 22px; border-radius: 999px; ${FONT_SANS} font-size: 13px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; text-decoration: none; border: 1px solid transparent;">Falar com o Jon</a>
  </div>

  <hr style="border: 0; border-top: 1px solid rgba(26, 19, 16, 0.14); margin: 32px 0;" />
  <div style="margin-top: 36px;">
    <div style="${FONT_SERIF_ITALIC} font-size: 30px; line-height: 1; color: #6E2F18;">Jon</div>
  </div>
  <p style="${FONT_SANS} font-size: 14px; line-height: 1.65; color: #6B5A4B; margin: 12px 0 0; max-width: 52ch;">
    <strong style="color: #1A1310; font-weight: 600;">Studio do Jon</strong><br />
    Especialista em corte para cabelos ondulados, cacheados e crespos com foco em visagismo em Belo Horizonte.
  </p>
  <p style="${FONT_MONO} font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase; color: #6B5A4B; margin: 12px 0 0;">
    @ojonquecortou · ojonquecortou.com.br/agendar
  </p>
  <div style="height: 48px;"></div>
</div>
${getBrandFooter('#EFE5D2', '#1A1310', 'rgba(26, 19, 16, 0.14)')}
`;

const d7 = `
<div style="background-color: #FAF5E8; padding: 56px 56px 48px; color: #1A1310; ${FONT_SANS}">
  ${getBrandHeader('#FAF5E8', '#1A1310', '#1A1310')}

  <span style="${FONT_MONO} font-size: 10.5px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: #6B5A4B;">
    <span style="display: inline-block; width: 18px; height: 1px; background-color: #6B5A4B; vertical-align: middle; margin-right: 10px; opacity: 0.6;"></span>
    Sete dias
  </span>
  <h1 style="${FONT_SERIF} font-weight: 400; font-size: 44px; letter-spacing: -0.018em; line-height: 1.1; color: #1A1310; margin: 20px 0 0; max-width: 15ch;">
    A semana mais <span style="${FONT_SERIF_ITALIC} font-weight: 400; color: #6E2F18;">importante</span> do seu cabelo.
  </h1>

  <p style="${FONT_SANS} font-size: 17px; line-height: 1.55; color: #1A1310; margin: 28px 0 0; max-width: 46ch;">
    E quase ninguém fala sobre isso.
  </p>

  <p style="${FONT_SANS} font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 28px 0 0; max-width: 54ch;">
    Essa é a fase mais traiçoeira pra julgar um resultado. Muita cliente olha pro espelho na semana 1 e pensa que o corte não ficou bom — quando na verdade o fio ainda tá <em style="${FONT_SERIF_ITALIC} color: #6E2F18;">aprendendo</em> o padrão.
  </p>

  <hr style="border: 0; border-top: 1px solid rgba(26, 19, 16, 0.14); margin: 32px 0;" />

  <span style="${FONT_MONO} font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase; color: #6B5A4B;">O que tá acontecendo</span>
  <p style="${FONT_SANS} font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 12px 0 0; max-width: 54ch;">
    Depois de perder peso com o corte, o cacho precisa de alguns dias pra encontrar o ângulo de queda certo. É como tirar um sapato apertado — o pé demora um tempo pra se reorganizar.
  </p>

  <div style="background-color: #F5EDDB; border: 1px solid rgba(26, 19, 16, 0.14); border-left: 3px solid #B05A2E; border-radius: 4px; padding: 22px 26px; margin: 28px 0;">
    <div style="${FONT_MONO} font-size: 10.5px; letter-spacing: 0.18em; text-transform: uppercase; color: #6E2F18; margin-bottom: 10px; font-weight: bold;">O que ajuda agora</div>
    <p style="${FONT_SANS} font-size: 16px; line-height: 1.6; color: #2E241E; margin: 0;">
      Finalize <strong>mais leve do que o normal</strong>. Sem mousse pesada, sem creme em excesso. Deixa o fio respirar. Se possível, seque natural pelo menos duas vezes essa semana.
    </p>
  </div>

  <p style="${FONT_SANS} font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 28px 0 0; max-width: 54ch;">
    A definição real do seu corte aparece <strong style="color: #1A1310; font-weight: 600;">entre a semana 2 e 3</strong>.
  </p>
  <p style="${FONT_SANS} font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 12px 0 0; max-width: 54ch;">
    Qualquer dúvida, me chama.
  </p>

  <div style="margin-top: 28px;">
    <a href="https://wa.me/553135866673" style="display: inline-block; background-color: #1A1310; color: #FAF5E8; padding: 14px 22px; border-radius: 999px; ${FONT_SANS} font-size: 13px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; text-decoration: none; border: 1px solid transparent;">Falar com o Jon</a>
  </div>

  <hr style="border: 0; border-top: 1px solid rgba(26, 19, 16, 0.14); margin: 32px 0;" />
  <div style="margin-top: 36px;">
    <div style="${FONT_SERIF_ITALIC} font-size: 30px; line-height: 1; color: #6E2F18;">Jon</div>
  </div>
  <p style="${FONT_SANS} font-size: 14px; line-height: 1.65; color: #6B5A4B; margin: 12px 0 0; max-width: 52ch;">
    <strong style="color: #1A1310; font-weight: 600;">Studio do Jon</strong><br />
    Especialista em corte para cabelos ondulados, cacheados e crespos com foco em visagismo em Belo Horizonte.
  </p>
  <p style="${FONT_MONO} font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase; color: #6B5A4B; margin: 12px 0 0;">
    @ojonquecortou · ojonquecortou.com.br/agendar
  </p>
  <div style="height: 48px;"></div>
</div>
${getBrandFooter('#EFE5D2', '#1A1310', 'rgba(26, 19, 16, 0.14)')}
`;

const d21 = `
<div style="background-color: #FAF5E8; padding: 56px 56px 48px; color: #1A1310; ${FONT_SANS}">
  ${getBrandHeader('#FAF5E8', '#1A1310', '#1A1310')}

  <span style="${FONT_MONO} font-size: 10.5px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: #6B5A4B;">
    <span style="display: inline-block; width: 18px; height: 1px; background-color: #6B5A4B; vertical-align: middle; margin-right: 10px; opacity: 0.6;"></span>
    Três semanas
  </span>
  <h1 style="${FONT_SERIF} font-weight: 400; font-size: 64px; letter-spacing: -0.018em; line-height: 1.1; color: #1A1310; margin: 20px 0 0; max-width: 12ch;">
    Agora vem a <span style="${FONT_SERIF_ITALIC} font-weight: 400; color: #6E2F18;">parte boa.</span>
  </h1>

  <p style="${FONT_SANS} font-size: 17px; line-height: 1.55; color: #1A1310; margin: 28px 0 0; max-width: 46ch;">
    É aqui que o corte mostra tudo o que ele tem.
  </p>

  <p style="${FONT_SANS} font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 20px 0 0; max-width: 54ch;">
    O fio já encontrou o padrão, o peso tá certo, o cacho tá definido do jeito que eu projetei na <em style="${FONT_SERIF_ITALIC} color: #6E2F18;">leitura de fio</em>.
  </p>

  <!-- Timeline Table (bulletproof for email clients) -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 32px 0; border-top: 1px solid rgba(26, 19, 16, 0.14); border-bottom: 1px solid rgba(26, 19, 16, 0.14); padding: 28px 0 24px; ${FONT_SANS}">
    <tr>
      <td align="center" width="20%">
        <div style="${FONT_MONO} font-size: 9.5px; letter-spacing: 0.16em; text-transform: uppercase; color: #8A7866; margin-bottom: 8px;">Sem 1</div>
        <div style="width: 14px; height: 14px; border-radius: 50%; background-color: #8A7866; display: inline-block;"></div>
      </td>
      <td align="center" width="20%">
        <div style="${FONT_MONO} font-size: 9.5px; letter-spacing: 0.16em; text-transform: uppercase; color: #8A7866; margin-bottom: 8px;">Sem 2</div>
        <div style="width: 14px; height: 14px; border-radius: 50%; background-color: #8A7866; display: inline-block;"></div>
      </td>
      <td align="center" width="20%">
        <div style="${FONT_MONO} font-size: 9.5px; letter-spacing: 0.16em; text-transform: uppercase; color: #6E2F18; font-weight: bold; margin-bottom: 8px;">Sem 3</div>
        <div style="width: 18px; height: 18px; border-radius: 50%; background-color: #B05A2E; display: inline-block; box-shadow: 0 0 0 6px rgba(176,90,46,0.18);"></div>
      </td>
      <td align="center" width="20%">
        <div style="${FONT_MONO} font-size: 9.5px; letter-spacing: 0.16em; text-transform: uppercase; color: #8A7866; margin-bottom: 8px;">Sem 6</div>
        <div style="width: 14px; height: 14px; border-radius: 50%; background-color: #FAF5E8; border: 1px dashed rgba(26, 19, 16, 0.14); display: inline-block;"></div>
      </td>
      <td align="center" width="20%">
        <div style="${FONT_MONO} font-size: 9.5px; letter-spacing: 0.16em; text-transform: uppercase; color: #8A7866; margin-bottom: 8px;">Sem 8</div>
        <div style="width: 14px; height: 14px; border-radius: 50%; background-color: #FAF5E8; border: 1px dashed rgba(26, 19, 16, 0.14); display: inline-block;"></div>
      </td>
    </tr>
  </table>

  <p style="${FONT_SANS} font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 28px 0 0; max-width: 54ch;">
    Aproveita essa fase — é o <strong>pico</strong>.
  </p>

  <hr style="border: 0; border-top: 1px solid rgba(26, 19, 16, 0.14); margin: 32px 0;" />

  <span style="${FONT_MONO} font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase; color: #6B5A4B;">Sobre a janela</span>
  <p style="${FONT_SANS} font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 12px 0 0; max-width: 54ch;">
    A partir da semana <strong>6 a 8</strong>, o fio começa a perder a forma. Não porque cresceu demais — porque o ângulo do corte começa a trabalhar <em style="${FONT_SERIF_ITALIC} color: #6E2F18;">contra</em> você.
  </p>
  <p style="${FONT_SANS} font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 12px 0 0; max-width: 54ch;">
    A manutenção na hora certa é o que faz a diferença entre um corte que dura e um corte que desanda.
  </p>

  <div style="margin-top: 28px;">
    <a href="https://ojonquecortou.com.br/agendar" style="display: inline-block; background-color: #B05A2E; color: #FAF5E8; padding: 14px 22px; border-radius: 999px; ${FONT_SANS} font-size: 13px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; text-decoration: none; border: 1px solid transparent;">Agendar meu próximo atendimento</a>
  </div>

  <hr style="border: 0; border-top: 1px solid rgba(26, 19, 16, 0.14); margin: 32px 0;" />
  <div style="margin-top: 36px;">
    <div style="${FONT_SERIF_ITALIC} font-size: 30px; line-height: 1; color: #6E2F18;">Jon</div>
  </div>
  <p style="${FONT_SANS} font-size: 14px; line-height: 1.65; color: #6B5A4B; margin: 12px 0 0; max-width: 52ch;">
    <strong style="color: #1A1310; font-weight: 600;">Studio do Jon</strong><br />
    Especialista em corte para cabelos ondulados, cacheados e crespos com foco em visagismo em Belo Horizonte.
  </p>
  <p style="${FONT_MONO} font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase; color: #6B5A4B; margin: 12px 0 0;">
    @ojonquecortou · ojonquecortou.com.br/agendar
  </p>
  <div style="height: 48px;"></div>
</div>
${getBrandFooter('#EFE5D2', '#1A1310', 'rgba(26, 19, 16, 0.14)')}
`;

const d35 = `
<div style="background-color: #1A1310; padding: 56px 56px 48px; color: #FAF5E8; ${FONT_SANS}">
  ${getBrandHeaderDark()}

  <span style="${FONT_MONO} font-size: 10.5px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(245, 237, 219, 0.62);">
    <span style="display: inline-block; width: 18px; height: 1px; background-color: rgba(245, 237, 219, 0.62); vertical-align: middle; margin-right: 10px; opacity: 0.6;"></span>
    Faz cinco semanas
  </span>
  <h1 style="${FONT_SERIF} font-weight: 400; font-size: 64px; letter-spacing: -0.018em; line-height: 1.1; color: #FAF5E8; margin: 20px 0 0; max-width: 12ch;">
    Chegou <span style="${FONT_SERIF_ITALIC} font-weight: 400; color: #C97B49;">a hora.</span>
  </h1>

  <p style="${FONT_SANS} font-size: 17px; line-height: 1.55; color: rgba(245, 237, 219, 0.78); margin: 28px 0 0; max-width: 46ch;">
    Esta é exatamente a janela certa para retornar.
  </p>

  <hr style="border: 0; border-top: 1px solid rgba(245, 237, 219, 0.14); margin: 32px 0;" />

  <!-- Grid Table Replacement -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 28px 0; ${FONT_SANS}">
    <tr>
      <td width="50%" valign="top" style="padding-right: 24px; border-right: 1px solid rgba(245,237,219,0.14);">
        <div style="${FONT_MONO} font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(245, 237, 219, 0.55);">Se você voltar agora</div>
        <p style="${FONT_SANS} font-size: 15px; line-height: 1.65; color: rgba(245, 237, 219, 0.85); margin: 12px 0 0 0;">
          O fio ainda tem a <em style="${FONT_SERIF_ITALIC} color: #C97B49;">memória</em> do corte anterior. Eu consigo trabalhar a continuidade — ajustar o que precisa, evoluir o que já tá bom.
        </p>
        <p style="${FONT_SANS} font-size: 15px; line-height: 1.65; color: rgba(245, 237, 219, 0.85); margin: 12px 0 0 0;">
          Atendimento mais preciso, mais rápido, melhor resultado.
        </p>
      </td>
      <td width="50%" valign="top" style="padding-left: 24px;">
        <div style="${FONT_MONO} font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(245, 237, 219, 0.55);">Se você esperar demais</div>
        <p style="${FONT_SANS} font-size: 15px; line-height: 1.65; color: rgba(245, 237, 219, 0.55); margin: 12px 0 0 0;">
          O fio perde a referência. O próximo atendimento começa quase do zero.
        </p>
      </td>
    </tr>
  </table>

  <hr style="border: 0; border-top: 1px solid rgba(245, 237, 219, 0.14); margin: 32px 0;" />

  <p style="${FONT_SANS} font-size: 15.5px; line-height: 1.65; color: rgba(245, 237, 219, 0.85); margin: 0; max-width: 54ch;">
    A agenda está abrindo. Se quiser garantir o seu horário:
  </p>

  <div style="margin-top: 28px;">
    <a href="https://ojonquecortou.com.br/agendar" style="display: inline-block; background-color: #B05A2E; color: #FAF5E8; padding: 14px 22px; border-radius: 999px; ${FONT_SANS} font-size: 13px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; text-decoration: none; border: 1px solid transparent; margin-right: 10px;">Quero agendar meu horário</a>
    <a href="https://wa.me/553135866673" style="display: inline-block; background-color: transparent; color: #FAF5E8; padding: 14px 22px; border-radius: 999px; ${FONT_SANS} font-size: 13px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; text-decoration: none; border: 1px solid rgba(245, 237, 219, 0.25);">Falar antes de marcar</a>
  </div>

  <hr style="border: 0; border-top: 1px solid rgba(245, 237, 219, 0.14); margin: 32px 0;" />
  <div style="margin-top: 36px;">
    <div style="${FONT_SERIF_ITALIC} font-size: 30px; line-height: 1; color: #C97B49;">Jon</div>
  </div>
  <p style="${FONT_SANS} font-size: 14px; line-height: 1.65; color: rgba(245, 237, 219, 0.65); margin: 12px 0 0; max-width: 52ch;">
    <strong style="color: #FAF5E8; font-weight: 600;">Studio do Jon</strong><br />
    Especialista em corte para cabelos ondulados, cacheados e crespos com foco em visagismo em Belo Horizonte.
  </p>
  <p style="${FONT_MONO} font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(245, 237, 219, 0.55); margin: 12px 0 0;">
    @ojonquecortou · ojonquecortou.com.br/agendar
  </p>
  <div style="height: 48px;"></div>
</div>
${getBrandFooter('#1A1310', '#FAF5E8', 'rgba(245, 237, 219, 0.14)')}
`;

const d60 = `
<div style="background-color: #F5EDDB; padding: 56px 56px 48px; color: #1A1310; ${FONT_SANS}">
  ${getBrandHeader('#F5EDDB', '#1A1310', '#1A1310')}

  <span style="${FONT_MONO} font-size: 10.5px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: #6B5A4B;">
    <span style="display: inline-block; width: 18px; height: 1px; background-color: #6B5A4B; vertical-align: middle; margin-right: 10px; opacity: 0.6;"></span>
    Uma coisa que percebi
  </span>
  <h1 style="${FONT_SERIF} font-weight: 400; font-size: 44px; letter-spacing: -0.018em; line-height: 1.1; color: #1A1310; margin: 20px 0 0; max-width: 16ch;">
    Não é sobre <span style="${FONT_SERIF_ITALIC} font-weight: 400; color: #6E2F18;">o corte.</span><br />
    É sobre o que vem antes dele.
  </h1>

  <hr style="border: 0; border-top: 1px solid rgba(26, 19, 16, 0.14); margin: 32px 0;" />

  <p style="${FONT_SANS} font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 0; max-width: 54ch;">
    A maioria dos problemas de resultado que vejo no Studio não aconteceu na hora do corte.
  </p>
  <p style="${FONT_SANS} font-size: 22px; line-height: 1.35; color: #1A1310; ${FONT_SERIF_ITALIC} margin: 12px 0 0; max-width: 54ch;">
    Aconteceu antes.
  </p>

  <p style="${FONT_SANS} font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 28px 0 0; max-width: 54ch;">
    Antes de qualquer tesoura tocar no fio, eu faço uma <strong style="color: #1A1310; font-weight: 600;">leitura</strong>. Análise a seco, padrão de queda, histórico químico, diagnóstico de couro cabeludo. Só depois que eu entendo o fio de verdade é que decido como cortar.
  </p>
  <p style="${FONT_SANS} font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 12px 0 0; max-width: 54ch;">
    Parece óbvio. Mas é raro. A maioria dos cabeleireiros <em style="${FONT_SERIF_ITALIC} color: #6E2F18;">pula</em> essa etapa.
  </p>

  <div style="background-color: #FAF5E8; border: 1px solid rgba(26, 19, 16, 0.14); border-left: 3px solid #B05A2E; border-radius: 4px; padding: 22px 26px; margin: 28px 0;">
    <div style="${FONT_MONO} font-size: 10.5px; letter-spacing: 0.18em; text-transform: uppercase; color: #6E2F18; margin-bottom: 10px; font-weight: bold;">No seu caso</div>
    <p style="${FONT_SANS} font-size: 16px; line-height: 1.6; color: #2E241E; margin: 0;">
      Quando você foi atendida, fizemos essa leitura juntos. Ela ainda diz muito sobre o seu fio — mas o fio <strong style="color: #1A1310; font-weight: 600;">muda</strong> com o tempo. Cada lavagem, cada produto, cada processo deixa uma marca.
    </p>
  </div>

  <p style="${FONT_SANS} font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 28px 0 0; max-width: 54ch;">
    Se você tiver curiosidade pra saber como o seu fio tá hoje, me chama. Posso fazer uma <em style="${FONT_SERIF_ITALIC} color: #6E2F18;">nova leitura</em> antes de qualquer decisão de corte.
  </p>

  <div style="margin-top: 28px;">
    <a href="https://wa.me/553135866673" style="display: inline-block; background-color: #1A1310; color: #F5EDDB; padding: 14px 22px; border-radius: 999px; ${FONT_SANS} font-size: 13px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; text-decoration: none; border: 1px solid transparent;">Quero marcar uma consulta</a>
  </div>

  <hr style="border: 0; border-top: 1px solid rgba(26, 19, 16, 0.14); margin: 32px 0;" />
  <div style="margin-top: 36px;">
    <div style="${FONT_SERIF_ITALIC} font-size: 30px; line-height: 1; color: #6E2F18;">Jon</div>
  </div>
  <p style="${FONT_SANS} font-size: 14px; line-height: 1.65; color: #6B5A4B; margin: 12px 0 0; max-width: 52ch;">
    <strong style="color: #1A1310; font-weight: 600;">Studio do Jon</strong><br />
    Especialista em corte para cabelos ondulados, cacheados e crespos com foco em visagismo em Belo Horizonte.
  </p>
  <p style="${FONT_MONO} font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase; color: #6B5A4B; margin: 12px 0 0;">
    @ojonquecortou · ojonquecortou.com.br/agendar
  </p>
  <div style="height: 48px;"></div>
</div>
${getBrandFooter('#EFE5D2', '#1A1310', 'rgba(26, 19, 16, 0.14)')}
`;

const d90 = `
<div style="background-color: #FAF5E8; padding: 56px 56px 48px; color: #1A1310; ${FONT_SANS}">
  ${getBrandHeader('#FAF5E8', '#1A1310', '#1A1310')}

  <span style="${FONT_MONO} font-size: 10.5px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: #6B5A4B;">
    <span style="display: inline-block; width: 18px; height: 1px; background-color: #6B5A4B; vertical-align: middle; margin-right: 10px; opacity: 0.6;"></span>
    Três meses
  </span>
  <h1 style="${FONT_SERIF} font-weight: 400; font-size: 44px; letter-spacing: -0.018em; line-height: 1.1; color: #1A1310; margin: 20px 0 0; max-width: 16ch;">
    Seu fio tá te dizendo algo.<br /><span style="${FONT_SERIF_ITALIC} font-weight: 400; color: #6E2F18;">Você tá ouvindo?</span>
  </h1>

  <hr style="border: 0; border-top: 1px solid rgba(26, 19, 16, 0.14); margin: 32px 0;" />

  <p style="${FONT_SANS} font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 28px 0 0; max-width: 54ch;">
    Tem uma coisa que quase toda cacheada interpreta errado.
  </p>
  <p style="${FONT_SANS} font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 12px 0 0; max-width: 54ch;">
    Quando o cabelo começa a parecer "sem graça", difícil de finalizar, com menos definição do que antes — a primeira conclusão é que o produto parou de funcionar. Ou que o cabelo "mudou".
  </p>
  <p style="${FONT_SANS} font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 12px 0 0; max-width: 54ch;">
    Não mudou. O que aconteceu foi mais simples: o fio cresceu e perdeu a referência do corte.
  </p>

  <p style="${FONT_SANS} font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 28px 0 0; max-width: 54ch;">
    Em 90 dias, o cacho cresce em torno de 3 centímetros. Pra fio liso, isso é só comprimento. Pra fio cacheado, é o suficiente pra descompensar ângulo, peso e distribuição. O corte que eu projetei pra você foi calculado pra um comprimento específico — esse comprimento não existe mais.
  </p>

  <div style="background-color: #F5EDDB; border: 1px solid rgba(26, 19, 16, 0.14); border-left: 3px solid #B05A2E; border-radius: 4px; padding: 22px 26px; margin: 28px 0;">
    <div style="${FONT_MONO} font-size: 10.5px; letter-spacing: 0.18em; text-transform: uppercase; color: #6E2F18; margin-bottom: 10px; font-weight: bold;">A consequência</div>
    <p style="${FONT_SANS} font-size: 16px; line-height: 1.6; color: #2E241E; margin: 0;">
      O resultado aparece na finalização: você faz tudo igual, mas o cacho não fecha do mesmo jeito. Parece falha sua. Não é.
    </p>
  </div>

  <p style="${FONT_SANS} font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 28px 0 0; max-width: 54ch;">
    Quando você volta agora, eu consigo trabalhar o fio com a memória do que foi feito. O atendimento é mais rápido, mais preciso, e o resultado retoma de onde parou — em vez de começar do zero.
  </p>

  <div style="margin-top: 28px;">
    <a href="https://ojonquecortou.com.br/agendar" style="display: inline-block; background-color: #1A1310; color: #FAF5E8; padding: 14px 22px; border-radius: 999px; ${FONT_SANS} font-size: 13px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; text-decoration: none; border: 1px solid transparent;">Quero agendar meu retorno →</a>
  </div>

  <hr style="border: 0; border-top: 1px solid rgba(26, 19, 16, 0.14); margin: 32px 0;" />
  <div style="margin-top: 36px;">
    <div style="${FONT_SERIF_ITALIC} font-size: 30px; line-height: 1; color: #6E2F18;">Jon</div>
  </div>
  <p style="${FONT_SANS} font-size: 14px; line-height: 1.65; color: #6B5A4B; margin: 12px 0 0; max-width: 52ch;">
    <strong style="color: #1A1310; font-weight: 600;">Studio do Jon</strong><br />
    Especialista em corte para cabelos ondulados, cacheados e crespos com foco em visagismo em Belo Horizonte.
  </p>
  <p style="${FONT_MONO} font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase; color: #6B5A4B; margin: 12px 0 0;">
    @ojonquecortou · ojonquecortou.com.br/agendar
  </p>
  <div style="height: 48px;"></div>
</div>
${getBrandFooter('#EFE5D2', '#1A1310', 'rgba(26, 19, 16, 0.14)')}
`;

const aniversario = `
<div style="background-color: #FAF5E8; padding: 56px 56px 48px; color: #1A1310; ${FONT_SANS}">
  ${getBrandHeader('#FAF5E8', '#1A1310', '#1A1310')}

  <span style="${FONT_MONO} font-size: 10.5px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: #6B5A4B;">
    <span style="display: inline-block; width: 18px; height: 1px; background-color: #6B5A4B; vertical-align: middle; margin-right: 10px; opacity: 0.6;"></span>
    Hoje é seu dia
  </span>
  <h1 style="${FONT_SERIF} font-weight: 400; font-size: 64px; letter-spacing: -0.018em; line-height: 1.1; color: #1A1310; margin: 20px 0 0; max-width: 14ch;">
    Parabéns, <span style="${FONT_SERIF_ITALIC} font-weight: 400; color: #6E2F18;">{nome}.</span>
  </h1>

  <hr style="border: 0; border-top: 1px solid rgba(26, 19, 16, 0.14); margin: 32px 0;" />

  <p style="${FONT_SANS} font-size: 22px; line-height: 1.4; color: #1A1310; ${FONT_SERIF_ITALIC} margin: 28px 0 0; max-width: 50ch;">
    [Nome], parabéns!<br>
    Aniversário com o cabelo bem lido é diferente. Você sabe disso.<br><br>
    Feliz aniversário. Se quiser passar pelo Studio esse mês: [link de agendamento]<br>
    — Jon
  </p>

  <hr style="border: 0; border-top: 1px solid rgba(26, 19, 16, 0.14); margin: 32px 0;" />

  <div style="margin-top: 28px;">
    <a href="https://ojonquecortou.com.br/agendar" style="display: inline-block; background-color: #B05A2E; color: #FAF5E8; padding: 14px 22px; border-radius: 999px; ${FONT_SANS} font-size: 13px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; text-decoration: none; border: 1px solid transparent;">Ver agenda do Studio</a>
  </div>

  <hr style="border: 0; border-top: 1px solid rgba(26, 19, 16, 0.14); margin: 32px 0;" />
  <div style="margin-top: 36px;">
    <div style="${FONT_SERIF_ITALIC} font-size: 30px; line-height: 1; color: #6E2F18;">Jon</div>
  </div>
  <p style="${FONT_SANS} font-size: 14px; line-height: 1.65; color: #6B5A4B; margin: 12px 0 0; max-width: 52ch;">
    <strong style="color: #1A1310; font-weight: 600;">Studio do Jon</strong><br />
    Especialista em corte para cabelos ondulados, cacheados e crespos com foco em visagismo em Belo Horizonte.
  </p>
  <p style="${FONT_MONO} font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase; color: #6B5A4B; margin: 12px 0 0;">
    @ojonquecortou · ojonquecortou.com.br/agendar
  </p>
  <div style="height: 48px;"></div>
</div>
${getBrandFooter('#EFE5D2', '#1A1310', 'rgba(26, 19, 16, 0.14)')}
`;

const admin_solicitacao_recebida = `
<div style="background-color: #F5EDDB; padding: 56px 56px 48px; color: #1A1310; ${FONT_SANS}">
  ${getBrandHeader('#F5EDDB', '#1A1310', '#1A1310')}

  <span style="${FONT_MONO} font-size: 10.5px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: #6B5A4B;">Aviso de Agendamento</span>
  <h1 style="${FONT_SERIF} font-weight: 400; font-size: 44px; letter-spacing: -0.018em; line-height: 1.1; color: #1A1310; margin: 20px 0 0; max-width: 16ch;">
    Nova <span style="${FONT_SERIF_ITALIC} font-weight: 400; color: #6E2F18;">Solicitação</span>
  </h1>

  <p style="${FONT_SANS} font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 28px 0 0; max-width: 54ch;">
    Olá Jon, uma nova solicitação de agendamento online foi recebida e aguarda sua análise no painel.
  </p>

  <div style="background-color: #FAF5E8; border: 1px solid rgba(26, 19, 16, 0.14); border-radius: 4px; padding: 28px 28px 24px; margin: 32px 0;">
    <div style="${FONT_MONO} font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #6B5A4B; margin-bottom: 10px;">Detalhes da solicitação</div>
    <p style="${FONT_SERIF} font-size: 36px; line-height: 1.05; letter-spacing: -0.018em; margin: 0 0 6px;"><span style="${FONT_SERIF_ITALIC} color: #6E2F18;">[Data]</span> às [Horário]</p>
    
    <!-- Info Table -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px; border-top: 1px solid rgba(26, 19, 16, 0.14); padding-top: 18px;">
      <tr>
        <td width="50%" valign="top">
          <div style="${FONT_MONO} font-size: 9.5px; letter-spacing: 0.18em; text-transform: uppercase; color: #6B5A4B; margin-bottom: 4px;">Cliente</div>
          <div style="${FONT_SERIF} font-size: 18px; line-height: 1.2; color: #1A1310;">[Nome do Cliente]</div>
        </td>
        <td width="50%" valign="top">
          <div style="${FONT_MONO} font-size: 9.5px; letter-spacing: 0.18em; text-transform: uppercase; color: #6B5A4B; margin-bottom: 4px;">E-mail</div>
          <div style="${FONT_SERIF} font-size: 18px; line-height: 1.2; color: #1A1310;">[E-mail]</div>
        </td>
      </tr>
      <tr style="height: 15px;"><td></td><td></td></tr>
      <tr>
        <td width="50%" valign="top">
          <div style="${FONT_MONO} font-size: 9.5px; letter-spacing: 0.18em; text-transform: uppercase; color: #6B5A4B; margin-bottom: 4px;">Serviço</div>
          <div style="${FONT_SERIF} font-size: 18px; line-height: 1.2; color: #1A1310;">[Serviço]</div>
        </td>
        <td width="50%" valign="top">
          <div style="${FONT_MONO} font-size: 9.5px; letter-spacing: 0.18em; text-transform: uppercase; color: #6B5A4B; margin-bottom: 4px;">Telefone</div>
          <div style="${FONT_SERIF} font-size: 18px; line-height: 1.2; color: #1A1310;">[Telefone]</div>
        </td>
      </tr>
    </table>
  </div>

  <div style="margin-top: 28px;">
    <a href="https://ojonquecortou.com.br/admin/bookings" style="display: inline-block; background-color: #1A1310; color: #F5EDDB; padding: 14px 22px; border-radius: 999px; ${FONT_SANS} font-size: 13px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; text-decoration: none; border: 1px solid transparent;">Ver no Painel →</a>
  </div>

  <hr style="border: 0; border-top: 1px solid rgba(26, 19, 16, 0.14); margin: 32px 0;" />
  <div style="margin-top: 36px;">
    <div style="${FONT_SERIF_ITALIC} font-size: 30px; line-height: 1; color: #6E2F18;">Sistema</div>
  </div>
  <p style="${FONT_SANS} font-size: 14px; line-height: 1.65; color: #6B5A4B; margin: 12px 0 0; max-width: 52ch;">
    <strong style="color: #1A1310; font-weight: 600;">Studio do Jon</strong><br />
    Notificação automática do sistema de agendamentos.
  </p>
  <div style="height: 48px;"></div>
</div>
${getBrandFooter('#EFE5D2', '#1A1310', 'rgba(26, 19, 16, 0.14)')}
`;

const admin_horario_confirmado = `
<div style="background-color: #FAF5E8; padding: 56px 56px 48px; color: #1A1310; ${FONT_SANS}">
  ${getBrandHeader('#FAF5E8', '#1A1310', '#1A1310')}

  <span style="${FONT_MONO} font-size: 10.5px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: #6B5A4B;">Aviso de Confirmação</span>
  <h1 style="${FONT_SERIF} font-weight: 400; font-size: 44px; letter-spacing: -0.018em; line-height: 1.1; color: #1A1310; margin: 20px 0 0; max-width: 16ch;">
    Agendamento <span style="${FONT_SERIF_ITALIC} font-weight: 400; color: #6E2F18;">Confirmado</span>
  </h1>

  <p style="${FONT_SANS} font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 28px 0 0; max-width: 54ch;">
    Olá Jon, um agendamento foi confirmado ou criado no sistema.
  </p>

  <div style="background-color: #F5EDDB; border: 1px solid rgba(26, 19, 16, 0.14); border-radius: 4px; padding: 28px 28px 24px; margin: 32px 0;">
    <div style="${FONT_MONO} font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #6B5A4B; margin-bottom: 10px;">Agendamento</div>
    <p style="${FONT_SERIF} font-size: 36px; line-height: 1.05; letter-spacing: -0.018em; margin: 0 0 6px;"><span style="${FONT_SERIF_ITALIC} color: #6E2F18;">[Data]</span> às [Horário]</p>
    
    <!-- Info Table -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px; border-top: 1px solid rgba(26, 19, 16, 0.14); padding-top: 18px;">
      <tr>
        <td width="50%" valign="top">
          <div style="${FONT_MONO} font-size: 9.5px; letter-spacing: 0.18em; text-transform: uppercase; color: #6B5A4B; margin-bottom: 4px;">Cliente</div>
          <div style="${FONT_SERIF} font-size: 18px; line-height: 1.2; color: #1A1310;">[Nome do Cliente]</div>
        </td>
        <td width="50%" valign="top">
          <div style="${FONT_MONO} font-size: 9.5px; letter-spacing: 0.18em; text-transform: uppercase; color: #6B5A4B; margin-bottom: 4px;">Serviço</div>
          <div style="${FONT_SERIF} font-size: 18px; line-height: 1.2; color: #1A1310;">[Serviço]</div>
        </td>
      </tr>
    </table>
  </div>

  <div style="margin-top: 28px;">
    <a href="https://ojonquecortou.com.br/admin/bookings" style="display: inline-block; background-color: #1A1310; color: #FAF5E8; padding: 14px 22px; border-radius: 999px; ${FONT_SANS} font-size: 13px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; text-decoration: none; border: 1px solid transparent;">Ver no Painel →</a>
  </div>

  <hr style="border: 0; border-top: 1px solid rgba(26, 19, 16, 0.14); margin: 32px 0;" />
  <div style="margin-top: 36px;">
    <div style="${FONT_SERIF_ITALIC} font-size: 30px; line-height: 1; color: #6E2F18;">Sistema</div>
  </div>
  <p style="${FONT_SANS} font-size: 14px; line-height: 1.65; color: #6B5A4B; margin: 12px 0 0; max-width: 52ch;">
    <strong style="color: #1A1310; font-weight: 600;">Studio do Jon</strong><br />
    Notificação automática do sistema de agendamentos.
  </p>
  <div style="height: 48px;"></div>
</div>
${getBrandFooter('#EFE5D2', '#1A1310', 'rgba(26, 19, 16, 0.14)')}
`;

const fileContent = `export const EMAIL_CSS = \`${EMAIL_CSS}\`;

export const HTML_TEMPLATES = {
  'd1': \`${d1}\`,
  'd7': \`${d7}\`,
  'd21': \`${d21}\`,
  'd35': \`${d35}\`,
  'd60': \`${d60}\`,
  'd90': \`${d90}\`,
  'aniversario': \`${aniversario}\`
};

export const ADMIN_HTML_TEMPLATES = {
  admin_solicitacao_recebida: \`${admin_solicitacao_recebida}\`,
  admin_horario_confirmado: \`${admin_horario_confirmado}\`
};
`;

fs.writeFileSync(emailTemplatesPath, fileContent, 'utf8');
console.log("Successfully generated fully inlined emailTemplates.js!");
