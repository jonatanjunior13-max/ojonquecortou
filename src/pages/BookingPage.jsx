import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import SEO from '../components/SEO';
import { Arrow } from '../components/NewDesignComponents';
import './Booking.css';

const SEED_SERVICES = [
  {
    id: 'coloracao-completa',
    name: 'Coloração Completa',
    category: 'Cabelo',
    description: 'Quer uma transformação completa ou renovar a cor dos seus fios? A Coloração Completa é para quem deseja uma coloração total, seja para cobrir os fios brancos ou mudar completamente o tom. Antes de começar, conversamos sobre o tom perfeito para você, e garantimos que a cor escolhida vai realçar o seu estilo, sempre cuidando da saúde dos fios.',
    price: 499,
    priceType: 'A partir de',
    promoPrice: null,
    duration: 120,
    isPrimary: true
  },
  {
    id: 'combo-corte-tratamento-personalizado',
    name: 'Combo - Corte com o Jon + Tratamento personalizado',
    category: 'Cabelo',
    description: 'Cachos precisando de tratamento e um corte novo? Esse pacote inclui uma restauração profunda que devolve a maciez e o brilho, e um corte personalizado, pensado para valorizar os seus cachos. A finalização é sob medida para que seus cachos saiam com definição e brilho.',
    price: 320,
    priceType: 'Fixo',
    promoPrice: 230,
    duration: 60,
    isPrimary: true
  },
  {
    id: 'combo-corte-terapia-trp',
    name: 'Combo Corte com o Jon + Terapia de Reposição Proteica',
    category: 'Cabelo',
    description: 'Um tratamento completo pra quem quer se apaixonar de novo pelo próprio cabelo! O corte valoriza cada cacho e o TRP devolve vida, brilho e força com tecnologia que age na fibra capilar de dentro pra fora. Resultado? Cachos leves, saudáveis e com movimento real. Vem viver essa transformação — seu cabelo vai sentir a diferença desde o primeiro toque! 💫',
    price: 370,
    priceType: 'Fixo',
    promoPrice: 300,
    duration: 60,
    isPrimary: true
  },
  {
    id: 'corte-jon',
    name: 'Corte com o Jon',
    category: 'Cabelo',
    description: 'Nada de cortar os cachos de qualquer jeito! A gente conversa primeiro para entender o que você quer e o que seus cachos precisam. O corte é personalizado, feito para realçar o formato natural dos seus fios, garantindo movimento. Esqueça os cortes genéricos e padronizados. Aqui, cada corte é único, assim como você. Tudo começa com uma entrevista detalhada, onde eu, Jon, descubro tudo sobre o seu estilo de vida, suas preferências e suas necessidades.',
    price: 190,
    priceType: 'Fixo',
    promoPrice: null,
    duration: 60,
    isPrimary: true
  },
  {
    id: 'detox-estimulante',
    name: 'Detox Estimulante',
    category: 'Cabelo',
    description: "Dê um respiro para o seu couro cabeludo com o nosso serviço 'Purifica & Cresce'. Este tratamento esfoliante detox é a solução perfeita para eliminar impurezas, excesso de oleosidade e estimular o crescimento saudável do cabelo. Com a combinação de ingredientes naturais e técnicas especializadas, este tratamento vai revitalizar o seu couro cabeludo, promovendo um ambiente saudável para o crescimento dos seus fios.",
    price: 180,
    priceType: 'Fixo',
    promoPrice: null,
    duration: 60,
    isPrimary: false
  },
  {
    id: 'inside-trp',
    name: 'Inside TRP – Reconstrução Premium',
    category: 'Cabelo',
    description: 'Tratamento proteico premium com a tecnologia Deep Complex pra recuperar fios danificados por química, calor ou processos agressivos. Atua desde o córtex até as cutículas: repara massa perdida, reduz porosidade, evita quebra e sela a fibra. Resultado: cachos mais fortes, elásticos e vibrantes — sem sofrimento.',
    price: 180,
    priceType: 'Fixo',
    promoPrice: null,
    duration: 60,
    isPrimary: false
  },
  {
    id: 'lavar-finalizar',
    name: 'Lavar e Finalizar',
    category: 'Cabelo',
    description: 'Aqui seus cachos recebem a finalização perfeita! A gente conversa sobre o que você quer – definição, volume ou leveza – e faço a finalização sob medida. O resultado são cachos definidos, soltos, com brilho e prontos para arrasar. Tudo pensado para que seus fios fiquem no melhor formato. Importante: NÃO É DEDOLISS',
    price: 100,
    priceType: 'Fixo',
    promoPrice: null,
    duration: 60,
    isPrimary: false
  },
  {
    id: 'luzes-morena-iluminada',
    name: 'Luzes ou Morena Iluminada',
    category: 'Cabelo',
    description: 'Ilumine seus fios sem agredir! Com nossa técnica exclusiva de Mechas Sem Descolorante, você consegue um efeito iluminado e natural, perfeito para quem quer uma transformação suave e saudável. Ideal para cabelos cacheados, ondulados e lisos, garantindo brilho e definição sem danificar a estrutura do fio.',
    price: 699,
    priceType: 'A partir de',
    promoPrice: null,
    duration: 180,
    isPrimary: false
  }
];

// Horários padrão de atendimento
const TIME_SLOTS = ['09:00', '10:30', '13:00', '14:30', '16:00', '17:30'];

const BookingPage = () => {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [bookedTimes, setBookedTimes] = useState([]);
  const [showMoreServices, setShowMoreServices] = useState(false);
  
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

  // Busca lista de serviços cadastrados no salão
  useEffect(() => {
    const fetchServices = async () => {
      if (!db) {
        setIsDemoMode(true);
        const localData = localStorage.getItem('demo_services');
        if (localData) {
          setServices(JSON.parse(localData));
        } else {
          setServices(SEED_SERVICES);
        }
        return;
      }

      try {
        const querySnapshot = await getDocs(collection(db, 'services'));
        const list = [];
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        if (list.length > 0) {
          setServices(list);
        } else {
          setServices(SEED_SERVICES);
        }
      } catch (err) {
        console.warn('Erro ao buscar serviços do Firestore, usando locais:', err);
        setIsDemoMode(true);
        const localData = localStorage.getItem('demo_services');
        setServices(localData ? JSON.parse(localData) : SEED_SERVICES);
      }
    };
    fetchServices();
  }, []);

  const primaryServices = services.filter(s => s.isPrimary);
  const additionalServices = services.filter(s => !s.isPrimary);

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
      if (!db) {
        setIsDemoMode(true);
        setBookedTimes(['10:30', '16:00']);
        return;
      }

      try {
        setLoading(true);
        const q = query(
          collection(db, 'bookings'),
          where('date', '==', selectedDate)
        );
        const querySnapshot = await getDocs(q);
        const booked = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status !== 'cancelado') {
            booked.push(data.time);
          }
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
      if (isDemoMode || !db) {
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
            
            <div className="services-section-title">Serviços Principais</div>
            <div className="services-list">
              {primaryServices.map(service => (
                <div 
                  key={service.id} 
                  className={`service-card ${selectedService?.id === service.id ? 'selected' : ''}`}
                  onClick={() => setSelectedService(service)}
                >
                  <div className="service-info">
                    <h3>{service.name}</h3>
                    <p className="desc">{service.description}</p>
                    <span className="duration">Duração aproximada: {service.duration} min</span>
                  </div>
                  <div className="service-price">
                    {service.promoPrice ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ textDecoration: 'line-through', fontSize: '0.8rem', opacity: 0.6 }}>
                          R$ {service.price.toFixed(2)}
                        </span>
                        <span style={{ color: '#2f855a', fontWeight: 'bold' }}>
                          R$ {service.promoPrice.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <span>
                        {service.priceType === 'A partir de' ? 'A partir de ' : ''}
                        R$ {service.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="more-services-trigger-wrap">
              <button 
                type="button" 
                className="btn btn-ghost more-services-btn" 
                onClick={() => setShowMoreServices(!showMoreServices)}
              >
                {showMoreServices ? 'Ocultar outros serviços ▲' : 'Ver mais serviços no salão ▼'}
              </button>
            </div>

            {showMoreServices && (
              <div className="additional-services-wrapper">
                <div className="services-section-title" style={{ marginTop: 24 }}>Outros Serviços</div>
                <div className="services-list additional-services-list">
                  {additionalServices.map(service => (
                    <div 
                      key={service.id} 
                      className={`service-card ${selectedService?.id === service.id ? 'selected' : ''}`}
                      onClick={() => setSelectedService(service)}
                    >
                      <div className="service-info">
                        <h3>{service.name}</h3>
                        <p className="desc">{service.description}</p>
                        <span className="duration">Duração aproximada: {service.duration} min</span>
                      </div>
                      <div className="service-price">
                        {service.promoPrice ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{ textDecoration: 'line-through', fontSize: '0.8rem', opacity: 0.6 }}>
                              R$ {service.price.toFixed(2)}
                            </span>
                            <span style={{ color: '#2f855a', fontWeight: 'bold' }}>
                              R$ {service.promoPrice.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span>
                            {service.priceType === 'A partir de' ? 'A partir de ' : ''}
                            R$ {service.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
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
                <span>
                  {selectedService?.priceType === 'A partir de' ? 'A partir de ' : ''}
                  R$ {(selectedService?.promoPrice ?? selectedService?.price)?.toFixed(2)}
                </span>
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
