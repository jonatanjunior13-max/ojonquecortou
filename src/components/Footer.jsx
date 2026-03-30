import React from 'react';
import { MapPin, Phone, Scissors } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer-section">
      <div className="container footer-container">
        
        <div className="footer-brand">
          <a href="#" className="logo mb-2">
            <Scissors className="logo-icon text-yellow" size={28} />
            <span className="logo-text text-white">Studio do Jon</span>
          </a>
          <p className="footer-desc">
            Básico? Hoje não, Faro. Liberte sua curvatura e sinta o poder do cacho bem cuidado.
          </p>
          
          <div className="social-links">
            <a href="http://instagram.com/ojonquecortou" target="_blank" rel="noreferrer" className="social-icon">
              <span style={{ fontWeight: 800 }}>IG</span>
            </a>
          </div>
        </div>
        
        <div className="footer-links">
          <h4 className="footer-heading">Links Úteis</h4>
          <ul>
            <li><a href="#inicio">Início</a></li>
            <li><a href="#sobre">Sobre o Jon</a></li>
            <li><a href="#servicos">Nossos Serviços</a></li>
            <li><a href="http://trinks.com/ateliedoscachosmg" target="_blank" rel="noreferrer">Agendar Online</a></li>
          </ul>
        </div>
        
        <div className="footer-contact">
          <h4 className="footer-heading">Fale Conosco</h4>
          
          <div className="contact-item">
            <MapPin size={20} className="contact-icon text-magenta" />
            <div>
              <strong>Onde Estamos</strong>
              <p>Rua Francisco Ovidio, 184<br/>Caiçara, BH / MG</p>
            </div>
          </div>
          
          <div className="contact-item mt-2">
            <Phone size={20} className="contact-icon text-yellow" />
            <div>
              <strong>WhatsApp</strong>
              <p>(31) 3586-6673</p>
            </div>
          </div>
          
        </div>
        
        <div className="footer-hours">
          <h4 className="footer-heading">Horário</h4>
          <ul className="hours-list">
            <li><span>Terça a Sexta</span> <span>09:00 - 19:00</span></li>
            <li><span>Sábado</span> <span>09:00 - 17:00</span></li>
            <li className="closed"><span>Domingo e Segunda</span> <span>Fechado</span></li>
          </ul>
        </div>
        
      </div>
      
      <div className="footer-bottom">
        <div className="container bottom-container">
          <p>&copy; {new Date().getFullYear()} O Jon que Cortou. Todos os direitos reservados.</p>
          <div className="legal-links">
            <a href="#">Política de Privacidade</a>
            <a href="#">Termos e Condições</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
