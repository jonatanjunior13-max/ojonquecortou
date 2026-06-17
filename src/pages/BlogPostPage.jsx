import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { posts as staticPosts } from '../data/posts';
import { db } from '../config/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import './Blog.css';
import { ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';

const BlogPostPage = () => {
  const { slug } = useParams();
  const staticMatch = staticPosts.find((p) => p.slug === slug);
  
  const [prevSlug, setPrevSlug] = useState(slug);
  const [post, setPost] = useState(staticMatch || null);
  const [loading, setLoading] = useState(!staticMatch);
  const [allPosts, setAllPosts] = useState(staticPosts);

  if (slug !== prevSlug) {
    setPrevSlug(slug);
    const newStaticMatch = staticPosts.find((p) => p.slug === slug);
    setPost(newStaticMatch || null);
    setLoading(!newStaticMatch);
  }

  useEffect(() => {
    async function loadPostData() {
      const currentStaticMatch = staticPosts.find((p) => p.slug === slug);
      if (!currentStaticMatch) {
        setLoading(true);
      }
      let foundPost = currentStaticMatch || null;

      // Load all posts (including Firestore) to render related posts
      let merged = [...staticPosts];

      if (db) {
        try {
          // Fetch all blog posts for related area
          const qAll = query(collection(db, 'blog_posts'));
          const snapAll = await getDocs(qAll);
          const list = [];
          snapAll.forEach((doc) => {
            list.push({ id: doc.id, ...doc.data() });
          });
          merged = [...list, ...staticPosts];
          setAllPosts(merged);

          if (!foundPost) {
            // Fetch the specific post by slug
            const q = query(collection(db, 'blog_posts'), where('slug', '==', slug));
            const snap = await getDocs(q);
            if (!snap.empty) {
              foundPost = { id: snap.docs[0].id, ...snap.docs[0].data() };
            }
          }
        } catch (err) {
          console.warn('Erro ao carregar post do Firestore:', err);
        }
      }

      setPost(foundPost);
      setLoading(false);
    }
    loadPostData();
  }, [slug]);

  if (loading) {
    return (
      <main className="post-page">
        <div className="container" style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--muted)' }}>
          Carregando artigo...
        </div>
      </main>
    );
  }

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  // Obter posts relacionados de forma consistente e determinística:
  const relatedPosts = allPosts
    .filter((p) => p.slug !== slug)
    .sort((a, b) => {
      if (a.category === post.category && b.category !== post.category) return -1;
      if (b.category === post.category && a.category !== post.category) return 1;
      const idA = typeof a.id === 'number' ? a.id : 0;
      const idB = typeof b.id === 'number' ? b.id : 0;
      return idB - idA;
    })
    .slice(0, 3);

  const generatePostDescription = (post) => {
    let desc = post.metaDescription;
    if (!desc) {
      // Fallback based on user-requested model:
      // "[Assunto do post em 1 frase direta]. [Benefício ou resultado]. Especialista em cachos em Belo Horizonte explica."
      const subject = post.excerpt || post.title;
      desc = `${subject}. Conquiste definição, brilho e volume ideal. Especialista em cachos em Belo Horizonte explica.`;
    }
    if (desc.length > 155) {
      desc = desc.substring(0, 152) + '...';
    }
    return desc;
  };

  const parseDateToISO = (dateStr) => {
    if (!dateStr) return "2026-05-14";
    try {
      const cleanStr = dateStr.replace(/de/g, '').replace(/,/g, '').replace(/\s+/g, ' ').trim();
      const parts = cleanStr.split(' ');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const monthName = parts[1].toLowerCase();
        const year = parts[2];
        const months = {
          'janeiro': '01', 'fevereiro': '02', 'março': '03', 'abril': '04',
          'maio': '05', 'junho': '06', 'julho': '07', 'agosto': '08',
          'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
        };
        const month = months[monthName] || '05';
        return `${year}-${month}-${day}`;
      }
    } catch (e) {
      console.warn(e);
    }
    return "2026-05-14";
  };

  const postDesc = generatePostDescription(post);
  const isoDate = parseDateToISO(post.date);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": postDesc,
    "image": post.image.startsWith('http') ? post.image : `https://www.ojonquecortou.com.br${post.image}`,
    "author": {
      "@type": "Person",
      "name": "Jonatan Junior",
      "url": "https://www.ojonquecortou.com.br/sobre"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Studio do Jon",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.ojonquecortou.com.br/logo-cabeleireiro-de-cachos.png"
      }
    },
    "datePublished": post.datePublished || isoDate,
    "dateModified": post.dateModified || isoDate,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://www.ojonquecortou.com.br/blog/${post.slug}`
    }
  };

  const combinedSchema = post.faqSchema ? [articleSchema, post.faqSchema] : articleSchema;

  return (
    <main className="post-page">
      <SEO 
        title={post.title} 
        description={postDesc}
        image={post.image}
        url={`/blog/${post.slug}`}
        schema={combinedSchema}
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
              <img src="/jon-trabalhando.webp" alt="Jon atendendo cliente" className="post-cta-image" />
              <div className="post-cta-content">
                <h2 className="heading-lg">O seu cabelo não precisa de mais testes.</h2>
                <p className="paragraph-md">
                  Chega de tentar adivinhar o que o seu fio precisa. Agende uma leitura de fio no Studio do Jon e descubra o corte técnico exato para a sua curvatura.
                </p>
                
                <div className="post-cta-btns">
                  <a href="/agendar" className="btn btn-primary" style={{ backgroundColor: 'var(--color-yellow)', color: 'var(--color-dark)', borderColor: 'var(--color-yellow)' }}>
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
