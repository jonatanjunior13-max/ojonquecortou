import React, { useState, useEffect } from 'react';
import { db, withTimeout } from '../config/firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import SEO from '../components/SEO';
import { Arrow } from '../components/NewDesignComponents';
import { Clock, ChevronDown, ChevronUp, Sparkles, Check, MessageCircle } from 'lucide-react';
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
const TIME_SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

// Gera datas disponíveis para agendamento (próximos 60 dias, exceto domingos e segundas)
const getAvailableDates = () => {
  const dates = [];
  const today = new Date();
  
  for (let i = 1; i <= 60; i++) {
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + i);
    
    const dayOfWeek = nextDate.getDay();
    // Domingo = 0, Segunda = 1 (Salão fechado nesses dias)
    if (dayOfWeek !== 0 && dayOfWeek !== 1) {
      // Encontrar a segunda-feira da semana correspondente
      const monday = new Date(nextDate);
      const diff = nextDate.getDay() === 0 ? -6 : 1 - nextDate.getDay();
      monday.setDate(nextDate.getDate() + diff);
      const weekKey = monday.toISOString().split('T')[0];
      
      let weekLabel = monday.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
      weekLabel = `Semana de ${weekLabel.replace('.', '')}`;

      dates.push({
        raw: nextDate.toISOString().split('T')[0],
        formatted: nextDate.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }),
        display: nextDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        weekKey,
        weekLabel
      });
    }
  }
  return dates;
};

const BookingPage = () => {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [bookedTimes, setBookedTimes] = useState([]);
  
  // Helper to detect WhatsApp-only services (Coloração, Luzes, Retoque de raiz)
  const isWhatsappOnlyService = (name) => {
    if (!name) return false;
    const normalized = name.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return normalized.includes('colora') || normalized.includes('luzes') || normalized.includes('retoque de raiz');
  };

  // Helper to map name keywords to emojis and taglines matching ServicesPage.jsx
  const getServiceExtraDetails = (name) => {
    if (!name) return { emoji: '✨', tagline: '' };
    const normalized = name.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    // Corte + Tratamento or Combo Corte
    if (normalized.includes('corte') && (normalized.includes('tratamento') || normalized.includes('terapia') || normalized.includes('trp'))) {
      return { emoji: '✨', tagline: 'O Queridinho do Studio' };
    }
    // Corte Especializado or Corte com o Jon
    if (normalized.includes('corte com o jon') || normalized.includes('corte especializado')) {
      return { emoji: '✂️', tagline: 'Ondulados, Cacheados e Crespos' };
    }
    // Manutenção de corte
    if (normalized.includes('manutencao')) {
      return { emoji: '📏', tagline: 'Exclusivo para clientes recorrentes' };
    }
    // Tratamento Personalizado
    if (normalized.includes('tratamento personalizado')) {
      return { emoji: '💆', tagline: 'Saúde da Fibra Capilar' };
    }
    // Detox
    if (normalized.includes('detox')) {
      return { emoji: '🌿', tagline: 'Saúde do Couro Cabeludo' };
    }
    // Inside TRP / Reconstrução
    if (normalized.includes('trp') || normalized.includes('reconstrucao')) {
      return { emoji: '💎', tagline: 'Tecnologia Deep Complex' };
    }
    // Mechas e Luzes
    if (normalized.includes('luzes') || normalized.includes('mechas')) {
      return { emoji: '🌟', tagline: 'Morena Iluminada e Loiros' };
    }
    // Coloração Completa
    if (normalized.includes('coloracao completa')) {
      return { emoji: '🎨', tagline: 'A cor que você desejar, o Jon faz' };
    }
    // Retoque de raiz
    if (normalized.includes('retoque')) {
      return { emoji: '🖌️', tagline: 'Uniformidade e Saúde' };
    }
    // Lavar e Finalizar
    if (normalized.includes('lavar') || normalized.includes('finalizar')) {
      return { emoji: '🧴', tagline: 'Definição e Volume' };
    }

    return { emoji: '✨', tagline: '' };
  };
  
  // Semana ativa para calendário de 60 dias
  const [activeWeekKey, setActiveWeekKey] = useState(() => {
    const initialDates = getAvailableDates();
    return initialDates[0]?.weekKey || '';
  });
  
  // Catálogo visual states
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [showMoreServices, setShowMoreServices] = useState(false);
  
  // Dados do cliente
  const [clientData, setClientData] = useState({
    name: '',
    phone: '',
    email: '',
    hairType: '3A',
    notes: '',
    birthdate: ''
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

      // Timeout fallback se o Firestore falhar/travar na carga
      const serviceTimeout = setTimeout(() => {
        console.warn('Conexão com Firestore excedeu tempo limite ao carregar serviços. Ativando Modo Demo.');
        setIsDemoMode(true);
        const localData = localStorage.getItem('demo_services');
        setServices(localData ? JSON.parse(localData) : SEED_SERVICES);
      }, 3500);

      try {
        const querySnapshot = await withTimeout(getDocs(collection(db, 'services')), 3500);
        clearTimeout(serviceTimeout);
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
        clearTimeout(serviceTimeout);
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

  const dates = getAvailableDates();

  // Extrair semanas únicas para renderizar no seletor
  const weeks = [];
  const seenWeeks = new Set();
  dates.forEach(d => {
    if (!seenWeeks.has(d.weekKey)) {
      seenWeeks.add(d.weekKey);
      weeks.push({
        key: d.weekKey,
        label: d.weekLabel
      });
    }
  });

  // Busca horários já agendados na data selecionada no Firestore
  useEffect(() => {
    if (!selectedDate) return;

    const fetchBookings = async () => {
      if (!db) {
        setIsDemoMode(true);
        setBookedTimes(['11:00', '14:00']);
        return;
      }

      // Timeout fallback se o Firestore travar ao ler agenda
      const bookingsTimeout = setTimeout(() => {
        console.warn('Timeout ao carregar horários. Ativando modo Demo.');
        setIsDemoMode(true);
        setBookedTimes(['11:00', '14:00']);
        setLoading(false);
      }, 3500);

      try {
        setLoading(true);
        const q = query(
          collection(db, 'bookings'),
          where('date', '==', selectedDate)
        );
        const querySnapshot = await withTimeout(getDocs(q), 3500);
        clearTimeout(bookingsTimeout);
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
        clearTimeout(bookingsTimeout);
        console.warn('Erro ao conectar ao Firebase, ativando modo Demo:', err);
        setIsDemoMode(true);
        setBookedTimes(['11:00', '14:00']);
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
      clientBirthdate: clientData.birthdate || '',
      hairType: clientData.hairType,
      notes: clientData.notes,
      status: 'pendente', // pendente, confirmado, finalizado, cancelado
      createdAt: new Date().toISOString()
    };

    try {
      if (isDemoMode || !db) {
        console.log('Agendamento simulado (Demo):', bookingPayload);
        const localBookings = JSON.parse(localStorage.getItem('demo_bookings') || '[]');
        localBookings.push(bookingPayload);
        localStorage.setItem('demo_bookings', JSON.stringify(localBookings));
      } else {
        try {
          await withTimeout(addDoc(collection(db, 'bookings'), bookingPayload), 4500);
        } catch (dbErr) {
          console.warn('Erro/Timeout ao salvar no Firestore. Ativando fallback local:', dbErr);
          setIsDemoMode(true);
          const localBookings = JSON.parse(localStorage.getItem('demo_bookings') || '[]');
          localBookings.push(bookingPayload);
          localStorage.setItem('demo_bookings', JSON.stringify(localBookings));
        }
      }
      
      localStorage.setItem('last_booking', JSON.stringify(bookingPayload));
      setSuccess(true);
      setStep(4);
    } catch (err) {
      console.error('Erro ao processar agendamento:', err);
      // Ainda simula o sucesso para não travar a cliente
      setIsDemoMode(true);
      const localBookings = JSON.parse(localStorage.getItem('demo_bookings') || '[]');
      localBookings.push(bookingPayload);
      localStorage.setItem('demo_bookings', JSON.stringify(localBookings));
      
      localStorage.setItem('last_booking', JSON.stringify(bookingPayload));
      setSuccess(true);
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  const selectedDateObj = dates.find(d => d.raw === selectedDate);

  const getWhatsAppMessage = () => {
    if (!selectedService) return '';
    const dateFormatted = selectedDateObj?.display || selectedDate;
    const priceText = selectedService.priceType === 'A partir de' 
      ? `A partir de R$ ${(selectedService.promoPrice ?? selectedService.price)?.toFixed(2)}` 
      : `R$ ${(selectedService.promoPrice ?? selectedService.price)?.toFixed(2)}`;
    
    return `Olá Jon! Gostaria de confirmar meu agendamento sob orçamento solicitado pelo site:
- *Cliente:* ${clientData.name}
- *WhatsApp:* ${clientData.phone}
- *Serviço:* ${selectedService.name}
- *Data:* ${dateFormatted}
- *Horário:* ${selectedTime}
- *Valor:* ${priceText}
- *Curvatura:* ${clientData.hairType}
${clientData.notes ? `- *Observações:* ${clientData.notes}` : ''}`;
  };


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
        {step === 1 && (() => {
          const categories = ['Todos', ...new Set(services.map(s => s.category || 'Outros'))];
          const filteredServices = selectedCategory === 'Todos'
            ? services
            : services.filter(s => (s.category || 'Outros') === selectedCategory);

          const toggleDescription = (id, e) => {
            e.stopPropagation();
            setExpandedDescriptions(prev => ({
              ...prev,
              [id]: !prev[id]
            }));
          };

          return (
            <div className="booking-step">
              <h2>Escolha o serviço desejado</h2>
              <p className="step-desc">Selecione uma categoria abaixo para filtrar nosso menu de serviços e tratamentos capilares.</p>
              
              {/* Abas de Categorias */}
              <div className="booking-category-tabs">
                {categories.map(cat => {
                  const count = cat === 'Todos'
                    ? services.length
                    : services.filter(s => (s.category || 'Outros') === cat).length;
                  return (
                    <button
                      key={cat}
                      type="button"
                      className={`booking-category-tab-btn ${selectedCategory === cat ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat}
                      <span className="booking-tab-count">{count}</span>
                    </button>
                  );
                })}
              </div>

              {/* Grid do Catálogo */}
              {services.length === 0 ? (
                <div className="booking-catalog-loading">
                  <div className="spinner"></div>
                  <p>Buscando nosso menu de serviços...</p>
                </div>
              ) : (
                <div className="booking-services-grid">
                  {filteredServices.map(service => {
                    const isExpanded = !!expandedDescriptions[service.id];
                    const hasPromo = !!service.promoPrice;
                    const isFeatured = !!(service.isPrimary || service.featured);
                    const isSelected = selectedService?.id === service.id;
                    const isWaOnly = isWhatsappOnlyService(service.name);
                    const { emoji, tagline } = getServiceExtraDetails(service.name);
                    
                    return (
                      <div 
                        key={service.id} 
                        className={`booking-service-card ${isSelected ? 'selected' : ''} ${isFeatured ? 'featured' : ''} ${isWaOnly ? 'whatsapp-card' : ''}`}
                        onClick={(e) => {
                          if (isWaOnly) {
                            e.preventDefault();
                            e.stopPropagation();
                            const text = encodeURIComponent(`Olá! Gostaria de um orçamento para ${service.name}.`);
                            window.open(`https://wa.me/553135866673?text=${text}`, '_blank');
                            return;
                          }
                          setSelectedService(service);
                          setStep(2);
                        }}
                      >
                        {/* Linha superior */}
                        <div className="booking-card-top-decor">
                          <div className="booking-card-emoji-category">
                            <span className="booking-service-emoji">{emoji}</span>
                            <span className="booking-service-category-tag">{service.category || 'Outros'}</span>
                          </div>
                          <div className="booking-service-badges-row">
                            {isFeatured && (
                              <span className="booking-service-badge highlight">
                                <Sparkles size={10} /> Destaque
                              </span>
                            )}
                            {hasPromo && (
                              <span className="booking-service-badge promo">
                                Oferta
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Corpo do card */}
                        <div className="booking-service-card-body">
                          <h3 className="booking-service-card-title">{service.name}</h3>
                          {tagline && <p className="booking-service-tagline">{tagline}</p>}
                          
                          <div className="booking-service-duration-info">
                            <Clock size={12} />
                            <span>Duração aproximada: {service.duration || 60} min</span>
                          </div>
                          
                          {service.description && (
                            <div className="booking-service-desc-wrapper">
                              <p className={`booking-service-description ${isExpanded ? 'expanded' : 'collapsed'}`}>
                                {service.description}
                              </p>
                              {service.description.length > 120 && (
                                <button
                                  type="button"
                                  className="booking-btn-toggle-desc"
                                  onClick={(e) => toggleDescription(service.id, e)}
                                >
                                  {isExpanded ? 'Ocultar descrição ▲' : 'Ver descrição completa ▼'}
                                </button>
                              )}
                            </div>
                          )}

                          {service.includes && service.includes.length > 0 && (
                            <div className="booking-service-includes">
                              <p className="booking-service-includes-title">O que está incluso:</p>
                              <ul>
                                {service.includes.map((item, idx) => (
                                  <li key={idx}>✓ {item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Rodapé do card */}
                        <div className="booking-service-card-footer">
                          <div className="booking-service-pricing-area">
                            <span className="booking-pricing-label">Valor</span>
                            {hasPromo ? (
                              <div className="booking-price-comparison">
                                <span className="booking-price-old-strike">R$ {service.price.toFixed(2)}</span>
                                <span className="booking-price-new-value">
                                  <span className="booking-p-type-prefix">{service.priceType === 'A partir de' ? 'A partir de ' : ''}</span>
                                  <strong>R$ {service.promoPrice.toFixed(2)}</strong>
                                </span>
                              </div>
                            ) : (
                              <div className="booking-price-standard-value">
                                <span className="booking-p-type-prefix">{service.priceType === 'A partir de' ? 'A partir de ' : ''}</span>
                                <strong>R$ {service.price.toFixed(2)}</strong>
                              </div>
                            )}
                          </div>
                          
                          <div className="booking-service-selection-indicator">
                            {isWaOnly ? (
                              <span className="booking-select-action-label whatsapp-btn">
                                <MessageCircle size={12} style={{ marginRight: 4, display: 'inline-block', verticalAlign: 'middle' }} />
                                Me chama no Whatsapp
                              </span>
                            ) : isSelected ? (
                              <span className="booking-selected-pill"><Check size={12} /> Selecionado</span>
                            ) : (
                              <span className="booking-select-action-label">Agendar</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              <div className="step-actions" style={{ marginTop: 24 }}>
                <button 
                  className="btn btn-accent" 
                  disabled={!selectedService}
                  onClick={() => setStep(2)}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Escolher Data e Hora <Arrow />
                </button>
              </div>
            </div>
          );
        })()}

        {/* PASSO 2: DATA E HORA */}
        {step === 2 && (
          <div className="booking-step">
            <h2>Selecione o melhor dia e horário</h2>
            
            {/* Seletor de Semanas */}
            <div className="booking-week-tabs">
              {weeks.map(w => {
                const isSelectedDateInWeek = dates.find(d => d.raw === selectedDate)?.weekKey === w.key;
                return (
                  <button
                    key={w.key}
                    type="button"
                    className={`booking-week-tab-btn ${activeWeekKey === w.key ? 'active' : ''}`}
                    onClick={() => setActiveWeekKey(w.key)}
                  >
                    {w.label}
                    {isSelectedDateInWeek && <span className="booking-week-tab-indicator" />}
                  </button>
                );
              })}
            </div>

            <div className="date-picker-grid">
              {dates
                .filter(d => d.weekKey === activeWeekKey)
                .map(d => (
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

              <div className="form-group">
                <label htmlFor="birthdate">Data de Nascimento (Opcional)</label>
                <input 
                  type="date" 
                  id="birthdate" 
                  name="birthdate" 
                  value={clientData.birthdate || ''} 
                  onChange={handleInputChange} 
                />
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
            <div className="success-icon" style={{ background: 'rgba(212, 175, 55, 0.1)', borderColor: 'var(--accent)', color: 'var(--accent)' }}>✓</div>
            <h2>Agendamento Solicitado!</h2>
            <p className="lead" style={{ fontSize: '0.95rem' }}>
              Seu horário foi pré-reservado com sucesso na nossa agenda. <br />
              Analisaremos a sua solicitação e entraremos em contato em breve para confirmar!
            </p>
            
            <div className="summary-card" style={{ padding: '16px', margin: '20px auto', maxWidth: '380px' }}>
              <h3 style={{ fontSize: '0.85rem', marginBottom: '8px', paddingBottom: '4px' }}>Resumo do Agendamento</h3>
              <div className="summary-row" style={{ fontSize: '0.85rem', marginBottom: '4px' }}>
                <strong>Serviço:</strong>
                <span>{selectedService?.name}</span>
              </div>
              <div className="summary-row" style={{ fontSize: '0.85rem', marginBottom: '4px' }}>
                <strong>Orçamento:</strong>
                <span>
                  {selectedService?.priceType === 'A partir de' ? 'A partir de ' : ''}
                  R$ {(selectedService?.promoPrice ?? selectedService?.price)?.toFixed(2)}
                </span>
              </div>
              <div className="summary-row" style={{ fontSize: '0.85rem', marginBottom: '4px' }}>
                <strong>Data:</strong>
                <span>{selectedDateObj?.display}</span>
              </div>
              <div className="summary-row" style={{ fontSize: '0.85rem', marginBottom: '4px' }}>
                <strong>Horário:</strong>
                <span>{selectedTime}</span>
              </div>
            </div>

            <div style={{ marginTop: '32px', paddingTop: '16px', borderTop: '1px solid var(--rule)' }}>
              <a 
                href="/" 
                className="btn btn-accent" 
                style={{ 
                  padding: '12px 28px', 
                  fontSize: '13px', 
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  textDecoration: 'none'
                }}
              >
                Voltar para o Início ➔
              </a>
            </div>
          </div>
        )}

      </div>
    </main>
  );
};

export default BookingPage;
