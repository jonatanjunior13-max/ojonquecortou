/* eslint-disable react/prop-types */
// Sequência pós-atendimento — D+1, D+7, D+21, D+35, D+60, D+90 + Aniversário.
// Texto fornecido pelo cliente, design no mesmo sistema.

/* Bloco de assinatura padrão da sequência — Jon + descritivo + handle.
   Usado em todos os 7 emails desta sequência. */
function SignoffSequencia({ dark }) {
  return (
    <>
      <hr className={`m-rule ${dark ? 'dark' : ''}`} />
      <div className={`m-signoff ${dark ? 'dark' : ''}`}>
        <div className="sig-name">Jon</div>
      </div>
      <p
        className="m-body mt-12"
        style={{
          maxWidth: '52ch',
          fontSize: 14,
          color: dark ? 'rgba(245,237,219,0.65)' : 'var(--muted)',
        }}
      >
        <strong style={{ color: dark ? 'var(--bg-warm)' : 'var(--ink)' }}>Studio do Jon</strong><br />
        Especialista em corte para cabelos ondulados, cacheados e crespos<br />
        com foco em visagismo em Belo Horizonte.
      </p>
      <p
        className="m-small mt-12"
        style={{ color: dark ? 'rgba(245,237,219,0.55)' : 'var(--muted)' }}
      >
        @ojonquecortou&nbsp;&nbsp;·&nbsp;&nbsp;ojonquecortou.com.br/agendar
      </p>
    </>
  );
}

/* ============================================================
   01 · D+1 — Como tá o fio hoje?
   ============================================================ */
function EmailD1() {
  return (
    <MailStage
      chrome={
        <MailChrome
          time="qua · 10:12"
          subject={<><Merge>Nome</Merge>, como tá o fio hoje?</>}
          subjectB="Primeira noite de cabelo novo. Tem uma coisa importante."
          preview="Os primeiros 2 dias são os mais traiçoeiros."
        />
      }
      footer={<MailFooter />}
      bg="warm"
    >
      <MailMast tag="D+1 · primeira noite" />

      <span className="m-eyebrow">24 horas depois</span>
      <h1 className="m-display m-h2 mt-20" style={{ maxWidth: '14ch' }}>
        <Merge>Nome</Merge>, como tá o fio <span className="m-italic">hoje?</span>
      </h1>

      <p className="m-body mt-28" style={{ maxWidth: '54ch' }}>
        Ontem você saiu do Studio com o corte novo. Como tá se sentindo
        com ele hoje?
      </p>
      <p className="m-body mt-12" style={{ maxWidth: '54ch' }}>
        Os primeiros <strong>2–3 dias</strong> o cacho ainda tá encontrando
        o padrão. Normal ter um dia estranho no começo — não é o corte
        que ficou ruim. É o fio se reorganizando depois de perder peso.
      </p>

      <Takeaway label="Essa semana">
        Evita escova seca. Deixa o peso trabalhar sozinho. Quanto menos
        você manipular agora, <strong>mais rápido o padrão se define</strong>.
      </Takeaway>

      <p className="m-body mt-28" style={{ maxWidth: '54ch' }}>
        Se surgir qualquer dúvida sobre finalização, me chama no WhatsApp
        ou no direct. Tô aqui.
      </p>

      <div className="m-btn-row mt-28">
        <MailButton variant="primary">Falar com o Jon</MailButton>
      </div>

      <SignoffSequencia />
      <div style={{ height: 48 }} />
    </MailStage>
  );
}

/* ============================================================
   02 · D+7 — A semana mais importante do seu cabelo
   ============================================================ */
function EmailD7() {
  return (
    <MailStage
      chrome={
        <MailChrome
          time="ter · 8:45"
          subject="A semana mais importante do seu cabelo (e quase ninguém fala sobre isso)"
          subjectB="7 dias depois do corte. Tem uma coisa que faz diferença."
          preview="O que acontece nesse período muda tudo."
        />
      }
      footer={<MailFooter />}
      bg="cream"
    >
      <MailMast tag="D+7 · uma semana" />

      <span className="m-eyebrow">Sete dias</span>
      <h1 className="m-display m-h2 mt-20" style={{ maxWidth: '15ch' }}>
        A semana mais <span className="m-italic">importante</span> do seu cabelo.
      </h1>

      <p className="m-lead mt-28" style={{ maxWidth: '46ch' }}>
        E quase ninguém fala sobre isso.
      </p>

      <p className="m-body mt-28" style={{ maxWidth: '54ch' }}>
        Essa é a fase mais traiçoeira pra julgar um resultado. Muita cliente
        olha pro espelho na semana 1 e pensa que o corte não ficou bom —
        quando na verdade o fio ainda tá <em>aprendendo</em> o padrão.
      </p>

      <hr className="m-rule" />

      <span className="m-small">O que tá acontecendo</span>
      <p className="m-body mt-12" style={{ maxWidth: '54ch' }}>
        Depois de perder peso com o corte, o cacho precisa de alguns dias
        pra encontrar o ângulo de queda certo. É como tirar um sapato
        apertado — o pé demora um tempo pra se reorganizar.
      </p>

      <Takeaway label="O que ajuda agora">
        Finalize <strong>mais leve do que o normal</strong>. Sem mousse
        pesada, sem creme em excesso. Deixa o fio respirar. Se possível,
        seque natural pelo menos duas vezes essa semana.
      </Takeaway>

      <p className="m-body mt-28" style={{ maxWidth: '54ch' }}>
        A definição real do seu corte aparece <strong>entre a semana 2 e 3</strong>.
      </p>
      <p className="m-body mt-12" style={{ maxWidth: '54ch' }}>
        Qualquer dúvida, me chama.
      </p>

      <div className="m-btn-row mt-28">
        <MailButton variant="primary">Falar com o Jon</MailButton>
      </div>

      <SignoffSequencia />
      <div style={{ height: 48 }} />
    </MailStage>
  );
}

/* ============================================================
   03 · D+21 — Agora vem a parte boa
   ============================================================ */
function EmailD21() {
  return (
    <MailStage
      chrome={
        <MailChrome
          time="seg · 9:00"
          subject="3 semanas de corte novo. Agora vem a parte boa."
          subjectB={<><Merge>Nome</Merge>, seu cabelo tá no auge agora.</>}
          preview="O fio tá no melhor momento. Mas tem um prazo."
        />
      }
      footer={<MailFooter />}
    >
      <MailMast tag="D+21 · o auge" />

      <span className="m-eyebrow">Três semanas</span>
      <h1 className="m-display m-h1 mt-20" style={{ maxWidth: '12ch' }}>
        Agora vem a <span className="m-italic">parte boa.</span>
      </h1>

      <p className="m-lead mt-28" style={{ maxWidth: '46ch' }}>
        É aqui que o corte mostra tudo o que ele tem.
      </p>

      <p className="m-body mt-20" style={{ maxWidth: '54ch' }}>
        O fio já encontrou o padrão, o peso tá certo, o cacho tá definido
        do jeito que eu projetei na <em>leitura de fio</em>.
      </p>

      <Timeline
        stops={[
          { week: 'Sem 1', lbl: 'fio se reorganiza', state: 'past' },
          { week: 'Sem 2', lbl: 'padrão emerge', state: 'past' },
          { week: 'Sem 3', lbl: 'você está aqui', state: 'now' },
          { week: 'Sem 6', lbl: 'forma cede', state: 'future' },
          { week: 'Sem 8', lbl: 'hora do retorno', state: 'future' },
        ]}
      />

      <p className="m-body" style={{ maxWidth: '54ch' }}>
        Aproveita essa fase — é o <strong>pico</strong>.
      </p>

      <hr className="m-rule" />

      <span className="m-small">Sobre a janela</span>
      <p className="m-body mt-12" style={{ maxWidth: '54ch' }}>
        A partir da semana <strong>6 a 8</strong>, o fio começa a perder a
        forma. Não porque cresceu demais — porque o ângulo do corte começa
        a trabalhar <em>contra</em> você.
      </p>
      <p className="m-body mt-12" style={{ maxWidth: '54ch' }}>
        A manutenção na hora certa é o que faz a diferença entre um corte
        que dura e um corte que desanda.
      </p>

      <div className="m-btn-row mt-28">
        <MailButton variant="accent">Agendar meu próximo atendimento</MailButton>
      </div>

      <SignoffSequencia />
      <div style={{ height: 48 }} />
    </MailStage>
  );
}

/* ============================================================
   04 · D+35 — Chegou a hora
   ============================================================ */
function EmailD35() {
  return (
    <MailStage
      chrome={
        <MailChrome
          time="qui · 14:30"
          subject={<><Merge>Nome</Merge>, chegou a hora.</>}
          subjectB="Não é coincidência você estar pensando nisso agora."
          preview="Essa é exatamente a janela certa pra retornar."
        />
      }
      footer={<MailFooter dark />}
      bg="dark"
    >
      <MailMast tag="D+35 · janela certa" dark />

      <span className="m-eyebrow dark">Faz cinco semanas</span>
      <h1 className="m-display m-h1 mt-20" style={{ color: 'var(--bg-warm)', maxWidth: '12ch' }}>
        Chegou <span className="m-italic" style={{ color: 'var(--accent-warm)' }}>a hora.</span>
      </h1>

      <p
        className="m-lead mt-28"
        style={{ color: 'rgba(245,237,219,0.78)', maxWidth: '46ch' }}
      >
        Essa é exatamente a janela certa pra retornar.
      </p>

      <hr className="m-rule dark" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        <div style={{ paddingRight: 24, borderRight: '1px solid rgba(245,237,219,0.14)' }}>
          <div className="m-small" style={{ color: 'rgba(245,237,219,0.55)' }}>Se você voltar agora</div>
          <p className="m-body mt-12" style={{ color: 'rgba(245,237,219,0.85)', fontSize: 15 }}>
            O fio ainda tem a <em style={{ color: 'var(--accent-warm)' }}>memória</em> do
            corte anterior. Eu consigo trabalhar a continuidade — ajustar
            o que precisa, evoluir o que já tá bom.
          </p>
          <p className="m-body mt-12" style={{ color: 'rgba(245,237,219,0.85)', fontSize: 15 }}>
            Atendimento mais preciso, mais rápido, melhor resultado.
          </p>
        </div>
        <div style={{ paddingLeft: 24 }}>
          <div className="m-small" style={{ color: 'rgba(245,237,219,0.55)' }}>Se você esperar demais</div>
          <p className="m-body mt-12" style={{ color: 'rgba(245,237,219,0.55)', fontSize: 15 }}>
            O fio perde a referência. O próximo atendimento começa quase
            do zero.
          </p>
        </div>
      </div>

      <hr className="m-rule dark" />

      <p className="m-body" style={{ color: 'rgba(245,237,219,0.85)', maxWidth: '54ch' }}>
        A agenda tá abrindo. Se quiser garantir o seu horário:
      </p>

      <div className="m-btn-row mt-28">
        <MailButton variant="accent">Quero agendar meu horário</MailButton>
        <MailButton variant="dark-ghost">Falar antes de marcar</MailButton>
      </div>

      <SignoffSequencia dark />
      <div style={{ height: 48 }} />
    </MailStage>
  );
}

/* ============================================================
   05 · D+60 — Uma coisa que percebi
   ============================================================ */
function EmailD60() {
  return (
    <MailStage
      chrome={
        <MailChrome
          time="sex · 16:48"
          subject="Uma coisa que percebi depois de anos cortando cacheado"
          subjectB="A maioria das cacheadas não sabe disso sobre o próprio fio."
          preview="Não é sobre o corte. É sobre o que vem antes dele."
        />
      }
      footer={<MailFooter />}
      bg="warm"
    >
      <MailMast tag="D+60 · ensaio curto" />

      <span className="m-eyebrow">Uma coisa que percebi</span>
      <h1 className="m-display m-h2 mt-20" style={{ maxWidth: '16ch' }}>
        Não é sobre <span className="m-italic">o corte.</span><br />
        É sobre o que vem antes dele.
      </h1>

      <hr className="m-rule" />

      <p className="m-body" style={{ maxWidth: '54ch' }}>
        A maioria dos problemas de resultado que vejo no Studio não
        aconteceu na hora do corte.
      </p>
      <p
        className="m-body mt-12"
        style={{
          maxWidth: '54ch',
          fontFamily: 'var(--serif-italic)',
          fontStyle: 'italic',
          fontSize: 22,
          lineHeight: 1.35,
          color: 'var(--ink)',
        }}
      >
        Aconteceu antes.
      </p>

      <p className="m-body mt-28" style={{ maxWidth: '54ch' }}>
        Antes de qualquer tesoura tocar no fio, eu faço uma <strong>leitura</strong>.
        Análise a seco, padrão de queda, histórico químico, diagnóstico de
        couro cabeludo. Só depois que eu entendo o fio de verdade é que
        decido como cortar.
      </p>
      <p className="m-body mt-12" style={{ maxWidth: '54ch' }}>
        Parece óbvio. Mas é raro. A maioria dos cabeleireiros <em>pula</em> essa
        etapa.
      </p>

      <Takeaway label="No seu caso">
        Quando você foi atendida, fizemos essa leitura juntos. Ela ainda
        diz muito sobre o seu fio — mas o fio <strong>muda</strong> com o
        tempo. Cada lavagem, cada produto, cada processo deixa uma marca.
      </Takeaway>

      <p className="m-body mt-28" style={{ maxWidth: '54ch' }}>
        Se você tiver curiosidade pra saber como o seu fio tá hoje, me
        chama. Posso fazer uma <em>nova leitura</em> antes de qualquer
        decisão de corte.
      </p>

      <div className="m-btn-row mt-28">
        <MailButton variant="primary">Quero marcar uma consulta</MailButton>
      </div>

      <SignoffSequencia />
      <div style={{ height: 48 }} />
    </MailStage>
  );
}

/* ============================================================
   06 · D+90 — Último email
   ============================================================ */
function EmailD90() {
  return (
    <MailStage
      chrome={
        <MailChrome
          time="qua · 11:00"
          subject={<>Esse é o último email que mando, <Merge>Nome</Merge>.</>}
          subjectB="Faz 3 meses."
          preview="Sem drama. Só sendo direto."
        />
      }
      footer={<MailFooter />}
      bg="cream"
    >
      <MailMast tag="D+90 · até a próxima" />

      <span className="m-eyebrow">Três meses</span>
      <h1 className="m-display m-h2 mt-20" style={{ maxWidth: '16ch' }}>
        Esse é o <span className="m-italic">último</span><br />email que mando.
      </h1>

      <p className="m-lead mt-28" style={{ maxWidth: '44ch' }}>
        Sem drama. Só sendo direto.
      </p>

      <Ornament />

      <p className="m-body mt-28" style={{ maxWidth: '54ch' }}>
        Faz 3 meses desde o seu atendimento aqui.
      </p>
      <p className="m-body mt-12" style={{ maxWidth: '54ch' }}>
        Esse é o último email que vou mandar automaticamente. Se você não
        quiser mais receber mensagens minhas, é só <strong>responder
        aqui</strong> — sem problema nenhum.
      </p>

      <p
        className="m-farewell"
        style={{ marginLeft: 0 }}
      >
        Mas se você tiver pensando em voltar a cuidar do fio… o Studio tá
        aqui. A mesma leitura, o mesmo cuidado antes de qualquer tesoura
        tocar.
      </p>

      <p className="m-body" style={{ maxWidth: '54ch' }}>
        Me chama quando quiser retomar.
      </p>

      <div className="m-btn-row mt-28">
        <MailButton variant="ghost">Falar com o Jon</MailButton>
      </div>

      <SignoffSequencia />
      <div style={{ height: 48 }} />
    </MailStage>
  );
}

/* ============================================================
   07 · BÔNUS — Aniversário
   ============================================================ */
function EmailAniversario() {
  return (
    <MailStage
      chrome={
        <MailChrome
          time="seg · 7:00"
          subject={<>Parabéns, <Merge>Nome</Merge>.</>}
          subjectB={<><Merge>Nome</Merge>, hoje é seu dia.</>}
          preview="Não é oferta. É só isso."
        />
      }
      footer={<MailFooter />}
    >
      <MailMast tag="Aniversário · 5 dias antes" />

      <span className="m-eyebrow">Hoje é seu dia</span>
      <h1 className="m-display m-h1 mt-20" style={{ maxWidth: '14ch' }}>
        Parabéns, <span className="m-italic"><Merge>Nome</Merge>.</span>
      </h1>

      <Ornament />

      <p
        className="m-body mt-28"
        style={{
          maxWidth: '50ch',
          fontFamily: 'var(--serif-italic)',
          fontStyle: 'italic',
          fontSize: 22,
          lineHeight: 1.4,
          color: 'var(--ink)',
        }}
      >
        Aniversário é um bom momento pra se olhar no espelho e gostar do
        que vê. Não só por dentro.
      </p>

      <hr className="m-rule" />

      <p className="m-body" style={{ maxWidth: '54ch' }}>
        Se quiser se presentear com um atendimento esse mês, a agenda tá
        aqui. Posso fazer uma <em>nova leitura de fio</em> e ver o que
        mudou desde a última vez.
      </p>

      <p className="m-body mt-20" style={{ maxWidth: '54ch' }}>
        Feliz aniversário <strong>de verdade</strong>.
      </p>

      <div className="m-btn-row mt-28">
        <MailButton variant="accent">Ver agenda do Studio</MailButton>
      </div>

      <SignoffSequencia />
      <div style={{ height: 48 }} />
    </MailStage>
  );
}

Object.assign(window, {
  EmailD1, EmailD7, EmailD21, EmailD35, EmailD60, EmailD90, EmailAniversario,
});
