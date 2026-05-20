import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { Arrow, Reveal, ContactCTA } from '../components/NewDesignComponents';
import { posts as blogPosts } from '../data/posts';

function HomeHero() {
  return (
    <header id="top" className="hero">
      <div className="container">
        <div className="eyebrow reveal in" style={{ marginBottom: 36 }}>
          Studio do Jon · Caiçara · Belo Horizonte
        </div>

        <div className="hero-grid">
          <div>
            <h1 className="display reveal in">
              O especialista que <span className="accent-word">lê o seu fio</span> antes de cortar.
            </h1>

            <Reveal delay={120}>
              <p className="lead" style={{ marginTop: 28 }}>
                Porosidade, curvatura, histórico. Cada cacho conta uma história — e o corte só começa
                depois que a história fica clara. Sem fórmula pronta, sem tendência genérica.
              </p>
            </Reveal>

            <Reveal delay={220} className="hero-actions">
              <a href="http://trinks.com/ojonquecortou" target="_blank" rel="noopener noreferrer" className="btn btn-accent">
                Agendar avaliação <Arrow />
              </a>
              <a href="/sobre#metodo" className="btn btn-ghost">
                Conhecer o método
              </a>
            </Reveal>

            <Reveal delay={320} className="hero-meta">
              <div className="hero-stat">
                <div className="n">9<span style={{ color: "var(--accent)" }}>+</span></div>
                <div className="l">Anos com cacheados</div>
              </div>
              <div className="hero-stat">
                <div className="n">Todas</div>
                <div className="l">As curvaturas</div>
              </div>
              <div className="hero-stat">
                <div className="n">100<span style={{ color: "var(--accent)" }}>%</span></div>
                <div className="l">Avaliação prévia</div>
              </div>
            </Reveal>
          </div>

          <Reveal delay={180}>
            <div className="hero-portrait">
              <span className="badge">Studio · BH</span>
              <div className="caption">"Antes da tesoura, a leitura."</div>
              <img src="/jon-perfil.jpg" alt="Foto do Jon" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </Reveal>
        </div>
      </div>

      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {Array.from({ length: 2 }).flatMap((_, k) => [
            "Leitura de fio", "Corte híbrido", "Porosidade", "Curvatura",
            "Visagismo", "Morena iluminada", "Transição capilar", "Cachos verdadeiros",
          ].map((t, i) => (
            <span className="marquee-item" key={`${k}-${i}`}>{t}</span>
          )))}
        </div>
      </div>
    </header>
  );
}

function HomeManifesto() {
  const pillars = [
    { n: "01 — DIAGNÓSTICO", h: "O fio fala primeiro.", p: "Toda visita começa com leitura: porosidade, curvatura, elasticidade e histórico químico. Sem isso, qualquer corte vira aposta." },
    { n: "02 — CORTE HÍBRIDO", h: "Onde o cacho realmente cai.", p: "Cortar molhado esconde o comportamento real do fio. A seco, cada mecha cai onde vai cair — e o corte respeita isso." },
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
            <Link to="/blog/metodo-leitura-de-fio-antes-da-tesoura" className="btn btn-light">
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
              <div className="stars">{"★★★★★".split("").map((s, k) => <span key={k}>{s}</span>)}</div>
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

  const posts = blogPosts.slice(0, 3).map((post, i) => ({
    cat: post.category,
    title: post.title,
    ex: post.excerpt,
    time: getReadingTime(post.content),
    slug: post.slug,
    image: post.image,
    grad: defaultGradients[i % defaultGradients.length]
  }));

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
                    <img src={p.image} alt={p.title} />
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

const Home = () => {
  return (
    <main>
      <SEO 
        title="Studio do Jon | Especialista em Cabelo Cacheado em BH" 
        description="Especialista em corte para cabelo cacheado em Belo Horizonte. Jon analisa o fio antes de tocar: porosidade, curvatura e histórico. Caiçara, BH. Agende." 
      />
      <HomeHero />
      <HomeManifesto />
      <HomeTeasers />
      <HomeMethodTeaser />
      <HomeTestimonials />
      <HomeBlog />
      <ContactCTA />
    </main>
  );
};

export default Home;
