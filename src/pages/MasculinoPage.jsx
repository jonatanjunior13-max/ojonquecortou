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
    <main className="about-page">
      <SEO 
        title="Corte Cabelo Cacheado Masculino BH | Studio do Jon" 
        description="Especialista em corte masculino para cabelos cacheados e crespos em BH. Definição, praticidade e visagismo sem degradê genérico. Agende." 
        url="/servicos/masculino"
        schema={faqSchema}
      />
      <section className="about-hero section-padding">
        <div className="container text-center reveal active">
          <h1 className="heading-xl">Masculino <span className="text-gradient">Cacheado</span></h1>
          <p className="paragraph-lg max-w-lg mx-auto mt-2">
            Cortes estruturados com tesoura e acabamentos de precisão que valorizam seu volume natural.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container about-grid">
          <div className="about-visual reveal">
            <div className="about-image-wrap">
              <img src="/corte-masculino-cacheado-bh-resultado.webp" alt="Corte masculino cacheado no Studio do Jon em BH" className="about-image" />
            </div>
            <div className="experience-tag">
              <span className="exp-number">1h</span>
              <span className="exp-text">Prático & Técnico</span>
            </div>
          </div>
          
          <div className="about-content reveal">
            <h2 className="heading-lg mb-2">Chega de degradê genérico que ignora a curvatura do seu cacho.</h2>
            <p className="paragraph-md mb-2">
              Cabelo masculino cacheado e crespo exige um corte estruturado que respeite o caimento. Se o barbeiro passar a máquina nas laterais sem ler o comportamento do seu fio, o resultado é um topo sem definição e laterais espetadas.
            </p>
            <p className="paragraph-md mb-3">
              No Studio do Jon, aplicamos a **Leitura de Fio** e técnicas de visagismo masculino para criar cortes práticos e com excelente definição. Trabalhamos com Wolf Cuts, Undercuts desenhados para cachos e cortes clássicos na tesoura que valorizam o volume sem dar trabalho na hora de arrumar. O foco é praticidade: acordar, finalizar rápido e sair pronto.
            </p>
            <div className="cta-group">
              <Link to="/agendar" className="btn btn-primary">Agendar Atendimento</Link>
              <Link to="/servicos" className="btn btn-outline">Outros Serviços</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding technique-section">
        <div className="container">
          <div className="text-center reveal mb-4">
            <h2 className="heading-md">Diferenciais do Corte Masculino</h2>
          </div>
          
          <div className="technique-grid">
            <div className="card reveal stagger-1">
              <span className="tech-emoji">⚡</span>
              <h3>Praticidade Diária</h3>
              <p>Cortes pensados para que a sua finalização dure menos de 5 minutos, sem mistérios.</p>
            </div>
            <div className="card reveal stagger-2">
              <span className="tech-emoji">📐</span>
              <h3>Acabamento Limpo</h3>
              <p>Laterais e nuca limpas de forma integrada com o volume e caimento do topo.</p>
            </div>
            <div className="card reveal stagger-3">
              <span className="tech-emoji">✂️</span>
              <h3>Estrutura na Tesoura</h3>
              <p>Evitamos o uso excessivo de máquina para preservar a textura e a definição das pontas.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-cta-bottom section-padding">
        <div className="container text-center reveal">
          <h2 className="heading-lg mb-2">Seu cabelo com estilo e sem enrolação.</h2>
          <p className="paragraph-lg mb-4 max-w-md mx-auto">
            Agende seu horário com quem entende a mecânica do cacho masculino em Belo Horizonte.
          </p>
          <Link to="/agendar" className="btn btn-primary">
            Agendar Corte Masculino
          </Link>
        </div>
      </section>
    </main>
  );
};

export default MasculinoPage;
