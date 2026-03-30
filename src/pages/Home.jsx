import React from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import FAQ from '../components/FAQ';
import Reviews from '../components/Reviews';

const Home = () => {
  return (
    <main>
      <Hero />
      
      {/* Breve introdução à História */}
      <section className="section-padding text-center">
        <div className="container">
          <h2 className="heading-lg mb-1">Conheça o Jon</h2>
          <p className="paragraph-lg max-w-lg mx-auto mb-3 mt-2 text-gray">
            Especialista em cabelos com curvatura, unindo técnica e acolhimento para revelar a melhor versão do seu cabelo natural.
          </p>
          <Link to="/sobre" className="btn btn-outline">Minha História Completa</Link>
        </div>
      </section>

      {/* Destaque de Serviços */}
      <section className="section-padding glass-panel text-center">
        <div className="container">
          <h2 className="heading-lg mb-1">Nossos Serviços</h2>
          <p className="paragraph-lg max-w-lg mx-auto mb-3 mt-2 text-gray">
            Cortes a seco, finalizações exclusivas e tratamentos avançados. Uma experiência de luxo para os seus fios.
          </p>
          <Link to="/servicos" className="btn btn-primary">Ver Todos os Serviços</Link>
        </div>
      </section>

      <Reviews />
      <FAQ />
    </main>
  );
};

export default Home;
