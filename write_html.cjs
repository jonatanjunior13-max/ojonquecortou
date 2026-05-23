const fs = require('fs');

const d1 = `
<div class="mail-body warm">
  <div class="mail-mast">
    <div class="brand">
      <div class="mark">J</div>
      Studio do Jon
    </div>
    <div class="tag">D+1 · primeira noite</div>
  </div>

  <span class="m-eyebrow">24 horas depois</span>
  <h1 class="m-display m-h2 mt-20" style="max-width: 14ch;">
    {nome}, como tá o fio <span class="m-italic">hoje?</span>
  </h1>

  <p class="m-body mt-28" style="max-width: 54ch;">
    Ontem você saiu do Studio com o corte novo. Como tá se sentindo
    com ele hoje?
  </p>
  <p class="m-body mt-12" style="max-width: 54ch;">
    Os primeiros <strong>2–3 dias</strong> o cacho ainda tá encontrando
    o padrão. Normal ter um dia estranho no começo — não é o corte
    que ficou ruim. É o fio se reorganizando depois de perder peso.
  </p>

  <div class="m-takeaway">
    <div class="lbl">Essa semana</div>
    <p>
      Evita escova seca. Deixa o peso trabalhar sozinho. Quanto menos
      você manipular agora, <strong>mais rápido o padrão se define</strong>.
    </p>
  </div>

  <p class="m-body mt-28" style="max-width: 54ch;">
    Se surgir qualquer dúvida sobre finalização, me chama no WhatsApp
    ou no direct. Tô aqui.
  </p>

  <div class="m-btn-row mt-28">
    <a href="https://wa.me/553135866673" class="m-btn m-btn-primary">Falar com o Jon</a>
  </div>

  <hr class="m-rule" />
  <div class="m-signoff">
    <div class="sig-name">Jon</div>
  </div>
  <p class="m-body mt-12" style="max-width: 52ch; font-size: 14px; color: var(--muted);">
    <strong style="color: var(--ink);">Studio do Jon</strong><br />
    Especialista em corte para cabelos ondulados, cacheados e crespos<br />
    com foco em visagismo em Belo Horizonte.
  </p>
  <p class="m-small mt-12" style="color: var(--muted);">
    @ojonquecortou · ojonquecortou.com.br/agendar
  </p>
  <div style="height: 48px;"></div>
</div>
<div class="mail-footer">
  <div class="m-footer-grid">
    <div>
      <div class="m-footer-brand">Studio do Jon <span class="italic">— corte com leitura.</span></div>
      <p class="addr">Rua dos Cacheados, 218 · Caiçara<br>Belo Horizonte · MG · 30000-000<br>Quarta a Sábado · 9h às 19h</p>
    </div>
  </div>
  <div class="legal">© 2026 Studio do Jon</div>
</div>
`;

const d7 = `
<div class="mail-body cream">
  <div class="mail-mast">
    <div class="brand">
      <div class="mark">J</div>
      Studio do Jon
    </div>
    <div class="tag">D+7 · uma semana</div>
  </div>

  <span class="m-eyebrow">Sete dias</span>
  <h1 class="m-display m-h2 mt-20" style="max-width: 15ch;">
    A semana mais <span class="m-italic">importante</span> do seu cabelo.
  </h1>

  <p class="m-lead mt-28" style="max-width: 46ch;">
    E quase ninguém fala sobre isso.
  </p>

  <p class="m-body mt-28" style="max-width: 54ch;">
    Essa é a fase mais traiçoeira pra julgar um resultado. Muita cliente
    olha pro espelho na semana 1 e pensa que o corte não ficou bom —
    quando na verdade o fio ainda tá <em>aprendendo</em> o padrão.
  </p>

  <hr class="m-rule" />

  <span class="m-small">O que tá acontecendo</span>
  <p class="m-body mt-12" style="max-width: 54ch;">
    Depois de perder peso com o corte, o cacho precisa de alguns dias
    pra encontrar o ângulo de queda certo. É como tirar um sapato
    apertado — o pé demora um tempo pra se reorganizar.
  </p>

  <div class="m-takeaway">
    <div class="lbl">O que ajuda agora</div>
    <p>
      Finalize <strong>mais leve do que o normal</strong>. Sem mousse
      pesada, sem creme em excesso. Deixa o fio respirar. Se possível,
      seque natural pelo menos duas vezes essa semana.
    </p>
  </div>

  <p class="m-body mt-28" style="max-width: 54ch;">
    A definição real do seu corte aparece <strong>entre a semana 2 e 3</strong>.
  </p>
  <p class="m-body mt-12" style="max-width: 54ch;">
    Qualquer dúvida, me chama.
  </p>

  <div class="m-btn-row mt-28">
    <a href="https://wa.me/553135866673" class="m-btn m-btn-primary">Falar com o Jon</a>
  </div>

  <hr class="m-rule" />
  <div class="m-signoff">
    <div class="sig-name">Jon</div>
  </div>
  <p class="m-body mt-12" style="max-width: 52ch; font-size: 14px; color: var(--muted);">
    <strong style="color: var(--ink);">Studio do Jon</strong><br />
    Especialista em corte para cabelos ondulados, cacheados e crespos<br />
    com foco em visagismo em Belo Horizonte.
  </p>
  <p class="m-small mt-12" style="color: var(--muted);">
    @ojonquecortou · ojonquecortou.com.br/agendar
  </p>
  <div style="height: 48px;"></div>
</div>
<div class="mail-footer">
  <div class="m-footer-grid">
    <div>
      <div class="m-footer-brand">Studio do Jon <span class="italic">— corte com leitura.</span></div>
      <p class="addr">Rua dos Cacheados, 218 · Caiçara<br>Belo Horizonte · MG · 30000-000<br>Quarta a Sábado · 9h às 19h</p>
    </div>
  </div>
  <div class="legal">© 2026 Studio do Jon</div>
</div>
`;

const d21 = `
<div class="mail-body">
  <div class="mail-mast">
    <div class="brand">
      <div class="mark">J</div>
      Studio do Jon
    </div>
    <div class="tag">D+21 · o auge</div>
  </div>

  <span class="m-eyebrow">Três semanas</span>
  <h1 class="m-display m-h1 mt-20" style="max-width: 12ch;">
    Agora vem a <span class="m-italic">parte boa.</span>
  </h1>

  <p class="m-lead mt-28" style="max-width: 46ch;">
    É aqui que o corte mostra tudo o que ele tem.
  </p>

  <p class="m-body mt-20" style="max-width: 54ch;">
    O fio já encontrou o padrão, o peso tá certo, o cacho tá definido
    do jeito que eu projetei na <em>leitura de fio</em>.
  </p>

  <div class="m-timeline mt-28">
    <div class="m-timeline-track">
      <div class="m-timeline-fill" style="width: 50%;"></div>
    </div>
    <div class="m-timeline-stops">
      <div class="m-timeline-stop">
        <div class="dot past"></div><div class="lbl">Sem 1</div>
      </div>
      <div class="m-timeline-stop">
        <div class="dot past"></div><div class="lbl">Sem 2</div>
      </div>
      <div class="m-timeline-stop">
        <div class="dot now"></div><div class="lbl">Sem 3</div>
      </div>
      <div class="m-timeline-stop">
        <div class="dot future"></div><div class="lbl">Sem 6</div>
      </div>
      <div class="m-timeline-stop">
        <div class="dot future"></div><div class="lbl">Sem 8</div>
      </div>
    </div>
  </div>

  <p class="m-body mt-28" style="max-width: 54ch;">
    Aproveita essa fase — é o <strong>pico</strong>.
  </p>

  <hr class="m-rule" />

  <span class="m-small">Sobre a janela</span>
  <p class="m-body mt-12" style="max-width: 54ch;">
    A partir da semana <strong>6 a 8</strong>, o fio começa a perder a
    forma. Não porque cresceu demais — porque o ângulo do corte começa
    a trabalhar <em>contra</em> você.
  </p>
  <p class="m-body mt-12" style="max-width: 54ch;">
    A manutenção na hora certa é o que faz a diferença entre um corte
    que dura e um corte que desanda.
  </p>

  <div class="m-btn-row mt-28">
    <a href="https://ojonquecortou.com.br/agendar" class="m-btn m-btn-accent">Agendar meu próximo atendimento</a>
  </div>

  <hr class="m-rule" />
  <div class="m-signoff">
    <div class="sig-name">Jon</div>
  </div>
  <p class="m-body mt-12" style="max-width: 52ch; font-size: 14px; color: var(--muted);">
    <strong style="color: var(--ink);">Studio do Jon</strong><br />
    Especialista em corte para cabelos ondulados, cacheados e crespos<br />
    com foco em visagismo em Belo Horizonte.
  </p>
  <p class="m-small mt-12" style="color: var(--muted);">
    @ojonquecortou · ojonquecortou.com.br/agendar
  </p>
  <div style="height: 48px;"></div>
</div>
<div class="mail-footer">
  <div class="m-footer-grid">
    <div>
      <div class="m-footer-brand">Studio do Jon <span class="italic">— corte com leitura.</span></div>
      <p class="addr">Rua dos Cacheados, 218 · Caiçara<br>Belo Horizonte · MG · 30000-000<br>Quarta a Sábado · 9h às 19h</p>
    </div>
  </div>
  <div class="legal">© 2026 Studio do Jon</div>
</div>
`;

const d35 = `
<div class="mail-body dark">
  <div class="mail-mast dark">
    <div class="brand">
      <div class="mark">J</div>
      Studio do Jon
    </div>
    <div class="tag">D+35 · janela certa</div>
  </div>

  <span class="m-eyebrow dark">Faz cinco semanas</span>
  <h1 class="m-display m-h1 mt-20" style="color: var(--bg-warm); max-width: 12ch;">
    Chegou <span class="m-italic" style="color: var(--accent-warm);">a hora.</span>
  </h1>

  <p class="m-lead mt-28" style="color: rgba(245,237,219,0.78); max-width: 46ch;">
    Essa é exatamente a janela certa pra retornar.
  </p>

  <hr class="m-rule dark" />

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0;">
    <div style="padding-right: 24px; border-right: 1px solid rgba(245,237,219,0.14);">
      <div class="m-small" style="color: rgba(245,237,219,0.55);">Se você voltar agora</div>
      <p class="m-body mt-12" style="color: rgba(245,237,219,0.85); font-size: 15px;">
        O fio ainda tem a <em style="color: var(--accent-warm);">memória</em> do
        corte anterior. Eu consigo trabalhar a continuidade — ajustar
        o que precisa, evoluir o que já tá bom.
      </p>
      <p class="m-body mt-12" style="color: rgba(245,237,219,0.85); font-size: 15px;">
        Atendimento mais preciso, mais rápido, melhor resultado.
      </p>
    </div>
    <div style="padding-left: 24px;">
      <div class="m-small" style="color: rgba(245,237,219,0.55);">Se você esperar demais</div>
      <p class="m-body mt-12" style="color: rgba(245,237,219,0.55); font-size: 15px;">
        O fio perde a referência. O próximo atendimento começa quase
        do zero.
      </p>
    </div>
  </div>

  <hr class="m-rule dark" />

  <p class="m-body" style="color: rgba(245,237,219,0.85); max-width: 54ch;">
    A agenda tá abrindo. Se quiser garantir o seu horário:
  </p>

  <div class="m-btn-row mt-28">
    <a href="https://ojonquecortou.com.br/agendar" class="m-btn m-btn-accent">Quero agendar meu horário</a>
    <a href="https://wa.me/553135866673" class="m-btn m-btn-dark-ghost">Falar antes de marcar</a>
  </div>

  <hr class="m-rule dark" />
  <div class="m-signoff dark">
    <div class="sig-name">Jon</div>
  </div>
  <p class="m-body mt-12" style="max-width: 52ch; font-size: 14px; color: rgba(245,237,219,0.65);">
    <strong style="color: var(--bg-warm);">Studio do Jon</strong><br />
    Especialista em corte para cabelos ondulados, cacheados e crespos<br />
    com foco em visagismo em Belo Horizonte.
  </p>
  <p class="m-small mt-12" style="color: rgba(245,237,219,0.55);">
    @ojonquecortou · ojonquecortou.com.br/agendar
  </p>
  <div style="height: 48px;"></div>
</div>
<div class="mail-footer dark">
  <div class="m-footer-grid">
    <div>
      <div class="m-footer-brand">Studio do Jon <span class="italic">— corte com leitura.</span></div>
      <p class="addr">Rua dos Cacheados, 218 · Caiçara<br>Belo Horizonte · MG · 30000-000<br>Quarta a Sábado · 9h às 19h</p>
    </div>
  </div>
  <div class="legal">© 2026 Studio do Jon</div>
</div>
`;

const d60 = `
<div class="mail-body warm">
  <div class="mail-mast">
    <div class="brand">
      <div class="mark">J</div>
      Studio do Jon
    </div>
    <div class="tag">D+60 · ensaio curto</div>
  </div>

  <span class="m-eyebrow">Uma coisa que percebi</span>
  <h1 class="m-display m-h2 mt-20" style="max-width: 16ch;">
    Não é sobre <span class="m-italic">o corte.</span><br />
    É sobre o que vem antes dele.
  </h1>

  <hr class="m-rule" />

  <p class="m-body" style="max-width: 54ch;">
    A maioria dos problemas de resultado que vejo no Studio não
    aconteceu na hora do corte.
  </p>
  <p class="m-body mt-12" style="max-width: 54ch; font-family: var(--serif-italic); font-style: italic; font-size: 22px; line-height: 1.35; color: var(--ink);">
    Aconteceu antes.
  </p>

  <p class="m-body mt-28" style="max-width: 54ch;">
    Antes de qualquer tesoura tocar no fio, eu faço uma <strong>leitura</strong>.
    Análise a seco, padrão de queda, histórico químico, diagnóstico de
    couro cabeludo. Só depois que eu entendo o fio de verdade é que
    decido como cortar.
  </p>
  <p class="m-body mt-12" style="max-width: 54ch;">
    Parece óbvio. Mas é raro. A maioria dos cabeleireiros <em>pula</em> essa
    etapa.
  </p>

  <div class="m-takeaway">
    <div class="lbl">No seu caso</div>
    <p>
      Quando você foi atendida, fizemos essa leitura juntos. Ela ainda
      diz muito sobre o seu fio — mas o fio <strong>muda</strong> com o
      tempo. Cada lavagem, cada produto, cada processo deixa uma marca.
    </p>
  </div>

  <p class="m-body mt-28" style="max-width: 54ch;">
    Se você tiver curiosidade pra saber como o seu fio tá hoje, me
    chama. Posso fazer uma <em>nova leitura</em> antes de qualquer
    decisão de corte.
  </p>

  <div class="m-btn-row mt-28">
    <a href="https://wa.me/553135866673" class="m-btn m-btn-primary">Quero marcar uma consulta</a>
  </div>

  <hr class="m-rule" />
  <div class="m-signoff">
    <div class="sig-name">Jon</div>
  </div>
  <p class="m-body mt-12" style="max-width: 52ch; font-size: 14px; color: var(--muted);">
    <strong style="color: var(--ink);">Studio do Jon</strong><br />
    Especialista em corte para cabelos ondulados, cacheados e crespos<br />
    com foco em visagismo em Belo Horizonte.
  </p>
  <p class="m-small mt-12" style="color: var(--muted);">
    @ojonquecortou · ojonquecortou.com.br/agendar
  </p>
  <div style="height: 48px;"></div>
</div>
<div class="mail-footer">
  <div class="m-footer-grid">
    <div>
      <div class="m-footer-brand">Studio do Jon <span class="italic">— corte com leitura.</span></div>
      <p class="addr">Rua dos Cacheados, 218 · Caiçara<br>Belo Horizonte · MG · 30000-000<br>Quarta a Sábado · 9h às 19h</p>
    </div>
  </div>
  <div class="legal">© 2026 Studio do Jon</div>
</div>
`;

const d90 = `
<div class="mail-body cream">
  <div class="mail-mast">
    <div class="brand">
      <div class="mark">J</div>
      Studio do Jon
    </div>
    <div class="tag">D+90 · até a próxima</div>
  </div>

  <span class="m-eyebrow">Três meses</span>
  <h1 class="m-display m-h2 mt-20" style="max-width: 16ch;">
    Esse é o <span class="m-italic">último</span><br />email que mando.
  </h1>

  <p class="m-lead mt-28" style="max-width: 44ch;">
    Sem drama. Só sendo direto.
  </p>

  <hr class="m-rule" />

  <p class="m-body mt-28" style="max-width: 54ch;">
    Faz 3 meses desde o seu atendimento aqui.
  </p>
  <p class="m-body mt-12" style="max-width: 54ch;">
    Esse é o último email que vou mandar automaticamente. Se você não
    quiser mais receber mensagens minhas, é só <strong>responder
    aqui</strong> — sem problema nenhum.
  </p>

  <p class="m-body mt-28" style="margin-left: 0; font-family: var(--serif-italic); font-style: italic; font-size: 22px; color: var(--accent-deep);">
    Mas se você tiver pensando em voltar a cuidar do fio… o Studio tá
    aqui. A mesma leitura, o mesmo cuidado antes de qualquer tesoura
    tocar.
  </p>

  <p class="m-body" style="max-width: 54ch;">
    Me chama quando quiser retomar.
  </p>

  <div class="m-btn-row mt-28">
    <a href="https://wa.me/553135866673" class="m-btn m-btn-ghost">Falar com o Jon</a>
  </div>

  <hr class="m-rule" />
  <div class="m-signoff">
    <div class="sig-name">Jon</div>
  </div>
  <p class="m-body mt-12" style="max-width: 52ch; font-size: 14px; color: var(--muted);">
    <strong style="color: var(--ink);">Studio do Jon</strong><br />
    Especialista em corte para cabelos ondulados, cacheados e crespos<br />
    com foco em visagismo em Belo Horizonte.
  </p>
  <p class="m-small mt-12" style="color: var(--muted);">
    @ojonquecortou · ojonquecortou.com.br/agendar
  </p>
  <div style="height: 48px;"></div>
</div>
<div class="mail-footer">
  <div class="m-footer-grid">
    <div>
      <div class="m-footer-brand">Studio do Jon <span class="italic">— corte com leitura.</span></div>
      <p class="addr">Rua dos Cacheados, 218 · Caiçara<br>Belo Horizonte · MG · 30000-000<br>Quarta a Sábado · 9h às 19h</p>
    </div>
  </div>
  <div class="legal">© 2026 Studio do Jon</div>
</div>
`;

const niver = `
<div class="mail-body">
  <div class="mail-mast">
    <div class="brand">
      <div class="mark">J</div>
      Studio do Jon
    </div>
    <div class="tag">Aniversário · 5 dias antes</div>
  </div>

  <span class="m-eyebrow">Hoje é seu dia</span>
  <h1 class="m-display m-h1 mt-20" style="max-width: 14ch;">
    Parabéns, <span class="m-italic">{nome}.</span>
  </h1>

  <hr class="m-rule" />

  <p class="m-body mt-28" style="max-width: 50ch; font-family: var(--serif-italic); font-style: italic; font-size: 22px; line-height: 1.4; color: var(--ink);">
    Aniversário é um bom momento pra se olhar no espelho e gostar do
    que vê. Não só por dentro.
  </p>

  <hr class="m-rule" />

  <p class="m-body" style="max-width: 54ch;">
    Se quiser se presentear com um atendimento esse mês, a agenda tá
    aqui. Posso fazer uma <em>nova leitura de fio</em> e ver o que
    mudou desde a última vez.
  </p>

  <p class="m-body mt-20" style="max-width: 54ch;">
    Feliz aniversário <strong>de verdade</strong>.
  </p>

  <div class="m-btn-row mt-28">
    <a href="https://ojonquecortou.com.br/agendar" class="m-btn m-btn-accent">Ver agenda do Studio</a>
  </div>

  <hr class="m-rule" />
  <div class="m-signoff">
    <div class="sig-name">Jon</div>
  </div>
  <p class="m-body mt-12" style="max-width: 52ch; font-size: 14px; color: var(--muted);">
    <strong style="color: var(--ink);">Studio do Jon</strong><br />
    Especialista em corte para cabelos ondulados, cacheados e crespos<br />
    com foco em visagismo em Belo Horizonte.
  </p>
  <p class="m-small mt-12" style="color: var(--muted);">
    @ojonquecortou · ojonquecortou.com.br/agendar
  </p>
  <div style="height: 48px;"></div>
</div>
<div class="mail-footer">
  <div class="m-footer-grid">
    <div>
      <div class="m-footer-brand">Studio do Jon <span class="italic">— corte com leitura.</span></div>
      <p class="addr">Rua dos Cacheados, 218 · Caiçara<br>Belo Horizonte · MG · 30000-000<br>Quarta a Sábado · 9h às 19h</p>
    </div>
  </div>
  <div class="legal">© 2026 Studio do Jon</div>
</div>
`;

fs.appendFileSync('C:/Users/jonat/.gemini/antigravity/scratch/ojonquecortou/src/utils/emailTemplates.js', `
export const HTML_TEMPLATES = {
  'd1': \`${d1}\`,
  'd7': \`${d7}\`,
  'd21': \`${d21}\`,
  'd35': \`${d35}\`,
  'd60': \`${d60}\`,
  'd90': \`${d90}\`,
  'aniversario': \`${niver}\`
};
`);
