import React from 'react';
import { MapPin, Phone, Scissors, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer-section reveal">
      <div className="container footer-container">
        <div className="footer-brand">
          <Link to="/" className="logo mb-2">
            <Scissors className="logo-icon" size={28} />
            <span className="logo-text">O Jon Que Cortou</span>
          </Link>
          <p className="footer-desc">
            Especialista em corte para cabelos ondulados, cacheados e crespos com foco em visagismo em Belo Horizonte.
          </p>
          <div className="social-links">
            <a href="http://instagram.com/ojonquecortou" target="_blank" rel="noreferrer" className="social-icon">
              <Instagram size={20} />
            </a>
          </div>
        </div>

        <div className="footer-links">
          <h4 className="footer-heading">Navegação</h4>
          <ul>
            <li><Link to="/">Início</Link></li>
            <li><Link to="/sobre">Sobre o Jon</Link></li>
            <li><Link to="/servicos">Serviços</Link></li>
            <li><Link to="/blog">Blog</Link></li>
            <li><a href="http://trinks.com/ojonquecortou" target="_blank" rel="noreferrer">Agendar Online</a></li>
          </ul>
        </div>

        <div className="footer-contact">
          <h4 className="footer-heading">Contato</h4>
          <div className="contact-item">
            <MapPin size={18} className="contact-icon" />
            <p>Rua Francisco Ovidio, 184<br/>Caiçara, BH / MG</p>
          </div>
          <div className="contact-item">
            <Phone size={18} className="contact-icon" />
            <p>(31) 3586-6673</p>
          </div>
        </div>

        <div className="footer-hours">
          <h4 className="footer-heading">Horário de Atendimento</h4>
          <ul className="hours-list">
            <li><span>Terça a Sexta</span> <span>09:00 — 19:00</span></li>
            <li><span>Sábado</span> <span>09:00 — 17:00</span></li>
            <li className="closed"><span>Dom e Seg</span> <span>Fechado</span></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container bottom-container">
          <p>&copy; {new Date().getFullYear()} O Jon que Cortou. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
