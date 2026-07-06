import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { auth, db, withTimeout } from '../config/firebase';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged,
  signOut,
  signInAnonymously
} from 'firebase/auth';
import { collection, addDoc, getDocs, query, where, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import SEO from '../components/SEO';
import { Arrow } from '../components/NewDesignComponents';
import { Clock, ChevronDown, ChevronUp, Sparkles, Check, MessageCircle, Lock, Unlock, Mail, ShieldAlert, Calendar } from 'lucide-react';
import { syncBookingToGoogle } from '../utils/gcalSync';
import './Booking.css';
import { SEED_SERVICES } from '../data/seedServices';

// Helper: gera datas disponíveis para agendamento (próximos 60 dias, respeitando folgas e bloqueios)
const getAvailableDates = (prof) => {
  const dates = [];
  const today = new Date();
  
  const daysOff = prof && prof.daysOff !== undefined ? prof.daysOff : [0, 1];
  const blockedDates = prof && prof.blockedDates ? prof.blockedDates : [];
  
  for (let i = 0; i <= 60; i++) {
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + i);
    
    const dayOfWeek = nextDate.getDay();
    const year = nextDate.getFullYear();
    const month = String(nextDate.getMonth() + 1).padStart(2, '0');
    const day = String(nextDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const isDayOff = daysOff.includes(dayOfWeek);
    const isBlocked = blockedDates.includes(dateStr);
    
    if (!isDayOff && !isBlocked) {
      const monday = new Date(nextDate);
      const diff = nextDate.getDay() === 0 ? -6 : 1 - nextDate.getDay();
      monday.setDate(nextDate.getDate() + diff);
      
      const mYear = monday.getFullYear();
      const mMonth = String(monday.getMonth() + 1).padStart(2, '0');
      const mDay = String(monday.getDate()).padStart(2, '0');
      const weekKey = `${mYear}-${mMonth}-${mDay}`;
      
      let weekLabel = monday.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
      weekLabel = `Semana de ${weekLabel.replace('.', '')}`;
 
      dates.push({
        raw: dateStr,
        formatted: nextDate.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }),
        display: nextDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        weekKey,
        weekLabel
      });
    }
  }
  return dates;
};

// Helper: gera horários disponíveis dinamicamente (respeitando expediente e almoço)
const generateTimeSlots = (prof) => {
  const slots = [];
  const workStart = prof?.workStart || '09:00';
  const workEnd = prof?.workEnd || '19:00';
  const lunchStart = prof?.lunchStart || '12:00';
  const lunchEnd = prof?.lunchEnd || '13:00';
  
  const [startH, startM] = workStart.split(':').map(Number);
  const [endH, endM] = workEnd.split(':').map(Number);
  const [lunchStartH, lunchStartM] = lunchStart.split(':').map(Number);
  const [lunchEndH, lunchEndM] = lunchEnd.split(':').map(Number);
  
  const startMin = startH * 60 + startM;
  const endMin = endH * 60 + endM;
  const lunchStartMin = lunchStartH * 60 + lunchStartM;
  const lunchEndMin = lunchEndH * 60 + lunchEndM;
  
  // Intervalos de 60 minutos
  for (let min = startMin; min < endMin; min += 60) {
    if (min >= lunchStartMin && min < lunchEndMin) {
      continue;
    }
    const h = Math.floor(min / 60);
    const m = min % 60;
    slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
  }
  return slots;
};

const BookingPage = () => {
  const [searchParams] = useSearchParams();
  const rescheduleId = searchParams.get('rescheduleId');

  useEffect(() => {
    if (typeof fbq !== 'undefined') {
      fbq('track', 'ViewContent', {
        content_name: 'Página de Agendamento',
        content_category: 'Agendamento',
      });
    }
  }, []);

  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [bookedTimes, setBookedTimes] = useState([]);
  const [settings, setSettings] = useState(null);
  const [selectedProfessional, setSelectedProfessional] = useState(null);

  // Packages integration states
  const [packages, setPackages] = useState([]);
  const [clientPackages, setClientPackages] = useState([]);
  const [selectedPackageTemplate, setSelectedPackageTemplate] = useState(null);
  const [usingPackageCredit, setUsingPackageCredit] = useState(false);
  const [usingClientPackageId, setUsingClientPackageId] = useState('');
  const [activePackageCredit, setActivePackageCredit] = useState(null);

  const checkPackageCredits = (phone, email, service) => {
    if (!service) return;
    const cleanPhone = (phone || '').replace(/\D/g, '');
    const cleanEmail = (email || '').trim().toLowerCase();
    
    // Find active purchased packages for this client with remaining credits for this service
    const matched = clientPackages.find(cp => {
      if (cp.status !== 'active') return false;
      const isOwner = 
        (cleanPhone && cp.clientPhone?.replace(/\D/g, '') === cleanPhone) ||
        (cleanEmail && cp.clientEmail?.toLowerCase() === cleanEmail);
      
      return isOwner && cp.balance && cp.balance[service.id] > 0;
    });

    setActivePackageCredit(matched || null);
    if (matched) {
      setUsingPackageCredit(true);
      setUsingClientPackageId(matched.id);
    } else {
      setUsingPackageCredit(false);
      setUsingClientPackageId('');
    }
  };

  // Auto-scroll to top on step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // Auto-scroll to top on selectedDate changes (after layout rendering)
  useEffect(() => {
    if (selectedDate) {
      const timer = setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedDate]);
  
  // Helper to detect WhatsApp-only services based on priceType or setting
  const isWhatsappOnlyService = (service) => {
    if (!service) return false;
    return service.scheduledViaWhatsapp === true || service.priceType === 'A partir de' || service.price === 'Sob Orçamento' || service.price === 'Sob Consulta';
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
  const [activeWeekKey, setActiveWeekKey] = useState('');
  
  // Catálogo visual states
  const [selectedCategory, setSelectedCategory] = useState('Cabelo');
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  
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
  const [bookingDemoMode, setBookingDemoMode] = useState(false);

  // Authentication & Linking States
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [existingProfile, setExistingProfile] = useState(null);
  const [authMode, setAuthMode] = useState(null); // null, 'login', 'register'
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [clientBookings, setClientBookings] = useState([]);


  // Load booking to reschedule if rescheduleId is provided
  useEffect(() => {
    if (!rescheduleId || services.length === 0) return;

    const loadRescheduleBooking = async () => {
      let bookingData = null;

      // 1. Try local storage first
      const localBookings = JSON.parse(localStorage.getItem('demo_bookings') || '[]');
      const localBooking = localBookings.find(b => b.id === rescheduleId);

      if (localBooking) {
        bookingData = localBooking;
      } else if (db) {
        try {
          const docRef = doc(db, 'bookings', rescheduleId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            bookingData = { id: docSnap.id, ...docSnap.data() };
          }
        } catch (err) {
          console.warn('Erro ao carregar agendamento para reagendamento:', err);
        }
      }

      if (bookingData) {
        setClientData({
          name: bookingData.clientName || '',
          phone: bookingData.clientPhone || '',
          email: bookingData.clientEmail || '',
          hairType: bookingData.hairType || '3A',
          notes: bookingData.notes || '',
          birthdate: bookingData.clientBirthdate || ''
        });

        // Find service
        const svcId = bookingData.service?.id || bookingData.serviceId;
        const svcName = bookingData.serviceName || bookingData.service?.name;
        const matchedService = services.find(s => s.id === svcId || s.name === svcName);
        if (matchedService) {
          setSelectedService(matchedService);
        } else if (bookingData.service) {
          setSelectedService(bookingData.service);
        }

        // Set professional
        if (bookingData.professionalId && settings?.professionals) {
          const matchedProf = settings.professionals.find(p => p.id === bookingData.professionalId);
          if (matchedProf) {
            setSelectedProfessional(matchedProf);
          }
        }

        // Jump to scheduling step directly
        setStep(2);
      }
    };

    loadRescheduleBooking();
  }, [rescheduleId, services, settings]);

  // Friendly error messages translator
  const getFriendlyAuthMessage = (code) => {
    switch (code) {
      case 'auth/wrong-password':
        return 'Senha incorreta. Tente novamente.';
      case 'auth/user-not-found':
        return 'Usuário não encontrado.';
      case 'auth/invalid-credential':
        return 'Credenciais inválidas. Verifique os dados informados.';
      case 'auth/weak-password':
        return 'A senha deve ter pelo menos 6 caracteres.';
      case 'auth/invalid-email':
        return 'E-mail inválido.';
      default:
        return 'Erro na autenticação. Verifique os dados ou tente outra opção.';
    }
  };

  // Disparar notificação de confirmação de agendamento por email
  const triggerEmailNotification = async (payload) => {
    try {
      const displayDate = selectedDateObj?.display || payload.date;
      const serviceName = payload.service?.name || (typeof payload.service === 'string' ? payload.service : '');
      const duration = payload.service?.duration || 60;
      const price = payload.service?.promoPrice ?? payload.service?.price ?? null;

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: rescheduleId ? 'agendamento_alterado' : 'solicitacao_recebida',
          id: payload.id,
          clientEmail: payload.clientEmail,
          clientName: payload.clientName,
          serviceName: serviceName,
          date: displayDate,
          time: payload.time,
          duration: duration,
          notes: payload.notes || '',
          professionalName: 'Jon',
          price: price
        }),
      });
      const data = await response.json();
      console.log('Email API response:', data);
    } catch (err) {
      console.error('Falha ao enviar solicitação por email:', err);
    }
  };

  // Load client profile by authenticated user ID
  const loadProfileByUserId = async (uid, email) => {
    setCheckingProfile(true);
    try {
      let profile = null;
      const isDemo = !db || isDemoMode;
      if (isDemo) {
        const localClients = JSON.parse(localStorage.getItem('demo_client_profiles') || '[]');
        profile = localClients.find(c => c.userId === uid || (c.email && c.email.toLowerCase() === email?.toLowerCase()));
      } else {
        const q = query(collection(db, 'client_profiles'), where('userId', '==', uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          profile = { id: snap.docs[0].id, ...snap.docs[0].data() };
        } else if (email) {
          const q2 = query(collection(db, 'client_profiles'), where('email', '==', email));
          const snap2 = await getDocs(q2);
          if (!snap2.empty) {
            profile = { id: snap2.docs[0].id, ...snap2.docs[0].data() };
            // Link existing profile to this UID
            const docRef = doc(db, 'client_profiles', profile.id);
            await updateDoc(docRef, { userId: uid });
            profile.userId = uid;
          }
        }
      }

      if (profile) {
        setClientData(prev => ({
          ...prev,
          name: profile.name || prev.name,
          phone: profile.phone || prev.phone,
          email: profile.email || prev.email,
          hairType: profile.curvatura || prev.hairType || '3A',
          birthdate: profile.birthdate || prev.birthdate || '',
          notes: profile.observacoes || prev.notes || '',
        }));
        setExistingProfile(profile);
        checkPackageCredits(profile.phone, profile.email, selectedService);

        // Fetch this client's bookings
        try {
          if (!db || isDemoMode) {
            const localBookings = JSON.parse(localStorage.getItem('demo_bookings') || '[]');
            const activeBookings = localBookings.filter(b => 
              b.userId === uid || 
              (profile.phone && b.clientPhone?.replace(/\D/g, '') === profile.phone) ||
              (profile.email && b.clientEmail?.toLowerCase() === profile.email.toLowerCase())
            );
            setClientBookings(activeBookings);
          } else {
            const qBookings = query(
              collection(db, 'bookings'),
              where('clientPhone', '==', profile.phone)
            );
            const querySnapshot = await getDocs(qBookings);
            const list = [];
            querySnapshot.forEach((doc) => {
              list.push({ id: doc.id, ...doc.data() });
            });
            // Filter out canceled ones and sort by date/time
            const activeBookings = list.filter(b => b.status !== 'cancelado');
            setClientBookings(activeBookings);
          }
        } catch (bkErr) {
          console.warn('Erro ao carregar agendamentos do cliente:', bkErr);
        }
      } else if (email) {
        setClientData(prev => ({
          ...prev,
          email: email
        }));
      }
      setAuthSuccess(true);
      setAuthMode(null);
    } catch (err) {
      console.error('Erro ao carregar perfil por userId:', err);
    } finally {
      setCheckingProfile(false);
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (user.isAnonymous) {
          setCurrentUser(null); // Keep UI showing as logged out for anonymous users
        } else {
          setCurrentUser(user);
          await loadProfileByUserId(user.uid, user.email);
        }
      } else {
        setCurrentUser(null);
        try {
          await signInAnonymously(auth);
        } catch (err) {
          console.warn('Anonymous auth failed:', err);
        }
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemoMode]);

  // Check phone/email on blur
  const handleFieldBlur = async () => {
    const cleanPhone = clientData.phone.replace(/\D/g, '');
    const email = clientData.email.trim();
    if (cleanPhone.length < 10 && !email) return;
    
    if (authSuccess) return;

    setCheckingProfile(true);
    setAuthError('');
    
    try {
      let matchedProfile = null;
      const isDemo = !db || isDemoMode;
      
      if (isDemo) {
        const localClients = JSON.parse(localStorage.getItem('demo_client_profiles') || '[]');
        if (cleanPhone) {
          matchedProfile = localClients.find(c => c.phone === cleanPhone);
        }
        if (!matchedProfile && email) {
          matchedProfile = localClients.find(c => c.email && c.email.toLowerCase() === email.toLowerCase());
        }
      } else {
        if (cleanPhone) {
          const clientRef = doc(db, 'client_profiles', cleanPhone);
          const clientSnap = await getDoc(clientRef);
          if (clientSnap.exists()) {
            matchedProfile = { id: clientSnap.id, ...clientSnap.data() };
          }
        }
        if (!matchedProfile && email) {
          const q = query(collection(db, 'client_profiles'), where('email', '==', email));
          const snap = await getDocs(q);
          if (!snap.empty) {
            matchedProfile = { id: snap.docs[0].id, ...snap.docs[0].data() };
          }
        }
      }
      
      if (matchedProfile) {
        setExistingProfile(matchedProfile);
        setClientData(prev => ({
          ...prev,
          name: prev.name || matchedProfile.name || '',
          phone: prev.phone || matchedProfile.phone || '',
          email: prev.email || matchedProfile.email || '',
          hairType: prev.hairType || matchedProfile.curvatura || '3A',
          birthdate: prev.birthdate || matchedProfile.birthdate || '',
          notes: prev.notes || matchedProfile.observacoes || ''
        }));

        if (matchedProfile.userId) {
          setAuthMode('login');
        } else {
          setAuthMode('register');
        }
        checkPackageCredits(matchedProfile.phone, matchedProfile.email, selectedService);
      } else {
        setExistingProfile(null);
        setAuthMode(null);
      }
    } catch (err) {
      console.error('Erro ao verificar perfil existente:', err);
    } finally {
      setCheckingProfile(false);
    }
  };

  // Busca perfil pelo e-mail digitado na aba "Entrar com E-mail" (antes de confirmar senha)
  const handleLoginEmailBlur = async () => {
    const email = loginEmail.trim();
    if (!email || !email.includes('@')) return;
    if (existingProfile) return; // já encontrou

    setCheckingProfile(true);
    setAuthError('');
    try {
      let matched = null;
      const isDemo = !db || bookingDemoMode;
      if (isDemo) {
        const localClients = JSON.parse(localStorage.getItem('demo_client_profiles') || '[]');
        matched = localClients.find(c => c.email && c.email.toLowerCase() === email.toLowerCase());
      } else {
        const { getDocs: _getDocs, query: _query, collection: _col, where: _where } = await import('firebase/firestore');
        const q = _query(_col(db, 'client_profiles'), _where('email', '==', email));
        const snap = await getDocs(q);
        if (!snap.empty) {
          matched = { id: snap.docs[0].id, ...snap.docs[0].data() };
        }
      }
      if (matched) {
        setExistingProfile(matched);
        // Pre-fill clientData with found profile (will be shown after password confirm)
        setClientData(prev => ({
          ...prev,
          name: matched.name || prev.name,
          phone: matched.phone || prev.phone,
          email: matched.email || prev.email,
          hairType: matched.curvatura || prev.hairType || '3A',
          birthdate: matched.birthdate || prev.birthdate || '',
          notes: matched.observacoes || prev.notes || ''
        }));
      }
    } catch (err) {
      console.warn('Erro ao buscar perfil pelo email de login:', err);
    } finally {
      setCheckingProfile(false);
    }
  };

  // Google authentication popup
  const handleGoogleAuth = async () => {
    setAuthLoading(true);
    setAuthError('');
    
    try {
      let uid = '';
      let email = '';
      const isDemo = !auth || isDemoMode;
      
      if (isDemo) {
        uid = existingProfile?.userId || 'demo-google-uid-' + Date.now();
        email = clientData.email || 'demo@google.com';
      } else {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        uid = result.user.uid;
        email = result.user.email;
      }
      
      const cleanPhone = clientData.phone.replace(/\D/g, '');
      
      if (existingProfile) {
        if (authMode === 'register') {
          if (isDemo) {
            const localClients = JSON.parse(localStorage.getItem('demo_client_profiles') || '[]');
            const updated = localClients.map(c => c.phone === cleanPhone ? { ...c, userId: uid, authProvider: 'google' } : c);
            localStorage.setItem('demo_client_profiles', JSON.stringify(updated));
          } else {
            const clientRef = doc(db, 'client_profiles', cleanPhone);
            await setDoc(clientRef, { userId: uid, authProvider: 'google' }, { merge: true });
          }
          setAuthSuccess(true);
          setAuthMode(null);
        } else if (authMode === 'login' || !authMode) {
          if (uid === existingProfile.userId || isDemo || email === existingProfile.email) {
            if (uid !== existingProfile.userId && !isDemo) {
              const clientRef = doc(db, 'client_profiles', existingProfile.phone);
              await setDoc(clientRef, { userId: uid }, { merge: true });
            }
            setAuthSuccess(true);
            setAuthMode(null);
          } else {
            setAuthError('Esta conta do Google não corresponde ao e-mail deste perfil.');
          }
        }
      } else {
        // Upfront login/register with Google (no profile matched yet)
        await loadProfileByUserId(uid, email);
      }
    } catch (err) {
      console.error('Erro na autenticação do Google:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('O login foi cancelado (janela fechada). Tente novamente.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setAuthError('Falha de segurança: Este domínio não está autorizado no painel do Firebase para fazer login com Google.');
      } else {
        setAuthError(`Falha ao autenticar com o Google. (${err.code || err.message || 'Erro desconhecido'})`);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // Email/Password login or registration linking
  const handleEmailPasswordAuth = async (e) => {
    if (e) e.preventDefault();
    
    const emailToUse = existingProfile ? clientData.email : loginEmail;
    if (!emailToUse) {
      setAuthError('Por favor, informe seu e-mail.');
      return;
    }
    if (!password) {
      setAuthError('Por favor, digite a senha.');
      return;
    }
    
    setAuthLoading(true);
    setAuthError('');
    
    try {
      let uid = '';
      const isDemo = !auth || isDemoMode;
      const cleanPhone = clientData.phone.replace(/\D/g, '');
      
      if (authMode === 'register') {
        if (isDemo) {
          uid = 'demo-pwd-uid-' + Date.now();
        } else {
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, emailToUse, password);
            uid = userCredential.user.uid;
          } catch (createErr) {
            if (createErr.code === 'auth/email-already-in-use') {
              const userCredential = await signInWithEmailAndPassword(auth, emailToUse, password);
              uid = userCredential.user.uid;
            } else {
              throw createErr;
            }
          }
        }
        
        if (isDemo) {
          const localClients = JSON.parse(localStorage.getItem('demo_client_profiles') || '[]');
          const updated = localClients.map(c => c.phone === cleanPhone ? { ...c, userId: uid, authProvider: 'password' } : c);
          localStorage.setItem('demo_client_profiles', JSON.stringify(updated));
        } else {
          const clientRef = doc(db, 'client_profiles', cleanPhone);
          await setDoc(clientRef, { userId: uid, authProvider: 'password' }, { merge: true });
        }
        setAuthSuccess(true);
        setAuthMode(null);
      } else if (authMode === 'login') {
        if (isDemo) {
          const localClients = JSON.parse(localStorage.getItem('demo_client_profiles') || '[]');
          const matchedProfile = localClients.find(c => c.email && c.email.toLowerCase() === emailToUse.toLowerCase());
          uid = matchedProfile?.userId || 'demo-pwd-uid-' + Date.now();
        } else {
          const userCredential = await signInWithEmailAndPassword(auth, emailToUse, password);
          uid = userCredential.user.uid;
        }
        
        await loadProfileByUserId(uid, emailToUse);
      }
    } catch (err) {
      console.error('Erro na autenticação por senha:', err);
      setAuthError(getFriendlyAuthMessage(err.code));
    } finally {
      setAuthLoading(false);
    }
  };

  // Reset auth and clear fields
  const handleResetAuth = async () => {
    if (auth && currentUser) {
      try {
        await signOut(auth);
      } catch (err) {
        console.warn('Erro ao deslogar:', err);
      }
    }
    setCurrentUser(null);
    setExistingProfile(null);
    setAuthMode(null);
    setAuthSuccess(false);
    setPassword('');
    setAuthError('');
    setLoginEmail('');
    setNewPassword('');
    setClientBookings([]);
    setClientData(prev => ({
      ...prev,
      name: '',
      phone: '',
      email: '',
      birthdate: '',
      notes: ''
    }));
  };

  // Carregar settings do Firestore e inicializar profissional padrão
  useEffect(() => {
    const fetchSettings = async () => {
      if (!db) return;
      try {
        const docRef = doc(db, 'settings', 'studio');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettings(data);
          const activeProfs = (data.professionals || []).filter(p => p.active !== false);
          if (activeProfs.length > 0) {
            const defaultProf = activeProfs.find(p => p.id === 'jon') || activeProfs[0];
            setSelectedProfessional(defaultProf);
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar settings em BookingPage:', err);
      }
    };
    fetchSettings();
  }, []);

  // Atualizar semana padrão e recalcular datas ao trocar de profissional
  useEffect(() => {
    const newDates = getAvailableDates(selectedProfessional);
    if (newDates.length > 0) {
      setActiveWeekKey(newDates[0].weekKey);
    }
  }, [selectedProfessional]);

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
        console.warn('Conexão com Firestore excedeu tempo limite ao carregar serviços. Usando serviços locais.');
        // NÃO ativamos isDemoMode aqui — só carregamos serviços locais como fallback
        // Isso garante que o agendamento ainda será salvo no Firestore
        const localData = localStorage.getItem('demo_services');
        setServices(localData ? JSON.parse(localData) : SEED_SERVICES);
      }, 5000);

      try {
        const querySnapshot = await withTimeout(getDocs(collection(db, 'services')), 5000);
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
        // NÃO ativamos isDemoMode — apenas usamos serviços locais como fallback
        const localData = localStorage.getItem('demo_services');
        setServices(localData ? JSON.parse(localData) : SEED_SERVICES);
      }
    };
    fetchServices();
  }, []);

  useEffect(() => {
    const fetchPackages = async () => {
      if (!db) {
        setPackages(JSON.parse(localStorage.getItem('demo_packages') || '[]'));
        setClientPackages(JSON.parse(localStorage.getItem('demo_client_packages') || '[]'));
        return;
      }
      try {
        const snap = await getDocs(collection(db, 'packages'));
        const list = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        setPackages(list);

        const snapCp = await getDocs(collection(db, 'client_packages'));
        const listCp = [];
        snapCp.forEach(d => listCp.push({ id: d.id, ...d.data() }));
        setClientPackages(listCp);
      } catch (err) {
        console.warn('Erro ao carregar pacotes:', err);
        setPackages(JSON.parse(localStorage.getItem('demo_packages') || '[]'));
        setClientPackages(JSON.parse(localStorage.getItem('demo_client_packages') || '[]'));
      }
    };
    fetchPackages();
  }, []);

  const dates = getAvailableDates(selectedProfessional);
  const timeSlots = generateTimeSlots(selectedProfessional);
  const activeProfessionals = (settings?.professionals || []).filter(p => p.active !== false);

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
      // Timeout fallback se o Firestore travar ao ler agenda
      const bookingsTimeout = setTimeout(() => {
        console.warn('Timeout ao carregar horários. Ativando modo Demo.');
        setIsDemoMode(true);
        setLoading(false);
      }, 3500);

      // Date calculations
      const parts = selectedDate.split('-');
      let weekday = 0;
      if (parts.length === 3) {
        const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        weekday = dateObj.getDay();
      }

      const inRange = (slot, start, end) => !end || end === start ? slot === start : slot >= start && slot < end;
      const ALL_SLOTS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];
      const activeProfs = (settings?.professionals || []).filter(p => p.active !== false);

      // Helper helper to check if a professional is available at a slot
      const checkProfAvailability = (prof, slot, bookedList) => {
        // 1. Check daysOff
        const daysOff = prof.daysOff !== undefined ? prof.daysOff : [0, 1];
        if (daysOff.includes(weekday)) return false;

        // 2. Check blocked dates
        const blockedDates = prof.blockedDates || [];
        if (blockedDates.includes(selectedDate)) return false;

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

        if (slotMin < startMin || slotMin >= endMin) return false;
        if (slotMin >= lunchStartMin && slotMin < lunchEndMin) return false;

        // 4. Check blockedWeekdayHours (recurring)
        const weekdayBlocks = prof.blockedWeekdayHours || [];
        let isBlockedWeekday = false;
        weekdayBlocks.forEach(block => {
          const segs = block.split('-');
          const w = segs[0]; const start = segs[1]; const end = segs[2] || null;
          if (Number(w) === weekday && inRange(slot, start, end)) {
            isBlockedWeekday = true;
          }
        });
        if (isBlockedWeekday) return false;

        // 5. Check blockedSpecificHours (pontual)
        const specificBlocks = prof.blockedSpecificHours || [];
        let isBlockedSpecific = false;
        specificBlocks.forEach(block => {
          if (!block.startsWith(selectedDate)) return;
          const rest = block.substring(selectedDate.length + 1);
          const restParts = rest.split('-');
          const start = restParts[0]; const end = restParts[1] || null;
          if (inRange(slot, start, end)) {
            isBlockedSpecific = true;
          }
        });
        if (isBlockedSpecific) return false;

        // 6. Check existing booking at this slot or overlapping with it
        const timeToMin = (t) => {
          const [h, m] = t.split(':').map(Number);
          return h * 60 + m;
        };
        const newServiceDuration = selectedService?.duration || 60;
        const slotEndMin = slotMin + newServiceDuration;

        const hasOverlap = bookedList.some(b => {
          const bTime = typeof b === 'string' ? b : b.time;
          const bDuration = typeof b === 'string' ? 60 : (b.duration || b.service?.duration || 60);
          const bStart = timeToMin(bTime);
          const bEnd = bStart + bDuration;
          
          // Check if the two intervals [slotMin, slotEndMin) and [bStart, bEnd) overlap
          return Math.max(slotMin, bStart) < Math.min(slotEndMin, bEnd);
        });

        if (hasOverlap) return false;

        return true;
      };

      if (!db || isDemoMode) {
        clearTimeout(bookingsTimeout);
        setIsDemoMode(true);
        setLoading(true);

        const localBookings = JSON.parse(localStorage.getItem('demo_bookings')) || [];
        const bookingsByProf = {};
        localBookings.forEach(b => {
          if (b.date === selectedDate && b.status !== 'cancelado') {
            const profId = b.professionalId || 'jon';
            if (!bookingsByProf[profId]) bookingsByProf[profId] = [];
            bookingsByProf[profId].push({
              time: b.time,
              duration: b.duration || b.service?.duration || 60
            });
          }
        });

        const booked = [];
        ALL_SLOTS.forEach(slot => {
          const targetProf = selectedProfessional || activeProfs.find(p => p.id === 'jon') || activeProfs[0];
          if (!targetProf) {
            booked.push(slot);
            return;
          }

          const isTargetAvailable = checkProfAvailability(targetProf, slot, bookingsByProf[targetProf.id] || []);
          if (!isTargetAvailable) {
            // Se o profissional alvo estiver bloqueado, verifique se há OUTROS profissionais disponíveis
            const othersAvailable = activeProfs.filter(p => p.id !== targetProf.id && checkProfAvailability(p, slot, bookingsByProf[p.id] || []));
            if (othersAvailable.length === 0) {
              booked.push(slot);
            }
          }
        });

        setBookedTimes(booked);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const q = query(
          collection(db, 'bookings'),
          where('date', '==', selectedDate)
        );
        const querySnapshot = await withTimeout(getDocs(q), 3500);
        clearTimeout(bookingsTimeout);
        
        const bookingsByProf = {};
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status !== 'cancelado') {
            const profId = data.profissional || data.professionalId || 'jon';
            if (!bookingsByProf[profId]) bookingsByProf[profId] = [];
            bookingsByProf[profId].push({
              time: data.time,
              duration: data.duration || data.service?.duration || 60
            });
          }
        });

        const booked = [];
        ALL_SLOTS.forEach(slot => {
          const targetProf = selectedProfessional || activeProfs.find(p => p.id === 'jon') || activeProfs[0];
          if (!targetProf) {
            booked.push(slot);
            return;
          }

          const isTargetAvailable = checkProfAvailability(targetProf, slot, bookingsByProf[targetProf.id] || []);
          if (!isTargetAvailable) {
            // Se o profissional selecionado estiver indisponível/bloqueado, verifique se há outros ativos livres
            const othersAvailable = activeProfs.filter(p => p.id !== targetProf.id && checkProfAvailability(p, slot, bookingsByProf[p.id] || []));
            if (othersAvailable.length === 0) {
              booked.push(slot);
            }
          }
        });

        setBookedTimes(booked);
        setIsDemoMode(false);
      } catch (err) {
        clearTimeout(bookingsTimeout);
        console.warn('Erro ao conectar ao Firebase, ativando modo Demo:', err);
        setIsDemoMode(true);
        
        const localBookings = JSON.parse(localStorage.getItem('demo_bookings')) || [];
        const bookingsByProf = {};
        localBookings.forEach(b => {
          if (b.date === selectedDate && b.status !== 'cancelado') {
            const profId = b.profissional || b.professionalId || 'jon';
            if (!bookingsByProf[profId]) bookingsByProf[profId] = [];
            bookingsByProf[profId].push({
              time: b.time,
              duration: b.duration || b.service?.duration || 60
            });
          }
        });

        const booked = [];
        ALL_SLOTS.forEach(slot => {
          const targetProf = selectedProfessional || activeProfs.find(p => p.id === 'jon') || activeProfs[0];
          if (!targetProf) {
            booked.push(slot);
            return;
          }

          const isTargetAvailable = checkProfAvailability(targetProf, slot, bookingsByProf[targetProf.id] || []);
          if (!isTargetAvailable) {
            const othersAvailable = activeProfs.filter(p => p.id !== targetProf.id && checkProfAvailability(p, slot, bookingsByProf[p.id] || []));
            if (othersAvailable.length === 0) {
              booked.push(slot);
            }
          }
        });
        setBookedTimes(booked);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [selectedDate, selectedProfessional, settings]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setClientData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validação estrita do campo de Telefone (WhatsApp)
    const cleanPhone = clientData.phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setAuthError('Por favor, informe um número de WhatsApp válido com DDD.');
      setLoading(false);
      return;
    }

    if (existingProfile && existingProfile.blocked) {
      setAuthError('Seu perfil está temporariamente bloqueado para agendamentos online pelo sistema. Por favor, solicite seu agendamento via WhatsApp.');
      setLoading(false);
      return;
    }

    // Validação de Manutenção de Corte nos últimos 90 dias
    const svcNameNorm = selectedService?.name?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";
    const isManutencaoCorte = svcNameNorm.includes("manutencao") && svcNameNorm.includes("corte");

    if (isManutencaoCorte) {
      setLoading(true);
      let clientBookings = [];
      
      if (bookingDemoMode || !db) {
        const localBookings = JSON.parse(localStorage.getItem('demo_bookings') || '[]');
        clientBookings = localBookings.filter(b => 
          b.clientPhone && b.clientPhone.replace(/\D/g, '') === cleanPhone
        );
      } else {
        try {
          const bookingsRef = collection(db, 'bookings');
          const q = query(bookingsRef, where('clientPhone', '==', clientData.phone));
          const querySnapshot = await getDocs(q);
          clientBookings = querySnapshot.docs.map(doc => doc.data());
          
          if (cleanPhone !== clientData.phone) {
            const qClean = query(bookingsRef, where('clientPhone', '==', cleanPhone));
            const querySnapshotClean = await getDocs(qClean);
            const cleanList = querySnapshotClean.docs.map(doc => doc.data());
            clientBookings = [...clientBookings, ...cleanList];
          }
        } catch (dbErr) {
          console.warn('Erro ao buscar histórico de agendamentos no Firestore:', dbErr);
        }
      }
      
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const hasRecentCorte = clientBookings.some(b => {
        if (!b.date || (b.status !== 'finalizado' && b.status !== 'confirmado')) return false;
        
        const bookingDate = new Date(b.date + 'T00:00:00');
        if (bookingDate < ninetyDaysAgo) return false;
        
        const bSvcNameNorm = (b.service?.name || b.serviceName || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const isFullCorte = bSvcNameNorm.includes('corte') && !bSvcNameNorm.includes('manutencao');
        return isFullCorte;
      });
      
      if (!hasRecentCorte) {
        setLoading(false);
        setAuthError(
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px', padding: '16px', background: 'rgba(200, 133, 42, 0.05)', border: '1px solid var(--accent)', borderRadius: '8px' }}>
            <p style={{ margin: 0, fontWeight: 700, color: 'var(--ink)' }}>Atenção: Serviço Exclusivo</p>
            <p style={{ margin: 0, fontSize: '0.88rem' }}>O serviço de <strong>Manutenção de Corte</strong> é exclusivo para clientes que realizaram um Corte ou Corte + Tratamento completo conosco nos últimos 90 dias.</p>
            <p style={{ margin: 0, fontSize: '0.88rem' }}>Não identificamos esse histórico em seu cadastro. Por favor, fale diretamente com o Jon pelo WhatsApp para agendar ou tirar dúvidas.</p>
            <a 
              href={`https://wa.me/553135866673?text=Olá%20Jon!%20Gostaria%20de%20solicitar%20uma%20Manutenção%20de%20Corte.%20Meu%20telefone%20é%20${cleanPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-accent"
              style={{ 
                background: '#25d366', 
                color: 'white', 
                fontWeight: 'bold', 
                textDecoration: 'none', 
                textAlign: 'center', 
                padding: '12px', 
                borderRadius: '999px',
                marginTop: '6px',
                border: 'none',
                boxShadow: '0 4px 12px rgba(37,211,102,0.2)'
              }}
            >
              Falar com o Jon no WhatsApp
            </a>
          </div>
        );
        return;
      }
    }

    if (existingProfile && !authSuccess) {
      setAuthError('Você precisa confirmar sua identidade para agendar usando este perfil.');
      setTimeout(() => {
        const authCard = document.querySelector('.client-auth-card');
        if (authCard) {
          authCard.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      return;
    }

    setLoading(true);

    let finalUserId = currentUser?.uid || existingProfile?.userId || '';
    let finalAuthProvider = currentUser 
      ? (currentUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'password') 
      : (existingProfile?.authProvider || '');

    // Se o cliente definiu uma nova senha de cadastro e não está autenticado ainda:
    if (!currentUser && newPassword.length >= 6 && clientData.email) {
      try {
        const isDemo = !auth || isDemoMode;
        if (isDemo) {
          finalUserId = 'demo-pwd-uid-' + Date.now();
          finalAuthProvider = 'password';
        } else {
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, clientData.email, newPassword);
            finalUserId = userCredential.user.uid;
            finalAuthProvider = 'password';
          } catch (createErr) {
            if (createErr.code === 'auth/email-already-in-use') {
              const userCredential = await signInWithEmailAndPassword(auth, clientData.email, newPassword);
              finalUserId = userCredential.user.uid;
              finalAuthProvider = 'password';
            } else {
              throw createErr;
            }
          }
        }
      } catch (authErr) {
        console.warn('Erro ao criar credenciais durante cadastro:', authErr);
        setAuthError(getFriendlyAuthMessage(authErr.code));
        setLoading(false);
        return;
      }
    }

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
      createdAt: new Date().toISOString(),
      userId: finalUserId,
      professionalId: selectedProfessional?.id || 'jon',
      profissional: selectedProfessional?.id || 'jon',
      professionalName: selectedProfessional?.name || 'Jon',
      packageId: selectedPackageTemplate ? selectedPackageTemplate.id : null,
      packageName: selectedPackageTemplate ? selectedPackageTemplate.name : null,
      usingPackageCredit: usingPackageCredit || false,
      usingClientPackageId: usingPackageCredit ? usingClientPackageId : null
    };

    try {
      const cleanPhone = clientData.phone.replace(/\D/g, '');

      // 1. Salvar agendamento
      if (bookingDemoMode || !db) {
        console.log('Agendamento simulado (Demo):', bookingPayload);
        const localBookings = JSON.parse(localStorage.getItem('demo_bookings') || '[]');
        if (rescheduleId) {
          const idx = localBookings.findIndex(b => b.id === rescheduleId);
          if (idx !== -1) {
            localBookings[idx] = { ...localBookings[idx], ...bookingPayload, id: rescheduleId };
          } else {
            bookingPayload.id = rescheduleId;
            localBookings.push(bookingPayload);
          }
        } else {
          bookingPayload.id = 'demo-' + Date.now();
          localBookings.push(bookingPayload);
        }
        localStorage.setItem('demo_bookings', JSON.stringify(localBookings));

        // Auto-cadastro local
        if (cleanPhone) {
          const localClients = JSON.parse(localStorage.getItem('demo_client_profiles') || '[]');
          const exists = localClients.some(c => c.phone === cleanPhone);
          if (!exists) {
            localClients.push({
              name: clientData.name,
              phone: cleanPhone,
              email: clientData.email || 'Não informado',
              curvatura: clientData.hairType || '3A',
              porosidade: 'Média',
              elasticidade: 'Normal',
              quimicas: 'Nenhuma',
              produtosRecomendados: '',
              observacoes: 'Cadastrado automaticamente via agendamento online',
              sexo: 'Feminino',
              birthdate: clientData.birthdate || '',
              createdAt: new Date().toISOString(),
              userId: finalUserId,
              authProvider: finalAuthProvider
            });
            localStorage.setItem('demo_client_profiles', JSON.stringify(localClients));
          }
        }
      } else {
        try {
          if (rescheduleId) {
            const docRef = doc(db, 'bookings', rescheduleId);
            await withTimeout(updateDoc(docRef, bookingPayload), 8000);
            syncBookingToGoogle(rescheduleId).catch(err => console.warn(err));
          } else {
            const docRef = await withTimeout(addDoc(collection(db, 'bookings'), bookingPayload), 8000);
            syncBookingToGoogle(docRef.id).catch(err => console.warn(err));
          }

          // Auto-cadastro no Firestore
          if (cleanPhone) {
            try {
              const clientRef = doc(db, 'client_profiles', cleanPhone);
              const clientSnap = await withTimeout(getDoc(clientRef), 5000);
              if (!clientSnap.exists()) {
                await withTimeout(setDoc(clientRef, {
                  name: clientData.name,
                  phone: cleanPhone,
                  email: clientData.email || 'Não informado',
                  curvatura: clientData.hairType || '3A',
                  porosidade: 'Média',
                  elasticidade: 'Normal',
                  quimicas: 'Nenhuma',
                  produtosRecomendados: '',
                  observacoes: 'Cadastrado automaticamente via agendamento online',
                  sexo: 'Feminino',
                  birthdate: clientData.birthdate || '',
                  createdAt: new Date().toISOString(),
                  userId: finalUserId,
                  authProvider: finalAuthProvider
                }), 5000);
              }
            } catch (profileErr) {
              console.warn('Erro ao auto-cadastrar cliente no Firestore:', profileErr);
            }
          }
        } catch (dbErr) {
          console.warn('Erro/Timeout ao salvar no Firestore. Ativando fallback local:', dbErr);
          setBookingDemoMode(true);
          const localBookings = JSON.parse(localStorage.getItem('demo_bookings') || '[]');
          if (rescheduleId) {
            const idx = localBookings.findIndex(b => b.id === rescheduleId);
            if (idx !== -1) {
              localBookings[idx] = { ...localBookings[idx], ...bookingPayload, id: rescheduleId };
            } else {
              bookingPayload.id = rescheduleId;
              localBookings.push(bookingPayload);
            }
          } else {
            bookingPayload.id = 'demo-' + Date.now();
            localBookings.push(bookingPayload);
          }
          localStorage.setItem('demo_bookings', JSON.stringify(localBookings));

          // Auto-cadastro local fallback
          if (cleanPhone) {
            const localClients = JSON.parse(localStorage.getItem('demo_client_profiles') || '[]');
            const exists = localClients.some(c => c.phone === cleanPhone);
            if (!exists) {
              localClients.push({
                name: clientData.name,
                phone: cleanPhone,
                email: clientData.email || 'Não informado',
                curvatura: clientData.hairType || '3A',
                porosidade: 'Média',
                elasticidade: 'Normal',
                quimicas: 'Nenhuma',
                produtosRecomendados: '',
                observacoes: 'Cadastrado automaticamente via agendamento online (fallback)',
                sexo: 'Feminino',
                birthdate: clientData.birthdate || '',
                createdAt: new Date().toISOString(),
                userId: finalUserId,
                authProvider: finalAuthProvider
              });
              localStorage.setItem('demo_client_profiles', JSON.stringify(localClients));
            }
          }
        }
      }
      
      localStorage.setItem('last_booking', JSON.stringify(bookingPayload));
      if (bookingPayload.clientEmail) {
        triggerEmailNotification(bookingPayload);
      }
      setSuccess(true);
      setStep(4);
    } catch (err) {
      console.error('Erro ao processar agendamento:', err);
      // Ainda simula o sucesso para não travar a cliente
      setIsDemoMode(true);
      const localBookings = JSON.parse(localStorage.getItem('demo_bookings') || '[]');
      if (rescheduleId) {
        const idx = localBookings.findIndex(b => b.id === rescheduleId);
        if (idx !== -1) {
          localBookings[idx] = { ...localBookings[idx], ...bookingPayload, id: rescheduleId };
        } else {
          bookingPayload.id = rescheduleId;
          localBookings.push(bookingPayload);
        }
      } else {
        bookingPayload.id = 'demo-' + Date.now();
        localBookings.push(bookingPayload);
      }
      localStorage.setItem('demo_bookings', JSON.stringify(localBookings));
      
      localStorage.setItem('last_booking', JSON.stringify(bookingPayload));
      if (bookingPayload.clientEmail) {
        triggerEmailNotification(bookingPayload);
      }
      setSuccess(true);
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  const selectedDateObj = dates.find(d => d.raw === selectedDate);

  /*
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
  */


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
        <div className={`step-dot ${step >= 1 ? 'active' : ''}`} onClick={() => { if (step > 1) { setSelectedPackageTemplate(null); setStep(1); } }}>1. Serviço</div>
        <div className={`line ${step >= 2 ? 'active' : ''}`}></div>
        <div className={`step-dot ${step >= 2 ? 'active' : ''}`} onClick={() => step > 2 && setStep(2)}>2. Horário</div>
        <div className={`line ${step >= 3 ? 'active' : ''}`}></div>
        <div className={`step-dot ${step >= 3 ? 'active' : ''}`} onClick={() => { if (step > 3) { checkPackageCredits(clientData.phone, clientData.email, selectedService); setStep(3); } }}>3. Seus Dados</div>
      </div>

      <div className="booking-card-wrap">
        
        {/* PASSO 1: SELEÇÃO DE SERVIÇO */}
        {step === 1 && (() => {
          const categories = ['Cabelo'];
          if (packages && packages.length > 0) {
            categories.push('Combos');
          }
          let filteredServices = services;
            
          filteredServices.sort((a, b) => {
            const posA = a.position !== undefined ? a.position : (a.order !== undefined ? a.order : null);
            const posB = b.position !== undefined ? b.position : (b.order !== undefined ? b.order : null);
            
            if (posA !== null && posB !== null) {
              return posA - posB;
            } else if (posA !== null) {
              return -1;
            } else if (posB !== null) {
              return 1;
            }

            const idxA = SEED_SERVICES.findIndex(s => s.id === a.id || s.name.toLowerCase() === a.name.toLowerCase());
            const idxB = SEED_SERVICES.findIndex(s => s.id === b.id || s.name.toLowerCase() === b.name.toLowerCase());
            const rankA = idxA !== -1 ? idxA : 999;
            const rankB = idxB !== -1 ? idxB : 999;
            return rankA - rankB;
          });

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
                  const count = cat === 'Combos'
                    ? packages.length
                    : services.length;
                  const isCombos = cat === 'Combos';
                  return (
                    <button
                      key={cat}
                      type="button"
                      className={`booking-category-tab-btn ${selectedCategory === cat ? 'active' : ''} ${isCombos ? 'combos-tab-btn' : 'cabelo-tab-btn'}`}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {isCombos ? '🏷️ Combos Promocionais' : '💇 Cabelo'}
                      <span className="booking-tab-count">{count}</span>
                    </button>
                  );
                })}
              </div>

              {/* Grid do Catálogo */}
              {services.length === 0 && packages.length === 0 ? (
                <div className="booking-catalog-loading">
                  <div className="spinner"></div>
                  <p>Buscando nosso menu de serviços...</p>
                </div>
              ) : (
                <div className="booking-services-grid">
                  {selectedCategory === 'Combos' ? (
                    packages.map(pkg => {
                      const isSelected = selectedPackageTemplate?.id === pkg.id;
                      const pkgOriginalTotal = pkg.services ? pkg.services.reduce((sum, item) => {
                        const sObj = services.find(s => s.id === item.serviceId);
                        const price = sObj ? (Number(sObj.price) || 0) : 0;
                        return sum + (price * item.sessions);
                      }, 0) : 0;
                      return (
                        <div 
                          key={pkg.id} 
                          className={`booking-service-card ${isSelected ? 'selected' : ''}`}
                          style={{ borderLeft: '4px solid var(--accent)' }}
                          onClick={() => {
                            const firstSrvId = pkg.services?.[0]?.serviceId;
                            const matchedSrv = services.find(s => s.id === firstSrvId);
                            if (matchedSrv) {
                              setSelectedService(matchedSrv);
                              setSelectedPackageTemplate(pkg);
                              setStep(2);
                            } else {
                              alert('Nenhum serviço válido encontrado no pacote.');
                            }
                          }}
                        >
                          <div className="booking-card-top-decor">
                            <div className="booking-card-emoji-category">
                              <span className="booking-service-emoji">📦</span>
                              <span className="booking-service-category-tag">Pacote</span>
                            </div>
                          </div>
                          <h3 className="booking-service-title">{pkg.name}</h3>
                          <div className="booking-service-price-row" style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-start' }}>
                            {pkgOriginalTotal > pkg.price && (
                              <span style={{ fontSize: '0.85rem', textDecoration: 'line-through', color: 'var(--muted)' }}>
                                De R$ {pkgOriginalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span className="booking-service-price" style={{ color: 'var(--accent)' }}>
                                R$ {Number(pkg.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                              {pkgOriginalTotal > pkg.price && (
                                <span className="booking-service-tag-discount" style={{ background: 'rgba(140,80,39,0.15)', color: 'var(--accent)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                  -{(100 - (pkg.price * 100 / pkgOriginalTotal)).toFixed(0)}% OFF
                                </span>
                              )}
                            </div>
                            {pkgOriginalTotal > pkg.price && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 'bold' }}>
                                Economia de R$ {(pkgOriginalTotal - pkg.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}!
                              </span>
                            )}
                          </div>
                          <p className="booking-service-desc">{pkg.description}</p>
                          <div style={{ marginTop: '12px', borderTop: '1px solid var(--rule)', paddingTop: '8px' }}>
                            <strong style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                              Itens Inclusos:
                            </strong>
                            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.8rem', color: 'var(--ink)' }}>
                              {pkg.services && pkg.services.map((item, idx) => {
                                const srv = services.find(s => s.id === item.serviceId);
                                return (
                                  <li key={idx}>
                                    {item.sessions}x {srv ? srv.name : item.serviceId}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    filteredServices.map(service => {
                      const isExpanded = !!expandedDescriptions[service.id];
                      const hasPromo = !!service.promoPrice;
                      const isFeatured = !!(service.isPrimary || service.featured);
                      const isSelected = selectedService?.id === service.id;
                      const isWaOnly = isWhatsappOnlyService(service);
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

                            {service.includes && service.includes.length > 0 && (isExpanded || !service.description || service.description.length <= 120) && (
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
                    })
                  )}
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
            
            {/* Seletor de Profissionais (se houver mais de um ativo) */}
            {activeProfessionals.length > 1 && (
              <div className="professional-selector-wrap" style={{ marginBottom: 24, padding: '16px', background: 'var(--panel-bg)', borderRadius: 8, border: '1px solid var(--rule)' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem' }}>Escolha o Profissional:</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
                  {activeProfessionals.map(prof => {
                    const isSelected = selectedProfessional?.id === prof.id;
                    return (
                      <div
                        key={prof.id}
                        onClick={() => {
                          setSelectedProfessional(prof);
                          setSelectedTime('');
                        }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          padding: 12,
                          background: isSelected ? 'rgba(200, 133, 42, 0.12)' : 'var(--bg-warm)',
                          border: isSelected ? '2px solid var(--accent)' : '1px solid var(--rule)',
                          borderRadius: 6,
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <img
                          src={prof.avatar || '/jon-perfil.webp'}
                          alt={prof.name}
                          style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover', marginBottom: 8, border: isSelected ? '2px solid var(--accent)' : '1px solid transparent' }}
                        />
                        <strong style={{ fontSize: '0.85rem', color: isSelected ? 'var(--accent)' : 'var(--text)' }}>{prof.name}</strong>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
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
                      window.scrollTo({ top: 0, behavior: 'smooth' });
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
                  (() => {
                    const availableSlots = timeSlots.filter(slot => {
                      const isBooked = bookedTimes.includes(slot);
                      let isPast = false;
                      const now = new Date();
                      const year = now.getFullYear();
                      const month = String(now.getMonth() + 1).padStart(2, '0');
                      const day = String(now.getDate()).padStart(2, '0');
                      const todayStr = `${year}-${month}-${day}`;
                      
                      if (selectedDate === todayStr) {
                        const [slotH, slotM] = slot.split(':').map(Number);
                        const minAdvanceHours = Number(settings?.minAdvance || 2);
                        const limitTime = new Date(now.getTime() + minAdvanceHours * 60 * 60 * 1000);
                        const limitH = limitTime.getHours();
                        const limitM = limitTime.getMinutes();
                        
                        if (slotH < limitH || (slotH === limitH && slotM < limitM)) {
                          isPast = true;
                        }
                      }
                      return !isBooked && !isPast;
                    });

                    if (availableSlots.length === 0) {
                      return (
                        <p style={{ color: 'var(--muted)', fontSize: '0.95rem', margin: '20px 0', textAlign: 'center' }}>
                          Nenhum horário disponível para esta data. Por favor, escolha outro dia.
                        </p>
                      );
                    }

                    return (
                      <div className="time-picker-grid">
                        {availableSlots.map(slot => (
                          <button
                            key={slot}
                            type="button"
                            className={`time-btn ${selectedTime === slot ? 'selected' : ''}`}
                            onClick={() => setSelectedTime(slot)}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    );
                  })()
                )}
              </div>
            )}

            <div className="step-actions">
              <button className="btn btn-ghost" onClick={() => { setSelectedPackageTemplate(null); setStep(1); }}>Voltar</button>
              <button 
                className="btn btn-accent" 
                disabled={!selectedDate || !selectedTime}
                onClick={() => {
                  checkPackageCredits(clientData.phone, clientData.email, selectedService);
                  setStep(3);
                }}
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
            
            {existingProfile && existingProfile.blocked && (
              <div className="client-auth-card" style={{ borderColor: '#e53e3e', background: 'rgba(229, 62, 62, 0.05)', marginBottom: '20px', padding: '20px' }}>
                <div className="client-auth-card-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ color: '#e53e3e', fontSize: '1.4rem' }}>⚠️</span>
                  <h3 className="client-auth-card-title" style={{ color: '#e53e3e', margin: 0 }}>Agendamento Bloqueado</h3>
                </div>
                <p className="client-auth-card-desc" style={{ color: '#c53030', fontSize: '0.9rem', lineHeight: '1.5', margin: '0 0 15px 0' }}>
                  Seu perfil está temporariamente bloqueado para agendamentos online automáticos pelo sistema devido a uma ausência anterior. Para agendar um novo horário, é necessário o pagamento de um sinal de R$ 95,00 (50% do valor do corte) que será integralmente abatido no dia do atendimento.
                </p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <a href="https://wa.me/553135866673?text=Ol%C3%A1%20Jon%2C%20meu%20perfil%20consta%20como%20bloqueado%20e%20gostaria%20de%20solicitar%20um%20novo%20agendamento%20com%20sinal." target="_blank" className="btn btn-accent" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#25D366', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    Agendar pelo WhatsApp
                  </a>
                  <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}>Voltar</button>
                </div>
              </div>
            )}

            {!(existingProfile && existingProfile.blocked) && (
              <>
                {/* Abas de Autenticação Upfront */}
                {!authSuccess && (
              <div className="auth-selection-tabs">
                <button 
                  type="button" 
                  className={`auth-tab-btn ${(!authMode) ? 'active' : ''}`}
                  onClick={() => {
                    setAuthMode(null);
                    setAuthError('');
                    if (loginEmail) {
                      setClientData(prev => ({ ...prev, email: loginEmail }));
                    }
                  }}
                >
                  Criar Novo Cadastro
                </button>
                <button 
                  type="button" 
                  className={`auth-tab-btn ${authMode === 'login' ? 'active' : ''}`}
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError('');
                    if (clientData.email) {
                      setLoginEmail(clientData.email);
                    }
                  }}
                >
                  Entrar com E-mail
                </button>
                <button 
                  type="button" 
                  className="auth-tab-btn"
                  onClick={handleGoogleAuth}
                >
                  <svg width="16" height="16" viewBox="0 0 18 18" style={{ marginRight: '4px' }}>
                    <path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.79 2.7v2.25h2.9c1.69-1.55 2.69-3.85 2.69-6.58z"/>
                    <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.2l-2.9-2.25c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.58-5.05-3.71H.92v2.33C2.4 16.03 5.46 18 9 18z"/>
                    <path fill="#FBBC05" d="M3.95 10.7c-.18-.54-.28-1.12-.28-1.7s.1-1.16.28-1.7V4.97H.92c-.6 1.2-1.07 2.57-1.07 4.03s.47 2.83 1.07 4.03l3.03-2.33z"/>
                    <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35L15 2.2C13.46.77 11.42 0 9 0 5.46 0 2.4 1.97.92 4.97l3.03 2.33c.71-2.13 2.7-3.71 5.05-3.71z"/>
                  </svg>
                  Entrar com Google
                </button>
              </div>
            )}

            {checkingProfile && (
              <div style={{ margin: '10px 0', fontSize: '0.85rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="spinner-small" style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid var(--rule)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'booking-catalog-spin 0.6s linear infinite' }}></span>
                Verificando cadastro...
              </div>
            )}

            {authSuccess && (
              <div className="client-auth-card" style={{ borderColor: '#2f855a' }}>
                <div className="client-auth-card-header">
                  <Unlock size={20} style={{ color: '#2f855a' }} />
                  <h3 className="client-auth-card-title">Perfil Verificado</h3>
                </div>
                <p className="client-auth-card-desc">
                  Seus dados estão vinculados e protegidos. Agende com tranquilidade!
                </p>

                {/* Seção de agendamentos ativos do cliente */}
                {clientBookings && clientBookings.length > 0 && (
                  <div className="client-active-bookings-list" style={{ marginTop: '16px', borderTop: '1px solid rgba(47,133,90,0.2)', paddingTop: '12px' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} style={{ color: 'var(--accent)' }} /> Seus Agendamentos Ativos:
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {clientBookings.map((b) => {
                        let displayDate = b.date;
                        if (displayDate && displayDate.includes('-')) {
                          displayDate = displayDate.split('-').reverse().join('/');
                        }
                        return (
                          <div 
                            key={b.id} 
                            style={{ 
                              padding: '10px', 
                              background: 'var(--bg-warm)', 
                              border: '1px solid var(--rule)', 
                              borderRadius: '8px', 
                              fontSize: '0.8rem', 
                              display: 'flex', 
                              flexDirection: 'column', 
                              gap: '6px' 
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                              <span>{b.serviceName || b.service?.name}</span>
                              <span style={{ color: 'var(--accent)' }}>{b.status}</span>
                            </div>
                            <div style={{ color: 'var(--muted)', display: 'flex', gap: '12px' }}>
                              <span>📅 {displayDate}</span>
                              <span>⏰ {b.time}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                              <a 
                                href={`/agendar?rescheduleId=${b.id}`} 
                                className="btn"
                                style={{ 
                                  fontSize: '0.75rem', 
                                  padding: '4px 10px', 
                                  background: 'var(--accent)', 
                                  color: 'var(--bg)', 
                                  borderRadius: '4px',
                                  textDecoration: 'none',
                                  display: 'inline-block',
                                  fontWeight: 600
                                }}
                              >
                                Alterar Horário
                              </a>
                              <a 
                                href={`/cancelar?id=${b.id}`} 
                                className="btn btn-ghost"
                                style={{ 
                                  fontSize: '0.75rem', 
                                  padding: '4px 10px', 
                                  border: '1px solid #e53e3e', 
                                  color: '#e53e3e', 
                                  borderRadius: '4px',
                                  textDecoration: 'none',
                                  display: 'inline-block',
                                  background: 'transparent',
                                  fontWeight: 600
                                }}
                              >
                                Cancelar
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', flexWrap: 'wrap', gap: '10px', borderTop: '1px dashed rgba(47,133,90,0.15)', paddingTop: '10px' }}>
                  <span className="auth-success-badge">✓ Perfil verificado com sucesso!</span>
                  <button 
                    type="button" 
                    className="btn btn-link" 
                    onClick={handleResetAuth}
                    style={{ fontSize: '0.8rem', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                  >
                    Acessar outra conta
                  </button>
                </div>
              </div>
            )}

            {!authSuccess && authMode && (
              <div className="client-auth-card">
                <div className="client-auth-card-header">
                  <Lock size={20} style={{ color: 'var(--accent)' }} />
                  <h3 className="client-auth-card-title">
                    {authMode === 'login' ? 'Confirmar Identidade' : 'Proteger seu Cadastro'}
                  </h3>
                </div>
                <p className="client-auth-card-desc">
                  {authMode === 'login' 
                    ? (existingProfile 
                        ? 'Identificamos que você já possui um cadastro. Confirme sua senha ou use sua conta do Google para continuar.'
                        : 'Entre com suas credenciais de acesso ou use sua conta do Google.')
                    : 'Identificamos que você tem um histórico conosco, mas seu perfil não tem uma senha de acesso. Defina uma senha ou use o Google para proteger seus dados.'}
                </p>
                
                {authError && <div className="auth-error-msg">{authError}</div>}
                
                <div className="client-auth-actions">
                  <button 
                    type="button" 
                    className="btn-google-auth" 
                    onClick={handleGoogleAuth}
                    disabled={authLoading}
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                      <path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.79 2.7v2.25h2.9c1.69-1.55 2.69-3.85 2.69-6.58z"/>
                      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.2l-2.9-2.25c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.58-5.05-3.71H.92v2.33C2.4 16.03 5.46 18 9 18z"/>
                      <path fill="#FBBC05" d="M3.95 10.7c-.18-.54-.28-1.12-.28-1.7s.1-1.16.28-1.7V4.97H.92c-.6 1.2-1.07 2.57-1.07 4.03s.47 2.83 1.07 4.03l3.03-2.33z"/>
                      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35L15 2.2C13.46.77 11.42 0 9 0 5.46 0 2.4 1.97.92 4.97l3.03 2.33c.71-2.13 2.7-3.71 5.05-3.71z"/>
                    </svg>
                    {authMode === 'login' ? 'Confirmar com Google' : 'Criar Acesso com Google'}
                  </button>
                  
                  <div className="auth-separator">Ou use uma senha</div>
                  
                  <div className="password-auth-form">
                    {!existingProfile ? (
                      <div className="form-group" style={{ marginBottom: '10px' }}>
                        <label htmlFor="login-email" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>E-mail de Acesso</label>
                        <input 
                          type="email" 
                          id="login-email" 
                          placeholder="Ex: maria@exemplo.com" 
                          value={loginEmail}
                          onChange={(e) => { setLoginEmail(e.target.value); setExistingProfile(null); }}
                          onBlur={handleLoginEmailBlur}
                          disabled={authLoading}
                          autoFocus
                        />
                        {checkingProfile && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                            <span style={{ display: 'inline-block', width: 10, height: 10, border: '2px solid var(--rule)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'booking-catalog-spin 0.6s linear infinite' }} />
                            Buscando cadastro...
                          </span>
                        )}
                      </div>
                    ) : (
                      <div style={{ marginBottom: '10px', padding: '8px 12px', background: 'rgba(47,133,90,0.08)', border: '1px solid #2f855a', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '1.2rem' }}>✓</span>
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#2f855a' }}>Cadastro encontrado!</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text)' }}>Olá, <strong>{existingProfile.name?.split(' ')[0]}</strong>! Confirme sua senha para continuar.</div>
                        </div>
                      </div>
                    )}
                    <div className="form-group" style={{ marginBottom: '10px' }}>
                      <label htmlFor="auth-password" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Senha</label>
                      <input 
                        type="password" 
                        id="auth-password" 
                        placeholder="Sua senha" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={authLoading}
                      />
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-accent" 
                      onClick={handleEmailPasswordAuth}
                      disabled={authLoading || !password}
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      {authLoading ? 'Processando...' : (authMode === 'login' ? 'Confirmar Senha' : 'Salvar e Proteger Perfil')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {(authSuccess || !authMode) && (
              <>
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
                      onBlur={(e) => { handleFieldBlur(e); checkPackageCredits(e.target.value, clientData.email, selectedService); }}
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
                      onBlur={(e) => { handleFieldBlur(e); checkPackageCredits(clientData.phone, e.target.value, selectedService); }}
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

              {activePackageCredit && (
                <div style={{ margin: '16px 0', padding: '12px 16px', border: '1px solid var(--accent)', borderRadius: '8px', background: 'rgba(200, 133, 42, 0.05)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>
                    <input 
                      type="checkbox" 
                      checked={usingPackageCredit}
                      onChange={e => setUsingPackageCredit(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }}
                    />
                    <span>Usar crédito do pacote: <strong>{activePackageCredit.packageName}</strong></span>
                  </label>
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted)', marginLeft: 28 }}>
                    Você possui {activePackageCredit.balance[selectedService.id]} sessão(ões) restante(s) deste serviço. O valor cobrado na comanda deste agendamento será R$ 0.
                  </span>
                </div>
              )}

              {selectedPackageTemplate && (
                <div style={{ margin: '16px 0', padding: '12px 16px', border: '1px solid #2f855a', borderRadius: '8px', background: 'rgba(47, 133, 90, 0.05)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#2f855a', fontSize: '0.9rem' }}>
                    <span>📦 Pacote Selecionado:</span>
                    <span>{selectedPackageTemplate.name}</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                    Você está adquirindo o pacote por <strong>R$ {(Number(selectedPackageTemplate.price) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> no momento do primeiro atendimento.
                  </span>
                </div>
              )}

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

                {!authSuccess && !authMode && (
                  <div className="form-group" style={{ marginTop: '20px', borderTop: '1px dashed var(--rule)', paddingTop: '16px' }}>
                    <label htmlFor="register-password" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      Criar uma Senha de Acesso (Opcional)
                    </label>
                    <input 
                      type="password" 
                      id="register-password" 
                      placeholder="Mínimo 6 caracteres se desejar criar acesso" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <span className="hint">Defina uma senha se quiser salvar seus dados para agendamentos futuros.</span>
                  </div>
                )}
              </>
            )}

            <div className="step-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}>Voltar</button>
              {(authSuccess || !authMode) && (
                <button 
                  type="submit" 
                  className="btn btn-accent"
                  disabled={loading}
                >
                  {loading ? 'Finalizando...' : 'Confirmar Agendamento'} <Arrow />
                </button>
              )}
            </div>
          </>
        )}
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
                  {usingPackageCredit ? (
                    'R$ 0,00 (Crédito de Pacote)'
                  ) : selectedPackageTemplate ? (
                    `R$ ${Number(selectedPackageTemplate.price).toFixed(2)} (Compra de Pacote)`
                  ) : (
                    <>
                      {selectedService?.priceType === 'A partir de' ? 'A partir de ' : ''}
                      R$ {(selectedService?.promoPrice ?? selectedService?.price)?.toFixed(2)}
                    </>
                  )}
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

      {/* Floating Summary Bar (UX Upgrade: Hick's Law & Progressive Context) */}
      {step > 1 && step < 4 && (selectedProfessional || selectedService) && (
        <div className="booking-summary-bar">
          <div className="summary-content">
            <span className="summary-item">
              <strong>Profissional:</strong> {selectedProfessional?.name || 'Jon'}
            </span>
            {selectedService && (
              <span className="summary-item">
                <strong>Serviço:</strong> {selectedService.name} (R$ {typeof selectedService.price === 'number' ? selectedService.price.toFixed(2).replace('.', ',') : selectedService.price})
              </span>
            )}
            {selectedDate && (
              <span className="summary-item">
                <strong>Data/Hora:</strong> {selectedDate.split('-').reverse().join('/')} {selectedTime ? `às ${selectedTime}` : ''}
              </span>
            )}
          </div>
        </div>
      )}
    </main>
  );
};

export default BookingPage;
