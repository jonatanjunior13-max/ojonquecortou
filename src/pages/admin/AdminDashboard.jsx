import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, onSnapshot, query, addDoc, updateDoc, doc } from 'firebase/firestore';
import { ChevronLeft, ChevronRight, Plus, X, Trash2, Lock, Unlock, Send, Sparkles } from 'lucide-react';
import './Admin.css';

// Lista de horários padrão
const TIME_SLOTS = ['09:00', '10:30', '13:00', '14:30', '16:00', '17:30'];

const SEED_SERVICES = [
  { id: 'coloracao-completa', name: 'Coloração Completa', price: 499, priceType: 'A partir de', promoPrice: null, duration: 120 },
  { id: 'combo-corte-tratamento-personalizado', name: 'Combo - Corte com o Jon + Tratamento personalizado', price: 320, priceType: 'Fixo', promoPrice: 230, duration: 60 },
  { id: 'combo-corte-terapia-trp', name: 'Combo Corte com o Jon + Terapia de Reposição Proteica', price: 370, priceType: 'Fixo', promoPrice: 300, duration: 60 },
  { id: 'corte-jon', name: 'Corte com o Jon', price: 190, priceType: 'Fixo', promoPrice: null, duration: 60 },
  { id: 'detox-estimulante', name: 'Detox Estimulante', price: 180, priceType: 'Fixo', promoPrice: null, duration: 60 },
  { id: 'inside-trp', name: 'Inside TRP – Reconstrução Premium', price: 180, priceType: 'Fixo', promoPrice: null, duration: 60 },
  { id: 'lavar-finalizar', name: 'Lavar e Finalizar', price: 100, priceType: 'Fixo', promoPrice: null, duration: 60 },
  { id: 'luzes-morena-iluminada', name: 'Luzes ou Morena Iluminada', price: 699, priceType: 'A partir de', promoPrice: null, duration: 180 }
];

// Mapeia dias da semana
const DAYS_TRANSLATION = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const SEED_TRANSACTIONS = [
  { id: 't1', date: new Date().toISOString().split('T')[0], time: '09:00', clientName: 'Ana Souza', type: 'entrada', paymentMethod: 'Pix', value: 150, description: 'Corte com o Jon' },
  { id: 't2', date: new Date().toISOString().split('T')[0], time: '13:00', clientName: 'Carla Lima', type: 'entrada', paymentMethod: 'Cartão de Crédito', value: 220, description: 'Combo Corte + Tratamento' },
  { id: 't3', date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0], time: '15:30', clientName: 'Bruna Melo', type: 'entrada', paymentMethod: 'Pix', value: 205, description: 'Tratamento Personalizado + 1 Shampoo Curly' }
];

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
  waReminderEnabled: false,
  waReminderGateway: 'zapi',
  zApiInstanceId: '',
  zApiToken: '',
  evolutionApiUrl: '',
  evolutionApiKey: '',
  evolutionInstanceName: '',
  customWebhookUrl: '',
  waReminderTemplate: 'Olá, {cliente}! Passando para lembrar do seu horário amanhã ({data} às {hora}) para o serviço: {servico}. Podemos confirmar? 💇‍♂️✨'
};

const AdminDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  // Checkout / Comanda states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [addedServices, setAddedServices] = useState([]);
  const [addedProducts, setAddedProducts] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [selectedExtraService, setSelectedExtraService] = useState('');
  const [selectedExtraProduct, setSelectedExtraProduct] = useState('');
  const [overrideBasePrice, setOverrideBasePrice] = useState(null);

  // Slot Action and Block States
  const [showSlotActionModal, setShowSlotActionModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [blockMotive, setBlockMotive] = useState('');

  // Edit Booking States
  const [isEditingBooking, setIsEditingBooking] = useState(false);
  const [editBookingForm, setEditBookingForm] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    serviceName: '',
    servicePrice: 0,
    date: '',
    time: '',
    notes: '',
    status: ''
  });

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
    serviceName: '',
    servicePrice: 0,
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    notes: ''
  });

  // Carrega produtos, serviços, clientes (para aniversários), transações e configurações
  useEffect(() => {
    if (!db) {
      const localProd = localStorage.getItem('demo_products');
      if (localProd) setProducts(JSON.parse(localProd));
      
      const localServ = localStorage.getItem('demo_services');
      if (localServ) setServices(JSON.parse(localServ));
      else setServices(SEED_SERVICES);

      const localClients = localStorage.getItem('demo_client_profiles');
      if (localClients) setClients(JSON.parse(localClients));

      const localTx = localStorage.getItem('demo_transactions');
      if (localTx) setTransactions(JSON.parse(localTx));
      else {
        setTransactions(SEED_TRANSACTIONS);
        localStorage.setItem('demo_transactions', JSON.stringify(SEED_TRANSACTIONS));
      }

      const saved = localStorage.getItem('demo_studio_settings');
      setSettings(saved ? JSON.parse(saved) : DEFAULT_SETTINGS);
      
      return;
    }
    
    const unsubProd = onSnapshot(collection(db, 'products'), (snapshot) => {
      const prodList = [];
      snapshot.forEach((doc) => {
        prodList.push({ id: doc.id, ...doc.data() });
      });
      setProducts(prodList);
    });

    const unsubServ = onSnapshot(collection(db, 'services'), (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      if (list.length > 0) {
        setServices(list);
      } else {
        setServices(SEED_SERVICES);
      }
    });

    const unsubClients = onSnapshot(collection(db, 'client_profiles'), (snapshot) => {
      const clientList = [];
      snapshot.forEach((doc) => {
        clientList.push({ phone: doc.id, ...doc.data() });
      });
      setClients(clientList);
    });

    const unsubTx = onSnapshot(collection(db, 'financial_transactions'), (snapshot) => {
      const txList = [];
      snapshot.forEach((doc) => {
        txList.push({ id: doc.id, ...doc.data() });
      });
      setTransactions(txList);
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'studio'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data());
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
    });

    return () => {
      unsubProd();
      unsubServ();
      unsubClients();
      unsubTx();
      unsubSettings();
    };
  }, []);

  useEffect(() => {
    if (services.length > 0 && !newBooking.serviceName) {
      setNewBooking(prev => ({
        ...prev,
        serviceName: services[0].name,
        servicePrice: services[0].promoPrice || services[0].price
      }));
    }
  }, [services]);

  // Escuta agendamentos no Firestore em tempo real
  useEffect(() => {
    let unsubscribe;
    let timedOut = false;

    // Define os agendamentos mockados para fallback
    const getMockBookings = () => {
      const localData = localStorage.getItem('demo_bookings');
      if (localData) return JSON.parse(localData);

      return [
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
      ];
    };

    if (!db) {
      setIsDemoMode(true);
      setBookings(getMockBookings());
      setLoading(false);
      return;
    }

    setLoading(true);

    const timeoutId = setTimeout(() => {
      timedOut = true;
      console.warn('Firestore subscription for bookings timed out. Falling back to Demo Mode.');
      setIsDemoMode(true);
      if (unsubscribe) unsubscribe();
      setBookings(getMockBookings());
      setLoading(false);
    }, 3500);

    try {
      const q = query(collection(db, 'bookings'));
      unsubscribe = onSnapshot(q, (snapshot) => {
        if (timedOut) return;
        clearTimeout(timeoutId);

        const appts = [];
        snapshot.forEach((doc) => {
          appts.push({ id: doc.id, ...doc.data() });
        });
        setBookings(appts);
        setLoading(false);
        setIsDemoMode(false);
      }, (error) => {
        if (timedOut) return;
        clearTimeout(timeoutId);
        console.warn('Firestore real-time error, switching to Demo Mode:', error);
        setIsDemoMode(true);
        setBookings(getMockBookings());
        setLoading(false);
      });
      return () => {
        clearTimeout(timeoutId);
        if (unsubscribe) unsubscribe();
      };
    } catch (err) {
      if (!timedOut) {
        clearTimeout(timeoutId);
        console.warn('Error fetching bookings from Firestore:', err);
        setIsDemoMode(true);
        setBookings(getMockBookings());
        setLoading(false);
      }
    }
  }, [currentWeekStart]);

  const changeWeek = (direction) => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() + (direction * 7));
    setCurrentWeekStart(newStart);
  };

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

  const handleStartEditBooking = () => {
    setEditBookingForm({
      clientName: selectedBooking.clientName || '',
      clientPhone: selectedBooking.clientPhone || '',
      clientEmail: selectedBooking.clientEmail || '',
      serviceName: selectedBooking.serviceName || selectedBooking.service?.name || '',
      servicePrice: selectedBooking.servicePrice || selectedBooking.service?.price || 0,
      date: selectedBooking.date || '',
      time: selectedBooking.time || '',
      notes: selectedBooking.notes || '',
      status: selectedBooking.status || 'confirmado'
    });
    setIsEditingBooking(true);
  };

  const handleSaveEditBooking = async (e) => {
    e.preventDefault();
    const updatedPayload = {
      clientName: editBookingForm.clientName,
      clientPhone: editBookingForm.clientPhone,
      clientEmail: editBookingForm.clientEmail,
      serviceName: editBookingForm.serviceName,
      servicePrice: Number(editBookingForm.servicePrice),
      service: {
        name: editBookingForm.serviceName,
        price: Number(editBookingForm.servicePrice)
      },
      date: editBookingForm.date,
      time: editBookingForm.time,
      notes: editBookingForm.notes,
      status: editBookingForm.status
    };

    try {
      if (isDemoMode || !db) {
        setBookings(prev => prev.map(b => b.id === selectedBooking.id ? { ...b, ...updatedPayload } : b));
        setSelectedBooking(prev => ({ ...prev, ...updatedPayload }));
        
        // Salva backup local
        const localData = localStorage.getItem('demo_bookings');
        if (localData) {
          const arr = JSON.parse(localData);
          const newArr = arr.map(b => (b.id === selectedBooking.id || (b.date === selectedBooking.date && b.time === selectedBooking.time && b.clientPhone === selectedBooking.clientPhone)) ? { ...b, ...updatedPayload } : b);
          localStorage.setItem('demo_bookings', JSON.stringify(newArr));
        }
      } else {
        const docRef = doc(db, 'bookings', selectedBooking.id);
        await updateDoc(docRef, updatedPayload);
        setSelectedBooking(prev => ({ ...prev, ...updatedPayload }));
      }
      setIsEditingBooking(false);
      alert('Agendamento atualizado com sucesso!');
    } catch (err) {
      console.error('Erro ao editar agendamento:', err);
      alert('Não foi possível salvar as alterações do agendamento.');
    }
  };

  // Criar agendamento manual
  const handleAddManualBooking = async (e) => {
    e.preventDefault();
    const activeServName = newBooking.serviceName || (services[0]?.name || 'Corte com o Jon');
    const activeServPrice = newBooking.servicePrice || (services[0]?.promoPrice || services[0]?.price || 150);

    const payload = {
      clientName: newBooking.clientName,
      clientPhone: newBooking.clientPhone,
      clientEmail: newBooking.clientEmail,
      service: {
        name: activeServName,
        price: activeServPrice
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
        serviceName: services[0]?.name || '',
        servicePrice: services[0]?.promoPrice || services[0]?.price || 0,
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        notes: ''
      });
    } catch (err) {
      console.error('Erro ao criar agendamento manual:', err);
      alert('Falha ao registrar agendamento manual.');
    }
  };

  // Abrir opções para o horário clicado
  const handleCellClick = (day, slot) => {
    setSelectedSlot({
      date: day.raw,
      time: slot,
      dateFormatted: `${day.formattedDay}/${day.raw.split('-')[1]} (${day.formattedWeekday})`
    });
    setShowSlotActionModal(true);
  };

  // Selecionar agendamento manual a partir do horário
  const handleSelectManualBooking = () => {
    setNewBooking({
      clientName: '',
      clientPhone: '',
      clientEmail: '',
      serviceName: services[0]?.name || '',
      servicePrice: services[0]?.promoPrice || services[0]?.price || 0,
      date: selectedSlot.date,
      time: selectedSlot.time,
      notes: ''
    });
    setShowSlotActionModal(false);
    setShowAddModal(true);
  };

  // Bloquear horário
  const handleBlockSlotSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return;

    const payload = {
      clientName: 'Horário Bloqueado',
      clientPhone: '00000000000',
      clientEmail: '',
      service: {
        name: 'Bloqueio Administrativo',
        price: 0
      },
      date: selectedSlot.date,
      time: selectedSlot.time,
      notes: blockMotive || 'Bloqueio administrativo',
      status: 'bloqueado',
      createdAt: new Date().toISOString()
    };

    try {
      if (isDemoMode) {
        setBookings(prev => [...prev, { id: 'demo-block-' + Date.now(), ...payload }]);
      } else {
        await addDoc(collection(db, 'bookings'), payload);
      }
      setShowSlotActionModal(false);
      setBlockMotive('');
      setSelectedSlot(null);
    } catch (err) {
      console.error('Erro ao bloquear horário:', err);
      alert('Não foi possível bloquear o horário.');
    }
  };

  // Funções Auxiliares da Comanda
  const addExtraService = () => {
    if (!selectedExtraService) return;
    const [name, priceStr] = selectedExtraService.split('|');
    setAddedServices(prev => [...prev, { name, price: Number(priceStr) }]);
    setSelectedExtraService('');
  };

  const removeService = (index) => {
    setAddedServices(prev => prev.filter((_, idx) => idx !== index));
  };

  const addExtraProduct = () => {
    if (!selectedExtraProduct) return;
    const [productId, name, priceStr] = selectedExtraProduct.split('|');
    
    // Verifica se já adicionou
    const existing = addedProducts.find(ap => ap.productId === productId);
    if (existing) {
      setAddedProducts(prev => prev.map(ap => 
        ap.productId === productId ? { ...ap, quantity: ap.quantity + 1 } : ap
      ));
    } else {
      setAddedProducts(prev => [...prev, { productId, name, price: Number(priceStr), quantity: 1 }]);
    }
    setSelectedExtraProduct('');
  };

  const removeProduct = (index) => {
    setAddedProducts(prev => prev.filter((_, idx) => idx !== index));
  };

  const calculateTotal = () => {
    const base = overrideBasePrice !== null ? overrideBasePrice : (selectedBooking?.service?.price || selectedBooking?.servicePrice || 150);
    const extras = addedServices.reduce((sum, item) => sum + item.price, 0);
    const prods = addedProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return base + extras + prods;
  };

  const handleCloseComanda = async (booking) => {
    const baseServicePrice = overrideBasePrice !== null ? overrideBasePrice : (booking.service?.price || booking.servicePrice || 150);
    const extraServicesTotal = addedServices.reduce((sum, item) => sum + item.price, 0);
    const productsTotal = addedProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalComanda = baseServicePrice + extraServicesTotal + productsTotal;

    const itemsDescription = [
      booking.service?.name || booking.serviceName || 'Serviço Base',
      ...addedServices.map(s => s.name),
      ...addedProducts.map(p => `${p.quantity}x ${p.name}`)
    ].join(', ');

    const transactionPayload = {
      date: booking.date || new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      clientName: booking.clientName,
      clientPhone: booking.clientPhone || '',
      type: 'entrada',
      paymentMethod,
      value: totalComanda,
      description: itemsDescription,
      createdAt: new Date().toISOString()
    };

    try {
      if (isDemoMode || !db) {
        // 1. Atualiza agendamento no estado local
        setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: 'finalizado' } : b));

        // 2. Deduz estoque local
        const localProducts = localStorage.getItem('demo_products');
        if (localProducts) {
          const prods = JSON.parse(localProducts);
          const updatedProds = prods.map(p => {
            const added = addedProducts.find(ap => ap.productId === p.id);
            if (added) {
              return { ...p, quantity: Math.max(0, p.quantity - added.quantity) };
            }
            return p;
          });
          localStorage.setItem('demo_products', JSON.stringify(updatedProds));
          setProducts(updatedProds);
        }

        // 3. Salva transação no localStorage
        const localTx = localStorage.getItem('demo_transactions');
        const currentTx = localTx ? JSON.parse(localTx) : SEED_TRANSACTIONS;
        const newTx = { id: 'tx_' + Date.now(), ...transactionPayload };
        const updatedTxList = [...currentTx, newTx];
        localStorage.setItem('demo_transactions', JSON.stringify(updatedTxList));
        setTransactions(updatedTxList);
      } else {
        // 1. Atualizar agendamento no Firestore
        const apptRef = doc(db, 'bookings', booking.id);
        await updateDoc(apptRef, { status: 'finalizado' });

        // 2. Deduzir estoque no Firestore
        for (const added of addedProducts) {
          const prodRef = doc(db, 'products', added.productId);
          const match = products.find(p => p.id === added.productId);
          if (match) {
            const newQty = Math.max(0, match.quantity - added.quantity);
            await updateDoc(prodRef, { quantity: newQty });
          }
        }

        // 3. Salvar transação no Firestore
        await addDoc(collection(db, 'financial_transactions'), transactionPayload);
      }

      alert('Comanda fechada com sucesso! Estoque deduzido e receita registrada.');
      setSelectedBooking(null);
      setIsCheckoutOpen(false);
      setOverrideBasePrice(null);
      setAddedServices([]);
      setAddedProducts([]);
    } catch (err) {
      console.error('Erro ao fechar comanda:', err);
      alert('Falha ao concluir o fechamento da comanda.');
    }
  };

  // Métricas do Dashboard
  const activeBookings = bookings.filter(b => b.status !== 'cancelado');
  const pendingCount = bookings.filter(b => b.status === 'pendente').length;
  
  // Receita semanal calculada a partir de transações locais ou do Firestore
  const [revenueThisWeek, setRevenueThisWeek] = useState(0);

  useEffect(() => {
    // Calcula com base nas comandas/transações da semana
    const startStr = weekDays[0]?.raw;
    const endStr = weekDays[4]?.raw;
    if (!startStr || !endStr) return;

    const weekEntradas = transactions
      .filter(t => t.type === 'entrada' && t.date >= startStr && t.date <= endStr)
      .reduce((sum, t) => sum + t.value, 0);
    setRevenueThisWeek(weekEntradas);
  }, [transactions, weekDays]);

  // Automação de lembrete de WhatsApp 24h antes
  useEffect(() => {
    if (!settings || !settings.waReminderEnabled) return;
    if (bookings.length === 0) return;

    // Calcula a data de amanhã (YYYY-MM-DD)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Filtra agendamentos de amanhã que ainda não receberam lembrete
    const remindersToSend = bookings.filter(b => {
      return b.date === tomorrowStr && 
             b.status !== 'cancelado' && 
             !b.reminderSent;
    });

    if (remindersToSend.length === 0) return;

    const sendReminder = async (booking) => {
      // Trava otimista: define reminderSent como 'enviando' para evitar duplo disparo
      if (db) {
        try {
          const apptRef = doc(db, 'bookings', booking.id);
          await updateDoc(apptRef, { reminderSent: 'enviando' });
        } catch (e) {
          return;
        }
      } else {
        booking.reminderSent = 'enviando';
      }

      // Constrói a mensagem formatada
      const rawTemplate = settings.waReminderTemplate || 'Olá, {cliente}! Passando para lembrar do seu horário amanhã ({data} às {hora}) para o serviço: {servico}. Podemos confirmar?';
      
      const [year, month, day] = booking.date.split('-');
      const dateObj = new Date(year, month - 1, day);
      const weekdayStr = dateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

      const msgText = rawTemplate
        .replace('{cliente}', booking.clientName)
        .replace('{data}', weekdayStr)
        .replace('{hora}', booking.time)
        .replace('{servico}', booking.serviceName || booking.service?.name || 'Serviço');

      const cleanPhone = (booking.clientPhone || '').replace(/\D/g, '');
      if (!cleanPhone || cleanPhone.length < 10) {
        if (db) {
          await updateDoc(doc(db, 'bookings', booking.id), { reminderSent: 'erro_telefone' });
        }
        return;
      }

      const phoneWithDDI = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

      let url = '';
      let headers = { 'Content-Type': 'application/json' };
      let body = {};

      if (settings.waReminderGateway === 'zapi') {
        const instance = settings.zApiInstanceId;
        const token = settings.zApiToken;
        if (!instance || !token) return;
        url = `https://api.z-api.io/instances/${instance}/token/${token}/send-text`;
        body = {
          phone: phoneWithDDI,
          message: msgText
        };
      } else if (settings.waReminderGateway === 'evolution') {
        const apiUrl = settings.evolutionApiUrl;
        const apiKey = settings.evolutionApiKey;
        const instance = settings.evolutionInstanceName;
        if (!apiUrl || !apiKey || !instance) return;
        url = `${apiUrl.replace(/\/$/, '')}/message/sendText/${instance}`;
        headers['apikey'] = apiKey;
        body = {
          number: phoneWithDDI,
          text: msgText
        };
      } else if (settings.waReminderGateway === 'custom') {
        url = settings.customWebhookUrl;
        if (!url) return;
        body = {
          phone: phoneWithDDI,
          message: msgText,
          bookingId: booking.id,
          clientName: booking.clientName,
          date: booking.date,
          time: booking.time,
          service: booking.serviceName || booking.service?.name
        };
      }

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body)
        });

        if (response.ok) {
          if (db) {
            await updateDoc(doc(db, 'bookings', booking.id), { 
              reminderSent: true, 
              reminderSentAt: new Date().toISOString() 
            });
          } else {
            booking.reminderSent = true;
            booking.reminderSentAt = new Date().toISOString();
            localStorage.setItem('demo_bookings', JSON.stringify(bookings));
          }
          console.log(`Lembrete automático WhatsApp enviado para ${booking.clientName}`);
        } else {
          throw new Error('Erro na resposta do gateway');
        }
      } catch (err) {
        console.error(`Erro ao disparar WhatsApp automático para ${booking.clientName}:`, err);
        if (db) {
          await updateDoc(doc(db, 'bookings', booking.id), { reminderSent: false });
        } else {
          booking.reminderSent = false;
        }
      }
    };

    // Dispara sequencialmente
    remindersToSend.forEach(booking => {
      sendReminder(booking);
    });

  }, [bookings, settings, db]);

  // Lógica de envio de mensagem de aniversariante por WhatsApp
  const handleWhatsAppCongratulate = (client) => {
    const cleanPhone = client.phone.replace(/\D/g, '');
    const message = `Olá, ${client.name}! O Studio do Jon passando aqui para te desejar um feliz aniversário! Que seu dia seja maravilhoso e repleto de sorrisos. Para comemorar, temos um mimo especial pra você na sua próxima visita! 🎂🎉`;
    const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Filtra os aniversariantes do mês atual
  const birthdayClients = (() => {
    const currentMonth = new Date().getMonth() + 1; // 1 a 12
    return clients.filter(c => {
      if (!c.aniversario) return false;
      const parts = c.aniversario.split('-');
      if (parts.length < 2) return false;
      const birthMonth = parseInt(parts[1], 10);
      return birthMonth === currentMonth;
    }).sort((a, b) => {
      const dayA = parseInt(a.aniversario.split('-')[2], 10);
      const dayB = parseInt(b.aniversario.split('-')[2], 10);
      return dayA - dayB;
    });
  })();

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
          <h3>Receita Consolidada (Semana)</h3>
          <div className="value" style={{ color: '#48bb78' }}>R$ {revenueThisWeek}</div>
        </div>
      </section>

      {/* Bloco de Aniversariantes do Mês */}
      {birthdayClients.length > 0 && (
        <section className="dashboard-birthdays-panel">
          <div className="birthdays-panel-header">
            <div className="panel-title-group">
              <Sparkles size={18} className="birthday-decor-icon" />
              <h3>Aniversariantes de {new Date().toLocaleDateString('pt-BR', { month: 'long' })}</h3>
              <span className="birthday-count-tag">{birthdayClients.length}</span>
            </div>
            <p className="panel-subtitle">Envie uma mensagem carinhosa pelo WhatsApp com apenas um clique!</p>
          </div>
          
          <div className="birthdays-carousel-row">
            {birthdayClients.map(c => {
              const day = c.aniversario.split('-')[2];
              const initials = c.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
              
              return (
                <div key={c.phone} className="birthday-member-card">
                  <div className="member-avatar-badge">
                    {initials}
                    <span className="balloon-emoji">🎂</span>
                  </div>
                  <div className="member-details">
                    <strong className="member-name">{c.name}</strong>
                    <span className="member-date">Dia {day}</span>
                  </div>
                  <button 
                    onClick={() => handleWhatsAppCongratulate(c)}
                    className="btn-birthday-action"
                    title={`Enviar parabéns para ${c.name}`}
                  >
                    <Send size={12} /> Parabenizar
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

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
                  // Procura agendamento ativo primeiro, senão procura cancelado
                  const appt = bookings.find(b => b.date === day.raw && b.time === slot && b.status !== 'cancelado') ||
                               bookings.find(b => b.date === day.raw && b.time === slot && b.status === 'cancelado');
                  return (
                    <div 
                      key={day.raw} 
                      className="day-cell"
                      style={{ cursor: (!appt || appt.status === 'cancelado') ? 'pointer' : 'default' }}
                      onClick={() => {
                        if (!appt || appt.status === 'cancelado') {
                          handleCellClick(day, slot);
                        }
                      }}
                    >
                      {appt && appt.status === 'bloqueado' && (
                        <div 
                          className="appt-card bloqueado"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBooking(appt);
                            setIsCheckoutOpen(false);
                            setAddedServices([]);
                            setAddedProducts([]);
                          }}
                        >
                          <span className="appt-time">{appt.time}</span>
                          <span className="appt-client" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Lock size={12} /> Bloqueado
                          </span>
                          <span className="appt-service" style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', display: 'block', maxWidth: '100%' }}>
                            {appt.notes}
                          </span>
                        </div>
                      )}
                      {appt && appt.status !== 'bloqueado' && (
                        <div 
                          className={`appt-card ${appt.status}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBooking(appt);
                            setIsCheckoutOpen(false);
                            setAddedServices([]);
                            setAddedProducts([]);
                          }}
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

      {/* MODAL 1: DETALHE DO AGENDAMENTO E COMANDA */}
      {selectedBooking && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: isCheckoutOpen ? 640 : 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3>{isCheckoutOpen ? 'Fechar Comanda da Cliente' : (isEditingBooking ? 'Editar Agendamento' : 'Ficha do Agendamento')}</h3>
              <button className="btn-icon" onClick={() => {
                setSelectedBooking(null);
                setIsCheckoutOpen(false);
                setOverrideBasePrice(null);
                setIsEditingBooking(false);
              }}><X size={18} /></button>
            </div>
            
            {!isCheckoutOpen ? (
              isEditingBooking ? (
                <form onSubmit={handleSaveEditBooking} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="form-group">
                    <label>Nome Completo do Cliente *</label>
                    <input 
                      type="text" 
                      required 
                      value={editBookingForm.clientName}
                      onChange={e => setEditBookingForm(prev => ({ ...prev, clientName: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>WhatsApp *</label>
                    <input 
                      type="tel" 
                      required 
                      value={editBookingForm.clientPhone}
                      onChange={e => setEditBookingForm(prev => ({ ...prev, clientPhone: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>E-mail (Opcional)</label>
                    <input 
                      type="email" 
                      value={editBookingForm.clientEmail}
                      onChange={e => setEditBookingForm(prev => ({ ...prev, clientEmail: e.target.value }))}
                    />
                  </div>
                  
                  <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                    <div className="form-group">
                      <label>Serviço *</label>
                      <select 
                        value={`${editBookingForm.serviceName}|${editBookingForm.servicePrice}`}
                        onChange={e => {
                          const [name, priceStr] = e.target.value.split('|');
                          setEditBookingForm(prev => ({ ...prev, serviceName: name, servicePrice: Number(priceStr) }));
                        }}
                      >
                        {services.map(s => (
                          <option key={s.id} value={`${s.name}|${s.promoPrice || s.price}`}>
                            {s.name} ({s.promoPrice ? `Promo: R$ ${s.promoPrice}` : `R$ ${s.price}`})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Preço (R$) *</label>
                      <input 
                        type="number" 
                        required 
                        min="0"
                        step="0.01"
                        value={editBookingForm.servicePrice}
                        onChange={e => setEditBookingForm(prev => ({ ...prev, servicePrice: Number(e.target.value) }))}
                      />
                    </div>
                  </div>

                  <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group">
                      <label>Data *</label>
                      <input 
                        type="date" 
                        required
                        value={editBookingForm.date}
                        onChange={e => setEditBookingForm(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Horário *</label>
                      <select 
                        value={editBookingForm.time}
                        onChange={e => setEditBookingForm(prev => ({ ...prev, time: e.target.value }))}
                      >
                        {TIME_SLOTS.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group">
                      <label>Status *</label>
                      <select 
                        value={editBookingForm.status}
                        onChange={e => setEditBookingForm(prev => ({ ...prev, status: e.target.value }))}
                      >
                        <option value="pendente">Aguardando Confirmação (Pendente)</option>
                        <option value="confirmado">Confirmado</option>
                        <option value="cancelado">Cancelado</option>
                        <option value="finalizado">Finalizado</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Notas Internas</label>
                    <textarea 
                      rows="2"
                      value={editBookingForm.notes}
                      onChange={e => setEditBookingForm(prev => ({ ...prev, notes: e.target.value }))}
                    ></textarea>
                  </div>

                  <div className="modal-actions" style={{ justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                    <button type="button" className="btn btn-ghost" onClick={() => setIsEditingBooking(false)}>Cancelar</button>
                    <button type="submit" className="btn btn-accent">Salvar Alterações</button>
                  </div>
                </form>
              ) : selectedBooking.status === 'bloqueado' ? (
                <>
                  <div className="detail-row">
                    <label>Tipo:</label>
                    <span style={{ fontWeight: 'bold', color: 'var(--muted)' }}>Horário Bloqueado (Indisponível)</span>
                  </div>
                  <div className="detail-row">
                    <label>Data/Hora:</label>
                    <span>{selectedBooking.date} às {selectedBooking.time}</span>
                  </div>
                  <div className="detail-row">
                    <label>Motivo:</label>
                    <span>{selectedBooking.notes || 'Sem observações'}</span>
                  </div>
                  
                  <div className="modal-actions" style={{ justifyContent: 'flex-end' }}>
                    <button 
                      className="btn btn-ghost" 
                      style={{ padding: '6px 12px', fontSize: '0.85rem', borderColor: '#e53e3e', color: '#e53e3e' }}
                      onClick={() => handleUpdateStatus(selectedBooking.id, 'cancelado')}
                    >
                      Desbloquear Horário (Liberar)
                    </button>
                  </div>
                </>
              ) : (
                <>
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
                    <span>{selectedBooking.clientEmail || 'Não informado'}</span>
                  </div>
                  <div className="detail-row">
                    <label>Serviço:</label>
                    <span>{selectedBooking.service?.name || selectedBooking.serviceName}</span>
                  </div>
                  <div className="detail-row">
                    <label>Preço:</label>
                    <span>R$ {selectedBooking.servicePrice || selectedBooking.service?.price || 150}</span>
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

                  <div className="modal-actions" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {selectedBooking.status === 'pendente' && (
                        <button className="btn btn-accent" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => handleUpdateStatus(selectedBooking.id, 'confirmado')}>
                          Confirmar Horário
                        </button>
                      )}
                      {selectedBooking.status === 'confirmado' && (
                        <button className="btn btn-accent" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => {
                          setOverrideBasePrice(selectedBooking.servicePrice || selectedBooking.service?.price || 150);
                          setIsCheckoutOpen(true);
                        }}>
                          Fechar Comanda / Pagar
                        </button>
                      )}
                      {selectedBooking.status === 'cancelado' && (
                        <button 
                          className="btn btn-accent" 
                          style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                          onClick={() => {
                            const matchingDayObj = weekDays.find(d => d.raw === selectedBooking.date) || { formattedDay: selectedBooking.date, formattedWeekday: '' };
                            setSelectedSlot({
                              date: selectedBooking.date,
                              time: selectedBooking.time,
                              dateFormatted: `${matchingDayObj.formattedDay} ${matchingDayObj.formattedWeekday}`
                            });
                            setSelectedBooking(null);
                            handleSelectManualBooking();
                          }}
                        >
                          Agendar Neste Horário
                        </button>
                      )}
                      <button className="btn btn-ghost" type="button" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={handleStartEditBooking}>
                        Editar Agendamento
                      </button>
                    </div>
                    
                    {selectedBooking.status !== 'cancelado' && (
                      <button 
                        className="btn btn-ghost" 
                        style={{ padding: '6px 12px', fontSize: '0.85rem', borderColor: '#e53e3e', color: '#e53e3e' }}
                        onClick={() => handleUpdateStatus(selectedBooking.id, 'cancelado')}
                      >
                        Cancelar Horário
                      </button>
                    )}
                  </div>
                </>
              )
            ) : (
              <div className="checkout-section">
                <p style={{ fontSize: '0.9rem', marginBottom: 12, color: 'var(--muted)' }}>
                  Gere o faturamento da cliente <strong>{selectedBooking.clientName}</strong>. Adicione itens se necessário.
                </p>
                
                {/* Lista de Itens atuais na comanda */}
                <div className="comanda-items-list">
                  <div className="comanda-item-row" style={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{selectedBooking.service?.name || selectedBooking.serviceName} (Serviço Agendado)</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>R$</span>
                      <input 
                        type="number"
                        style={{ width: '85px', padding: '3px 6px', fontSize: '0.85rem', border: '1px solid var(--rule)', borderRadius: '4px', textAlign: 'right', background: 'var(--bg-warm)', color: 'var(--ink)' }}
                        value={overrideBasePrice !== null ? overrideBasePrice : (selectedBooking.service?.price || 150)}
                        onChange={e => setOverrideBasePrice(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  
                  {addedServices.map((s, idx) => (
                    <div key={'s-' + idx} className="comanda-item-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{s.name} (Serviço Extra)</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>R$</span>
                        <input 
                          type="number"
                          style={{ width: '85px', padding: '3px 6px', fontSize: '0.85rem', border: '1px solid var(--rule)', borderRadius: '4px', textAlign: 'right', background: 'var(--bg-warm)', color: 'var(--ink)' }}
                          value={s.price}
                          onChange={e => {
                            const newPrice = Number(e.target.value);
                            setAddedServices(prev => prev.map((item, i) => i === idx ? { ...item, price: newPrice } : item));
                          }}
                        />
                        <button type="button" className="btn-remove" onClick={() => removeService(idx)}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {addedProducts.map((p, idx) => (
                    <div key={'p-' + idx} className="comanda-item-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{p.quantity}x {p.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Unit: R$</span>
                        <input 
                          type="number"
                          style={{ width: '75px', padding: '3px 6px', fontSize: '0.85rem', border: '1px solid var(--rule)', borderRadius: '4px', textAlign: 'right', background: 'var(--bg-warm)', color: 'var(--ink)' }}
                          value={p.price}
                          onChange={e => {
                            const newPrice = Number(e.target.value);
                            setAddedProducts(prev => prev.map((item, i) => i === idx ? { ...item, price: newPrice } : item));
                          }}
                        />
                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>= R$ {p.price * p.quantity}</span>
                        <button type="button" className="btn-remove" onClick={() => removeProduct(idx)}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="comanda-total-row">
                    <span>Total a Receber</span>
                    <span>R$ {calculateTotal()}</span>
                  </div>
                </div>

                {/* Formulário de acréscimo rápido */}
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.8rem' }}>Lançar Serviço Extra</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <select 
                        value={selectedExtraService} 
                        onChange={e => setSelectedExtraService(e.target.value)}
                        style={{ padding: '6px', fontSize: '0.8rem', flexGrow: 1 }}
                      >
                        <option value="">-- Selecione --</option>
                        {services.map(s => (
                          <option key={s.id} value={`${s.name}|${s.promoPrice || s.price}`}>
                            {s.name} (R$ {s.promoPrice || s.price})
                          </option>
                        ))}
                      </select>
                      <button type="button" className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '0.9rem' }} onClick={addExtraService}>+</button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.8rem' }}>Lançar Produto</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <select 
                        value={selectedExtraProduct} 
                        onChange={e => setSelectedExtraProduct(e.target.value)}
                        style={{ padding: '6px', fontSize: '0.8rem', flexGrow: 1 }}
                      >
                        <option value="">-- Selecione --</option>
                        {products.map(p => (
                          <option key={p.id} value={`${p.id}|${p.name}|${p.sellingPrice}`} disabled={p.quantity <= 0}>
                            {p.name} (R$ {p.sellingPrice}) {p.quantity <= 0 ? '[Sem Estoque]' : `[Qtd: ${p.quantity}]`}
                          </option>
                        ))}
                      </select>
                      <button type="button" className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '0.9rem' }} onClick={addExtraProduct}>+</button>
                    </div>
                  </div>
                </div>

                {/* Forma de Pagamento */}
                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label>Forma de Pagamento *</label>
                  <select 
                    value={paymentMethod} 
                    onChange={e => setPaymentMethod(e.target.value)}
                    style={{ padding: '8px', width: '100%' }}
                  >
                    <option value="Pix">Pix</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Dinheiro">Dinheiro</option>
                  </select>
                </div>

                <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => { setIsCheckoutOpen(false); setOverrideBasePrice(null); }}>Voltar</button>
                  <button type="button" className="btn btn-accent" onClick={() => handleCloseComanda(selectedBooking)}>Finalizar e Baixar Estoque</button>
                </div>
              </div>
            )}
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

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Serviço *</label>
                <select 
                  value={`${newBooking.serviceName}|${newBooking.servicePrice}`}
                  onChange={e => {
                    const [name, priceStr] = e.target.value.split('|');
                    setNewBooking(prev => ({ ...prev, serviceName: name, servicePrice: Number(priceStr) }));
                  }}
                >
                  {services.map(s => (
                    <option key={s.id} value={`${s.name}|${s.promoPrice || s.price}`}>
                      {s.name} ({s.promoPrice ? `Promo: R$ ${s.promoPrice}` : `R$ ${s.price}`})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Valor (R$) *</label>
                <input 
                  type="number" 
                  required 
                  min="0"
                  step="0.01"
                  value={newBooking.servicePrice}
                  onChange={e => setNewBooking(prev => ({ ...prev, servicePrice: Number(e.target.value) }))}
                />
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

      {/* MODAL: AÇÕES DO HORÁRIO LIVRE (AGENDAR OU BLOQUEAR) */}
      {showSlotActionModal && selectedSlot && (
        <div className="modal-overlay slot-action-overlay">
          <div className="slot-action-modal">

            {/* Header */}
            <div className="slot-action-header">
              <div className="slot-action-pill">
                <span className="slot-action-pill-dot" />
                Horário Livre
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => { setShowSlotActionModal(false); setBlockMotive(''); setSelectedSlot(null); }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="slot-action-datetime">
              <span className="slot-action-date">{selectedSlot.dateFormatted}</span>
              <span className="slot-action-time">{selectedSlot.time}</span>
            </div>

            <p className="slot-action-label">O que deseja fazer neste horário?</p>

            {/* Action Cards */}
            <div className="slot-action-cards">

              {/* Card Agendar */}
              <button
                type="button"
                className="slot-card slot-card-schedule"
                onClick={handleSelectManualBooking}
              >
                <div className="slot-card-icon">
                  <Plus size={24} />
                </div>
                <div className="slot-card-text">
                  <strong>Agendar Cliente</strong>
                  <span>Abrir formulário de agendamento manual pré-preenchido com este horário</span>
                </div>
              </button>

              {/* Card Bloquear */}
              <div className="slot-card slot-card-block">
                <div className="slot-card-block-row">
                  <div className="slot-card-icon">
                    <Lock size={24} />
                  </div>
                  <div className="slot-card-text">
                    <strong>Bloquear Horário</strong>
                    <span>Marque como indisponível para novas reservas (almoço, folga, curso...)</span>
                  </div>
                </div>
                <form
                  onSubmit={handleBlockSlotSubmit}
                  className="slot-block-form"
                  onClick={e => e.stopPropagation()}
                >
                  <input
                    type="text"
                    placeholder="Motivo (ex: Almoço, Folga, Reunião)..."
                    value={blockMotive}
                    onChange={e => setBlockMotive(e.target.value)}
                    className="slot-block-input"
                  />
                  <button type="submit" className="slot-block-btn">
                    <Lock size={13} /> Confirmar Bloqueio
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
