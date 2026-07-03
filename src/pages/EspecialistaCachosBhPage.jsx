import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { Reveal, Arrow } from '../components/NewDesignComponents';

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "O que torna um especialista em cachos diferente de um cabeleireiro genérico?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Um especialista diagnostica antes de cortar. Analisa porosidade, encolhimento, histórico químico e padrão de curvatura. Um genérico aplica templates. No Studio do Jon, usamos o Método Leitura de Fio — 7 etapas de diagnóstico que mapeiam a física exata do seu fio."
      }
    },
    {
      "@type": "Question",
      "name": "Como funciona o Método Leitura de Fio?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "É um protocolo em 7 etapas: escuta do histórico, análise a seco, diagnóstico do couro cabeludo, histórico químico, análise molhada (porosidade/elasticidade), definição da técnica de corte, e finalização com validação. Nenhuma suposição — tudo baseado na física real do seu cabelo."
      }
    },
    {
      "@type": "Question",
      "name": "Quanto custa uma consulta com especialista em cachos?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A Leitura de Fio (diagnóstico) com corte começa a partir de R$ 190 com o Jon. Serviços específicos como transição capilar ou coloração cacheada variam. Agende para receber orçamento personalizado."
      }
    },
    {
      "@type": "Question",
      "name": "Qual é a diferença entre corte a seco e corte molhado em cabelo cacheado?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Corte molhado estica o fio 30%, removendo a curvatura real — o resultado muda radicalmente quando seca. Corte a seco respeita o encolhimento natural. O Método Leitura de Fio usa híbrido: a seco para ler a curvatura real, molhado para refinar."
      }
    }
  ]
};

const EspecialistaCachosBhPage = () => {
  return (
    <main>
      <SEO
        title="Especialista em Cachos BH | Cortes para Cabelo Cacheado em Belo Horizonte | Studio do Jon"
        description="Conhece o Jon, especialista em cortes e tratamentos para cabelos cacheados, crespos e ondulados. Método Leitura de Fio — diagnóstico antes de qualquer corte. Agende em BH."
        url="/servicos/especialista-cachos-bh"
        schema={faqSchema}
      />

      {/* HERO SECTION */}
      <header className="hero">
        <div className="hero-blob" aria-hidden="true" />
        <div className="container">
          <div className="eyebrow reveal in" style={{ marginBottom: 36 }}>
            Especialista em Cachos — Belo Horizonte
          </div>

          <div className="hero-grid">
            <div>
              <h1 className="display reveal in">
                Seu cabelo cacheado merece <span className="accent-word">um especialista que lê antes de cortar</span>
              </h1>

              <Reveal delay={120}>
                <p className="lead" style={{ marginTop: 28 }}>
                  Você já saiu de um salão com o cabelo "perfeito" molhado — e chegou em casa com um desastre quando secou? O problema não é seu cabelo. É o método genérico do salão. No Studio do Jon, ninguém corta antes de diagnosticar. Usamos o Método Leitura de Fio: um protocolo de 7 etapas que mapeia a física exata do seu fio. Resultado: cortes que funcionam de verdade.
                </p>
              </Reveal>

              <Reveal delay={220} className="hero-actions">
                <Link to="/agendar" className="btn btn-accent">
                  Agendar Leitura de Fio <Arrow />
                </Link>
                <Link to="/metodo" className="btn btn-ghost">
                  Ver Método Completo
                </Link>
              </Reveal>

              <Reveal delay={320} className="hero-meta">
                <div className="hero-stat">
                  <div className="n">Especialização em</div>
                  <div className="l">2A a 4C</div>
                </div>
                <div className="hero-stat">
                  <div className="n">Desde</div>
                  <div className="l">2018</div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </header>

      {/* ABOUT JON SECTION */}
      <section className="section section-about" style={{ marginTop: '6rem', marginBottom: '6rem' }}>
        <div className="container">
          <div className="grid-2">
            <div>
              <div className="reveal in">
                <h2 className="h2">Quem é o Jon</h2>
              </div>
              <div className="reveal in" style={{ marginTop: '1.5rem' }}>
                <p>Jon não faz cortes genéricos. Ele lê fios como um físico lê dados: curvatura, tensão, porosidade, histórico químico, padrão de encolhimento. Tudo antes da tesoura tocar.</p>
                <p style={{ marginTop: '1rem' }}>Com mais de 8 anos especializando em cabelos texturizados, ele viu o que funciona e o que é mito. Sabe que cabelo 2A não responde igual a 4C. Sabe que corte molhado é armadilha. Sabe que cronograma sem diagnóstico é tentativa no escuro.</p>
                <p style={{ marginTop: '1rem' }}>Seu compromisso é um: nenhum suposição. Leitura real, técnica compensada, resultado que se sustenta.</p>
              </div>

              <Reveal delay={120} style={{ marginTop: '2rem' }}>
                <Link to="/sobre" className="btn btn-ghost">
                  Saber Mais Sobre Jon
                </Link>
              </Reveal>
            </div>
            <div className="reveal in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
              <div style={{ textAlign: 'center', color: '#999' }}>
                Foto do Jon (carousel com serviços)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES SECTION */}
      <section className="section section-services" style={{ marginTop: '6rem', marginBottom: '6rem', backgroundColor: 'rgba(255,255,255,0.02)', padding: '4rem 0' }}>
        <div className="container">
          <div className="reveal in" style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 className="h2">Serviços de Especialista</h2>
            <p className="lead" style={{ marginTop: '1rem', maxWidth: '600px', margin: '1rem auto 0' }}>
              Cada serviço começa com diagnóstico. Cada diagnóstico tem um objetivo claro.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
            {[
              {
                title: 'Leitura de Fio',
                desc: 'Diagnóstico científico em 7 etapas. Mapeia porosidade, elasticidade, histórico químico e padrão de encolhimento.',
                link: '/metodo'
              },
              {
                title: 'Corte com Visagismo',
                desc: 'Corte híbrido (a seco + molhado) que respeita sua curvatura e moldura de rosto.',
                link: '/servicos/corte-hibrido'
              },
              {
                title: 'Transição Capilar',
                desc: 'Protocolo completo para quem está saindo de alisamento. Saúde capilar + identidade de texture.',
                link: '/servicos/transicao-capilar'
              },
              {
                title: 'Tratamentos Personalizados',
                desc: 'Protocolos de nutrição, reconstrução e acidificação baseados no seu diagnóstico.',
                link: '/servicos'
              }
            ].map((service, i) => (
              <div key={i} style={{ padding: '2rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>{service.title}</h3>
                <p style={{ color: '#ccc', marginBottom: '1.5rem' }}>{service.desc}</p>
                <Link to={service.link} style={{ color: 'var(--color-accent, #ff1493)', textDecoration: 'none', fontWeight: '600' }}>
                  Saber Mais →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* METHOD SECTION */}
      <section className="section section-method" style={{ marginTop: '6rem', marginBottom: '6rem' }}>
        <div className="container">
          <div className="reveal in" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 className="h2">Método Leitura de Fio</h2>
            <p className="lead" style={{ marginTop: '1rem', maxWidth: '700px', margin: '1rem auto 0' }}>
              7 etapas de diagnóstico que mapeiam a física exata do seu cabelo — antes de qualquer intervenção.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1.5rem', marginTop: '3rem' }}>
            {[
              { n: '1', label: 'Escuta' },
              { n: '2', label: 'Análise a Seco' },
              { n: '3', label: 'Couro Cabeludo' },
              { n: '4', label: 'Histórico Químico' },
              { n: '5', label: 'Análise Molhada' },
              { n: '6', label: 'Técnica' },
              { n: '7', label: 'Validação' }
            ].map((step, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '2rem 1rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--color-accent, #ff1493)', marginBottom: '0.75rem' }}>
                  {step.n}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#ccc' }}>{step.label}</div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <Link to="/metodo" className="btn btn-accent">
              Entender o Método Completo <Arrow />
            </Link>
          </div>
        </div>
      </section>

      {/* LOCATION & CTA */}
      <section className="section section-cta" style={{ marginTop: '6rem', marginBottom: '6rem', backgroundColor: 'rgba(255,255,255,0.03)', padding: '4rem 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="container">
          <div className="reveal in" style={{ textAlign: 'center' }}>
            <h2 className="h2">Pronto para o Diagnóstico?</h2>
            <p className="lead" style={{ marginTop: '1rem', maxWidth: '600px', margin: '1rem auto 0' }}>
              Studio do Jon — Especialista em cachos em Belo Horizonte, Caiçaras.
            </p>
            <p style={{ marginTop: '1rem', color: '#999', fontSize: '0.9rem' }}>
              📍 Rua Francisco Ovídio, 184 — Caiçaras, BH<br />
              📞 (31) 3586-6673<br />
              🕐 Terça a Sexta: 9h às 19h | Sábado: 9h às 17h
            </p>

            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/agendar" className="btn btn-accent">
                Agendar Agora <Arrow />
              </Link>
              <a href="https://wa.me/553135866673?text=Olá, gostaria de agendar uma Leitura de Fio" target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                Falar no WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section section-testimonials" style={{ marginTop: '6rem', marginBottom: '6rem' }}>
        <div className="container">
          <div className="reveal in" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 className="h2">O Que Clientes Dizem</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            {[
              {
                quote: 'O Jon lê o fio perfeitamente. O melhor corte a seco que já fiz!',
                author: 'Mariana S.'
              },
              {
                quote: 'Depois da Leitura de Fio, meu cronograma finalmente deu resultado.',
                author: 'Camila L.'
              },
              {
                quote: 'Ambiente super aconchegante e o Jon é extremamente atencioso.',
                author: 'Beatriz F.'
              }
            ].map((testimonial, i) => (
              <div key={i} style={{ padding: '2rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--color-accent, #ff1493)' }}>★★★★★</div>
                <p style={{ fontStyle: 'italic', marginBottom: '1rem', color: '#ccc' }}>"{testimonial.quote}"</p>
                <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>— {testimonial.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default EspecialistaCachosBhPage;
