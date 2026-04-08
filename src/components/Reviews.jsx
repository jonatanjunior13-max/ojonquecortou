import React from 'react';
import { Star } from 'lucide-react';
import './Reviews.css';

const reviewsData = [
  {
    id: 1,
    name: "Fernanda Baiao",
    text: "O Jon é fantástico! Super educado, atencioso, tem uma escuta super ativa, me entendeu, entendeu meu cabelo e me ensinou a finalizar de uma forma muito mais simples do que eu jamais imaginei! Amei o corte, valorizou demais meus cachos! Fiquei muito feliz! É muito bom quando a gente encontra alguém que realmente entende de cabelo cacheado! Nota 1000!",
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
  },
  {
    id: 4,
    name: "Julia Almeida de Bastos",
    text: "Eu sou de outra cidade e estava procurando alguém como jonh para salvar meu cabelo. Ele é super bem humorado, ótimo profissional e alternativo. O que eu amo! Eu atrasei e ele foi super compreensivo. Não vejo a hora de voltar",
    rating: 5,
    role: "Avaliação no Google"
  },
  {
    id: 5,
    name: "Mariana Silva",
    text: "Fui no Jon e me encantei com seu serviço!! Jonathan me deu várias dicas pro meu cabelo ondulado, atendeu exatamente o que pedi, que era um corte sem tirar muito no comprimento e fazer um tratamento. Amei o resultado e com certeza irei voltar para fazer meus próximos cortes com ele, uma amor de pessoa e um ótimo profissional 🩷",
    rating: 5,
    role: "Avaliação no Google"
  },
  {
    id: 6,
    name: "Luciana Lima",
    text: "Excelente profissional, nos recebe com alegria, acata nossas opiniões com muita gentileza. Ele domina bem os cabelos cacheados e portanto, o tratamento capilar foi excelente e o corte ficou incrível. Super indico!",
    rating: 5,
    role: "Avaliação no Google"
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
