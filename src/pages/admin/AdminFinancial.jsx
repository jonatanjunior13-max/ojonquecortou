import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { db } from '../../config/firebase';
import { collection, doc, addDoc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { 
  Plus, Trash2, DollarSign, TrendingUp, TrendingDown, CreditCard, 
  Users, Percent, ShieldCheck, Calendar, Download, Filter, 
  FileText, ShoppingBag, Eye, Settings, HelpCircle, ArrowUpRight,
  Search, Edit3
} from 'lucide-react';
import './Admin.css';
import KpiCard from '../../components/admin/ui/KpiCard';

// Seed data for historical comparison if database is empty/fresh (matches Figma layout screenshots)
const SEED_HISTORICAL_TRANSACTIONS = [];

const SEED_HISTORICAL_BOOKINGS = [];

const DEFAULT_PROFESSIONALS = [
  { id: 'jon', name: 'Jon', avatar: '/jon-perfil.webp', commission: 50, phone: '31995097613', email: 'jon@studio.com', active: true }
];

const AdminFinancial = () => {
  const { globalData, setGlobalData } = useOutletContext();

  const [activeSubTab, setActiveSubTab] = useState('dashboard'); // 'dashboard', 'fluxo', 'comissao', 'taxas'
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showProductSaleModal, setShowProductSaleModal] = useState(false);
  const [showDatePickerDropdown, setShowDatePickerDropdown] = useState(false);
  const [showProfDropdown, setShowProfDropdown] = useState(false);

  // Time Window State (Default to 'mes' - Esse mês)
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

  // Professional Filter State
  const [selectedProfFilter, setSelectedProfFilter] = useState(''); // '' means All

  // Form states for manual outflow (despesa)
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    value: '',
    paymentMethod: 'Pix',
    date: new Date().toISOString().split('T')[0],
    category: 'Custos Fixos - Água, Luz e Telefone',
    installments: 1
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
    feeDebit: 1.40,
    feeCredit: 2.49,
    feeCredit2x: 4.5,
    feeCredit3x: 5.5,
    feeAnticipation: 2.50
  });

  // Ledger Filter states
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState('todos'); // 'todos', 'servico', 'produto', 'saida'
  const [ledgerMethodFilter, setLedgerMethodFilter] = useState('todos');

  // Packages Management states
  const [packageSearch, setPackageSearch] = useState('');
  const [packageStatusFilter, setPackageStatusFilter] = useState('todos'); // 'todos', 'active', 'finished', 'pending_payment'
  const [editingClientPackage, setEditingClientPackage] = useState(null);
  const [editingBalanceForm, setEditingBalanceForm] = useState({});

  // Get data from global context
  const dbTransactions = useMemo(() => globalData.financial_transactions || [], [globalData.financial_transactions]);
  const dbBookings = useMemo(() => globalData.bookings || [], [globalData.bookings]);
  const products = useMemo(() => globalData.products || [], [globalData.products]);
  const services = useMemo(() => globalData.services || [], [globalData.services]);
  const settings = useMemo(() => globalData.settings || {}, [globalData.settings]);
  const clientPackages = useMemo(() => globalData.client_packages || [], [globalData.client_packages]);
  const packages = useMemo(() => globalData.packages || [], [globalData.packages]);
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
        feeDebit: settings.feeDebit ?? 1.40,
        feeCredit: settings.feeCredit ?? 2.49,
        feeCredit2x: settings.feeCredit2x ?? 4.5,
        feeCredit3x: settings.feeCredit3x ?? 5.5,
        feeAnticipation: settings.feeAnticipation ?? 2.50
      });
    }
  }, [settings]);

  // Handle Date range presets
  const handleDateWindowChange = (windowType) => {
    setDateWindow(windowType);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
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
      const d = new Date();
      d.setMonth(d.getMonth() - 6);
      setStartDate(d.toISOString().split('T')[0]);
      setEndDate(todayStr);
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

    const m = (method || '').toLowerCase();
    if (val === 0 || m.includes('pacote')) return 0;
    let rate = 0;

    if (m === 'pix') {
      rate = fees.feePix;
      return val * (1 - rate / 100);
    } else if (m === 'dinheiro') {
      return val;
    } else if (m.includes('débito') || m.includes('debito')) {
      rate = fees.feeDebit;
      return val * (1 - rate / 100);
    } else if (m.includes('crédito') || m.includes('credito') || m.includes('credit')) {
      // Detect installments from payment method label, e.g., "Cartão de Crédito (3x)" or "Crédito 2x"
      let installments = 1;
      const match = m.match(/(\d+)x/);
      if (match) {
        installments = parseInt(match[1], 10);
      }

      if (installments === 2) {
        rate = fees.feeCredit2x;
      } else if (installments >= 3) {
        rate = fees.feeCredit3x;
      } else {
        rate = fees.feeCredit;
      }

      const hasAnticipation = m.includes('antecip') || m.includes('adiant');
      if (hasAnticipation) {
        // Stone calculates anticipation fee per installment pro-rata (simple interest per month)
        // Installment i is anticipated by (30 * i - 1) days if received on day 1 (tomorrow)
        const valPerInstallment = val / installments;
        let totalNet = 0;
        const antRatePerMonth = fees.feeAnticipation / 100;
        
        for (let i = 1; i <= installments; i++) {
          const days = 30 * i - 1;
          const netInstallment = valPerInstallment * (1 - rate / 100);
          const payout = netInstallment * (1 - antRatePerMonth * (days / 30));
          totalNet += payout;
        }
        return totalNet;
      } else {
        return val * (1 - rate / 100);
      }
    }

    return val;
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

  // Product cost and profit calculations
  const productCost = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'entrada')
      .reduce((sum, t) => {
        if (t.productSales && Array.isArray(t.productSales)) {
          return sum + t.productSales.reduce((s, p) => s + ((p.costPrice || 0) * (p.quantity || 0)), 0);
        }
        return sum;
      }, 0);
  }, [filteredTransactions]);

  const productGrossRevenue = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'entrada')
      .reduce((sum, t) => {
        if (t.productSales && Array.isArray(t.productSales)) {
          return sum + t.productSales.reduce((s, p) => s + ((p.sellingPrice || 0) * (p.quantity || 0)), 0);
        }
        return sum;
      }, 0);
  }, [filteredTransactions]);

  const productNetProfit = productGrossRevenue - productCost;

  // Total de taxas retidas pelas operadoras
  const totalTaxas = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'entrada')
      .reduce((sum, t) => sum + getTransactionFee(t.value, t.paymentMethod), 0);
  }, [filteredTransactions, settings, feesForm]);

  // Resultado = Receita Bruta - Taxas - Despesas
  const netResultado = netReceita - totalDespesa;

  const totalBookingsCount = useMemo(() => {
    return filteredBookings.filter(b => b.status !== 'bloqueado' && b.status !== 'cancelado').length;
  }, [filteredBookings]);

  const onlineBookingsCount = useMemo(() => {
    return filteredBookings.filter(b => b.status !== 'bloqueado' && b.status !== 'cancelado' && b.userId).length;
  }, [filteredBookings]);

  const adminBookingsCount = useMemo(() => {
    return filteredBookings.filter(b => b.status !== 'bloqueado' && b.status !== 'cancelado' && !b.userId).length;
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

  // Expense categorization and summing
  const expenseCategoryStats = useMemo(() => {
    const stats = {};
    filteredTransactions
      .filter(t => t.type === 'saida')
      .forEach(t => {
        const cat = t.category || 'Custos Variáveis - Outras Despesas Variáveis';
        if (!stats[cat]) {
          stats[cat] = 0;
        }
        stats[cat] += t.value;
      });

    return Object.keys(stats).map(name => ({
      name,
      value: stats[name]
    })).sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

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
    
    const addMonths = (dateStr, monthsToAdd) => {
      const date = new Date(dateStr + 'T12:00:00');
      date.setMonth(date.getMonth() + monthsToAdd);
      return date.toISOString().split('T')[0];
    };

    const totalVal = Number(expenseForm.value);
    const installments = expenseForm.paymentMethod === 'Cartão de Crédito' ? Number(expenseForm.installments || 1) : 1;

    const transactionsToInsert = [];

    if (installments > 1) {
      const valuePerInstallment = Number((totalVal / installments).toFixed(2));
      const lastInstallmentValue = Number((totalVal - (valuePerInstallment * (installments - 1))).toFixed(2));

      for (let i = 0; i < installments; i++) {
        const installmentVal = i === installments - 1 ? lastInstallmentValue : valuePerInstallment;
        const currentInstallmentDate = addMonths(expenseForm.date, i);

        transactionsToInsert.push({
          date: currentInstallmentDate,
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          clientName: 'Despesa Avulsa',
          type: 'saida',
          category: expenseForm.category,
          paymentMethod: expenseForm.paymentMethod,
          value: installmentVal,
          description: `${expenseForm.description} (${i + 1}/${installments})`,
          createdAt: new Date().toISOString()
        });
      }
    } else {
      transactionsToInsert.push({
        date: expenseForm.date,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        clientName: 'Despesa Avulsa',
        type: 'saida',
        category: expenseForm.category,
        paymentMethod: expenseForm.paymentMethod,
        value: totalVal,
        description: expenseForm.description,
        createdAt: new Date().toISOString()
      });
    }

    try {
      if (isDemoMode) {
        const local = JSON.parse(localStorage.getItem('demo_financial') || '[]');
        const withIds = transactionsToInsert.map((t, idx) => ({ id: 'tx_' + (Date.now() + idx), ...t }));
        const updated = [...withIds, ...local];
        localStorage.setItem('demo_financial', JSON.stringify(updated));
        setGlobalData(prev => ({ ...prev, financial_transactions: updated }));
      } else {
        for (const t of transactionsToInsert) {
          await addDoc(collection(db, 'financial_transactions'), t);
        }
      }
      setShowExpenseModal(false);
      setExpenseForm({
        description: '',
        value: '',
        paymentMethod: 'Pix',
        date: new Date().toISOString().split('T')[0],
        category: 'Custos Fixos - Água, Luz e Telefone',
        installments: 1
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
      professionalId: 'jon', // Direct sales default professional is Jon
      productSales: [
        {
          productId: selectedProd.id,
          name: selectedProd.name,
          quantity: productSaleForm.quantity,
          sellingPrice: price,
          costPrice: selectedProd.costPrice || 0
        }
      ],
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
    const headers = ['Data', 'Descricao', 'Cliente', 'Tipo', 'Metodo Pagamento', 'Valor Bruto (R$)', 'Valor Liquido (R$)', 'Taxa Retida (R$)', 'Custo de Produto (R$)', 'Lucro de Produto (R$)'];
    const rows = filteredTransactions.map(t => {
      const isEntrada = t.type === 'entrada';
      const netVal = isEntrada ? getNetValue(t.value, t.paymentMethod) : t.value;
      const fee = isEntrada ? getTransactionFee(t.value, t.paymentMethod) : 0;
      
      let txCost = 0;
      let txProfit = 0;
      if (isEntrada && t.productSales && Array.isArray(t.productSales)) {
        txCost = t.productSales.reduce((sum, p) => sum + ((p.costPrice || 0) * (p.quantity || 0)), 0);
        const txProdGross = t.productSales.reduce((sum, p) => sum + ((p.sellingPrice || 0) * (p.quantity || 0)), 0);
        txProfit = txProdGross - txCost;
      }

      return [
        t.date.split('-').reverse().join('/'),
        t.description,
        t.clientName || 'N/A',
        t.type === 'entrada' ? 'Entrada' : 'Saida/Despesa',
        t.paymentMethod,
        t.value.toFixed(2),
        netVal.toFixed(2),
        fee.toFixed(2),
        txCost.toFixed(2),
        txProfit.toFixed(2)
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
  const calculateProfessionalCommission = (prof) => {
    if (!prof) return { services: 0, products: 0, total: 0 };
    const commServ = prof.commissionService !== undefined ? prof.commissionService : (prof.commission || 0);
    const commProd = prof.commissionProduct !== undefined ? prof.commissionProduct : 0;
    
    let servicesPayout = 0;
    let productsPayout = 0;

    filteredTransactions
      .filter(t => t.type === 'entrada' && t.professionalId === prof.id)
      .forEach(t => {
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

        const feeFactor = t.value > 0 ? getNetValue(t.value, t.paymentMethod) / t.value : 1;
        servicesPayout += rawServ * (commServ / 100) * feeFactor;
        productsPayout += rawProd * (commProd / 100) * feeFactor;
      });

    return {
      services: servicesPayout,
      products: productsPayout,
      total: servicesPayout + productsPayout
    };
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
  const activeColor = '#DCA354'; // --adm-gold
  const redColor = '#E24B4A'; // --adm-danger
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
          background: var(--adm-card, #211D1A);
          color: var(--adm-text, #F5EDDB);
          border: 0.5px solid var(--adm-rule-gold, rgba(220,163,84,0.25));
          padding: 8px 16px;
          border-radius: 9999px;
          font-weight: 600;
          font-size: 0.88rem;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
          font-family: inherit;
        }
        .orange-pill:hover {
          background: var(--adm-card-hover, #282320);
          border-color: var(--adm-gold, #DCA354);
          color: var(--adm-gold, #DCA354);
        }
        .date-picker-dropdown {
          position: absolute;
          background: var(--adm-surface, #1A1715);
          border: 0.5px solid var(--adm-rule-gold, rgba(220,163,84,0.25));
          border-radius: 12px;
          padding: 16px;
          width: 320px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.6);
          z-index: 100;
          margin-top: 8px;
          color: var(--adm-text, #F5EDDB);
        }
        .date-picker-dropdown h5 {
          color: var(--adm-text, #F5EDDB);
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
          border-radius: 6px;
          border: 0.5px solid var(--adm-rule, rgba(245,237,219,0.08));
          background: var(--adm-card, #211D1A);
          color: var(--adm-text-2, #C9BCA8);
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }
        .picker-presets button:hover {
          border-color: var(--adm-gold, #DCA354);
          color: var(--adm-gold, #DCA354);
        }
        .picker-presets button.active {
          background: rgba(220,163,84,0.15);
          color: var(--adm-gold, #DCA354);
          border-color: var(--adm-gold, #DCA354);
          font-weight: 700;
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
          background: var(--adm-surface, #1A1715);
          border: 0.5px solid var(--adm-rule, rgba(245,237,219,0.08));
          border-radius: 12px;
          padding: 20px;
          color: var(--adm-text, #F5EDDB);
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
          color: var(--adm-text, #F5EDDB);
        }
        .chart-legend {
          display: flex;
          gap: 12px;
          font-size: 0.75rem;
          color: var(--adm-muted, #9A8D7E);
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
          border: 0.5px solid var(--adm-rule, rgba(245,237,219,0.08));
          background: var(--adm-card, #211D1A);
          color: var(--adm-text, #F5EDDB);
          outline: none;
          font-family: inherit;
        }
        .ledger-filters input::placeholder {
          color: var(--adm-muted, #9A8D7E);
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

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16, marginBottom: 24 }}>
        <KpiCard
          label="Receita Bruta"
          value={`R$ ${grossReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<TrendingUp size={16} />}
          variant="success"
        />
        <KpiCard
          label="Taxas Maquininha"
          value={`- R$ ${totalTaxas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<CreditCard size={16} />}
          variant="danger"
        />
        <KpiCard
          label="Despesas"
          value={`- R$ ${totalDespesa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<TrendingDown size={16} />}
          variant="danger"
        />
        <KpiCard
          label="Resultado Líquido"
          value={`R$ ${netResultado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={netResultado >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          variant={netResultado >= 0 ? 'success' : 'danger'}
        />
        <KpiCard
          label="Atendimentos"
          value={`${completedBookingsCount}`}
          sub={`${totalBookingsCount} no período`}
          icon={<Calendar size={16} />}
        />
        <KpiCard
          label="Lucro Produtos"
          value={`R$ ${productNetProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          sub={`Custo: R$ ${productCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<ShoppingBag size={16} />}
          variant={productNetProfit >= 0 ? 'success' : 'danger'}
        />
      </div>

      {/* Sub tabs Menu */}
      <div style={{ display: 'flex', gap: 4, margin: '0 0 20px 0', borderBottom: '0.5px solid var(--adm-rule)', paddingBottom: 0, flexWrap: 'wrap' }}>
        {[
          { id: 'dashboard', label: 'Gráficos', icon: <TrendingUp size={14} /> },
          { id: 'fluxo', label: 'Extrato', icon: <DollarSign size={14} /> },
          { id: 'comissao', label: 'Comissões', icon: <Users size={14} /> },
          { id: 'taxas', label: 'Taxas', icon: <Percent size={14} /> },
          { id: 'pacotes', label: 'Pacotes', icon: <Eye size={14} /> },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSubTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '10px 16px',
              fontSize: '0.85rem', fontWeight: 600, fontFamily: 'inherit',
              color: activeSubTab === tab.id ? 'var(--adm-gold)' : 'var(--adm-muted)',
              borderBottom: activeSubTab === tab.id ? '2px solid var(--adm-gold)' : '2px solid transparent',
              marginBottom: -1,
              transition: 'color 0.2s',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
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
                            fill="var(--adm-text)" 
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
                            fill="var(--adm-muted)"
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
                          <text x={xCenter} y="215" textAnchor="middle" fontSize="10" fill="var(--adm-muted)">{d.label}</text>
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
                          <text x={xCenter} y={y - 6} textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--adm-text)">{d.atendimentos}</text>
                          <text x={xCenter} y="215" textAnchor="middle" fontSize="10" fill="var(--adm-muted)">{d.label}</text>
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
                            <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--adm-text)">
                              R$ {p.val.toFixed(0)}
                            </text>
                            <text x={p.x} y="215" textAnchor="middle" fontSize="10" fill="var(--adm-muted)">{p.label}</text>
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
                            <text key={idx} x={p.x} y="215" textAnchor="middle" fontSize="10" fill="var(--adm-muted)">{p.label}</text>
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
                          <text x="10" y={y + 14} fontSize="11" fontWeight="600" fill="var(--adm-text)">{c.name}</text>
                          <rect x="90" y={y + 3} width={Math.max(barW, 5)} height="14" rx="3" fill="#f2a477" />
                          <text x={95 + Math.max(barW, 5)} y={y + 14} fontSize="10" fontWeight="700" fill="var(--adm-muted)">{c.count}</text>
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
                          <text x="10" y={y + 14} fontSize="11" fontWeight="600" fill="var(--adm-text)">{c.name}</text>
                          <rect x="90" y={y + 3} width={Math.max(barW, 5)} height="14" rx="3" fill="#f2a477" />
                          <text x={95 + Math.max(barW, 5)} y={y + 14} fontSize="10" fontWeight="700" fill="var(--adm-muted)">
                            R$ {c.revenue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                          </text>
                        </g>
                      );
                    });
                  })()}
                </svg>
              </div>
            </div>

            {/* Chart 8: Distribuição de Despesas por Categoria */}
            <div className="chart-card" style={{ gridColumn: '1 / -1', marginTop: 12 }}>
              <div className="chart-header">
                <h4>Distribuição de Despesas por Categoria</h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Total acumulado por categoria no período</span>
              </div>
              <div style={{ width: '100%' }}>
                {expenseCategoryStats.length === 0 ? (
                  <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '24px 0', fontSize: '0.85rem' }}>
                    Nenhuma despesa registrada no período selecionado.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {expenseCategoryStats.map((c, index) => {
                      const totalExpenses = expenseCategoryStats.reduce((sum, item) => sum + item.value, 0);
                      const pct = totalExpenses > 0 ? (c.value / totalExpenses) * 100 : 0;
                      return (
                        <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
                            <span style={{ color: 'var(--adm-text)' }}>{c.name}</span>
                            <span style={{ color: 'var(--accent)' }}>
                              R$ {c.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({pct.toFixed(1)}%)
                            </span>
                          </div>
                          <div style={{ width: '100%', height: 8, background: 'var(--adm-card)', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: '#e53e3e', borderRadius: 4 }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
                  <th>Custo Prod.</th>
                  <th>Lucro Prod.</th>
                  <th>Valor Líquido</th>
                </tr>
              </thead>
              <tbody>
                {filteredLedger.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
                      Nenhum lançamento corresponde aos filtros ativos.
                    </td>
                  </tr>
                ) : (
                  filteredLedger.map(t => {
                    const isEntrada = t.type === 'entrada';
                    const netVal = isEntrada ? getNetValue(t.value, t.paymentMethod) : t.value;
                    const fee = isEntrada ? getTransactionFee(t.value, t.paymentMethod) : 0;
                    
                    // Calculate products cost and profit for this transaction
                    let txCost = 0;
                    let txProfit = 0;
                    if (isEntrada && t.productSales && Array.isArray(t.productSales)) {
                      txCost = t.productSales.reduce((sum, p) => sum + ((p.costPrice || 0) * (p.quantity || 0)), 0);
                      const txProdGross = t.productSales.reduce((sum, p) => sum + ((p.sellingPrice || 0) * (p.quantity || 0)), 0);
                      txProfit = txProdGross - txCost;
                    }
                    
                    return (
                      <tr key={t.id}>
                        <td>{t.date.split('-').reverse().join('/')} às {t.time || '00:00'}</td>
                        <td style={{ fontWeight: 600 }}>
                          {t.description}
                          {t.category && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--accent)', background: 'rgba(200, 133, 42, 0.1)', padding: '2px 6px', borderRadius: 4, fontWeight: 'normal', marginLeft: 8, display: 'inline-block' }}>
                              {t.category}
                            </span>
                          )}
                        </td>
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
                        <td style={{ color: txCost > 0 ? '#c53030' : 'var(--muted)' }}>
                          {txCost > 0 ? `R$ ${txCost.toFixed(2)}` : '-'}
                        </td>
                        <td style={{ color: txProfit > 0 ? '#2f855a' : 'var(--muted)', fontWeight: txProfit > 0 ? '600' : 'normal' }}>
                          {txProfit > 0 ? `R$ ${txProfit.toFixed(2)}` : '-'}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {professionals.map(p => {
                const commServ = p.commissionService !== undefined ? p.commissionService : (p.commission || 50);
                const commProd = p.commissionProduct !== undefined ? p.commissionProduct : 10;
                const payout = calculateProfessionalCommission(p);
                return (
                  <div key={p.id} style={{ border: '0.5px solid var(--adm-rule)', padding: 16, borderRadius: 8, background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem' }}>{p.name}</h4>
                      <span style={{ fontSize: '1.1rem', color: '#48bb78', fontWeight: 700 }}>
                        R$ {payout.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block' }}>Serviços ({commServ}%)</span>
                        <strong style={{ fontSize: '0.88rem', color: 'var(--adm-text)' }}>R$ {payout.services.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block' }}>Produtos ({commProd}%)</span>
                        <strong style={{ fontSize: '0.88rem', color: 'var(--adm-text)' }}>R$ {payout.products.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                      </div>
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
                  
                  let repasseValue = 0;
                  let detailsStr = '';

                  if (prof) {
                    const commServ = prof.commissionService !== undefined ? prof.commissionService : (prof.commission || 50);
                    const commProd = prof.commissionProduct !== undefined ? prof.commissionProduct : 10;

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

                    const feeFactor = t.value > 0 ? netVal / t.value : 1;
                    const servComm = rawServ * (commServ / 100) * feeFactor;
                    const prodComm = rawProd * (commProd / 100) * feeFactor;
                    
                    repasseValue = servComm + prodComm;

                    const parts = [];
                    if (rawServ > 0) parts.push(`Serv: R$ ${servComm.toFixed(2)} (${commServ}%)`);
                    if (rawProd > 0) parts.push(`Prod: R$ ${prodComm.toFixed(2)} (${commProd}%)`);
                    detailsStr = parts.join(' + ');
                  }
                  
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
                      <td style={{ color: repasseValue > 0 ? '#48bb78' : 'var(--muted)' }}>
                        {repasseValue > 0 ? (
                          <div>
                            <div style={{ fontWeight: 700 }}>R$ {repasseValue.toFixed(2)}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 2 }}>{detailsStr}</div>
                          </div>
                        ) : 'R$ 0.00'}
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

      {/* SUBTAB: CONTROLE DE PACOTES */}
      {activeSubTab === 'pacotes' && (() => {
        // Compute dashboard metrics
        const activeCount = clientPackages.filter(cp => cp.status === 'active').length;
        const totalRevenue = clientPackages.reduce((acc, cp) => acc + (Number(cp.pricePaid) || 0), 0);
        const remainingCredits = clientPackages.reduce((acc, cp) => {
          if (cp.status !== 'active') return acc;
          return acc + Object.values(cp.balance || {}).reduce((sum, val) => sum + val, 0);
        }, 0);

        // Filter purchased packages
        const filteredPackages = clientPackages.filter(cp => {
          const matchesSearch = 
            (cp.clientName || '').toLowerCase().includes(packageSearch.toLowerCase()) ||
            (cp.clientPhone || '').includes(packageSearch) ||
            (cp.packageName || '').toLowerCase().includes(packageSearch.toLowerCase());
          
          const matchesStatus = packageStatusFilter === 'todos' || cp.status === packageStatusFilter;

          return matchesSearch && matchesStatus;
        });

        const handleOpenEditBalance = (cp) => {
          setEditingClientPackage(cp);
          setEditingBalanceForm(cp.balance || {});
        };

        const handleDeleteClientPackage = async (id) => {
          if (!confirm('Deseja realmente excluir este pacote do cliente? Isso removerá o saldo de créditos associado.')) return;
          
          try {
            if (isDemoMode || !db) {
              const local = localStorage.getItem('demo_client_packages');
              const current = local ? JSON.parse(local) : [];
              const next = current.filter(cp => cp.id !== id);
              localStorage.setItem('demo_client_packages', JSON.stringify(next));
              setGlobalData(prev => ({ ...prev, client_packages: next }));
            } else {
              await deleteDoc(doc(db, 'client_packages', id));
            }
          } catch (err) {
            console.error('Erro ao remover pacote do cliente:', err);
            alert('Não foi possível excluir o pacote.');
          }
        };

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Quick Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <div className="stat-card" style={{ border: '0.5px solid var(--adm-rule)' }}>
                <h3 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600 }}>Pacotes Ativos</h3>
                <div style={{ fontSize: '1.6rem', marginTop: 8, fontWeight: 700, color: 'var(--adm-text)' }}>{activeCount}</div>
              </div>
              <div className="stat-card" style={{ border: '0.5px solid var(--adm-rule)' }}>
                <h3 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600 }}>Receita Total Gerada</h3>
                <div style={{ fontSize: '1.6rem', marginTop: 8, fontWeight: 700, color: '#2f855a' }}>
                  R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="stat-card" style={{ border: '0.5px solid var(--adm-rule)' }}>
                <h3 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600 }}>Sessões Restantes</h3>
                <div style={{ fontSize: '1.6rem', marginTop: 8, fontWeight: 700, color: 'var(--accent)' }}>{remainingCredits} sessões</div>
              </div>
            </div>

            {/* List & Filters Card */}
            <div className="financial-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <h3 style={{ margin: 0 }}>Histórico de Pacotes Adquiridos</h3>
              </div>

              {/* Filters */}
              <div className="ledger-filters" style={{ marginBottom: 16 }}>
                <div style={{ position: 'relative', flexGrow: 1, minWidth: '220px' }}>
                  <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                  <input 
                    type="text" 
                    placeholder="Buscar por cliente, telefone ou pacote..." 
                    value={packageSearch}
                    onChange={e => setPackageSearch(e.target.value)}
                    style={{ paddingLeft: 36, width: '100%' }}
                  />
                </div>
                
                <select value={packageStatusFilter} onChange={e => setPackageStatusFilter(e.target.value)}>
                  <option value="todos">Todos os Status</option>
                  <option value="active">Ativos</option>
                  <option value="finished">Finalizados</option>
                  <option value="pending_payment">Aguardando Pagamento</option>
                </select>
              </div>

              {/* Table */}
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Pacote</th>
                      <th>Data de Compra</th>
                      <th>Valor Pago</th>
                      <th>Saldo de Créditos</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPackages.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
                          Nenhum pacote de cliente corresponde aos filtros atuais.
                        </td>
                      </tr>
                    ) : (
                      filteredPackages.map(cp => {
                        const totalCredits = Object.values(cp.balance || {}).reduce((sum, val) => sum + val, 0);
                        return (
                          <tr key={cp.id}>
                            <td>
                              <div style={{ fontWeight: 600 }}>{cp.clientName}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{cp.clientPhone || 'Sem telefone'}</div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{cp.packageName}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Cód: {cp.packageId}</div>
                            </td>
                            <td>{cp.datePurchased ? cp.datePurchased.split('-').reverse().join('/') : 'N/A'}</td>
                            <td style={{ fontWeight: 'bold', color: '#2f855a' }}>
                              R$ {(Number(cp.pricePaid) || 0).toFixed(2)}
                              <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 'normal' }}>
                                {cp.paymentMethod || 'N/A'}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {Object.keys(cp.balance || {}).map(srvId => {
                                  const srvObj = services.find(s => s.id === srvId);
                                  const srvName = srvObj ? srvObj.name : srvId;
                                  const rem = cp.balance[srvId];
                                  return (
                                    <div key={srvId} style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                      <span style={{ color: 'var(--adm-text)' }}>{srvName}</span>
                                      <span style={{ fontWeight: 'bold', color: rem > 0 ? 'var(--accent)' : 'var(--muted)' }}>
                                        {rem} sessões
                                      </span>
                                    </div>
                                  );
                                })}
                                {totalCredits === 0 && (
                                  <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontStyle: 'italic' }}>
                                    Créditos esgotados
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className={`status-badge ${
                                cp.status === 'active' ? 'confirmado' : 
                                cp.status === 'finished' ? 'finalizado' : 'pendente'
                              }`}>
                                {cp.status === 'active' ? 'Ativo' : 
                                 cp.status === 'finished' ? 'Finalizado' : 'Pendente'}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button 
                                  className="btn btn-ghost" 
                                  style={{ padding: 6 }} 
                                  onClick={() => handleOpenEditBalance(cp)}
                                  title="Ajustar créditos manualmente"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button 
                                  className="btn btn-ghost" 
                                  style={{ padding: 6, color: 'var(--accent)' }} 
                                  onClick={() => handleDeleteClientPackage(cp.id)}
                                  title="Remover pacote"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

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
                  onChange={e => {
                    const method = e.target.value;
                    const isCard = method.includes('Cartão') || method.includes('Crédito');
                    setProductSaleForm(prev => ({ 
                      ...prev, 
                      paymentMethod: method,
                      applyAnticipation: isCard ? true : false
                    }));
                  }}
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

            {expenseForm.paymentMethod === 'Cartão de Crédito' && (
              <div className="form-group" style={{ marginTop: 12 }}>
                <label>Parcelamento *</label>
                <select
                  value={expenseForm.installments || 1}
                  onChange={e => setExpenseForm(prev => ({ ...prev, installments: Number(e.target.value) }))}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '0.5px solid var(--adm-rule)', background: 'var(--adm-card)', color: 'var(--adm-text)' }}
                >
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}x {i > 0 ? `(R$ ${(Number(expenseForm.value || 0) / (i + 1)).toFixed(2)} / mês)` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

             <div className="form-group" style={{ marginTop: 12 }}>
              <label>Categoria da Despesa *</label>
              <select 
                value={expenseForm.category}
                onChange={e => setExpenseForm(prev => ({ ...prev, category: e.target.value }))}
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '0.5px solid var(--adm-rule)', background: 'var(--adm-card)', color: 'var(--adm-text)' }}
              >
                <optgroup label="Custos Fixos">
                  <option value="Custos Fixos - Aluguel e Condomínio">Aluguel e Condomínio</option>
                  <option value="Custos Fixos - Água, Luz e Telefone">Água, Luz e Telefone</option>
                  <option value="Custos Fixos - Sistemas e Assinaturas">Sistemas e Assinaturas</option>
                  <option value="Custos Fixos - Marketing e Anúncios">Marketing e Anúncios</option>
                  <option value="Custos Fixos - Salários e Pró-labore">Salários e Pró-labore</option>
                  <option value="Custos Fixos - Limpeza e Manutenção">Limpeza e Manutenção</option>
                  <option value="Custos Fixos - Serviços Profissionais (Contabilidade, etc.)">Serviços Profissionais</option>
                  <option value="Custos Fixos - Tarifas Bancárias">Tarifas Bancárias</option>
                </optgroup>
                <optgroup label="Custos Variáveis">
                  <option value="Custos Variáveis - Estoque e Produtos de Uso">Estoque e Produtos de Uso</option>
                  <option value="Custos Variáveis - Comissão de Profissionais">Comissão de Profissionais</option>
                  <option value="Custos Variáveis - Impostos e Taxas">Impostos e Taxas</option>
                  <option value="Custos Variáveis - Embalagens e Descartáveis">Embalagens e Descartáveis</option>
                  <option value="Custos Variáveis - Eventos e Treinamentos">Eventos e Treinamentos</option>
                  <option value="Custos Variáveis - Outras Despesas Variáveis">Outras Despesas Variáveis</option>
                </optgroup>
              </select>
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

      {/* MODAL: AJUSTAR SALDO DE CRÉDITOS MANUALMENTE */}
      {editingClientPackage && (() => {
        const handleSaveClientPackageBalance = async (e) => {
          e.preventDefault();
          if (!editingClientPackage) return;
          
          const isFinished = Object.values(editingBalanceForm).every(val => Number(val) === 0);
          const updatedCp = {
            ...editingClientPackage,
            balance: Object.keys(editingBalanceForm).reduce((acc, key) => {
              acc[key] = Math.max(0, Number(editingBalanceForm[key]));
              return acc;
            }, {}),
            status: isFinished ? 'finished' : 'active'
          };

          try {
            if (isDemoMode || !db) {
              const local = localStorage.getItem('demo_client_packages');
              const current = local ? JSON.parse(local) : [];
              const next = current.map(cp => cp.id === updatedCp.id ? updatedCp : cp);
              localStorage.setItem('demo_client_packages', JSON.stringify(next));
              setGlobalData(prev => ({ ...prev, client_packages: next }));
            } else {
              const cpRef = doc(db, 'client_packages', updatedCp.id);
              await updateDoc(cpRef, {
                balance: updatedCp.balance,
                status: updatedCp.status
              });
            }
            setEditingClientPackage(null);
          } catch (err) {
            console.error('Erro ao salvar saldo do pacote:', err);
            alert('Não foi possível salvar as alterações.');
          }
        };

        return (
          <div className="modal-overlay">
            <form className="modal-content" onSubmit={handleSaveClientPackageBalance}>
              <h3>Ajustar Saldo de Créditos</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 16 }}>
                Ajuste manualmente a quantidade de sessões restantes para cada serviço do pacote de <strong>{editingClientPackage.clientName}</strong>.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                {Object.keys(editingClientPackage.balance || {}).map(srvId => {
                  const srvObj = services.find(s => s.id === srvId);
                  const srvName = srvObj ? srvObj.name : srvId;
                  return (
                    <div key={srvId} className="form-group">
                      <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>{srvName}</label>
                      <input 
                        type="number" 
                        min="0"
                        required
                        value={editingBalanceForm[srvId] ?? 0}
                        onChange={e => setEditingBalanceForm({
                          ...editingBalanceForm,
                          [srvId]: Math.max(0, Number(e.target.value))
                        })}
                        style={{ width: '100%', padding: '10px', borderRadius: 4, border: '0.5px solid var(--adm-rule)' }}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="modal-actions" style={{ justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setEditingClientPackage(null)}>Cancelar</button>
                <button type="submit" className="btn btn-accent" style={{ background: '#48bb78', borderColor: '#48bb78' }}>Salvar Alterações</button>
              </div>
            </form>
          </div>
        );
      })()}
    </div>
  );
};

export default AdminFinancial;
