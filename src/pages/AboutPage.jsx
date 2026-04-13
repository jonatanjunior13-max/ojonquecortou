import React from 'react';
import { Link } from 'react-router-dom';
import './AboutPage.css';

const TRINKS_URL = 'http://trinks.com/ojonquecortou';

const services = [
  { emoji: '✂️', label: 'Corte Especializado (Ondas, Cachos e Crespos)' },
  { emoji: '💆', label: 'Tratamentos Personalizados (Hidratação, Nutrição e Reconstrução)' },
  { emoji: '🌟', label: 'Mechas e Luzes com Segurança (Teste de mecha obrigatório)' },
  { emoji: '🌿', label: 'Detox Capilar para crescimento saudável' },
];

const AboutPage = () => {
  return (
    <main className="about-page">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="about-hero">
        <div className="about-hero-bg" />
        <div className="container about-hero-content">
          <span className="about-badge">Especialista em Cachos · Caiçara, BH</span>
          <h1 className="about-hero-title">
            Jon: Especialista em <br />
            <span className="text-gradient">Cachos no Caiçara</span>
          </h1>
          <p className="about-hero-sub">
            Referência em Cabelos Naturais na Região do Caiçara e Pedro II
          </p>
        </div>
      </section>

      {/* ── Quem é o Jon ─────────────────────────────────────── */}
      <section className="about-intro section-padding">
        <div className="container about-intro-grid">
          <div className="about-photo-col">
            <div className="about-photo-wrap">
              <img
                src="/jon-trabalhando.jpg"
                alt="Jon especialista em cachos atendendo no Studio do Jon no Caiçara BH"
                className="about-photo"
              />
              <div className="about-exp-badge">
                <span className="exp-num">8+</span>
                <span className="exp-lbl">Anos de<br />Experiência</span>
              </div>
            </div>
          </div>

          <div className="about-text-col">
            <span className="section-label">Sobre o Jon</span>
            <h2 className="about-section-title">
              Muito prazer,<br />
              eu sou o <span className="text-magenta">Jon.</span>
            </h2>
            <div className="title-bar" />

            <p className="about-body">
              Se você procura um especialista em cachos no Caiçara (BH) que realmente entenda
              a ciência por trás das curvaturas, prazer. Meu Studio é um refúgio para quem
              cansou de cortes genéricos e busca um atendimento personalizado para cabelos
              ondulados, cacheados e crespos — do <strong>2ABC ao 4ABC</strong>.
            </p>
            <p className="about-body">
              Localizado estrategicamente próximo à <strong>Avenida Pedro II</strong>, no coração
              do bairro Caiçara, meu espaço foi criado para oferecer técnica de ponta com o
              acolhimento que a comunidade de Belo Horizonte merece. Aqui, o foco é a
              <strong> liberdade do seu fio natural</strong>.
            </p>

            <div className="about-cta-row">
              <a href={TRINKS_URL} target="_blank" rel="noreferrer" className="btn btn-primary">
                📅 Agende sua transformação
              </a>
              <Link to="/servicos" className="btn btn-outline">Ver Serviços</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Técnica ──────────────────────────────────────────── */}
      <section className="about-technique section-padding">
        <div className="container about-technique-inner">
          <div className="technique-text">
            <span className="section-label">Método e Visagismo</span>
            <h2 className="about-section-title">
              Corte para Cabelo Cacheado<br />
              no Caiçara: <span className="text-primary">Técnica e Visagismo</span>
            </h2>
            <div className="title-bar" />
            <p className="about-body">
              Diferente dos salões tradicionais, meu método de corte para cabelo cacheado em BH
              respeita o <strong>fator de encolhimento</strong> e a densidade de cada mola.
              Utilizo o <strong>corte a seco (dry cutting)</strong> para esculpir o volume ideal,
              garantindo que o seu visual funcione não só no espelho do salão, mas na sua
              rotina real em casa.
            </p>
            <p className="about-body">
              Seja para um corte radical, uma <strong>transição capilar</strong> ou apenas para
              devolver o movimento aos fios, meu objetivo é entregar um formato que valorize o
              seu rosto e a sua identidade.
            </p>
          </div>

          <div className="technique-cards">
            <div className="tech-card">
              <span className="tech-icon">✂️</span>
              <h3>Corte a Seco</h3>
              <p>Escultura do volume real, sem distorção de medidas causada pela umidade.</p>
            </div>
            <div className="tech-card">
              <span className="tech-icon">🔬</span>
              <h3>Análise da Curvatura</h3>
              <p>Identificação do padrão (2ABC–4ABC) e do fator de encolhimento individual.</p>
            </div>
            <div className="tech-card">
              <span className="tech-icon">🪞</span>
              <h3>Visagismo</h3>
              <p>Formato de corte adaptado ao formato do rosto para valorizar o resultado.</p>
            </div>
            <div className="tech-card">
              <span className="tech-icon">🏠</span>
              <h3>Rotina Real</h3>
              <p>Consultoria de finalização para que o resultado funcione em casa, todo dia.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Saúde Capilar ────────────────────────────────────── */}
      <section className="about-health section-padding">
        <div className="container">
          <div className="health-header text-center">
            <span className="section-label">Saúde Capilar</span>
            <h2 className="about-section-title">
              Tratamentos e Saúde Capilar<br />
              <span className="text-primary">em Belo Horizonte</span>
            </h2>
            <div className="title-bar mx-auto" />
            <p className="about-body health-intro">
              Além de ser referência em corte no Caiçara, sou focado em <strong>saúde da fibra
              capilar</strong>. Realizo uma análise clínica antes de qualquer procedimento,
              tratando desde a porosidade do fio até questões do couro cabeludo, como
              oleosidade e dermatite.
            </p>
          </div>

          <p className="health-subtitle">No Studio do Jon, você encontra:</p>

          <div className="services-list">
            {services.map((s, i) => (
              <div className="service-item" key={i}>
                <span className="service-item-icon">{s.emoji}</span>
                <span className="service-item-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Final ─────────────────────────────────────────── */}
      <section className="about-final-cta section-padding">
        <div className="container">
          <div className="final-cta-box">
            <span className="final-cta-emoji">💈</span>
            <h2 className="final-cta-title">
              Agende seu horário no Studio do Jon
            </h2>
            <p className="final-cta-body">
              Procurando por <strong>salão especializado em cachos no Caiçara</strong> ou{' '}
              <strong>especialista em cabelos naturais em BH</strong>? Venha viver uma
              experiência autêntica, com muita conversa boa, técnica de verdade e zero frescura.
            </p>
            <p className="final-cta-body">
              O Studio do Jon te espera no Caiçara. Clique no botão abaixo e agende sua
              transformação online!
            </p>
            <div className="final-cta-buttons">
              <a
                href={TRINKS_URL}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
                style={{ padding: '1rem 2rem', fontSize: '1rem', borderRadius: '50px' }}
              >
                📅 Agendar minha Transformação
              </a>
              <Link to="/servicos" className="btn btn-outline">
                Ver todos os Serviços
              </Link>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
};

export default AboutPage;
