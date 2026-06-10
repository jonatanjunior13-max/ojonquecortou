import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { FlagValues } from 'flags/react'
import './index.css';
import './legacy.css';
import App from './App.jsx'

// Custom Cursor Script
if (typeof window !== 'undefined') {
  window.addEventListener('mousemove', (e) => {
    const cursor = document.getElementById('cursor-dot');
    if (cursor) {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
    }
  });

  // Scroll Reveal Observer
  const revealCallback = (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  };

  const observer = new IntersectionObserver(revealCallback, {
    threshold: 0.1
  });

  // Re-run observer when DOM changes or on initial load
  const setupObserver = () => {
    const reveals = document.querySelectorAll('.reveal');
    reveals.forEach(el => observer.observe(el));
  };

  window.addEventListener('DOMContentLoaded', setupObserver);
  // Also run periodically for dynamic content if needed, 
  // though for a simple app DOM mutations or route changes are better.
  setInterval(setupObserver, 1000); 
}

// FORCE CACHE CLEAR - Mata qualquer Service Worker preso para forçar atualização
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
      console.log('ServiceWorker cache limpo.');
    }
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Analytics />
      <FlagValues values={{ "example-feature": true }} />
    </BrowserRouter>
  </StrictMode>,
)
