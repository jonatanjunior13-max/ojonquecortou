import React from 'react';
import Services from '../components/Services';

const ServicesPage = () => {
  return (
    <main className="page-container pt-20">
      <Services />
      <section className="section-padding container text-center mb-8">
        <div className="glass-panel p-6 rounded-lg inline-block">
          <h3 className="heading-md mb-2">Preparado para transformar seu visual?</h3>
          <p className="text-gray mb-4 max-w-lg mx-auto">
            Todos os nossos serviços iniciam com uma análise detalhada dos fios.
            Agende pelo aplicativo Trinks e garanta seu horário.
          </p>
          <a href="http://trinks.com/ateliedoscachosmg" target="_blank" rel="noreferrer" className="btn btn-primary">
            Agendar Agora
          </a>
        </div>
      </section>
    </main>
  );
};

export default ServicesPage;
