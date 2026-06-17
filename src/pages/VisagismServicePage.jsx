import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const VisagismServicePage = () => {
  return (
    <main className="about-page">
      <SEO 
        title="Visagismo para Cabelos Cacheados em BH | Studio do Jon" 
        description="Visagismo especializado em cabelos cacheados em BH. Análise de rosto, textura e estilo antes de definir o corte ideal para você." 
      />
      <section className="about-hero section-padding">
        <div className="container text-center reveal active">
          <h1 className="heading-xl">Visagismo de <span className="text-gradient">Cachos</span></h1>
          <p className="paragraph-lg max-w-lg mx-auto mt-2">
            Mais do que um corte: uma escultura baseada na sua identidade, traços e caimento real dos fios.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container about-grid">
          <div className="about-visual reveal">
            <div className="about-image-wrap">
              <img src="/corte-visagista-cachos-bh.webp" alt="Cliente após corte de cabelo cacheado com visagismo" className="about-image" />
            </div>
            <div className="experience-tag">
              <span className="exp-number">Personalizado</span>
              <span className="exp-text">Sem Fórmulas Prontas</span>
            </div>
          </div>
          
          <div className="about-content reveal">
            <h2 className="heading-lg mb-2">Por que copiar a influenciadora não funciona no seu cabelo.</h2>
            <p className="paragraph-md mb-2">
              É muito comum ver uma foto de corte na internet, salvá-la no celular e pedir para o cabeleireiro fazer igual. O problema é que o caimento de um cacho depende da densidade capilar, da elasticidade, de como os fios nascem no couro cabeludo e, acima de tudo, do formato do seu rosto e da sua rotina.
            </p>
            <p className="paragraph-md mb-3">
              O <strong>Visagismo aplicado a cachos</strong> no Studio do Jon adapta a geometria dos cortes (seja um Shaggy, Wolf Cut ou em camadas clássicas) para o seu biotipo físico e estilo de vida. O objetivo é criar uma forma harmônica que valorize seus melhores traços e seja fácil de manter em casa.
            </p>
            <div className="cta-group">
              <Link to="/agendar" className="btn btn-primary">Agendar Diagnóstico</Link>
              <Link to="/servicos" className="btn btn-outline">Outros Serviços</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding technique-section">
        <div className="container">
          <div className="text-center reveal mb-4">
            <h2 className="heading-md">As Etapas do Visagismo no Cacho</h2>
          </div>
          
          <div className="technique-grid">
            <div className="card reveal stagger-1">
              <span className="tech-emoji">📐</span>
              <h3>Análise de Proporções</h3>
              <p>Estudo do formato de rosto, linhas e pontos de destaque (olhos, maxilar, bochechas).</p>
            </div>
            <div className="card reveal stagger-2">
              <span className="tech-emoji">📋</span>
              <h3>Estilo de Vida</h3>
              <p>Entendimento da sua rotina de cuidados capilares para desenhar um corte prático para o dia a dia.</p>
            </div>
            <div className="card reveal stagger-3">
              <span className="tech-emoji">✂️</span>
              <h3>Escultura a Seco</h3>
              <p>O corte é feito cacho por cacho com o cabelo seco, permitindo ver a forma nascer em tempo real.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-cta-bottom section-padding">
        <div className="container text-center reveal">
          <h2 className="heading-lg mb-2">Descubra o corte ideal para a sua identidade</h2>
          <p className="paragraph-lg mb-4 max-w-md mx-auto">
            Agende seu diagnóstico de visagismo com o Jon e liberte o verdadeiro potencial do seu cabelo cacheado.
          </p>
          <Link to="/agendar" className="btn btn-primary">
            Garantir meu horário agora
          </Link>
        </div>
      </section>
    </main>
  );
};

export default VisagismServicePage;
