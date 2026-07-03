import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { Reveal, Arrow } from '../components/NewDesignComponents';

const DetoxEstimulantePage = () => {
  return (
    <main>
      <SEO
        title="Detox Estimulante | Saúde do Couro Cabeludo | Studio do Jon"
        description="Limpeza profunda do couro cabeludo com esfoliação, máscara estimulante e tratamento desintoxicante. R$ 180. Agende em BH."
        url="/servicos/detox-estimulante"
      />

      <header className="hero">
        <div className="hero-blob" aria-hidden="true" />
        <div className="container">
          <div className="eyebrow reveal in" style={{ marginBottom: 36 }}>
            Detox Estimulante — Saúde da Raiz
          </div>

          <div className="hero-grid">
            <div>
              <h1 className="display reveal in">
                Couro saudável = <span className="accent-word">cabelo saudável</span>
              </h1>

              <Reveal delay={120}>
                <p className="lead" style={{ marginTop: 28 }}>
                  O couro cabeludo é a raiz da saúde capilar. Se está inflamado, oleoso ou cheio de resíduos, o cabelo nasce comprometido. Em cabelo cacheado, o acúmulo é ainda maior — a curvatura bloqueia circulação de ar. Detox remove resíduos, reequilibra pH e estimula circulação.
                </p>
              </Reveal>

              <Reveal delay={220} className="hero-actions">
                <Link to="/agendar" className="btn btn-accent">
                  Agendar Detox <Arrow />
                </Link>
                <Link to="/servicos" className="btn btn-ghost">
                  Ver Outros Serviços
                </Link>
              </Reveal>

              <Reveal delay={320} className="hero-meta">
                <div className="hero-stat">
                  <div className="n">R$ 180</div>
                  <div className="l">Investimento</div>
                </div>
                <div className="hero-stat">
                  <div className="n">60 min</div>
                  <div className="l">Sessão completa</div>
                </div>
                <div className="hero-stat">
                  <div className="n">2x/mês</div>
                  <div className="l">Recomendado cacheado</div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </header>

      <section className="section-padding">
        <div className="container max-w-2xl">
          <Reveal as="h2" className="heading-lg mb-3">
            Por que o couro cabeludo importa
          </Reveal>
          <Reveal as="p" className="paragraph-md mb-3">
            Cada fio que você vê nasce de um folículo alimentado por vasos sanguíneos do couro cabeludo. Se está inflamado, oleoso em excesso ou cheio de resíduos acumulados, o ambiente onde o fio nasce já começa comprometido. Resultado: cabelo opaco, sem brilho, às vezes com coceira.
          </Reveal>
          <Reveal as="p" className="paragraph-md mb-4">
            Especialmente em cabelo cacheado e crespo, o couro acumula muito mais resíduo de produto porque a curvatura dificulta a circulação de ar e a remoção natural de oleosidade e partículas ao longo do dia. Detox Estimulante limpa a raiz, reequilibra, estimula. Resultado: couro mais saudável, cabelo com mais brilho desde a raiz.
          </Reveal>
        </div>
      </section>

      <section className="section-padding bg-light">
        <div className="container">
          <Reveal as="h2" className="heading-lg text-center mb-4">
            Protocolo Detox
          </Reveal>
          <div className="grid-3">
            <Reveal className="card">
              <h3 className="heading-md">Esfoliação Gentil (10 min)</h3>
              <p className="paragraph-sm">Remoção de partículas acumuladas + células mortas com massagem suave que estimula circulação local.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Máscara Estimulante (25 min)</h3>
              <p className="paragraph-sm">Nutrição + estímulo circulatório. Deixamos agir com calor controlado para aumentar absorção dos ativos.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Enxague Final (5 min)</h3>
              <p className="paragraph-sm">Água filtrada fria que sela o couro cabeludo e traz brilho imediato ao fio desde a raiz.</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container max-w-2xl">
          <Reveal as="h2" className="heading-lg mb-4">
            Tipos de Couro que se Beneficiam
          </Reveal>
          <div className="timeline">
            <Reveal className="timeline-item">
              <span className="timeline-marker">Couro Oleoso</span>
              <p className="paragraph-sm">Acumula sebo rapidamente (cabelo pesado em 3-4 dias). Esfoliação regular ajuda a regular a produção das glândulas sebáceas.</p>
            </Reveal>
            <Reveal className="timeline-item">
              <span className="timeline-marker">Couro com Descamação</span>
              <p className="paragraph-sm">Caspa ou ressecamento visível. Esfoliação + nutrição, ambas incluídas no protocolo Detox, resolvem.</p>
            </Reveal>
            <Reveal className="timeline-item">
              <span className="timeline-marker">Couro Inflamado</span>
              <p className="paragraph-sm">Coceira ou vermelhidão recorrente. Detox restaura equilíbrio de pH com estímulo desintoxicante.</p>
            </Reveal>
            <Reveal className="timeline-item">
              <span className="timeline-marker">Acúmulo de Produto</span>
              <p className="paragraph-sm">Leave-in, creme, gel acumulados na raiz. Detox remove tudo, liberando espaço para que novos produtos funcionem.</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container max-w-2xl">
          <Reveal as="h2" className="heading-lg mb-4">
            Cronograma Recomendado
          </Reveal>
          <div className="grid-2">
            <Reveal className="card">
              <h3 className="heading-md">Cacheado ou Crespo</h3>
              <p className="paragraph-sm"><strong>2x por mês</strong> (a cada 2 semanas) como manutenção preventiva. Sofre mais acúmulo.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Ondulado</h3>
              <p className="paragraph-sm"><strong>1x por mês</strong>. Sofre menos acúmulo pela geometria mais aberta da fibra.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Couro com Problema</h3>
              <p className="paragraph-sm"><strong>Semanal por 4-6 semanas</strong>, depois 2x/mês como manutenção preventiva.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Combinação Ideal</h3>
              <p className="paragraph-sm"><strong>Detox + Tratamento</strong> 1-2 semanas depois. Couro saudável + fio nutrido.</p>
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
            <summary>Detox substitui meu xampu diário?</summary>
            <p className="paragraph-sm" style={{ marginTop: 12 }}>Não. É um serviço profissional complementar. Não substitui lavagem regular em casa com xampu apropriado.</p>
          </Reveal>
          <Reveal as="details" className="faq-item">
            <summary>Posso fazer Detox se estiver com cabelo recém-colorido?</summary>
            <p className="paragraph-sm" style={{ marginTop: 12 }}>Sim, mas recomendamos aguardar 1 semana após coloração para não interferir na fixação da cor.</p>
          </Reveal>
          <Reveal as="details" className="faq-item">
            <summary>Detox resolve queda de cabelo?</summary>
            <p className="paragraph-sm" style={{ marginTop: 12 }}>Melhora a saúde do ambiente onde o fio nasce, o que ajuda quedas relacionadas a desequilíbrio do couro. Quedas hormonais/genéticas exigem avaliação médica.</p>
          </Reveal>
        </div>
      </section>

      <section className="section-padding text-center">
        <div className="container max-w-lg">
          <Reveal as="h2" className="heading-lg mb-3">
            Sinta a diferença desde a raiz
          </Reveal>
          <Reveal as="p" className="paragraph-md mb-4">
            Agende seu Detox e descubra como um couro saudável transforma o brilho do seu cabelo.
          </Reveal>
          <Reveal>
            <Link to="/agendar" className="btn btn-accent">
              Agendar Detox Estimulante <Arrow />
            </Link>
          </Reveal>
        </div>
      </section>
    </main>
  );
};

export default DetoxEstimulantePage;
