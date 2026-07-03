import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { Reveal, Arrow } from '../components/NewDesignComponents';

const TratamentoPersonalizadoPage = () => {
  return (
    <main>
      <SEO
        title="Tratamento Personalizado | Cabelo Cacheado em BH | Studio do Jon"
        description="Tratamento sob medida para seu tipo de cabelo. Diagnóstico técnico + protocolos customizados. Recupere força, hidratação e definição. Agende em Belo Horizonte."
        url="/servicos/tratamento-personalizado"
      />

      <header className="hero">
        <div className="hero-blob" aria-hidden="true" />
        <div className="container">
          <div className="eyebrow reveal in" style={{ marginBottom: 36 }}>
            Recuperação Capilar Sob Medida
          </div>

          <div className="hero-grid">
            <div>
              <h1 className="display reveal in">
                Tratamento que <span className="accent-word">respeita sua química</span>
              </h1>

              <Reveal delay={120}>
                <p className="lead" style={{ marginTop: 28 }}>
                  Cada fio é único. Porosidade, curvatura, espessura, histórico químico — tudo muda a absorção de ativos. Um tratamento que funciona em cabelo muito poroso pode danificar cabelo de baixa porosidade. No Studio do Jon, começamos com Leitura de Fio completa e desenhamos o protocolo específico para seu cabelo.
                </p>
              </Reveal>

              <Reveal delay={220} className="hero-actions">
                <Link to="/agendar" className="btn btn-accent">
                  Agendar Tratamento <Arrow />
                </Link>
                <Link to="/servicos" className="btn btn-ghost">
                  Ver Outros Serviços
                </Link>
              </Reveal>

              <Reveal delay={320} className="hero-meta">
                <div className="hero-stat">
                  <div className="n">A partir de</div>
                  <div className="l">R$ 180</div>
                </div>
                <div className="hero-stat">
                  <div className="n">60 minutos</div>
                  <div className="l">Diagnóstico + aplicação</div>
                </div>
                <div className="hero-stat">
                  <div className="n">100%</div>
                  <div className="l">Customizado</div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </header>

      <section className="section-padding">
        <div className="container max-w-2xl">
          <Reveal as="h2" className="heading-lg mb-3">
            Por que cabelo responde diferente a tratamentos
          </Reveal>
          <Reveal as="p" className="paragraph-md mb-3">
            Porosidade é a capacidade do fio absorver e reter água/ativos. Determinada pela geometria da cutícula (exterior do fio) e pela saúde do córtex (interior). Fio saudável tem cutículas alinhadas como telhas de telhado. Fio danificado tem cutículas levantadas, deixando o córtex exposto.
          </Reveal>
          <Reveal as="p" className="paragraph-md mb-4">
            Resultado: fio de alta porosidade absorve ativos rapidamente mas também perde água rapidamente. Fio de baixa porosidade é resistente, absorve lentamente e pode ficar ressecado se aplicarmos muito ativo. A Leitura de Fio mapeia isso em detalhes. O tratamento personalizado respeita essa realidade.
          </Reveal>
        </div>
      </section>

      <section className="section-padding bg-light">
        <div className="container">
          <Reveal as="h2" className="heading-lg text-center mb-4">
            Categorias de Tratamento
          </Reveal>
          <div className="grid-3">
            <Reveal className="card">
              <h3 className="heading-md">Hidratação Profunda</h3>
              <p className="paragraph-sm">Para cabelo ressecado, frizz, falta de brilho. Reposição de água no córtex com umectantes (glicerina, mel) + seladores de cutícula (óleos, silicones naturais).</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Reconstrução Proteica</h3>
              <p className="paragraph-sm">Para cabelo danificado, mechas, queda de fio. Restauração de proteínas quebradas (queratina, colágeno, elastina) + tratamento alcalino para realinhar cutícula.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Equilibrio pH</h3>
              <p className="paragraph-sm">Para cabelo quimicamente instável. Tratamento ácido (vinagre, ácido cítrico) fecha cutícula, estabiliza cor, reduz frizz. Essencial pós-química.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Detox + Limpeza</h3>
              <p className="paragraph-sm">Para cabelo com acúmulo de resíduo (silicone, sal, poluição). Limpeza profunda + destoxificante + reposição de nutrientes. Base para qualquer outro tratamento.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Anti-Frizz Selante</h3>
              <p className="paragraph-sm">Para controle de volume. Aplicação de polímeros que formam filme protetor, reduzindo umidade absorvida. Efeito dura 3-4 semanas.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Combinação Terapêutica</h3>
              <p className="paragraph-sm">Para cabelo com múltiplas demandas. Sequência: detox → reconstrução → hidratação → selamento. Processo 90 minutos, resultado transformador.</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container max-w-2xl">
          <Reveal as="h2" className="heading-lg mb-4">
            O Protocolo do Studio do Jon
          </Reveal>
          <div className="timeline">
            <Reveal className="timeline-item">
              <span className="timeline-marker">Leitura de Fio Completa (15 min)</span>
              <p className="paragraph-sm">Testamos porosidade (quanto tempo o fio absorve água em teste específico), elasticidade (quanto estica sem quebrar), curvatura, espessura, histórico químico, saúde atual. Isso define tudo.</p>
            </Reveal>
            <Reveal className="timeline-item">
              <span className="timeline-marker">Conversa de Demanda (10 min)</span>
              <p className="paragraph-sm">Você fala o que quer: mais brilho? Menos frizz? Cachos mais definidos? Força? Temos múltiplas combinações de ativos — escolhemos conforme sua demanda + resultado da leitura.</p>
            </Reveal>
            <Reveal className="timeline-item">
              <span className="timeline-marker">Seleção de Protocolo (5 min)</span>
              <p className="paragraph-sm">Baseado na leitura e sua demanda, desenhamos o mix exato: qual destoxificante, qual proteína, qual hidratante, qual selador. Tudo customizado para seu fio.</p>
            </Reveal>
            <Reveal className="timeline-item">
              <span className="timeline-marker">Aplicação Técnica (25-30 min)</span>
              <p className="paragraph-sm">Dividimos cabelo em 4-6 seções, aplicamos conforme porosidade mapeada. Pontas primeiro (mais porosas), raiz depois (menos porosa). Tempo de processamento varia por seção.</p>
            </Reveal>
            <Reveal className="timeline-item">
              <span className="timeline-marker">Enxague + Finalização (5 min)</span>
              <p className="paragraph-sm">Enxague em água filtrada fria (fecha cutícula), selamento ácido final, secagem com técnica que valoriza sua curvatura natural. Resultado imediato.</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container max-w-2xl">
          <Reveal as="h2" className="heading-lg mb-4">
            Mantendo o Resultado Após o Tratamento
          </Reveal>
          <div className="grid-2">
            <Reveal className="card">
              <h3 className="heading-md">Dia do Tratamento</h3>
              <p className="paragraph-sm">Não lave o cabelo por 24h. Os ativos continuam sendo absorvidos. Não use chapinha nem secador quente — deixe secar ao ar livre ou com ar morno.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Dias 2-7</h3>
              <p className="paragraph-sm">Lave com xampu suave (sem sulfato). Máscara hidratante 2-3x. Se fez um tratamento proteico pesado, evite muito calor — proteína endurece com calor em excesso.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Semana 2-4</h3>
              <p className="paragraph-sm">Use leave-in conforme porosidade (alta = mais leave-in, baixa = menos). Toque de finalizador para definição. Evite cloro (piscina) — oxida ativos, anula resultado.</p>
            </Reveal>
            <Reveal className="card">
              <h3 className="heading-md">Manutenção Mensal</h3>
              <p className="paragraph-sm">Se você faz muito calor/sol/cloro, repita o tratamento a cada 3-4 semanas. Caso contrário, a cada 4-6 semanas. Cada repetição acumula e potencializa.</p>
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
            <summary>Tratamento personalizado é o mesmo que "botox capilar"?</summary>
            <p className="paragraph-sm" style={{ marginTop: 12 }}>Não. Botox capilar é um produto específico (polímero + proteína + umectante) vendido em produto único. Tratamento personalizado é um protocolo customizado onde combinamos múltiplos ativos conforme sua necessidade. Botox pode ser PARTE de um tratamento personalizado, mas não é a totalidade.</p>
          </Reveal>
          <Reveal as="details" className="faq-item">
            <summary>Quanto tempo dura o resultado?</summary>
            <p className="paragraph-sm" style={{ marginTop: 12 }}>Depende do protocolo. Tratamentos hidratantes duram 2-3 semanas em cabelo de alta porosidade, até 4-5 semanas em baixa porosidade. Tratamentos proteicos duram mais (4-6 semanas). Resultado máximo atinge o pico no dia 3-4, depois vai gradualmente reduzindo conforme você lava.</p>
          </Reveal>
          <Reveal as="details" className="faq-item">
            <summary>Posso fazer tratamento personalizado todo mês?</summary>
            <p className="paragraph-sm" style={{ marginTop: 12 }}>Sim. Na verdade, essa é a frequência ideal para cabelo danificado ou muito exigido (muito calor, sol, química recente). Cada aplicação acumula benefício. Após 3-4 meses de tratamento mensal, você vê transformação profunda.</p>
          </Reveal>
          <Reveal as="details" className="faq-item">
            <summary>Funciona em cabelo muito poroso ou muito ressecado?</summary>
            <p className="paragraph-sm" style={{ marginTop: 12 }}>Sim, inclusive funciona MELHOR. Cabelo muito poroso absorve mais rápido, então resultado é mais intenso. A Leitura de Fio ajusta tempo e intensidade do tratamento para cabelos extremos. Geralmente começamos com hidratação simples, depois escalamos para reconstrução se necessário.</p>
          </Reveal>
          <Reveal as="details" className="faq-item">
            <summary>E se eu fizer coloração antes do tratamento?</summary>
            <p className="paragraph-sm" style={{ marginTop: 12 }}>Espere 5-7 dias. Cabelo colorido tem cutícula mais aberta nos dias seguintes. Aplicar outro tratamento pesado pode causar excesso de absorção ou instabilidade de cor. Passada uma semana, cutícula se estabiliza e tratamento adicional potencializa a cor.</p>
          </Reveal>
        </div>
      </section>

      <section className="section-padding text-center">
        <div className="container max-w-lg">
          <Reveal as="h2" className="heading-lg mb-3">
            Transforme seu cabelo do interior para fora
          </Reveal>
          <Reveal as="p" className="paragraph-md mb-4">
            Agende uma consulta. Começamos com Leitura de Fio, que leva 15 minutos e define tudo.
          </Reveal>
          <Reveal>
            <Link to="/agendar" className="btn btn-accent">
              Agendar Tratamento Personalizado <Arrow />
            </Link>
          </Reveal>
        </div>
      </section>
    </main>
  );
};

export default TratamentoPersonalizadoPage;
