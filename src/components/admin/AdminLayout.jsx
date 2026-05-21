import React, { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../../config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { 
  Calendar, Users, LogOut, Package, DollarSign, 
  Scissors, Settings, Megaphone, ChevronLeft, ChevronRight, Search, Smartphone 
} from 'lucide-react';
import './AdminNavbar.css';

const AdminLayout = () => {
  const [authorized, setAuthorized] = useState(null);
  const [globalData, setGlobalData] = useState({
    bookings: [], clients: [], services: [], products: [],
    financial_transactions: [], settings: null, coupons: [], giftcards: []
  });
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('admin_sidebar_collapsed') === 'true';
  });

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
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const searchItems = [
    { name: 'Agenda Semanal', path: '/admin/agenda', category: 'Agenda', keywords: 'horario marcar bloquear comanda fechar' },
    { name: 'Serviços do Salão', path: '/admin/servicos', category: 'Configurações', keywords: 'corte preço promocao duracao cadastro' },
    { name: 'Clientes & Fichas', path: '/admin/clientes', category: 'CRM', keywords: 'ficha capilar relatorio visitas ausentes whatsapp email campanhas' },
    { name: 'Estoque', path: '/admin/estoque', category: 'Produtos', keywords: 'quantidade shampoo oleo ativo custo venda' },
    { name: 'Financeiro (Caixa)', path: '/admin/financeiro', category: 'Finanças', keywords: 'entrada saida despesa extrato pix credito debito dinheiro' },
    { name: 'Comissões & Repasses', path: '/admin/financeiro?tab=comissao', category: 'Finanças', keywords: 'comissao profissional jon auxiliar repasse porcentagem' },
    { name: 'Fidelidade & Cupons', path: '/admin/marketing', category: 'Marketing', keywords: 'pontos fidelidade cupom desconto vale presente promocao' },
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
      unsubs.push(onSnapshot(collection(db, 'bookings'), (snap) => setGlobalData(prev => ({ ...prev, bookings: snap.docs.map(d => ({ id: d.id, ...d.data() })) }))));
      unsubs.push(onSnapshot(collection(db, 'client_profiles'), (snap) => setGlobalData(prev => ({ ...prev, clients: snap.docs.map(d => ({ id: d.id, phone: d.id, ...d.data() })) }))));
      unsubs.push(onSnapshot(collection(db, 'services'), (snap) => setGlobalData(prev => ({ ...prev, services: snap.docs.map(d => ({ id: d.id, ...d.data() })) }))));
      unsubs.push(onSnapshot(collection(db, 'products'), (snap) => setGlobalData(prev => ({ ...prev, products: snap.docs.map(d => ({ id: d.id, ...d.data() })) }))));
      unsubs.push(onSnapshot(collection(db, 'financial_transactions'), (snap) => setGlobalData(prev => ({ ...prev, financial_transactions: snap.docs.map(d => ({ id: d.id, ...d.data() })) }))));
      unsubs.push(onSnapshot(collection(db, 'coupons'), (snap) => setGlobalData(prev => ({ ...prev, coupons: snap.docs.map(d => ({ id: d.id, ...d.data() })) }))));
      unsubs.push(onSnapshot(collection(db, 'giftcards'), (snap) => setGlobalData(prev => ({ ...prev, giftcards: snap.docs.map(d => ({ id: d.id, ...d.data() })) }))));
      unsubs.push(onSnapshot(doc(db, 'settings', 'studio'), (snap) => setGlobalData(prev => ({ ...prev, settings: snap.exists() ? { id: snap.id, ...snap.data() } : null }))));
    } else {
      // Demo Mode fallback
      try {
        setGlobalData(prev => ({
          ...prev,
          bookings: JSON.parse(localStorage.getItem('demo_bookings')) || [],
          clients: JSON.parse(localStorage.getItem('demo_clients')) || [],
          services: JSON.parse(localStorage.getItem('demo_services')) || [],
          products: JSON.parse(localStorage.getItem('demo_inventory')) || [],
          financial_transactions: JSON.parse(localStorage.getItem('demo_financial')) || []
        }));
      } catch(e) {}
    }

    return () => unsubs.forEach(u => u && u());
  }, [authorized]);

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
    <div className={`admin-app-container ${sidebarCollapsed ? 'collapsed' : ''}`}>
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
            title="Marketing & Cupons"
          >
            <Megaphone size={18} />
            <span>Marketing & Cupons</span>
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
               location.pathname.includes('/marketing') ? "Fidelidade & Cupons" :
               location.pathname.includes('/configuracoes') ? "Configura\u00e7\u00f5es do Estabelecimento" : "Agenda do Studio"}
            </div>

            <div className="topbar-search-container">
              <div className="search-input-wrapper">
                <Search size={14} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Buscar função (ex: comissão, cupons)..." 
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

          <div className="topbar-user">
            <span className="status-indicator"></span>
            <span>Olá, Jon</span>
          </div>
        </header>
        <div className="admin-page-body">
          <Outlet context={{ globalData, setGlobalData }} />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
