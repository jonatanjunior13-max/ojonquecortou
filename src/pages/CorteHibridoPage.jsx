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
    <main className="about-page">
      <SEO 
        title="Corte Híbrido Cabelo Cacheado BH | Studio do Jon" 
        description="Especialista em corte de cabelo cacheado em Belo Horizonte. Conheça o Corte Híbrido: molhado para precisão e seco para caimento. Agende já." 
        url="/servicos/corte-hibrido"
        schema={faqSchema}
      />
      <section className="about-hero section-padding">
        <div className="container text-center reveal active">
          <h1 className="heading-xl">Corte <span className="text-gradient">Híbrido</span></h1>
          <p className="paragraph-lg max-w-lg mx-auto mt-2">
            A união perfeita entre a precisão da linha molhada e a lapidação cacho por cacho a seco.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container about-grid">
          <div className="about-visual reveal">
            <div className="about-image-wrap">
              <img src="/corte-a-seco-cachos-definidos-bh.webp" alt="Corte Híbrido em cabelo cacheado no Studio do Jon" className="about-image" />
            </div>
            <div className="experience-tag">
              <span className="exp-number">R$ 190</span>
              <span className="exp-text">Valor do Investimento</span>
            </div>
          </div>
          
          <div className="about-content reveal">
            <h2 className="heading-lg mb-2">Cortar apenas a seco ou apenas molhado é limitar o caimento.</h2>
            <p className="paragraph-md mb-2">
              Cada cacho tem um fator de encolhimento único e múltiplas texturas na mesma cabeça. Cortar às cegas ou seguir uma fórmula padrão de revista resulta em assimetria e perda de controle sobre o volume. O caimento real do cacho é dinâmico e depende da gravidade, da densidade de fios por centímetro quadrado e do nível de encolhimento de cada mecha quando perde a umidade.
            </p>
            <p className="paragraph-md mb-3">
              No Studio do Jon, trabalhamos com o <strong>Corte Híbrido</strong>. Iniciamos o corte com os fios úmidos para estruturar a base geométrica com precisão cirúrgica. Após a finalização e secagem completa, lapidamos a seco cacho por cacho. Isso permite visualizar o volume e o caimento real que você terá no seu dia a dia.
            </p>
            <p className="paragraph-md mb-3">
              Todo atendimento é precedido pelo **Método Leitura de Fio** de 7 etapas para avaliar a saúde, elasticidade e curvatura do seu cabelo antes de qualquer tesourada.
            </p>
            <div className="cta-group">
              <Link to="/agendar" className="btn btn-primary">Agendar Atendimento</Link>
              <Link to="/metodo" className="btn btn-outline">Conhecer o Método</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding" style={{ background: 'var(--bg-warm)' }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <h2 className="heading-md text-center mb-3">Entenda a Diferença: Seco vs. Molhado vs. Híbrido</h2>
          <p className="paragraph-md mb-3">
            O mercado de salões de beleza costuma se dividir em dois extremos quando o assunto é cabelo texturizado: os que cortam apenas o cabelo molhado e esticado, e os que cortam estritamente a seco. Ambas as abordagens isoladas têm falhas estruturais graves:
          </p>
          <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', color: 'var(--text-main)', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--accent)', textAlign: 'left' }}>
                  <th style={{ padding: '12px', fontWeight: 'bold' }}>Método de Corte</th>
                  <th style={{ padding: '12px', fontWeight: 'bold' }}>Vantagens</th>
                  <th style={{ padding: '12px', fontWeight: 'bold' }}>Desvantagens nos Cachos</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>Apenas Molhado</td>
                  <td style={{ padding: '12px' }}>Precisão geométrica absoluta nas linhas de base e perímetros limpos.</td>
                  <td style={{ padding: '12px' }}>Desconsidera o fator de encolhimento. Ao secar, os cachos encolhem em taxas diferentes, criando degraus e buracos.</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>Apenas a Seco</td>
                  <td style={{ padding: '12px' }}>Respeita a contração imediata do cacho e permite desenhar o volume em tempo real.</td>
                  <td style={{ padding: '12px' }}>Falta de alinhamento estrutural interno. Se o cabelo for escovado ou molhar sob chuva, a base geométrica revela-se torta e irregular.</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--accent)', background: 'rgba(212, 175, 55, 0.05)' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: 'var(--accent)' }}>Corte Híbrido (Jon)</td>
                  <td style={{ padding: '12px', fontWeight: 600 }}>Combina a base de precisão cirúrgica molhada com a lapidação cacho a cacho a seco.</td>
                  <td style={{ padding: '12px' }}>Exige mais tempo de atendimento (aproximadamente 1 hora) e alta especialização técnica.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container" style={{ maxWidth: '800px' }}>
          <h2 className="heading-md mb-2">Quem se beneficia do Corte Híbrido?</h2>
          <p className="paragraph-md mb-3">
            O método híbrido é especialmente desenhado para quem possui curvaturas de tipo **2 (ondulados), 3 (cacheados) e 4 (crespos)**. Ele resolve os principais incômodos estruturais que clientes enfrentam em salões comuns:
          </p>
          <ul className="about-list mb-4">
            <li>
              <div className="list-icon">✓</div>
              <span><strong>Múltiplas Curvaturas na mesma cabeça:</strong> É comum ter raiz ondulada 2C e pontas cacheadas 3B. A base molhada organiza o comprimento total e a lapidação seca ajusta a diferença de altura após o encolhimento.</span>
            </li>
            <li>
              <div className="list-icon">✓</div>
              <span><strong>Controle de Densidade e Volume excessivo nas pontas:</strong> Evita o temido efeito "pirâmide" (cabelo sem volume no topo e excessivamente armado nas pontas), distribuindo o peso de maneira inteligente.</span>
            </li>
            <li>
              <div className="list-icon">✓</div>
              <span><strong>Definição e Balanço Orgânico:</strong> As pontas são esculpidas seguindo a direção de nascimento e caimento dos fios, garantindo que o cabelo se acomode sozinho após a lavagem doméstica.</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="section-padding technique-section">
        <div className="container">
          <div className="text-center reveal mb-4">
            <h2 className="heading-md">As Três Fases da Execução Técnica</h2>
          </div>
          
          <div className="technique-grid">
            <div className="card reveal stagger-1">
              <span className="tech-emoji">📐</span>
              <h3>1. Arquitetura Úmida</h3>
              <p>Com os fios umedecidos uniformemente, traçamos as linhas guias de base, nuca e perímetros laterais. Essa etapa garante a simetria de suporte e evita fios perdidos ou desalinhados.</p>
            </div>
            <div className="card reveal stagger-2">
              <span className="tech-emoji">✂️</span>
              <h3>2. Secagem & Análise</h3>
              <p>Realizamos a finalização educativa e secagem com difusor profissional sem manipulação brusca. Assim, visualizamos o caimento real e o fator de encolhimento natural de cada zona da cabeça.</p>
            </div>
            <div className="card reveal stagger-3">
              <span className="tech-emoji">⏱️</span>
              <h3>3. Lapidação a Seco</h3>
              <p>Cacho por cacho, eliminamos pontas duplas, ajustamos a distribuição de volumes e conectamos as camadas de transição. É a escultura que garante um crescimento bonito por meses.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding" style={{ background: 'var(--bg-warm)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <h2 className="heading-md mb-2">Instruções de Preparação para o seu Atendimento</h2>
          <p className="paragraph-md mb-3">
            Para garantir a eficácia do diagnóstico e da etapa de lapidação a seco, solicitamos que siga rigorosamente as orientações de preparação abaixo antes de comparecer ao Studio:
          </p>
          <ol style={{ paddingLeft: '20px', color: 'var(--text-main)', lineHeight: '1.7', fontSize: '0.95rem' }} className="mb-4">
            <li className="mb-2"><strong>Cabelo 100% Seco:</strong> Não venha com os fios úmidos ou molhados. O cabelo deve estar totalmente seco no seu caimento natural de uso diário.</li>
            <li className="mb-2"><strong>Desembaraçado por Completo:</strong> O cabelo deve estar sem nós ou embaraços. A presença de nós impede a divisão correta das mechas e pode causar tração dolorosa.</li>
            <li className="mb-2"><strong>Sem Penteados ou Amarrações:</strong> Evite usar coques, tranças, rabos de cavalo, presilhas ou faixas no dia. Esses acessórios alteram a memória de curvatura do fio, mascarando o volume real.</li>
            <li className="mb-2"><strong>Finalizadores Leves:</strong> Lave o cabelo no dia anterior ou no dia do atendimento usando apenas um creme de pentear leve. Evite o uso de géis pesados, gelatinas duras, óleos em excesso ou sprays fixadores que enrijecem a fibra capilar.</li>
          </ol>
        </div>
      </section>

      <section className="about-cta-bottom section-padding">
        <div className="container text-center reveal">
          <h2 className="heading-lg mb-2">Chega de cortes imprevisíveis.</h2>
          <p className="paragraph-lg mb-4 max-w-md mx-auto">
            Agende seu Corte Híbrido com Leitura de Fio inclusa por R$ 190. Um caimento planejado sob medida para a física do seu cacho.
          </p>
          <Link to="/agendar" className="btn btn-primary">
            Agendar Corte Híbrido agora
          </Link>
        </div>
      </section>
    </main>
  );
};

export default CorteHibridoPage;
