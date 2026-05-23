import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../config/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import SEO from '../../components/SEO';
import { Arrow } from '../../components/NewDesignComponents';
import './Admin.css';

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
        // Modo Demo: Bypass local se Firebase não estiver configurado
        console.log('Login efetuado via modo Demo');
        localStorage.setItem('admin_logged', 'true');
        navigate('/admin/agenda');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        localStorage.setItem('admin_logged', 'true');
        navigate('/admin/agenda');
      }
    } catch (err) {
      console.warn('Erro ao autenticar com Firebase Auth:', err.message);
      
      // Se falhar por conexão (ex: chaves mockadas), oferece opção de entrar em Modo Demo
      if (err.code === 'auth/invalid-api-key' || err.code === 'auth/network-request-failed' || !auth) {
        setError('Erro de conexão com o banco de dados. Deseja entrar em Modo Demonstração local?');
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
      setError('Por favor, insira seu e-mail no campo acima para recuperar a senha.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
      setError('');
    } catch (err) {
      setError('Erro ao enviar e-mail de recuperação. Verifique se o e-mail está correto.');
    }
  };

  const handleDemoBypass = () => {
    localStorage.setItem('admin_logged', 'true');
    navigate('/admin/agenda');
  };

  return (
    <main className="admin-login-page text-center">
      <SEO title="Acesso Administrativo | Studio do Jon" description="Painel interno de controle e agendamento." />

      <div className="login-card">
        <header className="login-header">
          <div className="login-logo-container" style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <img src="/logo-app.png" alt="Logo O Jon Que Cortou" style={{ width: '90px', height: '90px', borderRadius: '16px', border: '2.5px solid var(--accent)', boxShadow: '0 6px 18px rgba(255, 0, 127, 0.2)' }} />
          </div>
          <div className="logo-text">Studio do Jon</div>
          <h2>Painel <span className="italic">BackOffice</span></h2>
          <p>Insira suas credenciais para gerenciar a agenda e fichas das clientes.</p>
        </header>

        {error && (
          <div className="error-message">
            {error}
            {demoMode && (
              <button type="button" className="demo-btn-link" onClick={handleDemoBypass}>
                Entrar como Demonstrativo
              </button>
            )}
          </div>
        )}

        {successMsg && (
          <div className="success-message" style={{ color: 'var(--accent)', marginBottom: '16px', fontSize: '14px', fontWeight: '500' }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group text-left">
            <label htmlFor="email">E-mail de Acesso</label>
            <input 
              type="email" 
              id="email" 
              required 
              placeholder="contato@ojonquecortou.com.br" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group text-left">
            <label htmlFor="password">Senha de Segurança</label>
            <input 
              type="password" 
              id="password" 
              required 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div style={{ textAlign: 'right', marginBottom: '20px' }}>
            <button 
              type="button" 
              onClick={handleForgotPassword}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '14px', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Esqueceu a senha?
            </button>
          </div>

          <button type="submit" className="btn btn-accent w-100" disabled={loading}>
            {loading ? 'Verificando...' : 'Acessar Painel'} <Arrow />
          </button>
          
          <button 
            type="button" 
            className="btn btn-ghost w-100" 
            style={{ marginTop: 12, borderColor: 'var(--rule)', color: 'var(--ink)' }}
            onClick={handleDemoBypass}
          >
            Entrar como Demonstrativo
          </button>
        </form>

        <div className="login-footer">
          <a href="/">← Voltar para o Site</a>
        </div>
      </div>
    </main>
  );
};

export default AdminLogin;
