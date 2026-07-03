import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { Reveal, Arrow } from '../components/NewDesignComponents';

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "A descoloração vai fazer eu perder a definição dos meus cachos?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Se feita sem controle de pH ou usando oxidantes de volumagem muito alta de forma rápida, sim, pois destrói as pontes de dissulfeto que dão forma ao espiral. Usando nosso protocolo com Plex protetor e descoloração lenta com volumagem baixa, a definição é preservada."
      }
    },
    {
      "@type": "Question",
      "name": "O que preciso fazer antes da sessão de descoloração?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sugerimos fazer um cronograma de nutrição (reposição lipídica) nas duas semanas anteriores e suspender qualquer uso de fontes de calor pesadas. O cabelo também deve passar no teste de mecha físico no Studio."
      }
    },
    {
      "@type": "Question",
      "name": "Qual o valor e a duração do procedimento?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "O serviço de descoloração completa ou mechas iluminadas com protocolo de proteção Plex integrado inicia a partir de R$ 699, com duração média de 3 a 5 horas de atendimento exclusivo."
      }
    }
  ]
};

const BleachServicePage = () => {
  return (
    <main>
      <SEO
        title="Descoloração e Mechas em Cabelo Cacheado BH | Studio do Jon"
        description="Ilumine seus cachos sem perder a definição. Protocolo exclusivo em Belo Horizonte com teste de mecha, Plex e reacidificação pós-química. Agende."
        url="/servicos/descoloracao-cabelo-cacheado"
        schema={faqSchema}
      />

      <header className="hero">
        <div className="hero-blob" aria-hidden="true" />
        <div className="container">
          <div className="eyebrow reveal in" style={{ marginBottom: 36 }}>
            Descoloração — Iluminação com Proteção
          </div>

          <div className="hero-grid">
            <div>
              <h1 className="display reveal in">
                Ilumine seus fios <span className="accent-word">sem perder definição</span>
              </h1>

              <Reveal delay={120}>
                <p className="lead" style={{ marginTop: 28 }}>
                  Descoloração em cabelo cacheado destrói pontes de dissulfeto se feita com pH descontrolado. Nosso protocolo usa volumagem baixa, Plex protetor e reacidificação imediata. Resultado: fios claros, cachos ainda definidos.
                </p>
              </Reveal>

              <Reveal delay={220} className="hero-actions">
                <Link to="/agendar" className="btn btn-accent">
                  Agendar Descoloração <Arrow />
                </Link>
                <Link to="/servicos" className="btn btn-ghost">
                  Ver Outros Serviços
                </Link>
              </Reveal>

              <Reveal delay={320} className="hero-meta">
                <div className="hero-stat">
                  <div className="n">A partir de</div>
                  <div className="l">R$ 699</div>
                </div>
                <div className="hero-stat">
                  <div className="n">3-5 horas</div>
                  <div className="l">Atendimento exclusivo</div>
                </div>
                <div className="hero-stat">
                  <div className="n">100%</div>
                  <div className="l">Teste de mecha obrigatório</div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </header>

      <section className="section-padding">
        <div className="container max-w-2xl">
          <Reveal as="h2" className="heading-lg mb-3">
            Química em cacho exige respeito e ciência
          </Reveal>
          <Reveal as="p" className="paragraph-md mb-3">
            A descoloração é um processo químico de oxidação que remove os grânulos de melanina natural do córtex. Em cabelos texturizados (curvaturas 2-4), também ataca pontes de hidrogênio e ligações cisteínicas (dissulfeto). Sem proteção, o cacho estira, perde definição e sofre corte químico.
          </Reveal>
          <Reveal as="p" className="paragraph-md mb-4">
            No Studio do Jon, descoloração só começa após Leitura de Fio completa. Avaliamos porosidade, elasticidade e histórico químico em teste de mecha rigoroso antes de encostar qualquer produto na sua cabeça.
          </Reveal>
        </div>
      </section>

      <section className="section-padding bg-light">
        <div className="container max-w-2xl">
          <Reveal as="h2" className="heading-lg mb-3">
            Por que o protocolo protege seu cabelo
          </Reveal>
          <Reveal as="p" className="paragraph-md mb-4">
            Diferente de salões que usam descolorantes ultra-rápidos com volumagem alta, adotamos descoloração lenta e controlada. Veja os pilares:
          </Reveal>
          <div className="grid-2">
            <Reveal className="card">
              <h3 className="heading-md">Aditivo Plex de Proteção</h3>
              <p className="paragraph-sm">Agentes protetores de pontes moleculares diretamente no pó descolorante. Escudo sacrificial absorve agressão oxidativa antes de romper o córtex.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Oxidação Baixa Volumagem</h3>
              <p className="paragraph-sm">Oxidantes 10 ou 20 volumes em sessões longas. Clareamento lento preserva lipídios naturais e mantém cacho unido.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Acidificação Imediata</h3>
              <p className="paragraph-sm">Após clareamento, pH sobe a 9.0-11.0. Aplicamos reacidificante profissional para pH 4.5-5.0, selando cutícula e retendo cor.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Teste de Mecha Rigoroso</h3>
              <p className="paragraph-sm">Antes de qualquer aplicação, testamos em mecha discreta. Avaliamos resultado e ajustamos tempo/volumagem se necessário.</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container max-w-2xl">
          <Reveal as="h2" className="heading-lg mb-4">
            Protocolo Descoloração Completa
          </Reveal>
          <div className="timeline">
            <Reveal className="timeline-item">
              <span className="timeline-marker">Leitura de Fio (15 min)</span>
              <p className="paragraph-sm">Avaliamos porosidade, elasticidade, histórico químico e cor-alvo desejada. Isso informa toda estratégia de descoloração.</p>
            </Reveal>
            <Reveal className="timeline-item">
              <span className="timeline-marker">Teste de Mecha (20 min)</span>
              <p className="paragraph-sm">Aplicamos fórmula em mecha discreta, aguardamos tempo real e avaliamos antes de prosseguir.</p>
            </Reveal>
            <Reveal className="timeline-item">
              <span className="timeline-marker">Aplicação Técnica (90-180 min)</span>
              <p className="paragraph-sm">Dividimos em seções, aplicamos conforme porosidade mapeada. Volumagem baixa, tempo estendido para segurança.</p>
            </Reveal>
            <Reveal className="timeline-item">
              <span className="timeline-marker">Enxague + Acidificação (15 min)</span>
              <p className="paragraph-sm">Água filtrada → máscara proteica → selamento ácido. Reduz drasticamente ressecamento pós-descoloração.</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container max-w-2xl">
          <Reveal as="h2" className="heading-lg mb-4">
            Cuidados Pré-Descoloração (2 semanas antes)
          </Reveal>
          <div className="grid-2">
            <Reveal className="card">
              <h3 className="heading-md">Cronograma de Nutrição</h3>
              <p className="paragraph-sm">Reposição lipídica 2 semanas antes. Hidrata o córtex e prepara fibra para oxidação.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Suspender Calor</h3>
              <p className="paragraph-sm">Sem secador, chapinha ou fontes de calor pesadas. Reserva térmica prejudica processamento químico.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Desembaraçar</h3>
              <p className="paragraph-sm">Chegue com cabelo totalmente desembaraçado e seco em sua forma natural, para facilitar divisão em seções.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Evitar Coloração Recente</h3>
              <p className="paragraph-sm">Se colorido há menos de 3 semanas, sempre faça teste de mecha. Química residual muda processamento.</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container max-w-2xl">
          <Reveal as="h2" className="heading-lg mb-4">
            FAQ
          </Reveal>
          <Reveal as="details" className="faq-item">
            <summary>A descoloração vai destruir meus cachos?</summary>
            <p className="paragraph-sm" style={{ marginTop: 12 }}>Não, se feita com protocolo Plex + volumagem baixa + reacidificação. Destruição ocorre com salões que usam vol 40+ sem proteção.</p>
          </Reveal>
          <Reveal as="details" className="faq-item">
            <summary>Preciso fazer mais de uma sessão?</summary>
            <p className="paragraph-sm" style={{ marginTop: 12 }}>Depende da cor atual e alvo. Louro claríssimo em cabelo muito escuro pode exigir 2-3 sessões espaçadas 3 semanas.</p>
          </Reveal>
          <Reveal as="details" className="faq-item">
            <summary>Quanto tempo leva para o cabelo "recuperar"?</summary>
            <p className="paragraph-sm" style={{ marginTop: 12 }}>Com nosso protocolo, retoque de raiz a cada 6-8 semanas. Manutenção mensal de tratamento (Detox) acelera recuperação.</p>
          </Reveal>
        </div>
      </section>

      <section className="section-padding text-center">
        <div className="container max-w-lg">
          <Reveal as="h2" className="heading-lg mb-3">
            Iluminação sem sacrificar definição
          </Reveal>
          <Reveal as="p" className="paragraph-md mb-4">
            Agende sua Leitura de Fio + teste de mecha. Primeira sessão de descoloração começa com segurança.
          </Reveal>
          <Reveal>
            <Link to="/agendar" className="btn btn-accent">
              Agendar Descoloração Completa <Arrow />
            </Link>
          </Reveal>
        </div>
      </section>
    </main>
  );
};

export default BleachServicePage;
