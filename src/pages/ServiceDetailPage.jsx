import React from 'react';
import { useParams, Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { SEED_SERVICES } from '../data/seedServices';
import { Reveal, Arrow } from '../components/NewDesignComponents';
import './ServiceDetailPage.css';

const WA_NUMBER = '5531983044059';
const WA_BASE = `https://wa.me/${WA_NUMBER}?text=`;
const TRINKS_URL = '/agendar';

const ServiceDetailPage = () => {
  const { serviceId } = useParams();

  // Find service in SEED_SERVICES
  const service = SEED_SERVICES.find(s => s.id === serviceId);

  if (!service) {
    return (
      <main className="service-detail-page error-page" style={{ background: 'var(--bg)', color: 'var(--ink)' }}>
        <SEO
          title="Serviço Não Encontrado | Studio do Jon"
          description="O serviço procurado não foi localizado. Veja todos os nossos tratamentos e cortes para cachos no Studio do Jon BH."
        />
        <section className="service-hero section-padding text-center" style={{ background: 'transparent' }}>
          <div className="container">
            <span className="error-emoji">🧐</span>
            <h1 className="heading-xl mt-2" style={{ color: 'var(--ink)' }}>Serviço não encontrado</h1>
            <p className="paragraph-lg max-w-sm mx-auto mt-2" style={{ color: 'var(--muted)' }}>
              Não conseguimos localizar o serviço selecionado no momento.
            </p>
            <div className="cta-group mt-3">
              <Link to="/servicos" className="btn btn-primary">Ver Todos os Serviços</Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const isChemistry = /(quimica|química|mechas|luzes|coloração|coloracao|descoloração|descoloracao)/i.test(service.name);
  const isCut = /(corte|shaggy|wolf|shag)/i.test(service.name);

  // Custom CTA mapping
  const ctaUrl = service.priceType === 'A partir de' 
    ? WA_BASE + encodeURIComponent(`Olá Jon! Gostaria de tirar dúvidas ou fazer um orçamento para: ${service.name}.`) 
    : TRINKS_URL;
  
  const btnLabel = 'Agendar atendimento';

  // Dynamic FAQs based on category
  const faqs = [
    {
      q: "O Método Leitura de Fio está incluso?",
      a: isCut 
        ? "Sim. Todo corte com o Jon começa com o diagnóstico técnico de 7 etapas da Leitura de Fio para avaliar porosidade, curvatura e elasticidade, sem qualquer taxa extra."
        : "Para tratamentos e colorações, fazemos uma avaliação simplificada do fio para garantir compatibilidade e escolher os ativos corretos para o seu cabelo."
    },
    {
      q: "Qual é a duração média do atendimento?",
      a: `Esse serviço tem duração estimada de ${service.duration} minutos, garantindo atenção exclusiva do Jon do início ao fim.`
    },
    {
      q: "Como funciona a política de reagendamento?",
      a: "Você pode cancelar ou reagendar seu horário com até 24 horas de antecedência de forma simples pelo link de confirmação do e-mail ou WhatsApp."
    }
  ];

  // Truncate service name for title if too long (target ≤45 chars for SEO)
  const truncatedName = service.name.length > 45
    ? service.name.substring(0, 42).trim() + '...'
    : service.name;

  return (
    <main className="service-detail-page">
      <SEO
        title={`${truncatedName} para Cabelos Cacheados em BH | Studio do Jon`} 
        description={`${service.tagline || service.description.substring(0, 100)}. Corte e tratamento especializado para cabelos cacheados e crespos em Belo Horizonte.`} 
      />
      
      {/* Schema Markup */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": `${service.name} para cacheados BH`,
          "description": service.description,
          "provider": {
            "@type": "HairSalon",
            "name": "Studio do Jon",
            "url": "https://www.ojonquecortou.com.br"
          },
          "offers": {
            "@type": "Offer",
            "price": service.promoPrice || service.price,
            "priceCurrency": "BRL",
            "priceRange": `A partir de R$ ${service.price}`,
            "valueAddedTaxIncluded": "true"
          }
        })}
      </script>

      <header className="hero">
        <div className="hero-blob" aria-hidden="true" />
        <div className="container">
          <div className="eyebrow reveal in" style={{ marginBottom: 36 }}>
            {service.category}
          </div>

          <div className="hero-grid">
            <div>
              <h1 className="display reveal in">
                {service.name}
              </h1>

              {service.tagline && (
                <Reveal delay={120}>
                  <p className="lead" style={{ marginTop: 28 }}>
                    {service.tagline}
                  </p>
                </Reveal>
              )}

              <Reveal delay={220} className="hero-actions">
                {ctaUrl.startsWith('http') ? (
                  <a href={ctaUrl} target="_blank" rel="noreferrer" className="btn btn-accent">
                    {btnLabel} <Arrow />
                  </a>
                ) : (
                  <Link to={ctaUrl} className="btn btn-accent">
                    {btnLabel} <Arrow />
                  </Link>
                )}
                <Link to="/servicos" className="btn btn-ghost">
                  Ver Outros Serviços
                </Link>
              </Reveal>

              <Reveal delay={320} className="hero-meta">
                <div className="hero-stat">
                  <div className="n">{service.priceType === 'A partir de' ? 'A partir de' : ''}</div>
                  <div className="l">R$ {service.promoPrice || service.price}</div>
                </div>
                <div className="hero-stat">
                  <div className="n">{service.duration}</div>
                  <div className="l">minutos</div>
                </div>
                <div className="hero-stat">
                  <div className="n">Sem taxas</div>
                  <div className="l">ocultas</div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </header>

      <section className="section-padding">
        <div className="container max-w-2xl">
          <Reveal as="h2" className="heading-lg mb-3">
            Entenda o Processo Técnico
          </Reveal>
          <Reveal as="p" className="paragraph-md mb-4 whitespace-pre-line">
            {service.description}
          </Reveal>

          {service.includes && service.includes.length > 0 && (
            <Reveal className="grid-2 mb-4">
              {service.includes.map((item, idx) => (
                <div key={idx} className="card">
                  <p className="paragraph-sm"><span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>✓</span> {item}</p>
                </div>
              ))}
            </Reveal>
          )}

          {(isCut || isChemistry) && (
            <Reveal className="card" style={{ background: 'var(--bg-warm)', padding: '24px', borderRadius: '8px', borderLeft: '4px solid var(--accent)', marginTop: '24px' }}>
              <h3 className="heading-md mb-2" style={{ color: 'var(--accent)' }}>Diferencial: Diagnóstico Integrado</h3>
              <p className="paragraph-sm mb-3">
                Não acreditamos em cortes universais. Analisamos elasticidade capilar, encolhimento e porosidade para desenhar resultado duradouro com caimento orgânico.
              </p>
              <Link to="/metodo" className="paragraph-sm" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
                Conheça o Método Completo →
              </Link>
            </Reveal>
          )}
        </div>
      </section>

      <section className="section-padding">
        <div className="container max-w-2xl">
          <Reveal as="h2" className="heading-lg mb-4">
            FAQ
          </Reveal>
          {faqs.map((faq, idx) => (
            <Reveal key={idx} as="details" className="faq-item">
              <summary>{faq.q}</summary>
              <p className="paragraph-sm">{faq.a}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="about-cta-bottom section-padding">
        <div className="container text-center reveal">
          <h2 className="heading-lg mb-2">Pronta para agendar?</h2>
          <p className="paragraph-lg mb-4 max-w-md mx-auto">
            Garanta seu atendimento personalizado com o Jon e conquiste a melhor versão dos seus cachos.
          </p>
          {ctaUrl.startsWith('http') ? (
            <a href={ctaUrl} target="_blank" rel="noreferrer" className="btn btn-primary">
              {btnLabel} agora
            </a>
          ) : (
            <Link to={ctaUrl} className="btn btn-primary">
              {btnLabel} agora
            </Link>
          )}
        </div>
      </section>
    </main>
  );
};

export default ServiceDetailPage;
