import React from 'react';
import { ArrowRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Hero.css';

const Hero = () => {
  return (
    <section className="hero-section" id="inicio">
      <div className="container hero-container">
        <div className="hero-content reveal active">
          <div className="badge mb-2">
            <Star size={14} className="star-icon" />
            <span>Especialista em Cachos BH</span>
          </div>
          
          <h1 className="heading-xl hero-title">
            O Jon que Cortou: <br /> <span className="text-gradient">o especialista que lê o seu fio antes de cortar.</span>
          </h1>
          
          <p className="paragraph-lg hero-text mb-4">
            Antes de qualquer tesoura, Jon analisa espessura, porosidade e curvatura do seu fio. Corte técnico para cabelos ondulados, cacheados e crespos no Caiçara, BH.
          </p>
          
          <div className="hero-actions stagger-1">
            <div className="hero-btns-group">
              <a href="http://trinks.com/ojonquecortou" target="_blank" rel="noreferrer" className="btn btn-primary hero-btn">
                Agende seu Horário <ArrowRight size={20} style={{ marginLeft: '10px' }} />
              </a>
              <div className="hero-secondary-btns">
                <a href="https://wa.me/553135866673" target="_blank" rel="noreferrer" className="btn btn-outline">
                  WhatsApp
                </a>
                <a href="http://instagram.com/ojonquecortou" target="_blank" rel="noreferrer" className="btn btn-outline">
                  Meu Instagram
                </a>
                <Link to="/sobre" className="btn btn-outline">
                  Conheça o Jon
                </Link>
              </div>
            </div>
            
            <div className="hero-stats mt-4 stagger-2">
              <div className="avatar-group">
                <div className="avatar cta-avatar">+4k</div>
              </div>
              <p className="stats-text">+4.000 atendimentos especializados em curvaturas.</p>
            </div>
          </div>
        </div>
        
        <div className="hero-visual reveal active stagger-3">
          <div className="visual-card">
            <img src="/jon-perfil.jpg" alt="Jon, especialista em corte para cabelos cacheados e crespos em Belo Horizonte" className="hero-image" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
