import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import './AboutPage.css';

const TRINKS_URL = '/agendar';

const AboutPage = () => {
  return (
    <main className="about-page">
      <SEO 
        title="Cabeleireiro Especialista em Cachos BH | O Jon que Cortou" 
        description="Conheça o Jon, cabeleireiro especialista em cabelos cacheados, crespos e ondulados em BH. Conheça o Método Leitura de Fio e o espaço no bairro Caiçara." 
      />
      <section className="about-hero section-padding">
        <div className="container text-center reveal active">
          <h1 className="heading-xl">Muito Prazer, <span className="text-gradient">O Jon</span>.</h1>
          <p className="paragraph-lg max-w-lg mx-auto mt-2">
            Especialista em curvaturas e visagismo no coração do bairro Caiçara, BH.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container about-grid">
          <div className="about-visual reveal">
            <div className="about-image-wrap">
              <img src="/jon-trabalhando.webp" alt="Jon atendendo cliente" className="about-image" />
            </div>
            <div className="experience-tag">
              <span className="exp-number">8+</span>
              <span className="exp-text">Anos de Especialização</span>
            </div>
          </div>
          
          <div className="about-content reveal">
            <h2 className="heading-lg mb-2">O Cabelo não mente.<br />O corte errado, sim.</h2>
            <p className="paragraph-md mb-2">
              Se você procura um especialista em cachos em Belo Horizonte que realmente entenda a ciência por trás das curvaturas, prazer. Meu Studio é um refúgio para quem cansou de cortes genéricos e busca um atendimento personalizado para cabelos ondulados, cacheados e crespos.
            </p>
            <p className="paragraph-md mb-3">
              Não sou apenas um cabeleireiro. Sou um leitor de fios. No Caiçara (BH), construí um espaço focado na <strong>liberdade do seu fio natural</strong>, utilizando técnicas que respeitam o fator de encolhimento e a identidade de cada cliente.
            </p>
            <div className="cta-group">
              <Link to="/agendar" className="btn btn-primary">Agendar Consultoria</Link>
              <Link to="/servicos" className="btn btn-outline">Ver Serviços</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding technique-section">
        <div className="container">
          <div className="text-center reveal mb-4">
            <h2 className="heading-md">Método & Técnica</h2>
          </div>
          
          <div className="technique-grid">
            <div className="card reveal stagger-1">
              <span className="tech-emoji">🔬</span>
              <h3>Leitura de Fio</h3>
              <p>Análise clínica de porosidade, espessura e saúde antes de qualquer tesoura.</p>
            </div>
            <div className="card reveal stagger-2">
              <span className="tech-emoji">✂️</span>
              <h3>Corte com Técnica</h3>
              <p>Escultura do volume real, garantindo que o visual funcione no seu dia a dia.</p>
            </div>
            <div className="card reveal stagger-3">
              <span className="tech-emoji">🪞</span>
              <h3>Visagismo</h3>
              <p>Harmonização do corte com o formato do seu rosto e sua personalidade.</p>
            </div>
          </div>
        </div>
      </section>
      {/* ── Como Chegar ── */}
      <section className="section-padding" style={{ background: 'var(--bg-warm)' }}>
        <div className="container">
          <div className="text-center reveal mb-4">
            <h2 className="heading-md">Como Chegar</h2>
            <p className="paragraph-md" style={{ marginTop: '0.5rem' }}>
              Studio do Jon · R. Francisco Ovídio, 184 · Caiçara · Belo Horizonte, MG
            </p>
          </div>
          <div className="reveal" style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--rule)', boxShadow: '0 8px 32px rgba(26,19,16,0.08)' }}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3751.3741037334435!2d-43.9678756253839!3d-19.908634081475036!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xa69341f36fd6f3%3A0xe6c5e30e4bbba519!2sO%20Jon%20que%20Cortou%20-%20Especialista%20em%20Cachos%20%7C%20Cabeleireiro%20em%20BH!5e0!3m2!1spt-BR!2sbr!4v1779265943789!5m2!1spt-BR!2sbr"
              width="100%"
              height="450"
              style={{ border: 0, display: 'block' }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Localização do Studio do Jon — Caiçara, Belo Horizonte"
            />
          </div>
          <p className="text-center paragraph-md" style={{ marginTop: '1.5rem', color: 'var(--muted)' }}>
            📍 Bairro Caiçara · BH · Próximo ao metrô Gameleira
          </p>
        </div>
      </section>

      <section className="about-cta-bottom section-padding">
        <div className="container text-center reveal">
          <h2 className="heading-lg mb-2">Venha viver essa experiência</h2>
          <p className="paragraph-lg mb-4 max-w-md mx-auto">
            Meu Studio no Caiçara está pronto para receber você e seus cachos.
          </p>
          <Link to="/agendar" className="btn btn-primary">
            Garantir meu horário agora
          </Link>
        </div>
      </section>
    </main>
  );
};

export default AboutPage;
