const fs = require('fs');
const path = require('path');

function makeEmailTemplate({ subject, eyebrow, title, contentParagraphs, ctaLink, ctaText }) {
  const ctaBlock = ctaLink && ctaText ? `
              <!-- CTA BUTTON -->
              <table cellpadding="0" cellspacing="0" border="0" style="margin-top: 32px; margin-bottom: 16px;">
                <tr>
                  <td>
                    <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: separate !important; border-radius: 999px; background-color: #1A1310;">
                      <tr>
                        <td align="center" valign="middle" style="padding: 14px 28px;">
                          <a href="${ctaLink}" target="_blank" style="font-family: 'Manrope', Arial, sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: #FAF5E8 !important; text-decoration: none; display: inline-block;">${ctaText}</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
  ` : '';

  const paragraphsHtml = contentParagraphs.map(p => `              <p style="margin: 0 0 16px 0; font-family: 'Manrope', Arial, sans-serif; font-size: 15px; line-height: 1.65; color: #2E241E; max-width: 54ch;">${p}</p>`).join('\n');

  return `<div style="background-color: #EFE5D2; font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1A1310; -webkit-font-smoothing: antialiased; margin: 0; padding: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#EFE5D2" style="background-color: #EFE5D2; table-layout: fixed; width: 100%; margin: 0; padding: 0;">
    <tr>
      <td align="center" valign="top" style="padding: 40px 10px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #FAF5E8; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 48px rgba(26, 19, 16, 0.08), 0 1px 3px rgba(26, 19, 16, 0.04); border: 1px solid rgba(26, 19, 16, 0.08);">
          <tr>
            <td style="padding: 56px 48px; background-color: #FAF5E8;">
              
              <!-- HEADER -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom: 1px solid rgba(26, 19, 16, 0.08); padding-bottom: 24px; margin-bottom: 48px;">
                <tr>
                  <td align="left" valign="middle">
                    <span style="display: inline-block; width: 32px; height: 32px; border-radius: 50%; background: #1A1310; color: #FAF5E8; text-align: center; line-height: 32px; font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 18px; margin-right: 12px; vertical-align: middle;">J</span>
                    <span style="font-family: 'DM Serif Display', Georgia, serif; font-size: 18px; letter-spacing: -0.01em; color: #1A1310; vertical-align: middle; font-weight: 400;">Studio do Jon</span>
                  </td>
                </tr>
              </table>

              <!-- TAG / EYEBROW -->
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right: 10px; font-size: 0; line-height: 0;">
                    <div style="width: 18px; height: 1px; background-color: #8A7866; display: inline-block; vertical-align: middle;"></div>
                  </td>
                  <td>
                    <span style="font-family: 'Manrope', Arial, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #8A7866; vertical-align: middle;">${eyebrow}</span>
                  </td>
                </tr>
              </table>

              <!-- TITLE -->
              <h1 style="font-family: 'DM Serif Display', Georgia, serif; font-weight: 400; font-size: 38px; letter-spacing: -0.018em; line-height: 1.15; color: #1A1310; margin: 24px 0 0 0;">
                ${title}
              </h1>

              <!-- CONTENT -->
              <div style="margin-top: 32px; font-family: 'Manrope', Arial, sans-serif;">
${paragraphsHtml}
              </div>

${ctaBlock}

              <!-- SIGNATURE -->
              <hr style="border: 0; border-top: 1px solid rgba(26, 19, 16, 0.08); margin: 48px 0 32px;" />
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 32px; line-height: 1; color: #B05A2E;">
                    Jon
                  </td>
                </tr>
              </table>
              <p style="font-family: 'Manrope', Arial, sans-serif; font-size: 14px; line-height: 1.65; color: #6B5A4B; margin: 12px 0 0 0; max-width: 52ch;">
                <strong style="color: #1A1310; font-weight: 600;">Studio do Jon</strong><br />
                Especialista em corte para cabelos ondulados, cacheados e crespos com foco em visagismo em Belo Horizonte.
              </p>
              
            </td>
          </tr>
          <!-- FOOTER -->
          <tr>
            <td style="background-color: #1A1310; padding: 40px 48px; border-top: 1px solid rgba(250, 245, 232, 0.1);">
              <div style="font-family: 'DM Serif Display', Georgia, serif; font-size: 24px; line-height: 1.2; letter-spacing: -0.015em; color: #FAF5E8; margin: 0 0 12px 0;">
                Studio do Jon <span style="font-family: 'Instrument Serif', Georgia, serif; font-style: italic; color: #B05A2E; display: block; margin-top: 6px;">— corte com leitura.</span>
              </div>
              <p style="font-family: 'Manrope', Arial, sans-serif; font-size: 13px; color: rgba(250, 245, 232, 0.6); line-height: 1.6; margin: 0 0 24px 0;">
                Rua Francisco Ovídio, 184 &middot; Caiçara<br>Belo Horizonte &middot; MG &middot; 30000-000<br>Quarta a Sábado &middot; 9h às 19h
              </p>
              <div style="font-family: 'Manrope', Arial, sans-serif; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(250, 245, 232, 0.4); border-top: 1px solid rgba(250, 245, 232, 0.1); padding-top: 20px;">
                &copy; 2026 Studio do Jon &middot; @ojonquecortou
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</div>`;
}

async function run() {
  const templatesPath = path.resolve('C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/src/utils/emailTemplates.js');
  const mod = await import(`file://${templatesPath}`);

  // Refactored contents with high-conversion psychology-first copywriting
  const newTemplates = {
    d1: makeEmailTemplate({
      subject: '{nome}, como tá o fio hoje?',
      eyebrow: '24 horas pós-corte',
      title: "Não se assuste se o cacho <span style='font-family: \"Instrument Serif\", Georgia, serif; font-style: italic; color: #B05A2E;'>parecer diferente</span> hoje.",
      contentParagraphs: [
        "Oi {nome},",
        "Você deve ter acordado hoje e notado que o seu cabelo não está exatamente igual a quando saiu daqui do Studio ontem. Eu estou te mandando esta mensagem pra te dizer uma coisa importante: <strong>está tudo certo.</strong>",
        "O primeiro dia pós-corte não é o dia do caimento perfeito. É o dia em que o seu fio está entendendo a nova distribuição de peso e a nova distribuição da massa.",
        "Não caia na tentação de tentar controlar ou forçar uma forma hoje. Apenas umedeça levemente com água se sentir necessidade, sinta o movimento e dê alguns dias para o seu cabelo assentar na nova forma."
      ]
    }),
    
    d7: makeEmailTemplate({
      subject: 'A semana mais importante do seu cabelo (e quase ninguém fala sobre isso)',
      eyebrow: '1 semana pós-corte',
      title: "É agora que o cacho encontra o <span style='font-family: \"Instrument Serif\", Georgia, serif; font-style: italic; color: #B05A2E;'>ângulo certo.</span>",
      contentParagraphs: [
        "Oi {nome}, 7 dias desde o seu corte.",
        "Você deve ter reparado que hoje o caimento e a definição parecem muito melhores do que no primeiro dia. Isso acontece porque a estrutura do corte finalmente 'assentou'.",
        "Depois de algumas lavagens em casa, a cutícula do fio estabiliza e o cabelo assume a forma real que desenhamos na leitura do fio. A finalização começa a ficar mais intuitiva e rápida a partir de agora.",
        "Aproveite essa leveza e o movimento natural do seu cabelo. Se tiver qualquer dúvida sobre qual finalizador usar nesse novo momento, é só me mandar uma mensagem por aqui."
      ]
    }),

    d21: makeEmailTemplate({
      subject: '3 semanas de corte novo. Agora vem a parte boa.',
      eyebrow: '3 semanas pós-corte',
      title: "O seu corte atingiu o <span style='font-family: \"Instrument Serif\", Georgia, serif; font-style: italic; color: #B05A2E;'>pico do caimento.</span>",
      contentParagraphs: [
        "Oi {nome},",
        "Se você olhar no espelho hoje, vai ver o seu cabelo na melhor fase dele. Com 3 semanas, as pontas estão seladas na angulação ideal e o volume encontrou o equilíbrio perfeito.",
        "Esta é a melhor fase do corte, onde ele exige quase nenhum esforço seu para ficar bonito e volumoso na medida certa.",
        "Aproveite as próximas semanas. Como o cabelo cresce continuamente, daqui a pouco a estrutura começará a pesar e ceder. Se quiser se antecipar e já garantir a sua próxima janela na agenda para manter esse movimento:"
      ],
      ctaLink: 'https://ojonquecortou.com.br/agendar?utm_source=email_d21&utm_medium=relationship_sequence&utm_campaign=pos_corte',
      ctaText: 'Garantir próximo horário'
    }),

    d35: makeEmailTemplate({
      subject: 'Um mês de corte (e o segredo para ele durar mais)',
      eyebrow: '1 mês pós-corte',
      title: "O segredo para a estrutura durar até o <span style='font-family: \"Instrument Serif\", Georgia, serif; font-style: italic; color: #B05A2E;'>3º mês.</span>",
      contentParagraphs: [
        "Oi {nome}, seu corte completou 1 mês.",
        "A partir de agora, o primeiro centímetro de crescimento começa a dar as caras, e o peso natural do cacho começa a descer lentamente para as pontas.",
        "A manutenção ideal é recomendada a cada 3 meses para não perdermos a estrutura e a harmonia que desenhamos.",
        "Lembrando que, <strong>retornando dentro da janela de até 3 meses, o seu corte de manutenção tem um valor especial de R$ 130.</strong>",
        "Ainda temos cerca de 2 meses até lá, mas como as vagas na agenda são concorridas, muitos clientes preferem deixar reservado desde já. Se quiser garantir o seu:"
      ],
      ctaLink: 'https://ojonquecortou.com.br/agendar?utm_source=email_d35&utm_medium=relationship_sequence&utm_campaign=pos_corte',
      ctaText: 'Agendar manutenção (R$ 130)'
    }),

    d60: makeEmailTemplate({
      subject: 'Falta 1 mês para a sua janela de manutenção',
      eyebrow: '2 meses pós-corte',
      title: "Falta <span style='font-family: \"Instrument Serif\", Georgia, serif; font-style: italic; color: #B05A2E;'>1 mês</span> para a sua janela.",
      contentParagraphs: [
        "Oi {nome}, tudo bem?",
        "Lembra da nossa 'Leitura do Fio' antes de iniciar o corte? O motivo de ele ter se mantido tão harmônico e prático nos últimos 60 dias é que planejamos o caimento pensando no crescimento semana a semana.",
        "Agora, aos 2 meses, o volume já mudou de lugar e a nuca começa a pesar um pouco. Falta exatamente 1 mês para a sua janela de manutenção especial (R$ 130) se encerrar.",
        "Que tal escolher o seu dia no mês que vem para devolver a forma e o movimento ideal aos seus cachos?"
      ],
      ctaLink: 'https://ojonquecortou.com.br/agendar?utm_source=email_d60&utm_medium=relationship_sequence&utm_campaign=pos_corte',
      ctaText: 'Ver dias disponíveis'
    }),

    d90: makeEmailTemplate({
      subject: 'Últimos dias do valor especial de manutenção, {nome}',
      eyebrow: '3 meses pós-corte',
      title: "A sua janela de 3 meses <span style='font-family: \"Instrument Serif\", Georgia, serif; font-style: italic; color: #B05A2E;'>vai fechar.</span>",
      contentParagraphs: [
        "Oi {nome},",
        "Seu cabelo provavelmente já está te dando sinais claros: frizz acumulado na raiz, definição que dura menos tempo no day after e aquele volume pesado acumulado nas pontas (o famoso formato pirâmide).",
        "Isso é perfeitamente natural. Com 90 dias, o crescimento já descompensou a estrutura original do corte.",
        "A sua janela de manutenção especial de R$ 130 está se encerrando em alguns dias. Vamos renovar esse corte, devolver o movimento e a leveza aos seus fios?"
      ],
      ctaLink: 'https://ojonquecortou.com.br/agendar?utm_source=email_d90&utm_medium=relationship_sequence&utm_campaign=pos_corte',
      ctaText: 'Renovar meu corte (R$ 130)'
    }),

    aniversario: makeEmailTemplate({
      subject: 'Seu aniversário tá chegando, {nome}',
      eyebrow: 'Parabéns',
      title: "Seu aniversário <span style='font-family: \"Instrument Serif\", Georgia, serif; font-style: italic; color: #B05A2E;'>tá chegando.</span>",
      contentParagraphs: [
        "Oi {nome},",
        "Daqui a alguns dias é o seu aniversário!",
        "Para comemorar seu novo ciclo, que tal passar pelo Studio para um momento de autocuidado? Entrar no seu dia especial com os cachos no formato perfeito, hidratados e com o corte impecável é a melhor forma de celebrar.",
        "Preparamos um horário especial para você nesta semana. Reserve o seu momento de celebração:"
      ],
      ctaLink: 'https://ojonquecortou.com.br/agendar?utm_source=email_birthday&utm_medium=birthday_campaign&utm_campaign=celebration',
      ctaText: 'Ver Agenda do Studio'
    })
  };

  // Merge the new templates with the original launch_e1, launch_e2, launch_e3
  const mergedTemplates = {
    ...newTemplates,
    launch_e1: mod.HTML_TEMPLATES.launch_e1,
    launch_e2: mod.HTML_TEMPLATES.launch_e2,
    launch_e3: mod.HTML_TEMPLATES.launch_e3
  };

  // Re-serialize the file src/utils/emailTemplates.js
  const outCode = `// Arquivo gerado automaticamente pelo script de design premium.
export const EMAIL_CSS = \`${mod.EMAIL_CSS.trim()}\`;

export const HTML_TEMPLATES = {
${Object.keys(mergedTemplates).map(k => `  ${k}: \`${mergedTemplates[k].replace(/`/g, '\\`').replace(/\${/g, '\\${')}\``).join(',\n\n')}
};

export const ADMIN_HTML_TEMPLATES = {
${Object.keys(mod.ADMIN_HTML_TEMPLATES).map(k => `  ${k}: \`${mod.ADMIN_HTML_TEMPLATES[k].replace(/`/g, '\\`').replace(/\${/g, '\\${')}\``).join(',\n\n')}
};
`;

  fs.writeFileSync(templatesPath, outCode, 'utf8');
  console.log('✅ emailTemplates.js written successfully!');
}

run().catch(console.error);
