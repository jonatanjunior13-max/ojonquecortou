import React from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import FAQ from '../components/FAQ';
import Reviews from '../components/Reviews';
import { posts } from '../data/posts';
import './Home.css';

const Home = () => {
  // Pegar os 3 posts mais recentes
  const latestPosts = posts.slice(0, 3);

  return (
    <main>
      <Hero />
      
      {/* Destaque de Serviços */}
      <section className="section-padding glass-panel text-center services-highlight">
        <div className="container">
          <h2 className="heading-lg mb-1">Nossos Serviços</h2>
          <p className="paragraph-lg max-w-lg mx-auto mb-3 mt-2 text-gray">
            Cada atendimento começa com diagnóstico técnico do fio. O serviço é definido pelo que o seu cabelo precisa — não por um cardápio fixo.
          </p>

          <div className="service-cards-grid">
            <div className="service-card-mini animate-fade-in">
              <div className="service-card-icon">✂️</div>
              <h3>Corte</h3>
              <p>Análise de porosidade e curvatura antes do corte. Resultado que funciona em casa, não só no salão.</p>
            </div>
            <div className="service-card-mini animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="service-card-icon">✨</div>
              <h3>Corte + Tratamento</h3>
              <p>Corte técnico combinado com tratamento escolhido pelo estado real do fio. Sem protocolo genérico.</p>
            </div>
            <div className="service-card-mini animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="service-card-icon">🎨</div>
              <h3>Mechas</h3>
              <p>Iluminação que respeita o fio.</p>
            </div>
          </div>

          <Link to="/servicos" className="btn btn-primary mt-4">Ver Todos os Serviços</Link>
        </div>
      </section>

      <Reviews />

      {/* Seção Blog na Home */}
      <section className="section-padding home-blog-section">
        <div className="container">
          <div className="flex justify-between items-end mb-4 flex-wrap gap-2">
            <div>
              <span className="badge">Dicas & Tendências</span>
              <h2 className="heading-lg mt-1">Do nosso Blog</h2>
            </div>
            <Link to="/blog" className="btn btn-outline sm-btn">Ver todos os artigos</Link>
          </div>

          <div className="home-blog-grid">
            {latestPosts.map((post) => (
              <article key={post.id} className="home-blog-card">
                <div className="home-blog-card-image-wrap">
                  <img src={post.image} alt={post.title} className="home-blog-card-image" />
                </div>
                <div className="home-blog-card-content">
                  <span className="home-blog-card-category">{post.category}</span>
                  <h3 className="home-blog-card-title">
                    <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                  </h3>
                  <Link to={`/blog/${post.slug}`} className="read-more-link">
                    Ler mais →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <FAQ />
    </main>
  );
};

export default Home;
