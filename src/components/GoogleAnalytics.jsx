import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const GoogleAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
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
