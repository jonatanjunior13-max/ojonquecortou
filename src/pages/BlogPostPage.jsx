import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { posts } from '../data/posts';
import './Blog.css';
import { ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';

const BlogPostPage = () => {
  const { slug } = useParams();
  const post = posts.find((p) => p.slug === slug);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  // Obter posts relacionados de forma consistente e determinística:
  // Filtra o próprio post, coloca os da mesma categoria primeiro, e depois ordena por id desc.
  const relatedPosts = posts
    .filter((p) => p.slug !== slug)
    .sort((a, b) => {
      if (a.category === post.category && b.category !== post.category) return -1;
      if (b.category === post.category && a.category !== post.category) return 1;
      return b.id - a.id;
    })
    .slice(0, 3);

  return (
    <main className="post-page">
      <SEO 
        title={post.title} 
        description={post.metaDescription || post.excerpt}
        image={post.image}
        url={`/blog/${post.slug}`}
      />
      <div className="container">
        <Link to="/blog" className="post-back reveal active">
          <ArrowLeft size={18} /> Voltar para o blog
        </Link>

        <article className="post-container text-content">
          <header className="post-header reveal active">
            <div className="post-meta">
              {post.category} · {post.date}
            </div>
            <h1 className="heading-xl">{post.title}</h1>
          </header>

          <div className="reveal active stagger-1">
            <img src={post.image} alt={post.title} className="post-hero-image" />
          </div>

          <div 
            className="post-content reveal active stagger-2" 
            dangerouslySetInnerHTML={{ __html: post.content }} 
          />
          
          <section className="related-posts-section reveal active">
            <h2 className="related-posts-title heading-lg">Leia Também</h2>
            <div className="related-posts-grid">
              {relatedPosts.map((rPost) => (
                <article key={rPost.id} className="blog-card">
                  <div className="blog-card-img-wrap">
                    <img src={rPost.image} alt={rPost.title} className="blog-card-image" />
                  </div>
                  <div className="blog-card-content">
                    <span className="blog-card-category">{rPost.category}</span>
                    <h3 className="blog-card-title" style={{ fontSize: '1.05rem', marginBottom: '0.5rem' }}>
                      <Link to={`/blog/${rPost.slug}`}>{rPost.title}</Link>
                    </h3>
                    <p className="blog-card-excerpt" style={{ fontSize: '0.85rem', marginBottom: '1rem', lineHeight: '1.5' }}>
                      {rPost.excerpt}
                    </p>
                    <div className="blog-card-footer" style={{ paddingTop: '1rem' }}>
                      <Link to={`/blog/${rPost.slug}`} className="read-more">Leia Mais →</Link>
                      <span className="blog-date">{rPost.date}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <footer className="post-cta-section section-padding reveal active">
            <div className="post-cta-card">
              <img src="/jon-trabalhando.jpg" alt="Jon atendendo cliente" className="post-cta-image" />
              <div className="post-cta-content">
                <h2 className="heading-lg">O seu cabelo não precisa de mais testes.</h2>
                <p className="paragraph-md">
                  Chega de tentar adivinhar o que o seu fio precisa. Agende uma leitura de fio no Studio do Jon e descubra o corte técnico exato para a sua curvatura.
                </p>
                
                <div className="post-cta-btns">
                  <a href="http://trinks.com/ojonquecortou" target="_blank" rel="noreferrer" className="btn btn-primary" style={{ backgroundColor: 'var(--color-yellow)', color: 'var(--color-dark)', borderColor: 'var(--color-yellow)' }}>
                    Agendar Horário
                  </a>
                  <a href={`https://wa.me/553135866673?text=Oi Jon! Li o post sobre "${post.title}" e queria agendar.`} target="_blank" rel="noreferrer" className="btn btn-outline btn-blog">
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </article>
      </div>
    </main>
  );
};

export default BlogPostPage;
