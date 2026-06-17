import React from 'react';
import Reviews from '../components/Reviews';
import SEO from '../components/SEO';

const ReviewsPage = () => {
  return (
    <main className="reviews-page" style={{ paddingTop: '5rem' }}>
      <SEO 
        title="Depoimentos e Avaliações de Clientes | Especialista em Cachos" 
        description="Confira a opinião de quem já fez a Leitura de Fio e o corte técnico com o Jon em BH. Avaliações de clientes cacheadas, crespas e onduladas." 
      />
      <Reviews isPage={true} />
    </main>
  );
};

export default ReviewsPage;
