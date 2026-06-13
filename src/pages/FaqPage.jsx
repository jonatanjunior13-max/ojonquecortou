import { useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Com que frequência devo cortar cabelo cacheado?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Para cabelos saudáveis, de 3 em 3 ou de 4 em 4 meses para manter o design. Se está em transição capilar ou tratando pontas muito danificadas, a cada 2 meses é o ideal para eliminar a quebra."
      }
    },
    {
      "@type": "Question",
      "name": "Corte a seco é melhor para cachos? Por quê?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "O corte depende de como o seu cabelo se comporta. Eu trabalho com o Corte Híbrido (feito molhado de precisão e lapidado a seco após a finalização). Cortar apenas seco ou molhado ignora a individualidade física de cada cacho. A decisão técnica do que fazer é tomada durante a Leitura de Fio."
      }
    },
    {
      "@type": "Question",
      "name": "O que é o Método Leitura de Fio?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Minha metodologia exclusiva de 7 etapas de análise antes de a tesoura tocar no cabelo. Mapeamos porosidade, curvaturas, histórico químico e caimento real para definir a técnica exata do seu atendimento."
      }
    },
    {
      "@type": "Question",
      "name": "Atende cabelos 4C?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Atendo todas as curvaturas. Cabelos crespos (tipo 4A, 4B, 4C) têm particularidades de volume e caimento que exigem técnicas específicas de precisão, seja no corte molhado ou seco. Sem alisamento disfarçado aqui."
      }
    },
    {
      "@type": "Question",
      "name": "Quanto tempo dura o atendimento?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "O corte completo integrado com o diagnóstico da Leitura de Fio leva por volta de 1h. Atendimento individual, focado em precisão técnica e sem pressa."
      }
    },
    {
      "@type": "Question",
      "name": "Faz transição capilar?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sim. Desenvolvemos cortes de transição progressiva que ajudam a equilibrar a raiz natural e as pontas com química, permitindo que você mude de forma confortável sem precisar recorrer ao Big Chop radical imediato, a menos que seja seu desejo."
      }
    },
    {
      "@type": "Question",
      "name": "Preciso lavar o cabelo antes de ir?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Venha com o cabelo seco, lavado no dia anterior ou no dia da visita, desembaraçado e finalizado do seu jeito comum. Não use coques, tranças ou presilhas que marquem o caimento natural do cacho."
      }
    },
    {
      "@type": "Question",
      "name": "Atende homens?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sim. Temos serviço especializado em cortes masculinos focados em curvaturas e visagismo."
      }
    },
    {
      "@type": "Question",
      "name": "Como agendar?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Agendamento direto e seguro pelo link /agendar. Selecione o serviço, o dia e a hora. Confirmação instantânea sem enrolação."
      }
    },
    {
      "@type": "Question",
      "name": "O que é visagismo para cachos?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Técnica de planejar o corte e a distribuição de volumes baseada nas proporções faciais e na imagem que você quer transmitir, respeitando a física do cacho."
      }
    },
    {
      "@type": "Question",
      "name": "Faz química (progressiva, relaxamento)?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Não. O Studio do Jon é focado em cabelos naturais e na sua saúde real. Não realizamos nenhum tipo de alisamento, relaxamento ou procedimento de modificação química da curvatura."
      }
    },
    {
      "@type": "Question",
      "name": "Qual a diferença de atendimento do Studio do Jon para outros salões?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Não trabalhamos com fórmulas prontas ou cortes padronizados de revista. Cada corte é precedido pela Leitura de Fio, o que significa que ouvimos, analisamos e diagnosticamos o cabelo antes de decidir a técnica de corte. O foco é a sua identidade e a facilidade de cuidar do seu cabelo no dia a dia."
      }
    }
  ]
};

const faqs = [
  {
    question: "Com que frequência devo cortar cabelo cacheado?",
    answer: "Para cabelos saudáveis, de 3 em 3 ou de 4 em 4 meses para manter o design. Se está em transição capilar ou tratando pontas muito danificadas, a cada 2 meses é o ideal para eliminar a quebra."
  },
  {
    question: "Corte a seco é melhor para cachos? Por quê?",
    answer: <>O corte depende de como o seu cabelo se comporta. Eu trabalho com o <Link to="/servicos/corte-hibrido" style={{ color: 'var(--accent)', textDecoration: 'underline' }}><strong>Corte Híbrido</strong></Link> (feito molhado de precisão e lapidado a seco após a finalização). Cortar apenas seco ou molhado ignora a individualidade física de cada cacho. A decisão técnica do que fazer é tomada durante a <Link to="/metodo" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Leitura de Fio</Link>.</>
  },
  {
    question: "O que é o Método Leitura de Fio?",
    answer: <>Minha metodologia exclusiva de 7 etapas de análise antes de a tesoura tocar no cabelo. Mapeamos porosidade, curvaturas, histórico químico e caimento real para definir a técnica exata do seu atendimento. Saiba mais detalhes na página do <Link to="/metodo" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Método Leitura de Fio</Link>.</>
  },
  {
    question: "Atende cabelos 4C?",
    answer: "Atendo todas as curvaturas. Cabelos crespos (tipo 4A, 4B, 4C) têm particularidades de volume e caimento que exigem técnicas específicas de precisão, seja no corte molhado ou seco. Sem alisamento disfarçado aqui."
  },
  {
    question: "Quanto tempo dura o atendimento?",
    answer: <>O corte completo integrado com o diagnóstico da <Link to="/metodo" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Leitura de Fio</Link> leva <strong>por volta de 1h</strong>. Atendimento individual, focado em precisão técnica e sem pressa.</>
  },
  {
    question: "Faz transição capilar?",
    answer: <>Sim. Desenvolvemos cortes de transição progressiva que ajudam a equilibrar a raiz natural e as pontas com química, permitindo que você mude de forma confortável sem precisar recorrer ao Big Chop radical imediato, a menos que seja seu desejo. Saiba mais em <Link to="/servicos/transicao-capilar" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Transição Capilar</Link>.</>
  },
  {
    question: "Preciso lavar o cabelo antes de ir?",
    answer: <>Venha com o cabelo seco, lavado no dia anterior ou no dia da visita, desembaraçado e finalizado do seu jeito comum. Não use coques, tranças ou presilhas que marquem o caimento natural do cacho para que possamos fazer a análise a seco da <Link to="/metodo" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Leitura de Fio</Link> de forma precisa.</>
  },
  {
    question: "Atende homens?",
    answer: <>Sim. Temos serviço especializado em cortes masculinos focados em curvaturas e visagismo. Conheça o <Link to="/servicos/masculino" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Corte Masculino</Link>.</>
  },
  {
    question: "Como agendar?",
    answer: <>Agendamento direto e seguro pelo link <Link to="/agendar" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>/agendar</Link>. Selecione o serviço, o dia e a hora. Confirmação instantânea sem enrolação.</>
  },
  {
    question: "O que é visagismo para cachos?",
    answer: <>Técnica de planejar o corte e a distribuição de volumes baseada nas proporções faciais e na imagem que você quer transmitir, respeitando a física do cacho. Veja mais em <Link to="/servicos/visagismo-cachos" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Visagismo para Cachos</Link>.</>
  },
  {
    question: "Faz química (progressiva, relaxamento)?",
    answer: "Não. O Studio do Jon é focado em cabelos naturais e na sua saúde real. Não realizamos nenhum tipo de alisamento, relaxamento ou procedimento de modificação química da curvatura."
  },
  {
    question: "Qual a diferença de atendimento do Studio do Jon para outros salões?",
    answer: <>Não trabalhamos com fórmulas prontas ou cortes padronizados de revista. Cada corte é precedido pela <Link to="/metodo" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Leitura de Fio</Link>, o que significa que ouvimos, analisamos e diagnosticamos o cabelo antes de decidir a técnica de corte. O foco é a sua identidade e a facilidade de cuidar do seu cabelo no dia a dia.</>
  }
];

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="faq-item"
      style={{
        borderBottom: '1px solid var(--rule, rgba(255, 255, 255, 0.14))',
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
          padding: '24px 0',
          textAlign: 'left',
          color: 'var(--ink, #ffffff)',
        }}
      >
        <span style={{
          fontFamily: "var(--serif)",
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          fontWeight: 400,
          lineHeight: 1.35,
          color: open ? 'var(--accent)' : 'var(--ink)',
          transition: 'color 0.2s ease',
        }}>
          {question}
        </span>
        <span style={{
          flexShrink: 0,
          width: 28,
          height: 28,
          borderRadius: '50%',
          border: '1px solid var(--rule, rgba(255, 255, 255, 0.14))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.2rem',
          color: open ? 'var(--accent)' : 'var(--muted)',
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
          fontFamily: "var(--sans)",
          fontSize: '1rem',
          lineHeight: 1.75,
          color: 'var(--ink-2, #e5e5e5)',
          margin: '0 0 24px 0',
          maxWidth: '65ch',
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
        title="Perguntas Frequentes | Studio do Jon — Cachos BH"
        description="Dúvidas sobre corte híbrido, transição capilar, valores e o Método Leitura de Fio. Respostas diretas e técnicas do Jon."
        url="/faq"
        schema={faqSchema}
      />

      {/* Hero da página */}
      <section style={{
        padding: 'clamp(60px, 8vw, 120px) 0 clamp(40px, 5vw, 64px)',
        borderBottom: '1px solid var(--rule, rgba(255, 255, 255, 0.14))',
      }}>
        <div className="container" style={{ maxWidth: 800 }}>
          {/* Label superior */}
          <p style={{
            fontFamily: "var(--mono)",
            fontSize: '0.7rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <span style={{ display: 'inline-block', width: 18, height: 1, background: 'var(--muted)' }} />
            Studio do Jon · Perguntas Frequentes
          </p>

          <h1 style={{
            fontFamily: "var(--serif)",
            fontWeight: 400,
            fontSize: 'clamp(2rem, 5vw, 3.25rem)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            color: 'var(--ink)',
            margin: '0 0 24px',
          }}>
            Perguntas Frequentes{' '}
            <span style={{
              fontFamily: "var(--serif-italic)",
              fontStyle: 'italic',
              color: 'var(--accent)',
              display: 'block',
            }}>
              — Studio do Jon
            </span>
          </h1>

          <p style={{
            fontFamily: "var(--sans)",
            fontSize: '1.05rem',
            lineHeight: 1.7,
            color: 'var(--ink-2)',
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
              question={item.question}
              answer={item.answer}
            />
          ))}
        </div>
      </section>

      {/* CTA Final */}
      <section style={{
        padding: 'clamp(48px, 6vw, 80px) 0',
        borderTop: '1px solid var(--rule, rgba(255, 255, 255, 0.14))',
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
              fontFamily: "var(--mono)",
              fontSize: '0.7rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <span style={{ display: 'inline-block', width: 18, height: 1, background: 'var(--muted)' }} />
              Próximo passo
            </p>
            <p style={{
              fontFamily: "var(--serif)",
              fontWeight: 400,
              fontSize: 'clamp(1.3rem, 3vw, 1.75rem)',
              color: 'var(--ink)',
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
