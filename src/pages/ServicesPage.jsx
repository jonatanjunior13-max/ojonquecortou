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
      'Aqui não existe o "corta só as pontinhas" que vira um desastre. Meu corte é focado na arquitetura do fio natural, respeitando o fator de encolhimento e a sua rotina. O atendimento começa com uma consultoria real para entender seus desejos. Através da Leitura de Fio Personalizada, o foco é volume, definição e movimento real para curvaturas do 2abc ao 4abc.',
    includes: ['Higienização', 'Finalização personalizada'],
    duration: null,
    price: 'R$ 190',
    priceType: 'fixed',
    highlight: false,
    cta: {
      type: 'booking',
      label: 'Agendar',
      url: 'http://trinks.com/ojonquecortou',
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
    price: 'De 320 por 260',
    priceType: 'fixed',
    highlight: true,
    popularTag: '⭐ Mais Pedido',
    cta: {
      type: 'booking',
      label: 'Agendar',
      url: 'http://trinks.com/ojonquecortou',
    },
  },
  {
    id: 7,
    emoji: '📏',
    category: 'Corte',
    name: 'Manutenção de Corte',
    tagline: 'Exclusivo para quem já corta com o Jon',
    description:
      'Sabe aquele momento em que o corte ainda está lindo, mas só precisa de um retoque nas pontas ou no formato? Esse serviço é feito exclusivamente para quem já cortou comigo e quer manter o caimento e a definição do corte original. Válido até 90 dias depois do corte com o Jon.',
    includes: [],
    duration: null,
    price: 'R$ 130',
    priceType: 'fixed',
    highlight: false,
    cta: {
      type: 'booking',
      label: 'Agendar',
      url: 'http://trinks.com/ojonquecortou',
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
    price: 'R$ 130',
    priceType: 'fixed',
    highlight: false,
    cta: {
      type: 'booking',
      label: 'Agendar',
      url: 'http://trinks.com/ojonquecortou',
    },
  },
  {
    id: 8,
    emoji: '💎',
    category: 'Combo',
    name: 'Pacote: Cachos Perfeitos',
    tagline: 'Combo de 4 Tratamentos',
    description:
      'Mantenha seus cachos sempre saudáveis com o Pacote Cachos Perfeitos! São 4 tratamentos essenciais (personalizados para você depois de uma analise do seu cabelo) com 30% de desconto. Seus fios vão ficar macios, fortes e brilhantes, com cuidados personalizados em cada sessão. Aproveite essa oferta e dê aos seus cachos o que eles merecem!',
    includes: ['4 sessões de tratamento personalizado', '30% de desconto'],
    duration: null,
    price: 'De 520 por 390',
    priceType: 'fixed',
    highlight: true,
    bonusTag: '✨ Oferta Especial',
    cta: {
      type: 'booking',
      label: 'Agendar Pacote',
      url: 'http://trinks.com/ojonquecortou',
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
    price: 'R$ 180',
    priceType: 'fixed',
    highlight: false,
    cta: {
      type: 'booking',
      label: 'Agendar',
      url: 'http://trinks.com/ojonquecortou',
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
    id: 12,
    emoji: '🧡',
    category: 'Coloração',
    name: 'Ruivos Personalizados',
    tagline: 'O Ruivo dos Sonhos',
    description:
      'Conquiste o ruivo perfeito! Personalizamos o tom de ruivo que mais combina com o seu estilo e tom de pele, desde ruivos acobreados até tons mais vibrantes. Antes de começar, conversamos sobre o resultado desejado para garantir que você saia com o Ruivo dos Sonhos, preservando a saúde dos fios e garantindo uma cor viva e duradoura.',
    includes: [],
    duration: null,
    price: 'Sob Consulta',
    priceType: 'quote',
    highlight: false,
    cta: {
      type: 'whatsapp',
      label: '💬 Solicitar Orçamento',
      url: WA_BASE + encodeURIComponent('Olá! Gostaria de um orçamento para Ruivo Personalizado.'),
    },
  },
  {
    id: 10,
    emoji: '🎨',
    category: 'Coloração',
    name: 'Coloração Completa',
    tagline: 'Transformação ou Cobertura Total',
    description:
      'Quer uma transformação completa ou renovar a cor dos seus fios? A Coloração Completa é para quem deseja uma coloração total, seja para cobrir os fios brancos ou mudar completamente o tom. Antes de começar, conversamos sobre o tom perfeito para você, e garantimos que a cor escolhida vai realçar o seu estilo, sempre cuidando da saúde dos fios.',
    includes: [],
    duration: null,
    price: 'Sob Consulta',
    priceType: 'quote',
    highlight: false,
    cta: {
      type: 'whatsapp',
      label: '💬 Solicitar Orçamento',
      url: WA_BASE + encodeURIComponent('Olá! Gostaria de um orçamento para Coloração Completa.'),
    },
  },
  {
    id: 11,
    emoji: '🖌️',
    category: 'Coloração',
    name: 'Retoque de Raiz',
    tagline: 'Uniformidade e Saúde dos Fios',
    description:
      'Precisando retocar a raiz sem alterar a cor das pontas? Esse serviço é ideal para quem já tem coloração e quer manter o tom uniforme sem danificar o restante dos fios. Primeiro, conversamos para entender a cor exata que você deseja retocar, e depois aplicamos a coloração na raiz, garantindo que o visual fique harmônico e natural. Ideal para colorações ruivas e mechas iluminadas.',
    includes: [],
    duration: null,
    price: 'R$ 180',
    priceType: 'fixed',
    highlight: false,
    cta: {
      type: 'booking',
      label: 'Agendar',
      url: 'http://trinks.com/ojonquecortou',
    },
  },
  {
    id: 9,
    emoji: '🧴',
    category: 'Finalização',
    name: 'Lavar e Finalizar',
    tagline: 'Definição, Volume ou Leveza',
    description:
      'Aqui seus cachos recebem a finalização perfeita! A gente conversa sobre o que você quer – definição, volume ou leveza – e faço a finalização sob medida. O resultado são cachos definidos, soltos, com brilho e prontos para arrasar. Tudo pensado para que seus fios fiquem no melhor formato. Importante: NÃO É DEDOLISS.',
    includes: [],
    duration: null,
    price: 'R$ 100',
    priceType: 'fixed',
    highlight: false,
    cta: {
      type: 'booking',
      label: 'Agendar',
      url: 'http://trinks.com/ojonquecortou',
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
            Chega de cortes genéricos que não entendem suas curvas. Aqui, cada atendimento
            começa com uma Leitura de Fio personalizada e termina com o visual que você
            sempre quis (e que dura até em casa).
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
                href="http://trinks.com/ojonquecortou"
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
