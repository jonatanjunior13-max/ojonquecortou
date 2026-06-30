import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../config/firebase';
import { collection, onSnapshot, query, addDoc, updateDoc, doc, getDoc, setDoc, deleteDoc, where, getDocs } from 'firebase/firestore';
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
  Edit,
  MoreVertical
} from 'lucide-react';
import { syncBookingToGoogle } from '../../utils/gcalSync';
import ComandaModal from '../../components/admin/ComandaModal';
import { useToast } from '../../components/admin/ui/Toast';
import './Admin.css';

// Lista de horários padrão
const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
import { SEED_SERVICES } from '../../data/seedServices';
import { getEffectiveAbsences, getAbsenceForSlot, absenceCoversDate } from '../../utils/absences';

// Mapeia dias da semana
const DAYS_TRANSLATION = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

// Helper: checks if slot ("HH:MM") falls within [start, end) window
const slotInRange = (slot, start, end) => {
  if (!end || end === start) return slot === start;
  return slot >= start && slot < end;
};



const getServiceCategoryInfo = (serviceName = '', servicesList = []) => {
  const name = (serviceName || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const matched = servicesList.find(s => (s.name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() === name);
  let category = matched?.category;

  // Detect lunch break by name (for bookings blocked with title "Almoço")
  if (!category) {
    if (name.includes('almoco') || name.includes('almo\u00e7o')) {
      category = 'Almo\u00e7o';
    } else {
      const hasCombo = name.includes('combo') || name.includes('misto');
      const hasCorte = /\b(corte|cortes)\b/.test(name);
      const hasTratamento = /\b(tratamento|tratamentos|terapia|cronograma|hidrat|hidratacao)\b/.test(name);
      // Word boundary so 'cor' doesn't match inside 'corte'
      const hasCor = /\b(cor|coloracao|colora|mechas|luzes|tonaliza)\b/.test(name);

      if (hasCombo || (hasCorte && (hasTratamento || hasCor))) {
        category = 'Combo';
      } else if (hasCorte) {
        category = 'Corte';
      } else if (hasCor) {
        category = 'Cor';
      } else if (name.includes('analise') || name.includes('avaliacao') || name.includes('teste')) {
        category = 'Análise';
      } else {
        category = 'Tratamento'; // fallback
      }
    }
  }

  const catLower = category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  if (catLower.includes('almoco') || catLower.includes('almo\u00e7o')) {
    return { class: 'svc-almoco', badge: 'ALMOÇO' };
  }
  if (catLower.includes('combo') || catLower.includes('misto')) {
    return { class: 'svc-combo', badge: 'COMBO' };
  }
  if (catLower.includes('corte')) {
    return { class: 'svc-corte', badge: 'CORTE' };
  }
  if (catLower.includes('cor') || catLower.includes('colora')) {
    return { class: 'svc-cor', badge: 'COR' };
  }
  if (catLower.includes('analise') || catLower.includes('avaliacao')) {
    return { class: 'svc-analise', badge: 'ANÁLISE' };
  }
  if (catLower.includes('finalizacao') || catLower.includes('finaliza')) {
    return { class: 'svc-finalizacao', badge: 'FINALIZAÇÃO' };
  }
  return { class: 'svc-tratamento', badge: 'TRATAMENTO' };
};


const calculateOverlappingLayout = (items) => {
  if (!items || items.length === 0) return [];
  const sorted = [...items].sort((a, b) => {
    if (a.startMin !== b.startMin) return a.startMin - b.startMin;
    return (b.endMin - b.startMin) - (a.endMin - a.startMin);
  });
  const columns = [];
  sorted.forEach(item => {
    let placed = false;
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      const last = col[col.length - 1];
      if (item.startMin >= last.endMin) {
        col.push(item);
        placed = true;
        break;
      }
    }
    if (!placed) {
      columns.push([item]);
    }
  });
  const totalColumns = columns.length;
  const result = [];
  columns.forEach((col, colIdx) => {
    col.forEach(item => {
      const width = 100 / totalColumns;
      const left = colIdx * width;
      result.push({
        ...item,
        leftPercent: left,
        widthPercent: width
      });
    });
  });
  return result;
};

const getLocalDateString = (dateObj) => {
  if (!dateObj) return '';
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isFeriado = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return false;
  const mmdd = `${parts[1]}-${parts[2]}`;
  
  const fixedHolidays = [
    '01-01', // Ano Novo
    '04-21', // Tiradentes
    '05-01', // Dia do Trabalho
    '08-15', // Assunção de Nossa Senhora (BH)
    '09-07', // Independência
    '10-12', // Nossa Senhora Aparecida
    '11-02', // Finados
    '11-15', // Proclamação da República
    '11-20', // Dia da Consciência Negra
    '12-08', // Imaculada Conceição (BH)
    '12-25', // Natal
  ];
  if (fixedHolidays.includes(mmdd)) return true;

  const mobileHolidays = [
    '2025-03-03', '2025-03-04', '2025-04-18', '2025-06-19',
    '2026-02-16', '2026-02-17', '2026-04-03', '2026-06-04',
    '2027-02-08', '2027-02-09', '2027-03-26', '2027-05-27'
  ];
  if (mobileHolidays.includes(dateStr)) return true;

  return false;
};

const getAdjustedDay = (date) => {
  return date.getDay();
};

const getSlotBlockReason = (prof, dateStr, slot) => {
  if (!prof) return null;
  
  const isUnlockedLocal = localStorage.getItem(`unlock_${dateStr}_${slot}`) === 'true';
  if (isUnlockedLocal) return null;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const weekday = getAdjustedDay(dateObj);
    
    // Force Sundays (0) and Mondays (1) to be blocked
    if (weekday === 0 || weekday === 1) return 'Folga Semanal';

    // Force Holidays to be blocked
    if (isFeriado(dateStr)) return 'Feriado';
    
    // 1. Check day off
    if ((prof.daysOff || []).includes(weekday)) return 'Folga';
    
    // 2. Check blocked date
    if ((prof.blockedDates || []).includes(dateStr)) return 'Data Bloqueada';

    // 3. Recurring weekday blocks
    const weekdayBlocks = prof.blockedWeekdayHours || [];
    const hasWeekdayBlock = weekdayBlocks.some(block => {
      const segments = block.split('-');
      const w = segments[0];
      const start = segments[1];
      const end = segments[2] || null;
      if (Number(w) !== weekday) return false;
      return slotInRange(slot, start, end);
    });
    if (hasWeekdayBlock) return 'Bloqueio de Escala';

    // 4. Specific date blocks
    const specificBlocks = prof.blockedSpecificHours || [];
    const hasSpecificBlock = specificBlocks.some(block => {
      if (!block.startsWith(dateStr)) return false;
      const rest = block.substring(dateStr.length + 1); // "HH:MM" or "HH:MM-HH:MM"
      const restParts = rest.split('-');
      const start = restParts[0];
      const end = restParts[1] || null;
      return slotInRange(slot, start, end);
    });
    if (hasSpecificBlock) return 'Bloqueio de Horário';

    // 5. Check work hours and lunch hours (from professional config or defaults)
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

    // Almoço
    if (slotMin >= lunchStartMin && slotMin < lunchEndMin) return 'Almoço';

    // Fora de expediente
    if (slotMin < startMin || slotMin >= endMin) return 'Fora de Expediente';
  }
  
  return null;
};

const isSlotBlocked = (prof, dateStr, slot) => {
  return getSlotBlockReason(prof, dateStr, slot) !== null;
};

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
  address: 'Rua Francisco Ovídio, 184 - Caiçaras, Belo Horizonte - MG, CEP 30770-040',
  instagram: 'https://instagram.com/ojonquecortou',
  feePix: 0,
  feeDebit: 1.40,
  feeCredit: 2.49,
  feeCredit2x: 4.5,
  feeCredit3x: 5.5,
  feeAnticipation: 2.50,
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
  waReminderTemplate: 'Olá, {cliente}! Passando para lembrar do seu horário amanhã ({data} às {hora}) para o serviço: {servico}. Podemos confirmar? 💇‍♂️✨',
  professionals: [
    { id: 'jon', name: 'Jon', avatar: '/jon-perfil.webp', commission: 50, phone: '31995097613', email: 'jon@studio.com', active: true }
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
  const isSubmittingRef = useRef(false);
  const [isDemoMode, setIsDemoMode] = useState(!db);
  
  const toast = useToast();
  const [selectedFichaClient, setSelectedFichaClient] = useState(null);

  // Checkout / Comanda states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [comandaBooking, setComandaBooking] = useState(null);
  const [addedServices, setAddedServices] = useState([]);
  const [addedProducts, setAddedProducts] = useState([]);
  const [usedProducts, setUsedProducts] = useState([]);
  const [nonRegisteredProducts, setNonRegisteredProducts] = useState([]);
  const [selectedUsedProduct, setSelectedUsedProduct] = useState('');
  const [usedProductQty, setUsedProductQty] = useState(1);
  const [newNonRegName, setNewNonRegName] = useState('');
  const [newNonRegVal, setNewNonRegVal] = useState(0);
  const [isEditingComanda, setIsEditingComanda] = useState(false);
  const [editComandaForm, setEditComandaForm] = useState({
    value: 0,
    paymentMethod: 'Pix',
    productSales: []
  });
  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [installments, setInstallments] = useState('À vista');
  const [applyAnticipation, setApplyAnticipation] = useState(false);
  const [selectedExtraService, setSelectedExtraService] = useState('');
  const [selectedExtraProduct, setSelectedExtraProduct] = useState('');
  const [overrideBasePrice, setOverrideBasePrice] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [extraCharged, setExtraCharged] = useState(0);
  const [extraCost, setExtraCost] = useState(0);

  // Packages integration states
  const [sellingPackageId, setSellingPackageId] = useState('');
  const [usingClientPackageId, setUsingClientPackageId] = useState('');

  const clientPackages = React.useMemo(() => globalData.client_packages || [], [globalData.client_packages]);
  const packages = React.useMemo(() => globalData.packages || [], [globalData.packages]);

  const clientActivePackages = React.useMemo(() => {
    if (!selectedBooking) return [];
    const phone = selectedBooking.clientPhone;
    const name = selectedBooking.clientName;
    return clientPackages.filter(cp => 
      cp.status === 'active' && 
      ((phone && cp.clientPhone === phone) || (!phone && cp.clientName === name))
    );
  }, [selectedBooking, clientPackages]);

  const availablePackagesForBooking = React.useMemo(() => {
    if (!selectedBooking || !globalData.services) return [];
    const bookingServiceName = selectedBooking.service?.name || selectedBooking.serviceName;
    const servObj = globalData.services.find(s => s.name === bookingServiceName);
    if (!servObj) return [];
    
    return clientActivePackages.filter(cp => cp.balance && cp.balance[servObj.id] > 0);
  }, [selectedBooking, clientActivePackages, globalData.services]);

  useEffect(() => {
    const runBackgroundSync = async () => {
      try {
        const res = await fetch('/api/gcal?action=syncAll', { method: 'POST' });
        const data = await res.json();
        if (data.success && data.logs?.length > 0) {
          console.log('Google Calendar background sync logs:', data.logs);
        }
      } catch (err) {
        console.warn('Google Calendar background sync warning:', err);
      }
    };
    if (!isDemoMode && db) {
      runBackgroundSync();
    }
  }, [isDemoMode]);

  useEffect(() => {
    if (isCheckoutOpen) {
      setDiscount(0);
      setExtraCharged(0);
      setExtraCost(0);
      setInstallments('À vista');
      setApplyAnticipation(false);
      setSellingPackageId('');
      setUsingClientPackageId('');
    }
  }, [isCheckoutOpen]);

  // Slot Action and Block States
  const [showSlotActionModal, setShowSlotActionModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [blockMotive, setBlockMotive] = useState('Almoço');
  const [blockEndTime, setBlockEndTime] = useState('');
  const [blockIdToCancelOnSuccess, setBlockIdToCancelOnSuccess] = useState(null);
  const [showScaleBlockModal, setShowScaleBlockModal] = useState(false);
  const [selectedScaleBlock, setSelectedScaleBlock] = useState(null);

  useEffect(() => {
    if (selectedSlot && selectedSlot.time) {
      const idx = TIME_SLOTS.indexOf(selectedSlot.time);
      if (idx !== -1 && idx < TIME_SLOTS.length - 1) {
        setBlockEndTime(TIME_SLOTS[idx + 1]);
      } else if (selectedSlot.time === '20:00') {
        setBlockEndTime('21:00');
      } else {
        setBlockEndTime('');
      }
    } else {
      setBlockEndTime('');
    }
  }, [selectedSlot]);

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
    profissional: 'jon',
    prepayment: 0
  });

  // Autocomplete suggestions states
  const [showAddSuggestions, setShowAddSuggestions] = useState(false);
  const [showEditSuggestions, setShowEditSuggestions] = useState(false);

  // New States for Trinks layout
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState('diario'); // 'diario' | 'semanal' | 'mensal'
  const [selectedWeeklyMonthlyProf, setSelectedWeeklyMonthlyProf] = useState('jon');
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, booking: null, date: '', time: '', professional: 'jon', isBlockedSlot: false });
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
  const [showDetailedStats, setShowDetailedStats] = useState(false);
  const [statsScope, setStatsScope] = useState('dia'); // 'dia', 'semana', 'mes'

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

  const isClientRecurrent = (clientName, clientPhone) => {
    if (!clientName) return false;
    const cleanName = clientName.trim().toLowerCase();
    const cleanPhone = (clientPhone || '').replace(/\D/g, '');

    const count = bookings.filter(b => {
      if (b.status === 'cancelado' || b.status === 'bloqueado') return false;
      const bName = (b.clientName || '').trim().toLowerCase();
      const bPhone = (b.clientPhone || b.phone || '').replace(/\D/g, '');
      return (cleanPhone && bPhone === cleanPhone) || (bName === cleanName);
    }).length;

    return count > 1;
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

  // Auto-fill by phone on blur (add modal)
  const handlePhoneBlurForAdd = () => {
    const cleanPhone = newBooking.clientPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) return;
    const allClients = getUniqueClientsList();
    const match = allClients.find(c => c.phone && c.phone.replace(/\D/g, '') === cleanPhone);
    if (match) {
      setNewBooking(prev => ({
        ...prev,
        clientName: prev.clientName || match.name || '',
        clientEmail: prev.clientEmail || match.email || ''
      }));
    }
  };

  // Auto-fill by phone on blur (edit modal)
  const handlePhoneBlurForEdit = () => {
    const cleanPhone = editBookingForm.clientPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) return;
    const allClients = getUniqueClientsList();
    const match = allClients.find(c => c.phone && c.phone.replace(/\D/g, '') === cleanPhone);
    if (match) {
      setEditBookingForm(prev => ({
        ...prev,
        clientName: prev.clientName || match.name || '',
        clientEmail: prev.clientEmail || match.email || '',
        cpf: prev.cpf || match.cpf || '',
        tags: (prev.tags && prev.tags.length > 0) ? prev.tags : (match.tags || [])
      }));
    }
  };

  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClientForm, setNewClientForm] = useState({
    name: '',
    phone: '',
    email: '',
    curvatura: '3A',
    porosidade: 'Média',
    elasticidade: 'Normal',
    quimicas: 'Nenhuma',
    produtosRecomendados: '',
    observacoes: '',
    sexo: 'Feminino',
    birthdate: ''
  });

  const handleCreateClientInline = async (e) => {
    if (e) e.preventDefault();
    if (!newClientForm.name || !newClientForm.phone) {
      alert('Nome e Telefone são campos obrigatórios.');
      return;
    }

    const cleanPhone = newClientForm.phone.replace(/\D/g, '');
    const profilePayload = {
      name: newClientForm.name,
      phone: cleanPhone,
      email: newClientForm.email || 'Não informado',
      curvatura: newClientForm.curvatura,
      porosidade: newClientForm.porosidade,
      elasticidade: newClientForm.elasticidade,
      quimicas: newClientForm.quimicas || 'Nenhuma',
      produtosRecomendados: newClientForm.produtosRecomendados || '',
      observacoes: newClientForm.observacoes || '',
      sexo: newClientForm.sexo || 'Feminino',
      birthdate: newClientForm.birthdate || '',
      createdAt: new Date().toISOString()
    };

    try {
      if (isDemoMode || !db) {
        const localClients = JSON.parse(localStorage.getItem('demo_client_profiles') || '[]');
        localClients.push(profilePayload);
        localStorage.setItem('demo_client_profiles', JSON.stringify(localClients));
        setClients(prev => [...prev, profilePayload]);
      } else {
        const docRef = doc(db, 'client_profiles', cleanPhone);
        await setDoc(docRef, profilePayload);
        setClients(prev => {
          const list = prev.filter(c => c.phone !== cleanPhone);
          return [...list, profilePayload];
        });
      }

      alert('Cliente cadastrado com sucesso!');
      
      setNewBooking(prev => ({
        ...prev,
        clientName: newClientForm.name,
        clientPhone: cleanPhone,
        clientEmail: newClientForm.email || ''
      }));

      setShowAddClientModal(false);
      
      setNewClientForm({
        name: '',
        phone: '',
        email: '',
        curvatura: '3A',
        porosidade: 'Média',
        elasticidade: 'Normal',
        quimicas: 'Nenhuma',
        produtosRecomendados: '',
        observacoes: '',
        sexo: 'Feminino',
        birthdate: ''
      });
    } catch (err) {
      console.error('Erro ao cadastrar cliente:', err);
      alert('Não foi possível salvar o cadastro.');
    }
  };

  // Formulário para novo agendamento manual
  const [newBooking, setNewBooking] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    serviceName: '',
    servicePrice: 0,
    duration: 60,
    date: getLocalDateString(new Date()),
    time: '09:00',
    notes: '',
    profissional: 'jon',
    prepayment: 0
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

  const changeDate = (direction) => {
    const d = new Date(currentDate);
    if (viewMode === 'diario') {
      d.setDate(currentDate.getDate() + direction);
    } else if (viewMode === 'semanal') {
      d.setDate(currentDate.getDate() + direction * 7);
    } else if (viewMode === 'mensal') {
      d.setMonth(currentDate.getMonth() + direction);
    }
    setCurrentDate(d);
    setMiniCalDate(new Date(d));
  };

  const timeToMin = (t) => {
    if (!t || typeof t !== 'string' || !t.includes(':')) return 0;
    const [h, m] = t.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const getWeekDays = (dateObj) => {
    const dayOfWeek = getAdjustedDay(dateObj);
    const start = new Date(dateObj);
    start.setDate(dateObj.getDate() - dayOfWeek);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const getDaysInMonthGrid = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    
    const startDay = getAdjustedDay(startOfMonth);
    const daysInMonth = endOfMonth.getDate();
    
    const grid = [];
    
    // Previous month padding
    const prevMonthEnd = new Date(year, month, 0);
    const prevMonthDays = prevMonthEnd.getDate();
    const prevYear = prevMonthEnd.getFullYear();
    const prevMon = prevMonthEnd.getMonth();
    
    for (let i = startDay - 1; i >= 0; i--) {
      const dNum = prevMonthDays - i;
      grid.push({
        dateObj: new Date(prevYear, prevMon, dNum),
        dayNum: dNum,
        isCurrentMonth: false
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      grid.push({
        dateObj: new Date(year, month, i),
        dayNum: i,
        isCurrentMonth: true
      });
    }
    
    // Next month padding to reach exactly 42 cells (6 rows)
    const totalCells = 42;
    const remaining = totalCells - grid.length;
    const nextMonthStart = new Date(year, month + 1, 1);
    const nextYear = nextMonthStart.getFullYear();
    const nextMon = nextMonthStart.getMonth();
    
    for (let i = 1; i <= remaining; i++) {
      grid.push({
        dateObj: new Date(nextYear, nextMon, i),
        dayNum: i,
        isCurrentMonth: false
      });
    }
    
    return grid;
  };

  const getDayBlocks = (prof, dateObj) => {
    if (!prof) return [];
    
    const dateStr = getLocalDateString(dateObj);
    const weekday = getAdjustedDay(dateObj);
    const blocks = [];
    
    // 1. Day off
    if ((prof.daysOff || []).includes(weekday)) {
      blocks.push({ start: '10:00', end: '19:00', label: 'Folga' });
      return blocks;
    }
    
    // 2. Blocked date
    if ((prof.blockedDates || []).includes(dateStr)) {
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
      if (block.startsWith(dateStr)) {
        const rest = block.substring(dateStr.length + 1);
        const restParts = rest.split('-');
        const start = restParts[0];
        const end = restParts[1] || '19:00';
        blocks.push({ start, end, label: 'Bloqueado' });
      }
    });
    
    return blocks;
  };

  const handleRemoveAbsence = async (abs) => {
    const updatedAbsences = (settings.absences || []).filter(a => a.id !== abs.id);
    if (db && !isDemoMode) {
      try {
        await updateDoc(doc(db, 'settings', 'studio'), { absences: updatedAbsences });
        toast('Ausência removida com sucesso!', 'success');
      } catch (err) {
        console.error(err);
        toast('Erro ao remover ausência.', 'error');
      }
    } else {
      const updatedSettings = { ...settings, absences: updatedAbsences };
      setSettings(updatedSettings);
      localStorage.setItem('demo_settings', JSON.stringify(updatedSettings));
      toast('Ausência removida com sucesso!', 'success');
    }
  };

  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      const booking = bookings.find(b => b.id === bookingId);
      
      if (isDemoMode) {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
        if (selectedBooking && selectedBooking.id === bookingId) {
          setSelectedBooking(prev => ({ ...prev, status: newStatus }));
        }

        if (newStatus === 'cancelado') {
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
        } else if (newStatus === 'faltou') {
          const cleanPhone = booking?.clientPhone?.replace(/\D/g, '');
          if (cleanPhone) {
            const localClients = JSON.parse(localStorage.getItem('demo_client_profiles') || '[]');
            const updatedClients = localClients.map(c => c.phone === cleanPhone ? { ...c, blocked: true } : c);
            localStorage.setItem('demo_client_profiles', JSON.stringify(updatedClients));
          }
        }
      } else {
        const apptRef = doc(db, 'bookings', bookingId);
        const updatePayload = { status: newStatus };
        if (newStatus === 'faltou') {
          updatePayload.missedAt = new Date().toISOString();
          updatePayload.missedEmailSent = false;
        }
        await updateDoc(apptRef, updatePayload);
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, ...updatePayload } : b));
        syncBookingToGoogle(bookingId).catch(err => console.warn('Error syncing status:', err));
        setSelectedBooking(null);

        if (newStatus === 'cancelado') {
          try {
            // Deletar transação com base no bookingId
            const q = query(collection(db, 'financial_transactions'), where('bookingId', '==', bookingId));
            const qSnap = await getDocs(q);
            for (const docRef of qSnap.docs) {
              await deleteDoc(docRef.ref);
            }

            // Deletar transação com base no telefone e data (fallback)
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
            console.error('Erro ao deletar transações financeiras:', deleteErr);
          }
        } else if (newStatus === 'faltou') {
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
      }

      // Resolve email: prefer stored clientEmail, fallback to client_profiles lookup by phone
      let emailForStatus = booking?.clientEmail || '';
      if (!emailForStatus && booking?.clientPhone) {
        const cleanPhone = booking.clientPhone.replace(/\D/g, '');
        const matched = clients.find(c => (c.phone || '').replace(/\D/g, '') === cleanPhone);
        emailForStatus = matched?.email || '';
      }

      if (booking && emailForStatus && emailForStatus.includes('@') && emailForStatus !== 'Não informado') {
        const bookingWithEmail = { ...booking, clientEmail: emailForStatus };
        if (newStatus === 'confirmado') {
          await triggerEmailNotification({ ...bookingWithEmail, type: 'horario_confirmado' }, 'horario_confirmado');
        } else if (newStatus === 'cancelado') {
          await triggerEmailNotification({ ...bookingWithEmail, type: 'agendamento_cancelado', cancelledBy: 'admin' }, 'agendamento_cancelado');
        }
      }

      // Enviar WA ao cliente quando Jon confirmar o agendamento
      if (newStatus === 'confirmado' && booking?.clientPhone) {
        try {
          const s = settings;
          const gateway = s?.waReminderGateway || 'evolution';
          if (s?.waReminderEnabled && booking.clientPhone) {
            const cleanPhone = (booking.clientPhone || '').replace(/\D/g, '');
            const waNumber = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
            const firstName = (booking.clientName || 'Cliente').split(' ')[0];
            const dataBr = (booking.date || '').split('-').reverse().join('/');
            const svcName = booking.serviceName || booking.service?.name || 'serviço';
            const msg = `Olá, ${firstName}! ✅ Seu agendamento foi confirmado pelo Studio do Jon.\n\n📅 *${dataBr}* às *${booking.time}*\n✂️ *${svcName}*\n\nTe esperamos! Qualquer dúvida é só responder aqui. 💇‍♂️`;

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
                .catch(err => console.warn('WA confirmação cliente:', err));
            }
          }
        } catch (waErr) {
          console.warn('Erro ao enviar WA de confirmação ao cliente:', waErr);
        }
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
      profissional: activeAppt.profissional || 'jon',
      prepayment: activeAppt.prepayment || 0
    });
    setIsEditingBooking(true);
    setActivePopover({ visible: false });
    setContextMenu({ visible: false });
  };

  const handleSaveEditBooking = async (e) => {
    if (e) e.preventDefault();
    const bId = selectedBooking?.id;
    if (!bId) return;

    const oldBooking = bookings.find(b => b.id === bId);
    const oldPrepayment = oldBooking ? (Number(oldBooking.prepayment) || 0) : 0;
    const newPrepayment = Number(editBookingForm.prepayment) || 0;

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
      profissional: editBookingForm.profissional || 'jon',
      prepayment: newPrepayment
    };

    try {
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
        syncBookingToGoogle(bId).catch(err => console.warn('Error syncing edited booking:', err));
        setSelectedBooking(prev => prev ? { ...prev, ...updatedPayload } : null);
      }

      if (newPrepayment > oldPrepayment) {
        await logPrepaymentTransaction(bId, updatedPayload, newPrepayment - oldPrepayment);
      }

      if (updatedPayload.clientEmail && updatedPayload.clientEmail.includes('@')) {
        const dateChanged = oldBooking?.date !== updatedPayload.date;
        const timeChanged = oldBooking?.time !== updatedPayload.time;
        if (dateChanged || timeChanged) {
          await triggerEmailNotification({
            ...updatedPayload,
            id: bId,
            type: 'agendamento_editado'
          }, 'agendamento_editado').catch(err => console.warn('Erro ao enviar e-mail de edição:', err));
        }
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
        syncBookingToGoogle(bId).catch(err => console.warn('Error syncing booking before checkout:', err));
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

  const triggerEmailNotification = async (payload, type = 'horario_confirmado') => {
    if (!payload.clientEmail) return;
    try {
      // Format date beautifully if possible
      let displayDate = payload.date;
      try {
        const parts = payload.date.split('-');
        if (parts.length === 3) {
          const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
          const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
          const weekday = weekdays[getAdjustedDay(dateObj)];
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
          type: type,
          clientEmail: payload.clientEmail,
          clientName: payload.clientName,
          serviceName: payload.serviceName || payload.service?.name || payload.service || '',
          date: displayDate,
          rawDate: payload.date, // YYYY-MM-DD para cálculo do Google Calendar
          time: payload.time,
          duration: payload.duration || payload.service?.duration || 60,
          notes: payload.notes || '',
          professionalName: payload.profissional || 'Jon',
          price: payload.service?.price || null,
          cancelledBy: payload.cancelledBy || 'admin'
        }),
      });
      const data = await response.json();
      console.log('Admin Email API response:', data);
    } catch (err) {
      console.error(`Failed to send email notification (${type}):`, err);
    }
  };

  const logPrepaymentTransaction = async (bookingId, payload, amount) => {
    if (amount <= 0) return;
    const tx = {
      bookingId: bookingId,
      date: getLocalDateString(new Date()),
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

    if (isDemoMode || !db) {
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

  const handleAddManualBooking = async (e) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

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
      servicePrice: activeServPrice,
      duration: activeDuration,
      date: newBooking.date,
      time: newBooking.time,
      notes: newBooking.notes,
      status: 'confirmado',
      profissional: newBooking.profissional || 'jon',
      prepayment: Number(newBooking.prepayment) || 0,
      createdAt: new Date().toISOString()
    };

    // Check for overlap conflicts
    const bStart = timeToMin(newBooking.time);
    const bEnd = bStart + activeDuration;
    const hasConflict = bookings.some(b => {
      if (b.status === 'cancelado') return false;
      if (b.date !== newBooking.date) return false;
      if ((b.profissional || 'jon') !== (newBooking.profissional || 'jon')) return false;
      
      const existingStart = timeToMin(b.time);
      const existingEnd = existingStart + (b.duration || 60);
      
      return Math.max(bStart, existingStart) < Math.min(bEnd, existingEnd);
    });

    if (hasConflict) {
      if (!confirm("Já existe outro agendamento neste horário para este profissional.\nDeseja continuar?")) {
        isSubmittingRef.current = false;
        return;
      }
    }

    // --- OPTIMISTIC UPDATE ---
    const tempId = 'temp-bk-' + Date.now();
    setBookings(prev => [...prev, { id: tempId, ...payload }]);
    setShowAddModal(false);

    setNewBooking({
      clientName: '',
      clientPhone: '',
      clientEmail: '',
      serviceName: services[0]?.name || '',
      servicePrice: services[0]?.promoPrice || services[0]?.price || 0,
      duration: services[0]?.duration || 60,
      date: getLocalDateString(currentDate),
      time: '09:00',
      notes: '',
      profissional: 'jon'
    });

    // Run async write in background
    (async () => {
      try {
        const cleanPhone = payload.clientPhone.replace(/\D/g, '');
        let finalId = '';

        if (isDemoMode) {
          finalId = 'demo-' + Date.now();
          if (payload.prepayment > 0) {
            await logPrepaymentTransaction(finalId, payload, payload.prepayment);
          }
        } else {
          const docRef = await addDoc(collection(db, 'bookings'), payload);
          finalId = docRef.id;
          if (payload.prepayment > 0) {
            await logPrepaymentTransaction(finalId, payload, payload.prepayment);
          }
          syncBookingToGoogle(finalId).catch(err => console.warn('Error syncing new booking:', err));
        }

        // Swap tempId with finalId
        setBookings(prev => prev.map(b => b.id === tempId ? { ...b, id: finalId } : b));

        // Auto-cadastro de cliente
        if (cleanPhone) {
          const exists = clients.some(c => c.phone === cleanPhone);
          if (!exists) {
            const profilePayload = {
              name: payload.clientName,
              phone: cleanPhone,
              email: payload.clientEmail || 'Não informado',
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
          triggerEmailNotification({ ...payload, id: finalId });
        }

        if (blockIdToCancelOnSuccess) {
          if (isDemoMode) {
            setBookings(prev => prev.filter(b => b.id !== blockIdToCancelOnSuccess));
          } else {
            await updateDoc(doc(db, 'bookings', blockIdToCancelOnSuccess), { status: 'cancelado' });
            setBookings(prev => prev.map(b => b.id === blockIdToCancelOnSuccess ? { ...b, status: 'cancelado' } : b));
            syncBookingToGoogle(blockIdToCancelOnSuccess, true).catch(err => console.warn('Error syncing cancelation of block:', err));
          }
          setBlockIdToCancelOnSuccess(null);
        }

      } catch (err) {
        console.error('Erro ao registrar agendamento manual em background:', err);
        setBookings(prev => prev.filter(b => b.id !== tempId));
        alert('Erro ao registrar agendamento no servidor. Tente novamente.');
      } finally {
        isSubmittingRef.current = false;
      }
    })();
  };

  const handleCellClick = (dateStr, slot, profId, profName) => {
    const [year, month, day] = dateStr.split('-');
    const dateObj = new Date(year, month - 1, day);
    const weekday = DAYS_TRANSLATION[getAdjustedDay(dateObj)];

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
      notes: '',
      prepayment: 0
    });
    setShowSlotActionModal(false);
    setShowAddModal(true);
  };

  const handleBlockSlotSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return;

    // Identificar todos os slots a serem bloqueados na janela selecionada
    const startIdx = TIME_SLOTS.indexOf(selectedSlot.time);
    let endIdx = TIME_SLOTS.indexOf(blockEndTime);
    if (blockEndTime === '21:00') {
      endIdx = TIME_SLOTS.length;
    }

    const slotsToBlock = [];
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      for (let i = startIdx; i < endIdx; i++) {
        slotsToBlock.push(TIME_SLOTS[i]);
      }
    } else {
      slotsToBlock.push(selectedSlot.time);
    }

    // --- OPTIMISTIC UPDATE FOR BLOCKS ---
    const tempBlocks = slotsToBlock.map((slotTime, idx) => ({
      id: 'temp-block-' + Date.now() + '-' + idx,
      clientName: 'Horário Bloqueado',
      clientPhone: '00000000000',
      clientEmail: '',
      service: {
        name: 'Bloqueio Administrativo',
        price: 0
      },
      date: selectedSlot.date,
      time: slotTime,
      profissional: selectedSlot.profissional || 'jon',
      notes: blockMotive || 'Bloqueio administrativo',
      status: 'bloqueado',
      createdAt: new Date().toISOString()
    }));

    // Update UI immediately
    setBookings(prev => [...prev, ...tempBlocks]);

    // Close modal instantly
    setShowSlotActionModal(false);
    const savedBlockMotive = blockMotive;
    const savedSelectedSlot = selectedSlot;
    setBlockMotive('Almoço');
    setSelectedSlot(null);

    // Save in background asynchronously
    (async () => {
      try {
        if (isDemoMode) {
          const demoBlocks = tempBlocks.map((tb, idx) => ({ ...tb, id: 'demo-block-' + Date.now() + '-' + idx }));
          setBookings(prev => prev.map(b => {
            const matched = tempBlocks.find(tb => tb.id === b.id);
            if (matched) {
              const idx = tempBlocks.indexOf(matched);
              return demoBlocks[idx];
            }
            return b;
          }));
        } else {
          const promises = slotsToBlock.map(async (slotTime, idx) => {
            const payload = {
              clientName: 'Horário Bloqueado',
              clientPhone: '00000000000',
              clientEmail: '',
              service: {
                name: 'Bloqueio Administrativo',
                price: 0
              },
              date: savedSelectedSlot.date,
              time: slotTime,
              profissional: savedSelectedSlot.profissional || 'jon',
              notes: savedBlockMotive || 'Bloqueio administrativo',
              status: 'bloqueado',
              createdAt: new Date().toISOString()
            };
            const docRef = await addDoc(collection(db, 'bookings'), payload);
            syncBookingToGoogle(docRef.id).catch(err => console.warn('Error syncing block:', err));
            
            // Swap temp block ID with real Firestore doc ID
            setBookings(prev => prev.map(b => b.id === tempBlocks[idx].id ? { ...b, id: docRef.id } : b));
          });
          await Promise.all(promises);
        }
      } catch (err) {
        console.error('Erro ao bloquear horário em background:', err);
        const tempIds = tempBlocks.map(tb => tb.id);
        setBookings(prev => prev.filter(b => !tempIds.includes(b.id)));
        alert('Não foi possível salvar o bloqueio de horário no servidor.');
      }
    })();
  };

  const getBlockEndTimeOptions = () => {
    if (!selectedSlot || !selectedSlot.time) return [];
    const idx = TIME_SLOTS.indexOf(selectedSlot.time);
    if (idx === -1) return [];
    
    const slotsAfter = TIME_SLOTS.slice(idx + 1);
    if (slotsAfter.length > 0) {
      const lastSlot = slotsAfter[slotsAfter.length - 1];
      if (lastSlot === '20:00') {
        slotsAfter.push('21:00');
      }
    } else {
      if (selectedSlot.time === '20:00') {
        slotsAfter.push('21:00');
      }
    }
    return slotsAfter;
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

  const addUsedProduct = (productId, name, priceStr) => {
    const existing = usedProducts.find(ap => ap.productId === productId);
    if (existing) {
      setUsedProducts(prev => prev.map(ap => 
        ap.productId === productId ? { ...ap, quantity: ap.quantity + 1 } : ap
      ));
    } else {
      setUsedProducts(prev => [...prev, { productId, name, price: Number(priceStr), quantity: 1 }]);
    }
    setSelectedUsedProduct('');
  };

  const removeUsedProduct = (index) => {
    setUsedProducts(prev => prev.filter((_, idx) => idx !== index));
  };

  const addNonRegisteredProduct = (name, val) => {
    if (!name || val <= 0) return;
    setNonRegisteredProducts(prev => [...prev, { name, value: Number(val) }]);
    setNewNonRegName('');
    setNewNonRegVal(0);
  };

  const removeNonRegisteredProduct = (index) => {
    setNonRegisteredProducts(prev => prev.filter((_, idx) => idx !== index));
  };

  const calculateTotal = () => {
    const base = usingClientPackageId 
      ? 0 
      : (sellingPackageId 
          ? (packages.find(p => p.id === sellingPackageId)?.price || 0)
          : (overrideBasePrice !== null ? overrideBasePrice : (selectedBooking?.service?.promoPrice || selectedBooking?.service?.price || selectedBooking?.servicePrice || 150))
        );
    const extras = addedServices.reduce((sum, item) => sum + item.price, 0);
    const prods = addedProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const prepay = selectedBooking?.prepayment ? Number(selectedBooking.prepayment) : 0;
    return Math.max(0, base + extras + prods + Number(extraCharged || 0) - discount - prepay);
  };

  const handleFinalizeFromComanda = async (booking, payload) => {
    const { paymentMethod: pm, tipValue, addedProducts: ap, addedServices: as = [], usedProducts: up = [], extraCost = 0, discount: disc = 0, overrideBasePrice: obp, requestReview } = payload;
    const productsNorm = (ap || []).map(p => ({ ...p, quantity: p.qty }));
    const usedProductsNorm = (up || []).map(p => ({ ...p, quantity: p.qty }));
    const servicePrice = obp !== null && obp !== undefined ? obp : (booking.servicePrice || booking.service?.price || 0);
    const prepay = booking.prepayment ? Number(booking.prepayment) : 0;
    
    const extraServicesTotal = (as || []).reduce((s, x) => s + x.price * x.qty, 0);
    const productsTotal = (ap || []).reduce((s, p) => s + p.price * p.qty, 0);
    const subtotal = servicePrice + extraServicesTotal + (tipValue || 0) + productsTotal;
    const totalValue = Math.max(0, subtotal - disc - prepay);

    const itemsDescription = [
      booking.service?.name || booking.serviceName || 'Serviço',
      ...(as || []).map(s => `${s.qty}x ${s.name}`),
      ...(ap || []).map(p => `${p.qty || p.quantity || 1}x ${p.name} (Venda)`)
    ].filter(Boolean).join(', ');

    const transactionPayload = {
      bookingId: booking.id,
      date: booking.date || getLocalDateString(new Date()),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      clientName: booking.clientName,
      clientPhone: booking.clientPhone || '',
      type: 'entrada',
      paymentMethod: pm,
      value: totalValue,
      discount: disc,
      description: itemsDescription + 
                   (tipValue > 0 ? ` (Gorjeta: R$ ${tipValue.toFixed(2)})` : '') + 
                   (disc > 0 ? ` (Desconto: R$ ${disc.toFixed(2)})` : '') +
                   (prepay > 0 ? ` (Sinal/Adiantamento: -R$ ${prepay.toFixed(2)})` : ''),
      professionalId: booking.professionalId || booking.profissional || 'jon',
      productSales: productsNorm.map(p => ({
        productId: p.productId,
        name: p.name,
        quantity: p.quantity,
        price: p.price
      })),
      usedProducts: usedProductsNorm.map(p => ({
        productId: p.productId,
        name: p.name,
        quantity: p.quantity,
        price: p.price
      })),
      extraCost: Number(extraCost) || 0,
      createdAt: new Date().toISOString()
    };

    // Calculate service cost (operational supplies only, sales not included as execution cost)
    const mainService = services.find(s => s.name === (booking.service?.name || booking.serviceName));
    const mainServiceCost = mainService ? (Number(mainService.cost) || 0) : 0;
    const extraServicesCost = (as || []).reduce((sum, item) => {
      const match = services.find(s => s.name === item.name);
      return sum + (match ? (Number(match.cost) || 0) : 0);
    }, 0);
    const usedProductsTotal = usedProductsNorm.reduce((s, p) => s + p.price, 0);
    const totalServiceCost = mainServiceCost + extraServicesCost + usedProductsTotal + extraCost;

    const saidaPayload = {
      bookingId: booking.id,
      date: booking.date || getLocalDateString(new Date()),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      clientName: booking.clientName,
      clientPhone: booking.clientPhone || '',
      type: 'saida',
      paymentMethod: pm || 'Pix',
      value: totalServiceCost,
      discount: 0,
      description: `Custo de Execução - ${booking.service?.name || booking.serviceName || 'Serviço'}${(as || []).length > 0 ? ' + extras' : ''}${usedProductsTotal > 0 ? ` (Insumos: R$ ${usedProductsTotal})` : ''}${extraCost > 0 ? ` (Extra Manual: R$ ${extraCost})` : ''}`,
      professionalId: booking.professionalId || booking.profissional || 'jon',
      usedProducts: usedProductsNorm.map(p => ({
        productId: p.productId,
        name: p.name,
        quantity: p.quantity,
        price: p.price
      })),
      extraCost: Number(extraCost) || 0,
      createdAt: new Date().toISOString()
    };

    const cleanPhone = (booking.clientPhone || '').replace(/\D/g, '');
    const hasValidPhone = cleanPhone && cleanPhone.length >= 10;
    const gateway = settings?.waReminderGateway;
    const needsWaOpen = requestReview && hasValidPhone && (!gateway || gateway === 'none');
    const waWindow = needsWaOpen ? window.open('', '_blank') : null;

    try {
      if (isDemoMode || !db) {
        setBookings(prev => prev.map(b => b.id === booking.id ? { 
          ...b, 
          status: 'finalizado',
          paymentMethod: pm,
          finalValue: totalValue,
          servicePrice: servicePrice
        } : b));
        
        const localProds = localStorage.getItem('demo_products');
        if (localProds) {
          const prods = JSON.parse(localProds);
          const updated = prods.map(p => {
            const added = productsNorm.find(ap => ap.productId === p.id);
            const used = usedProductsNorm.find(up => up.productId === p.id);
            const deductQty = (added ? added.quantity : 0) + (used ? used.quantity : 0);
            return deductQty > 0 ? { ...p, quantity: Math.max(0, p.quantity - deductQty) } : p;
          });
          localStorage.setItem('demo_products', JSON.stringify(updated));
          setProducts(updated);
        }

        const localTx = localStorage.getItem('demo_financial') || localStorage.getItem('demo_transactions');
        const currentTx = localTx ? JSON.parse(localTx) : [];
        const newTx = { id: 'tx_' + Date.now(), ...transactionPayload };
        let updatedTxList = [newTx, ...currentTx];

        if (totalServiceCost > 0) {
          const newSaidaTx = { id: 'tx_saida_' + Date.now(), ...saidaPayload };
          updatedTxList = [newSaidaTx, ...updatedTxList];
        }

        localStorage.setItem('demo_financial', JSON.stringify(updatedTxList));
        localStorage.setItem('demo_transactions', JSON.stringify(updatedTxList));
        setTransactions(updatedTxList);
      } else {
        await updateDoc(doc(db, 'bookings', booking.id), { 
          status: 'finalizado',
          paymentMethod: pm,
          finalValue: totalValue,
          servicePrice: servicePrice
        });
        setBookings(prev => prev.map(b => b.id === booking.id ? { 
          ...b, 
          status: 'finalizado',
          paymentMethod: pm,
          finalValue: totalValue,
          servicePrice: servicePrice
        } : b));
        syncBookingToGoogle(booking.id).catch(err => console.warn(err));

        // Deduce stock for used supplies
        for (const u of usedProductsNorm) {
          const match = products.find(prod => prod.id === u.productId);
          if (match) {
            await updateDoc(doc(db, 'products', u.productId), { quantity: Math.max(0, match.quantity - u.quantity) });
          }
        }

        // Deduce stock for retail products sold
        for (const p of productsNorm) {
          const match = products.find(prod => prod.id === p.productId);
          if (match) {
            await updateDoc(doc(db, 'products', p.productId), { quantity: Math.max(0, match.quantity - p.quantity) });
          }
        }

        await addDoc(collection(db, 'financial_transactions'), transactionPayload);
        
        if (totalServiceCost > 0) {
          await addDoc(collection(db, 'financial_transactions'), saidaPayload);
        }
      }

      if (waWindow) {
        const firstName = (booking.clientName || '').split(' ')[0];
        const msgText = `${firstName}, muito obrigado por vir ao Studio hoje! A sua presença e a confiança que você deposita no meu trabalho significam o mundo para mim. ❤️\n\nSe você gostou do resultado e sentiu a diferença nos seus cachos, você poderia deixar uma avaliação rápida no Google? Isso me ajuda muito e faz com que outras cacheadas nos encontrem.\n\nLeva apenas 1 minutinho clicando aqui:\nhttps://g.page/r/CRmlu0sO48XmEBM/review\n\nGrande abraço, Jon.`;
        const phoneWithDDI = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
        const waUrl = `https://api.whatsapp.com/send?phone=${phoneWithDDI}&text=${encodeURIComponent(msgText)}`;
        waWindow.location.href = waUrl;
        toast('Abrindo WhatsApp diretamente... 🚀', 'success');
      } else if (requestReview && gateway && gateway !== 'none') {
        handleSendFeedbackWhatsApp(booking).catch(err => console.error(err));
      }

      toast('Comanda fechada com sucesso!', 'success');
      setComandaBooking(null);
    } catch (err) {
      if (waWindow) {
        waWindow.close();
      }
      console.error('Erro ao fechar comanda:', err);
      toast('Falha ao fechar comanda.', 'error');
    }
  };

  const handleCloseComanda = async (booking) => {
    const baseServicePrice = usingClientPackageId 
      ? 0 
      : (sellingPackageId 
          ? (packages.find(p => p.id === sellingPackageId)?.price || 0)
          : (overrideBasePrice !== null ? overrideBasePrice : (booking.service?.promoPrice || booking.service?.price || booking.servicePrice || 150))
        );
    const extraServicesTotal = addedServices.reduce((sum, item) => sum + item.price, 0);
    const productsTotal = addedProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const usedProductsTotal = usedProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const nonRegProductsTotal = nonRegisteredProducts.reduce((sum, item) => sum + item.value, 0);
    const prepay = booking.prepayment ? Number(booking.prepayment) : 0;
    const totalComanda = Math.max(0, baseServicePrice + extraServicesTotal + productsTotal + Number(extraCharged || 0) - discount - prepay);

    const itemsDescription = [
      sellingPackageId 
        ? `Compra de Pacote: ${packages.find(p => p.id === sellingPackageId)?.name || 'Pacote'}`
        : (booking.service?.name || booking.serviceName || 'Serviço Base'),
      ...addedServices.map(s => s.name),
      ...addedProducts.map(p => `${p.quantity}x ${p.name}`),
      Number(extraCharged) > 0 ? `Taxa Extra Cobrada (R$ ${extraCharged})` : ''
    ].filter(Boolean).join(', ');

    const baseMethodLabel = usingClientPackageId 
      ? `Pacote (Débito)` 
      : (paymentMethod === 'Cartão de Crédito' ? `Cartão de Crédito (${installments})` : paymentMethod);
    const methodLabel = applyAnticipation ? `${baseMethodLabel} (Antecipado)` : baseMethodLabel;

    const transactionPayload = {
      bookingId: booking.id,
      date: booking.date || getLocalDateString(new Date()),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      clientName: booking.clientName,
      clientPhone: booking.clientPhone || '',
      type: 'entrada',
      paymentMethod: methodLabel,
      value: totalComanda,
      discount: discount,
      extraCharged: Number(extraCharged) || 0,
      extraCost: Number(extraCost) || 0,
      description: `${itemsDescription}${discount > 0 ? ` (Desconto: R$ ${discount})` : ''}${prepay > 0 ? ` (Sinal/Adiantamento: -R$ ${prepay})` : ''}`,
      professionalId: booking.professionalId || booking.profissional || 'jon',
      productSales: addedProducts.map(p => {
        const match = products.find(prod => prod.id === p.productId);
        return {
          productId: p.productId,
          name: p.name,
          quantity: p.quantity,
          sellingPrice: p.price,
          costPrice: match ? (match.costPrice || 0) : 0
        };
      }),
      usedProducts: usedProducts.map(p => ({
        productId: p.productId,
        name: p.name,
        quantity: p.quantity,
        price: p.price
      })),
      nonRegisteredProducts: nonRegisteredProducts.map(p => ({
        name: p.name,
        value: p.value
      })),
      createdAt: new Date().toISOString()
    };

    // Calculate service cost (sum of base service cost + extra services cost + cost of used products/insumos + manual extra cost)
    const mainService = services.find(s => s.name === (booking.service?.name || booking.serviceName));
    const mainServiceCost = mainService ? (Number(mainService.cost) || 0) : 0;
    const extraServicesCost = addedServices.reduce((sum, item) => {
      const match = services.find(s => s.name === item.name);
      return sum + (match ? (Number(match.cost) || 0) : 0);
    }, 0);
    const totalServiceCost = mainServiceCost + extraServicesCost + usedProductsTotal + (Number(extraCost) || 0);

    const bookingServiceName = booking.service?.name || booking.serviceName;
    const servObj = globalData.services.find(s => s.name === bookingServiceName);
    const serviceId = servObj ? servObj.id : '';

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
          clientId: booking.clientPhone || booking.clientName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          clientName: booking.clientName,
          clientPhone: booking.clientPhone || '',
          packageId: sellingPackageId,
          packageName: pkgTemplate ? pkgTemplate.name : 'Pacote',
          pricePaid: pkgTemplate ? pkgTemplate.price : 0,
          paymentMethod: methodLabel,
          datePurchased: booking.date || getLocalDateString(new Date()),
          status: 'active',
          balance: initialBalance,
          usage: [
            {
              bookingId: booking.id,
              dateUsed: booking.date || getLocalDateString(new Date()),
              serviceId
            }
          ]
        };

        if (isDemoMode || !db) {
          const local = localStorage.getItem('demo_client_packages');
          const current = local ? JSON.parse(local) : [];
          const newCp = { id: 'cp_' + Date.now(), ...clientPackagePayload };
          const updatedCp = [newCp, ...current];
          localStorage.setItem('demo_client_packages', JSON.stringify(updatedCp));
          setGlobalData(prev => ({ ...prev, client_packages: updatedCp }));
        } else {
          await addDoc(collection(db, 'client_packages'), clientPackagePayload);
        }
      }

      if (usingClientPackageId) {
        if (isDemoMode || !db) {
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
                    bookingId: booking.id,
                    dateUsed: booking.date || getLocalDateString(new Date()),
                    serviceId
                  }]
                };
              }
              return cp;
            });
            localStorage.setItem('demo_client_packages', JSON.stringify(updated));
            setGlobalData(prev => ({ ...prev, client_packages: updated }));
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
              bookingId: booking.id,
              dateUsed: booking.date || getLocalDateString(new Date()),
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

      // 2. Finalize Booking Status
      if (isDemoMode || !db) {
        setBookings(prev => prev.map(b => b.id === booking.id ? { 
          ...b, 
          status: 'finalizado',
          isPackageUse: !!usingClientPackageId,
          isPackageAcquisition: !!sellingPackageId,
          packageUsedId: usingClientPackageId || null,
          packageSoldId: sellingPackageId || null
        } : b));

        const localProducts = localStorage.getItem('demo_products');
        let updatedProdsList = products;
        if (localProducts) {
          const prods = JSON.parse(localProducts);
          updatedProdsList = prods.map(p => {
            const added = addedProducts.find(ap => ap.productId === p.id);
            const used = usedProducts.find(up => up.productId === p.id);
            let qtyToSubtract = 0;
            if (added) qtyToSubtract += added.quantity;
            if (used) qtyToSubtract += used.quantity;
            if (qtyToSubtract > 0) {
              return { ...p, quantity: Math.max(0, p.quantity - qtyToSubtract) };
            }
            return p;
          });
          localStorage.setItem('demo_products', JSON.stringify(updatedProdsList));
          setProducts(updatedProdsList);
        }

        const localTx = localStorage.getItem('demo_financial') || localStorage.getItem('demo_transactions');
        const currentTx = localTx ? JSON.parse(localTx) : [];
        const newTx = { id: 'tx_' + Date.now(), ...transactionPayload };
        let updatedTxList = [newTx, ...currentTx];

        if (totalServiceCost > 0) {
          const serviceCostTx = {
            id: 'tx_cost_' + Date.now(),
            bookingId: booking.id,
            date: booking.date || getLocalDateString(new Date()),
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            clientName: booking.clientName,
            clientPhone: booking.clientPhone || '',
            type: 'saida',
            paymentMethod,
            value: totalServiceCost,
            description: `Custo de Execução - ${booking.service?.name || booking.serviceName || 'Serviço'}${addedServices.length > 0 ? ' + extras' : ''}${usedProductsTotal > 0 ? ` (Insumos: R$ ${usedProductsTotal})` : ''}${Number(extraCost) > 0 ? ` (Extra Manual: R$ ${Number(extraCost)})` : ''}`,
            professionalId: booking.profissional || 'jon',
            createdAt: new Date().toISOString()
          };
          updatedTxList = [serviceCostTx, ...updatedTxList];
        }

        localStorage.setItem('demo_financial', JSON.stringify(updatedTxList));
        localStorage.setItem('demo_transactions', JSON.stringify(updatedTxList));
        setTransactions(updatedTxList);
      } else {
        const apptRef = doc(db, 'bookings', booking.id);
        await updateDoc(apptRef, { 
          status: 'finalizado',
          isPackageUse: !!usingClientPackageId,
          isPackageAcquisition: !!sellingPackageId,
          packageUsedId: usingClientPackageId || null,
          packageSoldId: sellingPackageId || null
        });
        syncBookingToGoogle(booking.id).catch(err => console.warn('Error syncing completed checkout:', err));

        // Deduct sold products stock
        for (const added of addedProducts) {
          const prodRef = doc(db, 'products', added.productId);
          const match = products.find(p => p.id === added.productId);
          if (match) {
            const newQty = Math.max(0, match.quantity - added.quantity);
            await updateDoc(prodRef, { quantity: newQty });
          }
        }

        // Deduct used products stock
        for (const used of usedProducts) {
          const prodRef = doc(db, 'products', used.productId);
          const match = products.find(p => p.id === used.productId);
          if (match) {
            const newQty = Math.max(0, match.quantity - used.quantity);
            await updateDoc(prodRef, { quantity: newQty });
          }
        }

        await addDoc(collection(db, 'financial_transactions'), transactionPayload);

        if (totalServiceCost > 0) {
          const serviceCostTx = {
            bookingId: booking.id,
            date: booking.date || getLocalDateString(new Date()),
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            clientName: booking.clientName,
            clientPhone: booking.clientPhone || '',
            type: 'saida',
            paymentMethod,
            value: totalServiceCost,
            description: `Custo de Execução - ${booking.service?.name || booking.serviceName || 'Serviço'}${addedServices.length > 0 ? ' + extras' : ''}${usedProductsTotal > 0 ? ` (Insumos: R$ ${usedProductsTotal})` : ''}${Number(extraCost) > 0 ? ` (Extra Manual: R$ ${Number(extraCost)})` : ''}`,
            professionalId: booking.profissional || 'jon',
            createdAt: new Date().toISOString()
          };
          await addDoc(collection(db, 'financial_transactions'), serviceCostTx);
        }
      }

      toast('Comanda fechada com sucesso!', 'success');
      setSelectedBooking(null);
      setIsCheckoutOpen(false);
      setOverrideBasePrice(null);
      setDiscount(0);
      setAddedServices([]);
      setAddedProducts([]);
      setApplyAnticipation(false);
    } catch (err) {
      console.error('Erro ao fechar comanda:', err);
      toast('Falha ao fechar comanda.', 'error');
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
      if (!window.confirm('Este horário já está ocupado por outro agendamento. Deseja continuar?')) {
        return;
      }
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
          syncBookingToGoogle(sourceBooking.id).catch(err => console.warn(err));
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
          const docRef = await addDoc(collection(db, 'bookings'), newPayload);
          syncBookingToGoogle(docRef.id).catch(err => console.warn(err));
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
    const day = getAdjustedDay(d);
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(d.setDate(diff));
    const startStr = getLocalDateString(startOfWeek);

    const endStr = getLocalDateString(new Date(startOfWeek.setDate(startOfWeek.getDate() + 5)));

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
    const tomorrowStr = getLocalDateString(tomorrow);
    
    // Get current hour formatted (e.g., "14", "08")
    const now = new Date();
    const currentHourStr = String(now.getHours()).padStart(2, '0');

    const remindersToSend = bookings.filter(b => {
      const bHour = b.time ? b.time.split(':')[0] : '';
      return b.date === tomorrowStr && 
             bHour === currentHourStr &&
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

      const cancelLink = `https://www.ojonquecortou.com.br/cancelar?id=${booking.id}`;
      let msgText = rawTemplate
        .replace('{cliente}', booking.clientName)
        .replace('{data}', weekdayStr)
        .replace('{hora}', booking.time)
        .replace('{servico}', booking.serviceName || booking.service?.name || 'Serviço');

      if (msgText.includes('{link_cancelamento}')) {
        msgText = msgText.replace('{link_cancelamento}', cancelLink);
      } else {
        msgText += `\n\nCaso precise cancelar ou remarcar seu horário, acesse: ${cancelLink}`;
      }

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

  const handleSendFeedbackWhatsApp = async (booking) => {
    const firstName = (booking.clientName || '').split(' ')[0];
    const msgText = `${firstName}, muito obrigado por vir ao Studio hoje! A sua presença e a confiança que você deposita no meu trabalho significam o mundo para mim. ❤️

Se você gostou do resultado e sentiu a diferença nos seus cachos, você poderia deixar uma avaliação rápida no Google? Isso me ajuda muito e faz com que outras cacheadas nos encontrem.

Leva apenas 1 minutinho clicando aqui:
https://g.page/r/CRmlu0sO48XmEBM/review

Grande abraço, Jon.`;

    const cleanPhone = (booking.clientPhone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      toast('Telefone da cliente inválido.', 'error');
      return;
    }

    const phoneWithDDI = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    const gateway = settings.waReminderGateway;
    if (!gateway || gateway === 'none') {
      console.log('WhatsApp Gateway não configurado, abrindo diretamente:', msgText);
      const waUrl = `https://api.whatsapp.com/send?phone=${phoneWithDDI}&text=${encodeURIComponent(msgText)}`;
      window.open(waUrl, '_blank');
      toast('Abrindo WhatsApp diretamente... 🚀', 'success');
      return;
    }

    try {
      const response = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateway,
          phone: phoneWithDDI,
          message: msgText,
          config: {
            zApiInstanceId: settings.zApiInstanceId,
            zApiToken: settings.zApiToken,
            evolutionApiUrl: settings.evolutionApiUrl,
            evolutionApiKey: settings.evolutionApiKey,
            evolutionInstanceName: settings.evolutionInstanceName,
            customWebhookUrl: settings.customWebhookUrl
          },
          extraData: {
            bookingId: booking.id,
            clientName: booking.clientName,
            date: booking.date,
            time: booking.time,
            service: booking.serviceName || booking.service?.name
          }
        })
      });

      if (response.ok) {
        toast('Mensagem de avaliação enviada com sucesso! 🚀', 'success');
      } else {
        throw new Error('Erro na resposta do gateway de WhatsApp');
      }
    } catch (err) {
      console.warn('Erro ao disparar via API, abrindo WhatsApp diretamente:', err);
      const waUrl = `https://api.whatsapp.com/send?phone=${phoneWithDDI}&text=${encodeURIComponent(msgText)}`;
      window.open(waUrl, '_blank');
      toast('Abrindo WhatsApp diretamente... 🚀', 'success');
    }
  };

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

    const cancelLink = `https://www.ojonquecortou.com.br/cancelar?id=${booking.id}`;
    let finalMsg = message;
    if (finalMsg.includes('{link_cancelamento}')) {
      finalMsg = finalMsg.replace(/{link_cancelamento}/gi, cancelLink);
    } else {
      finalMsg += `\n\nCaso precise cancelar ou reagendar seu horário, acesse: ${cancelLink}`;
    }

    return `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(finalMsg)}`;
  };

  const getWhatsAppFeedbackUrl = (phone, booking) => {
    if (!phone) return '';
    const cleanPhone = phone.replace(/\D/g, '');
    const clientName = booking.clientName || '';
    const firstName = clientName.split(' ')[0];
    const googleLink = 'https://g.page/r/CRmlu0sO48XmEBM/review';
    const message = `${firstName}, muito obrigado por vir ao Studio hoje! A sua presença e a confiança que você deposita no meu trabalho significam o mundo para mim. ❤️

Se você gostou do resultado e sentiu a diferença nos seus cachos, você poderia deixar uma avaliação rápida no Google? Isso me ajuda muito e faz com que outras cacheadas nos encontrem.

Leva apenas 1 minutinho clicando aqui:
${googleLink}

Grande abraço, Jon.`;
    return `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const birthdayClients = (() => {
    const currentMonth = new Date().getMonth() + 1;
    return clients.filter(c => {
      const bday = c.birthdate || c.aniversario;
      if (!bday) return false;
      const parts = bday.split('-');
      if (parts.length < 2) return false;
      const birthMonth = parseInt(parts[1], 10);
      return birthMonth === currentMonth;
    }).sort((a, b) => {
      const bdayA = a.birthdate || a.aniversario || '';
      const bdayB = b.birthdate || b.aniversario || '';
      const dayA = parseInt(bdayA.split('-')[2] || '0', 10);
      const dayB = parseInt(bdayB.split('-')[2] || '0', 10);
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
    const todayStr = getLocalDateString(new Date());
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = getLocalDateString(tomorrow);

    if (dateStr === todayStr) return 'Hoje';
    if (dateStr === tomorrowStr) return 'Amanhã';

    const [year, month, day] = dateStr.split('-');
    const dateObj = new Date(year, month - 1, day);
    return DAYS_TRANSLATION[getAdjustedDay(dateObj)];
  };

  // Mini Calendar list of days
  const getMiniCalDays = () => {
    const year = miniCalDate.getFullYear();
    const month = miniCalDate.getMonth();
    const firstDay = getAdjustedDay(new Date(year, month, 1));
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
    
    // Dimensões estimadas da popover do booking
    const popoverWidth = 260;
    const popoverHeight = 220;
    
    let x = e.clientX + 10;
    let y = e.clientY + 10;
    
    // Evita transbordamento na direita
    if (x + popoverWidth > window.innerWidth) {
      x = e.clientX - popoverWidth - 10;
      if (x < 10) x = 10; // Fallback se a tela for muito pequena
    }
    
    // Evita transbordamento na parte inferior
    if (y + popoverHeight > window.innerHeight) {
      y = e.clientY - popoverHeight - 10;
      if (y < 10) y = 10;
    }
    
    setActivePopover({
      visible: true,
      x: x,
      y: y,
      booking: appt
    });
    setContextMenu({ visible: false, x: 0, y: 0, booking: null, date: '', time: '', professional: 'jon' });
  };

  // Right-Click Handler (custom Context Menu)
  const handleCellContextMenu = (e, dateStr, slot, profId, appt, isBlockedSlot = false) => {
    e.preventDefault();
    e.stopPropagation();

    // Adjust position if it would overflow the viewport height
    const menuHeight = appt ? 380 : (isBlockedSlot ? 130 : 180);
    let y = e.clientY;
    if (e.clientY + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10;
      if (y < 10) y = 10; // Prevent going off-screen on the top
    }

    const menuWidth = 180;
    let x = e.clientX;
    if (e.clientX + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10;
      if (x < 10) x = 10;
    }

    setContextMenu({
      visible: true,
      x: x,
      y: y,
      booking: appt || null,
      date: dateStr,
      time: slot,
      professional: profId,
      isBlockedSlot: isBlockedSlot
    });
    setActivePopover({ visible: false, x: 0, y: 0, booking: null });
  };

  // Remove a recurring weekday block (escala) for the given professional/slot.
  const handleRemoveBlockedSlot = () => {
    const profId = contextMenu.professional;
    const slot = contextMenu.time;
    const dParts = contextMenu.date.split('-');
    const weekday = getAdjustedDay(new Date(Number(dParts[0]), Number(dParts[1]) - 1, Number(dParts[2])));

    setSettings(prev => {
      const profs = (prev.professionals || []).map(p => {
        if (p.id !== profId) return p;
        const newBlocks = (p.blockedWeekdayHours || []).filter(block => {
          const segs = block.split('-');
          const w = segs[0];
          const start = segs[1];
          const end = segs[2] || null;
          if (Number(w) !== weekday) return true; // keep other weekdays
          // remove blocks whose range covers this slot
          return !slotInRange(slot, start, end);
        });
        return { ...p, blockedWeekdayHours: newBlocks };
      });
      const newSettings = { ...prev, professionals: profs };
      if (db && !isDemoMode) {
        updateDoc(doc(db, 'settings', 'studio'), { professionals: profs }).catch(() => {});
      } else {
        localStorage.setItem('demo_settings', JSON.stringify(newSettings));
        localStorage.setItem('demo_studio_settings', JSON.stringify(newSettings));
        window.dispatchEvent(new Event('settingsUpdated'));
      }
      return newSettings;
    });

    toast('Bloqueio removido!', 'success');
    setContextMenu({ visible: false, x: 0, y: 0, booking: null, date: '', time: '', professional: 'jon', isBlockedSlot: false });
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
    const currentDateStr = getLocalDateString(currentDate);
    
    return bookings.filter(b => {
      // Must match active date
      if (b.date !== currentDateStr) return false;

      // Filter by whatsapp status if selected
      if (waFilter !== 'todos') {
        if (waFilter === 'confirmados' && b.status !== 'confirmado' && b.status !== 'confirmado pela cliente') return false;
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

  const getBookingsInScope = () => {
    const curYear = currentDate.getFullYear();
    const curMonth = currentDate.getMonth();
    
    if (statsScope === 'dia') {
      const targetStr = getLocalDateString(currentDate);
      return bookings.filter(b => b.date === targetStr);
    } else if (statsScope === 'semana') {
      const d = new Date(currentDate);
      const day = getAdjustedDay(d);
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(d.setDate(diff));
      startOfWeek.setHours(0,0,0,0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23,59,59,999);
      
      return bookings.filter(b => {
        if (!b.date) return false;
        const bDate = new Date(b.date + 'T00:00:00');
        return bDate >= startOfWeek && bDate <= endOfWeek;
      });
    } else {
      return bookings.filter(b => {
        if (!b.date) return false;
        const [y, m] = b.date.split('-').map(Number);
        return y === curYear && (m - 1) === curMonth;
      });
    }
  };

  const bookingsInScope = getBookingsInScope();
  const statsCounts = {
    pendente: bookingsInScope.filter(b => b.status === 'pendente').length,
    confirmado: bookingsInScope.filter(b => b.status === 'confirmado' || b.status === 'confirmado pela cliente').length,
    finalizado: bookingsInScope.filter(b => b.status === 'finalizado').length,
    cancelado: bookingsInScope.filter(b => b.status === 'cancelado').length,
    faltou: bookingsInScope.filter(b => b.status === 'faltou').length,
  };

  const filteredBookingsList = getFilteredBookings();

  return (
    <div className="admin-dashboard">
      
      {/* Counters Bar */}
      <div className="status-counters-bar">
        <div className="status-counters-left">
          <div className="status-counter-item pendente">
            <span className="status-counter-dot" />
            <span className="status-counter-label">Pendentes:</span>
            <span className="status-counter-val">{statsCounts.pendente}</span>
          </div>
          <div className="status-counter-item confirmado">
            <span className="status-counter-dot" />
            <span className="status-counter-label">Confirmados:</span>
            <span className="status-counter-val">{statsCounts.confirmado}</span>
          </div>
          <div className="status-counter-item finalizado">
            <span className="status-counter-dot" />
            <span className="status-counter-label">Finalizados:</span>
            <span className="status-counter-val">{statsCounts.finalizado}</span>
          </div>
          <div className="status-counter-item cancelado">
            <span className="status-counter-dot" />
            <span className="status-counter-label">Cancelados:</span>
            <span className="status-counter-val">{statsCounts.cancelado}</span>
          </div>
          <div className="status-counter-item faltou">
            <span className="status-counter-dot" />
            <span className="status-counter-label">Faltas:</span>
            <span className="status-counter-val">{statsCounts.faltou}</span>
          </div>
        </div>
        <div className="status-counters-right">
          <select 
            value={statsScope} 
            onChange={e => setStatsScope(e.target.value)}
            className="stats-scope-select"
          >
            <option value="dia">Dia</option>
            <option value="semana">Semana</option>
            <option value="mes">Mês</option>
          </select>
        </div>
      </div>

      {/* Cards de Métricas */}
      <section className="admin-stats-grid">
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Agendamentos Ativos (Dia)</h3>
            <Calendar size={18} style={{ color: 'var(--adm-gold)', opacity: 0.8 }} />
          </div>
          <div className="value">{filteredBookingsList.filter(b => b.status !== 'cancelado' && b.status !== 'bloqueado').length}</div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Aguardando Confirmação</h3>
            <Clock size={18} style={{ color: '#ecc94b', opacity: 0.8 }} />
          </div>
          <div className="value" style={{ color: '#ecc94b' }}>{pendingCount}</div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Receita Consolidada (Semana)</h3>
            <DollarSign size={18} style={{ color: '#4a5d4e', opacity: 0.8 }} />
          </div>
          <div className="value" style={{ color: '#4a5d4e' }}>R$ {revenueThisWeek}</div>
        </div>
      </section>

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
                date: getLocalDateString(currentDate),
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
                date: getLocalDateString(currentDate),
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

                const dStr = getLocalDateString(dayObj.date);
                const dayBookings = bookings.filter(b => b.date === dStr && b.status !== 'cancelado' && b.status !== 'bloqueado');
                const bookingsCount = dayBookings.length;

                return (
                  <span 
                    key={index} 
                    className={`mini-calendar-day ${isDayActive ? 'active' : ''} ${isToday ? 'today' : ''}`}
                    onClick={() => handleMiniCalDayClick(dayObj.date)}
                    style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '38px', padding: '2px 0' }}
                  >
                    <span className="day-number">{dayObj.day}</span>
                    {bookingsCount > 0 && (
                      <span className="mini-calendar-dots" style={{ display: 'flex', gap: '2px', marginTop: '2px', justifyContent: 'center', alignItems: 'center', height: '6px' }}>
                        {Array.from({ length: Math.min(bookingsCount, 3) }).map((_, i) => (
                          <span 
                            key={i} 
                            className="mini-calendar-dot" 
                            style={{ 
                              width: '4px', 
                              height: '4px', 
                              borderRadius: '50%', 
                              backgroundColor: isDayActive ? '#fff' : 'var(--adm-gold)' 
                            }} 
                          />
                        ))}
                        {bookingsCount > 3 && (
                          <span 
                            className="mini-calendar-dot-plus" 
                            style={{ 
                              fontSize: '0.6rem', 
                              color: isDayActive ? '#fff' : 'var(--adm-gold)', 
                              lineHeight: 1, 
                              fontWeight: 700 
                            }}
                          >
                            +
                          </span>
                        )}
                      </span>
                    )}
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
              <div className="wa-pills-container">
                {[
                  { id: 'todos',         label: 'Todos',                       color: 'accent' },
                  { id: 'cancelados',    label: 'Cliente não irá comparecer',  color: 'red' },
                  { id: 'confirmados',   label: 'Confirmado pelo cliente',     color: 'green' },
                  { id: 'pendentes',     label: 'Aguardando confirmação',      color: 'yellow' },
                  { id: 'sem-mensagem',  label: 'Sem mensagem enviada',        color: 'gray' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`wa-filter-pill ${opt.color} ${waFilter === opt.id ? 'active' : ''}`}
                    onClick={() => setWaFilter(opt.id)}
                  >
                    {opt.label}
                  </button>
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
              <div className="accordion-content" style={{ color: 'var(--adm-muted)', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span className="appt-status-dot confirmado" /> Confirmado</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span className="appt-status-dot confirmado-pela-cliente" /> Confirmado pela Cliente</div>
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
            
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="agenda-day-nav">
                <button className="btn-icon" onClick={() => changeDate(-1)}><ChevronLeft size={16} /></button>
                <span className="agenda-day-label">
                  {viewMode === 'diario' ? (
                    currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                  ) : viewMode === 'semanal' ? (
                    `Semana de ${getWeekDays(currentDate)[0].toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} a ${getWeekDays(currentDate)[6].toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  ) : (
                    currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                  )}
                </span>
                <button className="btn-icon" onClick={() => changeDate(1)}><ChevronRight size={16} /></button>
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

              {/* View Switcher Tabs */}
              <div className="view-mode-tabs" style={{ display: 'flex', border: '1px solid var(--adm-rule)', borderRadius: 8, padding: 2, background: 'var(--adm-surface)' }}>
                {['diario', 'semanal', 'mensal'].map(mode => (
                  <button
                    key={mode}
                    type="button"
                    className={`btn ${viewMode === mode ? 'btn-accent' : 'btn-ghost'}`}
                    style={{ padding: '4px 12px', fontSize: '0.82rem', textTransform: 'capitalize', borderRadius: 6 }}
                    onClick={() => setViewMode(mode)}
                  >
                    {mode === 'diario' ? 'Diário' : mode === 'semanal' ? 'Semanal' : 'Mensal'}
                  </button>
                ))}
              </div>

              {/* Professional Dropdown for Weekly/Monthly */}
              {(viewMode === 'semanal' || viewMode === 'mensal') && (
                <select
                  value={selectedWeeklyMonthlyProf}
                  onChange={e => setSelectedWeeklyMonthlyProf(e.target.value)}
                  className="stats-scope-select"
                  style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                >
                  {activeProfessionalsList.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0 }}>
              <input 
                type="text" 
                className="agenda-search-input" 
                placeholder="Buscar cliente agendado..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button 
                className="btn btn-accent" 
                style={{ padding: '8px 16px', fontSize: '0.9rem' }} 
                onClick={() => {
                  setSelectedSlot({
                    date: getLocalDateString(currentDate),
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
                    date: getLocalDateString(currentDate),
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
            <div className="calendar-grid-wrapper">
              {viewMode === 'diario' && (
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
                      const currentDateStr = getLocalDateString(currentDate);
                      const slotMin = timeToMin(slot);

                      // Find all bookings active or overlapping with this 60-min hourly slot
                      let cellBookings = filteredBookingsList.filter(b => {
                        if (b.status === 'cancelado') return false;
                        if ((b.profissional || 'jon') !== prof.id) return false;
                        if (b.date !== currentDateStr) return false;
                        const bStart = timeToMin(b.time);
                        const bEnd = bStart + (b.duration || 60);
                        return Math.max(bStart, slotMin) < Math.min(bEnd, slotMin + 60);
                      });

                      // Unify duplicate bookings only if they have the exact same database ID to avoid react key issues
                      const seen = new Set();
                      cellBookings = cellBookings.filter(b => {
                        if (!b.id) return true;
                        if (seen.has(b.id)) return false;
                        seen.add(b.id);
                        return true;
                      });

                      const effectiveAbsences = getEffectiveAbsences(settings);
                      const absence = cellBookings.length === 0 ? getAbsenceForSlot(effectiveAbsences, currentDateStr, slot) : null;
                      const blockedBySettings = cellBookings.length === 0 && !absence && isSlotBlocked(prof, currentDateStr, slot);

                      return (
                        <div 
                          key={prof.id} 
                          className="day-cell"
                          style={{ 
                            cursor: 'pointer',
                            position: 'relative',
                            minHeight: '60px'
                          }}
                          onClick={(e) => {
                             if (absence) return; // Absences handle their own clicks
                             if (blockedBySettings) return; // Blocked card handles its own click (opens menu)
                             handleCellClick(currentDateStr, slot, prof.id, prof.name);
                           }}
                        >
                          {cellBookings.length > 0 ? (
                            <div style={{ display: 'flex', gap: 4, width: '100%', height: '100%', padding: '2px' }}>
                              {cellBookings.map(bk => {
                                const bStart = timeToMin(bk.time);
                                const isSubsequent = bStart < slotMin;
                                const duration = bk.duration || 60;
                                
                                let apptTimeText = '';
                                const startStr = bk.time || '00:00';
                                const parts = startStr.split(':');
                                const h = parts[0] ? Number(parts[0]) : 0;
                                const m = parts[1] ? Number(parts[1]) : 0;
                                const endMin = h * 60 + m + duration;
                                const endH = Math.floor(endMin / 60);
                                const endM = endMin % 60;
                                const endStr = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
                                apptTimeText = `${startStr} - ${endStr}`;

                                if (bk.status === 'bloqueado') {
                                  return (
                                    <div 
                                      key={bk.id}
                                      className={`appt-card bloqueado bloqueado-${(bk.notes || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-')}`}
                                      onClick={(e) => handleBookingLeftClick(e, bk)}
                                      onContextMenu={(e) => handleCellContextMenu(e, currentDateStr, slot, prof.id, bk)}
                                      style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}
                                    >
                                      <MoreVertical size={13} style={{ position: 'absolute', top: '5px', right: '4px', opacity: 0.6 }} />
                                      <span className="appt-time">{apptTimeText}</span>
                                      <span className="appt-client" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Lock size={12} /> Bloqueado
                                      </span>
                                      <span className="appt-service" style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', display: 'block', maxWidth: '100%' }}>
                                        {bk.notes}
                                      </span>
                                    </div>
                                  );
                                }

                                return (
                                  <div 
                                    key={bk.id} 
                                    className={`appt-card ${bk.status} ${(bk.status || '').replace(/\s+/g, '-')} ${getServiceCategoryInfo(bk.service?.name || bk.serviceName, services).class}`}
                                    onClick={(e) => handleBookingLeftClick(e, bk)}
                                    onContextMenu={(e) => handleCellContextMenu(e, currentDateStr, slot, prof.id, bk)}
                                    style={{ 
                                      flex: 1, 
                                      height: '100%', 
                                      display: 'flex', 
                                      flexDirection: 'row', 
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      position: 'relative',
                                      padding: '8px 16px',
                                      overflow: 'hidden',
                                      borderRadius: '0px',
                                      ...(isSubsequent ? {
                                        opacity: 0.85, 
                                        borderTop: 'none', 
                                        background: 'rgba(110, 47, 24, 0.08)',
                                        borderLeft: '3px dashed var(--adm-gold)',
                                        color: 'var(--adm-text, #221A15)'
                                      } : {})
                                    }}
                                  >
                                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', gap: '2px' }}>
                                      <span 
                                        className="appt-client" 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedFichaClient({ name: bk.clientName, phone: bk.clientPhone });
                                        }}
                                        style={{ 
                                          fontWeight: 'bold', color: 'inherit', fontSize: '0.92rem', cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                        }}
                                      >
                                        {bk.clientName}
                                        {isClientRecurrent(bk.clientName, bk.clientPhone) && (
                                          <span style={{
                                            position: 'absolute',
                                            marginLeft: '4px',
                                            width: '5px',
                                            height: '5px',
                                            borderRadius: '50%',
                                            backgroundColor: 'var(--adm-gold, #dca354)',
                                            display: 'inline-block'
                                          }} title="Cliente Recorrente" />
                                        )}
                                      </span>
                                      <span className="appt-service-info" style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {bk.service?.name || bk.serviceName} · {(() => {
                                          const m = bk.duration || 60;
                                          const h = Math.floor(m / 60);
                                          const r = m % 60;
                                          if (h > 0 && r > 0) return `${h}h${r}`;
                                          if (h > 0) return `${h}h`;
                                          return `${r}min`;
                                        })()}
                                      </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      {bk.status === 'finalizado' && (
                                        <span style={{
                                          fontSize: '9px',
                                          fontWeight: 800,
                                          padding: '2px 6px',
                                          background: 'rgba(63, 185, 80, 0.15)',
                                          color: '#3FB950',
                                          border: '1px solid rgba(63, 185, 80, 0.3)',
                                          borderRadius: '2px',
                                          letterSpacing: '0.05em'
                                        }}>✓ FINALIZADO</span>
                                      )}
                                      <div className="appt-badge" style={{ textTransform: 'uppercase' }}>
                                        {getServiceCategoryInfo(bk.service?.name || bk.serviceName, services).badge}
                                      </div>
                                    </div>
                                  </div>
                              );
                              })}
                            </div>
                          ) : absence ? (
                            <div 
                              className="appt-card bloqueado"
                              onClick={(e) => {
                                e.stopPropagation();
                               if (absence.fixed) {
                                  const opt = prompt(
                                    "O que deseja fazer com esta ausência fixa 'Psicóloga'?\n\n" +
                                    "Digite '1' para Mudar o horário (Acessar Configurações)\n" +
                                    "Digite '2' para Cancelar e deixar o slot vago (Desativar)\n" +
                                    "Digite '3' para Adicionar como Horário Recorrente Geral\n\n" +
                                    "Digite a opção (1, 2 ou 3):"
                                  );
                                  if (opt === '1') {
                                    window.location.href = "/admin/settings?tab=politicas";
                                  } else if (opt === '2') {
                                    const updateFn = async () => {
                                      const newSettings = { ...settings, disablePsicologa: true };
                                      if (db && !isDemoMode) {
                                        await updateDoc(doc(db, 'settings', 'studio'), { disablePsicologa: true });
                                      } else {
                                        localStorage.setItem('demo_settings', JSON.stringify(newSettings));
                                        window.dispatchEvent(new Event('settingsUpdated'));
                                      }
                                      toast("Bloqueio de Psicóloga desativado!", "success");
                                      window.location.reload();
                                    };
                                    updateFn();
                                  } else if (opt === '3') {
                                    alert("Você pode gerenciar as ausências recorrentes na aba de Configurações de Escala do profissional.");
                                    window.location.href = "/admin/settings?tab=profissionais";
                                  }
                                } else {
                                  const opt = prompt(
                                    `O que deseja fazer com a ausência "${absence.title}"?\n\n` +
                                    "Digite '1' para Mudar o horário / Editar\n" +
                                    "Digite '2' para Cancelar e deixar o slot vago (Excluir)\n" +
                                    "Digite '3' para Tornar recorrente na semana\n\n" +
                                    "Digite a opção (1, 2 ou 3):"
                                  );
                                  if (opt === '1') {
                                    // Trigger editing flow or prompt new values
                                    const newTitle = prompt("Digite o novo título da ausência:", absence.title);
                                    if (newTitle !== null) {
                                      const start = prompt("Novo horário de início (HH:MM):", absence.startTime || "08:00");
                                      const end = prompt("Novo horário de término (HH:MM):", absence.endTime || "09:00");
                                      if (start && end) {
                                        const updatedAbs = { ...absence, title: newTitle, startTime: start, endTime: end };
                                        const updateList = (settings.absences || []).map(a => a.id === absence.id ? updatedAbs : a);
                                        const saveFn = async () => {
                                          if (db && !isDemoMode) {
                                            await updateDoc(doc(db, 'settings', 'studio'), { absences: updateList });
                                          } else {
                                            const newSettings = { ...settings, absences: updateList };
                                            localStorage.setItem('demo_settings', JSON.stringify(newSettings));
                                            localStorage.setItem('demo_studio_settings', JSON.stringify(newSettings));
                                            window.dispatchEvent(new Event('settingsUpdated'));
                                          }
                                          toast("Ausência atualizada!", "success");
                                          window.location.reload();
                                        };
                                        saveFn();
                                      }
                                    }
                                  } else if (opt === '2') {
                                    handleRemoveAbsence(absence);
                                  } else if (opt === '3') {
                                    // Make recurring (weekly)
                                    const updatedAbs = { ...absence, recurrence: 'weekly', weekday: new Date().getDay() };
                                    const updateList = (settings.absences || []).map(a => a.id === absence.id ? updatedAbs : a);
                                    const saveFn = async () => {
                                      if (db && !isDemoMode) {
                                        await updateDoc(doc(db, 'settings', 'studio'), { absences: updateList });
                                      } else {
                                        const newSettings = { ...settings, absences: updateList };
                                        localStorage.setItem('demo_studio_settings', JSON.stringify(newSettings));
                                        window.dispatchEvent(new Event('settingsUpdated'));
                                      }
                                      toast("Ausência definida como recorrente!", "success");
                                      window.location.reload();
                                    };
                                    saveFn();
                                  }
                                }
                              }}
                              style={(() => {
                                const title = (absence.title || '').toLowerCase();
                                let bg = 'rgba(90, 158, 206, 0.12)';
                                let border = '4px solid #5A9ECE';
                                let color = '#5A9ECE';
                                
                                if (title.includes('médico') || title.includes('medico')) {
                                  bg = 'rgba(235, 94, 85, 0.12)';
                                  border = '4px solid #eb5e55';
                                  color = '#eb5e55';
                                  } else if (title.includes('almoço') || title.includes('almoco')) {
                                    bg = 'rgba(231, 111, 81, 0.12)';
                                    border = '4px solid #E76F51';
                                    color = '#E76F51';
                                } else if (title.includes('folga')) {
                                  bg = 'rgba(114, 137, 218, 0.12)';
                                  border = '4px solid #7289da';
                                  color = '#7289da';
                                } else if (title.includes('viagem')) {
                                  bg = 'rgba(74, 163, 223, 0.12)';
                                  border = '4px solid #4aa3df';
                                  color = '#4aa3df';
                                } else if (title.includes('pausa')) {
                                  bg = 'rgba(26, 188, 156, 0.12)';
                                  border = '4px solid #1abc9c';
                                  color = '#1abc9c';
                                } else if (title.includes('ausência') || title.includes('ausencia') || title.includes('psicóloga') || title.includes('psicologa')) {
                                  bg = 'rgba(155, 89, 182, 0.12)';
                                  border = '4px solid #9b59b6';
                                  color = '#9b59b6';
                                }
                                
                                return {
                                  background: bg, 
                                  borderLeft: border, 
                                  color: color, 
                                  cursor: 'pointer',
                                  height: '100%',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'center',
                                  padding: '6px 8px',
                                  margin: '2px'
                                };
                              })()}
                            >
                              <span className="appt-time" style={{ 
                                color: (() => {
                                  const title = (absence.title || '').toLowerCase();
                                  if (title.includes('médico') || title.includes('medico')) return '#eb5e55';
                                  if (title.includes('almoço') || title.includes('almoco')) return '#E76F51';
                                  if (title.includes('folga')) return '#7289da';
                                  if (title.includes('viagem')) return '#4aa3df';
                                  if (title.includes('pausa')) return '#1abc9c';
                                  if (title.includes('ausência') || title.includes('ausencia') || title.includes('psicóloga') || title.includes('psicologa')) return '#9b59b6';
                                  return '#5A9ECE';
                                })()
                              }}>{slot}</span>
                              <span className="appt-client" style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 4, 
                                color: (() => {
                                  const title = (absence.title || '').toLowerCase();
                                  if (title.includes('médico') || title.includes('medico')) return '#eb5e55';
                                  if (title.includes('almoço') || title.includes('almoco')) return '#E76F51';
                                  if (title.includes('folga')) return '#7289da';
                                  if (title.includes('viagem')) return '#4aa3df';
                                  if (title.includes('pausa')) return '#1abc9c';
                                  if (title.includes('ausência') || title.includes('ausencia') || title.includes('psicóloga') || title.includes('psicologa')) return '#9b59b6';
                                  return '#8b7cc8';
                                })()
                              }}>
                                <Lock size={12} /> {absence.title}
                              </span>
                              <span className="appt-service" style={{ 
                                color: (() => {
                                  const title = (absence.title || '').toLowerCase();
                                  if (title.includes('médico') || title.includes('medico')) return 'rgba(235, 94, 85, 0.7)';
                                  if (title.includes('almoço') || title.includes('almoco')) return 'rgba(231, 111, 81, 0.7)';
                                  if (title.includes('folga')) return 'rgba(114, 137, 218, 0.7)';
                                  if (title.includes('viagem')) return 'rgba(74, 163, 223, 0.7)';
                                  if (title.includes('pausa')) return 'rgba(26, 188, 156, 0.7)';
                                  if (title.includes('ausência') || title.includes('ausencia') || title.includes('psicóloga') || title.includes('psicologa')) return 'rgba(155, 89, 182, 0.7)';
                                  return 'rgba(90, 158, 206, 0.7)';
                                })()
                              }}>
                                Ausência
                              </span>
                            </div>
                          ) : blockedBySettings ? (() => {
                            const reason = getSlotBlockReason(prof, currentDateStr, slot);
                            
                            // Se for Almoço, renderiza no estilo semântico do almoço
                            if (reason === 'Almoço') {
                              return (
                                <div
                                  className="appt-card bloqueado"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedScaleBlock({
                                      date: currentDateStr,
                                      slot: slot,
                                      profId: prof.id,
                                      profName: prof.name,
                                      reason: 'Almoço'
                                    });
                                    setShowScaleBlockModal(true);
                                  }}
                                  onContextMenu={(e) => handleCellContextMenu(e, currentDateStr, slot, prof.id, null, true)}
                                  style={{
                                    background: 'rgba(231, 111, 81, 0.12)',
                                    color: '#E76F51',
                                    borderLeft: '4px solid #E76F51',
                                    cursor: 'pointer',
                                    margin: '2px',
                                    height: 'calc(100% - 4px)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    padding: '6px 8px'
                                  }}
                                >
                                  <span className="appt-time" style={{ color: '#E76F51' }}>{slot}</span>
                                  <span className="appt-client" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#E76F51', fontWeight: 600 }}>
                                    <Lock size={12} /> Almoço
                                  </span>
                                  <span className="appt-service" style={{ color: 'rgba(231, 111, 81, 0.7)' }}>
                                    Intervalo Padrão
                                  </span>
                                </div>
                              );
                            }

                            // Estilo de bloqueio genérico ou fora de expediente (com excelente contraste dark mode!)
                            const isOut = reason === 'Fora de Expediente';
                            return (
                              <div
                                className="appt-card bloqueado"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedScaleBlock({
                                    date: currentDateStr,
                                    slot: slot,
                                    profId: prof.id,
                                    profName: prof.name,
                                    reason: reason
                                  });
                                  setShowScaleBlockModal(true);
                                }}
                                onContextMenu={(e) => handleCellContextMenu(e, currentDateStr, slot, prof.id, null, true)}
                                style={{
                                  background: isOut ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.05)',
                                  color: 'rgba(255, 255, 255, 0.65)',
                                  borderLeft: '4px solid rgba(255, 255, 255, 0.25)',
                                  opacity: isOut ? 0.7 : 0.85,
                                  cursor: 'pointer',
                                  margin: '2px',
                                  height: 'calc(100% - 4px)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'center',
                                  padding: '6px 8px'
                                }}
                              >
                                <span className="appt-time" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>{slot}</span>
                                <span className="appt-client" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--adm-text)', fontWeight: 600 }}>
                                  <Lock size={12} /> {reason || 'Bloqueado'}
                                </span>
                                <span className="appt-service" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>
                                  {isOut ? 'Fora de Horário' : 'Escala Administrativa'}
                                </span>
                              </div>
                            );
                          })() : null}
                        </div>
                      );
                    })}

                  </div>
                ))}
              </div>

            </div>
          )}

          {/* VIEW: SEMANAL (GRADE VISUAL DESKTOP) */}
          {viewMode === 'semanal' && (
            <div className="calendar-grid weekly-view">
              {/* Header da semana */}
              <div 
                className="pro-columns-header" 
                style={{ gridTemplateColumns: `80px repeat(7, 1fr)` }}
              >
                <div className="pro-header-cell" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Hora</div>
                {getWeekDays(currentDate).map(d => {
                  const dStr = getLocalDateString(d);
                  const isToday = dStr === getLocalDateString(new Date());
                  const weekdaysShort = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'];
                  return (
                    <div key={dStr} className={`pro-header-cell ${isToday ? 'active-day-header' : ''}`} style={{ borderBottom: isToday ? '3px solid var(--adm-gold)' : 'none' }}>
                      <span className="pro-name" style={{ fontSize: '0.9rem', color: isToday ? 'var(--adm-gold)' : 'inherit', fontWeight: isToday ? 'bold' : 'normal' }}>
                        {weekdaysShort[getAdjustedDay(d)]} {d.getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Body da grade semanal */}
              <div className="calendar-body" style={{ display: 'flex', flexDirection: 'row', position: 'relative' }}>
                {/* Horários no lado esquerdo */}
                <div className="weekly-hours-column" style={{ width: 80, flexShrink: 0, borderRight: '1px solid var(--adm-rule)', background: 'var(--adm-card)' }}>
                  {['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map(h => (
                    <div key={h} className="time-label-cell" style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', borderBottom: '1px solid var(--adm-rule)' }}>
                      {h}
                    </div>
                  ))}
                </div>

                {/* Colunas de dias da semana */}
                <div className="weekly-days-columns" style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', position: 'relative', height: 540 }}>
                  {/* Linhas de grade horizontais */}
                  <div className="weekly-grid-lines" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', pointerEvents: 'none', zIndex: 0 }}>
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} style={{ height: 60, borderBottom: '1px solid var(--adm-rule)' }} />
                    ))}
                  </div>

                  {(() => {
                    const wDays = getWeekDays(currentDate);
                    const prof = activeProfessionalsList.find(p => p.id === selectedWeeklyMonthlyProf);

                    return wDays.map(d => {
                      const dStr = getLocalDateString(d);
                      let dayBookings = bookings.filter(b => 
                        b.date === dStr && 
                        (b.profissional || 'jon') === selectedWeeklyMonthlyProf && 
                        b.status !== 'cancelado'
                      );
                      const seenBookings = new Set();
                      dayBookings = dayBookings.filter(b => {
                        if (!b.id) return true;
                        if (seenBookings.has(b.id)) return false;
                        seenBookings.add(b.id);
                        return true;
                      });

                      const dayBlocks = getDayBlocks(prof, d);

                      const effectiveAbsences = getEffectiveAbsences(settings);
                      const dayAbsences = effectiveAbsences.filter(a => absenceCoversDate(a, dStr));

                      // Merge all items into a common layout list for overlap calculation
                      const layoutItems = [];

                      dayBookings.forEach(b => {
                        layoutItems.push({
                          id: b.id,
                          type: 'booking',
                          startMin: timeToMin(b.time),
                          endMin: timeToMin(b.time) + (b.duration || 60),
                          raw: b
                        });
                      });

                      dayBlocks.forEach((block, idx) => {
                        layoutItems.push({
                          id: `block-${idx}`,
                          type: 'scale_block',
                          startMin: timeToMin(block.start),
                          endMin: timeToMin(block.end),
                          label: block.label,
                          raw: block
                        });
                      });

                      dayAbsences.forEach((abs, idx) => {
                        const start = abs.allDay ? '10:00' : (abs.startTime || '10:00');
                        const end = abs.allDay ? '19:00' : (abs.endTime || '19:00');
                        layoutItems.push({
                          id: `absence-${abs.id || idx}`,
                          type: 'absence',
                          startMin: timeToMin(start),
                          endMin: timeToMin(end),
                          label: abs.title,
                          raw: abs
                        });
                      });

                      const positionedItems = calculateOverlappingLayout(layoutItems);

                      return (
                        <div 
                          key={dStr} 
                          className="weekly-day-column" 
                          style={{ position: 'relative', height: '100%', borderRight: '1px solid var(--adm-rule)', zIndex: 1 }}
                        >
                          {/* Criar agendamento ao clicar em espaço vazio */}
                          {['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map(slot => {
                            const slotMin = timeToMin(slot);
                            const hasAppt = dayBookings.some(b => {
                              const start = timeToMin(b.time);
                              return slotMin >= start && slotMin < start + (b.duration || 60);
                            });
                            const hasBlock = dayBlocks.some(b => {
                              const start = timeToMin(b.start);
                              const end = timeToMin(b.end);
                              return slotMin >= start && slotMin < end;
                            });
                            const hasAbsence = dayAbsences.some(a => {
                              const start = timeToMin(a.allDay ? '10:00' : (a.startTime || '10:00'));
                              const end = timeToMin(a.allDay ? '19:00' : (a.endTime || '19:00'));
                              return slotMin >= start && slotMin < end;
                            });

                            if (hasAppt || hasBlock || hasAbsence) return null;

                            return (
                              <div
                                key={slot}
                                style={{
                                  position: 'absolute',
                                  top: `${((slotMin - 600) / 540) * 100}%`,
                                  height: `${(60 / 540) * 100}%`,
                                  left: 0,
                                  right: 0,
                                  cursor: 'pointer',
                                  zIndex: 1
                                }}
                                onClick={() => handleCellClick(dStr, slot, selectedWeeklyMonthlyProf, prof?.name || 'Jon')}
                              />
                            );
                          })}

                          {/* Desenhar todos os itens posicionados */}
                          {positionedItems.map(item => {
                            const startMin = item.startMin;
                            const duration = Math.max(30, item.endMin - startMin);
                            const topPercent = Math.max(0, ((startMin - 600) / 540) * 100);
                            const heightPercent = Math.min(100 - topPercent, (duration / 540) * 100);

                            if (topPercent >= 100 || topPercent + heightPercent <= 0) return null;

                            const left = item.leftPercent;
                            const width = item.widthPercent;

                            if (item.type === 'booking') {
                              const b = item.raw;
                               
                              const startStr = b.time || '00:00';
                              const parts = startStr.split(':');
                              const h = parts[0] ? Number(parts[0]) : 0;
                              const m = parts[1] ? Number(parts[1]) : 0;
                              const endMinVal = h * 60 + m + (b.duration || 60);
                              const endH = Math.floor(endMinVal / 60);
                              const endM = endMinVal % 60;
                              const endStr = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
                              const apptTimeText = `${startStr} - ${endStr}`;

                              return (
                                  <div 
                                    key={item.id} 
                                    className={`appt-card ${b.status} ${getServiceCategoryInfo(b.service?.name || b.serviceName, services).class}`}
                                    onClick={(e) => handleBookingLeftClick(e, b)}
                                    style={{
                                      top: `${topPercent}%`,
                                      height: `${heightPercent}%`,
                                      position: 'absolute',
                                      left: `${left}%`,
                                      width: `${width}%`,
                                      padding: '8px 16px',
                                      zIndex: 3,
                                      display: 'flex',
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      overflow: 'hidden',
                                      borderRadius: '0px'
                                    }}
                                  >
                                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', gap: '2px' }}>
                                      <span 
                                        className="appt-client" 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedFichaClient({ name: b.clientName, phone: b.clientPhone });
                                        }}
                                        style={{ 
                                          fontWeight: 'bold', color: '#fff', fontSize: '0.92rem', cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                        }}
                                      >
                                        {b.clientName}
                                        {isClientRecurrent(b.clientName, b.clientPhone) && (
                                          <span style={{
                                            position: 'absolute',
                                            marginLeft: '4px',
                                            width: '5px',
                                            height: '5px',
                                            borderRadius: '50%',
                                            backgroundColor: 'var(--adm-gold, #dca354)',
                                            display: 'inline-block'
                                          }} title="Cliente Recorrente" />
                                        )}
                                      </span>
                                      <span className="appt-service-info" style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {b.service?.name || b.serviceName} · {(() => {
                                          const m = b.duration || 60;
                                          const h = Math.floor(m / 60);
                                          const r = m % 60;
                                          if (h > 0 && r > 0) return `${h}h${r}`;
                                          if (h > 0) return `${h}h`;
                                          return `${r}min`;
                                        })()}
                                      </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      {b.status === 'finalizado' && (
                                        <span style={{
                                          fontSize: '9px',
                                          fontWeight: 800,
                                          padding: '2px 6px',
                                          background: 'rgba(63, 185, 80, 0.15)',
                                          color: '#3FB950',
                                          border: '1px solid rgba(63, 185, 80, 0.3)',
                                          borderRadius: '2px',
                                          letterSpacing: '0.05em'
                                        }}>✓ FINALIZADO</span>
                                      )}
                                      <div className="appt-badge" style={{ textTransform: 'uppercase' }}>
                                        {getServiceCategoryInfo(b.service?.name || b.serviceName, services).badge}
                                      </div>
                                    </div>
                                  </div>
                              );
                            }

                            if (item.type === 'absence') {
                              const abs = item.raw;
                              return (
                                <div 
                                  key={item.id} 
                                  className="appt-card bloqueado"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (abs.fixed) {
                                      if (confirm("Esta é a ausência fixa 'Psicóloga'. Deseja desativá-la temporariamente nas configurações do sistema?")) {
                                        const updateFn = async () => {
                                          const newSettings = { ...settings, disablePsicologa: true };
                                          if (db && !isDemoMode) {
                                            await updateDoc(doc(db, 'settings', 'studio'), { disablePsicologa: true });
                                          } else {
                                            localStorage.setItem('demo_settings', JSON.stringify(newSettings));
                                            localStorage.setItem('demo_studio_settings', JSON.stringify(newSettings));
                                            window.dispatchEvent(new Event('settingsUpdated'));
                                          }
                                          toast("Bloqueio de Psicóloga desativado!", "success");
                                          window.location.reload();
                                        };
                                        updateFn();
                                      }
                                    } else {
                                      if (confirm(`Deseja excluir a ausência "${abs.title}"?`)) {
                                        handleRemoveAbsence(abs);
                                      }
                                    }
                                  }}
                                  style={(() => {
                                const title = (abs.title || '').toLowerCase();
                                 let bg = 'rgba(90, 158, 206, 0.12)';
                                 let border = '4px solid #5A9ECE';
                                 let color = '#5A9ECE';
                                
                                if (title.includes('médico') || title.includes('medico')) {
                                  bg = 'rgba(235, 94, 85, 0.12)';
                                  border = '4px solid #eb5e55';
                                  color = '#eb5e55';
                                } else if (title.includes('almoço') || title.includes('almoco')) {
                                  bg = 'rgba(231, 111, 81, 0.12)';
                                  border = '4px solid #E76F51';
                                  color = '#E76F51';
                                } else if (title.includes('folga')) {
                                  bg = 'rgba(114, 137, 218, 0.12)';
                                  border = '4px solid #7289da';
                                  color = '#7289da';
                                } else if (title.includes('viagem')) {
                                  bg = 'rgba(74, 163, 223, 0.12)';
                                  border = '4px solid #4aa3df';
                                  color = '#4aa3df';
                                } else if (title.includes('pausa')) {
                                  bg = 'rgba(26, 188, 156, 0.12)';
                                  border = '4px solid #1abc9c';
                                  color = '#1abc9c';
                                } else if (title.includes('ausência') || title.includes('ausencia') || title.includes('psicóloga') || title.includes('psicologa')) {
                                  bg = 'rgba(155, 89, 182, 0.12)';
                                  border = '4px solid #9b59b6';
                                  color = '#9b59b6';
                                }
                                
                                return {
                                  position: 'absolute',
                                  top: `${topPercent}%`,
                                  height: `${heightPercent}%`,
                                  left: `${left}%`,
                                  width: `${width}%`,
                                  background: bg, 
                                  borderLeft: border, 
                                  color: color, 
                                  cursor: 'pointer',
                                  padding: '6px 8px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  overflow: 'hidden',
                                  zIndex: 2
                                };
                              })()}
                                >
                                  <span className="appt-time" style={{ fontWeight: 'bold' }}>
                                    {abs.allDay ? 'Dia Inteiro' : `${abs.startTime} - ${abs.endTime}`}
                                  </span>
                                  <span className="appt-client" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Lock size={12} /> {abs.title}
                                  </span>
                                </div>
                              );
                            }

                            // scale_block
                            return (
                              <div 
                                key={item.id} 
                                className="appt-card bloqueado"
                                style={{
                                  top: `${topPercent}%`,
                                  height: `${heightPercent}%`,
                                  position: 'absolute',
                                  left: `${left}%`,
                                  width: `${width}%`,
                                  background: 'repeating-linear-gradient(45deg, #e2e8f0, #e2e8f0 10px, #cbd5e1 10px, #cbd5e1 20px)',
                                  color: '#475569',
                                  borderLeft: '4px solid #94a3b8',
                                  opacity: 0.85,
                                  padding: '6px 8px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  overflow: 'hidden',
                                  zIndex: 2,
                                  pointerEvents: 'none'
                                }}
                              >
                                <span className="appt-time" style={{ fontWeight: 'bold' }}>{item.raw.start} - {item.raw.end}</span>
                                <span className="appt-client" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <Lock size={12} /> {item.label}
                                </span>
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

          {/* VIEW: MENSAL (CALENDÁRIO COM LISTAGEM COMPACTA DESKTOP) */}
          {viewMode === 'mensal' && (
            <div className="calendar-grid monthly-view" style={{ padding: 16 }}>
              {/* Dias da semana */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 12, textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <div>domingo</div>
                <div>segunda-feira</div>
                <div>terça-feira</div>
                <div>quarta-feira</div>
                <div>quinta-feira</div>
                <div>sexta-feira</div>
                <div>sábado</div>
              </div>

              {/* Dias do mês */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
                {getDaysInMonthGrid(currentDate).map((cell, idx) => {
                  const cellDateStr = getLocalDateString(cell.dateObj);
                  const dayBookings = bookings.filter(b => 
                    b.date === cellDateStr && 
                    (b.profissional || 'jon') === selectedWeeklyMonthlyProf && 
                    b.status !== 'cancelado'
                  );
                  
                  const isToday = cellDateStr === getLocalDateString(new Date());
                  const isCurrentMonth = cell.isCurrentMonth;
                  
                  return (
                    <div 
                      key={`${cellDateStr}-${idx}`} 
                      onClick={() => {
                        setCurrentDate(cell.dateObj);
                        setViewMode('diario');
                      }}
                      style={{
                        minHeight: 100,
                        borderRadius: 12,
                        padding: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        justifyContent: 'flex-start',
                        background: !isCurrentMonth ? 'var(--adm-card)' : 'var(--adm-surface)',
                        border: '1px solid var(--adm-rule)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        opacity: !isCurrentMonth ? 0.6 : 1
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ 
                          fontSize: '0.95rem', 
                          fontWeight: isToday ? 'bold' : 'normal',
                          color: isToday ? 'var(--adm-gold)' : 'var(--adm-text)'
                        }}>
                          {cell.dayNum}
                        </span>
                        {isToday && (
                          <span style={{ fontSize: '0.65rem', background: 'var(--adm-gold)', color: 'white', padding: '2px 6px', borderRadius: 4, fontWeight: 'bold' }}>Hoje</span>
                        )}
                      </div>
                      
                      {/* List of bookings inside cell on Desktop */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflow: 'hidden', flex: 1 }}>
                        {dayBookings.slice(0, 3).map(b => {
                          let bg = 'rgba(176, 90, 46, 0.1)';
                          let border = '1px solid rgba(176, 90, 46, 0.2)';
                          let color = 'var(--adm-gold)';
                          
                          if (b.status === 'finalizado') {
                            bg = 'rgba(74, 93, 78, 0.1)';
                            border = '1px solid rgba(74, 93, 78, 0.2)';
                            color = 'var(--mobile-green, #4A5D4E)';
                          } else if (b.status === 'bloqueado') {
                            bg = '#f1f5f9';
                            border = '1px solid #cbd5e1';
                            color = '#475569';
                          }
                          
                          return (
                            <div
                              key={b.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBookingLeftClick(e, b);
                              }}
                              style={{
                                fontSize: '0.68rem',
                                padding: '2px 6px',
                                borderRadius: 4,
                                background: bg,
                                border: border,
                                color: color,
                                whiteSpace: 'nowrap',
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                fontWeight: 600
                              }}
                            >
                              {b.time} - {b.clientName} {b.isPackageUse && '📦'} {b.isPackageAcquisition && '🛒📦'}
                            </div>
                          );
                        })}
                        {dayBookings.length > 3 && (
                          <div style={{ fontSize: '0.68rem', color: 'var(--adm-muted)', textAlign: 'center', fontWeight: 'bold' }}>
                            + {dayBookings.length - 3} mais
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

        </main>
      </div>

      {/* CUSTOM LEFT-CLICK POPOVER / TOOLTIP */}
      {activePopover.visible && activePopover.booking && (
        <div 
          className="booking-popover" 
          style={{ top: activePopover.y, left: activePopover.x }}
          onClick={e => e.stopPropagation()}
        >
          <div className="booking-popover-header">
            <span className="booking-popover-client">
              {activePopover.booking.status === 'bloqueado' 
                ? (activePopover.booking.notes || 'HORÁRIO BLOQUEADO').toUpperCase() 
                : activePopover.booking.clientName.toUpperCase()}
            </span>
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
            {activePopover.booking.status !== 'bloqueado' && (
              <div className="booking-popover-row">
                <Phone size={12} className="text-muted" />
                {activePopover.booking.status === 'finalizado' ? (
                  <button 
                    onClick={() => {
                      handleSendFeedbackWhatsApp(activePopover.booking);
                    }}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#25D366', fontWeight: '600', fontFamily: 'inherit', fontSize: 'inherit' }}
                  >
                    <Send size={11} style={{ marginRight: 4 }} /> Pedir Avaliação
                  </button>
                ) : (
                  <a 
                    href={getWhatsAppConfirmationUrl(activePopover.booking.clientPhone, activePopover.booking)}
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Send size={11} style={{ marginRight: 4 }} /> WhatsApp
                  </a>
                )}
              </div>
            )}
            <div className="booking-popover-row">
              <User size={12} className="text-muted" />
              <span>Profissional: {activeProfessionalsList.find(p => p.id === (activePopover.booking.profissional || 'jon'))?.name || 'Jon'}</span>
            </div>
            <div className="booking-popover-row">
              <FileText size={12} className="text-muted" />
              {activePopover.booking.status === 'bloqueado' ? (
                <span>Motivo: {activePopover.booking.notes || 'Bloqueio administrativo'}</span>
              ) : (
                <span>Serviço: {activePopover.booking.serviceName || activePopover.booking.service?.name}</span>
              )}
            </div>
            <div className="booking-popover-row">
              <span className={`appt-status-dot ${activePopover.booking.status}`} />
              <span style={{ textTransform: 'capitalize' }}>Status: {activePopover.booking.status}</span>
            </div>
            
            {activePopover.booking.status !== 'bloqueado' && activePopover.booking.isPackageUse && (
              <div className="booking-popover-row" style={{ color: 'var(--adm-gold)', fontWeight: 'bold', gap: 6 }}>
                <Package size={12} />
                <span>Uso de Pacote</span>
              </div>
            )}
            
            {activePopover.booking.status !== 'bloqueado' && activePopover.booking.isPackageAcquisition && (
              <div className="booking-popover-row" style={{ color: 'var(--adm-gold)', fontWeight: 'bold', gap: 6 }}>
                <Package size={12} />
                <span>Aquisição de Pacote</span>
              </div>
            )}
            
            <div className="booking-popover-actions" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              {activePopover.booking.status === 'bloqueado' && (
                <button
                  className="btn btn-accent"
                  style={{ padding: '6px 8px', fontSize: '0.75rem', width: '100%' }}
                  onClick={() => {
                    setBlockIdToCancelOnSuccess(activePopover.booking.id);
                    setSelectedSlot({
                      date: activePopover.booking.date,
                      time: activePopover.booking.time,
                      profissional: activePopover.booking.profissional || 'jon',
                      dateFormatted: activePopover.booking.date
                    });
                    setNewBooking({
                      clientName: '',
                      clientPhone: '',
                      clientEmail: '',
                      serviceName: services[0]?.name || '',
                      servicePrice: services[0]?.promoPrice || services[0]?.price || 0,
                      duration: services[0]?.duration || 60,
                      date: activePopover.booking.date,
                      time: activePopover.booking.time,
                      notes: '',
                      profissional: activePopover.booking.profissional || 'jon'
                    });
                    setActivePopover({ visible: false, x: 0, y: 0, booking: null });
                    setShowAddModal(true);
                  }}
                >
                  Fazer Agendamento
                </button>
              )}
              <button
                className="btn"
                style={{
                  padding: '6px 8px',
                  fontSize: '0.75rem',
                  width: '100%',
                  background: 'transparent',
                  color: 'var(--adm-text)',
                  borderColor: 'var(--adm-rule)',
                  borderStyle: 'solid',
                  borderWidth: '1px'
                }}
                onClick={() => {
                  setSelectedBooking(activePopover.booking);
                  handleStartEditBooking(activePopover.booking);
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--adm-text)';
                  e.currentTarget.style.color = '#121110';
                  e.currentTarget.style.borderColor = 'var(--adm-text)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--adm-text)';
                  e.currentTarget.style.borderColor = 'var(--adm-rule)';
                }}
              >
                Editar
              </button>
              {activePopover.booking.status !== 'cancelado' && (
                <button
                  className="btn"
                  style={{
                    padding: '6px 8px',
                    fontSize: '0.75rem',
                    width: '100%',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    borderColor: '#ef4444',
                    borderStyle: 'solid',
                    borderWidth: '1px'
                  }}
                  onClick={() => {
                    const isFixedAbsence = activePopover.booking.id === 'fixed-psicologa' || activePopover.booking.fixed;
                    const msg = isFixedAbsence
                      ? "Esta é a ausência fixa 'Psicóloga'. Deseja desativá-la temporariamente nas configurações do sistema?"
                      : activePopover.booking.status === 'bloqueado'
                      ? 'Tem certeza que deseja desbloquear este horário?'
                      : 'Tem certeza que deseja cancelar este agendamento?';
                    if (confirm(msg)) {
                      if (isFixedAbsence) {
                        const updateFn = async () => {
                          const newSettings = { ...settings, disablePsicologa: true };
                          if (db && !isDemoMode) {
                            await updateDoc(doc(db, 'settings', 'studio'), { disablePsicologa: true });
                          } else {
                            localStorage.setItem('demo_studio_settings', JSON.stringify(newSettings));
                            window.dispatchEvent(new Event('settingsUpdated'));
                          }
                          toast("Bloqueio de Psicóloga desativado!", "success");
                          setActivePopover({ visible: false, x: 0, y: 0, booking: null });
                          window.location.reload();
                        };
                        updateFn();
                      } else {
                        handleUpdateStatus(activePopover.booking.id, 'cancelado');
                        setActivePopover({ visible: false, x: 0, y: 0, booking: null });
                      }
                    }
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#ef4444';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    e.currentTarget.style.color = '#ef4444';
                    e.currentTarget.style.borderColor = '#ef4444';
                  }}
                >
                  {activePopover.booking.status === 'bloqueado' ? 'Desbloquear' : 'Cancelar'}
                </button>
              )}
              {(activePopover.booking.status === 'confirmado' || activePopover.booking.status === 'confirmado pela cliente') && (
                <button
                  className="btn btn-accent"
                  style={{ padding: '6px 8px', fontSize: '0.75rem', width: '100%' }}
                  onClick={() => {
                    setComandaBooking(activePopover.booking);
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
              {contextMenu.booking.status === 'finalizado' && (
                <li className="context-menu-item" style={{ color: '#25D366', fontWeight: '600' }} onClick={() => {
                  handleSendFeedbackWhatsApp(contextMenu.booking);
                  setContextMenu({ visible: false });
                }}>
                  <Send size={14} /> Pedir Avaliação
                </li>
              )}
              <li className="context-menu-item" onClick={() => {
                setSelectedSlot({
                  date: contextMenu.booking.date,
                  time: contextMenu.booking.time,
                  profissional: contextMenu.booking.profissional || 'jon',
                  dateFormatted: contextMenu.booking.date
                });
                setNewBooking({
                  clientName: '',
                  clientPhone: '',
                  clientEmail: '',
                  serviceName: services[0]?.name || '',
                  servicePrice: services[0]?.promoPrice || services[0]?.price || 0,
                  duration: services[0]?.duration || 60,
                  date: contextMenu.booking.date,
                  time: contextMenu.booking.time,
                  notes: '',
                  profissional: contextMenu.booking.profissional || 'jon'
                });
                setContextMenu({ visible: false });
                setShowAddModal(true);
              }}>
                <Plus size={14} /> Novo Agendamento
              </li>
              <li className="context-menu-item" onClick={() => {
                setSelectedSlot({
                  date: contextMenu.booking.date,
                  time: contextMenu.booking.time,
                  profissional: contextMenu.booking.profissional || 'jon',
                  dateFormatted: contextMenu.booking.date
                });
                setContextMenu({ visible: false });
                setShowSlotActionModal(true);
              }}>
                <Lock size={14} /> Registrar Ausência
              </li>
              {contextMenu.booking.status === 'bloqueado' ? (
                <li className="context-menu-item" onClick={() => {
                  handleUpdateStatus(contextMenu.booking.id, 'cancelado');
                  setContextMenu({ visible: false });
                }}>
                  <Unlock size={14} /> Registrar Liberação de Horário
                </li>
              ) : (
                <li className="context-menu-item" onClick={() => {
                  handleUpdateStatus(contextMenu.booking.id, 'faltou');
                  setContextMenu({ visible: false });
                }}>
                  <X size={14} /> Marcar Falta
                </li>
              )}
              <li className="context-menu-item" style={{ zIndex: 1100 }}>
                <RefreshCw size={14} /> Alterar Status
                <span className="context-menu-arrow">▶</span>
                <ul className="context-menu-submenu">
                  <li className="context-menu-item" onClick={() => handleUpdateStatus(contextMenu.booking.id, 'pendente')}>Pendente</li>
                  <li className="context-menu-item" onClick={() => handleUpdateStatus(contextMenu.booking.id, 'confirmado')}>Confirmado</li>
                  <li className="context-menu-item" onClick={() => handleUpdateStatus(contextMenu.booking.id, 'confirmado pela cliente')}>Confirmado pela Cliente</li>
                  <li className="context-menu-item" onClick={() => handleUpdateStatus(contextMenu.booking.id, 'finalizado')}>Finalizado</li>
                  <li className="context-menu-item" onClick={() => handleUpdateStatus(contextMenu.booking.id, 'cancelado')}>Cancelado</li>
                  <li className="context-menu-item" onClick={() => handleUpdateStatus(contextMenu.booking.id, 'faltou')}>Cliente faltou</li>
                </ul>
              </li>
              {(contextMenu.booking.status === 'confirmado' || contextMenu.booking.status === 'confirmado pela cliente') && (
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
          ) : contextMenu.isBlockedSlot ? (
            <>
              <li className="context-menu-item" onClick={() => {
                const profName = activeProfessionalsList.find(p => p.id === contextMenu.professional)?.name || 'Jon';
                handleCellClick(contextMenu.date, contextMenu.time, contextMenu.professional, profName);
                setContextMenu({ visible: false });
              }}>
                <Plus size={14} /> Agendar Cliente
              </li>
              <li className="context-menu-item danger" onClick={handleRemoveBlockedSlot}>
                <Unlock size={14} /> Cancelar Bloqueio
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
                {selectedBooking.status === 'bloqueado' ? (
                  <><Lock size={20} /> EDITAR HORÁRIO BLOQUEADO</>
                ) : (
                  <><Edit size={20} /> EDITAR AGENDAMENTO</>
                )}
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
                        onBlur={handlePhoneBlurForEdit}
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

                  <div style={{ fontSize: '0.8rem', color: 'var(--adm-muted)', display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span>Ficha Completa: <strong>{(editBookingForm.cpf && editBookingForm.clientEmail) ? 'Sim' : 'Não'}</strong></span>
                    <span 
                      style={{ color: 'var(--adm-gold)', textDecoration: 'underline', cursor: 'pointer' }}
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
                  <span style={{ fontSize: '0.8rem', color: 'var(--adm-muted)', marginTop: 8 }}>Foto de Perfil</span>
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
                    value={editBookingForm.serviceName}
                    onChange={e => {
                      const name = e.target.value;
                      const matched = services.find(s => s.name === name);
                      setEditBookingForm(prev => ({ 
                        ...prev, 
                        serviceName: name, 
                        servicePrice: matched ? (matched.promoPrice || matched.price || 0) : 0,
                        duration: matched ? (matched.duration || 60) : 60
                      }));
                    }}
                  >
                    {services.map(s => (
                      <option key={s.id} value={s.name}>
                        {s.name}
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
                    <option value="confirmado pela cliente">Confirmado pela Cliente</option>
                    <option value="cancelado">Cancelado</option>
                    <option value="finalizado">Finalizado</option>
                    <option value="faltou">Cliente faltou</option>
                  </select>
                </div>

              </div>

              <div className="form-group">
                <label>Sinal / Adiantamento Pago (R$)</label>
                <input 
                  type="number"
                  min="0"
                  placeholder="0.00"
                  value={editBookingForm.prepayment || ''}
                  onChange={e => setEditBookingForm(prev => ({ ...prev, prepayment: Number(e.target.value) }))}
                />
                {Number(editBookingForm.prepayment || 0) > 0 && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--adm-gold)', display: 'block', marginTop: 4 }}>
                    Valor líquido a cobrar no estúdio: R$ {(Number(editBookingForm.servicePrice || 0) - Number(editBookingForm.prepayment || 0)).toFixed(2)}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Observações do Agendamento</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span 
                  className="trinks-footer-link"
                  onClick={handleSaveAndCheckout}
                >
                  Salvar e fechar conta
                </span>
                
                {editBookingForm.status === 'finalizado' && (
                  <button 
                    type="button"
                    onClick={() => handleSendFeedbackWhatsApp(editBookingForm)}
                    style={{
                      background: '#25D366', 
                      color: 'white', 
                      border: 'none', 
                      padding: '6px 12px', 
                      borderRadius: '8px', 
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    <Send size={12} /> Pedir Feedback
                  </button>
                )}
              </div>
              
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
                    <span style={{ fontWeight: 'bold', color: 'var(--adm-muted)' }}>Horário Bloqueado (Indisponível)</span>
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

                  {selectedBooking.status === 'finalizado' && (() => {
                    const tx = transactions.find(t => t.bookingId === selectedBooking.id);
                    return (
                      <div className="comanda-details" style={{ marginTop: 16, padding: 12, border: '1px solid var(--adm-rule)', borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: 'var(--adm-gold)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'space-between' }}>
                          <span>💳 Comanda / Financeiro</span>
                          {tx && (
                            <button
                              type="button"
                              className="btn btn-ghost"
                              style={{ padding: '2px 8px', fontSize: '0.75rem', borderColor: 'var(--adm-rule)' }}
                              onClick={() => {
                                if (isEditingComanda) {
                                  setIsEditingComanda(false);
                                } else {
                                  setEditComandaForm({
                                    value: tx.value || 0,
                                    paymentMethod: tx.paymentMethod || 'Pix',
                                    productSales: tx.productSales ? JSON.parse(JSON.stringify(tx.productSales)) : []
                                  });
                                  setIsEditingComanda(true);
                                }
                              }}
                            >
                              {isEditingComanda ? 'Cancelar' : 'Editar'}
                            </button>
                          )}
                        </h4>
                        {tx ? (
                          isEditingComanda ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <div className="form-group" style={{ marginBottom: 4 }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>Método de Pagamento:</label>
                                <select
                                  value={editComandaForm.paymentMethod}
                                  onChange={e => setEditComandaForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                                  style={{ padding: '6px', width: '100%', borderRadius: 4, background: 'var(--adm-card)', color: 'var(--adm-text)', border: '0.5px solid var(--adm-rule)', fontSize: '0.8rem' }}
                                >
                                  <option value="Pix">Pix</option>
                                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                                  <option value="Cartão de Débito">Cartão de Débito</option>
                                  <option value="Dinheiro">Dinheiro</option>
                                </select>
                              </div>
                              <div className="form-group" style={{ marginBottom: 4 }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>Valor Total (R$):</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editComandaForm.value}
                                  onChange={e => setEditComandaForm(prev => ({ ...prev, value: Number(e.target.value) }))}
                                  style={{ padding: '6px', width: '100%', borderRadius: 4, background: 'var(--adm-card)', color: 'var(--adm-text)', border: '0.5px solid var(--adm-rule)', fontSize: '0.8rem' }}
                                />
                              </div>
                              
                              <div style={{ marginTop: 8 }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--adm-text)', display: 'block', marginBottom: 4 }}>
                                  Editar Quantidades / Remover Produtos:
                                </span>
                                {editComandaForm.productSales && editComandaForm.productSales.length > 0 ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {editComandaForm.productSales.map((ps, idx) => (
                                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', padding: '4px 6px', background: 'rgba(255,255,255,0.03)', borderRadius: 4 }}>
                                        <span>{ps.name}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                          <input
                                            type="number"
                                            min={1}
                                            value={ps.quantity}
                                            onChange={e => {
                                              const newQty = parseInt(e.target.value) || 1;
                                              const updated = [...editComandaForm.productSales];
                                              updated[idx].quantity = newQty;
                                              setEditComandaForm(prev => ({ ...prev, productSales: updated }));
                                            }}
                                            style={{ width: 45, padding: '2px', textAlign: 'center', background: 'var(--adm-card)', color: 'var(--adm-text)', border: '0.5px solid var(--adm-rule)', borderRadius: 4 }}
                                          />
                                          <button
                                            type="button"
                                            className="btn-icon"
                                            onClick={() => {
                                              const updated = editComandaForm.productSales.filter((_, i) => i !== idx);
                                              setEditComandaForm(prev => ({ ...prev, productSales: updated }));
                                            }}
                                            style={{ padding: 2, background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span style={{ fontSize: '0.78rem', color: 'var(--adm-muted)', fontStyle: 'italic' }}>Nenhum produto vendido.</span>
                                )}
                              </div>
                              
                              <button
                                type="button"
                                className="btn btn-accent"
                                style={{ marginTop: 12, width: '100%', padding: '6px', fontSize: '0.8rem' }}
                                onClick={async () => {
                                  try {
                                    const originalSales = tx.productSales || [];
                                    const editedSales = editComandaForm.productSales;
                                    
                                    // Update products stock
                                    for (const orig of originalSales) {
                                      const prod = products.find(p => p.id === orig.productId);
                                      if (prod) {
                                        const editedMatch = editedSales.find(e => e.productId === orig.productId);
                                        const currentQty = editedMatch ? editedMatch.quantity : 0;
                                        const diff = orig.quantity - currentQty;
                                        
                                        if (diff !== 0) {
                                          const newStock = Math.max(0, prod.quantity + diff);
                                          if (isDemoMode || !db) {
                                            setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, quantity: newStock } : p));
                                            const demoProds = JSON.parse(localStorage.getItem('demo_products') || '[]')
                                              .map(p => p.id === prod.id ? { ...p, quantity: newStock } : p);
                                            localStorage.setItem('demo_products', JSON.stringify(demoProds));
                                          } else {
                                            await updateDoc(doc(db, 'products', prod.id), { quantity: newStock });
                                          }
                                        }
                                      }
                                    }
                                    
                                    for (const editItem of editedSales) {
                                      const origMatch = originalSales.find(o => o.productId === editItem.productId);
                                      if (!origMatch) {
                                        const prod = products.find(p => p.id === editItem.productId);
                                        if (prod) {
                                          const newStock = Math.max(0, prod.quantity - editItem.quantity);
                                          if (isDemoMode || !db) {
                                            setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, quantity: newStock } : p));
                                            const demoProds = JSON.parse(localStorage.getItem('demo_products') || '[]')
                                              .map(p => p.id === prod.id ? { ...p, quantity: newStock } : p);
                                            localStorage.setItem('demo_products', JSON.stringify(demoProds));
                                          } else {
                                            await updateDoc(doc(db, 'products', prod.id), { quantity: newStock });
                                          }
                                        }
                                      }
                                    }

                                    const updatedFields = {
                                      value: Number(editComandaForm.value),
                                      paymentMethod: editComandaForm.paymentMethod,
                                      productSales: editedSales
                                    };

                                    if (isDemoMode || !db) {
                                      const demoTxStr = localStorage.getItem('demo_financial') || '[]';
                                      const demoTx = JSON.parse(demoTxStr).map(t => t.id === tx.id ? { ...t, ...updatedFields } : t);
                                      localStorage.setItem('demo_financial', JSON.stringify(demoTx));
                                      localStorage.setItem('demo_transactions', JSON.stringify(demoTx));
                                      setTransactions(demoTx);
                                    } else {
                                      await updateDoc(doc(db, 'financial_transactions', tx.id), updatedFields);
                                    }

                                    // Update booking document
                                    const bookingUpdate = {
                                      paymentMethod: editComandaForm.paymentMethod,
                                      finalValue: Number(editComandaForm.value)
                                    };

                                    if (isDemoMode || !db) {
                                      setBookings(prev => prev.map(b => b.id === selectedBooking.id ? { ...b, ...bookingUpdate } : b));
                                      setSelectedBooking(prev => prev ? { ...prev, ...bookingUpdate } : null);
                                    } else {
                                      await updateDoc(doc(db, 'bookings', selectedBooking.id), bookingUpdate);
                                      setSelectedBooking(prev => prev ? { ...prev, ...bookingUpdate } : null);
                                    }

                                    setIsEditingComanda(false);
                                    toast('Comanda atualizada com sucesso!', 'success');
                                  } catch (err) {
                                    console.error(err);
                                    toast('Erro ao atualizar comanda.', 'error');
                                  }
                                }}
                              >
                                Salvar Alterações
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <div className="detail-row" style={{ margin: 0 }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>Método de Pagamento:</label>
                                <span style={{ fontSize: '0.85rem' }}>{tx.paymentMethod}</span>
                              </div>
                              <div className="detail-row" style={{ margin: 0 }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>Valor Total:</label>
                                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--adm-gold)' }}>R$ {tx.value?.toFixed(2).replace('.', ',')}</span>
                              </div>
                              
                              <div style={{ marginTop: 8 }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--adm-text)', display: 'block', marginBottom: 4 }}>
                                  Produtos Vendidos:
                                </span>
                                {tx.productSales && tx.productSales.length > 0 ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {tx.productSales.map((ps, idx) => (
                                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '4px 6px', background: 'rgba(255,255,255,0.03)', borderRadius: 4 }}>
                                        <span>{ps.name} (x{ps.quantity})</span>
                                        <span style={{ fontWeight: 600 }}>R$ {(ps.sellingPrice * ps.quantity).toFixed(2).replace('.', ',')}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span style={{ fontSize: '0.78rem', color: 'var(--adm-muted)', fontStyle: 'italic' }}>Nenhum produto vendido registrado.</span>
                                )}
                              </div>
                            </div>
                          )
                        ) : (
                          <div style={{ fontSize: '0.78rem', color: 'var(--adm-muted)', fontStyle: 'italic' }}>
                            Nenhum registro financeiro encontrado para este agendamento.
                          </div>
                        )}
                        
                        {/* Interface para Adicionar Produto */}
                        <div style={{ marginTop: 12, borderTop: '0.5px solid var(--adm-rule)', paddingTop: 10 }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 'bold', color: 'var(--adm-gold)', display: 'block', marginBottom: 6 }}>
                            🛒 Adicionar Produto Vendido
                          </span>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <select
                              id="add-prod-select"
                              style={{ flex: 1, padding: '6px', borderRadius: 4, background: 'var(--adm-card)', color: 'var(--adm-text)', border: '0.5px solid var(--adm-rule)', fontSize: '0.8rem' }}
                            >
                              <option value="">-- Selecione o Produto --</option>
                              {products.filter(p => p.quantity > 0).map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} (R$ {p.sellingPrice} - Qtd: {p.quantity})
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              id="add-prod-qty"
                              defaultValue={1}
                              min={1}
                              style={{ width: 50, padding: '6px', borderRadius: 4, background: 'var(--adm-card)', color: 'var(--adm-text)', border: '0.5px solid var(--adm-rule)', fontSize: '0.8rem', textAlign: 'center' }}
                            />
                            <button
                              type="button"
                              className="btn btn-accent"
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                              onClick={async () => {
                                const prodSelect = document.getElementById('add-prod-select');
                                const qtyInput = document.getElementById('add-prod-qty');
                                const productId = prodSelect.value;
                                const qty = parseInt(qtyInput.value) || 1;
                                if (!productId) {
                                  alert('Por favor, selecione um produto.');
                                  return;
                                }
                                
                                const product = products.find(p => p.id === productId);
                                if (!product) return;
                                
                                if (product.quantity < qty) {
                                  alert(`Quantidade indisponível em estoque. Estoque atual: ${product.quantity}`);
                                  return;
                                }
                                
                                try {
                                  if (tx) {
                                    const updatedSales = [...(tx.productSales || [])];
                                    const existingSaleIdx = updatedSales.findIndex(s => s.productId === productId);
                                    if (existingSaleIdx >= 0) {
                                      updatedSales[existingSaleIdx].quantity += qty;
                                    } else {
                                      updatedSales.push({
                                        productId: product.id,
                                        name: product.name,
                                        quantity: qty,
                                        sellingPrice: product.sellingPrice,
                                        costPrice: product.costPrice || 0
                                      });
                                    }
                                    
                                    const addedValue = product.sellingPrice * qty;
                                    const newValue = tx.value + addedValue;
                                    
                                    if (isDemoMode || !db) {
                                      const updatedTx = { ...tx, productSales: updatedSales, value: newValue };
                                      const demoTxStr = localStorage.getItem('demo_financial') || '[]';
                                      const demoTx = JSON.parse(demoTxStr).map(t => t.id === tx.id ? updatedTx : t);
                                      localStorage.setItem('demo_financial', JSON.stringify(demoTx));
                                      localStorage.setItem('demo_transactions', JSON.stringify(demoTx));
                                      setTransactions(demoTx);
                                      
                                      const demoProdsStr = localStorage.getItem('demo_products') || '[]';
                                      const demoProds = JSON.parse(demoProdsStr).map(p => p.id === productId ? { ...p, quantity: Math.max(0, p.quantity - qty) } : p);
                                      localStorage.setItem('demo_products', JSON.stringify(demoProds));
                                      setProducts(demoProds);
                                    } else {
                                      await updateDoc(doc(db, 'financial_transactions', tx.id), {
                                        productSales: updatedSales,
                                        value: newValue
                                      });
                                      await updateDoc(doc(db, 'products', productId), {
                                        quantity: Math.max(0, product.quantity - qty)
                                      });
                                    }
                                  } else {
                                    const transactionPayload = {
                                      bookingId: selectedBooking.id,
                                      clientName: selectedBooking.clientName,
                                      clientPhone: selectedBooking.clientPhone || '',
                                      type: 'entrada',
                                      paymentMethod: 'Pix',
                                      value: (selectedBooking.servicePrice || selectedBooking.service?.price || 130) + (product.sellingPrice * qty),
                                      discount: 0,
                                      description: `${selectedBooking.serviceName || selectedBooking.service?.name || 'Serviço'} + ${product.name}`,
                                      professionalId: selectedBooking.professionalId || selectedBooking.profissional || 'jon',
                                      productSales: [{
                                        productId: product.id,
                                        name: product.name,
                                        quantity: qty,
                                        sellingPrice: product.sellingPrice,
                                        costPrice: product.costPrice || 0
                                      }],
                                      createdAt: new Date().toISOString(),
                                      date: selectedBooking.date,
                                      time: selectedBooking.time
                                    };
                                    
                                    if (isDemoMode || !db) {
                                      const newTx = { id: 'tx_' + Date.now(), ...transactionPayload };
                                      const demoTxStr = localStorage.getItem('demo_financial') || '[]';
                                      const demoTx = [newTx, ...JSON.parse(demoTxStr)];
                                      localStorage.setItem('demo_financial', JSON.stringify(demoTx));
                                      localStorage.setItem('demo_transactions', JSON.stringify(demoTx));
                                      setTransactions(demoTx);
                                      
                                      const demoProdsStr = localStorage.getItem('demo_products') || '[]';
                                      const demoProds = JSON.parse(demoProdsStr).map(p => p.id === productId ? { ...p, quantity: Math.max(0, p.quantity - qty) } : p);
                                      localStorage.setItem('demo_products', JSON.stringify(demoProds));
                                      setProducts(demoProds);
                                    } else {
                                      await addDoc(collection(db, 'financial_transactions'), transactionPayload);
                                      await updateDoc(doc(db, 'products', productId), {
                                        quantity: Math.max(0, product.quantity - qty)
                                      });
                                    }
                                  }
                                  alert('Produto adicionado com sucesso e estoque atualizado!');
                                  setSelectedBooking(null);
                                } catch (e) {
                                  console.error(e);
                                  alert('Erro ao atualizar comanda: ' + e.message);
                                }
                              }}
                            >
                              Adicionar
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="modal-actions" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {selectedBooking.status === 'pendente' && (
                        <button className="btn btn-accent" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => handleUpdateStatus(selectedBooking.id, 'confirmado')}>
                          Confirmar Horário
                        </button>
                      )}
                      {(selectedBooking.status === 'confirmado' || selectedBooking.status === 'confirmado pela cliente') && (
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
              <div className="checkout-section" style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p style={{ fontSize: '0.78rem', margin: '0 0 4px 0', color: 'var(--adm-muted)' }}>
                  Gere o faturamento da cliente <strong>{selectedBooking.clientName}</strong>.
                </p>
                
                <div className="comanda-items-list" style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(255,255,255,0.015)', padding: '6px', borderRadius: '4px', border: '1px solid var(--adm-rule)' }}>
                  
                  {/* Trocar/Substituir o Serviço Agendado */}
                  <div className="comanda-item-row" style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px solid var(--adm-rule)', paddingBottom: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: 'var(--adm-text)' }}>Serviço Agendado</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>R$</span>
                        <input 
                          type="number"
                          style={{ width: '70px', padding: '2px 4px', fontSize: '0.8rem', border: '1px solid var(--adm-rule)', borderRadius: '3px', textAlign: 'right', background: 'var(--adm-card)', color: 'var(--adm-text)' }}
                          value={overrideBasePrice !== null ? overrideBasePrice : (selectedBooking.service?.promoPrice || selectedBooking.service?.price || selectedBooking.servicePrice || 150)}
                          onChange={e => setOverrideBasePrice(Number(e.target.value))}
                        />
                      </div>
                    </div>
                    <select
                      value={selectedBooking.service?.name || selectedBooking.serviceName}
                      onChange={e => {
                        const newName = e.target.value;
                        const match = services.find(s => s.name === newName);
                        if (match) {
                          // Update selected booking's service info locally
                          setSelectedBooking(prev => ({
                            ...prev,
                            serviceName: newName,
                            servicePrice: match.promoPrice || match.price,
                            service: match
                          }));
                          setOverrideBasePrice(match.promoPrice || match.price);
                        }
                      }}
                      style={{ width: '100%', padding: '3px 6px', fontSize: '0.78rem', border: '1px solid var(--adm-rule)', borderRadius: '3px', background: 'var(--adm-card)', color: 'var(--adm-text)' }}
                    >
                      {services.map(s => (
                        <option key={s.id} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {addedServices.map((s, idx) => (
                    <div key={'s-' + idx} className="comanda-item-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                      <span style={{ color: 'var(--adm-gold)' }}>➕ {s.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>R$</span>
                        <input 
                          type="number"
                          style={{ width: '70px', padding: '2px 4px', fontSize: '0.8rem', border: '1px solid var(--adm-rule)', borderRadius: '3px', textAlign: 'right', background: 'var(--adm-card)', color: 'var(--adm-text)' }}
                          value={s.price}
                          onChange={e => {
                            const newPrice = Number(e.target.value);
                            setAddedServices(prev => prev.map((item, i) => i === idx ? { ...item, price: newPrice } : item));
                          }}
                        />
                        <button type="button" className="btn-remove" onClick={() => removeService(idx)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', padding: '2px' }}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {addedProducts.map((p, idx) => (
                    <div key={'p-' + idx} className="comanda-item-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                      <span style={{ color: '#4a5568' }}>📦 {p.quantity}x {p.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--adm-muted)' }}>R$</span>
                        <input 
                          type="number"
                          style={{ width: '60px', padding: '2px 4px', fontSize: '0.8rem', border: '1px solid var(--adm-rule)', borderRadius: '3px', textAlign: 'right', background: 'var(--adm-card)', color: 'var(--adm-text)' }}
                          value={p.price}
                          onChange={e => {
                            const newPrice = Number(e.target.value);
                            setAddedProducts(prev => prev.map((item, i) => i === idx ? { ...item, price: newPrice } : item));
                          }}
                        />
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, minWidth: '45px', textAlign: 'right' }}>R$ {p.price * p.quantity}</span>
                        <button type="button" className="btn-remove" onClick={() => removeProduct(idx)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', padding: '2px' }}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* PRODUTOS USADOS DEDUZIDOS */}
                  {usedProducts.map((p, idx) => (
                    <div key={'up-' + idx} className="comanda-item-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#48bb78' }}>
                      <span>🧪 Insumo Usado: {p.quantity}x {p.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--adm-muted)' }}>Custo: R$</span>
                        <input 
                          type="number"
                          style={{ width: '60px', padding: '2px 4px', fontSize: '0.8rem', border: '1px solid var(--adm-rule)', borderRadius: '3px', textAlign: 'right', background: 'var(--adm-card)', color: 'var(--adm-text)' }}
                          value={p.price}
                          onChange={e => {
                            const newPrice = Number(e.target.value);
                            setUsedProducts(prev => prev.map((item, i) => i === idx ? { ...item, price: newPrice } : item));
                          }}
                        />
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, minWidth: '45px', textAlign: 'right' }}>- R$ {p.price * p.quantity}</span>
                        <button type="button" className="btn-remove" onClick={() => removeUsedProduct(idx)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', padding: '2px' }}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* PRODUTOS NÃO CADASTRADOS DEDUZIDOS */}
                  {nonRegisteredProducts.map((p, idx) => (
                    <div key={'nrp-' + idx} className="comanda-item-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#38b2ac' }}>
                      <span>🏷️ Produto Não Cadastrado: {p.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--adm-muted)' }}>Valor: R$</span>
                        <input 
                          type="number"
                          style={{ width: '60px', padding: '2px 4px', fontSize: '0.8rem', border: '1px solid var(--adm-rule)', borderRadius: '3px', textAlign: 'right', background: 'var(--adm-card)', color: 'var(--adm-text)' }}
                          value={p.value}
                          onChange={e => {
                            const newValue = Number(e.target.value);
                            setNonRegisteredProducts(prev => prev.map((item, i) => i === idx ? { ...item, value: newValue } : item));
                          }}
                        />
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, minWidth: '45px', textAlign: 'right' }}>- R$ {p.value}</span>
                        <button type="button" className="btn-remove" onClick={() => removeNonRegisteredProduct(idx)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', padding: '2px' }}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="comanda-item-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--adm-rule)', paddingTop: 4, marginTop: 4 }}>
                    <span style={{ fontSize: '0.78rem' }}>Desconto</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>R$</span>
                      <input 
                        type="number"
                        min="0"
                        style={{ width: '70px', padding: '2px 4px', fontSize: '0.8rem', border: '1px solid var(--adm-rule)', borderRadius: '3px', textAlign: 'right', background: 'var(--adm-card)', color: 'var(--adm-text)' }}
                        value={discount}
                        onChange={e => setDiscount(Math.max(0, Number(e.target.value)))}
                      />
                    </div>
                  </div>

                  <div className="comanda-item-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
                    <span style={{ fontSize: '0.78rem' }}>Valor Extra Cobrado</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>R$</span>
                      <input 
                        type="number"
                        min="0"
                        style={{ width: '70px', padding: '2px 4px', fontSize: '0.8rem', border: '1px solid var(--adm-rule)', borderRadius: '3px', textAlign: 'right', background: 'var(--adm-card)', color: 'var(--adm-text)' }}
                        value={extraCharged}
                        onChange={e => setExtraCharged(Math.max(0, Number(e.target.value)))}
                      />
                    </div>
                  </div>

                  <div className="comanda-item-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
                    <span style={{ fontSize: '0.78rem' }}>Custo Extra Interno (Insumos)</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>R$</span>
                      <input 
                        type="number"
                        min="0"
                        style={{ width: '70px', padding: '2px 4px', fontSize: '0.8rem', border: '1px solid var(--adm-rule)', borderRadius: '3px', textAlign: 'right', background: 'var(--adm-card)', color: 'var(--adm-text)' }}
                        value={extraCost}
                        onChange={e => setExtraCost(Math.max(0, Number(e.target.value)))}
                      />
                    </div>
                  </div>
 
                  {selectedBooking.prepayment > 0 && (
                    <div className="comanda-item-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#c53030', fontWeight: 600, fontSize: '0.78rem' }}>
                      <span>Sinal Pago</span>
                      <span>- R$ {Number(selectedBooking.prepayment).toFixed(2)}</span>
                    </div>
                  )}
 
                  <div className="comanda-total-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--adm-rule)', paddingTop: 6, marginTop: 4, fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--adm-text)' }}>
                    <span>Total a Receber</span>
                    <span style={{ color: 'var(--adm-gold)' }}>R$ {calculateTotal()}</span>
                  </div>
                </div>
 
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 2 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.72rem', display: 'block', marginBottom: '2px' }}>Lançar Serviço Extra</label>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <select 
                        value={selectedExtraService} 
                        onChange={e => setSelectedExtraService(e.target.value)}
                        style={{ padding: '3px 6px', fontSize: '0.75rem', flexGrow: 1, border: '1px solid var(--adm-rule)', borderRadius: '3px', background: 'var(--adm-card)', color: 'var(--adm-text)' }}
                      >
                        <option value="">Selecione</option>
                        {services.map(s => (
                          <option key={s.id} value={`${s.name}|${s.promoPrice || s.price}`}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                      <button type="button" className="btn btn-ghost" style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={addExtraService}>+</button>
                    </div>
                  </div>
 
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.72rem', display: 'block', marginBottom: '2px' }}>Vender Produto</label>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <select 
                        value={selectedExtraProduct} 
                        onChange={e => setSelectedExtraProduct(e.target.value)}
                        style={{ padding: '3px 6px', fontSize: '0.75rem', flexGrow: 1, border: '1px solid var(--adm-rule)', borderRadius: '3px', background: 'var(--adm-card)', color: 'var(--adm-text)' }}
                      >
                        <option value="">Selecione</option>
                        {products.map(p => (
                          <option key={p.id} value={`${p.id}|${p.name}|${p.sellingPrice}`} disabled={p.quantity <= 0}>
                            {p.name} (R$ {p.sellingPrice})
                          </option>
                        ))}
                      </select>
                      <button type="button" className="btn btn-ghost" style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={addExtraProduct}>+</button>
                    </div>
                  </div>
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 2 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.72rem', display: 'block', marginBottom: '2px' }}>🧪 Insumo Usado (Estoque)</label>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <select 
                        value={selectedUsedProduct} 
                        onChange={e => setSelectedUsedProduct(e.target.value)}
                        style={{ padding: '3px 6px', fontSize: '0.75rem', flexGrow: 1, border: '1px solid var(--adm-rule)', borderRadius: '3px', background: 'var(--adm-card)', color: 'var(--adm-text)' }}
                      >
                        <option value="">Selecione</option>
                        {products.map(p => (
                          <option key={p.id} value={`${p.id}|${p.name}|${p.costPrice || p.sellingPrice}`} disabled={p.quantity <= 0}>
                            {p.name} (Custo: R$ {p.costPrice || p.sellingPrice})
                          </option>
                        ))}
                      </select>
                      <button 
                        type="button" 
                        className="btn btn-ghost" 
                        style={{ padding: '2px 8px', fontSize: '0.75rem' }} 
                        onClick={() => {
                          if (!selectedUsedProduct) return;
                          const [pid, name, price] = selectedUsedProduct.split('|');
                          addUsedProduct(pid, name, price);
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.72rem', display: 'block', marginBottom: '2px' }}>🏷️ Usar Não Cadastrado</label>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <input 
                        type="text"
                        placeholder="Nome"
                        value={newNonRegName}
                        onChange={e => setNewNonRegName(e.target.value)}
                        style={{ width: '50%', padding: '3px 6px', fontSize: '0.75rem', border: '1px solid var(--adm-rule)', borderRadius: '3px', background: 'var(--adm-card)', color: 'var(--adm-text)' }}
                      />
                      <input 
                        type="number"
                        placeholder="Valor"
                        value={newNonRegVal || ''}
                        onChange={e => setNewNonRegVal(Number(e.target.value))}
                        style={{ width: '35%', padding: '3px 6px', fontSize: '0.75rem', border: '1px solid var(--adm-rule)', borderRadius: '3px', background: 'var(--adm-card)', color: 'var(--adm-text)', textAlign: 'right' }}
                      />
                      <button 
                        type="button" 
                        className="btn btn-ghost" 
                        style={{ padding: '2px 8px', fontSize: '0.75rem' }} 
                        onClick={() => addNonRegisteredProduct(newNonRegName, newNonRegVal)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
 
                {/* Pacotes options */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.01)', padding: '4px 6px', borderRadius: '4px', border: '1px solid var(--adm-rule)' }}>
                  {availablePackagesForBooking.length > 0 && (
                    <div className="form-group" style={{ margin: 0, flex: 1 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: '0.75rem' }}>
                        <input 
                          type="checkbox"
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
                        Pagar com Pacote?
                      </label>
                      {usingClientPackageId && (
                        <select
                          value={usingClientPackageId}
                          onChange={e => setUsingClientPackageId(e.target.value)}
                          style={{ padding: '2px 4px', width: '100%', marginTop: '2px', fontSize: '0.72rem', border: '1px solid var(--adm-rule)', borderRadius: '3px', background: 'var(--adm-card)', color: 'var(--adm-text)' }}
                        >
                          {availablePackagesForBooking.map(cp => {
                            const bookingServiceName = selectedBooking?.service?.name || selectedBooking?.serviceName;
                            const servObj = globalData.services.find(s => s.name === bookingServiceName);
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
                    <div className="form-group" style={{ margin: 0, flex: 1 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: '0.75rem' }}>
                        <input 
                          type="checkbox"
                          checked={!!sellingPackageId}
                          onChange={e => {
                            if (e.target.checked) {
                              setSellingPackageId(packages[0].id);
                            } else {
                              setSellingPackageId('');
                            }
                          }}
                        />
                        Vender Pacote?
                      </label>
                      {sellingPackageId && (
                        <select
                          value={sellingPackageId}
                          onChange={e => setSellingPackageId(e.target.value)}
                          style={{ padding: '2px 4px', width: '100%', marginTop: '2px', fontSize: '0.72rem', border: '1px solid var(--adm-rule)', borderRadius: '3px', background: 'var(--adm-card)', color: 'var(--adm-text)' }}
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
 
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, alignItems: 'center' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.72rem', display: 'block', marginBottom: '2px' }}>Forma de Pagamento *</label>
                    {usingClientPackageId ? (
                      <div style={{ padding: '3px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', border: '1px solid var(--adm-rule)', fontSize: '0.78rem', color: 'var(--adm-gold)', fontWeight: 600 }}>
                        Débito do Pacote
                      </div>
                    ) : (
                      <select 
                        value={paymentMethod} 
                        onChange={e => {
                          const val = e.target.value;
                          setPaymentMethod(val);
                          if (val === 'Cartão de Crédito' || val === 'Cartão de Débito') {
                            setApplyAnticipation(true);
                          } else {
                            setApplyAnticipation(false);
                          }
                        }}
                        style={{ padding: '3px 6px', width: '100%', fontSize: '0.75rem', border: '1px solid var(--adm-rule)', borderRadius: '3px', background: 'var(--adm-card)', color: 'var(--adm-text)' }}
                      >
                        <option value="Pix">Pix</option>
                        <option value="Cartão de Crédito">Cartão de Crédito</option>
                        <option value="Cartão de Débito">Cartão de Débito</option>
                        <option value="Dinheiro">Dinheiro</option>
                      </select>
                    )}
                  </div>
 
                  {paymentMethod === 'Cartão de Crédito' && (
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.72rem', display: 'block', marginBottom: '2px' }}>Parcelas *</label>
                      <select 
                        value={installments} 
                        onChange={e => setInstallments(e.target.value)}
                        style={{ padding: '3px 6px', width: '100%', fontSize: '0.75rem', border: '1px solid var(--adm-rule)', borderRadius: '3px', background: 'var(--adm-card)', color: 'var(--adm-text)' }}
                      >
                        <option value="À vista">À vista</option>
                        <option value="2x">2x</option>
                        <option value="3x">3x</option>
                      </select>
                    </div>
                  )}
 
                  {(paymentMethod === 'Cartão de Crédito' || paymentMethod === 'Cartão de Débito') && (
                    <div className="form-group" style={{ marginBottom: 0, gridColumn: 'span 2' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: '0.75rem' }}>
                        <input 
                          type="checkbox" 
                          checked={applyAnticipation}
                          onChange={e => setApplyAnticipation(e.target.checked)}
                        />
                        Antecipar recebimento? (taxa maquininha)
                      </label>
                    </div>
                  )}
                </div>
 
                <div className="modal-actions" style={{ justifyContent: 'space-between', borderTop: '1px solid var(--adm-rule)', paddingTop: '8px', marginTop: '2px', display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '0.78rem' }} onClick={() => { setIsCheckoutOpen(false); setOverrideBasePrice(null); }}>Voltar</button>
                  <button type="button" className="btn btn-accent" style={{ padding: '4px 12px', fontSize: '0.78rem' }} onClick={() => handleCloseComanda(selectedBooking)}>Finalizar Comanda</button>
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
              {(() => {
                const match = clients.find(c => 
                  (newBooking.clientPhone && c.phone.replace(/\D/g, '') === newBooking.clientPhone.replace(/\D/g, '')) || 
                  (newBooking.clientName && c.name.toLowerCase().trim() === newBooking.clientName.toLowerCase().trim())
                );
                if (match) {
                  return (
                    <div style={{ background: 'rgba(56,161,105,0.08)', border: '1px solid rgba(56,161,105,0.2)', padding: '8px 12px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                      <span style={{ color: '#48bb78', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        ✓ Cliente já cadastrada! Ficha técnica vinculada. (Curvatura: {match.curvatura})
                      </span>
                    </div>
                  );
                }
                return null;
              })()}
              {/* BOTÃO CADASTRAR NOVO CLIENTE */}
              <div style={{ marginTop: 8, textAlign: 'right' }}>
                <button type="button" onClick={() => setShowAddClientModal(true)} style={{ background: 'none', border: 'none', color: 'var(--adm-gold)', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto', cursor: 'pointer' }}>
                  <Plus size={14} /> Cadastrar novo cliente (Ficha Completa)
                </button>
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
                  onBlur={handlePhoneBlurForAdd}
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
                  value={newBooking.serviceName}
                  onChange={e => {
                    const name = e.target.value;
                    const matched = services.find(s => s.name === name);
                    setNewBooking(prev => ({ 
                      ...prev, 
                      serviceName: name, 
                      servicePrice: matched ? (matched.promoPrice || matched.price || 0) : 0,
                      duration: matched ? (matched.duration || 60) : 60
                    }));
                  }}
                >
                  <option value="">Selecione um serviço</option>
                  {services.map(s => (
                    <option key={s.id} value={s.name}>
                      {s.name}
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
                <label>Sinal / Adiantamento Pago (R$)</label>
                <input 
                  type="number"
                  min="0"
                  placeholder="0.00"
                  value={newBooking.prepayment || ''}
                  onChange={e => setNewBooking(prev => ({ ...prev, prepayment: Number(e.target.value) }))}
                />
                {Number(newBooking.prepayment || 0) > 0 && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--adm-gold)', display: 'block', marginTop: 4 }}>
                    Valor líquido a cobrar no estúdio: R$ {(Number(newBooking.servicePrice || 0) - Number(newBooking.prepayment || 0)).toFixed(2)}
                  </span>
                )}
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

            <div className="modal-actions" style={{ justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', flexShrink: 0, marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--adm-rule)' }}>
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

      {/* MODAL 2.5: CADASTRAR CLIENTE INLINE */}
      {showAddClientModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <form
            className="modal-content"
            onSubmit={handleCreateClientInline}
            style={{ maxHeight: '95vh', maxWidth: '600px', width: '95%', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '24px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexShrink: 0 }}>
              <h3 style={{ margin: 0, borderBottom: 'none', paddingBottom: 0 }}>Cadastrar Novo Cliente</h3>
              <button type="button" className="btn-icon" onClick={() => setShowAddClientModal(false)}><X size={18} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 16, rowGap: 12, overflowY: 'auto', flex: 1, paddingRight: 4, paddingBottom: 8 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Nome Completo *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ex: Ana Souza"
                  value={newClientForm.name}
                  onChange={e => setNewClientForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>WhatsApp *</label>
                <input 
                  type="tel" 
                  required 
                  placeholder="Ex: 31999998888"
                  value={newClientForm.phone}
                  onChange={e => setNewClientForm(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>E-mail (Opcional)</label>
                <input 
                  type="email" 
                  placeholder="Ex: ana@email.com"
                  value={newClientForm.email}
                  onChange={e => setNewClientForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Sexo</label>
                <select 
                  value={newClientForm.sexo}
                  onChange={e => setNewClientForm(prev => ({ ...prev, sexo: e.target.value }))}
                >
                  <option value="Feminino">Feminino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Data de Nascimento</label>
                <input 
                  type="date"
                  value={newClientForm.birthdate}
                  onChange={e => setNewClientForm(prev => ({ ...prev, birthdate: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Curvatura</label>
                <select 
                  value={newClientForm.curvatura}
                  onChange={e => setNewClientForm(prev => ({ ...prev, curvatura: e.target.value }))}
                >
                  <option value="2A">2A</option>
                  <option value="2B">2B</option>
                  <option value="2C">2C</option>
                  <option value="3A">3A</option>
                  <option value="3B">3B</option>
                  <option value="3C">3C</option>
                  <option value="4A">4A</option>
                  <option value="4B">4B</option>
                  <option value="4C">4C</option>
                  <option value="Liso">Liso</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Porosidade</label>
                <select 
                  value={newClientForm.porosidade}
                  onChange={e => setNewClientForm(prev => ({ ...prev, porosidade: e.target.value }))}
                >
                  <option value="Baixa">Baixa</option>
                  <option value="Média">Média</option>
                  <option value="Alta">Alta</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Elasticidade</label>
                <select 
                  value={newClientForm.elasticidade}
                  onChange={e => setNewClientForm(prev => ({ ...prev, elasticidade: e.target.value }))}
                >
                  <option value="Normal">Normal</option>
                  <option value="Fraca">Fraca</option>
                  <option value="Alta">Alta</option>
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
                <label>Histórico de Químicas</label>
                <input 
                  type="text" 
                  placeholder="Ex: Nenhuma, ou Luzes há 6 meses"
                  value={newClientForm.quimicas}
                  onChange={e => setNewClientForm(prev => ({ ...prev, quimicas: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
                <label>Produtos Recomendados</label>
                <textarea 
                  rows="2"
                  placeholder="Ex: Ativador de Cachos, Creme Leve..."
                  value={newClientForm.produtosRecomendados}
                  onChange={e => setNewClientForm(prev => ({ ...prev, produtosRecomendados: e.target.value }))}
                ></textarea>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
                <label>Observações Gerais</label>
                <textarea 
                  rows="2"
                  placeholder="Observações ou particularidades do fio/couro..."
                  value={newClientForm.observacoes}
                  onChange={e => setNewClientForm(prev => ({ ...prev, observacoes: e.target.value }))}
                ></textarea>
              </div>
            </div>

            <div className="modal-actions" style={{ justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', flexShrink: 0, marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--adm-rule)' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowAddClientModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-accent">Salvar e Selecionar</button>
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
                onClick={() => { setShowSlotActionModal(false); setBlockMotive('Almoço'); setSelectedSlot(null); }}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--adm-muted)', fontWeight: 600 }}>Até às:</span>
                    <select
                      value={blockEndTime}
                      onChange={e => setBlockEndTime(e.target.value)}
                      className="slot-block-input"
                      style={{ flex: 'none', width: '90px', padding: '6px', cursor: 'pointer' }}
                    >
                      {getBlockEndTimeOptions().map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--adm-muted)', fontWeight: 600 }}>Motivo:</span>
                    <select
                      value={blockMotive}
                      onChange={e => setBlockMotive(e.target.value)}
                      className="slot-block-input"
                      style={{ padding: '6px', cursor: 'pointer', width: '100%', background: 'var(--adm-card)', color: 'var(--adm-text)', border: '1px solid var(--adm-rule)', borderRadius: '4px' }}
                    >
                      <option value="Almoço">Almoço</option>
                      <option value="Médico">Médico</option>
                      <option value="Folga">Folga</option>
                      <option value="Descanso">Descanso</option>
                      <option value="Outro">Outro / Bloqueio Geral</option>
                    </select>
                  </div>
                  <button type="submit" className="slot-block-btn">
                    <Lock size={13} /> Confirmar Bloqueio
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}

      {comandaBooking && (
        <ComandaModal
          booking={comandaBooking}
          products={products}
          salonProducts={globalData.salon_products || []}
          services={services}
          settings={settings}
          onClose={() => setComandaBooking(null)}
          onConfirm={(payload) => handleFinalizeFromComanda(comandaBooking, payload)}
        />
      )}

      {showScaleBlockModal && selectedScaleBlock && (
        <div className="modal-overlay slot-action-overlay" onClick={() => { setShowScaleBlockModal(false); setSelectedScaleBlock(null); }}>
          <div className="slot-action-modal" onClick={e => e.stopPropagation()}>
            <div className="slot-action-header">
              <div className="slot-action-pill" style={{ background: 'rgba(235, 94, 85, 0.1)', color: 'var(--adm-red)' }}>
                <span className="slot-action-pill-dot" style={{ background: 'var(--adm-red)' }} />
                Horário Bloqueado (Escala)
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => { setShowScaleBlockModal(false); setSelectedScaleBlock(null); }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="slot-action-datetime">
              <span className="slot-action-date">{selectedScaleBlock.date.split('-').reverse().join('/')}</span>
              <span className="slot-action-time">{selectedScaleBlock.slot}</span>
            </div>

            <p className="slot-action-label" style={{ marginBottom: '16px', fontSize: '0.9rem', color: 'var(--adm-muted)' }}>
              Este horário está bloqueado pelas configurações de escala do profissional <strong>{selectedScaleBlock.profName}</strong>.
            </p>

            <div className="slot-action-cards" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                type="button"
                className="slot-card slot-card-schedule"
                onClick={() => {
                  handleCellClick(selectedScaleBlock.date, selectedScaleBlock.slot, selectedScaleBlock.profId, selectedScaleBlock.profName);
                  setShowScaleBlockModal(false);
                  setSelectedScaleBlock(null);
                }}
                style={{ width: '100%', display: 'flex', gap: '12px', padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--adm-rule)', borderRadius: '8px', cursor: 'pointer', textAlign: 'left' }}
              >
                <div className="slot-card-icon" style={{ background: 'rgba(200, 133, 42, 0.15)', color: 'var(--adm-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '6px', flexShrink: 0 }}>
                  <Plus size={20} />
                </div>
                <div className="slot-card-text">
                  <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--adm-text)' }}>Agendar mesmo assim</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--adm-muted)' }}>Ignorar o bloqueio de escala e realizar o agendamento para este cliente</span>
                </div>
              </button>

              <button
                type="button"
                className="slot-card slot-card-block"
                onClick={() => {
                  localStorage.setItem(`unlock_${selectedScaleBlock.date}_${selectedScaleBlock.slot}`, 'true');
                  toast("Horário liberado!", "success");
                  setShowScaleBlockModal(false);
                  setSelectedScaleBlock(null);
                  window.location.reload();
                }}
                style={{ width: '100%', display: 'flex', gap: '12px', padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--adm-rule)', borderRadius: '8px', cursor: 'pointer', textAlign: 'left' }}
              >
                <div className="slot-card-icon" style={{ background: 'rgba(46, 125, 50, 0.15)', color: '#4caf50', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '6px', flexShrink: 0 }}>
                  <Unlock size={20} />
                </div>
                <div className="slot-card-text">
                  <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--adm-text)' }}>Liberar o horário (Desbloquear)</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--adm-muted)' }}>Desbloquear este horário específico da escala deste profissional</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
