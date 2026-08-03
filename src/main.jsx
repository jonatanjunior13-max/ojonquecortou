import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import { FlagValues } from 'flags/react'
import './index.css';
import './legacy.css';
import App from './App.jsx'

// Reload once when a new service worker takes control, so fresh deploys
// actually reach installed PWAs on the next launch instead of after two restarts
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  let swRefreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (swRefreshing) return;
    swRefreshing = true;
    window.location.reload();
  });
}

// Listen for chunk loading errors and reload to pull new assets
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    const msg = e.message || '';
    if (msg.includes('Failed to fetch dynamically imported module') || msg.includes('error loading dynamically imported module')) {
      console.warn('Dynamic chunk import failed. Auto-reloading page for fresh assets...');
      window.location.reload();
    }
  }, true);
}

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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Analytics />
    <FlagValues values={{ "example-feature": true }} />
  </StrictMode>,
)
