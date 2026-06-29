import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { Arrow, Reveal, ContactCTA } from '../components/NewDesignComponents';
import { getInitialPosts, fetchLatestPosts } from '../utils/blogService';
import Magnetic from '../components/Magnetic';

// Scroll hint: vanishes once user starts scrolling
function ScrollHint() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const onScroll = () => { if (window.scrollY > 60) setHidden(true); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div className={`scroll-hint${hidden ? ' hidden' : ''}`} aria-hidden="true">
      <div className="scroll-hint-line" />
      <span>scroll</span>
    </div>
  );
}

// CountUp: animates from 0 to target when element enters viewport
function CountUp({ target, suffix = '', duration = 1400 }) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Respect reduced motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) { setValue(target); return; }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const tick = (now) => {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          // Ease out cubic
          const eased = 1 - Math.pow(1 - progress, 3);
          setValue(Math.round(eased * target));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.disconnect();
      }
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [target, duration]);
  return <span ref={ref}>{value}{suffix}</span>;
}

// SVG Star — consistent across all platforms
const StarSVG = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
    <path d="M7 0.5l1.796 3.64 4.017.584-2.907 2.833.687 4-.593-.34L7 9.5l-3 1.717.687-4L1.187 4.724l4.017-.584L7 .5z"/>
  </svg>
);

function HomeHero() {
  const portraitRef = useRef(null);
  const badgeRef = useRef(null);
  const captionRef = useRef(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    const imgEl = portraitRef.current;
    const badgeEl = badgeRef.current;
    const captionEl = captionRef.current;

    const onScroll = () => {
      const y = window.scrollY;
      if (imgEl) imgEl.style.transform = `translate3d(0, ${y * 0.05}px, 0)`;
      if (badgeEl) badgeEl.style.transform = `translate3d(0, ${y * -0.06}px, 0)`;
      if (captionEl) captionEl.style.transform = `translate3d(0, ${y * 0.08}px, 0)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header id="top" className="hero">
      <div className="hero-blob" aria-hidden="true" />
      <div className="container">
        <div className="eyebrow reveal in" style={{ marginBottom: 36 }}>
          Studio do Jon · Caiçara · Belo Horizonte
        </div>

        <div className="hero-grid">
          <div>
            <h1 className="display reveal in">
              Especialista em Cabelo Cacheado em <span className="accent-word">Belo Horizonte</span>.
            </h1>

            <Reveal delay={120}>
              <p className="lead" style={{ marginTop: 28 }}>
                Porosidade, curvatura, histórico. Cada cacho conta uma história — e o corte só começa
                depois que a história fica clara. Sem fórmula pronta, sem tendência genérica.
              </p>
            </Reveal>

            <Reveal delay={220} className="hero-actions">
              <Magnetic>
                <Link to="/agendar" className="btn btn-accent">
                  Agendar corte e avaliação <Arrow />
                </Link>
              </Magnetic>
              <Magnetic>
                <a href="/sobre#metodo" className="btn btn-ghost">
                  Conhecer Método Leitura de Fio
                </a>
              </Magnetic>
            </Reveal>

            <Reveal delay={320} className="hero-meta">
              <div className="hero-stat">
                <div className="n">
                  <CountUp target={9} suffix="+" />
                </div>
                <div className="l">Anos com cacheados</div>
              </div>
              <div className="hero-stat">
                <div className="n">Todas</div>
                <div className="l">As curvaturas</div>
              </div>
              <div className="hero-stat">
                <div className="n">
                  <CountUp target={100} suffix="%" />
                </div>
                <div className="l">Avaliação prévia</div>
              </div>
            </Reveal>
          </div>

          <Reveal delay={180}>
            <div className="hero-portrait" style={{ willChange: 'transform' }}>
              <span ref={badgeRef} className="badge" style={{ willChange: 'transform' }}>Studio · BH</span>
              <div ref={captionRef} className="caption" style={{ willChange: 'transform' }}>"Antes da tesoura, a leitura."</div>
              <img
                ref={portraitRef}
                src="/jon-perfil.jpg"
                alt="Jon, especialista em cabelo cacheado em Belo Horizonte"
                width="480"
                height="600"
                style={{ width: '100%', height: '100%', objectFit: 'cover', aspectRatio: '4/5', willChange: 'transform' }}
              />
            </div>
          </Reveal>
        </div>
      </div>

      <ScrollHint />

      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {Array.from({ length: 2 }).flatMap((_, k) => [
            { text: "Cacheados",      color: "rgba(255,255,255,0.38)" },
            { text: "Crespos",        color: "rgba(255,255,255,0.38)" },
            { text: "Ondulados",      color: "rgba(255,255,255,0.38)" },
            { text: "Belo Horizonte", color: "#7A3CFF" },
            { text: "Corte",          color: "#E2703A" },
            { text: "Cor",            color: "rgba(255,255,255,0.38)" },
            { text: "Tratamento",     color: "rgba(255,255,255,0.38)" },
            { text: "Leitura de Fio", color: "#E2703A" },
          ].map((item, i) => (
            <span className="marquee-item" key={`${k}-${i}`} style={{ color: item.color }}>{item.text}</span>
          )))}
        </div>
      </div>
    </header>
  );
}

function HomeManifesto() {
  const pillars = [
    { n: "01 — DIAGNÓSTICO", h: "O fio fala primeiro.", p: "Toda visita começa com leitura: porosidade, curvatura, elasticidade e histórico químico. Sem isso, qualquer corte vira aposta." },
    { n: "02 — CORTE HÍBRIDO", h: "Onde o cacho realmente cai.", p: "Ele pode ser feito a seco ou molhado, a depender da estrutura do fio. O objetivo é que cada mecha caia exatamente onde vai cair no seu dia a dia, respeitando o volume natural." },
    { n: "03 — SEM ALISAR", h: "Cacho não é problema.", p: "Aqui não existe progressiva disfarçada, escova diária ou promessa de \"domar\". Existe estrutura para o seu cacho ser o que ele é." },
  ];
  return (
    <section className="manifesto">
      <div className="container">
        <Reveal as="div" className="section-head">
          <div>
            <div className="eyebrow">Manifesto</div>
            <h2 className="display" style={{ marginTop: 18 }}>
              Três princípios <span className="italic">não negociáveis.</span>
            </h2>
          </div>
          <p className="lead" style={{ marginBottom: 8 }}>
            A diferença entre um corte bonito e um corte que continua bonito em casa está
            no que acontece antes da tesoura tocar o fio.
          </p>
        </Reveal>

        <div className="manifesto-grid">
          {pillars.map((p, i) => (
            <Reveal key={i} delay={i * 90} className="pillar">
              <div className="n">{p.n}</div>
              <h3>{p.h}</h3>
              <p>{p.p}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function HomeTeasers() {
  const items = [
    { n: "01", t: "Sobre o Jon", d: "9 anos especializado, método próprio, atendimento individual.", href: "/sobre" },
    { n: "02", t: "Serviços", d: "Leitura, corte, morena iluminada, transição e cronograma.", href: "/servicos" },
    { n: "03", t: "Galeria", d: "Antes/depois reais, sem retoque pra parecer domado.", href: "/galeria" },
    { n: "04", t: "Depoimentos", d: "O que muda na rotina depois da Leitura de Fio.", href: "/depoimentos" },
  ];
  return (
    <section className="section" style={{ paddingTop: "clamp(60px, 9vw, 110px)" }}>
      <div className="container">
        <Reveal as="div" className="section-head">
          <div>
            <div className="eyebrow">Studio</div>
            <h2 className="display" style={{ marginTop: 18 }}>
              Explore o <span className="italic">trabalho.</span>
            </h2>
          </div>
        </Reveal>
        <div className="teasers">
          {items.map((x, i) => (
            <Reveal key={i} delay={i * 70}>
              <Link className="teaser" to={x.href}>
                <div>
                  <div className="n">{x.n}</div>
                  <h3 style={{ marginTop: 18 }}>{x.t}</h3>
                  <p style={{ color: "var(--muted)", fontSize: 14.5, lineHeight: 1.5, margin: "12px 0 0" }}>{x.d}</p>
                </div>
                <span className="more">Ver <Arrow /></span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function HomeMethodTeaser() {
  return (
    <section className="method section">
      <div className="container">
        <Reveal as="div" className="section-head">
          <div>
            <div className="eyebrow">Método Leitura de Fio</div>
            <h2 className="display" style={{ marginTop: 18 }}>
              O que acontece <span className="italic" style={{ color: "var(--accent-warm)" }}>antes</span><br/>
              da tesoura tocar o fio.
            </h2>
          </div>
          <p className="lead">
            Quatro etapas. Nenhuma pulada. O que separa um corte que funciona de um corte que
            "ficou bom só no salão" é o tempo gasto antes — e o método que sustenta o depois.
          </p>
        </Reveal>

        <div className="method-steps">
          {[
            { n: "01", t: "Leitura de fio", d: "Análise técnica: porosidade, padrão de curvatura, elasticidade e histórico químico." },
            { n: "02", t: "Visagismo & intenção", d: "Sua rotina, seu rosto, seu estilo. O corte serve a você — não o contrário." },
            { n: "03", t: "Corte híbrido", d: "Sem pente, sem tração. Cada cacho cortado onde realmente cai." },
            { n: "04", t: "Finalização e protocolo", d: "Cronograma personalizado pra reproduzir em casa." },
          ].map((s, i) => (
            <Reveal key={i} delay={i * 60} className="step">
              <div className="num">{s.n}</div>
              <div className="ttl">{s.t}</div>
              <div className="desc">{s.d}</div>
              <div className="icn">ETAPA {s.n}</div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <div style={{ marginTop: 48, display: "flex", justifyContent: "center" }}>
            <Link to="/blog/leitura-de-fio-metodo-exclusivo-studio-do-jon" className="btn btn-light">
              Ler o método completo <Arrow />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function HomeTestimonials() {
  const list = [
    { q: "Nos meus quase 60 anos de vida, nunca ninguém cortou tão bem meu cabelo! E finalmente entendi como meus cachos funcionam. Ele é ESPETACULAR!!!!", n: "Claudia Dantas", m: "Avaliação no Google · Crespo" },
    { q: "O Jon é fantástico! Tem uma escuta super ativa, me entendeu, entendeu meu cabelo e me ensinou a finalizar de uma forma muito mais simples do que eu jamais imaginei!", n: "Fernanda Baiao", m: "Avaliação no Google · Ondulado" },
    { q: "Eu amei o resultado. Foi explicando o que estava fazendo e a técnica que usava. Me senti muito segura e super recomendo!!!", n: "Ana Beatriz", m: "Avaliação no Google · Cacheado" },
  ];
  return (
    <section className="testimonials section">
      <div className="container">
        <Reveal as="div" className="section-head">
          <div>
            <div className="eyebrow">Depoimentos</div>
            <h2 className="display" style={{ marginTop: 18 }}>
              O que muda quando<br/>o fio é <span className="italic">lido primeiro.</span>
            </h2>
          </div>
          <p className="lead">Mais de uma década com cacheadas e crespas em BH.</p>
        </Reveal>

        <div className="testimonial-track">
          {list.map((t, i) => (
            <Reveal key={i} delay={i * 80} className="t-card">
              <div className="stars" aria-label="5 estrelas">
                {[0,1,2,3,4].map(k => <StarSVG key={k} />)}
              </div>
              <p className="q">"{t.q}"</p>
              <div className="who">
                <div className="av">{t.n[0]}</div>
                <div className="who-meta">
                  <div className="n">{t.n}</div>
                  <div className="m">{t.m}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={250}>
          <div style={{ marginTop: 48, display: "flex", justifyContent: "center" }}>
            <Link to="/depoimentos" className="btn btn-ghost">
              Ler todos os depoimentos <Arrow />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function HomeBlog() {
  const getReadingTime = (content) => {
    if (!content) return '5 min';
    const words = content.replace(/<[^>]*>/g, '').trim().split(/\s+/).length;
    return `${Math.ceil(words / 200)} min`;
  };

  const defaultGradients = [
    "linear-gradient(160deg,#6E2F18 0%,#1A1310 100%), radial-gradient(60% 60% at 80% 20%, rgba(201,123,73,0.6) 0%, transparent 60%)",
    "linear-gradient(160deg,#3a2b22 0%,#1A1310 100%)",
    "linear-gradient(160deg,#7a4a2e 0%,#2a1a12 100%)"
  ];

  const [posts, setPosts] = useState(() => {
    const initialList = getInitialPosts().slice(0, 3);
    return initialList.map((post, i) => ({
      cat: post.category,
      title: post.title,
      ex: post.excerpt,
      time: getReadingTime(post.content),
      slug: post.slug,
      image: post.image,
      grad: defaultGradients[i % defaultGradients.length]
    }));
  });

  useEffect(() => {
    async function loadLatest() {
      try {
        const latest = await fetchLatestPosts();
        const top3 = latest.slice(0, 3);
        setPosts(top3.map((post, i) => ({
          cat: post.category,
          title: post.title,
          ex: post.excerpt,
          time: getReadingTime(post.content),
          slug: post.slug,
          image: post.image,
          grad: defaultGradients[i % defaultGradients.length]
        })));
      } catch (err) {
        console.warn('Erro ao carregar posts na home:', err);
      }
    }
    loadLatest();
  }, []);

  return (
    <section className="section">
      <div className="container">
        <Reveal as="div" className="section-head">
          <div>
            <div className="eyebrow">Diário do studio</div>
            <h2 className="display" style={{ marginTop: 18 }}>
              Conteúdo técnico,<br/>sem <span className="italic">papo de embalagem.</span>
            </h2>
          </div>
          <p className="lead">
            Textos longos, escritos pelo Jon, sobre o que realmente importa pro seu fio.
          </p>
        </Reveal>

        <div className="blog-grid">
          {posts.map((p, i) => (
            <Reveal key={i} delay={i * 90}>
              <Link className="post" to={`/blog/${p.slug}`}>
                <div className="cover">
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.title}
                      loading="lazy"
                      decoding="async"
                      width="600"
                      height="450"
                    />
                  ) : (
                    <div className="ph" style={{ background: p.grad, position: "absolute", inset: 0 }} />
                  )}
                  <span className="cat">{p.cat}</span>
                </div>
                <div className="meta">
                  <span>Leitura {p.time}</span>
                  <span className="dot"></span>
                  <span>Studio do Jon</span>
                </div>
                <h3>{p.title}</h3>
                <p className="ex">{p.ex}</p>
                <span className="more">Ler ensaio <Arrow /></span>
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal delay={250}>
          <div style={{ marginTop: 48, display: "flex", justifyContent: "center" }}>
            <Link to="/blog" className="btn btn-ghost">
              Todos os ensaios <Arrow />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

import FAQ from '../components/FAQ';
import Reviews from '../components/Reviews';

const Home = () => {
  return (
    <main>
      <SEO 
        title="Especialista em Cabelo Cacheado BH | Studio do Jon" 
        description="Especialista em cachos em Belo Horizonte. O Studio do Jon oferece corte a seco, diagnóstico técnico e tratamentos sob medida no Caiçara. Agende seu horário!" 
      />
      <HomeHero />
      <hr className="technical-rule" />
      <HomeManifesto />
      <hr className="technical-rule" />
      <HomeTeasers />
      <HomeMethodTeaser />
      <hr className="technical-rule" />
      <Reviews isPage={false} />
      <HomeBlog />
      <FAQ />
      <hr className="technical-rule" />
      <ContactCTA />
    </main>
  );
};

export default Home;
