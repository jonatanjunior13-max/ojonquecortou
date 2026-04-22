import React from 'react';
import { Link } from 'react-router-dom';
import './AboutPage.css';

const TRINKS_URL = 'http://trinks.com/ojonquecortou';

const AboutPage = () => {
  return (
    <main className="about-page">
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
              <img src="/jon-trabalhando.jpg" alt="Jon atendendo cliente" className="about-image" />
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
              <a href={TRINKS_URL} target="_blank" rel="noreferrer" className="btn btn-primary">Agendar Consultoria</a>
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
              <h3>Corte a Seco</h3>
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
    </main>
  );
};

export default AboutPage;
