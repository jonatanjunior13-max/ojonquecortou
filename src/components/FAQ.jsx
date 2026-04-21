import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import './FAQ.css';

const faqs = [
  {
    question: "Onde o Studio do Jon está localizado?",
    answer: "Estamos no bairro Caiçara, em Belo Horizonte (BH), na Rua Francisco Ovidio, 184 — próximo à Avenida Pedro II e à Igreja Santa Teresinha."
  },
  {
    question: "Como faço para agendar um horário?",
    answer: "O agendamento é feito de forma simples pelo aplicativo Trinks (Avançar no Calendário Online) ou clicando no botão do WhatsApp disponível aqui no site."
  },
  {
    question: "Qual o valor do corte para cabelo cacheado em BH?",
    answer: "O investimento para o corte especializado começa em R$ 170. Este valor inclui consultoria, higienização, corte técnico (seco ou molhado) e finalização personalizada."
  },
  {
    question: "Quais curvaturas de cabelo o Jon atende?",
    answer: "Jon atende todas as curvaturas: ondulados (2A, 2B, 2C), cacheados (3A, 3B, 3C) e crespos (4A, 4B, 4C), incluindo transição capilar. Cada curvatura tem características diferentes de porosidade e contração — o corte respeita isso."
  },
  {
    question: "Preciso lavar o cabelo antes de ir?",
    answer: "Venha com o cabelo seco e sem produto de finalização pesado. Jon faz a leitura de fio com o cabelo seco — é assim que a curvatura real aparece. Isso define o corte antes de qualquer tesoura."
  },
  {
    question: "Quais são os horários de funcionamento?",
    answer: "Atendemos de Terça a Sexta, das 09:00 às 19:00, e aos Sábados, das 09:00 às 17:00."
  }
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="faq-section section-padding" id="faq">
      <div className="container">
        
        <div className="faq-full-content text-center">
          <span className="badge">Tire suas dúvidas</span>
          <h2 className="heading-lg mb-1 mt-2">Dúvidas Frequentes</h2>
          <p className="paragraph-lg max-w-lg mb-4 mx-auto">
            Ainda tem dúvidas sobre o Studio ou meu processo? Aqui estão as respostas para as perguntas mais comuns.
          </p>
          
          <div className="accordion mx-auto" style={{ maxWidth: '800px', textAlign: 'left' }}>
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
        
      </div>
    </section>
  );
};

export default FAQ;
