import React from 'react';
import { MapPin, Phone, Scissors } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Footer.css';

const InstagramIcon = ({ size = 20 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

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
              <InstagramIcon size={20} />
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
