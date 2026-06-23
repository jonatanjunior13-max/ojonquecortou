import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const priceSchema = {
  "@context": "https://schema.org",
  "@type": "PriceSpecification",
  "name": "Corte especializado cabelo cacheado",
  "price": "190",
  "priceCurrency": "BRL",
  "url": "https://www.ojonquecortou.com.br/investimento"
};

const InvestimentoPage = () => {
  return (
    <main className="investimento-page" style={{ paddingTop: '5rem' }}>
      <SEO
        title="Investimento | Studio do Jon — Especialista em Cachos BH"
        description="Corte especializado com Método Leitura de Fio a partir de R$ 200. Descoloração e consultoria mediante consulta. Studio do Jon, Caiçaras, BH."
        url="/investimento"
        schema={priceSchema}
      />

      {/* Hero / Section 1 */}
      <section style={{
        padding: 'clamp(60px, 8vw, 120px) 0 clamp(40px, 5vw, 64px)',
        borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))',
      }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.7rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--muted, #a39687)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <span style={{ display: 'inline-block', width: 18, height: 1, background: 'var(--muted, #a39687)' }} />
            Valores & Serviços
          </p>

          <h1 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontWeight: 400,
            fontSize: 'clamp(2.25rem, 6vw, 3.75rem)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            color: 'var(--ink, #1A1310)',
            margin: '0 0 28px',
          }}>
            Investimento
          </h1>

          <p style={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: 'clamp(1rem, 2vw, 1.15rem)',
            lineHeight: 1.75,
            color: 'var(--muted, #a39687)',
            maxWidth: '65ch',
            margin: 0,
          }}>
            Antes de qualquer tesoura, vem o diagnóstico. O Método Leitura de Fio está incluído em todo atendimento — sem cobrança extra. O que você paga é pelo resultado que foi planejado desde o início.
          </p>
        </div>
      </section>

      {/* Section 2 — services and prices */}
      <section style={{ padding: 'clamp(60px, 8vw, 100px) 0' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Serviço 1 */}
            <div style={{
              padding: '32px',
              borderRadius: '8px',
              border: '1px solid var(--border, rgba(255,255,255,0.08))',
              background: 'rgba(255, 255, 255, 0.01)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                flexWrap: 'wrap',
                gap: '12px',
              }}>
                <h2 style={{
                  fontFamily: "'DM Serif Display', Georgia, serif",
                  fontSize: 'clamp(1.35rem, 3vw, 1.65rem)',
                  fontWeight: 400,
                  color: 'var(--ink, #1A1310)',
                  margin: 0,
                }}>
                  Corte especializado
                </h2>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)',
                  fontWeight: 600,
                  color: 'var(--accent, #C4738A)',
                }}>
                  R$ 190 a R$ 230
                </span>
              </div>
              <p style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: '0.975rem',
                lineHeight: 1.6,
                color: 'var(--muted, #a39687)',
                margin: 0,
              }}>
                Inclui: Leitura de Fio completa (7 etapas), corte, finalização como validação.
              </p>
            </div>

            {/* Serviço 2 */}
            <div style={{
              padding: '32px',
              borderRadius: '8px',
              border: '1px solid var(--border, rgba(255,255,255,0.08))',
              background: 'rgba(255, 255, 255, 0.01)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                flexWrap: 'wrap',
                gap: '12px',
              }}>
                <h2 style={{
                  fontFamily: "'DM Serif Display', Georgia, serif",
                  fontSize: 'clamp(1.35rem, 3vw, 1.65rem)',
                  fontWeight: 400,
                  color: 'var(--ink, #1A1310)',
                  margin: 0,
                }}>
                  Descoloração em cabelo cacheado
                </h2>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)',
                  fontWeight: 600,
                  color: 'var(--accent, #C4738A)',
                }}>
                  consultar
                </span>
              </div>
              <div style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: '0.975rem',
                lineHeight: 1.6,
                color: 'var(--muted, #a39687)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}>
                <p style={{ margin: 0 }}>
                  Inclui: diagnóstico de porosidade, análise de histórico químico, processo e finalização.
                </p>
                <p style={{ margin: 0, fontSize: '0.85rem', fontStyle: 'italic' }}>
                  *Valor varia conforme comprimento e estado do fio. Consulta prévia obrigatória.
                </p>
              </div>
            </div>

            {/* Serviço 3 */}
            <div style={{
              padding: '32px',
              borderRadius: '8px',
              border: '1px solid var(--border, rgba(255,255,255,0.08))',
              background: 'rgba(255, 255, 255, 0.01)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                flexWrap: 'wrap',
                gap: '12px',
              }}>
                <h2 style={{
                  fontFamily: "'DM Serif Display', Georgia, serif",
                  fontSize: 'clamp(1.35rem, 3vw, 1.65rem)',
                  fontWeight: 400,
                  color: 'var(--ink, #1A1310)',
                  margin: 0,
                }}>
                  Consultoria Leitura de Fio
                </h2>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)',
                  fontWeight: 600,
                  color: 'var(--accent, #C4738A)',
                }}>
                  consultar
                </span>
              </div>
              <p style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: '0.975rem',
                lineHeight: 1.6,
                color: 'var(--muted, #a39687)',
                margin: 0,
              }}>
                Para quem quer só o diagnóstico, sem corte. Inclui análise completa do fio e orientações de cuidado personalizadas.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Section 3 — CTA */}
      <section style={{
        padding: 'clamp(60px, 8vw, 100px) 0',
        borderTop: '1px solid var(--border, rgba(255,255,255,0.08))',
        textAlign: 'center',
      }}>
        <div className="container" style={{
          maxWidth: 800,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
        }}>
          <p style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontWeight: 400,
            fontSize: 'clamp(1.3rem, 3vw, 1.85rem)',
            color: 'var(--ink, #1A1310)',
            margin: 0,
            lineHeight: 1.25,
            maxWidth: '45ch',
          }}>
            Quer saber qual serviço faz sentido pra você? Me chama antes de agendar.
          </p>

          <a
            href="https://wa.me/553135866673"
            className="btn btn-primary"
            style={{ padding: '1rem 2.5rem', fontWeight: 800, textDecoration: 'none', display: 'inline-block' }}
          >
            Falar com o Jon
          </a>

          {/* Section 4 */}
          <div style={{
            marginTop: '16px',
            fontFamily: "'Manrope', sans-serif",
            fontSize: '0.9rem',
            color: 'var(--muted, #a39687)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            alignItems: 'center',
          }}>
            <span>
              Agendamento online disponível para corte. Para descoloração e consultoria, entre em contato primeiro.
            </span>
            <Link
              to="/agendar"
              style={{
                color: 'var(--accent, #C4738A)',
                fontWeight: 600,
                textDecoration: 'underline',
              }}
            >
              Agendar online
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default InvestimentoPage;
