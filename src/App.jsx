import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
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
import CancelBookingPage from './pages/CancelBookingPage';
import ClientAreaPage from './pages/ClientAreaPage';

const AdminLogin = React.lazy(() => import('./pages/admin/AdminLogin'));
const AdminLayout = React.lazy(() => import('./components/admin/AdminLayout'));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const AdminClients = React.lazy(() => import('./pages/admin/AdminClients'));
const AdminInventory = React.lazy(() => import('./pages/admin/AdminInventory'));
const AdminFinancial = React.lazy(() => import('./pages/admin/AdminFinancial'));
const AdminServices = React.lazy(() => import('./pages/admin/AdminServices'));
const AdminMarketing = React.lazy(() => import('./pages/admin/AdminMarketing'));
const AdminSettings = React.lazy(() => import('./pages/admin/AdminSettings'));
const AdminMobileApp = React.lazy(() => import('./pages/admin/AdminMobileApp'));

import GoogleAnalytics from './components/GoogleAnalytics';
import CustomCursor from './components/CustomCursor';

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


function App() {
  return (
    <Router>
      <CustomCursor />
      <GoogleAnalytics />
      <ScrollToTop />
      <CanonicalTag />
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
          <Route path="/cancelar" element={<CancelBookingPage />} />
          <Route path="/cliente" element={<ClientAreaPage />} />
        </Route>

        {/* Rotas Administrativas */}
        <Route path="/admin/login" element={<React.Suspense fallback={null}><AdminLogin /></React.Suspense>} />
        <Route path="/admin/mobile" element={<React.Suspense fallback={null}><AdminMobileApp /></React.Suspense>} />
        <Route path="/admin" element={<React.Suspense fallback={null}><AdminLayout /></React.Suspense>}>
          <Route index element={<React.Suspense fallback={null}><AdminDashboard /></React.Suspense>} />
          <Route path="agenda" element={<React.Suspense fallback={null}><AdminDashboard /></React.Suspense>} />
          <Route path="servicos" element={<React.Suspense fallback={null}><AdminServices /></React.Suspense>} />
          <Route path="clientes" element={<React.Suspense fallback={null}><AdminClients /></React.Suspense>} />
          <Route path="estoque" element={<React.Suspense fallback={null}><AdminInventory /></React.Suspense>} />
          <Route path="financeiro" element={<React.Suspense fallback={null}><AdminFinancial /></React.Suspense>} />
          <Route path="marketing" element={<React.Suspense fallback={null}><AdminMarketing /></React.Suspense>} />
          <Route path="configuracoes" element={<React.Suspense fallback={null}><AdminSettings /></React.Suspense>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
