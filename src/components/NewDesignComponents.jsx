import React, { useEffect, useRef, useState } from 'react';

export const Arrow = ({ size = 14 }) => (
  <svg className="arrow" width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M3 11L11 3M11 3H4.5M11 3V9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const WhatsIcon = () => (
  <svg className="ico" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.74.46 3.43 1.32 4.92L2 22l5.32-1.39a9.9 9.9 0 004.72 1.2c5.46 0 9.91-4.45 9.91-9.9 0-2.65-1.03-5.13-2.9-7-1.88-1.87-4.36-2.91-7.01-2.91zm0 18.13c-1.45 0-2.87-.39-4.12-1.13l-.3-.18-3.06.8.82-2.98-.2-.31a8.18 8.18 0 01-1.26-4.42c0-4.54 3.69-8.23 8.23-8.23 2.2 0 4.27.86 5.83 2.41a8.16 8.16 0 012.4 5.82c0 4.54-3.69 8.22-8.34 8.22zm4.51-6.16c-.25-.13-1.46-.72-1.69-.8-.23-.08-.39-.13-.55.13-.16.25-.64.8-.78.96-.14.16-.29.18-.54.06-.25-.12-1.04-.38-1.99-1.23a7.46 7.46 0 01-1.38-1.71c-.14-.25-.01-.39.11-.51.11-.11.25-.29.37-.43.13-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.41-.55-.42-.14-.01-.31-.01-.47-.01-.16 0-.43.06-.65.31-.22.25-.85.83-.85 2.04 0 1.2.87 2.36.99 2.52.12.16 1.71 2.62 4.15 3.67.58.25 1.03.4 1.39.51.58.18 1.11.16 1.53.1.47-.07 1.46-.6 1.66-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.18-.47-.3z" fill="currentColor"/>
  </svg>
);

export const InstaIcon = () => (
  <svg className="ico" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6"/>
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6"/>
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>
  </svg>
);

export const MapPin = () => (
  <svg className="ico" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 21s-7-7.5-7-12a7 7 0 1114 0c0 4.5-7 12-7 12z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
    <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.6"/>
  </svg>
);

export function Reveal({ children, delay = 0, as: As = "div", className = "", ...rest }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setTimeout(() => setShown(true), delay);
            io.disconnect();
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);
  return (
    <As ref={ref} {...rest} className={`reveal ${shown ? "in" : ""} ${className}`.trim()}>
      {children}
    </As>
  );
}

export function ContactCTA() {
  return (
    <section id="agendar" className="cta section">
      <div className="container">
        <div className="cta-grid">
          <div>
            <Reveal as="div" className="eyebrow" style={{ color: "rgba(245,237,219,0.7)" }}>
              Agende sua leitura
            </Reveal>
            <Reveal delay={80}>
              <h2 className="display" style={{ marginTop: 18 }}>
                Pronta pra entender<br/>
                o seu <span className="italic">próprio fio?</span>
              </h2>
            </Reveal>
            <Reveal delay={160}>
              <p className="lead" style={{ marginTop: 28, maxWidth: "52ch" }}>
                Toda primeira visita começa com a Leitura de Fio. Avaliação técnica, plano de corte
                e cronograma — tudo conversado antes de qualquer tesourada.
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="info-list">
                <div className="info">
                  <div className="lbl">Endereço</div>
                  <div className="val">Studio do Jon · Caiçaras, Belo Horizonte / MG</div>
                </div>
                <div className="info">
                  <div className="lbl">Funcionamento</div>
                  <div className="val">Ter — Sáb · 9h às 19h <span style={{ color: "rgba(245,237,219,0.5)" }}>· somente com agendamento</span></div>
                </div>
              </div>
            </Reveal>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Reveal delay={200}>
              <div className="booking-card">
                <h3>Como agendar</h3>
                <p>Atendimento individual, vaga limitada. Escolha o canal:</p>
                <div className="channels">
                  <a className="channel" href="https://wa.me/553135866673" target="_blank" rel="noopener">
                    <span className="left"><WhatsIcon /> WhatsApp</span>
                    <span className="right">Resposta &lt; 1h</span>
                  </a>
                  <a className="channel" href="https://instagram.com/ojonquecortou" target="_blank" rel="noopener">
                    <span className="left"><InstaIcon /> @ojonquecortou</span>
                    <span className="right">DM</span>
                  </a>
                  <a className="channel" href="https://www.google.com/maps/search/?api=1&query=O+Jon+que+Cortou+-+Especialista+em+Cachos" target="_blank" rel="noopener">
                    <span className="left"><MapPin /> Como chegar</span>
                    <span className="right">Caiçaras · BH</span>
                  </a>
                </div>
              </div>
            </Reveal>
            <Reveal delay={260}>
              <div className="map-embed-wrapper" style={{ borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(245,237,219,0.14)', height: '220px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3751.3741037334435!2d-43.9678756253839!3d-19.908634081475036!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xa69341f36fd6f3%3A0xe6c5e30e4bbba519!2sO%20Jon%20que%20Cortou%20-%20Especialista%20em%20Cachos%20%7C%20Cabeleireiro%20em%20BH!5e0!3m2!1spt-BR!2sbr!4v1779265943789!5m2!1spt-BR!2sbr"
                  width="100%"
                  height="100%"
                  style={{ border: 0, display: 'block' }}
                  loading="lazy"
                  title="Mapa de Localização do Studio - O Jon que Cortou"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PageHero({ eyebrow, title, italic, lead, location = "Caiçaras · BH" }) {
  return (
    <header className="page-hero">
      <div className="container">
        <Reveal as="div" className="page-hero-eyebrow">
          <span className="eyebrow">{eyebrow}</span>
          <span className="page-hero-loc">{location}</span>
        </Reveal>
        <Reveal delay={60}>
          <h1 className="display" style={{ marginTop: 32 }}>
            {title} {italic && <span className="italic">{italic}</span>}
          </h1>
        </Reveal>
        {lead && (
          <Reveal delay={140}>
            <p className="lead" style={{ marginTop: 28, maxWidth: "62ch" }}>{lead}</p>
          </Reveal>
        )}
      </div>
    </header>
  );
}
