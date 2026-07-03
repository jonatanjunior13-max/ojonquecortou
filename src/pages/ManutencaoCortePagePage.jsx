import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { Reveal, Arrow } from '../components/NewDesignComponents';

const ManutencaoCortePagePage = () => {
  return (
    <main>
      <SEO
        title="Manutenção de Corte | Retoque para Clientes Recorrentes | Studio do Jon"
        description="Mantenha seu corte de cacho perfeito com retoques regulares. Lapidação seca, restauração de linhas. R$ 130. Agende em BH."
        url="/servicos/manutencao-corte"
      />

      <header className="hero">
        <div className="hero-blob" aria-hidden="true" />
        <div className="container">
          <div className="eyebrow reveal in" style={{ marginBottom: 36 }}>
            Manutenção de Corte — Retoque Rápido
          </div>

          <div className="hero-grid">
            <div>
              <h1 className="display reveal in">
                Mantenha seu corte <span className="accent-word">impecável</span>
              </h1>

              <Reveal delay={120}>
                <p className="lead" style={{ marginTop: 28 }}>
                  Um corte híbrido bem estruturado dura 3-4 meses. A manutenção não refaz do zero — é lapidação seca que restaura linhas originais, removendo fios fora de lugar e reafirmando simetria. Custa bem menos que um corte completo novo.
                </p>
              </Reveal>

              <Reveal delay={220} className="hero-actions">
                <Link to="/agendar" className="btn btn-accent">
                  Agendar Manutenção <Arrow />
                </Link>
                <Link to="/servicos" className="btn btn-ghost">
                  Ver Outros Serviços
                </Link>
              </Reveal>

              <Reveal delay={320} className="hero-meta">
                <div className="hero-stat">
                  <div className="n">R$ 130</div>
                  <div className="l">Investimento</div>
                </div>
                <div className="hero-stat">
                  <div className="n">45 min</div>
                  <div className="l">Lapidação seca</div>
                </div>
                <div className="hero-stat">
                  <div className="n">3-4 meses</div>
                  <div className="l">Intervalo recomendado</div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </header>

      <section className="section-padding">
        <div className="container max-w-2xl">
          <Reveal as="h2" className="heading-lg mb-3">
            Ajuste cirúrgico para forma impecável
          </Reveal>
          <Reveal as="p" className="paragraph-md mb-3">
            Em cabelo liso, o crescimento "desce" de forma uniforme. Em cabelo com curvatura, conforme o fio novo nasce na raiz, ele se junta ao comprimento já processado — criando uma mistura de "camada nova, ainda sem curvatura definida" com "camada antiga, já na forma planejada". Isso pode fazer um corte bem estruturado parecer gradualmente desorganizado, mesmo sem perder comprimento significativo.
          </Reveal>
          <Reveal as="p" className="paragraph-md mb-4">
            A manutenção não refaz o corte — é um ajuste que restaura linhas originais, remova fios desalinhados e reafirma simetria. Lapidação seca minuciosa, sem Leitura de Fio nova (já conhecemos sua estrutura).
          </Reveal>
        </div>
      </section>

      <section className="section-padding bg-light">
        <div className="container">
          <Reveal as="h2" className="heading-lg text-center mb-4">
            Manutenção vs. Corte Completo
          </Reveal>
          <div className="grid-3">
            <Reveal className="card">
              <h3 className="heading-md">Manutenção</h3>
              <p className="paragraph-sm"><strong>R$ 130 | 45 min</strong> — Ajuste de linhas existentes. Sem Leitura de Fio nova. Para clientes recorrentes.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Corte Completo</h3>
              <p className="paragraph-sm"><strong>R$ 190 | 60 min</strong> — Nova Leitura de Fio, novo planejamento, corte do zero. Quando precisa reavaliar estrutura.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Corte Drástico</h3>
              <p className="paragraph-sm"><strong>R$ 250+ | customizado</strong> — Mudança radical de estilo ou comprimento. Requer nova estratégia visual.</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container max-w-2xl">
          <Reveal as="h2" className="heading-lg mb-4">
            Cronograma Ideal
          </Reveal>
          <div className="timeline">
            <Reveal className="timeline-item">
              <span className="timeline-marker">Semanas 1-4</span>
              <p className="paragraph-sm">Corte ainda perfeito. Sem necessidade de manutenção.</p>
            </Reveal>
            <Reveal className="timeline-item">
              <span className="timeline-marker">Semanas 5-8</span>
              <p className="paragraph-sm">Ainda funciona bem visualmente. Manutenção opcional.</p>
            </Reveal>
            <Reveal className="timeline-item">
              <span className="timeline-marker">Semanas 9-12</span>
              <p className="paragraph-sm"><strong>Começa a "descer"</strong>. Manutenção recomendada agora (R$ 130).</p>
            </Reveal>
            <Reveal className="timeline-item">
              <span className="timeline-marker">Semanas 13-16</span>
              <p className="paragraph-sm">Crescimento significativo. Corte Completo (R$ 190) ou Manutenção maior.</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container max-w-2xl">
          <Reveal as="h2" className="heading-lg mb-4">
            O Que Inclui
          </Reveal>
          <div className="grid-2">
            <Reveal className="card">
              <h3 className="heading-md">Análise Rápida (5 min)</h3>
              <p className="paragraph-sm">Como o cabelo cresceu? Há assimetria? Qual seção desceu mais? Análise ágil porque já conhecemos sua estrutura.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Lapidação Seca (30 min)</h3>
              <p className="paragraph-sm">Com cabelo seco nos cachos reais, ajustamos pontas, restauramos simetria, removemos fios fora de linha. Ajustes de 0,5-1,5cm cirúrgicos por ponto.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Finalização (5-10 min)</h3>
              <p className="paragraph-sm">Creme ou gel conforme sua curvatura já mapeada. Validação visual final do resultado.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Educação Incluída</h3>
              <p className="paragraph-sm">Relembramos como manter em casa, em qual direção pentear, técnicas de finalização ajustadas à estrutura.</p>
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
            <summary>Posso fazer Manutenção se cortei em outro salão?</summary>
            <p className="paragraph-sm" style={{ marginTop: 12 }}>Não recomendamos. Manutenção pressupõe conhecimento prévio da estrutura exata do corte anterior feito aqui. Nesse caso, Corte Completo é melhor.</p>
          </Reveal>
          <Reveal as="details" className="faq-item">
            <summary>A Manutenção inclui lavagem?</summary>
            <p className="paragraph-sm" style={{ marginTop: 12 }}>Sim. Lavamos antes da lapidação seca para garantir avaliação em condições padronizadas e cachos bem definidos.</p>
          </Reveal>
          <Reveal as="details" className="faq-item">
            <summary>Posso pedir para mudar o comprimento durante Manutenção?</summary>
            <p className="paragraph-sm" style={{ marginTop: 12 }}>Pequenos ajustes pontuais são possíveis. Mudanças estruturais maiores exigem reclassificação como Corte Completo.</p>
          </Reveal>
        </div>
      </section>

      <section className="section-padding text-center">
        <div className="container max-w-lg">
          <Reveal as="h2" className="heading-lg mb-3">
            Estique a vida útil do seu corte
          </Reveal>
          <Reveal as="p" className="paragraph-md mb-4">
            Manutenção regular = investimento original funcionando por mais tempo sem refazer do zero.
          </Reveal>
          <Reveal>
            <Link to="/agendar" className="btn btn-accent">
              Agendar Manutenção <Arrow />
            </Link>
          </Reveal>
        </div>
      </section>
    </main>
  );
};

export default ManutencaoCortePagePage;
