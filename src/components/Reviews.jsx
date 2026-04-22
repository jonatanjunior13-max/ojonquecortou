import React from 'react';
import { Star } from 'lucide-react';
import './Reviews.css';

const reviewsData = [
  {
    id: 1,
    name: "Fernanda Baiao",
    text: "O Jon é fantástico! Super educado, atencioso, tem uma escuta super ativa, me entendeu, entendeu meu cabelo e me ensinou a finalizar de uma forma muito mais simples do que eu jamais imaginei! Amei o corte, valorizou demais meus cachos!",
    rating: 5,
    role: "Avaliação no Google"
  },
  {
    id: 2,
    name: "Ana Beatriz",
    text: "Eu amei o resultado, o Jon foi super gentil do início ao fim, ele é uma pessoa muito legal de conversar. Além disso, foi explicando o que estava fazendo e a técnica que usava. Me senti muito segura e super recomendo!!!",
    rating: 5,
    role: "Avaliação no Google"
  },
  {
    id: 3,
    name: "Cristinna da Silva",
    text: "Incrível! Excelente profissional, atencioso! Fiz corte e coloração, e o resultado foi melhor que o esperado! Jon é muuuito talentoso! Recomendo, com toda certeza!",
    rating: 5,
    role: "Avaliação no Google"
  }
];

const Reviews = () => {
  return (
    <section id="depoimentos" className="reviews-section section-padding">
      <div className="container">
        <div className="text-center reveal mb-4">
          <h2 className="heading-lg">Experiências no Studio</h2>
          <p className="paragraph-lg">O que dizem sobre a leitura de fio e o método Jon.</p>
        </div>
        
        <div className="reviews-grid">
          {reviewsData.map((review, index) => (
            <div key={review.id} className={`review-card reveal stagger-${index + 1}`}>
              <div className="review-stars">
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} size={16} fill="var(--color-accent)" color="var(--color-accent)" />
                ))}
              </div>
              <p className="review-text">"{review.text}"</p>
              <div className="review-author">
                <div className="author-info">
                  <h4>{review.name}</h4>
                  <span>{review.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Reviews;
