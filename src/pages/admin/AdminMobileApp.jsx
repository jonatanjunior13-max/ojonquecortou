import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, fetchCollectionRest, fetchDocRest } from '../../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, onSnapshot, doc, addDoc, updateDoc, query, orderBy, limit, getDoc, setDoc, deleteDoc, where, getDocs 
} from 'firebase/firestore';
import { 
  Home as HomeIcon, Calendar as CalendarIcon, Plus, Menu, HelpCircle, 
  Bell, ChevronLeft, ChevronRight, DollarSign, User, Scissors, 
  ArrowRight, Shield, MessageSquare, Check, X, Phone, FileText, Info,
  Clock, Settings, Sparkles, Search, Package, Users, Send, TrendingUp, TrendingDown
} from 'lucide-react';
import './AdminMobile.css';
import { syncBookingToGoogle } from '../../utils/gcalSync';

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
  const [agendaView, setAgendaView] = useState('diario');
  const [selectedWeeklyMonthlyProf, setSelectedWeeklyMonthlyProf] = useState('jon');
  const [businessPeriod, setBusinessPeriod] = useState('mes');

  // Firestore & local states
  const [bookings, setBookings] = useState([]);
  const [clients, setClients] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [services, setServices] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [settings, setSettings] = useState(null);
  const [packages, setPackages] = useState([]);
  const [clientPackages, setClientPackages] = useState([]);
  const [sellingPackageId, setSellingPackageId] = useState('');
  const [usingClientPackageId, setUsingClientPackageId] = useState('');
  const [packagesSubTab, setPackagesSubTab] = useState('modelos');
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(!db);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [connectionWarning, setConnectionWarning] = useState(false);

  // Modais
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showAddBookingModal, setShowAddBookingModal] = useState(false);
  const [showSlotActionModal, setShowSlotActionModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutBooking, setCheckoutBooking] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedExtraServices, setSelectedExtraServices] = useState([]);

  const clientActivePackages = React.useMemo(() => {
    if (!checkoutBooking) return [];
    const phone = checkoutBooking.clientPhone;
    const name = checkoutBooking.clientName;
    return clientPackages.filter(cp => 
      cp.status === 'active' && 
      ((phone && cp.clientPhone === phone) || (!phone && cp.clientName === name))
    );
  }, [checkoutBooking, clientPackages]);

  const availablePackagesForBooking = React.useMemo(() => {
    if (!checkoutBooking || !services) return [];
    const bookingServiceName = checkoutBooking.service?.name || checkoutBooking.serviceName;
    const servObj = services.find(s => s.name === bookingServiceName);
    if (!servObj) return [];
    
    return clientActivePackages.filter(cp => cp.balance && cp.balance[servObj.id] > 0);
  }, [checkoutBooking, clientActivePackages, services]);

  const getCheckoutTotal = () => {
    if (!checkoutBooking) return 0;
    const base = usingClientPackageId 
      ? 0 
      : (sellingPackageId 
          ? (packages.find(p => p.id === sellingPackageId)?.price || 0)
          : (checkoutBooking.service?.promoPrice || checkoutBooking.service?.price || checkoutBooking.servicePrice || 150)
        );
    const extras = selectedExtraServices.reduce((acc, s) => acc + s.price, 0);
    const productsTotal = selectedProducts.reduce((acc, p) => acc + (p.sellingPrice * p.qty), 0);
    const prepay = checkoutBooking.prepayment ? Number(checkoutBooking.prepayment) : 0;
    return Math.max(0, base + extras + productsTotal - discount - prepay);
  };
  const [discount, setDiscount] = useState(0);
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [activeAlert, setActiveAlert] = useState(null); // { id, title, message, booking }
  const [isFabOpen, setIsFabOpen] = useState(false);
  const swipeTouchRef = useRef({ startX: null, startY: null });

  // Venda Avulsa de Produtos
  const [showDirectSaleModal, setShowDirectSaleModal] = useState(false);
  const [directSaleProducts, setDirectSaleProducts] = useState([]);
  const [directSaleDiscount, setDirectSaleDiscount] = useState(0);
  const [directSalePaymentMethod, setDirectSalePaymentMethod] = useState('Pix');
  const [directSaleInstallments, setDirectSaleInstallments] = useState('À vista');
  const [directSaleClient, setDirectSaleClient] = useState('');
  const [showDirectSaleSuggestions, setShowDirectSaleSuggestions] = useState(false);
  const [isDirectSaleSalonUse, setIsDirectSaleSalonUse] = useState(false);

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

  // Novas states para sub-telas nativas
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [selectedClientPhone, setSelectedClientPhone] = useState('');
  const [hairProfile, setHairProfile] = useState({
    curvatura: '3A',
    porosidade: 'Média',
    elasticidade: 'Normal',
    quimicas: 'Nenhuma',
    produtosRecomendados: '',
    observacoes: '',
    sexo: 'Feminino',
    birthdate: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [serviceCategory, setServiceCategory] = useState('Todos');
  const [editingService, setEditingService] = useState(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    category: 'Cabelo',
    description: '',
    price: '',
    priceType: 'Fixo',
    promoPrice: '',
    duration: '60',
    cost: '',
    isPrimary: true,
    scheduledViaWhatsapp: false,
    position: ''
  });

  const [editingProduct, setEditingProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'Shampoo',
    quantity: 0,
    costPrice: 0,
    sellingPrice: 0,
    minStock: 3
  });

  const [financeSubTab, setFinanceSubTab] = useState('dashboard'); // 'dashboard', 'lancamentos'
  const [dateWindow, setDateWindow] = useState('mes');
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return firstDay.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return lastDay.toISOString().split('T')[0];
  });
  const [showFinanceModal, setShowFinanceModal] = useState(false); // manual entry
  const [financeForm, setFinanceForm] = useState({
    type: 'saida',
    description: '',
    value: '',
    paymentMethod: 'Pix',
    date: new Date().toISOString().split('T')[0]
  });
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState('todos');
  const [ledgerMethodFilter, setLedgerMethodFilter] = useState('todos');

  const [configSubTab, setConfigSubTab] = useState('perfil'); // 'perfil', 'horarios', 'politicas', 'whatsapp', 'profissionais'
  const [profForm, setProfForm] = useState({
    name: '',
    avatar: '',
    commissionService: 50,
    commissionProduct: 10,
    phone: '',
    email: '',
    active: true,
    workStart: '09:00',
    workEnd: '19:00',
    lunchStart: '12:00',
    lunchEnd: '13:00',
    daysOff: [0, 1]
  });
  const [editingProfId, setEditingProfId] = useState(null);
  const [showProfFormModal, setShowProfFormModal] = useState(false);

  const [marketingSubTab, setMarketingSubTab] = useState('automacoes'); // 'automacoes', 'logs', 'campanha'
  const [marketingCampaignTarget, setMarketingCampaignTarget] = useState('inativos_30');
  const [marketingCampaignMessage, setMarketingCampaignMessage] = useState(
    'Olá {nome}! Notamos que faz tempo que não corta seus cachos no Studio do Jon. Que tal marcar uma visita? Reserve seu horário: ojonquecortou.com.br'
  );
  const [marketingLogs, setMarketingLogs] = useState([]);
  const [isSendingMarketingCampaign, setIsSendingMarketingCampaign] = useState(false);
  const [marketingCampaignProgress, setMarketingCampaignProgress] = useState(0);
  const [marketingCampaignTotal, setMarketingCampaignTotal] = useState(0);

  const swipeTabTouchRef = useRef({ startX: null, startY: null });

  // 1. Listeners em Tempo Real

  useEffect(() => {
    let unsubBookings;
    let unsubClients;
    let unsubTx;
    let unsubServ;
    let unsubInventory;
    let unsubSettings;
    let unsubPkgs;
    let unsubClientPkgs;
    let unsubAuth;

    // Carregar dados do cache imediatamente (offline-first)
    const hasLocalData = loadLocalMockData();
    if (hasLocalData) setLoading(false);

    if (!db) {
      setIsDemoMode(true);
      setLoading(false);
      return;
    }

    // Timeout de segurança: se Firebase não responder em 7s, mostra dados locais
    let authFired = false;
    const safetyTimer = setTimeout(() => {
      if (!authFired) {
        console.warn('Firebase timeout — usando cache local.');
        setConnectionWarning(true);
        setLoading(false);
      }
    }, 7000);

    // Carrega dados via Firestore REST API (HTTP puro — não usa WebChannel/streaming)
    // O REST API funciona corretamente em PWA com Service Worker ativo.
    const setupListeners = async (idToken) => {
      try {
        const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
        if (!projectId || projectId === 'undefined') {
          setSyncError('Configuração Firebase ausente. Verifique as variáveis de ambiente.');
          setLoading(false);
          return;
        }
        setSyncError(null);
        // ── FETCH IMEDIATO via REST API ─────────────────────────────────
        const [
          bookingsList,
          clientsList,
          txList,
          servList,
          inventoryList,
          packagesList,
          clientPkgsList,
          settingsData
        ] = await Promise.allSettled([
          fetchCollectionRest('bookings', idToken),
          fetchCollectionRest('client_profiles', idToken),
          fetchCollectionRest('financial_transactions', idToken),
          fetchCollectionRest('services', idToken),
          fetchCollectionRest('products', idToken),
          fetchCollectionRest('packages', idToken),
          fetchCollectionRest('client_packages', idToken),
          fetchDocRest('settings', 'studio', idToken)
        ]);

        let errors = [];

        if (bookingsList.status === 'fulfilled') {
          setBookings(bookingsList.value);
          localStorage.setItem('demo_bookings', JSON.stringify(bookingsList.value));
        } else {
          console.error('Erro ao buscar bookings:', bookingsList.reason?.message);
          errors.push(`Agendamentos: ${bookingsList.reason?.message}`);
        }
        if (clientsList.status === 'fulfilled') {
          setClients(clientsList.value);
          localStorage.setItem('demo_client_profiles', JSON.stringify(clientsList.value));
        } else {
          console.error('Erro ao buscar clients:', clientsList.reason?.message);
          errors.push(`Clientes: ${clientsList.reason?.message}`);
        }
        if (txList.status === 'fulfilled') {
          setTransactions(txList.value);
          localStorage.setItem('demo_transactions', JSON.stringify(txList.value));
          localStorage.setItem('demo_financial', JSON.stringify(txList.value));
        } else {
          console.error('Erro ao buscar transações:', txList.reason?.message);
          errors.push(`Finanças: ${txList.reason?.message}`);
        }
        if (servList.status === 'fulfilled') {
          const list = servList.value;
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
        } else {
          console.error('Erro ao buscar serviços:', servList.reason?.message);
          errors.push(`Serviços: ${servList.reason?.message}`);
        }
        if (inventoryList.status === 'fulfilled') {
          setInventory(inventoryList.value);
          localStorage.setItem('demo_inventory', JSON.stringify(inventoryList.value));
        } else {
          console.error('Erro ao buscar estoque:', inventoryList.reason?.message);
          errors.push(`Estoque: ${inventoryList.reason?.message}`);
        }
        if (packagesList.status === 'fulfilled') {
          setPackages(packagesList.value);
          localStorage.setItem('demo_packages', JSON.stringify(packagesList.value));
        } else {
          console.error('Erro ao buscar packages:', packagesList.reason?.message);
          errors.push(`Pacotes: ${packagesList.reason?.message}`);
        }
        if (clientPkgsList.status === 'fulfilled') {
          setClientPackages(clientPkgsList.value);
          localStorage.setItem('demo_client_packages', JSON.stringify(clientPkgsList.value));
        } else {
          console.error('Erro ao buscar client packages:', clientPkgsList.reason?.message);
          errors.push(`Pacotes adquiridos: ${clientPkgsList.reason?.message}`);
        }
        if (settingsData.status === 'fulfilled' && settingsData.value) {
          setSettings(settingsData.value);
          localStorage.setItem('demo_studio_settings', JSON.stringify(settingsData.value));
        } else if (settingsData.status === 'rejected') {
          console.error('Erro ao buscar settings:', settingsData.reason?.message);
          errors.push(`Ajustes: ${settingsData.reason?.message}`);
        }

        if (errors.length > 0) {
          setSyncError(errors.join(' | '));
        }

        setLoading(false);

        // ── REAL-TIME (onSnapshot) ────────────────────────────────────────
        // Filtra para evitar que snapshots vazios vindos do cache offline sobrescrevam os dados do REST
        unsubBookings = onSnapshot(collection(db, 'bookings'), (snapshot) => {
          const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setBookings(prev => {
            if (!snapshot.metadata.fromCache || (list.length > 0 && prev.length === 0)) {
              localStorage.setItem('demo_bookings', JSON.stringify(list));
              return list;
            }
            return prev;
          });
        }, (err) => console.warn('onSnapshot bookings:', err.code || err.message));

        unsubClients = onSnapshot(collection(db, 'client_profiles'), (snapshot) => {
          const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setClients(prev => {
            if (!snapshot.metadata.fromCache || (list.length > 0 && prev.length === 0)) {
              localStorage.setItem('demo_client_profiles', JSON.stringify(list));
              return list;
            }
            return prev;
          });
        }, (err) => console.warn('onSnapshot clients:', err.code || err.message));

        unsubTx = onSnapshot(collection(db, 'financial_transactions'), (snapshot) => {
          const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setTransactions(prev => {
            if (!snapshot.metadata.fromCache || (list.length > 0 && prev.length === 0)) {
              localStorage.setItem('demo_transactions', JSON.stringify(list));
              localStorage.setItem('demo_financial', JSON.stringify(list));
              return list;
            }
            return prev;
          });
        }, (err) => console.warn('onSnapshot transactions:', err.code || err.message));

        unsubServ = onSnapshot(collection(db, 'services'), (snapshot) => {
          const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setServices(prev => {
            if (!snapshot.metadata.fromCache || (list.length > 0 && prev.length === 0)) {
              localStorage.setItem('demo_services', JSON.stringify(list));
              return list;
            }
            return prev;
          });
        }, (err) => console.warn('onSnapshot services:', err.code || err.message));

        unsubInventory = onSnapshot(collection(db, 'products'), (snapshot) => {
          const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setInventory(prev => {
            if (!snapshot.metadata.fromCache || (list.length > 0 && prev.length === 0)) {
              localStorage.setItem('demo_inventory', JSON.stringify(list));
              return list;
            }
            return prev;
          });
        }, (err) => console.warn('onSnapshot products:', err.code || err.message));

        unsubPkgs = onSnapshot(collection(db, 'packages'), (snapshot) => {
          const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setPackages(prev => {
            if (!snapshot.metadata.fromCache || (list.length > 0 && prev.length === 0)) {
              localStorage.setItem('demo_packages', JSON.stringify(list));
              return list;
            }
            return prev;
          });
        }, (err) => console.warn('onSnapshot packages:', err.code || err.message));

        unsubClientPkgs = onSnapshot(collection(db, 'client_packages'), (snapshot) => {
          const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setClientPackages(prev => {
            if (!snapshot.metadata.fromCache || (list.length > 0 && prev.length === 0)) {
              localStorage.setItem('demo_client_packages', JSON.stringify(list));
              return list;
            }
            return prev;
          });
        }, (err) => console.warn('onSnapshot client_packages:', err.code || err.message));

        unsubSettings = onSnapshot(doc(db, 'settings', 'studio'), (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            setSettings(prev => {
              if (!snapshot.metadata.fromCache || prev === null) {
                localStorage.setItem('demo_studio_settings', JSON.stringify(data));
                return data;
              }
              return prev;
            });
          }
        }, (err) => console.warn('onSnapshot settings:', err.code || err.message));

      } catch (e) {
        console.error('Erro ao buscar dados Firebase:', e);
        setSyncError(e.message);
        // Fallback para dados locais
        setIsDemoMode(true);
        setLoading(false);
      }
    };

    unsubAuth = onAuthStateChanged(auth, (user) => {
      authFired = true;
      clearTimeout(safetyTimer);

      if (!user) {
        console.warn('Sem sessão — redirecionando para login.');
        setLoading(false);
        navigate('/admin/login');
        return;
      }

      setIsDemoMode(false);
      setConnectionWarning(false);
      setLoading(false);
      // Pega o ID token para autenticar as chamadas REST
      user.getIdToken(true).then(idToken => setupListeners(idToken)).catch(err => {
        console.error('Erro ao obter ID token:', err);
        setIsDemoMode(true);
      });
    });

    return () => {
      clearTimeout(safetyTimer);
      if (unsubAuth) unsubAuth();
      if (unsubBookings) unsubBookings();
      if (unsubClients) unsubClients();
      if (unsubTx) unsubTx();
      if (unsubServ) unsubServ();
      if (unsubInventory) unsubInventory();
      if (unsubPkgs) unsubPkgs();
      if (unsubClientPkgs) unsubClientPkgs();
      if (unsubSettings) unsubSettings();
    };
  }, []);


  /**
   * Aguarda o Firebase Auth resolver a sessão persistida (IndexedDB).
   * Em mobile/PWA, auth.currentUser pode ser null enquanto o SDK ainda
   * está restaurando a sessão — este helper espera até 8s antes de falhar.
   */
  const waitForCurrentUser = (timeoutMs = 8000) =>
    new Promise((resolve, reject) => {
      if (auth?.currentUser) {
        resolve(auth.currentUser);
        return;
      }
      const timer = setTimeout(() => {
        unsubscribe();
        reject(new Error('Sessão expirada. Faça login novamente.'));
      }, timeoutMs);
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          clearTimeout(timer);
          unsubscribe();
          resolve(user);
        }
      });
    });

  const handleManualSync = async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncError(null);
    try {
      // Usa waitForCurrentUser em vez de auth.currentUser direto para evitar
      // a race condition no mobile/PWA onde o IndexedDB ainda está restaurando a sessão.
      const user = await waitForCurrentUser();
      if (!user) throw new Error('Sessão expirada. Faça login novamente.');

      // Força renovação do ID token para evitar token expirado
      const idToken = await user.getIdToken(true);
      
      const [
        bookingsList,
        clientsList,
        txList,
        servList,
        inventoryList,
        packagesList,
        clientPkgsList,
        settingsData
      ] = await Promise.allSettled([
        fetchCollectionRest('bookings', idToken),
        fetchCollectionRest('client_profiles', idToken),
        fetchCollectionRest('financial_transactions', idToken),
        fetchCollectionRest('services', idToken),
        fetchCollectionRest('products', idToken),
        fetchCollectionRest('packages', idToken),
        fetchCollectionRest('client_packages', idToken),
        fetchDocRest('settings', 'studio', idToken)
      ]);

      let errors = [];

      if (bookingsList.status === 'fulfilled') {
        setBookings(bookingsList.value);
        localStorage.setItem('demo_bookings', JSON.stringify(bookingsList.value));
      } else {
        errors.push(`Agendamentos: ${bookingsList.reason?.message}`);
      }

      if (clientsList.status === 'fulfilled') {
        setClients(clientsList.value);
        localStorage.setItem('demo_client_profiles', JSON.stringify(clientsList.value));
      } else {
        errors.push(`Clientes: ${clientsList.reason?.message}`);
      }

      if (txList.status === 'fulfilled') {
        setTransactions(txList.value);
        localStorage.setItem('demo_transactions', JSON.stringify(txList.value));
        localStorage.setItem('demo_financial', JSON.stringify(txList.value));
      } else {
        errors.push(`Finanças: ${txList.reason?.message}`);
      }

      if (servList.status === 'fulfilled') {
        setServices(servList.value);
        localStorage.setItem('demo_services', JSON.stringify(servList.value));
      } else {
        errors.push(`Serviços: ${servList.reason?.message}`);
      }

      if (inventoryList.status === 'fulfilled') {
        setInventory(inventoryList.value);
        localStorage.setItem('demo_inventory', JSON.stringify(inventoryList.value));
      } else {
        errors.push(`Estoque: ${inventoryList.reason?.message}`);
      }

      if (packagesList.status === 'fulfilled') {
        setPackages(packagesList.value);
        localStorage.setItem('demo_packages', JSON.stringify(packagesList.value));
      } else {
        errors.push(`Pacotes: ${packagesList.reason?.message}`);
      }

      if (clientPkgsList.status === 'fulfilled') {
        setClientPackages(clientPkgsList.value);
        localStorage.setItem('demo_client_packages', JSON.stringify(clientPkgsList.value));
      } else {
        errors.push(`Pacotes adquiridos: ${clientPkgsList.reason?.message}`);
      }

      if (settingsData.status === 'fulfilled' && settingsData.value) {
        setSettings(settingsData.value);
        localStorage.setItem('demo_studio_settings', JSON.stringify(settingsData.value));
      } else if (settingsData.status === 'rejected') {
        errors.push(`Ajustes: ${settingsData.reason?.message}`);
      }

      if (errors.length > 0) {
        const errorString = errors.join(' | ');
        setSyncError(errorString);
        alert(`Sincronização parcial com erros:\n${errors.join('\n')}`);
      } else {
        alert('Sincronização manual concluída com sucesso!');
      }
    } catch (e) {
      console.error('Erro na sincronização manual:', e);
      setSyncError(e.message);
      if (e.message?.includes('Sessão expirada') || !auth.currentUser) {
        navigate('/admin/login');
      } else {
        alert(`Erro na sincronização: ${e.message}`);
      }
    } finally {
      setSyncing(false);
    }
  };

  const loadLocalMockData = () => {
    const savedBookings = localStorage.getItem('demo_bookings');
    const savedClients = localStorage.getItem('demo_client_profiles');
    const savedTransactions = localStorage.getItem('demo_transactions');
    const savedServices = localStorage.getItem('demo_services');
    const savedInventory = localStorage.getItem('demo_inventory');
    const savedPackages = localStorage.getItem('demo_packages');
    const savedClientPackages = localStorage.getItem('demo_client_packages');
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
    if (savedPackages) setPackages(JSON.parse(savedPackages));
    if (savedClientPackages) setClientPackages(JSON.parse(savedClientPackages));
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
    // Retorna true se algum dado foi encontrado no cache
    return !!(savedBookings || savedClients || savedTransactions || savedServices);
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
              icon: '/jon-perfil.webp',
              tag: id,
              vibrate: [200, 100, 200, 100, 200]
            });
          });
        } else {
          new Notification(title, {
            body: message,
            icon: '/jon-perfil.webp',
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

  const isSlotBlocked = (prof, dateStr, slot) => {
    if (!prof) return false;
    
    // 1. Check daysOff
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const weekday = dateObj.getDay();
      const daysOff = prof.daysOff !== undefined ? prof.daysOff : [0, 1];
      if (daysOff.includes(weekday)) return true;
    }

    // 2. Check blocked dates
    const blockedDates = prof.blockedDates || [];
    if (blockedDates.includes(dateStr)) return true;

    // 3. Check work hours and lunch hours
    const workStart = prof.workStart || '09:00';
    const workEnd = prof.workEnd || '19:00';
    const lunchStart = prof.lunchStart || '12:00';
    const lunchEnd = prof.lunchEnd || '13:00';

    const [slotH, slotM] = slot.split(':').map(Number);
    const [startH, startM] = workStart.split(':').map(Number);
    const [endH, endM] = workEnd.split(':').map(Number);
    const [lunchStartH, lunchStartM] = lunchStart.split(':').map(Number);
    const [lunchEndH, lunchEndM] = lunchEnd.split(':').map(Number);

    const slotMin = slotH * 60 + slotM;
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;
    const lunchStartMin = lunchStartH * 60 + lunchStartM;
    const lunchEndMin = lunchEndH * 60 + lunchEndM;

    // Outside work hours
    if (slotMin < startMin || slotMin >= endMin) return true;
    // Inside lunch hours
    if (slotMin >= lunchStartMin && slotMin < lunchEndMin) return true;

    return false;
  };

  const runPollerChecks = () => {
    if (!bookings || bookings.length === 0) return;

    const now = new Date();
    const nowTime = now.getTime();

    // 1. Check for New Bookings (created in the last 60 seconds)
    bookings.forEach(booking => {
      if (booking.createdAt && booking.status === 'pendente') {
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
      if (booking.status !== 'cancelado' && booking.status !== 'bloqueado' && booking.date && booking.time) {
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
      if (booking.status !== 'cancelado' && booking.status !== 'bloqueado' && booking.date) {
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

  // 2. Auxiliares Financeiros (Mês ou Semana)
  const getFinancialStats = () => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentYear = now.getFullYear();
    
    let filteredTx = [];
    
    if (businessPeriod === 'semana') {
      const wDays = getWeekDays(todayStr);
      filteredTx = transactions.filter(t => t.date && wDays.includes(t.date));
    } else {
      const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
      const monthPrefix = `${currentYear}-${currentMonth}`;
      filteredTx = transactions.filter(t => t.date && t.date.startsWith(monthPrefix));
    }

    const receitas = filteredTx.filter(t => t.type === 'entrada').reduce((sum, t) => sum + (t.value || 0), 0);
    const despesas = filteredTx.filter(t => t.type === 'saida').reduce((sum, t) => sum + (t.value || 0), 0);

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

  const handleWeekChange = (weeks) => {
    const d = new Date(currentDate + 'T00:00:00');
    d.setDate(d.getDate() + weeks * 7);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  const handleMonthChange = (months) => {
    const d = new Date(currentDate + 'T00:00:00');
    d.setMonth(d.getMonth() + months);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  // ── Swipe para navegar na agenda ──────────────────────────────────
  const handleSwipeStart = (e) => {
    const touch = e.changedTouches[0];
    swipeTouchRef.current = { startX: touch.clientX, startY: touch.clientY };
  };

  const handleSwipeEnd = (e) => {
    const { startX, startY } = swipeTouchRef.current;
    if (startX === null) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    // Ignora gestos mais verticais do que horizontais (scroll normal)
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    const direction = dx < 0 ? 1 : -1; // esquerda = próximo (+1), direita = anterior (-1)
    if (agendaView === 'diario') handleDateChange(direction);
    else if (agendaView === 'semanal') handleWeekChange(direction);
    else if (agendaView === 'mensal') handleMonthChange(direction);
    swipeTouchRef.current = { startX: null, startY: null };
  };
  // ─────────────────────────────────────────────────────────────────

  const getWeekDays = (dateStr) => {
    const current = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = current.getDay();
    const start = new Date(current);
    start.setDate(current.getDate() - dayOfWeek);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  };

  const timeToMin = (t) => {
    if (!t || typeof t !== 'string' || !t.includes(':')) return 0;
    const [h, m] = t.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const getDaysInMonth = (dateStr) => {
    const [year, month] = dateStr.split('-').map(Number);
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);
    
    const startDay = startOfMonth.getDay();
    const daysInMonth = endOfMonth.getDate();
    
    const calendarCells = [];
    for (let i = 0; i < startDay; i++) {
      calendarCells.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const dayStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      calendarCells.push(dayStr);
    }
    return calendarCells;
  };

  const getDaysInMonthGrid = (dateStr) => {
    const [year, month] = dateStr.split('-').map(Number);
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);
    
    const startDay = startOfMonth.getDay();
    const daysInMonth = endOfMonth.getDate();
    
    const grid = [];
    
    // Previous month padding
    const prevMonthEnd = new Date(year, month - 1, 0);
    const prevMonthDays = prevMonthEnd.getDate();
    const prevYear = prevMonthEnd.getFullYear();
    const prevMon = prevMonthEnd.getMonth() + 1;
    
    for (let i = startDay - 1; i >= 0; i--) {
      const dNum = prevMonthDays - i;
      grid.push({
        dateStr: `${prevYear}-${String(prevMon).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`,
        dayNum: dNum,
        isCurrentMonth: false
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      grid.push({
        dateStr: `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
        dayNum: i,
        isCurrentMonth: true
      });
    }
    
    // Next month padding to reach exactly 42 cells (6 rows)
    const totalCells = 42;
    const remaining = totalCells - grid.length;
    const nextMonthStart = new Date(year, month, 1);
    const nextYear = nextMonthStart.getFullYear();
    const nextMon = nextMonthStart.getMonth() + 1;
    
    for (let i = 1; i <= remaining; i++) {
      grid.push({
        dateStr: `${nextYear}-${String(nextMon).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
        dayNum: i,
        isCurrentMonth: false
      });
    }
    
    return grid;
  };

  const getDayBlocks = (prof, dStr) => {
    if (!prof) return [];
    
    const parts = dStr.split('-');
    if (parts.length !== 3) return [];
    const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const weekday = dateObj.getDay();
    const blocks = [];
    
    // 1. Day off
    if ((prof.daysOff || []).includes(weekday)) {
      blocks.push({ start: '10:00', end: '19:00', label: 'Folga' });
      return blocks;
    }
    
    // 2. Blocked date
    if ((prof.blockedDates || []).includes(dStr)) {
      blocks.push({ start: '10:00', end: '19:00', label: 'Bloqueado' });
      return blocks;
    }
    
    // 3. Recurring weekday blocks: "weekday-HH:MM-HH:MM"
    const weekdayBlocks = prof.blockedWeekdayHours || [];
    weekdayBlocks.forEach(block => {
      const segments = block.split('-');
      if (Number(segments[0]) === weekday) {
        const start = segments[1];
        const end = segments[2] || '19:00';
        blocks.push({ start, end, label: 'Bloqueio' });
      }
    });
    
    // 4. Specific date blocks: "YYYY-MM-DD-HH:MM-HH:MM"
    const specificBlocks = prof.blockedSpecificHours || [];
    specificBlocks.forEach(block => {
      if (block.startsWith(dStr)) {
        const rest = block.substring(dStr.length + 1);
        const restParts = rest.split('-');
        const start = restParts[0];
        const end = restParts[1] || '19:00';
        blocks.push({ start, end, label: 'Bloqueado' });
      }
    });
    
    return blocks;
  };

  // 4. Fluxo de Criação de Agendamentos e Bloqueios
  const handleSlotClick = (timeStr) => {
    const match = bookings.find(b => b.date === currentDate && b.time === timeStr && b.status !== 'cancelado');
    
    const timeToMin = (t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const slotMin = timeToMin(timeStr);
    
    const ongoingMatch = !match && bookings.find(b => {
      if (b.date !== currentDate || b.status === 'cancelado') return false;
      const bStart = timeToMin(b.time);
      const bEnd = bStart + (b.duration || 60);
      return bStart < slotMin && slotMin < bEnd;
    });

    if (match || ongoingMatch) {
      setSelectedBooking(match || ongoingMatch);
    } else {
      const jonProf = settings?.professionals?.find(p => p.id === 'jon');
      const blockedBySettings = isSlotBlocked(jonProf, currentDate, timeStr);
      
      if (blockedBySettings) {
        if (!confirm('Este horário está bloqueado pelas configurações de escala do profissional. Deseja agendar mesmo assim?')) {
          return;
        }
      }

      setEditingBookingId(null);
      setSelectedSlot({ date: currentDate, time: timeStr });
      setShowSlotActionModal(true);
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

  const logPrepaymentTransaction = async (bookingId, payload, amount) => {
    if (amount <= 0) return;
    const tx = {
      bookingId: bookingId,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      clientName: payload.clientName,
      clientPhone: payload.clientPhone || '',
      type: 'entrada',
      paymentMethod: 'Pix',
      value: amount,
      description: `Adiantamento/Sinal: ${payload.service?.name || payload.serviceName || 'Serviço'} - ${payload.clientName}`,
      professionalId: payload.profissional || 'jon',
      createdAt: new Date().toISOString()
    };

    if (isDemoMode) {
      const localTx = localStorage.getItem('demo_financial') || localStorage.getItem('demo_transactions');
      const currentTx = localTx ? JSON.parse(localTx) : [];
      const newTx = { id: 'tx_' + Date.now(), ...tx };
      const updatedTxList = [newTx, ...currentTx];
      localStorage.setItem('demo_financial', JSON.stringify(updatedTxList));
      localStorage.setItem('demo_transactions', JSON.stringify(updatedTxList));
      setTransactions(updatedTxList);
    } else {
      await addDoc(collection(db, 'financial_transactions'), tx);
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
      servicePrice: Number(newBooking.servicePrice) || (services[0]?.promoPrice || services[0]?.price || 150),
      prepayment: Number(newBooking.prepayment) || 0,
      date: newBooking.date,
      time: newBooking.time,
      notes: newBooking.notes,
      status: 'confirmado',
      createdAt: new Date().toISOString()
    };

    const isEditing = !!editingBookingId;
    try {
      if (editingBookingId) {
        const oldBooking = bookings.find(b => b.id === editingBookingId);
        const oldPrepayment = oldBooking ? (Number(oldBooking.prepayment) || 0) : 0;
        const newPrepayment = Number(newBooking.prepayment) || 0;

        if (isDemoMode) {
          const local = bookings.map(b => b.id === editingBookingId ? { ...b, ...payload } : b);
          setBookings(local);
          localStorage.setItem('demo_bookings', JSON.stringify(local));
        } else {
          const apptRef = doc(db, 'bookings', editingBookingId);
          await updateDoc(apptRef, payload);
          syncBookingToGoogle(editingBookingId).catch(err => console.warn(err));
        }

        if (newPrepayment > oldPrepayment) {
          await logPrepaymentTransaction(editingBookingId, payload, newPrepayment - oldPrepayment);
        }
      } else {
        if (isDemoMode) {
          const generatedId = 'demo-' + Date.now();
          const local = [...bookings, { id: generatedId, ...payload }];
          setBookings(local);
          localStorage.setItem('demo_bookings', JSON.stringify(local));
          await logPrepaymentTransaction(generatedId, payload, payload.prepayment);
        } else {
          const docRef = await addDoc(collection(db, 'bookings'), payload);
          await logPrepaymentTransaction(docRef.id, payload, payload.prepayment);
          syncBookingToGoogle(docRef.id).catch(err => console.warn(err));
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

      // Enviar e-mail de confirmação ou atualização de agendamento manual
      if (payload.clientEmail && payload.clientEmail.includes('@')) {
        try {
          const displayDate = payload.date.split('-').reverse().join('/');
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: isEditing ? 'agendamento_editado' : 'horario_confirmado',
              id: isEditing ? editingBookingId : undefined,
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
          console.warn('Falha ao enviar email de confirmação/edição no cadastro manual', err);
        }
      }

      setShowAddBookingModal(false);
      resetBookingForm();
      const isEdit = !!editingBookingId;
      setEditingBookingId(null);
      alert(isEdit ? 'Agendamento atualizado com sucesso!' : 'Agendamento confirmado!');
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
          addDoc(collection(db, 'bookings'), { ...basePayload, time: slot }).then(docRef => {
            syncBookingToGoogle(docRef.id).catch(err => console.warn(err));
            return docRef;
          })
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

  const handleImportContact = async () => {
    const isSupported = navigator.contacts && typeof navigator.contacts.select === 'function';
    if (!isSupported) {
      alert('Seu dispositivo ou navegador não suporta a importação automática de contatos.\n\nPara usar este recurso no Android, certifique-se de estar usando o Chrome ou um navegador baseado em Chromium e de que o site está rodando em ambiente seguro (HTTPS). No iOS (Safari/Chrome), este recurso nativo não está disponível na plataforma web.');
      return;
    }
    try {
      const props = ['name', 'tel'];
      const opts = { multiple: false };
      const contacts = await navigator.contacts.select(props, opts);
      if (contacts && contacts.length > 0) {
        const c = contacts[0];
        const name = c.name && c.name.length > 0 ? c.name[0] : '';
        const phone = c.tel && c.tel.length > 0 ? c.tel[0].replace(/\D/g, '') : '';
        setNewClient(prev => ({ ...prev, name, phone }));
      }
    } catch (err) {
      console.error('Erro ao importar contato:', err);
    }
  };

  // 5. Cadastrar Novo Cliente
  const submitClient = async (e) => {
    e.preventDefault();
    const cleanPhone = newClient.phone.replace(/\D/g, '');
    const payload = {
      name: newClient.name.trim(),
      phone: cleanPhone,
      email: newClient.email || 'Não informado',
      curvatura: newClient.curvatura || '3A',
      porosidade: 'Média',
      elasticidade: 'Normal',
      quimicas: 'Nenhuma',
      produtosRecomendados: '',
      observacoes: newClient.observacoes || '',
      sexo: 'Feminino',
      birthdate: newClient.birthdate || '',
      createdAt: new Date().toISOString()
    };

    try {
      if (isDemoMode) {
        const local = [...clients, { id: cleanPhone, ...payload }];
        setClients(local);
        localStorage.setItem('demo_client_profiles', JSON.stringify(local));
      } else {
        await setDoc(doc(db, 'client_profiles', cleanPhone), payload);
        // Atualiza a lista local de clientes para que o novo cliente apareça imediatamente
        setClients(prev => [...prev.filter(c => c.phone !== cleanPhone), payload]);
      }

      // Auto-preenche o formulário de agendamento com os dados do cliente recém-criado
      if (showAddBookingModal) {
        setNewBooking(prev => ({
          ...prev,
          clientName: payload.name,
          clientPhone: payload.phone,
          clientEmail: payload.email === 'Não informado' ? '' : payload.email
        }));
      }

      setShowAddClientModal(false);
      setNewClient({ name: '', phone: '', email: '', curvatura: '3A', observacoes: '', birthdate: '' });
      alert('Cliente cadastrado com sucesso!');
    } catch (e) {
      console.error('Erro ao cadastrar cliente:', e);
      alert('Falha ao cadastrar cliente.');
    }
  };

  // 6. Fechamento de Comanda (Checkout)
  const openCheckout = (booking) => {
    setCheckoutBooking(booking);
    setSelectedBooking(null);
    setSelectedProducts([]);
    setSelectedExtraServices([]);
    setDiscount(0);
    setSellingPackageId('');
    setUsingClientPackageId('');
    setShowCheckoutModal(true);
  };

  const submitCheckout = async () => {
    if (!checkoutBooking) return;
    const baseServicePrice = usingClientPackageId 
      ? 0 
      : (sellingPackageId 
          ? (packages.find(p => p.id === sellingPackageId)?.price || 0)
          : (checkoutBooking.service?.promoPrice || checkoutBooking.service?.price || checkoutBooking.servicePrice || 150)
        );
    const extrasTotal = selectedExtraServices.reduce((acc, s) => acc + s.price, 0);
    const productsTotal = selectedProducts.reduce((acc, p) => acc + (p.sellingPrice * p.qty), 0);
    const prepay = checkoutBooking.prepayment ? Number(checkoutBooking.prepayment) : 0;
    const value = Math.max(0, baseServicePrice + extrasTotal + productsTotal - discount - prepay);
    
    let description = sellingPackageId 
      ? `Compra de Pacote: ${packages.find(p => p.id === sellingPackageId)?.name || 'Pacote'}`
      : (checkoutBooking.service?.name || checkoutBooking.serviceName || 'Serviço Base');
    
    if (selectedExtraServices.length > 0) {
      description += ` + Extras: ${selectedExtraServices.map(s => s.name).join(', ')}`;
    }
    if (selectedProducts.length > 0) {
      description += ` + ${selectedProducts.map(p => `${p.qty}x ${p.name}`).join(', ')}`;
    }
    if (discount > 0) {
      description += ` (Desconto: R$ ${discount})`;
    }
    if (prepay > 0) {
      description += ` (Sinal/Adiantamento: -R$ ${prepay})`;
    }
 
    const baseMethodLabel = usingClientPackageId 
      ? `Pacote (Débito)` 
      : (paymentMethod === 'Cartão de Crédito' ? `Cartão de Crédito (${installments})` : paymentMethod);
 
    const payloadTx = {
      bookingId: checkoutBooking.id,
      date: checkoutBooking.date || new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      clientName: checkoutBooking.clientName,
      clientPhone: checkoutBooking.clientPhone || '',
      type: 'entrada',
      paymentMethod: baseMethodLabel,
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
    const mainServiceCost = mainService ? (Number(mainService.cost) || 0) : 0;
    const extraServicesCost = selectedExtraServices.reduce((sum, item) => {
      const match = services.find(s => s.name === item.name);
      return sum + (match ? (Number(match.cost) || 0) : 0);
    }, 0);
    const totalServiceCost = mainServiceCost + extraServicesCost;
    const serviceId = mainService ? mainService.id : '';

    try {
      // 1. Process Packages (Sale or Debit)
      if (sellingPackageId) {
        const pkgTemplate = packages.find(p => p.id === sellingPackageId);
        const initialBalance = {};
        if (pkgTemplate && pkgTemplate.services) {
          pkgTemplate.services.forEach(s => {
            initialBalance[s.serviceId] = s.sessions;
          });
        }
        if (serviceId && initialBalance[serviceId] !== undefined) {
          initialBalance[serviceId] = Math.max(0, initialBalance[serviceId] - 1);
        }

        const clientPackagePayload = {
          clientId: checkoutBooking.clientPhone || checkoutBooking.clientName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          clientName: checkoutBooking.clientName,
          clientPhone: checkoutBooking.clientPhone || '',
          packageId: sellingPackageId,
          packageName: pkgTemplate ? pkgTemplate.name : 'Pacote',
          pricePaid: pkgTemplate ? pkgTemplate.price : 0,
          paymentMethod: baseMethodLabel,
          datePurchased: checkoutBooking.date || new Date().toISOString().split('T')[0],
          status: 'active',
          balance: initialBalance,
          usage: [
            {
              bookingId: checkoutBooking.id,
              dateUsed: checkoutBooking.date || new Date().toISOString().split('T')[0],
              serviceId
            }
          ]
        };

        if (isDemoMode) {
          const local = localStorage.getItem('demo_client_packages');
          const current = local ? JSON.parse(local) : [];
          const newCp = { id: 'cp_' + Date.now(), ...clientPackagePayload };
          const updatedCp = [newCp, ...current];
          localStorage.setItem('demo_client_packages', JSON.stringify(updatedCp));
          setClientPackages(updatedCp);
        } else {
          await addDoc(collection(db, 'client_packages'), clientPackagePayload);
        }
      }

      if (usingClientPackageId) {
        if (isDemoMode) {
          const local = localStorage.getItem('demo_client_packages');
          if (local) {
            const arr = JSON.parse(local);
            const updated = arr.map(cp => {
              if (cp.id === usingClientPackageId) {
                const newBalance = { ...cp.balance };
                if (newBalance[serviceId] !== undefined) {
                  newBalance[serviceId] = Math.max(0, newBalance[serviceId] - 1);
                }
                const isFinished = Object.values(newBalance).every(val => val === 0);
                return {
                  ...cp,
                  balance: newBalance,
                  status: isFinished ? 'finished' : 'active',
                  usage: [...(cp.usage || []), {
                    bookingId: checkoutBooking.id,
                    dateUsed: checkoutBooking.date || new Date().toISOString().split('T')[0],
                    serviceId
                  }]
                };
              }
              return cp;
            });
            localStorage.setItem('demo_client_packages', JSON.stringify(updated));
            setClientPackages(updated);
          }
        } else {
          const cpRef = doc(db, 'client_packages', usingClientPackageId);
          const cpSnap = await getDoc(cpRef);
          if (cpSnap.exists()) {
            const cpData = cpSnap.data();
            const newBalance = { ...cpData.balance };
            if (newBalance[serviceId] !== undefined) {
              newBalance[serviceId] = Math.max(0, newBalance[serviceId] - 1);
            }
            const isFinished = Object.values(newBalance).every(val => val === 0);
            const newUsage = [...(cpData.usage || []), {
              bookingId: checkoutBooking.id,
              dateUsed: checkoutBooking.date || new Date().toISOString().split('T')[0],
              serviceId
            }];
            await updateDoc(cpRef, {
              balance: newBalance,
              status: isFinished ? 'finished' : 'active',
              usage: newUsage
            });
          }
        }
      }

      if (isDemoMode) {
        // Atualiza booking
        const updatedB = bookings.map(b => b.id === checkoutBooking.id ? { 
          ...b, 
          status: 'finalizado',
          isPackageUse: !!usingClientPackageId,
          isPackageAcquisition: !!sellingPackageId,
          packageUsedId: usingClientPackageId || null,
          packageSoldId: sellingPackageId || null
        } : b);
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
            paymentMethod: usingClientPackageId ? 'Pacote (Débito)' : paymentMethod,
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
        await updateDoc(apptRef, { 
          status: 'finalizado',
          isPackageUse: !!usingClientPackageId,
          isPackageAcquisition: !!sellingPackageId,
          packageUsedId: usingClientPackageId || null,
          packageSoldId: sellingPackageId || null
        });
        syncBookingToGoogle(checkoutBooking.id).catch(err => console.warn(err));
        await addDoc(collection(db, 'financial_transactions'), payloadTx);

        if (totalServiceCost > 0) {
          const serviceCostTx = {
            bookingId: checkoutBooking.id,
            date: checkoutBooking.date || new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            clientName: checkoutBooking.clientName,
            clientPhone: checkoutBooking.clientPhone || '',
            type: 'saida',
            paymentMethod: usingClientPackageId ? 'Pacote (Débito)' : paymentMethod,
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
      setActiveTab('inicio');
      alert('Comanda fechada com sucesso! Receita, despesa de custo de serviço e baixa no estoque registradas.');
    } catch (e) {
      alert('Erro ao fechar comanda.');
    }
  };

  // Venda Avulsa de Produtos
  const submitDirectSale = async (e) => {
    if (e) e.preventDefault();
    if (directSaleProducts.length === 0) {
      alert('Selecione pelo menos um produto para dar baixa.');
      return;
    }

    const productsTotal = directSaleProducts.reduce((acc, p) => acc + (p.sellingPrice * p.qty), 0);
    const costTotal = directSaleProducts.reduce((acc, p) => {
      const match = inventory.find(prod => prod.id === p.id);
      const cost = match ? (match.costPrice || 0) : 0;
      return acc + (cost * p.qty);
    }, 0);

    const value = isDirectSaleSalonUse ? costTotal : Math.max(0, productsTotal - directSaleDiscount);
    const clientName = isDirectSaleSalonUse ? 'Uso do Salão' : (directSaleClient.trim() || 'Cliente Avulso');

    let description = isDirectSaleSalonUse 
      ? `Uso do Salão (Baixa de Produto): ${directSaleProducts.map(p => `${p.qty}x ${p.name}`).join(', ')}`
      : `Venda Avulsa de Produto: ${directSaleProducts.map(p => `${p.qty}x ${p.name}`).join(', ')}`;
    if (!isDirectSaleSalonUse && directSaleDiscount > 0) {
      description += ` (Desconto: R$ ${directSaleDiscount})`;
    }

    const payloadTx = {
      bookingId: 'venda_avulsa_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      clientName,
      clientPhone: '',
      type: isDirectSaleSalonUse ? 'saida' : 'entrada',
      paymentMethod: isDirectSaleSalonUse ? 'Consumo' : (directSalePaymentMethod === 'Cartão de Crédito' ? `Cartão de Crédito (${directSaleInstallments})` : directSalePaymentMethod),
      discount: isDirectSaleSalonUse ? 0 : directSaleDiscount,
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
          sellingPrice: isDirectSaleSalonUse ? (match ? (match.costPrice || 0) : 0) : p.sellingPrice,
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
      setIsDirectSaleSalonUse(false);
      setActiveTab('inicio');
      alert(isDirectSaleSalonUse ? 'Baixa para uso do salão registrada com sucesso! Custo deduzido do faturamento.' : 'Venda avulsa registrada com sucesso! Faturamento e estoque atualizados.');
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

  const getWhatsAppFeedbackUrl = (phone, booking) => {
    if (!phone) return '';
    const cleanPhone = phone.replace(/\D/g, '');
    const clientName = booking.clientName || '';
    const firstName = clientName.split(' ')[0];
    const googleLink = 'https://g.page/r/CRmlu0sO48XmEBM/review';
    const message = `${firstName}, obrigado por ter escolhido o Studio hoje.
A confiança que você depositou no processo significa muito pra mim.
Se você sentiu a diferença — me conta no Google. Uma avaliação sua ajuda outras cacheadas que ainda não me conhecem a chegar até aqui.
${googleLink}
— Jon`;
    return `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
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
        syncBookingToGoogle(bookingId).catch(err => console.warn(err));

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
      
      // Enviar e-mail de cancelamento
      if (booking && booking.clientEmail && booking.clientEmail.includes('@')) {
        try {
          const displayDate = booking.date.split('-').reverse().join('/');
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'agendamento_cancelado',
              clientEmail: booking.clientEmail,
              clientName: booking.clientName,
              serviceName: booking.service?.name || booking.serviceName || 'Serviço',
              date: displayDate,
              time: booking.time,
              cancelledBy: 'admin'
            })
          });
        } catch(err) {
          console.warn('Falha ao enviar email de cancelamento', err);
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
        syncBookingToGoogle(bookingId).catch(err => console.warn(err));
      }
      
      setSelectedBooking(prev => prev ? { ...prev, status: 'confirmado' } : null);
      
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

      // Enviar WA ao cliente confirmando o agendamento
      if (bookingToConfirm?.clientPhone) {
        try {
          const s = settings;
          const gateway = s?.waReminderGateway || 'evolution';
          if (s?.waReminderEnabled) {
            const cleanPhone = (bookingToConfirm.clientPhone || '').replace(/\D/g, '');
            const waNumber = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
            const firstName = (bookingToConfirm.clientName || 'Cliente').split(' ')[0];
            const dataBr = bookingToConfirm.date.split('-').reverse().join('/');
            const svcName = bookingToConfirm.service?.name || bookingToConfirm.serviceName || 'serviço';
            const msg = `Olá, ${firstName}! ✅ Seu agendamento foi confirmado pelo Studio do Jon.\n\n📅 *${dataBr}* às *${bookingToConfirm.time}*\n✂️ *${svcName}*\n\nTe esperamos! Qualquer dúvida é só responder aqui. 💇‍♂️`;

            let waUrl = '';
            let waHeaders = { 'Content-Type': 'application/json' };
            let waBody = {};

            if (gateway === 'evolution' && s?.evolutionApiUrl && s?.evolutionApiKey && s?.evolutionInstanceName) {
              waUrl = `${s.evolutionApiUrl.replace(/\/$/, '')}/message/sendText/${s.evolutionInstanceName}`;
              waHeaders['apikey'] = s.evolutionApiKey;
              waBody = { number: waNumber, text: msg };
            } else if (gateway === 'zapi' && s?.zApiInstanceId && s?.zApiToken) {
              waUrl = `https://api.z-api.io/instances/${s.zApiInstanceId}/token/${s.zApiToken}/send-text`;
              waBody = { phone: waNumber, message: msg };
            }

            if (waUrl) {
              fetch(waUrl, { method: 'POST', headers: waHeaders, body: JSON.stringify(waBody) })
                .catch(err => console.warn('WA confirmação cliente (mobile):', err));
            }
          }
        } catch (waErr) {
          console.warn('Erro ao enviar WA de confirmação ao cliente (mobile):', waErr);
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
      const booking = bookings.find(b => b.id === bookingId);
      if (isDemoMode) {
        const updated = bookings.map(b => b.id === bookingId ? { ...b, status: 'faltou' } : b);
        setBookings(updated);
        localStorage.setItem('demo_bookings', JSON.stringify(updated));

        const cleanPhone = booking?.clientPhone?.replace(/\D/g, '');
        if (cleanPhone) {
          const localClients = JSON.parse(localStorage.getItem('demo_client_profiles') || '[]');
          const updatedClients = localClients.map(c => c.phone === cleanPhone ? { ...c, blocked: true } : c);
          localStorage.setItem('demo_client_profiles', JSON.stringify(updatedClients));
        }
      } else {
        const docRef = doc(db, 'bookings', bookingId);
        await updateDoc(docRef, { status: 'faltou' });
        syncBookingToGoogle(bookingId).catch(err => console.warn(err));

        const cleanPhone = booking?.clientPhone?.replace(/\D/g, '');
        if (cleanPhone) {
          try {
            const clientRef = doc(db, 'client_profiles', cleanPhone);
            await updateDoc(clientRef, { blocked: true });
          } catch (err) {
            console.warn('Erro ao bloquear cliente no Firestore:', err);
          }
        }
      }
      
      setSelectedBooking(prev => prev ? { ...prev, status: 'faltou' } : null);

      if (booking && booking.clientEmail) {
        try {
          await fetch('/api/send-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'agendamento_falta',
              clientEmail: booking.clientEmail,
              clientName: booking.clientName,
              serviceName: booking.serviceName || booking.service?.name || booking.service || '',
              date: booking.date?.includes('-') ? booking.date.split('-').reverse().join('/') : booking.date,
              rawDate: booking.date,
              time: booking.time,
              duration: booking.duration || booking.service?.duration || 60,
              notes: booking.notes || '',
              professionalName: booking.professionalName || 'Jon'
            })
          });
        } catch (mailErr) {
          console.warn('Erro ao enviar e-mail de falta no mobile:', mailErr);
        }
      }

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
  const activeProfessionalsList = settings?.professionals || [
    { id: 'jon', name: 'Jon', avatar: '/jon-perfil.webp', commission: 50, phone: '31995097613', email: 'jon@studio.com', active: true }
  ];
  const hourSlots = [];
  for (let h = 8; h <= 20; h++) {
    const hs = String(h).padStart(2, '0');
    hourSlots.push(`${hs}:00`);
  }

  // Filtragem dos agendamentos de hoje para a tela Home
  const todayStr = new Date().toISOString().split('T')[0];
  const todayBookings = bookings
    .filter(b => b && b.date === todayStr && b.status !== 'cancelado')
    .sort((a, b) => {
      try {
        return (a.time || '00:00').localeCompare(b.time || '00:00');
      } catch (_) {
        return 0;
      }
    });

  // ─────────────────────────────────────────────────────────────────────────
  // Novas funções auxiliares para sub-telas nativas e Gestos de Swipe
  // ─────────────────────────────────────────────────────────────────────────
  
  // Gestos de Swipe entre abas principais
  const MAIN_TABS = ['inicio', 'agenda', 'comissoes', 'opcoes'];

  const handleTabSwipeStart = (e) => {
    if (MAIN_TABS.indexOf(activeTab) === -1) return;
    if (e.target.closest('.mobile-overlay') || e.target.closest('.mobile-bottom-sheet') || e.target.closest('.mobile-popup-modal')) {
      return;
    }
    const touch = e.changedTouches[0];
    swipeTabTouchRef.current = { startX: touch.clientX, startY: touch.clientY };
  };

  const handleTabSwipeEnd = (e) => {
    const { startX, startY } = swipeTabTouchRef.current;
    if (startX === null) return;
    swipeTabTouchRef.current = { startX: null, startY: null };

    if (activeTab === 'agenda') return;
    if (e.target.closest('.mobile-shortcuts-scroll') || e.target.closest('.service-category-pills') || e.target.closest('.config-sub-tabs') || e.target.closest('.mobile-timeline-scroll')) {
      return;
    }

    const touch = e.changedTouches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;

    if (Math.abs(dx) < 75 || Math.abs(dx) < Math.abs(dy) * 1.3) return;

    const currentIndex = MAIN_TABS.indexOf(activeTab);
    if (currentIndex === -1) return;

    if (dx < 0) {
      if (currentIndex < MAIN_TABS.length - 1) {
        setActiveTab(MAIN_TABS[currentIndex + 1]);
      }
    } else {
      if (currentIndex > 0) {
        setActiveTab(MAIN_TABS[currentIndex - 1]);
      }
    }
  };

  // Clientes - Agrupamento derivado e mesclado
  const getDerivedClients = () => {
    const clientsMap = {};
    // 1. Inserir perfis existentes
    clients.forEach((prof) => {
      if (!prof.phone) return;
      clientsMap[prof.phone] = {
        id: prof.phone,
        name: prof.name || 'Sem nome',
        phone: prof.phone,
        email: prof.email || 'Não informado',
        hairType: prof.curvatura || '3A',
        porosidade: prof.porosidade || 'Média',
        elasticidade: prof.elasticidade || 'Normal',
        quimicas: prof.quimicas || 'Nenhuma',
        produtosRecomendados: prof.produtosRecomendados || '',
        observacoes: prof.observacoes || '',
        sexo: prof.sexo || 'Feminino',
        birthdate: prof.birthdate || '',
        lastVisit: 'Nunca visitou',
        lastServiceName: 'Nenhum'
      };
    });
    // 2. Mesclar com os dados dos agendamentos
    bookings.forEach((appt) => {
      const phone = appt.clientPhone || appt.phone;
      if (!phone) return;
      const dateStr = appt.date;
      const serviceName = appt.service?.name || appt.serviceName || 'Serviço';
      if (!clientsMap[phone]) {
        clientsMap[phone] = {
          id: phone,
          name: appt.clientName || 'Cliente sem nome',
          phone: phone,
          email: appt.clientEmail || appt.email || 'Não informado',
          hairType: appt.hairType || '3A',
          porosidade: 'Média',
          elasticidade: 'Normal',
          quimicas: 'Nenhuma',
          produtosRecomendados: '',
          observacoes: appt.notes || '',
          sexo: appt.sexo || 'Feminino',
          birthdate: appt.clientBirthdate || appt.birthdate || '',
          lastVisit: dateStr || 'Nunca visitou',
          lastServiceName: serviceName
        };
      } else {
        if (dateStr && (clientsMap[phone].lastVisit === 'Nunca visitou' || new Date(dateStr) > new Date(clientsMap[phone].lastVisit))) {
          clientsMap[phone].lastVisit = dateStr;
          clientsMap[phone].lastServiceName = serviceName;
        }
        if (appt.hairType && clientsMap[phone].hairType === '3A') {
          clientsMap[phone].hairType = appt.hairType;
        }
        if ((appt.clientBirthdate || appt.birthdate) && !clientsMap[phone].birthdate) {
          clientsMap[phone].birthdate = appt.clientBirthdate || appt.birthdate;
        }
      }
    });
    return Object.values(clientsMap);
  };

  const derivedClientsList = getDerivedClients();

  // Buscar ficha capilar técnica do Firestore/local ao selecionar cliente
  useEffect(() => {
    if (!selectedClientPhone) return;
    const clientProf = clients.find(p => p.phone === selectedClientPhone);
    const clientObj = derivedClientsList.find(c => c.phone === selectedClientPhone);
    
    if (clientProf) {
      setHairProfile({
        name: clientProf.name || clientObj?.name || '',
        email: clientProf.email || clientObj?.email || '',
        phone: clientProf.phone || selectedClientPhone,
        curvatura: clientProf.curvatura || '3A',
        porosidade: clientProf.porosidade || 'Média',
        elasticidade: clientProf.elasticidade || 'Normal',
        quimicas: clientProf.quimicas || 'Nenhuma',
        produtosRecomendados: clientProf.produtosRecomendados || '',
        observacoes: clientProf.observacoes || '',
        sexo: clientProf.sexo || 'Feminino',
        birthdate: clientProf.birthdate || ''
      });
    } else {
      setHairProfile({
        name: clientObj?.name || '',
        email: clientObj?.email || '',
        phone: selectedClientPhone,
        curvatura: clientObj?.hairType || '3A',
        porosidade: 'Média',
        elasticidade: 'Normal',
        quimicas: 'Nenhuma',
        produtosRecomendados: '',
        observacoes: '',
        sexo: clientObj?.sexo || 'Feminino',
        birthdate: ''
      });
    }
  }, [selectedClientPhone, clients]);

  // Salvar ficha técnica capilar
  const handleSaveHairProfile = async (e) => {
    if (e) e.preventDefault();
    if (!selectedClientPhone) return;
    setSavingProfile(true);
    const payload = { ...hairProfile, phone: selectedClientPhone };
    try {
      if (isDemoMode) {
        const local = JSON.parse(localStorage.getItem('demo_client_profiles') || '[]');
        const updated = [...local.filter(c => c.phone !== selectedClientPhone), payload];
        localStorage.setItem('demo_client_profiles', JSON.stringify(updated));
        setClients(updated);
      } else {
        await setDoc(doc(db, 'client_profiles', selectedClientPhone), payload, { merge: true });
        setClients(prev => [...prev.filter(c => c.phone !== selectedClientPhone), payload]);
      }
      alert('Ficha capilar técnica atualizada com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar ficha capilar: ' + err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  // Cadastrar novo cliente a partir da sub-tela
  const handleSaveClientFromPanel = async (e) => {
    if (e) e.preventDefault();
    if (!newClient.name || !newClient.phone) {
      alert('Nome e Telefone são campos obrigatórios.');
      return;
    }
    const cleanPhone = newClient.phone.replace(/\D/g, '');
    const payload = {
      name: newClient.name,
      phone: cleanPhone,
      email: newClient.email || 'Não informado',
      curvatura: newClient.curvatura || '3A',
      porosidade: newClient.porosidade || 'Média',
      elasticidade: newClient.elasticidade || 'Normal',
      quimicas: newClient.quimicas || 'Nenhuma',
      produtosRecomendados: newClient.produtosRecomendados || '',
      observacoes: newClient.observacoes || '',
      sexo: newClient.sexo || 'Feminino',
      birthdate: newClient.birthdate || ''
    };
    try {
      if (isDemoMode) {
        const local = JSON.parse(localStorage.getItem('demo_client_profiles') || '[]');
        const updated = [...local.filter(c => c.phone !== cleanPhone), payload];
        localStorage.setItem('demo_client_profiles', JSON.stringify(updated));
        setClients(updated);
      } else {
        await setDoc(doc(db, 'client_profiles', cleanPhone), payload);
        setClients(prev => [...prev.filter(c => c.phone !== cleanPhone), payload]);
      }
      alert('Cliente cadastrado com sucesso!');
      setSelectedClientPhone(cleanPhone);
      setShowAddClientModal(false);
      setNewClient({ name: '', phone: '', email: '', curvatura: '3A', observacoes: '', birthdate: '' });
    } catch (err) {
      console.error(err);
      alert('Erro ao cadastrar cliente.');
    }
  };

  // Serviços - Salvar
  const handleSaveService = async (e) => {
    if (e) e.preventDefault();
    const payload = {
      name: serviceForm.name,
      category: serviceForm.category || 'Cabelo',
      description: serviceForm.description || '',
      price: Number(serviceForm.price) || 0,
      priceType: serviceForm.priceType || 'Fixo',
      promoPrice: serviceForm.promoPrice ? Number(serviceForm.promoPrice) : null,
      duration: Number(serviceForm.duration) || 60,
      cost: serviceForm.cost ? Number(serviceForm.cost) : 0,
      isPrimary: serviceForm.isPrimary ?? true,
      scheduledViaWhatsapp: !!serviceForm.scheduledViaWhatsapp,
      position: serviceForm.position !== '' ? Number(serviceForm.position) : services.length
    };
    try {
      if (editingService) {
        if (isDemoMode) {
          const updated = services.map(s => s.id === editingService.id ? { ...s, ...payload } : s);
          setServices(updated);
          localStorage.setItem('demo_services', JSON.stringify(updated));
        } else {
          await setDoc(doc(db, 'services', editingService.id), payload, { merge: true });
        }
      } else {
        const id = serviceForm.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        if (isDemoMode) {
          const updated = [...services, { id, ...payload }];
          setServices(updated);
          localStorage.setItem('demo_services', JSON.stringify(updated));
        } else {
          await setDoc(doc(db, 'services', id), payload);
        }
      }
      setShowServiceModal(false);
      setEditingService(null);
      alert('Serviço salvo com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar serviço.');
    }
  };

  // Serviços - Excluir
  const handleDeleteService = async (id) => {
    if (!confirm('Deseja realmente remover este serviço da grade do salão?')) return;
    try {
      if (isDemoMode) {
        const updated = services.filter(s => s.id !== id);
        setServices(updated);
        localStorage.setItem('demo_services', JSON.stringify(updated));
      } else {
        await deleteDoc(doc(db, 'services', id));
      }
      alert('Serviço removido com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir serviço.');
    }
  };

  // Estoque - Reabastecimento rápido / decremento
  const handleQuickStockAdjust = async (product, amount) => {
    const newQty = Math.max(0, product.quantity + amount);
    try {
      if (isDemoMode) {
        const updated = inventory.map(p => p.id === product.id ? { ...p, quantity: newQty } : p);
        setInventory(updated);
        localStorage.setItem('demo_inventory', JSON.stringify(updated));
      } else {
        await updateDoc(doc(db, 'products', product.id), { quantity: newQty });
      }
      
      // Se for reabastecimento (+), registra despesa automática no financeiro
      if (amount > 0) {
        const cost = amount * (product.costPrice || 20);
        const expensePayload = {
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          clientName: 'Estoque/Almoxarifado',
          type: 'saida',
          paymentMethod: 'Outro',
          value: cost,
          description: `Compra de estoque: ${product.name} (+${amount} un.)`,
          createdAt: new Date().toISOString()
        };
        if (isDemoMode) {
          const updatedFinancial = [{ id: 'tx_' + Date.now(), ...expensePayload }, ...transactions];
          setTransactions(updatedFinancial);
          localStorage.setItem('demo_financial', JSON.stringify(updatedFinancial));
        } else {
          await addDoc(collection(db, 'financial_transactions'), expensePayload);
        }
      }
      alert('Estoque atualizado!');
    } catch (err) {
      console.error(err);
      alert('Erro ao ajustar estoque.');
    }
  };

  // Estoque - Salvar
  const handleSaveProduct = async (e) => {
    if (e) e.preventDefault();
    const payload = {
      name: productForm.name,
      category: productForm.category || 'Shampoo',
      quantity: Number(productForm.quantity) || 0,
      costPrice: Number(productForm.costPrice) || 0,
      sellingPrice: Number(productForm.sellingPrice) || 0,
      minStock: Number(productForm.minStock) || 3
    };
    try {
      if (editingProduct) {
        if (isDemoMode) {
          const updated = inventory.map(p => p.id === editingProduct.id ? { ...p, ...payload } : p);
          setInventory(updated);
          localStorage.setItem('demo_inventory', JSON.stringify(updated));
        } else {
          await updateDoc(doc(db, 'products', editingProduct.id), payload);
        }
      } else {
        if (isDemoMode) {
          const newId = 'p_' + Date.now();
          const updated = [...inventory, { id: newId, ...payload }];
          setInventory(updated);
          localStorage.setItem('demo_inventory', JSON.stringify(updated));
        } else {
          await addDoc(collection(db, 'products'), payload);
        }
      }
      setShowProductModal(false);
      setEditingProduct(null);
      alert('Produto salvo com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar produto.');
    }
  };

  // Estoque - Excluir
  const handleDeleteProduct = async (id) => {
    if (!confirm('Deseja realmente remover este produto do estoque?')) return;
    try {
      if (isDemoMode) {
        const updated = inventory.filter(p => p.id !== id);
        setInventory(updated);
        localStorage.setItem('demo_inventory', JSON.stringify(updated));
      } else {
        await deleteDoc(doc(db, 'products', id));
      }
      alert('Produto removido com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao remover produto.');
    }
  };

  // Financeiro - Lançar despesa/receita manual
  const handleAddExpense = async (e) => {
    if (e) e.preventDefault();
    const payload = {
      date: financeForm.date,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      clientName: financeForm.type === 'entrada' ? 'Lançamento Manual' : 'Despesa Avulsa',
      type: financeForm.type,
      paymentMethod: financeForm.paymentMethod,
      value: Number(financeForm.value) || 0,
      description: financeForm.description,
      createdAt: new Date().toISOString()
    };
    try {
      if (isDemoMode) {
        const updated = [{ id: 'tx_' + Date.now(), ...payload }, ...transactions];
        setTransactions(updated);
        localStorage.setItem('demo_financial', JSON.stringify(updated));
      } else {
        await addDoc(collection(db, 'financial_transactions'), payload);
      }
      setShowFinanceModal(false);
      setFinanceForm({
        type: 'saida',
        description: '',
        value: '',
        paymentMethod: 'Pix',
        date: new Date().toISOString().split('T')[0]
      });
      alert('Transação financeira registrada com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar lançamento financeiro.');
    }
  };

  // Financeiro - Excluir lançamento
  const handleDeleteTransaction = async (id) => {
    if (!confirm('Deseja realmente excluir este lançamento financeiro?')) return;
    try {
      if (isDemoMode) {
        const updated = transactions.filter(t => t.id !== id);
        setTransactions(updated);
        localStorage.setItem('demo_financial', JSON.stringify(updated));
      } else {
        await deleteDoc(doc(db, 'financial_transactions', id));
      }
      alert('Lançamento financeiro removido!');
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir lançamento.');
    }
  };

  // Configurações - Salvar Estúdio Gerais
  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    try {
      if (isDemoMode) {
        localStorage.setItem('demo_studio_settings', JSON.stringify(settings));
      } else {
        await setDoc(doc(db, 'settings', 'studio'), settings);
      }
      alert('Configurações do Estúdio salvas com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar as configurações.');
    }
  };

  // Configurações - Salvar Profissional
  const handleSaveProf = async (e) => {
    if (e) e.preventDefault();
    if (!profForm.name.trim()) {
      alert('Nome do profissional é obrigatório.');
      return;
    }
    const profId = editingProfId || profForm.name.toLowerCase().trim().replace(/\s+/g, '-');
    const newProfPayload = {
      ...profForm,
      id: profId,
      commissionService: Number(profForm.commissionService) || 50,
      commissionProduct: Number(profForm.commissionProduct) || 10
    };
    const updatedProfs = editingProfId
      ? (settings.professionals || []).map(p => p.id === editingProfId ? newProfPayload : p)
      : [...(settings.professionals || []), newProfPayload];

    const updatedSettings = { ...settings, professionals: updatedProfs };
    try {
      if (isDemoMode) {
        localStorage.setItem('demo_studio_settings', JSON.stringify(updatedSettings));
        setSettings(updatedSettings);
      } else {
        await setDoc(doc(db, 'settings', 'studio'), updatedSettings);
      }
      setShowProfFormModal(false);
      setEditingProfId(null);
      setProfForm({
        name: '',
        avatar: '',
        commissionService: 50,
        commissionProduct: 10,
        phone: '',
        email: '',
        active: true,
        workStart: '09:00',
        workEnd: '19:00',
        lunchStart: '12:00',
        lunchEnd: '13:00',
        daysOff: [0, 1]
      });
      alert('Profissional salvo com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar profissional.');
    }
  };

  // Configurações - Excluir Profissional
  const handleDeleteProf = async (profId) => {
    if (profId === 'jon') {
      alert('O Jon não pode ser removido.');
      return;
    }
    if (!confirm('Deseja realmente remover este profissional?')) return;
    const updatedProfs = (settings.professionals || []).filter(p => p.id !== profId);
    const updatedSettings = { ...settings, professionals: updatedProfs };
    try {
      if (isDemoMode) {
        localStorage.setItem('demo_studio_settings', JSON.stringify(updatedSettings));
        setSettings(updatedSettings);
      } else {
        await setDoc(doc(db, 'settings', 'studio'), updatedSettings);
      }
      alert('Profissional removido!');
    } catch (err) {
      console.error(err);
      alert('Erro ao remover profissional.');
    }
  };

  // Marketing - Disparo de Campanha em Lote com Console logs
  const handleSendMarketingCampaign = async () => {
    const now = new Date();
    const targets = derivedClientsList.filter(c => {
      const lastVisitDate = c.lastVisit;
      if (lastVisitDate === 'Nunca visitou' || !lastVisitDate) {
        return marketingCampaignTarget === 'nunca_visitaram' || marketingCampaignTarget === 'todos';
      }
      const diffTime = Math.abs(now - new Date(lastVisitDate));
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (marketingCampaignTarget === 'inativos_30') return days >= 30 && days <= 60;
      if (marketingCampaignTarget === 'inativos_60') return days > 60;
      return marketingCampaignTarget === 'todos';
    });

    if (targets.length === 0) {
      alert('Nenhum cliente elegível neste segmento.');
      return;
    }

    if (!confirm(`Deseja disparar mensagens automáticas de WhatsApp para ${targets.length} clientes?`)) {
      return;
    }

    setIsSendingMarketingCampaign(true);
    setMarketingCampaignTotal(targets.length);
    setMarketingCampaignProgress(0);
    setMarketingLogs(['[SISTEMA] Iniciando campanha de relacionamento...']);

    for (let i = 0; i < targets.length; i++) {
      const client = targets[i];
      const firstName = (client.name || '').split(' ')[0];
      const lastVisitDate = client.lastVisit;
      let daysText = 'muitos';
      if (lastVisitDate !== 'Nunca visitou' && lastVisitDate) {
        const diffTime = Math.abs(now - new Date(lastVisitDate));
        daysText = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
      const compiledMsg = marketingCampaignMessage
        .replace(/{nome}/g, firstName)
        .replace(/{dias_ausente}/g, daysText)
        .replace(/{ultimo_servico}/g, client.lastServiceName || 'Procedimento');

      const cleanPhone = (client.phone || '').replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

      setMarketingLogs(prev => [...prev, `[ENVIANDO] ${client.name} (${client.phone})...`]);

      let sent = false;
      const gateway = settings?.waReminderGateway || 'evolution';

      if (gateway === 'evolution' && settings?.evolutionApiUrl && settings?.evolutionApiKey && settings?.evolutionInstanceName) {
        try {
          const url = `${settings.evolutionApiUrl.replace(/\/$/, '')}/message/sendText/${settings.evolutionInstanceName}`;
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': settings.evolutionApiKey
            },
            body: JSON.stringify({
              number: formattedPhone,
              text: compiledMsg
            })
          });
          sent = response.ok;
        } catch (e) {
          console.warn('Erro na chamada Evolution API:', e);
        }
      }

      if (isDemoMode) {
        sent = true;
      }

      if (sent) {
        setMarketingLogs(prev => [...prev, `[OK] Mensagem enviada para ${client.name}`]);
        const newLog = {
          timestamp: new Date().toISOString(),
          clientName: client.name,
          clientPhone: client.phone,
          stage: 'Campanha CRM Mobile',
          channel: 'whatsapp',
          status: 'success'
        };
        if (db) {
          await addDoc(collection(db, 'automation_logs'), newLog);
        } else {
          const localLogs = JSON.parse(localStorage.getItem('demo_automation_logs') || '[]');
          localStorage.setItem('demo_automation_logs', JSON.stringify([newLog, ...localLogs]));
        }
      } else {
        setMarketingLogs(prev => [...prev, `[FALHA] Erro de envio para ${client.name}. Verifique o gateway.`]);
      }

      setMarketingCampaignProgress(i + 1);
      await new Promise(r => setTimeout(r, 1500));
    }

    setMarketingLogs(prev => [...prev, '[FIM] Campanha de marketing finalizada.']);
    setIsSendingMarketingCampaign(false);
  };

  const stats = getFinancialStats();

  const commissions = getCommissionData();

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F5EDDB' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--mobile-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: 12, fontSize: '0.9rem', color: '#6b7280', fontWeight: 600 }}>Carregando Studio do Jon...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="mobile-app-wrapper" onTouchStart={handleTabSwipeStart} onTouchEnd={handleTabSwipeEnd}>
      {/* Conditionally render header based on activeTab */}
      {MAIN_TABS.includes(activeTab) ? (
        <>
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
        </>
      ) : (
        /* Sub-view Header */
        <header className="mobile-subview-header">
          <button className="btn-back-options" onClick={() => setActiveTab('opcoes')}>
            <ChevronLeft size={20} />
          </button>
          <h3>
            {activeTab === 'clientes' && 'Clientes & Ficha Capilar'}
            {activeTab === 'servicos' && 'Grade de Serviços'}
            {activeTab === 'estoque' && 'Estoque & Almoxarifado'}
            {activeTab === 'financeiro' && 'Fluxo de Caixa'}
            {activeTab === 'configuracoes' && 'Configurações'}
            {activeTab === 'marketing' && 'Marketing CRM'}
          </h3>
        </header>
      )}

      {/* Banner de Aguardando Conexão */}
      {!loading && connectionWarning && (
        <div
          style={{
            background: '#fff3cd',
            borderBottom: '1px solid #ffc107',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.78rem',
            color: '#856404',
            gap: '8px'
          }}
        >
          <span>⚠️ Aguardando conexão com o Firebase (exibindo dados locais/cache).</span>
          <button
            onClick={handleManualSync}
            disabled={syncing}
            style={{
              background: '#ffc107',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#333',
              cursor: syncing ? 'not-allowed' : 'pointer',
              opacity: syncing ? 0.7 : 1,
              whiteSpace: 'nowrap'
            }}
          >
            {syncing ? '🔄 Conectando...' : '🔄 Sincronizar'}
          </button>
        </div>
      )}

      {/* Banner de Status de Sincronização */}
      {!loading && !isDemoMode && bookings.length === 0 && (
        <div
          style={{
            background: '#fff3cd',
            borderBottom: '1px solid #ffc107',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.78rem',
            color: '#856404',
            gap: '8px'
          }}
        >
          <span>
            {syncError 
              ? `⚠️ Erro: ${syncError}` 
              : '⚠️ Sem dados carregados. Possível falha de sincronização.'}
          </span>
          <button
            onClick={handleManualSync}
            disabled={syncing}
            style={{
              background: '#ffc107',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#333',
              cursor: syncing ? 'not-allowed' : 'pointer',
              opacity: syncing ? 0.7 : 1,
              whiteSpace: 'nowrap'
            }}
          >
            {syncing ? '🔄 Sincronizando...' : '🔄 Sincronizar'}
          </button>
        </div>
      )}

      {/* RENDERIZAÇÃO DAS ABAS */}
      
      {/* 1. ABA INÍCIO */}
      {activeTab === 'inicio' && (
        <div className="mobile-home-container mobile-tab-view">
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ margin: 0 }}>Dados do meu negócio</h3>
              <select 
                className="stats-scope-select"
                value={businessPeriod} 
                onChange={(e) => setBusinessPeriod(e.target.value)}
                style={{ fontSize: '0.75rem', padding: '4px 8px' }}
              >
                <option value="semana">Esta Semana</option>
                <option value="mes">Este Mês</option>
              </select>
            </div>
            <div className="period-text">
              {businessPeriod === 'semana' ? 'Faturamento da semana atual' : 'Faturamento do mês corrente'}
            </div>
            
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
              <button className="mobile-btn-outline" onClick={() => { setActiveTab('financeiro'); setFinanceSubTab('dashboard'); }}>Visão geral</button>
              <button className="mobile-btn-solid" onClick={() => { setActiveTab('financeiro'); setFinanceSubTab('lancamentos'); }}>Entradas e saídas</button>
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
                <div key={b.id || b.clientName} className="mobile-appt-list-row" onClick={() => setSelectedBooking(b)}>
                  <div className="mobile-appt-left">
                    <span className="appt-client">{b.clientName || '—'} {b.isPackageUse && '📦'} {b.isPackageAcquisition && '🛒📦'}</span>
                    <span className="appt-service">{b.service?.name || b.serviceName || 'Serviço'}</span>
                  </div>
                  <div className="mobile-appt-right">
                    <span className="appt-time">{b.time || '—'}</span>
                    <span className={`appt-status ${b.status || 'pendente'}`}>{ (b.status || 'pendente').toUpperCase() }</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 2. ABA AGENDA (TIMELINE DIÁRIA, WEEKLY TABLE, MONTHLY DOTS) */}
      {activeTab === 'agenda' && (
        <div
          className="mobile-tab-view"
          style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
          onTouchStart={handleSwipeStart}
          onTouchEnd={handleSwipeEnd}
        >
          <div className="mobile-agenda-header">
            <div style={{ display: 'flex', gap: 8 }}>
              <select 
                className="mobile-agenda-select" 
                value={agendaView} 
                onChange={(e) => setAgendaView(e.target.value)}
              >
                <option value="diario">Diário</option>
                <option value="semanal">Semanal</option>
                <option value="mensal">Mensal</option>
              </select>
              
              {(agendaView === 'semanal' || agendaView === 'mensal') && (
                <select 
                  className="mobile-agenda-select" 
                  value={selectedWeeklyMonthlyProf} 
                  onChange={(e) => setSelectedWeeklyMonthlyProf(e.target.value)}
                >
                  {activeProfessionalsList.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="mobile-agenda-actions">
              <CalendarIcon size={18} />
            </div>
          </div>

          <div className="mobile-day-switcher">
            {agendaView === 'diario' ? (
              <>
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
              </>
            ) : agendaView === 'semanal' ? (
              <>
                <button className="mobile-day-btn" onClick={() => handleWeekChange(-1)}>
                  <ChevronLeft size={20} />
                </button>
                <div className="mobile-current-day-label">
                  <span className="date-string">
                    Semana de {formatLocalDate(getWeekDays(currentDate)[0]).dateString.split(' ')[0]} a {formatLocalDate(getWeekDays(currentDate)[6]).dateString}
                  </span>
                  <span className="weekday-string">Filtro Semanal</span>
                </div>
                <button className="mobile-day-btn" onClick={() => handleWeekChange(1)}>
                  <ChevronRight size={20} />
                </button>
              </>
            ) : (
              <>
                <button className="mobile-day-btn" onClick={() => handleMonthChange(-1)}>
                  <ChevronLeft size={20} />
                </button>
                <div className="mobile-current-day-label">
                  <span className="date-string" style={{ textTransform: 'capitalize' }}>
                    {new Date(currentDate + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </span>
                  <span className="weekday-string">Filtro Mensal</span>
                </div>
                <button className="mobile-day-btn" onClick={() => handleMonthChange(1)}>
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>

          {/* VIEW: DIÁRIO */}
          {agendaView === 'diario' && (
            <div className="mobile-timeline-scroll">
              {hourSlots.map(slot => {
                const matchedAppt = bookings.find(b => b.date === currentDate && b.time === slot && b.status !== 'cancelado');
                
                const timeToMin = (t) => {
                  if (!t || typeof t !== 'string' || !t.includes(':')) return 0;
                  const [h, m] = t.split(':').map(Number);
                  return (h || 0) * 60 + (m || 0);
                };
                const slotMin = timeToMin(slot);
                const ongoingAppt = !matchedAppt && bookings.find(b => {
                  if (b.date !== currentDate || b.status === 'cancelado') return false;
                  const bStart = timeToMin(b.time);
                  const bEnd = bStart + (b.duration || 60);
                  return bStart < slotMin && slotMin < bEnd;
                });

                const jonProf = settings?.professionals?.find(p => p.id === 'jon');
                const blockedBySettings = !matchedAppt && !ongoingAppt && isSlotBlocked(jonProf, currentDate, slot);
                
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
                      ) : ongoingAppt ? (
                        <div 
                          className={`mobile-timeline-appt-block ${ongoingAppt.status}`}
                          style={{ 
                            opacity: 0.85, 
                            borderLeftStyle: 'dashed',
                            background: ongoingAppt.status === 'bloqueado' ? undefined : '#faf5ee'
                          }}
                        >
                          <div className="appt-block-client" style={{ color: 'var(--mobile-text)' }}>↳ {ongoingAppt.clientName} (Ocupado)</div>
                          <div className="appt-block-service">{ongoingAppt.service?.name || ongoingAppt.serviceName}</div>
                          <div className="appt-block-meta">
                            <span>{ongoingAppt.status.toUpperCase()}</span>
                            {ongoingAppt.status !== 'bloqueado' && (
                              <span>R$ {(ongoingAppt.service?.price || ongoingAppt.servicePrice || 0).toFixed(0)}</span>
                            )}
                          </div>
                        </div>
                      ) : blockedBySettings ? (
                        <div className="mobile-empty-slot-btn bloqueado-escala" style={{ background: '#f5ebe0', border: '1px dashed #d4bda8', color: '#8b694b', opacity: 0.85 }}>
                          <span>🚫 Bloqueado (Escala) · Toque para agendar</span>
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
          )}

          {/* VIEW: SEMANAL (GRADE VISUAL) */}
          {agendaView === 'semanal' && (
            <div className="mobile-weekly-grid-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white', overflow: 'hidden', paddingBottom: 80 }}>
              {/* Header com dias da semana */}
              <div className="mobile-weekly-header" style={{ display: 'flex', borderBottom: '1px solid var(--mobile-rule)', background: '#fafafa', padding: '6px 0' }}>
                <div className="mobile-weekly-hour-spacer" style={{ width: 50, flexShrink: 0 }} />
                <div className="mobile-weekly-days-grid" style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center' }}>
                  {(() => {
                    const wDays = getWeekDays(currentDate);
                    const weekdaysShort = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
                    return wDays.map(dStr => {
                      const d = new Date(dStr + 'T00:00:00');
                      const isToday = dStr === todayStr;
                      return (
                        <div 
                          key={dStr} 
                          className={`mobile-weekly-day-header ${isToday ? 'active' : ''}`}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4px 0',
                            color: isToday ? 'var(--mobile-primary)' : 'var(--mobile-text)'
                          }}
                        >
                          <span className="weekday-lbl" style={{ fontSize: '0.62rem', textTransform: 'lowercase', color: isToday ? 'var(--mobile-primary)' : 'var(--mobile-muted)', fontWeight: isToday ? 'bold' : 'normal' }}>
                            {weekdaysShort[d.getDay()]}
                          </span>
                          <span className="day-num-lbl" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                            {d.getDate()}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Corpo da grade semanal */}
              <div className="mobile-weekly-body" style={{ display: 'flex', flex: 1, overflowY: 'auto', position: 'relative' }}>
                {/* Horários no lado esquerdo */}
                <div className="mobile-weekly-hours-column" style={{ width: 50, flexShrink: 0, borderRight: '1px solid var(--mobile-rule)', background: '#fcfcfc', display: 'flex', flexDirection: 'column' }}>
                  {['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map(h => (
                    <div key={h} className="mobile-weekly-hour-cell" style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'var(--mobile-muted)', borderBottom: '1px solid var(--mobile-rule-soft, #f0f0f0)' }}>
                      {h}
                    </div>
                  ))}
                </div>

                {/* Colunas dos dias da semana */}
                <div className="mobile-weekly-days-columns" style={{ flex: 1, position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', height: 540 }}>
                  {/* Linhas de grade horizontais */}
                  <div className="mobile-weekly-grid-lines" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', pointerEvents: 'none', zIndex: 0 }}>
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="mobile-weekly-grid-line" style={{ height: 60, borderBottom: '1px solid var(--mobile-rule-soft, #f0f0f0)' }} />
                    ))}
                  </div>

                  {(() => {
                    const wDays = getWeekDays(currentDate);
                    const prof = activeProfessionalsList.find(p => p.id === selectedWeeklyMonthlyProf);

                    return wDays.map(dStr => {
                      const dayBookings = bookings.filter(b => 
                        b.date === dStr && 
                        (b.profissional || 'jon') === selectedWeeklyMonthlyProf && 
                        b.status !== 'cancelado'
                      );

                      const dayBlocks = getDayBlocks(prof, dStr);

                      return (
                        <div key={dStr} className="mobile-weekly-day-column" style={{ position: 'relative', height: '100%', borderRight: '1px solid var(--mobile-rule-soft, #f0f0f0)', zIndex: 1 }}>
                          {/* Desenhar bloqueios */}
                          {dayBlocks.map((block, idx) => {
                            const startMin = timeToMin(block.start);
                            const endMin = timeToMin(block.end);
                            const duration = Math.max(30, endMin - startMin);
                            
                            // Posicionamento
                            const topPercent = Math.max(0, ((startMin - 600) / 540) * 100);
                            const heightPercent = Math.min(100 - topPercent, (duration / 540) * 100);

                            if (topPercent >= 100 || topPercent + heightPercent <= 0) return null;

                            return (
                              <div 
                                key={`block-${idx}`} 
                                className="mobile-weekly-appt-card bloqueado"
                                style={{
                                  top: `${topPercent}%`,
                                  height: `${heightPercent}%`,
                                  position: 'absolute',
                                  left: 2,
                                  right: 2,
                                  background: 'repeating-linear-gradient(45deg, #e2e8f0, #e2e8f0 10px, #cbd5e1 10px, #cbd5e1 20px)',
                                  color: '#475569',
                                  borderLeft: '3px solid #94a3b8',
                                  opacity: 0.85,
                                  fontSize: '0.62rem',
                                  padding: '2px 4px',
                                  borderRadius: 4,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  overflow: 'hidden',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  textAlign: 'center',
                                  zIndex: 2
                                }}
                              >
                                <span style={{ fontWeight: 'bold', fontSize: '0.55rem' }}>{block.label}</span>
                                <span style={{ fontSize: '0.5rem' }}>{block.start}</span>
                              </div>
                            );
                          })}

                          {/* Desenhar agendamentos */}
                          {dayBookings.map(b => {
                            const startMin = timeToMin(b.time);
                            const duration = b.duration || 60;
                            
                            // Posicionamento
                            const topPercent = Math.max(0, ((startMin - 600) / 540) * 100);
                            const heightPercent = Math.min(100 - topPercent, (duration / 540) * 100);

                            if (topPercent >= 100 || topPercent + heightPercent <= 0) return null;

                            let bgGradient = 'linear-gradient(135deg, #FDF8F4 0%, #FAF4EE 100%)';
                            let borderLeftColor = 'var(--mobile-primary)';
                            let textColor = 'var(--mobile-primary)';
                            
                            if (b.status === 'finalizado') {
                              bgGradient = 'linear-gradient(135deg, #F2F7F3 0%, #EBF1EC 100%)';
                              borderLeftColor = 'var(--mobile-green)';
                              textColor = 'var(--mobile-green)';
                            } else if (b.status === 'pendente') {
                              bgGradient = 'linear-gradient(135deg, #FEF9E7 0%, #FAF0D4 100%)';
                              borderLeftColor = 'var(--mobile-amber)';
                              textColor = 'var(--mobile-amber)';
                            } else if (b.status === 'bloqueado') {
                              bgGradient = 'var(--mobile-grey-block)';
                              borderLeftColor = '#a0aec0';
                              textColor = 'var(--mobile-muted)';
                            }

                            return (
                              <div 
                                key={b.id} 
                                className={`mobile-weekly-appt-card ${b.status}`}
                                onClick={() => setSelectedBooking(b)}
                                style={{
                                  top: `${topPercent}%`,
                                  height: `${heightPercent}%`,
                                  position: 'absolute',
                                  left: 2,
                                  right: 2,
                                  fontSize: '0.6rem',
                                  padding: '4px 3px',
                                  borderRadius: 4,
                                  background: bgGradient,
                                  borderLeft: `3px solid ${borderLeftColor}`,
                                  color: textColor,
                                  overflow: 'hidden',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'center',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                  zIndex: 3,
                                  cursor: 'pointer'
                                }}
                              >
                                <span style={{ fontWeight: 'bold', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', color: '#1a1310' }}>{b.clientName} {b.isPackageUse && '📦'} {b.isPackageAcquisition && '🛒📦'}</span>
                                <span style={{ opacity: 0.9, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', fontSize: '0.52rem', color: '#4a3f35' }}>{b.service?.name || b.serviceName}</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: MENSAL (CALENDÁRIO COM CÍRCULOS DE STATUS) */}
          {agendaView === 'mensal' && (
            <div style={{ padding: 16, background: 'white', flex: 1, paddingBottom: 80, overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 12, textAlign: 'center', fontWeight: 'bold', fontSize: '0.72rem', color: 'var(--mobile-muted)' }}>
                <div>dom.</div>
                <div>seg.</div>
                <div>ter.</div>
                <div>qua.</div>
                <div>qui.</div>
                <div>sex.</div>
                <div>sáb.</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                {getDaysInMonthGrid(currentDate).map((cell, idx) => {
                  const dayBookings = bookings.filter(b => 
                    b.date === cell.dateStr && 
                    (b.profissional || 'jon') === selectedWeeklyMonthlyProf && 
                    b.status !== 'cancelado'
                  );
                  
                  const isToday = cell.dateStr === todayStr;
                  const isCurrentMonth = cell.isCurrentMonth;
                  
                  return (
                    <div 
                      key={`${cell.dateStr}-${idx}`} 
                      onClick={() => {
                        setCurrentDate(cell.dateStr);
                        setAgendaView('diario');
                      }}
                      style={{
                        minHeight: 68,
                        borderRadius: 12,
                        padding: '6px 4px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        background: !isCurrentMonth ? '#F5F5F5' : 'transparent',
                        color: !isCurrentMonth ? '#cbd5e1' : (isToday ? 'var(--mobile-primary)' : 'var(--mobile-text)'),
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        position: 'relative'
                      }}
                    >
                      <span style={{ 
                        fontSize: '0.9rem', 
                        fontWeight: isToday || !isCurrentMonth ? 'bold' : 'normal',
                        color: !isCurrentMonth ? '#a0aec0' : (isToday ? 'var(--mobile-primary)' : '#1a1310')
                      }}>
                        {cell.dayNum}
                      </span>
                      
                      {isCurrentMonth && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4, alignItems: 'center' }}>
                          {dayBookings.slice(0, 3).map((b, bIdx) => {
                            let dotColor = '#cbd5e1'; // bloqueado / outro
                            if (b.status === 'confirmado') dotColor = '#48bb78'; // verde para confirmado/finalizado
                            if (b.status === 'finalizado') dotColor = '#48bb78';
                            if (b.status === 'pendente') dotColor = '#ecc94b'; // laranja para pendente
                            
                            return (
                              <span 
                                key={b.id || bIdx} 
                                style={{
                                  width: 5,
                                  height: 5,
                                  borderRadius: '50%',
                                  backgroundColor: dotColor,
                                  display: 'block'
                                }} 
                              />
                            );
                          })}
                          {dayBookings.length > 3 && (
                            <span style={{ fontSize: '0.6rem', fontWeight: 'bold', color: 'var(--mobile-muted)', lineHeight: '4px', marginTop: -2 }}>...</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
        <div className="mobile-commissions-container mobile-tab-view">
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
        <div className="mobile-options-container mobile-tab-view">
          {/* Perfil do Jon */}
          <div className="mobile-profile-card">
            <div className="mobile-profile-avatar">
              <img src="/jon-perfil.webp" alt="Jonatan" onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"; }} />
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
            <div className="mobile-menu-item" onClick={() => setActiveTab('clientes')}>
              <div className="mobile-menu-item-left">
                <Users size={18} />
                <span>Clientes & Ficha Capilar</span>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--mobile-muted)' }} />
            </div>

            <div className="mobile-menu-item" onClick={() => setActiveTab('servicos')}>
              <div className="mobile-menu-item-left">
                <Scissors size={18} />
                <span>Grade de Serviços</span>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--mobile-muted)' }} />
            </div>

            <div className="mobile-menu-item" onClick={() => setActiveTab('pacotes')}>
              <div className="mobile-menu-item-left">
                <Package size={18} />
                <span>Pacotes Promocionais</span>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--mobile-muted)' }} />
            </div>

            <div className="mobile-menu-item" onClick={() => setActiveTab('estoque')}>
              <div className="mobile-menu-item-left">
                <Package size={18} />
                <span>Estoque & Almoxarifado</span>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--mobile-muted)' }} />
            </div>

            <div className="mobile-menu-item" onClick={() => { setActiveTab('configuracoes'); setConfigSubTab('profissionais'); }}>
              <div className="mobile-menu-item-left">
                <User size={18} />
                <span>Profissionais</span>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--mobile-muted)' }} />
            </div>

            <div className="mobile-menu-item" onClick={() => { setActiveTab('financeiro'); setFinanceSubTab('dashboard'); }}>
              <div className="mobile-menu-item-left">
                <DollarSign size={18} />
                <span>Controle de entrada e saída</span>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--mobile-muted)' }} />
            </div>

            <div className="mobile-menu-item" onClick={() => { setActiveTab('financeiro'); setFinanceSubTab('lancamentos'); }}>
              <div className="mobile-menu-item-left">
                <FileText size={18} />
                <span>Contas fechadas / Extrato</span>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--mobile-muted)' }} />
            </div>

            <div className="mobile-menu-item" onClick={() => setActiveTab('marketing')}>
              <div className="mobile-menu-item-left">
                <Send size={18} />
                <span>Marketing & Automações CRM</span>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--mobile-muted)' }} />
            </div>

            <div className="mobile-menu-item" onClick={() => setActiveTab('configuracoes')}>
              <div className="mobile-menu-item-left">
                <Settings size={18} />
                <span>Configurações</span>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--mobile-muted)' }} />
            </div>

            <div className="mobile-menu-item" onClick={() => setShowNotificationsModal(true)}>
              <div className="mobile-menu-item-left">
                <Bell size={18} />
                <span>Ver Notificações Recentes</span>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--mobile-muted)' }} />
            </div>

            <div className="mobile-menu-item" onClick={() => { requestNotificationPermission(); }}>
              <div className="mobile-menu-item-left" style={{ color: '#8c5027' }}>
                <Bell size={18} />
                <span style={{ fontWeight: 'bold' }}>Ativar Alertas Sonoros e Sons</span>
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

      {/* SUB-TELAS NATIVAS ADMINISTRATIVE (BACKOFFICE) */}
      {activeTab === 'pacotes' && (
        <div className="mobile-backoffice-subview">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Pacotes Promocionais</h4>
            <button 
              type="button"
              className="mobile-btn-outline" 
              style={{ padding: '4px 10px', fontSize: '0.75rem', minHeight: '30px' }}
              onClick={() => setActiveTab('opcoes')}
            >
              Voltar
            </button>
          </div>

          <div className="mobile-config-sub-tabs" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button 
              type="button"
              className={`config-sub-tab-btn ${packagesSubTab === 'modelos' ? 'active' : ''}`}
              onClick={() => setPackagesSubTab('modelos')}
              style={{ flex: 1, padding: '8px', fontSize: '0.8rem', fontWeight: 'bold', borderRadius: '6px', border: '1px solid var(--mobile-border)' }}
            >
              📋 Modelos (Templates)
            </button>
            <button 
              type="button"
              className={`config-sub-tab-btn ${packagesSubTab === 'ativos' ? 'active' : ''}`}
              onClick={() => setPackagesSubTab('ativos')}
              style={{ flex: 1, padding: '8px', fontSize: '0.8rem', fontWeight: 'bold', borderRadius: '6px', border: '1px solid var(--mobile-border)' }}
            >
              👥 Pacotes dos Clientes
            </button>
          </div>

          {packagesSubTab === 'modelos' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {packages.length === 0 ? (
                <div className="mobile-empty-state">Nenhum modelo de pacote cadastrado. Cadastre no painel web.</div>
              ) : (
                packages.map(p => {
                  const pkgOriginalTotal = p.services ? p.services.reduce((sum, item) => {
                    const sObj = services.find(s => s.id === item.serviceId);
                    const price = sObj ? (Number(sObj.price) || 0) : 0;
                    return sum + (price * item.sessions);
                  }, 0) : 0;
                  return (
                    <div key={p.id} className="service-card-compact" style={{ padding: 12, background: '#fff', borderRadius: 8, border: '1px solid var(--mobile-border)' }}>
                      <div className="service-card-compact-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <strong style={{ fontSize: '0.95rem', color: '#1a202c', flex: 1, paddingRight: '8px' }}>{p.name}</strong>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          {pkgOriginalTotal > p.price && (
                            <span style={{ fontSize: '0.75rem', textDecoration: 'line-through', color: '#a0aec0', marginBottom: '1px' }}>
                              R$ {pkgOriginalTotal.toFixed(2).replace('.', ',')}
                            </span>
                          )}
                          <span style={{ fontWeight: 'bold', color: 'var(--mobile-green)', fontSize: '0.9rem' }}>
                            R$ {p.price.toFixed(2).replace('.', ',')}
                          </span>
                          {pkgOriginalTotal > p.price && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--mobile-green)', fontWeight: '600', marginTop: '2px' }}>
                              Salva R$ {(pkgOriginalTotal - p.price).toFixed(2).replace('.', ',')}
                            </span>
                          )}
                        </div>
                      </div>
                    {p.description && (
                      <p style={{ margin: '0 0 8px 0', fontSize: '0.78rem', color: '#718096', lineHeight: 1.4 }}>{p.description}</p>
                    )}
                    <div style={{ background: '#f7fafc', padding: 8, borderRadius: 6, fontSize: '0.75rem', color: '#4a5568' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: 4 }}>Serviços inclusos:</div>
                      {p.services && p.services.map((ps, idx) => {
                        const sObj = services.find(s => s.id === ps.serviceId);
                        return (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                            <span>• {sObj ? sObj.name : 'Serviço'}</span>
                            <strong>{ps.sessions} sessões</strong>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {clientPackages.length === 0 ? (
                <div className="mobile-empty-state">Nenhum pacote vendido/ativo no momento.</div>
              ) : (
                clientPackages.map(cp => {
                  return (
                    <div key={cp.id} className="service-card-compact" style={{ padding: 12, background: cp.status === 'active' ? '#fff' : 'rgba(0,0,0,0.01)', borderRadius: 8, border: cp.status === 'active' ? '1px solid var(--mobile-border)' : '1px solid transparent', opacity: cp.status === 'active' ? 1 : 0.6 }}>
                      <div className="service-card-compact-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div>
                          <strong style={{ fontSize: '0.95rem', color: '#1a202c', display: 'block' }}>{cp.clientName}</strong>
                          <span style={{ fontSize: '0.72rem', color: '#718096' }}>{cp.packageName}</span>
                        </div>
                        <span className={`appt-status ${cp.status}`} style={{ fontSize: '0.65rem', padding: '2px 6px', height: 'fit-content' }}>
                          {cp.status === 'active' ? 'ATIVO' : cp.status === 'finished' ? 'CONCLUÍDO' : 'PENDENTE'}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#a0aec0', marginBottom: 8 }}>
                        <span>Adquirido em: {cp.datePurchased ? cp.datePurchased.split('-').reverse().join('/') : '—'}</span>
                        <span style={{ fontWeight: 600, color: 'var(--mobile-green)' }}>Pago: R$ {Number(cp.pricePaid || 0).toFixed(2).replace('.', ',')}</span>
                      </div>

                      <div style={{ background: '#f7fafc', padding: 8, borderRadius: 6, fontSize: '0.75rem', color: '#4a5568' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: 4 }}>Saldos de Sessões:</div>
                        {Object.entries(cp.balance || {}).map(([sId, remaining]) => {
                          const sObj = services.find(s => s.id === sId);
                          // find sessions in template if available to show ratio e.g. 1/4
                          const template = packages.find(p => p.id === cp.packageId);
                          const totalSessions = template?.services?.find(ts => ts.serviceId === sId)?.sessions || remaining;
                          const pct = totalSessions > 0 ? (remaining / totalSessions) * 100 : 0;
                          return (
                            <div key={sId} style={{ marginBottom: 6 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                                <span>{sObj ? sObj.name : 'Serviço'}</span>
                                <strong style={{ color: remaining > 0 ? 'var(--mobile-primary)' : '#718096' }}>{remaining} / {totalSessions} sessões</strong>
                              </div>
                              <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: remaining > 0 ? 'var(--mobile-primary)' : '#cbd5e0', borderRadius: '3px' }}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'clientes' && (
        <div className="mobile-backoffice-subview">
          {selectedClientPhone ? (
            /* TECHNICAL HAIR PROFILE VIEW */
            <div className="hair-profile-detail-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Ficha Capilar Técnica</h4>
                <button 
                  type="button"
                  className="mobile-btn-outline" 
                  style={{ padding: '4px 10px', fontSize: '0.75rem', minHeight: '30px' }}
                  onClick={() => setSelectedClientPhone('')}
                >
                  Voltar
                </button>
              </div>

              <div style={{ background: '#fbf8f3', padding: 12, borderRadius: 12, border: '1px solid #ebdcb9', marginBottom: 8 }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{hairProfile.name || 'Cliente Sem Nome'}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--mobile-muted)', marginTop: 2 }}>📞 {hairProfile.phone}</div>
                {hairProfile.email && <div style={{ fontSize: '0.8rem', color: 'var(--mobile-muted)' }}>✉️ {hairProfile.email}</div>}
              </div>

              <form onSubmit={handleSaveHairProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="mobile-form-group">
                  <label>Sexo</label>
                  <select 
                    value={hairProfile.sexo || 'Feminino'} 
                    onChange={e => setHairProfile(prev => ({ ...prev, sexo: e.target.value }))}
                  >
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div className="mobile-form-group">
                  <label>Data de Nascimento</label>
                  <input 
                    type="date" 
                    value={hairProfile.birthdate || ''} 
                    onChange={e => setHairProfile(prev => ({ ...prev, birthdate: e.target.value }))}
                  />
                </div>

                <div className="mobile-form-group">
                  <label>Curvatura Principal</label>
                  <select 
                    value={hairProfile.curvatura || '3A'} 
                    onChange={e => setHairProfile(prev => ({ ...prev, curvatura: e.target.value }))}
                  >
                    <option value="2A">Ondulado (2A)</option>
                    <option value="2B">Ondulado (2B)</option>
                    <option value="2C">Ondulado (2C)</option>
                    <option value="3A">Cacheado Aberto (3A)</option>
                    <option value="3B">Cacheado Médio (3B)</option>
                    <option value="3C">Cacheado Fechado (3C)</option>
                    <option value="4A">Crespo Suave (4A)</option>
                    <option value="4B">Crespo Médio (4B)</option>
                    <option value="4C">Crespo Intenso (4C)</option>
                  </select>
                </div>

                <div className="mobile-form-group">
                  <label>Porosidade Capilar</label>
                  <select 
                    value={hairProfile.porosidade || 'Média'} 
                    onChange={e => setHairProfile(prev => ({ ...prev, porosidade: e.target.value }))}
                  >
                    <option value="Baixa">Baixa (Dificuldade de absorver água/tratamento)</option>
                    <option value="Média">Média (Saudável/Normal)</option>
                    <option value="Alta">Alta (Ressecado/Fios quebradiços)</option>
                  </select>
                </div>

                <div className="mobile-form-group">
                  <label>Elasticidade</label>
                  <select 
                    value={hairProfile.elasticidade || 'Normal'} 
                    onChange={e => setHairProfile(prev => ({ ...prev, elasticidade: e.target.value }))}
                  >
                    <option value="Fraca">Fraca / Emborrachado</option>
                    <option value="Normal">Normal / Resistente</option>
                    <option value="Excelente">Excelente / Muito Saudável</option>
                  </select>
                </div>

                <div className="mobile-form-group">
                  <label>Histórico de Químicas</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Luzes há 6 meses, tintura regular..."
                    value={hairProfile.quimicas || ''} 
                    onChange={e => setHairProfile(prev => ({ ...prev, quimicas: e.target.value }))}
                  />
                </div>

                <div className="mobile-form-group">
                  <label>Produtos Recomendados</label>
                  <textarea 
                    placeholder="Indique produtos para home care..."
                    rows={2}
                    value={hairProfile.produtosRecomendados || ''} 
                    onChange={e => setHairProfile(prev => ({ ...prev, produtosRecomendados: e.target.value }))}
                  />
                </div>

                <div className="mobile-form-group">
                  <label>Observações Técnicas / Diagnóstico</label>
                  <textarea 
                    placeholder="Detalhes adicionais do fio do cliente..."
                    rows={3}
                    value={hairProfile.observacoes || ''} 
                    onChange={e => setHairProfile(prev => ({ ...prev, observacoes: e.target.value }))}
                  />
                </div>

                <button 
                  type="submit" 
                  className="mobile-btn-solid" 
                  style={{ minHeight: '48px', marginTop: 8 }}
                  disabled={savingProfile}
                >
                  {savingProfile ? 'Salvando...' : 'Salvar Ficha Técnica'}
                </button>
              </form>

              {/* Histórico do Cliente */}
              <div style={{ marginTop: 24 }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 10, color: 'var(--mobile-text)' }}>Histórico de Agendamentos</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {bookings.filter(b => (b.clientPhone || b.phone) === selectedClientPhone).length === 0 ? (
                    <div className="mobile-empty-state">Sem histórico de visitas recente.</div>
                  ) : (
                    bookings
                      .filter(b => (b.clientPhone || b.phone) === selectedClientPhone)
                      .sort((a,b) => b.date.localeCompare(a.date))
                      .map(b => (
                        <div key={b.id} className="transaction-ledger-row">
                          <div className="tx-ledger-left">
                            <span className="tx-title" style={{ fontSize: '0.85rem' }}>{b.serviceName || b.service?.name || 'Procedimento'}</span>
                            <span className="tx-meta">{b.date.split('-').reverse().join('/')} às {b.time}</span>
                          </div>
                          <div className="tx-ledger-right">
                            <span className={`appt-status ${b.status}`} style={{ fontSize: '0.7rem' }}>
                              {b.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* CLIENTS LIST VIEW */
            <>
              <div className="client-search-bar" style={{ marginBottom: 12 }}>
                <Search size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar cliente por nome ou celular..." 
                  value={clientSearchTerm} 
                  onChange={e => setClientSearchTerm(e.target.value)}
                />
              </div>

              <button 
                type="button"
                className="mobile-btn-solid" 
                style={{ minHeight: '48px', width: '100%' }}
                onClick={() => setShowAddClientModal(true)}
              >
                <Plus size={18} /> Cadastrar Novo Cliente
              </button>

              <div className="client-list-scroll" style={{ marginTop: 12 }}>
                {derivedClientsList
                  .filter(c => {
                    const search = clientSearchTerm.toLowerCase();
                    return (c.name || '').toLowerCase().includes(search) || (c.phone || '').includes(search);
                  })
                  .slice(0, 50)
                  .map(c => (
                    <div 
                      key={c.phone || c.id} 
                      className="client-row-card"
                      onClick={() => setSelectedClientPhone(c.phone)}
                    >
                      <div className="client-initials-avatar">
                        {(c.name || 'S').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                      <div className="client-info-main">
                        <span className="client-name">{c.name}</span>
                        <span className="client-meta-line">📱 {c.phone}</span>
                        <span className="client-meta-line">🕒 Último: {c.lastVisit === 'Nunca visitou' ? 'Nunca visitou' : c.lastVisit.split('-').reverse().join('/')} ({c.lastServiceName})</span>
                      </div>
                      <div className="hair-badge">{c.hairType || '3A'}</div>
                    </div>
                  ))}
                {derivedClientsList.length === 0 && (
                  <div className="mobile-empty-state">Nenhum cliente cadastrado no sistema.</div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'servicos' && (
        <div className="mobile-backoffice-subview">
          <button 
            type="button"
            className="mobile-btn-solid" 
            style={{ minHeight: '48px', width: '100%', marginBottom: 12 }}
            onClick={() => {
              setEditingService(null);
              setServiceForm({
                name: '',
                category: 'Cabelo',
                description: '',
                price: '',
                priceType: 'Fixo',
                promoPrice: '',
                duration: '60',
                cost: '',
                isPrimary: true,
                scheduledViaWhatsapp: false,
                position: ''
              });
              setShowServiceModal(true);
            }}
          >
            <Plus size={18} /> Novo Serviço
          </button>

          <div className="service-category-pills" style={{ marginBottom: 12 }}>
            {['Todos', 'Cabelo', 'Barba', 'Combos', 'Tratamentos', 'Outro'].map(cat => (
              <button 
                type="button"
                key={cat} 
                className={`service-category-pill ${serviceCategory === cat ? 'active' : ''}`}
                onClick={() => setServiceCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {services
              .filter(s => serviceCategory === 'Todos' || s.category === serviceCategory)
              .sort((a, b) => (Number(a.position) || 0) - (Number(b.position) || 0))
              .map(s => (
                <div key={s.id} className="service-card-compact">
                  <div className="service-card-compact-header">
                    <div>
                      <h4>{s.name}</h4>
                      <span style={{ fontSize: '0.72rem', color: 'var(--mobile-muted)', textTransform: 'uppercase' }}>{s.category}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {s.promoPrice ? (
                        <>
                          <span className="service-card-compact-price" style={{ color: 'var(--mobile-green)' }}>R$ {s.promoPrice}</span>
                          <span style={{ display: 'block', fontSize: '0.7rem', textDecoration: 'line-through', color: 'var(--mobile-muted)' }}>R$ {s.price}</span>
                        </>
                      ) : (
                        <span className="service-card-compact-price">R$ {s.price}</span>
                      )}
                    </div>
                  </div>
                  
                  {s.description && (
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#4a3f35', lineHeight: 1.4 }}>{s.description}</p>
                  )}

                  <div className="service-card-compact-meta">
                    <span>⏱️ {s.duration || 60} minutos</span>
                    <span>💰 Custo: R$ {s.cost || 0}</span>
                    {s.scheduledViaWhatsapp && <span style={{ color: 'var(--mobile-primary)', fontWeight: 'bold' }}>💬 Reserva via WhatsApp</span>}
                  </div>

                  <div className="service-card-compact-actions">
                    <button 
                      type="button"
                      className="btn-service-action" 
                      onClick={() => {
                        setEditingService(s);
                        setServiceForm({
                          name: s.name || '',
                          category: s.category || 'Cabelo',
                          description: s.description || '',
                          price: s.price || '',
                          priceType: s.priceType || 'Fixo',
                          promoPrice: s.promoPrice || '',
                          duration: s.duration || '60',
                          cost: s.cost || '',
                          isPrimary: s.isPrimary ?? true,
                          scheduledViaWhatsapp: !!s.scheduledViaWhatsapp,
                          position: s.position ?? ''
                        });
                        setShowServiceModal(true);
                      }}
                    >
                      Editar
                    </button>
                    <button 
                      type="button"
                      className="btn-service-action" 
                      style={{ borderColor: 'var(--mobile-red)', color: 'var(--mobile-red)' }}
                      onClick={() => handleDeleteService(s.id)}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            {services.filter(s => serviceCategory === 'Todos' || s.category === serviceCategory).length === 0 && (
              <div className="mobile-empty-state">Nenhum serviço cadastrado nesta categoria.</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'estoque' && (
        <div className="mobile-backoffice-subview">
          <div className="inventory-metrics-grid">
            <div className="inventory-metric-card">
              <span>Total de Produtos</span>
              <div className="metric-val">{inventory.reduce((sum, p) => sum + (p.quantity || 0), 0)} un.</div>
            </div>
            <div className="inventory-metric-card">
              <span>Valor Total de Venda</span>
              <div className="metric-val" style={{ color: 'var(--mobile-green)' }}>
                R$ {inventory.reduce((sum, p) => sum + ((p.sellingPrice || 0) * (p.quantity || 0)), 0).toFixed(0)}
              </div>
            </div>
          </div>

          <button 
            type="button"
            className="mobile-btn-solid" 
            style={{ minHeight: '48px', width: '100%' }}
            onClick={() => {
              setEditingProduct(null);
              setProductForm({ name: '', category: 'Shampoo', quantity: 0, costPrice: 0, sellingPrice: 0, minStock: 3 });
              setShowProductModal(true);
            }}
          >
            <Plus size={18} /> Novo Produto
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {inventory.map(p => {
              const isLow = (p.quantity || 0) <= (p.minStock || 3);
              return (
                <div key={p.id} className="product-row-card">
                  <div className="product-row-info">
                    <div>
                      <span className="product-name">{p.name}</span>
                      <span className="product-category-tag" style={{ display: 'block', marginTop: 2 }}>{p.category}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block' }}>Venda: R$ {p.sellingPrice}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--mobile-muted)' }}>Custo: R$ {p.costPrice}</span>
                    </div>
                  </div>

                  <div className="product-stock-control">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="stock-current-display">
                        Qtd Atual: <strong className={isLow ? 'low-stock' : ''}>{p.quantity} un.</strong>
                      </span>
                      {isLow && <span style={{ fontSize: '0.62rem', color: 'var(--mobile-red)', fontWeight: 'bold' }}>⚠️ ESTOQUE BAIXO (Mín: {p.minStock})</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button 
                        type="button" 
                        className="stock-adjust-btn"
                        onClick={() => handleQuickStockAdjust(p, -1)}
                      >
                        -
                      </button>
                      <button 
                        type="button" 
                        className="stock-adjust-btn"
                        style={{ color: 'var(--mobile-green)' }}
                        onClick={() => handleQuickStockAdjust(p, 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, justifycontent: 'flex-end', borderTop: '1px solid var(--mobile-rule)', paddingTop: 10 }}>
                    <button 
                      type="button"
                      className="btn-service-action" 
                      onClick={() => {
                        setEditingProduct(p);
                        setProductForm({
                          name: p.name || '',
                          category: p.category || 'Shampoo',
                          quantity: p.quantity || 0,
                          costPrice: p.costPrice || 0,
                          sellingPrice: p.sellingPrice || 0,
                          minStock: p.minStock || 3
                        });
                        setShowProductModal(true);
                      }}
                    >
                      Editar
                    </button>
                    <button 
                      type="button"
                      className="btn-service-action" 
                      style={{ borderColor: 'var(--mobile-red)', color: 'var(--mobile-red)' }}
                      onClick={() => handleDeleteProduct(p.id)}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              );
            })}
            {inventory.length === 0 && (
              <div className="mobile-empty-state">Nenhum produto cadastrado no almoxarifado.</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'financeiro' && (
        <div className="mobile-backoffice-subview">
          {/* Subtelas Dashboard vs Lançamentos */}
          <div className="config-sub-tabs">
            <button 
              type="button"
              className={`config-sub-tab-btn ${financeSubTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setFinanceSubTab('dashboard')}
            >
              Painel Geral
            </button>
            <button 
              type="button"
              className={`config-sub-tab-btn ${financeSubTab === 'lancamentos' ? 'active' : ''}`}
              onClick={() => setFinanceSubTab('lancamentos')}
            >
              Extrato & Lançamentos
            </button>
          </div>

          {/* Filtro de Período */}
          <div className="mobile-form-group">
            <label>Filtrar Período</label>
            <select value={dateWindow} onChange={e => setDateWindow(e.target.value)}>
              <option value="hoje">Hoje</option>
              <option value="semana">Esta Semana</option>
              <option value="mes">Este Mês</option>
              <option value="personalizado">Personalizado</option>
            </select>
          </div>

          {dateWindow === 'personalizado' && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>De</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Até</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>
          )}

          {(() => {
            const getCustomPeriodStats = () => {
              let filtered = transactions;
              if (dateWindow === 'hoje') {
                filtered = transactions.filter(t => t.date === todayStr);
              } else if (dateWindow === 'semana') {
                const wDays = getWeekDays(todayStr);
                filtered = transactions.filter(t => t.date && wDays.includes(t.date));
              } else if (dateWindow === 'mes') {
                const prefix = todayStr.substring(0, 7); // YYYY-MM
                filtered = transactions.filter(t => t.date && t.date.startsWith(prefix));
              } else if (dateWindow === 'personalizado') {
                filtered = transactions.filter(t => t.date && t.date >= startDate && t.date <= endDate);
              }
              const receitas = filtered.filter(t => t.type === 'entrada').reduce((sum, t) => sum + (t.value || 0), 0);
              const despesas = filtered.filter(t => t.type === 'saida').reduce((sum, t) => sum + (t.value || 0), 0);
              return { list: filtered, receitas, despesas, saldo: receitas - despesas };
            };
            const periodData = getCustomPeriodStats();
            
            if (financeSubTab === 'dashboard') {
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* KPIs */}
                  <div className="finance-kpi-card">
                    <div className="finance-kpi-row">
                      <span>Faturamento Bruto</span>
                      <span className="value" style={{ color: 'var(--mobile-green)', fontSize: '1.25rem' }}>
                        R$ {periodData.receitas.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <div className="finance-kpi-row">
                      <span>Despesas Totais</span>
                      <span className="value" style={{ color: 'var(--mobile-red)' }}>
                        R$ {periodData.despesas.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <div className="finance-kpi-row" style={{ borderTop: '1.5px solid var(--mobile-rule)', paddingTop: 10, marginTop: 4 }}>
                      <span>Saldo Líquido</span>
                      <span className="value" style={{ color: periodData.saldo >= 0 ? 'var(--mobile-green)' : 'var(--mobile-red)', fontSize: '1.15rem' }}>
                        R$ {periodData.saldo.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>

                  {/* Resumo por Forma de Pagamento */}
                  <div className="technical-row-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                    {['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro'].map(method => {
                      const value = periodData.list
                        .filter(t => t.type === 'entrada' && t.paymentMethod === method)
                        .reduce((sum, t) => sum + (t.value || 0), 0);
                      return (
                        <div key={method} className="inventory-metric-card">
                          <span>{method}</span>
                          <div className="metric-val" style={{ fontSize: '0.95rem' }}>R$ {value.toFixed(0)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            } else {
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <button 
                    type="button"
                    className="mobile-btn-solid" 
                    style={{ minHeight: '48px', width: '100%' }}
                    onClick={() => {
                      setFinanceForm({
                        type: 'saida',
                        description: '',
                        value: '',
                        paymentMethod: 'Pix',
                        date: new Date().toISOString().split('T')[0]
                      });
                      setShowFinanceModal(true);
                    }}
                  >
                    <Plus size={18} /> Lançar Entrada/Saída Manual
                  </button>

                  <div className="client-search-bar">
                    <Search size={18} />
                    <input 
                      type="text" 
                      placeholder="Buscar por descrição ou cliente..."
                      value={ledgerSearch}
                      onChange={e => setLedgerSearch(e.target.value)}
                    />
                  </div>

                  {/* Filtros rápidos extrato */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <select 
                      style={{ flex: 1, padding: 8, fontSize: '0.8rem', borderRadius: 8, border: '1px solid var(--mobile-rule)' }}
                      value={ledgerTypeFilter} 
                      onChange={e => setLedgerTypeFilter(e.target.value)}
                    >
                      <option value="todos">Todos os Lançamentos</option>
                      <option value="entrada">Entradas (+)</option>
                      <option value="saida">Saídas (-)</option>
                    </select>

                    <select 
                      style={{ flex: 1, padding: 8, fontSize: '0.8rem', borderRadius: 8, border: '1px solid var(--mobile-rule)' }}
                      value={ledgerMethodFilter} 
                      onChange={e => setLedgerMethodFilter(e.target.value)}
                    >
                      <option value="todos">Todas as Formas</option>
                      <option value="Pix">PIX</option>
                      <option value="Cartão de Crédito">Crédito</option>
                      <option value="Cartão de Débito">Débito</option>
                      <option value="Dinheiro">Dinheiro</option>
                    </select>
                  </div>

                  {/* Histórico Extrato */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                    {periodData.list
                      .filter(t => {
                        const search = ledgerSearch.toLowerCase();
                        const matchesSearch = (t.description || '').toLowerCase().includes(search) || (t.clientName || '').toLowerCase().includes(search);
                        const matchesType = ledgerTypeFilter === 'todos' || t.type === ledgerTypeFilter;
                        const matchesMethod = ledgerMethodFilter === 'todos' || t.paymentMethod === ledgerMethodFilter;
                        return matchesSearch && matchesType && matchesMethod;
                      })
                      .map(t => (
                        <div key={t.id} className="transaction-ledger-row">
                          <div className="tx-ledger-left">
                            <span className="tx-title">{t.clientName || 'Lançamento'} · <span style={{ fontWeight: 'normal', color: 'var(--mobile-muted)' }}>{t.description || 'Geral'}</span></span>
                            <span className="tx-meta">{t.date.split('-').reverse().join('/')} · {t.paymentMethod}</span>
                          </div>
                          <div className="tx-ledger-right">
                            <span className={`tx-value ${t.type}`}>
                              {t.type === 'entrada' ? '+' : '-'} R$ {t.value.toFixed(2).replace('.', ',')}
                            </span>
                            <button 
                              type="button" 
                              onClick={() => handleDeleteTransaction(t.id)}
                              style={{ background: 'none', border: 'none', color: 'var(--mobile-red)', padding: 6, display: 'flex', alignItems: 'center' }}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    {periodData.list.length === 0 && (
                      <div className="mobile-empty-state">Nenhum lançamento no período filtrado.</div>
                    )}
                  </div>
                </div>
              );
            }
          })()}
        </div>
      )}

      {activeTab === 'configuracoes' && (
        <div className="mobile-backoffice-subview">
          <div className="config-sub-tabs">
            {['perfil', 'horarios', 'politicas', 'whatsapp', 'profissionais'].map(sub => (
              <button 
                type="button"
                key={sub} 
                className={`config-sub-tab-btn ${configSubTab === sub ? 'active' : ''}`}
                onClick={() => setConfigSubTab(sub)}
                style={{ textTransform: 'capitalize' }}
              >
                {sub === 'politicas' ? 'Taxas & Políticas' : sub === 'whatsapp' ? 'WhatsApp Gateway' : sub}
              </button>
            ))}
          </div>

          {settings ? (
            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* SUBTAB: PERFIL */}
              {configSubTab === 'perfil' && (
                <>
                  <div className="mobile-form-group">
                    <label>Nome do Estúdio</label>
                    <input 
                      type="text" 
                      value={settings.name || ''} 
                      onChange={e => setSettings(prev => ({ ...prev, name: e.target.value }))} 
                    />
                  </div>
                  <div className="mobile-form-group">
                    <label>Telefone Comercial</label>
                    <input 
                      type="text" 
                      value={settings.phone || ''} 
                      onChange={e => setSettings(prev => ({ ...prev, phone: e.target.value }))} 
                    />
                  </div>
                  <div className="mobile-form-group">
                    <label>Endereço Completo</label>
                    <textarea 
                      rows={2}
                      value={settings.address || ''} 
                      onChange={e => setSettings(prev => ({ ...prev, address: e.target.value }))} 
                    />
                  </div>
                  <div className="mobile-form-group">
                    <label>Instagram URL</label>
                    <input 
                      type="text" 
                      value={settings.instagram || ''} 
                      onChange={e => setSettings(prev => ({ ...prev, instagram: e.target.value }))} 
                    />
                  </div>
                </>
              )}

              {/* SUBTAB: HORARIOS */}
              {configSubTab === 'horarios' && (
                <div style={{ background: 'white', padding: 14, borderRadius: 12, border: '1px solid var(--mobile-rule)' }}>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--mobile-muted)', lineHeight: 1.4 }}>
                    ℹ️ A grade horária padrão do estúdio é das <strong>09:00 às 19:00</strong>.<br/>
                    Para gerenciar folgas semanais e bloqueios de escala personalizados de profissionais, acesse a aba <strong>Profissionais</strong>.
                  </p>
                </div>
              )}

              {/* SUBTAB: POLITICAS */}
              {configSubTab === 'politicas' && (
                <>
                  <div className="mobile-form-group">
                    <label>Taxa PIX (%)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={settings.feePix ?? 0} 
                      onChange={e => setSettings(prev => ({ ...prev, feePix: Number(e.target.value) }))} 
                    />
                  </div>
                  <div className="mobile-form-group">
                    <label>Taxa Débito (%)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={settings.feeDebit ?? 1.9} 
                      onChange={e => setSettings(prev => ({ ...prev, feeDebit: Number(e.target.value) }))} 
                    />
                  </div>
                  <div className="mobile-form-group">
                    <label>Taxa Crédito à Vista (%)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={settings.feeCredit ?? 3.5} 
                      onChange={e => setSettings(prev => ({ ...prev, feeCredit: Number(e.target.value) }))} 
                    />
                  </div>
                  <div className="mobile-form-group">
                    <label>Antecedência Mínima para Reserva (Horas)</label>
                    <input 
                      type="number" 
                      value={settings.minAdvance || 2} 
                      onChange={e => setSettings(prev => ({ ...prev, minAdvance: Number(e.target.value) }))} 
                    />
                  </div>
                </>
              )}

              {/* SUBTAB: WHATSAPP */}
              {configSubTab === 'whatsapp' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '6px 0' }}>
                    <input 
                      type="checkbox" 
                      id="waReminderEnabled"
                      style={{ width: 20, height: 20 }}
                      checked={!!settings.waReminderEnabled} 
                      onChange={e => setSettings(prev => ({ ...prev, waReminderEnabled: e.target.checked }))} 
                    />
                    <label htmlFor="waReminderEnabled" style={{ fontWeight: 'bold', fontSize: '0.85rem', margin: 0, cursor: 'pointer' }}>
                      Enviar lembretes automáticos de WhatsApp
                    </label>
                  </div>

                  <div className="mobile-form-group">
                    <label>Evolution API URL</label>
                    <input 
                      type="text" 
                      value={settings.evolutionApiUrl || ''} 
                      onChange={e => setSettings(prev => ({ ...prev, evolutionApiUrl: e.target.value }))} 
                    />
                  </div>
                  <div className="mobile-form-group">
                    <label>Evolution API Key</label>
                    <input 
                      type="password" 
                      value={settings.evolutionApiKey || ''} 
                      onChange={e => setSettings(prev => ({ ...prev, evolutionApiKey: e.target.value }))} 
                    />
                  </div>
                  <div className="mobile-form-group">
                    <label>Evolution Instance Name</label>
                    <input 
                      type="text" 
                      value={settings.evolutionInstanceName || ''} 
                      onChange={e => setSettings(prev => ({ ...prev, evolutionInstanceName: e.target.value }))} 
                    />
                  </div>
                  <div className="mobile-form-group">
                    <label>Template do Lembrete automático</label>
                    <textarea 
                      rows={3}
                      value={settings.waReminderTemplate || ''} 
                      onChange={e => setSettings(prev => ({ ...prev, waReminderTemplate: e.target.value }))} 
                    />
                    <span style={{ fontSize: '0.65rem', color: 'var(--mobile-muted)' }}>Use tags: {"{cliente}"}, {"{data}"}, {"{hora}"}, {"{servico}"}</span>
                  </div>
                </>
              )}

              {/* SUBTAB: PROFISSIONAIS */}
              {configSubTab === 'profissionais' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <button 
                    type="button"
                    className="mobile-btn-solid" 
                    style={{ minHeight: '48px', width: '100%' }}
                    onClick={() => {
                      setEditingProfId(null);
                      setProfForm({
                        name: '',
                        avatar: '',
                        commissionService: 50,
                        commissionProduct: 10,
                        phone: '',
                        email: '',
                        active: true,
                        workStart: '09:00',
                        workEnd: '19:00',
                        lunchStart: '12:00',
                        lunchEnd: '13:00',
                        daysOff: [0, 1]
                      });
                      setShowProfFormModal(true);
                    }}
                  >
                    <Plus size={18} /> Adicionar Profissional
                  </button>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {activeProfessionalsList.map(p => (
                      <div key={p.id} className="transaction-ledger-row">
                        <div className="tx-ledger-left">
                          <span className="tx-title" style={{ fontSize: '0.9rem' }}>{p.name} {p.id === 'jon' && '👑'}</span>
                          <span className="tx-meta">Comissões: {p.commissionService}% Serv. / {p.commissionProduct || 10}% Prod.</span>
                          <span className="tx-meta">Horário: {p.workStart} - {p.workEnd} (Almoço: {p.lunchStart}-{p.lunchEnd})</span>
                        </div>
                        <div className="tx-ledger-right">
                          <button 
                            type="button" 
                            className="btn-service-action"
                            style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                            onClick={() => {
                              setEditingProfId(p.id);
                              setProfForm({
                                name: p.name || '',
                                avatar: p.avatar || '',
                                commissionService: p.commissionService ?? 50,
                                commissionProduct: p.commissionProduct ?? 10,
                                phone: p.phone || '',
                                email: p.email || '',
                                active: p.active ?? true,
                                workStart: p.workStart || '09:00',
                                workEnd: p.workEnd || '19:00',
                                lunchStart: p.lunchStart || '12:00',
                                lunchEnd: p.lunchEnd || '13:00',
                                daysOff: p.daysOff || [0, 1]
                              });
                              setShowProfFormModal(true);
                            }}
                          >
                            Editar
                          </button>
                          {p.id !== 'jon' && (
                            <button 
                              type="button" 
                              className="btn-service-action"
                              style={{ borderColor: 'var(--mobile-red)', color: 'var(--mobile-red)', padding: '4px 8px', fontSize: '0.72rem' }}
                              onClick={() => handleDeleteProf(p.id)}
                            >
                              Remover
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botão de salvar geral (não exibido na sub-aba profissionais) */}
              {configSubTab !== 'profissionais' && (
                <button 
                  type="submit" 
                  className="mobile-btn-solid" 
                  style={{ minHeight: '48px', marginTop: 12 }}
                >
                  Salvar Ajustes do Estúdio
                </button>
              )}
            </form>
          ) : (
            <div className="mobile-empty-state">Carregando configurações...</div>
          )}
        </div>
      )}

      {activeTab === 'marketing' && (
        <div className="mobile-backoffice-subview">
          <div className="config-sub-tabs">
            <button 
              type="button"
              className={`config-sub-tab-btn ${marketingSubTab === 'campanha' ? 'active' : ''}`}
              onClick={() => setMarketingSubTab('campanha')}
            >
              Campanha Lote CRM
            </button>
            <button 
              type="button"
              className={`config-sub-tab-btn ${marketingSubTab === 'automacoes' ? 'active' : ''}`}
              onClick={() => setMarketingSubTab('automacoes')}
            >
              Réguas de Reativação
            </button>
            <button 
              type="button"
              className={`config-sub-tab-btn ${marketingSubTab === 'logs' ? 'active' : ''}`}
              onClick={() => setMarketingSubTab('logs')}
            >
              Histórico Disparos
            </button>
          </div>

          {/* CRM CAMPANHA LOTE */}
          {marketingSubTab === 'campanha' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="mobile-form-group">
                <label>Segmento Alvo da Campanha</label>
                <select 
                  value={marketingCampaignTarget} 
                  onChange={e => setMarketingCampaignTarget(e.target.value)}
                >
                  <option value="inativos_30">Inativos (Sem visitar de 30 a 60 dias)</option>
                  <option value="inativos_60">Inativos Críticos (Mais de 60 dias sem visitar)</option>
                  <option value="nunca_visitaram">Novos contatos (Nunca visitaram/Sem ficha)</option>
                  <option value="todos">Todos os Clientes Cadastrados</option>
                </select>
              </div>

              {/* Contagem imediata dos alvos */}
              {(() => {
                const now = new Date();
                const count = derivedClientsList.filter(c => {
                  const lastVisitDate = c.lastVisit;
                  if (lastVisitDate === 'Nunca visitou' || !lastVisitDate) {
                    return marketingCampaignTarget === 'nunca_visitaram' || marketingCampaignTarget === 'todos';
                  }
                  const diffTime = Math.abs(now - new Date(lastVisitDate));
                  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  if (marketingCampaignTarget === 'inativos_30') return days >= 30 && days <= 60;
                  if (marketingCampaignTarget === 'inativos_60') return days > 60;
                  return marketingCampaignTarget === 'todos';
                }).length;

                return (
                  <div style={{ background: '#f0f4f8', border: '1px solid #d2e3f3', borderRadius: 8, padding: '8px 12px', fontSize: '0.85rem', color: '#2b6cb0', fontWeight: 'bold' }}>
                    🎯 Clientes elegíveis neste segmento: {count} contatos
                  </div>
                );
              })()}

              <div className="mobile-form-group">
                <label>Mensagem de Disparo (WhatsApp)</label>
                <textarea 
                  rows={4}
                  value={marketingCampaignMessage} 
                  onChange={e => setMarketingCampaignMessage(e.target.value)}
                  placeholder="Olá {nome}! Notamos que faz tempo..."
                />
                <span style={{ fontSize: '0.65rem', color: 'var(--mobile-muted)', lineHeight: 1.3, display: 'block', marginTop: 4 }}>
                  Variáveis dinâmicas:<br/>
                  • <strong>{"{nome}"}</strong>: primeiro nome do cliente<br/>
                  • <strong>{"{dias_ausente}"}</strong>: número de dias sem agendamento<br/>
                  • <strong>{"{ultimo_servico}"}</strong>: último serviço realizado
                </span>
              </div>

              {/* Progress bar */}
              {isSendingMarketingCampaign && (
                <div style={{ background: 'white', border: '1px solid var(--mobile-rule)', borderRadius: 12, padding: 14, marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 'bold', marginBottom: 6 }}>
                    <span>Enviando mensagens...</span>
                    <span>{marketingCampaignProgress} / {marketingCampaignTotal}</span>
                  </div>
                  <div style={{ background: '#edf2f7', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        background: 'var(--mobile-primary)', 
                        height: '100%', 
                        width: `${(marketingCampaignProgress / marketingCampaignTotal) * 100}%`,
                        transition: 'width 0.3s ease'
                      }} 
                    />
                  </div>
                </div>
              )}

              {/* Console Logs */}
              {marketingLogs.length > 0 && (
                <div className="marketing-console-logs">
                  {marketingLogs.map((log, idx) => (
                    <div key={idx}>{log}</div>
                  ))}
                </div>
              )}

              <button 
                type="button"
                className="mobile-btn-solid" 
                style={{ minHeight: '48px', marginTop: 8, background: 'var(--mobile-primary)' }}
                disabled={isSendingMarketingCampaign}
                onClick={handleSendMarketingCampaign}
              >
                {isSendingMarketingCampaign ? '🚀 Disparando mensagens...' : '🚀 Disparar Campanha via WhatsApp'}
              </button>
            </div>
          )}

          {/* RÉGUAS DE REATIVAÇÃO */}
          {marketingSubTab === 'automacoes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="finance-kpi-card" style={{ padding: 14 }}>
                <h5 style={{ margin: '0 0 6px 0', fontWeight: 'bold' }}>📅 Automação Pós-Atendimento (D1)</h5>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--mobile-muted)', lineHeight: 1.4 }}>
                  Dispara automaticamente 24h após um corte para colher avaliação ou tirar dúvidas.
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <span style={{ fontSize: '0.72rem', background: '#e6fffa', color: '#0987a0', fontWeight: 'bold', padding: '3px 8px', borderRadius: 8 }}>ATIVADO (Vercel Cron)</span>
                </div>
              </div>

              <div className="finance-kpi-card" style={{ padding: 14 }}>
                <h5 style={{ margin: '0 0 6px 0', fontWeight: 'bold' }}>📅 Reativação Crítica (D90)</h5>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--mobile-muted)', lineHeight: 1.4 }}>
                  Campanha para clientes ausentes há 90 dias com cupom personalizado de retorno.
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <span style={{ fontSize: '0.72rem', background: '#e6fffa', color: '#0987a0', fontWeight: 'bold', padding: '3px 8px', borderRadius: 8 }}>ATIVADO (Vercel Cron)</span>
                </div>
              </div>

              <div className="finance-kpi-card" style={{ padding: 14 }}>
                <h5 style={{ margin: '0 0 6px 0', fontWeight: 'bold' }}>🎂 Campanhas de Aniversariantes</h5>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--mobile-muted)', lineHeight: 1.4 }}>
                  Dispara no início da semana parabenizando e oferecendo um brinde ou desconto.
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <span style={{ fontSize: '0.72rem', background: '#e6fffa', color: '#0987a0', fontWeight: 'bold', padding: '3px 8px', borderRadius: 8 }}>ATIVADO (Vercel Cron)</span>
                </div>
              </div>
            </div>
          )}

          {/* HISTÓRICO DISPAROS */}
          {marketingSubTab === 'logs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(() => {
                const localLogs = JSON.parse(localStorage.getItem('demo_automation_logs') || '[]');
                if (localLogs.length === 0) {
                  return <div className="mobile-empty-state">Nenhum log de disparo recente no cache local.</div>;
                }
                return localLogs.slice(0, 30).map((log, index) => (
                  <div key={index} className="transaction-ledger-row" style={{ padding: 10 }}>
                    <div className="tx-ledger-left">
                      <span className="tx-title" style={{ fontSize: '0.8rem' }}>{log.clientName} ({log.clientPhone})</span>
                      <span className="tx-meta">{log.stage} · Canal: {log.channel}</span>
                    </div>
                    <div className="tx-ledger-right">
                      <span style={{ fontSize: '0.7rem', color: 'var(--mobile-green)', fontWeight: 'bold' }}>✓ SUCCESS</span>
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>
      )}

      {/* Floating Action Button (FAB) Menu */}
      <div className="mobile-fab-container">
        <button 
          className={`mobile-fab-btn ${isFabOpen ? 'active' : ''}`} 
          onClick={() => setIsFabOpen(!isFabOpen)}
        >
          <Plus size={24} />
        </button>
        {isFabOpen && (
          <div className="mobile-fab-menu">
            <div className="mobile-fab-item" onClick={() => { setIsFabOpen(false); setEditingBookingId(null); resetBookingForm(); setNewBooking(prev => ({ ...prev, date: new Date().toISOString().split('T')[0] })); setShowAddBookingModal(true); }}>
              <CalendarIcon size={16} /> Novo agendamento
            </div>
            <div className="mobile-fab-item" onClick={() => { setIsFabOpen(false); setShowAddClientModal(true); }}>
              <User size={16} /> Registrar cliente
            </div>
            <div className="mobile-fab-item" onClick={() => { setIsFabOpen(false); setShowDirectSaleModal(true); }}>
              <DollarSign size={16} /> Venda avulsa de produtos
            </div>
          </div>
        )}
      </div>

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
                  {selectedBooking.isPackageUse && (
                    <div className="mobile-detail-row">
                      <span className="label" style={{ color: 'var(--mobile-primary)' }}>PACOTE UTILIZADO</span>
                      <span className="value" style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Package size={14} /> Uso de Pacote (Crédito)
                      </span>
                    </div>
                  )}
                  {selectedBooking.isPackageAcquisition && (
                    <div className="mobile-detail-row">
                      <span className="label" style={{ color: 'var(--mobile-primary)' }}>PACOTE ADQUIRIDO</span>
                      <span className="value" style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Package size={14} /> Aquisição de Pacote
                      </span>
                    </div>
                  )}
                  <div className="mobile-detail-row">
                    <span className="label">VALOR</span>
                    <span className="value" style={{ color: 'var(--mobile-green)', fontWeight: 800 }}>
                      {selectedBooking.isPackageUse 
                        ? 'R$ 0,00 (Pacote)' 
                        : `R$ ${(selectedBooking.service?.price || selectedBooking.servicePrice || 150).toFixed(2).replace('.', ',')}`}
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
                    {selectedBooking.status === 'finalizado' ? (
                      <>
                        <h5>💬 Solicitar Feedback do Cliente</h5>
                        <div className="mobile-message-options">
                          <button 
                            className="mobile-msg-btn-whatsapp" 
                            style={{ background: '#25D366', color: 'white', minHeight: '48px' }} 
                            onClick={() => {
                              const url = getWhatsAppFeedbackUrl(selectedBooking.clientPhone, selectedBooking);
                              if (url) window.open(url, '_blank');
                            }}
                          >
                            <MessageSquare size={16} /> Pedir Avaliação
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
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
                <button 
                  className="mobile-btn-outline" 
                  style={{ borderColor: '#cbd5e0', color: '#4a5568', flex: '1 1 100%', marginTop: 8 }} 
                  onClick={() => setSelectedBooking(null)}
                >
                  Fechar / Voltar para a Agenda
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SELEÇÃO DE AÇÃO PARA O SLOT CLICADO */}
      {showSlotActionModal && selectedSlot && (
        <div className="mobile-overlay" onClick={() => setShowSlotActionModal(false)}>
          <div className="mobile-popup-modal slot-action-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-sheet-header">
              <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6 }}>
                ⚡ Nova Entrada
              </h4>
              <button onClick={() => setShowSlotActionModal(false)}><X size={20} /></button>
            </div>
            
            <div style={{ textAlign: 'center', marginBottom: 16, fontSize: '0.88rem', color: 'var(--mobile-muted)' }}>
              Horário selecionado: <strong style={{ color: 'var(--mobile-text)' }}>{selectedSlot.time}</strong> em {selectedSlot.date.split('-').reverse().join('/')}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                className="mobile-btn-solid"
                style={{ width: '100%', padding: '14px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: '10px' }}
                onClick={() => {
                  setShowSlotActionModal(false);
                  setNewBooking(prev => ({
                    ...prev,
                    clientName: '',
                    clientPhone: '',
                    clientEmail: '',
                    serviceName: services[0]?.name || 'Corte com o Jon',
                    servicePrice: services[0]?.promoPrice || services[0]?.price || 150,
                    duration: services[0]?.duration || 60,
                    date: selectedSlot.date,
                    time: selectedSlot.time,
                    notes: ''
                  }));
                  setShowAddBookingModal(true);
                }}
              >
                <CalendarIcon size={18} /> Agendar Cliente
              </button>
              
              <button
                className="mobile-btn-outline"
                style={{ width: '100%', padding: '14px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: '10px' }}
                onClick={() => {
                  setShowSlotActionModal(false);
                  setBlockEndTime('');
                  setBlockMotive('');
                  setNewBooking(prev => ({
                    ...prev,
                    date: selectedSlot.date,
                    time: selectedSlot.time
                  }));
                  setShowBlockModal(true);
                }}
              >
                🔒 Cadastrar Ausência
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ADICIONAR/EDITAR AGENDAMENTO */}
      {showAddBookingModal && (
        <div className="mobile-overlay" onClick={() => { setShowAddBookingModal(false); setEditingBookingId(null); }}>
          <div className="mobile-bottom-sheet" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '92vh', overflowY: 'auto' }}>
            <div className="mobile-sheet-header">
              <h4>{editingBookingId ? 'Editar Agendamento' : 'Novo Agendamento'}</h4>
              <button type="button" onClick={() => { setShowAddBookingModal(false); setEditingBookingId(null); }} style={{ background: 'none', border: 'none', color: 'var(--mobile-muted)', cursor: 'pointer' }}><X size={20} /></button>
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
                {/* BOTÃO CADASTRAR NOVO CLIENTE */}
                <div style={{ marginTop: 8, textAlign: 'right' }}>
                  <button type="button" onClick={() => setShowAddClientModal(true)} style={{ background: 'none', border: 'none', color: 'var(--mobile-primary)', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
                    <Plus size={14} /> Cadastrar novo cliente
                  </button>
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
                <label>Sinal / Adiantamento Pago (R$)</label>
                <input 
                  type="number" 
                  placeholder="Ex: 50"
                  value={newBooking.prepayment || ''}
                  onChange={e => setNewBooking(prev => ({ ...prev, prepayment: Number(e.target.value) }))}
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
              <div style={{ marginBottom: 16 }}>
                <button type="button" onClick={handleImportContact} className="mobile-btn-outline" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, borderColor: 'var(--mobile-primary)', color: 'var(--mobile-primary)' }}>
                  <User size={16} /> Importar contato da agenda
                </button>
              </div>

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
          <div className="mobile-popup-modal" onClick={(e) => e.stopPropagation()} style={{ padding: '14px', width: '92%', maxWidth: '380px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflowY: 'auto', gap: '8px' }}>
            <div className="mobile-sheet-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Fechar Comanda</h4>
              <button onClick={() => setShowCheckoutModal(false)} style={{ background: 'none', border: 'none', color: '#718096', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: '0.8rem' }}>
                <span style={{ fontSize: '0.7rem', color: '#718096', display: 'block', textTransform: 'uppercase' }}>Cliente</span>
                <strong>{checkoutBooking.clientName}</strong>
              </div>
              
              <div style={{ background: '#f8f9fa', padding: '8px', borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '0.7rem', color: '#718096', display: 'block', fontWeight: 700 }}>ITENS DA COMANDA</span>
                
                {/* Substituição do Serviço Agendado */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, borderBottom: '1px solid #edf2f7', paddingBottom: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Serviço Principal</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>R$ {(checkoutBooking.service?.promoPrice || checkoutBooking.service?.price || checkoutBooking.servicePrice || 150).toFixed(2).replace('.', ',')}</span>
                  </div>
                  <select
                    value={checkoutBooking.service?.name || checkoutBooking.serviceName}
                    onChange={e => {
                      const newName = e.target.value;
                      const match = services.find(s => s.name === newName);
                      if (match) {
                        setCheckoutBooking(prev => ({
                          ...prev,
                          serviceName: newName,
                          servicePrice: match.promoPrice || match.price,
                          service: match
                        }));
                      }
                    }}
                    style={{ width: '100%', padding: '3px 6px', fontSize: '0.75rem', borderRadius: 4, border: '1px solid #cbd5e0', background: '#fff' }}
                  >
                    {services.map(s => (
                      <option key={s.id} value={s.name}>
                        {s.name} (R$ {s.promoPrice || s.price})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Lista de Serviços Extras Adicionados */}
                {selectedExtraServices.map((s, idx) => (
                  <div key={'s-' + idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                    <span style={{ color: 'var(--mobile-primary)' }}>➕ {s.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontWeight: 600 }}>R$ {s.price.toFixed(2).replace('.', ',')}</span>
                      <button type="button" onClick={() => setSelectedExtraServices(prev => prev.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: 'var(--mobile-red)', padding: 2, cursor: 'pointer' }}>
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Lista de Produtos Adicionados */}
                {selectedProducts.map((prod, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                    <span style={{ color: '#4a5568' }}>📦 {prod.qty}x {prod.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontWeight: 600 }}>R$ {(prod.sellingPrice * prod.qty).toFixed(2).replace('.', ',')}</span>
                      <button type="button" onClick={() => {
                        const newProds = [...selectedProducts];
                        newProds.splice(index, 1);
                        setSelectedProducts(newProds);
                      }} style={{ background: 'none', border: 'none', color: 'var(--mobile-red)', padding: 2, cursor: 'pointer' }}>
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Lançamento de extras - Lado a Lado Compacto */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <div className="mobile-form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.7rem', marginBottom: 2 }}>Serviço Extra</label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <select 
                      id="checkout-service-select"
                      style={{ flex: 1, padding: '3px 6px', fontSize: '0.75rem', height: '28px', minHeight: 'auto' }}
                      defaultValue=""
                    >
                      <option value="" disabled>Selecione</option>
                      {services.map(s => (
                        <option key={s.id} value={`${s.name}|${s.promoPrice || s.price}`}>{s.name}</option>
                      ))}
                    </select>
                    <button type="button" className="mobile-btn-solid" style={{ padding: '0 8px', background: 'var(--mobile-primary)', height: '28px' }} onClick={() => {
                      const selectEl = document.getElementById('checkout-service-select');
                      if (!selectEl || !selectEl.value) return;
                      const [name, priceStr] = selectEl.value.split('|');
                      setSelectedExtraServices(prev => [...prev, { name, price: Number(priceStr) }]);
                      selectEl.value = "";
                    }}>+</button>
                  </div>
                </div>

                <div className="mobile-form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.7rem', marginBottom: 2 }}>Adicionar Produto</label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <select 
                      id="checkout-product-select"
                      style={{ flex: 1, padding: '3px 6px', fontSize: '0.75rem', height: '28px', minHeight: 'auto' }}
                      defaultValue=""
                    >
                      <option value="" disabled>Selecione</option>
                      {inventory.filter(i => i.quantity > 0).map(i => (
                        <option key={i.id} value={i.id}>{i.name}</option>
                      ))}
                    </select>
                    <button type="button" className="mobile-btn-solid" style={{ padding: '0 8px', background: 'var(--mobile-primary)', height: '28px' }} onClick={() => {
                      const selectEl = document.getElementById('checkout-product-select');
                      if (!selectEl || !selectEl.value) return;
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
                    }}>+</button>
                  </div>
                </div>
              </div>

              {/* Pacotes / Vender Pacote - Compacto Lado a Lado */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.01)', padding: '4px 6px', borderRadius: '6px', border: '1px solid #edf2f7' }}>
                {availablePackagesForBooking.length > 0 && (
                  <div className="mobile-form-group" style={{ margin: 0, flex: 1 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600 }}>
                      <input 
                        type="checkbox"
                        style={{ width: '14px', height: '14px', minHeight: 'auto', margin: 0 }}
                        checked={!!usingClientPackageId}
                        onChange={e => {
                          if (e.target.checked) {
                            setUsingClientPackageId(availablePackagesForBooking[0].id);
                            setSellingPackageId('');
                          } else {
                            setUsingClientPackageId('');
                          }
                        }}
                      />
                      Usar Pacote
                    </label>
                    {usingClientPackageId && (
                      <select
                        value={usingClientPackageId}
                        onChange={e => setUsingClientPackageId(e.target.value)}
                        style={{ padding: '2px 4px', width: '100%', marginTop: '2px', fontSize: '0.7rem', borderRadius: '3px' }}
                      >
                        {availablePackagesForBooking.map(cp => {
                          const bookingServiceName = checkoutBooking.service?.name || checkoutBooking.serviceName;
                          const servObj = services.find(s => s.name === bookingServiceName);
                          const remaining = servObj ? (cp.balance[servObj.id] || 0) : 0;
                          return (
                            <option key={cp.id} value={cp.id}>
                              {cp.packageName} ({remaining} rest.)
                            </option>
                          );
                        })}
                      </select>
                    )}
                  </div>
                )}

                {!usingClientPackageId && packages.length > 0 && (
                  <div className="mobile-form-group" style={{ margin: 0, flex: 1 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600 }}>
                      <input 
                        type="checkbox"
                        style={{ width: '14px', height: '14px', minHeight: 'auto', margin: 0 }}
                        checked={!!sellingPackageId}
                        onChange={e => {
                          if (e.target.checked) {
                            setSellingPackageId(packages[0].id);
                          } else {
                            setSellingPackageId('');
                          }
                        }}
                      />
                      Vender Pacote
                    </label>
                    {sellingPackageId && (
                      <select
                        value={sellingPackageId}
                        onChange={e => setSellingPackageId(e.target.value)}
                        style={{ padding: '2px 4px', width: '100%', marginTop: '2px', fontSize: '0.7rem', borderRadius: '3px' }}
                      >
                        {packages.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} (R$ {p.price})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>

              {/* Desconto */}
              <div className="mobile-form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.7rem', marginBottom: 2 }}>Desconto (R$)</label>
                <input 
                  type="number"
                  min="0"
                  placeholder="0,00"
                  style={{ height: '28px', minHeight: 'auto', padding: '3px 6px', fontSize: '0.78rem' }}
                  value={discount || ''}
                  onChange={e => setDiscount(Math.max(0, Number(e.target.value)))}
                />
              </div>

              {checkoutBooking.prepayment > 0 && (
                <div style={{ fontSize: '0.75rem', color: '#e53e3e', fontWeight: 600 }}>
                  <span>Sinal Pago: </span>
                  <strong>- R$ {Number(checkoutBooking.prepayment).toFixed(2).replace('.', ',')}</strong>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                <span style={{ fontSize: '0.72rem', color: '#718096', fontWeight: 700 }}>TOTAL A COBRAR</span>
                <strong style={{ fontSize: '1.15rem', color: 'var(--mobile-green)' }}>
                  R$ {getCheckoutTotal().toFixed(2).replace('.', ',')}
                </strong>
              </div>
            </div>

            <div className="mobile-form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.7rem', marginBottom: 2 }}>Forma de Pagamento *</label>
              {usingClientPackageId ? (
                <div style={{ padding: '4px 6px', width: '100%', background: 'rgba(0,0,0,0.03)', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '0.78rem', color: 'var(--mobile-primary)', fontWeight: 600 }}>
                  📦 Débito do Pacote
                </div>
              ) : (
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ height: '28px', minHeight: 'auto', padding: '2px 6px', fontSize: '0.78rem' }}>
                  <option value="Pix">⚡ PIX</option>
                  <option value="Cartão de Crédito">💳 Cartão de Crédito</option>
                  <option value="Cartão de Débito">💳 Cartão de Débito</option>
                  <option value="Dinheiro">💵 Dinheiro</option>
                </select>
              )}
            </div>

            {paymentMethod === 'Cartão de Crédito' && (
              <div className="mobile-form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.7rem', marginBottom: 2 }}>Parcelas *</label>
                <select value={installments} onChange={e => setInstallments(e.target.value)} style={{ height: '28px', minHeight: 'auto', padding: '2px 6px', fontSize: '0.78rem' }}>
                  <option value="À vista">À vista</option>
                  <option value="2x">2x</option>
                  <option value="3x">3x</option>
                </select>
              </div>
            )}

            <div className="mobile-modal-actions" style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button type="button" className="btn-cancel" onClick={() => setShowCheckoutModal(false)} style={{ flex: 1, padding: '6px', fontSize: '0.78rem', height: '32px' }}>Cancelar</button>
              <button type="button" className="btn-save" style={{ flex: 1.2, background: 'var(--mobile-green)', padding: '6px', fontSize: '0.78rem', height: '32px' }} onClick={submitCheckout}>
                Confirmar
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
              {/* CAIXA DE SELEÇÃO: USO DO SALÃO */}
              <div className="mobile-form-group" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fcfcf9', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--mobile-rule)', marginBottom: 12 }}>
                <input 
                  type="checkbox" 
                  id="directSaleSalonUse" 
                  checked={isDirectSaleSalonUse} 
                  onChange={e => setIsDirectSaleSalonUse(e.target.checked)} 
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="directSaleSalonUse" style={{ margin: 0, fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem', textTransform: 'none', color: 'var(--mobile-text)' }}>
                  🧴 Uso do Salão (Uso Interno / Baixa de Custo)
                </label>
              </div>

              {!isDirectSaleSalonUse && (
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
              )}

              <div style={{ background: '#f8f9fa', padding: 12, borderRadius: 8, marginBottom: 14 }}>
                <span style={{ fontSize: '0.75rem', color: '#718096', display: 'block', marginBottom: 4, fontWeight: '700' }}>PRODUTOS SELECIONADOS</span>
                
                {directSaleProducts.length === 0 ? (
                  <span style={{ fontSize: '0.8rem', color: '#a0aec0' }}>Nenhum produto adicionado ainda.</span>
                ) : (
                  directSaleProducts.map((prod, index) => {
                    const match = inventory.find(i => i.id === prod.id);
                    const costVal = match ? (match.costPrice || 0) : 0;
                    return (
                      <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem' }}>{prod.qty}x {prod.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                            R$ {(isDirectSaleSalonUse ? (costVal * prod.qty) : (prod.sellingPrice * prod.qty)).toFixed(2).replace('.', ',')}
                          </span>
                          <button type="button" onClick={() => {
                            const newProds = [...directSaleProducts];
                            newProds.splice(index, 1);
                            setDirectSaleProducts(newProds);
                          }} style={{ background: 'none', border: 'none', color: 'var(--mobile-red)', padding: 4 }}>
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })
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
                      <option key={i.id} value={i.id}>
                        {i.name} - R$ {(isDirectSaleSalonUse ? (i.costPrice || 0) : i.sellingPrice).toFixed(2).replace('.', ',')}
                      </option>
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

              {!isDirectSaleSalonUse && (
                <>
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
                </>
              )}

              <div style={{ margin: '14px 0' }}>
                <span style={{ fontSize: '0.75rem', color: '#718096', display: 'block' }}>
                  {isDirectSaleSalonUse ? 'DEDUÇÃO TOTAL (PREÇO DE CUSTO)' : 'TOTAL A RECEBER'}
                </span>
                <strong style={{ fontSize: '1.3rem', color: isDirectSaleSalonUse ? 'var(--mobile-red)' : 'var(--mobile-green)' }}>
                  R$ {
                    (isDirectSaleSalonUse 
                      ? directSaleProducts.reduce((acc, p) => {
                          const match = inventory.find(prod => prod.id === p.id);
                          return acc + ((match ? (match.costPrice || 0) : 0) * p.qty);
                        }, 0)
                      : Math.max(0, directSaleProducts.reduce((acc, p) => acc + (p.sellingPrice * p.qty), 0) - directSaleDiscount)
                    ).toFixed(2).replace('.', ',')
                  }
                </strong>
              </div>

              <div className="mobile-modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowDirectSaleModal(false)}>Cancelar</button>
                <button type="submit" className="btn-save" style={{ background: isDirectSaleSalonUse ? 'var(--mobile-red)' : 'var(--mobile-green)' }}>
                  {isDirectSaleSalonUse ? 'Confirmar Baixa (Custo)' : 'Confirmar Venda'}
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

      {/* MODAL DE CADASTRAR/EDITAR SERVICO */}
      {showServiceModal && (
        <div className="mobile-overlay" onClick={() => { setShowServiceModal(false); setEditingService(null); }}>
          <div className="mobile-popup-modal" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '92vh', overflowY: 'auto' }}>
            <div className="mobile-sheet-header">
              <h4>{editingService ? 'Editar Serviço' : 'Novo Serviço'}</h4>
              <button type="button" onClick={() => { setShowServiceModal(false); setEditingService(null); }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveService}>
              <div className="mobile-form-group">
                <label>Nome do Serviço *</label>
                <input 
                  type="text" 
                  placeholder="Ex: Corte de Cachos à Seco" 
                  required
                  value={serviceForm.name}
                  onChange={e => setServiceForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="mobile-form-group">
                <label>Categoria *</label>
                <select 
                  value={serviceForm.category}
                  onChange={e => setServiceForm(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="Cabelo">Cabelo</option>
                  <option value="Barba">Barba</option>
                  <option value="Combos">Combos</option>
                  <option value="Tratamentos">Tratamentos</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div className="mobile-form-group">
                <label>Preço Base (R$) *</label>
                <input 
                  type="number" 
                  placeholder="Ex: 190" 
                  required
                  value={serviceForm.price}
                  onChange={e => setServiceForm(prev => ({ ...prev, price: e.target.value }))}
                />
              </div>

              <div className="mobile-form-group">
                <label>Preço Promocional (R$ - Opcional)</label>
                <input 
                  type="number" 
                  placeholder="Ex: 150" 
                  value={serviceForm.promoPrice}
                  onChange={e => setServiceForm(prev => ({ ...prev, promoPrice: e.target.value }))}
                />
              </div>

              <div className="mobile-form-group">
                <label>Duração (minutos) *</label>
                <input 
                  type="number" 
                  placeholder="Ex: 60" 
                  required
                  value={serviceForm.duration}
                  onChange={e => setServiceForm(prev => ({ ...prev, duration: e.target.value }))}
                />
              </div>

              <div className="mobile-form-group">
                <label>Custo do Procedimento (R$ - Opcional)</label>
                <input 
                  type="number" 
                  placeholder="Ex: 15" 
                  value={serviceForm.cost}
                  onChange={e => setServiceForm(prev => ({ ...prev, cost: e.target.value }))}
                />
              </div>

              <div className="mobile-form-group">
                <label>Ordem de Posição na Grade</label>
                <input 
                  type="number" 
                  placeholder="Ex: 1" 
                  value={serviceForm.position}
                  onChange={e => setServiceForm(prev => ({ ...prev, position: e.target.value }))}
                />
              </div>

              <div className="mobile-form-group">
                <label>Descrição</label>
                <textarea 
                  placeholder="Descreva o serviço para o site de agendamentos..."
                  rows={2}
                  value={serviceForm.description}
                  onChange={e => setServiceForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '10px 0' }}>
                <input 
                  type="checkbox" 
                  id="scheduledViaWhatsapp"
                  style={{ width: 18, height: 18 }}
                  checked={!!serviceForm.scheduledViaWhatsapp}
                  onChange={e => setServiceForm(prev => ({ ...prev, scheduledViaWhatsapp: e.target.checked }))}
                />
                <label htmlFor="scheduledViaWhatsapp" style={{ margin: 0, cursor: 'pointer', fontSize: '0.85rem' }}>Agendar somente via WhatsApp</label>
              </div>

              <div className="mobile-modal-actions">
                <button type="button" className="btn-cancel" onClick={() => { setShowServiceModal(false); setEditingService(null); }}>Cancelar</button>
                <button type="submit" className="btn-save">Salvar Serviço</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CADASTRAR/EDITAR PRODUTO */}
      {showProductModal && (
        <div className="mobile-overlay" onClick={() => { setShowProductModal(false); setEditingProduct(null); }}>
          <div className="mobile-popup-modal" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '92vh', overflowY: 'auto' }}>
            <div className="mobile-sheet-header">
              <h4>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h4>
              <button type="button" onClick={() => { setShowProductModal(false); setEditingProduct(null); }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveProduct}>
              <div className="mobile-form-group">
                <label>Nome do Produto *</label>
                <input 
                  type="text" 
                  placeholder="Ex: Creme de Pentear Caracóis" 
                  required
                  value={productForm.name}
                  onChange={e => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="mobile-form-group">
                <label>Categoria *</label>
                <select 
                  value={productForm.category}
                  onChange={e => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="Shampoo">Shampoo</option>
                  <option value="Condicionador">Condicionador</option>
                  <option value="Creme de Pentear">Creme de Pentear</option>
                  <option value="Óleo / Gel">Óleo / Gel</option>
                  <option value="Acessórios">Acessórios</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div className="mobile-form-group">
                <label>Quantidade em Estoque *</label>
                <input 
                  type="number" 
                  placeholder="Ex: 10" 
                  required
                  value={productForm.quantity}
                  onChange={e => setProductForm(prev => ({ ...prev, quantity: e.target.value }))}
                />
              </div>

              <div className="mobile-form-group">
                <label>Preço de Custo (R$) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="Ex: 25.00" 
                  required
                  value={productForm.costPrice}
                  onChange={e => setProductForm(prev => ({ ...prev, costPrice: e.target.value }))}
                />
              </div>

              <div className="mobile-form-group">
                <label>Preço de Venda (R$) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="Ex: 50.00" 
                  required
                  value={productForm.sellingPrice}
                  onChange={e => setProductForm(prev => ({ ...prev, sellingPrice: e.target.value }))}
                />
              </div>

              <div className="mobile-form-group">
                <label>Estoque Mínimo Alerta *</label>
                <input 
                  type="number" 
                  placeholder="Ex: 3" 
                  required
                  value={productForm.minStock}
                  onChange={e => setProductForm(prev => ({ ...prev, minStock: e.target.value }))}
                />
              </div>

              <div className="mobile-modal-actions">
                <button type="button" className="btn-cancel" onClick={() => { setShowProductModal(false); setEditingProduct(null); }}>Cancelar</button>
                <button type="submit" className="btn-save">Salvar Produto</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE LANÇAMENTO FINANCEIRO MANUAL */}
      {showFinanceModal && (
        <div className="mobile-overlay" onClick={() => setShowFinanceModal(false)}>
          <div className="mobile-popup-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-sheet-header">
              <h4>Lançar Transação Manual</h4>
              <button type="button" onClick={() => setShowFinanceModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleAddExpense}>
              <div className="mobile-form-group">
                <label>Tipo de Transação *</label>
                <select 
                  value={financeForm.type}
                  onChange={e => setFinanceForm(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="saida">🔴 Saída / Despesa</option>
                  <option value="entrada">🟢 Entrada / Receita</option>
                </select>
              </div>

              <div className="mobile-form-group">
                <label>Descrição / Finalidade *</label>
                <input 
                  type="text" 
                  placeholder="Ex: Aluguel do espaço, Compra de café..." 
                  required
                  value={financeForm.description}
                  onChange={e => setFinanceForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="mobile-form-group">
                <label>Valor (R$) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="Ex: 150.00" 
                  required
                  value={financeForm.value}
                  onChange={e => setFinanceForm(prev => ({ ...prev, value: e.target.value }))}
                />
              </div>

              <div className="mobile-form-group">
                <label>Forma de Pagamento *</label>
                <select 
                  value={financeForm.paymentMethod}
                  onChange={e => setFinanceForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                >
                  <option value="Pix">PIX</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div className="mobile-form-group">
                <label>Data *</label>
                <input 
                  type="date" 
                  required
                  value={financeForm.date}
                  onChange={e => setFinanceForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <div className="mobile-modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowFinanceModal(false)}>Cancelar</button>
                <button type="submit" className="btn-save">Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CADASTRAR/EDITAR PROFISSIONAL */}
      {showProfFormModal && (
        <div className="mobile-overlay" onClick={() => { setShowProfFormModal(false); setEditingProfId(null); }}>
          <div className="mobile-popup-modal" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '92vh', overflowY: 'auto' }}>
            <div className="mobile-sheet-header">
              <h4>{editingProfId ? 'Editar Profissional' : 'Novo Profissional'}</h4>
              <button type="button" onClick={() => { setShowProfFormModal(false); setEditingProfId(null); }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveProf}>
              <div className="mobile-form-group">
                <label>Nome do Profissional *</label>
                <input 
                  type="text" 
                  placeholder="Ex: Ana Cachos" 
                  required
                  value={profForm.name}
                  onChange={e => setProfForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="mobile-form-group">
                <label>Comissão sobre Serviços (%) *</label>
                <input 
                  type="number" 
                  placeholder="Ex: 50" 
                  required
                  value={profForm.commissionService}
                  onChange={e => setProfForm(prev => ({ ...prev, commissionService: e.target.value }))}
                />
              </div>

              <div className="mobile-form-group">
                <label>Comissão sobre Produtos (%) *</label>
                <input 
                  type="number" 
                  placeholder="Ex: 10" 
                  required
                  value={profForm.commissionProduct}
                  onChange={e => setProfForm(prev => ({ ...prev, commissionProduct: e.target.value }))}
                />
              </div>

              <div className="mobile-form-group">
                <label>Celular / WhatsApp</label>
                <input 
                  type="text" 
                  placeholder="Ex: 31988887777" 
                  value={profForm.phone}
                  onChange={e => setProfForm(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div className="mobile-form-group">
                <label>E-mail</label>
                <input 
                  type="email" 
                  placeholder="prof@email.com" 
                  value={profForm.email}
                  onChange={e => setProfForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="mobile-form-group" style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label>Início do Expediente</label>
                  <input 
                    type="text" 
                    placeholder="Ex: 09:00"
                    value={profForm.workStart}
                    onChange={e => setProfForm(prev => ({ ...prev, workStart: e.target.value }))}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Fim do Expediente</label>
                  <input 
                    type="text" 
                    placeholder="Ex: 19:00"
                    value={profForm.workEnd}
                    onChange={e => setProfForm(prev => ({ ...prev, workEnd: e.target.value }))}
                  />
                </div>
              </div>

              <div className="mobile-form-group" style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label>Início do Almoço</label>
                  <input 
                    type="text" 
                    placeholder="Ex: 12:00"
                    value={profForm.lunchStart}
                    onChange={e => setProfForm(prev => ({ ...prev, lunchStart: e.target.value }))}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Fim do Almoço</label>
                  <input 
                    type="text" 
                    placeholder="Ex: 13:00"
                    value={profForm.lunchEnd}
                    onChange={e => setProfForm(prev => ({ ...prev, lunchEnd: e.target.value }))}
                  />
                </div>
              </div>

              <div className="mobile-modal-actions">
                <button type="button" className="btn-cancel" onClick={() => { setShowProfFormModal(false); setEditingProfId(null); }}>Cancelar</button>
                <button type="submit" className="btn-save">Salvar Profissional</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMobileApp;
