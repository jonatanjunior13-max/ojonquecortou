import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">
              O Jon que<br/><span className="italic">cortou.</span>
            </div>
            <p style={{ color: "var(--muted)", fontSize: 14.5, maxWidth: "38ch", margin: 0 }}>
              Studio especializado em cabelos cacheados e crespos em Belo Horizonte.
              Leitura técnica antes da tesoura. Caiçara, BH.
            </p>
          </div>

          <div>
            <h4>Studio</h4>
            <ul>
              <li><Link to="/sobre">Sobre o Jon</Link></li>
              <li><Link to="/servicos">Serviços</Link></li>
              <li><Link to="/galeria">Galeria</Link></li>
              <li><Link to="/depoimentos">Depoimentos</Link></li>
              <li><Link to="/blog">Blog</Link></li>
            </ul>
          </div>

          <div>
            <h4>Diário</h4>
            <ul>
              <li><Link to="/blog/leitura-de-fio-metodo-exclusivo-studio-do-jon">Método Leitura de Fio</Link></li>
              <li><Link to="/blog/cronograma-capilar-cabelo-cacheado">Cronograma capilar</Link></li>
              <li><Link to="/blog/corte-para-cabelo-cacheado-mentira-do-corte-a-seco">Mito do corte a seco</Link></li>
              <li><Link to="/blog">Todos os ensaios</Link></li>
            </ul>
          </div>

          <div>
            <h4>Contato</h4>
            <ul>
              <li><a href="https://wa.me/553135866673" target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
              <li><a href="https://instagram.com/ojonquecortou" target="_blank" rel="noopener noreferrer">Instagram</a></li>
              <li><a href="https://www.google.com/maps/search/?api=1&query=O+Jon+que+Cortou+-+Especialista+em+Cachos" target="_blank" rel="noopener noreferrer">Caiçara · BH</a></li>
              <li><a href="/agendar">Agendar</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} · O Jon que Cortou · Studio do Jon · BH</span>
          <span>Feito com cuidado · Caiçara, Belo Horizonte</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
