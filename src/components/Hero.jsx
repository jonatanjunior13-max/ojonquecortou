import React from 'react';
import { Link } from 'react-router-dom';
import './Hero.css';

const Hero = () => {
  return (
    <section className="hero-section" id="inicio">
      <div className="container hero-container">
        <div className="hero-content reveal active">
          <div className="hero-badge mb-2">
            <span>● ESPECIALISTA EM CACHOS E CRESPOS EM BH</span>
          </div>
          
          <h1 className="hero-title mb-2">
            O corte que <br /> <span className="text-gradient">respeita o seu fio.</span>
          </h1>
          
          <p className="hero-text mb-4">
            Leitura de fio, corte a seco e educação real — atendimento exclusivo para ondulados, cacheados e crespos no coração do Caiçara.
          </p>
          
          <div className="hero-actions stagger-1">
            <a href="https://wa.me/553135866673" target="_blank" rel="noreferrer" className="btn btn-primary whatsapp-btn">
              <span className="btn-icon">💬</span> Agendar pelo WhatsApp
            </a>
            <a href="http://trinks.com/ojonquecortou" target="_blank" rel="noreferrer" className="btn btn-outline">
              Ver disponibilidade
            </a>
          </div>

          <div className="hero-stats-grid mt-4 stagger-2">
            <div className="stat-item">
              <span className="stat-number">8+</span>
              <span className="stat-label">anos de experiência</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">500+</span>
              <span className="stat-label">clientes atendidos</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">5★</span>
              <span className="stat-label">no Google</span>
            </div>
          </div>
        </div>
        
        <div className="hero-grid-visual reveal active stagger-3">
          <div className="hero-grid">
            <div className="grid-item large">
              <div className="placeholder-img">
                <span className="placeholder-label">resultado antes/depois 3B</span>
              </div>
            </div>
            <div className="grid-item small">
              <div className="placeholder-img">
                <span className="placeholder-label">cacho 2C/3A</span>
              </div>
            </div>
            <div className="grid-item medium">
              <div className="placeholder-img">
                <span className="placeholder-label">Jon em ação</span>
              </div>
            </div>
            <div className="grid-item tall">
              <div className="placeholder-img">
                <span className="placeholder-label">resultado crespo 4A/4B</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
