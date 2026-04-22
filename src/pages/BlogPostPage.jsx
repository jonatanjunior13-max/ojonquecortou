import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { posts } from '../data/posts';
import './Blog.css';
import { ArrowLeft } from 'lucide-react';

const BlogPostPage = () => {
  const { slug } = useParams();
  const post = posts.find((p) => p.slug === slug);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <main className="post-page">
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
          
          <footer className="post-footer section-padding reveal">
            <div className="card text-center">
              <h3 className="heading-md mb-2">Transforme seu visual</h3>
              <p className="paragraph-md mb-4">Agende uma consultoria técnica no Caiçara.</p>
              <div className="flex justify-center flex-wrap gap-2">
                <a href="http://trinks.com/ojonquecortou" target="_blank" rel="noreferrer" className="btn btn-primary">
                  Agendar Online
                </a>
                <a href={`https://wa.me/553135866673?text=Oi Jon! Li o post sobre "${post.title}" e queria agendar.`} target="_blank" rel="noreferrer" className="btn btn-outline">
                  WhatsApp
                </a>
              </div>
            </div>
          </footer>
        </article>
      </div>
    </main>
  );
};

export default BlogPostPage;
