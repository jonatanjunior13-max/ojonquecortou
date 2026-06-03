import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import './Reviews.css';

const fallbackReviews = [
  {
    author_name: "Claudia Dantas",
    text: "Fiquei encantada com o Jon. Nos meus quase 60 anos de vida, nunca ninguém cortou tão bem meu cabelo! E finalmente entendi como meus cachos funcionam. Ele é ESPETACULAR!!!!",
    rating: 5,
    relative_time_description: "Avaliação no Google",
    curl_type: "Crespo · BH"
  },
  {
    author_name: "Maria Isabel",
    text: "Olha, eu tinha expectativas mas elas foram superadas. Indico muito corte com tratamento porque faz muita diferença. Meu cabelo chegou xoxo e anêmico e saiu lindíssimo.",
    rating: 5,
    relative_time_description: "Avaliação no Google",
    curl_type: "Cacheado · BH"
  },
  {
    author_name: "Fernanda Baiao",
    text: "O Jon é fantástico! Super educado, atencioso, tem uma escuta super ativa, me entendeu, entendeu meu cabelo e me ensinou a finalizar de uma forma muito mais simples do que eu jamais imaginei! Amei o corte, valorizou demais meus cachos!",
    rating: 5,
    relative_time_description: "Avaliação no Google",
    curl_type: "Ondulado · BH"
  },
  {
    author_name: "Ana Beatriz",
    text: "Eu amei o resultado, o Jon foi super gentil do início ao fim, ele é uma pessoa muito legal de conversar. Além disso, foi explicando o que estava fazendo e a técnica que usava. Me senti muito segura e super recomendo!!!",
    rating: 5,
    relative_time_description: "Avaliação no Google",
    curl_type: "Cacheado · Caiçara"
  },
  {
    author_name: "Bernardo Pereira",
    text: "Atendimento ótimo! Entendeu minhas necessidades e me ajudou no cuidado do meu cabelo, super leve e descontraído.",
    rating: 5,
    relative_time_description: "Avaliação no Google",
    curl_type: "Cabelo masculino · BH"
  },
  {
    author_name: "Cristinna da Silva",
    text: "Incrível! Excelente profissional, atencioso! Fiz corte e coloração, e o resultado foi melhor que o esperado! Jon é muuuito talentoso! Recomendo, com toda certeza!",
    rating: 5,
    relative_time_description: "Avaliação no Google",
    curl_type: "Coloração · BH"
  },
  {
    author_name: "Thaisa Macedo",
    text: "Profissional maravilhoso, muito agradável e cuidadoso. Gostei muito!",
    rating: 5,
    relative_time_description: "Avaliação no Google",
    curl_type: "Cacheado · BH"
  }
];

const Reviews = ({ isPage = false }) => {
  const [reviews, setReviews] = useState(fallbackReviews);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch('/api/reviews');
        if (!response.ok) {
          throw new Error('Falha na requisição da API');
        }
        const data = await response.json();
        if (data.reviews && data.reviews.length > 0) {
          setReviews(data.reviews);
        } else {
          setReviews(fallbackReviews);
        }
      } catch (err) {
        console.error('Erro ao buscar avaliações em tempo real:', err);
        setReviews(fallbackReviews);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const TitleTag = isPage ? 'h1' : 'h2';

  return (
    <section id="depoimentos" className="reviews-section section-padding">
      <div className="container">
        <div className="text-center reveal mb-4">
          <TitleTag className="heading-lg">Experiências no Studio</TitleTag>
          <p className="paragraph-lg">O que dizem sobre a leitura de fio e o método Jon.</p>
        </div>
        
        {loading ? (
          <div className="text-center" style={{ padding: '2rem 0', color: 'var(--text-muted)' }}>
            <p>Carregando avaliações...</p>
          </div>
        ) : (
          <div className="reviews-grid">
            {reviews.slice(0, 3).map((review, index) => (
              <div key={index} className={`review-card reveal stagger-${index + 1}`}>
                <div className="review-stars">
                  {[...Array(review.rating || 5)].map((_, i) => (
                    <Star key={i} size={16} fill="var(--color-accent)" color="var(--color-accent)" />
                  ))}
                </div>
                <p className="review-text">"{review.text}"</p>
                <div className="review-author">
                  <div className="author-info">
                    <h4>{review.author_name}</h4>
                    <span>{review.relative_time_description || "Avaliação no Google"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="reviews-cta text-center reveal">
          <p style={{ fontWeight: 800 }}>Já passou pela experiência de um corte com leitura de fio?</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.5rem' }}>
            <a 
              href="https://www.google.com/maps/search/?api=1&query=O+Jon+que+Cortou+Rua+Francisco+Ovídio+184+Belo+Horizonte" 
              target="_blank" 
              rel="noreferrer" 
              className="btn btn-outline"
            >
              Deixe sua avaliação no Google
            </a>
            <a 
              href="/agendar" 
              className="btn btn-primary"
            >
              Agendar meu Horário
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Reviews;
