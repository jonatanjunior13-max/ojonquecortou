import React from 'react';
import { Link } from 'react-router-dom';
import { posts } from '../data/posts';
import './Blog.css';

const BlogPage = () => {
  return (
    <main className="blog-page">
      <header className="blog-header reveal active">
        <div className="container text-center">
          <h1 className="heading-xl">O Especialista <span className="text-gradient">Explica</span></h1>
          <p className="paragraph-lg max-w-lg mx-auto">
            Dicas, técnicas e bastidores sobre o cuidado real com cabelos naturais.
          </p>
        </div>
      </header>

      <section className="container section-padding">
        <div className="blog-grid">
          {posts.map((post, index) => (
            <article key={post.id} className={`blog-card reveal stagger-${(index % 3) + 1}`}>
              <div className="blog-card-img-wrap">
                <img src={post.image} alt={post.title} className="blog-card-image" />
              </div>
              <div className="blog-card-content">
                <span className="blog-card-category">{post.category}</span>
                <h2 className="blog-card-title">
                  <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>
                <p className="blog-card-excerpt">{post.excerpt}</p>
                <div className="blog-card-footer">
                  <Link to={`/blog/${post.slug}`} className="read-more">Leia Mais →</Link>
                  <span className="blog-date">{post.date}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="blog-cta-bottom section-padding">
        <div className="container text-center reveal">
          <h2 className="heading-lg mb-2">Quer um diagnóstico técnico do seu fio?</h2>
          <p className="paragraph-lg mb-4 max-w-md mx-auto">
            Não fique apenas na teoria. Agende seu horário e venha cuidar dos seus cachos com quem entende.
          </p>
          <a href="http://trinks.com/ojonquecortou" target="_blank" rel="noreferrer" className="btn btn-primary">
            Agendar agora pelo Trinks
          </a>
        </div>
      </section>
    </main>
  );
};

export default BlogPage;
