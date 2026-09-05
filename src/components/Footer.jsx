import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <img src="/logo-jon-cortou.png" alt="O Jon que Cortou Logo" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
              <div style={{ fontFamily: 'var(--serif)', fontSize: '20px', fontWeight: 'bold', lineHeight: 1.1 }}>
                O Jon que<br/><span className="italic" style={{ fontFamily: 'var(--serif-italic)', fontStyle: 'italic', fontWeight: 'normal' }}>cortou.</span>
              </div>
            </div>
            <p style={{ color: "var(--muted)", fontSize: 14.5, maxWidth: "38ch", margin: "0 0 16px 0" }}>
              Especialista em corte para cabelos ondulados, cacheados e crespos com foco em visagismo em Belo Horizonte.
            </p>
            <div style={{
              background: 'rgba(255, 255, 255, 0.012)',
              border: '1px solid rgba(255, 255, 255, 0.04)',
              padding: '12px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              lineHeight: '1.5',
              maxWidth: '38ch',
              color: 'var(--muted)'
            }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-deep)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Algoritmo do Google</span>
              Para garantir que as análises de fios e nossos ensaios de visagismo continuem aparecendo de forma orgânica nas suas buscas e no feed do Chrome, você pode <a href="https://google.com/preferences/source?q=https://www.ojonquecortou.com.br" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-deep)', textDecoration: 'underline', fontWeight: 'bold' }}>
                priorizar nosso site como fonte de conteúdo
              </a>. Leva apenas um clique e mantém nossa comunicação direta.
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
              Rua Belmiro Braga, 544<br />
              Caiçaras, Belo Horizonte - MG<br />
              Telefone: (31) 98304-4059
            </p>
            <p style={{ color: "var(--muted)", fontSize: "14.5px", lineHeight: "1.5", margin: 0 }}>
              Terça a Sexta: 9h às 19h<br />
              Sábado: 9h às 17h
            </p>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} · O Jon que Cortou · Studio do Jon · BH · <Link to="/politica-privacidade" style={{ color: 'inherit' }}>Política de Privacidade</Link> · <Link to="/termos-de-servico" style={{ color: 'inherit' }}>Termos de Serviço</Link></span>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', opacity: 0.7 }}>Este site utiliza OAuth do Google para autenticação segura de agendamentos e painel administrativo.</span>
          <span>Feito com cuidado · Caiçaras, Belo Horizonte</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
