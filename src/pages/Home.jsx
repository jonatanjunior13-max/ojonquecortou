import React from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import Ticker from '../components/Ticker';
import FAQ from '../components/FAQ';
import Reviews from '../components/Reviews';
import InstagramFeed from '../components/InstagramFeed';
import { posts } from '../data/posts';
import './Home.css';

const Home = () => {
  const latestPosts = posts.slice(0, 3);

  return (
    <main>
      <Hero />
      <Ticker />
      
      {/* Método / Como Funciona */}
      <section className="section-padding method-section">
        <div className="container method-grid">
          <div className="method-content reveal">
            <span className="section-badge">COMO FUNCIONA</span>
            <h2 className="heading-lg mb-2">O método que lê o <br /><span className="text-gradient">seu fio</span></h2>
            <p className="paragraph-lg mb-4">
              Antes de pegar a tesoura, o Jon entende o cabelo. Cada fio conta uma história — e o corte certo começa por ouvi-la.
            </p>

            <div className="method-list">
              <div className="method-item">
                <span className="method-num">01</span>
                <div>
                  <h3>Leitura do Fio</h3>
                  <p>Análise da <strong>porosidade, densidade e padrão de cacho</strong> antes de qualquer corte. Sem palpite — com diagnóstico real.</p>
                </div>
              </div>
              <div className="method-item">
                <span className="method-num">02</span>
                <div>
                  <h3>Corte a Seco</h3>
                  <p>O corte é feito com o cabelo <strong>no estado natural</strong>, respeitando o padrão real de cada cacho — sem surpresas ao secar.</p>
                </div>
              </div>
              <div className="method-item">
                <span className="method-num">03</span>
                <div>
                  <h3>Educação Real</h3>
                  <p>Você sai sabendo <strong>como cuidar do seu cabelo em casa</strong>: rotina, produtos certos e técnicas que funcionam pra você.</p>
                </div>
              </div>
              <div className="method-item">
                <span className="method-num">04</span>
                <div>
                  <h3>Atendimento Exclusivo</h3>
                  <p>Agenda limitada para garantir <strong>atenção total</strong> — sem pressa, sem fila, sem atendimento em paralelo.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="method-visual reveal stagger-1">
             <div className="placeholder-img method-img">
                <span className="placeholder-label">Jon realizando leitura de fio / corte a seco em cliente</span>
                <div className="method-quote">
                  <p>"Cada cacho é único."</p>
                  <span>Jon nunca corta dois cabelos do mesmo jeito.</span>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Serviços / O que o Jon oferece */}
      <section className="section-padding services-section">
        <div className="container">
          <div className="services-header reveal">
            <div className="services-header-content">
              <span className="section-badge-blue">SERVIÇOS</span>
              <h2 className="heading-lg mb-2">O que o Jon oferece</h2>
              <p className="paragraph-lg max-w-lg">
                Cada serviço pensado para valorizar o que é seu — sem forçar padrões, sem químicas de alisamento.
              </p>
            </div>
            <div className="services-header-actions">
              <a href="https://wa.me/553135866673" target="_blank" rel="noreferrer" className="btn btn-primary">
                Consultar pelo WhatsApp
              </a>
            </div>
          </div>

          <div className="services-home-grid mt-4">
            <div className="service-home-card reveal stagger-1">
              <span className="service-emoji">✂️</span>
              <h3>Corte com Técnica</h3>
              <p>Corte realizado com o cabelo em seu estado natural, para garantir que o resultado seja exatamente o que você vê ao acordar.</p>
              <div className="service-home-footer">
                <span className="price-tag">a partir de <strong>R$ 190</strong></span>
                <span className="badge-yellow">Mais pedido</span>
              </div>
            </div>
            <div className="service-home-card reveal stagger-2">
              <span className="service-emoji">💧</span>
              <h3>Nutrição Terapêutica</h3>
              <p>Tratamento profundo para devolver vida, elasticidade e brilho aos fios ressecados, com produtos selecionados para o seu tipo de cacho.</p>
              <div className="service-home-footer">
                <span className="price-tag">a partir de <strong>R$ 130</strong></span>
              </div>
            </div>
            <div className="service-home-card reveal stagger-3">
              <span className="service-emoji">🌀</span>
              <h3>Corte + Nutrição</h3>
              <p>A combinação completa: diagnóstico, corte técnico personalizado e tratamento terapêutico em uma única sessão exclusiva.</p>
              <div className="service-home-footer">
                <span className="price-tag">a partir de <strong>R$ 230</strong></span>
                <span className="badge-blue">Completo</span>
              </div>
            </div>
            <div className="service-home-card reveal stagger-1">
              <span className="service-emoji">🔴</span>
              <h3>Coloração Completa</h3>
              <p>Especialidade do Jon: colorações ruivas e tons vibrantes que respeitam a curvatura, com técnica que preserva a saúde dos fios.</p>
              <div className="service-home-footer">
                <span className="price-tag">Sob consulta</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sobre o Jon (Dark Mode) */}
      <section className="section-padding about-home-section dark-theme">
        <div className="container about-home-grid">
          <div className="about-home-visual reveal">
             <div className="placeholder-img about-img">
                <span className="placeholder-label">foto profissional do Jon no studio</span>
                <div className="about-badge-floating">
                  <span>Jon</span>
                  <small>ESPECIALISTA EM CACHOS</small>
                </div>
             </div>
          </div>
          <div className="about-home-content reveal stagger-1">
            <span className="section-badge-yellow">SOBRE O JON</span>
            <h2 className="heading-lg mb-2">Um cabeleireiro que entende o que você sente</h2>
            <p className="paragraph-lg mb-3">
              Jon nasceu em Belo Horizonte e cresceu rodeado de cachos — da família, das amigas, da rua. Cedo percebeu que a maioria dos salões não sabia como lidar com cabelos fora do padrão liso.
            </p>
            <p className="paragraph-md mb-3">
              Depois de anos de formação e prática, criou o seu próprio método: começar sempre pela leitura do fio. Porque cada cacho tem uma história, e o corte precisa respeitá-la.
            </p>
            <p className="paragraph-md mb-4">
              Hoje atende no Studio do Jon, no Caiçara, com agenda limitada para garantir que cada cliente receba o tempo e a atenção que merece.
            </p>

            <div className="about-features">
              <div className="about-feature-item">
                <span className="feature-icon">🌀</span>
                <div>
                  <h4>Leitura de Fio</h4>
                  <p>Diagnóstico real antes de qualquer tesoura. Porosidade, densidade e padrão — tudo considerado.</p>
                </div>
              </div>
              <div className="about-feature-item">
                <span className="feature-icon">💙</span>
                <div>
                  <h4>Atendimento Exclusivo</h4>
                  <p>Agenda limitada, atenção total. Você não é mais um número no salão.</p>
                </div>
              </div>
              <div className="about-feature-item">
                <span className="feature-icon">🎓</span>
                <div>
                  <h4>Educação de Verdade</h4>
                  <p>Você aprende a cuidar do próprio cabelo. Sai do studio com conhecimento, não só com corte.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Reviews />

      {/* Seção Instagram */}
      <section className="section-padding instagram-section">
        <div className="container">
          <div className="instagram-header reveal">
            <div>
              <span className="section-badge">INSTAGRAM</span>
              <h2 className="heading-md">@ojonquecortou</h2>
            </div>
            <a href="https://instagram.com/ojonquecortou" target="_blank" rel="noreferrer" className="btn btn-outline">
              Seguir no Instagram
            </a>
          </div>

          <div className="instagram-feed-container mt-4 reveal">
             <InstagramFeed />
          </div>
        </div>
      </section>

      {/* FAQ com Grid */}
      <FAQ />

      {/* Como Chegar */}
      <section className="section-padding location-section">
        <div className="container location-grid">
          <div className="location-info reveal">
            <span className="section-badge">COMO CHEGAR</span>
            <h2 className="heading-lg mb-4">Studio do Jon · Caiçara</h2>
            
            <div className="location-details">
              <div className="location-item">
                <h4>ENDEREÇO</h4>
                <p>Bairro Caiçara</p>
                <p>Belo Horizonte, MG — endereço completo pelo WhatsApp</p>
              </div>
              <div className="location-item">
                <h4>HORÁRIOS DE ATENDIMENTO</h4>
                <p>Segunda-feira <span>Fechado</span></p>
                <p>Terça a Sexta <span>09h às 18h</span></p>
                <p>Sábado <span>09h às 14h</span></p>
                <p>Domingo <span>Fechado</span></p>
              </div>
              <div className="location-item">
                <h4>CONTATO</h4>
                <p>(31) 3586-6673</p>
                <p>WhatsApp · Instagram @ojonquecortou</p>
              </div>
            </div>

            <a href="https://wa.me/553135866673" target="_blank" rel="noreferrer" className="btn btn-primary mt-4">
              ✨ Ver endereço completo
            </a>
          </div>
          <div className="location-map-wrap reveal stagger-1">
            <div className="placeholder-img map-img">
              <div className="map-pin">📍</div>
              <div className="map-popup">
                <strong>Studio do Jon · Caiçara</strong>
                <p>Belo Horizonte, MG</p>
                <a href="https://maps.google.com" target="_blank" rel="noreferrer">Abrir no Google Maps →</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="section-padding final-cta-section">
        <div className="container text-center reveal">
          <h2 className="heading-lg mb-2 text-white">Seus cachos merecem <br /> <span className="text-yellow">um corte que os entende.</span></h2>
          <p className="paragraph-lg mb-4 text-white opacity-8">Agende agora. Agenda limitada — poucos horários disponíveis.</p>
          <div className="hero-actions">
             <a href="https://wa.me/553135866673" target="_blank" rel="noreferrer" className="btn btn-primary whatsapp-btn">
               <span className="btn-icon">💬</span> Agendar pelo WhatsApp
             </a>
             <a href="http://trinks.com/ojonquecortou" target="_blank" rel="noreferrer" className="btn btn-white">
               Ver disponibilidade online
             </a>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
