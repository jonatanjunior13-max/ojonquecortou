import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Método Leitura de Fio",
  "provider": {
    "@type": "LocalBusiness",
    "name": "Studio do Jon",
    "url": "https://www.ojonquecortou.com.br"
  },
  "description": "O método exclusivo do Studio do Jon — 7 etapas de diagnóstico do fio antes de qualquer corte. Incluso em todo atendimento, sem custo extra.",
  "url": "https://www.ojonquecortou.com.br/metodo"
};

const steps = [
  {
    number: "01",
    title: "Escuta",
    paragraphs: [
      "Antes de encostar na sua cabeça, eu ouço. O que realmente te incomoda no seu cabelo hoje? Qual é o seu histórico de traumas em outros salões? O que você já tentou fazer em casa? O que já funcionou e, de repente, parou de funcionar?",
      "Essa conversa inicial dura mais do que parece necessário. Mas ela é fundamental. A maioria das informações cruciais aparece aqui. Não no toque físico, mas na forma como você descreve a sua relação com o seu cabelo. Eu quero saber como é a sua rotina real. Se você tem tempo de usar difusor ou se precisa lavar e sair correndo para pegar o ônibus. Um corte lindo que exige duas horas de finalização é um corte inútil se você só tem dez minutos pela manhã."
    ]
  },
  {
    number: "02",
    title: "Análise a Seco",
    paragraphs: [
      "Eu vejo o seu cabelo exatamente como ele chega ao Studio. Sem molhar. Sem produto novo. Sem interferência. O cabelo seco conta a história real do seu dia a dia. É onde as pistas de quebra, porosidade real e distribuição de volume se revelam.",
      "O cabelo seco me mostra onde o seu cabelo perde peso natural, onde a curvatura perde força e onde o frizz é mais ativo. Eu observo o caimento dos fios quando você se movimenta. Consigo ver se a sua nuca está mais curta devido ao atrito com roupas ou se o topo está quebrado pelo uso de prendedores inadequados. A análise a seco revela o caimento real que nós vamos esculpir."
    ]
  },
  {
    number: "03",
    title: "Diagnóstico do Couro Cabeludo",
    paragraphs: [
      "A saúde do seu fio nasce na raiz. Se o couro cabeludo não está saudável, o cacho não tem força para se formar. Eu examino a sua raiz em busca de oleosidade excessiva, descamação, caspa, sensibilidade ou foliculite inflamada.",
      "Tudo isso interfere nas minhas decisões técnicas. Um couro cabeludo oleoso que recebe o produto finalizador errado vira um foco de coceira e queda de cabelo. Um couro ressecado submetido a técnicas de higienização agressivas vai produzir fios fracos e quebradiços. Eu trato o couro cabeludo como o solo de uma plantação. O solo precisa estar equilibrado para que a flor cresça saudável."
    ]
  },
  {
    number: "04",
    title: "Histórico Químico",
    paragraphs: [
      "Esta é a fase da verdade. Eu preciso saber tudo o que o seu cabelo já passou nos últimos anos. Teve progressiva? Botox capilar? Relaxamento? Descoloração recente? Coloração para cobrir brancos? Quando foi a última aplicação?",
      "Muitas vezes, resíduos químicos imperceptíveis ao olho nu comprometem a estrutura interna do fio. Eu testo a resistência mecânica da fibra. Quero ter certeza de que o seu fio aguenta o processo que você deseja sem quebrar. Se você quer fazer uma descoloração, por exemplo, o histórico químico é a barreira de segurança que me diz se podemos avançar ou se precisamos tratar o fio primeiro."
    ]
  },
  {
    number: "05",
    title: "Análise Molhada",
    paragraphs: [
      "Com o cabelo limpo e molhado, a textura real e a curvatura se manifestam sem a interferência de cremes antigos ou finalizadores. Eu avalio a elasticidade molhada e a porosidade através do toque e da velocidade de absorção da água.",
      "Muitas vezes, um fio que parece 3B quando está seco revela um padrão 3C quando molhado. Isso muda completamente a técnica de corte. O cabelo molhado me mostra a verdadeira mola do seu cacho. Consigo prever o fator de encolhimento preciso de cada mecha e evitar assimetrias indesejadas no resultado final."
    ]
  },
  {
    number: "06",
    title: "Definição de Técnica",
    paragraphs: [
      "Só depois de passar pelas cinco etapas anteriores eu decido a estratégia. Vamos fazer o corte a seco ou molhado? Para mim, o verdadeiro corte a seco não é moda, é necessidade técnica para desenhar o volume em tempo real. Vamos usar camadas desconectadas para dar volume ou uma linha geométrica para controlar o caimento? Quanto comprimento vamos tirar?",
      "Essa decisão não segue um padrão de revista ou de vídeo do Instagram. Ela é baseada nas necessidades específicas do seu fio naquele exato momento. O visagismo entra aqui com força, harmonizando o formato do corte com as linhas do seu rosto, valorizando a sua expressão pessoal."
    ]
  },
  {
    number: "07",
    title: "Finalização como Validação",
    paragraphs: [
      "A finalização no meu Studio não é apenas o acabamento estético para você tirar fotos. Ela é o teste de estresse do corte. É o momento onde validamos se o diagnóstico estava correto.",
      "Se o cacho não define como o esperado ou se o volume se comporta de forma inadequada durante a secagem, a finalização me mostra onde o corte precisa de pequenos ajustes milimétricos. É a prova real de que o método funcionou. Você sai do salão com a certeza de que o caimento vai se manter bonito na sua rotina diária."
    ]
  }
];

const faqs = [
  {
    question: "Leitura de Fio é um serviço pago?",
    answer: "Não. É parte do atendimento padrão do Studio do Jon. Todo corte começa com as 7 etapas, sempre. O valor do corte já engloba todo o diagnóstico inicial de forma integrada."
  },
  {
    question: "Quanto tempo leva a Leitura de Fio?",
    answer: "Em média de 15 a 30 minutos antes do corte começar. Pode ser mais longa se o histórico for complexo, como em casos de transição capilar longa ou danos por químicas anteriores."
  },
  {
    question: "Posso agendar só a Leitura de Fio sem marcar corte?",
    answer: "Sim. Se você está indecisa sobre mudar o visual ou quer apenas um diagnóstico completo do seu fio para montar um cronograma de cuidados eficiente, você pode agendar uma consulta de diagnóstico separada para entender o seu fio antes de decidir qualquer coisa."
  },
  {
    question: "A Leitura de Fio funciona para cabelo liso também?",
    answer: "O método foi desenvolvido especificamente para cabelos ondulados, cacheados e crespos, onde a variação de textura e histórico químico é mais complexa e o risco de erro técnico é muito maior."
  },
  {
    question: "Posso usar condicionador em vez de máscara?",
    answer: "Pode, mas o condicionador apenas sela a cutícula. A máscara entrega tratamento. Se tiver que escolher um pro minimalismo, fique com a máscara e use uma quantidade menor."
  },
  {
    question: "E o óleo capilar?",
    answer: "Ele entra como o 'plus'. Se o seu cabelo é muito seco (comum em curvaturas 4), ele é o quarto elemento indispensável. Se não, a máscara já resolve."
  }
];

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="faq-item"
      style={{
        borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))',
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
          color: 'inherit',
        }}
      >
        <span style={{
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontSize: 'clamp(1rem, 2vw, 1.15rem)',
          fontWeight: 400,
          lineHeight: 1.35,
          color: open ? 'var(--accent, #c8852a)' : 'var(--text, #faf5e8)',
          transition: 'color 0.2s ease',
        }}>
          {question}
        </span>
        <span style={{
          flexShrink: 0,
          width: 28,
          height: 28,
          borderRadius: '50%',
          border: '1px solid var(--border, rgba(255,255,255,0.15))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1rem',
          color: open ? 'var(--accent, #c8852a)' : 'var(--muted, #a39687)',
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
          transition: 'transform 0.25s ease, color 0.2s ease',
          lineHeight: 1,
        }}>
          +
        </span>
      </button>
      <div
        style={{
          maxHeight: open ? '300px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.3s ease',
        }}
      >
        <p style={{
          fontFamily: "'Manrope', sans-serif",
          fontSize: '0.975rem',
          lineHeight: 1.7,
          color: 'var(--muted, #a39687)',
          margin: '0 0 24px 0',
          maxWidth: '62ch',
        }}>
          {answer}
        </p>
      </div>
    </div>
  );
}

const MetodoPage = () => {
  return (
    <main className="metodo-page" style={{ paddingTop: '5rem' }}>
      <SEO
        title="Método Leitura de Fio | Studio do Jon"
        description="O método exclusivo do Studio do Jon — 7 etapas de diagnóstico do fio antes de qualquer corte. Incluso em todo atendimento, sem custo extra."
        url="/metodo"
        schema={serviceSchema}
      />

      {/* Hero Header */}
      <section style={{
        padding: 'clamp(60px, 8vw, 120px) 0 clamp(40px, 5vw, 64px)',
        borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))',
      }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.7rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--muted, #a39687)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <span style={{ display: 'inline-block', width: 18, height: 1, background: 'var(--muted, #a39687)' }} />
            Método Exclusivo
          </p>

          <h1 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontWeight: 400,
            fontSize: 'clamp(2.25rem, 6vw, 3.75rem)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            color: 'var(--text, #faf5e8)',
            margin: '0 0 28px',
          }}>
            Método Leitura{" "}
            <span style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontStyle: 'italic',
              color: 'var(--accent, #c8852a)',
              display: 'block',
            }}>
              de Fio
            </span>
          </h1>

          <div style={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: 'clamp(1rem, 2vw, 1.15rem)',
            lineHeight: 1.75,
            color: 'var(--muted, #a39687)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxWidth: '65ch',
          }}>
            <p>
              A maioria dos cabeleireiros já pegou a tesoura antes de te perguntar qualquer coisa. Eu não. Antes de qualquer corte no Studio do Jon, eu leio o fio. São 7 etapas. E é por isso que o resultado é diferente.
            </p>
            <p>
              Leitura de Fio é o nome do método diagnóstico exclusivo do Studio do Jon. Não é uma técnica de corte. É o que vem antes. É o processo de entender o fio, o couro, o histórico e o estilo de vida antes do corte.
            </p>
          </div>
        </div>
      </section>

      {/* 7 Steps Section */}
      <section style={{ padding: 'clamp(60px, 8vw, 100px) 0' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <h2 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 400,
            marginBottom: '48px',
            color: 'var(--text, #faf5e8)',
          }}>
            As 7 Etapas do Diagnóstico
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
            {steps.map((step, idx) => (
              <div 
                key={idx}
                style={{
                  display: 'flex',
                  gap: '24px',
                  borderBottom: idx !== steps.length - 1 ? '1px solid var(--border, rgba(255,255,255,0.05))' : 'none',
                  paddingBottom: idx !== steps.length - 1 ? '40px' : '0',
                }}
              >
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
                  color: 'var(--accent, #c8852a)',
                  fontWeight: 600,
                  opacity: 0.8,
                  lineHeight: 1,
                }}>
                  {step.number}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontFamily: "'DM Serif Display', Georgia, serif",
                    fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
                    fontWeight: 400,
                    margin: '0 0 16px 0',
                    color: 'var(--text, #faf5e8)',
                  }}>
                    Etapa {step.number} — {step.title}
                  </h3>
                  <div style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: '0.975rem',
                    lineHeight: 1.7,
                    color: 'var(--muted, #a39687)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    maxWidth: '65ch',
                  }}>
                    {step.paragraphs.map((p, pIdx) => (
                      <p key={pIdx}>{p}</p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section style={{
        padding: 'clamp(60px, 8vw, 100px) 0',
        borderTop: '1px solid var(--border, rgba(255,255,255,0.08))',
        backgroundColor: 'rgba(255, 255, 255, 0.01)'
      }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <h2 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 400,
            marginBottom: '16px',
            color: 'var(--text, #faf5e8)',
          }}>
            Perguntas Frequentes
          </h2>
          <p style={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: '1rem',
            color: 'var(--muted, #a39687)',
            marginBottom: '32px',
          }}>
            Dúvidas comuns sobre o funcionamento e aplicação do método.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {faqs.map((faq, idx) => (
              <FAQItem key={idx} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: 'clamp(60px, 8vw, 100px) 0',
        borderTop: '1px solid var(--border, rgba(255,255,255,0.08))',
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
              color: 'var(--muted, #a39687)',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <span style={{ display: 'inline-block', width: 18, height: 1, background: 'var(--muted, #a39687)' }} />
              Pronto para o diagnóstico?
            </p>
            <p style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontWeight: 400,
              fontSize: 'clamp(1.3rem, 3vw, 1.85rem)',
              color: 'var(--text, #faf5e8)',
              margin: 0,
              lineHeight: 1.25,
              maxWidth: '32ch'
            }}>
              Vivencie o corte com método e segurança que valorizam sua curvatura.
            </p>
          </div>
          <Link
            to="/agendar"
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '1rem 2rem', fontWeight: 800 }}
          >
            Agendar no Studio do Jon →
          </Link>
        </div>
      </section>
    </main>
  );
};

export default MetodoPage;
