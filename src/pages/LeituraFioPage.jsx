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
      "name": "O que é a Leitura de Fio?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A Leitura de Fio é uma análise minuciosa de 30 minutos realizada antes de qualquer procedimento no Studio do Jon. Investigamos a saúde do couro cabeludo, curvatura real, porosidade, densidade e histórico de química de forma individual e detalhada."
      }
    },
    {
      "@type": "Question",
      "name": "Como funciona o crédito de R$ 80?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "O valor de R$ 80 pago pela Leitura de Fio é revertido integralmente em crédito (abate) se você realizar um corte ou tratamento no Studio do Jon. Funciona como um sinal/entrada, ou seja, a análise acaba saindo de graça."
      }
    },
    {
      "@type": "Question",
      "name": "Quem deve fazer a Leitura de Fio?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "É ideal para pessoas em transição capilar que não sabem por onde começar, quem já gastou muito com produtos que não deram certo, quem teve experiências ruins com cortes e quer entender o que deu errado, ou quem apenas deseja conhecer profundamente a própria curvatura."
      }
    }
  ]
};

const LeituraFioPage = () => {
  return (
    <main>
      <SEO
        title="Leitura de Fio Cabelo Cacheado BH | Studio do Jon"
        description="Conheça a Leitura de Fio no Studio do Jon em Belo Horizonte. Análise técnica de curvatura, porosidade e saúde da raiz. R$ 80 revertidos em crédito. Agende."
        url="/servicos/leitura-de-fio"
        schema={faqSchema}
      />

      <header className="hero">
        <div className="hero-blob" aria-hidden="true" />
        <div className="container">
          <div className="eyebrow reveal in" style={{ marginBottom: 36 }}>
            Leitura de Fio — Diagnóstico Técnico
          </div>

          <div className="hero-grid">
            <div>
              <h1 className="display reveal in">
                Entenda a ciência do <span className="accent-word">seu cabelo</span>
              </h1>

              <Reveal delay={120}>
                <p className="lead" style={{ marginTop: 28 }}>
                  Não existe cabelo errado. Existe fio mal lido. Antes de qualquer tesoura, existe análise que quase ninguém faz: ler o fio. 30 minutos de análise real — não avaliação de balcão. Couro cabeludo, curvatura real, porosidade, elasticidade, memória de química. Resultado: entender profundamente seu cabelo antes de decidir qualquer coisa.
                </p>
              </Reveal>

              <Reveal delay={220} className="hero-actions">
                <Link to="/agendar" className="btn btn-accent">
                  Agendar Leitura de Fio <Arrow />
                </Link>
                <Link to="/servicos" className="btn btn-ghost">
                  Ver Outros Serviços
                </Link>
              </Reveal>

              <Reveal delay={320} className="hero-meta">
                <div className="hero-stat">
                  <div className="n">R$ 80</div>
                  <div className="l">Vira crédito se contratar</div>
                </div>
                <div className="hero-stat">
                  <div className="n">30 min</div>
                  <div className="l">Análise completa</div>
                </div>
                <div className="hero-stat">
                  <div className="n">7 etapas</div>
                  <div className="l">Protocolo técnico</div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </header>

      <section className="section-padding">
        <div className="container max-w-2xl">
          <Reveal as="h2" className="heading-lg mb-3">
            O que inclui a Leitura de Fio
          </Reveal>
          <Reveal as="p" className="paragraph-md mb-3">
            Começamos pela escuta — sua rotina, seus hábitos, o que você já fez no cabelo e o que já fizeram nele. Depois análise completa de couro cabeludo: saúde, oleosidade, comportamento da raiz. Em seguida, o fio: curvatura real (maioria das cabeças tem mais de uma), densidade, porosidade e memória de química — histórico que cabelo carrega mesmo quando não conta.
          </Reveal>
          <Reveal as="p" className="paragraph-md mb-4" style={{ background: 'var(--bg-warm)', padding: '15px', borderRadius: '8px', borderLeft: '4px solid var(--accent)' }}>
            <strong>E o melhor: você não paga pela leitura.</strong><br/>
            Se fechar um corte ou tratamento, os <strong>R$ 80 viram crédito</strong> e abatem integralmente do valor do serviço. A leitura funciona como entrada — não como custo.
          </Reveal>
        </div>
      </section>

      <section className="section-padding bg-light">
        <div className="container max-w-2xl">
          <Reveal as="h2" className="heading-lg mb-4">
            As 7 Etapas do Protocolo de Leitura de Fio
          </Reveal>
          <Reveal as="p" className="paragraph-md mb-4">
            Cada etapa fornece dados cruciais para projetar corte ideal e selecionar cosméticos corretos:
          </Reveal>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Reveal className="card">
              <h3 className="heading-md">Etapa 1: Anamnese e Rotina</h3>
              <p className="paragraph-sm">Investigamos sua rotina de lavagem, marcas de produtos mais utilizadas, frequência de secadores e histórico de processos alcalinos últimos 3 anos.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Etapa 2: Tricoscopia e Couro Cabeludo</h3>
              <p className="paragraph-sm">Análise visual da epiderme para detectar excesso de sebo, descamação, dermatites ou obstruções foliculares que impedem crescimento forte.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Etapa 3: Mapeamento de Curvaturas Multi-Textura</h3>
              <p className="paragraph-sm">Identificamos variação de curvatura na sua cabeça. Quase todo mundo tem texturas mistas (como 3A na nuca e 3C no topo). Isso orienta distribuição do corte.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Etapa 4: Teste de Porosidade</h3>
              <p className="paragraph-sm">Medimos capacidade das cutículas de absorver e reter água. Cabelos muito porosos absorvem rápido mas perdem hidratação em minutos, exigindo acidificação.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Etapa 5: Teste de Elasticidade</h3>
              <p className="paragraph-sm">Tracionamos suavemente alguns fios úmidos para avaliar limite elástico. Fios que esticam e não voltam estão com falta de queratina.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Etapa 6: Análise de Densidade</h3>
              <p className="paragraph-sm">Avaliamos quantidade de folículos ativos por cm². Permite prever massa visual do corte e projetar camadas para evitar efeito pirâmide.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Etapa 7: Rastreamento de Resíduos</h3>
              <p className="paragraph-sm">Identificamos acúmulo de silicones, parafinas e óleos minerais que criam filme impermeabilizante sobre fibra, mascarando textura real.</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container max-w-2xl">
          <Reveal as="h2" className="heading-lg mb-4">
            Você sai daqui com três coisas
          </Reveal>
          <div className="grid-3">
            <Reveal className="card">
              <h3 className="heading-md">🧪 Orientação de Produtos</h3>
              <p className="paragraph-sm">Explicamos o que seu fio necessita quimicamente. Chega de desperdiçar comprando cremes errados indicados por blogueiras.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">📋 Mapa de Finalizações</h3>
              <p className="paragraph-sm">Ensinamos técnicas de fitagem, dedoliss ou estimulação de cachos ideais para anatomia do seu cabelo.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">✂️ Direcionamento de Corte</h3>
              <p className="paragraph-sm">Definimos angulação de corte e volumes ideais baseados na física do seu fio e formato de rosto.</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container max-w-2xl">
          <Reveal as="h2" className="heading-lg mb-4">
            Para quem é recomendado?
          </Reveal>
          <div className="grid-3">
            <Reveal className="card">
              <h3 className="heading-md">🌱 Transição Capilar</h3>
              <p className="paragraph-sm">Perfeito para quem está em transição e não sabe por onde começar a cuidar da nova textura natural.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">🧴 Acerto de Produtos</h3>
              <p className="paragraph-sm">Para quem já gastou centenas de reais com cremes e tratamentos que simplesmente pesaram ou ressecaram o cabelo.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">✂️ Evitar Erros</h3>
              <p className="paragraph-sm">Para quem teve experiências ruins em salões convencionais e quer segurança antes de encarar a tesoura.</p>
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
            <summary>O que é a Leitura de Fio?</summary>
            <p className="paragraph-sm" style={{ marginTop: 12 }}>Análise minuciosa de 30 min antes de qualquer procedimento. Investigamos saúde do couro, curvatura real, porosidade, densidade e histórico químico de forma individual e detalhada.</p>
          </Reveal>
          <Reveal as="details" className="faq-item">
            <summary>Como funciona o crédito de R$ 80?</summary>
            <p className="paragraph-sm" style={{ marginTop: 12 }}>Valor pago é revertido integralmente em crédito se realizar corte ou tratamento. Funciona como entrada — análise acaba saindo de graça.</p>
          </Reveal>
          <Reveal as="details" className="faq-item">
            <summary>Quem deve fazer?</summary>
            <p className="paragraph-sm" style={{ marginTop: 12 }}>Ideal para quem está em transição, gastou muito com produtos errados, teve más experiências em salões, ou quer conhecer profundamente a própria curvatura.</p>
          </Reveal>
        </div>
      </section>

      <section className="section-padding text-center">
        <div className="container max-w-lg">
          <Reveal as="h2" className="heading-lg mb-3">
            Vagas limitadas por semana
          </Reveal>
          <Reveal as="p" className="paragraph-md mb-4">
            Reserve seu horário de análise individual de 30 min e entenda de uma vez por todas o comportamento real dos seus fios.
          </Reveal>
          <Reveal>
            <Link to="/agendar" className="btn btn-accent">
              Agendar Leitura de Fio <Arrow />
            </Link>
          </Reveal>
        </div>
      </section>
    </main>
  );
};

export default LeituraFioPage;
