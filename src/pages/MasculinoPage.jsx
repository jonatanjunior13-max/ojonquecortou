import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { Arrow, Reveal } from '../components/NewDesignComponents';

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Quais cortes masculinos estão em alta para cachos?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "O Shag Masculino, Wolf Cut adaptado e o Undercut volumoso estão em alta. Todos valorizam o caimento natural no topo com laterais mais limpas."
      }
    },
    {
      "@type": "Question",
      "name": "Dá para controlar o volume sem perder os cachos?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sim. Usamos cortes internos de desconexão que reduzem o excesso de peso sem tirar a definição dos cachos do topo."
      }
    },
    {
      "@type": "Question",
      "name": "Qual o tempo de duração do atendimento?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "O atendimento completo masculino dura em torno de 45 minutos a 1 hora, incluindo diagnóstico rápido e lavagem."
      }
    }
  ]
};

const MasculinoPage = () => {
  return (
    <main>
      <SEO
        title="Corte Cabelo Cacheado Masculino BH | Studio do Jon"
        description="Especialista em corte masculino para cabelos cacheados e crespos em BH. Definição, praticidade e visagismo sem degradê genérico. Agende."
        url="/servicos/masculino"
        schema={faqSchema}
      />

      <header className="hero">
        <div className="hero-blob" aria-hidden="true" />
        <div className="container">
          <div className="eyebrow reveal in" style={{ marginBottom: 36 }}>
            Masculino Cacheado — Praticidade & Estilo
          </div>

          <div className="hero-grid">
            <div>
              <h1 className="display reveal in">
                Cortes estruturados que <span className="accent-word">valorizam sua volume</span>
              </h1>

              <Reveal delay={120}>
                <p className="lead" style={{ marginTop: 28 }}>
                  Degradê genérico ignora curvatura do cacho. Se barbeiro passar máquina sem ler comportamento do fio, resultado é topo sem definição e laterais espetadas. Cabelo masculino texturizado exige conexões precisas à tesoura, visagismo adaptado e foco em praticidade: acordar, finalizar rápido, sair pronto.
                </p>
              </Reveal>

              <Reveal delay={220} className="hero-actions">
                <Link to="/agendar" className="btn btn-accent">
                  Agendar Atendimento <Arrow />
                </Link>
                <Link to="/servicos" className="btn btn-ghost">
                  Ver Outros Serviços
                </Link>
              </Reveal>

              <Reveal delay={320} className="hero-meta">
                <div className="hero-stat">
                  <div className="n">R$ 130</div>
                  <div className="l">Investimento</div>
                </div>
                <div className="hero-stat">
                  <div className="n">45-60 min</div>
                  <div className="l">Atendimento completo</div>
                </div>
                <div className="hero-stat">
                  <div className="n">Estrutura na Tesoura</div>
                  <div className="l">Sem máquina excessiva</div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </header>

      <section className="section-padding">
        <div className="container max-w-2xl">
          <Reveal as="h2" className="heading-lg mb-3">
            Por que o corte geométrico com tesoura importa
          </Reveal>
          <Reveal as="p" className="paragraph-md mb-3">
            Nas barbearias comuns, máquina de corte com pentes genéricos destrói coesão dos cachos masculinos. Ao cortar fios na mesma altura mecânica, máquina corta cachos no meio de sua curvatura natural, deixando pontas retas que espetam e perdem capacidade de espiralar sozinhas.
          </Reveal>
          <Reveal as="p" className="paragraph-md mb-4">
            Nosso corte masculino é estruturado seção por seção à tesoura, respeitando ângulo de crescimento. Garante: laterais com encaixe harmônico (sem efeito "capacete"), topo com volume ideal e balanço natural, acabamento de nuca e costeletas limpo que dura.
          </Reveal>
        </div>
      </section>

      <section className="section-padding bg-light">
        <div className="container max-w-2xl">
          <Reveal as="h2" className="heading-lg mb-4">
            Guia Rápido de Estilização Masculina (3 min)
          </Reveal>
          <Reveal as="p" className="paragraph-md mb-4">
            Praticidade é a regra. Passos simples pela manhã para manter cachos alinhados o dia todo:
          </Reveal>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} className="mb-4">
            <Reveal>
              <p className="paragraph-sm mb-2"><strong>Passo 1: Umedecer (30s)</strong> — Borrifar água de leve ou finalizar logo após banho. Cacho precisa água para reativar pontes de hidrogênio.</p>
            </Reveal>
            <Reveal>
              <p className="paragraph-sm mb-2"><strong>Passo 2: Leave-in Fluido (1min)</strong> — Distribua creme de pentear leve no topo apenas, usando técnica de fitagem rápida.</p>
            </Reveal>
            <Reveal>
              <p className="paragraph-sm mb-2"><strong>Passo 3: Gelatina ou Gel (30s)</strong> — Amasse cachos de baixo para cima com pequena quantidade para garantir fixação.</p>
            </Reveal>
            <Reveal>
              <p className="paragraph-sm mb-0"><strong>Passo 4: Secar ao ar ou Difusor (1min)</strong> — Deixe secar naturalmente ou use difusor por 1 minuto se com pressa.</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container max-w-2xl">
          <Reveal as="h2" className="heading-lg mb-4">
            Diferenciais do Corte Masculino
          </Reveal>
          <div className="grid-3">
            <Reveal className="card">
              <h3 className="heading-md">⚡ Praticidade Diária</h3>
              <p className="paragraph-sm">Cortes pensados para que finalização dure menos de 5 minutos, sem mistérios ou rotinas complexas.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">📐 Acabamento Limpo</h3>
              <p className="paragraph-sm">Laterais e nuca limpas de forma integrada com volume e caimento do topo, valorizando desenho do corte.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">✂️ Estrutura na Tesoura</h3>
              <p className="paragraph-sm">Evitamos máquina excessiva para preservar textura e definição das pontas, garantindo caimento orgânico.</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container max-w-2xl">
          <Reveal as="h2" className="heading-lg mb-4">
            FAQ
          </Reveal>
          <Reveal as="details" className="faq-item">
            <summary>Quais cortes masculinos estão em alta para cachos?</summary>
            <p className="paragraph-sm" style={{ marginTop: 12 }}>Shag Masculino, Wolf Cut adaptado e Undercut volumoso. Todos valorizam caimento natural no topo com laterais mais limpas.</p>
          </Reveal>
          <Reveal as="details" className="faq-item">
            <summary>Dá para controlar volume sem perder os cachos?</summary>
            <p className="paragraph-sm" style={{ marginTop: 12 }}>Sim. Usamos cortes internos de desconexão que reduzem excesso de peso sem tirar definição dos cachos do topo.</p>
          </Reveal>
          <Reveal as="details" className="faq-item">
            <summary>Qual o tempo de duração?</summary>
            <p className="paragraph-sm" style={{ marginTop: 12 }}>Atendimento completo dura 45 min a 1 hora, incluindo diagnóstico rápido e lavagem.</p>
          </Reveal>
        </div>
      </section>

      <section className="section-padding text-center">
        <div className="container max-w-lg">
          <Reveal as="h2" className="heading-lg mb-3">
            Seu cabelo com estilo e sem enrolação
          </Reveal>
          <Reveal as="p" className="paragraph-md mb-4">
            Agende seu horário com quem entende a mecânica do cacho masculino em BH. Atendimento exclusivo por R$ 130.
          </Reveal>
          <Reveal>
            <Link to="/agendar" className="btn btn-accent">
              Agendar Corte Masculino <Arrow />
            </Link>
          </Reveal>
        </div>
      </section>
    </main>
  );
};

export default MasculinoPage;
