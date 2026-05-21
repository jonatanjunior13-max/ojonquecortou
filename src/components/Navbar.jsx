import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Arrow } from './NewDesignComponents';

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
    { id: "/galeria", label: "Galeria" },
    { id: "/depoimentos", label: "Depoimentos" },
    { id: "/blog", label: "Blog" },
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
            {links.map((l) => (
              <Link key={l.id} to={l.id} className={current === l.id ? "active" : ""}>
                {l.label}
              </Link>
            ))}
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
          <div className="mobile-menu-inner" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-head">
              <span className="brand">
                <span className="mark">J</span>
                <span className="word">O Jon que Cortou</span>
              </span>
              <button className="close" onClick={() => setOpen(false)}>×</button>
            </div>
            <div className="mobile-menu-links">
              {links.map((l) => (
                <Link key={l.id} to={l.id} className={current === l.id ? "active" : ""} onClick={() => setOpen(false)}>
                  {l.label}<Arrow />
                </Link>
              ))}
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
