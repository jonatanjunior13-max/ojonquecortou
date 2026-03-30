import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import './FAQ.css';

const faqs = [
  {
    question: "Quais são as formas de pagamento aceitas?",
    answer: "Oferecemos diversas formas de pagamento para facilitar sua experiência. Aceitamos pagamentos em dinheiro, cartões de crédito e débito das principais bandeiras, além de transferências via PIX."
  },
  {
    question: "Qual o valor do corte para cabelo cacheado em BH?",
    answer: "O investimento para o corte especializado no Studio do Jon começa em R$ 170. Este valor inclui uma consultoria personalizada, higienização, corte técnico seco ou molhado e finalização completa."
  },
  {
    question: "Preciso lavar o cabelo antes de ir?",
    answer: "Recomendamos que você venha com o cabelo seco, do jeito que você usa no dia a dia, com ou sem finalizador. Isso ajuda na avaliação da curvatura real para o corte a seco."
  }
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="faq-section section-padding" id="depoimentos">
      <div className="container faq-container">
        
        <div className="faq-content">
          <span className="badge">Tire suas dúvidas</span>
          <h2 className="heading-lg mb-1 mt-2">Perguntas Frequentes</h2>
          <p className="paragraph-lg max-w-lg mb-2">
            Ainda tem dúvidas sobre o nosso processo? Separamos as perguntas mais comuns para te ajudar.
          </p>
          
          <div className="accordion">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className={`accordion-item ${openIndex === index ? 'active' : ''}`}
                onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
              >
                <div className="accordion-header">
                  <h3>{faq.question}</h3>
                  <ChevronDown className="accordion-icon" size={20} />
                </div>
                <div className="accordion-body">
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="testimonial-side">
          <div className="glass-panel testimonial-card">
            <h3 className="heading-lg text-primary">"Melhor profissional de BH!"</h3>
            <div className="stars mt-1 mb-1 text-magenta">★★★★★</div>
            <p className="paragraph-lg text-dark mb-2">
               Jon é um excelente profissional! Foi super atencioso e preocupado em entregar um resultado do qual eu gostasse. Além disso, o ambiente é maravilhoso.
            </p>
            <div className="reviewer">
              <strong>Taís Resende Costa</strong>
              <span className="text-gray text-sm">Via Google Reviews</span>
            </div>
          </div>
        </div>
        
      </div>
    </section>
  );
};

export default FAQ;
