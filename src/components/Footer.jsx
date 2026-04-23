import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer-dark">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <img src="/logo-cabeleireiro-de-cachos.png" alt="O Jon que Cortou" className="logo-img invert" />
          </Link>
          <p className="footer-tagline">
            Especialista em cachos, crespos e ondulados no bairro Caiçara, Belo Horizonte. Atendimento exclusivo com leitura de fio e corte a seco.
          </p>
          <div className="footer-social">
            <a href="#" className="social-mini-btn">📸</a>
            <a href="#" className="social-mini-btn">💬</a>
            <a href="#" className="social-mini-btn">👍</a>
          </div>
        </div>

        <div className="footer-nav-col">
          <h4>SERVIÇOS</h4>
          <ul>
            <li><Link to="/servicos">Corte com Técnica</Link></li>
            <li><Link to="/servicos">Nutrição Terapêutica</Link></li>
            <li><Link to="/servicos">Corte + Nutrição</Link></li>
            <li><Link to="/servicos">Coloração Ruivos</Link></li>
          </ul>
        </div>

        <div className="footer-nav-col">
          <h4>STUDIO</h4>
          <ul>
            <li><a href="/#metodo">Método do Jon</a></li>
            <li><Link to="/sobre">Sobre o Jon</Link></li>
            <li><a href="/#reviews">Depoimentos</a></li>
            <li><a href="/#location">Localização</a></li>
          </ul>
        </div>

        <div className="footer-nav-col">
          <h4>AGENDAR</h4>
          <ul>
            <li><a href="https://wa.me/553135866673">WhatsApp</a></li>
            <li><a href="http://trinks.com/ojonquecortou">Trinks Online</a></li>
            <li><a href="/#faq">Perguntas frequentes</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container bottom-content">
          <p>&copy; {new Date().getFullYear()} O Jon que Cortou. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
