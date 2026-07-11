import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../../config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, setDoc, getDoc, writeBatch
} from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { getEffectiveAbsences, absenceCoversDate } from '../../utils/absences';
import {
  Home, Calendar, Camera, Users, DollarSign, MoreHorizontal,
  Plus, Bell, ChevronLeft, ChevronRight, X, Check, Phone, MessageSquare,
  Scissors, Package, TrendingUp, TrendingDown, Search, Settings, Trash2,
  Edit3, ArrowRight, LogOut, BarChart2, Send, ShoppingBag, Clock,
  Zap, Star, AlertCircle, CheckCircle, Upload, Image, RefreshCw, Eye, Lock
} from 'lucide-react';
import './AdminMobile.css';
import { syncBookingToGoogle } from '../../utils/gcalSync';
import { calculateNetValue } from '../../utils/finance';

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



const getServiceCategory = (serviceName = '', servicesList = [], booking = null) => {
  const name = (serviceName || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const isBlocked = booking && (
    booking.status === 'bloqueado' ||
    (booking.clientName || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes('bloqueado') ||
    (booking.clientName || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes('bloqueio') ||
    (booking.clientName || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes('ausencia') ||
    (booking.clientName || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes('indisponivel')
  );

  const matched = servicesList.find(s => (s.name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() === name);
  let category = matched?.category;

  if (isBlocked || name.includes('bloqueado') || name.includes('bloqueio') || name.includes('ausencia') || name.includes('indisponivel')) {
    category = 'Ausência';
  } else if (name.includes('almoco') || name.includes('almo\u00e7o')) {
    category = 'Almo\u00e7o';
  }

  if (!category) {
    if (name.includes('almoco') || name.includes('almo\u00e7o')) {
      category = 'Almo\u00e7o';
    } else {
      const hasCombo = name.includes('combo') || name.includes('misto');
      const hasCorte = /\b(corte|cortes)\b/.test(name);
      const hasTratamento = /\b(tratamento|tratamentos|terapia|cronograma|hidrat|hidratacao)\b/.test(name);
      const hasCor = /\b(cor|coloracao|colora|mechas|luzes|tonaliza)\b/.test(name);

      if (hasCombo || (hasCorte && (hasTratamento || hasCor))) {
        category = 'Combo';
      } else if (hasCorte) {
        category = 'Corte';
      } else if (hasCor) {
        category = 'Cor';
      } else if (name.includes('analise') || name.includes('avaliacao') || name.includes('teste')) {
        category = 'Análise';
      } else if (name.includes('bloqueado') || name.includes('bloqueio') || name.includes('ausencia') || name.includes('indisponivel')) {
        category = 'Ausência';
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
  if (catLower.includes('ausencia') || catLower.includes('bloqueio') || catLower.includes('indisponivel') || catLower.includes('bloqueado')) {
    return { class: 'svc-ausencia', badge: 'AUSÊNCIA' };
  }
  return { class: 'svc-tratamento', badge: 'TRATAMENTO' };
};

const calculateOverlappingLayout = (items) => {
  if (!items || items.length === 0) return [];
  const sorted = [...items].sort((a, b) => {
    if (a.startMin !== b.startMin) return a.startMin - b.startMin;
    return (b.endMin - b.startMin) - (a.endMin - a.startMin);
  });

  const clusters = [];
  let currentCluster = [];
  let clusterEnd = 0;

  sorted.forEach(item => {
    if (currentCluster.length === 0) {
      currentCluster.push(item);
      clusterEnd = item.endMin;
    } else if (item.startMin < clusterEnd) {
      currentCluster.push(item);
      clusterEnd = Math.max(clusterEnd, item.endMin);
    } else {
      clusters.push(currentCluster);
      currentCluster = [item];
      clusterEnd = item.endMin;
    }
  });
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  const result = [];

  clusters.forEach(cluster => {
    const columns = [];
    cluster.forEach(item => {
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
  });

  return result;
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
  if (localStorage.getItem(`scale_unlock_${dateStr}_${slot}`) === 'true') return false;
  if (localStorage.getItem(`scale_unlock_${dateStr}_all`) === 'true') return false;
  if (!prof) return false;
  
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const weekday = getAdjustedDay(dateObj);
    
    // Force Sundays (0) and Mondays (1) to be blocked
    if (weekday === 0 || weekday === 1) return true;

    // Force Holidays to be blocked
    if (isFeriado(dateStr)) return true;

    // Force 19:00, 20:00, 21:00 slots on Tue-Sat to be out of scale
    if (weekday >= 2 && weekday <= 6) {
      if (['19:00', '19:30', '20:00', '20:30', '21:00'].includes(slot)) {
        return true;
      }
    }
    
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
  const cleaned = cleanStatus(status);
  const labels = { 
    pendente: 'Pendente', 
    confirmado: 'Confirmado', 
    'confirmado pela cliente': 'Confirmado p/ Cliente', 
    finalizado: 'Finalizado', 
    cancelado: 'Cancelado', 
    faltou: 'Faltou', 
    bloqueado: 'Bloqueado' 
  };
  return <span className={`m-status-pill ${cleaned}`}>{labels[cleaned] || status}</span>;
}

// Helper to normalize booking statuses case-insensitively, removing hyphens and accents.
const cleanStatus = (status) => {
  if (!status) return '';
  return status
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/-/g, ' ')
    .trim();
};

// Helper to normalize search text by stripping accents, lowercasing, and trimming
const cleanSearchText = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

// Matches product name if all search terms are prefix of at least one word in the product name
const matchSearchText = (productName, searchText) => {
  if (!productName || !searchText) return false;
  const searchTerms = cleanSearchText(searchText).split(/\s+/).filter(Boolean);
  if (searchTerms.length === 0) return false;
  
  const productWords = cleanSearchText(productName).split(/\s+/).filter(Boolean);
  
  return searchTerms.every(term => 
    productWords.some(word => word.startsWith(term))
  );
};

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
  const [showScaleBlockSheet, setShowScaleBlockSheet] = useState(false);
  const [selectedScaleBlock, setSelectedScaleBlock] = useState(null);
  const [showNewBookingSheet, setShowNewBookingSheet] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingSheet, setShowBookingSheet] = useState(false);
  const [showCheckoutSheet, setShowCheckoutSheet] = useState(false);
  const [checkoutBooking, setCheckoutBooking] = useState(null);

  // States de pacotes no Mobile
  const [clientPackages, setClientPackages] = useState([]);
  const [usingClientPackageId, setUsingClientPackageId] = useState('');
  const [sellingPackageId, setSellingPackageId] = useState('');

  const clientActivePackages = useMemo(() => {
    if (!checkoutBooking) return [];
    const phone = (checkoutBooking.clientPhone || '').replace(/\D/g, '');
    const name = (checkoutBooking.clientName || '').trim().toLowerCase();
    return clientPackages.filter(cp => {
      if (cp.status !== 'active') return false;
      const cpPhone = (cp.clientPhone || '').replace(/\D/g, '');
      const cpName = (cp.clientName || '').trim().toLowerCase();
      return (phone && cpPhone === phone) || (name && cpName === name);
    });
  }, [checkoutBooking, clientPackages]);

  const availablePackagesForBooking = useMemo(() => {
    if (!checkoutBooking || !services) return [];
    const bookingServiceName = checkoutBooking.service?.name || checkoutBooking.serviceName;
    const servObj = services.find(s => s.name === bookingServiceName);
    if (!servObj) return [];
    
    return clientActivePackages.filter(cp => cp.balance && cp.balance[servObj.id] > 0);
  }, [checkoutBooking, clientActivePackages, services]);

  // ── Checkout form ──────────────────────────────────────────────
  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [selectedServices, setSelectedServices] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [isFinalizingCheckout, setIsFinalizingCheckout] = useState(false);

  const [overrideBasePrice, setOverrideBasePrice] = useState(null);
  const [requestReview, setRequestReview] = useState(false);
  const [usedProducts, setUsedProducts] = useState([]);
  const [nonRegisteredProducts, setNonRegisteredProducts] = useState([]);
  const [salonProducts, setSalonProducts] = useState([]);
  const [selectedUsedProduct, setSelectedUsedProduct] = useState('');
  const [newNonRegName, setNewNonRegName] = useState('');
  const [newNonRegVal, setNewNonRegVal] = useState(0);

  // Split payment states
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [splitValues, setSplitValues] = useState({
    'Pix': 0,
    'Cartão de Crédito': 0,
    'Cartão de Débito': 0,
    'Dinheiro': 0,
    'Cortesia': 0
  });
  const [splitInstallments, setSplitInstallments] = useState('À vista');
  const [splitCreditAnticipation, setSplitCreditAnticipation] = useState(false);
  const [splitDebitAnticipation, setSplitDebitAnticipation] = useState(false);

  const [touchStart, setTouchStart] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);
  const [activeSwipeDirection, setActiveSwipeDirection] = useState(null);
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [slideStyle, setSlideStyle] = useState({});
  const [transitioning, setTransitioning] = useState(false);

  // ── New Booking Form ───────────────────────────────────────────
  const [nbForm, setNbForm] = useState({ clientName:'', clientPhone:'', serviceName:'', servicePrice:'', date: today(), time:'09:00', notes:'', prepayment: '', bookingType: 'service', packageId: '', packageName: '' });
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
  const [exitCart, setExitCart] = useState([]);
  const [exitClientType, setExitClientType] = useState('avulso');
  const [exitClientPhone, setExitClientPhone] = useState('');
  const [exitClientSearch, setExitClientSearch] = useState('');
  const [exitPaymentMethod, setExitPaymentMethod] = useState('Pix');
  const [exitProductSearch, setExitProductSearch] = useState('');

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
  const [period, setPeriod] = useState('dia');
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

      let loadedCount = 0;
      // Gallery is NOT in the critical path — 7 collections unlock the UI
      const CRITICAL_TOTAL = 7;
      const checkLoaded = (key) => {
        if (key === 'bookings' && !bookingsLoaded) { bookingsLoaded = true; loadedCount++; }
        if (key === 'clients' && !clientsLoaded) { clientsLoaded = true; loadedCount++; }
        if (key === 'transactions' && !transactionsLoaded) { transactionsLoaded = true; loadedCount++; }
        if (key === 'services' && !servicesLoaded) { servicesLoaded = true; loadedCount++; }
        if (key === 'inventory' && !inventoryLoaded) { inventoryLoaded = true; loadedCount++; }
        if (key === 'packages' && !packagesLoaded) { packagesLoaded = true; loadedCount++; }
        if (key === 'settings' && !settingsLoaded) { settingsLoaded = true; loadedCount++; }

        if (loadedCount >= CRITICAL_TOTAL) {
          setLoading(false);
          if (failSafeTimeout) clearTimeout(failSafeTimeout);
        }
      };

      const handleError = (key, err) => {
        console.error(`Error loading ${key}:`, err);
        checkLoaded(key);
      };

      // Failsafe: unlock UI after 800ms even if a collection is slow
      failSafeTimeout = setTimeout(() => {
        setLoading(false);
      }, 800);

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

        unsubs.push(onSnapshot(collection(db, 'salon_products'), (snap) => {
          setSalonProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (err) => console.error('Error loading salon_products:', err)));

        unsubs.push(onSnapshot(collection(db, 'packages'), (snap) => {
          setPackages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          checkLoaded('packages');
        }, (err) => handleError('packages', err)));

        unsubs.push(onSnapshot(collection(db, 'client_packages'), (snap) => {
          setClientPackages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (err) => console.error('Error loading client_packages:', err)));

        unsubs.push(onSnapshot(doc(db, 'settings', 'studio'), (snap) => {
          setSettings(snap.exists() ? { id: snap.id, ...snap.data() } : { name: 'Studio do Jon', professionals: [{ id: 'jon', name: 'Jon', active: true }] });
          checkLoaded('settings');
        }, (err) => handleError('settings', err)));

        // Gallery is NOT critical — loads lazily without blocking UI spinner
        unsubs.push(onSnapshot(collection(db, 'gallery_photos'), (snap) => {
          const sorted = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setGalleryPhotos(sorted);
        }, (err) => console.error('Error loading gallery_photos:', err)));

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
  const todayBookings = useMemo(() => {
    return bookings
      .filter(b => b.date === today() && b.status !== 'cancelado' && b.status !== 'bloqueado')
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [bookings]);

  const todayRevenue = useMemo(() => {
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
  }, [transactions]);

  const monthRevenue = useMemo(() => {
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
  }, [transactions]);

  const pendingCount = useMemo(() => {
    return bookings.filter(b => b.status === 'pendente').length;
  }, [bookings]);

  // Pre-calculate count of bookings per client name and phone for recurrent check in O(N) instead of O(N^2)
  const clientBookingCounts = useMemo(() => {
    const counts = {};
    bookings.forEach(b => {
      if (b.status === 'cancelado' || b.status === 'bloqueado') return;
      const cleanName = (b.clientName || '').trim().toLowerCase();
      const cleanPhone = (b.clientPhone || b.phone || '').replace(/\D/g, '');
      if (cleanName) {
        counts[cleanName] = (counts[cleanName] || 0) + 1;
      }
      if (cleanPhone) {
        counts[cleanPhone] = (counts[cleanPhone] || 0) + 1;
      }
    });
    return counts;
  }, [bookings]);

  const isClientRecurrent = useCallback((clientName, clientPhone) => {
    if (!clientName) return false;
    const cleanName = clientName.trim().toLowerCase();
    const cleanPhone = (clientPhone || '').replace(/\D/g, '');
    const nameCount = clientBookingCounts[cleanName] || 0;
    const phoneCount = cleanPhone ? (clientBookingCounts[cleanPhone] || 0) : 0;
    return nameCount > 1 || phoneCount > 1;
  }, [clientBookingCounts]);

  const agendaDayData = useMemo(() => {
    const dayBookings = bookings.filter(b => b.date === currentDate && b.status !== 'cancelado');
    const prof = (settings?.professionals || []).find(p => p.id === 'jon') || (settings?.professionals || [])[0] || { id: 'jon', name: 'Jon', active: true };
    
    // Collect absences
    const effectiveAbsences = getEffectiveAbsences(settings);
    const dayAbsences = effectiveAbsences.filter(a => absenceCoversDate(a, currentDate));

    // Lunch lock
    const isUnlockedLocal = localStorage.getItem(`unlock_${currentDate}_12:00`) === 'true';
    const hasLunchBooking = dayBookings.some(b => {
      const bStart = timeToMin(b.time);
      const bEnd = bStart + (b.duration || 60);
      return Math.max(bStart, 720) < Math.min(bEnd, 780);
    });
    const isLunchLocked = !isUnlockedLocal && !hasLunchBooking;

    const layoutItems = [];

    // Add bookings
    dayBookings.forEach(b => {
      layoutItems.push({
        id: b.id,
        type: 'booking',
        startMin: timeToMin(b.time),
        endMin: timeToMin(b.time) + (b.duration || 60),
        raw: b
      });
    });

    const dtForLabel = parseLocalDate(currentDate);
    const isSunMon = (getAdjustedDay(dtForLabel) === 0 || getAdjustedDay(dtForLabel) === 1);
    const isHolidayDay = isFeriado(currentDate);
    const isFullDayUnlocked = localStorage.getItem(`scale_unlock_${currentDate}_all`) === 'true';

    if ((isHolidayDay || isSunMon) && !isFullDayUnlocked) {
      layoutItems.push({
        id: 'full-day-block',
        type: 'scale_block',
        startMin: 480, // 08:00
        endMin: 1260,  // 21:00
        label: isHolidayDay ? 'Feriado' : 'Folga',
        raw: { label: isHolidayDay ? 'Feriado' : 'Folga' }
      });
    } else {
      // Check scale blocks from professional config (hourly)
      HOURLY_SLOTS.forEach(slot => {
        if (isSlotBlocked(prof, currentDate, slot)) {
          const slotMin = timeToMin(slot);
          const hasBookingOrAbsence = dayBookings.some(b => {
            const bStart = timeToMin(b.time);
            const bEnd = bStart + (b.duration || 60);
            return slotMin >= bStart && slotMin < bEnd;
          }) || dayAbsences.some(abs => {
            const start = abs.allDay ? '08:00' : (abs.startTime || '08:00');
            const end = abs.allDay ? '21:00' : (abs.endTime || '21:00');
            const absStart = timeToMin(start);
            const absEnd = timeToMin(end);
            return slotMin >= absStart && slotMin < absEnd;
          });

          if (!hasBookingOrAbsence) {
            layoutItems.push({
              id: `scale-block-${slot}`,
              type: 'scale_block',
              startMin: slotMin,
              endMin: slotMin + 60,
              label: 'Fora de Escala',
              raw: { label: 'Fora de Escala', slot }
            });
          }
        }
      });

      // Add default lunch block
      if (isLunchLocked) {
        layoutItems.push({
          id: 'lunch-block',
          type: 'lunch_block',
          startMin: 720, // 12:00
          endMin: 780,  // 13:00
          label: 'Almoço',
          raw: { label: 'Almoço' }
        });
      }
    }

    // Add absences
    dayAbsences.forEach((abs, idx) => {
      const start = abs.allDay ? '08:00' : (abs.startTime || '08:00');
      const end = abs.allDay ? '21:00' : (abs.endTime || '21:00');
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

    return { positionedItems, layoutItems, isLunchLocked };
  }, [bookings, currentDate, settings]);

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
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);
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
    setTouchStartY(e.targetTouches[0].clientY);
    setActiveSwipeDirection(null);
    setIsDragging(false);
  };

  const handleTouchMove = (e) => {
    if (touchStart === null) return;
    const currentTouchX = e.targetTouches[0].clientX;
    const currentTouchY = e.targetTouches[0].clientY;
    const diffX = currentTouchX - touchStart;
    const diffY = currentTouchY - (touchStartY !== null ? touchStartY : currentTouchY);

    let direction = activeSwipeDirection;
    if (direction === null) {
      const absX = Math.abs(diffX);
      const absY = Math.abs(diffY);
      if (absX > 10 || absY > 10) {
        if (absX > absY) {
          direction = 'horizontal';
          setActiveSwipeDirection('horizontal');
          setIsDragging(true);
        } else {
          direction = 'vertical';
          setActiveSwipeDirection('vertical');
        }
      }
    }

    if (direction === 'horizontal') {
      const cappedDiff = Math.max(-150, Math.min(150, diffX));
      setTranslateX(cappedDiff);
      if (e.cancelable) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setActiveSwipeDirection(null);
    setTouchStartY(null);
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
    setTouchStartY(e.clientY);
    setActiveSwipeDirection(null);
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (touchStart === null) return;
    const diffX = e.clientX - touchStart;
    const diffY = e.clientY - (touchStartY !== null ? touchStartY : e.clientY);

    let direction = activeSwipeDirection;
    if (direction === null) {
      const absX = Math.abs(diffX);
      const absY = Math.abs(diffY);
      if (absX > 10 || absY > 10) {
        if (absX > absY) {
          direction = 'horizontal';
          setActiveSwipeDirection('horizontal');
          setIsDragging(true);
        } else {
          direction = 'vertical';
          setActiveSwipeDirection('vertical');
        }
      }
    }

    if (direction === 'horizontal') {
      const cappedDiff = Math.max(-150, Math.min(150, diffX));
      setTranslateX(cappedDiff);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setActiveSwipeDirection(null);
    setTouchStartY(null);
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

  const getSuppliesForService = (booking) => {
    if (!booking || !salonProducts || salonProducts.length === 0) return [];
    const serviceName = booking.serviceName || booking.service?.name || '';
    const serviceId = booking.serviceId || booking.service?.id || '';
    const matchedSupplies = [];
    salonProducts.forEach(p => {
      if (p.usedIn && p.usedIn.length > 0) {
        const match = p.usedIn.find(ui => 
          (serviceId && ui.serviceId === serviceId) || 
          (ui.serviceName && ui.serviceName.toLowerCase() === serviceName.toLowerCase())
        );
        if (match) {
          const portionAmount = Number(match.amount) || 0;
          const pricePerUnit = p.pricePerUnit || (p.volumetry > 0 ? p.costPrice / p.volumetry : 0);
          const calculatedCost = Number((pricePerUnit * portionAmount).toFixed(2)) || p.costPrice || 0;
          matchedSupplies.push({
            productId: p.id,
            name: p.name,
            basePrice: p.costPrice || p.price || 0,
            totalVolumetry: Number(p.volumetry) || 0,
            usedVolumetry: portionAmount,
            price: calculatedCost,
            quantity: p.volumetry > 0 ? Number((portionAmount / p.volumetry).toFixed(4)) : 1,
            amount: portionAmount,
            unit: p.unit || ''
          });
        }
      }
    });
    return matchedSupplies;
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
        setUsedProducts(tx.usedProducts || []);
        setNonRegisteredProducts(tx.nonRegisteredProducts || []);
      } else {
        setPaymentMethod('Pix');
        setInstallments('À vista');
        setApplyAnticipation(false);
        setSelectedProducts([]);
        setSelectedServices([]);
        const serviceSupplies = getSuppliesForService(booking);
        const defaultUsed = serviceSupplies.filter(supply => {
          const ln = supply.name.toLowerCase();
          return ln.includes('shampoo') || ln.includes('condicionador') || ln.includes('finalizador') || ln.includes('oleo') || ln.includes('óleo');
        });
        setUsedProducts(defaultUsed);
        setNonRegisteredProducts([]);
        setDiscount(0);
      }
      // Prefer saved serviceBasePrice from transaction, then booking.servicePrice, then service catalog price
      const bp = (tx && tx.serviceBasePrice != null && tx.serviceBasePrice !== '')
        ? tx.serviceBasePrice
        : (booking.servicePrice != null && booking.servicePrice !== '')
          ? booking.servicePrice
          : (booking.service?.promoPrice || booking.service?.price || 0);
      setOverrideBasePrice(bp);
    } else {
      setPaymentMethod('Pix');
      setInstallments('À vista');
      setApplyAnticipation(false);
      setSelectedProducts([]);
      setSelectedServices([]);
      const serviceSupplies = getSuppliesForService(booking);
      const defaultUsed = serviceSupplies.filter(supply => {
        const ln = supply.name.toLowerCase();
        return ln.includes('shampoo') || ln.includes('condicionador') || ln.includes('finalizador') || ln.includes('oleo') || ln.includes('óleo');
      });
      setUsedProducts(defaultUsed);
      setNonRegisteredProducts([]);
      setDiscount(0);
      const bp = (booking.servicePrice != null && booking.servicePrice !== '' && Number(booking.servicePrice) > 0)
        ? booking.servicePrice
        : (booking.service?.promoPrice || booking.service?.price || basePrice || 0);
      setOverrideBasePrice(bp);
    }
    
    setProductSearch('');
    setServiceSearch('');
    setRequestReview(false);
    setShowBookingSheet(false);
    setShowCheckoutSheet(true);
  };

  const addUsedProductToCheckout = (prod) => {
    setUsedProducts(prev => {
      const existing = prev.find(p => p.productId === prod.id);
      if (existing) return prev;
      
      const totalVol = Number(prod.volumetry) || 0;
      const basePr = Number(prod.costPrice || prod.price || 0);
      const unit = prod.unit || 'g';
      
      const initialUsed = totalVol > 0 ? Math.min(10, totalVol) : 1;
      const calculatedCost = totalVol > 0 ? (initialUsed / totalVol) * basePr : basePr;
      
      return [...prev, {
        productId: prod.id,
        name: prod.name,
        basePrice: basePr,
        totalVolumetry: totalVol,
        usedVolumetry: initialUsed,
        unit: unit,
        price: Number(calculatedCost.toFixed(2)),
        quantity: totalVol > 0 ? Number((initialUsed / totalVol).toFixed(4)) : 1
      }];
    });
    setSelectedUsedProduct('');
  };

  const changeUsedProductVolumetry = (productId, val) => {
    setUsedProducts(prev =>
      prev.map(p => {
        if (p.productId !== productId) return p;
        
        const usedVol = Math.max(0, val);
        const calculatedCost = p.totalVolumetry > 0 
          ? (usedVol / p.totalVolumetry) * p.basePrice 
          : usedVol * p.basePrice;
          
        return {
          ...p,
          usedVolumetry: usedVol,
          price: Number(calculatedCost.toFixed(2)),
          quantity: p.totalVolumetry > 0 ? Number((usedVol / p.totalVolumetry).toFixed(4)) : usedVol
        };
      })
    );
  };

  const removeUsedProductMobile = (productId) => {
    setUsedProducts(prev => prev.filter(p => p.productId !== productId));
  };

  const getCheckoutTotal = () => {
    if (!checkoutBooking) return 0;
    const base = overrideBasePrice !== null && overrideBasePrice !== ''
      ? Number(overrideBasePrice)
      : 0;
    const extraServices = selectedServices.reduce((s, x) => s + x.price * x.qty, 0);
    const prods = selectedProducts.reduce((s, p) => s + p.sellingPrice * p.qty, 0);
    const prepay = Number(checkoutBooking.prepayment || 0);
    return Math.max(0, base + extraServices + prods - discount - prepay);
  };

  const addProductToCheckout = (prod) => {
    setSelectedProducts(prev => {
      const existing = prev.find(p => p.id === prod.id);
      if (existing) return prev.map(p => p.id === prod.id ? { ...p, qty: p.qty + 1 } : p);
      const priceToUse = prod.sellingPrice || prod.price || 0;
      return [...prev, { ...prod, sellingPrice: priceToUse, qty: 1 }];
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

    const cleanPhone = (checkoutBooking.clientPhone || '').replace(/\D/g, '');
    const hasValidPhone = cleanPhone && cleanPhone.length >= 10;
    const gateway = settings?.waReminderGateway;
    const needsWaOpen = requestReview && hasValidPhone && (!gateway || gateway === 'none');
    let waWindow = null;
    if (needsWaOpen) {
      try {
        waWindow = window.open('', '_blank');
      } catch (e) {
        console.warn('Failed to pre-open window:', e);
      }
    }

    try {
      const total = getCheckoutTotal();
      let methodLabel = '';
      let splitPaymentsList = [];

      if (isSplitPayment) {
        const activeSplits = Object.entries(splitValues).filter(([_, val]) => val > 0);
        methodLabel = activeSplits.map(([method, val]) => {
          if (method === 'Cartão de Crédito') {
            return `Cartão de Crédito (${splitInstallments})${splitCreditAnticipation ? ' (Antecipado)' : ''}: R$ ${val.toFixed(2)}`;
          }
          if (method === 'Cartão de Débito') {
            return `Cartão de Débito${splitDebitAnticipation ? ' (Antecipado)' : ''}: R$ ${val.toFixed(2)}`;
          }
          return `${method}: R$ ${val.toFixed(2)}`;
        }).join(' + ');

        splitPaymentsList = activeSplits.map(([method, val]) => ({
          method,
          value: val,
          installments: method === 'Cartão de Crédito' ? splitInstallments : null,
          anticipation: method === 'Cartão de Crédito' ? splitCreditAnticipation : (method === 'Cartão de Débito' ? splitDebitAnticipation : null)
        }));
      } else {
        const baseMethodLabel = paymentMethod === 'Cartão de Crédito' 
          ? `Cartão de Crédito (${installments})` 
          : paymentMethod;
        methodLabel = applyAnticipation ? `${baseMethodLabel} (Antecipado)` : baseMethodLabel;
      }

      const itemsDescription = [
        checkoutBooking.service?.name || checkoutBooking.serviceName,
        ...selectedServices.map(s => `${s.qty}x ${s.name}`),
        ...selectedProducts.map(p => `${p.qty}x ${p.name}`)
      ].filter(Boolean).join(', ');

      const prepay = Number(checkoutBooking.prepayment || 0);
      const finalBasePrice = overrideBasePrice !== null && overrideBasePrice !== ''
        ? Number(overrideBasePrice)
        : 0;

      // Save transaction
      const usedProductsTotal = usedProducts.reduce((sum, item) => sum + item.price, 0);

      const txData = {
        type: 'entrada',
        description: `${itemsDescription}${discount > 0 ? ` (Desconto: R$ ${discount})` : ''}${prepay > 0 ? ` (Sinal: -R$ ${prepay})` : ''}`,
        value: total,
        serviceBasePrice: finalBasePrice,
        paymentMethod: methodLabel,
        splitPayments: splitPaymentsList,
        discount: discount,
        date: checkoutBooking.date || today(),
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        clientName: checkoutBooking.clientName || 'Cliente',
        clientPhone: checkoutBooking.clientPhone || '',
        bookingId: checkoutBooking.id,
        productSales: selectedProducts.map(p => {
          const match = salonProducts.find(prod => prod.id === p.id);
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
        usedProducts: usedProducts.map(p => ({
          productId: p.productId,
          name: p.name,
          quantity: p.quantity || p.qty || 1,
          price: p.price
        })),
        nonRegisteredProducts: [],
        createdAt: new Date().toISOString()
      };

      // Calculate service saida cost (expense) + product sales cost (CMV)
      const mainService = services.find(s => s.name === (checkoutBooking.service?.name || checkoutBooking.serviceName));
      const mainServiceCost = mainService ? (Number(mainService.cost) || 0) : 0;
      const extraServicesCost = selectedServices.reduce((sum, item) => {
        const match = services.find(s => s.name === item.name);
        return sum + (match ? (Number(match.cost) || 0) : 0);
      }, 0);

      const soldProductsCost = selectedProducts.reduce((sum, p) => {
        const match = inventory.find(prod => prod.id === p.id);
        return sum + (match ? (Number(match.costPrice) || 0) : 0) * p.qty;
      }, 0);

      const totalServiceCost = mainServiceCost + extraServicesCost + usedProductsTotal + soldProductsCost;

      const saidaPayload = {
        bookingId: checkoutBooking.id,
        date: checkoutBooking.date || today(),
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        clientName: checkoutBooking.clientName,
        clientPhone: checkoutBooking.clientPhone || '',
        type: 'saida',
        paymentMethod: isSplitPayment ? 'Pix' : (paymentMethod || 'Pix'),
        value: totalServiceCost,
        discount: 0,
        description: `Custo de Execução - ${checkoutBooking.service?.name || checkoutBooking.serviceName || 'Serviço'}${selectedServices.length > 0 ? ' + extras' : ''}${usedProductsTotal > 0 ? ` (Insumos: R$ ${usedProductsTotal})` : ''}${soldProductsCost > 0 ? ` (Custo de Venda Produtos: R$ ${soldProductsCost.toFixed(2)})` : ''}`,
        professionalId: checkoutBooking.professionalId || checkoutBooking.profissional || 'jon',
        usedProducts: usedProducts.map(p => ({
          productId: p.productId,
          name: p.name,
          quantity: p.quantity || p.qty || 1,
          price: p.price
        })),
        nonRegisteredProducts: [],
        createdAt: new Date().toISOString()
      };

      const serviceId = checkoutBooking.service?.id || '';

      if (db) {
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
            paymentMethod: methodLabel,
            datePurchased: checkoutBooking.date || today(),
            status: 'active',
            balance: initialBalance,
            usage: [
              {
                bookingId: checkoutBooking.id,
                dateUsed: checkoutBooking.date || today(),
                serviceId
              }
            ]
          };
          await addDoc(collection(db, 'client_packages'), clientPackagePayload);
        }

        if (usingClientPackageId) {
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
              dateUsed: checkoutBooking.date || today(),
              serviceId
            }];
            await updateDoc(cpRef, {
              balance: newBalance,
              status: isFinished ? 'finished' : 'active',
              usage: newUsage
            });
          }
        }

        const bookingTx = transactions.find(t => t.bookingId === checkoutBooking.id && t.type === 'entrada');
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
          // Revert old used products inventory adjustments
          if (bookingTx.usedProducts) {
            for (const oldU of bookingTx.usedProducts) {
              const prodRef = doc(db, 'products', oldU.productId);
              const snap = await getDoc(prodRef);
              if (snap.exists()) {
                const cur = snap.data().quantity || 0;
                await updateDoc(prodRef, { quantity: cur + oldU.quantity });
              }
            }
          }
          await updateDoc(doc(db, 'financial_transactions', bookingTx.id), txData);
        } else {
          await addDoc(collection(db, 'financial_transactions'), txData);
        }

        // Save saida transaction
        const bookingSaidaTx = transactions.find(t => t.bookingId === checkoutBooking.id && t.type === 'saida');
        if (totalServiceCost > 0) {
          if (bookingSaidaTx) {
            await updateDoc(doc(db, 'financial_transactions', bookingSaidaTx.id), saidaPayload);
          } else {
            await addDoc(collection(db, 'financial_transactions'), saidaPayload);
          }
        } else if (bookingSaidaTx) {
          await deleteDoc(doc(db, 'financial_transactions', bookingSaidaTx.id));
        }

        await updateDoc(doc(db, 'bookings', checkoutBooking.id), { 
          status: 'finalizado', 
          paymentMethod: methodLabel, 
          finalValue: total, 
          servicePrice: finalBasePrice,
          serviceName: checkoutBooking.serviceName || checkoutBooking.service?.name || 'Serviço',
          service: {
            name: checkoutBooking.serviceName || checkoutBooking.service?.name || 'Serviço',
            price: Number(checkoutBooking.servicePrice || checkoutBooking.service?.price || finalBasePrice || 0),
            duration: Number(checkoutBooking.duration || checkoutBooking.service?.duration || 60)
          },
          isPackageUse: !!usingClientPackageId,
          isPackageAcquisition: !!sellingPackageId,
          packageUsedId: usingClientPackageId || null,
          packageSoldId: sellingPackageId || null
        });

        // Deduct sold products stock
        for (const p of selectedProducts) {
          const prodRef = doc(db, 'products', p.id);
          const snap = await getDoc(prodRef);
          if (snap.exists()) {
            const cur = snap.data().quantity || 0;
            await updateDoc(prodRef, { quantity: Math.max(0, cur - p.qty) });
          }
        }

        // Apply new used products inventory adjustments
        for (const u of usedProducts) {
          const prodRef = doc(db, 'products', u.productId);
          const snap = await getDoc(prodRef);
          if (snap.exists()) {
            const cur = snap.data().quantity || 0;
            await updateDoc(prodRef, { quantity: Math.max(0, cur - u.quantity) });
          }
        }
      } else {
        // demo mode
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
            paymentMethod: methodLabel,
            datePurchased: checkoutBooking.date || today(),
            status: 'active',
            balance: initialBalance,
            usage: [
              {
                bookingId: checkoutBooking.id,
                dateUsed: checkoutBooking.date || today(),
                serviceId
              }
            ]
          };
          const local = localStorage.getItem('demo_client_packages');
          const current = local ? JSON.parse(local) : [];
          const newCp = { id: 'cp_' + Date.now(), ...clientPackagePayload };
          const updatedCp = [newCp, ...current];
          localStorage.setItem('demo_client_packages', JSON.stringify(updatedCp));
          setClientPackages(updatedCp);
        }

        if (usingClientPackageId) {
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
                    dateUsed: checkoutBooking.date || today(),
                    serviceId
                  }]
                };
              }
              return cp;
            });
            localStorage.setItem('demo_client_packages', JSON.stringify(updated));
            setClientPackages(updated);
          }
        }

        const fakeId = 'demo-bk-' + Date.now();
        // save list is handled below
      }
      if (requestReview) {
        sendFeedbackWhatsApp(checkoutBooking, waWindow).catch(err => console.error(err));
      }
      setBookings(prev => prev.map(b => b.id === checkoutBooking.id ? { 
        ...b, 
        status: 'finalizado', 
        paymentMethod: methodLabel, 
        finalValue: total, 
        servicePrice: finalBasePrice,
        serviceName: checkoutBooking.serviceName || checkoutBooking.service?.name || 'Serviço',
        service: {
          name: checkoutBooking.serviceName || checkoutBooking.service?.name || 'Serviço',
          price: Number(checkoutBooking.servicePrice || checkoutBooking.service?.price || finalBasePrice || 0),
          duration: Number(checkoutBooking.duration || checkoutBooking.service?.duration || 60)
        },
        isPackageUse: !!usingClientPackageId,
        isPackageAcquisition: !!sellingPackageId,
        packageUsedId: usingClientPackageId || null,
        packageSoldId: sellingPackageId || null
      } : b));
      
      const bookingTx = transactions.find(t => t.bookingId === checkoutBooking.id && t.type === 'entrada');
      const bookingSaidaTx = transactions.find(t => t.bookingId === checkoutBooking.id && t.type === 'saida');
      
      let updatedTx = [...transactions];
      if (bookingTx) {
        updatedTx = updatedTx.map(t => t.id === bookingTx.id ? { ...t, ...txData } : t);
      } else {
        updatedTx = [{ id: 'entrada_' + Date.now().toString(), ...txData }, ...updatedTx];
      }
      
      if (totalServiceCost > 0) {
        if (bookingSaidaTx) {
          updatedTx = updatedTx.map(t => t.id === bookingSaidaTx.id ? { ...t, ...saidaPayload } : t);
        } else {
          updatedTx = [{ id: 'saida_' + Date.now().toString(), ...saidaPayload }, ...updatedTx];
        }
      } else if (bookingSaidaTx) {
        updatedTx = updatedTx.filter(t => t.id !== bookingSaidaTx.id);
      }
      
      setTransactions(updatedTx);
      
      setShowCheckoutSheet(false);
      setCheckoutBooking(null);
      showToast(bookingTx ? 'Comanda atualizada com sucesso!' : 'Comanda fechada com sucesso!', 'success');
    } catch (err) {
      if (waWindow) waWindow.close();
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
    const isPkg = nbForm.bookingType === 'package';
    const pkg = isPkg ? packages.find(p => p.id === nbForm.packageId) : null;
    const svc = !isPkg ? services.find(s => s.name === nbForm.serviceName) : null;
    const prepay = Number(nbForm.prepayment || 0);
    const price = nbForm.servicePrice !== '' ? Number(nbForm.servicePrice) : (isPkg ? (pkg?.price || 0) : (svc?.promoPrice || svc?.price || 0));

    // Duração ocupa pelo menos 1h
    const duration = isPkg ? 60 : Math.max(60, Number(svc?.duration) || 60);

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
      service: isPkg ? { name: nbForm.serviceName, price: price } : (svc || { name: nbForm.serviceName }),
      serviceName: nbForm.serviceName,
      servicePrice: price,
      date: nbForm.date,
      time: nbForm.time,
      duration: duration,
      notes: nbForm.notes || '',
      status: 'confirmado',
      prepayment: prepay,
      createdAt: new Date().toISOString(),
      ...(isPkg ? {
        packageId: nbForm.packageId,
        packageName: nbForm.packageName,
        isPackageAcquisition: true
      } : {})
    };
    try {
      if (db) {
        const ref = await addDoc(collection(db, 'bookings'), data);
        // setBookings is handled by onSnapshot listener automatically
        try { await syncBookingToGoogle({ id: ref.id, ...data }); } catch {}

        const finalEmail = (clientEmail && clientEmail.includes('@') && clientEmail !== 'Não informado') 
          ? clientEmail 
          : 'sem-email@ojonquecortou.com.br';
        triggerEmailNotification({ ...data, id: ref.id, clientEmail: finalEmail });

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
      showToast('Agendamento criado! ✅', 'success');
    } catch (err) {
      showToast('Erro: ' + err.message, 'error');
    } finally {
      // Sempre fecha o sheet e reseta o formulário — independente de sucesso ou erro
      setShowNewBookingSheet(false);
      setNbRegisterClient(false);
      setNbForm({ clientName:'', clientPhone:'', serviceName:'', servicePrice:'', date: today(), time:'09:00', notes:'', prepayment: '', bookingType: 'service', packageId: '', packageName: '' });
      setTab('hoje');
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

    // Duração selecionada pelo usuário ou baseada no serviço
    const duration = Math.max(15, Number(editBookingForm.duration) || Number(svc?.duration) || Number(oldB?.duration) || 60);

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
      if (dateChanged || timeChanged) {
        const finalEmail = (emailToUse && emailToUse.includes('@') && emailToUse !== 'Não informado') 
          ? emailToUse 
          : 'sem-email@ojonquecortou.com.br';
        triggerEmailNotification({
          ...data,
          id: editBookingForm.id,
          clientEmail: finalEmail
        }, 'agendamento_editado');
      }

      setShowEditBookingSheet(false);
      showToast('Agendamento atualizado!', 'success');
    } catch (err) {
      showToast('Erro ao atualizar: ' + err.message, 'error');
    }
  };

  // ── Send Feedback / Review Request WhatsApp ─────────────────────
  const sendFeedbackWhatsApp = async (booking, waWindow = null) => {
    const cleanPhone = (booking.clientPhone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      if (waWindow) waWindow.close();
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
    if (waWindow && gateway && gateway !== 'none') {
      waWindow.close(); // Close synchronous window since we will send via API gateway
    }

    if (!gateway || gateway === 'none') {
      console.log('WhatsApp Gateway não configurado, abrindo diretamente:', msgText);
      const waUrl = `https://api.whatsapp.com/send?phone=${phoneWithDDI}&text=${encodeURIComponent(msgText)}`;
      if (waWindow) {
        waWindow.location.href = waUrl;
      } else {
        window.open(waUrl, '_blank');
      }
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
        showToast('Pedido de avaliação enviado! 🚀', 'success');
      } else {
        throw new Error('Falha no gateway de WhatsApp');
      }
    } catch (err) {
      console.warn('Erro ao disparar via API, abrindo WhatsApp diretamente:', err);
      // Fallback: abrir wa.me link diretamente se o gateway falhar
      const waUrl = `https://api.whatsapp.com/send?phone=${phoneWithDDI}&text=${encodeURIComponent(msgText)}`;
      try {
        window.open(waUrl, '_blank');
      } catch (e) {
        console.warn('Fallback window.open failed:', e);
      }
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

      if (status === 'confirmado' && booking?.clientPhone) {
        try {
          const bookingStart = new Date(`${booking.date}T${booking.time || '00:00'}:00`);
          const bookingCreated = booking.createdAt ? new Date(booking.createdAt) : new Date();
          if (!isNaN(bookingStart.getTime()) && !isNaN(bookingCreated.getTime())) {
            const diffHours = (bookingStart.getTime() - bookingCreated.getTime()) / (1000 * 60 * 60);
            if (diffHours < 24) {
              const cleanPhone = booking.clientPhone.replace(/\D/g, '');
              const firstName = (booking.clientName || 'Cliente').split(' ')[0];
              const dataBr = booking.date.split('-').reverse().join('/');
              const svcName = booking.service?.name || booking.serviceName || 'serviço';
              const msg = `Fala, ${firstName}! Jon por aqui. Vi seu agendamento em cima da hora e já separei seu horário por aqui! Ficou confirmado para dia ${dataBr} às ${booking.time} (${svcName}). Se rolar qualquer imprevisto me avisa. TMJ! 👊`;
              window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
            }
          }
        } catch (e) {
          console.warn('Erro ao processar mensagem de WhatsApp para agendamento rápido:', e);
        }
      }

      const finalEmail = (emailToUse && emailToUse.includes('@') && emailToUse !== 'Não informado') 
        ? emailToUse 
        : 'sem-email@ojonquecortou.com.br';
      const updatedBooking = { ...booking, id: bookingId, clientEmail: finalEmail };
      if (status === 'confirmado') {
        triggerEmailNotification(updatedBooking, 'horario_confirmado');
      } else if (status === 'cancelado') {
        triggerEmailNotification({ ...updatedBooking, cancelledBy: 'admin' }, 'agendamento_cancelado');
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
    
    const containerHeight = containerSize * 1.25;
    const initialScale = Math.max(containerSize / naturalDimensions.w, containerHeight / naturalDimensions.h);
    const displayWidth = naturalDimensions.w * initialScale * cropperZoom;
    const displayHeight = naturalDimensions.h * initialScale * cropperZoom;
    const initialX = (containerSize - displayWidth) / 2;
    const initialY = (containerHeight - displayHeight) / 2;
    
    let newX = cropperDragStartOffset.x + dx;
    let newY = cropperDragStartOffset.y + dy;
    
    const minX = containerSize - displayWidth - initialX;
    const maxX = -initialX;
    const minY = containerHeight - displayHeight - initialY;
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
        canvas.width = 800;
        canvas.height = 1000;
        const ctx = canvas.getContext('2d');
        
        // Container height is containerSize * (5/4) = containerSize * 1.25
        const containerHeight = containerSize * 1.25;
        
        const initialScale = Math.max(containerSize / naturalDimensions.w, containerHeight / naturalDimensions.h);
        const displayWidth = naturalDimensions.w * initialScale;
        const displayHeight = naturalDimensions.h * initialScale;
        const initialX = (containerSize - displayWidth) / 2;
        const initialY = (containerHeight - displayHeight) / 2;
        
        const renderScale = initialScale * cropperZoom;
        const left = initialX + cropperOffset.x;
        const top = initialY + cropperOffset.y;
        
        const srcX = -left / renderScale;
        const srcY = -top / renderScale;
        const srcW = containerSize / renderScale;
        const srcH = containerHeight / renderScale;
        
        ctx.drawImage(previewImageRef.current, srcX, srcY, srcW, srcH, 0, 0, 800, 1000);
        
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
      } else {
        const fakeId = 'demo-cli-' + Date.now();
        const localClients = JSON.parse(localStorage.getItem('demo_client_profiles') || '[]');
        localClients.push({ id: fakeId, ...data });
        localStorage.setItem('demo_client_profiles', JSON.stringify(localClients));
        setClients(prev => [{ id: fakeId, ...data }, ...prev]);
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
      } else {
        const fakeId = 'demo-tx-' + Date.now();
        setTransactions(prev => [{ id: fakeId, ...data }, ...prev]);
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
    if (exitCart.length === 0) {
      showToast('Adicione pelo menos um produto na comanda', 'error');
      return;
    }

    try {
      const txDataList = [];
      const updatedInventory = [...inventory];

      for (const item of exitCart) {
        const product = inventory.find(p => p.id === item.productId);
        if (!product) continue;

        if (item.quantity > product.quantity) {
          showToast(`Estoque insuficiente para ${product.name}`, 'error');
          return;
        }

        const newQty = product.quantity - item.quantity;
        if (db) {
          try {
            await updateDoc(doc(db, 'products', product.id), { quantity: newQty });
          } catch (dbErr) {
            console.warn('Erro ao atualizar estoque no Firestore:', dbErr);
          }
        }

        // Update local copy
        const idx = updatedInventory.findIndex(p => p.id === product.id);
        if (idx !== -1) {
          updatedInventory[idx].quantity = newQty;
        }

        // CMV (Custo da Mercadoria)
        const costVal = (product.costPrice || 0) * item.quantity;
        const isSale = prodExitType === 'venda';
        const clientSuffix = exitClientType === 'client' && exitClientPhone
          ? ` - Cliente: ${(() => {
              const c = clients.find(cl => cl.phone === exitClientPhone);
              return c ? `${c.name} (${c.phone})` : exitClientPhone;
            })()}`
          : '';

        txDataList.push({
          type: 'saida',
          category: 'estoque',
          value: costVal,
          description: isSale
            ? `CMV - Venda Avulsa: ${product.name} (x${item.quantity})${clientSuffix}`
            : `Uso do Salão: ${product.name} (-${item.quantity} un.)`,
          date: today(),
          createdAt: new Date().toISOString()
        });

        if (isSale && product.sellingPrice) {
          txDataList.push({
            type: 'entrada',
            category: 'estoque',
            value: (product.sellingPrice || 0) * item.quantity,
            description: `Venda Avulsa: ${product.name} (x${item.quantity})${clientSuffix}`,
            date: today(),
            paymentMethod: exitPaymentMethod,
            createdAt: new Date().toISOString()
          });
        }
      }

      if (db) {
        try {
          for (const txData of txDataList) {
            await addDoc(collection(db, 'financial_transactions'), txData);
          }
        } catch (dbErr) {
          console.warn('Erro ao registrar transação financeira no Firestore:', dbErr);
        }
      }

      setInventory(updatedInventory);
      localStorage.setItem('demo_products', JSON.stringify(updatedInventory));

      setTransactions(prev => [
        ...txDataList.map(tx => ({ id: Date.now().toString() + Math.random(), ...tx })),
        ...prev
      ]);

      showToast(prodExitType === 'venda' ? 'Venda registrada! 💰 Custo debitado do caixa.' : 'Saída por uso registrada! 💸', 'success');
      setShowProductExitSheet(false);
      setExitCart([]);
      setExitClientPhone('');
      setExitClientSearch('');
      setExitProductSearch('');
    } catch (err) {
      showToast('Erro ao registrar venda: ' + err.message, 'error');
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
        await addDoc(collection(db, 'bookings'), payload);
        // setBookings is handled by onSnapshot listener automatically
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
              {todayBookings.slice(0, 6).map(b => {
                const svcName = b.service?.name || b.serviceName || "";
                let cat = getServiceCategory(svcName, services, b);
                const cliName = (b.clientName || '').toLowerCase();
                if (cliName.includes('bloqueado') || cliName.includes('bloqueio') || cliName.includes('ausencia') || cliName.includes('ausência')) {
                  cat = { class: 'svc-ausencia', badge: 'AUSÊNCIA' };
                }
                return (
                  <div key={b.id} className={`m-booking-card ${b.status} ${cat.class}`} onClick={() => { setSelectedBooking(b); setShowBookingSheet(true); }}>
                    <div className="m-booking-time">{b.time || '—'}</div>
                    <div className={`m-booking-bar ${b.status} ${cat.class}`}>
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
                        <div className="m-booking-service-container">
                          <span className="m-booking-divider"> — </span>
                          <span className="m-booking-service">{svcName}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                        {b.status === 'finalizado' && (
                          <span style={{
                            fontSize: '7px',
                            fontWeight: 800,
                            padding: '1px 4px',
                            background: 'rgba(63, 185, 80, 0.15)',
                            color: '#3FB950',
                            border: '1px solid rgba(63, 185, 80, 0.3)',
                            borderRadius: '4px',
                            letterSpacing: '0.5px'
                          }}>✓ FINALIZADO</span>
                        )}
                        <div className="appt-badge">{cat.badge}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
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
    const { positionedItems, layoutItems, isLunchLocked } = agendaDayData;

    return (
      <div className="m-tab m-page-flush" key="agenda" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Week strip */}
        <div className="m-week-strip-container" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <button 
            style={{ background: 'none', border: 'none', color: 'var(--m-muted)', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
            onClick={() => {
              const d = parseLocalDate(currentDate);
              d.setDate(d.getDate() - 7);
              setCurrentDate(dateStr(d));
            }}
          >
            <ChevronLeft size={16} />
          </button>
          
          <div className="m-week-strip" style={{ flex: 1, borderBottom: 'none', padding: '10px 0' }}>
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

          <button 
            style={{ background: 'none', border: 'none', color: 'var(--m-muted)', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
            onClick={() => {
              const d = parseLocalDate(currentDate);
              d.setDate(d.getDate() + 7);
              setCurrentDate(dateStr(d));
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Date navigation */}
        <div className="m-agenda-date-bar" style={{ flexShrink: 0 }}>
          <button className="m-date-nav" onClick={() => animateDayChange(-1)}><ChevronLeft size={18}/></button>
          <div className="m-date-center">
            <div className="m-date-day">{fmtDate(currentDate)}</div>
          </div>
          <button className="m-date-nav" onClick={() => animateDayChange(1)}><ChevronRight size={18}/></button>
        </div>

        {/* Timeline Grid Container */}
        <div 
          style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'row',
            overflowY: isDragging ? 'hidden' : 'auto',
            overflowX: 'hidden',
            position: 'relative',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            WebkitUserSelect: 'none'
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Hours column on the left */}
          <div style={{ width: 60, display: 'flex', flexDirection: 'column', borderRight: '0.5px solid var(--m-rule)', background: 'var(--m-bg)', position: 'relative', height: HOURLY_SLOTS.length * 60 }}>
            {HOURLY_SLOTS.map(hour => {
              const hourMin = timeToMin(hour);
              const topPx = hourMin - 480;
              return (
                <div key={hour} style={{ position: 'absolute', top: topPx, left: 0, right: 0, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--m-muted)', fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 600, zIndex: 2 }}>
                  <span style={{ background: 'var(--m-bg)', padding: '0 4px' }}>
                    {hour}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Grid lines and absolute cards column on the right */}
          <div style={{ flex: 1, position: 'relative', height: HOURLY_SLOTS.length * 60, background: 'var(--m-bg)' }}>
            {/* Horizontal lines */}
            {HOURLY_SLOTS.map((_, i) => (
              <div key={i} style={{ height: 60, borderBottom: '0.5px solid var(--m-rule)', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 30, left: 0, right: 0, borderBottom: '0.5px dashed var(--m-rule)' }} />
              </div>
            ))}

            {/* Clickable background cells (for scheduling in empty slots) */}
            {HOURLY_SLOTS.flatMap(hour => {
              const hourPrefix = hour.substring(0, 3);
              return [`${hourPrefix}00`, `${hourPrefix}30`].map(slot => {
                const slotMin = timeToMin(slot);
                const hasItem = layoutItems.some(item => slotMin >= item.startMin && slotMin < item.endMin);
                if (hasItem) return null;
                return (
                  <div
                    key={slot}
                    style={{
                      position: 'absolute',
                      top: slotMin - 480,
                      height: 30,
                      left: 0,
                      right: 0,
                      cursor: 'pointer',
                      zIndex: 1
                    }}
                    onClick={() => {
                      setSelectedSlot(slot);
                      setShowSlotSheet(true);
                    }}
                  />
                );
              });
            })}

            {/* Render positioned items absolutely */}
            {positionedItems.map(item => {
              const startMin = item.startMin;
              const duration = Math.max(30, item.endMin - startMin);
              const topPx = startMin - 480;
              const heightPx = duration - 2;

              const left = item.leftPercent;
              const width = item.widthPercent;

              if (item.type === 'booking') {
                const bk = item.raw;
                const svcName = bk.service?.name || bk.serviceName || "";
                let cat = getServiceCategory(svcName, services, bk);
                const cliName = (bk.clientName || '').toLowerCase();
                if (cliName.includes('bloqueado') || cliName.includes('bloqueio') || cliName.includes('ausencia') || cliName.includes('ausência')) {
                  cat = { class: 'svc-ausencia', badge: 'AUSÊNCIA' };
                }
                return (
                  <div
                    key={item.id}
                    className={`m-slot-booking ${bk.status} ${(bk.status || '').replace(/\s+/g, '-')} ${cat.class} bloqueado-${(bk.notes || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-')}`}
                    style={{
                      position: 'absolute',
                      top: topPx,
                      height: heightPx,
                      left: `${left}%`,
                      width: `calc(${width}% - 4px)`,
                      marginLeft: '2px',
                      padding: '0 12px',
                      zIndex: 3,
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      overflow: 'hidden',
                      borderRadius: '0px',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.12)',
                      cursor: 'pointer'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBooking(bk);
                      setShowBookingSheet(true);
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%', justifyContent: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px', width: '100%' }}>
                        <span
                          className="m-slot-client"
                          style={{
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            color: '#ffffff',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {bk.clientName}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                          {bk.status === 'finalizado' && (
                            <span style={{
                              fontSize: '7px',
                              fontWeight: 800,
                              padding: '1px 4px',
                              background: 'rgba(63, 185, 80, 0.15)',
                              color: '#3FB950',
                              border: '1px solid rgba(63, 185, 80, 0.3)',
                              borderRadius: '4px',
                              letterSpacing: '0.5px'
                            }}>✓ FINALIZADO</span>
                          )}
                          <span className="appt-badge" style={{ fontSize: '8px', padding: '1px 4px', textTransform: 'uppercase', flexShrink: 0 }}>
                            {cat.badge}
                          </span>
                        </div>
                      </div>
                      <span className="m-slot-svc-info" style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.55)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {svcName} · {(() => {
                          const m = bk.duration || 60;
                          const h = Math.floor(m / 60);
                          const r = m % 60;
                          if (h > 0 && r > 0) return `${h}h${r}`;
                          if (h > 0) return `${h}h`;
                          return `${r}min`;
                        })()}
                      </span>
                    </div>
                  </div>
                );
              }

              if (item.type === 'lunch_block') {
                return (
                  <div
                    key={item.id}
                    className="m-slot-booking bloqueado svc-almoco"
                    style={{
                      position: 'absolute',
                      top: topPx,
                      height: heightPx,
                      left: `${left}%`,
                      width: `calc(${width}% - 4px)`,
                      marginLeft: '2px',
                      padding: '6px 12px',
                      zIndex: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      if (window.confirm("Deseja liberar este horário (desbloquear a escala)?")) {
                        localStorage.setItem(`unlock_${currentDate}_12:00`, 'true');
                        showToast("Horário liberado!", "success");
                        window.location.reload();
                      }
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div className="m-slot-client" style={{ color: 'inherit', fontSize: '0.8rem', fontWeight: 700 }}>Almoço</div>
                      <div className="m-slot-svc" style={{ color: 'inherit', opacity: 0.7, fontSize: '0.62rem' }}>Toque para liberar</div>
                    </div>
                    <span className="appt-badge">
                      ALMOÇO
                    </span>
                  </div>
                );
              }

              if (item.type === 'absence') {
                const abs = item.raw;
                const blockClass = (() => {
                  const title = (abs.title || '').toLowerCase();
                  if (title.includes('médico') || title.includes('medico')) return 'bloqueado-medico';
                  if (title.includes('almoço') || title.includes('almoco')) return 'bloqueado-almoco';
                  if (title.includes('folga')) return 'bloqueado-folga';
                  if (title.includes('viagem')) return 'bloqueado-viagem';
                  if (title.includes('psicóloga') || title.includes('psicologa')) return 'bloqueado-psicologa';
                  if (title.includes('reunião') || title.includes('reuniao')) return 'bloqueado-reuniao';
                  return '';
                })();
                return (
                  <div
                    key={item.id}
                    className={`m-slot-booking bloqueado ${blockClass}`}
                    style={{
                      position: 'absolute',
                      top: topPx,
                      height: heightPx,
                      left: `${left}%`,
                      width: `calc(${width}% - 4px)`,
                      marginLeft: '2px',
                      padding: '6px 10px',
                      zIndex: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      cursor: 'pointer',
                      borderRadius: '6px'
                    }}
                    onClick={() => {
                      if (window.confirm(`Deseja excluir a ausência "${abs.title}"?`)) {
                        deleteAbsence(abs.id);
                      }
                    }}
                  >
                    <div className="m-slot-client" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 700 }}>
                      <Lock size={10} /> {abs.title}
                    </div>
                    <div className="m-slot-svc" style={{ opacity: 0.7, fontSize: '0.62rem' }}>Ausência</div>
                  </div>
                );
              }

              if (item.type === 'scale_block') {
                const blockClass = (() => {
                  const title = (item.label || '').toLowerCase();
                  if (title.includes('médico') || title.includes('medico')) return 'bloqueado-medico';
                  if (title.includes('almoço') || title.includes('almoco')) return 'bloqueado-almoco';
                  if (title.includes('folga')) return 'bloqueado-folga';
                  if (title.includes('viagem')) return 'bloqueado-viagem';
                  if (title.includes('psicóloga') || title.includes('psicologa')) return 'bloqueado-psicologa';
                  if (title.includes('reunião') || title.includes('reuniao')) return 'bloqueado-reuniao';
                  return '';
                })();
                return (
                  <div
                    key={item.id}
                    className={`m-slot-booking bloqueado ${blockClass}`}
                    style={{
                      position: 'absolute',
                      top: topPx,
                      height: heightPx,
                      left: `${left}%`,
                      width: `calc(${width}% - 4px)`,
                      marginLeft: '2px',
                      padding: '6px 10px',
                      zIndex: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      cursor: 'pointer',
                      borderRadius: '6px'
                    }}
                    onClick={() => {
                      const isFullDay = item.id === 'full-day-block';
                      const slot = isFullDay ? null : item.id.replace('scale-block-', '');
                      setSelectedScaleBlock({ isFullDay, slot, label: item.label });
                      setShowScaleBlockSheet(true);
                    }}
                  >
                    <div className="m-slot-client" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
                      <Lock size={10} /> Fora de Escala
                    </div>
                  </div>
                );
              }

              return null;
            })}
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
    const filteredTxByPeriod = (() => {
      const now = new Date();
      const currentToday = today();
      
      if (period === 'dia') {
        return transactions.filter(t => t.date === currentToday);
      } else if (period === 'semana') {
        const startOfWeek = new Date(now);
        const day = startOfWeek.getDay();
        startOfWeek.setDate(now.getDate() - day); // Domingo
        const dsStart = dateStr(startOfWeek);
        return transactions.filter(t => t.date >= dsStart && t.date <= currentToday);
      } else { // 'mes'
        const m = now.toISOString().slice(0,7);
        return transactions.filter(t => (t.date || '').startsWith(m));
      }
    })();

    const periodIn = filteredTxByPeriod.filter(t => t.type === 'entrada').reduce((s,t) => s + Number(calculateNetValue(t.value, t.paymentMethod, settings) || 0), 0);
    const periodOut = filteredTxByPeriod.filter(t => t.type === 'saida').reduce((s,t) => s + Number(t.value||0), 0);
    const periodProfit = periodIn - periodOut;

    const recentTx = transactions
      .filter(t => (t.date || '') <= today())
      .sort((a,b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || '').localeCompare(a.createdAt || ''))
      .slice(0, 15);

    return (
      <div className="m-tab m-page" key="caixa">
        {/* Segmented */}
        <div className="m-segmented" style={{ marginBottom: 12 }}>
          <button className={`m-seg-btn ${financeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setFinanceTab('dashboard')}>Dashboard</button>
          <button className={`m-seg-btn ${financeTab === 'lancamentos' ? 'active' : ''}`} onClick={() => setFinanceTab('lancamentos')}>Lançamentos</button>
        </div>

        {financeTab === 'dashboard' && <>
          {/* Caixa Period selector */}
          <div className="m-segmented" style={{ background: 'rgba(255,255,255,0.03)', padding: 2, marginBottom: 16 }}>
            <button className={`m-seg-btn ${period === 'dia' ? 'active' : ''}`} onClick={() => setPeriod('dia')} style={{ fontSize: '0.78rem', padding: '6px 0' }}>Dia</button>
            <button className={`m-seg-btn ${period === 'semana' ? 'active' : ''}`} onClick={() => setPeriod('semana')} style={{ fontSize: '0.78rem', padding: '6px 0' }}>Semana</button>
            <button className={`m-seg-btn ${period === 'mes' ? 'active' : ''}`} onClick={() => setPeriod('mes')} style={{ fontSize: '0.78rem', padding: '6px 0' }}>Mês</button>
          </div>

          {/* Hero */}
          <div className="m-finance-hero" style={{ padding: '20px 16px' }}>
            <div className="m-finance-hero-label">Caixa de {period === 'dia' ? 'Hoje' : period === 'semana' ? 'Semana' : 'Mês'}</div>
            <div className="m-finance-hero-value" style={{ fontSize: '2rem' }}>{fmt(periodIn)}</div>
            <div className="m-finance-hero-sub">Saldo líquido: <strong style={{ color: periodProfit >= 0 ? 'var(--m-green)' : 'var(--m-red)' }}>{fmt(periodProfit)}</strong></div>
          </div>

          {/* KPIs */}
          <div className="m-kpi-row" style={{ gap: 12, marginBottom: 16 }}>
            <div className="m-kpi-card green" style={{ padding: 12 }}>
              <div className="m-kpi-label">Entradas</div>
              <div className="m-kpi-value" style={{ color:'var(--m-green)', fontSize:'1.1rem' }}>{fmt(periodIn)}</div>
            </div>
            <div className="m-kpi-card red" style={{ padding: 12 }}>
              <div className="m-kpi-label">Saídas</div>
              <div className="m-kpi-value" style={{ color:'var(--m-red)', fontSize:'1.1rem' }}>{fmt(periodOut)}</div>
            </div>
          </div>

          {/* Último lançamento hoje */}
          {(() => {
            const todayTxs = transactions.filter(t => t.date === today()).sort((a,b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
            if (todayTxs.length > 0) {
              const last = todayTxs[0];
              return (
                <div className="m-card-premium" style={{ padding:'14px', marginBottom: 16 }}>
                  <div style={{ fontSize:'0.72rem', fontWeight:800, color:'var(--m-gold)', textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:8 }}>Último Lançamento Hoje</div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:'0.85rem', color:'var(--m-text)' }}>{last.description}</div>
                      <div style={{ fontSize:'0.7rem', color:'var(--m-muted)' }}>{last.paymentMethod || 'Dinheiro'} · {last.type === 'entrada' ? 'Receita' : 'Despesa'}</div>
                    </div>
                    <div style={{ fontWeight:800, fontSize:'0.95rem', color: last.type === 'entrada' ? 'var(--m-green)' : 'var(--m-red)' }}>
                      {last.type === 'entrada' ? '+' : '-'}{fmt(last.value)}
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          <button className="m-btn m-btn-gold" onClick={() => setShowAddTxSheet(true)}>
            <Plus size={16}/> Lançar Despesa
          </button>
        </>}

        {financeTab === 'lancamentos' && <>
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom: 12 }}>
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
        <div className="m-card-premium" style={{ padding:'14px', display:'flex', alignItems:'center', gap:12, marginTop:4 }}>
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
            <div key={a.id} className="m-card-premium" style={{ padding:'13px 14px', display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:38, height:38, borderRadius:10, background:'rgba(139,124,200,0.14)', color:'#8b7cc8', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Lock size={16}/></div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, color:'var(--m-text)', fontSize:'0.88rem' }}>{a.title}</div>
                <div style={{ fontSize:'0.72rem', color:'var(--m-muted)', marginTop:2 }}>{summary(a)}</div>
              </div>
              <span style={{ fontSize:'0.62rem', fontWeight:700, color:'#8b7cc8', background:'rgba(139,124,200,0.14)', padding:'3px 8px', borderRadius:20, textTransform:'uppercase', letterSpacing:'0.5px', flexShrink:0 }}>Fixo</span>
            </div>
          ))}

          {customAbsences.map(a => (
            <div key={a.id} className="m-card-premium" style={{ padding:'13px 14px', display:'flex', alignItems:'center', gap:12 }}>
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
              {cleanStatus(b.status) === 'pendente' && (
                <button className="m-action-btn" onClick={() => changeStatus(b.id, 'confirmado')}>
                  <div className="m-action-btn-icon" style={{ background:'var(--m-blue-bg)', color:'var(--m-blue)' }}><Check size={16}/></div>
                  <div className="m-action-btn-text">
                    <div className="m-action-btn-label">Confirmar Agendamento</div>
                    <div className="m-action-btn-sub">Notifica o cliente</div>
                  </div>
                  <ChevronRight size={14} color="var(--m-muted)"/>
                </button>
              )}
              {['confirmado', 'confirmado pela cliente', 'pendente'].includes(cleanStatus(b.status)) && (
                <button className="m-action-btn" onClick={() => openCheckout(b)}>
                  <div className="m-action-btn-icon" style={{ background:'var(--m-gold-subtle)', color:'var(--m-gold)' }}><DollarSign size={16}/></div>
                  <div className="m-action-btn-text">
                    <div className="m-action-btn-label">Fechar Comanda</div>
                    <div className="m-action-btn-sub">Registrar pagamento</div>
                  </div>
                  <ChevronRight size={14} color="var(--m-muted)"/>
                </button>
              )}
              {cleanStatus(b.status) === 'finalizado' && (
                <button className="m-action-btn" onClick={() => openCheckout(b)}>
                  <div className="m-action-btn-icon" style={{ background:'var(--m-gold-subtle)', color:'var(--m-gold)' }}><DollarSign size={16}/></div>
                  <div className="m-action-btn-text">
                    <div className="m-action-btn-label">Ver / Editar Comanda</div>
                    <div className="m-action-btn-sub">Ver ou editar os detalhes financeiros</div>
                  </div>
                  <ChevronRight size={14} color="var(--m-muted)"/>
                </button>
              )}
              {cleanStatus(b.status) !== 'cancelado' && cleanStatus(b.status) !== 'finalizado' && (
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
                    status: b.status || 'confirmado',
                    duration: b.duration || 60
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
              {cleanStatus(b.status) === 'finalizado' && b.clientPhone && (
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
                <button className="m-action-btn" onClick={() => {
                  const cleanPhone = b.clientPhone.replace(/\D/g, '');
                  const matched = clients.find(c => (c.phone && c.phone.replace(/\D/g, '') === cleanPhone) || c.name === b.clientName);
                  if (matched) {
                    setSelectedClient(matched);
                    setShowBookingSheet(false);
                    setShowClientSheet(true);
                  } else {
                    setSelectedClient({ name: b.clientName, phone: b.clientPhone });
                    setShowBookingSheet(false);
                    setShowClientSheet(true);
                  }
                }}>
                  <div className="m-action-btn-icon" style={{ background:'rgba(220, 163, 84, 0.12)', color:'var(--m-gold)' }}><Users size={16}/></div>
                  <div className="m-action-btn-text">
                    <div className="m-action-btn-label">Ver Ficha / Histórico</div>
                    <div className="m-action-btn-sub">Histórico capilar, curvatura e anamnese</div>
                  </div>
                  <ChevronRight size={14} color="var(--m-muted)"/>
                </button>
              )}

              {b.clientPhone && ['confirmado','pendente','confirmado pela cliente'].includes(cleanStatus(b.status)) && (
                <button className="m-action-btn" onClick={() => {
                  const bookingDate = b.date || '';

                  // Lógica de fuso horário de Brasília para detectar se é hoje, amanhã ou outro dia
                  const formatter = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' });
                  const parts = formatter.formatToParts(new Date());
                  const day = parts.find(p => p.type === 'day').value;
                  const month = parts.find(p => p.type === 'month').value;
                  const year = parts.find(p => p.type === 'year').value;
                  const todayStr = `${year}-${month}-${day}`;

                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  const tomParts = formatter.formatToParts(tomorrow);
                  const tomDay = tomParts.find(p => p.type === 'day').value;
                  const tomMonth = tomParts.find(p => p.type === 'month').value;
                  const tomYear = tomParts.find(p => p.type === 'year').value;
                  const tomorrowStr = `${tomYear}-${tomMonth}-${tomDay}`;

                  let quandoText = 'no dia';
                  if (bookingDate === todayStr) {
                    quandoText = 'hoje';
                  } else if (bookingDate === tomorrowStr) {
                    quandoText = 'amanhã';
                  }

                  const cancelLink = `https://www.ojonquecortou.com.br/cancelar?id=${b.id}`;
                  const template = settings?.waReminderTemplate || 'Olá, {cliente}! Passando para lembrar do seu horário amanhã ({data} às {hora}) para o serviço: {servico}. Podemos confirmar?';
                  
                  let msg = template
                    .replace('{cliente}', b.clientName.split(' ')[0])
                    .replace('{data}', b.date.split('-').reverse().join('/'))
                    .replace('{hora}', b.time)
                    .replace('{servico}', b.service?.name || b.serviceName);

                  // Ajuste dinâmico de tempo
                  if (msg.includes('{quando}')) {
                    msg = msg.replace(/{quando}/gi, quandoText);
                  } else {
                    if (quandoText === 'hoje') {
                      msg = msg.replace(/amanhã/gi, 'hoje');
                    } else if (quandoText === 'no dia') {
                      msg = msg.replace(/amanhã/gi, 'no dia');
                    }
                  }

                  if (msg.includes('{link_cancelamento}')) {
                    msg = msg.replace('{link_cancelamento}', cancelLink);
                  } else {
                    msg += `\n\nCaso precise cancelar ou remarcar: ${cancelLink}`;
                  }
                  window.open(`https://wa.me/55${b.clientPhone.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`, '_blank');
                }}>
                  <div className="m-action-btn-icon" style={{ background:'rgba(37,211,102,0.12)', color:'#25D366' }}><Send size={16}/></div>
                  <div className="m-action-btn-text">
                    <div className="m-action-btn-label">Enviar Lembrete Manual</div>
                    <div className="m-action-btn-sub">Mandar template de confirmação no WhatsApp</div>
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
                        setBlockMotive('Almoço');
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
                  await addDoc(collection(db, 'bookings'), payload);
                  // setBookings is handled by onSnapshot listener automatically
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
                    <select
                      value={blockMotive} 
                      onChange={e => setBlockMotive(e.target.value)} 
                      className="m-input" 
                      style={{ background: 'var(--m-card)', color: 'var(--m-text)', border: '1px solid var(--m-card-border)', height: '40px', borderRadius: '8px', padding: '0 8px', width: '100%', boxSizing: 'border-box' }}
                    >
                      <option value="Almoço">Almoço</option>
                      <option value="Médico">Médico</option>
                      <option value="Folga">Folga</option>
                      <option value="Descanso">Descanso</option>
                      <option value="Outro">Outro / Geral</option>
                    </select>
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
      ? inventory.filter(p => (p.name || '').toLowerCase().includes(productSearch.toLowerCase())).slice(0, 5)
      : [];

    const filteredUsedProductsMobile = selectedUsedProduct.trim().length >= 3
      ? salonProducts.filter(p => (p.name || '').toLowerCase().includes(selectedUsedProduct.toLowerCase())).slice(0, 5)
      : [];

    const baseServicePrice = usingClientPackageId 
      ? 0 
      : (sellingPackageId 
          ? (packages.find(p => p.id === sellingPackageId)?.price || 0)
          : ((overrideBasePrice !== null && overrideBasePrice !== '') ? Number(overrideBasePrice) : Number(basePrice) || 0)
        );
    const currentBasePrice = baseServicePrice;
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
              <div className="m-label" style={{ marginBottom:8 }}>Serviço Executado</div>
              <div className="m-info-row" style={{ borderBottom:'none', padding:'0', display:'flex', flexDirection:'column', gap:6, width:'100%' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', width:'100%' }}>
                  <select
                    value={checkoutBooking.service?.name || checkoutBooking.serviceName}
                    onChange={e => {
                      const newName = e.target.value;
                      const matched = services.find(s => s.name === newName);
                      if (matched) {
                        setCheckoutBooking(prev => ({
                          ...prev,
                          serviceName: newName,
                          servicePrice: matched.promoPrice || matched.price,
                          service: matched
                        }));
                        setOverrideBasePrice(matched.promoPrice || matched.price);
                      }
                    }}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      maxWidth: 'calc(100% - 100px)',
                      padding: '6px 10px',
                      fontSize: '0.82rem',
                      border: '0.5px solid var(--m-rule)',
                      borderRadius: 'var(--m-radius-sm)',
                      background: 'var(--m-card)',
                      color: 'var(--m-text)',
                      outline: 'none',
                      fontFamily: 'inherit',
                      marginRight: 8,
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden'
                    }}
                  >
                    {services.map(s => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink: 0 }}>
                    <span style={{ fontSize:'0.85rem', color:'var(--m-muted)' }}>R$</span>
                    <input
                      type="number"
                      value={overrideBasePrice !== null && overrideBasePrice !== undefined ? overrideBasePrice : ''}
                      onChange={e => setOverrideBasePrice(e.target.value)}
                      style={{
                        width: 65,
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

            {/* Venda de Produtos ao Cliente (Revenda) */}
            <div className="m-field">
              <label className="m-label">Venda de Produtos ao Cliente (Revenda)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--m-card)', border: '0.5px solid var(--m-rule)', borderRadius: 'var(--m-radius-sm)', padding: '8px 12px' }}>
                <Search size={14} style={{ color: 'var(--m-muted)', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Buscar produto para vender (mín. 3 letras)..."
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
                      <span style={{ color: 'var(--m-gold)' }}>{fmt(prod.sellingPrice || prod.price)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* List of Retail Products added */}
            {selectedProducts.length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.01)', padding: '10px 12px', borderRadius: 'var(--m-radius-sm)', border: '0.5px solid var(--m-rule)', marginTop: -8 }}>
                <div className="m-label" style={{ marginBottom: 8, fontSize: '0.78rem' }}>Produtos de Revenda Adicionados</div>
                {selectedProducts.map(p => (
                  <div key={p.id} className="m-info-row" style={{ borderBottom: 'none', padding: '4px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--m-text)' }}>{p.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--m-muted)' }}>{fmt(p.sellingPrice * p.qty)}</span>
                      <div className="m-qty-row" style={{ margin: 0 }}>
                        <button className="m-qty-btn" onClick={() => changeProductQty(p.id, -1)}>−</button>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--m-gold)', minWidth: 12, textAlign: 'center' }}>{p.qty}</span>
                        <button className="m-qty-btn" onClick={() => changeProductQty(p.id, 1)}>+</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Produtos Utilizados no Serviço (Insumos) */}
            <div className="m-field">
              <label className="m-label">Produtos Utilizados no Serviço (Insumos)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--m-card)', border: '0.5px solid var(--m-rule)', borderRadius: 'var(--m-radius-sm)', padding: '8px 12px' }}>
                <Search size={14} style={{ color: 'var(--m-muted)', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Buscar insumos utilizados (mín. 3 letras)..."
                  value={selectedUsedProduct}
                  onChange={e => setSelectedUsedProduct(e.target.value)}
                  style={{ border: 'none', background: 'none', outline: 'none', fontSize: '0.85rem', color: 'var(--m-text)', width: '100%', fontFamily: 'inherit' }}
                />
              </div>
              {filteredUsedProductsMobile.length > 0 && (
                <div style={{ background: 'var(--m-card)', border: '0.5px solid var(--m-rule)', borderRadius: 'var(--m-radius-sm)', overflow: 'hidden', marginTop: 4 }}>
                  {filteredUsedProductsMobile.map(prod => (
                    <div key={prod.id} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '0.5px solid var(--m-rule)', fontSize: '0.82rem', color: 'var(--m-text)', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}
                      onClick={() => addUsedProductToCheckout(prod)}>
                      <span>{prod.name}</span>
                      <span style={{ color: 'var(--m-muted)' }}>{prod.volumetry ? `${prod.volumetry}${prod.unit || 'g'}` : ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* List of Used Products (Supplies) added */}
            {usedProducts.length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.01)', padding: '10px 12px', borderRadius: 'var(--m-radius-sm)', border: '0.5px solid var(--m-rule)', marginTop: -8 }}>
                <div className="m-label" style={{ marginBottom: 8, fontSize: '0.78rem' }}>Insumos/Produtos de Uso do Salão</div>
                {usedProducts.map(p => (
                  <div key={p.productId} className="m-info-row" style={{ borderBottom: 'none', padding: '4px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--m-text)' }}>{p.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="number"
                        value={p.usedVolumetry}
                        onChange={e => changeUsedProductVolumetry(p.productId, Number(e.target.value))}
                        style={{ width: 50, textAlign: 'right', background: 'var(--m-card)', border: '0.5px solid var(--m-rule)', borderRadius: 4, padding: '3px 6px', fontSize: '0.78rem', color: 'var(--m-text)', fontFamily: 'inherit' }}
                      />
                      <span style={{ fontSize: '0.75rem', color: 'var(--m-muted)' }}>{p.unit || 'g'}</span>
                      <button onClick={() => removeUsedProductMobile(p.productId)} className="m-qty-btn" style={{ color: 'var(--m-red)', marginLeft: 4 }}><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Discount */}
            <div className="m-field">
              <label className="m-label">Desconto (R$)</label>
              <input className="m-input" type="number" min="0" value={discount || ''} onChange={e => setDiscount(Number(e.target.value) || 0)} placeholder="0,00"/>
            </div>

            {/* Split Payment Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0' }}>
              <input 
                type="checkbox" 
                id="m-split-payment"
                checked={isSplitPayment} 
                onChange={e => {
                  const checked = e.target.checked;
                  setIsSplitPayment(checked);
                  if (checked) {
                    setSplitValues({
                      'Pix': paymentMethod === 'Pix' ? remaining : 0,
                      'Cartão de Crédito': paymentMethod === 'Cartão de Crédito' ? remaining : 0,
                      'Cartão de Débito': paymentMethod === 'Cartão de Débito' ? remaining : 0,
                      'Dinheiro': paymentMethod === 'Dinheiro' ? remaining : 0,
                      'Cortesia': paymentMethod === 'Cortesia' ? remaining : 0
                    });
                    setSplitCreditAnticipation(applyAnticipation);
                    setSplitDebitAnticipation(applyAnticipation);
                  }
                }}
                style={{ width: 16, height: 16, accentColor: 'var(--m-gold)', cursor: 'pointer' }}
              />
              <label htmlFor="m-split-payment" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--m-text)', cursor: 'pointer' }}>
                Dividir pagamento (mais de uma forma)?
              </label>
            </div>

            {isSplitPayment ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 'var(--m-radius-sm)', border: '0.5px solid var(--m-rule)' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--m-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Distribuição do Pagamento</div>
                {['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Cortesia'].map(m => {
                  const val = splitValues[m] || 0;
                  return (
                    <div key={m} style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingBottom: 8, borderBottom: '0.5px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--m-text-2)', fontWeight: 600 }}>{m}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--m-muted)' }}>R$</span>
                          <input 
                            type="number" 
                            min="0"
                            placeholder="0,00"
                            value={val || ''} 
                            onChange={e => {
                              const num = Number(e.target.value) || 0;
                              setSplitValues(prev => ({ ...prev, [m]: num }));
                            }}
                            style={{ width: 90, padding: '4px 6px', background: 'var(--m-card)', border: '0.5px solid var(--m-rule)', borderRadius: 'var(--m-radius-sm)', fontSize: '0.85rem', color: 'var(--m-text)', textAlign: 'right', fontFamily: 'inherit' }}
                          />
                        </div>
                      </div>
                      
                      {m === 'Cartão de Crédito' && val > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, paddingLeft: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--m-muted)' }}>Parcs:</span>
                            <select 
                              className="m-select" 
                              value={splitInstallments} 
                              onChange={e => setSplitInstallments(e.target.value)}
                              style={{ padding: '2px 4px', fontSize: '0.75rem', width: 70 }}
                            >
                              <option value="À vista">1x</option>
                              <option value="2x">2x</option>
                              <option value="3x">3x</option>
                            </select>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <input 
                              type="checkbox" 
                              id="m-split-credit-anticipate"
                              checked={splitCreditAnticipation} 
                              onChange={e => setSplitCreditAnticipation(e.target.checked)}
                              style={{ width: 12, height: 12 }}
                            />
                            <label htmlFor="m-split-credit-anticipate" style={{ fontSize: '0.72rem', color: 'var(--m-text-2)' }}>Antecipar</label>
                          </div>
                        </div>
                      )}
                      
                      {m === 'Cartão de Débito' && val > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4, paddingLeft: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <input 
                              type="checkbox" 
                              id="m-split-debit-anticipate"
                              checked={splitDebitAnticipation} 
                              onChange={e => setSplitDebitAnticipation(e.target.checked)}
                              style={{ width: 12, height: 12 }}
                            />
                            <label htmlFor="m-split-debit-anticipate" style={{ fontSize: '0.72rem', color: 'var(--m-text-2)' }}>Antecipar (taxa)</label>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Split Verification Status */}
                {(() => {
                  const distributedTotal = Object.values(splitValues).reduce((a, b) => a + b, 0);
                  const diff = remaining - distributedTotal;
                  if (Math.abs(diff) < 0.01) {
                    return <div style={{ fontSize: '0.78rem', color: '#48bb78', fontWeight: 600, textAlign: 'center' }}>✓ Tudo certo! Total distribuído corretamente.</div>;
                  } else if (diff > 0) {
                    return <div style={{ fontSize: '0.78rem', color: 'var(--m-gold)', fontWeight: 600, textAlign: 'center' }}>Falta distribuir: {fmt(diff)}</div>;
                  } else {
                    return <div style={{ fontSize: '0.78rem', color: 'var(--m-red)', fontWeight: 600, textAlign: 'center' }}>Excesso distribuído: {fmt(Math.abs(diff))}</div>;
                  }
                })()}

              </div>
            ) : (
              <>
                {/* Pacotes options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'rgba(255,255,255,0.015)', padding: 10, borderRadius: 'var(--m-radius-sm)', border: '0.5px solid var(--m-rule)' }}>
                  {availablePackagesForBooking.length > 0 && (
                    <div className="m-field" style={{ margin: 0 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: 'var(--m-text)' }}>
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
                          style={{ width: 16, height: 16, accentColor: 'var(--m-gold)' }}
                        />
                        Pagar com Pacote?
                      </label>
                      {usingClientPackageId && (
                        <select
                          className="m-select"
                          value={usingClientPackageId}
                          onChange={e => setUsingClientPackageId(e.target.value)}
                          style={{ marginTop: 6, fontSize: '0.78rem' }}
                        >
                          {availablePackagesForBooking.map(cp => {
                            const bookingServiceName = checkoutBooking?.service?.name || checkoutBooking?.serviceName;
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
                    <div className="m-field" style={{ margin: 0 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: 'var(--m-text)' }}>
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
                          style={{ width: 16, height: 16, accentColor: 'var(--m-gold)' }}
                        />
                        Vender Pacote?
                      </label>
                      {sellingPackageId && (
                        <select
                          className="m-select"
                          value={sellingPackageId}
                          onChange={e => setSellingPackageId(e.target.value)}
                          style={{ marginTop: 6, fontSize: '0.78rem' }}
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

                {/* Payment method */}
                <div>
                  <div className="m-label" style={{ marginBottom:8 }}>Forma de Pagamento</div>
                  {usingClientPackageId ? (
                    <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--m-radius-sm)', border: '0.5px solid var(--m-rule)', fontSize: '0.85rem', color: 'var(--m-gold)', fontWeight: 700, textAlign: 'center' }}>
                      Débito do Pacote
                    </div>
                  ) : (
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
                  )}
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

                {/* Anticipation toggle (automatic) */}
                {(paymentMethod === 'Cartão de Crédito' || paymentMethod === 'Cartão de Débito') && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, padding: '2px 4px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--m-gold)', fontWeight: 600 }}>
                      ✓ Antecipação automática ativa (taxa aplicada)
                    </span>
                  </div>
                )}
              </>
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
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.95rem', fontWeight:800, color:'var(--m-gold)', borderTop:'0.5px solid var(--m-rule)', paddingTop:4 }}>
                <span>Valor Total</span>
                <span>{fmt(remaining)}</span>
              </div>
            </div>
          </div>
          <div className="m-sheet-footer">
            <button className="m-btn m-btn-outline" style={{ flex:1 }} onClick={() => setShowCheckoutSheet(false)}>Cancelar</button>
            <button 
              className="m-btn m-btn-gold" 
              style={{ flex:2 }} 
              onClick={finalizeCheckout} 
              disabled={isFinalizingCheckout || (isSplitPayment && Math.abs(remaining - Object.values(splitValues).reduce((a, b) => a + b, 0)) > 0.01)}
            >
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
              <label className="m-label">Tipo de Agendamento</label>
              <select 
                className="m-select"
                value={nbForm.bookingType || 'service'}
                onChange={e => {
                  const type = e.target.value;
                  if (type === 'package') {
                    const firstPkg = packages[0];
                    setNbForm(prev => ({
                      ...prev,
                      bookingType: type,
                      packageId: firstPkg?.id || '',
                      packageName: firstPkg?.name || '',
                      serviceName: firstPkg ? `[Pacote] ${firstPkg.name}` : '',
                      servicePrice: firstPkg?.price || 0
                    }));
                  } else {
                    const firstSvc = services[0];
                    setNbForm(prev => ({
                      ...prev,
                      bookingType: type,
                      packageId: '',
                      packageName: '',
                      serviceName: firstSvc?.name || '',
                      servicePrice: firstSvc ? (firstSvc.promoPrice || firstSvc.price || '') : ''
                    }));
                  }
                }}
              >
                <option value="service">Serviço Individual</option>
                <option value="package">Pacote de Serviços</option>
              </select>
            </div>

            {nbForm.bookingType === 'package' ? (
              <div className="m-field">
                <label className="m-label">Pacote *</label>
                <select 
                  className="m-select"
                  value={nbForm.packageId}
                  onChange={e => {
                    const pkgId = e.target.value;
                    const matched = packages.find(p => p.id === pkgId);
                    setNbForm(prev => ({ 
                      ...prev, 
                      packageId: pkgId, 
                      packageName: matched ? matched.name : '',
                      serviceName: matched ? `[Pacote] ${matched.name}` : '', 
                      servicePrice: matched ? (matched.price || 0) : 0
                    }));
                  }}
                >
                  <option value="">Selecione um pacote</option>
                  {packages.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (R$ {p.price})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="m-field">
                <label className="m-label">Serviço *</label>
                <select className="m-select" value={nbForm.serviceName} onChange={e => {
                  const sName = e.target.value;
                  const matched = services.find(s => s.name === sName);
                  const matchedPrice = matched ? (matched.promoPrice || matched.price || '') : '';
                  setNbForm(p => ({ ...p, serviceName: sName, servicePrice: matchedPrice }));
                }}>
                  <option value="">Selecione um serviço</option>
                  {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
            )}

            <div className="m-field">
              <label className="m-label">{nbForm.bookingType === 'package' ? 'Valor do Pacote (R$)' : 'Valor do Serviço (R$)'}</label>
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
              {Number(nbForm.prepayment || 0) > 0 && (
                <span style={{ fontSize: '0.75rem', color: 'var(--m-gold)', display: 'block', marginTop: 4 }}>
                  Valor líquido a cobrar: R$ {(Number(nbForm.servicePrice || (services.find(s => s.name === nbForm.serviceName)?.promoPrice || services.find(s => s.name === nbForm.serviceName)?.price || 0)) - Number(nbForm.prepayment || 0)).toFixed(2)}
                </span>
              )}
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
                const matchedDuration = matched ? (matched.duration || 60) : 60;
                setEditBookingForm(p => ({ ...p, serviceName: sName, servicePrice: matchedPrice, duration: matchedDuration }));
              }}>
                <option value="">Selecione um serviço</option>
                {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div className="m-field">
                <label className="m-label">Valor do Serviço (R$)</label>
                <input className="m-input" type="number" placeholder="0,00" value={editBookingForm.servicePrice} onChange={e => setEditBookingForm(p => ({ ...p, servicePrice: e.target.value }))}/>
              </div>
              <div className="m-field">
                <label className="m-label">Duração *</label>
                <select className="m-select" value={editBookingForm.duration || 60} onChange={e => setEditBookingForm(p => ({ ...p, duration: Number(e.target.value) }))}>
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>1h (60 min)</option>
                  <option value={75}>1h 15m</option>
                  <option value={90}>1h 30m</option>
                  <option value={105}>1h 45m</option>
                  <option value={120}>2h (120 min)</option>
                  <option value={150}>2h 30m</option>
                  <option value={180}>3h (180 min)</option>
                  <option value={240}>4h (240 min)</option>
                </select>
              </div>
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
                {Number(editBookingForm.prepayment || 0) > 0 && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--m-gold)', display: 'block', marginTop: 4 }}>
                    Valor líquido a cobrar: R$ {(Number(editBookingForm.servicePrice || 0) - Number(editBookingForm.prepayment || 0)).toFixed(2)}
                  </span>
                )}
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
                  <div 
                    key={b.id} 
                    className="m-info-row" 
                    style={{ cursor: 'pointer', padding: '8px 10px' }}
                    onClick={() => {
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
                        status: b.status || 'confirmado',
                        duration: b.duration || 60
                      });
                      setShowClientSheet(false);
                      setShowEditBookingSheet(true);
                    }}
                  >
                    <div>
                      <div style={{ fontSize:'0.82rem', fontWeight:700, color:'var(--m-text)', textDecoration: 'underline', textDecorationStyle: 'dotted' }}>{b.service?.name || b.serviceName}</div>
                      <div style={{ fontSize:'0.68rem', color:'var(--m-muted)', marginTop:2 }}>{fmtDate(b.date)} às {b.time}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <StatusPill status={b.status}/>
                      <button 
                        className="m-icon-btn" 
                        style={{ color: 'var(--m-red)', padding: 4 }} 
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (window.confirm('Tem certeza que deseja cancelar este agendamento?')) {
                            await changeStatus(b.id, 'cancelado');
                            showToast('Agendamento cancelado!', 'success');
                          }
                        }}
                      >
                        <Trash2 size={14}/>
                      </button>
                    </div>
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
      
      const containerHeight = containerSize * 1.25;
      const initialScale = Math.max(containerSize / naturalDimensions.w, containerHeight / naturalDimensions.h);
      const displayWidth = naturalDimensions.w * initialScale;
      const displayHeight = naturalDimensions.h * initialScale;
      const initialX = (containerSize - displayWidth) / 2;
      const initialY = (containerHeight - displayHeight) / 2;
      
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
                    aspectRatio:'4/5', 
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
                      const containerHeight = containerSize * 1.25;
                      const initialScale = Math.max(containerSize / naturalDimensions.w, containerHeight / naturalDimensions.h);
                      const displayWidth = naturalDimensions.w * initialScale * nextZoom;
                      const displayHeight = naturalDimensions.h * initialScale * nextZoom;
                      const initialX = (containerSize - displayWidth) / 2;
                      const initialY = (containerHeight - displayHeight) / 2;
                      
                      const minX = containerSize - displayWidth - initialX;
                      const maxX = -initialX;
                      const minY = containerHeight - displayHeight - initialY;
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



  // ── Product Exit Sheet ──────────────────────────────────────────
  const renderProductExitSheet = () => {
    if (!showProductExitSheet) return null;

    // Filter products by search
    const filteredProducts = inventory.filter(p => 
      p.name.toLowerCase().includes(exitProductSearch.toLowerCase())
    );

    // Filter clients by search
    const filteredClients = clients.filter(c => 
      c.name.toLowerCase().includes(exitClientSearch.toLowerCase()) ||
      c.phone.includes(exitClientSearch)
    );

    // Calculate cart total
    const cartTotal = exitCart.reduce((acc, item) => {
      const p = inventory.find(prod => prod.id === item.productId);
      return acc + (p ? (p.sellingPrice || 0) * item.quantity : 0);
    }, 0);

    const handleAddToCart = () => {
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

      // Check if already in cart
      const existingIdx = exitCart.findIndex(item => item.productId === product.id);
      if (existingIdx !== -1) {
        const newCart = [...exitCart];
        const newQty = newCart[existingIdx].quantity + qty;
        if (newQty > product.quantity) {
          showToast('Estoque total insuficiente', 'error');
          return;
        }
        newCart[existingIdx].quantity = newQty;
        setExitCart(newCart);
      } else {
        setExitCart(prev => [...prev, { productId: product.id, quantity: qty }]);
      }

      showToast(`${product.name} adicionado!`, 'success');
      setProdExitSelectedId('');
      setProdExitQuantity(1);
      setExitProductSearch('');
    };

    const handleRemoveFromCart = (productId) => {
      setExitCart(prev => prev.filter(item => item.productId !== productId));
    };

    return (
      <div className="m-overlay" onClick={() => { setShowProductExitSheet(false); setExitCart([]); }}>
        <div className="m-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: '92%', display: 'flex', flexDirection: 'column' }}>
          <div className="m-sheet-handle"/>
          <div className="m-sheet-header">
            <div className="m-sheet-title">Comanda de Produtos</div>
            <button onClick={() => { setShowProductExitSheet(false); setExitCart([]); }} className="m-icon-btn"><X size={18}/></button>
          </div>

          <div className="m-sheet-body" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
            
            {/* Segment: Reason */}
            <div className="m-field" style={{ marginBottom: '14px' }}>
              <label className="m-label">Finalidade da Saída</label>
              <div className="m-segmented">
                <button className={`m-seg-btn ${prodExitType === 'venda' ? 'active' : ''}`} onClick={() => setProdExitType('venda')}>💰 Venda Comercial</button>
                <button className={`m-seg-btn ${prodExitType === 'uso' ? 'active' : ''}`} onClick={() => setProdExitType('uso')}>💆 Uso no Salão</button>
              </div>
            </div>

            {/* Segment: Client selection (only for Venda) */}
            {prodExitType === 'venda' && (
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--m-rule)', marginBottom: '14px' }}>
                <label className="m-label" style={{ marginBottom: '8px', display: 'block' }}>Identificar Cliente?</label>
                <div className="m-segmented" style={{ marginBottom: '10px' }}>
                  <button className={`m-seg-btn ${exitClientType === 'avulso' ? 'active' : ''}`} onClick={() => setExitClientType('avulso')}>Cliente Avulso (Sem Identificar)</button>
                  <button className={`m-seg-btn ${exitClientType === 'client' ? 'active' : ''}`} onClick={() => setExitClientType('client')}>Cliente Cadastrado</button>
                </div>

                {exitClientType === 'client' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input 
                      type="text" 
                      className="m-input" 
                      placeholder="Buscar cliente por nome ou celular..." 
                      value={exitClientSearch}
                      onChange={e => setExitClientSearch(e.target.value)}
                    />
                    
                    {exitClientSearch && (
                      <div style={{ maxHeight: '110px', overflowY: 'auto', background: 'var(--m-card)', borderRadius: '6px', border: '1px solid var(--m-rule)', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
                        {filteredClients.slice(0, 5).map(c => (
                          <div 
                            key={c.phone} 
                            onClick={() => {
                              setExitClientPhone(c.phone);
                              setExitClientSearch(c.name);
                            }}
                            style={{ 
                              padding: '8px 12px', 
                              cursor: 'pointer', 
                              fontSize: '0.8rem',
                              borderBottom: '1px solid var(--m-rule)',
                              background: exitClientPhone === c.phone ? 'var(--m-gold-subtle)' : 'transparent',
                              color: exitClientPhone === c.phone ? 'var(--m-gold)' : 'inherit'
                            }}
                          >
                            {c.name} ({c.phone})
                          </div>
                        ))}
                        {filteredClients.length === 0 && (
                          <div style={{ padding: '8px 12px', fontSize: '0.8rem', color: 'var(--m-muted)' }}>Nenhum cliente encontrado</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Segment: Add Product to Comanda */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--m-rule)', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--m-gold)', marginBottom: '8px', display: 'block' }}>Adicionar Item</span>
              
              <div className="m-field" style={{ marginBottom: '10px', position: 'relative' }}>
                <input 
                  type="text" 
                  className="m-input" 
                  placeholder="Digitar nome do produto..." 
                  value={exitProductSearch}
                  onChange={e => {
                    setExitProductSearch(e.target.value);
                    setProdExitSelectedId('');
                  }}
                />
                {exitProductSearch.trim().length >= 3 && (!prodExitSelectedId || inventory.find(p => p.id === prodExitSelectedId)?.name !== exitProductSearch) && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    maxHeight: '180px',
                    overflowY: 'auto',
                    background: 'var(--m-card)',
                    border: '1px solid var(--m-rule)',
                    borderRadius: '6px',
                    zIndex: 10,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                  }}>
                    {filteredProducts.map(p => (
                      <div 
                        key={p.id}
                        onClick={() => {
                          setProdExitSelectedId(p.id);
                          setExitProductSearch(p.name);
                        }}
                        style={{
                          padding: '10px 12px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          borderBottom: '1px solid var(--m-rule)',
                          background: prodExitSelectedId === p.id ? 'var(--m-gold-subtle)' : 'transparent',
                          color: prodExitSelectedId === p.id ? 'var(--m-gold)' : 'inherit'
                        }}
                      >
                        {p.name} (R$ {p.sellingPrice || 0} | Estoque: {p.quantity})
                      </div>
                    ))}
                    {filteredProducts.length === 0 && (
                      <div style={{ padding: '10px 12px', fontSize: '0.8rem', color: 'var(--m-muted)' }}>Nenhum produto encontrado</div>
                    )}
                  </div>
                )}
              </div>

              {prodExitSelectedId && (() => {
                const selectedProd = inventory.find(p => p.id === prodExitSelectedId);
                return selectedProd ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--m-gold)', fontWeight: 600, marginBottom: '10px' }}>
                    Selecionado: {selectedProd.name} (R$ {selectedProd.sellingPrice || 0} | Estoque: {selectedProd.quantity})
                  </div>
                ) : null;
              })()}

              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <div className="m-field" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="m-label">Quantidade</label>
                  <input 
                    type="number" 
                    min="1" 
                    className="m-input" 
                    value={prodExitQuantity} 
                    onChange={e => setProdExitQuantity(e.target.value)}
                  />
                </div>
                <button 
                  type="button" 
                  className="m-btn m-btn-gold" 
                  style={{ height: '42px', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={handleAddToCart}
                >
                  <Plus size={16} /> Adicionar
                </button>
              </div>
            </div>

            {/* Comanda Summary List */}
            <div style={{ marginBottom: '14px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '8px' }}>📋 Itens na Comanda ({exitCart.length})</span>
              
              {exitCart.length === 0 ? (
                <div style={{ padding: '16px', border: '1px dashed var(--m-rule)', borderRadius: '8px', textAlign: 'center', color: 'var(--m-muted)', fontSize: '0.8rem' }}>
                  Comanda vazia. Adicione produtos acima!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {exitCart.map(item => {
                    const p = inventory.find(prod => prod.id === item.productId);
                    if (!p) return null;
                    const subtotal = (p.sellingPrice || 0) * item.quantity;
                    return (
                      <div 
                        key={item.productId} 
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          padding: '10px 12px', 
                          background: 'var(--m-card)', 
                          borderRadius: '6px', 
                          border: '1px solid var(--m-rule)',
                          fontSize: '0.8rem'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700 }}>{p.name}</div>
                          <div style={{ color: 'var(--m-muted)', fontSize: '0.72rem', marginTop: '2px' }}>
                            {item.quantity} x R$ {p.sellingPrice || 0}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontWeight: 800, color: 'var(--m-gold)' }}>R$ {subtotal}</span>
                          <button 
                            onClick={() => handleRemoveFromCart(item.productId)} 
                            className="m-icon-btn" 
                            style={{ color: 'var(--m-red)', padding: '4px' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Total Comanda Summary */}
                  {prodExitType === 'venda' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(218,163,84,0.06)', borderRadius: '6px', border: '1px solid var(--m-gold-subtle)', marginTop: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Valor Total da Comanda:</span>
                      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--m-gold)' }}>R$ {cartTotal}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Segment: Payment Method (only for Venda and if cart not empty) */}
            {prodExitType === 'venda' && exitCart.length > 0 && (
              <div className="m-field">
                <label className="m-label">Forma de Pagamento</label>
                <div className="m-segmented">
                  {['Pix', 'Crédito', 'Débito', 'Dinheiro'].map(method => (
                    <button 
                      key={method} 
                      className={`m-seg-btn ${exitPaymentMethod === method ? 'active' : ''}`}
                      onClick={() => setExitPaymentMethod(method)}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

          <div className="m-sheet-footer">
            <button className="m-btn m-btn-outline" style={{ flex: 1 }} onClick={() => { setShowProductExitSheet(false); setExitCart([]); }}>Cancelar</button>
            <button 
              className="m-btn m-btn-gold" 
              style={{ flex: 2 }} 
              onClick={handleProductExit}
              disabled={exitCart.length === 0}
            >
              <Check size={14}/> {prodExitType === 'venda' ? 'Finalizar Venda' : 'Confirmar Uso'}
            </button>
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

  const renderScaleBlockSheet = () => {
    if (!showScaleBlockSheet || !selectedScaleBlock) return null;
    const { isFullDay, slot, label } = selectedScaleBlock;

    return (
      <div className="m-overlay" onClick={() => setShowScaleBlockSheet(false)}>
        <div className="m-sheet" onClick={e => e.stopPropagation()}>
          <div className="m-sheet-handle"/>
          <div className="m-sheet-header">
            <div className="m-sheet-title">Opções do Horário</div>
            <button onClick={() => setShowScaleBlockSheet(false)} className="m-icon-btn"><X size={18}/></button>
          </div>
          <div className="m-sheet-body" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--m-gold)', fontFamily: '"Bricolage Grotesque", sans-serif' }}>
                {isFullDay ? `${label}` : `${slot}`}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--m-muted)', marginTop: 4 }}>
                {isFullDay ? 'Dia inteiro fora de escala' : 'Horário fora de escala de trabalho'}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Option 1: Book Client */}
              {!isFullDay && (
                <button
                  className="m-btn m-btn-gold"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', borderRadius: '10px' }}
                  onClick={() => {
                    setShowScaleBlockSheet(false);
                    setNbForm(prev => ({
                      ...prev,
                      date: currentDate,
                      time: slot,
                      clientName: '',
                      clientPhone: '',
                      serviceName: '',
                      servicePrice: '',
                      notes: '',
                      prepayment: ''
                    }));
                    setShowNewBookingSheet(true);
                  }}
                >
                  <Calendar size={18} />
                  Agendar Cliente
                </button>
              )}

              {/* Option 2: Liberar/Desbloquear */}
              <button
                className="m-btn"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '14px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid var(--m-rule)',
                  color: '#fff',
                  borderRadius: '10px'
                }}
                onClick={() => {
                  setShowScaleBlockSheet(false);
                  if (isFullDay) {
                    localStorage.setItem(`scale_unlock_${currentDate}_all`, 'true');
                    showToast("Dia liberado para agendamentos!", "success");
                    window.location.reload();
                  } else {
                    localStorage.setItem(`scale_unlock_${currentDate}_${slot}`, 'true');
                    showToast("Horário liberado!", "success");
                    window.location.reload();
                  }
                }}
              >
                <Zap size={18} style={{ color: 'var(--m-gold)' }} />
                {isFullDay ? 'Liberar o dia na escala' : 'Liberar horário na escala'}
              </button>
            </div>
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
              <img src="/logo-jon-cortou.png" className="m-header-logo" alt="Logo" onError={e => { e.target.style.display='none'; }}/>
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
      {(tab === 'hoje' || tab === 'agenda' || tab === 'caixa') && (
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
                  <span className="m-nav-icon-wrap" style={{ display: 'none' }}/>
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
      {renderScaleBlockSheet()}

      {/* Photo preview (fullscreen) */}
      {renderPhotoPreview()}
    </div>
  );
}
