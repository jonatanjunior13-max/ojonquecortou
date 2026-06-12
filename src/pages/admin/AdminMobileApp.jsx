import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage, fetchCollectionRest, fetchDocRest } from '../../config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, setDoc, getDoc
} from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import {
  Home, Calendar, Camera, Users, DollarSign, MoreHorizontal,
  Plus, Bell, ChevronLeft, ChevronRight, X, Check, Phone, MessageSquare,
  Scissors, Package, TrendingUp, TrendingDown, Search, Settings, Trash2,
  Edit3, ArrowRight, LogOut, BarChart2, Send, ShoppingBag, Clock,
  Zap, Star, AlertCircle, CheckCircle, Upload, Image, RefreshCw, Eye
} from 'lucide-react';
import './AdminMobile.css';
import { syncBookingToGoogle } from '../../utils/gcalSync';

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════
const fmt = (n) => `R$\u00a0${Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => { try { const dt = new Date(d + 'T00:00:00'); return dt.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }); } catch { return d; } };
const dateStr = (d) => d.toISOString().split('T')[0];
const today = () => dateStr(new Date());

const SLOTS = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30','19:00'];
const PAY_METHODS = ['Pix','Dinheiro','Débito','Crédito','Cortesia'];
const GALLERY_CATS = ['Todos','Antes/Depois','Cortes','Coloração','Tratamento','Geral'];
const CURL_TYPES = ['1A','1B','1C','2A','2B','2C','3A','3B','3C','4A','4B','4C'];

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
  const [isFinalizingCheckout, setIsFinalizingCheckout] = useState(false);

  // ── New Booking Form ───────────────────────────────────────────
  const [nbForm, setNbForm] = useState({ clientName:'', clientPhone:'', serviceName:'', date: today(), time:'09:00', notes:'' });
  const [nbSuggestions, setNbSuggestions] = useState([]);

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

  // ── Clients ────────────────────────────────────────────────────
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientSheet, setShowClientSheet] = useState(false);
  const [showNewClientSheet, setShowNewClientSheet] = useState(false);
  const [newClientForm, setNewClientForm] = useState({ name:'', phone:'', email:'', curvatura:'3A', observacoes:'' });

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
    if (!db) {
      setLoading(false);
      setAuthReady(true);
      return;
    }

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setAuthReady(true);
      if (!user) { navigate('/admin/login'); return; }

      try {
        const token = await user.getIdToken(true);

        const [bk, cl, tx, sv, inv, pk, st, gal] = await Promise.allSettled([
          fetchCollectionRest('bookings', token),
          fetchCollectionRest('client_profiles', token),
          fetchCollectionRest('financial_transactions', token),
          fetchCollectionRest('services', token),
          fetchCollectionRest('products', token),
          fetchCollectionRest('packages', token),
          fetchDocRest('settings', 'studio', token),
          fetchCollectionRest('gallery_photos', token)
        ]);

        if (bk.status === 'fulfilled') setBookings(bk.value);
        if (cl.status === 'fulfilled') setClients(cl.value);
        if (tx.status === 'fulfilled') setTransactions(tx.value);
        if (sv.status === 'fulfilled') setServices(sv.value);
        if (inv.status === 'fulfilled') setInventory(inv.value);
        if (pk.status === 'fulfilled') setPackages(pk.value);
        if (st.status === 'fulfilled' && st.value) setSettings(st.value);
        if (gal.status === 'fulfilled') setGalleryPhotos(gal.value);

        setLoading(false);

        // Real-time listeners
        onSnapshot(collection(db, 'bookings'), snap => {
          if (!snap.metadata.fromCache) setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        onSnapshot(collection(db, 'financial_transactions'), snap => {
          if (!snap.metadata.fromCache) setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        onSnapshot(collection(db, 'gallery_photos'), snap => {
          if (!snap.metadata.fromCache) setGalleryPhotos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        onSnapshot(collection(db, 'products'), snap => {
          if (!snap.metadata.fromCache) setInventory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
      } catch (err) {
        console.error(err);
        setSyncError(err.message);
        setLoading(false);
      }
    });

    return () => unsubAuth();
  }, [navigate]);

  // ── Derived: today's bookings ──────────────────────────────────
  const todayBookings = bookings
    .filter(b => b.date === currentDate && b.status !== 'cancelado')
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  const todayRevenue = transactions
    .filter(t => t.date === today() && t.type === 'entrada')
    .reduce((s, t) => s + Number(t.value || 0), 0);

  const monthRevenue = (() => {
    const m = new Date().toISOString().slice(0, 7);
    return transactions
      .filter(t => (t.date || '').startsWith(m) && t.type === 'entrada')
      .reduce((s, t) => s + Number(t.value || 0), 0);
  })();

  const pendingCount = bookings.filter(b => b.status === 'pendente').length;

  // ── Week Strip ─────────────────────────────────────────────────
  const getWeekDays = (centerDate) => {
    const d = new Date(centerDate + 'T00:00:00');
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    return Array.from({ length: 7 }, (_, i) => {
      const wd = new Date(monday);
      wd.setDate(monday.getDate() + i);
      return dateStr(wd);
    });
  };
  const weekDays = getWeekDays(currentDate);
  const DAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

  const navigateDate = (delta) => {
    const d = new Date(currentDate + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    setCurrentDate(dateStr(d));
  };

  // ── Checkout helpers ───────────────────────────────────────────
  const openCheckout = (booking) => {
    setCheckoutBooking(booking);
    setPaymentMethod('Pix');
    setSelectedProducts([]);
    setDiscount(0);
    setShowBookingSheet(false);
    setShowCheckoutSheet(true);
  };

  const getCheckoutTotal = () => {
    if (!checkoutBooking) return 0;
    const base = checkoutBooking.service?.promoPrice || checkoutBooking.service?.price || checkoutBooking.servicePrice || 0;
    const prods = selectedProducts.reduce((s, p) => s + p.sellingPrice * p.qty, 0);
    const prepay = Number(checkoutBooking.prepayment || 0);
    return Math.max(0, base + prods - discount - prepay);
  };

  const toggleProduct = (prod) => {
    setSelectedProducts(prev => {
      const idx = prev.findIndex(p => p.id === prod.id);
      if (idx >= 0) return prev.filter(p => p.id !== prod.id);
      return [...prev, { ...prod, qty: 1 }];
    });
  };

  const changeProductQty = (prodId, delta) => {
    setSelectedProducts(prev => prev.map(p => p.id === prodId ? { ...p, qty: Math.max(1, p.qty + delta) } : p));
  };

  const finalizeCheckout = async () => {
    if (!checkoutBooking) return;
    setIsFinalizingCheckout(true);
    try {
      const total = getCheckoutTotal();
      // Save transaction
      const txData = {
        type: 'entrada',
        description: `Atendimento — ${checkoutBooking.clientName || checkoutBooking.service?.name || 'Serviço'}`,
        value: total,
        paymentMethod,
        date: today(),
        bookingId: checkoutBooking.id,
        productSales: selectedProducts.map(p => ({ productId: p.id, name: p.name, qty: p.qty, price: p.sellingPrice })),
        createdAt: new Date().toISOString()
      };
      if (db) {
        await addDoc(collection(db, 'financial_transactions'), txData);
        await updateDoc(doc(db, 'bookings', checkoutBooking.id), { status: 'finalizado', paymentMethod, finalValue: total });
        // Decrement inventory
        for (const p of selectedProducts) {
          const prodRef = doc(db, 'products', p.id);
          const snap = await getDoc(prodRef);
          if (snap.exists()) {
            const cur = snap.data().quantity || 0;
            await updateDoc(prodRef, { quantity: Math.max(0, cur - p.qty) });
          }
        }
      }
      setBookings(prev => prev.map(b => b.id === checkoutBooking.id ? { ...b, status: 'finalizado', paymentMethod, finalValue: total } : b));
      setTransactions(prev => [...prev, { id: Date.now().toString(), ...txData }]);
      setShowCheckoutSheet(false);
      setCheckoutBooking(null);
      showToast('Comanda fechada com sucesso!', 'success');
    } catch (err) {
      showToast('Erro ao fechar comanda: ' + err.message, 'error');
    } finally {
      setIsFinalizingCheckout(false);
    }
  };

  // ── New Booking ────────────────────────────────────────────────
  const addBooking = async () => {
    if (!nbForm.clientName || !nbForm.serviceName) { showToast('Preencha cliente e serviço', 'error'); return; }
    const svc = services.find(s => s.name === nbForm.serviceName);
    const data = {
      clientName: nbForm.clientName,
      clientPhone: nbForm.clientPhone || '',
      service: svc || { name: nbForm.serviceName },
      serviceName: nbForm.serviceName,
      servicePrice: svc?.promoPrice || svc?.price || 0,
      date: nbForm.date,
      time: nbForm.time,
      notes: nbForm.notes || '',
      status: 'confirmado',
      createdAt: new Date().toISOString()
    };
    try {
      if (db) {
        const ref = await addDoc(collection(db, 'bookings'), data);
        setBookings(prev => [...prev, { id: ref.id, ...data }]);
        try { await syncBookingToGoogle({ id: ref.id, ...data }); } catch {}
      }
      setShowNewBookingSheet(false);
      setNbForm({ clientName:'', clientPhone:'', serviceName:'', date: today(), time:'09:00', notes:'' });
      showToast('Agendamento criado!', 'success');
    } catch (err) {
      showToast('Erro: ' + err.message, 'error');
    }
  };

  // ── Client name autocomplete ───────────────────────────────────
  useEffect(() => {
    if (nbForm.clientName.length < 2) { setNbSuggestions([]); return; }
    const q = nbForm.clientName.toLowerCase();
    setNbSuggestions(clients.filter(c => c.name?.toLowerCase().includes(q)).slice(0, 5));
  }, [nbForm.clientName, clients]);

  // ── Change booking status ──────────────────────────────────────
  const changeStatus = async (bookingId, status) => {
    try {
      if (db) await updateDoc(doc(db, 'bookings', bookingId), { status });
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b));
      setShowBookingSheet(false);
      showToast(`Status atualizado: ${status}`, 'success');
    } catch (err) {
      showToast('Erro: ' + err.message, 'error');
    }
  };

  // ── Gallery upload ─────────────────────────────────────────────
  const handleGalleryFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('Selecione uma imagem', 'error'); return; }
    const url = URL.createObjectURL(file);
    setPendingFile(file);
    setPendingPreviewUrl(url);
    setUploadForm({ category: 'Geral', caption: '' });
    setShowUploadSheet(true);
  };

  const uploadPhoto = async () => {
    if (!pendingFile) return;
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('storage');

    try {
      // Step 1: Upload to Firebase Storage
      const filename = `${Date.now()}_${pendingFile.name.replace(/\s+/g, '_')}`;
      const sRef = storageRef(storage, `gallery/${filename}`);
      const uploadTask = uploadBytesResumable(sRef, pendingFile);

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
      try {
        const gAccountId = settings?.googleAccountId || '';
        const gLocationId = settings?.googleLocationId || '';
        if (gAccountId && gLocationId && settings?.googleAccessToken) {
          const resp = await fetch(
            `https://mybusiness.googleapis.com/v4/accounts/${gAccountId}/locations/${gLocationId}/media`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${settings.googleAccessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                mediaFormat: 'PHOTO',
                sourceUrl: downloadURL,
                locationAssociation: { category: 'EXTERIOR' },
                description: uploadForm.caption || 'Studio do Jon'
              })
            }
          );
          googlePosted = resp.ok;
        }
      } catch (gErr) {
        console.warn('Google Business post skipped:', gErr.message);
      }

      setUploadProgress(95);

      // Step 3: Save to Firestore gallery_photos
      const photoData = {
        url: downloadURL,
        filename,
        category: uploadForm.category,
        caption: uploadForm.caption || '',
        googlePosted,
        createdAt: new Date().toISOString(),
        storagePath: `gallery/${filename}`
      };

      if (db) {
        const ref = await addDoc(collection(db, 'gallery_photos'), photoData);
        setGalleryPhotos(prev => [{ id: ref.id, ...photoData }, ...prev]);
      }

      setUploadProgress(100);
      setUploadStatus('done');
      setShowUploadSheet(false);
      setPendingFile(null);
      setPendingPreviewUrl('');
      showToast(
        googlePosted ? 'Foto publicada no Studio e no Google! 🎉' : 'Foto salva na galeria!',
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

  // ── Loading screen ─────────────────────────────────────────────
  if (loading || !authReady) {
    return (
      <div className="m-loading">
        <div style={{ fontSize: '2rem', fontFamily: '"DM Serif Display", serif', color: '#DCA354' }}>Studio do Jon</div>
        <div className="m-spinner" />
        <span>Carregando dados...</span>
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
            <div style={{ fontSize:'0.72rem', fontWeight:800, color:'var(--m-gold)', textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:6 }}>🎂 Aniversariante{birthdays.length > 1 ? 's':''} Hoje</div>
            {birthdays.map(c => (
              <div key={c.id} style={{ fontSize:'0.85rem', color:'var(--m-text)', fontWeight:700 }}>{c.name}</div>
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
                    <div className="m-booking-name">{b.clientName}</div>
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
            const dt = new Date(d + 'T00:00:00');
            const dayIdx = dt.getDay();
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
          <button className="m-date-nav" onClick={() => navigateDate(-1)}><ChevronLeft size={18}/></button>
          <div className="m-date-center">
            <div className="m-date-day">{fmtDate(currentDate)}</div>
          </div>
          <button className="m-date-nav" onClick={() => navigateDate(1)}><ChevronRight size={18}/></button>
        </div>

        {/* Slot list */}
        <div style={{ flex:1, overflowY:'auto' }}>
          <div className="m-slot-list">
            {SLOTS.map(slot => {
              const bk = dayBookings.find(b => b.time === slot);
              return (
                <div key={slot} className="m-slot-row" onClick={() => {
                  if (bk) { setSelectedBooking(bk); setShowBookingSheet(true); }
                  else { setSelectedSlot(slot); setShowSlotSheet(true); }
                }}>
                  <div className="m-slot-time">{slot}</div>
                  <div className="m-slot-content">
                    {bk ? (
                      <div className={`m-slot-booking ${bk.status}`}>
                        <div>
                          <div className="m-slot-client">{bk.clientName}</div>
                          <div className="m-slot-svc">{bk.service?.name || bk.serviceName}</div>
                        </div>
                        <StatusPill status={bk.status}/>
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
            <span>Adicionar Foto</span>
          </div>
          <input ref={galleryInputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleGalleryFileSelect}/>

          {filtered.map(photo => (
            <div key={photo.id} className="m-gallery-item" onClick={() => setPreviewPhoto(photo)}>
              <img src={photo.url} alt={photo.caption || photo.category} loading="lazy"/>
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

  // ── Slot Action Sheet ──────────────────────────────────────────
  const renderSlotSheet = () => {
    if (!showSlotSheet) return null;
    return (
      <div className="m-overlay" onClick={() => setShowSlotSheet(false)}>
        <div className="m-sheet" onClick={e => e.stopPropagation()}>
          <div className="m-sheet-handle"/>
          <div className="m-sheet-header">
            <div className="m-sheet-title">Horário {selectedSlot}</div>
            <button onClick={() => setShowSlotSheet(false)} className="m-icon-btn"><X size={18}/></button>
          </div>
          <div className="m-sheet-body">
            <div style={{ fontSize:'0.8rem', color:'var(--m-muted)', marginBottom:8 }}>{fmtDate(currentDate)} · Horário disponível</div>
            <div className="m-action-list">
              <button className="m-action-btn" onClick={() => { setShowSlotSheet(false); setNbForm(prev => ({ ...prev, date: currentDate, time: selectedSlot })); setShowNewBookingSheet(true); }}>
                <div className="m-action-btn-icon" style={{ background:'var(--m-gold-subtle)', color:'var(--m-gold)' }}><Plus size={16}/></div>
                <div className="m-action-btn-text">
                  <div className="m-action-btn-label">Novo Agendamento</div>
                  <div className="m-action-btn-sub">Criar reserva para este horário</div>
                </div>
              </button>
            </div>
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
            {/* Base service */}
            <div>
              <div className="m-label" style={{ marginBottom:8 }}>Serviço</div>
              <div className="m-info-row" style={{ borderBottom:'none', padding:'0' }}>
                <span style={{ fontSize:'0.85rem', color:'var(--m-text-2)' }}>{b.service?.name || b.serviceName}</span>
                <span style={{ fontWeight:800, color:'var(--m-gold)', fontFamily:'"DM Serif Display", serif' }}>{fmt(basePrice)}</span>
              </div>
            </div>

            {/* Products */}
            {inventory.length > 0 && (
              <div>
                <div className="m-label" style={{ marginBottom:8 }}>Adicionar Produtos</div>
                <div className="m-product-grid">
                  {inventory.filter(p => p.quantity > 0).slice(0, 6).map(prod => {
                    const sel = selectedProducts.find(p => p.id === prod.id);
                    return (
                      <div key={prod.id} className={`m-product-chip ${sel ? 'selected' : ''}`} onClick={() => toggleProduct(prod)}>
                        <div className="m-product-chip-name">{prod.name}</div>
                        <div className="m-product-chip-price">{fmt(prod.sellingPrice)}</div>
                        {sel && (
                          <div className="m-qty-row">
                            <button className="m-qty-btn" onClick={e => { e.stopPropagation(); changeProductQty(prod.id, -1); }}>−</button>
                            <span style={{ fontSize:'0.82rem', fontWeight:800, color:'var(--m-gold)', minWidth:16, textAlign:'center' }}>{sel.qty}</span>
                            <button className="m-qty-btn" onClick={e => { e.stopPropagation(); changeProductQty(prod.id, 1); }}>+</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Discount */}
            <div className="m-field">
              <label className="m-label">Desconto (R$)</label>
              <input className="m-input" type="number" min="0" value={discount} onChange={e => setDiscount(Number(e.target.value))} placeholder="0,00"/>
            </div>

            {/* Payment method */}
            <div>
              <div className="m-label" style={{ marginBottom:8 }}>Forma de Pagamento</div>
              <div className="m-payment-row">
                {PAY_METHODS.map(m => (
                  <button key={m} className={`m-pay-pill ${paymentMethod === m ? 'active' : ''}`} onClick={() => setPaymentMethod(m)}>{m}</button>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="m-checkout-total">
              <div className="m-checkout-total-label">Total a Pagar</div>
              <div className="m-checkout-total-value">{fmt(getCheckoutTotal())}</div>
            </div>
          </div>
          <div className="m-sheet-footer">
            <button className="m-btn m-btn-outline" style={{ flex:1 }} onClick={() => setShowCheckoutSheet(false)}>Cancelar</button>
            <button className="m-btn m-btn-gold" style={{ flex:2 }} onClick={finalizeCheckout} disabled={isFinalizingCheckout}>
              {isFinalizingCheckout ? <><RefreshCw size={14} style={{ animation:'mSpin 0.8s linear infinite' }}/> Processando...</> : <><Check size={14}/> Confirmar</>}
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
            <div className="m-field">
              <label className="m-label">Serviço *</label>
              <select className="m-select" value={nbForm.serviceName} onChange={e => setNbForm(p => ({ ...p, serviceName: e.target.value }))}>
                <option value="">Selecione um serviço</option>
                {services.map(s => <option key={s.id} value={s.name}>{s.name} — {fmt(s.promoPrice || s.price)}</option>)}
              </select>
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

  // ── Client Detail Sheet ────────────────────────────────────────
  const renderClientSheet = () => {
    if (!showClientSheet || !selectedClient) return null;
    const c = selectedClient;
    const visits = bookings.filter(b => (b.clientPhone && b.clientPhone === c.phone) || b.clientName === c.name).sort((a,b) => (b.date || '').localeCompare(a.date || ''));

    return (
      <div className="m-overlay" onClick={() => setShowClientSheet(false)}>
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
            <button onClick={() => setShowClientSheet(false)} className="m-icon-btn"><X size={18}/></button>
          </div>
          <div className="m-sheet-body">
            {/* Info */}
            <div style={{ background:'var(--m-card)', borderRadius:'var(--m-radius)', padding:'14px' }}>
              {[
                { label:'Telefone', val: c.phone || '—' },
                { label:'E-mail', val: c.email || '—' },
                { label:'Curvatura', val: c.curvatura || '—' },
                { label:'Porosidade', val: c.porosidade || '—' },
                c.observacoes ? { label:'Observações', val: c.observacoes } : null
              ].filter(Boolean).map((row, i) => (
                <div key={i} className="m-info-row">
                  <span className="m-info-label">{row.label}</span>
                  <span className="m-info-value" style={{ fontSize:'0.78rem', maxWidth:'55%', textAlign:'right', wordBreak:'break-word' }}>{row.val}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display:'flex', gap:8 }}>
              {c.phone && (
                <button className="m-btn m-btn-ghost" style={{ flex:1 }} onClick={() => window.open(`https://wa.me/55${c.phone.replace(/\D/g,'')}`)}>
                  <MessageSquare size={14}/> WhatsApp
                </button>
              )}
              <button className="m-btn m-btn-gold" style={{ flex:1 }} onClick={() => { setShowClientSheet(false); setNbForm(p => ({ ...p, clientName: c.name, clientPhone: c.phone || '' })); setShowNewBookingSheet(true); }}>
                <Plus size={14}/> Agendar
              </button>
            </div>

            {/* Visit history */}
            <div>
              <div className="m-section-title" style={{ marginBottom:10 }}>Histórico ({visits.length} visitas)</div>
              {visits.slice(0, 5).map(b => (
                <div key={b.id} className="m-info-row">
                  <div>
                    <div style={{ fontSize:'0.82rem', fontWeight:700, color:'var(--m-text)' }}>{b.service?.name || b.serviceName}</div>
                    <div style={{ fontSize:'0.68rem', color:'var(--m-muted)', marginTop:2 }}>{fmtDate(b.date)}</div>
                  </div>
                  <StatusPill status={b.status}/>
                </div>
              ))}
              {visits.length === 0 && <div style={{ color:'var(--m-muted)', fontSize:'0.8rem' }}>Nenhuma visita registrada</div>}
            </div>
          </div>
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
    return (
      <div className="m-overlay" onClick={() => { setShowUploadSheet(false); setPendingFile(null); setPendingPreviewUrl(''); }}>
        <div className="m-sheet" onClick={e => e.stopPropagation()}>
          <div className="m-sheet-handle"/>
          <div className="m-sheet-header">
            <div className="m-sheet-title">Publicar Foto</div>
            <button onClick={() => { setShowUploadSheet(false); setPendingFile(null); setPendingPreviewUrl(''); }} className="m-icon-btn"><X size={18}/></button>
          </div>
          <div className="m-sheet-body">
            {/* Preview */}
            {pendingPreviewUrl && (
              <div style={{ borderRadius:'var(--m-radius)', overflow:'hidden', aspectRatio:'1/1', background:'var(--m-card)', position:'relative' }}>
                <img src={pendingPreviewUrl} alt="Preview" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              </div>
            )}

            {/* Category */}
            <div className="m-field">
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

            {/* Destination info */}
            <div style={{ background:'var(--m-gold-subtle)', border:'0.5px solid var(--m-gold)', borderRadius:'var(--m-radius-sm)', padding:'12px 14px' }}>
              <div style={{ fontSize:'0.72rem', fontWeight:800, color:'var(--m-gold)', textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:6 }}>📸 Destinos de Publicação</div>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <div style={{ fontSize:'0.78rem', color:'var(--m-text-2)', display:'flex', alignItems:'center', gap:6 }}>
                  <CheckCircle size={12} color="var(--m-green)"/>
                  Galeria do Site (Firebase Storage)
                </div>
                <div style={{ fontSize:'0.78rem', color: settings?.googleLocationId ? 'var(--m-text-2)' : 'var(--m-muted)', display:'flex', alignItems:'center', gap:6 }}>
                  {settings?.googleLocationId ? <CheckCircle size={12} color="var(--m-green)"/> : <AlertCircle size={12} color="var(--m-muted)"/>}
                  Google Business Photos {!settings?.googleLocationId && '(não configurado)'}
                </div>
              </div>
            </div>
          </div>
          <div className="m-sheet-footer">
            <button className="m-btn m-btn-outline" style={{ flex:1 }} onClick={() => { setShowUploadSheet(false); setPendingFile(null); setPendingPreviewUrl(''); }}>Cancelar</button>
            <button className="m-btn m-btn-gold" style={{ flex:2 }} onClick={uploadPhoto} disabled={isUploading}>
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
        <img className="m-photo-preview-img" src={previewPhoto.url} alt={previewPhoto.caption}/>
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

      {/* FAB */}
      {(tab === 'hoje' || tab === 'agenda') && (
        <button className="m-fab" onClick={() => setShowNewBookingSheet(true)}>
          <Plus size={22}/>
        </button>
      )}
      {tab === 'galeria' && (
        <button className="m-fab" onClick={() => galleryInputRef.current?.click()}>
          <Camera size={22}/>
        </button>
      )}

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)}/>}

      {/* Sheets */}
      {renderBookingSheet()}
      {renderSlotSheet()}
      {renderCheckoutSheet()}
      {renderNewBookingSheet()}
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
