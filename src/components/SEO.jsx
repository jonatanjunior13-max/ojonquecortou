import { useEffect } from 'react';

const SEO = ({ title, description, image, url, schema }) => {
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
      updateMeta('twitter:title', title, false);
    }
    
    if (description) {
      updateMeta('description', description, false);
      updateMeta('og:description', description, true);
      updateMeta('twitter:description', description, false);
    }

    const defaultImage = '/logo-cabeleireiro-de-cachos.png';
    const finalImage = image || defaultImage;
    const fullImageUrl = `https://www.ojonquecortou.com.br${finalImage}`;
    updateMeta('og:image', fullImageUrl, true);
    updateMeta('twitter:image', fullImageUrl, false);
    updateMeta('twitter:card', 'summary_large_image', false);

    if (url || typeof window !== 'undefined') {
      const currentUrl = url ? `https://www.ojonquecortou.com.br${url}` : window.location.href;
      updateMeta('og:url', currentUrl, true);
    }

    // Dynamic schema insertion
    if (schema) {
      const existingScript = document.getElementById('dynamic-page-schema');
      if (existingScript) {
        existingScript.textContent = JSON.stringify(schema);
      } else {
        const script = document.createElement('script');
        script.id = 'dynamic-page-schema';
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(schema);
        document.head.appendChild(script);
      }
    } else {
      // Remove any leftover dynamic schema if not on a schema page
      const existingScript = document.getElementById('dynamic-page-schema');
      if (existingScript) {
        existingScript.remove();
      }
    }

  }, [title, description, image, url, schema]);

  return null;
};

export default SEO;
