import React from 'react';
import { Star } from 'lucide-react';
import './Reviews.css';

const reviewsData = [
  {
    id: 1,
    name: "Cristinna da Silva",
    text: "Incrível! Excelente profissional, atencioso! Fiz corte e coloração, e o resultado foi melhor que o esperado! Jon é muuuito talentoso! Recomendo, com toda certeza!",
    rating: 5,
    role: "Corte e Coloração"
  },
  {
    id: 2,
    name: "Taís Resende Costa",
    text: "Jon é um excelente profissional! Foi super atencioso e preocupado em entregar um resultado do qual eu gostasse. Além disso, é uma pessoa incrível e super bem-humorada.",
    rating: 5,
    role: "Cliente fiel"
  },
  {
    id: 3,
    name: "Ana Beatriz",
    text: "Eu amei o resultado, o Jon foi super gentil do início ao fim, ele é uma pessoa muito legal de conversar. Além disso, foi explicando o que estava fazendo e a técnica que usava. Me senti muito segura e super recomendo!!!",
    rating: 5,
    role: "Corte especializado"
  },
  {
    id: 4,
    name: "Sandra Mara Ferreira santos",
    text: "Excelente atendimento. Profissional perfeito, com muita técnica e conhecimento. Amei o corte 🤩🤩🤩",
    rating: 5,
    role: "Avaliação 5 Estrelas"
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
