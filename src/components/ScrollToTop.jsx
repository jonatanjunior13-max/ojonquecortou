import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Se não houver hash (âncora), rola para o topo
    if (!hash) {
      window.scrollTo(0, 0);
    } else {
      // Se houver hash, tenta rolar para o elemento específico após um pequeno delay
      setTimeout(() => {
        const id = hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 0);
    }
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
