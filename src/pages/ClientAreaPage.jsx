import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../config/firebase';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { Calendar, Clock, Lock, Unlock, LogOut, Scissors, AlertCircle, ChevronRight, User, PlusCircle, ArrowLeft, Mail } from 'lucide-react';
import SEO from '../components/SEO';
import './ClientAreaPage.css';

const getServiceColor = (serviceName = '') => {
  const s = serviceName.toLowerCase().trim();

  // Combo: Corte + Tratamento
  if ((s.includes('corte') && s.includes('tratamento')) || s.includes('combo')) {
    return { color: '#FF2D8B', label: 'CORTE + TRATAMENTO' };
  }

  // Corte único
  if (s.includes('corte') && !s.includes('tratamento') && !s.includes('manutenção')) {
    return { color: '#8B5CF6', label: 'CORTE' };
  }

  // Coloração/Cor
  if (s.includes('cor') || s.includes('color') || s.includes('luzes') || s.includes('colora')) {
    return { color: '#FBBF24', label: 'COR' };
  }

  // Tratamento Personalizado
  if (s.includes('tratamento personalizado')) {
    return { color: '#87CEEB', label: 'TRATAMENTO' };
  }

  // Outros tratamentos
  if (s.includes('tratamento')) {
    return { color: '#87CEEB', label: 'TRATAMENTO' };
  }

  // Default
  return { color: '#FF2D8B', label: 'SERVIÇO' };
};

export default function ClientAreaPage() {
  const navigate = useNavigate();

  // Estados de Autenticação
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Pacotes Estados
  const [packages, setPackages] = useState([]);
  const [clientPackages, setClientPackages] = useState([]);
  const [services, setServices] = useState([]);
  const [showAcquirePackageModal, setShowAcquirePackageModal] = useState(false);
  
  // Recuperação de Senha
  const [resetMode, setResetMode] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Estados de Carregamento & Erro
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Dados do Cliente
  const [clientProfile, setClientProfile] = useState(null);
  const [activeBookings, setActiveBookings] = useState([]);
  const [pastBookings, setPastBookings] = useState([]);

  // Monitora estado da autenticação
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setCurrentUser(user);
        await loadClientData(user);
      } else {
        setCurrentUser(null);
        setClientProfile(null);
        setActiveBookings([]);
        setPastBookings([]);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Busca perfil e agendamentos no Firestore ou localStorage (Modo Demo)
  const loadClientData = async (user) => {
    try {
      let profile = null;
      const isDemo = !db;

      if (isDemo) {
        // Fallback para modo demo
        const localClients = JSON.parse(localStorage.getItem('demo_client_profiles') || '[]');
        profile = localClients.find(c => c.userId === user.uid || (c.email && c.email.toLowerCase() === user.email?.toLowerCase()));
        
        if (!profile && user.email) {
          // Auto-criar perfil de demo se não existir
          profile = {
            name: user.displayName || 'Cliente',
            email: user.email,
            phone: '',
            userId: user.uid
          };
          localClients.push(profile);
          localStorage.setItem('demo_client_profiles', JSON.stringify(localClients));
        }
      } else {
        // Query no Firestore por userId
        const q = query(collection(db, 'client_profiles'), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          profile = { id: snap.docs[0].id, ...snap.docs[0].data() };
        } else if (user.email) {
          // Tentar buscar por email se não achar por userId (caso o cadastro tenha sido criado antes sem o vínculo do userId)
          const q2 = query(collection(db, 'client_profiles'), where('email', '==', user.email));
          const snap2 = await getDocs(q2);
          if (!snap2.empty) {
            profile = { id: snap2.docs[0].id, ...snap2.docs[0].data() };
            // Vincula o userId ao perfil existente
            const docRef = doc(db, 'client_profiles', profile.id);
            await updateDoc(docRef, { userId: user.uid });
            profile.userId = user.uid;
          }
        }
      }

      setClientProfile(profile);

      // Carregar agendamentos do cliente
      let allBookings = [];
      if (isDemo) {
        const localBookings = JSON.parse(localStorage.getItem('demo_bookings') || '[]');
        allBookings = localBookings.filter(b => 
          b.userId === user.uid || 
          (profile && profile.phone && b.clientPhone?.replace(/\D/g, '') === profile.phone) ||
          (profile && profile.email && b.clientEmail?.toLowerCase() === profile.email.toLowerCase()) ||
          (user.email && b.clientEmail?.toLowerCase() === user.email.toLowerCase())
        );
      } else {
        const list = [];
        
        // 1. Busca por e-mail
        if (user.email) {
          const qEmail = query(collection(db, 'bookings'), where('clientEmail', '==', user.email));
          const snapEmail = await getDocs(qEmail);
          snapEmail.forEach(doc => {
            list.push({ id: doc.id, ...doc.data() });
          });
        }
        
        // 2. Busca por telefone (caso tenha no perfil e seja diferente)
        if (profile && profile.phone) {
          const qPhone = query(collection(db, 'bookings'), where('clientPhone', '==', profile.phone));
          const snapPhone = await getDocs(qPhone);
          snapPhone.forEach(doc => {
            if (!list.some(b => b.id === doc.id)) {
              list.push({ id: doc.id, ...doc.data() });
            }
          });
        }
        
        allBookings = list;
      }

      // Ordenar e separar agendamentos
      const todayStr = new Date().toISOString().split('T')[0];
      
      const active = allBookings.filter(b => {
        if (b.status === 'cancelado') return false;
        return b.date >= todayStr;
      }).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

      const past = allBookings.filter(b => {
        return b.status === 'cancelado' || b.date < todayStr;
      }).sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));

      setActiveBookings(active);
      setPastBookings(past);

      // Fetch packages templates and client packages balance
      let pkgs = [];
      let cps = [];
      let srvs = [];

      if (isDemo) {
        pkgs = JSON.parse(localStorage.getItem('demo_packages') || '[]');
        cps = JSON.parse(localStorage.getItem('demo_client_packages') || '[]');
        srvs = JSON.parse(localStorage.getItem('demo_services') || '[]');
      } else {
        const snapPkgs = await getDocs(collection(db, 'packages'));
        snapPkgs.forEach(d => pkgs.push({ id: d.id, ...d.data() }));

        const snapCps = await getDocs(collection(db, 'client_packages'));
        snapCps.forEach(d => cps.push({ id: d.id, ...d.data() }));

        const snapSrvs = await getDocs(collection(db, 'services'));
        snapSrvs.forEach(d => srvs.push({ id: d.id, ...d.data() }));
      }

      setPackages(pkgs);
      setServices(srvs);

      // Filter client packages for the current user/client
      const filteredCps = cps.filter(cp => {
        const cleanPhone = profile?.phone || '';
        const cleanEmail = user.email?.toLowerCase() || '';
        
        return (cleanPhone && cp.clientPhone?.replace(/\D/g, '') === cleanPhone) ||
               (cleanEmail && cp.clientEmail?.toLowerCase() === cleanEmail);
      });
      setClientPackages(filteredCps);

    } catch (err) {
      console.error('Erro ao carregar dados do cliente:', err);
    } finally {
      setLoading(false);
    }
  };

  // Login com E-mail e Senha
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!auth) return;
    setAuthLoading(true);
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error(err);
      setAuthError(getFriendlyAuthMessage(err.code));
    } finally {
      setAuthLoading(false);
    }
  };

  // Cadastro de Novo Usuário
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!auth) return;
    if (!name || !phone) {
      setAuthError('Por favor, preencha todos os campos.');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      
      // Salvar perfil do cliente no Firestore ou LocalStorage
      const profileData = {
        name,
        email: email.toLowerCase(),
        phone: phone.replace(/\D/g, ''),
        userId: cred.user.uid,
        createdAt: new Date().toISOString()
      };

      if (!db) {
        const localClients = JSON.parse(localStorage.getItem('demo_client_profiles') || '[]');
        localClients.push(profileData);
        localStorage.setItem('demo_client_profiles', JSON.stringify(localClients));
      } else {
        const cleanPhone = phone.replace(/\D/g, '');
        const docRef = doc(db, 'client_profiles', cleanPhone);
        await updateDoc(docRef, profileData).catch(async () => {
          const { setDoc } = await import('firebase/firestore');
          await setDoc(docRef, profileData);
        });
      }
      
      await loadClientData(cred.user);
    } catch (err) {
      console.error(err);
      setAuthError(getFriendlyAuthMessage(err.code));
    } finally {
      setAuthLoading(false);
    }
  };

  // Login com Conta Google
  const handleGoogleLogin = async () => {
    if (!auth) return;
    setAuthLoading(true);
    setAuthError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error(err);
      setAuthError('Erro ao autenticar com o Google. Tente novamente.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Recuperação de Senha
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!email) {
      setAuthError('Digite seu e-mail para continuar.');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    try {
      if (!auth) {
        // Modo Demo
        setResetSuccess(true);
        // Tenta disparar o e-mail de simulação pelo SMTP caso o endpoint esteja rodando localmente
        try {
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'recuperacao_senha',
              clientEmail: email,
              clientName: 'Cliente',
              link: 'https://ojonquecortou.com.br/cliente?action=reset'
            })
          });
        } catch {
          // Ignore error in simulation mode
        }
      } else {
        await sendPasswordResetEmail(auth, email);
        setResetSuccess(true);
      }
    } catch (err) {
      console.error(err);
      setAuthError(getFriendlyAuthMessage(err.code));
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      navigate('/');
    } catch (err) {
      console.error('Erro ao deslogar:', err);
    }
  };

  const getFriendlyAuthMessage = (code) => {
    switch (code) {
      case 'auth/wrong-password':
        return 'Senha incorreta. Tente novamente.';
      case 'auth/user-not-found':
        return 'Cadastro não encontrado com este e-mail.';
      case 'auth/email-already-in-use':
        return 'Este e-mail já está em uso.';
      case 'auth/weak-password':
        return 'A senha deve ter pelo menos 6 caracteres.';
      case 'auth/invalid-email':
        return 'E-mail inválido.';
      default:
        return 'Erro na autenticação. Verifique os dados ou tente novamente.';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    if (dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    }
    return dateStr;
  };

  if (loading) {
    return (
      <main className="client-area-section">
        <div className="client-loading-wrap">
          <div className="client-spinner"></div>
          <p>Carregando sua Área do Cliente...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="client-area-section">
      <SEO 
        title="Área do Cliente - O Jon Que Cortou" 
        description="Acesse seus agendamentos, consulte seu histórico e gerencie seus horários com o Studio do Jon." 
      />
      
      <div className="container" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Caso NÃO esteja logado */}
        {!currentUser ? (
          <div style={{ margin: 'auto', width: '100%', padding: '40px 0' }}>
            <div className="client-auth-container">
              
              {resetMode ? (
                /* MODO RECUPERAÇÃO DE SENHA */
                <div>
                  <button 
                    onClick={() => { setResetMode(false); setResetSuccess(false); setAuthError(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '0 0 16px 0', cursor: 'pointer' }}
                  >
                    <ArrowLeft size={14} /> Voltar para o Login
                  </button>

                  <h1 className="client-auth-title">Recuperar Senha</h1>
                  
                  {resetSuccess ? (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                      <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '50%', background: 'rgba(47, 133, 90, 0.1)', color: '#2f855a', marginBottom: '16px' }}>
                        <Mail size={24} />
                      </div>
                      <p className="lead" style={{ fontSize: '15px', color: 'var(--ink)' }}>
                        Se o e-mail informado estiver cadastrado, enviamos um link com as instruções para redefinição da sua senha.
                      </p>
                      <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '8px' }}>
                        Verifique também sua caixa de spam ou lixo eletrônico.
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="client-auth-subtitle">
                        Informe o seu e-mail de acesso para receber o link de recuperação de senha.
                      </p>

                      {authError && (
                        <div className="client-error-banner">
                          <AlertCircle size={16} />
                          <span>{authError}</span>
                        </div>
                      )}

                      <form onSubmit={handlePasswordReset}>
                        <div className="client-form-group">
                          <label htmlFor="reset-email">E-mail Cadastrado</label>
                          <input 
                            type="email" 
                            id="reset-email"
                            className="client-input"
                            placeholder="seu-email@exemplo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>

                        <button 
                          type="submit" 
                          className="btn btn-accent client-auth-btn"
                          disabled={authLoading}
                        >
                          {authLoading ? 'Enviando...' : 'Enviar Link de Recuperação'}
                        </button>
                      </form>
                    </>
                  )}
                </div>
              ) : (
                /* MODO ENTRAR / REGISTRAR */
                <>
                  <div className="client-auth-tabs">
                    <button 
                      className={`client-auth-tab ${authMode === 'login' ? 'active' : ''}`}
                      onClick={() => { setAuthMode('login'); setAuthError(''); }}
                    >
                      Entrar
                    </button>
                    <button 
                      className={`client-auth-tab ${authMode === 'register' ? 'active' : ''}`}
                      onClick={() => { setAuthMode('register'); setAuthError(''); }}
                    >
                      Criar Conta
                    </button>
                  </div>

                  <h1 className="client-auth-title">
                    {authMode === 'login' ? 'Bem-vindo de volta' : 'Crie seu cadastro'}
                  </h1>
                  <p className="client-auth-subtitle">
                    {authMode === 'login' 
                      ? 'Acesse para ver e alterar seus agendamentos.' 
                      : 'Proteja seus horários e histórico de serviços.'}
                  </p>

                  {authError && (
                    <div className="client-error-banner">
                      <AlertCircle size={16} />
                      <span>{authError}</span>
                    </div>
                  )}

                  <form onSubmit={authMode === 'login' ? handleEmailLogin : handleRegister}>
                    {authMode === 'register' && (
                      <>
                        <div className="client-form-group">
                          <label htmlFor="reg-name">Seu Nome Completo</label>
                          <input 
                            type="text" 
                            id="reg-name"
                            className="client-input"
                            placeholder="Ex: Maria Souza"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="client-form-group">
                          <label htmlFor="reg-phone">WhatsApp (com DDD)</label>
                          <input 
                            type="tel" 
                            id="reg-phone"
                            className="client-input"
                            placeholder="Ex: 31988887777"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                          />
                        </div>
                      </>
                    )}

                    <div className="client-form-group">
                      <label htmlFor="reg-email">E-mail</label>
                      <input 
                        type="email" 
                        id="reg-email"
                        className="client-input"
                        placeholder="seu-email@exemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="client-form-group">
                      <label htmlFor="reg-password">Senha</label>
                      <input 
                        type="password" 
                        id="reg-password"
                        className="client-input"
                        placeholder="Mínimo 6 caracteres"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>

                    {authMode === 'login' && (
                      <div style={{ textAlign: 'right', marginTop: '-8px', marginBottom: '16px' }}>
                        <button 
                          type="button" 
                          onClick={() => { setResetMode(true); setAuthError(''); }}
                          style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}
                        >
                          Esqueceu a senha?
                        </button>
                      </div>
                    )}

                    <button 
                      type="submit" 
                      className="btn btn-accent client-auth-btn"
                      disabled={authLoading}
                    >
                      {authLoading ? 'Processando...' : (authMode === 'login' ? 'Entrar na Conta' : 'Criar minha Conta')}
                    </button>
                  </form>

                  <div className="client-divider">ou acesse com</div>

                  <button 
                    type="button" 
                    className="btn client-google-btn"
                    onClick={handleGoogleLogin}
                    disabled={authLoading}
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18">
                      <path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.79 2.7v2.25h2.9c1.69-1.55 2.69-3.85 2.69-6.58z"/>
                      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.2l-2.9-2.25c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.58-5.05-3.71H.92v2.33C2.4 16.03 5.46 18 9 18z"/>
                      <path fill="#FBBC05" d="M3.95 10.7c-.18-.54-.28-1.12-.28-1.7s.1-1.16.28-1.7V4.97H.92c-.6 1.2-1.07 2.57-1.07 4.03s.47 2.83 1.07 4.03l3.03-2.33z"/>
                      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35L15 2.2C13.46.77 11.42 0 9 0 5.46 0 2.4 1.97.92 4.97l3.03 2.33c.71-2.13 2.7-3.71 5.05-3.71z"/>
                    </svg>
                    Entrar com Google
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          
          /* Caso ESTEJA logado */
          <div style={{ padding: '40px 0' }}>
            <div className="client-dashboard-header">
              <div>
                <h1 className="client-welcome-title">Olá, {clientProfile?.name?.split(' ')[0] || currentUser?.displayName?.split(' ')[0] || 'Cliente'}!</h1>
                <p className="client-welcome-desc">Gerencie seus agendamentos e consulte seu histórico no Studio do Jon.</p>
              </div>
              <button 
                className="btn btn-ghost" 
                onClick={handleLogout}
                style={{ padding: '8px 16px', fontSize: '0.8rem' }}
              >
                <LogOut size={14} style={{ marginRight: '6px' }} /> Sair
              </button>
            </div>

            <div className="client-dashboard-grid">
              
              {/* Coluna da Esquerda: Agendamentos Ativos */}
              <div>
                <div className="client-card">
                  <h2 className="client-card-title">
                    <Calendar size={20} style={{ color: 'var(--accent)' }} /> Seus Próximos Horários
                  </h2>

                  {activeBookings.length === 0 ? (
                    <div className="client-empty-state">
                      <Calendar size={36} />
                      <p>Você não possui nenhum agendamento futuro no momento.</p>
                      <Link to="/agendar" className="btn btn-accent" style={{ marginTop: '16px' }}>
                        <PlusCircle size={16} /> Agendar Agora
                      </Link>
                    </div>
                  ) : (
                    activeBookings.map((b) => {
                      const svc = b.serviceName || b.service?.name || '';
                      const colorInfo = getServiceColor(svc);
                      return (
                      <div key={b.id} className="client-booking-item" style={{ borderLeft: `3px solid ${colorInfo.color}` }}>
                        <div className="client-booking-info">
                          <h3 className="client-booking-service">{svc}</h3>
                          <div className="client-booking-meta">
                            <span>📅 {formatDate(b.date)}</span>
                            <span>⏰ {b.time}</span>
                            {b.professionalName && <span>💇‍♂️ {b.professionalName}</span>}
                          </div>
                          <span className={`client-status-badge ${b.status?.toLowerCase() || 'pendente'}`}>
                            {b.status || 'Pendente'}
                          </span>
                        </div>
                        <div className="client-booking-actions">
                          <Link 
                            to={`/agendar?rescheduleId=${b.id}`} 
                            className="btn btn-ghost"
                            style={{ padding: '8px 16px', fontSize: '0.75rem', fontWeight: 700 }}
                          >
                            Remarcar
                          </Link>
                          <Link 
                            to={`/cancelar?id=${b.id}`} 
                            className="btn"
                            style={{ 
                              padding: '8px 16px', 
                              fontSize: '0.75rem', 
                              fontWeight: 700,
                              borderColor: '#e53e3e',
                              color: '#e53e3e',
                              background: 'transparent'
                            }}
                          >
                            Cancelar
                          </Link>
                        </div>
                      </div>
                    );
                    })
                  )}
                </div>

                {/* Histórico de Agendamentos */}
                <div className="client-card">
                  <h2 className="client-card-title">
                    <Scissors size={20} style={{ color: 'var(--accent)' }} /> Histórico de Visitas
                  </h2>

                  {pastBookings.length === 0 ? (
                    <p style={{ color: 'var(--muted)', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>
                      Nenhum serviço anterior registrado em sua conta.
                    </p>
                  ) : (
                    <div className="client-history-list">
                      {pastBookings.map((b) => {
                        const svc = b.serviceName || b.service?.name || '';
                        const colorInfo = getServiceColor(svc);
                        return (
                        <div key={b.id} className="client-history-item" style={{ borderLeft: `3px solid ${colorInfo.color}` }}>
                          <div className="client-history-left">
                            <span className="client-history-service">{svc}</span>
                            <span className="client-history-date">📅 {formatDate(b.date)} às {b.time}</span>
                          </div>
                          <span className={`client-status-badge ${b.status?.toLowerCase() || 'finalizado'}`}>
                            {b.status || 'Finalizado'}
                          </span>
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Coluna da Direita: Perfil & Ações Rápidas */}
              <div>
                <div className="client-card">
                  <h2 className="client-card-title">
                    <User size={20} style={{ color: 'var(--accent)' }} /> Seus Dados
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.9rem' }}>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', fontFamily: 'var(--mono)' }}>Nome</span>
                      <strong>{clientProfile?.name || currentUser?.displayName || 'Não informado'}</strong>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', fontFamily: 'var(--mono)' }}>WhatsApp</span>
                      <strong>{clientProfile?.phone ? clientProfile.phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3') : 'Não informado'}</strong>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', fontFamily: 'var(--mono)' }}>E-mail</span>
                      <strong>{currentUser?.email}</strong>
                    </div>
                  </div>
                </div>

                {/* Seus Pacotes Promocionais */}
                <div className="client-card">
                  <h2 className="client-card-title">
                    <Scissors size={20} style={{ color: 'var(--accent)' }} /> Seus Pacotes
                  </h2>
                  {clientPackages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '16px 0' }}>
                      <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Você ainda não adquiriu nenhum pacote promocional.</p>
                      <button 
                        className="btn btn-outline" 
                        style={{ marginTop: 12, fontSize: '0.8rem', width: '100%' }}
                        onClick={() => setShowAcquirePackageModal(true)}
                      >
                        Adquirir um Pacote
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {clientPackages.map(cp => {
                        const totalRemaining = Object.values(cp.balance || {}).reduce((sum, v) => sum + v, 0);
                        return (
                          <div key={cp.id} style={{ border: '1px solid var(--rule)', padding: 14, borderRadius: 8, background: 'var(--bg-warm)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                              <strong style={{ fontSize: '0.95rem' }}>{cp.packageName}</strong>
                              <span className={`status-badge ${cp.status === 'active' ? 'confirmado' : cp.status === 'finished' ? 'finalizado' : 'pendente'}`}>
                                {cp.status === 'active' ? 'Ativo' : cp.status === 'finished' ? 'Finalizado' : 'Aguardando Pagamento'}
                              </span>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                              {Object.keys(cp.balance || {}).map(srvId => {
                                const srv = services.find(s => s.id === srvId);
                                const srvName = srv ? srv.name : srvId;
                                const remaining = cp.balance[srvId];
                                return (
                                  <div key={srvId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                    <span style={{ color: 'var(--muted)' }}>{srvName}:</span>
                                    <strong style={{ color: remaining > 0 ? 'var(--accent)' : 'var(--muted)' }}>{remaining} sessões</strong>
                                  </div>
                                );
                              })}
                            </div>
                            
                            {totalRemaining > 0 && cp.status === 'active' && (
                              <Link 
                                to="/agendar" 
                                className="btn btn-accent" 
                                style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', padding: '8px', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                              >
                                Agendar com Crédito
                              </Link>
                            )}
                          </div>
                        );
                      })}
                      
                      <button 
                        className="btn btn-ghost" 
                        style={{ width: '100%', border: '1px dashed var(--rule)', fontSize: '0.8rem', background: 'transparent' }}
                        onClick={() => setShowAcquirePackageModal(true)}
                      >
                        Adquirir Outro Pacote
                      </button>
                    </div>
                  )}
                </div>

                <div className="client-card" style={{ background: 'var(--surface)' }}>
                  <h2 className="client-card-title" style={{ fontSize: '18px' }}>Ações Rápidas</h2>
                  <div className="client-quick-actions">
                    <Link to="/agendar" className="btn btn-accent client-quick-btn">
                      Agendar Novo Horário
                    </Link>
                    <a href="https://wa.me/5531983044059" target="_blank" rel="noreferrer" className="btn btn-ghost client-quick-btn">
                      Falar no WhatsApp
                    </a>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      {/* MODAL: ADQUIRIR PACOTE */}
      {showAcquirePackageModal && (() => {
        const handleAcquirePackage = async (pkgTemplate) => {
          const isDemo = !db;
          const initialBalance = {};
          if (pkgTemplate.services) {
            pkgTemplate.services.forEach(s => {
              initialBalance[s.serviceId] = s.sessions;
            });
          }

          const payload = {
            clientId: clientProfile?.phone || currentUser.uid,
            clientName: clientProfile?.name || currentUser.displayName || 'Cliente',
            clientPhone: clientProfile?.phone || '',
            clientEmail: currentUser.email || '',
            packageId: pkgTemplate.id,
            packageName: pkgTemplate.name,
            pricePaid: pkgTemplate.price,
            paymentMethod: 'Pendente',
            datePurchased: new Date().toISOString().split('T')[0],
            status: 'pending_payment',
            balance: initialBalance,
            usage: []
          };

          try {
            setAuthLoading(true);
            if (isDemo) {
              const local = localStorage.getItem('demo_client_packages');
              const current = local ? JSON.parse(local) : [];
              const newCp = { id: 'cp_' + Date.now(), ...payload };
              const next = [newCp, ...current];
              localStorage.setItem('demo_client_packages', JSON.stringify(next));
              setClientPackages(prev => [newCp, ...prev]);
            } else {
              const { collection: _col, addDoc: _addDoc } = await import('firebase/firestore');
              const docRef = await _addDoc(_col(db, 'client_packages'), payload);
              const newCp = { id: docRef.id, ...payload };
              setClientPackages(prev => [newCp, ...prev]);
            }
            setShowAcquirePackageModal(false);
            alert('Sua solicitação do pacote foi criada! Realize o pagamento de R$ ' + Number(pkgTemplate.price).toFixed(2) + ' no dia do seu primeiro atendimento para liberar seus créditos.');
          } catch (err) {
            console.error('Erro ao adquirir pacote:', err);
            alert('Não foi possível registrar a solicitação do pacote.');
          } finally {
            setAuthLoading(false);
          }
        };

        return (
          <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div className="modal-content" style={{ background: 'var(--surface)', padding: 24, borderRadius: 12, width: '90%', maxWidth: 500, maxMonth: '80%', overflowY: 'auto' }}>
              <h3 style={{ margin: '0 0 10px 0' }}>Adquirir Pacote Promocional</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 20 }}>
                Selecione um pacote abaixo para solicitar a aquisição. A ativação ocorrerá mediante pagamento na recepção do salão.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                {packages.length === 0 ? (
                  <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--muted)' }}>Nenhum pacote disponível para aquisição.</p>
                ) : (
                  packages.map(pkg => (
                    <div key={pkg.id} style={{ border: '1px solid var(--rule)', padding: 14, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <strong style={{ fontSize: '0.95rem', display: 'block' }}>{pkg.name}</strong>
                          <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{pkg.description}</span>
                        </div>
                        <span style={{ fontWeight: 700, color: '#2f855a', fontSize: '1rem' }}>
                          R$ {Number(pkg.price).toFixed(2)}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.8rem', color: 'var(--ink)', background: 'var(--bg-warm)', padding: 8, borderRadius: 4 }}>
                        <span style={{ fontWeight: 600, display: 'block', marginBottom: 4, fontSize: '0.75rem', color: 'var(--muted)' }}>Serviços Inclusos:</span>
                        {pkg.services && pkg.services.map((item, idx) => {
                          const srv = services.find(s => s.id === item.serviceId);
                          return (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>{srv ? srv.name : item.serviceId}</span>
                              <strong>{item.sessions} sessões</strong>
                            </div>
                          );
                        })}
                      </div>

                      <button 
                        className="btn btn-accent" 
                        style={{ marginTop: 8, width: '100%', fontSize: '0.8rem', padding: 8 }}
                        onClick={() => handleAcquirePackage(pkg)}
                      >
                        Solicitar este Pacote
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowAcquirePackageModal(false)}>
                  Fechar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  </main>
);
}
