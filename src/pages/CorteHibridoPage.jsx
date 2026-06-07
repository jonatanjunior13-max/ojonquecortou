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
      "name": "Preciso ir com o cabelo lavado de que forma?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Venha com o cabelo 100% seco, finalizado do seu jeito comum e totalmente desembaraçado. Não use coques, tranças ou presilhas que marquem o caimento natural."
      }
    },
    {
      "@type": "Question",
      "name": "Como funciona o Corte Híbrido?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "O corte é iniciado no cabelo molhado para definir a estrutura e comprimento com precisão técnica. Após a secagem e finalização, realizamos a lapidação a seco cacho por cacho para ajustar o volume e o caimento real."
      }
    },
    {
      "@type": "Question",
      "name": "Qual a frequência recomendada para manter o corte?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A média recomendada é a cada 3 ou 4 meses para manter o design e evitar pontas duplas que causam nós e quebra."
      }
    }
  ]
};

const CorteHibridoPage = () => {
  return (
    <main className="about-page">
      <SEO 
        title="Corte Híbrido Cabelo Cacheado BH | Studio do Jon" 
        description="Especialista em corte de cabelo cacheado em Belo Horizonte. Conheça o Corte Híbrido: molhado para precisão e seco para caimento. Agende já." 
        url="/servicos/corte-hibrido"
        schema={faqSchema}
      />
      <section className="about-hero section-padding">
        <div className="container text-center reveal active">
          <h1 className="heading-xl">Corte <span className="text-gradient">Híbrido</span></h1>
          <p className="paragraph-lg max-w-lg mx-auto mt-2">
            A união perfeita entre a precisão da linha molhada e a lapidação cacho por cacho a seco.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container about-grid">
          <div className="about-visual reveal">
            <div className="about-image-wrap">
              <img src="/corte-seco-cachos-definicao.webp" alt="Corte Híbrido em cabelo cacheado no Studio do Jon" className="about-image" />
            </div>
            <div className="experience-tag">
              <span className="exp-number">1h</span>
              <span className="exp-text">Duração Média</span>
            </div>
          </div>
          
          <div className="about-content reveal">
            <h2 className="heading-lg mb-2">Cortar apenas a seco ou apenas molhado é limitar o caimento.</h2>
            <p className="paragraph-md mb-2">
              Cada cacho tem um fator de encolhimento único e múltiplas texturas na mesma cabeça. Cortar às cegas ou seguir uma fórmula padrão de revista resulta em assimetria e perda de controle sobre o volume.
            </p>
            <p className="paragraph-md mb-3">
              No Studio do Jon, trabalhamos com o <strong>Corte Híbrido</strong>. Iniciamos o corte com os fios úmidos para estruturar a base geométrica com precisão cirúrgica. Após a finalização e secagem completa, lapidamos a seco cacho por cacho. Isso permite visualizar o volume e o caimento real que você terá no seu dia a dia.
            </p>
            <p className="paragraph-md mb-3">
              Todo atendimento é precedido pelo **Método Leitura de Fio** de 7 etapas para avaliar a saúde, elasticidade e curvatura do seu cabelo antes de qualquer tesourada.
            </p>
            <div className="cta-group">
              <Link to="/agendar" className="btn btn-primary">Agendar Atendimento</Link>
              <Link to="/metodo" className="btn btn-outline">Conhecer o Método</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding technique-section">
        <div className="container">
          <div className="text-center reveal mb-4">
            <h2 className="heading-md">Por que o Corte Híbrido é Superior?</h2>
          </div>
          
          <div className="technique-grid">
            <div className="card reveal stagger-1">
              <span className="tech-emoji">📐</span>
              <h3>Base Precisa</h3>
              <p>O corte inicial úmido garante que a estrutura geométrica do corte fique perfeita e sem pontas perdidas.</p>
            </div>
            <div className="card reveal stagger-2">
              <span className="tech-emoji">✂️</span>
              <h3>Lapidação Seca</h3>
              <p>O ajuste final a seco respeita a contração natural de cada cacho, garantindo simetria perfeita.</p>
            </div>
            <div className="card reveal stagger-3">
              <span className="tech-emoji">⏱️</span>
              <h3>Praticidade Real</h3>
              <p>Um corte planejado para se acomodar sozinho no dia a dia. Finalização rápida por volta de 1h de atendimento.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-cta-bottom section-padding">
        <div className="container text-center reveal">
          <h2 className="heading-lg mb-2">Chega de cortes imprevisíveis.</h2>
          <p className="paragraph-lg mb-4 max-w-md mx-auto">
            Agende seu Corte Híbrido e tenha um caimento planejado sob medida para a física do seu cacho.
          </p>
          <Link to="/agendar" className="btn btn-primary">
            Agendar Corte Híbrido agora
          </Link>
        </div>
      </section>
    </main>
  );
};

export default CorteHibridoPage;
