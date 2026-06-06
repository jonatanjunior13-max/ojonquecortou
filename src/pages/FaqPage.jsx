import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Leitura de Fio é um serviço pago?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Não. É parte do atendimento padrão do Studio do Jon. Todo corte começa com as 7 etapas, sempre."
      }
    },
    {
      "@type": "Question",
      "name": "Quanto tempo leva a Leitura de Fio?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Em média de 15 a 30 minutos antes do corte começar. Pode ser mais longa se o histórico for complexo."
      }
    },
    {
      "@type": "Question",
      "name": "Posso agendar só a Leitura de Fio sem marcar corte?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sim. É possível agendar uma consulta de diagnóstico separada para entender o seu fio antes de decidir qualquer coisa."
      }
    },
    {
      "@type": "Question",
      "name": "A Leitura de Fio funciona para cabelo liso também?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "O método foi desenvolvido especificamente para cabelos ondulados, cacheados e crespos, onde a variação de textura e histórico químico é mais complexa."
      }
    },
    {
      "@type": "Question",
      "name": "Posso usar condicionador em vez de máscara?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Pode, mas o condicionador apenas sela a cutícula. A máscara entrega tratamento. Se tiver que escolher um pro minimalismo, fique com a máscara e use uma quantidade menor."
      }
    },
    {
      "@type": "Question",
      "name": "E o óleo capilar?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Ele entra como o 'plus'. Se o seu cabelo é muito seco (comum em curvaturas 4), ele é o quarto elemento indispensável. Se não, a máscara já resolve."
      }
    }
  ]
};

const faqs = [
  {
    question: "Leitura de Fio é um serviço pago?",
    answer: "Não. É parte do atendimento padrão do Studio do Jon. Todo corte começa com as 7 etapas, sempre.",
    source: "Método Leitura de Fio"
  },
  {
    question: "Quanto tempo leva a Leitura de Fio?",
    answer: "Em média de 15 a 30 minutos antes do corte começar. Pode ser mais longa se o histórico for complexo.",
    source: "Método Leitura de Fio"
  },
  {
    question: "Posso agendar só a Leitura de Fio sem marcar corte?",
    answer: "Sim. É possível agendar uma consulta de diagnóstico separada para entender o seu fio antes de decidir qualquer coisa.",
    source: "Método Leitura de Fio"
  },
  {
    question: "A Leitura de Fio funciona para cabelo liso também?",
    answer: "O método foi desenvolvido especificamente para cabelos ondulados, cacheados e crespos, onde a variação de textura e histórico químico é mais complexa.",
    source: "Método Leitura de Fio"
  },
  {
    question: "Posso usar condicionador em vez de máscara?",
    answer: "Pode, mas o condicionador apenas sela a cutícula. A máscara entrega tratamento. Se tiver que escolher um pro minimalismo, fique com a máscara e use uma quantidade menor.",
    source: "Antes da Tesoura"
  },
  {
    question: "E o óleo capilar?",
    answer: "Ele entra como o 'plus'. Se o seu cabelo é muito seco (comum em curvaturas 4), ele é o quarto elemento indispensável. Se não, a máscara já resolve.",
    source: "Antes da Tesoura"
  }
];

function FaqItem({ question, answer, index }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="faq-item"
      style={{
        borderBottom: '1px solid var(--rule, rgba(26, 19, 16, 0.14))',
        padding: '0',
      }}
    >
      <button
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          padding: '28px 0',
          textAlign: 'left',
          color: 'inherit',
        }}
      >
        <span style={{
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontSize: 'clamp(1rem, 2vw, 1.15rem)',
          fontWeight: 400,
          lineHeight: 1.35,
          color: open ? 'var(--accent, #B05A2E)' : 'var(--ink, #1A1310)',
          transition: 'color 0.2s ease',
        }}>
          {question}
        </span>
        <span style={{
          flexShrink: 0,
          width: 28,
          height: 28,
          borderRadius: '50%',
          border: '1px solid var(--rule, rgba(26, 19, 16, 0.14))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1rem',
          color: open ? 'var(--accent, #B05A2E)' : 'var(--muted, #6B5A4B)',
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
          transition: 'transform 0.25s ease, color 0.2s ease',
          lineHeight: 1,
        }}>
          +
        </span>
      </button>
      <div
        style={{
          maxHeight: open ? '400px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.35s ease',
        }}
      >
        <p style={{
          fontFamily: "'Manrope', sans-serif",
          fontSize: '0.975rem',
          lineHeight: 1.75,
          color: 'var(--muted, #6B5A4B)',
          margin: '0 0 28px 0',
          maxWidth: '62ch',
        }}>
          {answer}
        </p>
      </div>
    </div>
  );
}

const FaqPage = () => {
  return (
    <main style={{ paddingTop: '5rem' }}>
      <SEO
        title="Perguntas Frequentes — Studio do Jon | Especialista em Cachos BH"
        description="Tire suas dúvidas sobre o Método Leitura de Fio, agendamento, diagnóstico capilar e cuidados com cabelo cacheado no Studio do Jon em Belo Horizonte."
        url="/faq"
        schema={faqSchema}
      />

      {/* Hero da página */}
      <section style={{
        padding: 'clamp(60px, 8vw, 120px) 0 clamp(40px, 5vw, 64px)',
        borderBottom: '1px solid var(--rule, rgba(26, 19, 16, 0.14))',
      }}>
        <div className="container" style={{ maxWidth: 800 }}>
          {/* Label superior */}
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.7rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--muted, #6B5A4B)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <span style={{ display: 'inline-block', width: 18, height: 1, background: 'var(--muted, #6B5A4B)' }} />
            Studio do Jon · Perguntas Frequentes
          </p>

          <h1 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontWeight: 400,
            fontSize: 'clamp(2rem, 5vw, 3.25rem)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            color: 'var(--ink, #1A1310)',
            margin: '0 0 24px',
          }}>
            Perguntas Frequentes{' '}
            <span style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontStyle: 'italic',
              color: 'var(--accent, #B05A2E)',
              display: 'block',
            }}>
              — Studio do Jon
            </span>
          </h1>

          <p style={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: '1rem',
            lineHeight: 1.7,
            color: 'var(--muted, #6B5A4B)',
            maxWidth: '52ch',
            margin: 0,
          }}>
            Respostas diretas sobre o Método Leitura de Fio, diagnóstico capilar e como funciona o atendimento no Studio do Jon.
          </p>
        </div>
      </section>

      {/* Lista de FAQs */}
      <section style={{ padding: 'clamp(48px, 6vw, 80px) 0' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          {faqs.map((item, i) => (
            <FaqItem
              key={i}
              index={i}
              question={item.question}
              answer={item.answer}
            />
          ))}
        </div>
      </section>

      {/* CTA Final */}
      <section style={{
        padding: 'clamp(48px, 6vw, 80px) 0',
        borderTop: '1px solid var(--rule, rgba(26, 19, 16, 0.14))',
      }}>
        <div className="container" style={{
          maxWidth: 800,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '24px',
        }}>
          <div>
            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.7rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--muted, #6B5A4B)',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <span style={{ display: 'inline-block', width: 18, height: 1, background: 'var(--muted, #6B5A4B)' }} />
              Próximo passo
            </p>
            <p style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontWeight: 400,
              fontSize: 'clamp(1.3rem, 3vw, 1.75rem)',
              color: 'var(--ink, #1A1310)',
              margin: 0,
              lineHeight: 1.2,
            }}>
              Ainda tem dúvida? O diagnóstico começa no primeiro atendimento.
            </p>
          </div>
          <Link
            to="/agendar"
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            Agendar no Studio do Jon →
          </Link>
        </div>
      </section>
    </main>
  );
};

export default FaqPage;
