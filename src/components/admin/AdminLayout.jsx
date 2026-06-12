import React, { useEffect, useState, useRef } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../../config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { 
  Calendar, Users, LogOut, Package, DollarSign, 
  Scissors, Settings, Megaphone, ChevronLeft, ChevronRight, Search, Smartphone,
  Bell, Check
} from 'lucide-react';
import './AdminNavbar.css';
import '../../styles/admin-tokens.css';
import { ToastProvider, useToast } from '../admin/ui/Toast';

const AdminLayoutInner = () => {
  const toast = useToast();
  const [authorized, setAuthorized] = useState(null);
  const [globalData, setGlobalData] = useState({
    bookings: [], clients: [], services: [], products: [],
    financial_transactions: [], settings: null, coupons: [], giftcards: [],
    packages: [], client_packages: []
  });
  const navigate = useNavigate();
  const location = useLocation();

  const previousBookings = useRef([]);
  const initialLoadDone = useRef(false);
  const notified30Min = useRef(new Set());

  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('admin_sidebar_collapsed') === 'true';
  });
  const [isMobileViewport, setIsMobileViewport] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileViewport(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggleSidebar = () => {
    const newVal = !sidebarCollapsed;
    setSidebarCollapsed(newVal);
    localStorage.setItem('admin_sidebar_collapsed', String(newVal));
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.topbar-search-container')) {
        setShowSearchResults(false);
      }
      if (!e.target.closest('.topbar-notifications-container')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleAcceptBooking = async (booking) => {
    try {
      if (!db) {
        // demo mode
        const local = localStorage.getItem('demo_bookings');
        let updatedList = [];
        if (local) {
          const arr = JSON.parse(local);
          updatedList = arr.map(b => b.id === booking.id ? { ...b, status: 'confirmado' } : b);
          localStorage.setItem('demo_bookings', JSON.stringify(updatedList));
        }
        setGlobalData(prev => ({
          ...prev,
          bookings: prev.bookings.map(b => b.id === booking.id ? { ...b, status: 'confirmado' } : b)
        }));
      } else {
        const docRef = doc(db, 'bookings', booking.id);
        await updateDoc(docRef, { status: 'confirmado' });
      }

      // Trigger email confirmation
      if (booking.clientEmail && booking.clientEmail.includes('@') && booking.clientEmail !== 'Não informado') {
        let displayDate = booking.date;
        if (displayDate && displayDate.includes('-')) {
          displayDate = displayDate.split('-').reverse().join('/');
        }
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'horario_confirmado',
            clientEmail: booking.clientEmail,
            clientName: booking.clientName,
            serviceName: booking.serviceName || booking.service?.name || 'Serviço',
            date: displayDate,
            time: booking.time,
            duration: booking.duration || 60,
            professionalName: 'Jon'
          })
        });
      }
      toast('Agendamento confirmado com sucesso!', 'success');
    } catch (e) {
      console.error(e);
      toast('Erro ao confirmar agendamento.', 'error');
    }
  };

  const searchItems = [
    { name: 'Agenda Semanal', path: '/admin/agenda', category: 'Agenda', keywords: 'horario marcar bloquear comanda fechar' },
    { name: 'Serviços do Salão', path: '/admin/servicos', category: 'Configurações', keywords: 'corte preço promocao duracao cadastro' },
    { name: 'Clientes & Fichas', path: '/admin/clientes', category: 'CRM', keywords: 'ficha capilar relatorio visitas ausentes whatsapp email campanhas' },
    { name: 'Estoque', path: '/admin/estoque', category: 'Produtos', keywords: 'quantidade shampoo oleo ativo custo venda' },
    { name: 'Financeiro (Caixa)', path: '/admin/financeiro', category: 'Finanças', keywords: 'entrada saida despesa extrato pix credito debito dinheiro' },
    { name: 'Comissões & Repasses', path: '/admin/financeiro?tab=comissao', category: 'Finanças', keywords: 'comissao profissional jon auxiliar repasse porcentagem' },
    { name: 'Campanhas', path: '/admin/marketing', category: 'Marketing', keywords: 'whatsapp email massa disparo' },
    { name: 'Configurações do Studio', path: '/admin/configuracoes', category: 'Configurações', keywords: 'horarios maquininha taxas pix email instagram politica' },
  ];

  const filteredSearch = searchItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.keywords.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchSelect = (path) => {
    navigate(path);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  useEffect(() => {
    // Se auth for nulo (Firebase inativo/mockado), usamos apenas o localStorage (bypass local/demo)
    if (!auth) {
      const isLocalLogged = localStorage.getItem('admin_logged') === 'true';
      if (isLocalLogged) {
        setAuthorized(true);
      } else {
        setAuthorized(false);
        navigate('/admin/login');
      }
      return;
    }

    const checkAuth = onAuthStateChanged(auth, (user) => {
      const isLocalLogged = localStorage.getItem('admin_logged') === 'true';
      if (user || isLocalLogged) {
        setAuthorized(true);
      } else {
        setAuthorized(false);
        navigate('/admin/login');
      }
    });

    return () => checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (!authorized) return;

    let unsubs = [];
    if (db) {
      unsubs.push(onSnapshot(collection(db, 'bookings'), (snap) => {
        const newBookings = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        if (initialLoadDone.current && 'Notification' in window && Notification.permission === 'granted') {
          newBookings.forEach(booking => {
            const oldVersion = previousBookings.current.find(b => b.id === booking.id);
            if (!oldVersion) {
              if (booking.status === 'pendente') {
                new Notification("Novo Pedido de Agendamento 📅", {
                  body: `Cliente: ${booking.clientName}\nServiço: ${booking.serviceName || booking.service?.name || 'Serviço'}\nData: ${booking.date ? booking.date.split('-').reverse().join('/') : ''} às ${booking.time}`,
                  icon: '/logo-app.png'
                });
              }
            } else {
              if (booking.status === 'cancelado' && oldVersion.status !== 'cancelado') {
                new Notification("Agendamento Cancelado 🚫", {
                  body: `Cliente: ${booking.clientName} cancelou o horário de ${booking.date ? booking.date.split('-').reverse().join('/') : ''} às ${booking.time}`,
                  icon: '/logo-app.png'
                });
              }
            }
          });
        }
        
        previousBookings.current = newBookings;
        initialLoadDone.current = true;
        setGlobalData(prev => ({ ...prev, bookings: newBookings }));
      }));

      unsubs.push(onSnapshot(collection(db, 'client_profiles'), (snap) => setGlobalData(prev => ({ ...prev, clients: snap.docs.map(d => ({ id: d.id, phone: d.id, ...d.data() })) }))));
      unsubs.push(onSnapshot(collection(db, 'services'), (snap) => setGlobalData(prev => ({ ...prev, services: snap.docs.map(d => ({ id: d.id, ...d.data() })) }))));
      unsubs.push(onSnapshot(collection(db, 'products'), (snap) => setGlobalData(prev => ({ ...prev, products: snap.docs.map(d => ({ id: d.id, ...d.data() })) }))));
      unsubs.push(onSnapshot(collection(db, 'financial_transactions'), (snap) => setGlobalData(prev => ({ ...prev, financial_transactions: snap.docs.map(d => ({ id: d.id, ...d.data() })) }))));
      unsubs.push(onSnapshot(collection(db, 'coupons'), (snap) => setGlobalData(prev => ({ ...prev, coupons: snap.docs.map(d => ({ id: d.id, ...d.data() })) }))));
      unsubs.push(onSnapshot(collection(db, 'giftcards'), (snap) => setGlobalData(prev => ({ ...prev, giftcards: snap.docs.map(d => ({ id: d.id, ...d.data() })) }))));
      unsubs.push(onSnapshot(collection(db, 'packages'), (snap) => setGlobalData(prev => ({ ...prev, packages: snap.docs.map(d => ({ id: d.id, ...d.data() })) }))));
      unsubs.push(onSnapshot(collection(db, 'client_packages'), (snap) => setGlobalData(prev => ({ ...prev, client_packages: snap.docs.map(d => ({ id: d.id, ...d.data() })) }))));
      unsubs.push(onSnapshot(doc(db, 'settings', 'studio'), (snap) => setGlobalData(prev => ({ ...prev, settings: snap.exists() ? { id: snap.id, ...snap.data() } : null }))));
    } else {
      // Demo Mode fallback
      try {
        const demoBookings = JSON.parse(localStorage.getItem('demo_bookings')) || [];
        
        if (initialLoadDone.current && 'Notification' in window && Notification.permission === 'granted') {
          demoBookings.forEach(booking => {
            const oldVersion = previousBookings.current.find(b => b.id === booking.id);
            if (!oldVersion) {
              if (booking.status === 'pendente') {
                new Notification("Novo Pedido de Agendamento 📅", {
                  body: `Cliente: ${booking.clientName}\nServiço: ${booking.serviceName || 'Serviço'}\nData: ${booking.date} às ${booking.time}`,
                  icon: '/logo-app.png'
                });
              }
            } else {
              if (booking.status === 'cancelado' && oldVersion.status !== 'cancelado') {
                new Notification("Agendamento Cancelado 🚫", {
                  body: `Cliente: ${booking.clientName} cancelou o horário de ${booking.date} às ${booking.time}`,
                  icon: '/logo-app.png'
                });
              }
            }
          });
        }
        
        previousBookings.current = demoBookings;
        initialLoadDone.current = true;

        setGlobalData(prev => ({
          ...prev,
          bookings: demoBookings,
          clients: JSON.parse(localStorage.getItem('demo_client_profiles')) || [],
          services: JSON.parse(localStorage.getItem('demo_services')) || [],
          products: JSON.parse(localStorage.getItem('demo_inventory')) || [],
          financial_transactions: JSON.parse(localStorage.getItem('demo_financial')) || [],
          packages: JSON.parse(localStorage.getItem('demo_packages')) || [],
          client_packages: JSON.parse(localStorage.getItem('demo_client_packages')) || []
        }));
      } catch(e) {}
    }

    return () => unsubs.forEach(u => u && u());
  }, [authorized]);

  useEffect(() => {
    if (!authorized) return;

    const checkUpcomingBookings = () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      globalData.bookings.forEach(booking => {
        if (booking.date !== todayStr || booking.status === 'cancelado' || booking.status === 'faltou') return;
        if (!booking.time || booking.status === 'bloqueado') return;

        const [h, m] = booking.time.split(':').map(Number);
        const bookingMinutes = h * 60 + m;
        const diff = bookingMinutes - currentMinutes;

        // Trigger if difference is active between 28 and 30 minutes
        if (diff > 0 && diff <= 30 && diff >= 28) {
          if (!notified30Min.current.has(booking.id)) {
            notified30Min.current.add(booking.id);
            new Notification("Aviso de Agendamento Próximo ⏰", {
              body: `O cliente ${booking.clientName} está agendado em 30 minutos (${booking.time}) para o serviço: ${booking.serviceName || booking.service?.name || 'Serviço'}`,
              icon: '/logo-app.png'
            });
          }
        }
      });
    };

    checkUpcomingBookings();
    const interval = setInterval(checkUpcomingBookings, 30000);

    return () => clearInterval(interval);
  }, [authorized, globalData.bookings]);

  const handleLogout = async () => {
    if (auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.warn('Erro ao deslogar do Firebase:', err);
      }
    }
    localStorage.removeItem('admin_logged');
    navigate('/admin/login');
  };

  if (authorized === null) {
    return (
      <div className="admin-loading">
        <p>Verificando credenciais de acesso...</p>
      </div>
    );
  }

  return (
    <div className={`admin-app admin-app-container ${sidebarCollapsed ? 'collapsed' : ''}`}>
      {isMobileViewport && location.pathname !== '/admin/mobile' && (
        <button 
          type="button"
          style={{
            position: 'fixed',
            top: '8px',
            right: '8px',
            zIndex: 99999,
            background: 'var(--accent, #c8852a)',
            color: '#fff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '20px',
            fontWeight: 'bold',
            fontSize: '0.85rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            fontFamily: 'inherit'
          }} 
          onClick={() => navigate('/admin/mobile')}
        >
          <Smartphone size={16} />
          <span>Voltar para o App 📱</span>
        </button>
      )}
      {/* Sidebar de Navegação */}
      <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-brand" style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
          {!sidebarCollapsed ? (
            <>
              <img src="/logo-app.png" alt="Logo" className="sidebar-logo" />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ fontSize: '1.05rem', margin: 0, lineHeight: 1.2 }}>Studio do Jon</h2>
                <span className="badge" style={{ alignSelf: 'flex-start', marginTop: 4 }}>BackOffice</span>
              </div>
            </>
          ) : (
            <img src="/logo-app.png" alt="Logo" className="sidebar-logo-collapsed" />
          )}
          <button 
            type="button" 
            className="sidebar-toggle-btn" 
            onClick={handleToggleSidebar}
            title={sidebarCollapsed ? "Expandir Menu" : "Recolher Menu"}
          >
            {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <Link 
            to="/admin/agenda" 
            className={`nav-item ${location.pathname.includes('/agenda') ? 'active' : ''}`}
            title="Agenda Semanal"
          >
            <Calendar size={18} />
            <span>Agenda Semanal</span>
          </Link>
          <Link 
            to="/admin/servicos" 
            className={`nav-item ${location.pathname.includes('/servicos') ? 'active' : ''}`}
            title="Servi\u00e7os"
          >
            <Scissors size={18} />
            <span>{"Servi\u00e7os"}</span>
          </Link>
          <Link 
            to="/admin/clientes" 
            className={`nav-item ${location.pathname.includes('/clientes') ? 'active' : ''}`}
            title="Clientes & Fichas"
          >
            <Users size={18} />
            <span>Clientes & Fichas</span>
          </Link>
          <Link 
            to="/admin/estoque" 
            className={`nav-item ${location.pathname.includes('/estoque') ? 'active' : ''}`}
            title="Estoque"
          >
            <Package size={18} />
            <span>Estoque</span>
          </Link>
          <Link 
            to="/admin/financeiro" 
            className={`nav-item ${location.pathname.includes('/financeiro') ? 'active' : ''}`}
            title="Financeiro"
          >
            <DollarSign size={18} />
            <span>Financeiro</span>
          </Link>
          <Link 
            to="/admin/marketing" 
            className={`nav-item ${location.pathname.includes('/marketing') ? 'active' : ''}`}
            title="Campanhas"
          >
            <Megaphone size={18} />
            <span>Campanhas</span>
          </Link>
          <Link 
            to="/admin/configuracoes" 
            className={`nav-item ${location.pathname.includes('/configuracoes') ? 'active' : ''}`}
            title="Configura\u00e7\u00f5es"
          >
            <Settings size={18} />
            <span>{"Configura\u00e7\u00f5es"}</span>
          </Link>
          <Link 
            to="/admin/mobile" 
            className="nav-item"
            title="App Mobile"
            target="_blank"
            style={{ borderTop: '1px solid var(--rule)', marginTop: 8, paddingTop: 8 }}
          >
            <Smartphone size={18} style={{ color: 'var(--accent)' }} />
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>App Mobile 📱</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn" title="Sair do Painel">
            <LogOut size={16} />
            <span>Sair do Painel</span>
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="admin-main-content">
        <header className="admin-topbar">
          <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: 24, flexGrow: 1 }}>
            <div className="topbar-title">
              {location.pathname.includes('/clientes') ? "Fichas T\u00e9cnicas & Clientes" :
               location.pathname.includes('/servicos') ? "Servi\u00e7os do Sal\u00e3o" :
               location.pathname.includes('/estoque') ? "Controle de Estoque" :
               location.pathname.includes('/financeiro') ? "Movimenta\u00e7\u00e3o & Fluxo de Caixa" :
               location.pathname.includes('/marketing') ? "Campanhas & CRM" :
               location.pathname.includes('/configuracoes') ? "Configura\u00e7\u00f5es do Estabelecimento" : "Agenda do Studio"}
            </div>

            <div className="topbar-search-container">
              <div className="search-input-wrapper">
                <Search size={14} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Buscar função (ex: comissão, campanhas)..." 
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(true);
                  }}
                  onFocus={() => setShowSearchResults(true)}
                />
              </div>
              {showSearchResults && searchQuery && (
                <div className="search-results-dropdown">
                  {filteredSearch.length === 0 ? (
                    <div className="no-results">Nenhuma função encontrada</div>
                  ) : (
                    filteredSearch.map(item => (
                      <div 
                        key={item.name} 
                        className="search-result-item" 
                        onClick={() => handleSearchSelect(item.path)}
                      >
                        <span className="result-name">{item.name}</span>
                        <span className="result-category">{item.category}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div className="topbar-notifications-container">
              <button 
                type="button" 
                className="notifications-bell-btn" 
                onClick={() => setShowNotifications(!showNotifications)}
                title="Pedidos de agendamento"
              >
                <Bell size={20} />
                {globalData.bookings.filter(b => b.status === 'pendente').length > 0 && (
                  <span className="notifications-badge">
                    {globalData.bookings.filter(b => b.status === 'pendente').length}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="notifications-dropdown">
                  <div className="notifications-header">
                    <span>Novas Solicitações</span>
                    <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                      {globalData.bookings.filter(b => b.status === 'pendente').length} pendentes
                    </span>
                  </div>
                  {globalData.bookings.filter(b => b.status === 'pendente').length === 0 ? (
                    <div className="notification-list-empty">
                      Nenhum pedido de agendamento aguardando confirmação.
                    </div>
                  ) : (
                    globalData.bookings.filter(b => b.status === 'pendente').map(b => (
                      <div key={b.id} className="notification-item">
                        <div className="notification-client">{b.clientName}</div>
                        <div className="notification-details">
                          <div><strong>Serviço:</strong> {b.serviceName || b.service?.name}</div>
                          <div><strong>Data/Hora:</strong> {b.date ? b.date.split('-').reverse().join('/') : ''} às {b.time}</div>
                          {b.clientPhone && <div><strong>WhatsApp:</strong> {b.clientPhone}</div>}
                        </div>
                        <div className="notification-actions">
                          <button 
                            type="button" 
                            className="notification-accept-btn"
                            onClick={() => handleAcceptBooking(b)}
                          >
                            <Check size={14} /> Aceitar
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="topbar-user">
              <span className="status-indicator"></span>
              <span>Olá, Jon</span>
            </div>
          </div>
        </header>
        <div className="admin-page-body">
          <Outlet context={{ globalData, setGlobalData }} />
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="mobile-bottom-nav">
          <Link to="/admin/mobile" className={`mobile-nav-item ${location.pathname.includes('/mobile') ? 'active' : ''}`}>
            <div className="icon-container">
              <Smartphone size={20} />
            </div>
            <span>Hub App</span>
          </Link>
          <Link to="/admin/servicos" className={`mobile-nav-item ${location.pathname.includes('/servicos') ? 'active' : ''}`}>
            <div className="icon-container">
              <Scissors size={20} />
            </div>
            <span>Serviços</span>
          </Link>
          <Link to="/admin/clientes" className={`mobile-nav-item ${location.pathname.includes('/clientes') ? 'active' : ''}`}>
            <div className="icon-container">
              <Users size={20} />
            </div>
            <span>Clientes</span>
          </Link>
          <Link to="/admin/financeiro" className={`mobile-nav-item ${location.pathname.includes('/financeiro') ? 'active' : ''}`}>
            <div className="icon-container">
              <DollarSign size={20} />
            </div>
            <span>Financeiro</span>
          </Link>
          <Link to="/admin/configuracoes" className={`mobile-nav-item ${location.pathname.includes('/configuracoes') ? 'active' : ''}`}>
            <div className="icon-container">
              <Settings size={20} />
            </div>
            <span>Ajustes</span>
          </Link>
        </nav>
      </main>
    </div>
  );
};

const AdminLayout = () => (
  <ToastProvider>
    <AdminLayoutInner />
  </ToastProvider>
);

export default AdminLayout;
