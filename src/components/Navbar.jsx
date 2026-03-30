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
          <a href="http://trinks.com/ateliedoscachosmg" target="_blank" rel="noreferrer" className="btn btn-primary w-100">
            Agendar Online
          </a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
