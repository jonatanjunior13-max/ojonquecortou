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
    <main className="about-page">
      <SEO 
        title="Leitura de Fio Cabelo Cacheado BH | Studio do Jon" 
        description="Conheça a Leitura de Fio no Studio do Jon em Belo Horizonte. Análise técnica de curvatura, porosidade e saúde da raiz. R$ 80 revertidos em crédito. Agende." 
        url="/servicos/leitura-de-fio"
        schema={faqSchema}
      />
      <section className="about-hero section-padding">
        <div className="container text-center reveal active">
          <h1 className="heading-xl">Leitura de <span className="text-gradient">Fio</span></h1>
          <p className="paragraph-lg max-w-lg mx-auto mt-2">
            Entenda a ciência, a saúde e as curvaturas reais do seu cabelo antes de qualquer tesourada.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container about-grid">
          <div className="about-visual reveal active">
            <div className="about-image-wrap">
              <img src="/jon-trabalhando.jpg" alt="Jonatan Junior realizando análise técnica e leitura de fio no Studio do Jon em Belo Horizonte" className="about-image" />
            </div>
            <div className="experience-tag">
              <span className="exp-number">R$ 80</span>
              <span className="exp-text">Valor da Análise</span>
            </div>
          </div>

          <div className="about-content reveal active">
            <h2 className="heading-lg mb-2">Não existe cabelo errado. Existe fio mal lido.</h2>
            <p className="paragraph-md mb-2">
              Antes de qualquer tesoura tocar o seu cabelo, existe uma etapa que quase ninguém faz: ler o fio. Aqui no studio, essa etapa virou serviço — pra você que quer entender o próprio cabelo antes de decidir qualquer coisa. A Leitura de Fio é um protocolo proprietário de diagnóstico estrutural e tricologia básica adaptado para a mecânica de fios espiralados.
            </p>
            <p className="paragraph-md mb-2">
              Não é avaliação de balcão, daquelas de cinco minutos com olhar de longe. É meia hora de análise de verdade, só sua.
            </p>
            <p className="paragraph-md mb-3">
              A gente começa pela escuta — sua rotina, seus hábitos, o que você já fez no cabelo e o que já fizeram nele. Depois eu vou pro couro cabeludo: análise completa de saúde, oleosidade e comportamento da raiz. Em seguida, o fio: curvatura real (a maioria das cabeças tem mais de uma), densidade, porosidade e memória de química — aquele histórico que o cabelo carrega mesmo quando você não conta.
            </p>
            
            <p className="paragraph-md mb-3" style={{ background: 'var(--bg-warm)', padding: '15px', borderRadius: '8px', borderLeft: '4px solid var(--accent)' }}>
              <strong>E o melhor: você não paga pela leitura.</strong><br/>
              Se você fechar um corte ou tratamento comigo, os <strong>R$ 80 viram crédito</strong> e abatem integralmente do valor do serviço. A leitura funciona como entrada — não como custo.
            </p>

            <div className="cta-group">
              <Link to="/agendar" className="btn btn-primary">Agendar Leitura de Fio</Link>
              <Link to="/servicos" className="btn btn-outline">Outros Serviços</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding" style={{ background: 'var(--bg-warm)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <h2 className="heading-md mb-3 text-center">As 7 Etapas do Protocolo de Leitura de Fio</h2>
          <p className="paragraph-md mb-4 text-center">
            Cada etapa do diagnóstico fornece dados cruciais para projetar o corte ideal e selecionar os cosméticos corretos:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', borderLeft: '3px solid var(--accent)' }}>
              <strong>Etapa 1: Anamnese e Rotina (Histórico do Cuidado)</strong>
              <p style={{ fontSize: '0.9rem', marginTop: '5px' }}>Investigamos sua rotina de lavagem, marcas de produtos mais utilizadas, frequência de uso de secadores e histórico de processos alcalinos nos últimos 3 anos.</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', borderLeft: '3px solid var(--accent)' }}>
              <strong>Etapa 2: Tricoscopia e Saúde do Couro Cabeludo</strong>
              <p style={{ fontSize: '0.9rem', marginTop: '5px' }}>Análise visual da epiderme do couro cabeludo para detectar excesso de sebo, descamação, dermatites ou obstruções foliculares que impedem o crescimento forte.</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', borderLeft: '3px solid var(--accent)' }}>
              <strong>Etapa 3: Mapeamento de Curvaturas Multi-Textura</strong>
              <p style={{ fontSize: '0.9rem', marginTop: '5px' }}>Identificamos a variação de curvatura na sua cabeça. Quase todo mundo tem texturas mistas (como 3A na nuca e 3C no topo). Isso orienta a distribuição do corte.</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', borderLeft: '3px solid var(--accent)' }}>
              <strong>Etapa 4: Teste de Porosidade e Absorção Hídrica</strong>
              <p style={{ fontSize: '0.9rem', marginTop: '5px' }}>Medimos a capacidade das cutículas de absorver e reter água. Cabelos muito porosos absorvem rápido mas perdem hidratação em minutos, exigindo acidificação de pH.</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', borderLeft: '3px solid var(--accent)' }}>
              <strong>Etapa 5: Teste Físico de Elasticidade e Tensão</strong>
              <p style={{ fontSize: '0.9rem', marginTop: '5px' }}>Tracionamos suavemente alguns fios úmidos para avaliar o limite elástico. Fios que esticam e não voltam estão com falta de queratina; fios rígidos que quebram de imediato necessitam de nutrição lipídica.</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', borderLeft: '3px solid var(--accent)' }}>
              <strong>Etapa 6: Análise de Densidade e Distribuição de Volume</strong>
              <p style={{ fontSize: '0.9rem', marginTop: '5px' }}>Avaliamos a quantidade de folículos ativos por centímetro quadrado. Isso nos permite prever a massa visual do corte e projetar as camadas para evitar o efeito pirâmide.</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', borderLeft: '3px solid var(--accent)' }}>
              <strong>Etapa 7: Rastreamento de Resíduos Acumulados (Scab Hair)</strong>
              <p style={{ fontSize: '0.9rem', marginTop: '5px' }}>Identificamos o acúmulo de silicones insolúveis, parafinas e óleos minerais que criam um filme impermeabilizante sobre a fibra, mascarando a textura e impedindo a entrada de tratamentos reais.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container" style={{ maxWidth: '800px' }}>
          <h2 className="heading-md mb-3">Você sai daqui com três coisas no bolso:</h2>
          <ul className="about-list" style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>
            <li className="mb-2">
              <div className="list-icon">✓</div>
              <span><strong>Orientação técnica de produtos:</strong> Chega de desperdiçar dinheiro comprando cremes errados indicados por blogueiras. Explicamos o que o seu fio necessita quimicamente.</span>
            </li>
            <li className="mb-2">
              <div className="list-icon">✓</div>
              <span><strong>Mapa de finalizações:</strong> Ensinamos as técnicas de fitagem, dedoliss ou estimulação de cachos ideais para a anatomia do seu cabelo.</span>
            </li>
            <li className="mb-2">
              <div className="list-icon">✓</div>
              <span><strong>Direcionamento de Corte e Volume:</strong> Definimos a angulação de corte e os volumes ideais baseados na física do seu fio e formato de rosto.</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="section-padding technique-section" style={{ background: 'var(--bg-warm)' }}>
        <div className="container">
          <div className="text-center reveal mb-4">
            <h2 className="heading-md">Para quem é recomendado?</h2>
          </div>
          
          <div className="technique-grid">
            <div className="card reveal stagger-1">
              <span className="tech-emoji">🌱</span>
              <h3>Transição Capilar</h3>
              <p>Perfeito para quem está em transição e não sabe por onde começar a cuidar da nova textura natural.</p>
            </div>
            <div className="card reveal stagger-2">
              <span className="tech-emoji">🧴</span>
              <h3>Acerto de Produtos</h3>
              <p>Para quem já gastou centenas de reais com cremes e tratamentos que simplesmente pesaram ou ressecaram o cabelo.</p>
            </div>
            <div className="card reveal stagger-3">
              <span className="tech-emoji">✂️</span>
              <h3>Evitar Erros</h3>
              <p>Para quem teve experiências ruins em salões convencionais e quer segurança antes de encarar a tesoura.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-cta-bottom section-padding">
        <div className="container text-center reveal">
          <h2 className="heading-lg mb-2">Vagas limitadas por semana.</h2>
          <p className="paragraph-lg mb-4 max-w-md mx-auto">
            Reserve seu horário de análise individual de 30 minutos e entenda de uma vez por todas o comportamento real dos seus fios.
          </p>
          <Link to="/agendar" className="btn btn-primary">
            Agendar minha Leitura de Fio
          </Link>
        </div>
      </section>
    </main>
  );
};

export default LeituraFioPage;
