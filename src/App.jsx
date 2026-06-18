import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import ScrollToTop from './components/ScrollToTop';
import CanonicalTag from './components/CanonicalTag';

import Home from './pages/Home';
import AboutPage from './pages/AboutPage';
import ServicesPage from './pages/ServicesPage';
import BleachServicePage from './pages/BleachServicePage';
import VisagismServicePage from './pages/VisagismServicePage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import ReviewsPage from './pages/ReviewsPage';
import GalleryPage from './pages/GalleryPage';
import FaqPage from './pages/FaqPage';
import MetodoPage from './pages/MetodoPage';
import InvestimentoPage from './pages/InvestimentoPage';
import BookingPage from './pages/BookingPage';
import CancelBookingPage from './pages/CancelBookingPage';
import ClientAreaPage from './pages/ClientAreaPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';

import CorteHibridoPage from './pages/CorteHibridoPage';
import TransicaoCapilarPage from './pages/TransicaoCapilarPage';
import VisagismoCachosPage from './pages/VisagismoCachosPage';
import MasculinoPage from './pages/MasculinoPage';
import LeituraFioPage from './pages/LeituraFioPage';

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
import AdminHoje from './pages/admin/AdminHoje';

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
          <Route path="/servicos/corte-hibrido" element={<CorteHibridoPage />} />
          <Route path="/servicos/leitura-de-fio" element={<LeituraFioPage />} />
          <Route path="/servicos/transicao-capilar" element={<TransicaoCapilarPage />} />
          <Route path="/servicos/visagismo-cachos" element={<VisagismoCachosPage />} />
          <Route path="/servicos/masculino" element={<MasculinoPage />} />
          <Route path="/servicos/descoloracao-cabelo-cacheado" element={<BleachServicePage />} />
          <Route path="/servicos/visagismo-cacheado" element={<VisagismServicePage />} />
          <Route path="/servicos/:serviceId" element={<ServiceDetailPage />} />
          <Route path="/galeria" element={<GalleryPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/depoimentos" element={<ReviewsPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/metodo" element={<MetodoPage />} />
          <Route path="/metodologia" element={<MetodoPage />} />
          <Route path="/investimento" element={<InvestimentoPage />} />
          <Route path="/agendar" element={<BookingPage />} />
          <Route path="/cancelar" element={<CancelBookingPage />} />
          <Route path="/cliente" element={<ClientAreaPage />} />
          <Route path="/produtos" element={<ProductsPage />} />
          <Route path="/produtos/:productId" element={<ProductDetailPage />} />
        </Route>

        {/* Rotas Administrativas */}
        <Route path="/admin/login" element={<React.Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#6B5A4B' }}>Carregando Acesso...</div>}><AdminLogin /></React.Suspense>} />
        <Route path="/admin/mobile" element={<React.Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#6B5A4B' }}>Carregando App...</div>}><AdminMobileApp /></React.Suspense>} />
        <Route path="/admin" element={<React.Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#6B5A4B' }}>Carregando Painel...</div>}><AdminLayout /></React.Suspense>}>
          <Route index element={<Navigate to="/admin/hoje" replace />} />
          <Route path="hoje" element={<AdminHoje />} />
          <Route path="agenda" element={<React.Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#6B5A4B' }}>Carregando Agenda...</div>}><AdminDashboard /></React.Suspense>} />
          <Route path="servicos" element={<React.Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#6B5A4B' }}>Carregando Serviços...</div>}><AdminServices /></React.Suspense>} />
          <Route path="clientes" element={<React.Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#6B5A4B' }}>Carregando Clientes...</div>}><AdminClients /></React.Suspense>} />
          <Route path="estoque" element={<React.Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#6B5A4B' }}>Carregando Estoque...</div>}><AdminInventory /></React.Suspense>} />
          <Route path="financeiro" element={<React.Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#6B5A4B' }}>Carregando Financeiro...</div>}><AdminFinancial /></React.Suspense>} />
          <Route path="marketing" element={<React.Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#6B5A4B' }}>Carregando Marketing...</div>}><AdminMarketing /></React.Suspense>} />
          <Route path="configuracoes" element={<React.Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#6B5A4B' }}>Carregando Configurações...</div>}><AdminSettings /></React.Suspense>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
