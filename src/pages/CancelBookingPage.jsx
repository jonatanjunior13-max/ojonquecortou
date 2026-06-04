import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db, withTimeout } from '../config/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { Calendar, Clock, Scissors, User, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';
import { syncBookingToGoogle } from '../utils/gcalSync';
import './CancelBookingPage.css';

export default function CancelBookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadBooking() {
      if (!bookingId) {
        setError('Código do agendamento inválido ou ausente.');
        setLoading(false);
        return;
      }

      // Check local storage fallback first (demo mode compatibility)
      const localBookings = JSON.parse(localStorage.getItem('demo_bookings') || '[]');
      const localBooking = localBookings.find(b => b.id === bookingId);

      if (!db) {
        // Mode simulation/offline
        if (localBooking) {
          setBooking(localBooking);
        } else {
          setError('Agendamento não encontrado no modo de simulação.');
        }
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'bookings', bookingId);
        const docSnap = await withTimeout(getDoc(docRef), 5000);

        if (docSnap.exists()) {
          setBooking({ id: docSnap.id, ...docSnap.data() });
        } else if (localBooking) {
          setBooking(localBooking);
        } else {
          setError('Desculpe, não encontramos nenhum agendamento com esse código.');
        }
      } catch (err) {
        console.error('Erro ao buscar agendamento:', err);
        if (localBooking) {
          setBooking(localBooking);
        } else {
          setError('Erro de conexão ao buscar os dados. Verifique sua conexão e tente novamente.');
        }
      } finally {
        setLoading(false);
      }
    }

    loadBooking();
  }, [bookingId]);

  const handleConfirmCancel = async () => {
    if (!booking) return;
    setCancelling(true);

    const isDemoMode = !db || bookingId.startsWith('demo-') || !bookingsInDB(bookingId);

    async function bookingsInDB(id) {
      try {
        const docSnap = await getDoc(doc(db, 'bookings', id));
        return docSnap.exists();
      } catch {
        return false;
      }
    }

    try {
      if (db && !isDemoMode) {
        const docRef = doc(db, 'bookings', booking.id);
        await updateDoc(docRef, { status: 'cancelado' });
        syncBookingToGoogle(booking.id).catch(err => console.warn(err));

        try {
          // Deletar transação com base no bookingId
          const q = query(collection(db, 'financial_transactions'), where('bookingId', '==', booking.id));
          const qSnap = await getDocs(q);
          for (const docRef of qSnap.docs) {
            await deleteDoc(docRef.ref);
          }

          // Deletar transação com base no telefone e data (fallback)
          if (booking.clientPhone && booking.date) {
            const q2 = query(
              collection(db, 'financial_transactions'),
              where('clientPhone', '==', booking.clientPhone),
              where('date', '==', booking.date)
            );
            const q2Snap = await getDocs(q2);
            for (const docRef of q2Snap.docs) {
              await deleteDoc(docRef.ref);
            }
          }
        } catch (deleteErr) {
          console.error('Erro ao deletar transações financeiras (Cancel Page):', deleteErr);
        }
      }

      // Update local storage representation in all cases for consistency
      const localBookings = JSON.parse(localStorage.getItem('demo_bookings') || '[]');
      const updatedLocalBookings = localBookings.map(b => 
        b.id === booking.id ? { ...b, status: 'cancelado' } : b
      );
      localStorage.setItem('demo_bookings', JSON.stringify(updatedLocalBookings));

      const localTx = localStorage.getItem('demo_financial') || localStorage.getItem('demo_transactions');
      if (localTx) {
        const arr = JSON.parse(localTx);
        const filtered = arr.filter(t => 
          t.bookingId !== booking.id && 
          !(t.clientPhone === booking.clientPhone && t.date === booking.date)
        );
        localStorage.setItem('demo_financial', JSON.stringify(filtered));
        localStorage.setItem('demo_transactions', JSON.stringify(filtered));
      }

      // Trigger cancel email confirmation (to client & admin)
      if (booking.clientEmail) {
        try {
          let displayDate = booking.date;
          if (displayDate && displayDate.includes('-')) {
            displayDate = displayDate.split('-').reverse().join('/');
          }
          await fetch('/api/send-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'agendamento_cancelado',
              clientEmail: booking.clientEmail,
              clientName: booking.clientName,
              serviceName: booking.serviceName || booking.service?.name || 'Serviço',
              date: displayDate,
              time: booking.time,
              cancelledBy: 'client'
            }),
          });
        } catch (emailErr) {
          console.warn('Erro ao disparar email de cancelamento:', emailErr);
        }
      }

      setSuccess(true);
      setBooking(prev => ({ ...prev, status: 'cancelado' }));
    } catch (err) {
      console.error('Erro ao cancelar agendamento:', err);
      alert('Não foi possível processar o cancelamento. Tente novamente mais tarde.');
    } finally {
      setCancelling(false);
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

  return (
    <div className="cancel-booking-page">
      <SEO 
        title="Cancelar Agendamento - O Jon Que Cortou" 
        description="Página de cancelamento de agendamento do Studio do Jon."
      />
      
      <div className="cancel-card-wrapper">
        <header className="cancel-header">
          <div className="logo-circle">J</div>
          <h1>O Jon Que Cortou</h1>
          <p className="subtitle">Cancelamento ou Remarcação de Horário</p>
        </header>

        {loading ? (
          <div className="cancel-body loading-state">
            <div className="spinner"></div>
            <p>Buscando os detalhes do seu agendamento...</p>
          </div>
        ) : error ? (
          <div className="cancel-body error-state">
            <AlertTriangle className="error-icon" size={48} />
            <h2>Algo deu errado</h2>
            <p>{error}</p>
            <button className="btn-back" onClick={() => navigate('/')}>
              <ArrowLeft size={16} /> Voltar para o início
            </button>
          </div>
        ) : success || booking.status === 'cancelado' ? (
          <div className="cancel-body success-state">
            <CheckCircle2 className="success-icon" size={64} />
            <h2>Horário Cancelado</h2>
            <p className="lead">Seu agendamento foi cancelado com sucesso no sistema.</p>
            <p className="detail">Enviamos um e-mail de confirmação do cancelamento para você.</p>
            
            <div className="details-summary">
              <p><strong>Serviço:</strong> {booking.serviceName || booking.service?.name}</p>
              <p><strong>Data:</strong> {formatDate(booking.date)} às {booking.time}</p>
            </div>

            <button className="btn-primary" onClick={() => navigate('/agendar')}>
              Agendar Novo Horário
            </button>
          </div>
        ) : (
          <div className="cancel-body confirm-state">
            <h2>Deseja cancelar ou remarcar?</h2>
            <p className="warning-text">
              Você pode alterar o horário do seu agendamento ou confirmar o cancelamento definitivo abaixo.
            </p>

            <div className="booking-details-box">
              <div className="detail-item">
                <User size={18} className="detail-icon" />
                <div>
                  <span className="lbl">Cliente</span>
                  <span className="val">{booking.clientName}</span>
                </div>
              </div>

              <div className="detail-item">
                <Scissors size={18} className="detail-icon" />
                <div>
                  <span className="lbl">Serviço</span>
                  <span className="val">{booking.serviceName || booking.service?.name}</span>
                </div>
              </div>

              <div className="detail-item">
                <Calendar size={18} className="detail-icon" />
                <div>
                  <span className="lbl">Data</span>
                  <span className="val">{formatDate(booking.date)}</span>
                </div>
              </div>

              <div className="detail-item">
                <Clock size={18} className="detail-icon" />
                <div>
                  <span className="lbl">Horário</span>
                  <span className="val">{booking.time}</span>
                </div>
              </div>
            </div>

            <div className="actions-row">
              <button 
                className="btn-reschedule" 
                onClick={() => navigate(`/agendar?rescheduleId=${booking.id}`)}
              >
                Alterar Horário (Remarcar)
              </button>
              <button 
                className="btn-cancel-confirm" 
                onClick={handleConfirmCancel}
                disabled={cancelling}
              >
                {cancelling ? 'Cancelando...' : 'Confirmar Cancelamento'}
              </button>
              <button className="btn-cancel-abort" onClick={() => navigate('/')}>
                Não, manter horário original
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
