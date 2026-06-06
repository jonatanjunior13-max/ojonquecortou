import React from 'react';
import { useParams, Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { SEED_SERVICES } from '../data/seedServices';
import './ServiceDetailPage.css';

const WA_NUMBER = '553135866673';
const WA_BASE = `https://wa.me/${WA_NUMBER}?text=`;
const TRINKS_URL = '/agendar';

const ServiceDetailPage = () => {
  const { serviceId } = useParams();

  // Find service in SEED_SERVICES
  const service = SEED_SERVICES.find(s => s.id === serviceId);

  if (!service) {
    return (
      <main className="service-detail-page error-page">
        <SEO 
          title="Serviço Não Encontrado | Studio do Jon" 
          description="O serviço procurado não foi localizado. Veja todos os nossos tratamentos e cortes para cachos no Studio do Jon BH."
        />
        <section className="service-hero section-padding text-center">
          <div className="container">
            <span className="error-emoji">🧐</span>
            <h1 className="heading-xl mt-2">Serviço não encontrado</h1>
            <p className="paragraph-lg max-w-sm mx-auto mt-2">
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
  
  const btnLabel = service.priceType === 'A partir de' ? 'WhatsApp' : 'Agendar Online';

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

  return (
    <main className="service-detail-page">
      <SEO 
        title={`${service.name} em BH | Studio do Jon`} 
        description={`${service.tagline || service.description.substring(0, 100)}. Corte e tratamento especializado para cabelos cacheados e crespos em Belo Horizonte.`} 
      />
      
      {/* Schema Markup */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": service.name,
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
            "valueAddedTaxIncluded": "true"
          }
        })}
      </script>

      <section className="service-hero section-padding">
        <div className="container text-center reveal active">
          <span className="service-emoji-badge">{service.emoji || '✨'}</span>
          <span className="service-category-badge">{service.category}</span>
          <h1 className="heading-xl mt-1">{service.name}</h1>
          {service.tagline && (
            <p className="paragraph-lg text-gradient max-w-lg mx-auto mt-2 font-semibold">
              {service.tagline}
            </p>
          )}
        </div>
      </section>

      <section className="service-content-section section-padding">
        <div className="container service-detail-grid">
          
          {/* Main Info Columns */}
          <div className="service-main-info reveal">
            <h2 className="heading-lg mb-2">Entenda o Processo Técnico</h2>
            <p className="paragraph-md mb-3 whitespace-pre-line">
              {service.description}
            </p>

            {service.includes && service.includes.length > 0 && (
              <div className="service-inclusions-block">
                <h3>O que está incluso:</h3>
                <ul className="inclusions-list">
                  {service.includes.map((item, idx) => (
                    <li key={idx}>
                      <span className="check-icon">✓</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Leitura de Fio connection */}
            {(isCut || isChemistry) && (
              <div className="leitura-fio-highlight-box mt-4">
                <span className="highlight-badge">Diferencial</span>
                <h4>Diagnóstico Integrado de Textura</h4>
                <p>
                  Não acreditamos em cortes universais. Analisamos elasticidade capilar, encolhimento e a porosidade para desenhar um resultado duradouro e com caimento orgânico.
                </p>
                <Link to="/metodo" className="highlight-link">Conheça o Método Completo →</Link>
              </div>
            )}
          </div>

          {/* Pricing & CTA Card */}
          <div className="service-sidebar reveal">
            <div className="booking-cta-card">
              <div className="card-availability">
                <div className="avail-dot"></div>
                <span>Horários Disponíveis</span>
              </div>

              <div className="card-price-block">
                <span className="price-label">Valor do Investimento</span>
                {service.promoPrice ? (
                  <div className="price-values">
                    <span className="original-price strike">R$ {service.price}</span>
                    <span className="current-price text-gradient">R$ {service.promoPrice}</span>
                  </div>
                ) : (
                  <span className="current-price">
                    {service.priceType === 'A partir de' ? 'A partir de ' : ''}R$ {service.price}
                  </span>
                )}
                <span className="duration-label">⏱ Duração estimada: {service.duration} minutos</span>
              </div>

              {ctaUrl.startsWith('http') ? (
                <a href={ctaUrl} target="_blank" rel="noreferrer" className="btn btn-primary btn-block">
                  {btnLabel}
                </a>
              ) : (
                <Link to={ctaUrl} className="btn btn-primary btn-block">
                  {btnLabel}
                </Link>
              )}

              <div className="card-trust-badges">
                <span>✓ Sem taxas ocultas</span>
                <span>✓ Reagendamento fácil</span>
                <span>✓ Atendimento individual</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* FAQ Section */}
      <section className="service-faq-section section-padding">
        <div className="container">
          <div className="text-center reveal mb-4">
            <h2 className="heading-md">Dúvidas Frequentes</h2>
            <p className="paragraph-md max-w-sm mx-auto mt-1">
              Esclareça suas principais dúvidas sobre o procedimento antes de garantir a sua vaga.
            </p>
          </div>

          <div className="faq-grid max-w-lg mx-auto">
            {faqs.map((faq, idx) => (
              <div className="faq-card reveal" key={idx}>
                <h4>{faq.q}</h4>
                <p>{faq.a}</p>
              </div>
            ))}
          </div>
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
