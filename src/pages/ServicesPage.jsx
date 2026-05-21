import React, { useState } from 'react';
import SEO from '../components/SEO';
import './ServicesPage.css';

const WA_NUMBER = '553135866673';
const WA_BASE = `https://wa.me/${WA_NUMBER}?text=`;
const TRINKS_URL = 'http://trinks.com/ojonquecortou';

import { SEED_SERVICES } from '../data/seedServices';

const services = SEED_SERVICES.map(s => ({
  id: s.id,
  emoji: s.emoji || '✨',
  category: s.category,
  name: s.name,
  tagline: s.tagline || '',
  description: s.description,
  price: s.priceType === 'A partir de' 
    ? `A partir de R$ ${s.price}` 
    : s.promoPrice ? `De R$ ${s.price} por R$ ${s.promoPrice}` : `R$ ${s.price}`,
  includes: s.includes || [],
  highlight: s.promoPrice ? true : false,
  cta: s.priceType === 'A partir de' 
    ? WA_BASE + encodeURIComponent(`Olá! Gostaria de um orçamento para ${s.name}.`) 
    : TRINKS_URL,
  btnLabel: s.priceType === 'A partir de' ? 'Me chama no WhatsApp' : 'Agendar Horário'
}));

const ServicesPage = () => {
  const [activeFilter, setActiveFilter] = useState('Todos');
  const categories = ['Todos', ...new Set(services.map((s) => s.category))];
  const filtered = activeFilter === 'Todos' ? services : services.filter((s) => s.category === activeFilter);

  return (
    <main className="services-page">
      <SEO 
        title="Corte Cacheado em BH | Serviços | Studio do Jon" 
        description="Corte técnico para cabelo cacheado, crespo e ondulado em BH. Jon faz leitura de fio antes de tocar. Deva Cut, Wolf Cut e mais. Agende no Studio do Jon." 
      />
      <section className="services-hero section-padding">
        <div className="container text-center reveal active">
          <h1 className="heading-xl">Tabela de <span className="text-gradient">Serviços</span></h1>
          <p className="paragraph-lg max-w-lg mx-auto">
            Processos técnicos focados na saúde e na definição real do seu cacho.
          </p>
        </div>
      </section>

      <section className="services-filter-section">
        <div className="container">
          <div className="filter-bar reveal">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`filter-btn ${activeFilter === cat ? 'active' : ''}`}
                onClick={() => setActiveFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="services-grid-section section-padding">
        <div className="container">
          <div className="services-full-grid">
            {filtered.map((service, i) => (
              <div
                key={service.id}
                className={`service-detail-card reveal stagger-${(i % 3) + 1} ${service.highlight ? 'highlight-card' : ''}`}
              >
                <div className="sdc-header">
                  <span className="sdc-emoji">{service.emoji}</span>
                  <span className="sdc-category">{service.category}</span>
                </div>
                <h2 className="sdc-name">{service.name}</h2>
                <p className="sdc-tagline">{service.tagline}</p>
                <p className="sdc-description">{service.description}</p>
                
                {service.includes && service.includes.length > 0 && (
                  <div className="sdc-includes">
                    <p className="sdc-includes-title">O que está incluso:</p>
                    <ul>
                      {service.includes.map((item, idx) => (
                        <li key={idx}>✓ {item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="sdc-footer">
                  <span className="sdc-price">{service.price}</span>
                  <a href={service.cta} target="_blank" rel="noreferrer" className="btn btn-primary">
                    {service.btnLabel || 'Reservar'}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="services-cta-bottom section-padding">
        <div className="container text-center reveal">
          <h2 className="heading-lg mb-2">Pronta para transformar seus cachos?</h2>
          <p className="paragraph-lg mb-4 max-w-md mx-auto">
            Escolha o melhor horário para você e garanta sua vaga no Studio do Jon.
          </p>
          <a href={TRINKS_URL} target="_blank" rel="noreferrer" className="btn btn-primary">
            Agendar Agora pelo Trinks
          </a>
        </div>
      </section>
    </main>
  );
};

export default ServicesPage;
