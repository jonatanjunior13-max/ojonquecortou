import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { posts as staticPosts } from '../data/posts';
import SEO from '../components/SEO';
import { db } from '../config/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import './Blog.css';

const BlogPage = () => {
  const [allPosts, setAllPosts] = useState(() => staticPosts.filter(p => p.status !== 'draft'));

  useEffect(() => {
    async function loadDbPosts() {
      if (!db) return;
      try {
        const q = query(collection(db, 'blog_posts'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const list = [];
        snap.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        if (list.length > 0) {
          // Merge static and dynamic, putting dynamic ones first (filtering out drafts)
          const merged = [...list, ...staticPosts].filter(p => p.status !== 'draft');
          setAllPosts(merged);
        }
      } catch (err) {
        console.warn('Erro ao carregar posts dinâmicos do Firestore:', err);
      }
    }
    loadDbPosts();
  }, []);

  return (
    <main className="blog-page">
      <SEO 
        title="Dicas de Cabelo Cacheado & Cuidados | Blog do Jon" 
        description="Artigos sobre cronograma capilar, porosidade, transição e cortes para cabelos cacheados. Dicas exclusivas do especialista do Studio do Jon em BH." 
      />
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
          {allPosts.map((post, index) => (
            <article key={post.id} className={`blog-card reveal active stagger-${(index % 3) + 1}`}>
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
          <a href="/agendar" className="btn btn-primary">
            Agendar agora
          </a>
        </div>
      </section>
    </main>
  );
};

export default BlogPage;
