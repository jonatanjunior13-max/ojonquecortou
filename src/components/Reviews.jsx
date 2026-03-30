import React from 'react';
import { Star } from 'lucide-react';
import './Reviews.css';

const reviewsData = [
  {
    id: 1,
    name: "Carlos Eduardo",
    text: "O melhor corte que já tive em anos. O Jon não é apenas um barbeiro, ele entende o que combina com o seu rosto. Atendimento impecável e ambiente super agradável. Voltarei sempre!",
    rating: 5,
    role: "Cliente Premium"
  },
  {
    id: 2,
    name: "Rafael Silva",
    text: "Experiência sensacional. O cuidado com os detalhes é impressionante, desde a toalha quente até a finalização com produtos de primeira linha. Recomendo de olhos fechados.",
    rating: 5,
    role: "Cliente Premium"
  },
  {
    id: 3,
    name: "Marcelo Costa",
    text: "Procurei o Jon para arrumar um corte que deu errado em outra barbearia, e ele fez mágica. Me passou muita confiança e o resultado ficou muito além das minhas expectativas.",
    rating: 5,
    role: "Cliente Premium"
  }
];

const Reviews = () => {
  return (
    <section id="depoimentos" className="reviews-section glass-panel">
      <div className="container">
        <h2 className="section-title text-center text-gradient">O Que Dizem Meus Clientes</h2>
        <p className="section-subtitle text-center">Experiências reais de quem confiou no meu trabalho.</p>
        
        <div className="reviews-grid">
          {reviewsData.map((review) => (
            <div key={review.id} className="review-card">
              <div className="review-stars text-magenta">
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} size={18} fill="currentColor" />
                ))}
              </div>
              <p className="review-text">"{review.text}"</p>
              <div className="review-author">
                <div className="author-avatar">
                  {review.name.charAt(0)}
                </div>
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
