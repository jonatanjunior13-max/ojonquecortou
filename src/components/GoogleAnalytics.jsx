import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initAttribution, getAttribution } from '../utils/attribution';

const GoogleAnalytics = () => {
  const location = useLocation();

  // 1. Rastreamento de PageView em mudanças de rota (SPA) e captura de atribuição
  useEffect(() => {
    // Exclude /admin/* and /mobile from tracking
    if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/mobile')) {
      return;
    }

    // Capture & persist gclid, fbclid, wbraid, gbraid, UTMs immediately on route change
    initAttribution();

    // Delay pageview tracking slightly to let SEO/Helmet update the document title
    const handleTracking = () => {
      const currentPath = location.pathname + location.search;
      const currentTitle = document.title;

      // Google Analytics 4 (GA4) - Explicit page_view event
      if (window.gtag) {
        window.gtag('event', 'page_view', {
          page_path: currentPath,
          page_location: window.location.href,
          page_title: currentTitle,
        });
      }

      // Google Tag Manager - virtual pageview push
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'virtual_pageview',
        page_path: currentPath,
        page_title: currentTitle,
      });

      // Meta Pixel
      if (window.fbq) {
        window.fbq('track', 'PageView');
      }
    };

    const timer = setTimeout(handleTracking, 150);
    return () => clearTimeout(timer);
  }, [location]);

  // 2. Rastreamento Global de Cliques no botão "Agende seu Horário" / "/agendar"
  useEffect(() => {
    let lastTrackTime = 0;

    const handleGlobalClick = (e) => {
      const target = e.target;
      if (!target || !(target instanceof Element)) return;

      // Procurar elemento clicado ou ancestral mais próximo que seja link ou botão
      const clickable = target.closest('a, button, [role="button"], .btn');
      if (!clickable) return;

      const href = clickable.getAttribute('href') || '';
      const text = (clickable.textContent || '').trim().toLowerCase();
      const isBookingButton = 
        href.includes('/agendar') ||
        text.includes('agende seu horário') ||
        text.includes('agende seu horario') ||
        text.includes('agendar') ||
        text.includes('agende agora') ||
        text.includes('marcar horário') ||
        text.includes('escolher data e hora') ||
        clickable.getAttribute('data-track') === 'agende_seu_horario';

      if (isBookingButton) {
        const now = Date.now();
        // Cooldown de 800ms para evitar disparos duplicados em clique duplo
        if (now - lastTrackTime < 800) return;
        lastTrackTime = now;

        const buttonLabel = clickable.textContent?.trim().slice(0, 50) || 'Agende seu Horário';
        const attribution = getAttribution();

        // Disparo Direto para Google Ads (Micro-conversão de clique)
        if (window.gtag) {
          try {
            // Conversão Histórica/GTM: "Escolher Data e Hora" / Agendamento GTM
            window.gtag('event', 'conversion', {
              send_to: 'AW-666534146/mENYCMyFzNsDEIKC6r0C',
              event_category: 'engagement',
              event_label: 'Clicou no botao agende seu horário'
            });

            window.gtag('event', 'schedule_click', {
              event_category: 'engagement',
              event_label: 'Clicou no botao agende seu horário',
              button_text: buttonLabel,
              destination_url: href || '/agendar'
            });

            window.gtag('event', 'click_agende_seu_horario', {
              event_category: 'engagement',
              event_label: 'Clicou no botao agende seu horário',
              button_text: buttonLabel
            });
          } catch (err) {
            console.warn('Erro ao disparar conversão de clique Google Ads:', err);
          }
        }

        // Meta Pixel Browser Events
        if (window.fbq) {
          try {
            window.fbq('trackCustom', 'schedule_click', {
              button_text: buttonLabel,
              destination_url: href || '/agendar'
            });
            window.fbq('track', 'Contact', {
              content_name: buttonLabel
            });
            window.fbq('track', 'Schedule', {
              content_name: buttonLabel
            });
          } catch (fbErr) {
            console.warn('Erro ao disparar Meta Pixel no clique:', fbErr);
          }
        }

        // Disparo para o Google Tag Manager (GTM) dataLayer
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: 'schedule_click',
          event_category: 'conversion',
          event_label: 'Clicou no botao agende seu horário',
          click_text: buttonLabel,
          destination_url: href || '/agendar'
        });
        window.dataLayer.push({
          event: 'click_agende_seu_horario',
          event_category: 'conversion',
          event_label: 'Clicou no botao agende seu horário',
          click_text: buttonLabel,
          destination_url: href || '/agendar'
        });

        // Background Meta CAPI dispatch for schedule_click
        if (attribution.fbc || attribution.fbp || attribution.fbclid) {
          fetch('/api/meta-capi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventName: 'Schedule',
              eventData: {
                content_name: buttonLabel,
                status: 'click_agendar'
              },
              fbc: attribution.fbc,
              fbp: attribution.fbp
            })
          }).catch(() => {});
        }
      }
    };

    document.addEventListener('click', handleGlobalClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleGlobalClick, { capture: true });
    };
  }, []);

  return null;
};

export default GoogleAnalytics;

