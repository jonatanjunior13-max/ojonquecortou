import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const GoogleAnalytics = () => {
  const location = useLocation();
  const isFirstRun = useRef(true);

  useEffect(() => {
    // Na primeira carga, o snippet estático no index.html já disparou o PageView.
    // Pulamos a execução inicial para evitar contagem duplicada.
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    // Google Analytics
    if (window.gtag) {
      window.gtag('config', 'G-2HCS01RSP2', {
        page_path: location.pathname + location.search,
      });
      window.gtag('config', 'AW-666534146', {
        page_path: location.pathname + location.search,
      });
    }

    // Meta Pixel
    if (window.fbq) {
      window.fbq('track', 'PageView');
    }
  }, [location]);

  return null;
};

export default GoogleAnalytics;
