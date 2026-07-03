import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { Arrow, Reveal } from '../components/NewDesignComponents';

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "O que muda no corte com visagismo?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Deixamos de usar fórmulas prontas ou simetrias artificiais de revistas. Cada camada e franja é desenhada para projetar volume onde ele valoriza a sua estrutura facial, linhas de expressão e estilo de vida individual."
      }
    },
    {
      "@type": "Question",
      "name": "Tenho que mudar radicalmente o meu estilo?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "De forma alguma. O visagismo serve para otimizar o comprimento e o formato que você já se sente confortável, ajustando apenas a distribuição de volumes e ângulos para criar harmonia."
      }
    },
    {
      "@type": "Question",
      "name": "Como o corte visagista se comporta com o crescimento?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Como o corte é esculpido respeitando a direção de crescimento natural e o encolhimento de cada cacho individualmente, o crescimento ocorre de forma muito mais simétrica, fazendo o design durar o dobro do tempo."
      }
    }
  ]
};

const VisagismServicePage = () => {
  return (
    <main>
      <SEO
        title="Visagismo para Cabelos Cacheados em BH | Studio do Jon"
        description="Valorize sua imagem através do visagismo especializado em cabelos cacheados em Belo Horizonte. Cortes estruturados para sua expressão e rotina. Agende."
        url="/servicos/visagismo-cachos"
        schema={faqSchema}
      />

      <header className="hero">
        <div className="hero-blob" aria-hidden="true" />
        <div className="container">
          <div className="eyebrow reveal in" style={{ marginBottom: 36 }}>
            Visagismo — Design Personalizado
          </div>

          <div className="hero-grid">
            <div>
              <h1 className="display reveal in">
                Corte esculpido para <span className="accent-word">sua identidade</span>
              </h1>

              <Reveal delay={120}>
                <p className="lead" style={{ marginTop: 28 }}>
                  Copiar corte de influenciadora não funciona em seu cabelo. Cada cacho responde diferente — densidade, elasticidade, crescimento natural são únicos. Visagismo adapta geometria do corte para seu rosto, rotina e curvatura real.
                </p>
              </Reveal>

              <Reveal delay={220} className="hero-actions">
                <Link to="/agendar" className="btn btn-accent">
                  Agendar Diagnóstico <Arrow />
                </Link>
                <Link to="/servicos" className="btn btn-ghost">
                  Ver Outros Serviços
                </Link>
              </Reveal>

              <Reveal delay={320} className="hero-meta">
                <div className="hero-stat">
                  <div className="n">Personalizado</div>
                  <div className="l">Sem fórmulas prontas</div>
                </div>
                <div className="hero-stat">
                  <div className="n">3x duração</div>
                  <div className="l">Crescimento simétrico</div>
                </div>
                <div className="hero-stat">
                  <div className="n">Fácil de manter</div>
                  <div className="l">Conforme sua rotina</div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </header>

      <section className="section-padding">
        <div className="container max-w-2xl">
          <Reveal as="h2" className="heading-lg mb-3">
            A Ciência das Proporções Faciais no Cabelo Cacheado
          </Reveal>
          <Reveal as="p" className="paragraph-md mb-4">
            O cabelo cacheado funciona como moldura 3D ativa. Volume das laterais ou topo altera percepção de largura e altura do rosto. Cada formato de rosto exige geometria diferente:
          </Reveal>
          <div className="grid-2">
            <Reveal className="card">
              <h3 className="heading-md">Rosto Redondo</h3>
              <p className="paragraph-sm">Evitamos volume horizontal nas laterais. Concentramos camadas no topo para alongar verticalmente a silhueta.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Rosto Quadrado</h3>
              <p className="paragraph-sm">Usamos linhas arredondadas e franjas desfiadas para suavizar rigidez dos ângulos de mandíbula e testa.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Rosto Oblongo/Longo</h3>
              <p className="paragraph-sm">Adicionamos volume lateral controlado e franjas cheias na altura das sobrancelhas para encurtar visualmente.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Rosto Coração</h3>
              <p className="paragraph-sm">Mantemos topo mais limpo e projetamos volume da altura das bochechas até queixo para preencher terço inferior.</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section-padding bg-light">
        <div className="container max-w-2xl">
          <Reveal as="h2" className="heading-lg mb-4">
            Cortes Icônicos Adaptados com Visagismo
          </Reveal>
          <div className="grid-3">
            <Reveal className="card">
              <h3 className="heading-md">Shaggy Hair</h3>
              <p className="paragraph-sm">Camadas curtas no topo, franja desconectada e muita textura. Ideal para visual despojado, volumoso e com muito balanço.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Wolf Cut</h3>
              <p className="paragraph-sm">Fusão moderna entre mullet e shaggy. Perfeito para acentuar volume da coroa mantendo comprimento mais leve.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Bob em Camadas</h3>
              <p className="paragraph-sm">Clássico atemporal que valoriza linha do queixo e pescoço. Volume distribuído na diagonal para evitar formato triangular.</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container max-w-2xl">
          <Reveal as="h2" className="heading-lg mb-4">
            As Etapas do Visagismo no Cacho
          </Reveal>
          <div className="grid-3">
            <Reveal className="card">
              <h3 className="heading-md">📐 Análise de Proporções</h3>
              <p className="paragraph-sm">Estudo do formato de rosto, linhas e pontos de destaque (olhos, maxilar, bochechas) com base nos terços faciais.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">📋 Estilo de Vida</h3>
              <p className="paragraph-sm">Conversa honesta sobre sua rotina de cuidados capilares para desenhar corte prático que funcione sozinho em casa.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">✂️ Escultura a Seco</h3>
              <p className="paragraph-sm">O corte é finalizado cacho por cacho com cabelo seco, respeitando taxas de encolhimento individuais em tempo real.</p>
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
            <summary>O que muda no corte com visagismo?</summary>
            <p className="paragraph-sm" style={{ marginTop: 12 }}>Deixamos de usar fórmulas prontas. Cada camada é desenhada para projetar volume onde valoriza sua estrutura facial, linhas e estilo individual.</p>
          </Reveal>
          <Reveal as="details" className="faq-item">
            <summary>Tenho que mudar radicalmente o meu estilo?</summary>
            <p className="paragraph-sm" style={{ marginTop: 12 }}>Não. Visagismo otimiza comprimento e formato que já te deixa confortável. Ajusta só distribuição de volumes e ângulos para criar harmonia.</p>
          </Reveal>
          <Reveal as="details" className="faq-item">
            <summary>Como o corte se comporta com o crescimento?</summary>
            <p className="paragraph-sm" style={{ marginTop: 12 }}>Como é esculpido respeitando direção de crescimento natural e encolhimento de cada cacho, crescimento ocorre de forma simétrica. Design dura o dobro do tempo.</p>
          </Reveal>
        </div>
      </section>

      <section className="section-padding text-center">
        <div className="container max-w-lg">
          <Reveal as="h2" className="heading-lg mb-3">
            Descubra o corte ideal para sua identidade
          </Reveal>
          <Reveal as="p" className="paragraph-md mb-4">
            Agende seu diagnóstico de visagismo com o Jon e liberte o verdadeiro potencial do seu cabelo cacheado.
          </Reveal>
          <Reveal>
            <Link to="/agendar" className="btn btn-accent">
              Agendar Visagismo <Arrow />
            </Link>
          </Reveal>
        </div>
      </section>
    </main>
  );
};

export default VisagismServicePage;
