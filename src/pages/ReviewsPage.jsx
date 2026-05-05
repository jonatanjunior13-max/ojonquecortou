import React from 'react';
import Reviews from '../components/Reviews';
import SEO from '../components/SEO';

const ReviewsPage = () => {
  return (
    <main className="reviews-page" style={{ paddingTop: '5rem' }}>
      <SEO 
        title="Resultados Reais em Cachos e Crespos | Studio do Jon BH" 
        description="Veja os resultados reais de clientes do Studio do Jon em BH. Cachos, crespos e ondulados transformados com Leitura de Fio. Agende já." 
      />
      <Reviews isPage={true} />
    </main>
  );
};

export default ReviewsPage;
