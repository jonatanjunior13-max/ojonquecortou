import React from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import FAQ from '../components/FAQ';
import Reviews from '../components/Reviews';
import InstagramFeed from '../components/InstagramFeed';
import { posts } from '../data/posts';
import './Home.css';

const Home = () => {
  // Pegar os 3 posts mais recentes
  const latestPosts = posts.slice(0, 3);

  return (
    <main>
      <Hero />
      
      {/* Destaque de Serviços */}
      <section className="section-padding services-highlight">
        <div className="container">
          <div className="text-center reveal">
            <h2 className="heading-lg mb-2">Nossas Especialidades</h2>
            <p className="paragraph-lg max-w-lg mx-auto">
              Cada atendimento começa com diagnóstico técnico do fio. O serviço é definido pelo que o seu cabelo precisa.
            </p>
          </div>

          <div className="service-cards-grid">
            <div className="service-card-mini reveal stagger-1">
              <div className="service-card-icon">✂️</div>
              <h3>Corte</h3>
              <p>Análise de porosidade e curvatura antes do corte. Resultado que funciona em casa.</p>
            </div>
            <div className="service-card-mini reveal stagger-2">
              <div className="service-card-icon">✨</div>
              <h3>Corte + Tratamento</h3>
              <p>Corte técnico combinado com tratamento escolhido pelo estado real do fio.</p>
            </div>
            <div className="service-card-mini reveal stagger-3">
              <div className="service-card-icon">🎨</div>
              <h3>Mechas</h3>
              <p>Iluminação técnica que respeita a estrutura do fio.</p>
            </div>
          </div>

          <div className="text-center reveal stagger-4">
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/servicos" className="btn btn-outline">Ver Todos os Serviços</Link>
              <a href="http://trinks.com/ojonquecortou" target="_blank" rel="noreferrer" className="btn btn-primary">Agendar Horário</a>
            </div>
          </div>
        </div>
      </section>

      <Reviews />
      
      {/* Seção Instagram */}
      <section className="section-padding instagram-home-section">
        <div className="container">
          <div className="flex justify-between items-end mb-4 flex-wrap gap-2 reveal">
            <div>
              <h2 className="heading-lg">No Instagram</h2>
              <p className="paragraph-md">Acompanhe os últimos cortes e transformações @ojonquecortou</p>
            </div>
            <a href="https://instagram.com/ojonquecortou" target="_blank" rel="noreferrer" className="btn btn-outline">
              Seguir no Instagram
            </a>
          </div>
          
          <div className="instagram-feed-container reveal stagger-1">
            <InstagramFeed />
          </div>

          <div className="text-center mt-4 reveal">
            <a href="http://trinks.com/ojonquecortou" target="_blank" rel="noreferrer" className="btn btn-primary">
              Gostou dos resultados? Agende o seu!
            </a>
          </div>
        </div>
      </section>

      {/* Seção Blog na Home */}
      <section className="section-padding home-blog-section">
        <div className="container">
          <div className="flex justify-between items-end mb-4 flex-wrap gap-2 reveal">
            <div>
              <h2 className="heading-lg">O Especialista Explica</h2>
            </div>
            <Link to="/blog" className="btn btn-outline">Ver Blog Completo</Link>
          </div>
 
          <div className="home-blog-grid">
            {latestPosts.map((post, index) => (
              <article key={post.id} className={`home-blog-card reveal stagger-${index + 1}`}>
                <div className="home-blog-card-image-wrap">
                  <img src={post.image} alt={post.title} className="home-blog-card-image" />
                </div>
                <div className="home-blog-card-content">
                  <span className="home-blog-card-category">{post.category}</span>
                  <h3 className="home-blog-card-title">
                    <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                  </h3>
                  <Link to={`/blog/${post.slug}`} className="read-more-link">
                    Acessar Artigo →
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className="text-center mt-4 reveal">
            <a href="http://trinks.com/ojonquecortou" target="_blank" rel="noreferrer" className="btn btn-primary">
              Agendar Consultoria com o Jon
            </a>
          </div>
        </div>
      </section>

      <FAQ />
    </main>
  );
};

export default Home;
