export const EMAIL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&family=Manrope:wght@300;400;500;600;700&display=swap');
/* ------------------------------------------------------------------
   Email design system — derived from styles.css
   Each email template is rendered inside .mail-stage at 640px wide.
   Above it sits .mail-client-chrome (mock inbox header).
   ------------------------------------------------------------------ */

:root {
  --bg: #EFE5D2;
  --bg-warm: #F5EDDB;
  --surface: #FAF5E8;
  --ink: #1A1310;
  --ink-2: #2E241E;
  --muted: #6B5A4B;
  --muted-2: #8A7866;
  --rule: rgba(26, 19, 16, 0.14);
  --rule-soft: rgba(26, 19, 16, 0.08);
  --accent: #B05A2E;
  --accent-deep: #6E2F18;
  --accent-warm: #C97B49;
  --dark-bg: #1A1310;

  --serif: "DM Serif Display", "Times New Roman", serif;
  --serif-italic: "Instrument Serif", "Times New Roman", serif;
  --sans: "Manrope", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
  --mono: "JetBrains Mono", "SF Mono", monospace;
}

/* Artboard wrapper — each email lives in one of these  */
.mail-stage {
  width: 640px;
  background: #ffffff;
  font-family: var(--sans);
  color: var(--ink);
  display: flex;
  flex-direction: column;
}

/* ---------- mock inbox client chrome ---------- */
.mail-client-chrome {
  background: #ffffff;
  border-bottom: 1px solid rgba(0,0,0,0.07);
  padding: 18px 22px 16px;
  display: flex;
  gap: 14px;
  align-items: flex-start;
}
.mail-avatar {
  width: 40px; height: 40px;
  flex: 0 0 40px;
  border-radius: 50%;
  background: var(--ink);
  color: var(--bg-warm);
  display: grid; place-items: center;
  font-family: var(--serif-italic);
  font-style: italic;
  font-size: 22px;
  line-height: 1;
}
.mail-meta {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.mail-meta .from {
  display: flex; align-items: baseline; gap: 8px;
  justify-content: space-between;
  font-size: 14px;
  color: #1c1c1e;
}
.mail-meta .from .name { font-weight: 600; }
.mail-meta .from .addr { color: #8a8a8d; font-weight: 400; font-size: 13px; }
.mail-meta .from .time {
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  color: #8a8a8d;
  white-space: nowrap;
  flex-shrink: 0;
}
.mail-meta .to {
  font-size: 12px;
  color: #8a8a8d;
}
.mail-meta .subj {
  margin-top: 6px;
  font-family: var(--serif);
  font-size: 21px;
  line-height: 1.2;
  letter-spacing: -0.012em;
  color: #1c1c1e;
}
.mail-meta .subj-alt {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  color: #8a8a8d;
  line-height: 1.35;
}
.mail-meta .subj-alt .ab {
  font-family: var(--mono);
  font-size: 9.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent);
  background: rgba(176,90,46,0.08);
  padding: 2px 6px;
  border-radius: 3px;
  flex-shrink: 0;
}
.mail-meta .preview {
  margin-top: 6px;
  font-family: var(--serif-italic);
  font-style: italic;
  font-size: 13px;
  color: #8a8a8d;
  line-height: 1.4;
}

/* ---------- timeline (D+21 email) ---------- */
.m-timeline {
  margin: 32px 0;
  padding: 28px 0 24px;
  border-top: 1px solid var(--rule);
  border-bottom: 1px solid var(--rule);
  position: relative;
}
.m-timeline-track {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
}
.m-timeline-track::before {
  content: "";
  position: absolute;
  top: 7px; left: 0; right: 0;
  height: 1px;
  background: var(--rule);
}
.m-tl-dot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  flex: 1 1 0;
  position: relative;
  text-align: center;
}
.m-tl-dot .pip {
  width: 14px; height: 14px;
  border-radius: 50%;
  background: var(--bg);
  border: 1px solid var(--rule);
  position: relative;
  z-index: 1;
}
.m-tl-dot .week {
  font-family: var(--mono);
  font-size: 9.5px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted-2);
}
.m-tl-dot .lbl {
  font-family: var(--serif-italic);
  font-style: italic;
  font-size: 14px;
  color: var(--muted);
  line-height: 1.2;
  max-width: 11ch;
}
.m-tl-dot.past .pip { background: var(--muted-2); border-color: var(--muted-2); }
.m-tl-dot.now .pip {
  background: var(--accent);
  border-color: var(--accent);
  width: 18px; height: 18px;
  margin-top: -2px;
  box-shadow: 0 0 0 6px rgba(176,90,46,0.18);
}
.m-tl-dot.now .week { color: var(--accent-deep); font-weight: 600; }
.m-tl-dot.now .lbl { color: var(--ink); font-family: var(--serif); font-style: normal; font-size: 16px; }
.m-tl-dot.future .pip { background: var(--bg); border-style: dashed; }
.m-tl-dot.future .lbl { color: var(--muted-2); }

/* ---------- big farewell letter typography (D+90) ---------- */
.m-farewell {
  font-family: var(--serif-italic);
  font-style: italic;
  font-size: 24px;
  line-height: 1.45;
  color: var(--ink);
  margin: 32px 0;
  max-width: 36ch;
  letter-spacing: -0.005em;
}

/* ---------- birthday ornament ---------- */
.m-ornament {
  display: flex;
  align-items: center;
  gap: 18px;
  margin: 32px 0 8px;
}
.m-ornament .line {
  flex: 1;
  height: 1px;
  background: var(--rule);
}
.m-ornament .sym {
  font-family: var(--serif);
  font-size: 24px;
  color: var(--accent);
  line-height: 1;
}

/* ---------- merge tag highlight ---------- */
.merge {
  background: rgba(176,90,46,0.10);
  color: var(--accent-deep);
  padding: 0 4px;
  border-radius: 2px;
  font-family: var(--serif-italic);
  font-style: italic;
}

/* ---------- email body ---------- */
.mail-body {
  background: var(--bg);
  padding: 56px 56px 0;
  color: var(--ink);
}
.mail-body.warm   { background: var(--bg-warm); }
.mail-body.cream  { background: var(--surface); }
.mail-body.dark   { background: var(--dark-bg); color: var(--bg-warm); }

.mail-footer {
  background: var(--bg);
  padding: 36px 56px 44px;
  border-top: 1px solid var(--rule);
}
.mail-footer.dark {
  background: var(--dark-bg);
  border-top-color: rgba(245,237,219,0.14);
  color: rgba(245,237,219,0.7);
}

/* mast (top of email, brand mark + tag) */
.mail-mast {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--rule);
  padding-bottom: 22px;
  margin-bottom: 40px;
}
.mail-mast .brand {
  display: flex; align-items: center; gap: 10px;
  font-family: var(--serif);
  font-size: 16px;
  letter-spacing: -0.01em;
  line-height: 1;
}
.mail-mast .brand .mark {
  width: 26px; height: 26px;
  border-radius: 50%;
  background: var(--ink);
  color: var(--bg);
  display: grid; place-items: center;
  font-family: var(--serif-italic);
  font-style: italic;
  font-size: 15px;
}
.mail-mast .tag {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted);
}

.mail-mast.dark { border-bottom-color: rgba(245,237,219,0.14); }
.mail-mast.dark .brand .mark { background: var(--bg-warm); color: var(--ink); }
.mail-mast.dark .tag { color: rgba(245,237,219,0.5); }

/* ---------- type utilities ---------- */
.m-eyebrow {
  font-family: var(--mono);
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted);
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.m-eyebrow::before {
  content: "";
  display: inline-block;
  width: 18px; height: 1px;
  background: currentColor;
  opacity: 0.6;
}
.m-eyebrow.dark { color: rgba(245,237,219,0.62); }

.m-display {
  font-family: var(--serif);
  font-weight: 400;
  letter-spacing: -0.018em;
  line-height: 0.98;
  color: var(--ink);
  margin: 0;
}
.m-display.italic { font-family: var(--serif-italic); font-style: italic; }
.m-h1 { font-size: 64px; }
.m-h2 { font-size: 44px; }
.m-h3 { font-size: 32px; }
.m-h4 { font-size: 24px; }

.m-lead {
  font-size: 17px;
  line-height: 1.55;
  color: var(--ink-2);
  margin: 0;
}
.m-body {
  font-size: 15.5px;
  line-height: 1.65;
  color: var(--ink-2);
  margin: 0;
}
.m-body + .m-body { margin-top: 1.1em; }
.m-body strong { color: var(--ink); font-weight: 600; }
.m-body em { font-family: var(--serif-italic); font-style: italic; }

.m-small {
  font-family: var(--mono);
  font-size: 10.5px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted);
}

hr.m-rule {
  border: 0;
  border-top: 1px solid var(--rule);
  margin: 32px 0;
}
hr.m-rule.dark { border-top-color: rgba(245,237,219,0.14); }

.m-italic { font-family: var(--serif-italic); font-style: italic; font-weight: 400; color: var(--accent-deep); }

/* ---------- buttons ---------- */
.m-btn {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 14px 22px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border: 1px solid transparent;
  text-decoration: none;
}
.m-btn .arrow { width: 14px; height: 14px; display: inline-block; }
.m-btn-primary { background: var(--ink); color: var(--bg); }
.m-btn-accent  { background: var(--accent); color: var(--bg-warm); }
.m-btn-ghost   { background: transparent; color: var(--ink); border-color: var(--rule); }
.m-btn-light   { background: var(--bg-warm); color: var(--ink); }
.m-btn-dark-ghost { background: transparent; color: var(--bg-warm); border-color: rgba(245,237,219,0.25); }

.m-btn-row { display: flex; gap: 10px; flex-wrap: wrap; }

/* ---------- appointment card ---------- */
.appt-card {
  background: var(--surface);
  border: 1px solid var(--rule);
  border-radius: 4px;
  padding: 28px 28px 24px;
  margin: 32px 0;
}
.appt-card .label {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 10px;
}
.appt-card .when {
  font-family: var(--serif);
  font-size: 36px;
  line-height: 1.05;
  letter-spacing: -0.018em;
  margin: 0 0 6px;
}
.appt-card .when .italic {
  font-family: var(--serif-italic);
  font-style: italic;
  color: var(--accent-deep);
}
.appt-card .where {
  font-size: 15px;
  color: var(--muted);
  margin: 14px 0 0;
  line-height: 1.5;
}
.appt-card .meta-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  border-top: 1px solid var(--rule);
  margin-top: 20px;
  padding-top: 18px;
}
.appt-card .meta-row .cell .lbl {
  font-family: var(--mono);
  font-size: 9.5px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 4px;
}
.appt-card .meta-row .cell .val {
  font-family: var(--serif);
  font-size: 18px;
  line-height: 1.2;
  color: var(--ink);
}

/* ---------- checklist ---------- */
.m-check {
  list-style: none;
  padding: 0; margin: 28px 0;
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--rule);
}
.m-check li {
  border-bottom: 1px solid var(--rule);
  padding: 16px 0;
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 14px;
  align-items: baseline;
}
.m-check .n {
  font-family: var(--mono);
  font-size: 10.5px;
  letter-spacing: 0.16em;
  color: var(--accent);
}
.m-check .t {
  font-family: var(--serif);
  font-size: 18px;
  line-height: 1.25;
  letter-spacing: -0.01em;
  color: var(--ink);
}
.m-check .d {
  display: block;
  font-family: var(--sans);
  font-size: 14px;
  color: var(--muted);
  margin-top: 6px;
  line-height: 1.5;
  letter-spacing: 0;
}

/* ---------- takeaway box (from blog) ---------- */
.m-takeaway {
  background: var(--bg-warm);
  border: 1px solid var(--rule);
  border-left: 3px solid var(--accent);
  border-radius: 4px;
  padding: 22px 26px;
  margin: 28px 0;
}
.m-takeaway .lbl {
  font-family: var(--mono);
  font-size: 10.5px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent-deep);
  margin-bottom: 10px;
}
.m-takeaway p {
  font-size: 16px;
  line-height: 1.6;
  color: var(--ink-2);
  margin: 0;
}

/* ---------- post cards (newsletter) ---------- */
.m-post-list {
  display: grid;
  gap: 28px;
}
.m-post {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 22px;
  text-decoration: none;
  color: inherit;
}
.m-post .cover {
  aspect-ratio: 4/3;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}
.m-post .cat {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 8px;
}
.m-post h3 {
  font-family: var(--serif);
  font-size: 22px;
  line-height: 1.15;
  letter-spacing: -0.012em;
  margin: 0 0 8px;
  color: var(--ink);
}
.m-post p {
  font-size: 14px;
  color: var(--muted);
  line-height: 1.5;
  margin: 0;
}

/* ---------- signature ---------- */
.m-signoff {
  margin-top: 36px;
  display: flex;
  align-items: center;
  gap: 16px;
}
.m-signoff .sig-name {
  font-family: var(--serif-italic);
  font-style: italic;
  font-size: 30px;
  line-height: 1;
  color: var(--accent-deep);
}
.m-signoff .sig-meta {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted);
  line-height: 1.5;
}
.m-signoff.dark .sig-name { color: var(--accent-warm); }
.m-signoff.dark .sig-meta { color: rgba(245,237,219,0.55); }

/* ---------- footer block ---------- */
.m-footer-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 32px;
}
.m-footer-brand {
  font-family: var(--serif);
  font-size: 28px;
  line-height: 1;
  letter-spacing: -0.015em;
  color: var(--ink);
  margin: 0 0 10px;
}
.m-footer-brand .italic {
  font-family: var(--serif-italic);
  font-style: italic;
  color: var(--accent-deep);
  display: block;
}
.m-footer .addr {
  font-size: 13.5px;
  color: var(--muted);
  line-height: 1.5;
  margin: 0;
}
.m-footer .links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 8px;
}
.m-footer .links a {
  font-family: var(--mono);
  font-size: 10.5px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-2);
  text-decoration: none;
}
.m-footer .legal {
  margin-top: 28px;
  padding-top: 18px;
  border-top: 1px solid var(--rule);
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
}
.m-footer .legal a { color: var(--muted); text-decoration: none; }

.m-footer.dark .m-footer-brand { color: var(--bg-warm); }
.m-footer.dark .m-footer-brand .italic { color: var(--accent-warm); }
.m-footer.dark .addr { color: rgba(245,237,219,0.6); }
.m-footer.dark .links a { color: rgba(245,237,219,0.75); }
.m-footer.dark .legal { color: rgba(245,237,219,0.45); border-top-color: rgba(245,237,219,0.14); }
.m-footer.dark .legal a { color: rgba(245,237,219,0.45); }

/* ---------- stars (review email) ---------- */
.m-stars {
  display: flex;
  gap: 14px;
  margin: 28px 0 8px;
  justify-content: flex-start;
}
.m-stars button {
  width: 56px; height: 56px;
  border-radius: 50%;
  border: 1px solid var(--rule);
  background: var(--surface);
  font-family: var(--serif);
  font-size: 26px;
  color: var(--accent);
  cursor: pointer;
}

/* ---------- date slot grid (reactivation) ---------- */
.m-slot-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin: 28px 0;
}
.m-slot {
  background: var(--surface);
  border: 1px solid var(--rule);
  border-radius: 4px;
  padding: 16px 14px;
  text-align: center;
}
.m-slot .dow {
  font-family: var(--mono);
  font-size: 9.5px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted);
}
.m-slot .day {
  font-family: var(--serif);
  font-size: 26px;
  line-height: 1;
  margin: 6px 0 2px;
  letter-spacing: -0.01em;
}
.m-slot .hours {
  font-size: 12px;
  color: var(--muted-2);
  margin-top: 6px;
  font-family: var(--mono);
  letter-spacing: 0.06em;
}
.m-slot.full {
  background: transparent;
  color: var(--muted-2);
}
.m-slot.full .day { color: var(--muted-2); text-decoration: line-through; }

/* ---------- placeholder image ---------- */
.ph {
  position: absolute; inset: 0;
}
.ph-1 { background: radial-gradient(80% 90% at 20% 20%, #C97B49, transparent 55%), linear-gradient(140deg, #6E2F18, #2A1A12); }
.ph-2 { background: radial-gradient(80% 80% at 80% 20%, #B05A2E, transparent 60%), linear-gradient(160deg, #2E241E, #1A1310); }
.ph-3 { background: radial-gradient(80% 80% at 30% 70%, #C97B49, transparent 60%), linear-gradient(140deg, #4A2718, #1A1310); }

/* spacing helpers */
.mt-8  { margin-top: 8px; }
.mt-12 { margin-top: 12px; }
.mt-20 { margin-top: 20px; }
.mt-28 { margin-top: 28px; }
.mt-36 { margin-top: 36px; }
.mt-48 { margin-top: 48px; }
.mb-8  { margin-bottom: 8px; }
.mb-12 { margin-bottom: 12px; }
.mb-20 { margin-bottom: 20px; }
.mb-28 { margin-bottom: 28px; }
.mb-36 { margin-bottom: 36px; }
.mb-48 { margin-bottom: 48px; }

/* responsive: at small viewports the canvas already lets you scroll, but
   the artboard itself is intrinsic — no media queries needed here. */

`;


export const HTML_TEMPLATES = {
  'd1': `
<div class="mail-body warm">
  <div class="mail-mast">
    <div class="brand">
      <div class="mark">J</div>
      Studio do Jon
    </div>
    
  </div>

  <span class="m-eyebrow">24 horas depois</span>
  <h1 class="m-display m-h2 mt-20" style="max-width: 14ch;">
    {nome}, como tá o fio <span class="m-italic">hoje?</span>
  </h1>

  <p class="m-body mt-28" style="max-width: 54ch;">
    Ontem você saiu do Studio com o corte novo. Como tá se sentindo
    com ele hoje?
  </p>
  <p class="m-body mt-12" style="max-width: 54ch;">
    Os primeiros <strong>2–3 dias</strong> o cacho ainda tá encontrando
    o padrão. Normal ter um dia estranho no começo — não é o corte
    que ficou ruim. É o fio se reorganizando depois de perder peso.
  </p>

  <div class="m-takeaway">
    <div class="lbl">Essa semana</div>
    <p>
      Evita escova seca. Deixa o peso trabalhar sozinho. Quanto menos
      você manipular agora, <strong>mais rápido o padrão se define</strong>.
    </p>
  </div>

  <p class="m-body mt-28" style="max-width: 54ch;">
    Se surgir qualquer dúvida sobre finalização, me chama no WhatsApp
    ou no direct. Tô aqui.
  </p>

  <div class="m-btn-row mt-28">
    <a href="https://wa.me/553135866673" class="m-btn m-btn-primary">Falar com o Jon</a>
  </div>

  <hr class="m-rule" />
  <div class="m-signoff">
    <div class="sig-name">Jon</div>
  </div>
  <p class="m-body mt-12" style="max-width: 52ch; font-size: 14px; color: var(--muted);">
    <strong style="color: var(--ink);">Studio do Jon</strong><br />
    Especialista em corte para cabelos ondulados, cacheados e crespos<br />
    com foco em visagismo em Belo Horizonte.
  </p>
  <p class="m-small mt-12" style="color: var(--muted);">
    @ojonquecortou · ojonquecortou.com.br/agendar
  </p>
  <div style="height: 48px;"></div>
</div>
<div class="mail-footer">
  <div class="m-footer-grid">
    <div>
      <div class="m-footer-brand">Studio do Jon <span class="italic">— corte com leitura.</span></div>
      <p class="addr">Rua Francisco Ovídio, 184 · Caiçara<br>Belo Horizonte · MG · 30000-000<br>Quarta a Sábado · 9h às 19h</p>
    </div>
  </div>
  <div class="legal">© 2026 Studio do Jon</div>
</div>
`,
  'd7': `
<div class="mail-body cream">
  <div class="mail-mast">
    <div class="brand">
      <div class="mark">J</div>
      Studio do Jon
    </div>
    
  </div>

  <span class="m-eyebrow">Sete dias</span>
  <h1 class="m-display m-h2 mt-20" style="max-width: 15ch;">
    A semana mais <span class="m-italic">importante</span> do seu cabelo.
  </h1>

  <p class="m-lead mt-28" style="max-width: 46ch;">
    E quase ninguém fala sobre isso.
  </p>

  <p class="m-body mt-28" style="max-width: 54ch;">
    Essa é a fase mais traiçoeira pra julgar um resultado. Muita cliente
    olha pro espelho na semana 1 e pensa que o corte não ficou bom —
    quando na verdade o fio ainda tá <em>aprendendo</em> o padrão.
  </p>

  <hr class="m-rule" />

  <span class="m-small">O que tá acontecendo</span>
  <p class="m-body mt-12" style="max-width: 54ch;">
    Depois de perder peso com o corte, o cacho precisa de alguns dias
    pra encontrar o ângulo de queda certo. É como tirar um sapato
    apertado — o pé demora um tempo pra se reorganizar.
  </p>

  <div class="m-takeaway">
    <div class="lbl">O que ajuda agora</div>
    <p>
      Finalize <strong>mais leve do que o normal</strong>. Sem mousse
      pesada, sem creme em excesso. Deixa o fio respirar. Se possível,
      seque natural pelo menos duas vezes essa semana.
    </p>
  </div>

  <p class="m-body mt-28" style="max-width: 54ch;">
    A definição real do seu corte aparece <strong>entre a semana 2 e 3</strong>.
  </p>
  <p class="m-body mt-12" style="max-width: 54ch;">
    Qualquer dúvida, me chama.
  </p>

  <div class="m-btn-row mt-28">
    <a href="https://wa.me/553135866673" class="m-btn m-btn-primary">Falar com o Jon</a>
  </div>

  <hr class="m-rule" />
  <div class="m-signoff">
    <div class="sig-name">Jon</div>
  </div>
  <p class="m-body mt-12" style="max-width: 52ch; font-size: 14px; color: var(--muted);">
    <strong style="color: var(--ink);">Studio do Jon</strong><br />
    Especialista em corte para cabelos ondulados, cacheados e crespos<br />
    com foco em visagismo em Belo Horizonte.
  </p>
  <p class="m-small mt-12" style="color: var(--muted);">
    @ojonquecortou · ojonquecortou.com.br/agendar
  </p>
  <div style="height: 48px;"></div>
</div>
<div class="mail-footer">
  <div class="m-footer-grid">
    <div>
      <div class="m-footer-brand">Studio do Jon <span class="italic">— corte com leitura.</span></div>
      <p class="addr">Rua Francisco Ovídio, 184 · Caiçara<br>Belo Horizonte · MG · 30000-000<br>Quarta a Sábado · 9h às 19h</p>
    </div>
  </div>
  <div class="legal">© 2026 Studio do Jon</div>
</div>
`,
  'd21': `
<div class="mail-body">
  <div class="mail-mast">
    <div class="brand">
      <div class="mark">J</div>
      Studio do Jon
    </div>
    
  </div>

  <span class="m-eyebrow">Três semanas</span>
  <h1 class="m-display m-h1 mt-20" style="max-width: 12ch;">
    Agora vem a <span class="m-italic">parte boa.</span>
  </h1>

  <p class="m-lead mt-28" style="max-width: 46ch;">
    É aqui que o corte mostra tudo o que ele tem.
  </p>

  <p class="m-body mt-20" style="max-width: 54ch;">
    O fio já encontrou o padrão, o peso tá certo, o cacho tá definido
    do jeito que eu projetei na <em>leitura de fio</em>.
  </p>

  <div class="m-timeline mt-28">
    <div class="m-timeline-track">
      <div class="m-timeline-fill" style="width: 50%;"></div>
    </div>
    <div class="m-timeline-stops">
      <div class="m-timeline-stop">
        <div class="dot past"></div><div class="lbl">Sem 1</div>
      </div>
      <div class="m-timeline-stop">
        <div class="dot past"></div><div class="lbl">Sem 2</div>
      </div>
      <div class="m-timeline-stop">
        <div class="dot now"></div><div class="lbl">Sem 3</div>
      </div>
      <div class="m-timeline-stop">
        <div class="dot future"></div><div class="lbl">Sem 6</div>
      </div>
      <div class="m-timeline-stop">
        <div class="dot future"></div><div class="lbl">Sem 8</div>
      </div>
    </div>
  </div>

  <p class="m-body mt-28" style="max-width: 54ch;">
    Aproveita essa fase — é o <strong>pico</strong>.
  </p>

  <hr class="m-rule" />

  <span class="m-small">Sobre a janela</span>
  <p class="m-body mt-12" style="max-width: 54ch;">
    A partir da semana <strong>6 a 8</strong>, o fio começa a perder a
    forma. Não porque cresceu demais — porque o ângulo do corte começa
    a trabalhar <em>contra</em> você.
  </p>
  <p class="m-body mt-12" style="max-width: 54ch;">
    A manutenção na hora certa é o que faz a diferença entre um corte
    que dura e um corte que desanda.
  </p>

  <div class="m-btn-row mt-28">
    <a href="https://ojonquecortou.com.br/agendar" class="m-btn m-btn-accent">Agendar meu próximo atendimento</a>
  </div>

  <hr class="m-rule" />
  <div class="m-signoff">
    <div class="sig-name">Jon</div>
  </div>
  <p class="m-body mt-12" style="max-width: 52ch; font-size: 14px; color: var(--muted);">
    <strong style="color: var(--ink);">Studio do Jon</strong><br />
    Especialista em corte para cabelos ondulados, cacheados e crespos<br />
    com foco em visagismo em Belo Horizonte.
  </p>
  <p class="m-small mt-12" style="color: var(--muted);">
    @ojonquecortou · ojonquecortou.com.br/agendar
  </p>
  <div style="height: 48px;"></div>
</div>
<div class="mail-footer">
  <div class="m-footer-grid">
    <div>
      <div class="m-footer-brand">Studio do Jon <span class="italic">— corte com leitura.</span></div>
      <p class="addr">Rua Francisco Ovídio, 184 · Caiçara<br>Belo Horizonte · MG · 30000-000<br>Quarta a Sábado · 9h às 19h</p>
    </div>
  </div>
  <div class="legal">© 2026 Studio do Jon</div>
</div>
`,
  'd35': `
<div class="mail-body dark">
  <div class="mail-mast dark">
    <div class="brand">
      <div class="mark">J</div>
      Studio do Jon
    </div>
    
  </div>

  <span class="m-eyebrow dark">Faz cinco semanas</span>
  <h1 class="m-display m-h1 mt-20" style="color: var(--bg-warm); max-width: 12ch;">
    Chegou <span class="m-italic" style="color: var(--accent-warm);">a hora.</span>
  </h1>

  <p class="m-lead mt-28" style="color: rgba(245,237,219,0.78); max-width: 46ch;">
    Essa é exatamente a janela certa pra retornar.
  </p>

  <hr class="m-rule dark" />

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0;">
    <div style="padding-right: 24px; border-right: 1px solid rgba(245,237,219,0.14);">
      <div class="m-small" style="color: rgba(245,237,219,0.55);">Se você voltar agora</div>
      <p class="m-body mt-12" style="color: rgba(245,237,219,0.85); font-size: 15px;">
        O fio ainda tem a <em style="color: var(--accent-warm);">memória</em> do
        corte anterior. Eu consigo trabalhar a continuidade — ajustar
        o que precisa, evoluir o que já tá bom.
      </p>
      <p class="m-body mt-12" style="color: rgba(245,237,219,0.85); font-size: 15px;">
        Atendimento mais preciso, mais rápido, melhor resultado.
      </p>
    </div>
    <div style="padding-left: 24px;">
      <div class="m-small" style="color: rgba(245,237,219,0.55);">Se você esperar demais</div>
      <p class="m-body mt-12" style="color: rgba(245,237,219,0.55); font-size: 15px;">
        O fio perde a referência. O próximo atendimento começa quase
        do zero.
      </p>
    </div>
  </div>

  <hr class="m-rule dark" />

  <p class="m-body" style="color: rgba(245,237,219,0.85); max-width: 54ch;">
    A agenda tá abrindo. Se quiser garantir o seu horário:
  </p>

  <div class="m-btn-row mt-28">
    <a href="https://ojonquecortou.com.br/agendar" class="m-btn m-btn-accent">Quero agendar meu horário</a>
    <a href="https://wa.me/553135866673" class="m-btn m-btn-dark-ghost">Falar antes de marcar</a>
  </div>

  <hr class="m-rule dark" />
  <div class="m-signoff dark">
    <div class="sig-name">Jon</div>
  </div>
  <p class="m-body mt-12" style="max-width: 52ch; font-size: 14px; color: rgba(245,237,219,0.65);">
    <strong style="color: var(--bg-warm);">Studio do Jon</strong><br />
    Especialista em corte para cabelos ondulados, cacheados e crespos<br />
    com foco em visagismo em Belo Horizonte.
  </p>
  <p class="m-small mt-12" style="color: rgba(245,237,219,0.55);">
    @ojonquecortou · ojonquecortou.com.br/agendar
  </p>
  <div style="height: 48px;"></div>
</div>
<div class="mail-footer dark">
  <div class="m-footer-grid">
    <div>
      <div class="m-footer-brand">Studio do Jon <span class="italic">— corte com leitura.</span></div>
      <p class="addr">Rua Francisco Ovídio, 184 · Caiçara<br>Belo Horizonte · MG · 30000-000<br>Quarta a Sábado · 9h às 19h</p>
    </div>
  </div>
  <div class="legal">© 2026 Studio do Jon</div>
</div>
`,
  'd60': `
<div class="mail-body warm">
  <div class="mail-mast">
    <div class="brand">
      <div class="mark">J</div>
      Studio do Jon
    </div>
    
  </div>

  <span class="m-eyebrow">Uma coisa que percebi</span>
  <h1 class="m-display m-h2 mt-20" style="max-width: 16ch;">
    Não é sobre <span class="m-italic">o corte.</span><br />
    É sobre o que vem antes dele.
  </h1>

  <hr class="m-rule" />

  <p class="m-body" style="max-width: 54ch;">
    A maioria dos problemas de resultado que vejo no Studio não
    aconteceu na hora do corte.
  </p>
  <p class="m-body mt-12" style="max-width: 54ch; font-family: var(--serif-italic); font-style: italic; font-size: 22px; line-height: 1.35; color: var(--ink);">
    Aconteceu antes.
  </p>

  <p class="m-body mt-28" style="max-width: 54ch;">
    Antes de qualquer tesoura tocar no fio, eu faço uma <strong>leitura</strong>.
    Análise a seco, padrão de queda, histórico químico, diagnóstico de
    couro cabeludo. Só depois que eu entendo o fio de verdade é que
    decido como cortar.
  </p>
  <p class="m-body mt-12" style="max-width: 54ch;">
    Parece óbvio. Mas é raro. A maioria dos cabeleireiros <em>pula</em> essa
    etapa.
  </p>

  <div class="m-takeaway">
    <div class="lbl">No seu caso</div>
    <p>
      Quando você foi atendida, fizemos essa leitura juntos. Ela ainda
      diz muito sobre o seu fio — mas o fio <strong>muda</strong> com o
      tempo. Cada lavagem, cada produto, cada processo deixa uma marca.
    </p>
  </div>

  <p class="m-body mt-28" style="max-width: 54ch;">
    Se você tiver curiosidade pra saber como o seu fio tá hoje, me
    chama. Posso fazer uma <em>nova leitura</em> antes de qualquer
    decisão de corte.
  </p>

  <div class="m-btn-row mt-28">
    <a href="https://wa.me/553135866673" class="m-btn m-btn-primary">Quero marcar uma consulta</a>
  </div>

  <hr class="m-rule" />
  <div class="m-signoff">
    <div class="sig-name">Jon</div>
  </div>
  <p class="m-body mt-12" style="max-width: 52ch; font-size: 14px; color: var(--muted);">
    <strong style="color: var(--ink);">Studio do Jon</strong><br />
    Especialista em corte para cabelos ondulados, cacheados e crespos<br />
    com foco em visagismo em Belo Horizonte.
  </p>
  <p class="m-small mt-12" style="color: var(--muted);">
    @ojonquecortou · ojonquecortou.com.br/agendar
  </p>
  <div style="height: 48px;"></div>
</div>
<div class="mail-footer">
  <div class="m-footer-grid">
    <div>
      <div class="m-footer-brand">Studio do Jon <span class="italic">— corte com leitura.</span></div>
      <p class="addr">Rua Francisco Ovídio, 184 · Caiçara<br>Belo Horizonte · MG · 30000-000<br>Quarta a Sábado · 9h às 19h</p>
    </div>
  </div>
  <div class="legal">© 2026 Studio do Jon</div>
</div>
`,
  'd90': `
<div class="mail-body cream">
  <div class="mail-mast">
    <div class="brand">
      <div class="mark">J</div>
      Studio do Jon
    </div>
    
  </div>

  <span class="m-eyebrow">Três meses</span>
  <h1 class="m-display m-h2 mt-20" style="max-width: 16ch;">
    Seu fio tá te dizendo algo.<br /><span class="m-italic">Você tá ouvindo?</span>
  </h1>

  <hr class="m-rule" />

  <p class="m-body mt-28" style="max-width: 54ch;">
    Tem uma coisa que quase toda cacheada interpreta errado.
  </p>
  <p class="m-body mt-12" style="max-width: 54ch;">
    Quando o cabelo começa a parecer "sem graça", difícil de finalizar, com menos definição do que antes — a primeira conclusão é que o produto parou de funcionar. Ou que o cabelo "mudou".
  </p>
  <p class="m-body mt-12" style="max-width: 54ch;">
    Não mudou. O que aconteceu foi mais simples: o fio cresceu e perdeu a referência do corte.
  </p>

  <p class="m-body mt-28" style="max-width: 54ch;">
    Em 90 dias, o cacho cresce em torno de 3 centímetros. Pra fio liso, isso é só comprimento. Pra fio cacheado, é o suficiente pra descompensar ângulo, peso e distribuição. O corte que eu projetei pra você foi calculado pra um comprimento específico — esse comprimento não existe mais.
  </p>

  <div class="m-takeaway">
    <div class="lbl">A consequência</div>
    <p>
      O resultado aparece na finalização: você faz tudo igual, mas o cacho não fecha do mesmo jeito. Parece falha sua. Não é.
    </p>
  </div>

  <p class="m-body mt-28" style="max-width: 54ch;">
    Quando você volta agora, eu consigo trabalhar o fio com a memória do que foi feito. O atendimento é mais rápido, mais preciso, e o resultado retoma de onde parou — em vez de começar do zero.
  </p>

  <div class="m-btn-row mt-28">
    <a href="https://ojonquecortou.com.br/agendar" class="m-btn m-btn-primary">Quero agendar meu retorno →</a>
  </div>

  <hr class="m-rule" />
  <div class="m-signoff">
    <div class="sig-name">Jon</div>
  </div>
  <p class="m-body mt-12" style="max-width: 52ch; font-size: 14px; color: var(--muted);">
    <strong style="color: var(--ink);">Studio do Jon</strong><br />
    Especialista em corte para cabelos ondulados, cacheados e crespos<br />
    com foco em visagismo em Belo Horizonte.
  </p>
  <p class="m-small mt-12" style="color: var(--muted);">
    @ojonquecortou · ojonquecortou.com.br/agendar
  </p>
  <div style="height: 48px;"></div>
</div>
<div class="mail-footer">
  <div class="m-footer-grid">
    <div>
      <div class="m-footer-brand">Studio do Jon <span class="italic">— corte com leitura.</span></div>
      <p class="addr">Rua Francisco Ovídio, 184 · Caiçara<br>Belo Horizonte · MG · 30000-000<br>Quarta a Sábado · 9h às 19h</p>
    </div>
  </div>
  <div class="legal">© 2026 Studio do Jon</div>
</div>
`,
  'aniversario': `
<div class="mail-body">
  <div class="mail-mast">
    <div class="brand">
      <div class="mark">J</div>
      Studio do Jon
    </div>
    
  </div>

  <span class="m-eyebrow">Hoje é seu dia</span>
  <h1 class="m-display m-h1 mt-20" style="max-width: 14ch;">
    Parabéns, <span class="m-italic">{nome}.</span>
  </h1>

  <hr class="m-rule" />

  <p class="m-body mt-28" style="max-width: 50ch; font-family: var(--serif-italic); font-style: italic; font-size: 22px; line-height: 1.4; color: var(--ink);">
    Aniversário é um bom momento pra se olhar no espelho e gostar do
    que vê. Não só por dentro.
  </p>

  <hr class="m-rule" />

  <p class="m-body" style="max-width: 54ch;">
    Se quiser se presentear com um atendimento esse mês, a agenda tá
    aqui. Posso fazer uma <em>nova leitura de fio</em> e ver o que
    mudou desde a última vez.
  </p>

  <p class="m-body mt-20" style="max-width: 54ch;">
    Feliz aniversário <strong>de verdade</strong>.
  </p>

  <div class="m-btn-row mt-28">
    <a href="https://ojonquecortou.com.br/agendar" class="m-btn m-btn-accent">Ver agenda do Studio</a>
  </div>

  <hr class="m-rule" />
  <div class="m-signoff">
    <div class="sig-name">Jon</div>
  </div>
  <p class="m-body mt-12" style="max-width: 52ch; font-size: 14px; color: var(--muted);">
    <strong style="color: var(--ink);">Studio do Jon</strong><br />
    Especialista em corte para cabelos ondulados, cacheados e crespos<br />
    com foco em visagismo em Belo Horizonte.
  </p>
  <p class="m-small mt-12" style="color: var(--muted);">
    @ojonquecortou · ojonquecortou.com.br/agendar
  </p>
  <div style="height: 48px;"></div>
</div>
<div class="mail-footer">
  <div class="m-footer-grid">
    <div>
      <div class="m-footer-brand">Studio do Jon <span class="italic">— corte com leitura.</span></div>
      <p class="addr">Rua Francisco Ovídio, 184 · Caiçara<br>Belo Horizonte · MG · 30000-000<br>Quarta a Sábado · 9h às 19h</p>
    </div>
  </div>
  <div class="legal">© 2026 Studio do Jon</div>
</div>
`
};

// ─── Admin Notification Templates (what gets sent to the salon owner) ──────────
export const ADMIN_HTML_TEMPLATES = {
  admin_solicitacao_recebida: `
<div class="mail-body warm">
  <div class="mail-mast">
    <div class="brand">
      <div class="mark">J</div>
      Studio do Jon
    </div>
    
  </div>

  <span class="m-eyebrow">Aviso de Agendamento</span>
  <h1 class="m-display m-h2 mt-20" style="max-width: 16ch;">
    Nova <span class="m-italic">Solicitação</span>
  </h1>

  <p class="m-body mt-28" style="max-width: 54ch;">
    Olá Jon, uma nova solicitação de agendamento online foi recebida e aguarda sua análise no painel.
  </p>

  <div class="appt-card">
    <div class="label">Detalhes da solicitação</div>
    <p class="when"><span class="italic">[Data]</span> às [Horário]</p>
    <div class="meta-row" style="margin-top:20px;">
      <div class="cell">
        <div class="lbl">Cliente</div>
        <div class="val">[Nome do Cliente]</div>
      </div>
      <div class="cell">
        <div class="lbl">E-mail</div>
        <div class="val">[E-mail]</div>
      </div>
    </div>
    <div class="meta-row" style="margin-top:10px;">
      <div class="cell">
        <div class="lbl">Serviço</div>
        <div class="val">[Serviço]</div>
      </div>
      <div class="cell">
        <div class="lbl">Telefone</div>
        <div class="val">[Telefone]</div>
      </div>
    </div>
  </div>

  <div class="m-btn-row mt-28">
    <a href="https://ojonquecortou.com.br/admin/bookings" class="m-btn m-btn-primary">Ver no Painel →</a>
  </div>

  <hr class="m-rule" />
  <div class="m-signoff">
    <div class="sig-name">Sistema</div>
  </div>
  <p class="m-body mt-12" style="max-width: 52ch; font-size: 14px; color: var(--muted);">
    <strong style="color: var(--ink);">Studio do Jon</strong><br />
    Notificação automática do sistema de agendamentos.
  </p>
  <div style="height: 48px;"></div>
</div>
<div class="mail-footer">
  <div class="m-footer-grid">
    <div>
      <div class="m-footer-brand">Studio do Jon <span class="italic">— corte com leitura.</span></div>
      <p class="addr">Rua Francisco Ovídio, 184 · Caiçara<br>Belo Horizonte · MG<br>Quarta a Sábado · 9h às 19h</p>
    </div>
  </div>
  <div class="legal">© 2026 Studio do Jon · Notificação interna</div>
</div>
`,

  admin_horario_confirmado: `
<div class="mail-body cream">
  <div class="mail-mast">
    <div class="brand">
      <div class="mark">J</div>
      Studio do Jon
    </div>
    
  </div>

  <span class="m-eyebrow">Aviso de Confirmação</span>
  <h1 class="m-display m-h2 mt-20" style="max-width: 16ch;">
    Agendamento <span class="m-italic">Confirmado</span>
  </h1>

  <p class="m-body mt-28" style="max-width: 54ch;">
    Olá Jon, um agendamento foi confirmado ou criado no sistema.
  </p>

  <div class="appt-card">
    <div class="label">Agendamento</div>
    <p class="when"><span class="italic">[Data]</span> às [Horário]</p>
    <div class="meta-row">
      <div class="cell">
        <div class="lbl">Cliente</div>
        <div class="val">[Nome do Cliente]</div>
      </div>
      <div class="cell">
        <div class="lbl">Serviço</div>
        <div class="val">[Serviço]</div>
      </div>
    </div>
  </div>

  <div class="m-btn-row mt-28">
    <a href="https://ojonquecortou.com.br/admin/bookings" class="m-btn m-btn-primary">Ver no Painel →</a>
  </div>

  <hr class="m-rule" />
  <div class="m-signoff">
    <div class="sig-name">Sistema</div>
  </div>
  <p class="m-body mt-12" style="max-width: 52ch; font-size: 14px; color: var(--muted);">
    <strong style="color: var(--ink);">Studio do Jon</strong><br />
    Notificação automática do sistema de agendamentos.
  </p>
  <div style="height: 48px;"></div>
</div>
<div class="mail-footer">
  <div class="m-footer-grid">
    <div>
      <div class="m-footer-brand">Studio do Jon <span class="italic">— corte com leitura.</span></div>
      <p class="addr">Rua Francisco Ovídio, 184 · Caiçara<br>Belo Horizonte · MG<br>Quarta a Sábado · 9h às 19h</p>
    </div>
  </div>
  <div class="legal">© 2026 Studio do Jon · Notificação interna</div>
</div>
`
};
