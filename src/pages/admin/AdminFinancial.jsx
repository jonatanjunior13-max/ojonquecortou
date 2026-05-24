import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { db } from '../../config/firebase';
import { collection, doc, addDoc, updateDoc, setDoc } from 'firebase/firestore';
import { 
  Plus, Trash2, DollarSign, TrendingUp, TrendingDown, CreditCard, 
  Users, Percent, ShieldCheck, Calendar, Download, Filter, 
  FileText, ShoppingBag, Eye, Settings, HelpCircle, ArrowUpRight 
} from 'lucide-react';
import './Admin.css';

// Seed data for historical comparison if database is empty/fresh (matches Figma layout screenshots)
const SEED_HISTORICAL_TRANSACTIONS = [
  // Nov 2025
  { id: 'h1', date: '2025-11-05', time: '10:00', clientName: 'Alice Silva', type: 'entrada', paymentMethod: 'Pix', value: 190, description: 'Corte com o Jon', professionalId: 'jon' },
  { id: 'h2', date: '2025-11-12', time: '14:30', clientName: 'Juliana Mendes', type: 'entrada', paymentMethod: 'Cartão de Crédito', value: 320, description: 'Combo - Corte + Tratamento', professionalId: 'jon' },
  { id: 'h3', date: '2025-11-18', time: '11:00', clientName: 'Mariana Azevedo', type: 'entrada', paymentMethod: 'Cartão de Débito', value: 180, description: 'Purifica & Cresce Detox', professionalId: 'jon' },
  { id: 'h4', date: '2025-11-20', time: '16:00', clientName: 'Aluguel Studio', type: 'saida', paymentMethod: 'Pix', value: 1200, description: 'Aluguel do imóvel comercial' },
  { id: 'h5', date: '2025-11-25', time: '09:00', clientName: 'Carla Lima', type: 'entrada', paymentMethod: 'Pix', value: 699, description: 'Luzes ou Morena Iluminada', professionalId: 'jon' },
  { id: 'h6', date: '2025-11-28', time: '15:00', clientName: 'Fornecedor Cosméticos', type: 'saida', paymentMethod: 'Pix', value: 450, description: 'Compra de shampoos para estoque' },

  // Dez 2025
  { id: 'h7', date: '2025-12-03', time: '11:00', clientName: 'Fernanda Rocha', type: 'entrada', paymentMethod: 'Pix', value: 230, description: 'Combo - Corte + Tratamento', professionalId: 'jon' },
  { id: 'h8', date: '2025-12-08', time: '09:30', clientName: 'Sofia Martins', type: 'entrada', paymentMethod: 'Crédito 2x', value: 370, description: 'Combo Corte + TRP', professionalId: 'jon' },
  { id: 'h9', date: '2025-12-15', time: '14:00', clientName: 'Beatriz Costa', type: 'entrada', paymentMethod: 'Pix', value: 190, description: 'Corte com o Jon', professionalId: 'jon' },
  { id: 'h10', date: '2025-12-20', time: '17:00', clientName: 'Energia Elétrica', type: 'saida', paymentMethod: 'Pix', value: 320, description: 'Conta de luz do Studio' },
  { id: 'h11', date: '2025-12-22', time: '10:00', clientName: 'Paula Oliveira', type: 'entrada', paymentMethod: 'Cartão de Débito', value: 100, description: 'Lavar e Finalizar', professionalId: 'jon' },
  { id: 'h12', date: '2025-12-28', time: '13:00', clientName: 'Renata Lima', type: 'entrada', paymentMethod: 'Pix', value: 499, description: 'Coloração Completa', professionalId: 'jon' },
  { id: 'h13', date: '2025-12-29', time: '18:00', clientName: 'Confraternização Jon', type: 'saida', paymentMethod: 'Dinheiro', value: 500, description: 'Jantar de fim de ano equipe' },

  // Jan 2026
  { id: 'h14', date: '2026-01-05', time: '09:00', clientName: 'Amanda Dias', type: 'entrada', paymentMethod: 'Pix', value: 190, description: 'Corte com o Jon', professionalId: 'jon' },
  { id: 'h15', date: '2026-01-12', time: '14:00', clientName: 'Camila Santos', type: 'entrada', paymentMethod: 'Cartão de Crédito', value: 230, description: 'Combo - Corte + Tratamento', professionalId: 'jon' },
  { id: 'h16', date: '2026-01-19', time: '16:00', clientName: 'Aluguel Studio', type: 'saida', paymentMethod: 'Pix', value: 1200, description: 'Aluguel do imóvel comercial' },
  { id: 'h17', date: '2026-01-22', time: '11:00', clientName: 'Letícia Barbosa', type: 'entrada', paymentMethod: 'Pix', value: 180, description: 'Inside TRP Reconstrução', professionalId: 'jon' },

  // Fev 2026
  { id: 'h18', date: '2026-02-04', time: '10:00', clientName: 'Bruna Melo', type: 'entrada', paymentMethod: 'Pix', value: 190, description: 'Corte com o Jon', professionalId: 'jon' },
  { id: 'h19', date: '2026-02-11', time: '15:00', clientName: 'Rafaela Souza', type: 'entrada', paymentMethod: 'Crédito 3x', value: 230, description: 'Combo - Corte + Tratamento', professionalId: 'jon' },
  { id: 'h20', date: '2026-02-15', time: '12:00', clientName: 'Internet Fibra', type: 'saida', paymentMethod: 'Pix', value: 120, description: 'Mensalidade internet studio' },
  { id: 'h21', date: '2026-02-20', time: '14:30', clientName: 'Vanessa Castro', type: 'entrada', paymentMethod: 'Cartão de Débito', value: 100, description: 'Lavar e Finalizar', professionalId: 'jon' },

  // Mar 2026
  { id: 'h22', date: '2026-03-03', time: '09:00', clientName: 'Gabriela Alves', type: 'entrada', paymentMethod: 'Pix', value: 370, description: 'Combo Corte + TRP', professionalId: 'jon' },
  { id: 'h23', date: '2026-03-10', time: '11:00', clientName: 'Isabela Rocha', type: 'entrada', paymentMethod: 'Cartão de Crédito', value: 190, description: 'Corte com o Jon', professionalId: 'jon' },
  { id: 'h24', date: '2026-03-15', time: '16:00', clientName: 'Aluguel Studio', type: 'saida', paymentMethod: 'Pix', value: 1200, description: 'Aluguel do imóvel comercial' },
  { id: 'h25', date: '2026-03-18', time: '14:00', clientName: 'Tatiana Lima', type: 'entrada', paymentMethod: 'Pix', value: 230, description: 'Combo - Corte + Tratamento', professionalId: 'jon' },
  { id: 'h26', date: '2026-03-22', time: '10:00', clientName: 'Larissa Vieira', type: 'entrada', paymentMethod: 'Pix', value: 499, description: 'Coloração Completa', professionalId: 'jon' },

  // Abr 2026
  { id: 'h27', date: '2026-04-02', time: '11:00', clientName: 'Patrícia Gomes', type: 'entrada', paymentMethod: 'Pix', value: 190, description: 'Corte com o Jon', professionalId: 'jon' },
  { id: 'h28', date: '2026-04-09', time: '15:00', clientName: 'Priscila Costa', type: 'entrada', paymentMethod: 'Cartão de Crédito', value: 230, description: 'Combo - Corte + Tratamento', professionalId: 'jon' },
  { id: 'h29', date: '2026-04-14', time: '10:00', clientName: 'Energia Elétrica', type: 'saida', paymentMethod: 'Pix', value: 340, description: 'Conta de luz do Studio' },
  { id: 'h30', date: '2026-04-18', time: '16:00', clientName: 'Monique Silva', type: 'entrada', paymentMethod: 'Cartão de Débito', value: 180, description: 'Inside TRP Reconstrução', professionalId: 'jon' },
  { id: 'h31', date: '2026-04-22', time: '13:00', clientName: 'Marta Souza', type: 'entrada', paymentMethod: 'Pix', value: 100, description: 'Lavar e Finalizar', professionalId: 'jon' },

  // Mai 2026
  { id: 'h32', date: '2026-05-04', time: '10:00', clientName: 'Bruna Melo', type: 'entrada', paymentMethod: 'Pix', value: 190, description: 'Corte com o Jon', professionalId: 'jon' },
  { id: 'h33', date: '2026-05-11', time: '14:30', clientName: 'Carla Lima', type: 'entrada', paymentMethod: 'Cartão de Crédito', value: 320, description: 'Combo - Corte + Tratamento', professionalId: 'jon' },
  { id: 'h34', date: '2026-05-15', time: '16:00', clientName: 'Aluguel Studio', type: 'saida', paymentMethod: 'Pix', value: 1200, description: 'Aluguel do imóvel comercial' },
  { id: 'h35', date: '2026-05-18', time: '11:00', clientName: 'Paula Oliveira', type: 'entrada', paymentMethod: 'Pix', value: 180, description: 'Purifica & Cresce Detox', professionalId: 'jon' }
];

const SEED_HISTORICAL_BOOKINGS = [
  // Nov 2025
  { id: 'b_h1', date: '2025-11-05', time: '10:00', clientName: 'Alice Silva', clientPhone: '31988887777', clientEmail: 'alice@email.com', serviceName: 'Corte com o Jon', servicePrice: 190, duration: 60, status: 'finalizado', profissional: 'jon', userId: 'usr1' },
  { id: 'b_h2', date: '2025-11-12', time: '14:30', clientName: 'Juliana Mendes', clientPhone: '31977776666', clientEmail: 'juliana@email.com', serviceName: 'Combo - Corte com o Jon + Tratamento personalizado', servicePrice: 320, duration: 60, status: 'finalizado', profissional: 'jon' },
  { id: 'b_h3', date: '2025-11-18', time: '11:00', clientName: 'Mariana Azevedo', clientPhone: '31900001111', clientEmail: 'mariana@email.com', serviceName: 'Detox Estimulante', servicePrice: 180, duration: 60, status: 'finalizado', profissional: 'jon', userId: 'usr2' },
  { id: 'b_h5', date: '2025-11-25', time: '09:00', clientName: 'Carla Lima', clientPhone: '31911112222', clientEmail: 'carla@email.com', serviceName: 'Luzes ou Morena Iluminada', servicePrice: 699, duration: 180, status: 'finalizado', profissional: 'jon' },

  // Dez 2025
  { id: 'b_h7', date: '2025-12-03', time: '11:00', clientName: 'Fernanda Rocha', clientPhone: '31922223333', clientEmail: 'fernanda@email.com', serviceName: 'Combo - Corte com o Jon + Tratamento personalizado', servicePrice: 230, duration: 60, status: 'finalizado', profissional: 'jon', userId: 'usr3' },
  { id: 'b_h8', date: '2025-12-08', time: '09:30', clientName: 'Sofia Martins', clientPhone: '31933334444', clientEmail: 'sofia@email.com', serviceName: 'Combo Corte com o Jon + Terapia de Reposição Proteica', servicePrice: 370, duration: 60, status: 'finalizado', profissional: 'jon' },
  { id: 'b_h9', date: '2025-12-15', time: '14:00', clientName: 'Beatriz Costa', clientPhone: '31944445555', clientEmail: 'beatriz@email.com', serviceName: 'Corte com o Jon', servicePrice: 190, duration: 60, status: 'finalizado', profissional: 'jon', userId: 'usr4' },
  { id: 'b_h11', date: '2025-12-22', time: '10:00', clientName: 'Paula Oliveira', clientPhone: '31955556666', clientEmail: 'paula@email.com', serviceName: 'Lavar e Finalizar', servicePrice: 100, duration: 60, status: 'finalizado', profissional: 'jon' },
  { id: 'b_h12', date: '2025-12-28', time: '13:00', clientName: 'Renata Lima', clientPhone: '31966667777', clientEmail: 'renata@email.com', serviceName: 'Coloração Completa', servicePrice: 499, duration: 120, status: 'finalizado', profissional: 'jon', userId: 'usr5' },

  // Jan 2026
  { id: 'b_h14', date: '2026-01-05', time: '09:00', clientName: 'Amanda Dias', clientPhone: '31977778888', clientEmail: 'amanda@email.com', serviceName: 'Corte com o Jon', servicePrice: 190, duration: 60, status: 'finalizado', profissional: 'jon', userId: 'usr6' },
  { id: 'b_h15', date: '2026-01-12', time: '14:00', clientName: 'Camila Santos', clientPhone: '31988889999', clientEmail: 'camila@email.com', serviceName: 'Combo - Corte com o Jon + Tratamento personalizado', servicePrice: 230, duration: 60, status: 'finalizado', profissional: 'jon' },
  { id: 'b_h17', date: '2026-01-22', time: '11:00', clientName: 'Letícia Barbosa', clientPhone: '31999990000', clientEmail: 'leticia@email.com', serviceName: 'Inside TRP – Reconstrução Premium', servicePrice: 180, duration: 60, status: 'finalizado', profissional: 'jon', userId: 'usr7' },

  // Fev 2026
  { id: 'b_h18', date: '2026-02-04', time: '10:00', clientName: 'Bruna Melo', clientPhone: '31900002222', clientEmail: 'bruna@email.com', serviceName: 'Corte com o Jon', servicePrice: 190, duration: 60, status: 'finalizado', profissional: 'jon', userId: 'usr8' },
  { id: 'b_h19', date: '2026-02-11', time: '15:00', clientName: 'Rafaela Souza', clientPhone: '31911113333', clientEmail: 'rafaela@email.com', serviceName: 'Combo - Corte com o Jon + Tratamento personalizado', servicePrice: 230, duration: 60, status: 'finalizado', profissional: 'jon' },
  { id: 'b_h21', date: '2026-02-20', time: '14:30', clientName: 'Vanessa Castro', clientPhone: '31922224444', clientEmail: 'vanessa@email.com', serviceName: 'Lavar e Finalizar', servicePrice: 100, duration: 60, status: 'finalizado', profissional: 'jon', userId: 'usr9' },

  // Mar 2026
  { id: 'b_h22', date: '2026-03-03', time: '09:00', clientName: 'Gabriela Alves', clientPhone: '31933335555', clientEmail: 'gabriela@email.com', serviceName: 'Combo Corte com o Jon + Terapia de Reposição Proteica', servicePrice: 370, duration: 60, status: 'finalizado', profissional: 'jon', userId: 'usr10' },
  { id: 'b_h23', date: '2026-03-10', time: '11:00', clientName: 'Isabela Rocha', clientPhone: '31944446666', clientEmail: 'isabela@email.com', serviceName: 'Corte com o Jon', servicePrice: 190, duration: 60, status: 'finalizado', profissional: 'jon' },
  { id: 'b_h25', date: '2026-03-18', time: '14:00', clientName: 'Tatiana Lima', clientPhone: '31955557777', clientEmail: 'tatiana@email.com', serviceName: 'Combo - Corte com o Jon + Tratamento personalizado', servicePrice: 230, duration: 60, status: 'finalizado', profissional: 'jon', userId: 'usr11' },
  { id: 'b_h26', date: '2026-03-22', time: '10:00', clientName: 'Larissa Vieira', clientPhone: '31966668888', clientEmail: 'larissa@email.com', serviceName: 'Coloração Completa', servicePrice: 499, duration: 120, status: 'finalizado', profissional: 'jon' },

  // Abr 2026
  { id: 'b_h27', date: '2026-04-02', time: '11:00', clientName: 'Patrícia Gomes', clientPhone: '31977779999', clientEmail: 'patricia@email.com', serviceName: 'Corte com o Jon', servicePrice: 190, duration: 60, status: 'finalizado', profissional: 'jon', userId: 'usr12' },
  { id: 'b_h28', date: '2026-04-09', time: '15:00', clientName: 'Priscila Costa', clientPhone: '31988880000', clientEmail: 'priscila@email.com', serviceName: 'Combo - Corte com o Jon + Tratamento personalizado', servicePrice: 230, duration: 60, status: 'finalizado', profissional: 'jon' },
  { id: 'b_h30', date: '2026-04-18', time: '16:00', clientName: 'Monique Silva', clientPhone: '31999991111', clientEmail: 'monique@email.com', serviceName: 'Inside TRP – Reconstrução Premium', servicePrice: 180, duration: 60, status: 'finalizado', profissional: 'jon', userId: 'usr13' },
  { id: 'b_h31', date: '2026-04-22', time: '13:00', clientName: 'Marta Souza', clientPhone: '31900003333', clientEmail: 'marta@email.com', serviceName: 'Lavar e Finalizar', servicePrice: 100, duration: 60, status: 'finalizado', profissional: 'jon' },

  // Mai 2026
  { id: 'b_h32', date: '2026-05-04', time: '10:00', clientName: 'Bruna Melo', clientPhone: '31911114444', clientEmail: 'bruna@email.com', serviceName: 'Corte com o Jon', servicePrice: 190, duration: 60, status: 'finalizado', profissional: 'jon', userId: 'usr14' },
  { id: 'b_h33', date: '2026-05-11', time: '14:30', clientName: 'Carla Lima', clientPhone: '31922225555', clientEmail: 'carla@email.com', serviceName: 'Combo - Corte com o Jon + Tratamento personalizado', servicePrice: 320, duration: 60, status: 'finalizado', profissional: 'jon' },
  { id: 'b_h35', date: '2026-05-18', time: '11:00', clientName: 'Paula Oliveira', clientPhone: '31933336666', clientEmail: 'paula@email.com', serviceName: 'Detox Estimulante', servicePrice: 180, duration: 60, status: 'finalizado', profissional: 'jon', userId: 'usr15' }
];

const DEFAULT_PROFESSIONALS = [
  { id: 'jon', name: 'Jon', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80', commission: 50, phone: '31995097613', email: 'jon@studio.com', active: true }
];

const AdminFinancial = () => {
  const { globalData, setGlobalData } = useOutletContext();

  const [activeSubTab, setActiveSubTab] = useState('dashboard'); // 'dashboard', 'fluxo', 'comissao', 'taxas'
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showProductSaleModal, setShowProductSaleModal] = useState(false);
  const [showDatePickerDropdown, setShowDatePickerDropdown] = useState(false);
  const [showProfDropdown, setShowProfDropdown] = useState(false);

  // Time Window State (Default to Últimos 6 meses to match screenshots)
  const [dateWindow, setDateWindow] = useState('6meses');
  const [startDate, setStartDate] = useState('2025-11-01');
  const [endDate, setEndDate] = useState('2026-05-24');

  // Professional Filter State
  const [selectedProfFilter, setSelectedProfFilter] = useState(''); // '' means All

  // Form states for manual outflow (despesa)
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    value: '',
    paymentMethod: 'Pix',
    date: new Date().toISOString().split('T')[0]
  });

  // Form states for product sale (Venda de Produto)
  const [productSaleForm, setProductSaleForm] = useState({
    productId: '',
    quantity: 1,
    customPrice: '',
    paymentMethod: 'Pix',
    clientName: 'Venda Avulsa',
    date: new Date().toISOString().split('T')[0],
    applyAnticipation: false
  });

  // Fees Form State
  const [feesForm, setFeesForm] = useState({
    feePix: 0,
    feeDebit: 1.9,
    feeCredit: 3.5,
    feeCredit2x: 4.5,
    feeCredit3x: 5.5,
    feeAnticipation: 2.0
  });

  // Ledger Filter states
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState('todos'); // 'todos', 'servico', 'produto', 'saida'
  const [ledgerMethodFilter, setLedgerMethodFilter] = useState('todos');

  // Get data from global context
  const dbTransactions = useMemo(() => globalData.financial_transactions || [], [globalData.financial_transactions]);
  const dbBookings = useMemo(() => globalData.bookings || [], [globalData.bookings]);
  const products = useMemo(() => globalData.products || [], [globalData.products]);
  const services = useMemo(() => globalData.services || [], [globalData.services]);
  const settings = useMemo(() => globalData.settings || {}, [globalData.settings]);
  const isDemoMode = !db;

  // Professionals list from settings
  const professionals = useMemo(() => {
    if (settings && settings.professionals && settings.professionals.length > 0) {
      return settings.professionals;
    }
    return DEFAULT_PROFESSIONALS;
  }, [settings]);

  // Combine DB data with Seed Data for demonstration of past graphs
  const transactions = useMemo(() => {
    const map = new Map();
    SEED_HISTORICAL_TRANSACTIONS.forEach(t => map.set(t.id, t));
    dbTransactions.forEach(t => map.set(t.id, t));
    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [dbTransactions]);

  const bookings = useMemo(() => {
    const map = new Map();
    SEED_HISTORICAL_BOOKINGS.forEach(b => map.set(b.id, b));
    dbBookings.forEach(b => map.set(b.id, {
      ...b,
      serviceName: b.serviceName || b.service?.name || 'Serviço Personalizado',
      servicePrice: b.servicePrice || b.service?.price || 150
    }));
    return Array.from(map.values());
  }, [dbBookings]);

  // Load fee configuration from settings on component mount
  useEffect(() => {
    if (settings) {
      setFeesForm({
        feePix: settings.feePix ?? 0,
        feeDebit: settings.feeDebit ?? 1.9,
        feeCredit: settings.feeCredit ?? 3.5,
        feeCredit2x: settings.feeCredit2x ?? 4.5,
        feeCredit3x: settings.feeCredit3x ?? 5.5,
        feeAnticipation: settings.feeAnticipation ?? 2.0
      });
    }
  }, [settings]);

  // Handle Date range presets
  const handleDateWindowChange = (windowType) => {
    setDateWindow(windowType);
    const today = new Date('2026-05-24T12:00:00'); // set baseline to matching local time metadata
    const todayStr = '2026-05-24';
    
    if (windowType === 'hoje') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (windowType === 'semana') {
      // Find Monday
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(today.setDate(diff));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      
      setStartDate(monday.toISOString().split('T')[0]);
      setEndDate(sunday.toISOString().split('T')[0]);
    } else if (windowType === 'mes') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(lastDay.toISOString().split('T')[0]);
    } else if (windowType === '30dias') {
      const past = new Date(today);
      past.setDate(today.getDate() - 30);
      
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (windowType === '6meses') {
      setStartDate('2025-11-01');
      setEndDate('2026-05-24');
    }
    
    if (windowType !== 'personalizado') {
      setShowDatePickerDropdown(false);
    }
  };

  // Helper values for calculating net value and credit card fee deduction
  const getNetValue = (val, method) => {
    const fees = {
      feePix: settings.feePix ?? feesForm.feePix,
      feeDebit: settings.feeDebit ?? feesForm.feeDebit,
      feeCredit: settings.feeCredit ?? feesForm.feeCredit,
      feeCredit2x: settings.feeCredit2x ?? feesForm.feeCredit2x,
      feeCredit3x: settings.feeCredit3x ?? feesForm.feeCredit3x,
      feeAnticipation: settings.feeAnticipation ?? feesForm.feeAnticipation
    };

    let rate = 0;
    if (method === 'Pix') rate = fees.feePix;
    else if (method === 'Cartão de Débito' || method === 'Débito') rate = fees.feeDebit;
    else if (method === 'Cartão de Crédito' || method === 'Crédito' || method === 'Crédito 1x') rate = fees.feeCredit;
    else if (method === 'Crédito 2x') rate = fees.feeCredit2x;
    else if (method === 'Crédito 3x') rate = fees.feeCredit3x;
    
    const hasAnticipation = method?.toLowerCase().includes('antecip') || method?.toLowerCase().includes('adiant');
    if (hasAnticipation) {
      rate += fees.feeAnticipation;
    }

    return val * (1 - rate / 100);
  };

  const getTransactionFee = (val, method) => {
    return val - getNetValue(val, method);
  };

  // Service category mapper
  const getServiceCategory = (serviceName) => {
    const s = services.find(srv => srv.name === serviceName);
    if (s && s.category) return s.category;
    
    const name = (serviceName || '').toLowerCase();
    if (name.includes('corte')) return 'Corte';
    if (name.includes('coloração') || name.includes('ilumina') || name.includes('luzes') || name.includes('raiz')) return 'Coloração';
    if (name.includes('combo') || name.includes('pacote')) return 'Combo';
    if (name.includes('tratamento') || name.includes('detox') || name.includes('trp') || name.includes('reconstru')) return 'Tratamento';
    if (name.includes('finaliz') || name.includes('lavar')) return 'Finalização';
    return 'Outros';
  };

  // Filtered lists in the active time window and professional
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const inDate = t.date >= startDate && t.date <= endDate;
      const matchesProf = !selectedProfFilter || t.professionalId === selectedProfFilter;
      return inDate && matchesProf;
    });
  }, [transactions, startDate, endDate, selectedProfFilter]);

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const inDate = b.date >= startDate && b.date <= endDate;
      const matchesProf = !selectedProfFilter || b.profissional === selectedProfFilter;
      return inDate && matchesProf;
    });
  }, [bookings, startDate, endDate, selectedProfFilter]);

  // Main KPI Calculations
  const grossReceita = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'entrada')
      .reduce((sum, t) => sum + t.value, 0);
  }, [filteredTransactions]);

  const netReceita = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'entrada')
      .reduce((sum, t) => sum + getNetValue(t.value, t.paymentMethod), 0);
  }, [filteredTransactions]);

  const totalDespesa = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'saida')
      .reduce((sum, t) => sum + t.value, 0);
  }, [filteredTransactions]);

  const netResultado = netReceita - totalDespesa;

  const totalBookingsCount = useMemo(() => {
    return filteredBookings.filter(b => b.status !== 'bloqueado' && b.status !== 'cancelado').length;
  }, [filteredBookings]);

  const onlineBookingsCount = useMemo(() => {
    return filteredBookings.filter(b => b.status !== 'bloqueado' && b.status !== 'cancelado' && b.userId).length;
  }, [filteredBookings]);

  const completedBookingsCount = useMemo(() => {
    return filteredBookings.filter(b => b.status === 'finalizado').length;
  }, [filteredBookings]);

  // Calculate average ticket
  const ticketMedio = useMemo(() => {
    if (completedBookingsCount === 0) return 0;
    
    // Sum prices of completed bookings in period
    const serviceSum = filteredBookings
      .filter(b => b.status === 'finalizado')
      .reduce((sum, b) => sum + (b.servicePrice || 150), 0);
      
    return serviceSum / completedBookingsCount;
  }, [filteredBookings, completedBookingsCount]);

  // Breakdown of payment methods (entradas)
  const paymentMethodStats = useMemo(() => {
    const stats = { 'Pix': 0, 'Cartão de Crédito': 0, 'Cartão de Débito': 0, 'Crédito 2x': 0, 'Crédito 3x': 0, 'Dinheiro': 0 };
    filteredTransactions.filter(t => t.type === 'entrada').forEach(t => {
      const method = t.paymentMethod || 'Dinheiro';
      if (stats[method] !== undefined) {
        stats[method] += t.value;
      } else {
        // Fallback checks
        if (method.includes('Crédito') || method.includes('Credito')) {
          if (method.includes('2x')) stats['Crédito 2x'] += t.value;
          else if (method.includes('3x')) stats['Crédito 3x'] += t.value;
          else stats['Cartão de Crédito'] += t.value;
        } else if (method.includes('Débito') || method.includes('Debito')) {
          stats['Cartão de Débito'] += t.value;
        } else {
          stats['Dinheiro'] += t.value;
        }
      }
    });
    return stats;
  }, [filteredTransactions]);

  // Monthly grouping for charts
  const monthlyData = useMemo(() => {
    // Determine unique months in range
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    const months = [];
    let curr = new Date(start.getFullYear(), start.getMonth(), 1);
    const endLimit = new Date(end.getFullYear(), end.getMonth(), 1);
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    while (curr <= endLimit) {
      const y = curr.getFullYear();
      const m = curr.getMonth();
      const key = `${y}-${String(m + 1).padStart(2, '0')}`;
      const label = `${monthNames[m]}/${String(y).slice(-2)}`;
      months.push({ key, label });
      curr.setMonth(curr.getMonth() + 1);
    }

    // Accumulate metrics for each month
    return months.map(m => {
      const mTransactions = filteredTransactions.filter(t => t.date.startsWith(m.key));
      const mBookings = filteredBookings.filter(b => b.date.startsWith(m.key));

      const receita = mTransactions
        .filter(t => t.type === 'entrada')
        .reduce((sum, t) => sum + t.value, 0);

      const netReceita = mTransactions
        .filter(t => t.type === 'entrada')
        .reduce((sum, t) => sum + getNetValue(t.value, t.paymentMethod), 0);

      const despesa = mTransactions
        .filter(t => t.type === 'saida')
        .reduce((sum, t) => sum + t.value, 0);

      const resultado = netReceita - despesa;

      const atendimentos = mBookings.filter(b => b.status === 'finalizado').length;

      const totalServiceVal = mBookings
        .filter(b => b.status === 'finalizado')
        .reduce((sum, b) => sum + (b.servicePrice || 150), 0);

      const tMedio = atendimentos > 0 ? totalServiceVal / atendimentos : 0;

      // Group appointments by category for line chart
      const catCounts = { 'Corte': 0, 'Coloração': 0, 'Combo': 0, 'Tratamento': 0, 'Finalização': 0 };
      mBookings.filter(b => b.status === 'finalizado').forEach(b => {
        const cat = getServiceCategory(b.serviceName);
        if (catCounts[cat] !== undefined) {
          catCounts[cat]++;
        }
      });

      return {
        ...m,
        receita,
        despesa,
        resultado,
        atendimentos,
        ticketMedio: tMedio,
        catCounts
      };
    });
  }, [filteredTransactions, filteredBookings, startDate, endDate]);

  // Categories representation
  const categoryStats = useMemo(() => {
    const stats = {
      'Corte': { count: 0, revenue: 0 },
      'Coloração': { count: 0, revenue: 0 },
      'Combo': { count: 0, revenue: 0 },
      'Tratamento': { count: 0, revenue: 0 },
      'Finalização': { count: 0, revenue: 0 },
      'Outros': { count: 0, revenue: 0 }
    };

    filteredBookings.filter(b => b.status === 'finalizado').forEach(b => {
      const cat = getServiceCategory(b.serviceName);
      if (stats[cat]) {
        stats[cat].count++;
        stats[cat].revenue += b.servicePrice || 150;
      } else {
        stats['Outros'].count++;
        stats['Outros'].revenue += b.servicePrice || 150;
      }
    });

    return Object.keys(stats).map(name => ({
      name,
      count: stats[name].count,
      revenue: stats[name].revenue
    })).sort((a, b) => b.revenue - a.revenue);
  }, [filteredBookings]);

  // Save new fee settings to database & local
  const handleSaveFees = async (e) => {
    e.preventDefault();
    const updatedSettings = {
      ...settings,
      feePix: Number(feesForm.feePix),
      feeDebit: Number(feesForm.feeDebit),
      feeCredit: Number(feesForm.feeCredit),
      feeCredit2x: Number(feesForm.feeCredit2x),
      feeCredit3x: Number(feesForm.feeCredit3x),
      feeAnticipation: Number(feesForm.feeAnticipation)
    };

    try {
      if (isDemoMode) {
        localStorage.setItem('demo_studio_settings', JSON.stringify(updatedSettings));
      } else {
        await setDoc(doc(db, 'settings', 'studio'), updatedSettings);
      }
      setGlobalData(prev => ({ ...prev, settings: updatedSettings }));
      // Notify other components
      window.dispatchEvent(new Event('settingsUpdated'));
      alert('Taxas atualizadas com sucesso no painel financeiro!');
    } catch (err) {
      console.error('Erro ao salvar taxas:', err);
      alert('Erro ao salvar as taxas de maquininha.');
    }
  };

  // Add Expense manual entry
  const handleAddExpense = async (e) => {
    e.preventDefault();
    const payload = {
      date: expenseForm.date,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      clientName: 'Despesa Avulsa',
      type: 'saida',
      paymentMethod: expenseForm.paymentMethod,
      value: Number(expenseForm.value),
      description: expenseForm.description,
      createdAt: new Date().toISOString()
    };

    try {
      if (isDemoMode) {
        const local = JSON.parse(localStorage.getItem('demo_financial') || '[]');
        const updated = [{ id: 'tx_' + Date.now(), ...payload }, ...local];
        localStorage.setItem('demo_financial', JSON.stringify(updated));
        setGlobalData(prev => ({ ...prev, financial_transactions: updated }));
      } else {
        await addDoc(collection(db, 'financial_transactions'), payload);
      }
      setShowExpenseModal(false);
      setExpenseForm({
        description: '',
        value: '',
        paymentMethod: 'Pix',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      console.error('Erro ao registrar despesa:', err);
      alert('Erro ao registrar despesa.');
    }
  };

  // Add Direct Product Sale (Deducts stock + adds cash inflow)
  const handleAddProductSale = async (e) => {
    e.preventDefault();
    const selectedProd = products.find(p => p.id === productSaleForm.productId);
    if (!selectedProd) {
      alert('Selecione um produto.');
      return;
    }

    const price = productSaleForm.customPrice !== '' ? Number(productSaleForm.customPrice) : selectedProd.sellingPrice;
    const total = price * productSaleForm.quantity;
    const methodLabel = productSaleForm.applyAnticipation 
      ? `${productSaleForm.paymentMethod} (Antecipado)` 
      : productSaleForm.paymentMethod;

    const payload = {
      date: productSaleForm.date,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      clientName: productSaleForm.clientName || 'Venda Avulsa',
      type: 'entrada',
      category: 'venda_produto',
      isProductSale: true,
      paymentMethod: methodLabel,
      value: total,
      description: `Venda de ${productSaleForm.quantity}x ${selectedProd.name}`,
      createdAt: new Date().toISOString()
    };

    try {
      if (isDemoMode) {
        // 1. Save transaction
        const localTx = JSON.parse(localStorage.getItem('demo_financial') || '[]');
        const updatedTx = [{ id: 'tx_' + Date.now(), ...payload }, ...localTx];
        localStorage.setItem('demo_financial', JSON.stringify(updatedTx));

        // 2. Decrement inventory quantity
        const localProds = JSON.parse(localStorage.getItem('demo_products') || '[]');
        const updatedProds = localProds.map(p => 
          p.id === selectedProd.id ? { ...p, quantity: Math.max(0, p.quantity - productSaleForm.quantity) } : p
        );
        localStorage.setItem('demo_products', JSON.stringify(updatedProds));

        setGlobalData(prev => ({
          ...prev,
          financial_transactions: updatedTx,
          products: updatedProds
        }));
      } else {
        // Firestore write
        await addDoc(collection(db, 'financial_transactions'), payload);
        const prodRef = doc(db, 'products', selectedProd.id);
        await updateDoc(prodRef, {
          quantity: Math.max(0, selectedProd.quantity - productSaleForm.quantity)
        });
      }

      setShowProductSaleModal(false);
      setProductSaleForm({
        productId: '',
        quantity: 1,
        customPrice: '',
        paymentMethod: 'Pix',
        clientName: 'Venda Avulsa',
        date: new Date().toISOString().split('T')[0],
        applyAnticipation: false
      });
      alert('Venda de produto registrada com sucesso e estoque deduzido!');
    } catch (err) {
      console.error('Erro ao registrar venda de produto:', err);
      alert('Erro ao processar venda.');
    }
  };

  // CSV Export utility
  const handleExportCSV = () => {
    const headers = ['Data', 'Descricao', 'Cliente', 'Tipo', 'Metodo Pagamento', 'Valor Bruto (R$)', 'Valor Liquido (R$)', 'Taxa Retida (R$)'];
    const rows = filteredTransactions.map(t => {
      const isEntrada = t.type === 'entrada';
      const netVal = isEntrada ? getNetValue(t.value, t.paymentMethod) : t.value;
      const fee = isEntrada ? getTransactionFee(t.value, t.paymentMethod) : 0;
      return [
        t.date.split('-').reverse().join('/'),
        t.description,
        t.clientName || 'N/A',
        t.type === 'entrada' ? 'Entrada' : 'Saida/Despesa',
        t.paymentMethod,
        t.value.toFixed(2),
        netVal.toFixed(2),
        fee.toFixed(2)
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_financeiro_${startDate}_a_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Commission table mapping calculator
  const calculateProfessionalCommission = (profId, commissionPct) => {
    return filteredTransactions
      .filter(t => t.type === 'entrada' && (t.professionalId === profId))
      .reduce((sum, t) => sum + (getNetValue(t.value, t.paymentMethod) * (commissionPct / 100)), 0);
  };

  // Filter Ledger Entries
  const filteredLedger = useMemo(() => {
    return filteredTransactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(ledgerSearch.toLowerCase()) || 
        (t.clientName || '').toLowerCase().includes(ledgerSearch.toLowerCase());
      
      const matchesMethod = ledgerMethodFilter === 'todos' || t.paymentMethod === ledgerMethodFilter;

      let matchesType = true;
      if (ledgerTypeFilter === 'servico') {
        matchesType = t.type === 'entrada' && !t.isProductSale;
      } else if (ledgerTypeFilter === 'produto') {
        matchesType = t.isProductSale || t.category === 'venda_produto';
      } else if (ledgerTypeFilter === 'saida') {
        matchesType = t.type === 'saida';
      }

      return matchesSearch && matchesMethod && matchesType;
    });
  }, [filteredTransactions, ledgerSearch, ledgerTypeFilter, ledgerMethodFilter]);

  // CSS and Color Palettes (Harmonious Peach/Orange Coral palette matching screenshot)
  const activeColor = 'rgb(249, 115, 22)'; // Coral orange
  const redColor = '#f28b82'; // Soft red
  const greenColor = '#8cb870'; // Soft green

  return (
    <div className="admin-financial-page">
      <style>{`
        .financial-pill-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          flex-wrap: wrap;
          align-items: center;
        }
        .orange-pill {
          background: #f97316;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 9999px;
          font-weight: 600;
          font-size: 0.88rem;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: background 0.2s;
          box-shadow: 0 4px 6px -1px rgba(249, 115, 22, 0.2);
        }
        .orange-pill:hover {
          background: #ea580c;
        }
        .date-picker-dropdown {
          position: absolute;
          background: #ffffff;
          border: 1px solid var(--rule);
          border-radius: 8px;
          padding: 16px;
          width: 320px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          z-index: 100;
          margin-top: 8px;
        }
        .picker-presets {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 12px;
        }
        .picker-presets button {
          padding: 6px;
          font-size: 0.8rem;
          border-radius: 4px;
          border: 1px solid var(--rule);
          background: var(--bg-warm);
          cursor: pointer;
        }
        .picker-presets button.active {
          background: #f97316;
          color: white;
          border-color: #f97316;
        }
        .chart-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-top: 24px;
        }
        @media(max-width: 1024px) {
          .chart-grid {
            grid-template-columns: 1fr;
          }
        }
        .chart-card {
          background: #ffffff;
          border: 1px solid var(--rule);
          border-radius: 12px;
          padding: 20px;
          box-shadow: var(--shadow-sm);
        }
        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .chart-header h4 {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--ink);
        }
        .chart-legend {
          display: flex;
          gap: 12px;
          font-size: 0.75rem;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .legend-color {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .financial-split-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
        }
        @media(max-width: 900px) {
          .financial-split-grid {
            grid-template-columns: 1fr;
          }
        }
        .ledger-filters {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .ledger-filters input, .ledger-filters select {
          padding: 8px 12px;
          font-size: 0.85rem;
          border-radius: 6px;
          border: 1px solid var(--rule);
          outline: none;
        }
      `}</style>

      {/* Top Selector pills and Action Buttons */}
      <div className="calendar-controls" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div className="financial-pill-bar" style={{ position: 'relative' }}>
          {/* Date range pill */}
          <div>
            <button className="orange-pill" onClick={() => setShowDatePickerDropdown(!showDatePickerDropdown)}>
              <Calendar size={15} />
              {startDate.split('-').reverse().join('/')} - {endDate.split('-').reverse().join('/')}
            </button>
            
            {showDatePickerDropdown && (
              <div className="date-picker-dropdown">
                <h5 style={{ margin: '0 0 12px 0', fontSize: '0.85rem' }}>Período de Análise</h5>
                <div className="picker-presets">
                  <button className={dateWindow === 'hoje' ? 'active' : ''} onClick={() => handleDateWindowChange('hoje')}>Hoje</button>
                  <button className={dateWindow === 'semana' ? 'active' : ''} onClick={() => handleDateWindowChange('semana')}>Esta Semana</button>
                  <button className={dateWindow === 'mes' ? 'active' : ''} onClick={() => handleDateWindowChange('mes')}>Este Mês</button>
                  <button className={dateWindow === '30dias' ? 'active' : ''} onClick={() => handleDateWindowChange('30dias')}>Últimos 30 dias</button>
                  <button className={dateWindow === '6meses' ? 'active' : ''} onClick={() => handleDateWindowChange('6meses')}>Últimos 6 meses</button>
                  <button className={dateWindow === 'personalizado' ? 'active' : ''} onClick={() => handleDateWindowChange('personalizado')}>Personalizado</button>
                </div>
                {dateWindow === 'personalizado' && (
                  <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '0.75rem' }}>Data Inicial</label>
                      <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.75rem' }}>Data Final</label>
                      <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                  <button className="btn btn-accent" style={{ padding: '4px 12px', fontSize: '0.8rem' }} onClick={() => setShowDatePickerDropdown(false)}>Fechar</button>
                </div>
              </div>
            )}
          </div>

          {/* Professional filter pill */}
          <div style={{ position: 'relative' }}>
            <button className="orange-pill" onClick={() => setShowProfDropdown(!showProfDropdown)}>
              <Users size={15} />
              {selectedProfFilter ? professionals.find(p => p.id === selectedProfFilter)?.name : 'Todos os Profissionais'}
            </button>
            {showProfDropdown && (
              <div className="date-picker-dropdown" style={{ width: 220 }}>
                <h5 style={{ margin: '0 0 8px 0', fontSize: '0.85rem' }}>Filtrar Profissional</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button 
                    className="btn btn-ghost" 
                    style={{ textAlign: 'left', fontSize: '0.82rem', padding: '6px 12px', background: !selectedProfFilter ? 'var(--bg-warm)' : 'none' }}
                    onClick={() => { setSelectedProfFilter(''); setShowProfDropdown(false); }}
                  >
                    Todos os Profissionais
                  </button>
                  {professionals.map(p => (
                    <button 
                      key={p.id}
                      className="btn btn-ghost" 
                      style={{ textAlign: 'left', fontSize: '0.82rem', padding: '6px 12px', background: selectedProfFilter === p.id ? 'var(--bg-warm)' : 'none' }}
                      onClick={() => { setSelectedProfFilter(p.id); setShowProfDropdown(false); }}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick action buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-accent" style={{ background: '#48bb78', borderColor: '#48bb78' }} onClick={() => setShowProductSaleModal(true)}>
            <ShoppingBag size={16} style={{ marginRight: 6 }} /> Registrar Venda de Produto
          </button>
          <button className="btn btn-ghost" style={{ color: '#e53e3e', borderColor: '#e53e3e' }} onClick={() => setShowExpenseModal(true)}>
            <Plus size={16} style={{ marginRight: 6 }} /> Registrar Saída/Despesa
          </button>
        </div>
      </div>

      {/* Primary KPI cards */}
      <section className="admin-stats-grid">
        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid var(--rule)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600 }}>Resultado</h3>
            <HelpCircle size={14} style={{ color: 'var(--muted)' }} />
          </div>
          <div className="value" style={{ color: netResultado >= 0 ? activeColor : redColor, fontSize: '1.6rem', marginTop: 8, fontWeight: 700 }}>
            R$ {netResultado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid var(--rule)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600 }}>Receita</h3>
            <HelpCircle size={14} style={{ color: 'var(--muted)' }} />
          </div>
          <div className="value" style={{ color: 'var(--ink)', fontSize: '1.6rem', marginTop: 8, fontWeight: 700 }}>
            R$ {grossReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid var(--rule)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600 }}>Despesa</h3>
            <HelpCircle size={14} style={{ color: 'var(--muted)' }} />
          </div>
          <div className="value" style={{ color: 'var(--ink)', fontSize: '1.6rem', marginTop: 8, fontWeight: 700 }}>
            R$ {totalDespesa.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid var(--rule)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600 }}>Agendamentos</h3>
            <HelpCircle size={14} style={{ color: 'var(--muted)' }} />
          </div>
          <div className="value" style={{ color: 'var(--ink)', fontSize: '1.6rem', marginTop: 8, fontWeight: 700 }}>
            {totalBookingsCount}
          </div>
        </div>

        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid var(--rule)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600 }}>Agendamentos Online</h3>
            <HelpCircle size={14} style={{ color: 'var(--muted)' }} />
          </div>
          <div className="value" style={{ color: 'var(--ink)', fontSize: '1.6rem', marginTop: 8, fontWeight: 700 }}>
            {onlineBookingsCount}
          </div>
        </div>

        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid var(--rule)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600 }}>Atendimentos</h3>
            <HelpCircle size={14} style={{ color: 'var(--muted)' }} />
          </div>
          <div className="value" style={{ color: 'var(--ink)', fontSize: '1.6rem', marginTop: 8, fontWeight: 700 }}>
            {completedBookingsCount}
          </div>
        </div>
      </section>

      {/* Sub tabs Menu */}
      <div className="tab-menu" style={{ margin: '24px 0 16px 0' }}>
        <button className={`tab-btn ${activeSubTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveSubTab('dashboard')}>
          <TrendingUp size={16} /> Painel de Gráficos
        </button>
        <button className={`tab-btn ${activeSubTab === 'fluxo' ? 'active' : ''}`} onClick={() => setActiveSubTab('fluxo')}>
          <DollarSign size={16} /> Extrato de Caixa
        </button>
        <button className={`tab-btn ${activeSubTab === 'comissao' ? 'active' : ''}`} onClick={() => setActiveSubTab('comissao')}>
          <Users size={16} /> Comissões & Repasses
        </button>
        <button className={`tab-btn ${activeSubTab === 'taxas' ? 'active' : ''}`} onClick={() => setActiveSubTab('taxas')}>
          <Percent size={16} /> Configurar Taxas
        </button>
      </div>

      {/* SUBTAB: DASHBOARD DE GRÁFICOS */}
      {activeSubTab === 'dashboard' && (
        <>
          {/* Dashboard Main Area Curve Chart - Resultado */}
          <div className="chart-card" style={{ marginBottom: 24 }}>
            <div className="chart-header">
              <h4>Resultado Mensal (Saldo Líquido)</h4>
              <span style={{ fontSize: '0.75rem', color: activeColor, fontWeight: 'bold' }}>Giro Total Período</span>
            </div>
            
            {/* Custom SVG Line Area Chart for Resultado */}
            <div style={{ width: '100%', height: '300px', overflowX: 'auto' }}>
              <svg width="100%" height="280" viewBox="0 0 1000 280" preserveAspectRatio="none" style={{ minWidth: '600px' }}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={activeColor} stopOpacity="0.4" />
                    <stop offset="100%" stopColor={activeColor} stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                {[0, 1, 2, 3, 4].map(idx => (
                  <line 
                    key={idx} 
                    x1="60" 
                    y1={30 + idx * 45} 
                    x2="950" 
                    y2={30 + idx * 45} 
                    stroke="var(--rule)" 
                    strokeDasharray="4 4" 
                  />
                ))}

                {/* Draw SVG Curve and Area */}
                {monthlyData.length > 0 && (() => {
                  const paddingX = 70;
                  const paddingY = 40;
                  const chartW = 880;
                  const chartH = 180;
                  const interval = monthlyData.length > 1 ? chartW / (monthlyData.length - 1) : chartW;

                  // Find max & min values for scale
                  const vals = monthlyData.map(d => d.resultado);
                  const maxVal = Math.max(Math.max(...vals, 1000), 5000);
                  const minVal = Math.min(Math.min(...vals, 0), -1000);
                  const range = maxVal - minVal;

                  const points = monthlyData.map((d, index) => {
                    const x = paddingX + index * interval;
                    // Inverted Y: 0 is top, height is bottom
                    const y = paddingY + chartH - ((d.resultado - minVal) / range) * chartH;
                    return { x, y, val: d.resultado, label: d.label };
                  });

                  const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                  // Close path at the zero-value line or bottom of graph
                  const zeroY = paddingY + chartH - ((0 - minVal) / range) * chartH;
                  const areaPath = `${linePath} L ${points[points.length - 1].x} ${zeroY} L ${points[0].x} ${zeroY} Z`;

                  return (
                    <>
                      {/* Gradient fill */}
                      <path d={areaPath} fill="url(#areaGradient)" />
                      {/* Base line */}
                      <path d={linePath} fill="none" stroke={activeColor} strokeWidth="3" />
                      {/* Zero horizontal line */}
                      <line x1="60" y1={zeroY} x2="950" y2={zeroY} stroke="#e53e3e" strokeWidth="1" strokeDasharray="2 2" />

                      {/* Dots and Labels */}
                      {points.map((p, idx) => (
                        <g key={idx}>
                          <circle cx={p.x} cy={p.y} r="5" fill="#ffffff" stroke={activeColor} strokeWidth="3" />
                          {/* Value label */}
                          <text 
                            x={p.x} 
                            y={p.y - 12} 
                            textAnchor="middle" 
                            fontSize="10" 
                            fill="var(--ink)" 
                            fontWeight="600"
                          >
                            R$ {p.val.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                          </text>
                          {/* X-axis Label */}
                          <text 
                            x={p.x} 
                            y="250" 
                            textAnchor="middle" 
                            fontSize="11" 
                            fill="var(--muted)"
                          >
                            {p.label}
                          </text>
                        </g>
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>
          </div>

          <div className="chart-grid">
            {/* Chart 2: Receita e Despesa */}
            <div className="chart-card">
              <div className="chart-header">
                <h4>Receita e Despesa</h4>
                <div className="chart-legend">
                  <div className="legend-item"><span className="legend-color" style={{ background: greenColor }}></span>Receita</div>
                  <div className="legend-item"><span className="legend-color" style={{ background: redColor }}></span>Despesa</div>
                </div>
              </div>

              {/* SVG Side by side Bar Chart */}
              <div style={{ width: '100%', height: '240px' }}>
                <svg width="100%" height="240" viewBox="0 0 500 240" preserveAspectRatio="none">
                  {monthlyData.length > 0 && (() => {
                    const maxVal = Math.max(...monthlyData.map(d => Math.max(d.receita, d.despesa, 500)));
                    const chartH = 160;
                    const paddingY = 30;
                    const chartW = 420;
                    const colW = chartW / monthlyData.length;
                    const barW = Math.min(16, colW / 3);

                    return monthlyData.map((d, index) => {
                      const xCenter = 50 + index * colW + colW / 2;
                      const xBar1 = xCenter - barW - 2;
                      const xBar2 = xCenter + 2;

                      const h1 = (d.receita / maxVal) * chartH;
                      const h2 = (d.despesa / maxVal) * chartH;

                      const y1 = paddingY + chartH - h1;
                      const y2 = paddingY + chartH - h2;

                      return (
                        <g key={d.key}>
                          {/* Receita bar */}
                          <rect x={xBar1} y={y1} width={barW} height={h1} rx="3" fill={greenColor} />
                          {/* Despesa bar */}
                          <rect x={xBar2} y={y2} width={barW} height={h2} rx="3" fill={redColor} />
                          
                          {/* X label */}
                          <text x={xCenter} y="215" textAnchor="middle" fontSize="10" fill="var(--muted)">{d.label}</text>
                        </g>
                      );
                    });
                  })()}
                </svg>
              </div>
            </div>

            {/* Chart 3: Quantidade de Atendimentos */}
            <div className="chart-card">
              <div className="chart-header">
                <h4>Quantidade de Atendimentos</h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Concluídos</span>
              </div>

              {/* SVG Single Bar Chart */}
              <div style={{ width: '100%', height: '240px' }}>
                <svg width="100%" height="240" viewBox="0 0 500 240" preserveAspectRatio="none">
                  {monthlyData.length > 0 && (() => {
                    const maxVal = Math.max(...monthlyData.map(d => d.atendimentos), 5);
                    const chartH = 160;
                    const paddingY = 30;
                    const chartW = 420;
                    const colW = chartW / monthlyData.length;
                    const barW = Math.min(30, colW * 0.6);

                    return monthlyData.map((d, index) => {
                      const xCenter = 50 + index * colW + colW / 2;
                      const xBar = xCenter - barW / 2;
                      const h = (d.atendimentos / maxVal) * chartH;
                      const y = paddingY + chartH - h;

                      return (
                        <g key={d.key}>
                          <rect x={xBar} y={y} width={barW} height={h} rx="4" fill="#f2a477" />
                          <text x={xCenter} y={y - 6} textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--ink)">{d.atendimentos}</text>
                          <text x={xCenter} y="215" textAnchor="middle" fontSize="10" fill="var(--muted)">{d.label}</text>
                        </g>
                      );
                    });
                  })()}
                </svg>
              </div>
            </div>

            {/* Chart 4: Ticket Médio */}
            <div className="chart-card">
              <div className="chart-header">
                <h4>Ticket Médio</h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Faturamento / Atendimentos</span>
              </div>

              {/* SVG Line Chart */}
              <div style={{ width: '100%', height: '240px' }}>
                <svg width="100%" height="240" viewBox="0 0 500 240" preserveAspectRatio="none">
                  {monthlyData.length > 0 && (() => {
                    const maxVal = Math.max(...monthlyData.map(d => d.ticketMedio), 100);
                    const chartH = 150;
                    const paddingY = 40;
                    const chartW = 420;
                    const colW = chartW / (monthlyData.length - 1 || 1);

                    const points = monthlyData.map((d, idx) => ({
                      x: 50 + idx * colW,
                      y: paddingY + chartH - (d.ticketMedio / maxVal) * chartH,
                      val: d.ticketMedio,
                      label: d.label
                    }));

                    const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

                    return (
                      <>
                        <path d={linePath} fill="none" stroke="#f2a477" strokeWidth="2.5" />
                        {points.map((p, idx) => (
                          <g key={idx}>
                            <circle cx={p.x} cy={p.y} r="4.5" fill="#ffffff" stroke="#f2a477" strokeWidth="2" />
                            <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--ink)">
                              R$ {p.val.toFixed(0)}
                            </text>
                            <text x={p.x} y="215" textAnchor="middle" fontSize="10" fill="var(--muted)">{p.label}</text>
                          </g>
                        ))}
                      </>
                    );
                  })()}
                </svg>
              </div>
            </div>

            {/* Chart 5: Distribuição de atendimentos por Categoria */}
            <div className="chart-card">
              <div className="chart-header">
                <h4>Distribuição de atendimentos por Categoria</h4>
                <div className="chart-legend" style={{ flexWrap: 'wrap' }}>
                  <div className="legend-item"><span className="legend-color" style={{ background: '#8884d8' }}></span>Corte</div>
                  <div className="legend-item"><span className="legend-color" style={{ background: '#82ca9d' }}></span>Coloração</div>
                  <div className="legend-item"><span className="legend-color" style={{ background: '#ffc658' }}></span>Combo</div>
                  <div className="legend-item"><span className="legend-color" style={{ background: '#ff7300' }}></span>Tratamento</div>
                  <div className="legend-item"><span className="legend-color" style={{ background: '#a4de6c' }}></span>Finalização</div>
                </div>
              </div>

              {/* Multi-line curve chart */}
              <div style={{ width: '100%', height: '240px' }}>
                <svg width="100%" height="240" viewBox="0 0 500 240" preserveAspectRatio="none">
                  {monthlyData.length > 0 && (() => {
                    const catColors = {
                      'Corte': '#8884d8',
                      'Coloração': '#82ca9d',
                      'Combo': '#ffc658',
                      'Tratamento': '#ff7300',
                      'Finalização': '#a4de6c'
                    };

                    const maxVal = Math.max(...monthlyData.flatMap(d => Object.values(d.catCounts)), 4);
                    const chartH = 140;
                    const paddingY = 40;
                    const chartW = 420;
                    const colW = chartW / (monthlyData.length - 1 || 1);

                    return Object.keys(catColors).map(catName => {
                      const points = monthlyData.map((d, idx) => ({
                        x: 50 + idx * colW,
                        y: paddingY + chartH - ((d.catCounts[catName] || 0) / maxVal) * chartH,
                        val: d.catCounts[catName] || 0,
                        label: d.label
                      }));

                      const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

                      return (
                        <g key={catName}>
                          <path d={linePath} fill="none" stroke={catColors[catName]} strokeWidth="2" />
                          {points.map((p, idx) => (
                            <circle key={idx} cx={p.x} cy={p.y} r="3" fill="#ffffff" stroke={catColors[catName]} strokeWidth="1.5" />
                          ))}
                          {/* Render bottom labels only once */}
                          {catName === 'Corte' && points.map((p, idx) => (
                            <text key={idx} x={p.x} y="215" textAnchor="middle" fontSize="10" fill="var(--muted)">{p.label}</text>
                          ))}
                        </g>
                      );
                    });
                  })()}
                </svg>
              </div>
            </div>

            {/* Chart 6: Representatividade por Categoria (Count) */}
            <div className="chart-card">
              <div className="chart-header">
                <h4>Representatividade por Categoria (Atendimentos)</h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Volume total de serviços</span>
              </div>
              <div style={{ width: '100%', height: '180px' }}>
                <svg width="100%" height="180" viewBox="0 0 500 180" preserveAspectRatio="none">
                  {categoryStats.length > 0 && (() => {
                    const maxVal = Math.max(...categoryStats.map(c => c.count), 1);
                    return categoryStats.map((c, index) => {
                      const y = 15 + index * 26;
                      const barW = (c.count / maxVal) * 320;
                      return (
                        <g key={c.name}>
                          <text x="10" y={y + 14} fontSize="11" fontWeight="600" fill="var(--ink)">{c.name}</text>
                          <rect x="90" y={y + 3} width={Math.max(barW, 5)} height="14" rx="3" fill="#f2a477" />
                          <text x={95 + Math.max(barW, 5)} y={y + 14} fontSize="10" fontWeight="700" fill="var(--muted)">{c.count}</text>
                        </g>
                      );
                    });
                  })()}
                </svg>
              </div>
            </div>

            {/* Chart 7: Representatividade por Categoria em R$ (Value) */}
            <div className="chart-card">
              <div className="chart-header">
                <h4>Representatividade por Categoria em R$</h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Faturamento por categoria</span>
              </div>
              <div style={{ width: '100%', height: '180px' }}>
                <svg width="100%" height="180" viewBox="0 0 500 180" preserveAspectRatio="none">
                  {categoryStats.length > 0 && (() => {
                    const maxVal = Math.max(...categoryStats.map(c => c.revenue), 1);
                    return categoryStats.map((c, index) => {
                      const y = 15 + index * 26;
                      const barW = (c.revenue / maxVal) * 300;
                      return (
                        <g key={c.name}>
                          <text x="10" y={y + 14} fontSize="11" fontWeight="600" fill="var(--ink)">{c.name}</text>
                          <rect x="90" y={y + 3} width={Math.max(barW, 5)} height="14" rx="3" fill="#f2a477" />
                          <text x={95 + Math.max(barW, 5)} y={y + 14} fontSize="10" fontWeight="700" fill="var(--muted)">
                            R$ {c.revenue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                          </text>
                        </g>
                      );
                    });
                  })()}
                </svg>
              </div>
            </div>
          </div>
        </>
      )}

      {/* SUBTAB: EXTRATO / RELATÓRIO COMPLETO */}
      {activeSubTab === 'fluxo' && (
        <div className="financial-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <h3 style={{ margin: 0 }}>Relatório Financeiro Completo</h3>
            <button className="btn btn-ghost" onClick={handleExportCSV}>
              <Download size={14} style={{ marginRight: 6 }} /> Exportar CSV
            </button>
          </div>

          {/* Ledger filters */}
          <div className="ledger-filters">
            <input 
              type="text" 
              placeholder="Buscar por descrição ou cliente..." 
              value={ledgerSearch}
              onChange={e => setLedgerSearch(e.target.value)}
              style={{ flexGrow: 1, minWidth: '220px' }}
            />
            
            <select value={ledgerTypeFilter} onChange={e => setLedgerTypeFilter(e.target.value)}>
              <option value="todos">Todos os Lançamentos</option>
              <option value="servico">Apenas Serviços</option>
              <option value="produto">Apenas Vendas de Produto</option>
              <option value="saida">Apenas Despesas / Saídas</option>
            </select>

            <select value={ledgerMethodFilter} onChange={e => setLedgerMethodFilter(e.target.value)}>
              <option value="todos">Todas as Formas</option>
              <option value="Pix">Pix</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Cartão de Débito">Débito</option>
              <option value="Cartão de Crédito">Crédito à Vista</option>
              <option value="Crédito 2x">Crédito 2x</option>
              <option value="Crédito 3x">Crédito 3x</option>
            </select>
          </div>

          {/* Ledger table */}
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Cliente</th>
                  <th>Método</th>
                  <th>Tipo</th>
                  <th>Valor Bruto</th>
                  <th>Taxas Retidas</th>
                  <th>Valor Líquido</th>
                </tr>
              </thead>
              <tbody>
                {filteredLedger.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
                      Nenhum lançamento corresponde aos filtros ativos.
                    </td>
                  </tr>
                ) : (
                  filteredLedger.map(t => {
                    const isEntrada = t.type === 'entrada';
                    const netVal = isEntrada ? getNetValue(t.value, t.paymentMethod) : t.value;
                    const fee = isEntrada ? getTransactionFee(t.value, t.paymentMethod) : 0;
                    return (
                      <tr key={t.id}>
                        <td>{t.date.split('-').reverse().join('/')} às {t.time || '00:00'}</td>
                        <td style={{ fontWeight: 600 }}>{t.description}</td>
                        <td>{t.clientName || 'N/A'}</td>
                        <td>{t.paymentMethod}</td>
                        <td>
                          <span className={`status-badge ${isEntrada ? 'confirmado' : 'cancelado'}`}>
                            {isEntrada ? 'Entrada' : 'Saída'}
                          </span>
                        </td>
                        <td style={{ color: isEntrada ? '#2f855a' : '#c53030', fontWeight: 'bold' }}>
                          {isEntrada ? '+' : '-'} R$ {t.value.toFixed(2)}
                        </td>
                        <td style={{ color: fee > 0 ? 'var(--accent)' : 'var(--muted)' }}>
                          {fee > 0 ? `R$ ${fee.toFixed(2)}` : '-'}
                        </td>
                        <td style={{ fontWeight: 'bold', color: isEntrada ? '#2f855a' : '#c53030' }}>
                          R$ {netVal.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB: COMISSÕES & REPASSES */}
      {activeSubTab === 'comissao' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Card: Repasses dos Profissionais */}
          <div className="financial-card">
            <h3>Profissionais e Comissionamento</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 16 }}>
              Abaixo são listados os repasses calculados com base na comissão (%) de cada profissional sobre o valor líquido dos atendimentos executados.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {professionals.map(p => {
                const payout = calculateProfessionalCommission(p.id, p.commission);
                return (
                  <div key={p.id} style={{ border: '1px solid var(--rule)', padding: 16, borderRadius: 8, background: 'var(--surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: 0, fontWeight: 700 }}>{p.name}</h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginTop: 4 }}>
                        Comissão do Perfil: <span style={{ fontWeight: 600 }}>{p.commission}%</span>
                      </span>
                      <span style={{ fontSize: '0.95rem', color: '#48bb78', fontWeight: 700, display: 'block', marginTop: 8 }}>
                        Comissão no Período: R$ {payout.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Table list for detailed checks */}
          <div className="financial-card">
            <h3>Lançar Profissional no Serviço Realizado</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Cliente & Serviço</th>
                  <th>Forma</th>
                  <th>Valor Bruto</th>
                  <th>Valor Líquido</th>
                  <th>Profissional Executora</th>
                  <th>Repasse (%)</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.filter(t => t.type === 'entrada').map(t => {
                  const currentAssigned = t.professionalId || '';
                  const prof = professionals.find(p => p.id === currentAssigned);
                  const netVal = getNetValue(t.value, t.paymentMethod);
                  const repasseValue = prof ? netVal * (prof.commission / 100) : 0;
                  
                  return (
                    <tr key={t.id}>
                      <td>{t.date.split('-').reverse().join('/')}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{t.clientName}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{t.description}</div>
                      </td>
                      <td>{t.paymentMethod}</td>
                      <td>R$ {t.value.toFixed(2)}</td>
                      <td>R$ {netVal.toFixed(2)}</td>
                      <td>{prof ? prof.name : 'Não Associado'}</td>
                      <td style={{ fontWeight: 700, color: repasseValue > 0 ? '#48bb78' : 'var(--muted)' }}>
                        {repasseValue > 0 ? `R$ ${repasseValue.toFixed(2)} (${prof.commission}%)` : 'R$ 0.00'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB: TAXAS DE MAQUININHA */}
      {activeSubTab === 'taxas' && (
        <div style={{ maxWidth: '600px' }}>
          <form className="financial-card" onSubmit={handleSaveFees}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <CreditCard size={18} style={{ color: '#f97316' }} />
              <h3 style={{ margin: 0 }}>Taxas de Meios de Recebimento</h3>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginBottom: 20 }}>
              Defina as taxas descontadas pelas adquirentes e bandeiras. O sistema deduzirá estas taxas automaticamente para exibir seu faturamento líquido e repasses a profissionais.
            </p>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>Taxa de Pix (%)</label>
              <input 
                type="number" 
                step="0.01" 
                required
                value={feesForm.feePix} 
                onChange={e => setFeesForm({ ...feesForm, feePix: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>Taxa de Débito (%)</label>
              <input 
                type="number" 
                step="0.01" 
                required
                value={feesForm.feeDebit} 
                onChange={e => setFeesForm({ ...feesForm, feeDebit: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>Taxa de Crédito à Vista (%)</label>
              <input 
                type="number" 
                step="0.01" 
                required
                value={feesForm.feeCredit} 
                onChange={e => setFeesForm({ ...feesForm, feeCredit: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>Taxa de Crédito Parcelado 2x (%)</label>
              <input 
                type="number" 
                step="0.01" 
                required
                value={feesForm.feeCredit2x} 
                onChange={e => setFeesForm({ ...feesForm, feeCredit2x: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>Taxa de Crédito Parcelado 3x (%)</label>
              <input 
                type="number" 
                step="0.01" 
                required
                value={feesForm.feeCredit3x} 
                onChange={e => setFeesForm({ ...feesForm, feeCredit3x: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label>Taxa Extra de Adiantamento / Antecipação (%)</label>
              <input 
                type="number" 
                step="0.01" 
                required
                value={feesForm.feeAnticipation} 
                onChange={e => setFeesForm({ ...feesForm, feeAnticipation: e.target.value })}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginTop: 4 }}>
                Esta taxa será somada à taxa do cartão quando a opção de antecipação estiver ativada na venda/comanda.
              </span>
            </div>

            <button type="submit" className="btn btn-accent" style={{ background: '#f97316', borderColor: '#f97316' }}>
              Salvar Configuração de Taxas
            </button>
          </form>
        </div>
      )}

      {/* MODAL: REGISTRAR VENDA DE PRODUTO */}
      {showProductSaleModal && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleAddProductSale}>
            <h3>Lançar Venda de Produto Avulsa</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 12 }}>
              Selecione o produto do estoque para registrar a entrada de receita e debitar a quantidade vendida.
            </p>

            <div className="form-group">
              <label>Selecionar Produto *</label>
              <select 
                required
                value={productSaleForm.productId}
                onChange={e => {
                  const prod = products.find(p => p.id === e.target.value);
                  setProductSaleForm(prev => ({ 
                    ...prev, 
                    productId: e.target.value,
                    customPrice: prod ? String(prod.sellingPrice) : ''
                  }));
                }}
              >
                <option value="">-- Selecione o Produto --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Qtd: {p.quantity} | Preço: R$ {p.sellingPrice})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              <div className="form-group">
                <label>Quantidade *</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  value={productSaleForm.quantity}
                  onChange={e => setProductSaleForm(prev => ({ ...prev, quantity: Math.max(1, Number(e.target.value)) }))}
                />
              </div>

              <div className="form-group">
                <label>Preço Unitário (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="Deixar em branco para padrão"
                  value={productSaleForm.customPrice}
                  onChange={e => setProductSaleForm(prev => ({ ...prev, customPrice: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              <div className="form-group">
                <label>Forma de Recebimento *</label>
                <select 
                  value={productSaleForm.paymentMethod}
                  onChange={e => setProductSaleForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                >
                  <option value="Pix">Pix</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Cartão de Crédito">Crédito à Vista</option>
                  <option value="Crédito 2x">Crédito 2x</option>
                  <option value="Crédito 3x">Crédito 3x</option>
                </select>
              </div>

              <div className="form-group">
                <label>Nome do Cliente (opcional)</label>
                <input 
                  type="text" 
                  value={productSaleForm.clientName}
                  onChange={e => setProductSaleForm(prev => ({ ...prev, clientName: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              <div className="form-group">
                <label>Data da Venda *</label>
                <input 
                  type="date" 
                  required
                  value={productSaleForm.date}
                  onChange={e => setProductSaleForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', height: '100%', paddingTop: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600 }}>
                  <input 
                    type="checkbox" 
                    checked={productSaleForm.applyAnticipation}
                    onChange={e => setProductSaleForm(prev => ({ ...prev, applyAnticipation: e.target.checked }))}
                  />
                  Antecipar recebimento?
                </label>
              </div>
            </div>

            <div className="modal-actions" style={{ justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowProductSaleModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-accent" style={{ background: '#48bb78', borderColor: '#48bb78' }}>Registrar Venda</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: REGISTRAR DESPESA / SAÍDA */}
      {showExpenseModal && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleAddExpense}>
            <h3>Lançar Saída de Caixa (Sangria)</h3>

            <div className="form-group">
              <label>Descrição do Gasto / Destinatário *</label>
              <input 
                type="text" 
                required 
                placeholder="Ex: Compra de toalhas descartáveis"
                value={expenseForm.description}
                onChange={e => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              <div className="form-group">
                <label>Valor da Despesa (R$) *</label>
                <input 
                  type="number" 
                  required 
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={expenseForm.value}
                  onChange={e => setExpenseForm(prev => ({ ...prev, value: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Método de Saída *</label>
                <select 
                  value={expenseForm.paymentMethod}
                  onChange={e => setExpenseForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                >
                  <option value="Pix">Pix</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 12 }}>
              <label>Data de Pagamento *</label>
              <input 
                type="date" 
                required
                value={expenseForm.date}
                onChange={e => setExpenseForm(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>

            <div className="modal-actions" style={{ justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowExpenseModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-accent" style={{ background: '#e53e3e', borderColor: '#e53e3e' }}>Registrar Gasto</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminFinancial;
