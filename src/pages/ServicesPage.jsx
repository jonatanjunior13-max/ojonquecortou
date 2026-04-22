import React, { useState } from 'react';
import './ServicesPage.css';

const WA_NUMBER = '553135866673';
const WA_BASE = `https://wa.me/${WA_NUMBER}?text=`;

const services = [
  {
    id: 1,
    emoji: '✂️',
    category: 'Corte',
    name: 'Corte Especializado',
    tagline: 'Ondulados, Cacheados e Crespos',
    description: 'Aqui não existe o "corta só as pontinhas" que vira um desastre. Meu corte é focado na arquitetura do fio natural, respeitando o fator de encolhimento e a sua rotina.',
    price: 'R$ 190',
    cta: 'http://trinks.com/ojonquecortou',
  },
  {
    id: 3,
    emoji: '✨',
    category: 'Combo',
    name: 'Corte + Tratamento',
    tagline: 'O Queridinho do Studio',
    description: 'O pacote completo para quem quer sair com o visual renovado e a saúde capilar em dia. Unimos o corte personalizado com o tratamento sob medida.',
    price: 'De 320 por 260',
    highlight: true,
    cta: 'http://trinks.com/ojonquecortou',
  },
  {
    id: 2,
    emoji: '💆',
    category: 'Tratamento',
    name: 'Tratamento Personalizado',
    tagline: 'Saúde da Fibra Capilar',
    description: 'Análise clínica da fibra e do couro cabeludo. Identifico se o seu cabelo precisa de reposição lipídica, hídrica ou proteica.',
    price: 'R$ 130',
    cta: 'http://trinks.com/ojonquecortou',
  },
  {
    id: 5,
    emoji: '🌟',
    category: 'Coloração',
    name: 'Mechas e Luzes',
    tagline: 'Morena Iluminada e Loiros',
    description: 'Realçar a curvatura com luzes exige ciência. Todas as mechas no Studio são feitas apenas após o teste de mecha obrigatório.',
    price: 'Sob Orçamento',
    cta: WA_BASE + encodeURIComponent('Olá! Gostaria de um orçamento para mechas e luzes.'),
  }
];

const ServicesPage = () => {
  const [activeFilter, setActiveFilter] = useState('Todos');
  const categories = ['Todos', ...new Set(services.map((s) => s.category))];
  const filtered = activeFilter === 'Todos' ? services : services.filter((s) => s.category === activeFilter);

  return (
    <main className="services-page">
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
                <div className="sdc-footer">
                  <span className="sdc-price">{service.price}</span>
                  <a href={service.cta} target="_blank" rel="noreferrer" className="btn btn-primary">
                    Reservar
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default ServicesPage;
