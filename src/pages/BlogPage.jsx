import React from 'react';
import { Link } from 'react-router-dom';
import { posts } from '../data/posts';
import './Blog.css';

const BlogPage = () => {
  return (
    <main className="blog-page">
      <header className="blog-header">
        <div className="container">
          <h1 className="blog-title">Blog do Jon</h1>
          <p className="blog-subtitle">
            Dicas, técnicas e tudo o que você precisa saber para amar e cuidar dos seus cachos em BH.
          </p>
        </div>
      </header>

      <section className="container section-padding">
        <div className="blog-grid">
          {posts.map((post) => (
            <article key={post.id} className="blog-card">
              <img src={post.image} alt={post.title} className="blog-card-image" />
              <div className="blog-card-content">
                <span className="blog-card-category">{post.category}</span>
                <h2 className="blog-card-title">
                  <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>
                <p className="blog-card-excerpt">{post.excerpt}</p>
                <div className="blog-card-footer">
                  <span>Por {post.author}</span>
                  <span>{post.date}</span>
                </div>
                <Link to={`/blog/${post.slug}`} className="btn btn-outline sm-btn mt-1">
                  Ler artigo completo
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
};

export default BlogPage;
