import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db, withTimeout } from '../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Calendar, Clock, Scissors, User, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';
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
      }

      // Update local storage representation in all cases for consistency
      const localBookings = JSON.parse(localStorage.getItem('demo_bookings') || '[]');
      const updatedLocalBookings = localBookings.map(b => 
        b.id === booking.id ? { ...b, status: 'cancelado' } : b
      );
      localStorage.setItem('demo_bookings', JSON.stringify(updatedLocalBookings));

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
          <p className="subtitle">Cancelamento de Horário</p>
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
            <h2>Deseja realmente cancelar?</h2>
            <p className="warning-text">
              Confirme os dados abaixo antes de realizar o cancelamento. Esta ação não poderá ser desfeita.
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
                className="btn-cancel-confirm" 
                onClick={handleConfirmCancel}
                disabled={cancelling}
              >
                {cancelling ? 'Cancelando...' : 'Sim, Confirmar Cancelamento'}
              </button>
              <button className="btn-cancel-abort" onClick={() => navigate('/')}>
                Não, manter horário
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
