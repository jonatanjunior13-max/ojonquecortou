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
      "name": "O que é o Big Chop e quando devo fazer?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "É o corte que remove toda a química de uma vez. A escolha é sua: podemos fazer o Big Chop direto se você já tiver comprimento suficiente, ou fazer cortes graduais para remover a química aos poucos."
      }
    },
    {
      "@type": "Question",
      "name": "Como lidar com as duas texturas durante o dia a dia?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Ensinamos técnicas de texturização sem fonte de calor para igualar o caimento da parte lisa com a raiz cacheada sem quebrar o fio."
      }
    },
    {
      "@type": "Question",
      "name": "Quanto tempo dura o processo de transição?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Depende da velocidade de crescimento do seu cabelo e do comprimento final que você deseja manter. O suporte técnico contínuo reduz a quebra nesse período."
      }
    }
  ]
};

const TransicaoCapilarPage = () => {
  return (
    <main className="about-page">
      <SEO 
        title="Transição Capilar BH | Studio do Jon — Especialista em Cachos" 
        description="Passando pela transição capilar em BH? O Studio do Jon oferece cortes progressivos e suporte técnico para recuperar seus cachos com segurança. Agende." 
        url="/servicos/transicao-capilar"
        schema={faqSchema}
      />
      <section className="about-hero section-padding">
        <div className="container text-center reveal active">
          <h1 className="heading-xl">Transição <span className="text-gradient">Capilar</span></h1>
          <p className="paragraph-lg max-w-lg mx-auto mt-2">
            Recupere a sua curvatura natural e reconstrua sua identidade sem pressa e com técnica.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container about-grid">
          <div className="about-visual reveal">
            <div className="about-image-wrap">
              <img src="/blog-transicao-bh.webp" alt="Transição capilar no Studio do Jon em BH" className="about-image" />
            </div>
            <div className="experience-tag">
              <span className="exp-number">A partir de R$130</span>
              <span className="exp-text">Sessão de Tratamento</span>
            </div>
          </div>
          
          <div className="about-content reveal">
            <h2 className="heading-lg mb-2">A transição capilar não é sobre paciência, é sobre técnica.</h2>
            <p className="paragraph-md mb-2">
              Cortar a parte com química exige entender a linha de demarcação exata onde o seu cacho natural volta a nascer. No Studio do Jon, ajudamos você a passar por esse processo de forma confortável, sem precisar recorrer ao Big Chop radical logo no primeiro dia — a menos que você queira. A transição capilar é o período de coexistência de duas texturas incompatíveis na mesma haste capilar: a base alisada (hidróxidos, tioglicolato ou ácidos orgânicos) e a raiz natural com padrão espiralado.
            </p>
            <p className="paragraph-md mb-3">
              O processo começa com a **Leitura de Fio**. Identificamos onde a química perdeu a força e onde a sua curvatura natural (seja ondulado tipo 2, cacheado tipo 3 ou crespo tipo 4) está se reestruturando. O corte é feito estrategicamente para disfarçar as pontas lisas enquanto o comprimento natural ganha espaço, mantendo a harmonia visual.
            </p>
            <div className="cta-group">
              <Link to="/agendar" className="btn btn-primary">Agendar Atendimento</Link>
              <Link to="/metodo" className="btn btn-outline">Ver as 7 Etapas</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding" style={{ background: 'var(--bg-warm)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <h2 className="heading-md mb-2">A Linha do Tempo da Transição Capilar</h2>
          <p className="paragraph-md mb-3">
            O tempo de transição varia conforme a taxa metabólica de crescimento de cada folículo e o comprimento final desejado. Veja as fases principais:
          </p>
          <div style={{ position: 'relative', borderLeft: '2px solid var(--accent)', paddingLeft: '20px', marginLeft: '10px' }} className="mb-4">
            <div className="mb-3">
              <span style={{ fontWeight: 'bold', color: 'var(--accent)', display: 'block' }}>1 a 3 Meses: A Linha de Demarcação</span>
              <p className="paragraph-md" style={{ fontSize: '0.9rem' }}>A raiz começa a crescer (cerca de 1 a 3 cm). A diferença de volume fica evidente e é a fase onde ocorre maior quebra física na junção exata das duas texturas devido à diferença de elasticidade.</p>
            </div>
            <div className="mb-3">
              <span style={{ fontWeight: 'bold', color: 'var(--accent)', display: 'block' }}>4 a 8 Meses: O Desafio do Volume</span>
              <p className="paragraph-md" style={{ fontSize: '0.9rem' }}>A raiz já possui tamanho para formar as primeiras espirais completas. Usamos técnicas de texturização para simular cachos nas pontas lisas, harmonizando o visual no dia a dia.</p>
            </div>
            <div className="mb-0">
              <span style={{ fontWeight: 'bold', color: 'var(--accent)', display: 'block' }}>9 Meses em diante: O Momento da Decisão</span>
              <p className="paragraph-md" style={{ fontSize: '0.9rem' }}>Com 10 cm ou mais de cabelo natural, o caimento da raiz começa a ter sustentação própria. É a fase ideal para realizar o **Big Chop** ou continuar com cortes de transição suaves a cada 60 dias.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container" style={{ maxWidth: '800px' }}>
          <h2 className="heading-md mb-2">Guia Prático: Como Manejar as Duas Texturas sem Calor</h2>
          <p className="paragraph-md mb-3">
            O uso frequente de chapinha ou secador quente na raiz em transição causa danos térmicos irreversíveis nas novas células de queratina, impedindo que o cabelo nasça com sua curvatura ideal. Recomendamos métodos físicos de estilização:
          </p>
          <ul className="about-list mb-4">
            <li>
              <div className="list-icon">✓</div>
              <span><strong>Plopping com Camiseta de Algodão:</strong> Retira o excesso de umidade sem atrito, ajudando a acentuar a curvatura da raiz sem gerar frizz nas pontas lisadas.</span>
            </li>
            <li>
              <div className="list-icon">✓</div>
              <span><strong>Texturização com Coquinhos ou Tranças:</strong> Aplique creme de pentear de fixação média nas partes lisas e faça tranças soltas ou pequenos coquinhos antes de dormir para uniformizar as ondulações.</span>
            </li>
            <li>
              <div className="list-icon">✓</div>
              <span><strong>Dedoliss Seletivo:</strong> Enrole mecha por mecha ao redor dos dedos nas regiões onde a transição da textura é mais brusca (como topo da cabeça e contorno do rosto).</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="section-padding technique-section" style={{ background: 'var(--bg-warm)' }}>
        <div className="container">
          <div className="text-center reveal mb-4">
            <h2 className="heading-md">Suporte Completo na Transição</h2>
          </div>
          
          <div className="technique-grid">
            <div className="card reveal stagger-1">
              <span className="tech-emoji">✂️</span>
              <h3>Cortes Adaptativos</h3>
              <p>Cortes graduais estrategicamente pensados para remover as pontas lisas aos poucos, mantendo o formato, a moldura do rosto e o comprimento confortável.</p>
            </div>
            <div className="card reveal stagger-2">
              <span className="tech-emoji">🌱</span>
              <h3>Saúde Folicular</h3>
              <p>Tratamentos específicos de desintoxicação e terapia capilar para o couro cabeludo, estimulando a circulação sanguínea e acelerando o crescimento saudável dos novos fios.</p>
            </div>
            <div className="card reveal stagger-3">
              <span className="tech-emoji">🎓</span>
              <h3>Treino de Estilização</h3>
              <p>Aprenda na prática técnicas de finalização e texturização sem fontes de calor para disfarçar o liso químico com segurança.</p>
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
          <h2 className="heading-lg mb-2">Pronta para redefinir seu visual?</h2>
          <p className="paragraph-lg mb-4 max-w-md mx-auto">
            Agende uma avaliação e vamos criar uma estratégia de corte confortável para o seu crescimento natural.
          </p>
          <Link to="/agendar" className="btn btn-primary">
            Agendar Transição Capilar
          </Link>
        </div>
      </section>
    </main>
  );
};

export default TransicaoCapilarPage;
