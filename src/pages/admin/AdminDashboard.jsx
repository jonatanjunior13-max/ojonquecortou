import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, onSnapshot, query, addDoc, updateDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { useOutletContext } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  X, 
  Trash2, 
  Lock, 
  Unlock, 
  Send, 
  Sparkles,
  Calendar,
  User,
  Clock,
  Phone,
  DollarSign,
  RefreshCw,
  FileText,
  CheckCircle,
  HelpCircle,
  MessageSquare,
  Copy,
  Scissors,
  Clipboard,
  Edit
} from 'lucide-react';
import './Admin.css';

// Lista de horários padrão
const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

const SEED_SERVICES = [
  { id: 'coloracao-completa', name: "Colora\u00e7\u00e3o Completa", price: 499, priceType: 'A partir de', promoPrice: null, duration: 120 },
  { id: 'combo-corte-tratamento-personalizado', name: 'Combo - Corte com o Jon + Tratamento personalizado', price: 320, priceType: 'Fixo', promoPrice: 230, duration: 60 },
  { id: 'combo-corte-terapia-trp', name: "Combo Corte com o Jon + Terapia de Reposi\u00e7\u00e3o Proteica", price: 370, priceType: 'Fixo', promoPrice: 300, duration: 60 },
  { id: 'corte-jon', name: 'Corte com o Jon', price: 190, priceType: 'Fixo', promoPrice: null, duration: 60 },
  { id: 'detox-estimulante', name: 'Detox Estimulante', price: 180, priceType: 'Fixo', promoPrice: null, duration: 60 },
  { id: 'inside-trp', name: "Inside TRP - Reconstru\u00e7\u00e3o Premium", price: 180, priceType: 'Fixo', promoPrice: null, duration: 60 },
  { id: 'lavar-finalizar', name: 'Lavar e Finalizar', price: 100, priceType: 'Fixo', promoPrice: null, duration: 60 },
  { id: 'luzes-morena-iluminada', name: 'Luzes ou Morena Iluminada', price: 699, priceType: 'A partir de', promoPrice: null, duration: 180 }
];

// Mapeia dias da semana
const DAYS_TRANSLATION = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

// Clientes seed para autocomplete em modo demo (quando não há dados no Firestore)
const SEED_CLIENTS = [
  { phone: '31988887777', name: 'Ana Souza', email: 'ana@email.com', cpf: '123.456.789-00', tags: ['Frequente', 'Cachos 3C'] },
  { phone: '31977776666', name: 'Carla Lima', email: 'carla@email.com', cpf: '234.567.890-11', tags: ['Novo Cliente'] },
  { phone: '31900001111', name: 'Mariana Costa', email: 'mariana@email.com', cpf: '345.678.901-22', tags: ['Frequente'] },
  { phone: '31911112222', name: 'Bruno Silva', email: 'bruno@email.com', cpf: '456.789.012-33', tags: ['Cabelo Curto'] }
];

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
  waReminderEnabled: true,
  waReminderGateway: 'evolution',
  zApiInstanceId: '',
  zApiToken: '',
  evolutionApiUrl: 'https://evolution-api-production-1e65.up.railway.app',
  evolutionApiKey: 'de173acec677c6da63cf021049ffa7c6c120a82c765b7e540d585a9ea9ced356',
  evolutionInstanceName: 'JonStudio',
  customWebhookUrl: '',
  waReminderTemplate: 'Ol\u00e1, {cliente}! Passando para lembrar do seu hor\u00e1rio amanh\u00e3 ({data} \u00e0s {hora}) para o servi\u00e7o: {servico}. Podemos confirmar? \uD83D\uDC87\u200D\u2642\uFE0F\u2728',
  professionals: [
    { id: 'jon', name: 'Jon', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80', commission: 50, phone: '31995097613', email: 'jon@studio.com', active: true }
  ]
};

const AdminDashboard = () => {
  const { globalData, setGlobalData } = useOutletContext();
  const bookings = globalData.bookings || [];
  const products = globalData.products || [];
  const services = globalData.services || [];
  const clients = globalData.clients || [];
  const transactions = globalData.financial_transactions || [];
  const settings = globalData.settings || DEFAULT_SETTINGS;
  const setBookings = (updater) => setGlobalData(prev => ({ ...prev, bookings: typeof updater === 'function' ? updater(prev.bookings) : updater }));
  const setProducts = (updater) => setGlobalData(prev => ({ ...prev, products: typeof updater === 'function' ? updater(prev.products) : updater }));
  const setServices = (updater) => setGlobalData(prev => ({ ...prev, services: typeof updater === 'function' ? updater(prev.services) : updater }));
  const setClients = (updater) => setGlobalData(prev => ({ ...prev, clients: typeof updater === 'function' ? updater(prev.clients) : updater }));
  const setTransactions = (updater) => setGlobalData(prev => ({ ...prev, financial_transactions: typeof updater === 'function' ? updater(prev.financial_transactions) : updater }));
  const setSettings = (updater) => setGlobalData(prev => ({ ...prev, settings: typeof updater === 'function' ? updater(prev.settings) : updater }));
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(!db);
  
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
    cpf: '',
    tags: [],
    serviceName: '',
    servicePrice: 0,
    duration: 60,
    date: '',
    time: '',
    notes: '',
    status: '',
    profissional: 'jon'
  });

  // Autocomplete suggestions states
  const [showAddSuggestions, setShowAddSuggestions] = useState(false);
  const [showEditSuggestions, setShowEditSuggestions] = useState(false);

  // New States for Trinks layout
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, booking: null, date: '', time: '', professional: 'jon' });
  const [activePopover, setActivePopover] = useState({ visible: false, x: 0, y: 0, booking: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedAccordions, setExpandedAccordions] = useState({
    whatsapp: true,
    professionals: true,
    status: false,
    calendarSize: false,
    displayAgenda: false
  });
  const [waFilter, setWaFilter] = useState('todos');
  const [selectedProfs, setSelectedProfs] = useState(['jon']);
  const [miniCalDate, setMiniCalDate] = useState(() => new Date());
  const [clipboard, setClipboard] = useState(null); // { booking: obj, action: 'copy'|'cut' }

  // Tag helper in edit modal
  const [tagInputOpen, setTagInputOpen] = useState(false);
  const [newTagVal, setNewTagVal] = useState('');

  // Handle outside click listener for context menu and popover
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (contextMenu.visible) {
        setContextMenu({ visible: false, x: 0, y: 0, booking: null, date: '', time: '', professional: 'jon' });
      }
      if (activePopover.visible && !e.target.closest('.booking-popover') && !e.target.closest('.appt-card')) {
        setActivePopover({ visible: false, x: 0, y: 0, booking: null });
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [contextMenu.visible, activePopover.visible]);

  // Synchronize selectedProfs list from settings
  useEffect(() => {
    if (settings && settings.professionals) {
      const activeIds = settings.professionals.filter(p => p.active).map(p => p.id);
      setSelectedProfs(activeIds);
    } else {
      setSelectedProfs(['jon']);
    }
  }, [settings]);

  // Helper to construct a unified list of clients from profiles, bookings, and seed fallback
  const getUniqueClientsList = () => {
    const unique = new Map();

    SEED_CLIENTS.forEach(c => {
      unique.set(c.phone, { name: c.name, phone: c.phone, email: c.email || '', cpf: c.cpf || '', tags: c.tags || [] });
    });

    if (Array.isArray(clients)) {
      clients.forEach(c => {
        if (c.phone) {
          unique.set(c.phone, { name: c.name, phone: c.phone, email: c.email || '', cpf: c.cpf || '', tags: c.tags || [] });
        }
      });
    }

    if (Array.isArray(bookings)) {
      bookings.forEach(b => {
        const phone = b.clientPhone;
        if (phone) {
          if (!unique.has(phone)) {
            unique.set(phone, {
              name: b.clientName || '',
              phone: phone,
              email: b.clientEmail || '',
              cpf: b.cpf || '',
              tags: b.tags || []
            });
          }
        }
      });
    }

    return Array.from(unique.values());
  };

  // Autocomplete filtering helper
  const getFilteredClients = (queryText) => {
    if (!queryText || queryText.trim().length < 3) return [];
    const normQuery = queryText.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const listToFilter = getUniqueClientsList();
    return listToFilter.filter(c => {
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

  const selectClientForAdd = (c) => {
    setNewBooking(prev => ({
      ...prev,
      clientName: c.name || '',
      clientPhone: c.phone || '',
      clientEmail: c.email || '',
      notes: c.notes || prev.notes || ''
    }));
    setShowAddSuggestions(false);
  };

  const selectClientForEdit = (c) => {
    setEditBookingForm(prev => ({
      ...prev,
      clientName: c.name || '',
      clientPhone: c.phone || '',
      clientEmail: c.email || '',
      cpf: c.cpf || prev.cpf || '',
      tags: c.tags || prev.tags || [],
      notes: c.notes || prev.notes || ''
    }));
    setShowEditSuggestions(false);
  };

  // Formulário para novo agendamento manual
  const [newBooking, setNewBooking] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    serviceName: '',
    servicePrice: 0,
    duration: 60,
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    notes: '',
    profissional: 'jon'
  });

  // Carrega produtos, serviços, clientes, transações e configurações
  useEffect(() => {
    if (!db) {
      const localProd = localStorage.getItem('demo_products');
      if (localProd) setProducts(JSON.parse(localProd));
      
      const localServ = localStorage.getItem('demo_services');
      if (localServ) setServices(JSON.parse(localServ));
      else setServices(SEED_SERVICES);

      const localClients = localStorage.getItem('demo_client_profiles');
      if (localClients) {
        try {
          const parsed = JSON.parse(localClients);
          setClients(parsed.length > 0 ? parsed : SEED_CLIENTS);
        } catch (e) {
          setClients(SEED_CLIENTS);
        }
      } else {
        setClients(SEED_CLIENTS);
      }
      setIsDemoMode(true);
    } else {
      setIsDemoMode(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (globalData.services.length > 0 && !newBooking.serviceName) {
      setNewBooking(prev => ({
        ...prev,
        serviceName: services[0].name,
        servicePrice: services[0].promoPrice || services[0].price,
        duration: services[0].duration || 60
      }));
    }
  }, [services]);



  const changeDay = (direction) => {
    const d = new Date(currentDate);
    d.setDate(currentDate.getDate() + direction);
    setCurrentDate(d);
    setMiniCalDate(new Date(d));
  };

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

  const handleStartEditBooking = (appt) => {
    const activeAppt = appt || selectedBooking;
    if (!activeAppt) return;

    setEditBookingForm({
      clientName: activeAppt.clientName || '',
      clientPhone: activeAppt.clientPhone || '',
      clientEmail: activeAppt.clientEmail || '',
      cpf: activeAppt.cpf || '',
      tags: activeAppt.tags || [],
      serviceName: activeAppt.serviceName || activeAppt.service?.name || '',
      servicePrice: activeAppt.servicePrice || activeAppt.service?.price || 0,
      duration: activeAppt.duration || activeAppt.service?.duration || 60,
      date: activeAppt.date || '',
      time: activeAppt.time || '',
      notes: activeAppt.notes || '',
      status: activeAppt.status || 'confirmado',
      profissional: activeAppt.profissional || 'jon'
    });
    setIsEditingBooking(true);
    setActivePopover({ visible: false });
    setContextMenu({ visible: false });
  };

  const handleSaveEditBooking = async (e) => {
    if (e) e.preventDefault();
    const updatedPayload = {
      clientName: editBookingForm.clientName,
      clientPhone: editBookingForm.clientPhone,
      clientEmail: editBookingForm.clientEmail,
      cpf: editBookingForm.cpf || '',
      tags: editBookingForm.tags || [],
      serviceName: editBookingForm.serviceName,
      servicePrice: Number(editBookingForm.servicePrice),
      service: {
        name: editBookingForm.serviceName,
        price: Number(editBookingForm.servicePrice),
        duration: Number(editBookingForm.duration || 60)
      },
      duration: Number(editBookingForm.duration || 60),
      date: editBookingForm.date,
      time: editBookingForm.time,
      notes: editBookingForm.notes,
      status: editBookingForm.status,
      profissional: editBookingForm.profissional || 'jon'
    };

    try {
      const bId = selectedBooking?.id;
      if (!bId) return;

      if (isDemoMode || !db) {
        setBookings(prev => prev.map(b => b.id === bId ? { ...b, ...updatedPayload } : b));
        setSelectedBooking(prev => prev ? { ...prev, ...updatedPayload } : null);
        
        const localData = localStorage.getItem('demo_bookings');
        if (localData) {
          const arr = JSON.parse(localData);
          const newArr = arr.map(b => b.id === bId ? { ...b, ...updatedPayload } : b);
          localStorage.setItem('demo_bookings', JSON.stringify(newArr));
        }
      } else {
        const docRef = doc(db, 'bookings', bId);
        await updateDoc(docRef, updatedPayload);
        setSelectedBooking(prev => prev ? { ...prev, ...updatedPayload } : null);
      }
      setIsEditingBooking(false);
      setSelectedBooking(null);
    } catch (err) {
      console.error('Erro ao editar agendamento:', err);
      alert('Não foi possível salvar as alterações do agendamento.');
    }
  };

  const handleSaveAndCheckout = async () => {
    const updatedPayload = {
      clientName: editBookingForm.clientName,
      clientPhone: editBookingForm.clientPhone,
      clientEmail: editBookingForm.clientEmail,
      cpf: editBookingForm.cpf || '',
      tags: editBookingForm.tags || [],
      serviceName: editBookingForm.serviceName,
      servicePrice: Number(editBookingForm.servicePrice),
      service: {
        name: editBookingForm.serviceName,
        price: Number(editBookingForm.servicePrice),
        duration: Number(editBookingForm.duration || 60)
      },
      duration: Number(editBookingForm.duration || 60),
      date: editBookingForm.date,
      time: editBookingForm.time,
      notes: editBookingForm.notes,
      status: editBookingForm.status,
      profissional: editBookingForm.profissional || 'jon'
    };

    try {
      const bId = selectedBooking?.id;
      if (!bId) return;

      let savedBookingObj = { id: bId, ...updatedPayload };

      if (isDemoMode || !db) {
        setBookings(prev => prev.map(b => b.id === bId ? { ...b, ...updatedPayload } : b));
        setSelectedBooking(savedBookingObj);
        
        const localData = localStorage.getItem('demo_bookings');
        if (localData) {
          const arr = JSON.parse(localData);
          const newArr = arr.map(b => b.id === bId ? { ...b, ...updatedPayload } : b);
          localStorage.setItem('demo_bookings', JSON.stringify(newArr));
        }
      } else {
        const docRef = doc(db, 'bookings', bId);
        await updateDoc(docRef, updatedPayload);
        setSelectedBooking(savedBookingObj);
      }
      
      setOverrideBasePrice(Number(editBookingForm.servicePrice));
      setIsEditingBooking(false);
      setIsCheckoutOpen(true);
    } catch (err) {
      console.error('Erro ao salvar e ir para checkout:', err);
      alert('Não foi possível salvar e ir para a comanda.');
    }
  };

  const triggerEmailNotification = async (payload) => {
    if (!payload.clientEmail) return;
    try {
      // Format date beautifully if possible
      let displayDate = payload.date;
      try {
        const parts = payload.date.split('-');
        if (parts.length === 3) {
          const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
          const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
          const weekday = weekdays[dateObj.getDay()];
          displayDate = `${weekday}, ${parts[2]}/${parts[1]}/${parts[0]}`;
        }
      } catch (dateErr) {
        console.warn('Error formatting date for email:', dateErr);
      }

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientEmail: payload.clientEmail,
          clientName: payload.clientName,
          serviceName: payload.service?.name || payload.service || '',
          date: displayDate,
          time: payload.time,
          duration: payload.duration || payload.service?.duration || 60,
          notes: payload.notes || '',
          professionalName: payload.profissional || 'Jon',
          price: payload.service?.price || null
        }),
      });
      const data = await response.json();
      console.log('Admin Email API response:', data);
    } catch (err) {
      console.error('Failed to send admin manual booking email confirmation:', err);
    }
  };

  const handleAddManualBooking = async (e) => {
    e.preventDefault();
    const activeServName = newBooking.serviceName || (services[0]?.name || 'Corte com o Jon');
    const activeServPrice = newBooking.servicePrice || (services[0]?.promoPrice || services[0]?.price || 150);
    const activeDuration = newBooking.duration || (services[0]?.duration || 60);

    const payload = {
      clientName: newBooking.clientName,
      clientPhone: newBooking.clientPhone,
      clientEmail: newBooking.clientEmail,
      service: {
        name: activeServName,
        price: activeServPrice,
        duration: activeDuration
      },
      duration: activeDuration,
      date: newBooking.date,
      time: newBooking.time,
      notes: newBooking.notes,
      status: 'confirmado',
      profissional: newBooking.profissional || 'jon',
      createdAt: new Date().toISOString()
    };

    try {
      const cleanPhone = newBooking.clientPhone.replace(/\D/g, '');

      if (isDemoMode) {
        setBookings(prev => [...prev, { id: 'demo-' + Date.now(), ...payload }]);
      } else {
        await addDoc(collection(db, 'bookings'), payload);
      }

      // Auto-cadastro de cliente
      if (cleanPhone) {
        const exists = clients.some(c => c.phone === cleanPhone);
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
            observacoes: 'Cadastrado automaticamente via agendamento manual no painel',
            sexo: 'Feminino',
            birthdate: '',
            createdAt: new Date().toISOString()
          };

          if (isDemoMode) {
            const localClients = JSON.parse(localStorage.getItem('demo_client_profiles') || '[]');
            localClients.push(profilePayload);
            localStorage.setItem('demo_client_profiles', JSON.stringify(localClients));
            setClients(prev => [...prev, { id: cleanPhone, ...profilePayload }]);
          } else {
            try {
              const clientRef = doc(db, 'client_profiles', cleanPhone);
              const clientSnap = await getDoc(clientRef);
              if (!clientSnap.exists()) {
                await setDoc(clientRef, profilePayload);
              }
            } catch (profileErr) {
              console.warn('Erro ao auto-cadastrar cliente no Firestore (Painel):', profileErr);
            }
          }
        }
      }

      if (payload.clientEmail) {
        triggerEmailNotification(payload);
      }

      setShowAddModal(false);
      
      setNewBooking({
        clientName: '',
        clientPhone: '',
        clientEmail: '',
        serviceName: services[0]?.name || '',
        servicePrice: services[0]?.promoPrice || services[0]?.price || 0,
        duration: services[0]?.duration || 60,
        date: currentDate.toISOString().split('T')[0],
        time: '09:00',
        notes: '',
        profissional: 'jon'
      });
    } catch (err) {
      console.error('Erro ao criar agendamento manual:', err);
      alert('Falha ao registrar agendamento manual.');
    }
  };

  const handleCellClick = (dateStr, slot, profId, profName) => {
    const [year, month, day] = dateStr.split('-');
    const dateObj = new Date(year, month - 1, day);
    const weekday = DAYS_TRANSLATION[dateObj.getDay()];

    setSelectedSlot({
      date: dateStr,
      time: slot,
      profissional: profId,
      dateFormatted: `${day}/${month} (${weekday})`,
      profName: profName
    });
    setShowSlotActionModal(true);
  };

  const handleSelectManualBooking = () => {
    setNewBooking({
      clientName: '',
      clientPhone: '',
      clientEmail: '',
      serviceName: services[0]?.name || '',
      servicePrice: services[0]?.promoPrice || services[0]?.price || 0,
      duration: services[0]?.duration || 60,
      date: selectedSlot.date,
      time: selectedSlot.time,
      profissional: selectedSlot.profissional || 'jon',
      notes: ''
    });
    setShowSlotActionModal(false);
    setShowAddModal(true);
  };

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
      profissional: selectedSlot.profissional || 'jon',
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
        setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: 'finalizado' } : b));

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

        const localTx = localStorage.getItem('demo_transactions');
        const currentTx = localTx ? JSON.parse(localTx) : SEED_TRANSACTIONS;
        const newTx = { id: 'tx_' + Date.now(), ...transactionPayload };
        const updatedTxList = [...currentTx, newTx];
        localStorage.setItem('demo_transactions', JSON.stringify(updatedTxList));
        setTransactions(updatedTxList);
      } else {
        const apptRef = doc(db, 'bookings', booking.id);
        await updateDoc(apptRef, { status: 'finalizado' });

        for (const added of addedProducts) {
          const prodRef = doc(db, 'products', added.productId);
          const match = products.find(p => p.id === added.productId);
          if (match) {
            const newQty = Math.max(0, match.quantity - added.quantity);
            await updateDoc(prodRef, { quantity: newQty });
          }
        }

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

  // Reschedule Paste logic
  const handlePasteBooking = async () => {
    if (!clipboard || !contextMenu) return;
    const { booking: sourceBooking, action } = clipboard;
    const targetDate = contextMenu.date;
    const targetTime = contextMenu.time;
    const targetProf = contextMenu.professional;

    const occupied = bookings.some(b => 
      b.date === targetDate && 
      b.time === targetTime && 
      (b.profissional || 'jon') === targetProf && 
      b.status !== 'cancelado'
    );

    if (occupied) {
      alert('Este horário já está ocupado por outro agendamento!');
      return;
    }

    const updatedPayload = {
      date: targetDate,
      time: targetTime,
      profissional: targetProf
    };

    try {
      if (action === 'cut') {
        if (isDemoMode || !db) {
          setBookings(prev => prev.map(b => b.id === sourceBooking.id ? { ...b, ...updatedPayload } : b));
          const local = localStorage.getItem('demo_bookings');
          if (local) {
            const arr = JSON.parse(local);
            const newArr = arr.map(b => b.id === sourceBooking.id ? { ...b, ...updatedPayload } : b);
            localStorage.setItem('demo_bookings', JSON.stringify(newArr));
          }
        } else {
          const ref = doc(db, 'bookings', sourceBooking.id);
          await updateDoc(ref, updatedPayload);
        }
        setClipboard(null);
        alert('Agendamento movido com sucesso!');
      } else if (action === 'copy') {
        const newPayload = {
          ...sourceBooking,
          id: undefined,
          date: targetDate,
          time: targetTime,
          profissional: targetProf,
          createdAt: new Date().toISOString()
        };
        delete newPayload.id;

        if (isDemoMode || !db) {
          const newId = 'demo-' + Date.now();
          setBookings(prev => [...prev, { id: newId, ...newPayload }]);
          const local = localStorage.getItem('demo_bookings');
          const arr = local ? JSON.parse(local) : [];
          arr.push({ id: newId, ...newPayload });
          localStorage.setItem('demo_bookings', JSON.stringify(arr));
        } else {
          await addDoc(collection(db, 'bookings'), newPayload);
        }
        alert('Agendamento copiado com sucesso!');
      }
    } catch (err) {
      console.error('Erro ao colar agendamento:', err);
      alert('Erro ao colar agendamento.');
    }
    setContextMenu({ visible: false });
  };

  // Metrics calculations
  const activeBookings = bookings.filter(b => b.status !== 'cancelado');
  const pendingCount = bookings.filter(b => b.status === 'pendente').length;
  
  const [revenueThisWeek, setRevenueThisWeek] = useState(0);

  useEffect(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(d.setDate(diff));
    const startStr = startOfWeek.toISOString().split('T')[0];

    const endStr = new Date(startOfWeek.setDate(startOfWeek.getDate() + 5)).toISOString().split('T')[0];

    const weekEntradas = transactions
      .filter(t => t.type === 'entrada' && t.date >= startStr && t.date <= endStr)
      .reduce((sum, t) => sum + t.value, 0);
    setRevenueThisWeek(weekEntradas);
  }, [transactions, currentDate]);

  // WhatsApp automation 24h before
  useEffect(() => {
    if (!settings || !settings.waReminderEnabled) return;
    if (bookings.length === 0) return;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const remindersToSend = bookings.filter(b => {
      return b.date === tomorrowStr && 
             b.status !== 'cancelado' && 
             !b.reminderSent;
    });

    if (remindersToSend.length === 0) return;

    const sendReminder = async (booking) => {
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

    remindersToSend.forEach(booking => {
      sendReminder(booking);
    });

  }, [bookings, settings, db]);

  const handleWhatsAppCongratulate = (client) => {
    const cleanPhone = client.phone.replace(/\D/g, '');
    const message = `Olá, ${client.name}! O Studio do Jon passando aqui para te desejar um feliz aniversário! Que seu dia seja maravilhoso e repleto de sorrisos. Para comemorar, temos um mimo especial pra você na sua próxima visita! 🎂🎉`;
    const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const getWhatsAppConfirmationUrl = (phone, booking) => {
    if (!phone) return '';
    const cleanPhone = phone.replace(/\D/g, '');
    const clientName = booking.clientName || '';
    const serviceName = booking.serviceName || booking.service?.name || '';
    let formattedDate = booking.date || '';
    if (formattedDate.includes('-')) {
      formattedDate = formattedDate.split('-').reverse().join('/');
    }
    const time = booking.time || '';

    const rawTemplate = settings?.waReminderTemplate || 'Olá, {cliente}! Passando para lembrar do seu horário ({data} às {hora}) para o serviço: {servico}. Podemos confirmar? 💇‍♂️✨';
    const message = rawTemplate
      .replace(/{cliente}/gi, clientName)
      .replace(/{servico}/gi, serviceName)
      .replace(/{data}/gi, formattedDate)
      .replace(/{hora}/gi, time);

    return `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const birthdayClients = (() => {
    const currentMonth = new Date().getMonth() + 1;
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

  // Filtered List of Professionals
  const activeProfessionalsList = settings?.professionals || [
    { id: 'jon', name: 'Jon', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80', commission: 50, phone: '31995097613', email: 'jon@studio.com', active: true }
  ];

  // Selected active professionals to render
  const columnsToRender = activeProfessionalsList.filter(p => selectedProfs.includes(p.id));

  // Date badges dynamically computed
  const getDateBadge = (dateStr) => {
    if (!dateStr) return '';
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    if (dateStr === todayStr) return 'Hoje';
    if (dateStr === tomorrowStr) return 'Amanhã';

    const [year, month, day] = dateStr.split('-');
    const dateObj = new Date(year, month - 1, day);
    return DAYS_TRANSLATION[dateObj.getDay()];
  };

  // Mini Calendar list of days
  const getMiniCalDays = () => {
    const year = miniCalDate.getFullYear();
    const month = miniCalDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, date: null });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        date: new Date(year, month, i)
      });
    }
    return days;
  };

  const handleMiniCalDayClick = (dayDate) => {
    if (!dayDate) return;
    setCurrentDate(dayDate);
    setMiniCalDate(new Date(dayDate));
  };

  const handleMiniCalMonthChange = (dir) => {
    const newDate = new Date(miniCalDate);
    newDate.setMonth(miniCalDate.getMonth() + dir);
    setMiniCalDate(newDate);
  };

  // Left-Click Handler for bookings cards (shows popover)
  const handleBookingLeftClick = (e, appt) => {
    e.stopPropagation();
    e.preventDefault();
    setActivePopover({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      booking: appt
    });
    setContextMenu({ visible: false, x: 0, y: 0, booking: null, date: '', time: '', professional: 'jon' });
  };

  // Right-Click Handler (custom Context Menu)
  const handleCellContextMenu = (e, dateStr, slot, profId, appt) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      booking: appt || null,
      date: dateStr,
      time: slot,
      professional: profId
    });
    setActivePopover({ visible: false, x: 0, y: 0, booking: null });
  };

  // Toggle Accordion State
  const toggleAccordion = (section) => {
    setExpandedAccordions(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Toggle Professional Select Checkbox
  const handleToggleProfCheckbox = (profId) => {
    if (selectedProfs.includes(profId)) {
      if (selectedProfs.length === 1) {
        alert('Selecione pelo menos um profissional para exibir na grade!');
        return;
      }
      setSelectedProfs(prev => prev.filter(id => id !== profId));
    } else {
      setSelectedProfs(prev => [...prev, profId]);
    }
  };

  // Edit Tag Methods
  const handleAddTag = () => {
    if (!newTagVal.trim()) return;
    if (editBookingForm.tags.includes(newTagVal.trim())) {
      setNewTagVal('');
      setTagInputOpen(false);
      return;
    }
    setEditBookingForm(prev => ({
      ...prev,
      tags: [...prev.tags, newTagVal.trim()]
    }));
    setNewTagVal('');
    setTagInputOpen(false);
  };

  const handleRemoveTag = (tag) => {
    setEditBookingForm(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  // Filter bookings list based on search and filters
  const getFilteredBookings = () => {
    const currentDateStr = currentDate.toISOString().split('T')[0];
    
    return bookings.filter(b => {
      // Must match active date
      if (b.date !== currentDateStr) return false;

      // Filter by whatsapp status if selected
      if (waFilter !== 'todos') {
        if (waFilter === 'confirmados' && b.status !== 'confirmado') return false;
        if (waFilter === 'pendentes' && b.status !== 'pendente') return false;
        if (waFilter === 'cancelados' && b.status !== 'cancelado') return false;
        if (waFilter === 'sem-mensagem' && b.reminderSent === true) return false;
      }

      // Filter by Search Query
      if (searchQuery.trim().length >= 3) {
        const queryNorm = searchQuery.toLowerCase().trim();
        const clientMatch = b.clientName?.toLowerCase().includes(queryNorm);
        const serviceMatch = (b.serviceName || b.service?.name)?.toLowerCase().includes(queryNorm);
        if (!clientMatch && !serviceMatch) return false;
      }

      return true;
    });
  };

  const filteredBookingsList = getFilteredBookings();

  return (
    <div className="admin-dashboard">
      
      {/* Cards de Métricas */}
      <section className="admin-stats-grid">
        <div className="stat-card">
          <h3>Agendamentos Ativos (Dia)</h3>
          <div className="value">{filteredBookingsList.filter(b => b.status !== 'cancelado' && b.status !== 'bloqueado').length}</div>
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
                    <span className="balloon-emoji">🎈</span>
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

      {/* Split layout: sidebar + agenda */}
      <div className="admin-agenda-container">
        
        {/* SIDEBAR LEFT */}
        <aside className="agenda-sidebar-left">
          
          <button 
            type="button" 
            className="agenda-sidebar-btn primary"
            onClick={() => {
              // Prefill selection slot and open modal
              setSelectedSlot({
                date: currentDate.toISOString().split('T')[0],
                time: '09:00',
                profissional: activeProfessionalsList[0]?.id || 'jon',
                dateFormatted: currentDate.toLocaleDateString('pt-BR')
              });
              setNewBooking({
                clientName: '',
                clientPhone: '',
                clientEmail: '',
                serviceName: services[0]?.name || '',
                servicePrice: services[0]?.promoPrice || services[0]?.price || 0,
                duration: services[0]?.duration || 60,
                date: currentDate.toISOString().split('T')[0],
                time: '09:00',
                notes: '',
                profissional: activeProfessionalsList[0]?.id || 'jon'
              });
              setShowAddModal(true);
            }}
          >
            <Plus size={16} /> Buscar e Agendar
          </button>

          <button 
            type="button" 
            className="agenda-sidebar-btn secondary"
            onClick={() => {
              // select all active professionals
              const activeIds = activeProfessionalsList.filter(p => p.active).map(p => p.id);
              setSelectedProfs(activeIds);
            }}
          >
            <User size={16} /> Todos Profissionais
          </button>

          {/* Mini Calendar Container */}
          <div className="mini-calendar">
            <div className="mini-calendar-header">
              <button 
                type="button" 
                className="btn-icon" 
                style={{ padding: 4 }}
                onClick={() => handleMiniCalMonthChange(-1)}
              >
                <ChevronLeft size={14} />
              </button>
              <span>
                {miniCalDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </span>
              <button 
                type="button" 
                className="btn-icon" 
                style={{ padding: 4 }}
                onClick={() => handleMiniCalMonthChange(1)}
              >
                <ChevronRight size={14} />
              </button>
            </div>
            
            <div className="mini-calendar-grid">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((dayName, index) => (
                <span key={index} className="mini-calendar-day-name">{dayName}</span>
              ))}
              {getMiniCalDays().map((dayObj, index) => {
                if (!dayObj.day) {
                  return <span key={index} className="mini-calendar-day empty" />;
                }
                
                const isDayActive = currentDate.getDate() === dayObj.day && 
                                    currentDate.getMonth() === dayObj.date.getMonth() && 
                                    currentDate.getFullYear() === dayObj.date.getFullYear();
                                    
                const isToday = new Date().getDate() === dayObj.day && 
                                new Date().getMonth() === dayObj.date.getMonth() && 
                                new Date().getFullYear() === dayObj.date.getFullYear();

                return (
                  <span 
                    key={index} 
                    className={`mini-calendar-day ${isDayActive ? 'active' : ''} ${isToday ? 'today' : ''}`}
                    onClick={() => handleMiniCalDayClick(dayObj.date)}
                  >
                    {dayObj.day}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Filter Accordions */}
          <div className="sidebar-accordion">
            <div className="accordion-header" onClick={() => toggleAccordion('whatsapp')}>
              <span>Confirmações por WhatsApp</span>
              <span>{expandedAccordions.whatsapp ? '▲' : '▼'}</span>
            </div>
            {expandedAccordions.whatsapp && (
              <div className="accordion-content">
                {[
                  { id: 'todos', label: 'Todos' },
                  { id: 'confirmados', label: 'Confirmado' },
                  { id: 'pendentes', label: 'Pendente' },
                  { id: 'cancelados', label: 'Cancelado' },
                  { id: 'sem-mensagem', label: 'Sem mensagem' }
                ].map(opt => (
                  <label key={opt.id} className="filter-option">
                    <input 
                      type="radio" 
                      name="waFilter" 
                      checked={waFilter === opt.id}
                      onChange={() => setWaFilter(opt.id)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="sidebar-accordion">
            <div className="accordion-header" onClick={() => toggleAccordion('professionals')}>
              <span>Profissionais</span>
              <span>{expandedAccordions.professionals ? '▲' : '▼'}</span>
            </div>
            {expandedAccordions.professionals && (
              <div className="accordion-content">
                {activeProfessionalsList.map(prof => (
                  <label key={prof.id} className="filter-option">
                    <input 
                      type="checkbox" 
                      checked={selectedProfs.includes(prof.id)}
                      onChange={() => handleToggleProfCheckbox(prof.id)}
                    />
                    {prof.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="sidebar-accordion">
            <div className="accordion-header" onClick={() => toggleAccordion('status')}>
              <span>Status do Agendamento</span>
              <span>{expandedAccordions.status ? '▲' : '▼'}</span>
            </div>
            {expandedAccordions.status && (
              <div className="accordion-content" style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span className="appt-status-dot confirmado" /> Confirmado</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span className="appt-status-dot pendente" /> Pendente</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span className="appt-status-dot finalizado" /> Finalizado</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span className="appt-status-dot bloqueado" /> Bloqueado</div>
              </div>
            )}
          </div>

          <div className="sidebar-accordion">
            <div className="accordion-header" onClick={() => toggleAccordion('calendarSize')}>
              <span>Tamanho da Agenda</span>
              <span>{expandedAccordions.calendarSize ? '▲' : '▼'}</span>
            </div>
            {expandedAccordions.calendarSize && (
              <div className="accordion-content">
                <label className="filter-option"><input type="radio" name="size" defaultChecked /> Compacto</label>
                <label className="filter-option"><input type="radio" name="size" /> Normal</label>
              </div>
            )}
          </div>

        </aside>

        {/* MAIN AGENDA AREA */}
        <main className="agenda-main-area">
          
          <div className="agenda-top-bar">
            
            <div className="agenda-day-nav">
              <button className="btn-icon" onClick={() => changeDay(-1)}><ChevronLeft size={16} /></button>
              <span className="agenda-day-label">
                {currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <button className="btn-icon" onClick={() => changeDay(1)}><ChevronRight size={16} /></button>
              <button 
                type="button" 
                className="btn btn-ghost" 
                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                onClick={() => {
                  setCurrentDate(new Date());
                  setMiniCalDate(new Date());
                }}
              >
                Hoje
              </button>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input 
                type="text" 
                className="agenda-search-input" 
                placeholder="Buscar cliente agendado hoje..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button 
                className="btn btn-accent" 
                style={{ padding: '8px 16px', fontSize: '0.9rem' }} 
                onClick={() => {
                  setSelectedSlot({
                    date: currentDate.toISOString().split('T')[0],
                    time: '09:00',
                    profissional: selectedProfs[0] || 'jon',
                    dateFormatted: currentDate.toLocaleDateString('pt-BR')
                  });
                  setNewBooking({
                    clientName: '',
                    clientPhone: '',
                    clientEmail: '',
                    serviceName: services[0]?.name || '',
                    servicePrice: services[0]?.promoPrice || services[0]?.price || 0,
                    duration: services[0]?.duration || 60,
                    date: currentDate.toISOString().split('T')[0],
                    time: '09:00',
                    notes: '',
                    profissional: selectedProfs[0] || 'jon'
                  });
                  setShowAddModal(true);
                }}
              >
                <Plus size={16} style={{ marginRight: 6 }} /> Agendar
              </button>
            </div>

          </div>

          {/* Agenda Grid Columns */}
          {loading ? (
            <p>Carregando agenda...</p>
          ) : (
            <div className="calendar-grid">
              
              {/* Header column professionals */}
              <div 
                className="pro-columns-header" 
                style={{ gridTemplateColumns: `80px repeat(${columnsToRender.length}, 1fr)` }}
              >
                <div className="pro-header-cell" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Hora</div>
                {columnsToRender.map(prof => (
                  <div key={prof.id} className="pro-header-cell">
                    <img 
                      src={prof.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'} 
                      alt={prof.name} 
                      className="pro-avatar"
                    />
                    <span className="pro-name">{prof.name}</span>
                  </div>
                ))}
              </div>

              {/* Time slots rows */}
              <div className="calendar-body">
                {TIME_SLOTS.map(slot => (
                  <div 
                    key={slot} 
                    className="time-row"
                    style={{ gridTemplateColumns: `80px repeat(${columnsToRender.length}, 1fr)` }}
                  >
                    <div className="time-label-cell">{slot}</div>
                    
                    {columnsToRender.map(prof => {
                      const currentDateStr = currentDate.toISOString().split('T')[0];
                      // Find appointment for this professional at this slot
                      const appt = filteredBookingsList.find(b => 
                        b.date === currentDateStr && 
                        b.time === slot && 
                        (b.profissional || 'jon') === prof.id &&
                        b.status !== 'cancelado'
                      ) || filteredBookingsList.find(b => 
                        b.date === currentDateStr && 
                        b.time === slot && 
                        (b.profissional || 'jon') === prof.id &&
                        b.status === 'cancelado'
                      );

                      return (
                        <div 
                          key={prof.id} 
                          className="day-cell"
                          style={{ cursor: (!appt || appt.status === 'cancelado') ? 'pointer' : 'default' }}
                          onClick={(e) => {
                            if (!appt || appt.status === 'cancelado') {
                              handleCellClick(currentDateStr, slot, prof.id, prof.name);
                            }
                          }}
                          onContextMenu={(e) => handleCellContextMenu(e, currentDateStr, slot, prof.id, appt)}
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
                              onContextMenu={(e) => handleCellContextMenu(e, currentDateStr, slot, prof.id, appt)}
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
                              onClick={(e) => handleBookingLeftClick(e, appt)}
                              onContextMenu={(e) => handleCellContextMenu(e, currentDateStr, slot, prof.id, appt)}
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

        </main>
      </div>

      {/* CUSTOM LEFT-CLICK POPOVER / TOOLTIP */}
      {activePopover.visible && activePopover.booking && (
        <div 
          className="booking-popover" 
          style={{ top: activePopover.y + 10, left: activePopover.x + 10 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="booking-popover-header">
            <span className="booking-popover-client">{activePopover.booking.clientName.toUpperCase()}</span>
            <button 
              className="btn-icon" 
              style={{ padding: 2, border: 'none', background: 'none' }}
              onClick={() => setActivePopover({ visible: false, x: 0, y: 0, booking: null })}
            >
              <X size={14} />
            </button>
          </div>
          <div className="booking-popover-body">
            <div className="booking-popover-row">
              <Clock size={12} className="text-muted" />
              <span>{activePopover.booking.time} - {(() => {
                const [h, m] = activePopover.booking.time.split(':').map(Number);
                const duration = activePopover.booking.duration || 60;
                const totalMin = h * 60 + m + duration;
                const newH = Math.floor(totalMin / 60) % 24;
                const newM = totalMin % 60;
                return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
              })()}</span>
            </div>
            <div className="booking-popover-row">
              <Phone size={12} className="text-muted" />
              <a 
                href={getWhatsAppConfirmationUrl(activePopover.booking.clientPhone, activePopover.booking)}
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Send size={11} style={{ marginRight: 4 }} /> WhatsApp
              </a>
            </div>
            <div className="booking-popover-row">
              <User size={12} className="text-muted" />
              <span>Profissional: {activeProfessionalsList.find(p => p.id === (activePopover.booking.profissional || 'jon'))?.name || 'Jon'}</span>
            </div>
            <div className="booking-popover-row">
              <FileText size={12} className="text-muted" />
              <span>Serviço: {activePopover.booking.serviceName || activePopover.booking.service?.name}</span>
            </div>
            <div className="booking-popover-row">
              <span className={`appt-status-dot ${activePopover.booking.status}`} />
              <span style={{ textTransform: 'capitalize' }}>Status: {activePopover.booking.status}</span>
            </div>
            
            <div className="booking-popover-actions">
              <button 
                className="btn btn-ghost" 
                style={{ padding: '4px 8px', fontSize: '0.75rem', flexGrow: 1 }}
                onClick={() => {
                  setSelectedBooking(activePopover.booking);
                  handleStartEditBooking(activePopover.booking);
                }}
              >
                Editar
              </button>
              {activePopover.booking.status === 'confirmado' && (
                <button 
                  className="btn btn-accent" 
                  style={{ padding: '4px 8px', fontSize: '0.75rem', flexGrow: 1 }}
                  onClick={() => {
                    setSelectedBooking(activePopover.booking);
                    setOverrideBasePrice(activePopover.booking.servicePrice || activePopover.booking.service?.price || 150);
                    setIsCheckoutOpen(true);
                    setActivePopover({ visible: false, x: 0, y: 0, booking: null });
                  }}
                >
                  Comanda
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CONTEXT MENU */}
      {contextMenu.visible && (
        <ul 
          className="context-menu-list" 
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={e => e.stopPropagation()}
        >
          {contextMenu.booking ? (
            <>
              <li className="context-menu-item" onClick={() => handleStartEditBooking(contextMenu.booking)}>
                <Edit size={14} /> Ver/Editar Agendamento
              </li>
              <li className="context-menu-item" style={{ zIndex: 1100 }}>
                <RefreshCw size={14} /> Alterar Status
                <span className="context-menu-arrow">▶</span>
                <ul className="context-menu-submenu">
                  <li className="context-menu-item" onClick={() => handleUpdateStatus(contextMenu.booking.id, 'pendente')}>Pendente</li>
                  <li className="context-menu-item" onClick={() => handleUpdateStatus(contextMenu.booking.id, 'confirmado')}>Confirmado</li>
                  <li className="context-menu-item" onClick={() => handleUpdateStatus(contextMenu.booking.id, 'finalizado')}>Finalizado</li>
                  <li className="context-menu-item" onClick={() => handleUpdateStatus(contextMenu.booking.id, 'cancelado')}>Cancelado</li>
                </ul>
              </li>
              {contextMenu.booking.status === 'confirmado' && (
                <li className="context-menu-item" onClick={() => {
                  setSelectedBooking(contextMenu.booking);
                  setOverrideBasePrice(contextMenu.booking.servicePrice || contextMenu.booking.service?.price || 150);
                  setIsCheckoutOpen(true);
                  setContextMenu({ visible: false });
                }}>
                  <DollarSign size={14} /> Fechar Conta
                </li>
              )}
              <li className="context-menu-item" onClick={() => {
                setClipboard({ booking: contextMenu.booking, action: 'copy' });
                setContextMenu({ visible: false });
              }}>
                <Copy size={14} /> Copiar
              </li>
              <li className="context-menu-item" onClick={() => {
                setClipboard({ booking: contextMenu.booking, action: 'cut' });
                setContextMenu({ visible: false });
              }}>
                <Scissors size={14} /> Recortar
              </li>
              <li className="context-menu-item danger" onClick={() => {
                handleUpdateStatus(contextMenu.booking.id, 'cancelado');
                setContextMenu({ visible: false });
              }}>
                <Trash2 size={14} /> Cancelar Agendamento
              </li>
            </>
          ) : (
            <>
              <li className="context-menu-item" onClick={() => {
                handleCellClick(contextMenu.date, contextMenu.time, contextMenu.professional, activeProfessionalsList.find(p => p.id === contextMenu.professional)?.name || 'Jon');
                setContextMenu({ visible: false });
              }}>
                <Plus size={14} /> Agendar Cliente
              </li>
              <li className="context-menu-item" onClick={() => {
                setSelectedSlot({
                  date: contextMenu.date,
                  time: contextMenu.time,
                  profissional: contextMenu.professional,
                  dateFormatted: contextMenu.date
                });
                setShowSlotActionModal(true);
                setContextMenu({ visible: false });
              }}>
                <Lock size={14} /> Bloquear Horário
              </li>
              {clipboard && (
                <li className="context-menu-item" onClick={handlePasteBooking}>
                  <Clipboard size={14} /> Colar Agendamento
                </li>
              )}
            </>
          )}
        </ul>
      )}

      {/* DETAILED EDITAR AGENDAMENTO MODAL (TRINKS STYLE) */}
      {selectedBooking && isEditingBooking && (
        <div className="modal-overlay">
          <div className="modal-content trinks-modal">
            
            <div className="trinks-modal-header">
              <h3 className="trinks-modal-title">
                <Edit size={20} /> EDITAR AGENDAMENTO
              </h3>
              <button 
                type="button" 
                className="trinks-modal-close-btn"
                onClick={() => {
                  setSelectedBooking(null);
                  setIsEditingBooking(false);
                }}
              >
                X
              </button>
            </div>

            <div className="trinks-modal-body">
              
              {/* Split row - Cliente vs Avatar */}
              <div className="trinks-client-split">
                <div className="trinks-client-form">
                  <div className="form-group" style={{ position: 'relative', marginBottom: 6 }}>
                    <label>Nome Completo do Cliente *</label>
                    <div className="autocomplete-container">
                      <input 
                        type="text" 
                        required 
                        value={editBookingForm.clientName}
                        onChange={e => {
                          setEditBookingForm(prev => ({ ...prev, clientName: e.target.value }));
                          setShowEditSuggestions(true);
                        }}
                        onFocus={() => setShowEditSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowEditSuggestions(false), 200)}
                      />
                      {showEditSuggestions && getFilteredClients(editBookingForm.clientName).length > 0 && (
                        <ul className="suggestions-list">
                          {getFilteredClients(editBookingForm.clientName).map(c => (
                            <li 
                              key={c.phone || c.id} 
                              className="suggestion-item"
                              onMouseDown={() => selectClientForEdit(c)}
                            >
                              <span className="suggestion-name">{c.name}</span>
                              {c.phone && <span className="suggestion-phone">{c.phone}</span>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group" style={{ marginBottom: 6 }}>
                      <label>CPF (Opcional)</label>
                      <input 
                        type="text" 
                        placeholder="Ex: 000.000.000-00"
                        value={editBookingForm.cpf}
                        onChange={e => setEditBookingForm(prev => ({ ...prev, cpf: e.target.value }))}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 6 }}>
                      <label style={{ display: 'flex', alignItems: 'center', justifycontent: 'space-between' }}>
                        <span>WhatsApp *</span>
                        {editBookingForm.clientPhone && (
                          <a 
                            href={getWhatsAppConfirmationUrl(editBookingForm.clientPhone, {
                              clientName: editBookingForm.clientName,
                              serviceName: editBookingForm.serviceName,
                              date: editBookingForm.date,
                              time: editBookingForm.time
                            })} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', color: '#22c55e', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 600 }}
                          >
                            <Send size={11} style={{ marginRight: 2 }} /> Abrir
                          </a>
                        )}
                      </label>
                      <input 
                        type="tel" 
                        required 
                        value={editBookingForm.clientPhone}
                        onChange={e => setEditBookingForm(prev => ({ ...prev, clientPhone: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 6 }}>
                    <label>E-mail (Opcional)</label>
                    <input 
                      type="email" 
                      value={editBookingForm.clientEmail}
                      onChange={e => setEditBookingForm(prev => ({ ...prev, clientEmail: e.target.value }))}
                    />
                  </div>

                  {/* Tags Row */}
                  <div className="form-group" style={{ marginBottom: 6 }}>
                    <label>Etiquetas (Tags)</label>
                    <div className="trinks-tags-row">
                      {editBookingForm.tags.map(t => (
                        <span key={t} className="trinks-tag-pill">
                          {t} 
                          <button 
                            type="button" 
                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#e53e3e', marginLeft: 4, fontWeight: 700 }}
                            onClick={() => handleRemoveTag(t)}
                          >
                            x
                          </button>
                        </span>
                      ))}
                      
                      {!tagInputOpen ? (
                        <button 
                          type="button" 
                          className="trinks-tag-add-btn"
                          onClick={() => setTagInputOpen(true)}
                        >
                          + Adicionar Tag
                        </button>
                      ) : (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <input 
                            type="text" 
                            placeholder="Tag..."
                            style={{ padding: '2px 6px', fontSize: '0.75rem', width: '80px' }}
                            value={newTagVal}
                            onChange={e => setNewTagVal(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                            autoFocus
                          />
                          <button 
                            type="button" 
                            className="btn btn-accent" 
                            style={{ padding: '2px 6px', fontSize: '0.75rem' }} 
                            onClick={handleAddTag}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span>Ficha Completa: <strong>{(editBookingForm.cpf && editBookingForm.clientEmail) ? 'Sim' : 'Não'}</strong></span>
                    <span 
                      style={{ color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer' }}
                      onClick={() => {
                        alert('Navegue para o painel de Clientes para uma ficha detalhada.');
                      }}
                    >
                      Editar Cliente
                    </span>
                  </div>

                </div>

                <div className="trinks-client-avatar-container">
                  <div className="trinks-avatar-placeholder">
                    {editBookingForm.clientName ? editBookingForm.clientName.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase() : '?'}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 8 }}>Foto de Perfil</span>
                </div>
              </div>

              {/* Appointment details block */}
              <div className="trinks-appointment-details">
                <div className="form-group">
                  <label>Profissional Responsável *</label>
                  <select 
                    value={editBookingForm.profissional}
                    onChange={e => setEditBookingForm(prev => ({ ...prev, profissional: e.target.value }))}
                  >
                    {activeProfessionalsList.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Serviço Principal *</label>
                  <select 
                    value={`${editBookingForm.serviceName}|${editBookingForm.servicePrice}`}
                    onChange={e => {
                      const [name, priceStr] = e.target.value.split('|');
                      const matched = services.find(s => s.name === name);
                      setEditBookingForm(prev => ({ 
                        ...prev, 
                        serviceName: name, 
                        servicePrice: Number(priceStr),
                        duration: matched ? (matched.duration || 60) : 60
                      }));
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
                  <label>
                    Data do Agendamento *
                    <span className="trinks-date-badge">{getDateBadge(editBookingForm.date)}</span>
                  </label>
                  <input 
                    type="date" 
                    required
                    value={editBookingForm.date}
                    onChange={e => setEditBookingForm(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={13} /> Horário *
                  </label>
                  <input 
                    type="time"
                    required
                    value={editBookingForm.time}
                    onChange={e => setEditBookingForm(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label>Duração (minutos) *</label>
                  <input 
                    type="number" 
                    required 
                    min="5"
                    step="5"
                    value={editBookingForm.duration}
                    onChange={e => setEditBookingForm(prev => ({ ...prev, duration: Number(e.target.value) }))}
                  />
                </div>

                <div className="form-group">
                  <label>Valor Cobrado (R$) *</label>
                  <input 
                    type="number" 
                    required 
                    min="0"
                    step="0.01"
                    value={editBookingForm.servicePrice}
                    onChange={e => setEditBookingForm(prev => ({ ...prev, servicePrice: Number(e.target.value) }))}
                  />
                </div>

                <div className="form-group">
                  <label>Repetir Agendamento</label>
                  <select>
                    <option value="não">Não repetir (Único)</option>
                    <option value="semanal">Semanal</option>
                    <option value="quinzenal">Quinzenal</option>
                    <option value="mensal">Mensal</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Status do Agendamento *</label>
                  <select 
                    value={editBookingForm.status}
                    onChange={e => setEditBookingForm(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="pendente">Aguardando Confirmação</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="cancelado">Cancelado</option>
                    <option value="finalizado">Finalizado</option>
                  </select>
                </div>

              </div>

              <div className="form-group">
                <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Observações do Agendamento</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                    {editBookingForm.notes ? editBookingForm.notes.length : 0} de 400
                  </span>
                </label>
                <textarea 
                  rows="3"
                  maxLength={400}
                  placeholder="Observações ou notas especiais..."
                  value={editBookingForm.notes}
                  onChange={e => setEditBookingForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

            </div>

            <div className="trinks-modal-footer">
              <span 
                className="trinks-footer-link"
                onClick={handleSaveAndCheckout}
              >
                Salvar e fechar conta
              </span>
              
              <div style={{ display: 'flex', gap: 12 }}>
                <button 
                  type="button" 
                  className="btn btn-ghost" 
                  onClick={() => {
                    setSelectedBooking(null);
                    setIsEditingBooking(false);
                  }}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-accent"
                  onClick={handleSaveEditBooking}
                >
                  Salvar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 1: DETALHE DO AGENDAMENTO E COMANDA (When only viewing details or closing account) */}
      {selectedBooking && !isEditingBooking && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: isCheckoutOpen ? 640 : 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3>{isCheckoutOpen ? 'Fechar Comanda da Cliente' : 'Ficha do Agendamento'}</h3>
              <button className="btn-icon" onClick={() => {
                setSelectedBooking(null);
                setIsCheckoutOpen(false);
                setOverrideBasePrice(null);
              }}><X size={18} /></button>
            </div>
            
            {!isCheckoutOpen ? (
              selectedBooking.status === 'bloqueado' ? (
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
                    <label>Duração:</label>
                    <span>{selectedBooking.duration || selectedBooking.service?.duration || 60} minutos</span>
                  </div>
                  <div className="detail-row">
                    <label>Data/Hora:</label>
                    <span>{selectedBooking.date} às {selectedBooking.time}</span>
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
                            setSelectedSlot({
                              date: selectedBooking.date,
                              time: selectedBooking.time,
                              profissional: selectedBooking.profissional || 'jon',
                              dateFormatted: selectedBooking.date
                            });
                            setSelectedBooking(null);
                            handleSelectManualBooking();
                          }}
                        >
                          Agendar Neste Horário
                        </button>
                      )}
                      <button className="btn btn-ghost" type="button" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => handleStartEditBooking(selectedBooking)}>
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
          <form
            className="modal-content"
            onSubmit={handleAddManualBooking}
            style={{ maxHeight: '95vh', maxWidth: '600px', width: '95%', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '24px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexShrink: 0 }}>
              <h3 style={{ margin: 0, borderBottom: 'none', paddingBottom: 0 }}>Registrar Horário Manual</h3>
              <button type="button" className="btn-icon" onClick={() => setShowAddModal(false)}><X size={18} /></button>
            </div>

            <div className="form-group" style={{ flexShrink: 0, position: 'relative', zIndex: 200, marginBottom: 12 }}>
              <label>Nome Completo do Cliente *</label>
              <div className="autocomplete-container">
                <input 
                  type="text" 
                  required 
                  placeholder="Ex: Pedro Santos"
                  value={newBooking.clientName}
                  onChange={e => {
                    setNewBooking(prev => ({ ...prev, clientName: e.target.value }));
                    setShowAddSuggestions(true);
                  }}
                  onFocus={() => setShowAddSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowAddSuggestions(false), 300)}
                />
                {showAddSuggestions && getFilteredClients(newBooking.clientName).length > 0 && (
                  <ul className="suggestions-list">
                    {getFilteredClients(newBooking.clientName).map(c => (
                      <li 
                        key={c.phone || c.id} 
                        className="suggestion-item"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          selectClientForAdd(c);
                        }}
                      >
                        <span className="suggestion-name">{c.name}</span>
                        {c.phone && <span className="suggestion-phone">{c.phone}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 16, rowGap: 12, overflowY: 'auto', flex: 1, paddingRight: 4, paddingBottom: 8 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>WhatsApp *</label>
                <input 
                  type="tel" 
                  required 
                  placeholder="Ex: 31999998888"
                  value={newBooking.clientPhone}
                  onChange={e => setNewBooking(prev => ({ ...prev, clientPhone: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>E-mail (Opcional)</label>
                <input 
                  type="email" 
                  placeholder="Ex: pedro@email.com"
                  value={newBooking.clientEmail}
                  onChange={e => setNewBooking(prev => ({ ...prev, clientEmail: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Profissional Responsável *</label>
                <select 
                  value={newBooking.profissional}
                  onChange={e => setNewBooking(prev => ({ ...prev, profissional: e.target.value }))}
                >
                  {activeProfessionalsList.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Serviço *</label>
                <select 
                  value={`${newBooking.serviceName}|${newBooking.servicePrice}`}
                  onChange={e => {
                    const [name, priceStr] = e.target.value.split('|');
                    const matched = services.find(s => s.name === name);
                    setNewBooking(prev => ({ 
                      ...prev, 
                      serviceName: name, 
                      servicePrice: Number(priceStr),
                      duration: matched ? (matched.duration || 60) : 60
                    }));
                  }}
                >
                  {services.map(s => (
                    <option key={s.id} value={`${s.name}|${s.promoPrice || s.price}`}>
                      {s.name} ({s.promoPrice ? `Promo: R$ ${s.promoPrice}` : `R$ ${s.price}`})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
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

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Duração (min) *</label>
                <input 
                  type="number" 
                  required 
                  min="5"
                  step="5"
                  value={newBooking.duration || 60}
                  onChange={e => setNewBooking(prev => ({ ...prev, duration: Number(e.target.value) }))}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Data *</label>
                <input 
                  type="date" 
                  required
                  value={newBooking.date}
                  onChange={e => setNewBooking(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Horário *</label>
                <input 
                  type="time"
                  required
                  value={newBooking.time}
                  onChange={e => setNewBooking(prev => ({ ...prev, time: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
                <label>Notas Internas</label>
                <textarea 
                  rows="2"
                  placeholder="Ex: Cliente prefere finalização sem creme pesado."
                  value={newBooking.notes}
                  onChange={e => setNewBooking(prev => ({ ...prev, notes: e.target.value }))}
                ></textarea>
              </div>
            </div>

            <div className="modal-actions" style={{ justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', flexShrink: 0, marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--rule)' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Cancelar</button>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {newBooking.clientPhone && (
                  <a
                    href={getWhatsAppConfirmationUrl(newBooking.clientPhone, {
                      clientName: newBooking.clientName,
                      serviceName: newBooking.serviceName || (services.find(s => s.id === newBooking.serviceId)?.name || ''),
                      date: newBooking.date,
                      time: newBooking.time
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#22c55e', borderColor: '#22c55e', textDecoration: 'none' }}
                  >
                    <Send size={15} />
                    Enviar Confirmação WhatsApp
                  </a>
                )}
                <button type="submit" className="btn btn-accent">Salvar na Agenda</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: AÇÕES DO HORÁRIO LIVRE (AGENDAR OU BLOQUEAR) */}
      {showSlotActionModal && selectedSlot && (
        <div className="modal-overlay slot-action-overlay">
          <div className="slot-action-modal">

            <div className="slot-action-header">
              <div className="slot-action-pill">
                <span className="slot-action-pill-dot" />
                Horário Livre ({selectedSlot.profName || 'Jon'})
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

            <div className="slot-action-cards">

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
