import React, { useState, useEffect } from 'react';
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
import { Calendar, Lock, Unlock, LogOut, Scissors, AlertCircle, ChevronRight, User, PlusCircle, ArrowLeft, Mail } from 'lucide-react';
import SEO from '../components/SEO';
import './ClientAreaPage.css';

export default function ClientAreaPage() {
  const navigate = useNavigate();

  // Estados de Autenticação
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
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
      await signInWithPopup(provider);
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
        } catch (simErr) {}
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
                    activeBookings.map((b) => (
                      <div key={b.id} className="client-booking-item">
                        <div className="client-booking-info">
                          <h3 className="client-booking-service">{b.serviceName || b.service?.name}</h3>
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
                    ))
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
                      {pastBookings.map((b) => (
                        <div key={b.id} className="client-history-item">
                          <div className="client-history-left">
                            <span className="client-history-service">{b.serviceName || b.service?.name}</span>
                            <span className="client-history-date">📅 {formatDate(b.date)} às {b.time}</span>
                          </div>
                          <span className={`client-status-badge ${b.status?.toLowerCase() || 'finalizado'}`}>
                            {b.status || 'Finalizado'}
                          </span>
                        </div>
                      ))}
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

                <div className="client-card" style={{ background: 'var(--surface)' }}>
                  <h2 className="client-card-title" style={{ fontSize: '18px' }}>Ações Rápidas</h2>
                  <div className="client-quick-actions">
                    <Link to="/agendar" className="btn btn-accent client-quick-btn">
                      Agendar Novo Horário
                    </Link>
                    <a href="https://wa.me/5531988887777" target="_blank" rel="noreferrer" className="btn btn-ghost client-quick-btn">
                      Falar no WhatsApp
                    </a>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </main>
  );
}
