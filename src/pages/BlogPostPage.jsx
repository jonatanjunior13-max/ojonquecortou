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

  return (
    <main className="post-page">
      <SEO 
        title={`${post.title} | Studio do Jon`} 
        description={post.excerpt || `Artigo sobre ${post.title} por Jonatan Junior, especialista em cachos.`}
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
