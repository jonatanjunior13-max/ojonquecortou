import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import SEO from '../components/SEO';
import { Arrow } from '../components/NewDesignComponents';
import './Booking.css';

// Lista oficial de serviços fornecida pelo Jon
const SERVICES = [
  { id: 'corte-jon', name: 'Corte com o Jon', price: 150, duration: 60, desc: 'Diagnóstico com Leitura de Fio, corte visagista personalizado (a seco ou molhado conforme necessidade) e finalização estruturada.' },
  { id: 'combo-corte-tratamento', name: 'Combo Corte + Tratamento', price: 220, duration: 90, desc: 'O serviço completo de corte Leitura de Fio acompanhado de um protocolo de tratamento profundo (hidratação/nutrição/reconstrução) adequado ao seu fio.' },
  { id: 'tratamento-personalizado', name: 'Tratamento Personalizado', price: 120, duration: 60, desc: 'Higienização suave, aplicação de máscara de tratamento de alta performance escolhida sob medida e finalização técnica.' }
];

// Horários padrão de atendimento
const TIME_SLOTS = ['09:00', '10:30', '13:00', '14:30', '16:00', '17:30'];

const BookingPage = () => {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [bookedTimes, setBookedTimes] = useState([]);
  
  // Dados do cliente
  const [clientData, setClientData] = useState({
    name: '',
    phone: '',
    email: '',
    hairType: '3A',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Gera datas disponíveis para agendamento (próximos 14 dias, exceto domingos e segundas)
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 14; i++) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + i);
      
      const dayOfWeek = nextDate.getDay();
      // Domingo = 0, Segunda = 1 (Salão fechado nesses dias)
      if (dayOfWeek !== 0 && dayOfWeek !== 1) {
        dates.push({
          raw: nextDate.toISOString().split('T')[0],
          formatted: nextDate.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }),
          display: nextDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        });
      }
    }
    return dates;
  };

  const dates = getAvailableDates();

  // Busca horários já agendados na data selecionada no Firestore
  useEffect(() => {
    if (!selectedDate) return;

    const fetchBookings = async () => {
      try {
        setLoading(true);
        const q = query(
          collection(db, 'bookings'),
          where('date', '==', selectedDate)
        );
        const querySnapshot = await getDocs(q);
        const booked = [];
        querySnapshot.forEach((doc) => {
          booked.push(doc.data().time);
        });
        setBookedTimes(booked);
        setIsDemoMode(false);
      } catch (err) {
        console.warn('Erro ao conectar ao Firebase, ativando modo Demo:', err);
        setIsDemoMode(true);
        // Simulando alguns horários agendados aleatoriamente em modo Demo
        setBookedTimes(['10:30', '16:00']);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [selectedDate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setClientData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const bookingPayload = {
      service: selectedService,
      date: selectedDate,
      time: selectedTime,
      clientName: clientData.name,
      clientPhone: clientData.phone,
      clientEmail: clientData.email,
      hairType: clientData.hairType,
      notes: clientData.notes,
      status: 'pendente', // pendente, confirmado, finalizado, cancelado
      createdAt: new Date().toISOString()
    };

    try {
      if (isDemoMode) {
        // Simulação local de sucesso
        console.log('Agendamento simulado (Demo):', bookingPayload);
      } else {
        await addDoc(collection(db, 'bookings'), bookingPayload);
      }
      
      // Armazena no localStorage para mostrar à cliente na tela de sucesso
      localStorage.setItem('last_booking', JSON.stringify(bookingPayload));
      
      setSuccess(true);
      setStep(4);
    } catch (err) {
      console.error('Erro ao salvar agendamento:', err);
      alert('Ocorreu um erro ao salvar o agendamento. Por favor, tente novamente ou nos chame no WhatsApp.');
    } finally {
      setLoading(false);
    }
  };

  const selectedDateObj = dates.find(d => d.raw === selectedDate);

  return (
    <main className="booking-page container">
      <SEO 
        title="Agendar Horário | Studio do Jon" 
        description="Agende seu horário online no Studio do Jon em Caiçara, Belo Horizonte. Escolha seu serviço e reserve em poucos minutos." 
      />

      <header className="booking-header text-center">
        <h1 className="display">Agende sua <span className="italic">experiência.</span></h1>
        <p className="lead">Sem filas, sem ligações. Escolha o serviço ideal e garanta sua vaga na agenda do Jon.</p>
        
        {isDemoMode && (
          <div className="demo-banner">
            Aviso: Conexão rodando localmente (Modo Demonstração)
          </div>
        )}
      </header>

      {/* Indicador de passos */}
      <div className="step-indicator">
        <div className={`step-dot ${step >= 1 ? 'active' : ''}`} onClick={() => step > 1 && setStep(1)}>1. Serviço</div>
        <div className={`line ${step >= 2 ? 'active' : ''}`}></div>
        <div className={`step-dot ${step >= 2 ? 'active' : ''}`} onClick={() => step > 2 && setStep(2)}>2. Horário</div>
        <div className={`line ${step >= 3 ? 'active' : ''}`}></div>
        <div className={`step-dot ${step >= 3 ? 'active' : ''}`} onClick={() => step > 3 && setStep(3)}>3. Seus Dados</div>
      </div>

      <div className="booking-card-wrap">
        
        {/* PASSO 1: SELEÇÃO DE SERVIÇO */}
        {step === 1 && (
          <div className="booking-step">
            <h2>Escolha o serviço desejado</h2>
            <div className="services-list">
              {SERVICES.map(service => (
                <div 
                  key={service.id} 
                  className={`service-card ${selectedService?.id === service.id ? 'selected' : ''}`}
                  onClick={() => setSelectedService(service)}
                >
                  <div className="service-info">
                    <h3>{service.name}</h3>
                    <p className="desc">{service.desc}</p>
                    <span className="duration">Duração aproximada: {service.duration} min</span>
                  </div>
                  <div className="service-price">
                    R$ {service.price}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="step-actions">
              <button 
                className="btn btn-accent" 
                disabled={!selectedService}
                onClick={() => setStep(2)}
              >
                Escolher Data e Hora <Arrow />
              </button>
            </div>
          </div>
        )}

        {/* PASSO 2: DATA E HORA */}
        {step === 2 && (
          <div className="booking-step">
            <h2>Selecione o melhor dia e horário</h2>
            
            <div className="date-picker-grid">
              {dates.map(d => (
                <button
                  key={d.raw}
                  type="button"
                  className={`date-btn ${selectedDate === d.raw ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedDate(d.raw);
                    setSelectedTime(''); // reseta horário ao trocar o dia
                  }}
                >
                  <span className="weekday">{d.formatted.split(',')[0]}</span>
                  <span className="day">{d.formatted.split(',')[1]}</span>
                </button>
              ))}
            </div>

            {selectedDate && (
              <div className="time-picker-wrap">
                <h3>Horários disponíveis para {selectedDateObj?.display}:</h3>
                {loading ? (
                  <p>Buscando horários disponíveis...</p>
                ) : (
                  <div className="time-picker-grid">
                    {TIME_SLOTS.map(slot => {
                      const isBooked = bookedTimes.includes(slot);
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={isBooked}
                          className={`time-btn ${selectedTime === slot ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}
                          onClick={() => setSelectedTime(slot)}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="step-actions">
              <button className="btn btn-ghost" onClick={() => setStep(1)}>Voltar</button>
              <button 
                className="btn btn-accent" 
                disabled={!selectedDate || !selectedTime}
                onClick={() => setStep(3)}
              >
                Prosseguir para Dados <Arrow />
              </button>
            </div>
          </div>
        )}

        {/* PASSO 3: DADOS DO CLIENTE */}
        {step === 3 && (
          <form className="booking-step" onSubmit={handleSubmit}>
            <h2>Confirme seus dados para contato</h2>
            
            <div className="form-group">
              <label htmlFor="name">Seu Nome Completo *</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                required 
                placeholder="Ex: Maria da Silva" 
                value={clientData.name} 
                onChange={handleInputChange} 
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">WhatsApp (com DDD) *</label>
                <input 
                  type="tel" 
                  id="phone" 
                  name="phone" 
                  required 
                  placeholder="Ex: 31988887777" 
                  value={clientData.phone} 
                  onChange={handleInputChange} 
                />
                <span className="hint">Usaremos para enviar a confirmação de horário</span>
              </div>

              <div className="form-group">
                <label htmlFor="email">Seu Melhor E-mail *</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  required 
                  placeholder="Ex: maria@exemplo.com" 
                  value={clientData.email} 
                  onChange={handleInputChange} 
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="hairType">Qual a curvatura aproximada do seu cacho? *</label>
                <select id="hairType" name="hairType" value={clientData.hairType} onChange={handleInputChange}>
                  <option value="2A">2A (Ondulado Leve)</option>
                  <option value="2B">2B (Ondulado Médio)</option>
                  <option value="2C">2C (Ondulado Marcado)</option>
                  <option value="3A">3A (Cacho Solto/Largo)</option>
                  <option value="3B">3B (Cacho Espiral Médio)</option>
                  <option value="3C">3C (Cacho Fechado/Saca-Rolha)</option>
                  <option value="4A">4A (Crespo Definido)</option>
                  <option value="4B">4B (Crespo em Ziguezague)</option>
                  <option value="4C">4C (Crespo Muito Cerrado)</option>
                  <option value="NaoSei">Ainda não sei (vamos descobrir!)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Algum comentário ou histórico químico importante?</label>
              <textarea 
                id="notes" 
                name="notes" 
                rows="3" 
                placeholder="Ex: Passei por descoloração há 3 meses / Cabelo em transição..."
                value={clientData.notes}
                onChange={handleInputChange}
              ></textarea>
            </div>

            <div className="step-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}>Voltar</button>
              <button 
                type="submit" 
                className="btn btn-accent"
                disabled={loading}
              >
                {loading ? 'Finalizando...' : 'Confirmar Agendamento'} <Arrow />
              </button>
            </div>
          </form>
        )}

        {/* PASSO 4: SUCESSO */}
        {step === 4 && success && (
          <div className="booking-success text-center">
            <div className="success-icon">✓</div>
            <h2>Agendamento Realizado!</h2>
            <p className="lead">Seu horário foi reservado com sucesso no Studio do Jon.</p>
            
            <div className="summary-card">
              <h3>Detalhes do Horário:</h3>
              <div className="summary-row">
                <strong>Serviço:</strong>
                <span>{selectedService?.name}</span>
              </div>
              <div className="summary-row">
                <strong>Valor:</strong>
                <span>R$ {selectedService?.price}</span>
              </div>
              <div className="summary-row">
                <strong>Data:</strong>
                <span>{selectedDateObj?.display}</span>
              </div>
              <div className="summary-row">
                <strong>Horário:</strong>
                <span>{selectedTime}</span>
              </div>
            </div>

            <div className="alert alert-info" style={{ marginTop: 24 }}>
              📌 <strong>Confirmação de Horário:</strong> Enviamos os detalhes de confirmação para o seu e-mail e em breve você receberá nosso lembrete oficial no WhatsApp!
            </div>

            <div style={{ marginTop: 32 }}>
              <a href="/" className="btn btn-accent">Voltar para a Página Inicial</a>
            </div>
          </div>
        )}

      </div>
    </main>
  );
};

export default BookingPage;
