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
      "name": "O que muda no corte com visagismo?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Deixamos de usar fórmulas prontas ou simetrias artificiais. Cada camada do corte é desenhada para projetar volume onde valoriza a sua estrutura facial, formato de rosto e estilo de vida."
      }
    },
    {
      "@type": "Question",
      "name": "Tenho que mudar radicalmente meu visual?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Não. O visagismo serve para otimizar o comprimento e formato que você já gosta, ajustando apenas a distribuição de volumes e franjas para harmonizar o visual."
      }
    },
    {
      "@type": "Question",
      "name": "Como o corte se adapta ao crescimento?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Como o corte respeita as proporções do seu rosto e o caimento natural do cacho, o crescimento é mais simétrico e o design dura mais tempo sem perder a forma."
      }
    }
  ]
};

const VisagismoCachosPage = () => {
  return (
    <main className="about-page">
      <SEO 
        title="Visagismo Cabelo Cacheado Belo Horizonte | Studio do Jon" 
        description="Valorize sua imagem através do visagismo para cabelos cacheados em Belo Horizonte. Cortes planejados para sua estrutura facial e rotina. Agende." 
        url="/servicos/visagismo-cachos"
        schema={faqSchema}
      />
      <section className="about-hero section-padding">
        <div className="container text-center reveal active">
          <h1 className="heading-xl">Visagismo <span className="text-gradient">para Cachos</span></h1>
          <p className="paragraph-lg max-w-lg mx-auto mt-2">
            A harmonia exata entre as linhas do seu rosto, a física do cacho e a sua identidade.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container about-grid">
          <div className="about-visual reveal">
            <div className="about-image-wrap">
              <img src="/corte-seco-cachos-visagismo.webp" alt="Visagismo aplicado a cachos no Studio do Jon em BH" className="about-image" />
            </div>
            <div className="experience-tag">
              <span className="exp-number">Exclusivo</span>
              <span className="exp-text">Design Individual</span>
            </div>
          </div>
          
          <div className="about-content reveal">
            <h2 className="heading-lg mb-2">Seu corte deve combinar com você, não com uma foto do Instagram.</h2>
            <p className="paragraph-md mb-2">
              O visagismo aplicado a cachos analisa o formato do seu rosto, a linha dos seus olhos, a angulação da mandíbula e a mensagem que você deseja transmitir. Cachos possuem volume e linhas dinâmicas — usamos essa força física para equilibrar proporções, alongar traços ou criar impacto visual.
            </p>
            <p className="paragraph-md mb-3">
              Antes da primeira tesourada, discutimos as suas intenções. Quer mais volume no topo para alongar o rosto? Quer linhas mais suaves nas laterais para suavizar traços marcantes? Mapeamos a física do cacho durante a **Leitura de Fio** para desenhar a moldura perfeita.
            </p>
            <div className="cta-group">
              <Link to="/agendar" className="btn btn-primary">Agendar Atendimento</Link>
              <Link to="/metodo" className="btn btn-outline">Ver as 7 Etapas</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding technique-section">
        <div className="container">
          <div className="text-center reveal mb-4">
            <h2 className="heading-md">Princípios do Visagismo de Cachos</h2>
          </div>
          
          <div className="technique-grid">
            <div className="card reveal stagger-1">
              <span className="tech-emoji">📐</span>
              <h3>Análise Facial</h3>
              <p>Estudo das linhas, proporções ósseas e terços faciais para definir o melhor caimento das mechas.</p>
            </div>
            <div className="card reveal stagger-2">
              <span className="tech-emoji">💭</span>
              <h3>Intenção de Imagem</h3>
              <p>Adequação do corte à sua profissão, estilo de vida e ao que você quer comunicar visualmente.</p>
            </div>
            <div className="card reveal stagger-3">
              <span className="tech-emoji">🌀</span>
              <h3>Física do Cacho</h3>
              <p>Mapeamento do fator de encolhimento para posicionar o volume exatamente onde valoriza seu rosto.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-cta-bottom section-padding">
        <div className="container text-center reveal">
          <h2 className="heading-lg mb-2">Descubra a moldura perfeita para o seu rosto.</h2>
          <p className="paragraph-lg mb-4 max-w-md mx-auto">
            Agende seu atendimento com visagismo e tenha um design de corte pensado exclusivamente para sua estrutura.
          </p>
          <Link to="/agendar" className="btn btn-primary">
            Agendar Visagismo de Cachos
          </Link>
        </div>
      </section>
    </main>
  );
};

export default VisagismoCachosPage;
