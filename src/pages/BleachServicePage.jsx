import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

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
    <main className="about-page">
      <SEO 
        title="Descoloração e Mechas em Cabelo Cacheado BH | Studio do Jon" 
        description="Ilumine seus cachos sem perder a definição. Protocolo exclusivo em Belo Horizonte com teste de mecha, Plex e reacidificação pós-química. Agende." 
        url="/servicos/descoloracao-cabelo-cacheado"
        schema={faqSchema}
      />
      <section className="about-hero section-padding">
        <div className="container text-center reveal active">
          <h1 className="heading-xl">Descoloração de <span className="text-gradient">Cachos</span></h1>
          <p className="paragraph-lg max-w-lg mx-auto mt-2">
            Ilumine seus fios sem perder a definição e a integridade da sua curvatura natural.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container about-grid">
          <div className="about-visual reveal">
            <div className="about-image-wrap">
              <img src="/coloracao-ruivo-cachos-explosao.webp" alt="Cabelo cacheado descolorido e iluminado com técnica segura" className="about-image" />
            </div>
            <div className="experience-tag">
              <span className="exp-number">A partir de R$699</span>
              <span className="exp-text">Investimento</span>
            </div>
          </div>
          
          <div className="about-content reveal">
            <h2 className="heading-lg mb-2">Química em cacho exige respeito e ciência.</h2>
            <p className="paragraph-md mb-2">
              A descoloração é um processo químico de oxidação que remove os grânulos de melanina natural localizados no córtex do fio. No entanto, em cabelos texturizados (curvaturas de 2 a 4), esse processo também ataca as pontes de hidrogênio e as ligações cisteínicas (pontes de dissulfeto). Quando essas pontes são rompidas sem proteção, o cabelo perde a elasticidade mecânica, fazendo com que o cacho estique, perca a definição e sofra corte químico ou quebra.
            </p>
            <p className="paragraph-md mb-3">
              No Studio do Jon, a descoloração só começa após a aplicação completa do <strong>Método Leitura de Fio</strong>. Nós avaliamos a porosidade, a elasticidade e o histórico químico dos seus fios em um teste de mecha rigoroso antes de encostar qualquer produto químico na sua cabeça.
            </p>
            <div className="cta-group">
              <Link to="/agendar" className="btn btn-primary">Agendar Avaliação</Link>
              <Link to="/servicos" className="btn btn-outline">Outros Serviços</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding" style={{ background: 'var(--bg-warm)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <h2 className="heading-md mb-2">Por que o nosso protocolo protege seu cabelo?</h2>
          <p className="paragraph-md mb-3">
            Diferente dos salões convencionais que usam descolorantes ultra rápidos com água oxigenada de volumagem alta para acelerar o fluxo de clientes, nós adotamos uma descoloração lenta e controlada. Veja os pilares de segurança que usamos:
          </p>
          <ul className="about-list mb-4">
            <li>
              <div className="list-icon">✓</div>
              <span><strong>Aditivo Plex de Proteção Interna:</strong> Misturamos agentes protetores de pontes moleculares diretamente ao pó descolorante. Eles atuam como um escudo sacrificial, absorvendo a agressão oxidativa antes que ela rompa o córtex do cacho.</span>
            </li>
            <li>
              <div className="list-icon">✓</div>
              <span><strong>Oxidação de Baixa Volumagem:</strong> Preferimos trabalhar com oxidantes de 10 ou 20 volumes em sessões mais longas. O clareamento lento preserva os lipídios naturais que impedem o ressecamento extremo e mantêm o cacho unido.</span>
            </li>
            <li>
              <div className="list-icon">✓</div>
              <span><strong>Acidificação e Neutralização Imediata:</strong> Após o clareamento, o PH do cabelo sobe a níveis alcalinos extremos (9.0 a 11.0). Aplicamos imediatamente um tratamento reacidificante profissional para trazer o PH de volta ao nível ácido saudável (4.5 a 5.0), selando a cutícula e retendo a nova cor.</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="section-padding">
        <div className="container" style={{ maxWidth: '800px' }}>
          <h2 className="heading-md text-center mb-3">Calendário de Preparação Pré-Química (15 dias antes)</h2>
          <p className="paragraph-md mb-3 text-center">
            Para garantir que sua fibra capilar resista ao teste de mecha e clareie de forma saudável, siga este cronograma doméstico:
          </p>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="paragraph-md mb-2"><strong>15 dias antes:</strong> Faça uma nutrição profunda com máscara rica em óleos vegetais biocompatíveis (coco, argan, abacate). Fios cacheados são naturalmente carentes de lipídios nas pontas.</p>
            <p className="paragraph-md mb-2"><strong>7 dias antes:</strong> Aplique uma máscara reconstrutora de queratina vegetal ou aminoácidos para reforçar o córtex capilar.</p>
            <p className="paragraph-md mb-2"><strong>3 dias antes:</strong> Evite lavar o cabelo. O sebo natural produzido pelo couro cabeludo serve como uma barreira protetora ácida contra a ação alcalina do descolorante.</p>
            <p className="paragraph-md mb-0"><strong>No dia:</strong> Venha com o cabelo seco, desembaraçado e sem finalizadores pesados ou géis à base de álcool.</p>
          </div>
        </div>
      </section>

      <section className="section-padding technique-section">
        <div className="container">
          <div className="text-center reveal mb-4">
            <h2 className="heading-md">Diferenciais do Nosso Protocolo</h2>
          </div>
          
          <div className="technique-grid">
            <div className="card reveal stagger-1">
              <span className="tech-emoji">🔬</span>
              <h3>Teste de Mecha</h3>
              <p>Rigorosa avaliação prévia de resistência e compatibilidade química do seu fio. Se o cabelo não passar, não realizamos o procedimento e montamos um cronograma de recuperação.</p>
            </div>
            <div className="card reveal stagger-2">
              <span className="tech-emoji">🧪</span>
              <h3>Plex Integrado</h3>
              <p>Uso de protetores de ligações químicas durante a descoloração para evitar danos na estrutura interna e perda de curvatura.</p>
            </div>
            <div className="card reveal stagger-3">
              <span className="tech-emoji">💧</span>
              <h3>Tratamento Pós-Química</h3>
              <p>Protocolo imediato de reposição lipídica e ácida para fechar as cutículas e reter a hidratação dentro do fio clareado.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="service-faq-section section-padding" style={{ background: 'var(--bg-warm)' }}>
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

      <section className="about-cta-bottom section-padding">
        <div className="container text-center reveal">
          <h2 className="heading-lg mb-2">Pronta para mudar com segurança?</h2>
          <p className="paragraph-lg mb-4 max-w-md mx-auto">
            Agende uma avaliação com teste de mecha e vamos planejar a iluminação ideal para preservar a identidade do seu cacho.
          </p>
          <Link to="/agendar" className="btn btn-primary">
            Agendar minha avaliação agora
          </Link>
        </div>
      </section>
    </main>
  );
};

export default BleachServicePage;
