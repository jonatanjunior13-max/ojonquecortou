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
      "name": "Preciso ir com o cabelo lavado de que forma?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Venha com o cabelo 100% seco, finalizado do seu jeito comum e totalmente desembaraçado. Não use coques, tranças ou presilhas que marquem o caimento natural."
      }
    },
    {
      "@type": "Question",
      "name": "Como funciona o Corte Híbrido?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "O corte é iniciado no cabelo molhado para definir a estrutura e comprimento com precisão técnica. Após a secagem e finalização, realizamos a lapidação a seco cacho por cacho para ajustar o volume e o caimento real."
      }
    },
    {
      "@type": "Question",
      "name": "Qual a frequência recomendada para manter o corte?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A média recomendada é a cada 3 ou 4 meses para manter o design e evitar pontas duplas que causam nós e quebra."
      }
    }
  ]
};

const CorteHibridoPage = () => {
  return (
    <main>
      <SEO
        title="Corte Híbrido Cabelo Cacheado BH | Studio do Jon"
        description="Especialista em corte de cabelo cacheado em Belo Horizonte. Conheça o Corte Híbrido: molhado para precisão e seco para caimento. Agende já."
        url="/servicos/corte-hibrido"
        schema={faqSchema}
      />

      <header className="hero">
        <div className="hero-blob" aria-hidden="true" />
        <div className="container">
          <div className="eyebrow reveal in" style={{ marginBottom: 36 }}>
            Corte Híbrido — Molhado + Seco
          </div>

          <div className="hero-grid">
            <div>
              <h1 className="display reveal in">
                A união perfeita entre <span className="accent-word">precisão e caimento real</span>
              </h1>

              <Reveal delay={120}>
                <p className="lead" style={{ marginTop: 28 }}>
                  Cortar apenas seco ou apenas molhado limita o resultado. Cada cacho tem fator de encolhimento único. Iniciamos com fios úmidos para estrutura base, depois lapidamos seco cacho por cacho. Resultado: volume e caimento que duram 3-4 meses.
                </p>
              </Reveal>

              <Reveal delay={220} className="hero-actions">
                <Link to="/agendar" className="btn btn-accent">
                  Agendar Corte Híbrido <Arrow />
                </Link>
                <Link to="/servicos" className="btn btn-ghost">
                  Ver Outros Serviços
                </Link>
              </Reveal>

              <Reveal delay={320} className="hero-meta">
                <div className="hero-stat">
                  <div className="n">R$ 190</div>
                  <div className="l">Investimento</div>
                </div>
                <div className="hero-stat">
                  <div className="n">60 min</div>
                  <div className="l">Atendimento completo</div>
                </div>
                <div className="hero-stat">
                  <div className="n">3-4 meses</div>
                  <div className="l">Duração do design</div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </header>

      <section className="section-padding">
        <div className="container max-w-2xl">
          <Reveal as="h2" className="heading-lg mb-3">
            Por que cortar apenas seco ou apenas molhado é limitar
          </Reveal>
          <Reveal as="p" className="paragraph-md mb-3">
            Cada cacho tem fator de encolhimento único e múltiplas texturas na mesma cabeça. Cortar às cegas ou seguir fórmula padrão resulta em assimetria e perda de controle sobre volume. O caimento real do cacho é dinâmico.
          </Reveal>
          <Reveal as="p" className="paragraph-md mb-4">
            No Studio do Jon, iniciamos com fios úmidos para estruturar base geométrica com precisão. Após secagem completa, lapidamos seco cacho por cacho. Isso permite visualizar volume e caimento real que terá no dia a dia. Todo atendimento precedido pelo Método Leitura de Fio de 7 etapas.
          </Reveal>
        </div>
      </section>

      <section className="section-padding bg-light">
        <div className="container max-w-2xl">
          <Reveal as="h2" className="heading-lg mb-4">
            Entenda: Seco vs. Molhado vs. Híbrido
          </Reveal>
          <div className="grid-3">
            <Reveal className="card">
              <h3 className="heading-md">Apenas Molhado</h3>
              <p className="paragraph-sm">Precisão geométrica nas linhas. Desvantagem: desconsidera fator de encolhimento. Ao secar, cachos encolhem em taxas diferentes, criando degraus.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Apenas Seco</h3>
              <p className="paragraph-sm">Respeita contração imediata do cacho, permite desenhar volume em tempo real. Desvantagem: falta alinhamento estrutural interno. Se escovado, base geométrica fica torta.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Corte Híbrido</h3>
              <p className="paragraph-sm"><strong>Nossa abordagem:</strong> combina base de precisão cirúrgica molhada com lapidação cacho a cacho seco. O melhor dos dois mundos.</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container max-w-2xl">
          <Reveal as="h2" className="heading-lg mb-4">
            Quem se beneficia do Corte Híbrido
          </Reveal>
          <Reveal as="p" className="paragraph-md mb-4">
            Método híbrido é especialmente desenhado para curvaturas tipo 2 (ondulados), 3 (cacheados) e 4 (crespos). Resolve os principais incômodos estruturais:
          </Reveal>
          <div className="grid-3">
            <Reveal className="card">
              <h3 className="heading-md">Múltiplas Curvaturas</h3>
              <p className="paragraph-sm">Raiz ondulada 2C + pontas 3B? Base molhada organiza comprimento total. Lapidação seca ajusta altura após encolhimento.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Controle de Volume</h3>
              <p className="paragraph-sm">Evita efeito "pirâmide" (topo sem volume, pontas excessivamente armadas). Distribuição inteligente de peso.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Definição Orgânica</h3>
              <p className="paragraph-sm">Pontas esculpidas conforme direção de nascimento natural dos fios. Cabelo se acomoda sozinho após lavagem.</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container max-w-2xl">
          <Reveal as="h2" className="heading-lg mb-4">
            As Três Fases da Execução Técnica
          </Reveal>
          <div className="timeline">
            <Reveal className="timeline-item">
              <span className="timeline-marker">1. Arquitetura Úmida</span>
              <p className="paragraph-sm">Fios umedecidos uniformemente. Traçamos linhas guias de base, nuca e perímetros laterais. Garante simetria de suporte.</p>
            </Reveal>
            <Reveal className="timeline-item">
              <span className="timeline-marker">2. Secagem & Análise</span>
              <p className="paragraph-sm">Finalização educativa e secagem com difusor profissional. Visualizamos caimento real e fator de encolhimento de cada zona.</p>
            </Reveal>
            <Reveal className="timeline-item">
              <span className="timeline-marker">3. Lapidação a Seco</span>
              <p className="paragraph-sm">Cacho por cacho, eliminamos pontas duplas, ajustamos distribuição de volumes, conectamos camadas. Escultura que garante crescimento bonito.</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container max-w-2xl">
          <Reveal as="h2" className="heading-lg mb-4">
            Preparação para seu Atendimento
          </Reveal>
          <Reveal as="p" className="paragraph-md mb-4">
            Para garantir eficácia do diagnóstico e lapidação seco:
          </Reveal>
          <div className="grid-2">
            <Reveal className="card">
              <h3 className="heading-md">Cabelo 100% Seco</h3>
              <p className="paragraph-sm">Não venha com fios úmidos ou molhados. Deve estar totalmente seco no caimento natural de uso diário.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Totalmente Desembaraçado</h3>
              <p className="paragraph-sm">Sem nós ou embaraços. Presença de nós impede divisão correta das mechas e pode causar tração dolorosa.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Sem Penteados ou Amarrações</h3>
              <p className="paragraph-sm">Evite coques, tranças, rabos, presilhas ou faixas. Esses acessórios alteram memória de curvatura do fio, mascarando volume real.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Finalizadores Leves</h3>
              <p className="paragraph-sm">Lave no dia anterior ou do atendimento com apenas creme de pentear leve. Evite géis pesados, óleos em excesso ou sprays.</p>
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
            <summary>Como funciona o Corte Híbrido?</summary>
            <p className="paragraph-sm" style={{ marginTop: 12 }}>Iniciado no cabelo molhado para estrutura. Após secagem, lapidação a seco cacho por cacho para ajustar volume e caimento real.</p>
          </Reveal>
          <Reveal as="details" className="faq-item">
            <summary>Qual a frequência recomendada?</summary>
            <p className="paragraph-sm" style={{ marginTop: 12 }}>A cada 3 ou 4 meses para manter design e evitar pontas duplas que causam nós e quebra.</p>
          </Reveal>
          <Reveal as="details" className="faq-item">
            <summary>Preciso ir com o cabelo lavado?</summary>
            <p className="paragraph-sm" style={{ marginTop: 12 }}>Venha com cabelo 100% seco, finalizado do seu jeito comum, totalmente desembaraçado. Sem coques, tranças ou presilhas.</p>
          </Reveal>
        </div>
      </section>

      <section className="section-padding text-center">
        <div className="container max-w-lg">
          <Reveal as="h2" className="heading-lg mb-3">
            Chega de cortes imprevisíveis
          </Reveal>
          <Reveal as="p" className="paragraph-md mb-4">
            Agende seu Corte Híbrido com Leitura de Fio inclusa por R$ 190. Um caimento planejado sob medida para a física do seu cacho.
          </Reveal>
          <Reveal>
            <Link to="/agendar" className="btn btn-accent">
              Agendar Corte Híbrido <Arrow />
            </Link>
          </Reveal>
        </div>
      </section>
    </main>
  );
};

export default CorteHibridoPage;
