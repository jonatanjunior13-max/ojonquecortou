import React, { useState, useEffect } from 'react';
import { Menu, X, Scissors } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled glass-panel' : ''}`}>
      <div className="container nav-container">
        <Link to="/" className="logo">
          <Scissors className="logo-icon text-magenta" size={28} />
          <span className="logo-text">O Jon Que Cortou</span>
        </Link>

        <div className="desktop-menu">
          <Link to="/" className="nav-link">Início</Link>
          <Link to="/sobre" className="nav-link">Sobre o Jon</Link>
          <Link to="/servicos" className="nav-link">Serviços</Link>
          <Link to="/blog" className="nav-link">Blog</Link>
          <a href="/#depoimentos" className="nav-link">Depoimentos</a>
          <a href="https://www.instagram.com/ojonquecortou" target="_blank" rel="noreferrer" className="nav-link nav-icon-link" aria-label="Siga-nos no Instagram">
            <svg size={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
          </a>
          <a href="http://trinks.com/ateliedoscachosmg" target="_blank" rel="noreferrer" className="btn btn-primary sm-btn">
            Agendar
          </a>
        </div>

        <button 
          className="mobile-menu-btn" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="mobile-menu glass-panel">
          <Link to="/" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Início</Link>
          <Link to="/sobre" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Sobre o Jon</Link>
          <Link to="/servicos" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Serviços</Link>
          <Link to="/blog" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
          <a href="/#depoimentos" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Depoimentos</a>
          <a href="https://www.instagram.com/ojonquecortou" target="_blank" rel="noreferrer" className="mobile-link instagram-mobile-link" onClick={() => setMobileMenuOpen(false)}>
            <svg size={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" style={{ marginRight: '8px', verticalAlign: 'middle' }}><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg> Instagram
          </a>
          <a href="http://trinks.com/ateliedoscachosmg" target="_blank" rel="noreferrer" className="btn btn-primary w-100">
            Agendar Online
          </a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
