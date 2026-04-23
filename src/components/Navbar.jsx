import React, { useState, useEffect } from 'react';
import { Menu, X, Scissors } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const InstagramIcon = ({ size = 20 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="navbar reveal">
      <div className="container nav-container">
        <Link to="/" className="logo">
          <img src="/logo-cabeleireiro-de-cachos.png" alt="O Jon que Cortou" className="logo-img" />
        </Link>

        <div className="desktop-menu">
          <Link to="/" className="nav-link">Início</Link>
          <Link to="/sobre" className="nav-link">Sobre o Jon</Link>
          <Link to="/servicos" className="nav-link">Serviços</Link>
          <Link to="/blog" className="nav-link">Blog</Link>
          <a href="/#depoimentos" className="nav-link">Depoimentos</a>
          <a href="http://instagram.com/ojonquecortou" target="_blank" rel="noreferrer" className="nav-link social-nav-link">
            <InstagramIcon size={20} />
          </a>
          <a href="http://trinks.com/ojonquecortou" target="_blank" rel="noreferrer" className="btn btn-primary nav-cta">
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
        <div className="mobile-menu">
          <Link to="/" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Início</Link>
          <Link to="/sobre" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Sobre o Jon</Link>
          <Link to="/servicos" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Serviços</Link>
          <Link to="/blog" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
          <a href="/#depoimentos" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Depoimentos</a>
          <a href="http://instagram.com/ojonquecortou" target="_blank" rel="noreferrer" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
            Siga no Instagram
          </a>
          <a href="http://trinks.com/ojonquecortou" target="_blank" rel="noreferrer" className="btn btn-primary w-100">
            Agendar Online
          </a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
