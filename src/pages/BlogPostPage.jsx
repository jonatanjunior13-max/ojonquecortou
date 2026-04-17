import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { posts } from '../data/posts';
import './Blog.css';
import { ArrowLeft, Calendar, User, Tag } from 'lucide-react';

const BlogPostPage = () => {
  const { slug } = useParams();
  const post = posts.find((p) => p.slug === slug);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <main className="post-page">
      <div className="container">
        <Link to="/blog" className="post-back transition-all hover:translate-x-[-4px]">
          <ArrowLeft size={18} /> Voltar para o blog
        </Link>

        <article className="post-container">
          <header className="post-header animate-fade-in">
            <div className="post-meta">
              <span className="flex items-center gap-1">
                <Calendar size={14} className="text-magenta" /> {post.date}
              </span>
              <span className="flex items-center gap-1">
                <User size={14} className="text-magenta" /> Por {post.author}
              </span>
              <span className="flex items-center gap-1">
                <Tag size={14} className="text-magenta" /> {post.category}
              </span>
            </div>
            <h1 className="post-title">{post.title}</h1>
          </header>

          <img src={post.image} alt={post.title} className="post-hero-image" />

          <div 
            className="post-content" 
            dangerouslySetInnerHTML={{ __html: post.content }} 
          />
          
          <div className="post-cta-seo mt-10 p-6 bg-gray-50 rounded-xl border border-gray-100">
            <p className="paragraph-lg mb-0 text-center">
              Deseja transformar seu visual? Confira todos os meus <strong><Link to="/servicos" className="text-magenta hover:underline">Serviços</Link></strong> ou faça seu <strong><a href="http://trinks.com/ojonquecortou" target="_blank" rel="noreferrer" className="text-magenta hover:underline">Agendamento Online</a></strong>.
            </p>
          </div>
          
          <footer className="post-footer mt-10 pt-6 border-t border-gray-100">
            <h3 className="heading-md mb-2">Gostou da dica?</h3>
            <p className="paragraph-lg mb-4">Vem viver essa experiência no Studio! Agende seu horário no Caiçara.</p>
            <div className="flex flex-wrap gap-2">
              <a href="http://trinks.com/ojonquecortou" target="_blank" rel="noreferrer" className="btn btn-primary">
                Agendar no Trinks
              </a>
              <a href={`https://wa.me/553135866673?text=Oi Jon! Li o post sobre "${post.title}" e queria agendar um horário.`} target="_blank" rel="noreferrer" className="btn btn-outline">
                Chamar no WhatsApp
              </a>
            </div>
          </footer>
        </article>
      </div>
    </main>
  );
};

export default BlogPostPage;
