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
    <main className="about-page">
      <SEO 
        title="Visagismo para Cabelos Cacheados em BH | Studio do Jon" 
        description="Valorize sua imagem através do visagismo especializado em cabelos cacheados em Belo Horizonte. Cortes estruturados para sua expressão e rotina. Agende." 
        url="/servicos/visagismo-cachos"
        schema={faqSchema}
      />
      <section className="about-hero section-padding">
        <div className="container text-center reveal active">
          <h1 className="heading-xl">Visagismo de <span className="text-gradient">Cachos</span></h1>
          <p className="paragraph-lg max-w-lg mx-auto mt-2">
            Mais do que um corte: uma escultura baseada na sua identidade, traços e caimento real dos fios.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container about-grid">
          <div className="about-visual reveal">
            <div className="about-image-wrap">
              <img src="/corte-visagista-cachos-bh.webp" alt="Cliente após corte de cabelo cacheado com visagismo" className="about-image" />
            </div>
            <div className="experience-tag">
              <span className="exp-number">Exclusivo</span>
              <span className="exp-text">Sem Fórmulas Prontas</span>
            </div>
          </div>
          
          <div className="about-content reveal">
            <h2 className="heading-lg mb-2">Por que copiar a influenciadora não funciona no seu cabelo.</h2>
            <p className="paragraph-md mb-2">
              É muito comum ver uma foto de corte na internet, salvá-la no celular e pedir para o cabeleireiro fazer igual. O problema é que o caimento de um cacho depende da densidade capilar, da elasticidade, de como os fios nascem no couro cabeludo e, acima de tudo, do formato do seu rosto e da sua rotina.
            </p>
            <p className="paragraph-md mb-3">
              O <strong>Visagismo aplicado a cachos</strong> no Studio do Jon adapta a geometria dos cortes (seja um Shaggy, Wolf Cut ou em camadas clássicas) para o seu biotipo físico e estilo de vida. O objetivo é criar uma forma harmônica que valorize seus melhores traços e seja fácil de manter em casa.
            </p>
            <div className="cta-group">
              <Link to="/agendar" className="btn btn-primary">Agendar Diagnóstico</Link>
              <Link to="/metodo" className="btn btn-outline">Ver o Método</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding" style={{ background: 'var(--bg-warm)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <h2 className="heading-md mb-2">A Ciência das Proporções Faciais no Cabelo Cacheado</h2>
          <p className="paragraph-md mb-3">
            O cabelo cacheado funciona como uma moldura tridimensional ativa. O volume das laterais ou do topo pode alterar completamente a percepção de largura e altura do rosto do cliente:
          </p>
          <ul className="about-list mb-4">
            <li>
              <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>Rosto Redondo:</span> Evitamos volume excessivamente horizontal nas laterais, concentrando camadas sutis no topo da cabeça para alongar verticalmente a silhueta.
            </li>
            <li style={{ marginTop: '10px' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>Rosto Quadrado:</span> Usamos linhas arredondadas e franjas desfiadas para suavizar a rigidez dos ângulos da mandíbula e da testa.
            </li>
            <li style={{ marginTop: '10px' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>Rosto Oblongo/Longo:</span> Adicionamos volume lateral controlado e franjas cheias na altura das sobrancelhas para encurtar visualmente o rosto.
            </li>
            <li style={{ marginTop: '10px' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>Rosto Coração:</span> Mantemos o topo mais limpo e projetamos o volume da altura das bochechas até o queixo para preencher visualmente o terço inferior mais estreito.
            </li>
          </ul>
        </div>
      </section>

      <section className="section-padding">
        <div className="container" style={{ maxWidth: '800px' }}>
          <h2 className="heading-md text-center mb-3">Cortes Icônicos Adaptados com Visagismo</h2>
          <p className="paragraph-md mb-4 text-center">
            Não impomos tendências; adaptamos cortes clássicos para que funcionem com o seu padrão de curvatura e densidade:
          </p>
          <div className="technique-grid">
            <div className="card reveal">
              <h3>Shaggy Hair</h3>
              <p>Camadas curtas no topo, franja desconectada e muita textura. Ideal para quem busca um visual despojado, volumoso e com muito balanço.</p>
            </div>
            <div className="card reveal">
              <h3>Wolf Cut</h3>
              <p>A fusão moderna entre o mullet e o shaggy. Perfeito para acentuar o volume da coroa mantendo o comprimento mais leve e alongado.</p>
            </div>
            <div className="card reveal">
              <h3>Bob em Camadas</h3>
              <p>O clássico atemporal que valoriza a linha do queixo e pescoço. O volume é distribuído na diagonal para evitar o formato triangular.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding technique-section" style={{ background: 'var(--bg-warm)' }}>
        <div className="container">
          <div className="text-center reveal mb-4">
            <h2 className="heading-md">As Etapas do Visagismo no Cacho</h2>
          </div>
          
          <div className="technique-grid">
            <div className="card reveal stagger-1">
              <span className="tech-emoji">📐</span>
              <h3>Análise de Proporções</h3>
              <p>Estudo do formato de rosto, linhas e pontos de destaque (olhos, maxilar, bochechas) com base nos terços faciais.</p>
            </div>
            <div className="card reveal stagger-2">
              <span className="tech-emoji">📋</span>
              <h3>Estilo de Vida</h3>
              <p>Conversa honesta sobre sua rotina de cuidados capilares para desenhar um corte prático que funcione sozinho em casa.</p>
            </div>
            <div className="card reveal stagger-3">
              <span className="tech-emoji">✂️</span>
              <h3>Escultura a Seco</h3>
              <p>O corte é finalizado cacho por cacho com o cabelo seco, respeitando as taxas de encolhimento individuais em tempo real.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="service-faq-section section-padding">
        <div className="container">
          <div className="text-center reveal mb-4">
            <h2 className="heading-md">Dúvidas Frequentes</h2>
          </div>
          <div className="faq-grid max-w-lg mx-auto">
            {faqSchema.mainEntity.map((faq, idx) => (
              <div className="faq-card reveal" key={idx} style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '8px', marginBottom: '15px' }}>
                <h4 style={{ color: 'var(--accent)', fontWeight: 'bold', marginBottom: '8px' }}>{faq.name}</h4>
                <p style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>{faq.acceptedAnswer.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="about-cta-bottom section-padding" style={{ background: 'var(--bg-warm)' }}>
        <div className="container text-center reveal">
          <h2 className="heading-lg mb-2">Descubra o corte ideal para a sua identidade</h2>
          <p className="paragraph-lg mb-4 max-w-md mx-auto">
            Agende seu diagnóstico de visagismo com o Jon e liberte o verdadeiro potencial do seu cabelo cacheado.
          </p>
          <Link to="/agendar" className="btn btn-primary">
            Garantir meu horário agora
          </Link>
        </div>
      </section>
    </main>
  );
};

export default VisagismServicePage;
