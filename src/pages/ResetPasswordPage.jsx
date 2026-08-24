import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { auth } from '../config/firebase';
import { sendPasswordResetEmail, confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import SEO from '../components/SEO';
import { Lock, Mail, ArrowLeft, CheckCircle, AlertCircle, KeyRound } from 'lucide-react';
import './ResetPasswordPage.css';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get('oobCode');

  // Estados
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifyingToken, setVerifyingToken] = useState(!!oobCode);
  const [targetEmail, setTargetEmail] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' }); // 'success' | 'error'

  // Se houver um código oobCode na URL, verifica se é válido
  useEffect(() => {
    if (!oobCode || !auth) {
      setVerifyingToken(false);
      return;
    }

    const checkCode = async () => {
      try {
        const userEmail = await verifyPasswordResetCode(auth, oobCode);
        setTargetEmail(userEmail);
      } catch (err) {
        console.error('Código de redefinição inválido ou expirado:', err);
        setStatus({
          type: 'error',
          message: 'Este link de redefinição de senha é inválido ou já expirou. Solicite um novo link abaixo.'
        });
      } finally {
        setVerifyingToken(false);
      }
    };

    checkCode();
  }, [oobCode]);

  // Solicitar e-mail de redefinição
  const handleRequestReset = async (e) => {
    e.preventDefault();
    if (!email) {
      setStatus({ type: 'error', message: 'Por favor, digite seu e-mail cadastrado.' });
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      if (!auth) {
        // Modo simulação
        setStatus({
          type: 'success',
          message: `Modo demonstração: Link de recuperação gerado para ${email}.`
        });
      } else {
        await sendPasswordResetEmail(auth, email.trim());
        setStatus({
          type: 'success',
          message: `E-mail de recuperação enviado com sucesso para ${email}! Verifique sua caixa de entrada e a pasta de spam.`
        });
        setEmail('');
      }
    } catch (err) {
      console.error('Erro ao enviar e-mail de redefinição:', err);
      let friendlyError = 'Não foi possível enviar o e-mail. Verifique se o endereço está correto.';
      if (err.code === 'auth/user-not-found') {
        friendlyError = 'Não encontramos nenhuma conta cadastrada com este e-mail.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyError = 'Por favor, insira um e-mail com formato válido.';
      }
      setStatus({ type: 'error', message: friendlyError });
    } finally {
      setLoading(false);
    }
  };

  // Confirmar nova senha com token oobCode
  const handleConfirmReset = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setStatus({ type: 'error', message: 'Por favor, preencha a nova senha e a confirmação.' });
      return;
    }

    if (newPassword.length < 6) {
      setStatus({ type: 'error', message: 'A nova senha deve ter no mínimo 6 caracteres.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'As senhas digitadas não coincidem. Tente novamente.' });
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      if (!auth) {
        setStatus({
          type: 'success',
          message: 'Senha alterada com sucesso! Redirecionando para o login...'
        });
        setTimeout(() => navigate('/admin/login'), 2500);
      } else {
        await confirmPasswordReset(auth, oobCode, newPassword);
        setStatus({
          type: 'success',
          message: 'Sua senha foi redefinida com sucesso! Você já pode acessar sua conta.'
        });
        setTimeout(() => navigate('/cliente'), 3000);
      }
    } catch (err) {
      console.error('Erro ao redefinir senha:', err);
      setStatus({
        type: 'error',
        message: 'Ocorreu um erro ao atualizar sua senha. O link pode ter expirado.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-page">
      <SEO
        title="Redefinir Senha | Studio do Jon"
        description="Recupere ou altere sua senha de acesso ao sistema do Studio do Jon."
      />

      <div className="reset-password-container">
        <div className="reset-password-header">
          <Link to="/" className="reset-back-link">
            <ArrowLeft size={16} /> Voltar para o site
          </Link>

          <div className="reset-logo-icon">
            <KeyRound size={28} color="#FBC5D3" />
          </div>

          <h1 className="reset-title">
            {oobCode ? 'Criar Nova Senha' : 'Redefinir Senha'}
          </h1>
          <p className="reset-subtitle">
            {oobCode
              ? (targetEmail ? `Defina a nova senha de acesso para ${targetEmail}` : 'Digite a sua nova senha nos campos abaixo.')
              : 'Insira o seu e-mail cadastrado para receber um link seguro de recuperação.'}
          </p>
        </div>

        {verifyingToken ? (
          <div className="reset-loading-box">
            <div className="spinner"></div>
            <p>Validando link de segurança...</p>
          </div>
        ) : (
          <>
            {status.message && (
              <div className={`reset-alert reset-alert-${status.type}`}>
                {status.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                <span>{status.message}</span>
              </div>
            )}

            {oobCode && !status.message?.includes('inválido ou já expirou') ? (
              <form onSubmit={handleConfirmReset} className="reset-form">
                <div className="form-group">
                  <label htmlFor="newPassword">Nova Senha</label>
                  <div className="input-with-icon">
                    <Lock size={18} className="input-icon" />
                    <input
                      type="password"
                      id="newPassword"
                      required
                      placeholder="Mínimo 6 caracteres"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirmar Nova Senha</label>
                  <div className="input-with-icon">
                    <Lock size={18} className="input-icon" />
                    <input
                      type="password"
                      id="confirmPassword"
                      required
                      placeholder="Repita a nova senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar Nova Senha'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRequestReset} className="reset-form">
                <div className="form-group">
                  <label htmlFor="resetEmail">E-mail Cadastrado</label>
                  <div className="input-with-icon">
                    <Mail size={18} className="input-icon" />
                    <input
                      type="email"
                      id="resetEmail"
                      required
                      placeholder="seuemail@exemplo.com.br"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <button type="submit" className="btn-submit" disabled={loading || !email}>
                  {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
                </button>
              </form>
            )}

            <div className="reset-links">
              <Link to="/agendar" className="reset-link">
                Ir para o Agendamento
              </Link>
              <span className="reset-dot">•</span>
              <Link to="/cliente" className="reset-link">
                Área do Cliente
              </Link>
              <span className="reset-dot">•</span>
              <Link to="/admin/login" className="reset-link">
                Acesso Admin
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
