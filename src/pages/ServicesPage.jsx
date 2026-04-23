import React, { useState } from 'react';
import './ServicesPage.css';

const WA_NUMBER = '553135866673';
const WA_BASE = `https://wa.me/${WA_NUMBER}?text=`;
const TRINKS_URL = 'http://trinks.com/ojonquecortou';

const services = [
  {
    id: 1,
    emoji: '✂️',
    category: 'Corte',
    name: 'Corte Especializado',
    tagline: 'Ondulados, Cacheados e Crespos',
    description: 'Aqui não existe o "corta só as pontinhas" que vira um desastre. Meu corte é focado na arquitetura do fio natural, respeitando o fator de encolhimento e a sua rotina.',
    price: 'R$ 190',
    includes: ['Leitura de Fio técnica', 'Corte a seco/técnico', 'Finalização educativa'],
    cta: TRINKS_URL,
  },
  {
    id: 7,
    emoji: '📏',
    category: 'Corte',
    name: 'Manutenção de Corte',
    tagline: 'Exclusivo para clientes recorrentes',
    description: 'Retoque estratégico nas pontas e no formato para manter o caimento original. Válido para quem cortou com o Jon nos últimos 90 dias.',
    price: 'R$ 130',
    includes: ['Ajuste de volume', 'Limpeza de pontas'],
    cta: TRINKS_URL,
  },
  {
    id: 3,
    emoji: '✨',
    category: 'Combo',
    name: 'Corte + Tratamento',
    tagline: 'O Queridinho do Studio',
    description: 'O pacote completo para quem quer sair com o visual renovado e a saúde capilar em dia. Unimos o corte personalizado com o tratamento sob medida.',
    price: 'De 320 por 230',
    highlight: true,
    includes: ['Corte Especializado', 'Tratamento de Alta Performance', 'Finalização Premium'],
    cta: TRINKS_URL,
  },
  {
    id: 2,
    emoji: '💆',
    category: 'Tratamento',
    name: 'Tratamento Personalizado',
    tagline: 'Saúde da Fibra Capilar',
    description: 'Análise clínica da fibra e do couro cabeludo. Identifico se o seu cabelo precisa de reposição lipídica, hídrica ou proteica.',
    price: 'R$ 130',
    includes: ['Higienização técnica', 'Carga de ativos personalizada'],
    cta: TRINKS_URL,
  },
  {
    id: 6,
    emoji: '🌿',
    category: 'Tratamento',
    name: 'Detox Capilar',
    tagline: 'Saúde do Couro Cabeludo',
    description: 'Esfoliação suave e limpeza profunda dos folículos. Ideal para oleosidade excessiva ou descamação, estimulando o crescimento saudável.',
    price: 'R$ 150',
    includes: ['Esfoliação de semente de damasco', 'Ativos refrescantes'],
    cta: TRINKS_URL,
  },
  {
    id: 8,
    emoji: '💎',
    category: 'Combo',
    name: 'Pacote Cachos Perfeitos',
    tagline: '4 sessões com 30% OFF',
    description: 'Mantenha a saúde capilar em dia com um cronograma técnico. Ideal para quem está em transição ou quer recuperar fios danificados.',
    price: 'De 520 por 390',
    highlight: true,
    includes: ['4 Sessões de Tratamento', 'Acompanhamento de evolução'],
    cta: TRINKS_URL,
  },
  {
    id: 5,
    emoji: '🌟',
    category: 'Coloração',
    name: 'Mechas e Luzes',
    tagline: 'Morena Iluminada e Loiros',
    description: 'Realçar a curvatura com luzes exige ciência. Todas as mechas no Studio são feitas apenas após o teste de mecha obrigatório.',
    price: 'Sob Orçamento',
    includes: ['Teste de mecha obrigatório', 'Proteção da estrutura'],
    cta: WA_BASE + encodeURIComponent('Olá! Gostaria de um orçamento para mechas e luzes.'),
    btnLabel: 'Me chama',
  },
  {
    id: 12,
    emoji: '🎨',
    category: 'Coloração',
    name: 'Coloração Completa',
    tagline: 'A cor que você desejar, o Jon faz',
    description: 'Seja para uma mudança radical ou para intensificar seu tom atual, aqui criamos a cor perfeita respeitando a saúde dos seus cachos.',
    price: 'Sob Consulta',
    includes: ['Diagnóstico de cor', 'Tonalização técnica'],
    cta: WA_BASE + encodeURIComponent('Olá! Gostaria de um orçamento para Coloração Completa.'),
    btnLabel: 'Me chama',
  },
  {
    id: 11,
    emoji: '🖌️',
    category: 'Coloração',
    name: 'Retoque de Raiz',
    tagline: 'Uniformidade e Saúde',
    description: 'Manutenção da cor sem alterar o comprimento, garantindo um visual harmônico e natural.',
    price: 'R$ 180',
    includes: ['Aplicação técnica', 'Proteção do comprimento'],
    cta: TRINKS_URL,
  },
  {
    id: 9,
    emoji: '🧴',
    category: 'Finalização',
    name: 'Lavar e Finalizar',
    tagline: 'Definição e Volume',
    description: 'Finalização sob medida para o seu desejo do dia. Cachos soltos, com brilho e no melhor formato. (Não é dedoliss).',
    price: 'R$ 100',
    includes: ['Higienização suave', 'Técnica de definição'],
    cta: TRINKS_URL,
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
    </main>
  );
};

export default ServicesPage;
