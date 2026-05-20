import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import ScrollToTop from './components/ScrollToTop';
import CanonicalTag from './components/CanonicalTag';

import Home from './pages/Home';
import AboutPage from './pages/AboutPage';
import ServicesPage from './pages/ServicesPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import ReviewsPage from './pages/ReviewsPage';
import GalleryPage from './pages/GalleryPage';
import BookingPage from './pages/BookingPage';

import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminClients from './pages/admin/AdminClients';

import GoogleAnalytics from './components/GoogleAnalytics';

// Layout público com cabeçalho, rodapé e botão do WhatsApp
function PublicLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
      <WhatsAppButton />
    </>
  );
}

function TrinksInterceptor() {
  const navigate = React.useMemo(() => {
    try {
      return useNavigate();
    } catch {
      return null;
    }
  }, []);

  React.useEffect(() => {
    if (!navigate) return;
    const handleGlobalClick = (e) => {
      const anchor = e.target.closest('a');
      if (anchor && anchor.href && anchor.href.includes('trinks.com/ojonquecortou')) {
        e.preventDefault();
        navigate('/agendar');
      }
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [navigate]);

  return null;
}

function App() {
  return (
    <Router>
      <GoogleAnalytics />
      <ScrollToTop />
      <CanonicalTag />
      <TrinksInterceptor />
      <Routes>
        {/* Rotas Públicas */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/sobre" element={<AboutPage />} />
          <Route path="/servicos" element={<ServicesPage />} />
          <Route path="/galeria" element={<GalleryPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/depoimentos" element={<ReviewsPage />} />
          <Route path="/agendar" element={<BookingPage />} />
        </Route>

        {/* Rotas Administrativas */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="agenda" element={<AdminDashboard />} />
          <Route path="clientes" element={<AdminClients />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
