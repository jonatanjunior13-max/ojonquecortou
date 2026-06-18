import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../../config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, setDoc, getDoc, writeBatch
} from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { getEffectiveAbsences, getAbsenceForSlot } from '../../utils/absences';
import {
  Home, Calendar, Camera, Users, DollarSign, MoreHorizontal,
  Plus, Bell, ChevronLeft, ChevronRight, X, Check, Phone, MessageSquare,
  Scissors, Package, TrendingUp, TrendingDown, Search, Settings, Trash2,
  Edit3, ArrowRight, LogOut, BarChart2, Send, ShoppingBag, Clock,
  Zap, Star, AlertCircle, CheckCircle, Upload, Image, RefreshCw, Eye, Lock
} from 'lucide-react';
import './AdminMobile.css';
import { syncBookingToGoogle } from '../../utils/gcalSync';

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════
const parseLocalDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return new Date();
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 0, 0, 0, 0);
  }
  return new Date(dateStr);
};
const fmt = (n) => `R$\u00a0${Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => { try { const dt = parseLocalDate(d); return dt.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }); } catch { return d; } };
const dateStr = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const today = () => dateStr(new Date());

const SLOTS = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30','19:00'];
const HOURLY_SLOTS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'];
const timeToMin = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
};
const minToTime = (min) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};
const PAY_METHODS = ['Pix','Dinheiro','Débito','Crédito','Cortesia'];
const GALLERY_CATS = ['Todos','Antes/Depois','Cortes','Coloração','Tratamento','Geral'];
const CURL_TYPES = ['1A','1B','1C','2A','2B','2C','3A','3B','3C','4A','4B','4C'];

const slotInRange = (slot, start, end) => {
  if (!end || end === start) return slot === start;
  return slot >= start && slot < end;
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

const isSlotBlocked = (prof, dateStr, slot) => {
  if (!prof) return false;
  
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const weekday = getAdjustedDay(dateObj);
    
    // Force Sundays (0) and Mondays (1) to be blocked
    if (weekday === 0 || weekday === 1) return true;

    // Force Holidays to be blocked
    if (isFeriado(dateStr)) return true;
    
    // 1. Check day off
    if ((prof.daysOff || []).includes(weekday)) return true;
    
    // 2. Check blocked date
    if ((prof.blockedDates || []).includes(dateStr)) return true;

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
    if (hasWeekdayBlock) return true;

    // 4. Specific date blocks
    const specificBlocks = prof.blockedSpecificHours || [];
    const hasSpecificBlock = specificBlocks.some(block => {
      if (!block.startsWith(dateStr)) return false;
      const rest = block.substring(dateStr.length + 1);
      const restParts = rest.split('-');
      const start = restParts[0];
      const end = restParts[1] || null;
      return slotInRange(slot, start, end);
    });
    if (hasSpecificBlock) return true;
  }
  
  return false;
};

const initials = (name = '') => name.split(' ').filter(Boolean).slice(0,2).map(p => p[0].toUpperCase()).join('');

// ═══════════════════════════════════════════════════════════════════
// TOAST COMPONENT
// ═══════════════════════════════════════════════════════════════════
function Toast({ msg, type = 'info', onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  const icons = { success: <CheckCircle size={16}/>, error: <AlertCircle size={16}/>, info: <Zap size={16}/> };
  return (
    <div className={`m-toast ${type}`}>
      {icons[type]}
      <span style={{ flex: 1 }}>{msg}</span>
      <button onClick={onClose} style={{ background:'none',border:'none',color:'inherit',cursor:'pointer',padding:0,display:'flex' }}><X size={14}/></button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// STATUS PILL
// ═══════════════════════════════════════════════════════════════════
function StatusPill({ status }) {
  const labels = { pendente:'Pendente', confirmado:'Confirmado', finalizado:'Finalizado', cancelado:'Cancelado', faltou:'Faltou', bloqueado:'Bloqueado' };
  return <span className={`m-status-pill ${status}`}>{labels[status] || status}</span>;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
export default function AdminMobileApp() {
  const navigate = useNavigate();

  // ── Navigation ─────────────────────────────────────────────────
  const [tab, setTab] = useState('hoje');

  // ── Data ───────────────────────────────────────────────────────
  const [bookings, setBookings] = useState([]);
  const [clients, setClients] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [services, setServices] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [settings, setSettings] = useState({});
  const [packages, setPackages] = useState([]);
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [selectedFichaClient, setSelectedFichaClient] = useState(null);

  // ── New States for Rescheduling and Fees ────────────────────────
  const [installments, setInstallments] = useState('À vista');
  const [applyAnticipation, setApplyAnticipation] = useState(false);
  const [showEditBookingSheet, setShowEditBookingSheet] = useState(false);
  const [editBookingForm, setEditBookingForm] = useState(null);

  // ── Toast ──────────────────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const showToast = useCallback((msg, type = 'info') => {
    setToast({ msg, type });
  }, []);

  // ── Agenda ─────────────────────────────────────────────────────
  const [currentDate, setCurrentDate] = useState(today());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showSlotSheet, setShowSlotSheet] = useState(false);
  const [showNewBookingSheet, setShowNewBookingSheet] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingSheet, setShowBookingSheet] = useState(false);
  const [showCheckoutSheet, setShowCheckoutSheet] = useState(false);
  const [checkoutBooking, setCheckoutBooking] = useState(null);

  // ── Checkout form ──────────────────────────────────────────────
  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [selectedServices, setSelectedServices] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [isFinalizingCheckout, setIsFinalizingCheckout] = useState(false);

  const [overrideBasePrice, setOverrideBasePrice] = useState(null);
  const [requestReview, setRequestReview] = useState(true);
  const [touchStart, setTouchStart] = useState(null);
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [slideStyle, setSlideStyle] = useState({});
  const [transitioning, setTransitioning] = useState(false);

  // ── New Booking Form ───────────────────────────────────────────
  const [nbForm, setNbForm] = useState({ clientName:'', clientPhone:'', serviceName:'', servicePrice:'', date: today(), time:'09:00', notes:'', prepayment: '' });
  const [nbSuggestions, setNbSuggestions] = useState([]);
  const [ebSuggestions, setEbSuggestions] = useState([]);
  const [nbRegisterClient, setNbRegisterClient] = useState(false);

  // ── Block States ───────────────────────────────────────────────
  const [blockEndTime, setBlockEndTime] = useState('');
  const [blockMotive, setBlockMotive] = useState('');
  const [isBlockingRange, setIsBlockingRange] = useState(false);

  // -- Mobile Options Block states --
  const [mBlockWeekday, setMBlockWeekday] = useState('1');
  const [mBlockWeekdayStart, setMBlockWeekdayStart] = useState('08:00');
  const [mBlockWeekdayEnd, setMBlockWeekdayEnd] = useState('19:00');
  const [mBlockSpecificDate, setMBlockSpecificDate] = useState('');
  const [mBlockSpecificStart, setMBlockSpecificStart] = useState('08:00');
  const [mBlockSpecificEnd, setMBlockSpecificEnd] = useState('19:00');

  // -- States for FAB menu and quick sheets --
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [showProductExitSheet, setShowProductExitSheet] = useState(false);
  const [showProductEntrySheet, setShowProductEntrySheet] = useState(false);
  const [showQuickBlockSheet, setShowQuickBlockSheet] = useState(false);

  // Product exit states
  const [prodExitSelectedId, setProdExitSelectedId] = useState('');
  const [prodExitQuantity, setProdExitQuantity] = useState(1);
  const [prodExitType, setProdExitType] = useState('venda');

  // Product entry states
  const [prodEntryName, setProdEntryName] = useState('');
  const [prodEntryQuantity, setProdEntryQuantity] = useState(1);
  const [prodEntryCost, setProdEntryCost] = useState('');

  // Quick block states
  const [qbDate, setQbDate] = useState(today());
  const [qbStart, setQbStart] = useState('08:00');
  const [qbEnd, setQbEnd] = useState('09:00');
  const [qbMotive, setQbMotive] = useState('');
  const [qbType, setQbType] = useState('folga');

  // Absences (Minhas Ausências) states
  const [showAbsenceSheet, setShowAbsenceSheet] = useState(false);
  const [editingAbsenceId, setEditingAbsenceId] = useState(null);
  const [absTitle, setAbsTitle] = useState('');
  const [absStartDate, setAbsStartDate] = useState(today());
  const [absSingleDay, setAbsSingleDay] = useState(true);
  const [absEndDate, setAbsEndDate] = useState(today());
  const [absAllDay, setAbsAllDay] = useState(false);
  const [absStartTime, setAbsStartTime] = useState('09:00');
  const [absEndTime, setAbsEndTime] = useState('10:00');
  const [absRecurrence, setAbsRecurrence] = useState('none');

  // ── Gallery ────────────────────────────────────────────────────
  const [galleryCategory, setGalleryCategory] = useState('Todos');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(''); // 'storage', 'google', 'done', 'error'
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [showUploadSheet, setShowUploadSheet] = useState(false);
  const [uploadForm, setUploadForm] = useState({ category: 'Geral', caption: '' });
  const [pendingFile, setPendingFile] = useState(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState('');
  const galleryInputRef = useRef(null);
  
  // -- Cropper States --
  const [cropperZoom, setCropperZoom] = useState(1);
  const [cropperOffset, setCropperOffset] = useState({ x: 0, y: 0 });
  const [isDraggingCropper, setIsDraggingCropper] = useState(false);
  const [cropperDragStart, setCropperDragStart] = useState({ x: 0, y: 0 });
  const [cropperDragStartOffset, setCropperDragStartOffset] = useState({ x: 0, y: 0 });
  const [naturalDimensions, setNaturalDimensions] = useState({ w: 0, h: 0 });
  const [containerSize, setContainerSize] = useState(0);
  const previewContainerRef = useRef(null);
  const previewImageRef = useRef(null);

  // -- Destination Upload States --
  const [postToGallery, setPostToGallery] = useState(true);
  const [postToGoogle, setPostToGoogle] = useState(true);

  // ── Clients ────────────────────────────────────────────────────
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientSheet, setShowClientSheet] = useState(false);
  const [showNewClientSheet, setShowNewClientSheet] = useState(false);
  const [newClientForm, setNewClientForm] = useState({ name:'', phone:'', email:'', curvatura:'3A', observacoes:'' });
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [editingClientData, setEditingClientData] = useState({
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
  const [savingClientMobile, setSavingClientMobile] = useState(false);

  // ── Finance ────────────────────────────────────────────────────
  const [financeTab, setFinanceTab] = useState('dashboard');
  const [showAddTxSheet, setShowAddTxSheet] = useState(false);
  const [txForm, setTxForm] = useState({ type:'saida', description:'', value:'', paymentMethod:'Pix', date: today() });

  // ── Mais sub-tabs ──────────────────────────────────────────────
  const [maisSection, setMaisSection] = useState(null); // null | 'servicos' | 'estoque' | 'marketing' | 'config' | 'comissoes'

  // ── Notifications ─────────────────────────────────────────────
  const [notifications, setNotifications] = useState([]);
  const [showNotifSheet, setShowNotifSheet] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  // ── Firebase Listeners ─────────────────────────────────────────
  useEffect(() => {
    const isLocalLogged = localStorage.getItem('admin_logged') === 'true';

    const loadDemoData = () => {
      try {
        setBookings(JSON.parse(localStorage.getItem('demo_bookings')) || []);
        setClients(JSON.parse(localStorage.getItem('demo_client_profiles')) || []);
        setTransactions(JSON.parse(localStorage.getItem('demo_financial') || localStorage.getItem('demo_transactions')) || []);
        setServices(JSON.parse(localStorage.getItem('demo_services')) || []);
        setInventory(JSON.parse(localStorage.getItem('demo_products')) || []);
        setPackages(JSON.parse(localStorage.getItem('demo_packages')) || []);
        setSettings(JSON.parse(localStorage.getItem('demo_settings')) || {
          name: 'Studio do Jon',
          professionals: [{ id: 'jon', name: 'Jon', active: true }]
        });
        setGalleryPhotos(JSON.parse(localStorage.getItem('demo_gallery')) || []);
      } catch (e) {
        console.error('Error loading demo data in mobile app:', e);
        setSettings({ name: 'Studio do Jon', professionals: [{ id: 'jon', name: 'Jon', active: true }] });
      }
      setAuthReady(true);
      setLoading(false);
    };

    if (!db) {
      if (isLocalLogged) {
        loadDemoData();
      } else {
        navigate('/admin/login');
      }
      return;
    }

    let unsubs = [];
    let failSafeTimeout = null;
    let authFired = false;

    // Auth timeout — if Firebase auth takes >5s on mobile, fall back
    const authTimeout = setTimeout(() => {
      if (!authFired) {
        console.warn('Auth timeout reached on mobile — using fallback');
        if (isLocalLogged) {
          loadDemoData();
        } else {
          navigate('/admin/login');
        }
      }
    }, 5000);

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      authFired = true;
      clearTimeout(authTimeout);
      setAuthReady(true);

      if (!user && !isLocalLogged) {
        navigate('/admin/login');
        return;
      }

      if (!user && isLocalLogged) {
        loadDemoData();
        return;
      }

      // Clear any previous listeners if auth changed
      unsubs.forEach(unsub => unsub && unsub());
      unsubs = [];

      let bookingsLoaded = false;
      let clientsLoaded = false;
      let transactionsLoaded = false;
      let servicesLoaded = false;
      let inventoryLoaded = false;
      let packagesLoaded = false;
      let settingsLoaded = false;
      let galleryLoaded = false;

      let loadedCount = 0;
      const checkLoaded = (key) => {
        if (key === 'bookings' && !bookingsLoaded) { bookingsLoaded = true; loadedCount++; }
        if (key === 'clients' && !clientsLoaded) { clientsLoaded = true; loadedCount++; }
        if (key === 'transactions' && !transactionsLoaded) { transactionsLoaded = true; loadedCount++; }
        if (key === 'services' && !servicesLoaded) { servicesLoaded = true; loadedCount++; }
        if (key === 'inventory' && !inventoryLoaded) { inventoryLoaded = true; loadedCount++; }
        if (key === 'packages' && !packagesLoaded) { packagesLoaded = true; loadedCount++; }
        if (key === 'settings' && !settingsLoaded) { settingsLoaded = true; loadedCount++; }
        if (key === 'gallery' && !galleryLoaded) { galleryLoaded = true; loadedCount++; }

        if (loadedCount >= 8) {
          setLoading(false);
          if (failSafeTimeout) clearTimeout(failSafeTimeout);
        }
      };

      const handleError = (key, err) => {
        console.error(`Error loading ${key}:`, err);
        checkLoaded(key);
      };

      // Failsafe: unlock UI after 1.5s even if some collections are slow
      failSafeTimeout = setTimeout(() => {
        setLoading(false);
      }, 1500);

      // Register the 8 listeners
      try {
        unsubs.push(onSnapshot(collection(db, 'bookings'), (snap) => {
          setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          checkLoaded('bookings');
        }, (err) => handleError('bookings', err)));

        unsubs.push(onSnapshot(collection(db, 'client_profiles'), (snap) => {
          setClients(snap.docs.map(d => ({ id: d.id, phone: d.id, ...d.data() })));
          checkLoaded('clients');
        }, (err) => handleError('clients', err)));

        unsubs.push(onSnapshot(collection(db, 'financial_transactions'), (snap) => {
          setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          checkLoaded('transactions');
        }, (err) => handleError('transactions', err)));

        unsubs.push(onSnapshot(collection(db, 'services'), (snap) => {
          setServices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          checkLoaded('services');
        }, (err) => handleError('services', err)));

        unsubs.push(onSnapshot(collection(db, 'products'), (snap) => {
          setInventory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          checkLoaded('inventory');
        }, (err) => handleError('inventory', err)));

        unsubs.push(onSnapshot(collection(db, 'packages'), (snap) => {
          setPackages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          checkLoaded('packages');
        }, (err) => handleError('packages', err)));

        unsubs.push(onSnapshot(doc(db, 'settings', 'studio'), (snap) => {
          setSettings(snap.exists() ? { id: snap.id, ...snap.data() } : { name: 'Studio do Jon', professionals: [{ id: 'jon', name: 'Jon', active: true }] });
          checkLoaded('settings');
        }, (err) => handleError('settings', err)));

        unsubs.push(onSnapshot(collection(db, 'gallery_photos'), (snap) => {
          const sorted = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setGalleryPhotos(sorted);
          checkLoaded('gallery');
        }, (err) => handleError('gallery', err)));

      } catch (err) {
        console.error('Error subscribing to Firestore collections:', err);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      clearTimeout(authTimeout);
      unsubs.forEach(unsub => unsub && unsub());
      if (failSafeTimeout) clearTimeout(failSafeTimeout);
    };
  }, [navigate]);

  // ── Derived: today's bookings ──────────────────────────────────
  const todayBookings = bookings
    .filter(b => b.date === today() && b.status !== 'cancelado' && b.status !== 'bloqueado')
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  const todayRevenue = (() => {
    const seen = new Set();
    return transactions
      .filter(t => {
        if (!t.id) return true;
        if (seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      })
      .filter(t => t.date === today() && t.type === 'entrada')
      .reduce((s, t) => s + Number(t.value || 0), 0);
  })();

  const monthRevenue = (() => {
    const m = new Date().toISOString().slice(0, 7);
    const seen = new Set();
    return transactions
      .filter(t => {
        if (!t.id) return true;
        if (seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      })
      .filter(t => (t.date || '').startsWith(m) && t.type === 'entrada')
      .reduce((s, t) => s + Number(t.value || 0), 0);
  })();

  const pendingCount = bookings.filter(b => b.status === 'pendente').length;

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

  const getWeekDays = (centerDate) => {
    const d = parseLocalDate(centerDate);
    const day = getAdjustedDay(d);
    const sunday = new Date(d);
    sunday.setDate(d.getDate() - day);
    return Array.from({ length: 7 }, (_, i) => {
      const wd = new Date(sunday);
      wd.setDate(sunday.getDate() + i);
      return dateStr(wd);
    });
  };
  const weekDays = getWeekDays(currentDate);
  const DAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

  const navigateDate = (delta) => {
    const d = parseLocalDate(currentDate);
    d.setDate(d.getDate() + delta);
    setCurrentDate(dateStr(d));
  };

  const animateDayChange = (direction) => {
    if (transitioning) return;
    setTransitioning(true);
    const targetOffset = direction > 0 ? -window.innerWidth : window.innerWidth;
    setSlideStyle({
      transform: `translateX(${targetOffset}px)`,
      transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      opacity: 0
    });

    setTimeout(() => {
      navigateDate(direction);
      setSlideStyle({
        transform: `translateX(${direction > 0 ? window.innerWidth : -window.innerWidth}px)`,
        transition: 'none',
        opacity: 0
      });

      requestAnimationFrame(() => {
        setTimeout(() => {
          setSlideStyle({
            transform: 'translateX(0)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: 1
          });
          setTimeout(() => {
            setTransitioning(false);
            setTranslateX(0);
            setSlideStyle({});
          }, 300);
        }, 30);
      });
    }, 250);
  };

  const handleTouchStart = (e) => {
    if (transitioning) return;
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || touchStart === null) return;
    const currentTouch = e.targetTouches[0].clientX;
    const diff = currentTouch - touchStart;
    const cappedDiff = Math.max(-150, Math.min(150, diff));
    setTranslateX(cappedDiff);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (translateX !== 0) {
      const threshold = 60;
      if (translateX > threshold) {
        animateDayChange(-1);
      } else if (translateX < -threshold) {
        animateDayChange(1);
      } else {
        setSlideStyle({
          transform: 'translateX(0)',
          transition: 'transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        });
        setTimeout(() => {
          setTranslateX(0);
          setSlideStyle({});
        }, 200);
      }
    }
    setTouchStart(null);
  };

  const handleMouseDown = (e) => {
    if (transitioning) return;
    setTouchStart(e.clientX);
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || touchStart === null) return;
    const diff = e.clientX - touchStart;
    const cappedDiff = Math.max(-150, Math.min(150, diff));
    setTranslateX(cappedDiff);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (translateX !== 0) {
      const threshold = 60;
      if (translateX > threshold) {
        animateDayChange(-1);
      } else if (translateX < -threshold) {
        animateDayChange(1);
      } else {
        setSlideStyle({
          transform: 'translateX(0)',
          transition: 'transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        });
        setTimeout(() => {
          setTranslateX(0);
          setSlideStyle({});
        }, 200);
      }
    }
    setTouchStart(null);
  };

  // ── Checkout helpers ───────────────────────────────────────────
  const openCheckout = (booking) => {
    setCheckoutBooking(booking);
    
    if (booking.status === 'finalizado') {
      const tx = transactions.find(t => t.bookingId === booking.id);
      if (tx) {
        setDiscount(tx.discount || 0);
        
        let method = 'Pix';
        let inst = 'À vista';
        let anticip = false;
        if (tx.paymentMethod) {
          let pm = tx.paymentMethod;
          if (pm.includes('(Antecipado)')) {
            anticip = true;
            pm = pm.replace(' (Antecipado)', '').trim();
          }
          if (pm.startsWith('Cartão de Crédito')) {
            method = 'Cartão de Crédito';
            const match = pm.match(/\(([^)]+)\)/);
            if (match) {
              inst = match[1];
            }
          } else {
            method = pm;
          }
        }
        setPaymentMethod(method);
        setInstallments(inst);
        setApplyAnticipation(anticip);
        
        setSelectedProducts((tx.productSales || []).map(p => ({
          id: p.productId,
          name: p.name,
          sellingPrice: p.sellingPrice,
          qty: p.quantity
        })));

        const loadedExtra = [];
        if (tx.extraServices) {
          loadedExtra.push(...tx.extraServices);
        } else if (tx.description) {
          const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          services.forEach(svc => {
            if (svc.id === booking.serviceId || svc.name === booking.serviceName || svc.name === booking.service?.name) return;
            const regex = new RegExp(`(\\d+)x\\s+${escapeRegExp(svc.name)}`);
            const match = tx.description.match(regex);
            if (match) {
              loadedExtra.push({
                id: svc.id,
                name: svc.name,
                price: svc.promoPrice || svc.price || 0,
                qty: parseInt(match[1], 10)
              });
            } else if (tx.description.includes(svc.name)) {
              loadedExtra.push({
                id: svc.id,
                name: svc.name,
                price: svc.promoPrice || svc.price || 0,
                qty: 1
              });
            }
          });
        }
        setSelectedServices(loadedExtra);
      } else {
        setPaymentMethod('Pix');
        setInstallments('À vista');
        setApplyAnticipation(false);
        setSelectedProducts([]);
        setSelectedServices([]);
        setDiscount(0);
      }
      setOverrideBasePrice(booking.servicePrice !== undefined ? booking.servicePrice : null);
    } else {
      setPaymentMethod('Pix');
      setInstallments('À vista');
      setApplyAnticipation(false);
      setSelectedProducts([]);
      setSelectedServices([]);
      setDiscount(0);
      setOverrideBasePrice(null);
    }
    
    setProductSearch('');
    setServiceSearch('');
    setRequestReview(booking.status !== 'finalizado');
    setShowBookingSheet(false);
    setShowCheckoutSheet(true);
  };

  const getCheckoutTotal = () => {
    if (!checkoutBooking) return 0;
    const base = overrideBasePrice !== null
      ? overrideBasePrice
      : (checkoutBooking.service?.promoPrice || checkoutBooking.service?.price || checkoutBooking.servicePrice || 0);
    const extraServices = selectedServices.reduce((s, x) => s + x.price * x.qty, 0);
    const prods = selectedProducts.reduce((s, p) => s + p.sellingPrice * p.qty, 0);
    const prepay = Number(checkoutBooking.prepayment || 0);
    return Math.max(0, base + extraServices + prods - discount - prepay);
  };

  const addProductToCheckout = (prod) => {
    setSelectedProducts(prev => {
      const existing = prev.find(p => p.id === prod.id);
      if (existing) return prev.map(p => p.id === prod.id ? { ...p, qty: p.qty + 1 } : p);
      return [...prev, { ...prod, qty: 1 }];
    });
    setProductSearch('');
  };

  const changeProductQty = (prodId, delta) => {
    setSelectedProducts(prev => prev.map(p => p.id === prodId ? { ...p, qty: Math.max(0, p.qty + delta) } : p).filter(p => p.qty > 0));
  };

  const addServiceToCheckout = (svc) => {
    setSelectedServices(prev => {
      const existing = prev.find(s => s.id === svc.id);
      if (existing) return prev.map(s => s.id === svc.id ? { ...s, qty: s.qty + 1 } : s);
      return [...prev, { id: svc.id, name: svc.name, price: svc.promoPrice || svc.price || 0, qty: 1 }];
    });
    setServiceSearch('');
  };

  const changeServiceQty = (svcId, delta) => {
    setSelectedServices(prev => prev.map(s => s.id === svcId ? { ...s, qty: Math.max(0, s.qty + delta) } : s).filter(s => s.qty > 0));
  };

  const finalizeCheckout = async () => {
    if (!checkoutBooking) return;
    setIsFinalizingCheckout(true);
    try {
      const total = getCheckoutTotal();
      const baseMethodLabel = paymentMethod === 'Cartão de Crédito' 
        ? `Cartão de Crédito (${installments})` 
        : paymentMethod;
      const methodLabel = applyAnticipation ? `${baseMethodLabel} (Antecipado)` : baseMethodLabel;

      const itemsDescription = [
        checkoutBooking.service?.name || checkoutBooking.serviceName,
        ...selectedServices.map(s => `${s.qty}x ${s.name}`),
        ...selectedProducts.map(p => `${p.qty}x ${p.name}`)
      ].filter(Boolean).join(', ');

      const prepay = Number(checkoutBooking.prepayment || 0);
      const finalBasePrice = overrideBasePrice !== null
        ? overrideBasePrice
        : (checkoutBooking.service?.promoPrice || checkoutBooking.service?.price || checkoutBooking.servicePrice || 0);

      // Save transaction
      const txData = {
        type: 'entrada',
        description: `${itemsDescription}${discount > 0 ? ` (Desconto: R$ ${discount})` : ''}${prepay > 0 ? ` (Sinal: -R$ ${prepay})` : ''}`,
        value: total,
        paymentMethod: methodLabel,
        discount: discount,
        date: checkoutBooking.date || today(),
        bookingId: checkoutBooking.id,
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
        extraServices: selectedServices.map(s => ({
          id: s.id,
          name: s.name,
          price: s.price,
          qty: s.qty
        })),
        createdAt: new Date().toISOString()
      };

      if (db) {
        const bookingTx = transactions.find(t => t.bookingId === checkoutBooking.id);
        if (bookingTx) {
          // Revert old product inventory adjustments
          if (bookingTx.productSales) {
            for (const oldP of bookingTx.productSales) {
              const prodRef = doc(db, 'products', oldP.productId);
              const snap = await getDoc(prodRef);
              if (snap.exists()) {
                const cur = snap.data().quantity || 0;
                await updateDoc(prodRef, { quantity: cur + oldP.quantity });
              }
            }
          }
          await updateDoc(doc(db, 'financial_transactions', bookingTx.id), txData);
        } else {
          await addDoc(collection(db, 'financial_transactions'), txData);
        }

        await updateDoc(doc(db, 'bookings', checkoutBooking.id), { 
          status: 'finalizado', 
          paymentMethod: methodLabel, 
          finalValue: total, 
          servicePrice: finalBasePrice 
        });

        // Apply new product inventory adjustments
        for (const p of selectedProducts) {
          const prodRef = doc(db, 'products', p.id);
          const snap = await getDoc(prodRef);
          if (snap.exists()) {
            const cur = snap.data().quantity || 0;
            await updateDoc(prodRef, { quantity: Math.max(0, cur - p.qty) });
          }
        }
      }
      if (requestReview) {
        sendFeedbackWhatsApp(checkoutBooking).catch(err => console.error(err));
      }
      setBookings(prev => prev.map(b => b.id === checkoutBooking.id ? { ...b, status: 'finalizado', paymentMethod: methodLabel, finalValue: total, servicePrice: finalBasePrice } : b));
      
      const bookingTx = transactions.find(t => t.bookingId === checkoutBooking.id);
      if (bookingTx) {
        setTransactions(prev => prev.map(t => t.id === bookingTx.id ? { ...t, ...txData } : t));
      } else {
        setTransactions(prev => [{ id: Date.now().toString(), ...txData }, ...prev]);
      }
      
      setShowCheckoutSheet(false);
      setCheckoutBooking(null);
      showToast(bookingTx ? 'Comanda atualizada com sucesso!' : 'Comanda fechada com sucesso!', 'success');
    } catch (err) {
      showToast('Erro ao fechar comanda: ' + err.message, 'error');
    } finally {
      setIsFinalizingCheckout(false);
    }
  };

  const triggerEmailNotification = async (payload, type = 'horario_confirmado') => {
    if (!payload.clientEmail) return;
    try {
      let displayDate = payload.date;
      if (displayDate && displayDate.includes('-')) {
        displayDate = displayDate.split('-').reverse().join('/');
      }
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: type,
          id: payload.id,
          clientEmail: payload.clientEmail,
          clientName: payload.clientName,
          serviceName: payload.serviceName || payload.service?.name || 'Serviço',
          date: displayDate,
          rawDate: payload.date,
          time: payload.time,
          duration: payload.duration || payload.service?.duration || 60,
          notes: payload.notes || '',
          professionalName: 'Jon',
          price: payload.servicePrice ?? payload.price ?? null
        }),
      });
      const data = await response.json();
      console.log('Mobile Email API response:', data);
    } catch (err) {
      console.error(`Failed to send email notification (${type}):`, err);
    }
  };

  // ── New Booking ────────────────────────────────────────────────
  // Verifica se um intervalo [time, time+duration) colide com agendamento/bloqueio
  // existente no mesmo dia (ignora cancelados). Evita horários duplicados.
  const bookingOverlaps = (dateStr, time, duration, excludeId = null) => {
    const slotStart = timeToMin(time);
    const slotEnd = slotStart + (Number(duration) || 60);
    return bookings.some(b => {
      if (excludeId && b.id === excludeId) return false;
      if (b.date !== dateStr) return false;
      if (b.status === 'cancelado') return false;
      const bStart = timeToMin(b.time);
      const bEnd = bStart + (Number(b.duration) || 60);
      return Math.max(bStart, slotStart) < Math.min(bEnd, slotEnd);
    });
  };

  const addBooking = async () => {
    if (!nbForm.clientName || !nbForm.serviceName) { showToast('Preencha cliente e serviço', 'error'); return; }
    const svc = services.find(s => s.name === nbForm.serviceName);
    const prepay = Number(nbForm.prepayment || 0);
    const price = nbForm.servicePrice !== '' ? Number(nbForm.servicePrice) : (svc?.promoPrice || svc?.price || 0);

    // Duração ocupa pelo menos 1h, conforme o tempo do serviço (ex: 4h = 240min)
    const duration = Math.max(60, Number(svc?.duration) || 60);

    // Evita horários duplicados: bloqueia se sobrepõe agendamento/bloqueio existente
    if (bookingOverlaps(nbForm.date, nbForm.time, duration)) {
      if (!window.confirm('Já existe outro agendamento neste horário. Deseja continuar?')) {
        return;
      }
    }

    let clientEmail = '';

    if (nbRegisterClient) {
      if (!nbForm.clientPhone) {
        showToast('Telefone é obrigatório para cadastrar o cliente', 'error');
        return;
      }
      const cleanPhone = nbForm.clientPhone.replace(/\D/g, '');
      const newClientData = {
        name: nbForm.clientName,
        phone: cleanPhone,
        email: nbForm.clientEmail || 'Não informado',
        curvatura: nbForm.clientCurvatura || '3A',
        observacoes: nbForm.clientNotes || '',
        createdAt: new Date().toISOString()
      };
      try {
        if (db) {
          const docRef = doc(db, 'client_profiles', cleanPhone);
          await setDoc(docRef, newClientData);
          setClients(prev => {
            const list = prev.filter(c => c.phone !== cleanPhone);
            return [{ id: cleanPhone, ...newClientData }, ...list];
          });
        } else {
          const localClients = JSON.parse(localStorage.getItem('demo_client_profiles') || '[]');
          localClients.push(newClientData);
          localStorage.setItem('demo_client_profiles', JSON.stringify(localClients));
          setClients(prev => [{ id: cleanPhone, ...newClientData }, ...prev]);
        }
        clientEmail = newClientData.email;
        showToast('Cliente cadastrado com sucesso!', 'success');
      } catch (err) {
        showToast('Erro ao cadastrar cliente: ' + err.message, 'error');
        return;
      }
    } else {
      const cleanPhone = (nbForm.clientPhone || '').replace(/\D/g, '');
      const matchedClient = clients.find(c => c.phone?.replace(/\D/g, '') === cleanPhone);
      clientEmail = matchedClient?.email || '';
    }

    const data = {
      clientName: nbForm.clientName,
      clientPhone: nbForm.clientPhone || '',
      clientEmail: clientEmail,
      service: svc || { name: nbForm.serviceName },
      serviceName: nbForm.serviceName,
      servicePrice: price,
      date: nbForm.date,
      time: nbForm.time,
      duration: duration,
      notes: nbForm.notes || '',
      status: 'confirmado',
      prepayment: prepay,
      createdAt: new Date().toISOString()
    };
    try {
      if (db) {
        const ref = await addDoc(collection(db, 'bookings'), data);
        setBookings(prev => [...prev, { id: ref.id, ...data }]);
        try { await syncBookingToGoogle({ id: ref.id, ...data }); } catch {}

        if (clientEmail && clientEmail !== 'Não informado' && clientEmail.includes('@')) {
          triggerEmailNotification({ ...data, id: ref.id });
        }

        // Log prepayment transaction if > 0
        if (prepay > 0) {
          const tx = {
            bookingId: ref.id,
            date: dateStr(new Date()),
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            clientName: nbForm.clientName,
            clientPhone: nbForm.clientPhone || '',
            type: 'entrada',
            paymentMethod: 'Pix',
            value: prepay,
            description: `Adiantamento/Sinal: ${nbForm.serviceName} - ${nbForm.clientName}`,
            professionalId: 'jon',
            createdAt: new Date().toISOString()
          };
          await addDoc(collection(db, 'financial_transactions'), tx);
          setTransactions(prev => [{ id: Date.now().toString(), ...tx }, ...prev]);
        }
      } else {
        const fakeId = 'demo-bk-' + Date.now();
        setBookings(prev => [...prev, { id: fakeId, ...data }]);
      }
      setShowNewBookingSheet(false);
      setNbRegisterClient(false);
      setNbForm({ clientName:'', clientPhone:'', serviceName:'', servicePrice:'', date: today(), time:'09:00', notes:'', prepayment: '' });
      setTab('hoje');
      showToast('Agendamento criado!', 'success');
    } catch (err) {
      showToast('Erro: ' + err.message, 'error');
    }
  };

  // ── Edit Booking / Reschedule ──────────────────────────────────
  const updateBooking = async () => {
    if (!editBookingForm.clientName || !editBookingForm.serviceName) {
      showToast('Preencha cliente e serviço', 'error');
      return;
    }
    const svc = services.find(s => s.name === editBookingForm.serviceName);
    const oldB = bookings.find(b => b.id === editBookingForm.id);
    const oldPrepayment = oldB ? (Number(oldB.prepayment) || 0) : 0;
    const newPrepayment = Number(editBookingForm.prepayment || 0);

    // Duração ocupa pelo menos 1h, conforme o tempo do serviço
    const duration = Math.max(60, Number(svc?.duration) || Number(oldB?.duration) || 60);

    // Evita horários duplicados ao reagendar (ignora o próprio agendamento)
    if (bookingOverlaps(editBookingForm.date, editBookingForm.time, duration, editBookingForm.id)) {
      if (!window.confirm('Já existe outro agendamento neste horário. Deseja continuar?')) {
        return;
      }
    }

    const data = {
      clientName: editBookingForm.clientName,
      clientPhone: editBookingForm.clientPhone || '',
      service: svc || { name: editBookingForm.serviceName },
      serviceName: editBookingForm.serviceName,
      servicePrice: editBookingForm.servicePrice !== '' ? Number(editBookingForm.servicePrice) : (svc?.promoPrice || svc?.price || 0),
      date: editBookingForm.date,
      time: editBookingForm.time,
      duration: duration,
      notes: editBookingForm.notes || '',
      status: editBookingForm.status,
      prepayment: newPrepayment
    };

    try {
      if (db) {
        await updateDoc(doc(db, 'bookings', editBookingForm.id), data);
        
        // Log prepayment if increased
        if (newPrepayment > oldPrepayment) {
          const diff = newPrepayment - oldPrepayment;
          const tx = {
            bookingId: editBookingForm.id,
            date: dateStr(new Date()),
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            clientName: editBookingForm.clientName,
            clientPhone: editBookingForm.clientPhone || '',
            type: 'entrada',
            paymentMethod: 'Pix',
            value: diff,
            description: `Adiantamento/Sinal: ${editBookingForm.serviceName} - ${editBookingForm.clientName}`,
            professionalId: oldB?.professionalId || oldB?.profissional || 'jon',
            createdAt: new Date().toISOString()
          };
          await addDoc(collection(db, 'financial_transactions'), tx);
          setTransactions(prev => [{ id: Date.now().toString(), ...tx }, ...prev]);
        }
      }
      setBookings(prev => prev.map(b => b.id === editBookingForm.id ? { ...b, ...data } : b));
      
      let emailToUse = oldB?.clientEmail || '';
      if (!emailToUse && editBookingForm.clientPhone) {
        const cleanPhone = editBookingForm.clientPhone.replace(/\D/g, '');
        const matchedClient = clients.find(c => c.phone?.replace(/\D/g, '') === cleanPhone);
        emailToUse = matchedClient?.email || '';
      }

      const dateChanged = oldB?.date !== editBookingForm.date;
      const timeChanged = oldB?.time !== editBookingForm.time;
      if (emailToUse && emailToUse !== 'Não informado' && emailToUse.includes('@') && (dateChanged || timeChanged)) {
        triggerEmailNotification({
          ...data,
          id: editBookingForm.id,
          clientEmail: emailToUse
        }, 'agendamento_editado');
      }

      setShowEditBookingSheet(false);
      showToast('Agendamento atualizado!', 'success');
    } catch (err) {
      showToast('Erro ao atualizar: ' + err.message, 'error');
    }
  };

  // ── Send Feedback / Review Request WhatsApp ─────────────────────
  const sendFeedbackWhatsApp = async (booking) => {
    const cleanPhone = (booking.clientPhone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      showToast('Telefone inválido para envio.', 'error');
      return;
    }

    const firstName = (booking.clientName || '').split(' ')[0];
    const msgText = `${firstName}, muito obrigado por vir ao Studio hoje! A sua presença e a confiança que você deposita no meu trabalho significam o mundo para mim. ❤️

Se você gostou do resultado e sentiu a diferença nos seus cachos, você poderia deixar uma avaliação rápida no Google? Isso me ajuda muito e faz com que outras cacheadas nos encontrem.

Leva apenas 1 minutinho clicando aqui:
https://g.page/r/CRmlu0sO48XmEBM/review

Grande abraço, Jon.`;

    const phoneWithDDI = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    const gateway = settings?.waReminderGateway;
    if (!gateway || gateway === 'none') {
      console.log('WhatsApp Gateway não configurado, abrindo diretamente:', msgText);
      const waUrl = `https://api.whatsapp.com/send?phone=${phoneWithDDI}&text=${encodeURIComponent(msgText)}`;
      window.open(waUrl, '_blank');
      showToast('Abrindo WhatsApp diretamente... 🚀', 'success');
      return;
    }

    try {
      showToast('Disparando avaliação via API...', 'info');
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
          date: booking.date,
          time: booking.time,
          service: booking.serviceName || booking.service?.name
          }
        })
      });

      if (response.ok) {
        showToast('Pedido de avaliação enviado! 🚀', 'success');
      } else {
        throw new Error('Falha no gateway de WhatsApp');
      }
    } catch (err) {
      console.warn('Erro ao disparar via API, abrindo WhatsApp diretamente:', err);
      // Fallback: abrir wa.me link diretamente se o gateway falhar
      const waUrl = `https://api.whatsapp.com/send?phone=${phoneWithDDI}&text=${encodeURIComponent(msgText)}`;
      window.open(waUrl, '_blank');
      showToast('Abrindo WhatsApp diretamente... 🚀', 'success');
    }
  };

  useEffect(() => {
    if (nbForm.clientName.length < 2) { setNbSuggestions([]); return; }
    const q = nbForm.clientName.toLowerCase();
    setNbSuggestions(clients.filter(c => c.name?.toLowerCase().includes(q)).slice(0, 5));
  }, [nbForm.clientName, clients]);

  // ── Client name autocomplete for Edit ──────────────────────────
  useEffect(() => {
    if (!editBookingForm || !editBookingForm.clientName || editBookingForm.clientName.length < 2) { setEbSuggestions([]); return; }
    const q = editBookingForm.clientName.toLowerCase();
    setEbSuggestions(clients.filter(c => c.name?.toLowerCase().includes(q)).slice(0, 5));
  }, [editBookingForm?.clientName, clients]);

  const changeStatus = async (bookingId, status) => {
    try {
      const booking = bookings.find(b => b.id === bookingId);
      let emailToUse = booking?.clientEmail || '';
      if (!emailToUse && booking?.clientPhone) {
        const cleanPhone = booking.clientPhone.replace(/\D/g, '');
        const matchedClient = clients.find(c => c.phone?.replace(/\D/g, '') === cleanPhone);
        emailToUse = matchedClient?.email || '';
      }

      const dataToUpdate = { status };
      if (status === 'faltou') {
        dataToUpdate.missedAt = new Date().toISOString();
        dataToUpdate.missedEmailSent = false;

        const cleanPhone = booking?.clientPhone?.replace(/\D/g, '');
        if (cleanPhone) {
          try {
            if (db) {
              const clientRef = doc(db, 'client_profiles', cleanPhone);
              await updateDoc(clientRef, { blocked: true });
            } else {
              const localClients = JSON.parse(localStorage.getItem('demo_client_profiles') || '[]');
              const updatedClients = localClients.map(c => c.phone === cleanPhone ? { ...c, blocked: true } : c);
              localStorage.setItem('demo_client_profiles', JSON.stringify(updatedClients));
            }
            setClients(prev => prev.map(c => c.phone === cleanPhone ? { ...c, blocked: true } : c));
          } catch (err) {
            console.warn('Erro ao bloquear cliente:', err);
          }
        }
      }

      if (db) await updateDoc(doc(db, 'bookings', bookingId), dataToUpdate);
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, ...dataToUpdate } : b));
      setShowBookingSheet(false);
      if (status === 'cancelado') setTab('hoje');
      showToast(`Status atualizado: ${status}`, 'success');

      if (emailToUse && emailToUse !== 'Não informado' && emailToUse.includes('@')) {
        const updatedBooking = { ...booking, id: bookingId, clientEmail: emailToUse };
        if (status === 'confirmado') {
          triggerEmailNotification(updatedBooking, 'horario_confirmado');
        } else if (status === 'cancelado') {
          triggerEmailNotification({ ...updatedBooking, cancelledBy: 'admin' }, 'agendamento_cancelado');
        }
      }
    } catch (err) {
      showToast('Erro: ' + err.message, 'error');
    }
  };

  // ── Gallery upload ─────────────────────────────────────────────
  const handleGalleryFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      showToast('Selecione uma imagem ou vídeo', 'error');
      return;
    }
    const url = URL.createObjectURL(file);
    setPendingFile(file);
    setPendingPreviewUrl(url);
    setUploadForm({ category: 'Geral', caption: '' });
    setCropperZoom(1);
    setCropperOffset({ x: 0, y: 0 });
    setNaturalDimensions({ w: 0, h: 0 });
    setPostToGallery(true);
    setPostToGoogle(true);
    setShowUploadSheet(true);
  };

  const handleCropperDragStart = (clientX, clientY) => {
    if (!naturalDimensions.w || !containerSize) return;
    setIsDraggingCropper(true);
    setCropperDragStart({ x: clientX, y: clientY });
    setCropperDragStartOffset({ ...cropperOffset });
  };

  const handleCropperDragMove = (clientX, clientY) => {
    if (!isDraggingCropper || !naturalDimensions.w || !containerSize) return;
    const dx = clientX - cropperDragStart.x;
    const dy = clientY - cropperDragStart.y;
    
    const initialScale = Math.max(containerSize / naturalDimensions.w, containerSize / naturalDimensions.h);
    const displayWidth = naturalDimensions.w * initialScale * cropperZoom;
    const displayHeight = naturalDimensions.h * initialScale * cropperZoom;
    const initialX = (containerSize - displayWidth) / 2;
    const initialY = (containerSize - displayHeight) / 2;
    
    let newX = cropperDragStartOffset.x + dx;
    let newY = cropperDragStartOffset.y + dy;
    
    const minX = containerSize - displayWidth - initialX;
    const maxX = -initialX;
    const minY = containerSize - displayHeight - initialY;
    const maxY = -initialY;
    
    newX = Math.max(minX, Math.min(maxX, newX));
    newY = Math.max(minY, Math.min(maxY, newY));
    
    setCropperOffset({ x: newX, y: newY });
  };

  const handleCropperDragEnd = () => {
    setIsDraggingCropper(false);
  };

  const uploadPhoto = async () => {
    if (!pendingFile) return;
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('storage');

    try {
      let fileToUpload = pendingFile;
      const isVideo = pendingFile.type.startsWith('video/');
      
      if (!isVideo && naturalDimensions.w && containerSize && previewImageRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = 1000;
        canvas.height = 1000;
        const ctx = canvas.getContext('2d');
        
        const initialScale = Math.max(containerSize / naturalDimensions.w, containerSize / naturalDimensions.h);
        const displayWidth = naturalDimensions.w * initialScale;
        const displayHeight = naturalDimensions.h * initialScale;
        const initialX = (containerSize - displayWidth) / 2;
        const initialY = (containerSize - displayHeight) / 2;
        
        const renderScale = initialScale * cropperZoom;
        const left = initialX + cropperOffset.x;
        const top = initialY + cropperOffset.y;
        
        const srcX = -left / renderScale;
        const srcY = -top / renderScale;
        const srcW = containerSize / renderScale;
        const srcH = containerSize / renderScale;
        
        ctx.drawImage(previewImageRef.current, srcX, srcY, srcW, srcH, 0, 0, 1000, 1000);
        
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
        fileToUpload = new File([blob], pendingFile.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg' });
      }

      // Step 1: Upload to Firebase Storage
      const filename = `${Date.now()}_${fileToUpload.name.replace(/\s+/g, '_')}`;
      const sRef = storageRef(storage, `gallery/${filename}`);
      const uploadTask = uploadBytesResumable(sRef, fileToUpload);

      const downloadURL = await new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 80);
            setUploadProgress(pct);
          },
          reject,
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          }
        );
      });

      setUploadProgress(85);
      setUploadStatus('google');

      // Step 2: Post to Google Business Photos (via proxy or direct API)
      let googlePosted = false;
      if (postToGoogle && !isVideo) {
        try {
          const hasGbpConfig = !!(settings?.automations?.googleGbpConnected || settings?.automations?.googleGbpLocationId || settings?.googleLocationId);
          if (hasGbpConfig) {
            const ctrl = new AbortController();
            const gbpTimeout = setTimeout(() => ctrl.abort(), 8000);
            try {
              const resp = await fetch('/api/gbp?action=upload-media', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: downloadURL, category: 'ADDITIONAL' }),
                signal: ctrl.signal
              });
              if (resp.ok) {
                const resData = await resp.json();
                googlePosted = !!resData.success;
              }
            } finally {
              clearTimeout(gbpTimeout);
            }
          }
        } catch (gErr) {
          console.warn('Google Business post skipped:', gErr.message);
        }
      }

      setUploadProgress(95);

      // Step 3: Save to Firestore gallery_photos
      if (postToGallery) {
        const photoData = {
          url: downloadURL,
          filename,
          category: uploadForm.category,
          caption: uploadForm.caption || '',
          googlePosted,
          createdAt: new Date().toISOString(),
          storagePath: `gallery/${filename}`,
          type: isVideo ? 'video' : 'image'
        };

        if (db) {
          await addDoc(collection(db, 'gallery_photos'), photoData);
        }
      }

      setUploadProgress(100);
      setUploadStatus('done');
      setShowUploadSheet(false);
      setPendingFile(null);
      setPendingPreviewUrl('');
      showToast(
        isVideo
          ? 'Vídeo publicado na galeria!'
          : googlePosted && postToGallery
            ? 'Foto publicada no Studio e no Google! 🎉'
            : googlePosted
              ? 'Foto publicada no Google! 🎉'
              : 'Foto salva na galeria!',
        'success'
      );
    } catch (err) {
      setUploadStatus('error');
      showToast('Erro no upload: ' + err.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const deletePhoto = async (photo) => {
    if (!window.confirm('Remover esta foto?')) return;
    try {
      if (storage && photo.storagePath) {
        const sRef = storageRef(storage, photo.storagePath);
        await deleteObject(sRef).catch(() => {});
      }
      if (db) await deleteDoc(doc(db, 'gallery_photos', photo.id));
      setGalleryPhotos(prev => prev.filter(p => p.id !== photo.id));
      setPreviewPhoto(null);
      showToast('Foto removida', 'info');
    } catch (err) {
      showToast('Erro ao remover: ' + err.message, 'error');
    }
  };

  // ── Save Client Mobile ─────────────────────────────────────────
  const handleSaveClientMobile = async () => {
    if (!editingClientData.name) { showToast('Nome é obrigatório', 'error'); return; }
    const cleanNewPhone = (editingClientData.phone || '').replace(/\D/g, '');
    if (!cleanNewPhone) { showToast('Telefone é obrigatório', 'error'); return; }

    setSavingClientMobile(true);
    const updatedProfile = {
      ...editingClientData,
      phone: cleanNewPhone
    };

    try {
      if (!db) {
        // Modo local
        let localClients = JSON.parse(localStorage.getItem('demo_client_profiles') || '[]');
        if (cleanNewPhone !== selectedClient.phone) {
          localClients = localClients.filter(p => p.phone !== selectedClient.phone);
        }
        localClients = localClients.filter(p => p.phone !== cleanNewPhone);
        localClients.push(updatedProfile);
        localStorage.setItem('demo_client_profiles', JSON.stringify(localClients));
        setClients(localClients.map(d => ({ id: d.phone, phone: d.phone, ...d })));
        setSelectedClient({ id: cleanNewPhone, phone: cleanNewPhone, ...updatedProfile });
        setIsEditingClient(false);
        showToast('Ficha atualizada localmente', 'success');
      } else {
        if (cleanNewPhone !== selectedClient.phone) {
          const batch = writeBatch(db);
          const newDocRef = doc(db, 'client_profiles', cleanNewPhone);
          const oldDocRef = doc(db, 'client_profiles', selectedClient.phone);
          
          batch.set(newDocRef, updatedProfile);
          batch.delete(oldDocRef);
          await batch.commit();
          
          setSelectedClient({ id: cleanNewPhone, phone: cleanNewPhone, ...updatedProfile });
          setIsEditingClient(false);
          showToast('Cliente atualizado com sucesso!', 'success');
        } else {
          const docRef = doc(db, 'client_profiles', selectedClient.phone);
          await setDoc(docRef, updatedProfile);
          setSelectedClient({ id: selectedClient.phone, phone: selectedClient.phone, ...updatedProfile });
          setIsEditingClient(false);
          showToast('Cliente atualizado com sucesso!', 'success');
        }
      }
    } catch (err) {
      console.error('Erro ao salvar cliente no mobile:', err);
      showToast('Erro ao salvar: ' + err.message, 'error');
    } finally {
      setSavingClientMobile(false);
    }
  };

  // ── Add Client ─────────────────────────────────────────────────
  const addClient = async () => {
    if (!newClientForm.name) { showToast('Nome é obrigatório', 'error'); return; }
    const data = { ...newClientForm, createdAt: new Date().toISOString() };
    try {
      if (db) {
        const ref = await addDoc(collection(db, 'client_profiles'), data);
        setClients(prev => [{ id: ref.id, ...data }, ...prev]);
      }
      setShowNewClientSheet(false);
      setNewClientForm({ name:'', phone:'', email:'', curvatura:'3A', observacoes:'' });
      showToast('Cliente cadastrado!', 'success');
    } catch (err) {
      showToast('Erro: ' + err.message, 'error');
    }
  };

  // ── Add Transaction ────────────────────────────────────────────
  const addTransaction = async () => {
    if (!txForm.description || !txForm.value) { showToast('Preencha descrição e valor', 'error'); return; }
    const data = { ...txForm, value: Number(txForm.value), createdAt: new Date().toISOString() };
    try {
      if (db) {
        const ref = await addDoc(collection(db, 'financial_transactions'), data);
        setTransactions(prev => [{ id: ref.id, ...data }, ...prev]);
      }
      setShowAddTxSheet(false);
      setTxForm({ type:'saida', description:'', value:'', paymentMethod:'Pix', date: today() });
      showToast('Lançamento salvo!', 'success');
    } catch (err) {
      showToast('Erro: ' + err.message, 'error');
    }
  };

  const addRecurringBlock = async () => {
    if (mBlockWeekdayStart >= mBlockWeekdayEnd) {
      showToast('Horário de fim deve ser após o início', 'error');
      return;
    }
    const blockStr = `${mBlockWeekday}-${mBlockWeekdayStart}-${mBlockWeekdayEnd}`;
    const profs = settings.professionals || [];
    const jonProf = profs.find(p => p.id === 'jon') || profs[0];
    if (!jonProf) return;

    const current = jonProf.blockedWeekdayHours || [];
    if (current.includes(blockStr)) {
      showToast('Este bloqueio já existe', 'error');
      return;
    }

    const updatedProfs = profs.map(p => {
      if (p.id === jonProf.id) {
        return {
          ...p,
          blockedWeekdayHours: [...current, blockStr]
        };
      }
      return p;
    });

    try {
      if (db) {
        await updateDoc(doc(db, 'settings', 'studio'), { professionals: updatedProfs });
        showToast('Bloqueio recorrente adicionado!', 'success');
      }
    } catch (err) {
      showToast('Erro ao salvar: ' + err.message, 'error');
    }
  };

  const removeRecurringBlock = async (blockStr) => {
    const profs = settings.professionals || [];
    const jonProf = profs.find(p => p.id === 'jon') || profs[0];
    if (!jonProf) return;

    const updatedProfs = profs.map(p => {
      if (p.id === jonProf.id) {
        return {
          ...p,
          blockedWeekdayHours: (p.blockedWeekdayHours || []).filter(x => x !== blockStr)
        };
      }
      return p;
    });

    try {
      if (db) {
        await updateDoc(doc(db, 'settings', 'studio'), { professionals: updatedProfs });
        showToast('Bloqueio recorrente removido', 'success');
      }
    } catch (err) {
      showToast('Erro ao remover: ' + err.message, 'error');
    }
  };

  const addSpecificBlock = async () => {
    if (!mBlockSpecificDate) {
      showToast('Selecione uma data', 'error');
      return;
    }
    if (mBlockSpecificStart >= mBlockSpecificEnd) {
      showToast('Horário de fim deve ser após o início', 'error');
      return;
    }
    const blockStr = `${mBlockSpecificDate}-${mBlockSpecificStart}-${mBlockSpecificEnd}`;
    const profs = settings.professionals || [];
    const jonProf = profs.find(p => p.id === 'jon') || profs[0];
    if (!jonProf) return;

    const current = jonProf.blockedSpecificHours || [];
    if (current.includes(blockStr)) {
      showToast('Este bloqueio já existe', 'error');
      return;
    }

    const updatedProfs = profs.map(p => {
      if (p.id === jonProf.id) {
        return {
          ...p,
          blockedSpecificHours: [...current, blockStr]
        };
      }
      return p;
    });

    try {
      if (db) {
        await updateDoc(doc(db, 'settings', 'studio'), { professionals: updatedProfs });
        showToast('Bloqueio pontual adicionado!', 'success');
      }
    } catch (err) {
      showToast('Erro ao salvar: ' + err.message, 'error');
    }
  };

  const removeSpecificBlock = async (blockStr) => {
    const profs = settings.professionals || [];
    const jonProf = profs.find(p => p.id === 'jon') || profs[0];
    if (!jonProf) return;

    const updatedProfs = profs.map(p => {
      if (p.id === jonProf.id) {
        return {
          ...p,
          blockedSpecificHours: (p.blockedSpecificHours || []).filter(x => x !== blockStr)
        };
      }
      return p;
    });

    try {
      if (db) {
        await updateDoc(doc(db, 'settings', 'studio'), { professionals: updatedProfs });
        showToast('Bloqueio pontual removido', 'success');
      }
    } catch (err) {
      showToast('Erro ao remover: ' + err.message, 'error');
    }
  };

  const handleProductExit = async () => {
    if (!prodExitSelectedId) {
      showToast('Selecione um produto', 'error');
      return;
    }
    const product = inventory.find(p => p.id === prodExitSelectedId);
    if (!product) return;

    const qty = Number(prodExitQuantity);
    if (isNaN(qty) || qty <= 0) {
      showToast('Quantidade inválida', 'error');
      return;
    }

    if (qty > product.quantity) {
      showToast('Estoque insuficiente', 'error');
      return;
    }

    const newQty = product.quantity - qty;

    try {
      if (db) {
        await updateDoc(doc(db, 'products', product.id), { quantity: newQty });
      }

      // Saída de produto SEMPRE debita o custo (não o preço de venda)
      // Venda avulsa = entrada de caixa pelo preço de venda; mas a saída de estoque
      // gera uma despesa de custo (custo da mercadoria). Uso interno = só despesa de custo.
      const costVal = (product.costPrice || 0) * qty;
      const isSale = prodExitType === 'venda';
      const txDataList = [];

      // Sempre lança saída de custo do estoque
      txDataList.push({
        type: 'saida',
        category: 'estoque',
        value: costVal,
        description: isSale
          ? `CMV - Venda Avulsa: ${product.name} (x${qty})`
          : `Uso do Salão: ${product.name} (-${qty} un.)`,
        date: today(),
        createdAt: new Date().toISOString()
      });

      // Se for venda, lança também a entrada pelo preço de venda
      if (isSale && product.sellingPrice) {
        txDataList.push({
          type: 'entrada',
          category: 'estoque',
          value: (product.sellingPrice || 0) * qty,
          description: `Venda Avulsa: ${product.name} (x${qty})`,
          date: today(),
          paymentMethod: 'Pix',
          createdAt: new Date().toISOString()
        });
      }

      if (db) {
        for (const txData of txDataList) {
          await addDoc(collection(db, 'financial_transactions'), txData);
        }
      }
      setInventory(prev => prev.map(p => p.id === product.id ? { ...p, quantity: newQty } : p));
      setTransactions(prev => [
        ...txDataList.map(tx => ({ id: Date.now().toString() + Math.random(), ...tx })),
        ...prev
      ]);

      showToast(isSale ? 'Venda registrada! 💰 Custo debitado do caixa.' : 'Saída por uso registrada! 💸', 'success');
      setShowProductExitSheet(false);
      setProdExitSelectedId('');
      setProdExitQuantity(1);
    } catch (err) {
      showToast('Erro ao registrar saída: ' + err.message, 'error');
    }
  };

  const handleProductEntry = async () => {
    const name = prodEntryName.trim();
    if (!name) {
      showToast('Informe o nome do produto', 'error');
      return;
    }
    const qty = Number(prodEntryQuantity);
    if (isNaN(qty) || qty <= 0) {
      showToast('Quantidade inválida', 'error');
      return;
    }
    const cost = Number(prodEntryCost);
    if (isNaN(cost) || cost < 0) {
      showToast('Preço de custo inválido', 'error');
      return;
    }

    try {
      // Se já existe produto com mesmo nome, soma ao estoque; senão cria novo.
      const existing = inventory.find(p => (p.name || '').trim().toLowerCase() === name.toLowerCase());

      if (existing) {
        const newQty = (existing.quantity || 0) + qty;
        if (db) {
          await updateDoc(doc(db, 'products', existing.id), { quantity: newQty, costPrice: cost });
        } else {
          setInventory(prev => prev.map(p => p.id === existing.id ? { ...p, quantity: newQty, costPrice: cost } : p));
        }
      } else {
        const payload = {
          name,
          category: 'Geral',
          quantity: qty,
          costPrice: cost,
          sellingPrice: 0,
          minStock: 3,
          createdAt: new Date().toISOString()
        };
        if (db) {
          const ref = await addDoc(collection(db, 'products'), payload);
          setInventory(prev => [...prev, { id: ref.id, ...payload }]);
        } else {
          setInventory(prev => [...prev, { id: 'demo-prod-' + Date.now(), ...payload }]);
        }
      }

      // Registra a compra como despesa (igual ao desktop)
      const txData = {
        type: 'saida',
        category: 'estoque',
        value: cost * qty,
        description: `Compra de estoque: ${name} (+${qty} un.)`,
        date: today(),
        paymentMethod: 'Pix',
        createdAt: new Date().toISOString()
      };
      if (db) await addDoc(collection(db, 'financial_transactions'), txData);

      showToast('Entrada de produto registrada! 📦', 'success');
      setShowProductEntrySheet(false);
      setProdEntryName('');
      setProdEntryQuantity(1);
      setProdEntryCost('');
    } catch (err) {
      showToast('Erro ao registrar entrada: ' + err.message, 'error');
    }
  };

  const handleQuickBlock = async () => {
    const startMin = timeToMin(qbStart);
    const endMin = timeToMin(qbEnd);
    if (startMin >= endMin) {
      showToast('Horário de fim deve ser após o início', 'error');
      return;
    }
    const duration = endMin - startMin;

    const typeLabels = { folga: 'Folga', compromisso: 'Compromisso pessoal', feriado: 'Feriado' };
    const reason = qbMotive.trim()
      ? `${typeLabels[qbType]}: ${qbMotive.trim()}`
      : typeLabels[qbType];

    const payload = {
      clientName: 'Horário Bloqueado',
      clientPhone: '00000000000',
      clientEmail: '',
      service: { name: 'Bloqueio Administrativo', price: 0 },
      date: qbDate,
      time: qbStart,
      profissional: 'jon',
      notes: reason,
      absenceType: qbType,
      status: 'bloqueado',
      duration: duration,
      createdAt: new Date().toISOString()
    };

    try {
      if (db) {
        const ref = await addDoc(collection(db, 'bookings'), payload);
        setBookings(prev => [...prev, { id: ref.id, ...payload }]);
      } else {
        const fakeId = 'demo-block-' + Date.now();
        setBookings(prev => [...prev, { id: fakeId, ...payload }]);
      }

      showToast(`Ausência registrada!`, 'info');
      setShowQuickBlockSheet(false);
      setQbMotive('');
    } catch (err) {
      showToast('Erro ao bloquear horário: ' + err.message, 'error');
    }
  };

  // ── Minhas Ausências (CRUD) ─────────────────────────────────────
  const openNewAbsence = () => {
    setEditingAbsenceId(null);
    setAbsTitle('');
    setAbsStartDate(currentDate || today());
    setAbsSingleDay(true);
    setAbsEndDate(currentDate || today());
    setAbsAllDay(false);
    setAbsStartTime('09:00');
    setAbsEndTime('10:00');
    setAbsRecurrence('none');
    setShowAbsenceSheet(true);
  };

  const openEditAbsence = (a) => {
    setEditingAbsenceId(a.id);
    setAbsTitle(a.title || '');
    setAbsStartDate(a.startDate || today());
    setAbsSingleDay(!a.endDate);
    setAbsEndDate(a.endDate || a.startDate || today());
    setAbsAllDay(!!a.allDay);
    setAbsStartTime(a.startTime || '09:00');
    setAbsEndTime(a.endTime || '10:00');
    setAbsRecurrence(a.recurrence || 'none');
    setShowAbsenceSheet(true);
  };

  const saveAbsence = async () => {
    if (!absTitle.trim()) {
      showToast('Informe um título', 'error');
      return;
    }
    if (!absAllDay && absStartTime >= absEndTime) {
      showToast('Horário de fim deve ser após o início', 'error');
      return;
    }
    if (absRecurrence === 'none' && !absSingleDay && absEndDate < absStartDate) {
      showToast('Data fim deve ser após a data início', 'error');
      return;
    }

    const dt = parseLocalDate(absStartDate);
    const absence = {
      id: editingAbsenceId || ('abs-' + Date.now()),
      title: absTitle.trim(),
      startDate: absStartDate,
      endDate: (absRecurrence === 'none' && !absSingleDay) ? absEndDate : null,
      allDay: absAllDay,
      startTime: absAllDay ? null : absStartTime,
      endTime: absAllDay ? null : absEndTime,
      recurrence: absRecurrence,
      weekday: absRecurrence === 'weekly' ? getAdjustedDay(dt) : null
    };

    const current = (settings?.absences || []).filter(a => a.id !== absence.id);
    const updated = [...current, absence];

    try {
      if (db) {
        await updateDoc(doc(db, 'settings', 'studio'), { absences: updated });
      } else {
        setSettings(prev => ({ ...prev, absences: updated }));
      }
      showToast(editingAbsenceId ? 'Ausência atualizada!' : 'Ausência cadastrada!', 'success');
      setShowAbsenceSheet(false);
    } catch (err) {
      showToast('Erro ao salvar ausência: ' + err.message, 'error');
    }
  };

  const deleteAbsence = async (id) => {
    if (!window.confirm('Excluir esta ausência?')) return;
    const updated = (settings?.absences || []).filter(a => a.id !== id);
    try {
      if (db) {
        await updateDoc(doc(db, 'settings', 'studio'), { absences: updated });
      } else {
        setSettings(prev => ({ ...prev, absences: updated }));
      }
      showToast('Ausência excluída', 'success');
    } catch (err) {
      showToast('Erro ao excluir: ' + err.message, 'error');
    }
  };

  // ── Loading screen ─────────────────────────────────────────────
  if (loading || !authReady) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100dvh', background: '#0E0C0B',
        color: '#F5EDDB', gap: '20px', fontFamily: '"Manrope", sans-serif'
      }}>
        <div style={{ fontSize: '2rem', fontFamily: '"DM Serif Display", serif', color: '#DCA354' }}>Studio do Jon</div>
        <div className="m-spinner" />
        <span style={{ fontSize: '0.85rem', color: '#7A6E63' }}>Carregando dados...</span>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER TABS
  // ═══════════════════════════════════════════════════════════════

  // ── TAB: HOJE ─────────────────────────────────────────────────
  const renderHoje = () => {
    const hour = new Date().getHours();
    const greet = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
    const upcoming = bookings
      .filter(b => b.date === today() && ['pendente','confirmado'].includes(b.status))
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    const birthdays = clients.filter(c => {
      if (!c.birthdate) return false;
      const bd = c.birthdate.slice(5);
      return bd === today().slice(5);
    });

    return (
      <div className="m-tab m-page" key="hoje">
        {/* Greeting */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ fontSize:'0.72rem', color:'var(--m-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.6px' }}>{greet} 👋</div>
            <div style={{ fontSize:'1.3rem', fontWeight:800, fontFamily:'"DM Serif Display", serif', color:'var(--m-text)', marginTop:2 }}>
              {settings?.name || 'Studio do Jon'}
            </div>
            <div style={{ fontSize:'0.7rem', color:'var(--m-muted)', marginTop:2 }}>{fmtDate(today())} · {new Date().toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}</div>
          </div>
          {syncError && <div style={{ display:'flex', alignItems:'center', gap:4, color:'var(--m-amber)', fontSize:'0.65rem', fontWeight:700 }}><AlertCircle size={12}/> Offline</div>}
        </div>

        {/* KPIs */}
        <div className="m-kpi-row">
          <div className="m-kpi-card gold">
            <div className="m-kpi-icon"><DollarSign size={14}/></div>
            <div className="m-kpi-label">Hoje</div>
            <div className="m-kpi-value" style={{ fontSize:'1.15rem' }}>{fmt(todayRevenue)}</div>
            <div className="m-kpi-sub">{fmt(monthRevenue)} no mês</div>
          </div>
          <div className="m-kpi-card">
            <div className="m-kpi-icon" style={{ background:'var(--m-blue-bg)', color:'var(--m-blue)' }}><Calendar size={14}/></div>
            <div className="m-kpi-label">Hoje</div>
            <div className="m-kpi-value">{todayBookings.length}</div>
            <div className="m-kpi-sub">{pendingCount} pendente{pendingCount !== 1 ? 's':''}</div>
          </div>
        </div>

        {/* Aniversariantes */}
        {birthdays.length > 0 && (
          <div style={{ background:'var(--m-gold-subtle)', border:'0.5px solid var(--m-gold)', borderRadius:'var(--m-radius)', padding:'12px 14px' }}>
            <div style={{ fontSize:'0.72rem', fontWeight:800, color:'var(--m-gold)', textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:8 }}>🎂 Aniversariante{birthdays.length > 1 ? 's':''} Hoje</div>
            {birthdays.map(c => (
              <button
                key={c.id}
                onClick={() => { setBirthdayClient(c); setShowBirthdaySheet(true); }}
                style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  width:'100%', background:'none', border:'none', padding:'6px 0',
                  cursor:'pointer', fontFamily:'inherit', borderBottom: birthdays.indexOf(c) < birthdays.length - 1 ? '0.5px solid var(--m-rule)' : 'none'
                }}
              >
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:'1.1rem' }}>🎉</span>
                  <span style={{ fontSize:'0.85rem', color:'var(--m-text)', fontWeight:700 }}>{c.name}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  {c.phone && <span style={{ fontSize:'0.68rem', color:'var(--m-muted)' }}>{c.phone}</span>}
                  <span style={{ fontSize:'0.72rem', fontWeight:800, color:'var(--m-gold)', background:'rgba(220,163,84,0.15)', borderRadius:8, padding:'3px 8px' }}>Parabenizar →</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Today's bookings */}
        <div>
          <div className="m-section-header">
            <span className="m-section-title">Agenda de Hoje</span>
            <button className="m-section-link" onClick={() => setTab('agenda')}>Ver tudo →</button>
          </div>
          {todayBookings.length === 0 ? (
            <div className="m-empty">
              <Calendar className="m-empty-icon" size={32}/>
              <div className="m-empty-title">Nenhum agendamento</div>
              <div className="m-empty-sub">Clique no + para criar um agendamento</div>
            </div>
          ) : (
            <div className="m-booking-list">
              {todayBookings.slice(0, 6).map(b => (
                <div key={b.id} className="m-booking-card" onClick={() => { setSelectedBooking(b); setShowBookingSheet(true); }}>
                  <div className="m-booking-time">{b.time || '—'}</div>
                  <div className="m-booking-info">
                    <div 
                      className="m-booking-name" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFichaClient({ name: b.clientName, phone: b.clientPhone });
                      }}
                      style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted', position: 'relative', display: 'inline-block' }}
                    >
                      {b.clientName}
                      {isClientRecurrent(b.clientName, b.clientPhone) && (
                        <span style={{
                          position: 'absolute',
                          top: '-2px',
                          right: '-8px',
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--m-gold, #dca354)'
                        }} />
                      )}
                    </div>
                    <div className="m-booking-service">{b.service?.name || b.serviceName}</div>
                  </div>
                  <StatusPill status={b.status}/>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <div className="m-section-title" style={{ marginBottom:10 }}>Ações Rápidas</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {[
              { label:'Novo Agendamento', icon:<Plus size={16}/>, color:'var(--m-gold)', action: () => { setShowNewBookingSheet(true); } },
              { label:'Lançar Despesa', icon:<TrendingDown size={16}/>, color:'var(--m-red)', action: () => { setTab('caixa'); setTimeout(() => setShowAddTxSheet(true), 100); } },
              { label:'Novo Cliente', icon:<Users size={16}/>, color:'var(--m-blue)', action: () => { setTab('clientes'); setTimeout(() => setShowNewClientSheet(true), 100); } },
              { label:'Adicionar Foto', icon:<Camera size={16}/>, color:'var(--m-green)', action: () => setTab('galeria') }
            ].map((qa, i) => (
              <button key={i} className="m-mais-card" onClick={qa.action} style={{ alignItems:'center', flexDirection:'row', gap:10 }}>
                <div style={{ width:34, height:34, borderRadius:10, background:`${qa.color}18`, color:qa.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{qa.icon}</div>
                <span style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--m-text)', textAlign:'left' }}>{qa.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ── TAB: AGENDA ────────────────────────────────────────────────
  const renderAgenda = () => {
    const dayBookings = bookings.filter(b => b.date === currentDate);

    return (
      <div className="m-tab m-page-flush" key="agenda">
        {/* Week strip */}
        <div className="m-week-strip">
          {weekDays.map(d => {
            const dt = parseLocalDate(d);
            const dayIdx = getAdjustedDay(dt);
            const hasBk = bookings.some(b => b.date === d && b.status !== 'cancelado');
            return (
              <button key={d} className={`m-week-day ${d === currentDate ? 'active' : ''} ${hasBk ? 'has-bookings' : ''}`} onClick={() => setCurrentDate(d)}>
                <span className="m-week-day-name">{DAYS[dayIdx]}</span>
                <span className="m-week-day-num">{dt.getDate()}</span>
                <span className="m-week-day-dot"/>
              </button>
            );
          })}
        </div>

        {/* Date navigation */}
        <div className="m-agenda-date-bar">
          <button className="m-date-nav" onClick={() => animateDayChange(-1)}><ChevronLeft size={18}/></button>
          <div className="m-date-center">
            <div className="m-date-day">{fmtDate(currentDate)}</div>
          </div>
          <button className="m-date-nav" onClick={() => animateDayChange(1)}><ChevronRight size={18}/></button>
        </div>

        {/* Swipeable container */}
        <div 
          style={{ 
            flex:1, 
            display:'flex', 
            flexDirection:'column', 
            overflow:'hidden',
            position: 'relative',
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div 
            style={{ 
              flex:1, 
              display:'flex', 
              flexDirection:'column', 
              overflowY: isDragging ? 'hidden' : 'auto',
              overflowX: 'hidden',
              willChange: 'transform, opacity',
              touchAction: 'pan-y',
              ...(isDragging ? { transform: `translateX(${translateX}px)`, transition: 'none' } : slideStyle)
            }}
          >
            <div className="m-slot-list" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
              {HOURLY_SLOTS.map(slot => {
                const bk = dayBookings.find(b => {
                  if (b.status === 'cancelado') return false;
                  const bStart = timeToMin(b.time);
                  const bEnd = bStart + (b.duration || 60);
                  const slotMin = timeToMin(slot);
                  return Math.max(bStart, slotMin) < Math.min(bEnd, slotMin + 60);
                });

                const bStart = bk ? timeToMin(bk.time) : 0;
                const bEnd = bk ? bStart + (bk.duration || 60) : 0;
                const slotMin = timeToMin(slot);
                const isSubsequent = bk && bStart < slotMin;

                const displayTimeRange = bk 
                  ? `${bk.time} - ${minToTime(bEnd)}${isSubsequent ? ' (Ocupado)' : ''}`
                  : slot;

                const isDefaultLunchBlock = (slot === '12:00');
                const isUnlockedLocal = localStorage.getItem(`unlock_${currentDate}_${slot}`) === 'true';
                const isLocked = isDefaultLunchBlock && !isUnlockedLocal && !bk;

                const prof = (settings?.professionals || []).find(p => p.id === 'jon') || (settings?.professionals || [])[0] || { id: 'jon', name: 'Jon', active: true };
                const isBlockedByScale = !bk && isSlotBlocked(prof, currentDate, slot);
                const absence = !bk ? getAbsenceForSlot(getEffectiveAbsences(settings), currentDate, slot) : null;

                const dtForLabel = parseLocalDate(currentDate);
                const isSunMon = (getAdjustedDay(dtForLabel) === 0 || getAdjustedDay(dtForLabel) === 1);
                const isHolidayDay = isFeriado(currentDate);
                const blockLabel = isHolidayDay ? 'Feriado' : (isSunMon ? 'Folga' : 'Configurações de Escala');

                return (
                  <div key={slot} className="m-slot-row" onClick={() => {
                    if (bk) { setSelectedBooking(bk); setShowBookingSheet(true); }
                    else if (absence) {
                      if (window.confirm(`Este horário está bloqueado por uma ausência (${absence.title}). Deseja agendar mesmo assim?`)) {
                        setSelectedSlot(slot); setShowSlotSheet(true);
                      }
                    }
                    else if (isBlockedByScale) {
                      if (window.confirm("Este horário está bloqueado pelas configurações de escala do profissional. Deseja agendar mesmo assim?\n\n(Para liberar o horário sem agendar agora, clique em Cancelar)")) {
                        setSelectedSlot(slot); setShowSlotSheet(true);
                      } else if (window.confirm("Deseja liberar este horário (desbloquear a escala)?")) {
                        localStorage.setItem(`unlock_${currentDate}_${slot}`, 'true');
                        showToast("Horário liberado!", "success");
                        window.location.reload();
                      }
                    }
                    else { setSelectedSlot(slot); setShowSlotSheet(true); }
                  }}>
                    <div className="m-slot-time" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{displayTimeRange}</div>
                    <div className="m-slot-content">
                      {bk ? (
                        <div className={`m-slot-booking ${bk.status}`}>
                          <div>
                            <div 
                              className="m-slot-client"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFichaClient({ name: bk.clientName, phone: bk.clientPhone });
                              }}
                              style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted', position: 'relative', display: 'inline-block' }}
                            >
                              {bk.clientName}
                              {isClientRecurrent(bk.clientName, bk.clientPhone) && (
                                <span style={{
                                  position: 'absolute',
                                  top: '-2px',
                                  right: '-8px',
                                  width: '5px',
                                  height: '5px',
                                  borderRadius: '50%',
                                  backgroundColor: 'var(--m-gold, #dca354)'
                                }} />
                              )}
                            </div>
                            <div className="m-slot-svc">{bk.service?.name || bk.serviceName}</div>
                          </div>
                          <StatusPill status={bk.status}/>
                        </div>
                      ) : isLocked ? (
                        <div className="m-slot-booking bloqueado" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(235, 94, 85, 0.1)', borderLeft: '4px solid var(--m-red)', color: 'var(--m-red)' }}>
                          <div>
                            <div className="m-slot-client" style={{ color: 'var(--m-red)' }}>Bloqueio de Almoço</div>
                            <div className="m-slot-svc" style={{ color: 'rgba(235, 94, 85, 0.7)' }}>Toque para liberar horário</div>
                          </div>
                          <span className="m-status-pill bloqueado" style={{ background: 'rgba(235, 94, 85, 0.2)', color: 'var(--m-red)' }}>Bloqueado</span>
                        </div>
                      ) : absence ? (
                        <div className="m-slot-booking bloqueado" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(139, 124, 200, 0.12)', borderLeft: '4px solid #8b7cc8', color: '#8b7cc8' }}>
                          <div>
                            <div className="m-slot-client" style={{ color: '#8b7cc8', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Lock size={12} /> {absence.title}
                            </div>
                            <div className="m-slot-svc" style={{ color: 'rgba(139, 124, 200, 0.7)' }}>Ausência</div>
                          </div>
                          <span className="m-status-pill bloqueado" style={{ background: 'rgba(139, 124, 200, 0.22)', color: '#8b7cc8' }}>Ausência</span>
                        </div>
                      ) : isBlockedByScale ? (
                        <div className="m-slot-booking bloqueado" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(163, 150, 135, 0.1)', borderLeft: '4px solid #8A7866', color: '#8A7866' }}>
                          <div>
                            <div className="m-slot-client" style={{ color: '#8A7866', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Lock size={12} /> Bloqueado
                            </div>
                            <div className="m-slot-svc" style={{ color: 'rgba(138, 120, 102, 0.7)' }}>{blockLabel}</div>
                          </div>
                          <span className="m-status-pill bloqueado" style={{ background: 'rgba(138, 120, 102, 0.2)', color: '#8A7866' }}>Bloqueado</span>
                        </div>
                      ) : (
                        <span className="m-slot-empty">Disponível</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── TAB: GALERIA ───────────────────────────────────────────────
  const renderGaleria = () => {
    const filtered = galleryCategory === 'Todos'
      ? galleryPhotos
      : galleryPhotos.filter(p => p.category === galleryCategory);

    return (
      <div className="m-tab m-page-flush" key="galeria">
        {/* Category toolbar */}
        <div className="m-gallery-toolbar">
          {GALLERY_CATS.map(cat => (
            <button key={cat} className={`m-cat-chip ${galleryCategory === cat ? 'active' : ''}`} onClick={() => setGalleryCategory(cat)}>{cat}</button>
          ))}
        </div>

        {/* Upload progress */}
        {isUploading && (
          <div style={{ padding:'0 16px 8px' }}>
            <div className={`m-upload-status ${uploadStatus}`}>
              {uploadStatus === 'storage' && <><RefreshCw size={14} style={{ animation:'mSpin 0.8s linear infinite' }}/> Enviando para Storage... {uploadProgress}%</>}
              {uploadStatus === 'google' && <><RefreshCw size={14} style={{ animation:'mSpin 0.8s linear infinite' }}/> Publicando no Google Business...</>}
              {uploadStatus === 'done' && <><CheckCircle size={14}/> Upload concluído!</>}
              {uploadStatus === 'error' && <><AlertCircle size={14}/> Erro no upload</>}
            </div>
            <div className="m-upload-progress-bar" style={{ marginTop:6 }}>
              <div className="m-upload-progress-fill" style={{ width:`${uploadProgress}%` }}/>
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="m-gallery-grid" style={{ padding:'2px' }}>
          {/* Upload button */}
          <div className="m-gallery-upload-zone" onClick={() => galleryInputRef.current?.click()}>
            <Camera size={22}/>
            <span>Adicionar Foto/Vídeo</span>
          </div>
          <input ref={galleryInputRef} type="file" accept="image/*,video/*" style={{ display:'none' }} onChange={handleGalleryFileSelect}/>

          {filtered.map(photo => (
            <div key={photo.id} className="m-gallery-item" onClick={() => setPreviewPhoto(photo)}>
              {photo.type === 'video' ? (
                <div style={{ width:'100%', height:'100%', position:'relative', background:'#000', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <video src={photo.url} style={{ width:'100%', height:'100%', objectFit:'cover' }} muted playsInline />
                  <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.3)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#fff' }}><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                  </div>
                </div>
              ) : (
                <img src={photo.url} alt={photo.caption || photo.category} loading="lazy"/>
              )}
              <div className="m-gallery-cat-badge">{photo.category}</div>
              {photo.googlePosted && (
                <div style={{ position:'absolute', top:4, right:4, background:'rgba(14,12,11,0.8)', borderRadius:4, padding:'2px 4px', fontSize:'0.5rem', color:'#4285f4', fontWeight:800, backdropFilter:'blur(4px)' }}>G</div>
              )}
            </div>
          ))}

          {filtered.length === 0 && !isUploading && (
            <div style={{ gridColumn:'1/-1', padding:'40px 24px', textAlign:'center', color:'var(--m-muted)', fontSize:'0.82rem' }}>
              <Image size={32} style={{ opacity:0.3, marginBottom:10 }}/>
              <div>Nenhuma foto nesta categoria</div>
              <div style={{ fontSize:'0.72rem', marginTop:4 }}>Toque em "Adicionar Foto" para publicar</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── TAB: CLIENTES ──────────────────────────────────────────────
  const renderClientes = () => {
    const filtered = clients.filter(c =>
      !clientSearch || c.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.phone?.includes(clientSearch)
    ).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR'));

    const getClientVisits = (c) => bookings.filter(b =>
      (b.clientPhone && b.clientPhone === c.phone) || b.clientName === c.name
    );

    return (
      <div className="m-tab m-page-flush" key="clientes">
        <div className="m-search-bar">
          <Search size={16} color="var(--m-muted)"/>
          <input className="m-search-input" placeholder="Buscar clientes..." value={clientSearch} onChange={e => setClientSearch(e.target.value)}/>
          {clientSearch && <button onClick={() => setClientSearch('')} style={{ background:'none', border:'none', color:'var(--m-muted)', cursor:'pointer', padding:0, display:'flex' }}><X size={14}/></button>}
        </div>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px 4px' }}>
          <span style={{ fontSize:'0.72rem', color:'var(--m-muted)', fontWeight:700 }}>{filtered.length} clientes</span>
          <button className="m-btn m-btn-gold" style={{ width:'auto', padding:'7px 14px', fontSize:'0.75rem' }} onClick={() => setShowNewClientSheet(true)}>
            <Plus size={14}/> Novo
          </button>
        </div>

        <div style={{ flex:1, overflowY:'auto' }}>
          {filtered.map(c => {
            const visits = getClientVisits(c);
            const lastVisit = visits.filter(v => v.status === 'finalizado').sort((a,b) => (b.date || '').localeCompare(a.date || ''))[0];
            return (
              <div key={c.id} className="m-client-card" onClick={() => { setSelectedClient(c); setShowClientSheet(true); }}>
                <div className="m-client-avatar">{initials(c.name)}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div className="m-client-name">{c.name}</div>
                  <div className="m-client-meta">
                    {c.curvatura && <span className="m-tag muted" style={{ marginRight:4 }}>{c.curvatura}</span>}
                    {c.phone && c.phone}
                  </div>
                  {lastVisit && <div style={{ fontSize:'0.65rem', color:'var(--m-muted)', marginTop:2 }}>Última visita: {fmtDate(lastVisit.date)}</div>}
                </div>
                <ChevronRight size={14} color="var(--m-muted)"/>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="m-empty">
              <Users className="m-empty-icon" size={32}/>
              <div className="m-empty-title">Nenhum cliente encontrado</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── TAB: CAIXA ─────────────────────────────────────────────────
  const renderCaixa = () => {
    const txMonth = (() => {
      const m = new Date().toISOString().slice(0,7);
      return transactions.filter(t => (t.date || '').startsWith(m));
    })();
    const monthIn = txMonth.filter(t => t.type === 'entrada').reduce((s,t) => s + Number(t.value||0), 0);
    const monthOut = txMonth.filter(t => t.type === 'saida').reduce((s,t) => s + Number(t.value||0), 0);
    const profit = monthIn - monthOut;

    // Last 6 days revenue for mini chart
    const last6 = Array.from({ length:6 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (5 - i));
      const ds = dateStr(d);
      const val = transactions.filter(t => t.date === ds && t.type === 'entrada').reduce((s,t) => s + Number(t.value||0), 0);
      return { label: d.toLocaleDateString('pt-BR', { day:'numeric', month:'numeric' }).replace('/','\/'), val, isToday: ds === today() };
    });
    const maxVal = Math.max(...last6.map(d => d.val), 1);

    const recentTx = transactions
      .sort((a,b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || '').localeCompare(a.createdAt || ''))
      .slice(0, 15);

    return (
      <div className="m-tab m-page" key="caixa">
        {/* Segmented */}
        <div className="m-segmented">
          <button className={`m-seg-btn ${financeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setFinanceTab('dashboard')}>Dashboard</button>
          <button className={`m-seg-btn ${financeTab === 'lancamentos' ? 'active' : ''}`} onClick={() => setFinanceTab('lancamentos')}>Lançamentos</button>
        </div>

        {financeTab === 'dashboard' && <>
          {/* Hero */}
          <div className="m-finance-hero">
            <div className="m-finance-hero-label">Receita do Mês</div>
            <div className="m-finance-hero-value">{fmt(monthIn)}</div>
            <div className="m-finance-hero-sub">Lucro líquido: <strong style={{ color: profit >= 0 ? 'var(--m-green)' : 'var(--m-red)' }}>{fmt(profit)}</strong></div>
          </div>

          {/* KPIs */}
          <div className="m-kpi-row">
            <div className="m-kpi-card green">
              <div className="m-kpi-label">Receitas</div>
              <div className="m-kpi-value" style={{ color:'var(--m-green)', fontSize:'1.1rem' }}>{fmt(monthIn)}</div>
            </div>
            <div className="m-kpi-card red">
              <div className="m-kpi-label">Despesas</div>
              <div className="m-kpi-value" style={{ color:'var(--m-red)', fontSize:'1.1rem' }}>{fmt(monthOut)}</div>
            </div>
          </div>

          {/* Mini bar chart */}
          <div style={{ background:'var(--m-card)', border:'0.5px solid var(--m-rule)', borderRadius:'var(--m-radius)', padding:'16px' }}>
            <div className="m-section-title" style={{ marginBottom:16 }}>Últimos 6 dias</div>
            <div className="m-bar-chart">
              {last6.map((d, i) => (
                <div key={i} className={`m-bar ${d.isToday ? 'current' : ''}`} style={{ height:`${(d.val/maxVal)*100}%` }}>
                  <span className="m-bar-label">{d.label}</span>
                </div>
              ))}
            </div>
          </div>

          <button className="m-btn m-btn-gold" onClick={() => setShowAddTxSheet(true)}>
            <Plus size={16}/> Lançar Despesa
          </button>
        </>}

        {financeTab === 'lancamentos' && <>
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <button className="m-btn m-btn-gold" style={{ width:'auto', padding:'8px 14px', fontSize:'0.78rem' }} onClick={() => setShowAddTxSheet(true)}>
              <Plus size={14}/> Lançar
            </button>
          </div>
          {recentTx.map(t => (
            <div key={t.id} className="m-tx-row">
              <div className={`m-tx-dot ${t.type}`}>
                {t.type === 'entrada' ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
              </div>
              <div className="m-tx-info">
                <div className="m-tx-desc">{t.description}</div>
                <div className="m-tx-meta">{fmtDate(t.date)} · {t.paymentMethod}</div>
              </div>
              <div className={`m-tx-amount ${t.type}`}>{t.type === 'entrada' ? '+' : '-'}{fmt(t.value)}</div>
            </div>
          ))}
          {recentTx.length === 0 && (
            <div className="m-empty">
              <DollarSign className="m-empty-icon" size={32}/>
              <div className="m-empty-title">Nenhum lançamento</div>
            </div>
          )}
        </>}
      </div>
    );
  };

  // ── TAB: MAIS ──────────────────────────────────────────────────
  const renderMais = () => {
    if (maisSection) {
      return renderMaisSection(maisSection);
    }

    const items = [
      { key:'servicos', icon:<Scissors size={18}/>, label:'Serviços', sub:`${services.length} serviços`, color:'var(--m-gold)' },
      { key:'estoque', icon:<Package size={18}/>, label:'Estoque', sub:`${inventory.length} produtos`, color:'var(--m-blue)' },
      { key:'comissoes', icon:<BarChart2 size={18}/>, label:'Comissões', sub:'Relatório de equipe', color:'var(--m-green)' },
      { key:'ausencias', icon:<Calendar size={18}/>, label:'Minhas Ausências', sub:'Folgas e bloqueios', color:'#8b7cc8' },
      { key:'marketing', icon:<Send size={18}/>, label:'Marketing', sub:'Campanhas e CRM', color:'var(--m-amber)' },
      { key:'config', icon:<Settings size={18}/>, label:'Configurações', sub:'Estúdio e integrações', color:'var(--m-muted)' },
    ];

    return (
      <div className="m-tab m-page" key="mais">
        <div style={{ fontSize:'1.2rem', fontWeight:800, fontFamily:'"DM Serif Display", serif', color:'var(--m-text)' }}>Mais opções</div>
        <div className="m-mais-grid">
          {items.map(item => (
            <button key={item.key} className="m-mais-card" onClick={() => setMaisSection(item.key)}>
              <div className="m-mais-icon" style={{ background:`${item.color}18`, color:item.color }}>
                {item.icon}
              </div>
              <div>
                <div className="m-mais-card-label">{item.label}</div>
                <div className="m-mais-card-sub">{item.sub}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Profile card */}
        <div style={{ background:'var(--m-card)', border:'0.5px solid var(--m-rule)', borderRadius:'var(--m-radius)', padding:'14px', display:'flex', alignItems:'center', gap:12, marginTop:4 }}>
          <img src="/jon-perfil.webp" alt="Jon" style={{ width:44, height:44, borderRadius:'50%', border:'0.5px solid var(--m-rule-strong)', objectFit:'cover' }} onError={e => { e.target.src = 'https://ui-avatars.com/api/?name=Jon&background=DCA354&color=0E0C0B&bold=true'; }}/>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:800, color:'var(--m-text)', fontSize:'0.9rem' }}>Jonatan</div>
            <div style={{ fontSize:'0.7rem', color:'var(--m-muted)' }}>Administrador</div>
          </div>
          <button className="m-btn m-btn-outline m-btn-sm" style={{ width:'auto', gap:6 }} onClick={async () => { await signOut(auth).catch(() => {}); navigate('/admin/login'); }}>
            <LogOut size={14}/> Sair
          </button>
        </div>
      </div>
    );
  };

  // ── Mais sections ──────────────────────────────────────────────
  const renderMaisSection = (section) => {
    const MaisHeader = ({ title }) => (
      <div style={{ display:'flex', alignItems:'center', gap:12, paddingBottom:4 }}>
        <button onClick={() => setMaisSection(null)} className="m-header-back" style={{ background:'none', border:'none', color:'var(--m-gold)', cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontWeight:700, fontSize:'0.85rem', fontFamily:'inherit' }}>
          <ChevronLeft size={16}/> Voltar
        </button>
        <div style={{ fontSize:'1rem', fontWeight:800, fontFamily:'"DM Serif Display", serif', color:'var(--m-text)' }}>{title}</div>
      </div>
    );

    if (section === 'ausencias') {
      const DAYS_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const customAbsences = settings?.absences || [];
      const fixedAbsences = getEffectiveAbsences(settings).filter(a => a.fixed);

      const summary = (a) => {
        const timePart = a.allDay ? 'Dia inteiro' : `${a.startTime} às ${a.endTime}`;
        if (a.recurrence === 'weekly') {
          const wd = (a.weekday !== undefined && a.weekday !== null) ? Number(a.weekday) : getAdjustedDay(parseLocalDate(a.startDate));
          return `Toda ${DAYS_FULL[wd]} · ${timePart}`;
        }
        if (a.recurrence === 'monthly') {
          return `Todo dia ${parseLocalDate(a.startDate).getDate()} do mês · ${timePart}`;
        }
        const datePart = a.endDate ? `${fmtDate(a.startDate)} até ${fmtDate(a.endDate)}` : fmtDate(a.startDate);
        return `${datePart} · ${timePart}`;
      };

      return (
        <div className="m-tab m-page" key="ausencias">
          <MaisHeader title="Minhas Ausências"/>

          <button className="m-btn m-btn-gold" onClick={openNewAbsence} style={{ gap:8 }}>
            <Plus size={16}/> Nova Ausência
          </button>

          {fixedAbsences.map(a => (
            <div key={a.id} style={{ background:'var(--m-card)', border:'0.5px solid var(--m-rule)', borderRadius:'var(--m-radius)', padding:'13px 14px', display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:38, height:38, borderRadius:10, background:'rgba(139,124,200,0.14)', color:'#8b7cc8', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Lock size={16}/></div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, color:'var(--m-text)', fontSize:'0.88rem' }}>{a.title}</div>
                <div style={{ fontSize:'0.72rem', color:'var(--m-muted)', marginTop:2 }}>{summary(a)}</div>
              </div>
              <span style={{ fontSize:'0.62rem', fontWeight:700, color:'#8b7cc8', background:'rgba(139,124,200,0.14)', padding:'3px 8px', borderRadius:20, textTransform:'uppercase', letterSpacing:'0.5px', flexShrink:0 }}>Fixo</span>
            </div>
          ))}

          {customAbsences.map(a => (
            <div key={a.id} style={{ background:'var(--m-card)', border:'0.5px solid var(--m-rule)', borderRadius:'var(--m-radius)', padding:'13px 14px', display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:38, height:38, borderRadius:10, background:'rgba(139,124,200,0.14)', color:'#8b7cc8', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Calendar size={16}/></div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, color:'var(--m-text)', fontSize:'0.88rem' }}>{a.title}</div>
                <div style={{ fontSize:'0.72rem', color:'var(--m-muted)', marginTop:2 }}>{summary(a)}</div>
              </div>
              <button onClick={() => openEditAbsence(a)} className="m-icon-btn" style={{ flexShrink:0 }}><Edit3 size={16}/></button>
              <button onClick={() => deleteAbsence(a.id)} className="m-icon-btn" style={{ flexShrink:0, color:'var(--m-red)' }}><Trash2 size={16}/></button>
            </div>
          ))}

          {customAbsences.length === 0 && (
            <div className="m-empty"><Calendar className="m-empty-icon" size={32}/><div className="m-empty-title">Nenhuma ausência cadastrada</div></div>
          )}
        </div>
      );
    }

    if (section === 'servicos') {
      const cats = ['Todos', ...new Set(services.map(s => s.category).filter(Boolean))];
      return (
        <div className="m-tab m-page" key="servicos">
          <MaisHeader title="Serviços"/>
          {services.map(s => (
            <div key={s.id} style={{ background:'var(--m-card)', border:'0.5px solid var(--m-rule)', borderRadius:'var(--m-radius)', padding:'13px 14px', display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:38, height:38, borderRadius:10, background:'var(--m-gold-subtle)', color:'var(--m-gold)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Scissors size={16}/></div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, color:'var(--m-text)', fontSize:'0.88rem' }}>{s.name}</div>
                <div style={{ fontSize:'0.72rem', color:'var(--m-muted)', marginTop:2 }}>{s.category} · {s.duration}min</div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                {s.promoPrice ? <>
                  <div style={{ fontWeight:800, color:'var(--m-gold)', fontSize:'0.88rem', fontFamily:'"DM Serif Display", serif' }}>{fmt(s.promoPrice)}</div>
                  <div style={{ fontSize:'0.65rem', color:'var(--m-muted)', textDecoration:'line-through' }}>{fmt(s.price)}</div>
                </> : <div style={{ fontWeight:800, color:'var(--m-text)', fontSize:'0.88rem', fontFamily:'"DM Serif Display", serif' }}>{fmt(s.price)}</div>}
              </div>
            </div>
          ))}
          {services.length === 0 && <div className="m-empty"><Scissors className="m-empty-icon" size={32}/><div className="m-empty-title">Nenhum serviço cadastrado</div></div>}
        </div>
      );
    }

    if (section === 'estoque') {
      const lowStock = inventory.filter(p => p.quantity <= (p.minStock || 3));
      return (
        <div className="m-tab m-page" key="estoque">
          <MaisHeader title="Estoque"/>
          {lowStock.length > 0 && (
            <div style={{ background:'var(--m-amber-bg)', border:'0.5px solid var(--m-amber)', borderRadius:'var(--m-radius)', padding:'12px 14px' }}>
              <div style={{ fontSize:'0.72rem', fontWeight:800, color:'var(--m-amber)', textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:4 }}>⚠️ Estoque Baixo</div>
              {lowStock.map(p => <div key={p.id} style={{ fontSize:'0.82rem', color:'var(--m-text)', fontWeight:600 }}>{p.name} — {p.quantity} un.</div>)}
            </div>
          )}
          {inventory.map(p => (
            <div key={p.id} style={{ background:'var(--m-card)', border:'0.5px solid var(--m-rule)', borderRadius:'var(--m-radius)', padding:'13px 14px', display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:38, height:38, borderRadius:10, background:'var(--m-blue-bg)', color:'var(--m-blue)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Package size={16}/></div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:'0.88rem', color:'var(--m-text)' }}>{p.name}</div>
                <div style={{ fontSize:'0.72rem', color:'var(--m-muted)', marginTop:2 }}>{p.category} · Venda: {fmt(p.sellingPrice)}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontWeight:800, fontSize:'1.1rem', fontFamily:'"DM Serif Display", serif', color: p.quantity <= (p.minStock||3) ? 'var(--m-red)' : 'var(--m-green)' }}>{p.quantity}</div>
                <div style={{ fontSize:'0.62rem', color:'var(--m-muted)' }}>un. estoque</div>
              </div>
            </div>
          ))}
          {inventory.length === 0 && <div className="m-empty"><Package className="m-empty-icon" size={32}/><div className="m-empty-title">Nenhum produto</div></div>}
        </div>
      );
    }

    if (section === 'comissoes') {
      const profName = settings?.profissional || 'Jonatan';
      const monthBk = bookings.filter(b => {
        const m = new Date().toISOString().slice(0,7);
        return (b.date || '').startsWith(m) && b.status === 'finalizado';
      });
      const monthRev = monthBk.reduce((s, b) => s + Number(b.finalValue || b.servicePrice || 0), 0);
      const commission = monthRev * 0.5;

      return (
        <div className="m-tab m-page" key="comissoes">
          <MaisHeader title="Comissões"/>
          <div className="m-finance-hero">
            <div className="m-finance-hero-label">Comissão do Mês — {profName}</div>
            <div className="m-finance-hero-value">{fmt(commission)}</div>
            <div className="m-finance-hero-sub">50% sobre {fmt(monthRev)} em serviços</div>
          </div>
          <div className="m-kpi-row">
            <div className="m-kpi-card">
              <div className="m-kpi-label">Atendimentos</div>
              <div className="m-kpi-value">{monthBk.length}</div>
            </div>
            <div className="m-kpi-card green">
              <div className="m-kpi-label">Receita Bruta</div>
              <div className="m-kpi-value" style={{ color:'var(--m-green)', fontSize:'1rem' }}>{fmt(monthRev)}</div>
            </div>
          </div>
          <div style={{ background:'var(--m-card)', border:'0.5px solid var(--m-rule)', borderRadius:'var(--m-radius)', padding:'14px' }}>
            <div className="m-section-title" style={{ marginBottom:12 }}>Atendimentos Finalizados</div>
            {monthBk.slice(0,10).map(b => (
              <div key={b.id} className="m-info-row">
                <div style={{ flex:1 }}>
                  <div className="m-info-value" style={{ fontSize:'0.82rem' }}>{b.clientName}</div>
                  <div style={{ fontSize:'0.68rem', color:'var(--m-muted)' }}>{fmtDate(b.date)} · {b.service?.name || b.serviceName}</div>
                </div>
                <div style={{ fontWeight:800, color:'var(--m-green)', fontSize:'0.82rem', fontFamily:'"DM Serif Display", serif' }}>{fmt((b.finalValue || b.servicePrice || 0) * 0.5)}</div>
              </div>
            ))}
            {monthBk.length === 0 && <div style={{ color:'var(--m-muted)', fontSize:'0.82rem', textAlign:'center', padding:'16px 0' }}>Nenhum atendimento finalizado este mês</div>}
          </div>
        </div>
      );
    }

    if (section === 'marketing') {
      return (
        <div className="m-tab m-page" key="marketing">
          <MaisHeader title="Marketing CRM"/>
          <div style={{ background:'var(--m-card)', border:'0.5px solid var(--m-rule)', borderRadius:'var(--m-radius)', padding:'16px' }}>
            <div className="m-section-title" style={{ marginBottom:12 }}>Estatísticas de Clientes</div>
            {[
              { label:'Total de Clientes', val: clients.length },
              { label:'Ativos (últ. 30 dias)', val: clients.filter(c => bookings.some(b => b.clientName === c.name && b.date >= dateStr(new Date(Date.now() - 30*864e5)))).length },
              { label:'Inativos (+60 dias)', val: clients.filter(c => !bookings.some(b => b.clientName === c.name && b.date >= dateStr(new Date(Date.now() - 60*864e5)))).length },
            ].map((stat, i) => (
              <div key={i} className="m-info-row">
                <span className="m-info-label">{stat.label}</span>
                <span className="m-info-value">{stat.val}</span>
              </div>
            ))}
          </div>

          <div style={{ background:'var(--m-card)', border:'0.5px solid var(--m-rule)', borderRadius:'var(--m-radius)', padding:'16px' }}>
            <div className="m-section-title" style={{ marginBottom:12 }}>Envio em Massa (WhatsApp)</div>
            <div style={{ fontSize:'0.8rem', color:'var(--m-muted)', lineHeight:1.5 }}>
              Para campanhas avançadas de WhatsApp, acesse o painel web completo em <strong style={{ color:'var(--m-gold)' }}>ojonquecortou.com.br/admin/marketing</strong>
            </div>
            <button className="m-btn m-btn-outline" style={{ marginTop:12 }} onClick={() => window.open('https://www.ojonquecortou.com.br/admin/marketing', '_blank')}>
              <ArrowRight size={14}/> Abrir Painel Web
            </button>
          </div>
        </div>
      );
    }

    if (section === 'config') {
      return (
        <div className="m-tab m-page" key="config">
          <MaisHeader title="Configurações"/>
          <div style={{ background:'var(--m-card)', border:'0.5px solid var(--m-rule)', borderRadius:'var(--m-radius)', padding:'16px' }}>
            <div className="m-section-title" style={{ marginBottom:12 }}>Dados do Estúdio</div>
            {[
              { label:'Nome', val: settings?.name || '—' },
              { label:'Telefone', val: settings?.phone || '—' },
              { label:'Endereço', val: settings?.address || '—' },
              { label:'Instagram', val: settings?.instagram || '—' },
            ].map((item, i) => (
              <div key={i} className="m-info-row">
                <span className="m-info-label">{item.label}</span>
                <span className="m-info-value" style={{ fontSize:'0.78rem', maxWidth:'60%', textAlign:'right', wordBreak:'break-all' }}>{item.val}</span>
              </div>
            ))}
          </div>

          <div style={{ background:'var(--m-card)', border:'0.5px solid var(--m-rule)', borderRadius:'var(--m-radius)', padding:'16px' }}>
            <div className="m-section-title" style={{ marginBottom:12 }}>Taxas de Pagamento</div>
            {[
              { label:'Pix', val: `${settings?.feePix || 0}%` },
              { label:'Débito', val: `${settings?.feeDebit || 1.9}%` },
              { label:'Crédito', val: `${settings?.feeCredit || 3.5}%` },
            ].map((item, i) => (
              <div key={i} className="m-info-row">
                <span className="m-info-label">{item.label}</span>
                <span className="m-info-value">{item.val}</span>
              </div>
            ))}
          </div>

          {/* Recurring Blocks */}
          <div style={{ background:'var(--m-card)', border:'0.5px solid var(--m-rule)', borderRadius:'var(--m-radius)', padding:'16px' }}>
            <div className="m-section-title" style={{ marginBottom:12 }}>Bloqueios Recorrentes (Semanais)</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:16 }}>
              <div style={{ display:'flex', gap:8 }}>
                <select 
                  value={mBlockWeekday} 
                  onChange={e => setMBlockWeekday(e.target.value)}
                  style={{ flex:1.5, background:'var(--m-bg)', color:'var(--m-text)', border:'0.5px solid var(--m-rule)', borderRadius:8, padding:8, fontSize:'0.8rem' }}
                >
                  <option value="0">Domingo</option>
                  <option value="1">Segunda</option>
                  <option value="2">Terça</option>
                  <option value="3">Quarta</option>
                  <option value="4">Quinta</option>
                  <option value="5">Sexta</option>
                  <option value="6">Sábado</option>
                </select>
                <select 
                  value={mBlockWeekdayStart} 
                  onChange={e => setMBlockWeekdayStart(e.target.value)}
                  style={{ flex:1, background:'var(--m-bg)', color:'var(--m-text)', border:'0.5px solid var(--m-rule)', borderRadius:8, padding:8, fontSize:'0.8rem' }}
                >
                  {SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <span style={{ alignSelf:'center', fontSize:'0.75rem', color:'var(--m-muted)' }}>às</span>
                <select 
                  value={mBlockWeekdayEnd} 
                  onChange={e => setMBlockWeekdayEnd(e.target.value)}
                  style={{ flex:1, background:'var(--m-bg)', color:'var(--m-text)', border:'0.5px solid var(--m-rule)', borderRadius:8, padding:8, fontSize:'0.8rem' }}
                >
                  {SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <button 
                className="m-btn" 
                style={{ width:'100%', background:'var(--m-gold)', color:'#000', fontWeight:700, padding:'8px 0', fontSize:'0.8rem', borderRadius:8 }} 
                onClick={addRecurringBlock}
              >
                Bloquear Horário
              </button>
            </div>
            
            {/* List */}
            <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:180, overflowY:'auto' }}>
              {(() => {
                const profs = settings.professionals || [];
                const jonProf = profs.find(p => p.id === 'jon') || profs[0];
                const list = jonProf?.blockedWeekdayHours || [];
                if (list.length === 0) {
                  return <div style={{ fontSize:'0.75rem', color:'var(--m-muted)', textAlign:'center', padding:'10px 0' }}>Nenhum bloqueio recorrente configurado.</div>;
                }
                const DAYS_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                // Sort by day then by time
                const sorted = [...list].sort((a, b) => a.localeCompare(b));
                return sorted.map(item => {
                  const parts = item.split('-');
                  const weekday = DAYS_NAMES[Number(parts[0])];
                  const start = parts[1];
                  const end = parts[2] || parts[1];
                  return (
                    <div key={item} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--m-bg)', padding:'8px 12px', borderRadius:8, border:'0.5px solid var(--m-rule)' }}>
                      <span style={{ fontSize:'0.8rem', fontWeight:600 }}>{weekday} · {start} às {end}</span>
                      <button 
                        onClick={() => removeRecurringBlock(item)} 
                        style={{ background:'none', border:'none', color:'var(--m-red)', cursor:'pointer', fontWeight:700, fontSize:'0.8rem' }}
                      >
                        Remover
                      </button>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Specific Blocks */}
          <div style={{ background:'var(--m-card)', border:'0.5px solid var(--m-rule)', borderRadius:'var(--m-radius)', padding:'16px' }}>
            <div className="m-section-title" style={{ marginBottom:12 }}>Bloqueios Pontuais (Data/Hora)</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:16 }}>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <input 
                  type="date" 
                  value={mBlockSpecificDate}
                  onChange={e => setMBlockSpecificDate(e.target.value)}
                  style={{ width:'100%', background:'var(--m-bg)', color:'var(--m-text)', border:'0.5px solid var(--m-rule)', borderRadius:8, padding:8, fontSize:'0.8rem', boxSizing:'border-box' }}
                />
                <div style={{ display:'flex', gap:8 }}>
                  <select 
                    value={mBlockSpecificStart} 
                    onChange={e => setMBlockSpecificStart(e.target.value)}
                    style={{ flex:1, background:'var(--m-bg)', color:'var(--m-text)', border:'0.5px solid var(--m-rule)', borderRadius:8, padding:8, fontSize:'0.8rem' }}
                  >
                    {SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span style={{ alignSelf:'center', fontSize:'0.75rem', color:'var(--m-muted)' }}>às</span>
                  <select 
                    value={mBlockSpecificEnd} 
                    onChange={e => setMBlockSpecificEnd(e.target.value)}
                    style={{ flex:1, background:'var(--m-bg)', color:'var(--m-text)', border:'0.5px solid var(--m-rule)', borderRadius:8, padding:8, fontSize:'0.8rem' }}
                  >
                    {SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <button 
                className="m-btn" 
                style={{ width:'100%', background:'var(--m-gold)', color:'#000', fontWeight:700, padding:'8px 0', fontSize:'0.8rem', borderRadius:8 }} 
                onClick={addSpecificBlock}
              >
                Bloquear Horário
              </button>
            </div>
            
            {/* List */}
            <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:180, overflowY:'auto' }}>
              {(() => {
                const profs = settings.professionals || [];
                const jonProf = profs.find(p => p.id === 'jon') || profs[0];
                const list = jonProf?.blockedSpecificHours || [];
                if (list.length === 0) {
                  return <div style={{ fontSize:'0.75rem', color:'var(--m-muted)', textAlign:'center', padding:'10px 0' }}>Nenhum bloqueio pontual configurado.</div>;
                }
                const sorted = [...list].sort((a, b) => a.localeCompare(b));
                return sorted.map(item => {
                  // format: YYYY-MM-DD-HH:MM-HH:MM
                  const datePart = item.substring(0, 10);
                  const rest = item.substring(11);
                  const restParts = rest.split('-');
                  const start = restParts[0];
                  const end = restParts[1] || restParts[0];
                  const formattedD = datePart.split('-').reverse().join('/');
                  return (
                    <div key={item} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--m-bg)', padding:'8px 12px', borderRadius:8, border:'0.5px solid var(--m-rule)' }}>
                      <span style={{ fontSize:'0.8rem', fontWeight:600 }}>{formattedD} · {start} às {end}</span>
                      <button 
                        onClick={() => removeSpecificBlock(item)} 
                        style={{ background:'none', border:'none', color:'var(--m-red)', cursor:'pointer', fontWeight:700, fontSize:'0.8rem' }}
                      >
                        Remover
                      </button>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          <button className="m-btn m-btn-outline" onClick={() => window.open('https://www.ojonquecortou.com.br/admin/configuracoes', '_blank')}>
            <Settings size={14}/> Configurações Completas (Web)
          </button>
        </div>
      );
    }

    return null;
  };

  // ═══════════════════════════════════════════════════════════════
  // MODALS / SHEETS
  // ═══════════════════════════════════════════════════════════════

  // ── Booking Detail Sheet ───────────────────────────────────────
  const renderBookingSheet = () => {
    if (!selectedBooking || !showBookingSheet) return null;
    const b = selectedBooking;
    const svcPrice = b.service?.promoPrice || b.service?.price || b.servicePrice || 0;

    if (b.status === 'bloqueado') {
      return (
        <div className="m-overlay" onClick={() => setShowBookingSheet(false)}>
          <div className="m-sheet" onClick={e => e.stopPropagation()}>
            <div className="m-sheet-handle"/>
            <div className="m-sheet-header">
              <div className="m-sheet-title">Horário Bloqueado</div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span className="m-status-pill bloqueado" style={{ background: 'rgba(138, 120, 102, 0.2)', color: '#8A7866' }}>Bloqueado</span>
                <button onClick={() => setShowBookingSheet(false)} className="m-icon-btn"><X size={18}/></button>
              </div>
            </div>
            <div className="m-sheet-body">
              <div style={{ background:'var(--m-card)', borderRadius:'var(--m-radius)', padding:'14px', marginBottom: 16 }}>
                <div className="m-info-row">
                  <span className="m-info-label">Horário</span>
                  <span className="m-info-value">{`${fmtDate(b.date)} às ${b.time || '—'}`}</span>
                </div>
                <div className="m-info-row">
                  <span className="m-info-label">Duração</span>
                  <span className="m-info-value">{b.duration || 60} minutos</span>
                </div>
                {b.notes && (
                  <div className="m-info-row">
                    <span className="m-info-label">Motivo</span>
                    <span className="m-info-value">{b.notes}</span>
                  </div>
                )}
              </div>
              <div className="m-action-list">
                <button className="m-action-btn" onClick={() => changeStatus(b.id, 'cancelado')}>
                  <div className="m-action-btn-icon" style={{ background:'var(--m-green-bg)', color:'var(--m-green)' }}><Check size={16}/></div>
                  <div className="m-action-btn-text">
                    <div className="m-action-btn-label">Liberar Horário / Desbloquear</div>
                    <div className="m-action-btn-sub">Permitir novos agendamentos neste horário</div>
                  </div>
                  <ChevronRight size={14} color="var(--m-muted)"/>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="m-overlay" onClick={() => setShowBookingSheet(false)}>
        <div className="m-sheet" onClick={e => e.stopPropagation()}>
          <div className="m-sheet-handle"/>
          <div className="m-sheet-header">
            <div className="m-sheet-title">{b.clientName}</div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <StatusPill status={b.status}/>
              <button onClick={() => setShowBookingSheet(false)} className="m-icon-btn"><X size={18}/></button>
            </div>
          </div>
          <div className="m-sheet-body">
            <div style={{ background:'var(--m-card)', borderRadius:'var(--m-radius)', padding:'14px' }}>
              {[
                { label:'Serviço', val: b.service?.name || b.serviceName || '—' },
                { label:'Horário', val: `${fmtDate(b.date)} às ${b.time || '—'}` },
                { label:'Valor', val: fmt(svcPrice) },
                { label:'Telefone', val: b.clientPhone || '—' },
                b.notes ? { label:'Obs.', val: b.notes } : null
              ].filter(Boolean).map((row, i) => (
                <div key={i} className="m-info-row">
                  <span className="m-info-label">{row.label}</span>
                  <span className="m-info-value" style={{ maxWidth:'55%', textAlign:'right', wordBreak:'break-word' }}>{row.val}</span>
                </div>
              ))}
            </div>

            <div className="m-action-list">
              {b.status === 'pendente' && (
                <button className="m-action-btn" onClick={() => changeStatus(b.id, 'confirmado')}>
                  <div className="m-action-btn-icon" style={{ background:'var(--m-blue-bg)', color:'var(--m-blue)' }}><Check size={16}/></div>
                  <div className="m-action-btn-text">
                    <div className="m-action-btn-label">Confirmar Agendamento</div>
                    <div className="m-action-btn-sub">Notifica o cliente</div>
                  </div>
                  <ChevronRight size={14} color="var(--m-muted)"/>
                </button>
              )}
              {['confirmado','pendente'].includes(b.status) && (
                <button className="m-action-btn" onClick={() => openCheckout(b)}>
                  <div className="m-action-btn-icon" style={{ background:'var(--m-gold-subtle)', color:'var(--m-gold)' }}><DollarSign size={16}/></div>
                  <div className="m-action-btn-text">
                    <div className="m-action-btn-label">Fechar Comanda</div>
                    <div className="m-action-btn-sub">Registrar pagamento</div>
                  </div>
                  <ChevronRight size={14} color="var(--m-muted)"/>
                </button>
              )}
              {b.status === 'finalizado' && (
                <button className="m-action-btn" onClick={() => openCheckout(b)}>
                  <div className="m-action-btn-icon" style={{ background:'var(--m-gold-subtle)', color:'var(--m-gold)' }}><DollarSign size={16}/></div>
                  <div className="m-action-btn-text">
                    <div className="m-action-btn-label">Ver / Editar Comanda</div>
                    <div className="m-action-btn-sub">Ver ou editar os detalhes financeiros</div>
                  </div>
                  <ChevronRight size={14} color="var(--m-muted)"/>
                </button>
              )}
              {b.status !== 'cancelado' && b.status !== 'finalizado' && (
                <button className="m-action-btn" onClick={() => {
                  setEditBookingForm({
                    id: b.id,
                    clientName: b.clientName,
                    clientPhone: b.clientPhone || '',
                    serviceName: b.serviceName || b.service?.name || '',
                    servicePrice: b.servicePrice !== undefined ? b.servicePrice : (b.service?.promoPrice || b.service?.price || ''),
                    date: b.date,
                    time: b.time || '09:00',
                    prepayment: b.prepayment || '',
                    notes: b.notes || '',
                    status: b.status || 'confirmado'
                  });
                  setShowBookingSheet(false);
                  setShowEditBookingSheet(true);
                }}>
                  <div className="m-action-btn-icon" style={{ background:'var(--m-blue-bg)', color:'var(--m-blue)' }}><Edit3 size={16}/></div>
                  <div className="m-action-btn-text">
                    <div className="m-action-btn-label">Remarcar / Editar</div>
                    <div className="m-action-btn-sub">Alterar data, horário ou sinal</div>
                  </div>
                  <ChevronRight size={14} color="var(--m-muted)"/>
                </button>
              )}
              {b.status === 'finalizado' && b.clientPhone && (
                <button className="m-action-btn" onClick={() => sendFeedbackWhatsApp(b)}>
                  <div className="m-action-btn-icon" style={{ background:'var(--m-gold-subtle)', color:'var(--m-gold)' }}><Star size={16}/></div>
                  <div className="m-action-btn-text">
                    <div className="m-action-btn-label">Pedir Avaliação</div>
                    <div className="m-action-btn-sub">Dispara link de review no WhatsApp</div>
                  </div>
                  <ChevronRight size={14} color="var(--m-muted)"/>
                </button>
              )}
              {b.clientPhone && (
                <button className="m-action-btn" onClick={() => window.open(`https://wa.me/55${b.clientPhone.replace(/\D/g,'')}`, '_blank')}>
                  <div className="m-action-btn-icon" style={{ background:'var(--m-green-bg)', color:'var(--m-green)' }}><MessageSquare size={16}/></div>
                  <div className="m-action-btn-text">
                    <div className="m-action-btn-label">Enviar Mensagem WhatsApp</div>
                    <div className="m-action-btn-sub">{b.clientPhone}</div>
                  </div>
                  <ChevronRight size={14} color="var(--m-muted)"/>
                </button>
              )}
              {b.status !== 'cancelado' && b.status !== 'finalizado' && b.status !== 'faltou' && (
                <button className="m-action-btn" onClick={() => changeStatus(b.id, 'faltou')} style={{ marginBottom: 8 }}>
                  <div className="m-action-btn-icon" style={{ background:'rgba(235,94,85,0.12)', color:'var(--m-red)' }}><X size={16}/></div>
                  <div className="m-action-btn-text">
                    <div className="m-action-btn-label" style={{ color:'var(--m-red)' }}>Cliente Faltou</div>
                    <div className="m-action-btn-sub">Marca como falta e bloqueia para agendamento online</div>
                  </div>
                  <ChevronRight size={14} color="var(--m-muted)"/>
                </button>
              )}
              {b.status !== 'cancelado' && b.status !== 'finalizado' && (
                <button className="m-action-btn" onClick={() => changeStatus(b.id, 'cancelado')}>
                  <div className="m-action-btn-icon" style={{ background:'var(--m-red-bg)', color:'var(--m-red)' }}><X size={16}/></div>
                  <div className="m-action-btn-text">
                    <div className="m-action-btn-label" style={{ color:'var(--m-red)' }}>Cancelar Agendamento</div>
                  </div>
                  <ChevronRight size={14} color="var(--m-muted)"/>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getBlockEndTimeOptions = () => {
    if (!selectedSlot) return [];
    const allPossibleSlots = [...SLOTS, '19:30', '20:00', '20:30', '21:00'];
    const idx = allPossibleSlots.indexOf(selectedSlot);
    if (idx === -1) return [];
    return allPossibleSlots.slice(idx + 1);
  };

  // ── Slot Action Sheet ──────────────────────────────────────────
  const renderSlotSheet = () => {
    if (!showSlotSheet) return null;
    const isDefaultLunchBlock = (selectedSlot === '12:00' || selectedSlot === '12:30');
    const isUnlocked = localStorage.getItem(`unlock_${currentDate}_${selectedSlot}`) === 'true';
    const isLocked = isDefaultLunchBlock && !isUnlocked;

    const endOptions = getBlockEndTimeOptions();

    return (
      <div className="m-overlay" onClick={() => { setShowSlotSheet(false); setIsBlockingRange(false); }}>
        <div className="m-sheet" onClick={e => e.stopPropagation()}>
          <div className="m-sheet-handle"/>
          <div className="m-sheet-header">
            <div className="m-sheet-title">
              {isBlockingRange ? 'Bloquear Horário(s)' : `Horário ${selectedSlot}`}
            </div>
            <button onClick={() => { setShowSlotSheet(false); setIsBlockingRange(false); }} className="m-icon-btn"><X size={18}/></button>
          </div>
          <div className="m-sheet-body">
            {!isBlockingRange ? (
              <>
                <div style={{ fontSize:'0.8rem', color:'var(--m-muted)', marginBottom:8 }}>
                  {fmtDate(currentDate)} · {isLocked ? 'Horário Bloqueado (Almoço)' : 'Horário Disponível'}
                </div>
                <div className="m-action-list">
                  {isLocked ? (
                    <button className="m-action-btn" onClick={() => {
                      localStorage.setItem(`unlock_${currentDate}_${selectedSlot}`, 'true');
                      setShowSlotSheet(false);
                      showToast(`Horário ${selectedSlot} liberado para este dia!`, 'success');
                    }}>
                      <div className="m-action-btn-icon" style={{ background:'var(--m-green-bg)', color:'var(--m-green)' }}><Check size={16}/></div>
                      <div className="m-action-btn-text">
                        <div className="m-action-btn-label">Liberar Horário</div>
                        <div className="m-action-btn-sub">Permitir agendamentos neste dia</div>
                      </div>
                    </button>
                  ) : (
                    <>
                      <button className="m-action-btn" onClick={() => { setShowSlotSheet(false); setNbForm(prev => ({ ...prev, date: currentDate, time: selectedSlot })); setShowNewBookingSheet(true); }}>
                        <div className="m-action-btn-icon" style={{ background:'var(--m-gold-subtle)', color:'var(--m-gold)' }}><Plus size={16}/></div>
                        <div className="m-action-btn-text">
                          <div className="m-action-btn-label">Novo Agendamento</div>
                          <div className="m-action-btn-sub">Criar reserva para este horário</div>
                        </div>
                      </button>
                      <button className="m-action-btn" onClick={() => {
                        const defaultEndMin = timeToMin(selectedSlot) + 60;
                        const defaultEndTime = minToTime(defaultEndMin);
                        setBlockEndTime(endOptions.includes(defaultEndTime) ? defaultEndTime : (endOptions[0] || ''));
                        setBlockMotive('');
                        setIsBlockingRange(true);
                      }}>
                        <div className="m-action-btn-icon" style={{ background:'rgba(235,94,85,0.12)', color:'var(--m-red)' }}><AlertCircle size={16}/></div>
                        <div className="m-action-btn-text">
                          <div className="m-action-btn-label" style={{ color:'var(--m-red)' }}>Bloquear Horário(s)</div>
                          <div className="m-action-btn-sub">Impedir agendamentos neste horário ou intervalo</div>
                        </div>
                      </button>
                      {isDefaultLunchBlock && isUnlocked && (
                        <button className="m-action-btn" onClick={() => {
                          localStorage.removeItem(`unlock_${currentDate}_${selectedSlot}`);
                          setShowSlotSheet(false);
                          showToast(`Horário ${selectedSlot} bloqueado novamente!`, 'info');
                        }}>
                          <div className="m-action-btn-icon" style={{ background:'var(--m-red-bg)', color:'var(--m-red)' }}><X size={16}/></div>
                          <div className="m-action-btn-text">
                            <div className="m-action-btn-label" style={{ color: 'var(--m-red)' }}>Bloquear Novamente</div>
                            <div className="m-action-btn-sub">Restaurar bloqueio de almoço</div>
                          </div>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </>
            ) : (
              <form onSubmit={async (e) => {
                e.preventDefault();
                const startMin = timeToMin(selectedSlot);
                const endMin = timeToMin(blockEndTime || selectedSlot);
                const duration = endMin > startMin ? (endMin - startMin) : 60;

                const payload = {
                  clientName: 'Horário Bloqueado',
                  clientPhone: '00000000000',
                  clientEmail: '',
                  service: { name: 'Bloqueio Administrativo', price: 0 },
                  date: currentDate,
                  time: selectedSlot,
                  profissional: 'jon',
                  notes: blockMotive || 'Bloqueio administrativo',
                  status: 'bloqueado',
                  duration: duration,
                  createdAt: new Date().toISOString()
                };

                if (db) {
                  const ref = await addDoc(collection(db, 'bookings'), payload);
                  setBookings(prev => [...prev, { id: ref.id, ...payload }]);
                } else {
                  const fakeId = 'demo-block-' + Date.now();
                  setBookings(prev => [...prev, { id: fakeId, ...payload }]);
                }

                setShowSlotSheet(false);
                setIsBlockingRange(false);
                showToast(`Horário(s) bloqueado(s) de ${selectedSlot} até ${blockEndTime || minToTime(startMin + 60)}!`, 'info');
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--m-muted)', marginBottom: '4px' }}>Início</label>
                      <input 
                        type="text" 
                        value={selectedSlot} 
                        readOnly 
                        className="m-input" 
                        style={{ background: 'var(--m-card-border)', color: 'var(--m-text)' }} 
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--m-muted)', marginBottom: '4px' }}>Término</label>
                      <select 
                        value={blockEndTime} 
                        onChange={e => setBlockEndTime(e.target.value)} 
                        className="m-input" 
                        style={{ background: 'var(--m-card)', color: 'var(--m-text)', border: '1px solid var(--m-card-border)', height: '40px', borderRadius: '8px', padding: '0 8px' }}
                      >
                        {endOptions.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--m-muted)', marginBottom: '4px' }}>Motivo / Observações</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Almoço, Folga, Reunião, Curso..." 
                      value={blockMotive} 
                      onChange={e => setBlockMotive(e.target.value)} 
                      className="m-input" 
                      style={{ background: 'var(--m-card)', color: 'var(--m-text)', border: '1px solid var(--m-card-border)', height: '40px', borderRadius: '8px', padding: '0 12px', width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button 
                      type="button" 
                      onClick={() => setIsBlockingRange(false)} 
                      className="m-btn secondary" 
                      style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--m-card-border)', background: 'transparent', color: 'var(--m-text)', cursor: 'pointer' }}
                    >
                      Voltar
                    </button>
                    <button 
                      type="submit" 
                      className="m-btn primary" 
                      style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'var(--m-red)', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Confirmar Bloqueio
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── Checkout Sheet ─────────────────────────────────────────────
  const renderCheckoutSheet = () => {
    if (!showCheckoutSheet || !checkoutBooking) return null;
    const b = checkoutBooking;
    const basePrice = b.service?.promoPrice || b.service?.price || b.servicePrice || 0;

    const filteredServices = serviceSearch.trim().length >= 3
      ? services.filter(s => (s.name || '').toLowerCase().includes(serviceSearch.toLowerCase())).slice(0, 5)
      : [];

    const filteredProducts = productSearch.trim().length >= 3
      ? inventory.filter(p => p.quantity > 0 && (p.name || '').toLowerCase().includes(productSearch.toLowerCase())).slice(0, 5)
      : [];

    const currentBasePrice = overrideBasePrice !== null ? overrideBasePrice : basePrice;
    const extraServicesVal = selectedServices.reduce((sum, s) => sum + s.price * s.qty, 0);
    const productsVal = selectedProducts.reduce((sum, p) => sum + p.sellingPrice * p.qty, 0);
    const subtotal = currentBasePrice + extraServicesVal + productsVal;
    const valorTotal = Math.max(0, subtotal - discount);
    const prepay = Number(b.prepayment || 0);
    const remaining = Math.max(0, valorTotal - prepay);

    return (
      <div className="m-overlay" onClick={() => setShowCheckoutSheet(false)}>
        <div className="m-sheet" style={{ maxHeight:'95dvh' }} onClick={e => e.stopPropagation()}>
          <div className="m-sheet-handle"/>
          <div className="m-sheet-header">
            <div>
              <div className="m-sheet-title">Fechar Comanda</div>
              <div style={{ fontSize:'0.72rem', color:'var(--m-muted)', marginTop:2 }}>{b.clientName} · {b.service?.name || b.serviceName}</div>
            </div>
            <button onClick={() => setShowCheckoutSheet(false)} className="m-icon-btn"><X size={18}/></button>
          </div>
          <div className="m-sheet-body" style={{ gap:16 }}>
            {/* Services */}
            <div>
              <div className="m-label" style={{ marginBottom:8 }}>Serviços</div>
              <div className="m-info-row" style={{ borderBottom:'none', padding:'0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:'0.85rem', color:'var(--m-text-2)' }}>{b.service?.name || b.serviceName}</span>
                <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <span style={{ fontSize:'0.85rem', color:'var(--m-muted)' }}>R$</span>
                  <input
                    type="number"
                    value={overrideBasePrice !== null ? overrideBasePrice : basePrice}
                    onChange={e => setOverrideBasePrice(e.target.value === '' ? null : Number(e.target.value))}
                    style={{
                      width: 70,
                      textAlign: 'right',
                      background: 'var(--m-card)',
                      border: '0.5px solid var(--m-rule)',
                      borderRadius: 'var(--m-radius-sm)',
                      padding: '4px 6px',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      color: 'var(--m-gold)',
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>
              
              {/* Extra Services List */}
              {selectedServices.map(s => (
                <div key={s.id} className="m-info-row" style={{ borderBottom:'none', padding:'4px 0 0 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:'0.85rem', color:'var(--m-text-2)' }}>{s.name}</span>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:'0.85rem', color:'var(--m-muted)' }}>{fmt(s.price * s.qty)}</span>
                    <div className="m-qty-row" style={{ margin: 0 }}>
                      <button className="m-qty-btn" onClick={() => changeServiceQty(s.id, -1)}>−</button>
                      <span style={{ fontSize:'0.8rem', fontWeight:800, color:'var(--m-gold)', minWidth:12, textAlign:'center' }}>{s.qty}</span>
                      <button className="m-qty-btn" onClick={() => changeServiceQty(s.id, 1)}>+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Service input */}
            <div className="m-field">
              <label className="m-label">Adicionar Serviços Extras</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--m-card)', border: '0.5px solid var(--m-rule)', borderRadius: 'var(--m-radius-sm)', padding: '8px 12px' }}>
                <Search size={14} style={{ color: 'var(--m-muted)', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Buscar serviço (mín. 3 letras)..."
                  value={serviceSearch}
                  onChange={e => setServiceSearch(e.target.value)}
                  style={{ border: 'none', background: 'none', outline: 'none', fontSize: '0.85rem', color: 'var(--m-text)', width: '100%', fontFamily: 'inherit' }}
                />
              </div>
              {filteredServices.length > 0 && (
                <div style={{ background: 'var(--m-card)', border: '0.5px solid var(--m-rule)', borderRadius: 'var(--m-radius-sm)', overflow: 'hidden', marginTop: 4 }}>
                  {filteredServices.map(svc => (
                    <div key={svc.id} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '0.5px solid var(--m-rule)', fontSize: '0.82rem', color: 'var(--m-text)', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}
                      onClick={() => addServiceToCheckout(svc)}>
                      <span>{svc.name}</span>
                      <span style={{ color: 'var(--m-gold)' }}>{fmt(svc.promoPrice || svc.price)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Products List */}
            {selectedProducts.length > 0 && (
              <div>
                <div className="m-label" style={{ marginBottom:8 }}>Produtos Adicionados</div>
                {selectedProducts.map(p => (
                  <div key={p.id} className="m-info-row" style={{ borderBottom:'none', padding:'4px 0 0 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:'0.85rem', color:'var(--m-text-2)' }}>{p.name}</span>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:'0.85rem', color:'var(--m-muted)' }}>{fmt(p.sellingPrice * p.qty)}</span>
                      <div className="m-qty-row" style={{ margin: 0 }}>
                        <button className="m-qty-btn" onClick={() => changeProductQty(p.id, -1)}>−</button>
                        <span style={{ fontSize:'0.8rem', fontWeight:800, color:'var(--m-gold)', minWidth:12, textAlign:'center' }}>{p.qty}</span>
                        <button className="m-qty-btn" onClick={() => changeProductQty(p.id, 1)}>+</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Product input */}
            <div className="m-field">
              <label className="m-label">Adicionar Produtos</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--m-card)', border: '0.5px solid var(--m-rule)', borderRadius: 'var(--m-radius-sm)', padding: '8px 12px' }}>
                <Search size={14} style={{ color: 'var(--m-muted)', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Buscar produto (mín. 3 letras)..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  style={{ border: 'none', background: 'none', outline: 'none', fontSize: '0.85rem', color: 'var(--m-text)', width: '100%', fontFamily: 'inherit' }}
                />
              </div>
              {filteredProducts.length > 0 && (
                <div style={{ background: 'var(--m-card)', border: '0.5px solid var(--m-rule)', borderRadius: 'var(--m-radius-sm)', overflow: 'hidden', marginTop: 4 }}>
                  {filteredProducts.map(prod => (
                    <div key={prod.id} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '0.5px solid var(--m-rule)', fontSize: '0.82rem', color: 'var(--m-text)', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}
                      onClick={() => addProductToCheckout(prod)}>
                      <span>{prod.name}</span>
                      <span style={{ color: 'var(--m-gold)' }}>{fmt(prod.sellingPrice)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Discount */}
            <div className="m-field">
              <label className="m-label">Desconto (R$)</label>
              <input className="m-input" type="number" min="0" value={discount || ''} onChange={e => setDiscount(Number(e.target.value) || 0)} placeholder="0,00"/>
            </div>

            {/* Payment method */}
            <div>
              <div className="m-label" style={{ marginBottom:8 }}>Forma de Pagamento</div>
              <div className="m-payment-row" style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {['Pix','Cartão de Crédito','Cartão de Débito','Dinheiro','Cortesia'].map(m => (
                  <button key={m} className={`m-pay-pill ${paymentMethod === m ? 'active' : ''}`} type="button" onClick={() => {
                    setPaymentMethod(m);
                    if (m === 'Cartão de Crédito' || m === 'Cartão de Débito') {
                      setApplyAnticipation(true);
                    } else {
                      setApplyAnticipation(false);
                    }
                  }}>{m}</button>
                ))}
              </div>
            </div>

            {/* Installments selection for Credit Card */}
            {paymentMethod === 'Cartão de Crédito' && (
              <div className="m-field">
                <label className="m-label">Parcelas</label>
                <select className="m-select" value={installments} onChange={e => setInstallments(e.target.value)}>
                  <option value="À vista">À vista</option>
                  <option value="2x">2x</option>
                  <option value="3x">3x</option>
                </select>
              </div>
            )}

            {/* Anticipation toggle */}
            {(paymentMethod === 'Cartão de Crédito' || paymentMethod === 'Cartão de Débito') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <input 
                  type="checkbox" 
                  id="m-anticipate"
                  checked={applyAnticipation} 
                  onChange={e => setApplyAnticipation(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: 'var(--m-gold)' }}
                />
                <label htmlFor="m-anticipate" style={{ fontSize: '0.8rem', color: 'var(--m-text-2)', cursor: 'pointer' }}>
                  Antecipar recebimento? (taxa maquininha)
                </label>
              </div>
            )}

            {/* Review request checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, padding: '0 4px' }}>
              <input 
                type="checkbox" 
                id="m-request-review"
                checked={requestReview} 
                onChange={e => setRequestReview(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--m-gold)', cursor: 'pointer' }}
              />
              <label htmlFor="m-request-review" style={{ fontSize: '0.8rem', color: 'var(--m-text-2)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                Pedir avaliação no Google (enviar WhatsApp)
              </label>
            </div>

            {/* Totals Summary */}
            <div style={{ background:'var(--m-card)', border:'0.5px solid var(--m-rule)', borderRadius:'var(--m-radius)', padding:'12px 14px', display:'flex', flexDirection:'column', gap:6 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.78rem', color:'var(--m-muted)' }}>
                <span>Subtotal Serviços</span>
                <span>{fmt(currentBasePrice + extraServicesVal)}</span>
              </div>
              {productsVal > 0 && (
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.78rem', color:'var(--m-muted)' }}>
                  <span>Subtotal Produtos</span>
                  <span>{fmt(productsVal)}</span>
                </div>
              )}
              {discount > 0 && (
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.78rem', color:'var(--m-red)' }}>
                  <span>Desconto</span>
                  <span>- {fmt(discount)}</span>
                </div>
              )}
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.82rem', fontWeight:700, color:'var(--m-text)', borderTop:'0.5px solid var(--m-rule)', paddingTop:4 }}>
                <span>Valor Total</span>
                <span>{fmt(subtotal - discount)}</span>
              </div>
              {prepay > 0 && (
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.78rem', color:'var(--m-red)' }}>
                  <span>Sinal Pago</span>
                  <span>- {fmt(prepay)}</span>
                </div>
              )}
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.95rem', fontWeight:800, color:'var(--m-gold)', borderTop:'0.5px solid var(--m-rule)', paddingTop:4, marginTop:2 }}>
                <span>Valor Restante</span>
                <span>{fmt(remaining)}</span>
              </div>
            </div>
          </div>
          <div className="m-sheet-footer">
            <button className="m-btn m-btn-outline" style={{ flex:1 }} onClick={() => setShowCheckoutSheet(false)}>Cancelar</button>
            <button className="m-btn m-btn-gold" style={{ flex:2 }} onClick={finalizeCheckout} disabled={isFinalizingCheckout}>
              {isFinalizingCheckout ? <><RefreshCw size={14} style={{ animation:'mSpin 0.8s linear infinite' }}/> Processando...</> : <><Check size={14}/> Receber {fmt(remaining)}</>}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── New Booking Sheet ──────────────────────────────────────────
  const renderNewBookingSheet = () => {
    if (!showNewBookingSheet) return null;
    return (
      <div className="m-overlay" onClick={() => setShowNewBookingSheet(false)}>
        <div className="m-sheet" onClick={e => e.stopPropagation()}>
          <div className="m-sheet-handle"/>
          <div className="m-sheet-header">
            <div className="m-sheet-title">Novo Agendamento</div>
            <button onClick={() => setShowNewBookingSheet(false)} className="m-icon-btn"><X size={18}/></button>
          </div>
          <div className="m-sheet-body">
            <div className="m-field">
              <label className="m-label">Cliente *</label>
              <input className="m-input" placeholder="Nome do cliente" value={nbForm.clientName} onChange={e => setNbForm(p => ({ ...p, clientName: e.target.value }))}/>
              {nbSuggestions.length > 0 && (
                <div style={{ background:'var(--m-card)', border:'0.5px solid var(--m-rule)', borderRadius:'var(--m-radius-sm)', overflow:'hidden' }}>
                  {nbSuggestions.map(c => (
                    <div key={c.id} style={{ padding:'10px 14px', cursor:'pointer', borderBottom:'0.5px solid var(--m-rule)', fontSize:'0.85rem', color:'var(--m-text)', fontWeight:600 }}
                      onClick={() => { setNbForm(p => ({ ...p, clientName: c.name, clientPhone: c.phone || '' })); setNbSuggestions([]); }}>
                      {c.name} {c.phone ? <span style={{ color:'var(--m-muted)', fontWeight:400 }}>· {c.phone}</span> : ''}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="m-field">
              <label className="m-label">Telefone</label>
              <input className="m-input" type="tel" placeholder="(31) 99999-9999" value={nbForm.clientPhone} onChange={e => setNbForm(p => ({ ...p, clientPhone: e.target.value }))}/>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '12px 0 16px 0' }}>
              <input 
                type="checkbox" 
                id="nbRegisterClient"
                checked={nbRegisterClient} 
                onChange={e => setNbRegisterClient(e.target.checked)} 
                style={{ width: '16px', height: '16px' }}
              />
              <label htmlFor="nbRegisterClient" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--m-text)' }}>
                Cadastrar cliente no sistema
              </label>
            </div>
            {nbRegisterClient && (
              <div style={{ padding: '12px', background: 'var(--m-card-border)', borderRadius: 'var(--m-radius-sm)', marginBottom: '16px', border: '0.5px solid var(--m-rule)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="m-field" style={{ margin: 0 }}>
                  <label className="m-label">E-mail</label>
                  <input className="m-input" type="email" placeholder="email@exemplo.com" value={nbForm.clientEmail || ''} onChange={e => setNbForm(p => ({ ...p, clientEmail: e.target.value }))}/>
                </div>
                <div className="m-field" style={{ margin: 0 }}>
                  <label className="m-label">Tipo de Cacho</label>
                  <select className="m-select" value={nbForm.clientCurvatura || '3A'} onChange={e => setNbForm(p => ({ ...p, clientCurvatura: e.target.value }))}>
                    {CURL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="m-field" style={{ margin: 0 }}>
                  <label className="m-label">Observações do Cliente</label>
                  <textarea className="m-textarea" rows={2} placeholder="Informações adicionais do cliente..." value={nbForm.clientNotes || ''} onChange={e => setNbForm(p => ({ ...p, clientNotes: e.target.value }))}/>
                </div>
              </div>
            )}
            <div className="m-field">
              <label className="m-label">Serviço *</label>
              <select className="m-select" value={nbForm.serviceName} onChange={e => {
                const sName = e.target.value;
                const matched = services.find(s => s.name === sName);
                const matchedPrice = matched ? (matched.promoPrice || matched.price || '') : '';
                setNbForm(p => ({ ...p, serviceName: sName, servicePrice: matchedPrice }));
              }}>
                <option value="">Selecione um serviço</option>
                {services.map(s => <option key={s.id} value={s.name}>{s.name} — {fmt(s.promoPrice || s.price)}</option>)}
              </select>
            </div>
            <div className="m-field">
              <label className="m-label">Valor do Serviço (R$)</label>
              <input className="m-input" type="number" placeholder="0,00" value={nbForm.servicePrice} onChange={e => setNbForm(p => ({ ...p, servicePrice: e.target.value }))}/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div className="m-field">
                <label className="m-label">Data *</label>
                <input className="m-input" type="date" value={nbForm.date} onChange={e => setNbForm(p => ({ ...p, date: e.target.value }))}/>
              </div>
              <div className="m-field">
                <label className="m-label">Horário *</label>
                <select className="m-select" value={nbForm.time} onChange={e => setNbForm(p => ({ ...p, time: e.target.value }))}>
                  {SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="m-field">
              <label className="m-label">Sinal / Adiantamento Pago (R$)</label>
              <input className="m-input" type="number" placeholder="0,00" value={nbForm.prepayment} onChange={e => setNbForm(p => ({ ...p, prepayment: e.target.value }))}/>
            </div>
            <div className="m-field">
              <label className="m-label">Observações</label>
              <textarea className="m-textarea" rows={2} placeholder="Informações adicionais..." value={nbForm.notes} onChange={e => setNbForm(p => ({ ...p, notes: e.target.value }))}/>
            </div>
          </div>
          <div className="m-sheet-footer">
            <button className="m-btn m-btn-outline" style={{ flex:1 }} onClick={() => setShowNewBookingSheet(false)}>Cancelar</button>
            <button className="m-btn m-btn-gold" style={{ flex:2 }} onClick={addBooking}><Plus size={14}/> Agendar</button>
          </div>
        </div>
      </div>
    );
  };

  // ── Edit Booking Sheet ─────────────────────────────────────────
  const renderEditBookingSheet = () => {
    if (!showEditBookingSheet || !editBookingForm) return null;
    return (
      <div className="m-overlay" onClick={() => setShowEditBookingSheet(false)}>
        <div className="m-sheet" onClick={e => e.stopPropagation()}>
          <div className="m-sheet-handle"/>
          <div className="m-sheet-header">
            <div className="m-sheet-title">Remarcar / Editar</div>
            <button onClick={() => setShowEditBookingSheet(false)} className="m-icon-btn"><X size={18}/></button>
          </div>
          <div className="m-sheet-body">
            <div className="m-field">
              <label className="m-label">Cliente *</label>
              <input className="m-input" placeholder="Nome do cliente" value={editBookingForm.clientName} onChange={e => setEditBookingForm(p => ({ ...p, clientName: e.target.value }))}/>
              {ebSuggestions.length > 0 && (
                <div style={{ background:'var(--m-card)', border:'0.5px solid var(--m-rule)', borderRadius:'var(--m-radius-sm)', overflow:'hidden' }}>
                  {ebSuggestions.map(c => (
                    <div key={c.id} style={{ padding:'10px 14px', cursor:'pointer', borderBottom:'0.5px solid var(--m-rule)', fontSize:'0.85rem', color:'var(--m-text)', fontWeight:600 }}
                      onClick={() => { setEditBookingForm(p => ({ ...p, clientName: c.name, clientPhone: c.phone || '' })); setEbSuggestions([]); }}>
                      {c.name} {c.phone ? <span style={{ color:'var(--m-muted)', fontWeight:400 }}>· {c.phone}</span> : ''}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="m-field">
              <label className="m-label">Telefone</label>
              <input className="m-input" type="tel" placeholder="(31) 99999-9999" value={editBookingForm.clientPhone} onChange={e => setEditBookingForm(p => ({ ...p, clientPhone: e.target.value }))}/>
            </div>
            <div className="m-field">
              <label className="m-label">Serviço *</label>
              <select className="m-select" value={editBookingForm.serviceName} onChange={e => {
                const sName = e.target.value;
                const matched = services.find(s => s.name === sName);
                const matchedPrice = matched ? (matched.promoPrice || matched.price || '') : '';
                setEditBookingForm(p => ({ ...p, serviceName: sName, servicePrice: matchedPrice }));
              }}>
                <option value="">Selecione um serviço</option>
                {services.map(s => <option key={s.id} value={s.name}>{s.name} — {fmt(s.promoPrice || s.price)}</option>)}
              </select>
            </div>
            <div className="m-field">
              <label className="m-label">Valor do Serviço (R$)</label>
              <input className="m-input" type="number" placeholder="0,00" value={editBookingForm.servicePrice} onChange={e => setEditBookingForm(p => ({ ...p, servicePrice: e.target.value }))}/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div className="m-field">
                <label className="m-label">Data *</label>
                <input className="m-input" type="date" value={editBookingForm.date} onChange={e => setEditBookingForm(p => ({ ...p, date: e.target.value }))}/>
              </div>
              <div className="m-field">
                <label className="m-label">Horário *</label>
                <select className="m-select" value={editBookingForm.time} onChange={e => setEditBookingForm(p => ({ ...p, time: e.target.value }))}>
                  {SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div className="m-field">
                <label className="m-label">Sinal / Adiantamento (R$)</label>
                <input className="m-input" type="number" placeholder="0,00" value={editBookingForm.prepayment} onChange={e => setEditBookingForm(p => ({ ...p, prepayment: e.target.value }))}/>
              </div>
              <div className="m-field">
                <label className="m-label">Status</label>
                <select className="m-select" value={editBookingForm.status} onChange={e => setEditBookingForm(p => ({ ...p, status: e.target.value }))}>
                  <option value="confirmado">Confirmado</option>
                  <option value="pendente">Pendente</option>
                  <option value="cancelado">Cancelado</option>
                  <option value="finalizado">Finalizado</option>
                  <option value="bloqueado">Bloqueado</option>
                  <option value="faltou">Faltou</option>
                </select>
              </div>
            </div>
            <div className="m-field">
              <label className="m-label">Observações</label>
              <textarea className="m-textarea" rows={2} placeholder="Informações adicionais..." value={editBookingForm.notes} onChange={e => setEditBookingForm(p => ({ ...p, notes: e.target.value }))}/>
            </div>
          </div>
          <div className="m-sheet-footer">
            <button className="m-btn m-btn-outline" style={{ flex:1 }} onClick={() => setShowEditBookingSheet(false)}>Cancelar</button>
            <button className="m-btn m-btn-gold" style={{ flex:2 }} onClick={updateBooking}>Salvar Alterações</button>
          </div>
        </div>
      </div>
    );
  };

  // ── Client Detail Sheet ────────────────────────────────────────
  const renderClientSheet = () => {
    if (!showClientSheet || !selectedClient) return null;
    const c = selectedClient;
    const visits = bookings.filter(b => (b.clientPhone && b.clientPhone === c.phone) || b.clientName === c.name).sort((a,b) => (b.date || '').localeCompare(a.date || ''));
    const todayStr = new Date().toISOString().split('T')[0];
    const futureBookings = visits.filter(b => b.date >= todayStr && b.status !== 'cancelado' && b.status !== 'finalizado');
    const pastVisits = visits.filter(b => b.date < todayStr || b.status === 'finalizado');

    return (
      <div className="m-overlay" onClick={() => { setShowClientSheet(false); setIsEditingClient(false); }}>
        <div className="m-sheet" onClick={e => e.stopPropagation()}>
          <div className="m-sheet-handle"/>
          <div className="m-sheet-header">
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div className="m-client-avatar" style={{ width:44, height:44, fontSize:'1.1rem' }}>{initials(c.name)}</div>
              <div>
                <div className="m-sheet-title">{c.name}</div>
                {c.curvatura && <div style={{ fontSize:'0.7rem', color:'var(--m-muted)', marginTop:2 }}>Cachos {c.curvatura}</div>}
              </div>
            </div>
            <button onClick={() => { setShowClientSheet(false); setIsEditingClient(false); }} className="m-icon-btn"><X size={18}/></button>
          </div>
          {isEditingClient ? (
            <div className="m-sheet-body" style={{ display:'flex', flexDirection:'column', gap:12, maxHeight:'70vh', overflowY:'auto' }}>
              <div className="m-field">
                <label className="m-label">Nome Completo *</label>
                <input className="m-input" type="text" value={editingClientData.name} onChange={e => setEditingClientData(p => ({ ...p, name: e.target.value }))}/>
              </div>
              <div className="m-field">
                <label className="m-label">Telefone *</label>
                <input className="m-input" type="text" value={editingClientData.phone} onChange={e => setEditingClientData(p => ({ ...p, phone: e.target.value }))}/>
              </div>
              <div className="m-field">
                <label className="m-label">E-mail</label>
                <input className="m-input" type="email" value={editingClientData.email} onChange={e => setEditingClientData(p => ({ ...p, email: e.target.value }))}/>
              </div>
              <div className="m-field">
                <label className="m-label">Curvatura de Cacho</label>
                <select className="m-select" value={editingClientData.curvatura} onChange={e => setEditingClientData(p => ({ ...p, curvatura: e.target.value }))}>
                  {CURL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="m-field">
                <label className="m-label">Porosidade Capilar</label>
                <select className="m-select" value={editingClientData.porosidade} onChange={e => setEditingClientData(p => ({ ...p, porosidade: e.target.value }))}>
                  <option value="Baixa">Baixa (Cutículas seladas)</option>
                  <option value="Média">Média (Fios saudáveis)</option>
                  <option value="Alta">Alta (Ressecado/Pós-química)</option>
                </select>
              </div>
              <div className="m-field">
                <label className="m-label">Elasticidade</label>
                <select className="m-select" value={editingClientData.elasticidade} onChange={e => setEditingClientData(p => ({ ...p, elasticidade: e.target.value }))}>
                  <option value="Normal">Normal (Fibra com força)</option>
                  <option value="Fraca">Fraca/Elástica (Fio frágil)</option>
                  <option value="Rígida">Rígida (Excesso queratina)</option>
                </select>
              </div>
              <div className="m-field">
                <label className="m-label">Gênero</label>
                <select className="m-select" value={editingClientData.sexo} onChange={e => setEditingClientData(p => ({ ...p, sexo: e.target.value }))}>
                  <option value="Feminino">Feminino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              <div className="m-field">
                <label className="m-label">Data de Nascimento</label>
                <input className="m-input" type="date" value={editingClientData.birthdate} onChange={e => setEditingClientData(p => ({ ...p, birthdate: e.target.value }))}/>
              </div>
              <div className="m-field">
                <label className="m-label">Histórico Químico</label>
                <input className="m-input" type="text" value={editingClientData.quimicas} onChange={e => setEditingClientData(p => ({ ...p, quimicas: e.target.value }))}/>
              </div>
              <div className="m-field">
                <label className="m-label">Produtos Recomendados</label>
                <input className="m-input" type="text" value={editingClientData.produtosRecomendados} onChange={e => setEditingClientData(p => ({ ...p, produtosRecomendados: e.target.value }))}/>
              </div>
              <div className="m-field">
                <label className="m-label">Observações</label>
                <textarea className="m-textarea" rows={2} value={editingClientData.observacoes} onChange={e => setEditingClientData(p => ({ ...p, observacoes: e.target.value }))}/>
              </div>
              <div style={{ display:'flex', gap:8, marginTop:12, marginBottom:16 }}>
                <button className="m-btn m-btn-outline" style={{ flex:1 }} onClick={() => setIsEditingClient(false)}>Cancelar</button>
                <button className="m-btn m-btn-gold" style={{ flex:2 }} onClick={handleSaveClientMobile} disabled={savingClientMobile}>
                  {savingClientMobile ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          ) : (
            <div className="m-sheet-body" style={{ maxHeight:'70vh', overflowY:'auto' }}>
              {/* Info */}
              <div style={{ background:'var(--m-card)', borderRadius:'var(--m-radius)', padding:'14px', marginBottom:12 }}>
                {[
                  { label:'Telefone', val: c.phone || '—' },
                  { label:'E-mail', val: c.email || '—' },
                  { label:'Curvatura', val: c.curvatura || '—' },
                  { label:'Porosidade', val: c.porosidade || '—' },
                  { label:'Elasticidade', val: c.elasticidade || '—' },
                  { label:'Gênero', val: c.sexo || '—' },
                  { label:'Nascimento', val: c.birthdate || '—' },
                  c.quimicas ? { label:'Química', val: c.quimicas } : null,
                  c.produtosRecomendados ? { label:'Produtos Rec.', val: c.produtosRecomendados } : null,
                  c.observacoes ? { label:'Observações', val: c.observacoes } : null
                ].filter(Boolean).map((row, i) => (
                  <div key={i} className="m-info-row">
                    <span className="m-info-label">{row.label}</span>
                    <span className="m-info-value" style={{ fontSize:'0.78rem', maxWidth:'55%', textAlign:'right', wordBreak:'break-word' }}>{row.val}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom: 12 }}>
                {c.phone && (
                  <button className="m-btn m-btn-ghost" style={{ flex:1, minWidth:'100px' }} onClick={() => window.open(`https://wa.me/55${c.phone.replace(/\D/g,'')}`)}>
                    <MessageSquare size={14}/> WhatsApp
                  </button>
                )}
                <button className="m-btn m-btn-gold" style={{ flex:1, minWidth:'100px' }} onClick={() => { setShowClientSheet(false); setNbForm(p => ({ ...p, clientName: c.name, clientPhone: c.phone || '' })); setShowNewBookingSheet(true); }}>
                  <Plus size={14}/> Agendar
                </button>
                <button className="m-btn m-btn-outline" style={{ flex:1, minWidth:'100px' }} onClick={() => {
                  setEditingClientData({
                    name: c.name || '',
                    phone: c.phone || '',
                    email: c.email || '',
                    curvatura: c.curvatura || '3A',
                    porosidade: c.porosidade || 'Média',
                    elasticidade: c.elasticidade || 'Normal',
                    quimicas: c.quimicas || 'Nenhuma',
                    produtosRecomendados: c.produtosRecomendados || '',
                    observacoes: c.observacoes || '',
                    sexo: c.sexo || 'Feminino',
                    birthdate: c.birthdate || ''
                  });
                  setIsEditingClient(true);
                }}>
                  Editar Ficha
                </button>
              </div>

              {visits.some(v => v.status === 'confirmado' || v.status === 'pendente') && (
                <button className="m-btn" style={{ width: '100%', background: 'rgba(235,94,85,0.12)', color: 'var(--m-red)', border: 'none', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={async () => {
                  const latestActive = visits.find(v => v.status === 'confirmado' || v.status === 'pendente');
                  if (latestActive && window.confirm(`Deseja marcar o agendamento de ${fmtDate(latestActive.date)} às ${latestActive.time} como Falta?`)) {
                    await changeStatus(latestActive.id, 'faltou');
                    showToast('Falta registrada!', 'success');
                  }
                }}>
                  <X size={14}/> Cliente Faltou
                </button>
              )}

              {/* Agendamentos Futuros */}
              <div style={{ marginBottom: 16 }}>
                <div className="m-section-title" style={{ marginBottom:10 }}>Agendamentos Futuros ({futureBookings.length})</div>
                {futureBookings.map(b => (
                  <div key={b.id} className="m-info-row">
                    <div>
                      <div style={{ fontSize:'0.82rem', fontWeight:700, color:'var(--m-text)' }}>{b.service?.name || b.serviceName}</div>
                      <div style={{ fontSize:'0.68rem', color:'var(--m-muted)', marginTop:2 }}>{fmtDate(b.date)} às {b.time}</div>
                    </div>
                    <StatusPill status={b.status}/>
                  </div>
                ))}
                {futureBookings.length === 0 && <div style={{ color:'var(--m-muted)', fontSize:'0.8rem' }}>Nenhum agendamento futuro</div>}
              </div>

              {/* Visit history */}
              <div>
                <div className="m-section-title" style={{ marginBottom:10 }}>Histórico ({pastVisits.length} visitas)</div>
                {pastVisits.slice(0, 5).map(b => (
                  <div key={b.id} className="m-info-row">
                    <div>
                      <div style={{ fontSize:'0.82rem', fontWeight:700, color:'var(--m-text)' }}>{b.service?.name || b.serviceName}</div>
                      <div style={{ fontSize:'0.68rem', color:'var(--m-muted)', marginTop:2 }}>{fmtDate(b.date)}</div>
                    </div>
                    <StatusPill status={b.status}/>
                  </div>
                ))}
                {pastVisits.length === 0 && <div style={{ color:'var(--m-muted)', fontSize:'0.8rem' }}>Nenhuma visita registrada</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── New Client Sheet ───────────────────────────────────────────
  const renderNewClientSheet = () => {
    if (!showNewClientSheet) return null;
    return (
      <div className="m-overlay" onClick={() => setShowNewClientSheet(false)}>
        <div className="m-sheet" onClick={e => e.stopPropagation()}>
          <div className="m-sheet-handle"/>
          <div className="m-sheet-header">
            <div className="m-sheet-title">Novo Cliente</div>
            <button onClick={() => setShowNewClientSheet(false)} className="m-icon-btn"><X size={18}/></button>
          </div>
          <div className="m-sheet-body">
            <div className="m-field"><label className="m-label">Nome *</label><input className="m-input" placeholder="Nome completo" value={newClientForm.name} onChange={e => setNewClientForm(p => ({ ...p, name: e.target.value }))}/></div>
            <div className="m-field"><label className="m-label">Telefone</label><input className="m-input" type="tel" placeholder="(31) 99999-9999" value={newClientForm.phone} onChange={e => setNewClientForm(p => ({ ...p, phone: e.target.value }))}/></div>
            <div className="m-field"><label className="m-label">E-mail</label><input className="m-input" type="email" placeholder="email@exemplo.com" value={newClientForm.email} onChange={e => setNewClientForm(p => ({ ...p, email: e.target.value }))}/></div>
            <div className="m-field">
              <label className="m-label">Tipo de Cacho</label>
              <select className="m-select" value={newClientForm.curvatura} onChange={e => setNewClientForm(p => ({ ...p, curvatura: e.target.value }))}>
                {CURL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="m-field"><label className="m-label">Observações</label><textarea className="m-textarea" rows={2} placeholder="Informações adicionais, alergias, preferências..." value={newClientForm.observacoes} onChange={e => setNewClientForm(p => ({ ...p, observacoes: e.target.value }))}/></div>
          </div>
          <div className="m-sheet-footer">
            <button className="m-btn m-btn-outline" style={{ flex:1 }} onClick={() => setShowNewClientSheet(false)}>Cancelar</button>
            <button className="m-btn m-btn-gold" style={{ flex:2 }} onClick={addClient}><Plus size={14}/> Cadastrar</button>
          </div>
        </div>
      </div>
    );
  };

  // ── Add Transaction Sheet ──────────────────────────────────────
  const renderAddTxSheet = () => {
    if (!showAddTxSheet) return null;
    return (
      <div className="m-overlay" onClick={() => setShowAddTxSheet(false)}>
        <div className="m-sheet" onClick={e => e.stopPropagation()}>
          <div className="m-sheet-handle"/>
          <div className="m-sheet-header">
            <div className="m-sheet-title">Lançamento Financeiro</div>
            <button onClick={() => setShowAddTxSheet(false)} className="m-icon-btn"><X size={18}/></button>
          </div>
          <div className="m-sheet-body">
            <div className="m-segmented">
              <button className={`m-seg-btn ${txForm.type === 'entrada' ? 'active' : ''}`} onClick={() => setTxForm(p => ({ ...p, type:'entrada' }))}>💰 Receita</button>
              <button className={`m-seg-btn ${txForm.type === 'saida' ? 'active' : ''}`} onClick={() => setTxForm(p => ({ ...p, type:'saida' }))}>💸 Despesa</button>
            </div>
            <div className="m-field"><label className="m-label">Descrição *</label><input className="m-input" placeholder="Ex: Aluguel do salão" value={txForm.description} onChange={e => setTxForm(p => ({ ...p, description: e.target.value }))}/></div>
            <div className="m-field"><label className="m-label">Valor (R$) *</label><input className="m-input" type="number" step="0.01" min="0" placeholder="0,00" value={txForm.value} onChange={e => setTxForm(p => ({ ...p, value: e.target.value }))}/></div>
            <div>
              <div className="m-label" style={{ marginBottom:8 }}>Forma de Pagamento</div>
              <div className="m-payment-row">
                {PAY_METHODS.map(m => <button key={m} className={`m-pay-pill ${txForm.paymentMethod === m ? 'active' : ''}`} onClick={() => setTxForm(p => ({ ...p, paymentMethod: m }))}>{m}</button>)}
              </div>
            </div>
            <div className="m-field"><label className="m-label">Data</label><input className="m-input" type="date" value={txForm.date} onChange={e => setTxForm(p => ({ ...p, date: e.target.value }))}/></div>
          </div>
          <div className="m-sheet-footer">
            <button className="m-btn m-btn-outline" style={{ flex:1 }} onClick={() => setShowAddTxSheet(false)}>Cancelar</button>
            <button className="m-btn m-btn-gold" style={{ flex:2 }} onClick={addTransaction}><Check size={14}/> Salvar</button>
          </div>
        </div>
      </div>
    );
  };

  // ── Upload Sheet ───────────────────────────────────────────────
  const renderUploadSheet = () => {
    if (!showUploadSheet) return null;
    
    const isVideo = pendingFile?.type?.startsWith('video/');
    
    const getPreviewImageStyle = () => {
      if (!naturalDimensions.w || !containerSize) {
        return { width: '100%', height: '100%', objectFit: 'cover' };
      }
      
      const initialScale = Math.max(containerSize / naturalDimensions.w, containerSize / naturalDimensions.h);
      const displayWidth = naturalDimensions.w * initialScale;
      const displayHeight = naturalDimensions.h * initialScale;
      const initialX = (containerSize - displayWidth) / 2;
      const initialY = (containerSize - displayHeight) / 2;
      
      const w = displayWidth * cropperZoom;
      const h = displayHeight * cropperZoom;
      const l = initialX + cropperOffset.x;
      const t = initialY + cropperOffset.y;
      
      return {
        position: 'absolute',
        width: `${w}px`,
        height: `${h}px`,
        left: `${l}px`,
        top: `${t}px`,
        pointerEvents: 'none',
        maxWidth: 'none',
        maxHeight: 'none'
      };
    };

    return (
      <div className="m-overlay-center" onClick={() => { setShowUploadSheet(false); setPendingFile(null); setPendingPreviewUrl(''); }}>
        <div className="m-modal" style={{ maxWidth: '600px', width: '90%', maxHeight: '90dvh' }} onClick={e => e.stopPropagation()}>
          <div className="m-modal-header" style={{ padding: '16px 20px', borderBottom: '0.5px solid var(--m-rule)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div className="m-sheet-title">{isVideo ? 'Publicar Vídeo' : 'Publicar Foto'}</div>
            <button onClick={() => { setShowUploadSheet(false); setPendingFile(null); setPendingPreviewUrl(''); }} className="m-icon-btn"><X size={18}/></button>
          </div>
          <div className="m-sheet-body" style={{ padding: '16px 20px', display:'flex', flexDirection:'column', gap:'14px', overflowY:'auto' }}>
            {/* Interactive Cropper or Video Preview */}
            {pendingPreviewUrl && (
              isVideo ? (
                <div style={{ borderRadius:'var(--m-radius)', overflow:'hidden', aspectRatio:'1/1', background:'#000', position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <video src={pendingPreviewUrl} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              ) : (
                <div 
                  ref={previewContainerRef}
                  style={{ 
                    borderRadius:'var(--m-radius)', 
                    overflow:'hidden', 
                    aspectRatio:'1/1', 
                    background:'#000', 
                    position:'relative',
                    touchAction:'none',
                    cursor: isDraggingCropper ? 'grabbing' : 'grab'
                  }}
                  onMouseDown={(e) => handleCropperDragStart(e.clientX, e.clientY)}
                  onMouseMove={(e) => handleCropperDragMove(e.clientX, e.clientY)}
                  onMouseUp={handleCropperDragEnd}
                  onMouseLeave={handleCropperDragEnd}
                  onTouchStart={(e) => handleCropperDragStart(e.touches[0].clientX, e.touches[0].clientY)}
                  onTouchMove={(e) => handleCropperDragMove(e.touches[0].clientX, e.touches[0].clientY)}
                  onTouchEnd={handleCropperDragEnd}
                >
                  <img 
                    ref={previewImageRef}
                    src={pendingPreviewUrl} 
                    alt="Preview" 
                    onLoad={(e) => {
                      const img = e.target;
                      setNaturalDimensions({ w: img.naturalWidth, h: img.naturalHeight });
                      if (previewContainerRef.current) {
                        setContainerSize(previewContainerRef.current.offsetWidth);
                      }
                    }}
                    style={getPreviewImageStyle()}
                  />
                  
                  {/* Visual crop guidelines/borders */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    border: '1.5px dashed rgba(220, 163, 84, 0.6)',
                    borderRadius: 'var(--m-radius)',
                    pointerEvents: 'none',
                    boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)'
                  }}/>
                </div>
              )
            )}

            {/* Zoom Slider (skip for video) */}
            {!isVideo && naturalDimensions.w > 0 && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--m-text-2)' }}>
                  <span style={{ fontWeight: 600 }}>Zoom da Imagem</span>
                  <span>{Math.round(cropperZoom * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.01"
                  value={cropperZoom}
                  onChange={(e) => {
                    const nextZoom = parseFloat(e.target.value);
                    setCropperZoom(nextZoom);
                    
                    // Adjust offsets to keep it within constraints
                    setCropperOffset(prev => {
                      const initialScale = Math.max(containerSize / naturalDimensions.w, containerSize / naturalDimensions.h);
                      const displayWidth = naturalDimensions.w * initialScale * nextZoom;
                      const displayHeight = naturalDimensions.h * initialScale * nextZoom;
                      const initialX = (containerSize - displayWidth) / 2;
                      const initialY = (containerSize - displayHeight) / 2;
                      
                      const minX = containerSize - displayWidth - initialX;
                      const maxX = -initialX;
                      const minY = containerSize - displayHeight - initialY;
                      const maxY = -initialY;
                      
                      return {
                        x: Math.max(minX, Math.min(maxX, prev.x)),
                        y: Math.max(minY, Math.min(maxY, prev.y))
                      };
                    });
                  }}
                  style={{
                    width: '100%',
                    accentColor: 'var(--m-gold)',
                    background: 'var(--m-border)',
                    height: '6px',
                    borderRadius: '3px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
                <div style={{ fontSize: '0.7rem', color: 'var(--m-muted)', textAlign: 'center' }}>
                  Arraste a foto acima para posicionar e use o controle deslizante para ajustar o zoom.
                </div>
              </div>
            )}

            {/* Category */}
            <div className="m-field" style={{ marginTop: isVideo ? 16 : 0 }}>
              <label className="m-label">Categoria</label>
              <select className="m-select" value={uploadForm.category} onChange={e => setUploadForm(p => ({ ...p, category: e.target.value }))}>
                {GALLERY_CATS.filter(c => c !== 'Todos').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Caption */}
            <div className="m-field">
              <label className="m-label">Legenda</label>
              <input className="m-input" placeholder="Descreva o trabalho..." value={uploadForm.caption} onChange={e => setUploadForm(p => ({ ...p, caption: e.target.value }))}/>
            </div>

            {/* Destination Selection */}
            <div style={{ background:'var(--m-gold-subtle)', border:'0.5px solid var(--m-gold)', borderRadius:'var(--m-radius-sm)', padding:'12px 14px', display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ fontSize:'0.72rem', fontWeight:800, color:'var(--m-gold)', textTransform:'uppercase', letterSpacing:'0.6px' }}>📸 Escolha onde publicar</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', userSelect:'none' }}>
                  <input 
                    type="checkbox" 
                    checked={postToGallery} 
                    onChange={e => setPostToGallery(e.target.checked)}
                    style={{ width:18, height:18, accentColor:'var(--m-gold)' }}
                  />
                  <span style={{ fontSize:'0.78rem', color:'var(--m-text-2)', fontWeight: 600 }}>
                    Galeria do Site (Galeria Pública)
                  </span>
                </label>

                <label style={{ display:'flex', alignItems:'center', gap:10, cursor: (!isVideo && (settings?.automations?.googleGbpConnected || settings?.automations?.googleGbpLocationId || settings?.googleLocationId)) ? 'pointer' : 'not-allowed', userSelect:'none', opacity: (!isVideo && (settings?.automations?.googleGbpConnected || settings?.automations?.googleGbpLocationId || settings?.googleLocationId)) ? 1 : 0.6 }}>
                  <input 
                    type="checkbox" 
                    checked={postToGoogle && !isVideo && !!(settings?.automations?.googleGbpConnected || settings?.automations?.googleGbpLocationId || settings?.googleLocationId)} 
                    disabled={isVideo || !(settings?.automations?.googleGbpConnected || settings?.automations?.googleGbpLocationId || settings?.googleLocationId)}
                    onChange={e => setPostToGoogle(e.target.checked)}
                    style={{ width:18, height:18, accentColor:'var(--m-gold)' }}
                  />
                  <span style={{ fontSize:'0.78rem', color:'var(--m-text-2)', fontWeight: 600 }}>
                    Google Business Photos {isVideo ? '(vídeo não suportado)' : !(settings?.automations?.googleGbpConnected || settings?.automations?.googleGbpLocationId || settings?.googleLocationId) && '(não configurado)'}
                  </span>
                </label>
              </div>
            </div>
          </div>
          <div className="m-sheet-footer" style={{ padding: '12px 20px', borderTop: '0.5px solid var(--m-rule)' }}>
            <button className="m-btn m-btn-outline" style={{ flex:1 }} onClick={() => { setShowUploadSheet(false); setPendingFile(null); setPendingPreviewUrl(''); }}>Cancelar</button>
            <button className="m-btn m-btn-gold" style={{ flex:2 }} onClick={uploadPhoto} disabled={isUploading || (!postToGallery && !postToGoogle)}>
              {isUploading ? <><RefreshCw size={14} style={{ animation:'mSpin 0.8s linear infinite' }}/> Publicando...</> : <><Upload size={14}/> Publicar</>}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Photo Preview ──────────────────────────────────────────────
  const renderPhotoPreview = () => {
    if (!previewPhoto) return null;
    return (
      <div className="m-photo-preview">
        <div className="m-photo-preview-bar">
          <button onClick={() => setPreviewPhoto(null)} style={{ background:'none', border:'none', color:'var(--m-text)', cursor:'pointer', display:'flex', gap:6, alignItems:'center', fontSize:'0.85rem', fontWeight:700, fontFamily:'inherit' }}>
            <ChevronLeft size={18}/> Voltar
          </button>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:'0.8rem', fontWeight:700, color:'var(--m-text)' }}>{previewPhoto.category}</div>
            {previewPhoto.googlePosted && <div style={{ fontSize:'0.65rem', color:'#4285f4', fontWeight:800 }}>✓ Google Business</div>}
          </div>
          <button onClick={() => deletePhoto(previewPhoto)} style={{ background:'none', border:'none', color:'var(--m-red)', cursor:'pointer', display:'flex', alignItems:'center' }}>
            <Trash2 size={18}/>
          </button>
        </div>
        {previewPhoto.type === 'video' ? (
          <video className="m-photo-preview-img" src={previewPhoto.url} controls autoPlay style={{ objectFit: 'contain' }} />
        ) : (
          <img className="m-photo-preview-img" src={previewPhoto.url} alt={previewPhoto.caption}/>
        )}
        {previewPhoto.caption && (
          <div className="m-photo-preview-bar">
            <div style={{ fontSize:'0.82rem', color:'var(--m-text-2)', flex:1, textAlign:'center' }}>{previewPhoto.caption}</div>
          </div>
        )}
      </div>
    );
  };

  // ── Notifications Sheet ────────────────────────────────────────
  const renderNotifSheet = () => {
    if (!showNotifSheet) return null;
    return (
      <div className="m-overlay" onClick={() => setShowNotifSheet(false)}>
        <div className="m-sheet" onClick={e => e.stopPropagation()}>
          <div className="m-sheet-handle"/>
          <div className="m-sheet-header">
            <div className="m-sheet-title">Notificações</div>
            <button onClick={() => setShowNotifSheet(false)} className="m-icon-btn"><X size={18}/></button>
          </div>
          <div className="m-sheet-body" style={{ padding:0 }}>
            {bookings.filter(b => b.status === 'pendente').length === 0 ? (
              <div className="m-empty" style={{ padding:'40px 24px' }}>
                <Bell className="m-empty-icon" size={32}/>
                <div className="m-empty-title">Nenhuma notificação</div>
                <div className="m-empty-sub">Você está em dia!</div>
              </div>
            ) : (
              bookings.filter(b => b.status === 'pendente').map(b => (
                <div key={b.id} className="m-notif-item unread" onClick={() => { setSelectedBooking(b); setShowNotifSheet(false); setShowBookingSheet(true); }}>
                  <div className="m-notif-dot"/>
                  <div>
                    <div style={{ fontSize:'0.85rem', fontWeight:700, color:'var(--m-text)' }}>Agendamento Pendente</div>
                    <div style={{ fontSize:'0.75rem', color:'var(--m-muted)', marginTop:2 }}>{b.clientName} · {fmtDate(b.date)} às {b.time}</div>
                    <div style={{ fontSize:'0.72rem', color:'var(--m-text-2)', marginTop:2 }}>{b.service?.name || b.serviceName}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── FAB Menu Sheet ──────────────────────────────────────────────
  // renderFabMenu: não é mais usado (speed-dial é inline no JSX)
  const renderFabMenu = () => null;

  // ── Product Exit Sheet ──────────────────────────────────────────
  const renderProductExitSheet = () => {
    if (!showProductExitSheet) return null;
    return (
      <div className="m-overlay" onClick={() => setShowProductExitSheet(false)}>
        <div className="m-sheet" onClick={e => e.stopPropagation()}>
          <div className="m-sheet-handle"/>
          <div className="m-sheet-header">
            <div className="m-sheet-title">Saída Avulsa de Produto</div>
            <button onClick={() => setShowProductExitSheet(false)} className="m-icon-btn"><X size={18}/></button>
          </div>
          <div className="m-sheet-body">
            <div className="m-field">
              <label className="m-label">Produto *</label>
              <select 
                className="m-select" 
                value={prodExitSelectedId} 
                onChange={e => setProdExitSelectedId(e.target.value)}
              >
                <option value="">Selecione um produto...</option>
                {inventory.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (Dispo: {p.quantity})</option>
                ))}
              </select>
            </div>

            <div className="m-field">
              <label className="m-label">Quantidade *</label>
              <input 
                className="m-input" 
                type="number" 
                min="1" 
                value={prodExitQuantity} 
                onChange={e => setProdExitQuantity(e.target.value)}
              />
            </div>

            <div className="m-field">
              <label className="m-label">Motivo / Tipo de Saída</label>
              <div className="m-segmented">
                <button className={`m-seg-btn ${prodExitType === 'venda' ? 'active' : ''}`} onClick={() => setProdExitType('venda')}>💰 Venda Avulsa</button>
                <button className={`m-seg-btn ${prodExitType === 'uso' ? 'active' : ''}`} onClick={() => setProdExitType('uso')}>💆 Uso no Salão</button>
              </div>
            </div>
          </div>
          <div className="m-sheet-footer">
            <button className="m-btn m-btn-outline" style={{ flex:1 }} onClick={() => setShowProductExitSheet(false)}>Cancelar</button>
            <button className="m-btn m-btn-gold" style={{ flex:2 }} onClick={handleProductExit}><Check size={14}/> Confirmar Saída</button>
          </div>
        </div>
      </div>
    );
  };

  // ── Quick Block Sheet ───────────────────────────────────────────
  // ── Product Entry Sheet ─────────────────────────────────────────
  const renderProductEntrySheet = () => {
    if (!showProductEntrySheet) return null;
    return (
      <div className="m-overlay" onClick={() => setShowProductEntrySheet(false)}>
        <div className="m-sheet" onClick={e => e.stopPropagation()}>
          <div className="m-sheet-handle"/>
          <div className="m-sheet-header">
            <div className="m-sheet-title">Entrada de Produto</div>
            <button onClick={() => setShowProductEntrySheet(false)} className="m-icon-btn"><X size={18}/></button>
          </div>
          <div className="m-sheet-body">
            <div className="m-field">
              <label className="m-label">Nome do Produto *</label>
              <input
                className="m-input"
                placeholder="Ex: Shampoo Curly 250ml"
                value={prodEntryName}
                onChange={e => setProdEntryName(e.target.value)}
              />
            </div>

            <div className="m-field">
              <label className="m-label">Quantidade *</label>
              <input
                className="m-input"
                type="number"
                min="1"
                value={prodEntryQuantity}
                onChange={e => setProdEntryQuantity(e.target.value)}
              />
            </div>

            <div className="m-field">
              <label className="m-label">Preço de Custo (un.) *</label>
              <input
                className="m-input"
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={prodEntryCost}
                onChange={e => setProdEntryCost(e.target.value)}
              />
            </div>
          </div>
          <div className="m-sheet-footer">
            <button className="m-btn m-btn-outline" style={{ flex:1 }} onClick={() => setShowProductEntrySheet(false)}>Cancelar</button>
            <button className="m-btn m-btn-gold" style={{ flex:2 }} onClick={handleProductEntry}><Check size={14}/> Confirmar Entrada</button>
          </div>
        </div>
      </div>
    );
  };

  const renderQuickBlockSheet = () => {
    if (!showQuickBlockSheet) return null;
    return (
      <div className="m-overlay" onClick={() => setShowQuickBlockSheet(false)}>
        <div className="m-sheet" onClick={e => e.stopPropagation()}>
          <div className="m-sheet-handle"/>
          <div className="m-sheet-header">
            <div className="m-sheet-title">Registrar Ausência</div>
            <button onClick={() => setShowQuickBlockSheet(false)} className="m-icon-btn"><X size={18}/></button>
          </div>
          <div className="m-sheet-body">
            <div className="m-field">
              <label className="m-label">Tipo</label>
              <div className="m-segmented">
                <button className={`m-seg-btn ${qbType === 'folga' ? 'active' : ''}`} onClick={() => setQbType('folga')}>🛌 Folga</button>
                <button className={`m-seg-btn ${qbType === 'compromisso' ? 'active' : ''}`} onClick={() => setQbType('compromisso')}>📌 Compromisso</button>
                <button className={`m-seg-btn ${qbType === 'feriado' ? 'active' : ''}`} onClick={() => setQbType('feriado')}>🎉 Feriado</button>
              </div>
            </div>
            <div className="m-field">
              <label className="m-label">Data</label>
              <input
                className="m-input"
                type="date"
                value={qbDate}
                onChange={e => setQbDate(e.target.value)}
              />
            </div>
            <div style={{ display:'flex', gap:12 }}>
              <div className="m-field" style={{ flex:1 }}>
                <label className="m-label">Início</label>
                <select 
                  className="m-select" 
                  value={qbStart} 
                  onChange={e => setQbStart(e.target.value)}
                >
                  {SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="m-field" style={{ flex:1 }}>
                <label className="m-label">Fim</label>
                <select 
                  className="m-select" 
                  value={qbEnd} 
                  onChange={e => setQbEnd(e.target.value)}
                >
                  {SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="m-field">
              <label className="m-label">Motivo (opcional)</label>
              <input 
                className="m-input" 
                placeholder="Ex: Reunião externa, manutenção..." 
                value={qbMotive} 
                onChange={e => setQbMotive(e.target.value)}
              />
            </div>
          </div>
          <div className="m-sheet-footer">
            <button className="m-btn m-btn-outline" style={{ flex:1 }} onClick={() => setShowQuickBlockSheet(false)}>Cancelar</button>
            <button className="m-btn m-btn-gold" style={{ flex:2 }} onClick={handleQuickBlock}><Check size={14}/> Registrar Ausência</button>
          </div>
        </div>
      </div>
    );
  };

  // ── Absence Sheet (Nova / Editar Ausência) ──────────────────────
  const renderAbsenceSheet = () => {
    if (!showAbsenceSheet) return null;
    return (
      <div className="m-overlay" onClick={() => setShowAbsenceSheet(false)}>
        <div className="m-sheet" onClick={e => e.stopPropagation()}>
          <div className="m-sheet-handle"/>
          <div className="m-sheet-header">
            <div className="m-sheet-title">{editingAbsenceId ? 'Editar Ausência' : 'Nova Ausência'}</div>
            <button onClick={() => setShowAbsenceSheet(false)} className="m-icon-btn"><X size={18}/></button>
          </div>
          <div className="m-sheet-body">
            <div className="m-field">
              <label className="m-label">Título *</label>
              <input
                className="m-input"
                placeholder="Ex: Consulta, Viagem, Folga"
                value={absTitle}
                onChange={e => setAbsTitle(e.target.value)}
              />
            </div>

            <div className="m-field">
              <label className="m-label">Recorrência</label>
              <div className="m-segmented">
                <button className={`m-seg-btn ${absRecurrence === 'none' ? 'active' : ''}`} onClick={() => setAbsRecurrence('none')}>Não repete</button>
                <button className={`m-seg-btn ${absRecurrence === 'weekly' ? 'active' : ''}`} onClick={() => setAbsRecurrence('weekly')}>Semanal</button>
                <button className={`m-seg-btn ${absRecurrence === 'monthly' ? 'active' : ''}`} onClick={() => setAbsRecurrence('monthly')}>Mensal</button>
              </div>
            </div>

            <div className="m-field">
              <label className="m-label">
                {absRecurrence === 'weekly' ? 'Data (define o dia da semana)' : absRecurrence === 'monthly' ? 'Data (define o dia do mês)' : 'Data início'}
              </label>
              <input
                className="m-input"
                type="date"
                value={absStartDate}
                onChange={e => { setAbsStartDate(e.target.value); if (absSingleDay) setAbsEndDate(e.target.value); }}
              />
            </div>

            {absRecurrence === 'none' && (
              <>
                <div className="m-field">
                  <label className="m-label">Período</label>
                  <div className="m-segmented">
                    <button className={`m-seg-btn ${absSingleDay ? 'active' : ''}`} onClick={() => { setAbsSingleDay(true); setAbsEndDate(absStartDate); }}>Apenas este dia</button>
                    <button className={`m-seg-btn ${!absSingleDay ? 'active' : ''}`} onClick={() => setAbsSingleDay(false)}>Intervalo de dias</button>
                  </div>
                </div>
                {!absSingleDay && (
                  <div className="m-field">
                    <label className="m-label">Data fim</label>
                    <input
                      className="m-input"
                      type="date"
                      value={absEndDate}
                      min={absStartDate}
                      onChange={e => setAbsEndDate(e.target.value)}
                    />
                  </div>
                )}
              </>
            )}

            <div className="m-field">
              <label className="m-label">Horário</label>
              <div className="m-segmented">
                <button className={`m-seg-btn ${absAllDay ? 'active' : ''}`} onClick={() => setAbsAllDay(true)}>Dia inteiro</button>
                <button className={`m-seg-btn ${!absAllDay ? 'active' : ''}`} onClick={() => setAbsAllDay(false)}>Horário específico</button>
              </div>
            </div>

            {!absAllDay && (
              <div style={{ display:'flex', gap:12 }}>
                <div className="m-field" style={{ flex:1 }}>
                  <label className="m-label">Início</label>
                  <select className="m-select" value={absStartTime} onChange={e => setAbsStartTime(e.target.value)}>
                    {SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="m-field" style={{ flex:1 }}>
                  <label className="m-label">Fim</label>
                  <select className="m-select" value={absEndTime} onChange={e => setAbsEndTime(e.target.value)}>
                    {SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>
          <div className="m-sheet-footer">
            <button className="m-btn m-btn-outline" style={{ flex:1 }} onClick={() => setShowAbsenceSheet(false)}>Cancelar</button>
            <button className="m-btn m-btn-gold" style={{ flex:2 }} onClick={saveAbsence}><Check size={14}/> Salvar Ausência</button>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════════
  const NAV_ITEMS = [
    { id:'hoje',     icon:<Home size={20}/>,         label:'Hoje' },
    { id:'agenda',   icon:<Calendar size={20}/>,     label:'Agenda' },
    { id:'galeria',  icon:<Camera size={20}/>,       label:'Galeria' },
    { id:'clientes', icon:<Users size={20}/>,        label:'Clientes' },
    { id:'caixa',    icon:<DollarSign size={20}/>,   label:'Caixa' },
    { id:'mais',     icon:<MoreHorizontal size={20}/>, label:'Mais' },
  ];

  const headerTitles = {
    hoje: 'Studio do Jon',
    agenda: 'Agenda',
    galeria: 'Galeria & Fotos',
    clientes: 'Clientes',
    caixa: 'Caixa',
    mais: maisSection ? '' : 'Mais'
  };

  return (
    <div className="mobile-app">
      {/* Header */}
      <header className="m-header">
        <div className="m-header-left">
          {tab === 'mais' && maisSection ? (
            <button className="m-header-back" onClick={() => setMaisSection(null)}>
              <ChevronLeft size={18}/> Voltar
            </button>
          ) : (
            <>
              <img src="/favicon.ico" className="m-header-logo" alt="Logo" onError={e => { e.target.style.display='none'; }}/>
              <div>
                <div className="m-header-title">{headerTitles[tab]}</div>
                {tab === 'hoje' && <div className="m-header-subtitle">Painel Admin</div>}
              </div>
            </>
          )}
        </div>
        <div className="m-header-right">
          <button className={`m-icon-btn ${unreadCount > 0 ? 'active' : ''}`} onClick={() => setShowNotifSheet(true)}>
            <Bell size={18}/>
            {unreadCount > 0 && <div className="m-badge">{unreadCount > 9 ? '9+' : unreadCount}</div>}
          </button>
          {pendingCount > 0 && (
            <button className="m-icon-btn active" onClick={() => setShowNotifSheet(true)}>
              <AlertCircle size={18}/>
              <div className="m-badge" style={{ background:'var(--m-amber)', color:'#0E0C0B' }}>{pendingCount}</div>
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="m-content">
        {tab === 'hoje'     && renderHoje()}
        {tab === 'agenda'   && renderAgenda()}
        {tab === 'galeria'  && renderGaleria()}
        {tab === 'clientes' && renderClientes()}
        {tab === 'caixa'    && renderCaixa()}
        {tab === 'mais'     && renderMais()}
      </main>

      {/* Bottom Navigation */}
      <nav className="m-bottom-nav">
        {NAV_ITEMS.map(item => (
          <button key={item.id} className={`m-nav-item ${tab === item.id ? 'active' : ''}`} onClick={() => { setTab(item.id); if (item.id !== 'mais') setMaisSection(null); }}>
            <div className="m-nav-icon-wrap">{item.icon}</div>
            <span className="m-nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Speed-Dial FAB */}
      {(tab === 'hoje' || tab === 'agenda') && (
        <>
          {showFabMenu && <div className="m-fab-backdrop" onClick={() => setShowFabMenu(false)} />}
          <div className="m-fab-container">
            {showFabMenu && (
              <div className="m-fab-actions">
                {/* Saida de Produto */}
                <button className="m-fab-action" onClick={() => { setShowFabMenu(false); setShowProductExitSheet(true); }}>
                  <span className="m-fab-action-label">Saída de Produto</span>
                  <span className="m-fab-action-icon" style={{ background:'rgba(101,146,255,0.15)', color:'var(--m-blue)' }}><Package size={18}/></span>
                </button>
                {/* Cadastrar Cliente */}
                <button className="m-fab-action" onClick={() => { setShowFabMenu(false); setShowNewClientSheet(true); }}>
                  <span className="m-fab-action-label">Cadastrar Cliente</span>
                  <span className="m-fab-action-icon" style={{ background:'rgba(52,199,89,0.15)', color:'var(--m-green)' }}><Users size={18}/></span>
                </button>
                {/* Criar Agendamento */}
                <button className="m-fab-action" onClick={() => { setShowFabMenu(false); setShowNewBookingSheet(true); }}>
                  <span className="m-fab-action-label">Criar Agendamento</span>
                  <span className="m-fab-action-icon" style={{ background:'var(--m-gold-subtle)', color:'var(--m-gold)' }}><Calendar size={18}/></span>
                </button>
              </div>
            )}
            <button className={`m-fab ${showFabMenu ? 'open' : ''}`} onClick={() => setShowFabMenu(v => !v)}>
              <Plus size={22}/>
            </button>
          </div>
        </>
      )}
      {tab === 'galeria' && (
        <div className="m-fab-container">
          <button className="m-fab" onClick={() => galleryInputRef.current?.click()}>
            <Camera size={22}/>
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)}/>}

      {/* Sheets */}
      {renderFabMenu()}
      {renderProductExitSheet()}
      {renderProductEntrySheet()}
      {renderAbsenceSheet()}
      {renderQuickBlockSheet()}
      {renderBookingSheet()}
      {renderSlotSheet()}
      {renderCheckoutSheet()}
      {renderNewBookingSheet()}
      {renderEditBookingSheet()}
      {renderClientSheet()}
      {renderNewClientSheet()}
      {renderAddTxSheet()}
      {renderUploadSheet()}
      {renderNotifSheet()}

      {/* Photo preview (fullscreen) */}
      {renderPhotoPreview()}
    </div>
  );
}
