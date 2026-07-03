import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const DetoxEstimulantePage = () => {
  return (
    <main className="about-page">
      <SEO
        title="Detox Estimulante | Saúde do Couro Cabeludo | Studio do Jon"
        description="Limpeza profunda do couro cabeludo com esfoliação, máscara estimulante e tratamento desintoxicante. R$ 180. Agende em BH."
        url="/servicos/detox-estimulante"
      />
      <section className="about-hero section-padding">
        <div className="container text-center reveal active">
          <h1 className="heading-xl">Detox <span className="text-gradient">Estimulante</span></h1>
          <p className="paragraph-lg max-w-lg mx-auto mt-2">
            Couro cabeludo saudável = cabelo saudável desde a raiz.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container about-grid">
          <div className="about-visual reveal">
            <div className="about-image-wrap">
              <img src="/detox-couro-cabeludo-bh.webp" alt="Tratamento de couro cabeludo com detox" className="about-image" />
            </div>
            <div className="experience-tag">
              <span className="exp-number">R$ 180</span>
              <span className="exp-text">60 minutos</span>
            </div>
          </div>

          <div className="about-content reveal">
            <h2 className="heading-lg mb-2">Limpe a raiz do seu cabelo — literalmente.</h2>
            <p className="paragraph-md mb-2">
              O couro cabeludo é a raiz da saúde capilar. Se está inflamado, oleoso ou coberto de resíduos, o cabelo nasce comprometido. Em cabelo cacheado, o acúmulo é ainda maior porque a curvatura bloqueia circulação de ar e concentra produto na raiz.
            </p>
            <p className="paragraph-md mb-3">
              Detox Estimulante remove resíduos acumulados, reequilibra pH e estimula circulação. Resultado: couro mais saudável, cabelo com mais brilho desde a raiz.
            </p>
            <div className="cta-group">
              <Link to="/agendar" className="btn btn-primary">Agendar Detox</Link>
              <Link to="/servicos" className="btn btn-outline">Outros Serviços</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-light">
        <div className="container">
          <h2 className="heading-lg text-center mb-3">Protocolo Detox</h2>
          <div className="grid-3">
            <div className="card reveal">
              <h3 className="heading-md">Esfoliação</h3>
              <p className="paragraph-sm">Remoção gentil de partículas acumuladas e células mortas. Estimula circulação local.</p>
            </div>
            <div className="card reveal">
              <h3 className="heading-md">Máscara Estimulante</h3>
              <p className="paragraph-sm">Nutrição + estímulo circulatório. Deixa agir 25 min com calor leve opcional.</p>
            </div>
            <div className="card reveal">
              <h3 className="heading-md">Enxague Final</h3>
              <p className="paragraph-sm">Água filtrada fria. Sela o couro e traz brilho imediato.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container max-w-lg">
          <h2 className="heading-lg text-center mb-3">Tipos de Couro que se Beneficiam</h2>
          <div className="timeline">
            <div className="timeline-item reveal">
              <span className="timeline-marker">Couro Oleoso</span>
              <p className="paragraph-sm">Acumula sebo rapidamente. Esfoliação regular ajuda a regular a produção das glândulas sebáceas.</p>
            </div>
            <div className="timeline-item reveal">
              <span className="timeline-marker">Couro com Descamação</span>
              <p className="paragraph-sm">Caspa ou ressecamento visível. Esfoliação + nutrição, ambas incluídas.</p>
            </div>
            <div className="timeline-item reveal">
              <span className="timeline-marker">Couro Inflamado</span>
              <p className="paragraph-sm">Coceira ou vermelhidão. Detox restaura equilíbrio de pH.</p>
            </div>
            <div className="timeline-item reveal">
              <span className="timeline-marker">Acúmulo de Produto</span>
              <p className="paragraph-sm">Leave-in, creme, gel acumulados. Detox remove tudo e libera espaço para novos produtos.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container max-w-lg">
          <h2 className="heading-lg text-center mb-3">Cronograma Recomendado</h2>
          <div className="grid-2">
            <div className="card reveal">
              <h3 className="heading-md">Cacheado ou Crespo</h3>
              <p className="paragraph-sm"><strong>2x por mês</strong> (a cada 2 semanas) como manutenção preventiva.</p>
            </div>
            <div className="card reveal">
              <h3 className="heading-md">Ondulado</h3>
              <p className="paragraph-sm"><strong>1x por mês</strong>. Sofre menos acúmulo pela geometria mais aberta.</p>
            </div>
            <div className="card reveal">
              <h3 className="heading-md">Couro com Problema</h3>
              <p className="paragraph-sm"><strong>Semanal por 4-6 semanas</strong>, depois 2x/mês como manutenção.</p>
            </div>
            <div className="card reveal">
              <h3 className="heading-md">Combinação Ideal</h3>
              <p className="paragraph-sm"><strong>Detox + Tratamento</strong> 1-2 semanas depois. Couro saudável + fio nutrido.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container max-w-lg">
          <h2 className="heading-lg text-center mb-3">FAQ</h2>
          <details className="faq-item reveal">
            <summary>Detox Estimulante substitui meu xampu?</summary>
            <p className="paragraph-sm">Não. É um serviço profissional complementar. Não substitui lavagem regular em casa.</p>
          </details>
          <details className="faq-item reveal">
            <summary>Posso fazer Detox se estiver com cabelo recém-colorido?</summary>
            <p className="paragraph-sm">Sim, mas recomendamos aguardar 1 semana após coloração para não interferir na fixação da cor.</p>
          </details>
          <details className="faq-item reveal">
            <summary>Detox resolve queda de cabelo?</summary>
            <p className="paragraph-sm">Melhora a saúde do ambiente onde o fio nasce. Ajuda quedas relacionadas a desequilíbrio do couro. Mas quedas hormonais/genéticas exigem avaliação médica.</p>
          </details>
        </div>
      </section>

      <section className="section-padding text-center">
        <div className="container max-w-lg reveal">
          <h2 className="heading-lg mb-2">Sinta a diferença desde a raiz</h2>
          <p className="paragraph-md mb-3">
            Agende seu Detox e descubra como um couro saudável transforma o brilho do seu cabelo.
          </p>
          <Link to="/agendar" className="btn btn-primary">Agendar Detox Estimulante</Link>
        </div>
      </section>
    </main>
  );
};

export default DetoxEstimulantePage;
