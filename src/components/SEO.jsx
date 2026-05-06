import { useEffect } from 'react';

const SEO = ({ title, description, image, url }) => {
  useEffect(() => {
    // Helper para atualizar ou criar meta tags
    const updateMeta = (name, content, isProperty = false) => {
      if (!content) return;
      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let tag = document.querySelector(selector);
      if (tag) {
        tag.setAttribute('content', content);
      } else {
        tag = document.createElement('meta');
        if (isProperty) tag.setAttribute('property', name);
        else tag.setAttribute('name', name);
        tag.setAttribute('content', content);
        document.head.appendChild(tag);
      }
    };

    if (title) {
      document.title = title;
      updateMeta('og:title', title, true);
    }
    
    if (description) {
      updateMeta('description', description, false);
      updateMeta('og:description', description, true);
    }

    if (image) {
      updateMeta('og:image', `https://www.ojonquecortou.com.br${image}`, true);
    }

    if (url || typeof window !== 'undefined') {
      const currentUrl = url ? `https://www.ojonquecortou.com.br${url}` : window.location.href;
      updateMeta('og:url', currentUrl, true);
    }

  }, [title, description, image, url]);

  return null;
};

export default SEO;
