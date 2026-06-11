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
      "name": "O que é o Big Chop e quando devo fazer?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "É o corte que remove toda a química de uma vez. A escolha é sua: podemos fazer o Big Chop direto se você já tiver comprimento suficiente, ou fazer cortes graduais para remover a química aos poucos."
      }
    },
    {
      "@type": "Question",
      "name": "Como lidar com as duas texturas durante o dia a dia?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Ensinamos técnicas de texturização sem fonte de calor para igualar o caimento da parte lisa com a raiz cacheada sem quebrar o fio."
      }
    },
    {
      "@type": "Question",
      "name": "Quanto tempo dura o processo de transição?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Depende da velocidade de crescimento do seu cabelo e do comprimento final que você deseja manter. O suporte técnico contínuo reduz a quebra nesse período."
      }
    }
  ]
};

const TransicaoCapilarPage = () => {
  return (
    <main className="about-page">
      <SEO 
        title="Transição Capilar BH | Studio do Jon — Especialista em Cachos" 
        description="Passando pela transição capilar em BH? O Studio do Jon oferece cortes progressivos e suporte técnico para recuperar seus cachos com segurança. Agende." 
        url="/servicos/transicao-capilar"
        schema={faqSchema}
      />
      <section className="about-hero section-padding">
        <div className="container text-center reveal active">
          <h1 className="heading-xl">Transição <span className="text-gradient">Capilar</span></h1>
          <p className="paragraph-lg max-w-lg mx-auto mt-2">
            Recupere a sua curvatura natural e reconstrua sua identidade sem pressa e com técnica.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container about-grid">
          <div className="about-visual reveal">
            <div className="about-image-wrap">
              <img src="/blog-transicao-bh.webp" alt="Transição capilar no Studio do Jon em BH" className="about-image" />
            </div>
            <div className="experience-tag">
              <span className="exp-number">Saúde</span>
              <span className="exp-text">Foco na Raiz</span>
            </div>
          </div>
          
          <div className="about-content reveal">
            <h2 className="heading-lg mb-2">A transição capilar não é sobre paciência, é sobre técnica.</h2>
            <p className="paragraph-md mb-2">
              Cortar a parte com química exige entender a linha de demarcação exata onde o seu cacho natural volta a nascer. No Studio do Jon, ajudamos você a passar por esse processo de forma confortável, sem precisar recorrer ao Big Chop radical logo no primeiro dia — a menos que você queira.
            </p>
            <p className="paragraph-md mb-3">
              O processo começa com a **Leitura de Fio**. Identificamos onde a química perdeu a força e onde a sua curvatura natural (seja 2, 3 ou 4) está se reestruturando. O corte é feito estrategicamente para disfarçar as pontas lisas enquanto o comprimento natural ganha espaço, mantendo a harmonia visual.
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
            <h2 className="heading-md">Suporte Completo na Transição</h2>
          </div>
          
          <div className="technique-grid">
            <div className="card reveal stagger-1">
              <span className="tech-emoji">✂️</span>
              <h3>Cortes Adaptativos</h3>
              <p>Cortes graduais para tirar o liso químico mantendo a forma e o volume do cabelo.</p>
            </div>
            <div className="card reveal stagger-2">
              <span className="tech-emoji">🌱</span>
              <h3>Saúde Folicular</h3>
              <p>Tratamento focado no couro cabeludo para estimular o crescimento de fios fortes.</p>
            </div>
            <div className="card reveal stagger-3">
              <span className="tech-emoji">🎓</span>
              <h3>Treino de Estilização</h3>
              <p>Aprenda técnicas de texturização e finalização para lidar com as duas texturas no dia a dia.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-cta-bottom section-padding">
        <div className="container text-center reveal">
          <h2 className="heading-lg mb-2">Pronta para redefinir seu visual?</h2>
          <p className="paragraph-lg mb-4 max-w-md mx-auto">
            Agende uma avaliação e vamos criar uma estratégia de corte confortável para o seu crescimento natural.
          </p>
          <Link to="/agendar" className="btn btn-primary">
            Agendar Transição Capilar
          </Link>
        </div>
      </section>
    </main>
  );
};

export default TransicaoCapilarPage;
