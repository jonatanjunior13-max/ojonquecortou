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
    <main>
      <SEO
        title="Transição Capilar BH | Studio do Jon — Especialista em Cachos"
        description="Passando pela transição capilar em BH? O Studio do Jon oferece cortes progressivos e suporte técnico para recuperar seus cachos com segurança. Agende."
        url="/servicos/transicao-capilar"
        schema={faqSchema}
      />

      <header className="hero">
        <div className="hero-blob" aria-hidden="true" />
        <div className="container">
          <div className="eyebrow reveal in" style={{ marginBottom: 36 }}>
            Transição Capilar — Recuperação Técnica
          </div>

          <div className="hero-grid">
            <div>
              <h1 className="display reveal in">
                Recupere sua curvatura <span className="accent-word">sem pressa</span>
              </h1>

              <Reveal delay={120}>
                <p className="lead" style={{ marginTop: 28 }}>
                  Transição capilar não é sobre paciência — é sobre técnica. Coexistência de duas texturas incompatíveis (alisada + raiz natural) exige cortes estratégicos para disfarçar pontas lisas enquanto comprimento natural ganha espaço. Ensinar técnicas de texturização sem calor para manter harmonia visual.
                </p>
              </Reveal>

              <Reveal delay={220} className="hero-actions">
                <Link to="/agendar" className="btn btn-accent">
                  Agendar Atendimento <Arrow />
                </Link>
                <Link to="/servicos" className="btn btn-ghost">
                  Ver Outros Serviços
                </Link>
              </Reveal>

              <Reveal delay={320} className="hero-meta">
                <div className="hero-stat">
                  <div className="n">Gradual ou Big Chop</div>
                  <div className="l">Sua escolha</div>
                </div>
                <div className="hero-stat">
                  <div className="n">A partir de</div>
                  <div className="l">R$ 130</div>
                </div>
                <div className="hero-stat">
                  <div className="n">Suporte contínuo</div>
                  <div className="l">Reduz quebra</div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </header>

      <section className="section-padding">
        <div className="container max-w-2xl">
          <Reveal as="h2" className="heading-lg mb-3">
            Entenda a transição capilar
          </Reveal>
          <Reveal as="p" className="paragraph-md mb-3">
            Transição é período de coexistência de duas texturas incompatíveis na mesma haste: base alisada (hidróxidos, tioglicolato, ácidos orgânicos) + raiz natural com padrão espiralado. Cortar linha de demarcação exata exige leitura precisa de onde química perdeu força.
          </Reveal>
          <Reveal as="p" className="paragraph-md mb-4">
            Identificamos onde sua curvatura natural (ondulado tipo 2, cacheado tipo 3 ou crespo tipo 4) está se reestruturando. O corte é estratégico para disfarçar pontas lisas enquanto comprimento natural ganha espaço, mantendo harmonia visual.
          </Reveal>
        </div>
      </section>

      <section className="section-padding bg-light">
        <div className="container max-w-2xl">
          <Reveal as="h2" className="heading-lg mb-4">
            A Linha do Tempo da Transição Capilar
          </Reveal>
          <div className="timeline">
            <Reveal className="timeline-item">
              <span className="timeline-marker">1 a 3 Meses: A Linha de Demarcação</span>
              <p className="paragraph-sm">Raiz começa a crescer (~1-3 cm). Diferença de volume fica evidente. Fase com maior quebra física na junção exata das duas texturas.</p>
            </Reveal>
            <Reveal className="timeline-item">
              <span className="timeline-marker">4 a 8 Meses: O Desafio do Volume</span>
              <p className="paragraph-sm">Raiz possui tamanho para formar primeiras espirais completas. Usamos técnicas de texturização para simular cachos nas pontas lisas, harmonizando visual.</p>
            </Reveal>
            <Reveal className="timeline-item">
              <span className="timeline-marker">9 Meses em diante: O Momento da Decisão</span>
              <p className="paragraph-sm">Com 10 cm+ de cabelo natural, caimento da raiz começa a ter sustentação própria. Ideal para fazer Big Chop ou continuar com cortes suaves a cada 60 dias.</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container max-w-2xl">
          <Reveal as="h2" className="heading-lg mb-4">
            Manejar as Duas Texturas Sem Calor
          </Reveal>
          <Reveal as="p" className="paragraph-md mb-4">
            Uso frequente de chapinha ou secador quente causa danos térmicos irreversíveis nas novas células de queratina. Recomendamos métodos físicos de estilização:
          </Reveal>
          <div className="grid-3">
            <Reveal className="card">
              <h3 className="heading-md">Plopping com Camiseta</h3>
              <p className="paragraph-sm">Retira excesso de umidade sem atrito. Acentua curvatura da raiz sem gerar frizz nas pontas lisadas.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Texturização com Coquinhos</h3>
              <p className="paragraph-sm">Aplique creme de pentear nas partes lisas. Faça tranças soltas ou coquinhos antes de dormir para uniformizar ondulações.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Dedoliss Seletivo</h3>
              <p className="paragraph-sm">Enrole mecha por mecha ao redor dos dedos nas regiões de transição mais brusca (topo e contorno do rosto).</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container max-w-2xl">
          <Reveal as="h2" className="heading-lg mb-4">
            Suporte Completo na Transição
          </Reveal>
          <div className="grid-3">
            <Reveal className="card">
              <h3 className="heading-md">✂️ Cortes Adaptativos</h3>
              <p className="paragraph-sm">Cortes graduais estrategicamente pensados para remover pontas lisas aos poucos, mantendo formato, moldura do rosto e comprimento confortável.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">🌱 Saúde Folicular</h3>
              <p className="paragraph-sm">Tratamentos específicos de desintoxicação e terapia capilar para o couro, estimulando circulação sanguínea e acelerando crescimento saudável.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">🎓 Treino de Estilização</h3>
              <p className="paragraph-sm">Aprenda na prática técnicas de finalização e texturização sem fontes de calor para disfarçar o liso químico com segurança.</p>
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
            <summary>O que é o Big Chop?</summary>
            <p className="paragraph-sm" style={{ marginTop: 12 }}>Corte que remove toda química de uma vez. Sua escolha: Big Chop direto se tiver comprimento, ou cortes graduais para remover aos poucos.</p>
          </Reveal>
          <Reveal as="details" className="faq-item">
            <summary>Como lidar com as duas texturas?</summary>
            <p className="paragraph-sm" style={{ marginTop: 12 }}>Ensinamos técnicas de texturização sem fonte de calor para igualar caimento da parte lisa com raiz cacheada sem quebrar o fio.</p>
          </Reveal>
          <Reveal as="details" className="faq-item">
            <summary>Quanto tempo dura a transição?</summary>
            <p className="paragraph-sm" style={{ marginTop: 12 }}>Depende da velocidade de crescimento e comprimento final desejado. Suporte técnico contínuo reduz quebra nesse período.</p>
          </Reveal>
        </div>
      </section>

      <section className="section-padding text-center">
        <div className="container max-w-lg">
          <Reveal as="h2" className="heading-lg mb-3">
            Redefinir seu visual com técnica
          </Reveal>
          <Reveal as="p" className="paragraph-md mb-4">
            Agende uma avaliação e vamos criar estratégia de corte confortável para seu crescimento natural.
          </Reveal>
          <Reveal>
            <Link to="/agendar" className="btn btn-accent">
              Agendar Transição Capilar <Arrow />
            </Link>
          </Reveal>
        </div>
      </section>
    </main>
  );
};

export default TransicaoCapilarPage;
