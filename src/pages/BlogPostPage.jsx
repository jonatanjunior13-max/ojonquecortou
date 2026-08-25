import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { db } from '../config/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { getInitialPosts, fetchLatestPosts } from '../utils/blogService';
import { injectBlogLinks } from '../data/blogLinkMap';
import './Blog.css';
import { ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';

const BlogPostPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const getPreRenderedPost = () => {
    if (typeof document === 'undefined') return null;
    const el = document.getElementById('pre-rendered-post-data');
    if (el) {
      try {
        const data = JSON.parse(el.textContent);
        if (data && data.slug === slug) {
          return data;
        }
      } catch (e) {
        console.warn('Failed to parse pre-rendered post data', e);
      }
    }
    return null;
  };

  const getInitialPost = () => {
    const list = getInitialPosts();
    return list.find((p) => p.slug === slug) || getPreRenderedPost();
  };

  const initialPost = getInitialPost();
  
  const [prevSlug, setPrevSlug] = useState(slug);
  const [post, setPost] = useState(initialPost);
  const [loading, setLoading] = useState(!initialPost);
  const [allPosts, setAllPosts] = useState(() => getInitialPosts());

  const cleanTitle = (rawTitle) => {
    if (!rawTitle) return '';
    return rawTitle
      .replace(/\s*\|\s*Studio do Jon\s*$/gi, '')
      .replace(/\s*\|\s*Jon\s*$/gi, '');
  };

  const handleContentClick = (e) => {
    const target = e.target.closest('a');
    if (target) {
      const href = target.getAttribute('href');
      if (href && href.startsWith('/') && !href.startsWith('//')) {
        e.preventDefault();
        navigate(href);
      }
    }
  };

  if (slug !== prevSlug) {
    setPrevSlug(slug);
    const newMatch = getInitialPosts().find((p) => p.slug === slug) || getPreRenderedPost();
    setPost(newMatch || null);
    setLoading(!newMatch);
  }

  useEffect(() => {
    async function loadPostData() {
      const currentMatch = getInitialPosts().find((p) => p.slug === slug) || getPreRenderedPost();
      if (!currentMatch) {
        setLoading(true);
      }
      let foundPost = currentMatch || null;

      try {
        const latestPostsList = await fetchLatestPosts();
        setAllPosts(latestPostsList);
        
        const latestMatch = latestPostsList.find((p) => p.slug === slug);
        if (latestMatch) {
          foundPost = latestMatch;
        } else if (db) {
          // Absolute fallback: direct Firestore query for this specific slug
          const q = query(collection(db, 'blog_posts'), where('slug', '==', slug));
          const snap = await getDocs(q);
          if (!snap.empty) {
            foundPost = { id: snap.docs[0].id, ...snap.docs[0].data() };
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar post:', err);
      }

      setPost(foundPost);
      setLoading(false);
    }
    loadPostData();
  }, [slug]);

  // Preload hero image dynamically
  useEffect(() => {
    if (!post?.image) return;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = post.image;
    document.head.appendChild(link);
    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, [post?.image]);

  // GA4 Scroll Depth Tracking (25%, 50%, 75%)
  useEffect(() => {
    if (!post) return;
    const trackedDepths = new Set();
    const handleScroll = () => {
      const scrollTop = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (docHeight <= 0) return;
      
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);
      
      [25, 50, 75].forEach(depth => {
        if (scrollPercent >= depth && !trackedDepths.has(depth)) {
          trackedDepths.add(depth);
          if (window.gtag) {
            window.gtag('event', 'scroll', {
              'percent_scrolled': depth,
              'page_path': window.location.pathname,
              'page_title': post.title || document.title
            });
          } else if (window.dataLayer) {
            window.dataLayer.push({
              event: 'scroll',
              percent_scrolled: depth,
              page_path: window.location.pathname
            });
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [post]);


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

  // Smart related posts: category + keyword match, up to 6 for better internal linking
  const getKeywords = (text) => {
    if (!text) return [];
    return text.toLowerCase()
      .split(/\W+/)
      .filter(w => w.length > 3 && !['para', 'como', 'sobre', 'mais', 'artigo', 'postagem', 'você', 'suas', 'seus'].includes(w));
  };

  const postKeywords = new Set(getKeywords(post.title + ' ' + post.excerpt));

  const relatedPosts = allPosts
    .filter((p) => p.slug !== slug)
    .map((p) => {
      let score = 0;
      if (p.category === post.category) score += 100;
      const candidateKeywords = getKeywords(p.title + ' ' + p.excerpt);
      const overlapCount = candidateKeywords.filter(kw => postKeywords.has(kw)).length;
      score += overlapCount * 5;
      return { post: p, score };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const idA = typeof a.post.id === 'number' ? a.post.id : 0;
      const idB = typeof b.post.id === 'number' ? b.post.id : 0;
      return idB - idA;
    })
    .slice(0, 3)
    .map(item => item.post);

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
    "@type": post.schemaType || "Article",
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

  const getProcessedContent = (contentHtml) => {
    if (!contentHtml) return '';
    let processed = contentHtml;

    // Inject blog-to-blog internal links for GEO
    processed = injectBlogLinks(processed, slug);

    const paragraphs = processed.split('</p>');
    if (paragraphs.length <= 3) {
      return processed;
    }
    const inlineCtaHtml = `
      <div class="blog-inline-cta" style="margin: 2.5rem 0; padding: 1.6rem; background: linear-gradient(135deg, rgba(251, 197, 211, 0.08) 0%, rgba(20, 18, 16, 0.95) 100%); border-left: 4px solid #FBC5D3; border-radius: 14px; box-shadow: 0 8px 25px rgba(0,0,0,0.4); display: flex; flex-direction: column; gap: 1rem;">
        <div style="display: flex; align-items: flex-start; gap: 12px;">
          <span style="font-size: 1.5rem; line-height: 1;">✂️</span>
          <div>
            <p class="inline-cta-text" style="margin: 0 0 6px 0; font-weight: 800; font-size: 1.05rem; color: #ffffff; line-height: 1.3;">
              Quer aplicar essa técnica no SEU tipo de cacho sem surpresas?
            </p>
            <p style="margin: 0; font-size: 0.88rem; color: #d1c7bd; line-height: 1.55;">
              No Studio do Jon (Caiçaras - BH), todo serviço começa com a <strong>Leitura de Fio a seco</strong> para mapear o encolhimento, a densidade e o caimento real antes de qualquer corte.
            </p>
          </div>
        </div>
        <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 4px;">
          <a href="/agendar" class="inline-cta-btn" style="background: #FBC5D3; color: #121110; padding: 11px 20px; border-radius: 8px; font-weight: 800; text-decoration: none; font-size: 0.88rem; display: inline-flex; align-items: center; gap: 6px;">
            📅 Ver Horários no Estúdio
          </a>
          <a href="https://wa.me/5531983044059?text=Oi%20Jon!%20Li%20o%20artigo%20no%20blog%20e%20gostaria%20de%20saber%20mais%20sobre%20o%20agendamento." target="_blank" rel="noreferrer" style="background: rgba(255,255,255,0.06); color: #ffffff; padding: 11px 18px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 0.88rem; display: inline-flex; align-items: center; gap: 6px; border: 1px solid rgba(255,255,255,0.25);">
            💬 Chamar no WhatsApp
          </a>
        </div>
      </div>
    `;
    const part1 = paragraphs.slice(0, 3).join('</p>') + '</p>';
    const part2 = paragraphs.slice(3).join('</p>');
    return part1 + inlineCtaHtml + part2;
  };

  return (
    <main className="post-page">
      <SEO 
        title={post.seoTitle || post.title} 
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
              <span>{post.category}</span>
            </div>
            <h1 className="heading-xl">{cleanTitle(post.title)}</h1>
            <div className="post-byline" style={{ marginTop: '1.5rem', color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
              <div className="byline-author">
                By <strong>Jonatan Junior</strong> (Especialista em cabelo cacheado)
              </div>
              <div className="byline-dates">
                Published: <time dateTime={post.datePublished || isoDate}>{post.date}</time>
                {post.dateModified && post.dateModified !== post.datePublished && post.dateModified !== isoDate && (
                  <> &bull; Updated: <time dateTime={post.dateModified}>{
                    new Date(post.dateModified).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) !== 'Invalid Date' 
                    ? new Date(post.dateModified).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) 
                    : post.dateModified
                  }</time></>
                )}
              </div>
            </div>
          </header>

          <div className="reveal active stagger-1">
            <img src={post.image} alt={`${post.title} — Artigo técnico sobre cabelos cacheados e crespos`} className="post-hero-image" fetchpriority="high" loading="eager" decoding="async" />
          </div>

          {post.scientificData && (
            <div className="scientific-container reveal active stagger-2">
              <div className="aeo-summary-box">
                <div className="aeo-summary-header">
                  <span className="aeo-badge">Resumo Científico</span>
                  {post.scientificData.sourceLabel && post.scientificData.sourceUrl && (
                    <a 
                      href={post.scientificData.sourceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="scientific-source"
                    >
                      Fonte: {post.scientificData.sourceLabel}
                    </a>
                  )}
                </div>
                <p className="aeo-summary-text">{post.scientificData.summary}</p>
              </div>

              {post.scientificData.factSheet && post.scientificData.factSheet.length > 0 && (
                <div className="scientific-table-wrap">
                  <table className="scientific-table">
                    <thead>
                      <tr>
                        <th>Parâmetro Técnico</th>
                        <th>Valor / Evidência</th>
                      </tr>
                    </thead>
                    <tbody>
                      {post.scientificData.factSheet.map((fact, index) => (
                        <tr key={index}>
                          <td><strong>{fact.label}</strong></td>
                          <td>{fact.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

           <div 
            className="post-content reveal active stagger-2" 
            dangerouslySetInnerHTML={{ __html: getProcessedContent(post.content) }} 
            onClick={handleContentClick}
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
            <div className="post-cta-card" style={{ background: 'linear-gradient(135deg, #161412 0%, #0d0c0b 100%)', border: '1px solid rgba(251,197,211,0.25)', borderRadius: '20px', padding: '2.5rem 2rem', boxShadow: '0 15px 40px rgba(0,0,0,0.6)' }}>
              <img src="/jon-trabalhando.webp" alt="Jon atendendo cliente" className="post-cta-image" />
              <div className="post-cta-content">
                <span className="post-cta-badge" style={{ display: 'inline-block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#FBC5D3', background: 'rgba(251,197,211,0.12)', padding: '4px 12px', borderRadius: 12, marginBottom: 12 }}>
                  Especialista em Cachos & Visagismo em BH
                </span>
                <h2 className="heading-lg" style={{ fontSize: '1.65rem', color: '#ffffff', marginBottom: 12, lineHeight: 1.25 }}>
                  O seu cabelo não precisa de mais experimentos.
                </h2>
                <p className="paragraph-md" style={{ color: '#d1c7bd', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: 20 }}>
                  Chega de tentar adivinhar o que o seu fio precisa ou temer o corte a seco. Agende sua sessão com Leitura de Fio no Studio do Jon (Caiçaras - BH) e conquiste a forma e o volume que o seu cacho merece.
                </p>
                
                <div className="post-cta-btns" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <a href="/agendar" className="btn btn-primary" style={{ backgroundColor: '#FBC5D3', color: '#121110', borderColor: '#FBC5D3', fontWeight: 800, padding: '12px 24px', borderRadius: 10 }}>
                    📅 Agendar meu Horário Online
                  </a>
                  <a href={`https://wa.me/5531983044059?text=Oi%20Jon!%20Li%20o%20post%20"${encodeURIComponent(post.title)}"%20e%20quero%20agendar%20meu%20hor%C3%A1rio.`} target="_blank" rel="noreferrer" className="btn btn-outline btn-blog" style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#ffffff', fontWeight: 700, padding: '12px 20px', borderRadius: 10 }}>
                    💬 Falar pelo WhatsApp
                  </a>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#a4968d', marginTop: 14, marginBottom: 0 }}>
                  📍 Rua Francisco Ovídio, 184 - Caiçaras, Belo Horizonte - MG
                </p>
              </div>
            </div>
          </footer>
        </article>
      </div>
      {/* Sticky Bottom CTA Bar */}
      <div className="sticky-bottom-cta">
        <div className="sticky-bottom-cta-inner">
          <span className="sticky-cta-text">Agende seu corte com o Jon</span>
          <Link to="/agendar" className="sticky-cta-btn">Agendar</Link>
        </div>
      </div>
    </main>
  );
};

export default BlogPostPage;
