import React, { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../../config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { Calendar, Users, LogOut, Package, DollarSign } from 'lucide-react';
import './AdminNavbar.css';

const AdminLayout = () => {
  const [authorized, setAuthorized] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

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
    <div className="admin-app-container">
      {/* Sidebar de Navegação */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <h2>Studio do Jon</h2>
          <span className="badge">BackOffice</span>
        </div>
        
        <nav className="sidebar-nav">
          <Link 
            to="/admin/agenda" 
            className={`nav-item ${location.pathname.includes('/agenda') ? 'active' : ''}`}
          >
            <Calendar size={18} />
            <span>Agenda Semanal</span>
          </Link>
          <Link 
            to="/admin/clientes" 
            className={`nav-item ${location.pathname.includes('/clientes') ? 'active' : ''}`}
          >
            <Users size={18} />
            <span>Clientes & Fichas</span>
          </Link>
          <Link 
            to="/admin/estoque" 
            className={`nav-item ${location.pathname.includes('/estoque') ? 'active' : ''}`}
          >
            <Package size={18} />
            <span>Estoque</span>
          </Link>
          <Link 
            to="/admin/financeiro" 
            className={`nav-item ${location.pathname.includes('/financeiro') ? 'active' : ''}`}
          >
            <DollarSign size={18} />
            <span>Financeiro</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={16} />
            <span>Sair do Painel</span>
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="admin-main-content">
        <header className="admin-topbar">
          <div className="topbar-title">
            {location.pathname.includes('/clientes') ? 'Fichas Técnicas & Clientes' :
             location.pathname.includes('/estoque') ? 'Controle de Estoque' :
             location.pathname.includes('/financeiro') ? 'Movimentação & Fluxo de Caixa' : 'Agenda do Studio'}
          </div>
          <div className="topbar-user">
            <span className="status-indicator"></span>
            <span>Olá, Jon</span>
          </div>
        </header>
        <div className="admin-page-body">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
