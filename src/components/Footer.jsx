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
            <p style={{ color: "var(--muted)", fontSize: 14.5, maxWidth: "38ch", margin: "0 0 16px 0" }}>
              Especialista em corte para cabelos ondulados, cacheados e crespos com foco em visagismo em Belo Horizonte.
            </p>
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              padding: '10px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              lineHeight: '1.5',
              maxWidth: '38ch',
              color: 'var(--muted)'
            }}>
              💡 <strong>Quer ver mais do nosso conteúdo no Google?</strong><br/>
              <a href="https://google.com/preferences/source?q=https://www.ojonquecortou.com.br" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-deep)', textDecoration: 'underline', fontWeight: 'bold' }}>
                Clique aqui
              </a>, marque a caixinha e o Google priorizará e mostrará mais do Studio do Jon para você!
            </div>
          </div>

          <div>
            <h4>Studio</h4>
            <ul>
              <li><Link to="/sobre">Sobre o Jon</Link></li>
              <li><Link to="/servicos">Serviços</Link></li>
              <li><Link to="/servicos/corte-hibrido">Corte Híbrido</Link></li>
              <li><Link to="/servicos/transicao-capilar">Transição Capilar</Link></li>
              <li><Link to="/servicos/visagismo-cachos">Visagismo de Cachos</Link></li>
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
            <h4>Contato & Endereço</h4>
            <p style={{ color: "var(--muted)", fontSize: "14px", lineHeight: "1.5", margin: "0 0 10px 0" }}>
              <strong>O Jon que Cortou — Studio do Jon</strong><br />
              Rua Francisco Ovídio, 184<br />
              Caiçara, Belo Horizonte - MG<br />
              Telefone: (31) 3586-6673
            </p>
            <p style={{ color: "var(--muted)", fontSize: "14.5px", lineHeight: "1.5", margin: 0 }}>
              Terça a Sexta: 9h às 19h<br />
              Sábado: 9h às 17h
            </p>
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
