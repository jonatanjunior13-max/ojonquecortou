import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { Reveal, Arrow } from '../components/NewDesignComponents';

const ColoracaoCompletaPage = () => {
  return (
    <main>
      <SEO
        title="Coloração Completa | Cabelo Cacheado, Crespo e Ondulado | Studio do Jon"
        description="Mudanças radicais de cor com segurança em cabelo cacheado. Teste de mecha, aplicação técnica e tratamento imediato. Agende sua coloração em BH."
        url="/servicos/coloracao-completa"
      />

      <header className="hero">
        <div className="hero-blob" aria-hidden="true" />
        <div className="container">
          <div className="eyebrow reveal in" style={{ marginBottom: 36 }}>
            Coloração Completa — Mudanças Radicais
          </div>

          <div className="hero-grid">
            <div>
              <h1 className="display reveal in">
                Transforme a cor dos seus <span className="accent-word">fios com segurança</span>
              </h1>

              <Reveal delay={120}>
                <p className="lead" style={{ marginTop: 28 }}>
                  Coloração em cabelo cacheado exige diagnóstico preciso. Raiz processa cor mais lentamente. Pontas, já mais porosas, processam rápido. Aplicar o mesmo tempo em toda extensão gera resultado irregular. No Studio do Jon, avaliamos cada seção e aplicamos cor conforme a porosidade — resultado: cor uniforme de raiz à ponta.
                </p>
              </Reveal>

              <Reveal delay={220} className="hero-actions">
                <Link to="/agendar" className="btn btn-accent">
                  Agendar Coloração <Arrow />
                </Link>
                <Link to="/servicos" className="btn btn-ghost">
                  Ver Outros Serviços
                </Link>
              </Reveal>

              <Reveal delay={320} className="hero-meta">
                <div className="hero-stat">
                  <div className="n">A partir de</div>
                  <div className="l">R$ 499</div>
                </div>
                <div className="hero-stat">
                  <div className="n">30-45 min</div>
                  <div className="l">Aplicação técnica</div>
                </div>
                <div className="hero-stat">
                  <div className="n">100%</div>
                  <div className="l">Teste de mecha</div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </header>

      <section className="section-padding">
        <div className="container max-w-2xl">
          <Reveal as="h2" className="heading-lg mb-3">
            A química da coloração
          </Reveal>
          <Reveal as="p" className="paragraph-md mb-3">
            Tinta capilar deposita moléculas de corante dentro do córtex. Em fio liso, isso acontece de forma relativamente uniforme. Em fio com curvatura, a geometria espiral cria variação natural de porosidade — raiz menos porosa (fio novo), pontas mais porosas (expostas a mais ciclos).
          </Reveal>
          <Reveal as="p" className="paragraph-md mb-4">
            Aplicar o mesmo tempo em toda extensão gera resultado irregular. No Studio do Jon: Leitura de Fio completa → teste de mecha obrigatório → aplicação conforme porosidade de cada seção (raiz primeiro, pontas por último, com tempos reduzidos). Resultado: cor uniforme.
          </Reveal>
        </div>
      </section>

      <section className="section-padding bg-light">
        <div className="container">
          <Reveal as="h2" className="heading-lg text-center mb-4">
            Tipos de Coloração
          </Reveal>
          <div className="grid-3">
            <Reveal className="card">
              <h3 className="heading-md">Cobertura de Raiz Branca</h3>
              <p className="paragraph-sm">Cobertura completa de fios brancos/grisalhos com tinta opaca. Retoque a cada 4-6 semanas conforme crescimento natural.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Mudança Radical de Tom</h3>
              <p className="paragraph-sm">Transformações de cores contrastantes. Pode exigir descoloração parcial + tinta em múltiplas sessões espaçadas.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Aprofundamento de Tom</h3>
              <p className="paragraph-sm">Escurecer o tom atual (louro → castanho). Menos risco de dano. Geralmente funciona bem em uma única aplicação.</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container max-w-2xl">
          <Reveal as="h2" className="heading-lg mb-4">
            Protocolo Coloração Completa
          </Reveal>
          <div className="timeline">
            <Reveal className="timeline-item">
              <span className="timeline-marker">Leitura de Fio (15 min)</span>
              <p className="paragraph-sm">Avaliamos porosidade raiz vs pontas, histórico químico, saúde atual, pigmentação natural de base. Isso informa toda a estratégia de cor.</p>
            </Reveal>
            <Reveal className="timeline-item">
              <span className="timeline-marker">Conversa de Cor (10 min)</span>
              <p className="paragraph-sm">O que você realmente quer? Louro claro demanda tinta + possivelmente descolorante. Um tom mais escuro pode precisar só de tinta direta.</p>
            </Reveal>
            <Reveal className="timeline-item">
              <span className="timeline-marker">Teste de Mecha (15 min)</span>
              <p className="paragraph-sm">Aplicamos a cor em mecha discreta, aguardamos tempo real e avaliamos antes de aplicar na cabeça toda. Ajustamos se necessário.</p>
            </Reveal>
            <Reveal className="timeline-item">
              <span className="timeline-marker">Aplicação Técnica (30-45 min)</span>
              <p className="paragraph-sm">Dividimos em seções, aplicamos conforme porosidade mapeada. Raiz primeiro (~10 min), pontas depois (~5 min adicionais).</p>
            </Reveal>
            <Reveal className="timeline-item">
              <span className="timeline-marker">Enxague + Proteção (10 min)</span>
              <p className="paragraph-sm">Água filtrada fria → máscara proteica → selamento ácido. Reduz drasticamente o ressecamento pós-coloração.</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container max-w-2xl">
          <Reveal as="h2" className="heading-lg mb-4">
            Manutenção Pós-Coloração
          </Reveal>
          <div className="grid-2">
            <Reveal className="card">
              <h3 className="heading-md">Semana 1</h3>
              <p className="paragraph-sm">Apenas água filtrada, sem xampu. Deixa cor se estabilizar completamente no córtex.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Semana 2-4</h3>
              <p className="paragraph-sm">Xampu para cabelo colorido (suave) + máscara hidratante 1-2x/semana.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Mês 2+</h3>
              <p className="paragraph-sm">Tratamento mensal (R$ 130) para manter cor vibrante + Retoque de Raiz (R$ 180) a cada 4-6 semanas.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Dica: Combinação Ideal</h3>
              <p className="paragraph-sm">Coloração + Corte 1 semana depois. O corte complementa o resultado e valida a cor em forma definitiva.</p>
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
            <summary>Coloração completa funciona em cabelo em transição capilar?</summary>
            <p className="paragraph-sm" style={{ marginTop: 12 }}>Funciona, mas exige planejamento duplo — raiz natural e comprimento quimicamente tratado absorvem cor diferente. Geralmente tratamos como duas seções distintas dentro do mesmo atendimento.</p>
          </Reveal>
          <Reveal as="details" className="faq-item">
            <summary>Posso fazer coloração se já fiz progressiva recentemente?</summary>
            <p className="paragraph-sm" style={{ marginTop: 12 }}>Recomendamos aguardar e sempre fazer teste de mecha. Química residual da progressiva altera a forma como o fio reage ao novo processo.</p>
          </Reveal>
          <Reveal as="details" className="faq-item">
            <summary>Quanto tempo a cor dura antes de precisar retoque?</summary>
            <p className="paragraph-sm" style={{ marginTop: 12 }}>A raiz pede retoque a cada 4-6 semanas. O tom geral se mantém vibrante por 6-8 semanas com manutenção adequada.</p>
          </Reveal>
        </div>
      </section>

      <section className="section-padding text-center">
        <div className="container max-w-lg">
          <Reveal as="h2" className="heading-lg mb-3">
            Pronto para a transformação?
          </Reveal>
          <Reveal as="p" className="paragraph-md mb-4">
            Agende uma consulta com Leitura de Fio e teste de mecha obrigatório.
          </Reveal>
          <Reveal>
            <Link to="/agendar" className="btn btn-accent">
              Agendar Coloração Completa <Arrow />
            </Link>
          </Reveal>
        </div>
      </section>
    </main>
  );
};

export default ColoracaoCompletaPage;
