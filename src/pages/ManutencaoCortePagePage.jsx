import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const ManutencaoCortePagePage = () => {
  return (
    <main className="about-page">
      <SEO
        title="Manutenção de Corte | Retoque para Clientes Recorrentes | Studio do Jon"
        description="Mantenha seu corte de cacho perfeito com retoques regulares. Lapidação seca, restauração de linhas. R$ 130. Agende em BH."
        url="/servicos/manutencao-corte"
      />
      <section className="about-hero section-padding">
        <div className="container text-center reveal active">
          <h1 className="heading-xl">Manutenção de <span className="text-gradient">Corte</span></h1>
          <p className="paragraph-lg max-w-lg mx-auto mt-2">
            Restaure as linhas do seu corte híbrido sem refazer do zero.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container about-grid">
          <div className="about-visual reveal">
            <div className="about-image-wrap">
              <img src="/corte-hibrido-manutencao-bh.webp" alt="Manutenção de corte cacheado" className="about-image" />
            </div>
            <div className="experience-tag">
              <span className="exp-number">R$ 130</span>
              <span className="exp-text">45 minutos</span>
            </div>
          </div>

          <div className="about-content reveal">
            <h2 className="heading-lg mb-2">Ajuste cirúrgico para manter forma impecável.</h2>
            <p className="paragraph-md mb-2">
              Um corte híbrido bem estruturado dura 3-4 meses antes de começar a "descer". A manutenção não refaz o corte do zero — é uma lapidação seca que restaura as linhas originais, removendo fios fora de lugar e reafirmando simetria.
            </p>
            <p className="paragraph-md mb-3">
              A cada 4 semanas, você volta para ajuste rápido. Isso custuma muito menos que refazer o corte completo e mantém o investimento original funcionando por mais tempo.
            </p>
            <div className="cta-group">
              <Link to="/agendar" className="btn btn-primary">Agendar Manutenção</Link>
              <Link to="/servicos" className="btn btn-outline">Outros Serviços</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-light">
        <div className="container">
          <h2 className="heading-lg text-center mb-3">Manutenção vs. Corte Completo</h2>
          <div className="grid-3">
            <div className="card reveal">
              <h3 className="heading-md">Manutenção</h3>
              <p className="paragraph-sm"><strong>R$ 130 | 45 min</strong></p>
              <p className="paragraph-sm">Ajuste de linhas existentes. Sem Leitura de Fio nova. Para clientes recorrentes.</p>
            </div>
            <div className="card reveal">
              <h3 className="heading-md">Corte Completo</h3>
              <p className="paragraph-sm"><strong>R$ 190 | 60 min</strong></p>
              <p className="paragraph-sm">Nova Leitura de Fio, novo planejamento, corte do zero.</p>
            </div>
            <div className="card reveal">
              <h3 className="heading-md">Corte Drástico</h3>
              <p className="paragraph-sm"><strong>R$ 250+ | customizado</strong></p>
              <p className="paragraph-sm">Mudança radical de estilo ou comprimento.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container max-w-lg">
          <h2 className="heading-lg text-center mb-3">Cronograma Ideal</h2>
          <div className="timeline">
            <div className="timeline-item reveal">
              <span className="timeline-marker">Semanas 1-4</span>
              <p className="paragraph-sm">Corte ainda perfeito. Nenhuma manutenção necessária.</p>
            </div>
            <div className="timeline-item reveal">
              <span className="timeline-marker">Semanas 5-8</span>
              <p className="paragraph-sm">Ainda funciona bem. Manutenção opcional.</p>
            </div>
            <div className="timeline-item reveal">
              <span className="timeline-marker">Semanas 9-12</span>
              <p className="paragraph-sm">Começa a "descer". <strong>Manutenção recomendada (R$ 130)</strong></p>
            </div>
            <div className="timeline-item reveal">
              <span className="timeline-marker">Semanas 13-16</span>
              <p className="paragraph-sm">Crescimento significativo. Corte Completo (R$ 190) ou Manutenção maior.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container max-w-lg">
          <h2 className="heading-lg text-center mb-3">FAQ</h2>
          <details className="faq-item reveal">
            <summary>Posso fazer Manutenção se cortei em outro salão?</summary>
            <p className="paragraph-sm">Não recomendamos. A Manutenção pressupõe conhecimento da estrutura exata do corte anterior feito aqui. Nesse caso, o Corte Completo é o melhor caminho.</p>
          </details>
          <details className="faq-item reveal">
            <summary>A Manutenção inclui lavagem?</summary>
            <p className="paragraph-sm">Sim. Lavamos antes da lapidação seca para garantir avaliação em condições padronizadas.</p>
          </details>
          <details className="faq-item reveal">
            <summary>Posso pedir para mudar o comprimento durante a Manutenção?</summary>
            <p className="paragraph-sm">Pequenos ajustes pontuais são possíveis. Mudanças estruturais maiores exigem reclassificação como Corte Completo.</p>
          </details>
        </div>
      </section>

      <section className="section-padding text-center">
        <div className="container max-w-lg reveal">
          <h2 className="heading-lg mb-2">Mantenha seu corte impecável</h2>
          <p className="paragraph-md mb-3">
            Agende sua manutenção agora e estique a vida útil do seu corte híbrido.
          </p>
          <Link to="/agendar" className="btn btn-primary">Agendar Manutenção</Link>
        </div>
      </section>
    </main>
  );
};

export default ManutencaoCortePagePage;
