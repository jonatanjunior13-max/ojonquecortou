import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container nav-container">
        <Link to="/" className="logo">
          <img src="/logo-cabeleireiro-de-cachos.png" alt="O Jon que Cortou" className="logo-img" />
        </Link>

        <div className="desktop-menu">
          <Link to="/" className="nav-link">Método</Link>
          <Link to="/servicos" className="nav-link">Serviços</Link>
          <Link to="/sobre" className="nav-link">Sobre</Link>
          <a href="/#reviews" className="nav-link">Depoimentos</a>
          <a href="/#faq" className="nav-link">Localização</a>
          <Link to="/blog" className="nav-link">Blog</Link>
        </div>

        <div className="nav-actions">
          <a href="http://trinks.com/ojonquecortou" target="_blank" rel="noreferrer" className="btn btn-outline nav-btn">
            Agendar online
          </a>
          <a href="https://wa.me/553135866673" target="_blank" rel="noreferrer" className="btn btn-primary nav-btn-wa">
            <span className="wa-dot"></span> WhatsApp
          </a>
          
          <button 
            className="mobile-menu-btn" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="mobile-menu">
          <Link to="/" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Início</Link>
          <Link to="/servicos" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Serviços</Link>
          <Link to="/sobre" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Sobre o Jon</Link>
          <Link to="/blog" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
          <div className="mobile-actions">
            <a href="http://trinks.com/ojonquecortou" className="btn btn-outline w-100">Agendar Online</a>
            <a href="https://wa.me/553135866673" className="btn btn-primary w-100">WhatsApp</a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
