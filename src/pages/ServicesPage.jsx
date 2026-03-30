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
    description:
      'Aqui não existe o "corta só as pontinhas" que vira um desastre. Meu corte é focado na arquitetura do fio natural, respeitando o fator de encolhimento e a sua rotina. O atendimento começa com uma consultoria real para entender seus desejos. Seja corte a seco (dry cutting) ou molhado, o foco é volume, definição e movimento para curvaturas do 2ABC ao 4ABC.',
    includes: ['Higienização', 'Finalização personalizada'],
    duration: null,
    price: 'R$ 170',
    priceType: 'fixed',
    highlight: false,
    cta: {
      type: 'booking',
      label: 'Agendar',
      url: 'http://trinks.com/ateliedoscachosmg',
    },
  },
  {
    id: 2,
    emoji: '💆',
    category: 'Tratamento',
    name: 'Tratamento Personalizado',
    tagline: 'Saúde da Fibra Capilar',
    description:
      'Esqueça a "máscara milagrosa" de prateleira. Antes de qualquer produto, eu faço uma análise clínica da fibra e do couro cabeludo. Identifico se o seu cabelo precisa de reposição lipídica, hídrica ou proteica. É tratamento de alta performance com produtos específicos para cabelos naturais, focado em devolver brilho, maleabilidade e saúde real ao fio.',
    includes: [],
    duration: null,
    price: 'R$ 120',
    priceType: 'fixed',
    highlight: false,
    cta: {
      type: 'booking',
      label: 'Agendar',
      url: 'http://trinks.com/ateliedoscachosmg',
    },
  },
  {
    id: 3,
    emoji: '✨',
    category: 'Combo',
    name: 'Corte + Tratamento',
    tagline: 'O Queridinho do Studio',
    description:
      'O pacote completo para quem quer sair com o visual renovado e a saúde capilar em dia. Unimos o corte personalizado com o tratamento sob medida após análise da fibra. É a escolha ideal para quem está em transição capilar ou quer dar aquele "up" total na definição e no brilho dos cachos. Só vantagem, sem promessa vazia.',
    includes: [],
    duration: null,
    price: 'R$ 230',
    priceType: 'fixed',
    highlight: true,
    popularTag: '⭐ Mais Pedido',
    cta: {
      type: 'booking',
      label: 'Agendar',
      url: 'http://trinks.com/ateliedoscachosmg',
    },
  },
  {
    id: 4,
    emoji: '🎨',
    category: 'Coloração',
    name: 'Coloração e Retoque de Raiz',
    tagline: 'Cor vibrante que respeita o cacho',
    description:
      'Quer mudar o visual ou esconder os brancos sem detonar a estrutura do cacho? Realizo coloração global, retoque de raiz e correção de cor com técnica e produtos que respeitam a sensibilidade dos fios naturais. Cor vibrante, uniforme e, acima de tudo, com o brilho que o seu cabelo merece.',
    includes: [],
    duration: null,
    price: 'Sob Orçamento',
    priceType: 'quote',
    highlight: false,
    cta: {
      type: 'whatsapp',
      label: '💬 Solicitar Orçamento',
      url: WA_BASE + encodeURIComponent('Olá! Gostaria de um orçamento para coloração/retoque de raiz.'),
    },
  },
  {
    id: 5,
    emoji: '🌟',
    category: 'Coloração',
    name: 'Mechas e Luzes',
    tagline: 'Morena Iluminada e Loiros',
    description:
      'Realçar a curvatura com luzes exige ciência. Todas as mechas no Studio são feitas apenas após o teste de mecha obrigatório, garantindo a segurança do seu fio. Do efeito Morena Iluminada ao loiro mais claro, usamos técnicas que preservam a mola do cacho.',
    includes: ['Tratamento pós-química de cortesia para recuperar a fibra'],
    duration: null,
    price: 'Sob Orçamento',
    priceType: 'quote',
    highlight: false,
    bonusTag: '🎁 Bônus incluído',
    cta: {
      type: 'whatsapp',
      label: '💬 Solicitar Orçamento',
      url: WA_BASE + encodeURIComponent('Olá! Gostaria de um orçamento para mechas e luzes.'),
    },
  },
  {
    id: 6,
    emoji: '🌿',
    category: 'Tratamento',
    name: 'Detox Capilar',
    tagline: 'Saúde do Couro Cabeludo',
    description:
      'Sofre com oleosidade excessiva, caspa ou dermatite seborreica? O Detox Capilar é um spa para o seu couro cabeludo. Com esfoliação suave de sementes de damasco e ativos refrescantes, limpamos profundamente os folículos, estimulando a circulação e o crescimento saudável dos fios. Frescor imediato e couro cabeludo limpinho.',
    includes: [],
    duration: null,
    price: 'R$ 150',
    priceType: 'fixed',
    highlight: false,
    cta: {
      type: 'booking',
      label: 'Agendar',
      url: 'http://trinks.com/ateliedoscachosmg',
    },
  },
];

const ServicesPage = () => {
  const [activeFilter, setActiveFilter] = useState('Todos');

  const categories = ['Todos', ...new Set(services.map((s) => s.category))];

  const filtered =
    activeFilter === 'Todos'
      ? services
      : services.filter((s) => s.category === activeFilter);

  return (
    <main className="services-page">
      {/* Hero da página */}
      <section className="services-hero">
        <div className="services-hero-bg" />
        <div className="container services-hero-content">
          <span className="services-badge">Serviços Especializados em Cachos e Curvaturas · BH</span>
          <h1 className="services-hero-title">
            Cada serviço, <br />
            <span className="text-gradient">uma transformação</span>
          </h1>
          <p className="services-hero-sub">
            Do corte a seco ao tratamento personalizado, cada atendimento começa com escuta
            e termina com um visual que é 100% você.
          </p>
        </div>
      </section>

      {/* Filtros por categoria */}
      <section className="services-filter-section">
        <div className="container">
          <div className="filter-bar">
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

      {/* Grid de serviços */}
      <section className="services-grid-section section-padding">
        <div className="container">
          <div className="services-full-grid">
            {filtered.map((service, i) => (
              <div
                key={service.id}
                className={`service-detail-card ${service.highlight ? 'highlighted' : ''}`}
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                {service.popularTag && (
                  <span className="service-pop-tag">{service.popularTag}</span>
                )}

                <div className="sdc-header">
                  <div className={`sdc-icon ${service.highlight ? 'icon-light' : 'icon-blue'}`}>
                    <span>{service.emoji}</span>
                  </div>
                  <div className="sdc-category">{service.category}</div>
                </div>

                <h2 className="sdc-name">{service.name}</h2>
                <p className="sdc-tagline">{service.tagline}</p>
                <p className="sdc-description">{service.description}</p>

                {service.includes.length > 0 && (
                  <div className="sdc-includes">
                    <p className="sdc-includes-title">
                      {service.bonusTag ? service.bonusTag : 'O que está incluso:'}
                    </p>
                    <ul>
                      {service.includes.map((item, idx) => (
                        <li key={idx}>
                          <span className="check-icon">✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="sdc-footer">
                  <div className="sdc-meta">
                    <span className={`sdc-price ${service.priceType === 'quote' ? 'price-quote' : ''}`}>
                      {service.price}
                    </span>
                  </div>
                  <a
                    href={service.cta.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`btn ${
                      service.cta.type === 'whatsapp'
                        ? 'btn-whatsapp-cta'
                        : service.highlight
                        ? 'btn-yellow'
                        : 'btn-primary'
                    }`}
                  >
                    {service.cta.label}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="services-cta section-padding">
        <div className="container">
          <div className="cta-box">
            <span className="cta-emoji">💈</span>
            <h2 className="cta-title">Não encontrou o que procura?</h2>
            <p className="cta-sub">
              Fale comigo pelo WhatsApp. Podemos conversar sobre o que você precisa e
              encontrar o serviço ideal para o seu cabelo.
            </p>
            <div className="cta-buttons">
              <a
                href={`${WA_BASE}${encodeURIComponent('Olá! Gostaria de tirar uma dúvida sobre os serviços.')}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-whatsapp"
              >
                💬 Falar no WhatsApp
              </a>
              <a
                href="http://trinks.com/ateliedoscachosmg"
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline"
              >
                Ver agenda online
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ServicesPage;
