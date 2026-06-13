import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import './FAQ.css';
import '../pages/ServicesPage.css';

const faqs = [
  {
    question: "O que é o Método Leitura de Fio?",
    answer: "O Método Leitura de Fio é uma metodologia de diagnóstico exclusiva criada pelo especialista Jon em Belo Horizonte. Ela consiste em analisar a saúde do couro cabeludo, o padrão real de curvatura, a porosidade e a elasticidade do fio através de 7 etapas técnicas antes de realizar qualquer corte. Isso garante que o corte respeite o fator de encolhimento e o caimento natural dos fios ondulados, cacheados e crespos, evitando surpresas indesejadas e permitindo que você mantenha a finalização perfeita no seu dia a dia."
  },
  {
    key: "especialidade",
    question: "Qual é a especialidade do Studio do Jon?",
    answer: "O Studio do Jon é um salão especializado no atendimento técnico e personalizado de cabelos ondulados, cacheados e crespos em Belo Horizonte (bairro Caiçara). Nossa especialidade é a lapidação estética de curvaturas do tipo 2A ao 4C utilizando o visagismo para desenhar volumes e formas sob medida. Não realizamos procedimentos de alisamento, escovas alisadoras ou químicas de modificação térmica da fibra. Focamos 100% no tratamento, transição e valorização da curvatura natural do seu fio."
  },
  {
    question: "Quanto custa um corte no Studio do Jon?",
    answer: "O investimento para o corte de cabelo especializado no Studio do Jon varia de R$ 190 a R$ 230. Esse valor engloba o protocolo de atendimento completo: o diagnóstico técnico da Leitura de Fio (7 etapas de análise), a higienização com produtos livres de sulfatos e petrolatos, o corte personalizado e a finalização com secagem em difusor para validação do caimento. Você não paga taxas adicionais pela consultoria capilar ou pela Leitura de Fio, pois ela é um pré-requisito obrigatório para garantir a excelência."
  },
  {
    question: "O Studio do Jon faz descoloração em cabelo cacheado?",
    answer: "Sim, realizamos mechas e descoloração em cabelos cacheados, crespos e ondulados. No entanto, o procedimento só é executado após a validação da saúde do fio no diagnóstico da Leitura de Fio. Avaliamos a porosidade, a elasticidade e o histórico químico para garantir que a fibra capilar suportará a descoloração sem perder a definição do cacho ou sofrer quebra. O serviço é focado em clarear mantendo a integridade e a saúde estrutural dos seus fios."
  },
  {
    question: "Como agendar no Studio do Jon?",
    answer: "O agendamento no Studio do Jon é feito diretamente pelo nosso site de forma totalmente online e instantânea. Basta acessar o link do calendário (/agendar), escolher o serviço desejado (como corte especializado, visagismo ou transição), selecionar a data e o melhor horário disponível e preencher seus dados de contato. A confirmação do seu horário é feita de forma automática por e-mail, sem a necessidade de ligações ou esperas no WhatsApp."
  },
  {
    question: "Como o corte se adapta a quem tem mais de uma textura na cabeça?",
    answer: "É extremamente comum ter de duas a três curvaturas diferentes na mesma cabeça (como ondas suaves nas laterais e cachos fechados no topo). Através da Leitura de Fio a seco, identificamos onde cada textura se posiciona e calculamos a força de encolhimento de cada quadrante. A partir disso, o corte é desenhado de forma híbrida e desconectada para equilibrar a distribuição do volume, garantindo que o design final seja simétrico e tenha um caimento harmonioso."
  },
  {
    question: "Como funciona o corte para quem está em transição capilar?",
    answer: "Se você está passando pela transição capilar, oferecemos cortes progressivos que ajudam a remover as pontas com química de forma gradual. Isso permite que você mantenha um comprimento confortável sem a necessidade de fazer o Big Chop radical logo no primeiro dia, caso não queira. O corte é adaptado para disfarçar a diferença de texturas entre a raiz natural e a ponta lisa, proporcionando volume e movimento enquanto o cacho natural cresce."
  }
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="faq-section section-padding" id="faq">
      <div className="container">
        
        <div className="faq-full-content text-center">
          <h2 className="heading-lg mb-2">Perguntas Técnicas</h2>
          <p className="paragraph-lg max-w-lg mb-4 mx-auto">
            Ainda tem dúvidas sobre o meu processo ou o atendimento? Aqui estão os detalhes.
          </p>
          
          <div className="accordion mx-auto" style={{ maxWidth: '800px', textAlign: 'left' }}>
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className={`accordion-item ${openIndex === index ? 'is-open' : ''}`}
                onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
              >
                <div className="accordion-header">
                  <h3>{faq.question}</h3>
                  <ChevronDown className="accordion-icon" size={20} />
                </div>
                <div className="accordion-body">
                  <div>
                    <p dangerouslySetInnerHTML={{ __html: faq.answer }}></p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="faq-booking-card reveal">
            <div className="booking-inline-card">
              <div className="bic-left">
                <span className="bic-badge">✦ Agendamento Online</span>
                <h2 className="bic-title">Pronta para transformar seus cachos?</h2>
                <p className="bic-subtitle">
                  Escolha data, horário e serviço direto aqui. Confirmação imediata, sem ligação.
                </p>
                <div className="bic-trust">
                  <span>✓ Sem taxa de reserva</span>
                  <span>✓ Cancelamento fácil</span>
                  <span>✓ Confirmação por e-mail</span>
                </div>
              </div>
              <div className="bic-right">
                <div className="bic-availability">
                  <div className="bic-dot green"></div>
                  <span>Horários disponíveis esta semana</span>
                </div>
                <Link to="/agendar" className="btn btn-primary bic-btn">
                  Escolher meu horário →
                </Link>
                <a
                  href={`https://wa.me/553135866673?text=${encodeURIComponent('Olá Jon! Quero agendar um horário no Studio.')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bic-whatsapp-link"
                >
                  Prefere pelo WhatsApp? Fale agora
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
