import React, { useState } from 'react';
import './FAQ.css';

const faqs = [
  {
    question: "O que é corte a seco?",
    answer: "É a técnica de cortar o cabelo em seu estado natural. Isso permite ao Jon visualizar exatamente como o cacho se comporta, respeitando o fator de encolhimento e o caimento real."
  },
  {
    question: "O Jon atende homens também?",
    answer: "Sim! O foco é na textura do cabelo (ondulados, cacheados e crespos), independente do gênero. O método de leitura de fio se aplica a todos."
  },
  {
    question: "Como funciona a leitura de fio?",
    answer: "Antes de qualquer corte, Jon analisa a porosidade, densidade e o padrão de curvatura. Isso garante um diagnóstico real e um corte que funciona para a sua rotina."
  },
  {
    question: "Quanto tempo dura o atendimento?",
    answer: "O atendimento completo (corte + nutrição) dura em média 2h a 2h30. O Jon não trabalha com pressa — sua sessão é exclusiva e sem interrupções."
  },
  {
    question: "Precisa lavar o cabelo antes?",
    answer: "Venha com o cabelo seco e sem excesso de creme. Jon faz a leitura de fio com o cabelo seco — é assim que a curvatura real aparece antes do corte."
  },
  {
    question: "Como agendar meu horário?",
    answer: "O agendamento é 100% online pelo Trinks ou pelo botão do WhatsApp. Recomendamos agendar com antecedência, pois a agenda é limitada."
  }
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(3); // Start with one open as in the inspiration

  return (
    <section className="faq-section section-padding" id="faq">
      <div className="container">
        <span className="section-badge-blue">FAQ</span>
        <h2 className="heading-lg mb-4">Perguntas frequentes</h2>
        
        <div className="faq-grid">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`faq-grid-item ${openIndex === index ? 'is-open' : ''}`}
              onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
            >
              <div className="faq-grid-header">
                <h3>{faq.question}</h3>
                <div className="faq-toggle-btn">
                  {openIndex === index ? '✕' : '+'}
                </div>
              </div>
              {openIndex === index && (
                <div className="faq-grid-body">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
