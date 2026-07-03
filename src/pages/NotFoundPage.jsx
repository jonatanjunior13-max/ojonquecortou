import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const NotFoundPage = () => {
  return (
    <main className="about-page">
      <SEO
        title="Página não encontrada"
        description="A página que você procura não existe ou foi movida."
        url="/404"
        noindex
      />
      <section className="about-hero section-padding">
        <div className="container text-center reveal active">
          <h1 className="heading-xl">Página não encontrada</h1>
          <p className="paragraph-lg max-w-lg mx-auto mt-2">
            O endereço que você tentou acessar não existe ou foi movido. Confira alguns caminhos possíveis:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', marginTop: 32 }}>
            <Link to="/" className="btn-primary">Página Inicial</Link>
            <Link to="/servicos" className="btn-secondary">Serviços</Link>
            <Link to="/blog" className="btn-secondary">Blog</Link>
            <Link to="/agendar" className="btn-secondary">Agendar</Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default NotFoundPage;
