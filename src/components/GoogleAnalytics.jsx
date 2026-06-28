import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const GoogleAnalytics = () => {
  const location = useLocation();
  const isFirstRun = useRef(true);

  useEffect(() => {
    // Exclude /admin/* and /mobile from tracking
    if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/mobile')) {
      return;
    }

    // Na primeira carga, o snippet estático no index.html já disparou o PageView.
    // Pulamos a execução inicial para evitar contagem duplicada.
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    // Google Analytics
    if (window.gtag) {
      window.gtag('config', 'G-BC8WXZKTLL', {
        page_path: location.pathname + location.search,
      });
      window.gtag('config', 'AW-666534146', {
        page_path: location.pathname + location.search,
      });
    }

    // Google Tag Manager - virtual pageview push
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'virtual_pageview',
      page_path: location.pathname + location.search,
      page_title: document.title
    });

    // Meta Pixel
    if (window.fbq) {
      window.fbq('track', 'PageView');
    }
  }, [location]);

  return null;
};

export default GoogleAnalytics;
