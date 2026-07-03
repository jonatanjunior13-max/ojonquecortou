import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const ColoracaoCompletaPage = () => {
  return (
    <main className="about-page">
      <SEO
        title="Coloração Completa | Cabelo Cacheado, Crespo e Ondulado | Studio do Jon"
        description="Mudanças radicais de cor com segurança em cabelo cacheado. Teste de mecha, aplicação técnica e tratamento imediato. Agende sua coloração em BH."
        url="/servicos/coloracao-completa"
      />
      <section className="about-hero section-padding">
        <div className="container text-center reveal active">
          <h1 className="heading-xl">Coloração <span className="text-gradient">Completa</span></h1>
          <p className="paragraph-lg max-w-lg mx-auto mt-2">
            Transforme a cor dos seus fios com segurança técnica em cada etapa.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container about-grid">
          <div className="about-visual reveal">
            <div className="about-image-wrap">
              <img src="/coloracao-completa-cachos-bh.webp" alt="Cabelo cacheado com coloração completa" className="about-image" />
            </div>
            <div className="experience-tag">
              <span className="exp-number">A partir de R$499</span>
              <span className="exp-text">Investimento</span>
            </div>
          </div>

          <div className="about-content reveal">
            <h2 className="heading-lg mb-2">Cor uniforme em fibra com variação natural de porosidade.</h2>
            <p className="paragraph-md mb-2">
              Coloração completa em cabelo cacheado exige diagnóstico preciso. A raiz, menos porosa, processa cor mais lentamente. As pontas, expostas a mais ciclos de lavagem, processam mais rápido. Aplicar o mesmo tempo em toda extensão gera resultado irregular.
            </p>
            <p className="paragraph-md mb-3">
              No Studio do Jon, iniciamos com Leitura de Fio completa, fazemos teste de mecha obrigatório, e aplicamos cor conforme a porosidade de cada seção — raiz primeiro, pontas por último, com tempos reduzidos. Resultado: cor uniforme do raiz à ponta.
            </p>
            <div className="cta-group">
              <Link to="/agendar" className="btn btn-primary">Agendar Coloração</Link>
              <Link to="/servicos" className="btn btn-outline">Outros Serviços</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-light">
        <div className="container">
          <h2 className="heading-lg text-center mb-3">Tipos de Coloração</h2>
          <div className="grid-3">
            <div className="card reveal">
              <h3 className="heading-md">Cobertura de Raiz Branca</h3>
              <p className="paragraph-sm">Cobertura completa de fios brancos/grisalhos com tinta opaca. Retoque a cada 4-6 semanas.</p>
            </div>
            <div className="card reveal">
              <h3 className="heading-md">Mudança Radical de Tom</h3>
              <p className="paragraph-sm">Transformações de cores contrastantes. Pode exigir descoloração parcial + tinta em múltiplas sessões.</p>
            </div>
            <div className="card reveal">
              <h3 className="heading-md">Aprofundamento de Tom</h3>
              <p className="paragraph-sm">Escurecer o tom atual. Menos risco de dano, funciona bem em uma única aplicação.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container max-w-lg">
          <h2 className="heading-lg text-center mb-3">Manutenção Pós-Coloração</h2>
          <div className="timeline">
            <div className="timeline-item reveal">
              <span className="timeline-marker">Semana 1</span>
              <p className="paragraph-sm">Apenas água filtrada, sem xampu — deixa cor se estabilizar no córtex.</p>
            </div>
            <div className="timeline-item reveal">
              <span className="timeline-marker">Semana 2-4</span>
              <p className="paragraph-sm">Xampu para colorido + máscara hidratante 1-2x/semana.</p>
            </div>
            <div className="timeline-item reveal">
              <span className="timeline-marker">Mês 2+</span>
              <p className="paragraph-sm">Tratamento mensal (R$130) + Retoque de Raiz (R$180) a cada 4-6 semanas.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container max-w-lg">
          <h2 className="heading-lg text-center mb-3">FAQ</h2>
          <details className="faq-item reveal">
            <summary>Coloração completa funciona em cabelo em transição capilar?</summary>
            <p className="paragraph-sm">Funciona, mas exige planejamento duplo — raiz natural e comprimento quimicamente tratado absorvem cor diferente. Geralmente aplicamos como duas seções distintas.</p>
          </details>
          <details className="faq-item reveal">
            <summary>Posso fazer coloração se já fiz progressiva recentemente?</summary>
            <p className="paragraph-sm">Recomendamos aguardar e sempre fazer teste de mecha. Química residual da progressiva altera a reação ao novo processo.</p>
          </details>
          <details className="faq-item reveal">
            <summary>Quanto tempo a cor dura antes de precisar retoque?</summary>
            <p className="paragraph-sm">A raiz pede retoque a cada 4-6 semanas. O tom geral se mantém vibrante por 6-8 semanas com manutenção adequada.</p>
          </details>
        </div>
      </section>

      <section className="section-padding text-center">
        <div className="container max-w-lg reveal">
          <h2 className="heading-lg mb-2">Pronto para a transformação?</h2>
          <p className="paragraph-md mb-3">
            Agende uma consulta com Leitura de Fio e teste de mecha. Vamos encontrar a cor ideal para você.
          </p>
          <Link to="/agendar" className="btn btn-primary">Agendar Coloração Completa</Link>
        </div>
      </section>
    </main>
  );
};

export default ColoracaoCompletaPage;
