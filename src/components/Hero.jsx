import React from 'react';
import { ArrowRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Hero.css';

const Hero = () => {
  return (
    <section className="hero-section" id="inicio">
      <div className="container hero-container">
        <div className="hero-content animate-fade-in">
          <div className="badge">
            <Star size={14} className="star-icon" />
            <span>Especialista em Cachos BH</span>
          </div>
          
          <h1 className="heading-xl hero-title">
            Não "domamos" o seu cacho.<br/>
            Nós <span className="highlight-magenta">libertamos</span> a sua<br/>
            <span className="text-primary">identidade.</span>
          </h1>
          
          <p className="paragraph-lg hero-text">
            Corte especializado a seco, tratamentos reais e a dose certa de autoconfiança no coração do bairro Caiçara, Belo Horizonte.
          </p>
          
          <div className="hero-actions">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: 'fit-content' }}>
              <a href="http://trinks.com/ateliedoscachosmg" target="_blank" rel="noreferrer" className="btn btn-primary hero-btn">
                Agende seu Horário <ArrowRight size={20} />
              </a>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <a href="http://instagram.com/ojonquecortou" target="_blank" rel="noreferrer" className="btn btn-outline" style={{ fontSize: '0.9rem', padding: '0.75rem 1.5rem' }}>
                  Confira meu Instagram
                </a>
                <a href="https://wa.me/553135866673" target="_blank" rel="noreferrer" className="btn btn-outline" style={{ fontSize: '0.9rem', padding: '0.75rem 1.5rem' }}>
                  WhatsApp
                </a>
                <Link to="/sobre" className="btn btn-outline" style={{ fontSize: '0.9rem', padding: '0.75rem 1.5rem' }}>
                  Conheça o Jon
                </Link>
              </div>
            </div>
            
            <div className="hero-stats">
              <div className="avatar-group">
                {/* Placeholder avatars for social proof */}
                <div className="avatar"></div>
                <div className="avatar"></div>
                <div className="avatar"></div>
                <div className="avatar cta-avatar">+2k</div>
              </div>
              <p className="stats-text text-gray">
                Cachos transformados com <span className="text-magenta font-semibold">amor</span>.
              </p>
            </div>
          </div>
        </div>
        
        <div className="hero-visual">
          {/* This is a placeholder for Jon's professional photo. */}
          <div className="visual-card glass-panel">
            <div className="image-placeholder" style={{ padding: 0, overflow: 'hidden', backgroundColor: 'transparent', boxShadow: 'none' }}>
              <img src="/jon-perfil.jpg" alt="Foto Profissional do Jon" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="blob blob-blue"></div>
          <div className="blob blob-magenta"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
