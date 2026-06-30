/* eslint-disable react/prop-types */
// Email primitives — shared across the 6 templates.
// MailStage      → the artboard root (640px wide)
// MailChrome     → mock inbox header (from/to/subject/timestamp)
// MailMast       → brand row at top of email body
// MailFooter     → address + links + legal at bottom
// MailButton     → terracota/ink/ghost pill button
// AppointmentCard, Checklist, Takeaway, Stars, SlotGrid → content blocks

const J_MONOGRAM = '𝒥'; // serif italic J fallback if Instrument Serif isn't ready

function MailStage({ chrome, children, footer, bg }) {
  return (
    <div className="mail-stage">
      {chrome}
      <div className={`mail-body ${bg || ''}`}>{children}</div>
      {footer}
    </div>
  );
}

function MailChrome({ subject, subjectB, preview, time, to }) {
  return (
    <div className="mail-client-chrome">
      <div className="mail-avatar">J</div>
      <div className="mail-meta">
        <div className="from">
          <span>
            <span className="name">Studio do Jon</span>{' '}
            <span className="addr">&lt;jon@ojonquecortou.com.br&gt;</span>
          </span>
          <span className="time">{time}</span>
        </div>
        <div className="to">para {to || 'você'}</div>
        <div className="subj">{subject}</div>
        {subjectB && (
          <div className="subj-alt">
            <span className="ab">A/B</span>
            <span>{subjectB}</span>
          </div>
        )}
        {preview && <div className="preview">— {preview}</div>}
      </div>
    </div>
  );
}

function MailMast({ tag, dark }) {
  return (
    <div className={`mail-mast ${dark ? 'dark' : ''}`}>
      <div className="brand">
        <span className="mark">J</span>
        <span>Studio do Jon</span>
      </div>
      <div className="tag">{tag}</div>
    </div>
  );
}

function MailFooter({ dark }) {
  return (
    <div className={`mail-footer m-footer ${dark ? 'dark' : ''}`}>
      <div className="m-footer-grid">
        <div>
          <div className="m-footer-brand">
            Studio do Jon
            <span className="italic">— corte com leitura.</span>
          </div>
          <p className="addr">
            Rua dos Cacheados, 218 · Caiçaras<br/>
            Belo Horizonte · MG · 30000-000<br/>
            Quarta a Sábado · 9h às 19h
          </p>
        </div>
        <ul className="links">
          <li><a href="#">Instagram ↗</a></li>
          <li><a href="#">WhatsApp ↗</a></li>
          <li><a href="#">Google Maps ↗</a></li>
          <li><a href="#">Blog ↗</a></li>
        </ul>
      </div>
      <div className="legal">
        <span>© 2026 Studio do Jon</span>
        <a href="#">Descadastrar</a>
        <a href="#">Preferências</a>
      </div>
    </div>
  );
}

function Arrow({ size = 14 }) {
  return (
    <svg className="arrow" width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M3 11L11 3M11 3H4M11 3V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MailButton({ variant = 'primary', children, href = '#' }) {
  const cls = {
    primary: 'm-btn m-btn-primary',
    accent:  'm-btn m-btn-accent',
    ghost:   'm-btn m-btn-ghost',
    light:   'm-btn m-btn-light',
    'dark-ghost': 'm-btn m-btn-dark-ghost',
  }[variant] || 'm-btn m-btn-primary';
  return (
    <a className={cls} href={href}>
      {children}
      <Arrow />
    </a>
  );
}

function AppointmentCard({ when, whenItalic, where, service, duration }) {
  return (
    <div className="appt-card">
      <div className="label">Agendamento</div>
      <p className="when">
        {when} <span className="italic">{whenItalic}</span>
      </p>
      <p className="where">{where}</p>
      <div className="meta-row">
        <div className="cell">
          <div className="lbl">Serviço</div>
          <div className="val">{service}</div>
        </div>
        <div className="cell">
          <div className="lbl">Duração</div>
          <div className="val">{duration}</div>
        </div>
      </div>
    </div>
  );
}

function Checklist({ items }) {
  return (
    <ol className="m-check">
      {items.map((it, i) => (
        <li key={i}>
          <span className="n">{String(i + 1).padStart(2, '0')}</span>
          <div>
            <div className="t">{it.t}</div>
            {it.d && <span className="d">{it.d}</span>}
          </div>
        </li>
      ))}
    </ol>
  );
}

function Takeaway({ label = 'Anota', children }) {
  return (
    <div className="m-takeaway">
      <div className="lbl">{label}</div>
      <p>{children}</p>
    </div>
  );
}

function Stars() {
  return (
    <div className="m-stars">
      {[1,2,3,4,5].map(n => (
        <button key={n} aria-label={`${n} estrelas`}>★</button>
      ))}
    </div>
  );
}

function SlotGrid({ slots }) {
  return (
    <div className="m-slot-grid">
      {slots.map((s, i) => (
        <div key={i} className={`m-slot ${s.full ? 'full' : ''}`}>
          <div className="dow">{s.dow}</div>
          <div className="day">{s.day}</div>
          <div className="hours">{s.full ? 'cheio' : s.hours}</div>
        </div>
      ))}
    </div>
  );
}

function PostCard({ cat, title, excerpt, ph }) {
  return (
    <a className="m-post" href="#">
      <div className="cover">
        <div className={`ph ${ph || 'ph-1'}`}></div>
      </div>
      <div>
        <div className="cat">{cat}</div>
        <h3>{title}</h3>
        <p>{excerpt}</p>
      </div>
    </a>
  );
}

function Signoff({ name = 'Jon', meta = 'JONATAN JUNIOR · STUDIO DO JON', dark }) {
  return (
    <div className={`m-signoff ${dark ? 'dark' : ''}`}>
      <div className="sig-name">{name},</div>
      <div className="sig-meta">{meta.split('·').map((s,i,a) => (
        <div key={i}>{s.trim()}{i < a.length - 1 ? '' : ''}</div>
      ))}</div>
    </div>
  );
}

/* Highlights a {Nome}-style merge tag. Use <Merge>Nome</Merge> in copy.
   Builds the braces with React children rather than a template literal so
   any non-string child (fragments, arrays, etc.) renders correctly. */
function Merge({ children }) {
  return <span className="merge">{'{'}{children}{'}'}</span>;
}

/* Healing timeline used in the D+21 email. Pass an array of
   { week, lbl, state: 'past'|'now'|'future' } in order. */
function Timeline({ stops }) {
  return (
    <div className="m-timeline">
      <div className="m-timeline-track">
        {stops.map((s, i) => (
          <div key={i} className={`m-tl-dot ${s.state || ''}`}>
            <div className="pip"></div>
            <div className="week">{s.week}</div>
            <div className="lbl">{s.lbl}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Ornament() {
  return (
    <div className="m-ornament">
      <span className="line"></span>
      <span className="sym">✦</span>
      <span className="line"></span>
    </div>
  );
}

Object.assign(window, {
  MailStage, MailChrome, MailMast, MailFooter,
  MailButton, Arrow,
  AppointmentCard, Checklist, Takeaway, Stars, SlotGrid, PostCard, Signoff,
  Merge, Timeline, Ornament,
});
