import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, onSnapshot, doc, addDoc, updateDoc, query, orderBy, limit, getDoc, setDoc, deleteDoc, where, getDocs 
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
  address: 'Rua Francisco Ovídio, 184 - Caiçara, Belo Horizonte - MG',
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
  const [inventory, setInventory] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(!db);

  // Modais
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showAddBookingModal, setShowAddBookingModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutBooking, setCheckoutBooking] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [activeAlert, setActiveAlert] = useState(null); // { id, title, message, booking }

  // Venda Avulsa de Produtos
  const [showDirectSaleModal, setShowDirectSaleModal] = useState(false);
  const [directSaleProducts, setDirectSaleProducts] = useState([]);
  const [directSaleDiscount, setDirectSaleDiscount] = useState(0);
  const [directSalePaymentMethod, setDirectSalePaymentMethod] = useState('Pix');
  const [directSaleInstallments, setDirectSaleInstallments] = useState('À vista');
  const [directSaleClient, setDirectSaleClient] = useState('');
  const [showDirectSaleSuggestions, setShowDirectSaleSuggestions] = useState(false);

  useEffect(() => {
    if (!showCheckoutModal) {
      setInstallments('À vista');
    }
  }, [showCheckoutModal]);

  useEffect(() => {
    if (!showDirectSaleModal) {
      setDirectSaleInstallments('À vista');
    }
  }, [showDirectSaleModal]);

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
  const pendingRequests = bookings.filter(b => b.status === 'pendente');
  const pendingCount = pendingRequests.length;

  const [blockMotive, setBlockMotive] = useState('Almoço');
  const [blockEndTime, setBlockEndTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [installments, setInstallments] = useState('À vista');
  const [sendingMsgStatus, setSendingMsgStatus] = useState('');

  // 1. Listeners em Tempo Real
  useEffect(() => {
    let unsubBookings;
    let unsubClients;
    let unsubTx;
    let unsubServ;
    let unsubInventory;
    let unsubSettings;
    let unsubAuth;

    // Load local storage mock data immediately for Offline-First responsiveness
    loadLocalMockData();

    if (!db) {
      setIsDemoMode(true);
      setLoading(false);
      return;
    }

    setLoading(true);

    unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        console.warn('Usuário não autenticado no Mobile. Redirecionando para login.');
        setIsDemoMode(true);
        setLoading(false);
        navigate('/admin/login');
        return;
      }

      setIsDemoMode(false);

      try {
        unsubBookings = onSnapshot(collection(db, 'bookings'), (snapshot) => {
          const list = [];
          snapshot.forEach(doc => {
            list.push({ id: doc.id, ...doc.data() });
          });
          setBookings(list);
          localStorage.setItem('demo_bookings', JSON.stringify(list));
          setLoading(false);
        }, (err) => {
          console.warn('Erro ao escutar bookings:', err);
        });

        unsubClients = onSnapshot(collection(db, 'client_profiles'), (snapshot) => {
          const list = [];
          snapshot.forEach(doc => {
            list.push({ id: doc.id, ...doc.data() });
          });
          setClients(list);
          localStorage.setItem('demo_client_profiles', JSON.stringify(list));
        }, (err) => {
          console.warn('Erro ao escutar client_profiles:', err);
        });

        unsubTx = onSnapshot(collection(db, 'financial_transactions'), (snapshot) => {
          const list = [];
          snapshot.forEach(doc => {
            list.push({ id: doc.id, ...doc.data() });
          });
          setTransactions(list);
          localStorage.setItem('demo_transactions', JSON.stringify(list));
          localStorage.setItem('demo_financial', JSON.stringify(list));
        }, (err) => {
          console.warn('Erro ao escutar financial_transactions:', err);
        });

        unsubServ = onSnapshot(collection(db, 'services'), (snapshot) => {
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
        }, (err) => {
          console.warn('Erro ao escutar services:', err);
        });

        unsubInventory = onSnapshot(collection(db, 'products'), (snapshot) => {
          const list = [];
          snapshot.forEach(doc => {
            list.push({ id: doc.id, ...doc.data() });
          });
          setInventory(list);
          localStorage.setItem('demo_inventory', JSON.stringify(list));
        }, (err) => {
          console.warn('Erro ao escutar inventory:', err);
        });

        unsubSettings = onSnapshot(doc(db, 'settings', 'studio'), (snapshot) => {
          if (snapshot.exists()) {
            setSettings(snapshot.data());
            localStorage.setItem('demo_studio_settings', JSON.stringify(snapshot.data()));
          }
          setLoading(false);
        }, (err) => {
          console.warn('Erro ao escutar settings:', err);
          setLoading(false);
        });

      } catch (e) {
        console.error('Erro ao registrar listeners do Firebase:', e);
        setIsDemoMode(true);
        setLoading(false);
      }
    });

    return () => {
      if (unsubAuth) unsubAuth();
      if (unsubBookings) unsubBookings();
      if (unsubClients) unsubClients();
      if (unsubTx) unsubTx();
      if (unsubServ) unsubServ();
      if (unsubInventory) unsubInventory();
      if (unsubSettings) unsubSettings();
    };
  }, []);

  const loadLocalMockData = () => {
    const savedBookings = localStorage.getItem('demo_bookings');
    const savedClients = localStorage.getItem('demo_client_profiles');
    const savedTransactions = localStorage.getItem('demo_transactions');
    const savedServices = localStorage.getItem('demo_services');
    const savedInventory = localStorage.getItem('demo_inventory');
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
    if (savedInventory) setInventory(JSON.parse(savedInventory));
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
  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const playTone = (freq, start, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.15, start + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };
      playTone(523.25, ctx.currentTime, 0.3);
      playTone(659.25, ctx.currentTime + 0.15, 0.4);
    } catch (e) {
      console.warn('Sound play failed:', e);
    }
  };

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

    playNotificationSound();

    if (type === 'novo_agendamento') {
      const bookingId = id.replace('new_booking_', '');
      const actualBooking = bookings.find(b => b.id === bookingId) || {
        id: bookingId,
        clientName: message.split(' agendou')[0] || 'Cliente',
        serviceName: 'Serviço',
        status: 'pendente'
      };
      setActiveAlert({
        id,
        title,
        message,
        booking: actualBooking
      });
    }

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
      setEditingBookingId(null);
      setSelectedSlot({ date: currentDate, time: timeStr });
      setNewBooking(prev => ({
        ...prev,
        clientName: '',
        clientPhone: '',
        clientEmail: '',
        serviceName: services[0]?.name || 'Corte com o Jon',
        servicePrice: services[0]?.promoPrice || services[0]?.price || 150,
        duration: services[0]?.duration || 60,
        date: currentDate,
        time: timeStr,
        notes: ''
      }));
      setShowAddBookingModal(true);
    }
  };

  const openEditBooking = (booking) => {
    setEditingBookingId(booking.id);
    setNewBooking({
      clientName: booking.clientName || '',
      clientPhone: booking.clientPhone || '',
      clientEmail: booking.clientEmail || '',
      serviceName: booking.serviceName || booking.service?.name || '',
      servicePrice: booking.servicePrice || booking.service?.price || 150,
      duration: booking.duration || 60,
      date: booking.date || '',
      time: booking.time || '',
      notes: booking.notes || ''
    });
    setSelectedBooking(null);
    setShowAddBookingModal(true);
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
      if (editingBookingId) {
        if (isDemoMode) {
          const local = bookings.map(b => b.id === editingBookingId ? { ...b, ...payload } : b);
          setBookings(local);
          localStorage.setItem('demo_bookings', JSON.stringify(local));
        } else {
          const apptRef = doc(db, 'bookings', editingBookingId);
          await updateDoc(apptRef, payload);
        }
      } else {
        if (isDemoMode) {
          const local = [...bookings, { id: 'demo-' + Date.now(), ...payload }];
          setBookings(local);
          localStorage.setItem('demo_bookings', JSON.stringify(local));
        } else {
          await addDoc(collection(db, 'bookings'), payload);
        }
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

      // Enviar e-mail de confirmação de agendamento manual
      if (payload.clientEmail && payload.clientEmail.includes('@')) {
        try {
          const displayDate = payload.date.split('-').reverse().join('/');
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'horario_confirmado',
              clientEmail: payload.clientEmail,
              clientName: payload.clientName,
              serviceName: payload.service?.name || 'Serviço',
              date: displayDate,
              time: payload.time,
              duration: payload.duration || 60,
              professionalName: 'Jon'
            })
          });
        } catch (err) {
          console.warn('Falha ao enviar email de confirmação no cadastro manual', err);
        }
      }

      setShowAddBookingModal(false);
      resetBookingForm();
      const isEdit = !!editingBookingId;
      setEditingBookingId(null);
      alert(isEdit ? 'Agendamento atualizado com sucesso!' : 'Agendamento cadastrado com sucesso!');
    } catch (err) {
      alert('Erro ao registrar agendamento.');
    }
  };

  const submitBlock = async (e) => {
    if (e) e.preventDefault();

    // Gerar todos os slots de hora cheia entre início e fim
    const ALL_HOUR_SLOTS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];
    const startTime = newBooking.time || '08:00';
    const endTime = blockEndTime || startTime;
    const slotsToBlock = ALL_HOUR_SLOTS.filter(slot => slot >= startTime && slot <= endTime);
    if (slotsToBlock.length === 0) slotsToBlock.push(startTime);

    const basePayload = {
      clientName: 'Horário Bloqueado',
      clientPhone: '00000000000',
      clientEmail: '',
      service: { name: 'Bloqueio Administrativo', price: 0 },
      date: newBooking.date,
      notes: blockMotive,
      status: 'bloqueado',
      professionalId: 'jon',
      createdAt: new Date().toISOString()
    };

    try {
      if (isDemoMode) {
        const newEntries = slotsToBlock.map((slot, i) => ({
          id: 'demo-block-' + Date.now() + '-' + i,
          ...basePayload,
          time: slot
        }));
        const local = [...bookings, ...newEntries];
        setBookings(local);
        localStorage.setItem('demo_bookings', JSON.stringify(local));
      } else {
        await Promise.all(slotsToBlock.map(slot =>
          addDoc(collection(db, 'bookings'), { ...basePayload, time: slot })
        ));
      }
      setShowBlockModal(false);
      setShowAddBookingModal(false);
      setBlockEndTime('');
      resetBookingForm();
    } catch (err) {
      alert('Erro ao bloquear horário. Tente novamente.');
      console.error(err);
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
    setSelectedProducts([]);
    setDiscount(0);
    setShowCheckoutModal(true);
  };

  const submitCheckout = async () => {
    if (!checkoutBooking) return;
    const baseServicePrice = checkoutBooking.service?.price || checkoutBooking.servicePrice || 150;
    const productsTotal = selectedProducts.reduce((acc, p) => acc + (p.sellingPrice * p.qty), 0);
    const prepay = checkoutBooking.prepayment ? Number(checkoutBooking.prepayment) : 0;
    const value = Math.max(0, baseServicePrice + productsTotal - discount - prepay);
    
    let description = checkoutBooking.service?.name || checkoutBooking.serviceName || 'Serviço Base';
    if (selectedProducts.length > 0) {
      description += ` + ${selectedProducts.map(p => `${p.qty}x ${p.name}`).join(', ')}`;
    }
    if (discount > 0) {
      description += ` (Desconto: R$ ${discount})`;
    }
    if (prepay > 0) {
      description += ` (Sinal/Adiantamento: -R$ ${prepay})`;
    }

    const payloadTx = {
      bookingId: checkoutBooking.id,
      date: checkoutBooking.date || new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      clientName: checkoutBooking.clientName,
      clientPhone: checkoutBooking.clientPhone || '',
      type: 'entrada',
      paymentMethod: paymentMethod === 'Cartão de Crédito' ? `Cartão de Crédito (${installments})` : paymentMethod,
      discount: discount,
      value: Number(value),
      description,
      professionalId: checkoutBooking.profissional || 'jon',
      // Include products breakdown to track costs
      productSales: selectedProducts.map(p => {
        const match = inventory.find(prod => prod.id === p.id);
        return {
          productId: p.id,
          name: p.name,
          quantity: p.qty,
          sellingPrice: p.sellingPrice,
          costPrice: match ? (match.costPrice || 0) : 0
        };
      }),
      createdAt: new Date().toISOString()
    };

    // Calculate service cost
    const mainService = services.find(s => s.name === (checkoutBooking.service?.name || checkoutBooking.serviceName));
    const totalServiceCost = mainService ? (Number(mainService.cost) || 0) : 0;

    try {
      if (isDemoMode) {
        // Atualiza booking
        const updatedB = bookings.map(b => b.id === checkoutBooking.id ? { ...b, status: 'finalizado' } : b);
        setBookings(updatedB);
        localStorage.setItem('demo_bookings', JSON.stringify(updatedB));
        
        // Adiciona tx
        const newTx = { id: 'tx_' + Date.now(), ...payloadTx };
        let updatedTx = [newTx, ...transactions];

        if (totalServiceCost > 0) {
          const serviceCostTx = {
            id: 'tx_cost_' + Date.now(),
            bookingId: checkoutBooking.id,
            date: checkoutBooking.date || new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            clientName: checkoutBooking.clientName,
            clientPhone: checkoutBooking.clientPhone || '',
            type: 'saida',
            paymentMethod,
            value: totalServiceCost,
            description: `Custo de Execução - ${checkoutBooking.service?.name || checkoutBooking.serviceName || 'Serviço'}`,
            professionalId: checkoutBooking.profissional || 'jon',
            createdAt: new Date().toISOString()
          };
          updatedTx = [serviceCostTx, ...updatedTx];
        }

        setTransactions(updatedTx);
        localStorage.setItem('demo_financial', JSON.stringify(updatedTx));
        localStorage.setItem('demo_transactions', JSON.stringify(updatedTx));
        
        // Atualiza estoque
        const updatedInv = inventory.map(item => {
          const sold = selectedProducts.find(p => p.id === item.id);
          if (sold) return { ...item, quantity: Math.max(0, item.quantity - sold.qty) };
          return item;
        });
        setInventory(updatedInv);
        localStorage.setItem('demo_inventory', JSON.stringify(updatedInv));
      } else {
        const apptRef = doc(db, 'bookings', checkoutBooking.id);
        await updateDoc(apptRef, { status: 'finalizado' });
        await addDoc(collection(db, 'financial_transactions'), payloadTx);

        if (totalServiceCost > 0) {
          const serviceCostTx = {
            bookingId: checkoutBooking.id,
            date: checkoutBooking.date || new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            clientName: checkoutBooking.clientName,
            clientPhone: checkoutBooking.clientPhone || '',
            type: 'saida',
            paymentMethod,
            value: totalServiceCost,
            description: `Custo de Execução - ${checkoutBooking.service?.name || checkoutBooking.serviceName || 'Serviço'}`,
            professionalId: checkoutBooking.profissional || 'jon',
            createdAt: new Date().toISOString()
          };
          await addDoc(collection(db, 'financial_transactions'), serviceCostTx);
        }
        
        // Baixa no estoque
        for (const prod of selectedProducts) {
          const invRef = doc(db, 'products', prod.id);
          const currentItem = inventory.find(i => i.id === prod.id);
          if (currentItem) {
            await updateDoc(invRef, { quantity: Math.max(0, currentItem.quantity - prod.qty) });
          }
        }
      }
      setShowCheckoutModal(false);
      setCheckoutBooking(null);
      setSelectedProducts([]);
      alert('Comanda fechada com sucesso! Receita, despesa de custo de serviço e baixa no estoque registradas.');
    } catch (e) {
      alert('Erro ao fechar comanda.');
    }
  };

  // Venda Avulsa de Produtos
  const submitDirectSale = async (e) => {
    if (e) e.preventDefault();
    if (directSaleProducts.length === 0) {
      alert('Selecione pelo menos um produto para vender.');
      return;
    }

    const productsTotal = directSaleProducts.reduce((acc, p) => acc + (p.sellingPrice * p.qty), 0);
    const value = Math.max(0, productsTotal - directSaleDiscount);
    const clientName = directSaleClient.trim() || 'Cliente Avulso';

    let description = `Venda Avulsa de Produto: ${directSaleProducts.map(p => `${p.qty}x ${p.name}`).join(', ')}`;
    if (directSaleDiscount > 0) {
      description += ` (Desconto: R$ ${directSaleDiscount})`;
    }

    const payloadTx = {
      bookingId: 'venda_avulsa_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      clientName,
      clientPhone: '',
      type: 'entrada',
      paymentMethod: directSalePaymentMethod === 'Cartão de Crédito' ? `Cartão de Crédito (${directSaleInstallments})` : directSalePaymentMethod,
      discount: directSaleDiscount,
      value: Number(value),
      description,
      professionalId: 'jon',
      isProductSale: true,
      productSales: directSaleProducts.map(p => {
        const match = inventory.find(prod => prod.id === p.id);
        return {
          productId: p.id,
          name: p.name,
          quantity: p.qty,
          sellingPrice: p.sellingPrice,
          costPrice: match ? (match.costPrice || 0) : 0
        };
      }),
      createdAt: new Date().toISOString()
    };

    try {
      if (isDemoMode) {
        // Adiciona tx
        const updatedTx = [{ id: 'tx_' + Date.now(), ...payloadTx }, ...transactions];
        setTransactions(updatedTx);
        localStorage.setItem('demo_financial', JSON.stringify(updatedTx));
        localStorage.setItem('demo_transactions', JSON.stringify(updatedTx));
        
        // Atualiza estoque
        const updatedInv = inventory.map(item => {
          const sold = directSaleProducts.find(p => p.id === item.id);
          if (sold) return { ...item, quantity: Math.max(0, item.quantity - sold.qty) };
          return item;
        });
        setInventory(updatedInv);
        localStorage.setItem('demo_inventory', JSON.stringify(updatedInv));
      } else {
        await addDoc(collection(db, 'financial_transactions'), payloadTx);
        
        // Baixa no estoque
        for (const prod of directSaleProducts) {
          const invRef = doc(db, 'products', prod.id);
          const currentItem = inventory.find(i => i.id === prod.id);
          if (currentItem) {
            await updateDoc(invRef, { quantity: Math.max(0, currentItem.quantity - prod.qty) });
          }
        }
      }
      setShowDirectSaleModal(false);
      setDirectSaleProducts([]);
      setDirectSaleDiscount(0);
      setDirectSaleClient('');
      alert('Venda avulsa registrada com sucesso! Faturamento e estoque atualizados.');
    } catch (e) {
      alert('Erro ao registrar venda.');
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
      const booking = bookings.find(b => b.id === bookingId);
      
      if (isDemoMode) {
        const updated = bookings.map(b => b.id === bookingId ? { ...b, status: 'cancelado' } : b);
        setBookings(updated);
        localStorage.setItem('demo_bookings', JSON.stringify(updated));

        // Delete from local storage transactions
        const localTx = localStorage.getItem('demo_financial') || localStorage.getItem('demo_transactions');
        if (localTx) {
          const arr = JSON.parse(localTx);
          const filtered = arr.filter(t => 
            t.bookingId !== bookingId && 
            !(t.clientPhone === booking?.clientPhone && t.date === booking?.date)
          );
          localStorage.setItem('demo_financial', JSON.stringify(filtered));
          localStorage.setItem('demo_transactions', JSON.stringify(filtered));
          setTransactions(filtered);
        }
      } else {
        const docRef = doc(db, 'bookings', bookingId);
        await updateDoc(docRef, { status: 'cancelado' });

        try {
          // Delete by bookingId
          const q = query(collection(db, 'financial_transactions'), where('bookingId', '==', bookingId));
          const qSnap = await getDocs(q);
          for (const docRef of qSnap.docs) {
            await deleteDoc(docRef.ref);
          }

          // Delete by client phone and date (fallback)
          if (booking?.clientPhone && booking?.date) {
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
          console.error('Erro ao deletar transações financeiras (Mobile):', deleteErr);
        }
      }
      setSelectedBooking(null);
      alert('Agendamento cancelado.');
    } catch (e) {
      alert('Erro ao cancelar agendamento.');
    }
  };

  // Confirmar agendamento
  const confirmBooking = async (bookingId) => {
    try {
      const bookingToConfirm = bookings.find(b => b.id === bookingId);
      
      if (isDemoMode) {
        const updated = bookings.map(b => b.id === bookingId ? { ...b, status: 'confirmado' } : b);
        setBookings(updated);
        localStorage.setItem('demo_bookings', JSON.stringify(updated));
      } else {
        const docRef = doc(db, 'bookings', bookingId);
        await updateDoc(docRef, { status: 'confirmado' });
      }
      
      setSelectedBooking(prev => ({ ...prev, status: 'confirmado' }));
      
      // Enviar e-mail de confirmação
      if (bookingToConfirm && bookingToConfirm.clientEmail && bookingToConfirm.clientEmail.includes('@')) {
        try {
          const displayDate = bookingToConfirm.date.split('-').reverse().join('/');
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'horario_confirmado',
              clientEmail: bookingToConfirm.clientEmail,
              clientName: bookingToConfirm.clientName,
              serviceName: bookingToConfirm.service?.name || bookingToConfirm.serviceName || 'Serviço',
              date: displayDate,
              time: bookingToConfirm.time,
              duration: bookingToConfirm.duration || 60,
              professionalName: 'Jon'
            })
          });
        } catch(err) {
          console.warn('Falha ao enviar email de confirmação', err);
        }
      }
      
      alert('Agendamento confirmado!');
    } catch (e) {
      alert('Erro ao confirmar agendamento.');
    }
  };

  // Marcar Falta (No-Show)
  const markAsNoShow = async (bookingId) => {
    try {
      if (isDemoMode) {
        const updated = bookings.map(b => b.id === bookingId ? { ...b, status: 'faltou' } : b);
        setBookings(updated);
        localStorage.setItem('demo_bookings', JSON.stringify(updated));
      } else {
        const docRef = doc(db, 'bookings', bookingId);
        await updateDoc(docRef, { status: 'faltou' });
      }
      
      setSelectedBooking(prev => ({ ...prev, status: 'faltou' }));
      alert('Agendamento marcado como falta.');
    } catch (e) {
      alert('Erro ao marcar falta.');
    }
  };

  // 9. Comissões do Jon (60% padrão)
  const getCommissionData = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const monthPrefix = `${currentYear}-${currentMonth}`;

    const jonProf = settings?.professionals?.find(p => p.id === 'jon');
    const commServ = jonProf ? (jonProf.commissionService !== undefined ? jonProf.commissionService : (jonProf.commission || 60)) : 60;
    const commProd = jonProf ? (jonProf.commissionProduct !== undefined ? jonProf.commissionProduct : 10) : 10;

    // Filter transactions for professional 'jon' in the current month
    const monthlyTxs = transactions.filter(t => 
      t.type === 'entrada' && 
      t.date && 
      t.date.startsWith(monthPrefix) && 
      (t.professionalId === 'jon' || !t.professionalId)
    );

    const list = monthlyTxs.map(t => {
      const productVal = t.productSales ? t.productSales.reduce((acc, p) => acc + (p.sellingPrice * p.quantity), 0) : 0;
      const isProdSale = t.isProductSale || t.category === 'venda_produto';
      
      let rawProd = 0;
      let rawServ = 0;

      if (isProdSale) {
        rawProd = t.value;
      } else {
        rawProd = productVal;
        rawServ = Math.max(0, t.value - productVal);
      }

      const servComm = rawServ * (commServ / 100);
      const prodComm = rawProd * (commProd / 100);
      const commissionValue = servComm + prodComm;

      let typeStr = '';
      if (rawServ > 0 && rawProd > 0) {
        typeStr = `Serviços (${commServ}%) + Produtos (${commProd}%)`;
      } else if (rawServ > 0) {
        typeStr = `Serviços (${commServ}%)`;
      } else if (rawProd > 0) {
        typeStr = `Produtos (${commProd}%)`;
      }

      return {
        id: t.id,
        clientName: t.clientName || 'Cliente',
        serviceName: `${t.description || 'Venda'} - ${typeStr}`,
        date: t.date,
        price: t.value,
        commissionValue
      };
    });

    const total = list.reduce((sum, item) => sum + item.commissionValue, 0);
    return { list, total, commServ, commProd };
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
            {pendingCount > 0 && <span className="bell-badge">{pendingCount}</span>}
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
            <div className="mobile-shortcut-card" onClick={() => { setEditingBookingId(null); resetBookingForm(); setNewBooking(prev => ({ ...prev, date: todayStr })); setShowAddBookingModal(true); }}>
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
            <div className="mobile-action-btn-card" onClick={() => { setEditingBookingId(null); resetBookingForm(); setShowAddBookingModal(true); }}>
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

            <div className="mobile-action-btn-card" onClick={() => {
              setDirectSaleProducts([]);
              setDirectSaleDiscount(0);
              setDirectSaleClient('');
              setShowDirectSaleModal(true);
            }}>
              <div className="icon-wrapper" style={{ background: 'var(--mobile-green-light)', color: 'var(--mobile-green)' }}>
                <Plus size={20} />
              </div>
              <span>Venda avulsa (Produto)</span>
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
              De 01/{new Date().getMonth() + 1}/{new Date().getFullYear()} até {new Date().getDate()}/{new Date().getMonth() + 1}/{new Date().getFullYear()} ({commissions.commServ}% Serv. / {commissions.commProd}% Prod.)
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

          <div style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--mobile-muted)', paddingLeft: '8px', marginBottom: '8px' }}>
            Opções do menu
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

            <div className="mobile-menu-item" onClick={() => navigate('/admin/financeiro?tab=fechadas')}>
              <div className="mobile-menu-item-left">
                <FileText size={18} />
                <span>Contas fechadas</span>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--mobile-muted)' }} />
            </div>

            <div className="mobile-menu-item" onClick={() => navigate('/admin/configuracoes')}>
              <div className="mobile-menu-item-left">
                <Settings size={18} />
                <span>Configurações</span>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--mobile-muted)' }} />
            </div>

            <div className="mobile-menu-item" onClick={() => setShowNotificationsModal(true)}>
              <div className="mobile-menu-item-left">
                <Bell size={18} />
                <span>Notificações</span>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--mobile-muted)' }} />
            </div>

            <div className="mobile-menu-item" onClick={() => alert('Central de Ajuda: Entre em contato pelo suporte no WhatsApp.')}>
              <div className="mobile-menu-item-left">
                <HelpCircle size={18} />
                <span>Central de Ajuda</span>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--mobile-muted)' }} />
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--mobile-muted)', paddingLeft: '8px', marginBottom: '8px', marginTop: '16px' }}>
            Outras opções
          </div>

          <div className="mobile-menu-list">
            <div className="mobile-menu-item" onClick={() => navigate('/admin')}>
              <div className="mobile-menu-item-left" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Painel de Atendimento</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--mobile-muted)', fontWeight: 'normal' }}>Acesse o Painel de Atendimento na web</span>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--mobile-muted)' }} />
            </div>

            <div className="mobile-menu-item" onClick={() => window.open('/', '_blank')}>
              <div className="mobile-menu-item-left" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Ver meu site</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--mobile-muted)', fontWeight: 'normal' }}>Acesse seu site e compartilhe com os clientes</span>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--mobile-muted)' }} />
            </div>

            <div className="mobile-menu-item" onClick={async () => { try { await auth.signOut(); navigate('/admin/login'); } catch (e) { console.error(e); } }}>
              <div className="mobile-menu-item-left">
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--mobile-red)' }}>Sair</span>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--mobile-muted)' }} />
            </div>
          </div>
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
              <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                {selectedBooking.status === 'pendente' && (
                  <button className="mobile-btn-solid" style={{ background: 'var(--mobile-primary)', flex: '1 1 40%' }} onClick={() => confirmBooking(selectedBooking.id)}>
                    Confirmar
                  </button>
                )}
                {selectedBooking.status !== 'finalizado' && selectedBooking.status !== 'bloqueado' && (
                  <button className="mobile-btn-solid" style={{ background: 'var(--mobile-primary)', flex: '1 1 40%' }} onClick={() => openEditBooking(selectedBooking)}>
                    Editar
                  </button>
                )}
                {selectedBooking.status !== 'finalizado' && selectedBooking.status !== 'bloqueado' && (
                  <button className="mobile-btn-solid" style={{ background: 'var(--mobile-green)', flex: '1 1 40%' }} onClick={() => openCheckout(selectedBooking)}>
                    Fechar Conta
                  </button>
                )}
                {selectedBooking.status !== 'bloqueado' && (
                  <button className="mobile-btn-outline" style={{ borderColor: 'var(--mobile-red)', color: 'var(--mobile-red)', flex: '1 1 40%' }} onClick={() => cancelBooking(selectedBooking.id)}>
                    Cancelar Horário
                  </button>
                )}
                {selectedBooking.status !== 'finalizado' && selectedBooking.status !== 'bloqueado' && selectedBooking.status !== 'faltou' && selectedBooking.status !== 'cancelado' && (
                  <button className="mobile-btn-outline" style={{ borderColor: '#6b7280', color: '#6b7280', flex: '1 1 40%' }} onClick={() => markAsNoShow(selectedBooking.id)}>
                    Marcar Falta
                  </button>
                )}
                {selectedBooking.status === 'bloqueado' && (
                  <button className="mobile-btn-outline" style={{ borderColor: 'var(--mobile-red)', color: 'var(--mobile-red)', flex: '1 1 40%' }} onClick={() => cancelBooking(selectedBooking.id)}>
                    Remover Bloqueio
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ADICIONAR/EDITAR AGENDAMENTO */}
      {showAddBookingModal && (
        <div className="mobile-overlay" onClick={() => { setShowAddBookingModal(false); setEditingBookingId(null); }}>
          <div className="mobile-popup-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-sheet-header">
              <h4>{editingBookingId ? 'Editar Agendamento' : 'Novo Agendamento'}</h4>
              <button onClick={() => { setShowAddBookingModal(false); setEditingBookingId(null); }}><X size={20} /></button>
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
                {!editingBookingId && (
                  <button type="button" className="mobile-btn-outline" style={{ flex: 1 }} onClick={() => {
                    setShowAddBookingModal(false);
                    setBlockEndTime('');
                    setShowBlockModal(true);
                  }}>
                    {"Bloquear Hor\u00e1rio"}
                  </button>
                )}
                <button type="submit" className="mobile-btn-solid" style={{ flex: 1 }}>
                  {editingBookingId ? 'Salvar Alterações' : 'Reservar'}
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
              <h4>🔒 Bloquear Janela de Horário</h4>
              <button onClick={() => setShowBlockModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={submitBlock}>
              {/* Data */}
              <div className="mobile-form-group">
                <label>📅 Data do Bloqueio *</label>
                <input
                  type="date"
                  required
                  value={newBooking.date}
                  onChange={e => setNewBooking(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>

              {/* Horário início e fim */}
              <div className="mobile-form-group" style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label>⏰ Início *</label>
                  <select
                    required
                    value={newBooking.time}
                    onChange={e => {
                      setNewBooking(prev => ({ ...prev, time: e.target.value }));
                      // Resetar fim se for antes do início
                      if (blockEndTime && e.target.value > blockEndTime) setBlockEndTime(e.target.value);
                    }}
                  >
                    {['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label>⏰ Fim (inclusive) *</label>
                  <select
                    required
                    value={blockEndTime || newBooking.time}
                    onChange={e => setBlockEndTime(e.target.value)}
                  >
                    {['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00']
                      .filter(t => t >= newBooking.time)
                      .map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Resumo visual do intervalo */}
              <div style={{ background: '#fff0f7', border: '1px solid #ffc0d9', borderRadius: 8, padding: '8px 12px', fontSize: '0.82rem', color: '#c2185b', marginBottom: 10 }}>
                🚫 Slots que serão bloqueados: <strong>{newBooking.time}</strong> até <strong>{blockEndTime || newBooking.time}</strong> em <strong>{newBooking.date.split('-').reverse().join('/')}</strong>
              </div>

              {/* Motivo */}
              <div className="mobile-form-group">
                <label>Motivo do Bloqueio *</label>
                <select value={blockMotive} onChange={e => setBlockMotive(e.target.value)}>
                  <option value="Almoço">🍽️ Almoço</option>
                  <option value="Curso/Treinamento">📚 Curso / Treinamento</option>
                  <option value="Ausência Médica">🏥 Ausência Médica</option>
                  <option value="Manutenção do Espaço">🔧 Manutenção do Espaço</option>
                  <option value="Folga">☀️ Folga</option>
                  <option value="Outro">✏️ Outro Motivo</option>
                </select>
              </div>

              {blockMotive === 'Outro' && (
                <div className="mobile-form-group">
                  <label>Especifique o Motivo *</label>
                  <input type="text" placeholder="Ex: Compromisso pessoal" required onChange={e => setBlockMotive(e.target.value)} />
                </div>
              )}

              <div className="mobile-modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowBlockModal(false)}>Voltar</button>
                <button type="submit" className="btn-save">🔒 Confirmar Bloqueio</button>
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
              
              <div style={{ background: '#f8f9fa', padding: 12, borderRadius: 8, marginTop: 8 }}>
                <span style={{ fontSize: '0.75rem', color: '#718096', display: 'block', marginBottom: 4 }}>ITENS DA COMANDA</span>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.9rem' }}>{checkoutBooking.service?.name || checkoutBooking.serviceName}</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>R$ {(checkoutBooking.service?.price || checkoutBooking.servicePrice || 150).toFixed(2).replace('.', ',')}</span>
                </div>

                {selectedProducts.map((prod, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem' }}>{prod.qty}x {prod.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>R$ {(prod.sellingPrice * prod.qty).toFixed(2).replace('.', ',')}</span>
                      <button type="button" onClick={() => {
                        const newProds = [...selectedProducts];
                        newProds.splice(index, 1);
                        setSelectedProducts(newProds);
                      }} style={{ background: 'none', border: 'none', color: 'var(--mobile-red)', padding: 4 }}>
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mobile-form-group" style={{ marginTop: 8 }}>
                <label>Adicionar Produto</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select 
                    id="checkout-product-select"
                    style={{ flex: 1 }}
                    defaultValue=""
                  >
                    <option value="" disabled>Selecione um produto</option>
                    {inventory.filter(i => i.quantity > 0).map(i => (
                      <option key={i.id} value={i.id}>{i.name} - R$ {i.sellingPrice.toFixed(2).replace('.', ',')}</option>
                    ))}
                  </select>
                  <button type="button" className="mobile-btn-solid" style={{ padding: '0 16px', background: 'var(--mobile-primary)' }} onClick={() => {
                    const selectEl = document.getElementById('checkout-product-select');
                    if (!selectEl.value) return;
                    const prod = inventory.find(i => i.id === selectEl.value);
                    if (prod) {
                      const existing = selectedProducts.find(p => p.id === prod.id);
                      if (existing) {
                        setSelectedProducts(selectedProducts.map(p => p.id === prod.id ? { ...p, qty: p.qty + 1 } : p));
                      } else {
                        setSelectedProducts([...selectedProducts, { ...prod, qty: 1 }]);
                      }
                      selectEl.value = "";
                    }
                  }}>
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="mobile-form-group" style={{ marginTop: 8 }}>
                <label>Desconto (R$)</label>
                <input 
                  type="number"
                  min="0"
                  placeholder="0,00"
                  value={discount || ''}
                  onChange={e => setDiscount(Math.max(0, Number(e.target.value)))}
                />
              </div>

              {checkoutBooking.prepayment > 0 && (
                <div style={{ marginTop: 6, fontSize: '0.85rem', color: '#e53e3e', fontWeight: 600 }}>
                  <span>Sinal/Adiantamento Pago: </span>
                  <strong>- R$ {Number(checkoutBooking.prepayment).toFixed(2).replace('.', ',')}</strong>
                </div>
              )}

              <div>
                <span style={{ fontSize: '0.75rem', color: '#718096', display: 'block', marginTop: 10 }}>VALOR TOTAL COBRADO (RESTANTE)</span>
                <strong style={{ fontSize: '1.4rem', color: 'var(--mobile-green)' }}>
                  R$ {Math.max(0, (checkoutBooking.service?.price || checkoutBooking.servicePrice || 150) + selectedProducts.reduce((acc, p) => acc + (p.sellingPrice * p.qty), 0) - discount - (checkoutBooking.prepayment ? Number(checkoutBooking.prepayment) : 0)).toFixed(2).replace('.', ',')}
                </strong>
              </div>
            </div>

            <div className="mobile-form-group">
              <label>Forma de Pagamento *</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                <option value="Pix">⚡ PIX</option>
                <option value="Cartão de Crédito">💳 Cartão de Crédito</option>
                <option value="Cartão de Débito">💳 Cartão de Débito</option>
                <option value="Dinheiro">💵 Dinheiro</option>
              </select>
            </div>

            {paymentMethod === 'Cartão de Crédito' && (
              <div className="mobile-form-group">
                <label>Número de Parcelas *</label>
                <select value={installments} onChange={e => setInstallments(e.target.value)}>
                  <option value="À vista">À vista</option>
                  <option value="2x">2x</option>
                  <option value="3x">3x</option>
                </select>
              </div>
            )}

            <div className="mobile-modal-actions">
              <button type="button" className="btn-cancel" onClick={() => setShowCheckoutModal(false)}>Cancelar</button>
              <button type="button" className="btn-save" style={{ background: 'var(--mobile-green)' }} onClick={submitCheckout}>
                Confirmar Recebimento
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL DE VENDA AVULSA DE PRODUTOS */}
      {showDirectSaleModal && (
        <div className="mobile-overlay" onClick={() => setShowDirectSaleModal(false)}>
          <div className="mobile-popup-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-sheet-header">
              <h4>Registrar Venda Avulsa</h4>
              <button onClick={() => setShowDirectSaleModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={submitDirectSale}>
              <div className="mobile-form-group">
                <label>Nome do Cliente (Opcional)</label>
                <div className="mobile-autocomplete-container">
                  <input 
                    type="text" 
                    placeholder="Ex: Cliente Avulso ou nome" 
                    value={directSaleClient}
                    onChange={e => {
                      setDirectSaleClient(e.target.value);
                      setShowDirectSaleSuggestions(true);
                    }}
                    onFocus={() => setShowDirectSaleSuggestions(true)}
                    onBlur={() => setShowDirectSaleSuggestions(false)}
                  />
                  {showDirectSaleSuggestions && getFilteredClients(directSaleClient).length > 0 && (
                    <ul className="mobile-suggestions-list">
                      {getFilteredClients(directSaleClient).map(c => (
                        <li 
                          key={c.id} 
                          className="mobile-suggestion-item"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setDirectSaleClient(c.name || '');
                            setShowDirectSaleSuggestions(false);
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

              <div style={{ background: '#f8f9fa', padding: 12, borderRadius: 8, marginBottom: 14 }}>
                <span style={{ fontSize: '0.75rem', color: '#718096', display: 'block', marginBottom: 4, fontWeight: '700' }}>PRODUTOS SELECIONADOS</span>
                
                {directSaleProducts.length === 0 ? (
                  <span style={{ fontSize: '0.8rem', color: '#a0aec0' }}>Nenhum produto adicionado ainda.</span>
                ) : (
                  directSaleProducts.map((prod, index) => (
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem' }}>{prod.qty}x {prod.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>R$ {(prod.sellingPrice * prod.qty).toFixed(2).replace('.', ',')}</span>
                        <button type="button" onClick={() => {
                          const newProds = [...directSaleProducts];
                          newProds.splice(index, 1);
                          setDirectSaleProducts(newProds);
                        }} style={{ background: 'none', border: 'none', color: 'var(--mobile-red)', padding: 4 }}>
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mobile-form-group">
                <label>Selecionar Produto</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select 
                    id="direct-sale-product-select"
                    style={{ flex: 1 }}
                    defaultValue=""
                  >
                    <option value="" disabled>Selecione um produto</option>
                    {inventory.filter(i => i.quantity > 0).map(i => (
                      <option key={i.id} value={i.id}>{i.name} - R$ {i.sellingPrice.toFixed(2).replace('.', ',')}</option>
                    ))}
                  </select>
                  <button type="button" className="mobile-btn-solid" style={{ padding: '0 16px', background: 'var(--mobile-primary)' }} onClick={() => {
                    const selectEl = document.getElementById('direct-sale-product-select');
                    if (!selectEl.value) return;
                    const prod = inventory.find(i => i.id === selectEl.value);
                    if (prod) {
                      const existing = directSaleProducts.find(p => p.id === prod.id);
                      if (existing) {
                        setDirectSaleProducts(directSaleProducts.map(p => p.id === prod.id ? { ...p, qty: p.qty + 1 } : p));
                      } else {
                        setDirectSaleProducts([...directSaleProducts, { ...prod, qty: 1 }]);
                      }
                      selectEl.value = "";
                    }
                  }}>
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="mobile-form-group">
                <label>Desconto (R$)</label>
                <input 
                  type="number"
                  min="0"
                  placeholder="0,00"
                  value={directSaleDiscount || ''}
                  onChange={e => setDirectSaleDiscount(Math.max(0, Number(e.target.value)))}
                />
              </div>

              <div className="mobile-form-group">
                <label>Forma de Pagamento *</label>
                <select value={directSalePaymentMethod} onChange={e => setDirectSalePaymentMethod(e.target.value)}>
                  <option value="Pix">⚡ PIX</option>
                  <option value="Cartão de Crédito">💳 Cartão de Crédito</option>
                  <option value="Cartão de Débito">💳 Cartão de Débito</option>
                  <option value="Dinheiro">💵 Dinheiro</option>
                </select>
              </div>

              {directSalePaymentMethod === 'Cartão de Crédito' && (
                <div className="mobile-form-group">
                  <label>Número de Parcelas *</label>
                  <select value={directSaleInstallments} onChange={e => setDirectSaleInstallments(e.target.value)}>
                    <option value="À vista">À vista</option>
                    <option value="2x">2x</option>
                    <option value="3x">3x</option>
                  </select>
                </div>
              )}

              <div style={{ margin: '14px 0' }}>
                <span style={{ fontSize: '0.75rem', color: '#718096', display: 'block' }}>TOTAL A RECEBER</span>
                <strong style={{ fontSize: '1.3rem', color: 'var(--mobile-green)' }}>
                  R$ {Math.max(0, directSaleProducts.reduce((acc, p) => acc + (p.sellingPrice * p.qty), 0) - directSaleDiscount).toFixed(2).replace('.', ',')}
                </strong>
              </div>

              <div className="mobile-modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowDirectSaleModal(false)}>Cancelar</button>
                <button type="submit" className="btn-save" style={{ background: 'var(--mobile-green)' }}>
                  Confirmar Venda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CENTRAL DE NOTIFICAÇÕES (Novas Solicitações) */}
      {showNotificationsModal && (
        <div className="mobile-overlay" onClick={() => setShowNotificationsModal(false)}>
          <div className="mobile-popup-modal notifications-sheet" onClick={(e) => e.stopPropagation()} style={{ background: '#fbf7f0', border: '1px solid #e8dec9' }}>
            <div className="mobile-sheet-header" style={{ borderBottom: '1px solid #e8dec9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h4 style={{ margin: 0, color: '#2d3748', fontSize: '1.05rem', fontWeight: 'bold' }}>Novas Solicitações</h4>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: '#c05621', fontWeight: 'bold', fontSize: '0.85rem' }}>{pendingCount} pendentes</span>
                <button onClick={() => setShowNotificationsModal(false)} style={{ border: 'none', background: 'none', color: '#718096', padding: 0 }}><X size={20} /></button>
              </div>
            </div>

            <div className="notifications-list-container" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '4px 0' }}>
              {pendingRequests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#a0aec0' }}>
                  <Check size={36} style={{ opacity: 0.3, marginBottom: 8, margin: '0 auto', color: '#48bb78' }} />
                  <p style={{ fontSize: '0.85rem' }}>Nenhuma nova solicitação pendente.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {pendingRequests.map(req => {
                    const formattedDate = req.date ? req.date.split('-').reverse().join('/') : '';
                    return (
                      <div 
                        key={req.id} 
                        style={{
                          padding: '16px',
                          borderRadius: '12px',
                          background: '#ffffff',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                          border: '1px solid #ede8db',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                          position: 'relative'
                        }}
                      >
                        <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#1a202c', wordBreak: 'break-word' }}>
                          {req.clientName}
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.825rem', color: '#4a5568' }}>
                          <div>
                            <span style={{ fontWeight: '600', color: '#718096' }}>Serviço:</span> {req.service?.name || req.serviceName}
                          </div>
                          <div>
                            <span style={{ fontWeight: '600', color: '#718096' }}>Data/Hora:</span> {formattedDate} às {req.time}
                          </div>
                          {req.clientPhone && (
                            <div>
                              <span style={{ fontWeight: '600', color: '#718096' }}>WhatsApp:</span> {req.clientPhone}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                          <button 
                            onClick={async () => {
                              await confirmBooking(req.id);
                            }}
                            style={{
                              background: '#8c5027',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '8px 16px',
                              fontSize: '0.85rem',
                              fontWeight: 'bold',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              cursor: 'pointer',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                              transition: 'background 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#733e1c'}
                            onMouseOut={(e) => e.currentTarget.style.background = '#8c5027'}
                          >
                            <Check size={16} /> Aceitar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* POPUP DE NOVO AGENDAMENTO RECEBIDO EM TEMPO REAL */}
      {activeAlert && activeAlert.booking && (
        <div className="mobile-overlay" style={{ zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="mobile-popup-modal" style={{ maxWidth: '340px', width: '90%', animation: 'scaleUp 0.3s ease', border: '2px solid #8c5027', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.2)' }}>
            <div style={{ padding: '24px 20px', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(140,80,39,0.1)', color: '#8c5027', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                <Sparkles size={28} />
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 'bold', color: '#1a202c' }}>
                {activeAlert.title}
              </h3>
              <p style={{ margin: '0 0 20px 0', fontSize: '0.875rem', color: '#4a5568', lineHeight: 1.5 }}>
                {activeAlert.message}
              </p>
              
              <div style={{ background: '#fcfcf9', border: '1px solid #ede8db', borderRadius: '8px', padding: '12px', marginBottom: '24px', textAlign: 'left' }}>
                <div style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Cliente</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#1a202c', marginBottom: '8px' }}>{activeAlert.booking.clientName}</div>
                
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Data</div>
                    <div style={{ fontSize: '0.85rem', color: '#2d3748' }}>{activeAlert.booking.date ? activeAlert.booking.date.split('-').reverse().join('/') : ''}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Horário</div>
                    <div style={{ fontSize: '0.85rem', color: '#2d3748' }}>{activeAlert.booking.time}</div>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button 
                  type="button" 
                  style={{
                    background: '#8c5027',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(140,80,39,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                  }}
                  onClick={async () => {
                    await confirmBooking(activeAlert.booking.id);
                    setActiveAlert(null);
                  }}
                >
                  <Check size={18} /> Aceitar Agendamento
                </button>
                <button 
                  type="button" 
                  style={{
                    background: 'transparent',
                    color: '#4a5568',
                    border: '1px solid #cbd5e0',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setSelectedBooking(activeAlert.booking);
                    setActiveAlert(null);
                  }}
                >
                  Ver Detalhes completos
                </button>
                <button 
                  type="button" 
                  style={{
                    background: 'transparent',
                    color: '#a0aec0',
                    border: 'none',
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    marginTop: 4
                  }}
                  onClick={() => setActiveAlert(null)}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMobileApp;
