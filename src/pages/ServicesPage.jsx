import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import './ServicesPage.css';

const WA_NUMBER = '5531920066790';
const WA_BASE = `https://wa.me/${WA_NUMBER}?text=`;
const TRINKS_URL = '/agendar';

const servicesSchema = {
  "@context": "https://schema.org",
  "@type": "OfferCatalog",
  "name": "Serviços — Studio do Jon",
  "url": "https://www.ojonquecortou.com.br/servicos",
  "itemListElement": [
    { "@type": "Offer", "priceCurrency": "BRL", "price": "190.00", "itemOffered": { "@type": "Service", "name": "Corte com o Jon", "description": "Inclui Leitura de Fio completa, corte a seco/técnico e finalização educativa." } },
    { "@type": "Offer", "priceCurrency": "BRL", "price": "80.00", "itemOffered": { "@type": "Service", "name": "Leitura de Fio", "description": "Diagnóstico capilar de 7 etapas. Valor revertido em crédito se fechar serviço." } },
    { "@type": "Offer", "priceCurrency": "BRL", "price": "230.00", "itemOffered": { "@type": "Service", "name": "Combo Corte + Tratamento", "description": "Corte especializado com tratamento de alta performance." } },
    { "@type": "Offer", "priceCurrency": "BRL", "price": "699.00", "itemOffered": { "@type": "Service", "name": "Luzes ou Morena Iluminada", "description": "Iluminação sem descolorante, preservando a estrutura do fio." } },
    { "@type": "Offer", "priceCurrency": "BRL", "price": "499.00", "itemOffered": { "@type": "Service", "name": "Coloração Completa", "description": "Cor sob medida respeitando a saúde do cacho." } },
    { "@type": "Offer", "priceCurrency": "BRL", "price": "130.00", "itemOffered": { "@type": "Service", "name": "Tratamento personalizado", "description": "Hidratação, nutrição ou reconstrução conforme diagnóstico." } },
    { "@type": "Offer", "priceCurrency": "BRL", "price": "180.00", "itemOffered": { "@type": "Service", "name": "Inside TRP — Reconstrução Premium", "description": "Tratamento proteico premium para fios danificados." } },
    { "@type": "Offer", "priceCurrency": "BRL", "price": "180.00", "itemOffered": { "@type": "Service", "name": "Detox Estimulante", "description": "Esfoliação detox do couro cabeludo." } },
    { "@type": "Offer", "priceCurrency": "BRL", "price": "100.00", "itemOffered": { "@type": "Service", "name": "Lavar e Finalizar", "description": "Higienização e finalização sob medida (definição, volume ou leveza)." } },
    { "@type": "Offer", "priceCurrency": "BRL", "price": "390.00", "itemOffered": { "@type": "Service", "name": "Pacote Cachos Perfeitos", "description": "4 sessões de tratamento com cronograma técnico (30% OFF)." } },
    { "@type": "Offer", "priceCurrency": "BRL", "price": "130.00", "itemOffered": { "@type": "Service", "name": "Manutenção de Corte", "description": "Retoque para clientes que cortaram nos últimos 90 dias." } },
    { "@type": "Offer", "priceCurrency": "BRL", "price": "180.00", "itemOffered": { "@type": "Service", "name": "Retoque de Raiz", "description": "Manutenção da cor sem alterar o comprimento." } },
    { "@type": "Offer", "priceCurrency": "BRL", "price": "150.00", "itemOffered": { "@type": "Service", "name": "Infusão de Carga Hídrica para Cabelos Porosos", "description": "Tratamento de hidratação profunda sob medida conforme Leitura de Fio." } },
    { "@type": "Offer", "priceCurrency": "BRL", "price": "170.00", "itemOffered": { "@type": "Service", "name": "Ritual de Reposição Lipídica para Nutrição Profunda", "description": "Nutrição lipídica intensiva com blends biocompatíveis para curvaturas ressecadas." } },
    { "@type": "Offer", "priceCurrency": "BRL", "price": "200.00", "itemOffered": { "@type": "Service", "name": "Protocolo de Blindagem de pH e Reconstrução", "description": "Acidificação técnica e reposição de aminoácidos para cabelos pós-química ou fragilizados." } }
  ]
};

import { SEED_SERVICES } from '../data/seedServices';
import { db } from '../config/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

const ServicesPage = () => {
  // Starts from SEED_SERVICES (not []) so the grid has its real, final height on first
  // paint instead of rendering empty until the Firestore onSnapshot listener resolves —
  // that empty-then-pop-in was the cause of a 0.477 CLS ("Poor") on this page.
  const [servicesData, setServicesData] = useState(SEED_SERVICES);

  useEffect(() => {
    // Escuta em tempo real as mudanças no Firestore na coleção unificada
    const unsub = onSnapshot(collection(db, 'services'), (snapshot) => {
      if (!snapshot.empty) {
        const list = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        // Ordena para manter um padrão visual
        list.sort((a, b) => {
          const idxA = SEED_SERVICES.findIndex(s => s.id === a.id || s.name.toLowerCase() === a.name.toLowerCase());
          const idxB = SEED_SERVICES.findIndex(s => s.id === b.id || s.name.toLowerCase() === b.name.toLowerCase());
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return (a.name || '').localeCompare(b.name || '');
        });
        setServicesData(list);
      } else {
        setServicesData(SEED_SERVICES);
      }
    }, (error) => {
      console.error("Erro ao carregar serviços do Firestore:", error);
      setServicesData(SEED_SERVICES);
    });

    return () => unsub();
  }, []);

  const services = servicesData.map(s => ({
    id: s.id,
    emoji: s.emoji || '✨',
    category: s.category || 'Outros',
    name: s.name,
    tagline: s.tagline || '',
    description: s.description || '',
    price: s.priceType === 'A partir de' 
      ? `A partir de R$ ${s.price}` 
      : s.promoPrice ? `De R$ ${s.price} por R$ ${s.promoPrice}` : `R$ ${s.price}`,
    includes: s.includes || [],
    highlight: s.promoPrice ? true : false,
    cta: s.priceType === 'A partir de' 
      ? WA_BASE + encodeURIComponent(`Olá! Gostaria de um orçamento para ${s.name}.`) 
      : TRINKS_URL,
    btnLabel: s.priceType === 'A partir de' ? 'WhatsApp' : 'Agendar'
  }));

  const [activeFilter, setActiveFilter] = useState('Todos');
  const [expandedCards, setExpandedCards] = useState({});
  const toggleCard = (id) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };
  const categories = ['Todos', ...new Set(services.map((s) => s.category))];
  const filtered = activeFilter === 'Todos' ? services : services.filter((s) => s.category === activeFilter);

  return (
    <main className="services-page">
      <SEO 
        title="Serviços para Cabelos Cacheados, Crespos e Ondulados em BH | Studio do Jon" 
        description="Corte, descoloração e química especializada em fios cacheados e crespos. Jon usa Leitura de Fio antes de qualquer atendimento. Studio do Jon, Belo Horizonte — agende pelo direct." 
        schema={servicesSchema}
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
                <h2 className="sdc-name">
                  <Link to={`/servicos/${service.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {service.name}
                  </Link>
                </h2>
                <p className="sdc-tagline">{service.tagline}</p>
                <div className="sdc-desc-container">
                  <p className={`sdc-description ${expandedCards[service.id] ? 'expanded' : 'collapsed'}`}>
                    {service.description}
                  </p>
                  {service.description && service.description.length > 100 && (
                    <button 
                      type="button" 
                      className="btn-toggle-desc"
                      onClick={() => toggleCard(service.id)}
                      style={{ background: 'none', border: 'none', color: service.highlight ? 'var(--color-yellow)' : 'var(--color-accent)', cursor: 'pointer', fontSize: '0.85rem', padding: '12px 0', minHeight: '44px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, marginBottom: '0.3rem' }}
                    >
                      {expandedCards[service.id] ? 'Ver menos ▲' : 'Ver mais ▼'}
                    </button>
                  )}
                </div>
                
                {service.includes && service.includes.length > 0 && (expandedCards[service.id] || !service.description || service.description.length <= 100) && (
                  <div className="sdc-includes">
                    <p className="sdc-includes-title">O que está incluso:</p>
                    <ul>
                      {service.includes.map((item, idx) => (
                        <li key={idx}>✓ {item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div style={{ marginTop: 'auto', marginBottom: '1rem' }}>
                  <Link 
                    to={`/servicos/${service.id}`} 
                    style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 700, 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.05em', 
                      color: service.highlight ? 'var(--color-yellow)' : 'var(--color-accent)', 
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    Saber mais detalhes →
                  </Link>
                </div>

                <div className="sdc-footer">
                  <span className="sdc-price">{service.price}</span>
                  {service.cta.startsWith('http') ? (
                    <a href={service.cta} target="_blank" rel="noreferrer" className="btn btn-primary sdc-btn">
                      {service.btnLabel || 'Reservar'}
                    </a>
                  ) : (
                    <Link to={service.cta} className="btn btn-primary sdc-btn">
                      {service.btnLabel || 'Agendar'}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="services-cta-bottom section-padding">
        <div className="container reveal">
          <div className="booking-inline-card">
            <div className="bic-left">
              <span className="bic-badge">✦ Agendamento Online</span>
              <h2 className="bic-title">Pronta para transformar seus cachos?</h2>
              <p className="bic-subtitle">
                Escolha data, horário e serviço direto aqui. Confirmação imediata, sem ligação.
              </p>
              <div className="bic-trust">
                <span>✓ Sem taxa de reserva</span>
                <span>✓ Cancelamento fácil</span>
                <span>✓ Confirmação por e-mail</span>
              </div>
            </div>
            <div className="bic-right">
              <div className="bic-availability">
                <div className="bic-dot green"></div>
                <span>Horários disponíveis esta semana</span>
              </div>
              <Link to="/agendar" className="btn btn-primary bic-btn">
                Escolher meu horário →
              </Link>
              <a
                href={`https://wa.me/5531920066790?text=${encodeURIComponent('Olá Jon! Quero agendar um horário no Studio.')}`}
                target="_blank"
                rel="noreferrer"
                className="bic-whatsapp-link"
              >
                Prefere pelo WhatsApp? Fale agora
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ServicesPage;
