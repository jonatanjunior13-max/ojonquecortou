import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../config/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import SEO from '../../components/SEO';
import '../../styles/admin-tokens.css';

const BronzeMonogram = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="72" height="72" rx="14" fill="#211D1A" />
    <rect x="0.5" y="0.5" width="71" height="71" rx="13.5" stroke="rgba(220,163,84,0.4)" />
    <text x="36" y="48" textAnchor="middle" fontFamily="Georgia, serif" fontSize="36" fontWeight="700" fill="#DCA354">J</text>
  </svg>
);

const loginStyle = {
  root: {
    minHeight: '100vh',
    background: 'var(--adm-bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  card: {
    background: 'var(--adm-surface)',
    border: '0.5px solid var(--adm-rule)',
    borderRadius: 'var(--adm-radius-lg)',
    padding: '40px 36px',
    width: '100%',
    maxWidth: 400,
    transition: 'border-color 0.3s',
  },
  logo: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 20,
  },
  brand: {
    textAlign: 'center',
    marginBottom: 8,
    fontSize: '1.35rem',
    fontFamily: 'Georgia, serif',
    color: 'var(--adm-text)',
    fontWeight: 700,
    letterSpacing: '0.5px',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: '0.83rem',
    color: 'var(--adm-muted)',
    marginBottom: 28,
    lineHeight: 1.5,
  },
  label: {
    display: 'block',
    fontSize: '0.78rem',
    fontWeight: 700,
    color: 'var(--adm-text-2)',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
  },
  input: {
    width: '100%',
    background: 'var(--adm-card)',
    border: '0.5px solid var(--adm-rule)',
    borderRadius: 'var(--adm-radius-sm)',
    padding: '11px 14px',
    color: 'var(--adm-text)',
    fontSize: '0.9rem',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  btnPrimary: {
    width: '100%',
    background: 'var(--adm-gold)',
    color: '#121110',
    border: 'none',
    borderRadius: 'var(--adm-radius-sm)',
    padding: '13px 0',
    fontSize: '0.92rem',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background 0.2s',
    marginTop: 4,
  },
  btnGhost: {
    width: '100%',
    background: 'none',
    color: 'var(--adm-muted)',
    border: '0.5px solid var(--adm-rule)',
    borderRadius: 'var(--adm-radius-sm)',
    padding: '11px 0',
    fontSize: '0.88rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    marginTop: 10,
    transition: 'border-color 0.2s, color 0.2s',
  },
  error: {
    background: 'rgba(226,75,74,0.1)',
    border: '0.5px solid var(--adm-danger)',
    borderRadius: 'var(--adm-radius-sm)',
    padding: '10px 14px',
    color: 'var(--adm-danger)',
    fontSize: '0.83rem',
    marginBottom: 20,
    lineHeight: 1.5,
  },
  success: {
    background: 'rgba(151,196,89,0.1)',
    border: '0.5px solid var(--adm-success)',
    borderRadius: 'var(--adm-radius-sm)',
    padding: '10px 14px',
    color: 'var(--adm-success)',
    fontSize: '0.83rem',
    marginBottom: 20,
  },
  forgotBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--adm-gold)',
    fontSize: '0.8rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
    padding: 0,
    textDecoration: 'underline',
  },
  back: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: '0.8rem',
  },
  backLink: {
    color: 'var(--adm-muted)',
    textDecoration: 'none',
  },
};

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      if (demoMode || !auth) {
        localStorage.setItem('admin_logged', 'true');
        navigate('/admin/hoje');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        localStorage.setItem('admin_logged', 'true');
        navigate('/admin/hoje');
      }
    } catch (err) {
      if (err.code === 'auth/invalid-api-key' || err.code === 'auth/network-request-failed' || !auth) {
        setError('Erro de conexão. Deseja entrar em Modo Demonstração?');
        setDemoMode(true);
      } else {
        setError('Credenciais inválidas. Verifique seu e-mail e senha.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Insira seu e-mail de acesso acima para receber o link de recuperação de senha.');
      return;
    }
    try {
      if (auth) {
        await sendPasswordResetEmail(auth, email.trim());
        setSuccessMsg(`E-mail de recuperação enviado com sucesso para ${email}! Verifique sua caixa de entrada.`);
        setError('');
      } else {
        navigate('/redefinir-senha');
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao enviar e-mail de recuperação. Acesse ojonquecortou.com.br/redefinir-senha');
    }
  };

  const handleDemoBypass = () => {
    localStorage.setItem('admin_logged', 'true');
    navigate('/admin/hoje');
  };

  return (
    <div className="admin-app" style={loginStyle.root}>
      <SEO title="Acesso Administrativo | Studio do Jon" description="Painel interno de controle e agendamento." />

      <div
        style={loginStyle.card}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(220,163,84,0.3)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--adm-rule)'; }}
      >
        <div style={loginStyle.logo}>
          <BronzeMonogram />
        </div>

        <div style={loginStyle.brand}>Studio do Jon</div>
        <p style={loginStyle.subtitle}>
          Painel <em>BackOffice</em> — insira suas credenciais para acessar a gestão.
        </p>

        {error && (
          <div style={loginStyle.error}>
            {error}
            {demoMode && (
              <div style={{ marginTop: 8 }}>
                <button type="button" style={loginStyle.forgotBtn} onClick={handleDemoBypass}>
                  Entrar como Demonstrativo
                </button>
              </div>
            )}
          </div>
        )}

        {successMsg && <div style={loginStyle.success}>{successMsg}</div>}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="email" style={loginStyle.label}>E-mail de Acesso</label>
            <input
              type="email"
              id="email"
              required
              placeholder="contato@ojonquecortou.com.br"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={loginStyle.input}
              onFocus={e => { e.target.style.borderColor = 'var(--adm-gold)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--adm-rule)'; }}
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <label htmlFor="password" style={loginStyle.label}>Senha</label>
            <input
              type="password"
              id="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={loginStyle.input}
              onFocus={e => { e.target.style.borderColor = 'var(--adm-gold)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--adm-rule)'; }}
            />
          </div>

          <div style={{ textAlign: 'right', marginBottom: 20 }}>
            <button type="button" onClick={handleForgotPassword} style={loginStyle.forgotBtn}>
              Esqueceu a senha?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={loginStyle.btnPrimary}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--adm-gold-deep)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--adm-gold)'; }}
          >
            {loading ? 'Verificando...' : 'Acessar Painel'}
          </button>

          <button
            type="button"
            onClick={handleDemoBypass}
            style={loginStyle.btnGhost}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--adm-rule-gold)'; e.currentTarget.style.color = 'var(--adm-text-2)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--adm-rule)'; e.currentTarget.style.color = 'var(--adm-muted)'; }}
          >
            Entrar como Demonstrativo
          </button>
        </form>

        <div style={loginStyle.back}>
          <a href="/" style={loginStyle.backLink}>← Voltar para o Site</a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
