import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../config/firebase';
import { 
  collection, onSnapshot, doc, addDoc, updateDoc, query, orderBy, limit, getDoc, setDoc 
} from 'firebase/firestore';
import { 
  Home as HomeIcon, Calendar as CalendarIcon, Plus, Menu, HelpCircle, 
  Bell, ChevronLeft, ChevronRight, DollarSign, User, Scissors, 
  ArrowRight, Shield, MessageSquare, Check, X, Phone, FileText, Info,
  Clock, Settings
} from 'lucide-react';
import './AdminMobile.css';

const DEFAULT_SETTINGS = {
  name: 'Studio do Jon',
  phone: '3135866673',
  address: 'Rua Jacuí, 312 - Floresta, Belo Horizonte - MG',
  instagram: 'https://instagram.com/ojonquecortou',
  feePix: 0,
  feeDebit: 1.9,
  feeCredit: 3.5,
  minAdvance: '2',
  autoApprove: false,
  waTemplate: 'Olá Jon, gostaria de confirmar meu agendamento...',
  waReminderEnabled: true,
  waReminderGateway: 'evolution',
  zApiInstanceId: '',
  zApiToken: '',
  evolutionApiUrl: 'https://evolution-api-production-1e65.up.railway.app',
  evolutionApiKey: 'de173acec677c6da63cf021049ffa7c6c120a82c765b7e540d585a9ea9ced356',
  evolutionInstanceName: 'JonStudio',
  customWebhookUrl: '',
  waReminderTemplate: 'Ol\u00e1, {cliente}! Passando para lembrar do seu hor\u00e1rio amanh\u00e3 ({data} \u00e0s {hora}) para o servi\u00e7o: {servico}. Podemos confirmar? \uD83D\uDC87\u200D\u2642\uFE0F\u2728'
};

const AdminMobileApp = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('inicio');
  const [currentDate, setCurrentDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Firestore & local states
  const [bookings, setBookings] = useState([]);
  const [clients, setClients] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [services, setServices] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Modais
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showAddBookingModal, setShowAddBookingModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // Form states
  const [newBooking, setNewBooking] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    serviceName: '',
    servicePrice: 0,
    duration: 60,
    date: '',
    time: '09:00',
    notes: ''
  });

  const [showMobileSuggestions, setShowMobileSuggestions] = useState(false);

  // Autocomplete filtering helper
  const getFilteredClients = (queryText) => {
    if (!queryText || queryText.trim().length < 3) return [];
    const normQuery = queryText.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return clients.filter(c => {
      if (!c.name) return false;
      const normName = c.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const nameMatch = normName.includes(normQuery);
      const initials = normName.split(/\s+/).filter(Boolean).map(p => p[0]).join('');
      const initialsMatch = initials.startsWith(normQuery);
      const cleanPhone = c.phone?.replace(/\D/g, '') || '';
      const cleanQueryPhone = normQuery.replace(/\D/g, '');
      const phoneMatch = cleanQueryPhone.length > 0 && cleanPhone.includes(cleanQueryPhone);
      return nameMatch || initialsMatch || phoneMatch;
    }).slice(0, 6);
  };

  const selectClientForMobileAdd = (c) => {
    setNewBooking(prev => ({
      ...prev,
      clientName: c.name || '',
      clientPhone: c.phone || c.id || '',
      clientEmail: c.email || '',
      notes: c.observacoes || c.notes || prev.notes || ''
    }));
    setShowMobileSuggestions(false);
  };

  const [newClient, setNewClient] = useState({
    name: '',
    phone: '',
    email: '',
    curvatura: '3A',
    observacoes: '',
    birthdate: ''
  });

  const [notifications, setNotifications] = useState(() => {
    const stored = localStorage.getItem('admin_notifications');
    return stored ? JSON.parse(stored) : [];
  });
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  const notifiedRef = useRef(new Set());
  const unreadCount = notifications.filter(n => !n.read).length;

  const [blockMotive, setBlockMotive] = useState('Almoço');
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [sendingMsgStatus, setSendingMsgStatus] = useState('');

  // 1. Listeners em Tempo Real
  useEffect(() => {
    let unsubBookings;
    let unsubClients;
    let unsubTx;
    let unsubServ;
    let unsubSettings;
    let timedOut = false;

    if (!db) {
      setIsDemoMode(true);
      setLoading(false);
      loadLocalMockData();
      return;
    }

    const timeoutId = setTimeout(() => {
      timedOut = true;
      console.warn('Conexão ao Firestore expirou no Mobile. Usando modo offline.');
      setIsDemoMode(true);
      setLoading(false);
      loadLocalMockData();
    }, 4000);

    try {
      unsubBookings = onSnapshot(collection(db, 'bookings'), (snapshot) => {
        if (timedOut) return;
        const list = [];
        snapshot.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setBookings(list);
        localStorage.setItem('demo_bookings', JSON.stringify(list));
      });

      unsubClients = onSnapshot(collection(db, 'client_profiles'), (snapshot) => {
        if (timedOut) return;
        const list = [];
        snapshot.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setClients(list);
        localStorage.setItem('demo_client_profiles', JSON.stringify(list));
      });

      unsubTx = onSnapshot(collection(db, 'financial_transactions'), (snapshot) => {
        if (timedOut) return;
        const list = [];
        snapshot.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setTransactions(list);
        localStorage.setItem('demo_transactions', JSON.stringify(list));
      });

      unsubServ = onSnapshot(collection(db, 'services'), (snapshot) => {
        if (timedOut) return;
        const list = [];
        snapshot.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setServices(list);
        if (list.length > 0) {
          setNewBooking(prev => ({
            ...prev,
            serviceName: list[0].name,
            servicePrice: list[0].promoPrice || list[0].price || 150,
            duration: list[0].duration || 60
          }));
        }
        localStorage.setItem('demo_services', JSON.stringify(list));
      });

      unsubSettings = onSnapshot(doc(db, 'settings', 'studio'), (snapshot) => {
        if (timedOut) return;
        if (snapshot.exists()) {
          setSettings(snapshot.data());
          localStorage.setItem('demo_studio_settings', JSON.stringify(snapshot.data()));
        }
        clearTimeout(timeoutId);
        setLoading(false);
      }, () => {
        clearTimeout(timeoutId);
        setLoading(false);
      });

    } catch (e) {
      console.error(e);
      setIsDemoMode(true);
      setLoading(false);
      loadLocalMockData();
    }

    return () => {
      if (unsubBookings) unsubBookings();
      if (unsubClients) unsubClients();
      if (unsubTx) unsubTx();
      if (unsubServ) unsubServ();
      if (unsubSettings) unsubSettings();
    };
  }, []);

  const loadLocalMockData = () => {
    const savedBookings = localStorage.getItem('demo_bookings');
    const savedClients = localStorage.getItem('demo_client_profiles');
    const savedTransactions = localStorage.getItem('demo_transactions');
    const savedServices = localStorage.getItem('demo_services');
    const savedSettings = localStorage.getItem('demo_studio_settings');

    if (savedBookings) setBookings(JSON.parse(savedBookings));
    if (savedClients) setClients(JSON.parse(savedClients));
    if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
    if (savedServices) {
      const parsedS = JSON.parse(savedServices);
      setServices(parsedS);
      if (parsedS.length > 0) {
        setNewBooking(prev => ({
          ...prev,
          serviceName: parsedS[0].name,
          servicePrice: parsedS[0].promoPrice || parsedS[0].price || 150,
          duration: parsedS[0].duration || 60
        }));
      }
    }
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        const merged = { ...DEFAULT_SETTINGS };
        Object.keys(parsed).forEach(key => {
          if (parsed[key] !== undefined && parsed[key] !== null && parsed[key] !== '') {
            merged[key] = parsed[key];
          }
        });
        setSettings(merged);
      } catch (e) {
        setSettings(DEFAULT_SETTINGS);
      }
    } else {
      setSettings(DEFAULT_SETTINGS);
    }
  };

  // 1b. Motor de Notificações
  const triggerNotification = (id, title, message, type) => {
    if (notifiedRef.current.has(id)) return;
    notifiedRef.current.add(id);
    localStorage.setItem('notified_ids', JSON.stringify(Array.from(notifiedRef.current)));

    const newNotif = {
      id,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false
    };

    setNotifications(prev => {
      const updated = [newNotif, ...prev];
      localStorage.setItem('admin_notifications', JSON.stringify(updated));
      return updated;
    });

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(title, {
              body: message,
              icon: '/jon-perfil.jpg',
              tag: id,
              vibrate: [200, 100, 200, 100, 200]
            });
          });
        } else {
          new Notification(title, {
            body: message,
            icon: '/jon-perfil.jpg',
            tag: id
          });
        }
      } catch (e) {
        console.warn('Native notification failed:', e);
      }
    }
  };

  const isBirthdayInCurrentWeek = (birthdateStr) => {
    if (!birthdateStr) return false;
    const parts = birthdateStr.split('-');
    if (parts.length !== 3) return false;
    const bMonth = parseInt(parts[1], 10) - 1;
    const bDay = parseInt(parts[2], 10);

    const now = new Date();
    const currentDayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - currentDayOfWeek);

    for (let i = 0; i < 7; i++) {
      const checkDay = new Date(startOfWeek);
      checkDay.setDate(startOfWeek.getDate() + i);
      if (checkDay.getMonth() === bMonth && checkDay.getDate() === bDay) {
        return true;
      }
    }
    return false;
  };

  const runPollerChecks = () => {
    if (!bookings || bookings.length === 0) return;

    const now = new Date();
    const nowTime = now.getTime();

    // 1. Check for New Bookings (created in the last 60 seconds)
    bookings.forEach(booking => {
      if (booking.createdAt && booking.status !== 'cancelado') {
        const createdTime = new Date(booking.createdAt).getTime();
        const id = `new_booking_${booking.id || booking.createdAt}`;
        if (nowTime - createdTime < 60000 && !notifiedRef.current.has(id)) {
          triggerNotification(
            id,
            'Novo Agendamento! 📅',
            `${booking.clientName} agendou ${booking.service?.name || 'Serviço'} para ${booking.date} às ${booking.time}`,
            'novo_agendamento'
          );
        }
      }
    });

    // 2. Check for 30-minute Pre-Appointment Alert
    bookings.forEach(booking => {
      if (booking.status !== 'cancelado' && booking.date && booking.time) {
        try {
          const [yr, mo, dy] = booking.date.split('-').map(Number);
          const [hr, mn] = booking.time.split(':').map(Number);
          const bookingTime = new Date(yr, mo - 1, dy, hr, mn);
          const diffMs = bookingTime.getTime() - nowTime;
          const diffMinutes = Math.round(diffMs / 60000);

          if (diffMinutes >= 0 && diffMinutes <= 30) {
            const id = `reminder_30m_${booking.id}`;
            if (!notifiedRef.current.has(id)) {
              triggerNotification(
                id,
                'Compromisso em Breve! ⏰',
                `Atendimento de ${booking.clientName} (${booking.service?.name || 'Serviço'}) começa em ${diffMinutes} min às ${booking.time}!`,
                'lembrete_30m'
              );
            }
          }
        } catch (e) {
          console.warn('Error parsing booking date/time:', e);
        }
      }
    });

    // 3. Check for Birthday of the Week with active booking this week
    const currentDayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - currentDayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    bookings.forEach(booking => {
      if (booking.status !== 'cancelado' && booking.date) {
        try {
          const [yr, mo, dy] = booking.date.split('-').map(Number);
          const bookingTime = new Date(yr, mo - 1, dy);

          if (bookingTime >= startOfWeek && bookingTime <= endOfWeek) {
            let birthdate = booking.clientBirthdate || '';
            if (!birthdate) {
              const clientProf = clients.find(c => c.phone === booking.clientPhone);
              if (clientProf) birthdate = clientProf.birthdate || '';
            }

            if (birthdate) {
              if (isBirthdayInCurrentWeek(birthdate)) {
                const id = `birthday_week_${booking.id}`;
                if (!notifiedRef.current.has(id)) {
                  const bParts = birthdate.split('-');
                  const bDay = bParts[2];
                  const bMonth = bParts[1];
                  triggerNotification(
                    id,
                    'Aniversariante da Semana! 🎂',
                    `${booking.clientName} faz aniversário essa semana (dia ${bDay}/${bMonth}) e tem agendamento para dia ${dy}/${mo} às ${booking.time}!`,
                    'aniversario'
                  );
                }
              }
            }
          }
        } catch (e) {
          console.warn('Error checking birthday for booking:', e);
        }
      }
    });
  };

  useEffect(() => {
    const storedNotified = localStorage.getItem('notified_ids');
    if (storedNotified) {
      try {
        const parsed = JSON.parse(storedNotified);
        notifiedRef.current = new Set(parsed);
      } catch (e) {
        console.warn('Failed to parse notified_ids:', e);
      }
    }

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    runPollerChecks();
    const intervalId = setInterval(() => {
      runPollerChecks();
    }, 60000);

    return () => clearInterval(intervalId);
  }, [bookings, clients]);

  const markAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      localStorage.setItem('admin_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          triggerNotification('welcome_notif', 'Notificações Ativadas! ✅', 'Você receberá avisos sonoros de novos agendamentos.', 'sistema');
        } else {
          alert('Permissão de notificação negada. Você não receberá alertas.');
        }
      });
    }
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    localStorage.removeItem('admin_notifications');
  };

  const markAsRead = (id) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      localStorage.setItem('admin_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteNotification = (id) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      localStorage.setItem('admin_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  // 2. Auxiliares Financeiros (Mês Corrente)
  const getFinancialStats = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const monthPrefix = `${currentYear}-${currentMonth}`;

    const monthTx = transactions.filter(t => t.date && t.date.startsWith(monthPrefix));
    const receitas = monthTx.filter(t => t.type === 'entrada').reduce((sum, t) => sum + (t.value || 0), 0);
    const despesas = monthTx.filter(t => t.type === 'saida').reduce((sum, t) => sum + (t.value || 0), 0);

    return { receitas, despesas };
  };

  // 3. Formatação de Datas
  const formatLocalDate = (dateStr) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    const months = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
    const weekdays = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
    
    return {
      dateString: `${parts[2]} ${months[d.getMonth()]} ${d.getFullYear()}`,
      weekdayString: weekdays[d.getDay()]
    };
  };

  const handleDateChange = (days) => {
    const d = new Date(currentDate + 'T00:00:00');
    d.setDate(d.getDate() + days);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  // 4. Fluxo de Criação de Agendamentos e Bloqueios
  const handleSlotClick = (timeStr) => {
    const match = bookings.find(b => b.date === currentDate && b.time === timeStr && b.status !== 'cancelado');
    if (match) {
      setSelectedBooking(match);
    } else {
      setSelectedSlot({ date: currentDate, time: timeStr });
      setNewBooking(prev => ({
        ...prev,
        date: currentDate,
        time: timeStr
      }));
      setShowAddBookingModal(true);
    }
  };

  const submitBooking = async (e) => {
    if (e) e.preventDefault();
    const activeDuration = newBooking.duration || (services[0]?.duration || 60);
    const cleanPhone = newBooking.clientPhone.replace(/\D/g, '');
    const payload = {
      clientName: newBooking.clientName,
      clientPhone: cleanPhone,
      clientEmail: newBooking.clientEmail,
      duration: activeDuration,
      service: {
        name: newBooking.serviceName || services[0]?.name || 'Corte com o Jon',
        price: Number(newBooking.servicePrice) || (services[0]?.promoPrice || services[0]?.price || 150),
        duration: activeDuration
      },
      date: newBooking.date,
      time: newBooking.time,
      notes: newBooking.notes,
      status: 'confirmado',
      createdAt: new Date().toISOString()
    };

    try {
      if (isDemoMode) {
        const local = [...bookings, { id: 'demo-' + Date.now(), ...payload }];
        setBookings(local);
        localStorage.setItem('demo_bookings', JSON.stringify(local));
      } else {
        await addDoc(collection(db, 'bookings'), payload);
      }

      // Auto-cadastro de cliente mobile
      if (cleanPhone) {
        const exists = clients.some(c => c.phone === cleanPhone || c.id === cleanPhone);
        if (!exists) {
          const profilePayload = {
            name: newBooking.clientName,
            phone: cleanPhone,
            email: newBooking.clientEmail || 'Não informado',
            curvatura: '3A',
            porosidade: 'Média',
            elasticidade: 'Normal',
            quimicas: 'Nenhuma',
            produtosRecomendados: '',
            observacoes: 'Cadastrado automaticamente via agendamento mobile',
            sexo: 'Feminino',
            birthdate: '',
            createdAt: new Date().toISOString()
          };

          if (isDemoMode) {
            const local = [...clients, { id: cleanPhone, ...profilePayload }];
            setClients(local);
            localStorage.setItem('demo_client_profiles', JSON.stringify(local));
          } else {
            try {
              const clientRef = doc(db, 'client_profiles', cleanPhone);
              const clientSnap = await getDoc(clientRef);
              if (!clientSnap.exists()) {
                await setDoc(clientRef, profilePayload);
              }
            } catch (profileErr) {
              console.warn('Erro ao auto-cadastrar cliente no Firestore (Mobile):', profileErr);
            }
          }
        }
      }

      setShowAddBookingModal(false);
      resetBookingForm();
      alert('Agendamento cadastrado com sucesso!');
    } catch (err) {
      alert('Erro ao registrar agendamento.');
    }
  };

  const submitBlock = async (e) => {
    if (e) e.preventDefault();
    const payload = {
      clientName: 'Horário Bloqueado',
      clientPhone: '00000000000',
      clientEmail: '',
      service: {
        name: 'Bloqueio Administrativo',
        price: 0
      },
      date: newBooking.date,
      time: newBooking.time,
      notes: blockMotive,
      status: 'bloqueado',
      createdAt: new Date().toISOString()
    };

    try {
      if (isDemoMode) {
        const local = [...bookings, { id: 'demo-block-' + Date.now(), ...payload }];
        setBookings(local);
        localStorage.setItem('demo_bookings', JSON.stringify(local));
      } else {
        await addDoc(collection(db, 'bookings'), payload);
      }
      setShowBlockModal(false);
      setShowAddBookingModal(false);
      resetBookingForm();
    } catch (err) {
      alert('Erro ao bloquear horário.');
    }
  };

  const resetBookingForm = () => {
    setNewBooking({
      clientName: '',
      clientPhone: '',
      clientEmail: '',
      serviceName: services[0]?.name || '',
      servicePrice: services[0]?.promoPrice || services[0]?.price || 150,
      duration: services[0]?.duration || 60,
      date: currentDate,
      time: '09:00',
      notes: ''
    });
  };

  // 5. Cadastrar Novo Cliente
  const submitClient = async (e) => {
    e.preventDefault();
    const payload = {
      name: newClient.name,
      phone: newClient.phone.replace(/\D/g, ''),
      email: newClient.email || 'Não informado',
      curvatura: newClient.curvatura,
      observacoes: newClient.observacoes,
      birthdate: newClient.birthdate || '',
      createdAt: new Date().toISOString()
    };

    try {
      if (isDemoMode) {
        const local = [...clients, { id: payload.phone, ...payload }];
        setClients(local);
        localStorage.setItem('demo_client_profiles', JSON.stringify(local));
      } else {
        await setDoc(doc(db, 'client_profiles', payload.phone), payload);
      }
      setShowAddClientModal(false);
      setNewClient({ name: '', phone: '', email: '', curvatura: '3A', observacoes: '', birthdate: '' });
      alert('Cliente cadastrado com sucesso!');
    } catch (e) {
      alert('Falha ao cadastrar cliente.');
    }
  };

  // 6. Fechamento de Comanda (Checkout)
  const openCheckout = (booking) => {
    setCheckoutBooking(booking);
    setSelectedBooking(null);
    setShowCheckoutModal(true);
  };

  const [checkoutBooking, setCheckoutBooking] = useState(null);

  const submitCheckout = async () => {
    if (!checkoutBooking) return;
    const value = checkoutBooking.service?.price || checkoutBooking.servicePrice || 150;
    const payloadTx = {
      date: checkoutBooking.date || new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      clientName: checkoutBooking.clientName,
      clientPhone: checkoutBooking.clientPhone || '',
      type: 'entrada',
      paymentMethod,
      value: Number(value),
      description: checkoutBooking.service?.name || checkoutBooking.serviceName || 'Serviço Base',
      createdAt: new Date().toISOString()
    };

    try {
      if (isDemoMode) {
        // Atualiza booking
        const updatedB = bookings.map(b => b.id === checkoutBooking.id ? { ...b, status: 'finalizado' } : b);
        setBookings(updatedB);
        localStorage.setItem('demo_bookings', JSON.stringify(updatedB));
        
        // Adiciona tx
        const updatedTx = [...transactions, { id: 'tx_' + Date.now(), ...payloadTx }];
        setTransactions(updatedTx);
        localStorage.setItem('demo_transactions', JSON.stringify(updatedTx));
      } else {
        const apptRef = doc(db, 'bookings', checkoutBooking.id);
        await updateDoc(apptRef, { status: 'finalizado' });
        await addDoc(collection(db, 'financial_transactions'), payloadTx);
      }
      setShowCheckoutModal(false);
      setCheckoutBooking(null);
      alert('Comanda fechada com sucesso! Receita registrada no caixa.');
    } catch (e) {
      alert('Erro ao fechar comanda.');
    }
  };

  // 7. Disparar Lembrete WhatsApp
  const handleSendReminderWhatsappManual = (booking) => {
    const cleanPhone = (booking.clientPhone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      alert('Telefone do cliente inválido ou não cadastrado.');
      return;
    }
    const template = `Olá {nome}! Confirmado o seu horário no Studio do Jon no dia {data} às {horario}? Seu serviço será {servico}.`;
    const dataBr = booking.date.split('-').reverse().join('/');
    const msg = template
      .replace(/{nome}/g, booking.clientName)
      .replace(/{data}/g, dataBr)
      .replace(/{horario}/g, booking.time)
      .replace(/{servico}/g, booking.service?.name || booking.serviceName || 'serviço');

    window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleSendReminderWhatsappGateway = async (booking) => {
    const gateway = settings?.waReminderGateway || 'zapi';
    const isGatewayConfigured = 
      (gateway === 'zapi' && settings?.zApiInstanceId && settings?.zApiToken) ||
      (gateway === 'evolution' && settings?.evolutionApiUrl && settings?.evolutionApiKey && settings?.evolutionInstanceName) ||
      (gateway === 'custom' && settings?.customWebhookUrl);

    if (!settings?.waReminderEnabled || !isGatewayConfigured) {
      alert('Integração de WhatsApp não configurada ou inativa no painel de Configurações.');
      return;
    }

    const cleanPhone = (booking.clientPhone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      alert('Telefone do cliente inválido.');
      return;
    }

    setSendingMsgStatus('Disparando lembrete automático...');

    const template = `Olá {nome}! Confirmado o seu horário no Studio do Jon no dia {data} às {horario}? Seu serviço será {servico}.`;
    const dataBr = booking.date.split('-').reverse().join('/');
    const msg = template
      .replace(/{nome}/g, booking.clientName)
      .replace(/{data}/g, dataBr)
      .replace(/{horario}/g, booking.time)
      .replace(/{servico}/g, booking.service?.name || booking.serviceName || 'serviço');

    const phoneWithDDI = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    let url = '';
    let headers = { 'Content-Type': 'application/json' };
    let body = {};

    if (gateway === 'zapi') {
      url = `https://api.z-api.io/instances/${settings.zApiInstanceId}/token/${settings.zApiToken}/send-text`;
      body = { phone: phoneWithDDI, message: msg };
    } else if (gateway === 'evolution') {
      url = `${settings.evolutionApiUrl.replace(/\/$/, '')}/message/sendText/${settings.evolutionInstanceName}`;
      headers['apikey'] = settings.evolutionApiKey;
      body = { number: phoneWithDDI, text: msg };
    } else if (gateway === 'custom') {
      url = settings.customWebhookUrl;
      body = { phone: phoneWithDDI, message: msg, clientName: booking.clientName };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      if (response.ok) {
        setSendingMsgStatus('Lembrete enviado com sucesso!');
        setTimeout(() => setSendingMsgStatus(''), 2500);
      } else {
        throw new Error('Falha gateway');
      }
    } catch (e) {
      setSendingMsgStatus('Falha ao enviar. Tente o modo manual.');
      setTimeout(() => setSendingMsgStatus(''), 3000);
    }
  };

  // 8. Cancelar agendamento
  const cancelBooking = async (bookingId) => {
    if (!confirm('Deseja realmente cancelar este agendamento?')) return;
    try {
      if (isDemoMode) {
        const updated = bookings.map(b => b.id === bookingId ? { ...b, status: 'cancelado' } : b);
        setBookings(updated);
        localStorage.setItem('demo_bookings', JSON.stringify(updated));
      } else {
        const docRef = doc(db, 'bookings', bookingId);
        await updateDoc(docRef, { status: 'cancelado' });
      }
      setSelectedBooking(null);
      alert('Agendamento cancelado.');
    } catch (e) {
      alert('Erro ao cancelar agendamento.');
    }
  };

  // 9. Comissões do Jon (60% padrão)
  const getCommissionData = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const monthPrefix = `${currentYear}-${currentMonth}`;

    // Filtra agendamentos finalizados do mês atual
    const doneBookings = bookings.filter(b => 
      b.status === 'finalizado' && b.date && b.date.startsWith(monthPrefix)
    );

    const list = doneBookings.map(b => {
      const price = b.service?.price || b.servicePrice || 150;
      const commissionValue = price * 0.60; // 60% repasse padrão
      return {
        id: b.id,
        clientName: b.clientName,
        serviceName: b.service?.name || b.serviceName || 'Serviço',
        date: b.date,
        price,
        commissionValue
      };
    });

    const total = list.reduce((sum, item) => sum + item.commissionValue, 0);
    return { list, total };
  };

  // Datas e Timeline
  const dateInfo = formatLocalDate(currentDate);
  const hourSlots = [];
  for (let h = 8; h <= 20; h++) {
    const hs = String(h).padStart(2, '0');
    hourSlots.push(`${hs}:00`);
  }

  // Filtragem dos agendamentos de hoje para a tela Home
  const todayStr = new Date().toISOString().split('T')[0];
  const todayBookings = bookings
    .filter(b => b.date === todayStr && b.status !== 'cancelado')
    .sort((a, b) => a.time.localeCompare(b.time));

  const stats = getFinancialStats();
  const commissions = getCommissionData();

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#fdf2f8' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #ff007f', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: 12, fontSize: '0.9rem', color: '#6b7280', fontWeight: 600 }}>Carregando Studio do Jon...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="mobile-app-wrapper">
      {/* Header Fixo do App */}
      <header className="mobile-header">
        <div className="mobile-logo-area">
          <div className="mobile-logo-box">
            <img src="/logo-app.png" alt="Logo O Jon Que Cortou" />
          </div>
          <h2 className="mobile-owner-name">Jonatan</h2>
        </div>
        <div className="mobile-header-actions">
          <HelpCircle size={20} />
          <div className="bell-badge-container" onClick={() => setShowNotificationsModal(true)} style={{ position: 'relative', cursor: 'pointer' }}>
            <Bell size={20} />
            {unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
          </div>
        </div>
      </header>

      {/* Sub-header Contexto */}
      <div className="mobile-subheader">
        <Info size={12} style={{ marginRight: 6, color: 'var(--mobile-primary)' }} />
        Você está em: O Jon Que Cortou - Especialista em Cachos
      </div>

      {/* RENDERIZAÇÃO DAS ABAS */}
      
      {/* 1. ABA INÍCIO */}
      {activeTab === 'inicio' && (
        <div className="mobile-home-container">
          {/* Welcome Banner com Logo Harmonizada */}
          <div className="mobile-welcome-banner">
            <div className="mobile-welcome-content">
              <h3>Olá, Jonatan!</h3>
              <p>Seja bem-vindo de volta ao seu painel.</p>
            </div>
            <img src="/logo-app.png" alt="Logo O Jon Que Cortou" className="mobile-welcome-logo" />
          </div>

          {/* Scroll de atalhos rápidos */}
          <div className="mobile-shortcuts-scroll">
            <div className="mobile-shortcut-card" onClick={() => { setNewBooking(prev => ({ ...prev, date: todayStr })); setShowAddBookingModal(true); }}>
              <CalendarIcon size={18} className="icon-top" />
              <span>Novo agendamento</span>
            </div>
            <div className="mobile-shortcut-card" onClick={() => setShowAddClientModal(true)}>
              <User size={18} className="icon-top" />
              <span>Registrar cliente</span>
            </div>
            <div className="mobile-shortcut-card" onClick={() => setActiveTab('comissoes')}>
              <DollarSign size={18} className="icon-top" />
              <span>Ver minhas comissões</span>
            </div>
          </div>

          {/* Dados do Meu Negócio */}
          <div className="mobile-business-card">
            <h3>Dados do meu negócio</h3>
            <div className="period-text">Este mês corrente (Faturamento)</div>
            
            <div className="mobile-financial-row">
              <div className="mobile-financial-item">
                <span>Receitas</span>
                <span className="value-green">R$ {stats.receitas.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="mobile-financial-item">
                <span>Despesas</span>
                <span className="value-red">R$ {stats.despesas.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            <div className="mobile-business-actions">
              <button className="mobile-btn-outline" onClick={() => navigate('/admin/financeiro')}>Visão geral</button>
              <button className="mobile-btn-solid" onClick={() => navigate('/admin/financeiro')}>Entradas e saídas</button>
            </div>
          </div>

          {/* Meus Próximos Compromissos */}
          <h4 className="mobile-section-header">Meus próximos compromissos</h4>
          <div className="mobile-appointments-card">
            {todayBookings.length === 0 ? (
              <div className="mobile-empty-state">
                Sem compromissos para hoje! Use o atalho acima caso queira criar um novo agendamento.
              </div>
            ) : (
              todayBookings.map(b => (
                <div key={b.id} className="mobile-appt-list-row" onClick={() => setSelectedBooking(b)}>
                  <div className="mobile-appt-left">
                    <span className="appt-client">{b.clientName}</span>
                    <span className="appt-service">{b.service?.name || b.serviceName}</span>
                  </div>
                  <div className="mobile-appt-right">
                    <span className="appt-time">{b.time}</span>
                    <span className={`appt-status ${b.status}`}>{b.status.toUpperCase()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 2. ABA AGENDA (TIMELINE DIÁRIA) */}
      {activeTab === 'agenda' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div className="mobile-agenda-header">
            <select className="mobile-agenda-select" defaultValue="diario">
              <option value="diario">Diário</option>
              <option value="semanal" disabled>Semanal (Desktop)</option>
            </select>
            <div className="mobile-agenda-actions">
              <CalendarIcon size={18} />
            </div>
          </div>

          <div className="mobile-day-switcher">
            <button className="mobile-day-btn" onClick={() => handleDateChange(-1)}>
              <ChevronLeft size={20} />
            </button>
            <div className="mobile-current-day-label">
              <span className="date-string">{dateInfo.dateString}</span>
              <span className="weekday-string">{dateInfo.weekdayString}</span>
            </div>
            <button className="mobile-day-btn" onClick={() => handleDateChange(1)}>
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="mobile-timeline-scroll">
            {hourSlots.map(slot => {
              const matchedAppt = bookings.find(b => b.date === currentDate && b.time === slot && b.status !== 'cancelado');
              
              return (
                <div key={slot} className="mobile-timeline-row" onClick={() => handleSlotClick(slot)}>
                  <div className="mobile-timeline-time-col">{slot}</div>
                  <div className="mobile-timeline-slot-col">
                    {matchedAppt ? (
                      <div className={`mobile-timeline-appt-block ${matchedAppt.status}`}>
                        <div className="appt-block-client">{matchedAppt.clientName}</div>
                        <div className="appt-block-service">{matchedAppt.service?.name || matchedAppt.serviceName}</div>
                        <div className="appt-block-meta">
                          <span>{matchedAppt.status.toUpperCase()}</span>
                          {matchedAppt.status !== 'bloqueado' && (
                            <span>R$ {(matchedAppt.service?.price || matchedAppt.servicePrice || 0).toFixed(0)}</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mobile-empty-slot-btn">
                        <span>+ Toque para agendar/bloquear</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. ABA AÇÕES */}
      {activeTab === 'acoes' && (
        <div className="mobile-actions-container">
          <h4 className="mobile-section-header">Ações principais</h4>
          <div className="mobile-actions-grid">
            <div className="mobile-action-btn-card" onClick={() => { resetBookingForm(); setShowAddBookingModal(true); }}>
              <div className="icon-wrapper">
                <CalendarIcon size={20} />
              </div>
              <span>Novo agendamento</span>
            </div>

            <div className="mobile-action-btn-card" onClick={() => setShowAddClientModal(true)}>
              <div className="icon-wrapper">
                <User size={20} />
              </div>
              <span>Cadastrar cliente</span>
            </div>

            <div className="mobile-action-btn-card" onClick={() => {
              // Filtra agendamentos pendentes ou confirmados do dia para fechar
              const pendingCheckout = bookings.find(b => b.date === todayStr && b.status !== 'finalizado' && b.status !== 'cancelado' && b.status !== 'bloqueado');
              if (pendingCheckout) {
                openCheckout(pendingCheckout);
              } else {
                alert('Nenhum agendamento pendente para checkout no dia de hoje.');
              }
            }}>
              <div className="icon-wrapper">
                <DollarSign size={20} />
              </div>
              <span>Fechar conta</span>
            </div>

            <div className="mobile-action-btn-card" onClick={() => {
              setNewBooking(prev => ({ ...prev, date: currentDate, time: '12:00' }));
              setShowBlockModal(true);
            }}>
              <div className="icon-wrapper">
                <Clock size={20} />
              </div>
              <span>Marcar ausência</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. ABA COMISSÕES */}
      {activeTab === 'comissoes' && (
        <div className="mobile-commissions-container">
          <div className="mobile-comm-total-card">
            <div className="comm-card-title">
              <span>Total feito em comissão</span>
              <HelpCircle size={14} />
            </div>
            <div className="comm-card-value">
              R$ {commissions.total.toFixed(2).replace('.', ',')}
            </div>
            <div className="comm-card-period">
              De 01/{new Date().getMonth() + 1}/{new Date().getFullYear()} até {new Date().getDate()}/{new Date().getMonth() + 1}/{new Date().getFullYear()} (60% repasse)
            </div>
            <button className="change-period-btn" onClick={() => alert('Filtro de período disponível na versão web desktop.')}>Trocar período</button>
          </div>

          <h4 className="mobile-section-header">Histórico das comissões</h4>
          <div className="mobile-appointments-card">
            {commissions.list.length === 0 ? (
              <div className="mobile-empty-state">
                Nenhum serviço finalizado neste período para calcular comissão.
              </div>
            ) : (
              commissions.list.map((item, idx) => (
                <div key={item.id || idx} className="mobile-appt-list-row">
                  <div className="mobile-appt-left">
                    <span className="appt-client">{item.clientName}</span>
                    <span className="appt-service">{item.serviceName} | Valor: R$ {item.price}</span>
                  </div>
                  <div className="mobile-appt-right">
                    <span className="appt-time" style={{ color: 'var(--mobile-green)' }}>
                      + R$ {item.commissionValue.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="appt-status finalizado" style={{ display: 'block', marginTop: 2, fontSize: '0.65rem' }}>PAGO</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 5. ABA OPÇÕES */}
      {activeTab === 'opcoes' && (
        <div className="mobile-options-container">
          {/* Perfil do Jon */}
          <div className="mobile-profile-card">
            <div className="mobile-profile-avatar">
              <img src="/jon-perfil.jpg" alt="Jonatan" onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"; }} />
            </div>
            <div className="mobile-profile-details">
              <h4>Jonatan de Oliveira Sobrinho Junior</h4>
              <div className="hearts-badge">
                <span>❤️ 4 curtidas</span>
              </div>
            </div>
          </div>

          {/* Banner de Pesquisa */}
          <div className="mobile-survey-card" onClick={() => alert('Obrigado pelo feedback!')}>
            <div className="mobile-survey-content">
              <FileText size={24} style={{ color: 'var(--mobile-primary)' }} />
              <div className="mobile-survey-text">
                <h5>Queremos te conhecer melhor!</h5>
                <p>Responda nossa pesquisa de 2 min</p>
              </div>
            </div>
            <ArrowRight size={16} style={{ color: 'var(--mobile-muted)' }} />
          </div>

          {/* Lista de links de Menu */}
          <div className="mobile-menu-list">
            <div className="mobile-menu-item" onClick={() => navigate('/admin/servicos')}>
              <div className="mobile-menu-item-left">
                <Scissors size={18} />
                <span>Serviços</span>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--mobile-muted)' }} />
            </div>

            <div className="mobile-menu-item" onClick={() => navigate('/admin/financeiro?tab=comissao')}>
              <div className="mobile-menu-item-left">
                <User size={18} />
                <span>Profissionais</span>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--mobile-muted)' }} />
            </div>

            <div className="mobile-menu-item" onClick={() => navigate('/admin/financeiro')}>
              <div className="mobile-menu-item-left">
                <DollarSign size={18} />
                <span>Controle de entrada e saída</span>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--mobile-muted)' }} />
            </div>

            <div className="mobile-menu-item" onClick={() => navigate('/admin/configuracoes')}>
              <div className="mobile-menu-item-left">
                <Settings size={18} />
                <span>Configurações do WhatsApp</span>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--mobile-muted)' }} />
            </div>
          </div>

          {/* Retorno para o Painel Web */}
          <button className="mobile-btn-solid" style={{ width: '100%', padding: '14px', borderRadius: '10px' }} onClick={() => navigate('/admin')}>
            Painel de Atendimento (Web / Desktop)
          </button>
        </div>
      )}

      {/* BARRA DE NAVEGAÇÃO INFERIOR FIXA */}
      <nav className="mobile-bottom-nav">
        <button className={`mobile-nav-item ${activeTab === 'inicio' ? 'active' : ''}`} onClick={() => setActiveTab('inicio')}>
          <div className="icon-container">
            <HomeIcon size={20} />
          </div>
          <span>Início</span>
        </button>

        <button className={`mobile-nav-item ${activeTab === 'agenda' ? 'active' : ''}`} onClick={() => setActiveTab('agenda')}>
          <div className="icon-container">
            <CalendarIcon size={20} />
          </div>
          <span>Agenda</span>
        </button>

        <button className={`mobile-nav-item ${activeTab === 'acoes' ? 'active' : ''}`} onClick={() => setActiveTab('acoes')}>
          <div className="icon-container">
            <Plus size={20} />
          </div>
          <span>Ações</span>
        </button>

        <button className={`mobile-nav-item ${activeTab === 'comissoes' ? 'active' : ''}`} onClick={() => setActiveTab('comissoes')}>
          <div className="icon-container">
            <DollarSign size={20} />
          </div>
          <span>Comissões</span>
        </button>

        <button className={`mobile-nav-item ${activeTab === 'opcoes' ? 'active' : ''}`} onClick={() => setActiveTab('opcoes')}>
          <div className="icon-container">
            <Menu size={20} />
          </div>
          <span>Opções</span>
        </button>
      </nav>

      {/* MODAL DE DETALHES DO AGENDAMENTO COM BOTÃO DE MENSAGEM */}
      {selectedBooking && (
        <div className="mobile-overlay" onClick={() => setSelectedBooking(null)}>
          <div className="mobile-bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-sheet-header">
              <h4>{selectedBooking.status === 'bloqueado' ? 'Bloqueio de Horário' : 'Detalhes do Compromisso'}</h4>
              <button onClick={() => setSelectedBooking(null)}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {selectedBooking.status === 'bloqueado' ? (
                <>
                  <div className="mobile-detail-row">
                    <span className="label">MOTIVO DO BLOQUEIO</span>
                    <span className="value">{selectedBooking.notes || 'Bloqueio administrativo'}</span>
                  </div>
                  <div className="mobile-detail-row">
                    <span className="label">DATA E HORA</span>
                    <span className="value">{selectedBooking.date.split('-').reverse().join('/')} às {selectedBooking.time}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="mobile-detail-row">
                    <span className="label">CLIENTE</span>
                    <span className="value">{selectedBooking.clientName}</span>
                  </div>
                  {selectedBooking.clientPhone && (
                    <div className="mobile-detail-row">
                      <span className="label">TELEFONE</span>
                      <span className="value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Phone size={14} className="text-muted" /> {selectedBooking.clientPhone}
                      </span>
                    </div>
                  )}
                  <div className="mobile-detail-row">
                    <span className="label">SERVIÇO</span>
                    <span className="value">{selectedBooking.service?.name || selectedBooking.serviceName}</span>
                  </div>
                  <div className="mobile-detail-row">
                    <span className="label">VALOR</span>
                    <span className="value" style={{ color: 'var(--mobile-green)', fontWeight: 800 }}>
                      R$ {(selectedBooking.service?.price || selectedBooking.servicePrice || 150).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <div className="mobile-detail-row">
                    <span className="label">HORÁRIO</span>
                    <span className="value">{selectedBooking.date.split('-').reverse().join('/')} às {selectedBooking.time}</span>
                  </div>
                  <div className="mobile-detail-row">
                    <span className="label">DURAÇÃO</span>
                    <span className="value">{selectedBooking.duration || selectedBooking.service?.duration || 60} minutos</span>
                  </div>
                  {selectedBooking.notes && (
                    <div className="mobile-detail-row">
                      <span className="label">OBSERVAÇÕES</span>
                      <span className="value" style={{ fontWeight: 400, fontSize: '0.8rem' }}>{selectedBooking.notes}</span>
                    </div>
                  )}

                  {/* CRITICAL USER REQUEST: BOTÕES DE MENSAGEM */}
                  <div className="mobile-message-section">
                    <h5>💬 Confirmar Agendamento por WhatsApp</h5>
                    {sendingMsgStatus && (
                      <div style={{ color: 'var(--mobile-primary)', fontSize: '0.75rem', fontWeight: 600, marginBottom: 8 }}>
                        {sendingMsgStatus}
                      </div>
                    )}
                    <div className="mobile-message-options">
                      <button className="mobile-msg-btn-whatsapp" onClick={() => handleSendReminderWhatsappManual(selectedBooking)}>
                        <MessageSquare size={16} /> Enviar WhatsApp (Manual)
                      </button>
                      
                      {settings?.waReminderEnabled && (
                        <button className="mobile-msg-btn-api" onClick={() => handleSendReminderWhatsappGateway(selectedBooking)}>
                          <Check size={16} /> Disparar Lembrete (Automático)
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Botões de Ação da Comanda */}
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                {selectedBooking.status !== 'finalizado' && selectedBooking.status !== 'bloqueado' && (
                  <button className="mobile-btn-solid" style={{ background: 'var(--mobile-green)' }} onClick={() => openCheckout(selectedBooking)}>
                    Fechar Conta
                  </button>
                )}
                {selectedBooking.status !== 'bloqueado' && (
                  <button className="mobile-btn-outline" style={{ borderColor: 'var(--mobile-red)', color: 'var(--mobile-red)' }} onClick={() => cancelBooking(selectedBooking.id)}>
                    Cancelar Horário
                  </button>
                )}
                {selectedBooking.status === 'bloqueado' && (
                  <button className="mobile-btn-outline" style={{ borderColor: 'var(--mobile-red)', color: 'var(--mobile-red)' }} onClick={() => cancelBooking(selectedBooking.id)}>
                    Remover Bloqueio
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ADICIONAR AGENDAMENTO */}
      {showAddBookingModal && (
        <div className="mobile-overlay" onClick={() => setShowAddBookingModal(false)}>
          <div className="mobile-popup-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-sheet-header">
              <h4>Novo Agendamento</h4>
              <button onClick={() => setShowAddBookingModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={submitBooking}>
              <div className="mobile-form-group">
                <label>Nome do Cliente *</label>
                <div className="mobile-autocomplete-container">
                  <input 
                    type="text" 
                    placeholder="Nome do cliente" 
                    required
                    value={newBooking.clientName}
                    onChange={e => {
                      setNewBooking(prev => ({ ...prev, clientName: e.target.value }));
                      setShowMobileSuggestions(true);
                    }}
                    onFocus={() => setShowMobileSuggestions(true)}
                    onBlur={() => setShowMobileSuggestions(false)}
                  />
                  {showMobileSuggestions && getFilteredClients(newBooking.clientName).length > 0 && (
                    <ul className="mobile-suggestions-list">
                      {getFilteredClients(newBooking.clientName).map(c => (
                        <li 
                          key={c.id} 
                          className="mobile-suggestion-item"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            selectClientForMobileAdd(c);
                          }}
                        >
                          <span className="mobile-suggestion-name">{c.name}</span>
                          {c.phone && <span className="mobile-suggestion-phone">{c.phone}</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="mobile-form-group">
                <label>WhatsApp (DDD + Número) *</label>
                <input 
                  type="text" 
                  placeholder="Ex: 31988887777" 
                  required
                  value={newBooking.clientPhone}
                  onChange={e => setNewBooking(prev => ({ ...prev, clientPhone: e.target.value }))}
                />
              </div>

              <div className="mobile-form-group">
                <label>{"Servi\u00e7o *"}</label>
                <select 
                  value={newBooking.serviceName}
                  onChange={e => {
                    const match = services.find(s => s.name === e.target.value);
                    setNewBooking(prev => ({
                      ...prev,
                      serviceName: e.target.value,
                      servicePrice: match ? (match.promoPrice || match.price || 150) : 150,
                      duration: match ? (match.duration || 60) : 60
                    }));
                  }}
                >
                  {services.map(s => (
                    <option key={s.id} value={s.name}>{s.name} - R$ {s.promoPrice || s.price}</option>
                  ))}
                  {services.length === 0 && (
                    <option value="Corte com o Jon">Corte com o Jon - R$ 190</option>
                  )}
                </select>
              </div>

              <div className="mobile-form-group">
                <label>{"Pre\u00e7o do Servi\u00e7o (R$)"}</label>
                <input 
                  type="number" 
                  value={newBooking.servicePrice}
                  onChange={e => setNewBooking(prev => ({ ...prev, servicePrice: Number(e.target.value) }))}
                />
              </div>

              <div className="mobile-form-group">
                <label>{"Dura\u00e7\u00e3o (minutos)"}</label>
                <input 
                  type="number" 
                  value={newBooking.duration || 60}
                  onChange={e => setNewBooking(prev => ({ ...prev, duration: Number(e.target.value) }))}
                />
              </div>

              <div className="mobile-form-group" style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label>Data</label>
                  <input 
                    type="date" 
                    value={newBooking.date}
                    onChange={e => setNewBooking(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Hora</label>
                  <input 
                    type="text" 
                    placeholder="Ex: 09:30"
                    value={newBooking.time}
                    onChange={e => setNewBooking(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>
              </div>

              <div className="mobile-form-group">
                <label>{"Observa\u00e7\u00f5es"}</label>
                <textarea 
                  placeholder="Ex: Quer volume e definição"
                  rows={2}
                  value={newBooking.notes}
                  onChange={e => setNewBooking(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="button" className="mobile-btn-outline" style={{ flex: 1 }} onClick={() => setShowBlockModal(true)}>
                  {"Bloquear Hor\u00e1rio"}
                </button>
                <button type="submit" className="mobile-btn-solid" style={{ flex: 1 }}>
                  Reservar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE BLOQUEIO DE HORÁRIO */}
      {showBlockModal && (
        <div className="mobile-overlay" onClick={() => setShowBlockModal(false)}>
          <div className="mobile-popup-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-sheet-header">
              <h4>Bloquear Horário</h4>
              <button onClick={() => setShowBlockModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={submitBlock}>
              <div className="mobile-form-group">
                <label>Motivo do Bloqueio *</label>
                <select value={blockMotive} onChange={e => setBlockMotive(e.target.value)}>
                  <option value="Almoço">Almoço</option>
                  <option value="Curso/Treinamento">Curso/Treinamento</option>
                  <option value="Ausência Médica">Ausência Médica</option>
                  <option value="Manutenção do Espaço">Manutenção do Espaço</option>
                  <option value="Outro">Outro Motivo</option>
                </select>
              </div>

              {blockMotive === 'Outro' && (
                <div className="mobile-form-group">
                  <label>Especifique o Motivo *</label>
                  <input type="text" placeholder="Escreva o motivo" required onChange={e => setBlockMotive(e.target.value)} />
                </div>
              )}

              <div className="mobile-form-group">
                <label>Horário Bloqueado</label>
                <input type="text" disabled value={`${newBooking.date.split('-').reverse().join('/')} às ${newBooking.time}`} />
              </div>

              <div className="mobile-modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowBlockModal(false)}>Voltar</button>
                <button type="submit" className="btn-save">Confirmar Bloqueio</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CADASTRAR CLIENTE */}
      {showAddClientModal && (
        <div className="mobile-overlay" onClick={() => setShowAddClientModal(false)}>
          <div className="mobile-popup-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-sheet-header">
              <h4>Cadastrar Cliente</h4>
              <button onClick={() => setShowAddClientModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={submitClient}>
              <div className="mobile-form-group">
                <label>Nome Completo *</label>
                <input 
                  type="text" 
                  placeholder="Nome do cliente" 
                  required
                  value={newClient.name}
                  onChange={e => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="mobile-form-group">
                <label>WhatsApp (DDD + Número) *</label>
                <input 
                  type="text" 
                  placeholder="Ex: 31988887777" 
                  required
                  value={newClient.phone}
                  onChange={e => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div className="mobile-form-group">
                <label>E-mail (Opcional)</label>
                <input 
                  type="email" 
                  placeholder="cliente@email.com" 
                  value={newClient.email}
                  onChange={e => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="mobile-form-group">
                <label>Curvatura Principal</label>
                <select value={newClient.curvatura} onChange={e => setNewClient(prev => ({ ...prev, curvatura: e.target.value }))}>
                  <option value="2A">Ondulado (2A-2C)</option>
                  <option value="3A">Cacheado Aberto (3A)</option>
                  <option value="3B">Cacheado Médio (3B)</option>
                  <option value="3C">Cacheado Fechado (3C)</option>
                  <option value="4A">Crespo Definido (4A-4C)</option>
                </select>
              </div>

              <div className="mobile-form-group">
                <label>Data de Nascimento (Opcional)</label>
                <input 
                  type="date"
                  value={newClient.birthdate || ''}
                  onChange={e => setNewClient(prev => ({ ...prev, birthdate: e.target.value }))}
                />
              </div>

              <div className="mobile-form-group">
                <label>Observações</label>
                <textarea 
                  placeholder="Observações iniciais sobre o cabelo"
                  rows={2}
                  value={newClient.observacoes}
                  onChange={e => setNewClient(prev => ({ ...prev, observacoes: e.target.value }))}
                />
              </div>

              <div className="mobile-modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowAddClientModal(false)}>Cancelar</button>
                <button type="submit" className="btn-save">Salvar Ficha</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CHECKOUT (FECHAMENTO DE COMANDA) */}
      {showCheckoutModal && checkoutBooking && (
        <div className="mobile-overlay" onClick={() => setShowCheckoutModal(false)}>
          <div className="mobile-popup-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-sheet-header">
              <h4>Fechar Comanda</h4>
              <button onClick={() => setShowCheckoutModal(false)}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#718096', display: 'block' }}>CLIENTE</span>
                <strong style={{ fontSize: '0.9rem' }}>{checkoutBooking.clientName}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#718096', display: 'block' }}>SERVIÇO REALIZADO</span>
                <span style={{ fontSize: '0.9rem' }}>{checkoutBooking.service?.name || checkoutBooking.serviceName}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#718096', display: 'block' }}>VALOR TOTAL COBRADO</span>
                <strong style={{ fontSize: '1.2rem', color: 'var(--mobile-green)' }}>
                  R$ {(checkoutBooking.service?.price || checkoutBooking.servicePrice || 150).toFixed(2).replace('.', ',')}
                </strong>
              </div>
            </div>

            <div className="mobile-form-group">
              <label>Forma de Pagamento *</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                <option value="pix">⚡ PIX</option>
                <option value="credito">💳 Cartão de Crédito</option>
                <option value="debito">💳 Cartão de Débito</option>
                <option value="dinheiro">💵 Dinheiro</option>
              </select>
            </div>

            <div className="mobile-modal-actions">
              <button type="button" className="btn-cancel" onClick={() => setShowCheckoutModal(false)}>Cancelar</button>
              <button type="button" className="btn-save" style={{ background: 'var(--mobile-green)' }} onClick={submitCheckout}>
                Confirmar Recebimento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CENTRAL DE NOTIFICAÇÕES */}
      {showNotificationsModal && (
        <div className="mobile-overlay" onClick={() => setShowNotificationsModal(false)}>
          <div className="mobile-popup-modal notifications-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-sheet-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bell size={20} className="text-pink" style={{ color: 'var(--mobile-primary)' }} />
                <h4 style={{ margin: 0 }}>Central de Notificações</h4>
              </div>
              <button onClick={() => setShowNotificationsModal(false)}><X size={20} /></button>
            </div>

            <div className="notifications-list-container" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '4px 0' }}>
              {'Notification' in window && Notification.permission !== 'granted' && (
                <div style={{ padding: '12px', background: '#fff3cd', borderRadius: '8px', marginBottom: '12px', border: '1px solid #ffe69c' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#664d03' }}>Ative as notificações para receber avisos e sons no celular.</p>
                  <button onClick={requestNotificationPermission} style={{ width: '100%', padding: '8px', background: '#ffc107', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                    🔔 Ativar Notificações
                  </button>
                </div>
              )}
              {notifications.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, gap: 10 }}>
                  <button 
                    onClick={markAllAsRead} 
                    className="notif-action-btn"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--mobile-primary)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontWeight: '500',
                      padding: '4px 8px'
                    }}
                  >
                    Marcar todas como lidas
                  </button>
                  <button 
                    onClick={clearAllNotifications} 
                    className="notif-action-btn notif-clear-btn"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#a0aec0',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontWeight: '500',
                      padding: '4px 8px'
                    }}
                  >
                    Limpar histórico
                  </button>
                </div>
              )}

              {notifications.length === 0 ? (
                <div className="empty-notifications" style={{ textAlign: 'center', padding: '40px 20px', color: '#a0aec0' }}>
                  <Bell size={36} style={{ opacity: 0.3, marginBottom: 8, margin: '0 auto' }} />
                  <p style={{ fontSize: '0.85rem' }}>Você não tem nenhuma notificação.</p>
                </div>
              ) : (
                <div className="notifications-list" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      className={`notification-card ${notif.type} ${notif.read ? 'read' : 'unread'}`}
                      onClick={() => markAsRead(notif.id)}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        borderLeft: '4px solid',
                        borderLeftColor: notif.type === 'novo_agendamento' ? 'var(--mobile-primary)' : notif.type === 'lembrete_30m' ? '#ed8936' : '#ecc94b',
                        background: notif.read ? '#f7fafc' : 'rgba(213, 63, 140, 0.05)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div className="notif-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {!notif.read && (
                            <span className="notif-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--mobile-primary)', display: 'inline-block' }} />
                          )}
                          <span className="notif-title" style={{ fontWeight: notif.read ? '500' : '700', fontSize: '0.85rem', color: '#2d3748' }}>
                            {notif.title}
                          </span>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notif.id);
                          }} 
                          className="notif-delete-btn"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#a0aec0',
                            cursor: 'pointer',
                            padding: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <p className="notif-message" style={{ fontSize: '0.8rem', color: '#4a5568', margin: '4px 0 6px 0', lineHeight: '1.3' }}>
                        {notif.message}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <span className="notif-time" style={{ fontSize: '0.7rem', color: '#a0aec0' }}>
                          {new Date(notif.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMobileApp;
