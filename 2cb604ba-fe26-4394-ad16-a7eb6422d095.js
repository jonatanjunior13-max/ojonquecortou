/* eslint-disable react/prop-types */
// The 6 email templates. Each one returns a full <MailStage>.

/* ============================================================
   01 · Confirmação de horário
   ============================================================ */
function EmailConfirmacao() {
  return (
    <MailStage
      chrome={
        <MailChrome
          subject="Está marcado — terça, 18/Jun às 14h"
          time="qua · 9:42"
        />
      }
      footer={<MailFooter />}
    >
      <MailMast tag="Confirmação · 001" />
      <span className="m-eyebrow">Está marcado</span>
      <h1 className="m-display m-h2 mt-20">
        Te espero, <span className="m-italic">Marina.</span>
      </h1>
      <p className="m-lead mt-20" style={{ maxWidth: '46ch' }}>
        Seu horário no Studio está confirmado. Antes de qualquer corte
        eu faço uma leitura do fio — porosidade, curvatura e histórico.
        Reserve uns 15 minutos a mais no relógio.
      </p>

      <AppointmentCard
        when="Terça, 18 de Junho"
        whenItalic="às 14h00"
        where="Rua dos Cacheados, 218 · Caiçaras · Belo Horizonte"
        service="Corte + leitura de fio"
        duration="2h00"
      />

      <div className="m-btn-row">
        <MailButton variant="primary">Adicionar à agenda</MailButton>
        <MailButton variant="ghost">Ver localização</MailButton>
      </div>

      <hr className="m-rule" />

      <p className="m-small">Antes de vir</p>
      <p className="m-body mt-12" style={{ maxWidth: '52ch' }}>
        Lave o cabelo na <strong>noite anterior</strong> com seu shampoo de
        sempre. Sem creme, sem leave-in, sem prancha. Quero ler o fio do
        jeito que ele acorda — não o disfarce.
      </p>

      <Signoff />
      <div style={{ height: 56 }} />
    </MailStage>
  );
}

/* ============================================================
   02 · Lembrete 24h
   ============================================================ */
function EmailLembrete() {
  return (
    <MailStage
      chrome={
        <MailChrome
          subject="Amanhã às 14h — uma lembrança rápida"
          time="seg · 18:10"
        />
      }
      footer={<MailFooter dark />}
      bg="dark"
    >
      <MailMast tag="Lembrete · 24h" dark />

      <span className="m-eyebrow dark">Amanhã</span>
      <h1 className="m-display m-h1 mt-20" style={{ color: 'var(--bg-warm)' }}>
        Te vejo <span className="m-italic" style={{ color: 'var(--accent-warm)' }}>amanhã,</span><br/>
        às 14h.
      </h1>

      <p className="m-lead mt-28" style={{ color: 'rgba(245,237,219,0.75)', maxWidth: '46ch' }}>
        Três coisas que ajudam muito pra eu trabalhar bem no seu cabelo:
      </p>

      <Checklist
        items={[
          { t: 'Cabelo seco do dia anterior',
            d: 'Lavou ontem à noite com seu shampoo de sempre — perfeito. Hoje só não molha.' },
          { t: 'Sem creme, sem leave-in, sem óleo',
            d: 'Preciso ler o fio como ele é. Produto disfarça textura e porosidade.' },
          { t: 'Chegue 5 min antes',
            d: 'O Studio tem um café passado. Aproveita.' },
        ]}
      />

      <hr className="m-rule dark" />

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 24,
        marginTop: 32,
      }}>
        <div>
          <div className="m-small" style={{ color: 'rgba(245,237,219,0.55)' }}>Endereço</div>
          <p className="m-body mt-8" style={{ color: 'var(--bg-warm)' }}>
            Rua dos Cacheados, 218<br/>Caiçaras · BH
          </p>
        </div>
        <div>
          <div className="m-small" style={{ color: 'rgba(245,237,219,0.55)' }}>Estacionamento</div>
          <p className="m-body mt-8" style={{ color: 'var(--bg-warm)' }}>
            Convênio na rua de cima<br/>(diga "Studio do Jon")
          </p>
        </div>
      </div>

      <div className="m-btn-row mt-36">
        <MailButton variant="accent">Chamar no WhatsApp</MailButton>
        <MailButton variant="dark-ghost">Preciso reagendar</MailButton>
      </div>

      <div style={{ height: 56 }} />
    </MailStage>
  );
}

/* ============================================================
   03 · Cuidados pós-corte
   ============================================================ */
function EmailPosCorte() {
  return (
    <MailStage
      chrome={
        <MailChrome
          subject="Seu cabelo nas próximas semanas"
          time="ter · 19:24"
        />
      }
      footer={<MailFooter />}
      bg="warm"
    >
      <MailMast tag="Pós-corte · carta" />

      <span className="m-eyebrow">Carta do Jon</span>
      <h1 className="m-display m-h2 mt-20" style={{ maxWidth: '14ch' }}>
        Foi bom <span className="m-italic">trabalhar</span><br/>no seu fio hoje.
      </h1>

      <p className="m-body mt-28" style={{ maxWidth: '54ch' }}>
        Marina, o que cortei hoje é uma base — ela vai pedir alguma
        coisa de você nas próximas semanas pra ficar redonda. Anota
        aqui em algum canto:
      </p>

      <Takeaway label="A rotina mínima">
        Lavagem com <strong>shampoo leve duas vezes por semana</strong>,
        co-wash no meio se o cacho pedir, leave-in sempre com o
        cabelo encharcado e dedos — nunca pente — pra finalizar.
      </Takeaway>

      <p className="m-body mt-28" style={{ maxWidth: '54ch' }}>
        Os três primeiros dias depois do corte o cacho pode parecer
        <em> assustado</em>. É normal. Ele tá se reorganizando em volta
        da nova forma. Não tente domá-lo no segundo dia — espere a
        próxima lavagem.
      </p>

      <p className="m-body mt-20" style={{ maxWidth: '54ch' }}>
        E qualquer dúvida — <strong>qualquer</strong> dúvida — me manda
        no WhatsApp. Vídeo, foto, áudio. Eu respondo.
      </p>

      <div className="m-btn-row mt-36">
        <MailButton variant="primary">Ler o ensaio completo</MailButton>
        <MailButton variant="ghost">Mandar foto pro Jon</MailButton>
      </div>

      <hr className="m-rule" />

      <p className="m-small">P.S.</p>
      <p className="m-body mt-12" style={{ maxWidth: '54ch' }}>
        Daqui a oito semanas eu já tô pensando no próximo corte —
        marque com folga. Os horários da quinta saem rápido.
      </p>

      <Signoff />
      <div style={{ height: 56 }} />
    </MailStage>
  );
}

/* ============================================================
   04 · Pesquisa pós-atendimento + Google review
   ============================================================ */
function EmailPesquisa() {
  return (
    <MailStage
      chrome={
        <MailChrome
          subject="Como foi o corte?"
          time="qui · 11:08"
        />
      }
      footer={<MailFooter />}
      bg="cream"
    >
      <MailMast tag="Pesquisa · 30s" />

      <span className="m-eyebrow">Uma pergunta rápida</span>
      <h1 className="m-display m-h1 mt-20">
        Como <span className="m-italic">foi?</span>
      </h1>

      <p className="m-lead mt-20" style={{ maxWidth: '44ch' }}>
        Marina, leva 30 segundos. Sua resposta muda meu trabalho.
      </p>

      <div className="m-small mt-36">De 1 a 5</div>
      <Stars />

      <hr className="m-rule" />

      <div className="m-small">Em uma frase, o que você levou daqui hoje?</div>
      <div style={{
        background: 'var(--bg)',
        border: '1px solid var(--rule)',
        borderRadius: 4,
        padding: '18px 20px',
        marginTop: 14,
        fontFamily: 'var(--serif-italic)',
        fontStyle: 'italic',
        fontSize: 20,
        lineHeight: 1.4,
        color: 'var(--muted)',
        minHeight: 90,
      }}>
        Escreva aqui...
      </div>

      <div className="m-btn-row mt-36">
        <MailButton variant="primary">Enviar resposta</MailButton>
      </div>

      <hr className="m-rule" />

      <div style={{
        background: 'var(--bg-warm)',
        border: '1px solid var(--rule)',
        borderRadius: 4,
        padding: '28px 28px 24px',
      }}>
        <p className="m-small" style={{ color: 'var(--accent-deep)' }}>
          Se sobrar mais 30 segundos
        </p>
        <h3 className="m-display m-h4 mt-12" style={{ maxWidth: '22ch' }}>
          Uma <span className="m-italic">avaliação no Google</span> ajuda outras cacheadas a me acharem.
        </h3>
        <div className="m-btn-row mt-20">
          <MailButton variant="accent">Avaliar no Google</MailButton>
        </div>
      </div>

      <div style={{ height: 56 }} />
    </MailStage>
  );
}

/* ============================================================
   05 · Newsletter mensal
   ============================================================ */
function EmailNewsletter() {
  return (
    <MailStage
      chrome={
        <MailChrome
          subject="Carta de Junho — leitura de fio, antes da tesoura"
          time="seg · 8:30"
        />
      }
      footer={<MailFooter />}
    >
      <MailMast tag="Edição 06 · Junho" />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
        <span className="m-eyebrow">Carta mensal</span>
        <span className="m-small">06 / 2026</span>
      </div>
      <h1 className="m-display m-h2" style={{ maxWidth: '16ch' }}>
        Leitura de fio,<br/>
        <span className="m-italic">antes da tesoura.</span>
      </h1>

      <p className="m-body mt-28" style={{ maxWidth: '54ch' }}>
        Olá. Esse mês escrevi sobre uma coisa que me incomoda há tempos:
        a propaganda do <em>corte a seco</em> como técnica universal pra
        cabelo cacheado. Spoiler: depende.
      </p>

      <p className="m-body mt-12" style={{ maxWidth: '54ch' }}>
        Mais três ensaios novos no blog, e dois horários abrindo em
        Agosto — passo a régua embaixo.
      </p>

      <hr className="m-rule" />

      <span className="m-eyebrow">No blog este mês</span>

      <div className="m-post-list mt-28">
        <PostCard
          cat="Método"
          title="Leitura de fio antes da tesoura"
          excerpt="Por que eu passo os primeiros 20 minutos sem cortar nada — e o que tô lendo nesse tempo."
          ph="ph-1"
        />
        <PostCard
          cat="Crítica"
          title="A mentira do corte a seco"
          excerpt="A técnica é boa. O discurso de que ela serve pra todo cacho é onde mora o problema."
          ph="ph-2"
        />
        <PostCard
          cat="Rotina"
          title="Cronograma capilar para cacheadas"
          excerpt="Hidratação, nutrição, reconstrução — sem mistério e sem prateleira de produto."
          ph="ph-3"
        />
      </div>

      <hr className="m-rule" />

      <Takeaway label="Agenda">
        <strong>Agosto abriu hoje.</strong> Quinta 07 e sábado 23 ainda
        têm horários. Setembro abre dia 18 de junho às 19h — separei o
        link com botão direto, sem precisar entrar no site.
      </Takeaway>

      <div className="m-btn-row mt-28">
        <MailButton variant="primary">Marcar pra Agosto</MailButton>
        <MailButton variant="ghost">Ler o ensaio completo</MailButton>
      </div>

      <hr className="m-rule" />

      <Signoff />
      <div style={{ height: 56 }} />
    </MailStage>
  );
}

/* ============================================================
   06 · Reativação (cliente parou de aparecer)
   ============================================================ */
function EmailReativacao() {
  return (
    <MailStage
      chrome={
        <MailChrome
          subject="Faz tempo, né?"
          time="sex · 16:02"
        />
      }
      footer={<MailFooter />}
    >
      <MailMast tag="Reativação · gentil" />

      <span className="m-eyebrow">Cinco meses desde a última</span>
      <h1 className="m-display m-h1 mt-20" style={{ maxWidth: '12ch' }}>
        Faz <span className="m-italic">tempo,</span><br/>né?
      </h1>

      <p className="m-lead mt-28" style={{ maxWidth: '46ch' }}>
        Marina, seu último corte aqui foi em Janeiro. O fio cacheado
        pede revisão a cada <strong>8 a 12 semanas</strong> — não pela
        beleza, pela saúde mesmo. As pontas começam a brigar com a
        curvatura natural depois disso.
      </p>

      <hr className="m-rule" />

      <span className="m-eyebrow">Horários abertos esta semana</span>

      <SlotGrid
        slots={[
          { dow: 'Qua',  day: '12',  hours: '10h · 16h' },
          { dow: 'Qui',  day: '13',  hours: '14h' },
          { dow: 'Sex',  day: '14',  full: true },
          { dow: 'Sáb',  day: '15',  hours: '9h · 11h' },
          { dow: 'Qua',  day: '19',  hours: '15h' },
          { dow: 'Sáb',  day: '22',  hours: '9h' },
        ]}
      />

      <div className="m-btn-row mt-28">
        <MailButton variant="accent">Marcar pelo WhatsApp</MailButton>
        <MailButton variant="ghost">Ver agenda completa</MailButton>
      </div>

      <hr className="m-rule" />

      <p className="m-body" style={{ maxWidth: '54ch' }}>
        Se já tá cortando em outro lugar e gostou — fico feliz, juro.
        Cabelo bom é cabelo bem cuidado, em qualquer cadeira. Só
        responde esse email com um "tudo certo" que eu paro de te
        chamar.
      </p>

      <Signoff />
      <div style={{ height: 56 }} />
    </MailStage>
  );
}

Object.assign(window, {
  EmailConfirmacao, EmailLembrete, EmailPosCorte,
  EmailPesquisa, EmailNewsletter, EmailReativacao,
});
