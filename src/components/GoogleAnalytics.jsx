import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const GoogleAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    // Exclude /admin/* and /mobile from tracking
    if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/mobile')) {
      return;
    }

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

  return null;
};

export default GoogleAnalytics;
