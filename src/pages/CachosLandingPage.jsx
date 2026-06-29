import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SEO from '../components/SEO';
import { Arrow } from '../components/NewDesignComponents';
import './CachosLandingPage.css';

const CachosLandingPage = () => {
  const location = useLocation();
  const hasFiredEvent = useRef(false);

  // Parse UTM parameters to pass along to the booking page
  const searchParams = new URLSearchParams(location.search);
  const bookingLink = `/agendar?${searchParams.toString()}`;

  useEffect(() => {
    const handleScroll = () => {
      if (hasFiredEvent.current) return;

      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      
      if (docHeight <= 0) return;

      const scrollPercent = (scrollTop / docHeight) * 100;

      if (scrollPercent >= 25) {
        hasFiredEvent.current = true;
        
        // Fire Google Analytics 4 event
        if (window.gtag) {
          window.gtag('event', 'ad_landing_engagement', {
            event_category: 'engagement',
            event_label: 'Scroll 25% on /cachos',
            page_path: '/cachos',
            utm_source: searchParams.get('utm_source') || '',
            utm_medium: searchParams.get('utm_medium') || '',
            utm_campaign: searchParams.get('utm_campaign') || ''
          });
          console.log('GA4 event "ad_landing_engagement" fired.');
        }

        // Fire Google Tag Manager custom event as well if dataLayer exists
        if (window.dataLayer) {
          window.dataLayer.push({
            event: 'ad_landing_engagement',
            scroll_depth: '25%',
            page_path: '/cachos'
          });
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Check initial load scroll in case they loaded scrolled down
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.search]);

  return (
    <div className="cachos-landing">
      <SEO 
        title="Especialista em Cachos BH | Método Leitura de Fio" 
        description="Recupere a definição dos seus cachos no Studio do Jon. Corte a seco e diagnóstico exclusivo Leitura de Fio em Belo Horizonte." 
        url="/cachos"
      />

      <header className="cachos-header">
        <div className="cachos-logo">
          Studio do <span>Jon</span>
        </div>
      </header>

      <main>
        <section className="cachos-hero">
          <div className="cachos-hero-content">
            <span className="eyebrow">Exclusivo para Cachos, Crespos e Ondulados</span>
            <h1 className="display">
              Cansada do frizz e da falta de definição mesmo usando os melhores cremes?
            </h1>
            <p>
              O problema raramente é o produto que você usa. É o ângulo do corte. Cortar cabelo com curvatura exige leitura física e geométrica a seco.
            </p>
            <div className="cta-above-fold">
              <Link to={bookingLink} className="btn btn-accent">
                Agendar Meu Horário <Arrow className="arrow" />
              </Link>
            </div>
          </div>
        </section>

        <section className="cachos-results-section">
          <div className="container">
            <h2 className="cachos-section-title">Resultados Reais no Studio do Jon</h2>
            <div className="cachos-grid-comparison">
              <div className="comparison-card">
                <div className="comparison-image-container">
                  <img src="/especialista-em-cabelo-cacheado-resultado.webp" alt="Resultado de corte de cachos" />
                  <span className="comparison-label before">Antes</span>
                  <span className="comparison-label after">Depois</span>
                </div>
                <div className="comparison-info">
                  <h3>Definição e Leveza</h3>
                  <p>Corte planejado a seco removendo o peso acumulado nas pontas e devolvendo o balanço natural.</p>
                </div>
              </div>

              <div className="comparison-card">
                <div className="comparison-image-container">
                  <img src="/resultado-mechas-cachos-definidos.webp" alt="Resultado mechas e corte cachos" />
                  <span className="comparison-label before">Antes</span>
                  <span className="comparison-label after">Depois</span>
                </div>
                <div className="comparison-info">
                  <h3>Arquitetura de Volume</h3>
                  <p>Harmonização de volumes laterais e franja com técnicas geométricas exclusivas do Método Leitura de Fio.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="cachos-method-section">
          <h2>Conheça o Método Leitura de Fio</h2>
          <p>
            Antes de qualquer tesourada, nós realizamos um diagnóstico completo de 7 etapas a seco. Analisamos a porosidade capilar, a elasticidade do fio, a densidade de cada quadrante e a força do encolhimento. Cortamos o cacho no seu caimento natural para que ele funcione sem depender de finalizações complexas no dia a dia.
          </p>
          <Link to={bookingLink} className="btn btn-primary">
            Garantir Próximo Horário <Arrow className="arrow" />
          </Link>
        </section>
      </main>

      <footer className="cachos-footer">
        <p>© 2026 Studio do Jon. Todos os direitos reservados.</p>
        <p>Rua Francisco Ovídio, 184 · Caiçara · Belo Horizonte, MG</p>
      </footer>
    </div>
  );
};

export default CachosLandingPage;
