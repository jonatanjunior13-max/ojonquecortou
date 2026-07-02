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
              <span className="exp-number">R$ 130</span>
              <span className="exp-text">Valor do Investimento</span>
            </div>
          </div>
          
          <div className="about-content reveal">
            <h2 className="heading-lg mb-2">Chega de degradê genérico que ignora a curvatura do seu cacho.</h2>
            <p className="paragraph-md mb-2">
              Cabelo masculino cacheado e crespo exige um corte estruturado que respeite o caimento. Se o barbeiro passar a máquina nas laterais sem ler o comportamento do seu fio, o resultado é um topo sem definição e laterais espetadas. A haste capilar texturizada masculina tem particularidades de densidade e distribuição que exigem conexões precisas feitas à tesoura.
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

      <section className="section-padding" style={{ background: 'var(--bg-warm)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <h2 className="heading-md mb-2">A Importância do Corte Geométrico com Tesoura</h2>
          <p className="paragraph-md mb-3">
            Nas barbearias comuns, o uso excessivo de máquina de corte com pentes genéricos destrói a coesão dos cachos masculinos. Ao cortar os fios na mesma altura mecânica, a máquina corta os cachos no meio de sua curvatura natural, deixando pontas retas que espetam e perdem a capacidade de espiralar sozinhos.
          </p>
          <p className="paragraph-md mb-3">
            O nosso corte masculino é estruturado **seção por seção à tesoura**, respeitando o ângulo de crescimento. Isso garante que:
          </p>
          <ul className="about-list mb-3">
            <li>As laterais tenham encaixe harmônico com o topo, sem criar o efeito "capacete".</li>
            <li>O topo mantenha o volume ideal com balanço natural e cachos definidos.</li>
            <li>O acabamento de nuca e costeletas seja limpo e dure mais tempo sem perder o desenho.</li>
          </ul>
        </div>
      </section>

      <section className="section-padding">
        <div className="container" style={{ maxWidth: '800px' }}>
          <h2 className="heading-md text-center mb-3">Guia Rápido de Estilização Masculina em 3 Minutos</h2>
          <p className="paragraph-md mb-3 text-center">
            Praticidade é a regra. Siga estes passos simples pela manhã para manter os cachos alinhados o dia todo:
          </p>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="paragraph-md mb-2"><strong>Passo 1: Umedecer (30s)</strong> - Borrifar água de leve ou finalizar logo após o banho. O cacho precisa de água para reativar as pontes de hidrogênio e ganhar forma.</p>
            <p className="paragraph-md mb-2"><strong>Passo 2: Leave-in Fluido (1min)</strong> - Distribua uma pequena quantidade de creme de pentear leve apenas no topo, usando a técnica de fitagem rápida com os dedos.</p>
            <p className="paragraph-md mb-2"><strong>Passo 3: Gelatina ou Gel (30s)</strong> - Amasse os cachos de baixo para cima com uma pequena quantidade de gel ou gelatina líquida para garantir fixação e evitar que o vento desfaça a definição.</p>
            <p className="paragraph-md mb-0"><strong>Passo 4: Secar ao ar ou Difusor (1min)</strong> - Deixe secar naturalmente ou use o difusor por 1 minuto se estiver com pressa.</p>
          </div>
        </div>
      </section>

      <section className="section-padding technique-section" style={{ background: 'var(--bg-warm)' }}>
        <div className="container">
          <div className="text-center reveal mb-4">
            <h2 className="heading-md">Diferenciais do Corte Masculino</h2>
          </div>
          
          <div className="technique-grid">
            <div className="card reveal stagger-1">
              <span className="tech-emoji">⚡</span>
              <h3>Praticidade Diária</h3>
              <p>Cortes pensados para que a sua finalização dure menos de 5 minutos, sem mistérios ou rotinas complexas.</p>
            </div>
            <div className="card reveal stagger-2">
              <span className="tech-emoji">📐</span>
              <h3>Acabamento Limpo</h3>
              <p>Laterais e nuca limpas de forma integrada com o volume e caimento do topo, valorizando o desenho do corte.</p>
            </div>
            <div className="card reveal stagger-3">
              <span className="tech-emoji">✂️</span>
              <h3>Estrutura na Tesoura</h3>
              <p>Evitamos o uso excessivo de máquina para preservar a textura e a definição das pontas, garantindo caimento orgânico.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container">
          <div className="text-center reveal mb-4">
            <h2 className="heading-md">Leia Mais e Conheça Nosso Trabalho</h2>
          </div>

          <div className="technique-grid">
            <Link to="/servicos/corte-hibrido" className="card reveal stagger-1" style={{ textDecoration: 'none' }}>
              <h3>Corte Híbrido</h3>
              <p>Conheça nossa técnica de corte que combina precisão úmida e lapidação seca.</p>
            </Link>
            <Link to="/metodo" className="card reveal stagger-2" style={{ textDecoration: 'none' }}>
              <h3>O Método do Studio</h3>
              <p>Entenda a metodologia científica que aplicamos a cada tipo de curvatura.</p>
            </Link>
            <Link to="/servicos/leitura-de-fio" className="card reveal stagger-3" style={{ textDecoration: 'none' }}>
              <h3>Leitura de Fio</h3>
              <p>Entenda o diagnóstico individual que fazemos antes de qualquer corte no Studio.</p>
            </Link>
          </div>
        </div>
      </section>

      <section className="about-cta-bottom section-padding" style={{ background: 'var(--bg-warm)' }}>
        <div className="container text-center reveal">
          <h2 className="heading-lg mb-2">Seu cabelo com estilo e sem enrolação.</h2>
          <p className="paragraph-lg mb-4 max-w-md mx-auto">
            Agende seu horário com quem entende a mecânica do cacho masculino em Belo Horizonte. Atendimento exclusivo por R$ 130.
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
