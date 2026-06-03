import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const BleachServicePage = () => {
  return (
    <main className="about-page">
      <SEO 
        title="Descoloração em Cabelo Cacheado em BH | Studio do Jon" 
        description="Descoloração em cabelo cacheado feita com protocolo especializado em BH. O Studio do Jon avalia porosidade, histórico químico e textura antes de qualquer processo. Agende." 
      />
      <section className="about-hero section-padding">
        <div className="container text-center reveal active">
          <h1 className="heading-xl">Descoloração de <span className="text-gradient">Cachos</span></h1>
          <p className="paragraph-lg max-w-lg mx-auto mt-2">
            Ilumine seus fios sem perder a definição e a integridade da sua curvatura natural.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container about-grid">
          <div className="about-visual reveal">
            <div className="about-image-wrap">
              <img src="/coloracao-ruivo-cachos-explosao.webp" alt="Cabelo cacheado descolorido e iluminado" className="about-image" />
            </div>
            <div className="experience-tag">
              <span className="exp-number">100%</span>
              <span className="exp-text">Segurança no Cacho</span>
            </div>
          </div>
          
          <div className="about-content reveal">
            <h2 className="heading-lg mb-2">Química em cacho exige respeito e ciência.</h2>
            <p className="paragraph-md mb-2">
              A descoloração é um processo químico que remove os pigmentos naturais do fio, mas no cabelo cacheado ela também pode alterar as pontes de hidrogênio que formam a sua curvatura. Um processo mal feito ou agressivo pode resultar em perda de definição, ressecamento extremo e quebra.
            </p>
            <p className="paragraph-md mb-3">
              No Studio do Jon, a descoloração só começa após a aplicação completa do <strong>Método Leitura de Fio</strong>. Nós avaliamos a porosidade, a elasticidade e o histórico químico dos seus fios em um teste de mecha rigoroso antes de encostar qualquer produto químico na sua cabeça.
            </p>
            <div className="cta-group">
              <Link to="/agendar" className="btn btn-primary">Agendar Avaliação</Link>
              <Link to="/servicos" className="btn btn-outline">Outros Serviços</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding technique-section">
        <div className="container">
          <div className="text-center reveal mb-4">
            <h2 className="heading-md">Diferenciais do Nosso Protocolo</h2>
          </div>
          
          <div className="technique-grid">
            <div className="card reveal stagger-1">
              <span className="tech-emoji">🔬</span>
              <h3>Teste de Mecha</h3>
              <p>Rigorosa avaliação prévia de resistência e compatibilidade química do seu fio.</p>
            </div>
            <div className="card reveal stagger-2">
              <span className="tech-emoji">🧪</span>
              <h3>Plex Integrado</h3>
              <p>Uso de protetores de ligações químicas durante a descoloração para evitar danos na estrutura.</p>
            </div>
            <div className="card reveal stagger-3">
              <span className="tech-emoji">💧</span>
              <h3>Tratamento Pós-Química</h3>
              <p>Protocolo imediato de reposição lipídica e ácida para fechar as cutículas e reter a hidratação.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-cta-bottom section-padding">
        <div className="container text-center reveal">
          <h2 className="heading-lg mb-2">Pronta para mudar com segurança?</h2>
          <p className="paragraph-lg mb-4 max-w-md mx-auto">
            Agende uma avaliação e vamos planejar a descoloração ideal para preservar a identidade do seu cacho.
          </p>
          <Link to="/agendar" className="btn btn-primary">
            Agendar minha avaliação agora
          </Link>
        </div>
      </section>
    </main>
  );
};

export default BleachServicePage;
