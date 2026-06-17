import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Arrow } from './NewDesignComponents';

const bindDrawerDrag = (onClose) => {
  let startX = 0;
  let startY = 0;
  let activeElement = null;

  return {
    onTouchStart: (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      activeElement = e.currentTarget;
    },
    onTouchMove: (e) => {
      if (!activeElement) return;
      const clientX = e.touches[0].clientX;
      const clientY = e.touches[0].clientY;
      const deltaX = clientX - startX;
      const deltaY = clientY - startY;

      if (deltaY > 0 && deltaY > deltaX) {
        activeElement.style.transform = `translateY(${deltaY}px)`;
        activeElement.style.transition = 'none';
      } else if (deltaX > 0 && deltaX > deltaY) {
        activeElement.style.transform = `translateX(${deltaX}px)`;
        activeElement.style.transition = 'none';
      }
    },
    onTouchEnd: (e) => {
      if (!activeElement) return;
      const clientX = e.changedTouches[0].clientX;
      const clientY = e.changedTouches[0].clientY;
      const deltaX = clientX - startX;
      const deltaY = clientY - startY;

      if (deltaY > 80 && deltaY > deltaX) {
        onClose();
      } else if (deltaX > 80 && deltaX > deltaY) {
        onClose();
      }
      activeElement.style.transform = '';
      activeElement.style.transition = '';
      activeElement = null;
    }
  };
};

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const current = location.pathname;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { id: "/", label: "Início" },
    { id: "/sobre", label: "Sobre o Jon" },
    { id: "/servicos", label: "Serviços" },
    { id: "/investimento", label: "Investimento" },
    { id: "/galeria", label: "Galeria" },
    { id: "/depoimentos", label: "Depoimentos" },
    { id: "/faq", label: "FAQ" },
    { id: "/metodo", label: "Método" },
    { id: "/blog", label: "Blog" },
    { id: "/cliente", label: "Minha Conta" },
  ];

  return (
    <React.Fragment>
      <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
        <div className="container nav-inner">
          <Link to="/" className="brand">
            <span className="mark">J</span>
            <span className="word">O Jon que Cortou</span>
          </Link>
          <div className="nav-links">
            {links.map((l) => {
              if (l.id === "/servicos") {
                return (
                  <div key={l.id} className="nav-dropdown-wrapper">
                    <Link to={l.id} className={current.startsWith("/servicos") ? "active nav-dropdown-trigger" : "nav-dropdown-trigger"}>
                      {l.label} <span className="dropdown-caret">▼</span>
                    </Link>
                    <div className="nav-dropdown-menu">
                      <Link to="/servicos">Todos os Serviços</Link>
                      <Link to="/servicos/descoloracao-cabelo-cacheado">Descoloração de Cachos</Link>
                      <Link to="/servicos/visagismo-cacheado">Visagismo de Cachos</Link>
                    </div>
                  </div>
                );
              }
              return (
                <Link key={l.id} to={l.id} className={current === l.id ? "active" : ""}>
                  {l.label}
                </Link>
              );
            })}
          </div>
          <div className="nav-cta">
            <Link to="/agendar" className="btn btn-primary hide-mobile">
              Agendar <Arrow />
            </Link>
            <button className="nav-toggle" aria-label="Menu" onClick={() => setOpen((v) => !v)}>
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>
      </nav>
      {open && (
        <div className="mobile-menu" onClick={() => setOpen(false)}>
          <div className="mobile-menu-inner" {...bindDrawerDrag(() => setOpen(false))} onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-head">
              <span className="brand">
                <span className="mark">J</span>
                <span className="word">O Jon que Cortou</span>
              </span>
              <button className="close" onClick={() => setOpen(false)}>×</button>
            </div>
            <div className="mobile-menu-links">
              {links.map((l) => {
                if (l.id === "/servicos") {
                  return (
                    <React.Fragment key={l.id}>
                      <Link to={l.id} className={current === l.id ? "active" : ""} onClick={() => setOpen(false)}>
                        {l.label}<Arrow />
                      </Link>
                      <div className="mobile-sublinks" style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '8px' }}>
                        <Link to="/servicos/descoloracao-cabelo-cacheado" style={{ fontSize: '0.9rem', opacity: 0.8 }} onClick={() => setOpen(false)}>
                          ↳ Descoloração de Cachos
                        </Link>
                        <Link to="/servicos/visagismo-cacheado" style={{ fontSize: '0.9rem', opacity: 0.8 }} onClick={() => setOpen(false)}>
                          ↳ Visagismo de Cachos
                        </Link>
                      </div>
                    </React.Fragment>
                  );
                }
                return (
                  <Link key={l.id} to={l.id} className={current === l.id ? "active" : ""} onClick={() => setOpen(false)}>
                    {l.label}<Arrow />
                  </Link>
                );
              })}
            </div>
            <a href="https://wa.me/553135866673" target="_blank" rel="noopener noreferrer" className="btn btn-accent" style={{ marginTop: 28 }}>
              Agendar pelo WhatsApp <Arrow />
            </a>
          </div>
        </div>
      )}
    </React.Fragment>
  );
}

export default Navbar;
