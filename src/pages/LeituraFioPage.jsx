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
          </div>

          <div className="about-content reveal active">
            <h2 className="heading-lg mb-2">Não existe cabelo errado. Existe fio mal lido.</h2>
            <p className="paragraph-md mb-2">
              Antes de qualquer tesoura tocar o seu cabelo, existe uma etapa que quase ninguém faz: ler o fio. Aqui no studio, essa etapa virou serviço — pra você que quer entender o próprio cabelo antes de decidir qualquer coisa.
            </p>
            <p className="paragraph-md mb-2">
              Não é avaliação de balcão, daquelas de cinco minutos com olhar de longe. É meia hora de análise de verdade, só sua.
            </p>
            <p className="paragraph-md mb-3">
              A gente começa pela escuta — sua rotina, seus hábitos, o que você já fez no cabelo e o que já fizeram nele. Depois eu vou pro couro cabeludo: análise completa de saúde, oleosidade e comportamento da raiz. Em seguida, o fio: curvatura real (a maioria das cabeças tem mais de uma), densidade, porosidade e memória de química — aquele histórico que o cabelo carrega mesmo quando você não conta.
            </p>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '1.5rem', marginBottom: '0.5rem', color: 'var(--accent)' }}>
              Você sai daqui com três coisas no bolso:
            </h3>
            <ul className="about-list" style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>
              <li>
                <div className="list-icon">✓</div>
                <span><strong>Orientação de produtos:</strong> O que usar, o que evitar e por quê no seu fio real.</span>
              </li>
              <li>
                <div className="list-icon">✓</div>
                <span><strong>Mapa de finalizações:</strong> Técnicas que funcionam pra sua curvatura e rotina real.</span>
              </li>
              <li>
                <div className="list-icon">✓</div>
                <span><strong>Cortes ideais:</strong> Recomendações para seu padrão de fio, formato de rosto e estilo.</span>
              </li>
            </ul>
            
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

      <section className="section-padding technique-section">
        <div className="container">
          <div className="text-center reveal mb-4">
            <h2 className="heading-md">Para quem é recomendado?</h2>
          </div>
          
          <div className="technique-grid">
            <div className="card reveal stagger-1">
              <span className="tech-emoji">🌱</span>
              <h3>Transição Capilar</h3>
              <p>Perfeito para quem está em transição e não sabe por onde começar a cuidar da nova textura.</p>
            </div>
            <div className="card reveal stagger-2">
              <span className="tech-emoji">🧴</span>
              <h3>Acerto de Produtos</h3>
              <p>Para quem já gastou muito com cremes e tratamentos que simplesmente não funcionaram no cabelo.</p>
            </div>
            <div className="card reveal stagger-3">
              <span className="tech-emoji">✂️</span>
              <h3>Evitar Erros</h3>
              <p>Para quem teve experiências ruins em salões e quer segurança antes de realizar qualquer corte.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-cta-bottom section-padding">
        <div className="container text-center reveal">
          <h2 className="heading-lg mb-2">Vagas limitadas por semana.</h2>
          <p className="paragraph-lg mb-4 max-w-md mx-auto">
            Reserve seu horário de análise individual e entenda de uma vez por todas o comportamento real dos seus fios.
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
