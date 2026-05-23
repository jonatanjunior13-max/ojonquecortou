export const EMAIL_CSS = `@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&family=Manrope:wght@300;400;500;600;700&display=swap');
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
