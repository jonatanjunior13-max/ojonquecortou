import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, onSnapshot, query, addDoc, updateDoc, doc, getDocs } from 'firebase/firestore';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import './Admin.css';

// Lista de horários padrão
const TIME_SLOTS = ['09:00', '10:30', '13:00', '14:30', '16:00', '17:30'];

// Mapeia dias da semana
const DAYS_TRANSLATION = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const AdminDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  // Filtros de data (semana atual)
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // ajusta para segunda-feira
    return new Date(d.setDate(diff));
  });

  // Formulário para novo agendamento manual
  const [newBooking, setNewBooking] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    serviceName: 'Corte com o Jon',
    servicePrice: 150,
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    notes: ''
  });

  // Gera os 5 dias de atendimento da semana atual (Terça a Sábado)
  const getWeekDays = () => {
    const days = [];
    for (let i = 1; i <= 5; i++) { // Terça (2) a Sábado (6)
      const d = new Date(currentWeekStart);
      d.setDate(currentWeekStart.getDate() + i);
      days.push({
        raw: d.toISOString().split('T')[0],
        formattedWeekday: DAYS_TRANSLATION[d.getDay()],
        formattedDay: d.getDate(),
        displayDate: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      });
    }
    return days;
  };

  const weekDays = getWeekDays();

  // Escuta agendamentos no Firestore em tempo real
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'bookings'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const appts = [];
      snapshot.forEach((doc) => {
        appts.push({ id: doc.id, ...doc.data() });
      });
      setBookings(appts);
      setLoading(false);
      setIsDemoMode(false);
    }, (error) => {
      console.warn('Firestore real-time error, switching to Demo Mode:', error);
      setIsDemoMode(true);
      // Mock data para demonstração
      setBookings([
        {
          id: 'demo-1',
          clientName: 'Ana Souza',
          clientPhone: '31988887777',
          clientEmail: 'ana@email.com',
          service: { name: 'Corte com o Jon', price: 150 },
          date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0], // amanhã
          time: '09:00',
          status: 'confirmado',
          notes: 'Deseja volume e definição'
        },
        {
          id: 'demo-2',
          clientName: 'Carla Lima',
          clientPhone: '31977776666',
          clientEmail: 'carla@email.com',
          service: { name: 'Combo Corte + Tratamento', price: 220 },
          date: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().split('T')[0],
          time: '13:00',
          status: 'pendente',
          notes: 'Histórico de descoloração recente'
        }
      ]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentWeekStart]);

  const changeWeek = (direction) => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() + (direction * 7));
    setCurrentWeekStart(newStart);
  };

  // Atualizar status do agendamento
  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      if (isDemoMode) {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
        if (selectedBooking && selectedBooking.id === bookingId) {
          setSelectedBooking(prev => ({ ...prev, status: newStatus }));
        }
      } else {
        const apptRef = doc(db, 'bookings', bookingId);
        await updateDoc(apptRef, { status: newStatus });
        setSelectedBooking(null);
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      alert('Não foi possível atualizar o status do agendamento.');
    }
  };

  // Criar agendamento manual
  const handleAddManualBooking = async (e) => {
    e.preventDefault();
    const serviceMap = {
      'Corte com o Jon': 150,
      'Combo Corte + Tratamento': 220,
      'Tratamento Personalizado': 120
    };

    const payload = {
      clientName: newBooking.clientName,
      clientPhone: newBooking.clientPhone,
      clientEmail: newBooking.clientEmail,
      service: {
        name: newBooking.serviceName,
        price: serviceMap[newBooking.serviceName]
      },
      date: newBooking.date,
      time: newBooking.time,
      notes: newBooking.notes,
      status: 'confirmado',
      createdAt: new Date().toISOString()
    };

    try {
      if (isDemoMode) {
        setBookings(prev => [...prev, { id: 'demo-' + Date.now(), ...payload }]);
      } else {
        await addDoc(collection(db, 'bookings'), payload);
      }
      setShowAddModal(false);
      // Reset formulário
      setNewBooking({
        clientName: '',
        clientPhone: '',
        clientEmail: '',
        serviceName: 'Corte com o Jon',
        servicePrice: 150,
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        notes: ''
      });
    } catch (err) {
      console.error('Erro ao criar agendamento manual:', err);
      alert('Falha ao registrar agendamento manual.');
    }
  };

  // Métricas do Dashboard
  const activeBookings = bookings.filter(b => b.status !== 'cancelado');
  const pendingCount = bookings.filter(b => b.status === 'pendente').length;
  const revenueThisWeek = bookings
    .filter(b => b.status === 'finalizado' || b.status === 'confirmado')
    .reduce((sum, b) => sum + (b.service?.price || 150), 0);

  return (
    <div className="admin-dashboard">
      
      {/* Cards de Métricas */}
      <section className="admin-stats-grid">
        <div className="stat-card">
          <h3>Agendamentos Ativos</h3>
          <div className="value">{activeBookings.length}</div>
        </div>
        <div className="stat-card">
          <h3>Aguardando Confirmação</h3>
          <div className="value" style={{ color: '#ecc94b' }}>{pendingCount}</div>
        </div>
        <div className="stat-card">
          <h3>Estimativa de Receita (Semana)</h3>
          <div className="value" style={{ color: '#48bb78' }}>R$ {revenueThisWeek}</div>
        </div>
      </section>

      {/* Controles da Agenda */}
      <section className="calendar-controls">
        <div className="nav-buttons">
          <button className="btn-icon" onClick={() => changeWeek(-1)}><ChevronLeft size={16} /></button>
          <span style={{ fontWeight: 600 }}>
            Semana de {weekDays[0]?.displayDate} a {weekDays[4]?.displayDate}
          </span>
          <button className="btn-icon" onClick={() => changeWeek(1)}><ChevronRight size={16} /></button>
        </div>

        <button className="btn btn-accent" style={{ padding: '8px 16px', fontSize: '0.9rem' }} onClick={() => setShowAddModal(true)}>
          <Plus size={16} style={{ marginRight: 6 }} /> Agendamento Manual
        </button>
      </section>

      {/* Grade da Agenda */}
      {loading ? (
        <p>Carregando agenda...</p>
      ) : (
        <div className="calendar-grid">
          {/* Cabeçalho de dias */}
          <div className="calendar-header">
            <div className="header-cell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Hora</div>
            {weekDays.map(day => (
              <div key={day.raw} className="header-cell">
                <span className="weekday">{day.formattedWeekday}</span>
                <span className="day">{day.formattedDay}</span>
              </div>
            ))}
          </div>

          {/* Linhas de Horários */}
          <div className="calendar-body">
            {TIME_SLOTS.map(slot => (
              <div key={slot} className="time-row">
                <div className="time-label-cell">{slot}</div>
                {weekDays.map(day => {
                  // Filtra o agendamento correspondente a este slot de hora e dia
                  const appt = bookings.find(b => b.date === day.raw && b.time === slot);
                  return (
                    <div key={day.raw} className="day-cell">
                      {appt && (
                        <div 
                          className={`appt-card ${appt.status}`}
                          onClick={() => setSelectedBooking(appt)}
                        >
                          <span className="appt-time">{appt.time}</span>
                          <span className="appt-client">{appt.clientName}</span>
                          <span className="appt-service">{appt.service?.name || appt.serviceName}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: DETALHE DO AGENDAMENTO */}
      {selectedBooking && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3>Ficha do Agendamento</h3>
              <button className="btn-icon" onClick={() => setSelectedBooking(null)}><X size={18} /></button>
            </div>
            
            <div className="detail-row">
              <label>Cliente:</label>
              <span>{selectedBooking.clientName}</span>
            </div>
            <div className="detail-row">
              <label>WhatsApp:</label>
              <span>{selectedBooking.clientPhone}</span>
            </div>
            <div className="detail-row">
              <label>E-mail:</label>
              <span>{selectedBooking.clientEmail}</span>
            </div>
            <div className="detail-row">
              <label>Serviço:</label>
              <span>{selectedBooking.service?.name || selectedBooking.serviceName}</span>
            </div>
            <div className="detail-row">
              <label>Preço:</label>
              <span>R$ {selectedBooking.service?.price}</span>
            </div>
            <div className="detail-row">
              <label>Data/Hora:</label>
              <span>{selectedBooking.date} às {selectedBooking.time}</span>
            </div>
            <div className="detail-row">
              <label>Curvatura:</label>
              <span>{selectedBooking.hairType || 'Não informada'}</span>
            </div>
            <div className="detail-row">
              <label>Observações:</label>
              <span>{selectedBooking.notes || 'Nenhuma observação.'}</span>
            </div>
            <div className="detail-row">
              <label>Status Atual:</label>
              <span className={`status-badge ${selectedBooking.status}`}>{selectedBooking.status}</span>
            </div>

            <div className="modal-actions">
              <div style={{ display: 'flex', gap: 8 }}>
                {selectedBooking.status === 'pendente' && (
                  <button className="btn btn-accent" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => handleUpdateStatus(selectedBooking.id, 'confirmado')}>
                    Confirmar Horário
                  </button>
                )}
                {selectedBooking.status === 'confirmado' && (
                  <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '0.85rem', borderColor: '#48bb78', color: '#48bb78' }} onClick={() => handleUpdateStatus(selectedBooking.id, 'finalizado')}>
                    Marcar como Atendido
                  </button>
                )}
              </div>
              
              {selectedBooking.status !== 'cancelado' && (
                <button 
                  className="btn btn-ghost" 
                  style={{ padding: '6px 12px', fontSize: '0.85rem', borderColor: '#e53e3e', color: '#e53e3e' }}
                  onClick={() => handleUpdateStatus(selectedBooking.id, 'cancelado')}
                >
                  Cancelar Agendamento
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CRIAR AGENDAMENTO MANUAL */}
      {showAddModal && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleAddManualBooking}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3>Registrar Horário Manual</h3>
              <button type="button" className="btn-icon" onClick={() => setShowAddModal(false)}><X size={18} /></button>
            </div>

            <div className="form-group">
              <label>Nome Completo do Cliente *</label>
              <input 
                type="text" 
                required 
                placeholder="Ex: Pedro Santos"
                value={newBooking.clientName}
                onChange={e => setNewBooking(prev => ({ ...prev, clientName: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label>WhatsApp *</label>
              <input 
                type="tel" 
                required 
                placeholder="Ex: 31999998888"
                value={newBooking.clientPhone}
                onChange={e => setNewBooking(prev => ({ ...prev, clientPhone: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label>E-mail (Opcional)</label>
              <input 
                type="email" 
                placeholder="Ex: pedro@email.com"
                value={newBooking.clientEmail}
                onChange={e => setNewBooking(prev => ({ ...prev, clientEmail: e.target.value }))}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Serviço *</label>
                <select 
                  value={newBooking.serviceName}
                  onChange={e => setNewBooking(prev => ({ ...prev, serviceName: e.target.value }))}
                >
                  <option value="Corte com o Jon">Corte com o Jon (R$ 150)</option>
                  <option value="Combo Corte + Tratamento">Combo Corte + Tratamento (R$ 220)</option>
                  <option value="Tratamento Personalizado">Tratamento Personalizado (R$ 120)</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Data *</label>
                <input 
                  type="date" 
                  required
                  value={newBooking.date}
                  onChange={e => setNewBooking(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Horário *</label>
                <select 
                  value={newBooking.time}
                  onChange={e => setNewBooking(prev => ({ ...prev, time: e.target.value }))}
                >
                  {TIME_SLOTS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Notas Internas</label>
              <textarea 
                rows="2"
                placeholder="Ex: Cliente prefere finalização sem creme pesado."
                value={newBooking.notes}
                onChange={e => setNewBooking(prev => ({ ...prev, notes: e.target.value }))}
              ></textarea>
            </div>

            <div className="modal-actions" style={{ justifyContent: 'flex-end', gap: 12 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-accent">Salvar na Agenda</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
