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
import KpiCard from '../../components/admin/ui/KpiCard';
import { calculateNetValue, calculateTransactionFee, calculateProfessionalCommission as calculateProfessionalCommissionUtil, formatCurrencyBRL, calculateReceivablesSchedule } from '../../utils/finance';

// Seed data for historical comparison if database is empty/fresh (matches Figma layout screenshots)
const SEED_HISTORICAL_TRANSACTIONS = [];

const SEED_HISTORICAL_BOOKINGS = [];

const DEFAULT_PROFESSIONALS = [
  { id: 'jon', name: 'Jon', avatar: '/jon-perfil.webp', commission: 50, phone: '31995097613', email: 'jon@studio.com', active: true }
];

const Card = ({ children }) => (
  <div className="financial-card">
    {children}
  </div>
);

const AdminFinancial = () => {
  const { globalData, setGlobalData } = useOutletContext();

  const [activeSubTab, setActiveSubTab] = useState('dashboard'); // 'dashboard', 'fluxo', 'comissao', 'taxas'
  const [attendanceViewMode, setAttendanceViewMode] = useState('detalhado'); // 'detalhado', 'dia', 'semana', 'mes'
  const [commissionViewMode, setCommissionViewMode] = useState('dia'); // 'dia', 'semana', 'quinzena', 'mes', 'detalhado'
  const [commissionSearch, setCommissionSearch] = useState('');
  const [fixedCosts, setFixedCosts] = useState(3500);
  const [proLabore, setProLabore] = useState(5000);
  const [workDays, setWorkDays] = useState(22);
  const [workHours, setWorkHours] = useState(8);
  const [serviceDuration, setServiceDuration] = useState(60);
  const [productCostInput, setProductCostInput] = useState(15);
  const [markup, setMarkup] = useState(40);
  const [feesTaxPercentage, setFeesTaxPercentage] = useState(10);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showProductSaleModal, setShowProductSaleModal] = useState(false);
  const [showCommissionWithdrawalModal, setShowCommissionWithdrawalModal] = useState(false);
  const [commissionWithdrawalForm, setCommissionWithdrawalForm] = useState({
    professionalId: 'jon',
    value: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Pix',
    motive: 'Pagamento de Comissão',
    notes: ''
  });
  const [showDatePickerDropdown, setShowDatePickerDropdown] = useState(false);
  const [showProfDropdown, setShowProfDropdown] = useState(false);

  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTxDetailModal, setShowTxDetailModal] = useState(false);
  const [isEditingTx, setIsEditingTx] = useState(false);
  const [editTxForm, setEditTxForm] = useState({
    description: '',
    value: 0,
    category: '',
    clientName: '',
    paymentMethod: 'Pix',
    date: '',
    time: '00:00',
    type: 'entrada'
  });

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
    feeAnticipation: 2.50,
    autoAnticipation: false
  });

  // Ledger Filter states
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState('todos'); // 'todos', 'servico', 'produto', 'saida'
  const [ledgerMethodFilter, setLedgerMethodFilter] = useState('todos');
  const [productSearch, setProductSearch] = useState('');

  // Receivables Schedule Filter states
  const [receivablesViewMode, setReceivablesViewMode] = useState('dia'); // 'dia', 'semana', 'quinzena', 'mes', 'personalizado', 'detalhado'
  const [selectedReceivablesDay, setSelectedReceivablesDay] = useState('todos');
  const [selectedReceivablesWeek, setSelectedReceivablesWeek] = useState('todos');
  const [selectedReceivablesFortnight, setSelectedReceivablesFortnight] = useState('todos');
  const [selectedReceivablesMonth, setSelectedReceivablesMonth] = useState('todos');
  const [receivablesSearch, setReceivablesSearch] = useState('');
  const [receivablesStatusFilter, setReceivablesStatusFilter] = useState('todos'); // 'todos', 'a_receber', 'liquidado', 'antecipado'
  const [receivablesMethodFilter, setReceivablesMethodFilter] = useState('todos'); // 'todos', 'credito', 'debito', 'pix', 'dinheiro'
  const [receivablesCustomStart, setReceivablesCustomStart] = useState(startDate);
  const [receivablesCustomEnd, setReceivablesCustomEnd] = useState(endDate);

  // Expenses (Despesas) states
  const [expenseViewMode, setExpenseViewMode] = useState('dia'); // 'dia', 'semana', 'quinzena', 'mes', 'personalizado', 'detalhado'
  const [selectedExpenseDay, setSelectedExpenseDay] = useState('todos');
  const [selectedExpenseWeek, setSelectedExpenseWeek] = useState('todos');
  const [selectedExpenseFortnight, setSelectedExpenseFortnight] = useState('todos');
  const [selectedExpenseMonth, setSelectedExpenseMonth] = useState('todos');
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('todos');
  const [expenseMethodFilter, setExpenseMethodFilter] = useState('todos');
  const [expenseCustomStart, setExpenseCustomStart] = useState(startDate);
  const [expenseCustomEnd, setExpenseCustomEnd] = useState(endDate);

  // Commission sub-period states
  const [selectedCommissionDay, setSelectedCommissionDay] = useState('todos');
  const [selectedCommissionWeek, setSelectedCommissionWeek] = useState('todos');
  const [selectedCommissionFortnight, setSelectedCommissionFortnight] = useState('todos');
  const [selectedCommissionMonth, setSelectedCommissionMonth] = useState('todos');
  const [commissionCustomStart, setCommissionCustomStart] = useState(startDate);
  const [commissionCustomEnd, setCommissionCustomEnd] = useState(endDate);

  // Packages Management states
  const [packageSearch, setPackageSearch] = useState('');
  const [packageStatusFilter, setPackageStatusFilter] = useState('todos'); // 'todos', 'active', 'finished', 'pending_payment'
  const [editingClientPackage, setEditingClientPackage] = useState(null);
  const [editingBalanceForm, setEditingBalanceForm] = useState({});

  // Get data from global context
  const dbTransactions = useMemo(() => globalData.financial_transactions || [], [globalData.financial_transactions]);
  const dbBookings = useMemo(() => globalData.bookings || [], [globalData.bookings]);
  const products = useMemo(() => globalData.products || [], [globalData.products]);
  const salonProducts = useMemo(() => globalData.salon_products || [], [globalData.salon_products]);
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
        feeAnticipation: settings.feeAnticipation ?? 2.50,
        autoAnticipation: settings.autoAnticipation ?? false
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
  const getNetValue = (val, method) => calculateNetValue(val, method, settings);
  const getTransactionFee = (val, method) => calculateTransactionFee(val, method, settings);

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
      const prof = t.professionalId || t.profissional || 'jon';
      const matchesProf = !selectedProfFilter || prof === selectedProfFilter;
      return inDate && matchesProf;
    });
  }, [transactions, startDate, endDate, selectedProfFilter]);

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const inDate = b.date >= startDate && b.date <= endDate;
      const prof = b.profissional || b.professionalId || 'jon';
      const matchesProf = !selectedProfFilter || prof === selectedProfFilter;
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

  // Lista de itens de produtos vendidos para aba de Produtos
  const productSalesList = useMemo(() => {
    const list = [];
    filteredTransactions
      .filter(t => t.type === 'entrada')
      .forEach(t => {
        if (t.productSales && Array.isArray(t.productSales)) {
          t.productSales.forEach((p, idx) => {
            const qty = p.quantity || 0;
            const sellingPrice = p.sellingPrice || 0;
            
            // Match with catalog to get cost price if missing or zero
            const matchedCatalogProduct = products.find(prod => prod.id === p.productId || prod.name === p.name);
            const costPrice = p.costPrice || matchedCatalogProduct?.costPrice || 0;
            
            const faturamento = sellingPrice * qty;
            const custoTotal = costPrice * qty;
            const lucro = faturamento - custoTotal;
            
            list.push({
              id: `${t.id}_${p.productId || idx}`,
              date: t.date,
              clientName: t.clientName || 'Venda Avulsa',
              productName: p.name || 'Produto sem Nome',
              quantity: qty,
              sellingPrice: sellingPrice,
              costPrice: costPrice,
              totalSale: faturamento,
              totalCost: custoTotal,
              profit: lucro
            });
          });
        } else if (t.isProductSale || t.category === 'venda_produto') {
          const faturamento = t.value || 0;
          // Try to match product by name in description
          const matchedCatalogProduct = products.find(prod => 
            t.description && t.description.toLowerCase().includes(prod.name.toLowerCase())
          );
          const costPrice = matchedCatalogProduct?.costPrice || 0;
          const lucro = faturamento - costPrice;
          
          list.push({
            id: t.id,
            date: t.date,
            clientName: t.clientName || 'Venda Avulsa',
            productName: matchedCatalogProduct?.name || t.description || 'Produto',
            quantity: 1,
            sellingPrice: faturamento,
            costPrice: costPrice,
            totalSale: faturamento,
            totalCost: costPrice,
            profit: lucro
          });
        }
      });
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredTransactions, products]);

  // Product cost and profit calculations
  const productCost = useMemo(() => {
    return productSalesList.reduce((sum, item) => sum + item.totalCost, 0);
  }, [productSalesList]);

  const productGrossRevenue = useMemo(() => {
    return productSalesList.reduce((sum, item) => sum + item.totalSale, 0);
  }, [productSalesList]);

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
  

  const totalProductsSold = useMemo(() => {
    return productSalesList.reduce((sum, item) => sum + item.quantity, 0);
  }, [productSalesList]);

  const filteredProductSales = useMemo(() => {
    return productSalesList.filter(item => {
      const term = productSearch.toLowerCase();
      return (
        item.productName.toLowerCase().includes(term) ||
        item.clientName.toLowerCase().includes(term)
      );
    });
  }, [productSalesList, productSearch]);

  // Grupa e consolida atendimentos de clientes por período (combinando serviços e vendas de produtos)
  const detailedAttendanceList = useMemo(() => {
    const list = [];
    const completed = filteredBookings.filter(b => b.status === 'finalizado');

    // Agrupamento chave: clientName_date
    const clientVisitMap = {};

    completed.forEach(b => {
      const key = `${(b.clientName || '').trim().toLowerCase()}_${b.date}`;
      clientVisitMap[key] = {
        date: b.date,
        time: b.time || '00:00',
        clientName: b.clientName || 'Cliente sem Nome',
        clientPhone: b.clientPhone || b.phone || '',
        services: [{ name: b.serviceName || 'Serviço', price: b.servicePrice || 150 }],
        products: [],
        totalValue: b.servicePrice || 150,
        type: 'servico'
      };
    });

    // Mescla as vendas de produtos do productSalesList no mesmo mapa ou cria novas visitas de produto
    productSalesList.forEach(pSale => {
      const key = `${pSale.clientName.trim().toLowerCase()}_${pSale.date}`;
      
      const prodItem = {
        name: pSale.productName,
        quantity: pSale.quantity,
        price: pSale.totalSale
      };

      if (clientVisitMap[key]) {
        clientVisitMap[key].products.push(prodItem);
        clientVisitMap[key].totalValue += pSale.totalSale;
      } else {
        clientVisitMap[key] = {
          date: pSale.date,
          time: '00:00', // Venda avulsa
          clientName: pSale.clientName,
          clientPhone: '',
          services: [],
          products: [prodItem],
          totalValue: pSale.totalSale,
          type: 'produto'
        };
      }
    });

    return Object.values(clientVisitMap).sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
  }, [filteredBookings, productSalesList]);

  // Agrega totais de clientes atendidos, receitas de serviços e produtos por Dia, Semana e Mês
  const attendanceAggregatedStats = useMemo(() => {
    const byDay = {};
    const byWeek = {};
    const byMonth = {};

    detailedAttendanceList.forEach(item => {
      const dateVal = item.date;
      if (!dateVal) return;

      const dateObj = new Date(dateVal + 'T00:00:00');

      // 1. Agrupamento por Dia
      byDay[dateVal] = byDay[dateVal] || { date: dateVal, count: 0, serviceRevenue: 0, productRevenue: 0, totalRevenue: 0 };
      byDay[dateVal].count += (item.services.length > 0 ? 1 : 0);
      byDay[dateVal].serviceRevenue += item.services.reduce((sum, s) => sum + s.price, 0);
      byDay[dateVal].productRevenue += item.products.reduce((sum, p) => sum + p.price, 0);
      byDay[dateVal].totalRevenue += item.totalValue;

      // 2. Agrupamento por Mês
      const monthKey = dateVal.substring(0, 7);
      byMonth[monthKey] = byMonth[monthKey] || { month: monthKey, count: 0, serviceRevenue: 0, productRevenue: 0, totalRevenue: 0 };
      byMonth[monthKey].count += (item.services.length > 0 ? 1 : 0);
      byMonth[monthKey].serviceRevenue += item.services.reduce((sum, s) => sum + s.price, 0);
      byMonth[monthKey].productRevenue += item.products.reduce((sum, p) => sum + p.price, 0);
      byMonth[monthKey].totalRevenue += item.totalValue;

      // 3. Agrupamento por Semana (iniciando na segunda-feira)
      const dayOfWeek = dateObj.getDay();
      const diff = dateObj.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const startOfWeek = new Date(dateObj.setDate(diff));
      const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

      byWeek[startOfWeekStr] = byWeek[startOfWeekStr] || { weekStart: startOfWeekStr, count: 0, serviceRevenue: 0, productRevenue: 0, totalRevenue: 0 };
      byWeek[startOfWeekStr].count += (item.services.length > 0 ? 1 : 0);
      byWeek[startOfWeekStr].serviceRevenue += item.services.reduce((sum, s) => sum + s.price, 0);
      byWeek[startOfWeekStr].productRevenue += item.products.reduce((sum, p) => sum + p.price, 0);
      byWeek[startOfWeekStr].totalRevenue += item.totalValue;
    });

    return {
      days: Object.values(byDay).sort((a, b) => b.date.localeCompare(a.date)),
      weeks: Object.values(byWeek).sort((a, b) => b.weekStart.localeCompare(a.weekStart)),
      months: Object.values(byMonth).sort((a, b) => b.month.localeCompare(a.month))
    };
  }, [detailedAttendanceList]);

  // Agrega dados de comissões por Dia, Semana, Quinzena, Mês e Extrato Detalhado (incluindo retiradas de comissão)
  const commissionAggregatedStats = useMemo(() => {
    const byDay = {};
    const byWeek = {};
    const byFortnight = {};
    const byMonth = {};
    const detailedList = [];
    const withdrawalsDetailedList = [];

    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const weekdayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const weekdayShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    const isWithdrawal = (t) => {
      if (t.type !== 'saida') return false;
      if (t.isCommissionPayout) return true;
      if (t.category === 'Comissão - Repasse / Retirada' || t.category === 'comissao_retirada') return true;
      const desc = (t.description || '').toLowerCase();
      return desc.includes('comiss') || desc.includes('repasse') || desc.includes('retirada de comissão') || desc.includes('retirada de comissao');
    };

    const getBucket = (bucket, key, meta) => {
      if (!bucket[key]) {
        bucket[key] = {
          key,
          ...meta,
          count: 0,
          serviceCount: 0,
          productCount: 0,
          serviceRevenue: 0,
          productRevenue: 0,
          totalRevenue: 0,
          serviceCommission: 0,
          productCommission: 0,
          totalCommission: 0,
          totalWithdrawals: 0,
          pendingCommission: 0,
          professionals: {},
          items: [],
          withdrawals: []
        };
      }
      return bucket[key];
    };

    filteredTransactions.forEach(t => {
      const dateVal = t.date;
      if (!dateVal) return;

      const dateObj = new Date(dateVal + 'T12:00:00');
      const [yearStr, monthStr, dayStr] = dateVal.split('-');
      const dayNum = parseInt(dayStr, 10);
      const monthNum = parseInt(monthStr, 10);
      const yearNum = parseInt(yearStr, 10);
      const wDay = dateObj.getDay();

      const currentAssigned = t.professionalId || t.profissional || 'jon';
      const prof = professionals.find(p => p.id === currentAssigned) || { id: currentAssigned, name: t.professionalName || 'Jon', commission: 50, commissionService: 50, commissionProduct: 10 };

      // Helper to register meta across buckets
      const dayLabel = `${weekdayShort[wDay]}, ${dayStr}/${monthStr}/${yearStr}`;

      const diff = dateObj.getDate() - wDay + (wDay === 0 ? -6 : 1);
      const startOfWeek = new Date(dateObj);
      startOfWeek.setDate(diff);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
      const endOfWeekStr = endOfWeek.toISOString().split('T')[0];
      const weekKey = `${startOfWeekStr}_${endOfWeekStr}`;
      const weekLabel = `Semana de ${startOfWeek.toLocaleDateString('pt-BR')} a ${endOfWeek.toLocaleDateString('pt-BR')}`;

      const isFirstFortnight = dayNum <= 15;
      const fortnightKey = `${yearStr}-${monthStr}-${isFirstFortnight ? 'Q1' : 'Q2'}`;
      const lastDayOfMonth = new Date(yearNum, monthNum, 0).getDate();
      const fortnightSpan = isFirstFortnight 
        ? `01/${monthStr} a 15/${monthStr}/${yearStr}`
        : `16/${monthStr} a ${lastDayOfMonth}/${monthStr}/${yearStr}`;
      const fortnightLabel = `${isFirstFortnight ? '1ª Quinzena' : '2ª Quinzena'} (${monthNames[monthNum - 1]}/${yearStr}) — ${fortnightSpan}`;

      const monthKey = `${yearStr}-${monthStr}`;
      const monthLabel = `${monthNames[monthNum - 1]} de ${yearStr}`;

      const dayBucket = getBucket(byDay, dateVal, { date: dateVal, label: dayLabel, weekday: weekdayNames[wDay], sortKey: dateVal });
      const weekBucket = getBucket(byWeek, weekKey, { weekStart: startOfWeekStr, weekEnd: endOfWeekStr, label: weekLabel, sortKey: startOfWeekStr });
      const fortnightBucket = getBucket(byFortnight, fortnightKey, { fortnightKey, fortnightNumber: isFirstFortnight ? 1 : 2, monthName: monthNames[monthNum - 1], year: yearNum, span: fortnightSpan, label: fortnightLabel, sortKey: `${yearStr}-${monthStr}-${isFirstFortnight ? '01' : '16'}` });
      const monthBucket = getBucket(byMonth, monthKey, { month: monthKey, monthName: monthNames[monthNum - 1], year: yearNum, label: monthLabel, sortKey: monthKey });

      const allBuckets = [dayBucket, weekBucket, fortnightBucket, monthBucket];

      if (t.type === 'entrada') {
        const commServRate = prof.commissionService !== undefined ? prof.commissionService : (prof.commission || 50);
        const commProdRate = prof.commissionProduct !== undefined ? prof.commissionProduct : 10;

        const productVal = t.productSales ? t.productSales.reduce((acc, p) => acc + (Number(p.sellingPrice || 0) * Number(p.quantity || 1)), 0) : 0;
        const isProdSale = t.isProductSale || t.category === 'venda_produto';

        let rawProd = 0;
        let rawServ = 0;

        if (isProdSale) {
          rawProd = Number(t.value || 0);
        } else {
          rawProd = productVal;
          rawServ = Math.max(0, Number(t.value || 0) - productVal);
        }

        const servComm = rawServ * (commServRate / 100);
        const prodComm = rawProd * (commProdRate / 100);
        const totalComm = servComm + prodComm;
        const netVal = getNetValue(t.value, t.paymentMethod);

        const txDetail = {
          id: t.id,
          date: dateVal,
          time: t.time || '00:00',
          clientName: t.clientName || 'Cliente',
          description: t.description || 'Atendimento',
          paymentMethod: t.paymentMethod || 'Pix',
          grossValue: Number(t.value || 0),
          netValue: netVal,
          profId: prof.id,
          profName: prof.name || 'Jon',
          commServRate,
          commProdRate,
          rawServ,
          rawProd,
          servComm,
          prodComm,
          totalComm,
          isService: rawServ > 0,
          isProduct: rawProd > 0
        };

        detailedList.push(txDetail);

        allBuckets.forEach(b => {
          b.count += 1;
          if (rawServ > 0) b.serviceCount += 1;
          if (rawProd > 0) b.productCount += 1;
          b.serviceRevenue += rawServ;
          b.productRevenue += rawProd;
          b.totalRevenue += (rawServ + rawProd);
          b.serviceCommission += servComm;
          b.productCommission += prodComm;
          b.totalCommission += totalComm;
          b.pendingCommission = Math.max(0, b.totalCommission - b.totalWithdrawals);
          b.items.push(txDetail);

          if (!b.professionals[prof.id]) {
            b.professionals[prof.id] = {
              id: prof.id,
              name: prof.name,
              serviceRevenue: 0,
              productRevenue: 0,
              serviceCommission: 0,
              productCommission: 0,
              totalCommission: 0,
              totalWithdrawals: 0,
              pendingCommission: 0,
              count: 0
            };
          }
          const pEntry = b.professionals[prof.id];
          pEntry.count += 1;
          pEntry.serviceRevenue += rawServ;
          pEntry.productRevenue += rawProd;
          pEntry.serviceCommission += servComm;
          pEntry.productCommission += prodComm;
          pEntry.totalCommission += totalComm;
          pEntry.pendingCommission = Math.max(0, pEntry.totalCommission - pEntry.totalWithdrawals);
        });
      } else if (isWithdrawal(t)) {
        const withdrawalDetail = {
          id: t.id,
          date: dateVal,
          time: t.time || '00:00',
          profId: prof.id,
          profName: prof.name || 'Jon',
          value: Number(t.value || 0),
          paymentMethod: t.paymentMethod || 'Pix',
          description: t.description || 'Retirada de Comissão',
          notes: t.notes || ''
        };

        withdrawalsDetailedList.push(withdrawalDetail);

        allBuckets.forEach(b => {
          b.totalWithdrawals += Number(t.value || 0);
          b.pendingCommission = Math.max(0, b.totalCommission - b.totalWithdrawals);
          b.withdrawals.push(withdrawalDetail);

          if (!b.professionals[prof.id]) {
            b.professionals[prof.id] = {
              id: prof.id,
              name: prof.name,
              serviceRevenue: 0,
              productRevenue: 0,
              serviceCommission: 0,
              productCommission: 0,
              totalCommission: 0,
              totalWithdrawals: 0,
              pendingCommission: 0,
              count: 0
            };
          }
          const pEntry = b.professionals[prof.id];
          pEntry.totalWithdrawals += Number(t.value || 0);
          pEntry.pendingCommission = Math.max(0, pEntry.totalCommission - pEntry.totalWithdrawals);
        });
      }
    });

    // Custom Period
    const customList = detailedList.filter(item => {
      if (!commissionCustomStart && !commissionCustomEnd) return true;
      if (commissionCustomStart && item.date < commissionCustomStart) return false;
      if (commissionCustomEnd && item.date > commissionCustomEnd) return false;
      return true;
    });

    const customWithdrawals = withdrawalsDetailedList.filter(item => {
      if (!commissionCustomStart && !commissionCustomEnd) return true;
      if (commissionCustomStart && item.date < commissionCustomStart) return false;
      if (commissionCustomEnd && item.date > commissionCustomEnd) return false;
      return true;
    });

    const customBucket = {
      label: `Período de ${commissionCustomStart ? commissionCustomStart.split('-').reverse().join('/') : 'Início'} a ${commissionCustomEnd ? commissionCustomEnd.split('-').reverse().join('/') : 'Fim'}`,
      count: customList.length,
      serviceCount: customList.filter(i => i.isService).length,
      productCount: customList.filter(i => i.isProduct).length,
      serviceRevenue: customList.reduce((s, i) => s + i.rawServ, 0),
      productRevenue: customList.reduce((s, i) => s + i.rawProd, 0),
      totalRevenue: customList.reduce((s, i) => s + i.rawServ + i.rawProd, 0),
      serviceCommission: customList.reduce((s, i) => s + i.servComm, 0),
      productCommission: customList.reduce((s, i) => s + i.prodComm, 0),
      totalCommission: customList.reduce((s, i) => s + i.totalComm, 0),
      totalWithdrawals: customWithdrawals.reduce((s, i) => s + Number(i.value || 0), 0),
      pendingCommission: 0,
      professionals: {},
      items: customList,
      withdrawals: customWithdrawals
    };
    customBucket.pendingCommission = Math.max(0, customBucket.totalCommission - customBucket.totalWithdrawals);

    customList.forEach(item => {
      if (!customBucket.professionals[item.profId]) {
        customBucket.professionals[item.profId] = {
          id: item.profId,
          name: item.profName,
          serviceRevenue: 0,
          productRevenue: 0,
          serviceCommission: 0,
          productCommission: 0,
          totalCommission: 0,
          totalWithdrawals: 0,
          pendingCommission: 0,
          count: 0
        };
      }
      const p = customBucket.professionals[item.profId];
      p.count += 1;
      p.serviceRevenue += item.rawServ;
      p.productRevenue += item.rawProd;
      p.serviceCommission += item.servComm;
      p.productCommission += item.prodComm;
      p.totalCommission += item.totalComm;
      p.pendingCommission = Math.max(0, p.totalCommission - p.totalWithdrawals);
    });

    customWithdrawals.forEach(w => {
      if (!customBucket.professionals[w.profId]) {
        customBucket.professionals[w.profId] = {
          id: w.profId,
          name: w.profName,
          serviceRevenue: 0,
          productRevenue: 0,
          serviceCommission: 0,
          productCommission: 0,
          totalCommission: 0,
          totalWithdrawals: 0,
          pendingCommission: 0,
          count: 0
        };
      }
      const p = customBucket.professionals[w.profId];
      p.totalWithdrawals += Number(w.value || 0);
      p.pendingCommission = Math.max(0, p.totalCommission - p.totalWithdrawals);
    });

    return {
      days: Object.values(byDay).sort((a, b) => b.sortKey.localeCompare(a.sortKey)),
      weeks: Object.values(byWeek).sort((a, b) => b.sortKey.localeCompare(a.sortKey)),
      fortnights: Object.values(byFortnight).sort((a, b) => b.sortKey.localeCompare(a.sortKey)),
      months: Object.values(byMonth).sort((a, b) => b.sortKey.localeCompare(a.sortKey)),
      customPeriod: customBucket,
      detailedList: detailedList.sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time)),
      withdrawalsDetailedList: withdrawalsDetailedList.sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))
    };
  }, [filteredTransactions, professionals, commissionCustomStart, commissionCustomEnd]);

  const commissionKPIs = useMemo(() => {
    let targetItems = commissionAggregatedStats.detailedList;
    let targetWithdrawals = commissionAggregatedStats.withdrawalsDetailedList;
    let label = 'Todos os Lançamentos';

    if (commissionViewMode === 'dia') {
      if (selectedCommissionDay !== 'todos') {
        const match = commissionAggregatedStats.days.find(d => d.date === selectedCommissionDay);
        if (match) {
          targetItems = match.items || [];
          targetWithdrawals = match.withdrawals || [];
          label = match.label;
        }
      } else {
        label = `Total de ${commissionAggregatedStats.days.length} dia(s)`;
      }
    } else if (commissionViewMode === 'semana') {
      if (selectedCommissionWeek !== 'todos') {
        const match = commissionAggregatedStats.weeks.find(w => w.sortKey === selectedCommissionWeek || w.key === selectedCommissionWeek);
        if (match) {
          targetItems = match.items || [];
          targetWithdrawals = match.withdrawals || [];
          label = match.label;
        }
      } else {
        label = `Total de ${commissionAggregatedStats.weeks.length} semana(s)`;
      }
    } else if (commissionViewMode === 'quinzena') {
      if (selectedCommissionFortnight !== 'todos') {
        const match = commissionAggregatedStats.fortnights.find(f => f.fortnightKey === selectedCommissionFortnight);
        if (match) {
          targetItems = match.items || [];
          targetWithdrawals = match.withdrawals || [];
          label = match.label;
        }
      } else {
        label = `Total de ${commissionAggregatedStats.fortnights.length} quinzena(s)`;
      }
    } else if (commissionViewMode === 'mes') {
      if (selectedCommissionMonth !== 'todos') {
        const match = commissionAggregatedStats.months.find(m => m.month === selectedCommissionMonth);
        if (match) {
          targetItems = match.items || [];
          targetWithdrawals = match.withdrawals || [];
          label = match.label;
        }
      } else {
        label = `Total de ${commissionAggregatedStats.months.length} mês(es)`;
      }
    } else if (commissionViewMode === 'personalizado') {
      targetItems = commissionAggregatedStats.customPeriod.items;
      targetWithdrawals = commissionAggregatedStats.customPeriod.withdrawals;
      label = commissionAggregatedStats.customPeriod.label;
    } else {
      label = 'Extrato Detalhado';
    }

    let totalCommission = 0;
    let serviceCommission = 0;
    let productCommission = 0;
    let totalServicesRevenue = 0;
    let totalProductsRevenue = 0;
    let totalAppointments = 0;

    const profsMap = {};
    professionals.forEach(p => {
      profsMap[p.id] = {
        id: p.id,
        name: p.name,
        serviceRevenue: 0,
        productRevenue: 0,
        serviceCommission: 0,
        productCommission: 0,
        totalCommission: 0,
        totalWithdrawals: 0,
        pendingCommission: 0,
        count: 0
      };
    });

    targetItems.forEach(item => {
      totalCommission += item.totalComm;
      serviceCommission += item.servComm;
      productCommission += item.prodComm;
      totalServicesRevenue += item.rawServ;
      totalProductsRevenue += item.rawProd;
      totalAppointments += 1;

      if (profsMap[item.profId]) {
        const p = profsMap[item.profId];
        p.count += 1;
        p.serviceRevenue += item.rawServ;
        p.productRevenue += item.rawProd;
        p.serviceCommission += item.servComm;
        p.productCommission += item.prodComm;
        p.totalCommission += item.totalComm;
      }
    });

    let totalWithdrawals = 0;
    targetWithdrawals.forEach(w => {
      const wVal = Number(w.value || 0);
      totalWithdrawals += wVal;
      if (profsMap[w.profId]) {
        profsMap[w.profId].totalWithdrawals += wVal;
      }
    });

    Object.values(profsMap).forEach(p => {
      p.pendingCommission = Math.max(0, p.totalCommission - p.totalWithdrawals);
    });

    const pendingPayout = Math.max(0, totalCommission - totalWithdrawals);

    return {
      totalCommission,
      serviceCommission,
      productCommission,
      totalServicesRevenue,
      totalProductsRevenue,
      totalAppointments,
      totalWithdrawals,
      withdrawalCount: targetWithdrawals.length,
      pendingPayout,
      label,
      professionalsMap: profsMap,
      items: targetItems,
      withdrawalsList: targetWithdrawals
    };
  }, [
    commissionViewMode,
    selectedCommissionDay,
    selectedCommissionWeek,
    selectedCommissionFortnight,
    selectedCommissionMonth,
    commissionAggregatedStats,
    professionals
  ]);

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

  // Aggregate used salon products (insumos) and extra costs
  const insumosUsageStats = useMemo(() => {
    const stats = {};
    let totalInsumosCost = 0;
    let totalManualExtraCost = 0;
    const history = [];

    filteredTransactions.forEach(t => {
      let hasInsumos = false;
      
      // Check if this transaction has usedProducts
      if (t.usedProducts && Array.isArray(t.usedProducts)) {
        t.usedProducts.forEach(p => {
          const key = p.productId || p.name;
          if (!stats[key]) {
            stats[key] = {
              name: p.name,
              quantity: 0,
              totalCost: 0
            };
          }
          stats[key].quantity += p.quantity || 0;
          stats[key].totalCost += (p.price || 0) * (p.quantity || 0);
          totalInsumosCost += (p.price || 0) * (p.quantity || 0);
          hasInsumos = true;
        });
      }
      
      // Also look for manual extraCost
      if (t.extraCost && Number(t.extraCost) > 0) {
        totalManualExtraCost += Number(t.extraCost);
        hasInsumos = true;
      } else if (t.type === 'saida' && t.description && t.description.includes('Extra Manual: R$')) {
        const match = t.description.match(/Extra Manual: R\$\s*([\d.]+)/);
        if (match) {
          totalManualExtraCost += Number(match[1]);
          hasInsumos = true;
        }
      }
      
      if (hasInsumos || (t.type === 'saida' && t.description && t.description.includes('Insumos:'))) {
        history.push({
          id: t.id,
          date: t.date,
          clientName: t.clientName || 'Cliente',
          description: t.description,
          value: t.value,
          usedProducts: t.usedProducts || [],
          extraCost: t.extraCost || 0
        });
      }
    });

    return {
      products: Object.values(stats).sort((a, b) => b.totalCost - a.totalCost),
      totalInsumosCost,
      totalManualExtraCost,
      history
    };
  }, [filteredTransactions]);

  // Schedule of all receivables (Previsão de Recebimentos por Vencimento: 30/60/90d crédito, D+1 débito, D+0 pix)
  const fullReceivablesSchedule = useMemo(() => {
    return calculateReceivablesSchedule(transactions, settings).filter(item => {
      if (!selectedProfFilter) return true;
      return item.professionalId === selectedProfFilter;
    });
  }, [transactions, settings, selectedProfFilter]);

  const filteredReceivablesSchedule = useMemo(() => {
    return fullReceivablesSchedule.filter(item => {
      const term = receivablesSearch.toLowerCase();
      const matchesSearch = 
        (item.clientName || '').toLowerCase().includes(term) ||
        (item.description || '').toLowerCase().includes(term) ||
        (item.paymentMethod || '').toLowerCase().includes(term);

      const matchesStatus = receivablesStatusFilter === 'todos' || item.status === receivablesStatusFilter;

      let matchesMethod = true;
      if (receivablesMethodFilter !== 'todos') {
        const pm = (item.paymentMethod || '').toLowerCase();
        if (receivablesMethodFilter === 'credito') matchesMethod = pm.includes('crédito') || pm.includes('credito');
        else if (receivablesMethodFilter === 'debito') matchesMethod = pm.includes('débito') || pm.includes('debito');
        else if (receivablesMethodFilter === 'pix') matchesMethod = pm.includes('pix');
        else if (receivablesMethodFilter === 'dinheiro') matchesMethod = pm.includes('dinheiro');
      }

      return matchesSearch && matchesStatus && matchesMethod;
    });
  }, [fullReceivablesSchedule, receivablesSearch, receivablesStatusFilter, receivablesMethodFilter]);

  // Agrega recebíveis por Dia, Semana, Quinzena e Mês
  const receivablesAggregatedStats = useMemo(() => {
    const byDay = {};
    const byWeek = {};
    const byFortnight = {};
    const byMonth = {};

    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const weekdayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const weekdayShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    filteredReceivablesSchedule.forEach(item => {
      const dueDateVal = item.dueDate;
      if (!dueDateVal) return;

      const dateObj = new Date(dueDateVal + 'T00:00:00');
      const [yearStr, monthStr, dayStr] = dueDateVal.split('-');
      const dayNum = parseInt(dayStr, 10);
      const monthNum = parseInt(monthStr, 10);
      const yearNum = parseInt(yearStr, 10);

      const updateBucket = (bucket, key, meta) => {
        if (!bucket[key]) {
          bucket[key] = {
            key,
            ...meta,
            count: 0,
            grossValue: 0,
            feeValue: 0,
            netValue: 0,
            liquidNet: 0,
            pendingNet: 0,
            methods: {},
            statuses: { liquidado: 0, a_receber: 0, antecipado: 0 },
            items: []
          };
        }
        const b = bucket[key];
        b.count += 1;
        b.grossValue += Number(item.grossValue || 0);
        b.feeValue += Number(item.feeValue || 0);
        b.netValue += Number(item.netValue || 0);

        if (item.status === 'a_receber') {
          b.pendingNet += Number(item.netValue || 0);
          b.statuses.a_receber += 1;
        } else if (item.status === 'antecipado') {
          b.liquidNet += Number(item.netValue || 0);
          b.statuses.antecipado += 1;
        } else {
          b.liquidNet += Number(item.netValue || 0);
          b.statuses.liquidado += 1;
        }

        const m = item.paymentMethod || 'Outro';
        b.methods[m] = (b.methods[m] || 0) + Number(item.netValue || 0);
        b.items.push(item);
      };

      // 1. Por Dia
      const wDay = dateObj.getDay();
      const dayLabel = `${weekdayShort[wDay]}, ${dayStr}/${monthStr}/${yearStr}`;
      updateBucket(byDay, dueDateVal, {
        date: dueDateVal,
        label: dayLabel,
        weekday: weekdayNames[wDay],
        sortKey: dueDateVal
      });

      // 2. Por Semana (Segunda a Domingo)
      const diff = dateObj.getDate() - wDay + (wDay === 0 ? -6 : 1);
      const startOfWeek = new Date(dateObj);
      startOfWeek.setDate(diff);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
      const endOfWeekStr = endOfWeek.toISOString().split('T')[0];
      const weekKey = `${startOfWeekStr}_${endOfWeekStr}`;
      const weekLabel = `Semana de ${startOfWeek.toLocaleDateString('pt-BR')} a ${endOfWeek.toLocaleDateString('pt-BR')}`;
      updateBucket(byWeek, weekKey, {
        weekStart: startOfWeekStr,
        weekEnd: endOfWeekStr,
        label: weekLabel,
        sortKey: startOfWeekStr
      });

      // 3. Por Quinzena (1ª Quinzena: 01 a 15 | 2ª Quinzena: 16 ao último dia)
      const isFirstFortnight = dayNum <= 15;
      const fortnightKey = `${yearStr}-${monthStr}-${isFirstFortnight ? 'Q1' : 'Q2'}`;
      const lastDayOfMonth = new Date(yearNum, monthNum, 0).getDate();
      const fortnightSpan = isFirstFortnight 
        ? `01/${monthStr} a 15/${monthStr}/${yearStr}`
        : `16/${monthStr} a ${lastDayOfMonth}/${monthStr}/${yearStr}`;
      const fortnightLabel = `${isFirstFortnight ? '1ª Quinzena' : '2ª Quinzena'} (${monthNames[monthNum - 1]}/${yearStr}) — ${fortnightSpan}`;
      updateBucket(byFortnight, fortnightKey, {
        fortnightKey,
        fortnightNumber: isFirstFortnight ? 1 : 2,
        monthName: monthNames[monthNum - 1],
        year: yearNum,
        span: fortnightSpan,
        label: fortnightLabel,
        sortKey: `${yearStr}-${monthStr}-${isFirstFortnight ? '01' : '16'}`
      });

      // 4. Por Mês
      const monthKey = `${yearStr}-${monthStr}`;
      const monthLabel = `${monthNames[monthNum - 1]} de ${yearStr}`;
      updateBucket(byMonth, monthKey, {
        month: monthKey,
        monthName: monthNames[monthNum - 1],
        year: yearNum,
        label: monthLabel,
        sortKey: monthKey
      });
    });

    // Custom Period for Receivables
    const customReceivablesList = filteredReceivablesSchedule.filter(item => {
      if (!receivablesCustomStart && !receivablesCustomEnd) return true;
      if (receivablesCustomStart && item.dueDate < receivablesCustomStart) return false;
      if (receivablesCustomEnd && item.dueDate > receivablesCustomEnd) return false;
      return true;
    });

    const customReceivablesBucket = {
      label: `Período de ${receivablesCustomStart ? receivablesCustomStart.split('-').reverse().join('/') : 'Início'} a ${receivablesCustomEnd ? receivablesCustomEnd.split('-').reverse().join('/') : 'Fim'}`,
      count: customReceivablesList.length,
      grossValue: customReceivablesList.reduce((s, i) => s + (i.grossValue || 0), 0),
      feeValue: customReceivablesList.reduce((s, i) => s + (i.feeValue || 0), 0),
      netValue: customReceivablesList.reduce((s, i) => s + (i.netValue || 0), 0),
      liquidNet: customReceivablesList.reduce((s, i) => s + (i.status !== 'a_receber' ? (i.netValue || 0) : 0), 0),
      pendingNet: customReceivablesList.reduce((s, i) => s + (i.status === 'a_receber' ? (i.netValue || 0) : 0), 0),
      methods: {},
      items: customReceivablesList
    };
    customReceivablesList.forEach(item => {
      const m = item.paymentMethod || 'Outro';
      customReceivablesBucket.methods[m] = (customReceivablesBucket.methods[m] || 0) + Number(item.netValue || 0);
    });

    return {
      days: Object.values(byDay).sort((a, b) => b.sortKey.localeCompare(a.sortKey)),
      weeks: Object.values(byWeek).sort((a, b) => b.sortKey.localeCompare(a.sortKey)),
      fortnights: Object.values(byFortnight).sort((a, b) => b.sortKey.localeCompare(a.sortKey)),
      months: Object.values(byMonth).sort((a, b) => b.sortKey.localeCompare(a.sortKey)),
      customPeriod: customReceivablesBucket
    };
  }, [filteredReceivablesSchedule, receivablesCustomStart, receivablesCustomEnd]);

  const receivablesKPIs = useMemo(() => {
    let targetItems = filteredReceivablesSchedule;
    let label = 'Todos os Lançamentos';

    if (receivablesViewMode === 'dia') {
      if (selectedReceivablesDay !== 'todos') {
        const match = receivablesAggregatedStats.days.find(d => d.date === selectedReceivablesDay);
        if (match) {
          targetItems = match.items || [];
          label = match.label;
        }
      } else {
        label = `Total de ${receivablesAggregatedStats.days.length} dia(s)`;
      }
    } else if (receivablesViewMode === 'semana') {
      if (selectedReceivablesWeek !== 'todos') {
        const match = receivablesAggregatedStats.weeks.find(w => w.sortKey === selectedReceivablesWeek || w.key === selectedReceivablesWeek);
        if (match) {
          targetItems = match.items || [];
          label = match.label;
        }
      } else {
        label = `Total de ${receivablesAggregatedStats.weeks.length} semana(s)`;
      }
    } else if (receivablesViewMode === 'quinzena') {
      if (selectedReceivablesFortnight !== 'todos') {
        const match = receivablesAggregatedStats.fortnights.find(f => f.fortnightKey === selectedReceivablesFortnight);
        if (match) {
          targetItems = match.items || [];
          label = match.label;
        }
      } else {
        label = `Total de ${receivablesAggregatedStats.fortnights.length} quinzena(s)`;
      }
    } else if (receivablesViewMode === 'mes') {
      if (selectedReceivablesMonth !== 'todos') {
        const match = receivablesAggregatedStats.months.find(m => m.month === selectedReceivablesMonth);
        if (match) {
          targetItems = match.items || [];
          label = match.label;
        }
      } else {
        label = `Total de ${receivablesAggregatedStats.months.length} mês(es)`;
      }
    } else if (receivablesViewMode === 'personalizado') {
      targetItems = receivablesAggregatedStats.customPeriod.items;
      label = receivablesAggregatedStats.customPeriod.label;
    } else {
      label = 'Extrato Detalhado';
    }

    let pendingNet = 0;
    let liquidNet = 0;
    let totalFees = 0;
    let totalGross = 0;
    let totalNet = 0;
    let count = 0;

    targetItems.forEach(item => {
      count += 1;
      totalGross += Number(item.grossValue || 0);
      totalFees += Number(item.feeValue || 0);
      totalNet += Number(item.netValue || 0);
      if (item.status === 'a_receber') {
        pendingNet += Number(item.netValue || 0);
      } else {
        liquidNet += Number(item.netValue || 0);
      }
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const in30DaysStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    let next30DaysNet = 0;
    filteredReceivablesSchedule.forEach(item => {
      if (item.status === 'a_receber' && item.dueDate >= todayStr && item.dueDate <= in30DaysStr) {
        next30DaysNet += Number(item.netValue || 0);
      }
    });

    return {
      pendingNet,
      liquidNet,
      totalFees,
      totalGross,
      totalNet,
      count,
      next30DaysNet,
      label,
      items: targetItems
    };
  }, [
    receivablesViewMode,
    selectedReceivablesDay,
    selectedReceivablesWeek,
    selectedReceivablesFortnight,
    selectedReceivablesMonth,
    filteredReceivablesSchedule,
    receivablesAggregatedStats
  ]);

  // Agrega dados de despesas por Dia, Semana, Quinzena, Mês, Período Personalizado e Extrato Detalhado
  const expenseAggregatedStats = useMemo(() => {
    const byDay = {};
    const byWeek = {};
    const byFortnight = {};
    const byMonth = {};
    const categoryTotals = {};
    const methodTotals = {};

    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const weekdayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const weekdayShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    // Base filtered expenses
    const baseExpenses = filteredTransactions.filter(t => {
      if (t.type !== 'saida') return false;
      const term = expenseSearch.toLowerCase();
      const matchesSearch = !term ||
        (t.description || '').toLowerCase().includes(term) ||
        (t.category || '').toLowerCase().includes(term) ||
        (t.clientName || '').toLowerCase().includes(term) ||
        (t.paymentMethod || '').toLowerCase().includes(term);

      const matchesCat = expenseCategoryFilter === 'todos' || t.category === expenseCategoryFilter;
      const matchesMethod = expenseMethodFilter === 'todos' || (t.paymentMethod || '').includes(expenseMethodFilter);

      return matchesSearch && matchesCat && matchesMethod;
    });

    baseExpenses.forEach(t => {
      const dateVal = t.date;
      if (!dateVal) return;

      const dateObj = new Date(dateVal + 'T00:00:00');
      const [yearStr, monthStr, dayStr] = dateVal.split('-');
      const dayNum = parseInt(dayStr, 10);
      const monthNum = parseInt(monthStr, 10);
      const yearNum = parseInt(yearStr, 10);

      const val = Number(t.value || 0);
      const cat = t.category || 'Outros';
      const met = t.paymentMethod || 'Dinheiro';

      // Totals
      categoryTotals[cat] = (categoryTotals[cat] || 0) + val;
      methodTotals[met] = (methodTotals[met] || 0) + val;

      const updateBucket = (bucket, key, meta) => {
        if (!bucket[key]) {
          bucket[key] = {
            key,
            ...meta,
            count: 0,
            totalValue: 0,
            categories: {},
            methods: {},
            items: []
          };
        }
        const b = bucket[key];
        b.count += 1;
        b.totalValue += val;
        b.categories[cat] = (b.categories[cat] || 0) + val;
        b.methods[met] = (b.methods[met] || 0) + val;
        b.items.push(t);
      };

      // 1. Por Dia
      const wDay = dateObj.getDay();
      const dayLabel = `${weekdayShort[wDay]}, ${dayStr}/${monthStr}/${yearStr}`;
      updateBucket(byDay, dateVal, {
        date: dateVal,
        label: dayLabel,
        weekday: weekdayNames[wDay],
        sortKey: dateVal
      });

      // 2. Por Semana
      const diff = dateObj.getDate() - wDay + (wDay === 0 ? -6 : 1);
      const startOfWeek = new Date(dateObj);
      startOfWeek.setDate(diff);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
      const endOfWeekStr = endOfWeek.toISOString().split('T')[0];
      const weekKey = `${startOfWeekStr}_${endOfWeekStr}`;
      const weekLabel = `Semana de ${startOfWeek.toLocaleDateString('pt-BR')} a ${endOfWeek.toLocaleDateString('pt-BR')}`;
      updateBucket(byWeek, weekKey, {
        weekStart: startOfWeekStr,
        weekEnd: endOfWeekStr,
        label: weekLabel,
        sortKey: startOfWeekStr
      });

      // 3. Por Quinzena
      const isFirstFortnight = dayNum <= 15;
      const fortnightKey = `${yearStr}-${monthStr}-${isFirstFortnight ? 'Q1' : 'Q2'}`;
      const lastDayOfMonth = new Date(yearNum, monthNum, 0).getDate();
      const fortnightSpan = isFirstFortnight 
        ? `01/${monthStr} a 15/${monthStr}/${yearStr}`
        : `16/${monthStr} a ${lastDayOfMonth}/${monthStr}/${yearStr}`;
      const fortnightLabel = `${isFirstFortnight ? '1ª Quinzena' : '2ª Quinzena'} (${monthNames[monthNum - 1]}/${yearStr}) — ${fortnightSpan}`;
      updateBucket(byFortnight, fortnightKey, {
        fortnightKey,
        fortnightNumber: isFirstFortnight ? 1 : 2,
        monthName: monthNames[monthNum - 1],
        year: yearNum,
        span: fortnightSpan,
        label: fortnightLabel,
        sortKey: `${yearStr}-${monthStr}-${isFirstFortnight ? '01' : '16'}`
      });

      // 4. Por Mês
      const monthKey = `${yearStr}-${monthStr}`;
      const monthLabel = `${monthNames[monthNum - 1]} de ${yearStr}`;
      updateBucket(byMonth, monthKey, {
        month: monthKey,
        monthName: monthNames[monthNum - 1],
        year: yearNum,
        label: monthLabel,
        sortKey: monthKey
      });
    });

    // Custom Period
    const customList = baseExpenses.filter(item => {
      if (!expenseCustomStart && !expenseCustomEnd) return true;
      if (expenseCustomStart && item.date < expenseCustomStart) return false;
      if (expenseCustomEnd && item.date > expenseCustomEnd) return false;
      return true;
    });

    const customBucket = {
      label: `Período de ${expenseCustomStart ? expenseCustomStart.split('-').reverse().join('/') : 'Início'} a ${expenseCustomEnd ? expenseCustomEnd.split('-').reverse().join('/') : 'Fim'}`,
      count: customList.length,
      totalValue: customList.reduce((s, i) => s + Number(i.value || 0), 0),
      categories: {},
      methods: {},
      items: customList
    };
    customList.forEach(t => {
      const val = Number(t.value || 0);
      const cat = t.category || 'Outros';
      const met = t.paymentMethod || 'Dinheiro';
      customBucket.categories[cat] = (customBucket.categories[cat] || 0) + val;
      customBucket.methods[met] = (customBucket.methods[met] || 0) + val;
    });

    const totalExpVal = baseExpenses.reduce((s, t) => s + Number(t.value || 0), 0);
    const categoryBreakdown = Object.entries(categoryTotals).map(([name, val]) => ({
      name,
      value: val,
      percentage: totalExpVal > 0 ? (val / totalExpVal) * 100 : 0
    })).sort((a, b) => b.value - a.value);

    return {
      days: Object.values(byDay).sort((a, b) => b.sortKey.localeCompare(a.sortKey)),
      weeks: Object.values(byWeek).sort((a, b) => b.sortKey.localeCompare(a.sortKey)),
      fortnights: Object.values(byFortnight).sort((a, b) => b.sortKey.localeCompare(a.sortKey)),
      months: Object.values(byMonth).sort((a, b) => b.sortKey.localeCompare(a.sortKey)),
      customPeriod: customBucket,
      detailedList: [...baseExpenses].sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.time || '').localeCompare(a.time || '')),
      categoryBreakdown,
      totalExpenses: totalExpVal,
      count: baseExpenses.length
    };
  }, [filteredTransactions, expenseSearch, expenseCategoryFilter, expenseMethodFilter, expenseCustomStart, expenseCustomEnd]);

  const expenseKPIs = useMemo(() => {
    let targetItems = expenseAggregatedStats.detailedList;
    let label = 'Todos os Lançamentos';
    let daysCount = expenseAggregatedStats.days.length;

    if (expenseViewMode === 'dia') {
      if (selectedExpenseDay !== 'todos') {
        const match = expenseAggregatedStats.days.find(d => d.date === selectedExpenseDay);
        if (match) {
          targetItems = match.items || [];
          label = match.label;
          daysCount = 1;
        }
      } else {
        label = `Total de ${expenseAggregatedStats.days.length} dia(s)`;
      }
    } else if (expenseViewMode === 'semana') {
      if (selectedExpenseWeek !== 'todos') {
        const match = expenseAggregatedStats.weeks.find(w => w.sortKey === selectedExpenseWeek || w.key === selectedExpenseWeek);
        if (match) {
          targetItems = match.items || [];
          label = match.label;
          daysCount = 7;
        }
      } else {
        label = `Total de ${expenseAggregatedStats.weeks.length} semana(s)`;
      }
    } else if (expenseViewMode === 'quinzena') {
      if (selectedExpenseFortnight !== 'todos') {
        const match = expenseAggregatedStats.fortnights.find(f => f.fortnightKey === selectedExpenseFortnight);
        if (match) {
          targetItems = match.items || [];
          label = match.label;
          daysCount = 15;
        }
      } else {
        label = `Total de ${expenseAggregatedStats.fortnights.length} quinzena(s)`;
      }
    } else if (expenseViewMode === 'mes') {
      if (selectedExpenseMonth !== 'todos') {
        const match = expenseAggregatedStats.months.find(m => m.month === selectedExpenseMonth);
        if (match) {
          targetItems = match.items || [];
          label = match.label;
          daysCount = 30;
        }
      } else {
        label = `Total de ${expenseAggregatedStats.months.length} mês(es)`;
      }
    } else if (expenseViewMode === 'personalizado') {
      targetItems = expenseAggregatedStats.customPeriod.items;
      label = expenseAggregatedStats.customPeriod.label;
    } else {
      label = 'Extrato Detalhado';
    }

    let totalExpenses = 0;
    const catMap = {};

    targetItems.forEach(t => {
      const val = Number(t.value || 0);
      totalExpenses += val;
      const cat = t.category || 'Outros';
      catMap[cat] = (catMap[cat] || 0) + val;
    });

    const categoryBreakdown = Object.entries(catMap).map(([name, val]) => ({
      name,
      value: val,
      percentage: totalExpenses > 0 ? (val / totalExpenses) * 100 : 0
    })).sort((a, b) => b.value - a.value);

    const topCategory = categoryBreakdown[0] 
      ? { name: `R$ ${formatCurrencyBRL(categoryBreakdown[0].value)}`, sub: `${categoryBreakdown[0].name} (${categoryBreakdown[0].percentage.toFixed(1)}%)` }
      : { name: 'R$ 0,00', sub: 'Nenhuma despesa' };

    const dailyAverage = daysCount > 0 ? totalExpenses / daysCount : totalExpenses;

    return {
      totalExpenses,
      count: targetItems.length,
      dailyAverage,
      topCategory,
      categoryBreakdown,
      label,
      items: targetItems
    };
  }, [
    expenseViewMode,
    selectedExpenseDay,
    selectedExpenseWeek,
    selectedExpenseFortnight,
    selectedExpenseMonth,
    expenseAggregatedStats
  ]);



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
      feeAnticipation: Number(feesForm.feeAnticipation),
      autoAnticipation: Boolean(feesForm.autoAnticipation)
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

  // Add Commission Withdrawal / Payout
  const handleSaveCommissionWithdrawal = async (e) => {
    e.preventDefault();
    const val = Number(commissionWithdrawalForm.value);
    if (!val || val <= 0) {
      alert('Por favor, informe um valor válido para a retirada.');
      return;
    }

    const prof = professionals.find(p => p.id === commissionWithdrawalForm.professionalId) || {
      id: commissionWithdrawalForm.professionalId || 'jon',
      name: 'Jon'
    };

    const payload = {
      type: 'saida',
      category: 'Comissão - Repasse / Retirada',
      isCommissionPayout: true,
      professionalId: prof.id,
      professionalName: prof.name,
      value: val,
      date: commissionWithdrawalForm.date || new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      paymentMethod: commissionWithdrawalForm.paymentMethod || 'Pix',
      description: `Retirada de Comissão - ${prof.name} (${commissionWithdrawalForm.motive || 'Pagamento'})`,
      notes: commissionWithdrawalForm.notes || '',
      createdAt: new Date().toISOString()
    };

    try {
      if (isDemoMode) {
        const local = JSON.parse(localStorage.getItem('demo_financial') || '[]');
        const updated = [{ id: 'tx_' + Date.now(), ...payload }, ...local];
        localStorage.setItem('demo_financial', JSON.stringify(updated));
        setGlobalData(prev => ({ ...prev, financial_transactions: updated }));
      } else {
        const docRef = await addDoc(collection(db, 'financial_transactions'), payload);
        const updated = [{ id: docRef.id, ...payload }, ...(globalData.financial_transactions || [])];
        setGlobalData(prev => ({ ...prev, financial_transactions: updated }));
      }

      setShowCommissionWithdrawalModal(false);
      setCommissionWithdrawalForm({
        professionalId: 'jon',
        value: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Pix',
        motive: 'Pagamento de Comissão',
        notes: ''
      });
      alert(`Retirada de R$ ${formatCurrencyBRL(val)} registrada com sucesso para ${prof.name}!`);
    } catch (err) {
      console.error('Erro ao registrar retirada de comissão:', err);
      alert('Erro ao registrar retirada de comissão.');
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

  const handleDeleteTransaction = async (txId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta transação?')) return;
    try {
      if (isDemoMode) {
        const local = JSON.parse(localStorage.getItem('demo_financial') || '[]');
        const updated = local.filter(tx => tx.id !== txId);
        localStorage.setItem('demo_financial', JSON.stringify(updated));
        setGlobalData(prev => ({ ...prev, financial_transactions: updated }));
      } else {
        await deleteDoc(doc(db, 'financial_transactions', txId));
        const updated = (globalData.financial_transactions || []).filter(tx => tx.id !== txId);
        setGlobalData(prev => ({ ...prev, financial_transactions: updated }));
      }
      alert('Transação excluída com sucesso!');
      setShowTxDetailModal(false);
      setSelectedTransaction(null);
    } catch (err) {
      console.error('Erro ao excluir transação:', err);
      alert('Erro ao excluir transação.');
    }
  };

  const startEditTx = () => {
    setEditTxForm({
      description: selectedTransaction.description || '',
      value: selectedTransaction.value || 0,
      category: selectedTransaction.category || '',
      clientName: selectedTransaction.clientName || '',
      paymentMethod: selectedTransaction.paymentMethod || 'Pix',
      date: selectedTransaction.date || '',
      time: selectedTransaction.time || '00:00',
      type: selectedTransaction.type || 'entrada'
    });
    setIsEditingTx(true);
  };

  const handleSaveEditTx = async (e) => {
    e.preventDefault();
    try {
      const updatedFields = {
        description: editTxForm.description,
        value: Number(editTxForm.value),
        category: editTxForm.category,
        clientName: editTxForm.clientName,
        paymentMethod: editTxForm.paymentMethod,
        date: editTxForm.date,
        time: editTxForm.time,
        type: editTxForm.type
      };

      if (isDemoMode) {
        const local = JSON.parse(localStorage.getItem('demo_financial') || '[]');
        const updated = local.map(tx => tx.id === selectedTransaction.id ? { ...tx, ...updatedFields } : tx);
        localStorage.setItem('demo_financial', JSON.stringify(updated));
        setGlobalData(prev => ({ ...prev, financial_transactions: updated }));
      } else {
        await updateDoc(doc(db, 'financial_transactions', selectedTransaction.id), updatedFields);
        const updated = (globalData.financial_transactions || []).map(tx => tx.id === selectedTransaction.id ? { ...tx, ...updatedFields } : tx);
        setGlobalData(prev => ({ ...prev, financial_transactions: updated }));
      }

      alert('Transação atualizada com sucesso!');
      setSelectedTransaction({ id: selectedTransaction.id, ...updatedFields });
      setIsEditingTx(false);
    } catch (err) {
      console.error('Erro ao atualizar transação:', err);
      alert('Erro ao atualizar transação.');
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

  const calculateProfessionalCommission = (prof) => {
    return calculateProfessionalCommissionUtil(prof, filteredTransactions);
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
                    style={{ textAlign: 'left', fontSize: '0.82rem', padding: '6px 12px', background: !selectedProfFilter ? 'var(--adm-card)' : 'none' }}
                    onClick={() => { setSelectedProfFilter(''); setShowProfDropdown(false); }}
                  >
                    Todos os Profissionais
                  </button>
                  {professionals.map(p => (
                    <button 
                      key={p.id}
                      className="btn btn-ghost" 
                      style={{ textAlign: 'left', fontSize: '0.82rem', padding: '6px 12px', background: selectedProfFilter === p.id ? 'var(--adm-card)' : 'none' }}
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

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-spectro-green" onClick={() => setShowProductSaleModal(true)}>
            <ShoppingBag size={16} style={{ marginRight: 6 }} /> Registrar Venda de Produto
          </button>
          <button className="btn btn-spectro-red" onClick={() => setShowExpenseModal(true)}>
            <Plus size={16} style={{ marginRight: 6 }} /> Registrar Saída/Despesa
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="financial-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16, marginBottom: 24 }}>
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
          { id: 'despesas', label: 'Despesas', icon: <TrendingDown size={14} /> },
          { id: 'recebiveis', label: 'Agenda de Recebíveis', icon: <CreditCard size={14} /> },
          { id: 'comissao', label: 'Comissões', icon: <Users size={14} /> },
          { id: 'atendimentos', label: 'Atendimentos', icon: <Users size={14} /> },
          { id: 'produtos', label: 'Produtos', icon: <ShoppingBag size={14} /> },
          { id: 'taxas', label: 'Taxas', icon: <Percent size={14} /> },
          { id: 'pacotes', label: 'Pacotes', icon: <Eye size={14} /> },
          { id: 'precificacao', label: 'Precificação', icon: <DollarSign size={14} /> },
          { id: 'insumos', label: 'Uso de Insumos', icon: <ShoppingBag size={14} /> },
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
                    stroke="var(--adm-rule)" 
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
                <span style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>Concluídos</span>
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
                <span style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>Faturamento / Atendimentos</span>
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
                <span style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>Volume total de serviços</span>
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
                <span style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>Faturamento por categoria</span>
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
                <span style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>Total acumulado por categoria no período</span>
              </div>
              <div style={{ width: '100%' }}>
                {expenseCategoryStats.length === 0 ? (
                  <p style={{ color: 'var(--adm-muted)', textAlign: 'center', padding: '24px 0', fontSize: '0.85rem' }}>
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
                            <span style={{ color: 'var(--adm-gold)' }}>
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
                      <tr 
                        key={t.id} 
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          setSelectedTransaction(t);
                          setShowTxDetailModal(true);
                          setIsEditingTx(false);
                        }}
                      >
                        <td>{t.date.split('-').reverse().join('/')} às {t.time || '00:00'}</td>
                        <td style={{ fontWeight: 600 }}>
                          {t.description}
                          {t.category && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--adm-gold)', background: 'rgba(200, 133, 42, 0.1)', padding: '2px 6px', borderRadius: 4, fontWeight: 'normal', marginLeft: 8, display: 'inline-block' }}>
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
                          {isEntrada ? '+' : '-'} R$ {formatCurrencyBRL(t.value)}
                        </td>
                        <td style={{ color: fee > 0 ? 'var(--adm-gold)' : 'var(--adm-muted)' }}>
                          {fee > 0 ? `R$ ${formatCurrencyBRL(fee)}` : '-'}
                        </td>
                        <td style={{ color: txCost > 0 ? '#c53030' : 'var(--adm-muted)' }}>
                          {txCost > 0 ? `R$ ${formatCurrencyBRL(txCost)}` : '-'}
                        </td>
                        <td style={{ color: txProfit > 0 ? '#2f855a' : 'var(--adm-muted)', fontWeight: txProfit > 0 ? '600' : 'normal' }}>
                          {txProfit > 0 ? `R$ ${formatCurrencyBRL(txProfit)}` : '-'}
                        </td>
                        <td style={{ fontWeight: 'bold', color: isEntrada ? '#2f855a' : '#c53030' }}>
                          R$ {formatCurrencyBRL(netVal)}
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

      {/* SUBTAB: DESPESAS E SAÍDAS */}
      {activeSubTab === 'despesas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Header Card com Seletor de Período */}
          <div className="financial-card" style={{ background: 'linear-gradient(135deg, rgba(229,62,62,0.06) 0%, rgba(0,0,0,0) 100%)', border: '1px solid rgba(229,62,62,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#fc8181' }}>
                  <TrendingDown size={20} /> Gestão e Controle de Despesas
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--adm-muted)' }}>
                  Acompanhe e audite todas as saídas de caixa, despesas fixas, insumos e custos operacionais por dia, semana, quinzena, mês ou período personalizado.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <button className="btn btn-spectro-red" onClick={() => setShowExpenseModal(true)} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                  <Plus size={16} style={{ marginRight: 6 }} /> Registrar Saída/Despesa
                </button>

                {/* Seletor de Modo: Dia, Semana, Quinzena, Mês, Personalizado, Detalhado */}
                <div style={{ display: 'flex', gap: 6, background: 'var(--adm-surface)', padding: 4, borderRadius: 8, border: '0.5px solid var(--adm-rule)', flexWrap: 'wrap' }}>
                  {[
                    { id: 'dia', label: '📅 Por Dia' },
                    { id: 'semana', label: '🗓️ Por Semana' },
                    { id: 'quinzena', label: '🌓 Por Quinzena' },
                    { id: 'mes', label: '📊 Por Mês' },
                    { id: 'personalizado', label: '🗓️ Período Personalizado' },
                    { id: 'detalhado', label: '📋 Extrato Detalhado' }
                  ].map(mode => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setExpenseViewMode(mode.id)}
                      style={{
                        padding: '8px 14px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        background: expenseViewMode === mode.id ? '#e53e3e' : 'transparent',
                        color: expenseViewMode === mode.id ? '#fff' : 'var(--adm-muted)',
                        transition: 'all 0.2s'
                      }}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Custom date range bar when in 'personalizado' mode */}
            {expenseViewMode === 'personalizado' && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--adm-rule)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--adm-text)' }}>Filtrar Período:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>De:</label>
                  <input
                    type="date"
                    value={expenseCustomStart}
                    onChange={e => setExpenseCustomStart(e.target.value)}
                    style={{ padding: '6px 10px', fontSize: '0.82rem', border: '1px solid var(--adm-rule)', borderRadius: 6, background: 'var(--adm-card)', color: 'var(--adm-text)' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>Até:</label>
                  <input
                    type="date"
                    value={expenseCustomEnd}
                    onChange={e => setExpenseCustomEnd(e.target.value)}
                    style={{ padding: '6px 10px', fontSize: '0.82rem', border: '1px solid var(--adm-rule)', borderRadius: 6, background: 'var(--adm-card)', color: 'var(--adm-text)' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* KPI Stat Cards */}
          <div className="kpi-grid">
            <KpiCard
              label="Total de Despesas"
              value={`- R$ ${formatCurrencyBRL(expenseKPIs.totalExpenses)}`}
              sub={`${expenseKPIs.count} lançamento(s) — ${expenseKPIs.label}`}
              icon={<TrendingDown size={18} />}
              variant="danger"
            />
            <KpiCard
              label="Média Diária de Gastos"
              value={`R$ ${formatCurrencyBRL(expenseKPIs.dailyAverage)}`}
              sub="Média diária no período filtrado"
              icon={<DollarSign size={18} />}
              variant="warning"
            />
            <KpiCard
              label="Maior Centro de Custo"
              value={expenseKPIs.topCategory.name}
              sub={expenseKPIs.topCategory.sub}
              icon={<TrendingDown size={18} />}
              variant="neutral"
            />
            <KpiCard
              label="Total de Lançamentos"
              value={`${expenseKPIs.count}`}
              sub="Saídas e sangrias registradas"
              icon={<Calendar size={18} />}
              variant="accent"
            />
          </div>

          {/* Category breakdown bar */}
          {expenseKPIs.categoryBreakdown.length > 0 && (
            <div className="financial-card" style={{ padding: '16px 20px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--adm-text)' }}>
                Distribuição por Categoria — {expenseKPIs.label}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {expenseKPIs.categoryBreakdown.map((cat, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600 }}>
                      <span style={{ color: 'var(--adm-text)' }}>{cat.name}</span>
                      <span style={{ color: '#fc8181' }}>
                        R$ {formatCurrencyBRL(cat.value)} ({cat.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: 'var(--adm-surface)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${cat.percentage}%`, height: '100%', background: '#e53e3e', borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Table Card */}
          <div className="financial-card">
            {/* Filter Bar */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flex: 1, alignItems: 'center' }}>
                {/* Search */}
                <div style={{ position: 'relative', minWidth: 200 }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--adm-muted)' }} />
                  <input
                    type="text"
                    placeholder="Buscar despesa..."
                    value={expenseSearch}
                    onChange={e => setExpenseSearch(e.target.value)}
                    style={{ paddingLeft: 30, width: '100%', paddingRight: 10, paddingTop: 6, paddingBottom: 6, fontSize: '0.82rem', border: '1px solid var(--adm-rule)', borderRadius: 6, background: 'var(--adm-card)', color: 'var(--adm-text)' }}
                  />
                </div>

                {/* Sub-period specific dropdown selector */}
                {expenseViewMode === 'dia' && expenseAggregatedStats.days.length > 0 && (
                  <select
                    value={selectedExpenseDay}
                    onChange={e => setSelectedExpenseDay(e.target.value)}
                    style={{ padding: '6px 10px', fontSize: '0.82rem', border: '1px solid var(--adm-rule)', borderRadius: 6, background: 'var(--adm-card)', color: 'var(--adm-text)', maxWidth: 220 }}
                  >
                    <option value="todos">📅 Todos os Dias ({expenseAggregatedStats.days.length})</option>
                    {expenseAggregatedStats.days.map(d => (
                      <option key={d.date} value={d.date}>{d.label} — R$ {formatCurrencyBRL(d.totalValue)}</option>
                    ))}
                  </select>
                )}

                {expenseViewMode === 'semana' && expenseAggregatedStats.weeks.length > 0 && (
                  <select
                    value={selectedExpenseWeek}
                    onChange={e => setSelectedExpenseWeek(e.target.value)}
                    style={{ padding: '6px 10px', fontSize: '0.82rem', border: '1px solid var(--adm-rule)', borderRadius: 6, background: 'var(--adm-card)', color: 'var(--adm-text)', maxWidth: 260 }}
                  >
                    <option value="todos">🗓️ Todas as Semanas ({expenseAggregatedStats.weeks.length})</option>
                    {expenseAggregatedStats.weeks.map(w => (
                      <option key={w.sortKey} value={w.sortKey}>{w.label} — R$ {formatCurrencyBRL(w.totalValue)}</option>
                    ))}
                  </select>
                )}

                {expenseViewMode === 'quinzena' && expenseAggregatedStats.fortnights.length > 0 && (
                  <select
                    value={selectedExpenseFortnight}
                    onChange={e => setSelectedExpenseFortnight(e.target.value)}
                    style={{ padding: '6px 10px', fontSize: '0.82rem', border: '1px solid var(--adm-rule)', borderRadius: 6, background: 'var(--adm-card)', color: 'var(--adm-text)', maxWidth: 260 }}
                  >
                    <option value="todos">🌓 Todas as Quinzenas ({expenseAggregatedStats.fortnights.length})</option>
                    {expenseAggregatedStats.fortnights.map(f => (
                      <option key={f.fortnightKey} value={f.fortnightKey}>{f.label} — R$ {formatCurrencyBRL(f.totalValue)}</option>
                    ))}
                  </select>
                )}

                {expenseViewMode === 'mes' && expenseAggregatedStats.months.length > 0 && (
                  <select
                    value={selectedExpenseMonth}
                    onChange={e => setSelectedExpenseMonth(e.target.value)}
                    style={{ padding: '6px 10px', fontSize: '0.82rem', border: '1px solid var(--adm-rule)', borderRadius: 6, background: 'var(--adm-card)', color: 'var(--adm-text)', maxWidth: 220 }}
                  >
                    <option value="todos">📊 Todos os Meses ({expenseAggregatedStats.months.length})</option>
                    {expenseAggregatedStats.months.map(m => (
                      <option key={m.month} value={m.month}>{m.label} — R$ {formatCurrencyBRL(m.totalValue)}</option>
                    ))}
                  </select>
                )}

                {/* Category Filter */}
                <select
                  value={expenseCategoryFilter}
                  onChange={e => setExpenseCategoryFilter(e.target.value)}
                  style={{ padding: '6px 10px', fontSize: '0.82rem', border: '1px solid var(--adm-rule)', borderRadius: 6, background: 'var(--adm-card)', color: 'var(--adm-text)' }}
                >
                  <option value="todos">Todas as Categorias</option>
                  <option value="Custos Fixos - Aluguel e Condomínio">Aluguel e Condomínio</option>
                  <option value="Custos Fixos - Água, Luz e Telefone">Água, Luz e Telefone</option>
                  <option value="Custos Fixos - Sistemas e Assinaturas">Sistemas e Assinaturas</option>
                  <option value="Custos Fixos - Marketing e Anúncios">Marketing e Anúncios</option>
                  <option value="Custos Fixos - Salários e Pró-labore">Salários e Pró-labore</option>
                  <option value="Custos Variáveis - Produtos e Insumos">Produtos e Insumos</option>
                  <option value="Custos Variáveis - Manutenção">Manutenção</option>
                  <option value="Custos Variáveis - Impostos e Taxas">Impostos e Taxas</option>
                  <option value="Outros">Outros</option>
                </select>

                {/* Method Filter */}
                <select
                  value={expenseMethodFilter}
                  onChange={e => setExpenseMethodFilter(e.target.value)}
                  style={{ padding: '6px 10px', fontSize: '0.82rem', border: '1px solid var(--adm-rule)', borderRadius: 6, background: 'var(--adm-card)', color: 'var(--adm-text)' }}
                >
                  <option value="todos">Todas as Formas de Pagamento</option>
                  <option value="Pix">Pix</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Cartão">Cartão de Crédito</option>
                </select>
              </div>

              <span style={{ fontSize: '0.8rem', color: 'var(--adm-muted)' }}>
                {expenseKPIs.count} lançamento(s) exibidos
              </span>
            </div>

            {/* TABELA: MODO POR DIA */}
            {expenseViewMode === 'dia' && (
              <div className="table-responsive">
                <table className="financial-table">
                  <thead>
                    <tr>
                      <th>Data da Despesa</th>
                      <th style={{ textAlign: 'center' }}>Lançamentos</th>
                      <th>Categorias</th>
                      <th>Formas de Pagamento</th>
                      <th style={{ textAlign: 'right' }}>Total Gasto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseAggregatedStats.days.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: 24, color: 'var(--adm-muted)' }}>
                          Nenhuma despesa encontrada para os filtros ativos.
                        </td>
                      </tr>
                    ) : (
                      expenseAggregatedStats.days.map((item, idx) => (
                        <tr key={idx}>
                          <td><strong>📅 {item.label}</strong></td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.count}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {Object.entries(item.categories).map(([catName, catVal]) => (
                                <span key={catName} style={{ background: 'rgba(229,62,62,0.1)', color: '#fc8181', padding: '2px 6px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 500 }}>
                                  {catName}: R$ {formatCurrencyBRL(catVal)}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {Object.entries(item.methods).map(([mName, mVal]) => (
                                <span key={mName} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--adm-text)', padding: '2px 6px', borderRadius: 4, fontSize: '0.72rem' }}>
                                  {mName}: R$ {formatCurrencyBRL(mVal)}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#fc8181', fontSize: '0.95rem' }}>
                            - R$ {formatCurrencyBRL(item.totalValue)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TABELA: MODO POR SEMANA */}
            {expenseViewMode === 'semana' && (
              <div className="table-responsive">
                <table className="financial-table">
                  <thead>
                    <tr>
                      <th>Semana</th>
                      <th style={{ textAlign: 'center' }}>Lançamentos</th>
                      <th>Categorias</th>
                      <th>Formas de Pagamento</th>
                      <th style={{ textAlign: 'right' }}>Total Gasto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseAggregatedStats.weeks.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: 24, color: 'var(--adm-muted)' }}>
                          Nenhuma despesa encontrada para os filtros ativos.
                        </td>
                      </tr>
                    ) : (
                      expenseAggregatedStats.weeks.map((item, idx) => (
                        <tr key={idx}>
                          <td><strong>🗓️ {item.label}</strong></td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.count}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {Object.entries(item.categories).map(([catName, catVal]) => (
                                <span key={catName} style={{ background: 'rgba(229,62,62,0.1)', color: '#fc8181', padding: '2px 6px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 500 }}>
                                  {catName}: R$ {formatCurrencyBRL(catVal)}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {Object.entries(item.methods).map(([mName, mVal]) => (
                                <span key={mName} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--adm-text)', padding: '2px 6px', borderRadius: 4, fontSize: '0.72rem' }}>
                                  {mName}: R$ {formatCurrencyBRL(mVal)}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#fc8181', fontSize: '0.95rem' }}>
                            - R$ {formatCurrencyBRL(item.totalValue)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TABELA: MODO POR QUINZENA */}
            {expenseViewMode === 'quinzena' && (
              <div className="table-responsive">
                <table className="financial-table">
                  <thead>
                    <tr>
                      <th>Quinzena</th>
                      <th style={{ textAlign: 'center' }}>Lançamentos</th>
                      <th>Categorias</th>
                      <th>Formas de Pagamento</th>
                      <th style={{ textAlign: 'right' }}>Total Gasto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseAggregatedStats.fortnights.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: 24, color: 'var(--adm-muted)' }}>
                          Nenhuma despesa encontrada para os filtros ativos.
                        </td>
                      </tr>
                    ) : (
                      expenseAggregatedStats.fortnights.map((item, idx) => (
                        <tr key={idx}>
                          <td><strong>🌓 {item.label}</strong></td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.count}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {Object.entries(item.categories).map(([catName, catVal]) => (
                                <span key={catName} style={{ background: 'rgba(229,62,62,0.1)', color: '#fc8181', padding: '2px 6px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 500 }}>
                                  {catName}: R$ {formatCurrencyBRL(catVal)}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {Object.entries(item.methods).map(([mName, mVal]) => (
                                <span key={mName} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--adm-text)', padding: '2px 6px', borderRadius: 4, fontSize: '0.72rem' }}>
                                  {mName}: R$ {formatCurrencyBRL(mVal)}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#fc8181', fontSize: '0.95rem' }}>
                            - R$ {formatCurrencyBRL(item.totalValue)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TABELA: MODO POR MÊS */}
            {expenseViewMode === 'mes' && (
              <div className="table-responsive">
                <table className="financial-table">
                  <thead>
                    <tr>
                      <th>Mês / Ano</th>
                      <th style={{ textAlign: 'center' }}>Lançamentos</th>
                      <th>Categorias</th>
                      <th>Formas de Pagamento</th>
                      <th style={{ textAlign: 'right' }}>Total Gasto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseAggregatedStats.months.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: 24, color: 'var(--adm-muted)' }}>
                          Nenhuma despesa encontrada para os filtros ativos.
                        </td>
                      </tr>
                    ) : (
                      expenseAggregatedStats.months.map((item, idx) => (
                        <tr key={idx}>
                          <td><strong>📊 {item.label}</strong></td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.count}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {Object.entries(item.categories).map(([catName, catVal]) => (
                                <span key={catName} style={{ background: 'rgba(229,62,62,0.1)', color: '#fc8181', padding: '2px 6px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 500 }}>
                                  {catName}: R$ {formatCurrencyBRL(catVal)}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {Object.entries(item.methods).map(([mName, mVal]) => (
                                <span key={mName} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--adm-text)', padding: '2px 6px', borderRadius: 4, fontSize: '0.72rem' }}>
                                  {mName}: R$ {formatCurrencyBRL(mVal)}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#fc8181', fontSize: '0.95rem' }}>
                            - R$ {formatCurrencyBRL(item.totalValue)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TABELA: MODO PERÍODO PERSONALIZADO */}
            {expenseViewMode === 'personalizado' && (
              <div>
                <div style={{ padding: 16, borderRadius: 8, background: 'rgba(229,62,62,0.04)', border: '0.5px solid var(--adm-rule)', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <h4 style={{ margin: 0, color: 'var(--adm-text)' }}>{expenseAggregatedStats.customPeriod.label}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--adm-muted)' }}>
                      Total de {expenseAggregatedStats.customPeriod.count} saída(s) no intervalo selecionado
                    </span>
                  </div>
                  <strong style={{ fontSize: '1.4rem', color: '#fc8181' }}>
                    - R$ {formatCurrencyBRL(expenseAggregatedStats.customPeriod.totalValue)}
                  </strong>
                </div>

                <div className="table-responsive">
                  <table className="financial-table">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Descrição / Fornecedor</th>
                        <th>Categoria</th>
                        <th>Forma Pagamento</th>
                        <th style={{ textAlign: 'right' }}>Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenseAggregatedStats.customPeriod.items.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: 24, color: 'var(--adm-muted)' }}>
                            Nenhuma despesa encontrada para as datas selecionadas.
                          </td>
                        </tr>
                      ) : (
                        expenseAggregatedStats.customPeriod.items.map(t => (
                          <tr
                            key={t.id}
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              setSelectedTransaction(t);
                              setShowTxDetailModal(true);
                              setIsEditingTx(false);
                            }}
                          >
                            <td>{t.date.split('-').reverse().join('/')} às {t.time || '00:00'}</td>
                            <td><strong>{t.description}</strong></td>
                            <td>
                              <span style={{ fontSize: '0.75rem', color: 'var(--adm-gold)', background: 'rgba(200, 133, 42, 0.1)', padding: '2px 8px', borderRadius: 4 }}>
                                {t.category || 'Outros'}
                              </span>
                            </td>
                            <td>{t.paymentMethod}</td>
                            <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#fc8181' }}>
                              - R$ {formatCurrencyBRL(t.value)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TABELA: MODO EXTRATO DETALHADO */}
            {expenseViewMode === 'detalhado' && (
              <div style={{ overflowX: 'auto' }}>
                <table className="financial-table">
                  <thead>
                    <tr>
                      <th>Data / Hora</th>
                      <th>Descrição / Fornecedor</th>
                      <th>Categoria</th>
                      <th>Forma de Pagamento</th>
                      <th>Parcelas</th>
                      <th style={{ textAlign: 'right' }}>Valor da Despesa</th>
                      <th style={{ textAlign: 'center' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseAggregatedStats.detailedList.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: 24, color: 'var(--adm-muted)' }}>
                          Nenhuma despesa encontrada para os filtros ativos.
                        </td>
                      </tr>
                    ) : (
                      expenseAggregatedStats.detailedList.map(t => (
                        <tr key={t.id}>
                          <td>{t.date.split('-').reverse().join('/')} às {t.time || '00:00'}</td>
                          <td>
                            <strong>{t.description}</strong>
                            {t.clientName && t.clientName !== 'Cliente' && (
                              <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--adm-muted)' }}>Destinatário: {t.clientName}</span>
                            )}
                          </td>
                          <td>
                            <span style={{ fontSize: '0.75rem', color: 'var(--adm-gold)', background: 'rgba(200, 133, 42, 0.1)', padding: '2px 8px', borderRadius: 4 }}>
                              {t.category || 'Outros'}
                            </span>
                          </td>
                          <td>{t.paymentMethod}</td>
                          <td>
                            {t.installments && t.installments > 1 ? (
                              <span style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>
                                {t.installmentIndex || 1}/{t.installments}x
                              </span>
                            ) : '-'}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#fc8181', fontSize: '0.92rem' }}>
                            - R$ {formatCurrencyBRL(t.value)}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                              <button
                                className="btn btn-ghost"
                                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                onClick={() => {
                                  setSelectedTransaction(t);
                                  setShowTxDetailModal(true);
                                  setIsEditingTx(false);
                                }}
                                title="Ver / Editar detalhes"
                              >
                                ✏️ Detalhes
                              </button>
                              <button
                                className="btn btn-ghost"
                                style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#fc8181' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTransaction(t.id);
                                }}
                                title="Excluir lançamento"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB: AGENDA DE RECEBÍVEIS */}
      {activeSubTab === 'recebiveis' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Header Card com Seletor de Período */}
          <div className="financial-card" style={{ background: 'linear-gradient(135deg, rgba(212,140,106,0.06) 0%, rgba(0,0,0,0) 100%)', border: '1px solid var(--adm-gold-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--adm-gold)' }}>
                  <CreditCard size={20} /> Agenda & Previsão de Recebíveis
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--adm-muted)' }}>
                  Acompanhe as datas exatas de liberação de caixa por dia, semana, quinzena, mês ou período personalizado: Pix na hora (D+0), Débito em 1 dia útil (D+1), e Cartão de Crédito em 30, 60 e 90 dias após a dedução das taxas de adquirente.
                </p>
              </div>

              {/* Seletor de Modo: Dia, Semana, Quinzena, Mês, Personalizado, Detalhado */}
              <div style={{ display: 'flex', gap: 6, background: 'var(--adm-surface)', padding: 4, borderRadius: 8, border: '0.5px solid var(--adm-rule)', flexWrap: 'wrap' }}>
                {[
                  { id: 'dia', label: '📅 Por Dia' },
                  { id: 'semana', label: '🗓️ Por Semana' },
                  { id: 'quinzena', label: '🌓 Por Quinzena' },
                  { id: 'mes', label: '📊 Por Mês' },
                  { id: 'personalizado', label: '🗓️ Período Personalizado' },
                  { id: 'detalhado', label: '📋 Extrato Detalhado' }
                ].map(mode => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setReceivablesViewMode(mode.id)}
                    style={{
                      padding: '8px 14px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      background: receivablesViewMode === mode.id ? 'var(--adm-gold)' : 'transparent',
                      color: receivablesViewMode === mode.id ? '#000' : 'var(--adm-muted)',
                      transition: 'all 0.2s'
                    }}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom date range bar when in 'personalizado' mode */}
            {receivablesViewMode === 'personalizado' && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--adm-rule)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--adm-text)' }}>Filtrar Data de Vencimento/Liberação:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>De:</label>
                  <input
                    type="date"
                    value={receivablesCustomStart}
                    onChange={e => setReceivablesCustomStart(e.target.value)}
                    style={{ padding: '6px 10px', fontSize: '0.82rem', border: '1px solid var(--adm-rule)', borderRadius: 6, background: 'var(--adm-card)', color: 'var(--adm-text)' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>Até:</label>
                  <input
                    type="date"
                    value={receivablesCustomEnd}
                    onChange={e => setReceivablesCustomEnd(e.target.value)}
                    style={{ padding: '6px 10px', fontSize: '0.82rem', border: '1px solid var(--adm-rule)', borderRadius: 6, background: 'var(--adm-card)', color: 'var(--adm-text)' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* KPI Stat Cards */}
          <div className="kpi-grid">
            <KpiCard
              label={
                receivablesViewMode === 'dia' ? 'A Receber (No Dia)' :
                receivablesViewMode === 'semana' ? 'A Receber (Na Semana)' :
                receivablesViewMode === 'quinzena' ? 'A Receber (Na Quinzena)' :
                receivablesViewMode === 'mes' ? 'A Receber (No Mês)' :
                receivablesViewMode === 'personalizado' ? 'A Receber (No Período)' : 'A Receber (Previsto)'
              }
              value={`R$ ${formatCurrencyBRL(receivablesKPIs.pendingNet)}`}
              sub={receivablesKPIs.label}
              icon={<Calendar size={18} />}
              variant="warning"
            />
            <KpiCard
              label={
                receivablesViewMode === 'dia' ? 'Disponível (No Dia)' :
                receivablesViewMode === 'semana' ? 'Disponível (Na Semana)' :
                receivablesViewMode === 'quinzena' ? 'Disponível (Na Quinzena)' :
                receivablesViewMode === 'mes' ? 'Disponível (No Mês)' :
                receivablesViewMode === 'personalizado' ? 'Disponível (No Período)' : 'Disponível no Caixa'
              }
              value={`R$ ${formatCurrencyBRL(receivablesKPIs.liquidNet)}`}
              sub="Recebimentos liberados / liquidados"
              icon={<DollarSign size={18} />}
              variant="success"
            />
            <KpiCard
              label={receivablesViewMode === 'detalhado' ? 'Entradas Próximos 30 Dias' : 'Total Líquido Previsto'}
              value={`R$ ${formatCurrencyBRL(receivablesViewMode === 'detalhado' ? receivablesKPIs.next30DaysNet : receivablesKPIs.totalNet)}`}
              sub={receivablesViewMode === 'detalhado' ? 'Previsão de curto prazo' : 'Valor líquido total após taxas'}
              icon={<TrendingUp size={18} />}
              variant="accent"
            />
            <KpiCard
              label="Taxas de Adquirente Retidas"
              value={`R$ ${formatCurrencyBRL(receivablesKPIs.totalFees)}`}
              sub="Custo total de maquininha/gateway"
              icon={<Percent size={18} />}
              variant="neutral"
            />
          </div>

          {/* Table Card */}
          <div className="financial-card">
            {/* Filter Bar */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flex: 1, alignItems: 'center' }}>
                {/* Search */}
                <div style={{ position: 'relative', minWidth: 200 }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--adm-muted)' }} />
                  <input
                    type="text"
                    placeholder="Buscar por cliente ou descrição..."
                    value={receivablesSearch}
                    onChange={e => setReceivablesSearch(e.target.value)}
                    style={{ paddingLeft: 30, width: '100%', paddingRight: 10, paddingTop: 6, paddingBottom: 6, fontSize: '0.82rem', border: '1px solid var(--adm-rule)', borderRadius: 6, background: 'var(--adm-card)', color: 'var(--adm-text)' }}
                  />
                </div>

                {/* Sub-period specific dropdown selector */}
                {receivablesViewMode === 'dia' && receivablesAggregatedStats.days.length > 0 && (
                  <select
                    value={selectedReceivablesDay}
                    onChange={e => setSelectedReceivablesDay(e.target.value)}
                    style={{ padding: '6px 10px', fontSize: '0.82rem', border: '1px solid var(--adm-rule)', borderRadius: 6, background: 'var(--adm-card)', color: 'var(--adm-text)', maxWidth: 220 }}
                  >
                    <option value="todos">📅 Todos os Dias ({receivablesAggregatedStats.days.length})</option>
                    {receivablesAggregatedStats.days.map(d => (
                      <option key={d.date} value={d.date}>{d.label} — R$ {formatCurrencyBRL(d.netValue)}</option>
                    ))}
                  </select>
                )}

                {receivablesViewMode === 'semana' && receivablesAggregatedStats.weeks.length > 0 && (
                  <select
                    value={selectedReceivablesWeek}
                    onChange={e => setSelectedReceivablesWeek(e.target.value)}
                    style={{ padding: '6px 10px', fontSize: '0.82rem', border: '1px solid var(--adm-rule)', borderRadius: 6, background: 'var(--adm-card)', color: 'var(--adm-text)', maxWidth: 260 }}
                  >
                    <option value="todos">🗓️ Todas as Semanas ({receivablesAggregatedStats.weeks.length})</option>
                    {receivablesAggregatedStats.weeks.map(w => (
                      <option key={w.sortKey} value={w.sortKey}>{w.label} — R$ {formatCurrencyBRL(w.netValue)}</option>
                    ))}
                  </select>
                )}

                {receivablesViewMode === 'quinzena' && receivablesAggregatedStats.fortnights.length > 0 && (
                  <select
                    value={selectedReceivablesFortnight}
                    onChange={e => setSelectedReceivablesFortnight(e.target.value)}
                    style={{ padding: '6px 10px', fontSize: '0.82rem', border: '1px solid var(--adm-rule)', borderRadius: 6, background: 'var(--adm-card)', color: 'var(--adm-text)', maxWidth: 260 }}
                  >
                    <option value="todos">🌓 Todas as Quinzenas ({receivablesAggregatedStats.fortnights.length})</option>
                    {receivablesAggregatedStats.fortnights.map(f => (
                      <option key={f.fortnightKey} value={f.fortnightKey}>{f.label} — R$ {formatCurrencyBRL(f.netValue)}</option>
                    ))}
                  </select>
                )}

                {receivablesViewMode === 'mes' && receivablesAggregatedStats.months.length > 0 && (
                  <select
                    value={selectedReceivablesMonth}
                    onChange={e => setSelectedReceivablesMonth(e.target.value)}
                    style={{ padding: '6px 10px', fontSize: '0.82rem', border: '1px solid var(--adm-rule)', borderRadius: 6, background: 'var(--adm-card)', color: 'var(--adm-text)', maxWidth: 220 }}
                  >
                    <option value="todos">📊 Todos os Meses ({receivablesAggregatedStats.months.length})</option>
                    {receivablesAggregatedStats.months.map(m => (
                      <option key={m.month} value={m.month}>{m.label} — R$ {formatCurrencyBRL(m.netValue)}</option>
                    ))}
                  </select>
                )}

                {/* Status Filter */}
                <select
                  value={receivablesStatusFilter}
                  onChange={e => setReceivablesStatusFilter(e.target.value)}
                  style={{ padding: '6px 10px', fontSize: '0.82rem', border: '1px solid var(--adm-rule)', borderRadius: 6, background: 'var(--adm-card)', color: 'var(--adm-text)' }}
                >
                  <option value="todos">Todos os Status</option>
                  <option value="a_receber">🟧 A Receber (Futuros)</option>
                  <option value="liquidado">🟢 Disponível (Liquidados)</option>
                  <option value="antecipado">⚡ Antecipados</option>
                </select>

                {/* Method Filter */}
                <select
                  value={receivablesMethodFilter}
                  onChange={e => setReceivablesMethodFilter(e.target.value)}
                  style={{ padding: '6px 10px', fontSize: '0.82rem', border: '1px solid var(--adm-rule)', borderRadius: 6, background: 'var(--adm-card)', color: 'var(--adm-text)' }}
                >
                  <option value="todos">Todas as Formas de Pagamento</option>
                  <option value="credito">Cartão de Crédito</option>
                  <option value="debito">Cartão de Débito</option>
                  <option value="pix">Pix</option>
                  <option value="dinheiro">Dinheiro</option>
                </select>
              </div>

              <span style={{ fontSize: '0.8rem', color: 'var(--adm-muted)' }}>
                {receivablesKPIs.count} lançamento(s) exibidos
              </span>
            </div>

            {/* TABELA: MODO POR DIA */}
            {receivablesViewMode === 'dia' && (
              <div className="table-responsive">
                <table className="financial-table">
                  <thead>
                    <tr>
                      <th>Data de Liberação (Vencimento)</th>
                      <th style={{ textAlign: 'center' }}>Lançamentos</th>
                      <th>Formas de Pagamento</th>
                      <th style={{ textAlign: 'right' }}>Valor Bruto</th>
                      <th style={{ textAlign: 'right' }}>Taxas Retidas</th>
                      <th style={{ textAlign: 'right' }}>Líquido no Caixa</th>
                      <th style={{ textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receivablesAggregatedStats.days.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: 24, color: 'var(--adm-muted)' }}>
                          Nenhum recebível encontrado para os filtros ativos.
                        </td>
                      </tr>
                    ) : (
                      receivablesAggregatedStats.days.map((item, idx) => {
                        const isAllLiquid = item.pendingNet === 0;
                        const isAllPending = item.liquidNet === 0;

                        return (
                          <tr key={idx}>
                            <td>
                              <strong>📅 {item.label}</strong>
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.count}</td>
                            <td>
                              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {Object.entries(item.methods).map(([mName, mVal]) => (
                                  <span key={mName} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--adm-text)', padding: '2px 6px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 500 }}>
                                    {mName}: R$ {formatCurrencyBRL(mVal)}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td style={{ textAlign: 'right' }}>R$ {formatCurrencyBRL(item.grossValue)}</td>
                            <td style={{ textAlign: 'right', color: item.feeValue > 0 ? '#ef4444' : 'var(--adm-muted)' }}>
                              {item.feeValue > 0 ? `- R$ ${formatCurrencyBRL(item.feeValue)}` : 'R$ 0,00'}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--adm-gold)', fontSize: '0.95rem' }}>
                              R$ {formatCurrencyBRL(item.netValue)}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {isAllLiquid ? (
                                <span className="badge badge-success" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', padding: '4px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>
                                  🟢 Disponível
                                </span>
                              ) : isAllPending ? (
                                <span className="badge badge-warning" style={{ background: 'rgba(249,115,22,0.12)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)', padding: '4px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>
                                  🟧 A Receber
                                </span>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                                  <span style={{ color: '#22c55e', fontSize: '0.72rem', fontWeight: 600 }}>🟢 R$ {formatCurrencyBRL(item.liquidNet)}</span>
                                  <span style={{ color: '#f97316', fontSize: '0.72rem', fontWeight: 600 }}>🟧 R$ {formatCurrencyBRL(item.pendingNet)}</span>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TABELA: MODO POR SEMANA */}
            {receivablesViewMode === 'semana' && (
              <div className="table-responsive">
                <table className="financial-table">
                  <thead>
                    <tr>
                      <th>Semana de Liberação</th>
                      <th style={{ textAlign: 'center' }}>Lançamentos</th>
                      <th>Formas de Pagamento</th>
                      <th style={{ textAlign: 'right' }}>Valor Bruto</th>
                      <th style={{ textAlign: 'right' }}>Taxas Retidas</th>
                      <th style={{ textAlign: 'right' }}>Líquido no Caixa</th>
                      <th style={{ textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receivablesAggregatedStats.weeks.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: 24, color: 'var(--adm-muted)' }}>
                          Nenhum recebível encontrado para os filtros ativos.
                        </td>
                      </tr>
                    ) : (
                      receivablesAggregatedStats.weeks.map((item, idx) => {
                        const isAllLiquid = item.pendingNet === 0;
                        const isAllPending = item.liquidNet === 0;

                        return (
                          <tr key={idx}>
                            <td>
                              <strong>🗓️ {item.label}</strong>
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.count}</td>
                            <td>
                              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {Object.entries(item.methods).map(([mName, mVal]) => (
                                  <span key={mName} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--adm-text)', padding: '2px 6px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 500 }}>
                                    {mName}: R$ {formatCurrencyBRL(mVal)}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td style={{ textAlign: 'right' }}>R$ {formatCurrencyBRL(item.grossValue)}</td>
                            <td style={{ textAlign: 'right', color: item.feeValue > 0 ? '#ef4444' : 'var(--adm-muted)' }}>
                              {item.feeValue > 0 ? `- R$ ${formatCurrencyBRL(item.feeValue)}` : 'R$ 0,00'}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--adm-gold)', fontSize: '0.95rem' }}>
                              R$ {formatCurrencyBRL(item.netValue)}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {isAllLiquid ? (
                                <span className="badge badge-success" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', padding: '4px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>
                                  🟢 Disponível
                                </span>
                              ) : isAllPending ? (
                                <span className="badge badge-warning" style={{ background: 'rgba(249,115,22,0.12)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)', padding: '4px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>
                                  🟧 A Receber
                                </span>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                                  <span style={{ color: '#22c55e', fontSize: '0.72rem', fontWeight: 600 }}>🟢 R$ {formatCurrencyBRL(item.liquidNet)}</span>
                                  <span style={{ color: '#f97316', fontSize: '0.72rem', fontWeight: 600 }}>🟧 R$ {formatCurrencyBRL(item.pendingNet)}</span>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TABELA: MODO POR QUINZENA */}
            {receivablesViewMode === 'quinzena' && (
              <div className="table-responsive">
                <table className="financial-table">
                  <thead>
                    <tr>
                      <th>Quinzena de Liberação</th>
                      <th style={{ textAlign: 'center' }}>Lançamentos</th>
                      <th>Formas de Pagamento</th>
                      <th style={{ textAlign: 'right' }}>Valor Bruto</th>
                      <th style={{ textAlign: 'right' }}>Taxas Retidas</th>
                      <th style={{ textAlign: 'right' }}>Líquido no Caixa</th>
                      <th style={{ textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receivablesAggregatedStats.fortnights.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: 24, color: 'var(--adm-muted)' }}>
                          Nenhum recebível encontrado para os filtros ativos.
                        </td>
                      </tr>
                    ) : (
                      receivablesAggregatedStats.fortnights.map((item, idx) => {
                        const isAllLiquid = item.pendingNet === 0;
                        const isAllPending = item.liquidNet === 0;

                        return (
                          <tr key={idx}>
                            <td>
                              <strong>🌓 {item.label}</strong>
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.count}</td>
                            <td>
                              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {Object.entries(item.methods).map(([mName, mVal]) => (
                                  <span key={mName} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--adm-text)', padding: '2px 6px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 500 }}>
                                    {mName}: R$ {formatCurrencyBRL(mVal)}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td style={{ textAlign: 'right' }}>R$ {formatCurrencyBRL(item.grossValue)}</td>
                            <td style={{ textAlign: 'right', color: item.feeValue > 0 ? '#ef4444' : 'var(--adm-muted)' }}>
                              {item.feeValue > 0 ? `- R$ ${formatCurrencyBRL(item.feeValue)}` : 'R$ 0,00'}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--adm-gold)', fontSize: '0.95rem' }}>
                              R$ {formatCurrencyBRL(item.netValue)}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {isAllLiquid ? (
                                <span className="badge badge-success" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', padding: '4px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>
                                  🟢 Disponível
                                </span>
                              ) : isAllPending ? (
                                <span className="badge badge-warning" style={{ background: 'rgba(249,115,22,0.12)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)', padding: '4px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>
                                  🟧 A Receber
                                </span>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                                  <span style={{ color: '#22c55e', fontSize: '0.72rem', fontWeight: 600 }}>🟢 R$ {formatCurrencyBRL(item.liquidNet)}</span>
                                  <span style={{ color: '#f97316', fontSize: '0.72rem', fontWeight: 600 }}>🟧 R$ {formatCurrencyBRL(item.pendingNet)}</span>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TABELA: MODO POR MÊS */}
            {receivablesViewMode === 'mes' && (
              <div className="table-responsive">
                <table className="financial-table">
                  <thead>
                    <tr>
                      <th>Mês / Ano de Liberação</th>
                      <th style={{ textAlign: 'center' }}>Lançamentos</th>
                      <th>Formas de Pagamento</th>
                      <th style={{ textAlign: 'right' }}>Valor Bruto</th>
                      <th style={{ textAlign: 'right' }}>Taxas Retidas</th>
                      <th style={{ textAlign: 'right' }}>Líquido no Caixa</th>
                      <th style={{ textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receivablesAggregatedStats.months.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: 24, color: 'var(--adm-muted)' }}>
                          Nenhum recebível encontrado para os filtros ativos.
                        </td>
                      </tr>
                    ) : (
                      receivablesAggregatedStats.months.map((item, idx) => {
                        const isAllLiquid = item.pendingNet === 0;
                        const isAllPending = item.liquidNet === 0;

                        return (
                          <tr key={idx}>
                            <td>
                              <strong>📊 {item.label}</strong>
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.count}</td>
                            <td>
                              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {Object.entries(item.methods).map(([mName, mVal]) => (
                                  <span key={mName} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--adm-text)', padding: '2px 6px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 500 }}>
                                    {mName}: R$ {formatCurrencyBRL(mVal)}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td style={{ textAlign: 'right' }}>R$ {formatCurrencyBRL(item.grossValue)}</td>
                            <td style={{ textAlign: 'right', color: item.feeValue > 0 ? '#ef4444' : 'var(--adm-muted)' }}>
                              {item.feeValue > 0 ? `- R$ ${formatCurrencyBRL(item.feeValue)}` : 'R$ 0,00'}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--adm-gold)', fontSize: '0.95rem' }}>
                              R$ {formatCurrencyBRL(item.netValue)}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {isAllLiquid ? (
                                <span className="badge badge-success" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', padding: '4px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>
                                  🟢 Disponível
                                </span>
                              ) : isAllPending ? (
                                <span className="badge badge-warning" style={{ background: 'rgba(249,115,22,0.12)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)', padding: '4px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>
                                  🟧 A Receber
                                </span>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                                  <span style={{ color: '#22c55e', fontSize: '0.72rem', fontWeight: 600 }}>🟢 R$ {formatCurrencyBRL(item.liquidNet)}</span>
                                  <span style={{ color: '#f97316', fontSize: '0.72rem', fontWeight: 600 }}>🟧 R$ {formatCurrencyBRL(item.pendingNet)}</span>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TABELA: MODO PERÍODO PERSONALIZADO */}
            {receivablesViewMode === 'personalizado' && (
              <div>
                <div style={{ padding: 16, borderRadius: 8, background: 'rgba(212,140,106,0.06)', border: '0.5px solid var(--adm-gold-border)', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <h4 style={{ margin: 0, color: 'var(--adm-gold)' }}>{receivablesAggregatedStats.customPeriod.label}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--adm-muted)' }}>
                      Total de {receivablesAggregatedStats.customPeriod.count} recebimento(s) com vencimento no intervalo selecionado
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--adm-muted)', display: 'block' }}>Líquido a Entrar:</span>
                      <strong style={{ fontSize: '1.2rem', color: 'var(--adm-gold)' }}>
                        R$ {formatCurrencyBRL(receivablesAggregatedStats.customPeriod.netValue)}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="financial-table">
                    <thead>
                      <tr>
                        <th>Data Venda</th>
                        <th>Vencimento (Depósito)</th>
                        <th>Cliente / Lançamento</th>
                        <th>Forma Pagamento</th>
                        <th>Parcela</th>
                        <th>Valor Bruto</th>
                        <th>Taxa Retida</th>
                        <th>Valor Líquido Caixa</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receivablesAggregatedStats.customPeriod.items.length === 0 ? (
                        <tr>
                          <td colSpan="9" style={{ textAlign: 'center', padding: 24, color: 'var(--adm-muted)' }}>
                            Nenhum recebível encontrado para o período selecionado.
                          </td>
                        </tr>
                      ) : (
                        receivablesAggregatedStats.customPeriod.items.map(item => {
                          const isLiquid = item.status === 'liquidado';
                          const isAntecipated = item.status === 'antecipado';

                          return (
                            <tr key={item.id}>
                              <td>{item.saleDate.split('-').reverse().join('/')}</td>
                              <td style={{ fontWeight: 600, color: isLiquid ? '#22c55e' : (isAntecipated ? 'var(--adm-gold)' : '#f97316') }}>
                                📅 {item.dueDate.split('-').reverse().join('/')}
                              </td>
                              <td>
                                <strong>{item.clientName}</strong>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--adm-muted)' }}>{item.description}</span>
                              </td>
                              <td>{item.paymentMethod}</td>
                              <td>
                                <span style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>
                                  {item.installmentNumber}/{item.totalInstallments}
                                </span>
                              </td>
                              <td>R$ {formatCurrencyBRL(item.grossValue)}</td>
                              <td style={{ color: item.feeValue > 0 ? '#ef4444' : 'var(--adm-muted)' }}>
                                {item.feeValue > 0 ? `- R$ ${formatCurrencyBRL(item.feeValue)}` : 'R$ 0,00'}
                              </td>
                              <td style={{ fontWeight: 'bold', color: 'var(--adm-gold)', fontSize: '0.9rem' }}>
                                R$ {formatCurrencyBRL(item.netValue)}
                              </td>
                              <td>
                                {isLiquid ? (
                                  <span className="badge badge-success" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', padding: '4px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>
                                    🟢 Disponível
                                  </span>
                                ) : isAntecipated ? (
                                  <span className="badge" style={{ background: 'rgba(212,140,106,0.15)', color: 'var(--adm-gold)', border: '1px solid var(--adm-gold)', padding: '4px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>
                                    ⚡ Antecipado
                                  </span>
                                ) : (
                                  <span className="badge badge-warning" style={{ background: 'rgba(249,115,22,0.12)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)', padding: '4px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>
                                    🟧 {item.statusLabel}
                                  </span>
                                )}
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

            {/* TABELA: MODO EXTRATO DETALHADO */}
            {receivablesViewMode === 'detalhado' && (
              <div style={{ overflowX: 'auto' }}>
                <table className="financial-table">
                  <thead>
                    <tr>
                      <th>Data Venda</th>
                      <th>Vencimento (Depósito)</th>
                      <th>Cliente / Lançamento</th>
                      <th>Forma Pagamento</th>
                      <th>Parcela</th>
                      <th>Valor Bruto</th>
                      <th>Taxa Retida</th>
                      <th>Valor Líquido Caixa</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReceivablesSchedule.length === 0 ? (
                      <tr>
                        <td colSpan="9" style={{ textAlign: 'center', padding: 24, color: 'var(--adm-muted)' }}>
                          Nenhum recebível encontrado para os filtros ativos.
                        </td>
                      </tr>
                    ) : (
                      filteredReceivablesSchedule.map(item => {
                        const isLiquid = item.status === 'liquidado';
                        const isAntecipated = item.status === 'antecipado';

                        return (
                          <tr key={item.id}>
                            <td>{item.saleDate.split('-').reverse().join('/')}</td>
                            <td style={{ fontWeight: 600, color: isLiquid ? '#22c55e' : (isAntecipated ? 'var(--adm-gold)' : '#f97316') }}>
                              📅 {item.dueDate.split('-').reverse().join('/')}
                            </td>
                            <td>
                              <strong>{item.clientName}</strong>
                              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--adm-muted)' }}>{item.description}</span>
                            </td>
                            <td>{item.paymentMethod}</td>
                            <td>
                              <span style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>
                                {item.installmentNumber}/{item.totalInstallments}
                              </span>
                            </td>
                            <td>R$ {formatCurrencyBRL(item.grossValue)}</td>
                            <td style={{ color: item.feeValue > 0 ? '#ef4444' : 'var(--adm-muted)' }}>
                              {item.feeValue > 0 ? `- R$ ${formatCurrencyBRL(item.feeValue)}` : 'R$ 0,00'}
                            </td>
                            <td style={{ fontWeight: 'bold', color: 'var(--adm-gold)', fontSize: '0.9rem' }}>
                              R$ {formatCurrencyBRL(item.netValue)}
                            </td>
                            <td>
                              {isLiquid ? (
                                <span className="badge badge-success" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', padding: '4px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>
                                  🟢 Disponível
                                </span>
                              ) : isAntecipated ? (
                                <span className="badge" style={{ background: 'rgba(212,140,106,0.15)', color: 'var(--adm-gold)', border: '1px solid var(--adm-gold)', padding: '4px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>
                                  ⚡ Antecipado
                                </span>
                              ) : (
                                <span className="badge badge-warning" style={{ background: 'rgba(249,115,22,0.12)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)', padding: '4px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>
                                  🟧 {item.statusLabel}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Rule Explanatory Card */}
          <div className="financial-card" style={{ background: 'var(--adm-card-subtle, rgba(255,255,255,0.015))', border: '1px solid var(--adm-rule)' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--adm-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
              ℹ️ Prazos Padrão de Liberação de Recebíveis (Sem Antecipação):
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: '0.8rem', color: 'var(--adm-muted)' }}>
              <div>
                <strong style={{ color: 'var(--adm-text)' }}>⚡ Pix & Dinheiro:</strong>
                <p style={{ margin: '2px 0 0 0' }}>Disponível no caixa imediatamente no dia da venda (D+0).</p>
              </div>
              <div>
                <strong style={{ color: 'var(--adm-text)' }}>💳 Cartão de Débito:</strong>
                <p style={{ margin: '2px 0 0 0' }}>Depositado no caixa em 1 dia útil após a venda (D+1 útil).</p>
              </div>
              <div>
                <strong style={{ color: 'var(--adm-text)' }}>💳 Crédito À Vista (1x):</strong>
                <p style={{ margin: '2px 0 0 0' }}>Depositado no caixa em 30 dias corridos pós venda.</p>
              </div>
              <div>
                <strong style={{ color: 'var(--adm-text)' }}>💳 Crédito Parcelado (2x e 3x):</strong>
                <p style={{ margin: '2px 0 0 0' }}>Dividido em parcelas líquidas iguais caindo em 30, 60 e 90 dias.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB: COMISSÕES & REPASSES */}
      {activeSubTab === 'comissao' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Header Card com Seletor de Período (Dia, Semana, Quinzena, Mês, Personalizado, Detalhado) */}
          <div className="financial-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={20} color="var(--adm-gold)" /> Profissionais e Comissionamento
                </h3>
                <p style={{ color: 'var(--adm-muted)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                  Acompanhe os repasses e comissões calculadas por dia, semana, quinzena, mês ou período personalizado com deduções de adiantamentos e retiradas.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-spectro-gold"
                  onClick={() => setShowCommissionWithdrawalModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: '0.85rem', fontWeight: 600 }}
                >
                  💸 Registrar Retirada / Pagamento
                </button>

                {/* Seletor de Período da Comissão: Dia, Semana, Quinzena, Mês, Personalizado, Detalhado */}
                <div style={{ display: 'flex', gap: 4, background: 'var(--adm-surface)', padding: 4, borderRadius: 8, border: '0.5px solid var(--adm-rule)', flexWrap: 'wrap' }}>
                  {[
                    { id: 'dia', label: '📅 Por Dia' },
                    { id: 'semana', label: '🗓️ Por Semana' },
                    { id: 'quinzena', label: '🌓 Por Quinzena' },
                    { id: 'mes', label: '📊 Por Mês' },
                    { id: 'personalizado', label: '🗓️ Período Personalizado' },
                    { id: 'detalhado', label: '📋 Extrato Detalhado' }
                  ].map(mode => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setCommissionViewMode(mode.id)}
                      style={{
                        padding: '8px 14px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        background: commissionViewMode === mode.id ? 'var(--adm-gold)' : 'transparent',
                        color: commissionViewMode === mode.id ? '#000' : 'var(--adm-muted)',
                        transition: 'all 0.2s'
                      }}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Custom date range bar when in 'personalizado' mode */}
            {commissionViewMode === 'personalizado' && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--adm-rule)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--adm-text)' }}>Filtrar Período de Comissões:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>De:</label>
                  <input
                    type="date"
                    value={commissionCustomStart}
                    onChange={e => setCommissionCustomStart(e.target.value)}
                    style={{ padding: '6px 10px', fontSize: '0.82rem', border: '1px solid var(--adm-rule)', borderRadius: 6, background: 'var(--adm-card)', color: 'var(--adm-text)' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>Até:</label>
                  <input
                    type="date"
                    value={commissionCustomEnd}
                    onChange={e => setCommissionCustomEnd(e.target.value)}
                    style={{ padding: '6px 10px', fontSize: '0.82rem', border: '1px solid var(--adm-rule)', borderRadius: 6, background: 'var(--adm-card)', color: 'var(--adm-text)' }}
                  />
                </div>
              </div>
            )}

            {/* Sub-period dropdown selector bar for Dia, Semana, Quinzena, Mês */}
            {commissionViewMode !== 'personalizado' && commissionViewMode !== 'detalhado' && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--adm-rule)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--adm-text)' }}>Filtrar Seleção:</span>
                {commissionViewMode === 'dia' && commissionAggregatedStats.days.length > 0 && (
                  <select
                    value={selectedCommissionDay}
                    onChange={e => setSelectedCommissionDay(e.target.value)}
                    style={{ padding: '6px 10px', fontSize: '0.82rem', border: '1px solid var(--adm-rule)', borderRadius: 6, background: 'var(--adm-card)', color: 'var(--adm-text)', maxWidth: 260 }}
                  >
                    <option value="todos">📅 Todos os Dias ({commissionAggregatedStats.days.length})</option>
                    {commissionAggregatedStats.days.map(d => (
                      <option key={d.date} value={d.date}>{d.label} — R$ {formatCurrencyBRL(d.pendingCommission || d.totalCommission)}</option>
                    ))}
                  </select>
                )}

                {commissionViewMode === 'semana' && commissionAggregatedStats.weeks.length > 0 && (
                  <select
                    value={selectedCommissionWeek}
                    onChange={e => setSelectedCommissionWeek(e.target.value)}
                    style={{ padding: '6px 10px', fontSize: '0.82rem', border: '1px solid var(--adm-rule)', borderRadius: 6, background: 'var(--adm-card)', color: 'var(--adm-text)', maxWidth: 280 }}
                  >
                    <option value="todos">🗓️ Todas as Semanas ({commissionAggregatedStats.weeks.length})</option>
                    {commissionAggregatedStats.weeks.map(w => (
                      <option key={w.sortKey} value={w.sortKey}>{w.label} — R$ {formatCurrencyBRL(w.pendingCommission || w.totalCommission)}</option>
                    ))}
                  </select>
                )}

                {commissionViewMode === 'quinzena' && commissionAggregatedStats.fortnights.length > 0 && (
                  <select
                    value={selectedCommissionFortnight}
                    onChange={e => setSelectedCommissionFortnight(e.target.value)}
                    style={{ padding: '6px 10px', fontSize: '0.82rem', border: '1px solid var(--adm-rule)', borderRadius: 6, background: 'var(--adm-card)', color: 'var(--adm-text)', maxWidth: 280 }}
                  >
                    <option value="todos">🌓 Todas as Quinzenas ({commissionAggregatedStats.fortnights.length})</option>
                    {commissionAggregatedStats.fortnights.map(f => (
                      <option key={f.fortnightKey} value={f.fortnightKey}>{f.label} — R$ {formatCurrencyBRL(f.pendingCommission || f.totalCommission)}</option>
                    ))}
                  </select>
                )}

                {commissionViewMode === 'mes' && commissionAggregatedStats.months.length > 0 && (
                  <select
                    value={selectedCommissionMonth}
                    onChange={e => setSelectedCommissionMonth(e.target.value)}
                    style={{ padding: '6px 10px', fontSize: '0.82rem', border: '1px solid var(--adm-rule)', borderRadius: 6, background: 'var(--adm-card)', color: 'var(--adm-text)', maxWidth: 260 }}
                  >
                    <option value="todos">📊 Todos os Meses ({commissionAggregatedStats.months.length})</option>
                    {commissionAggregatedStats.months.map(m => (
                      <option key={m.month} value={m.month}>{m.label} — R$ {formatCurrencyBRL(m.pendingCommission || m.totalCommission)}</option>
                    ))}
                  </select>
                )}

                <span style={{ fontSize: '0.78rem', color: 'var(--adm-muted)' }}>
                  {commissionKPIs.totalAppointments} atendimento(s) | {commissionKPIs.withdrawalCount} retirada(s)
                </span>
              </div>
            )}

            {/* KPIs Resumo da Comissão com Retiradas e Saldo Pendente */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginTop: 16, marginBottom: 20 }}>
              <div style={{ padding: 16, borderRadius: 8, background: 'rgba(72,187,120,0.08)', border: '0.5px solid rgba(72,187,120,0.3)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--adm-muted)', display: 'block', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Saldo Pendente a Pagar</span>
                <strong style={{ fontSize: '1.4rem', color: '#48bb78' }}>
                  R$ {formatCurrencyBRL(commissionKPIs.pendingPayout)}
                </strong>
                <span style={{ fontSize: '0.72rem', color: 'var(--adm-muted)', display: 'block', marginTop: 4 }}>
                  Gerado: R$ {formatCurrencyBRL(commissionKPIs.totalCommission)} | Já pago: - R$ {formatCurrencyBRL(commissionKPIs.totalWithdrawals)}
                </span>
              </div>
              <div style={{ padding: 16, borderRadius: 8, background: 'rgba(220,163,84,0.04)', border: '0.5px solid var(--adm-rule)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--adm-muted)', display: 'block', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Comissão Serviços</span>
                <strong style={{ fontSize: '1.4rem', color: 'var(--adm-gold)' }}>
                  R$ {formatCurrencyBRL(commissionKPIs.serviceCommission)}
                </strong>
                <span style={{ fontSize: '0.72rem', color: 'var(--adm-muted)', display: 'block', marginTop: 4 }}>
                  Sobre R$ {formatCurrencyBRL(commissionKPIs.totalServicesRevenue)} em serviços
                </span>
              </div>
              <div style={{ padding: 16, borderRadius: 8, background: 'rgba(220,163,84,0.04)', border: '0.5px solid var(--adm-rule)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--adm-muted)', display: 'block', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Comissão Produtos</span>
                <strong style={{ fontSize: '1.4rem', color: '#4299e1' }}>
                  R$ {formatCurrencyBRL(commissionKPIs.productCommission)}
                </strong>
                <span style={{ fontSize: '0.72rem', color: 'var(--adm-muted)', display: 'block', marginTop: 4 }}>
                  Sobre R$ {formatCurrencyBRL(commissionKPIs.totalProductsRevenue)} em vendas
                </span>
              </div>
              <div style={{ padding: 16, borderRadius: 8, background: 'rgba(245,101,101,0.06)', border: '0.5px solid rgba(245,101,101,0.25)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--adm-muted)', display: 'block', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Total Já Retirado / Pago</span>
                <strong style={{ fontSize: '1.4rem', color: '#fc8181' }}>
                  R$ {formatCurrencyBRL(commissionKPIs.totalWithdrawals)}
                </strong>
                <span style={{ fontSize: '0.72rem', color: 'var(--adm-muted)', display: 'block', marginTop: 4 }}>
                  {commissionKPIs.withdrawalCount} retirada(s) no período ({commissionKPIs.label})
                </span>
              </div>
            </div>

            {/* Cards Individuais dos Profissionais com Saldo Pendente e Botão de Retirada */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {professionals.map(p => {
                const commServ = p.commissionService !== undefined ? p.commissionService : (p.commission || 50);
                const commProd = p.commissionProduct !== undefined ? p.commissionProduct : 10;
                const pData = (commissionKPIs.professionalsMap && commissionKPIs.professionalsMap[p.id]) || {
                  serviceRevenue: 0,
                  productRevenue: 0,
                  serviceCommission: 0,
                  productCommission: 0,
                  totalCommission: 0,
                  totalWithdrawals: 0,
                  pendingCommission: 0,
                  count: 0
                };
                return (
                  <div key={p.id} style={{ border: '0.5px solid var(--adm-rule)', padding: 16, borderRadius: 8, background: 'var(--adm-surface)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(220,163,84,0.15)', color: 'var(--adm-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                          {p.name ? p.name.charAt(0).toUpperCase() : 'P'}
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem' }}>{p.name}</h4>
                          <span style={{ fontSize: '0.72rem', color: 'var(--adm-muted)' }}>{pData.count} atendimento(s) no período</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--adm-muted)', display: 'block' }}>Saldo a Pagar</span>
                        <span style={{ fontSize: '1.15rem', color: '#48bb78', fontWeight: 700 }}>
                          R$ {formatCurrencyBRL(pData.pendingCommission)}
                        </span>
                      </div>
                    </div>

                    <div style={{ background: 'var(--adm-card)', padding: '8px 12px', borderRadius: 6, fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', color: 'var(--adm-muted)' }}>
                      <span>Gerado: <strong style={{ color: 'var(--adm-text)' }}>R$ {formatCurrencyBRL(pData.totalCommission)}</strong></span>
                      <span>Retirado: <strong style={{ color: '#fc8181' }}>- R$ {formatCurrencyBRL(pData.totalWithdrawals)}</strong></span>
                    </div>

                    <div style={{ borderTop: '1px solid var(--adm-rule)', paddingTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--adm-muted)', display: 'block' }}>Serviços ({commServ}%)</span>
                        <strong style={{ fontSize: '0.88rem', color: 'var(--adm-text)' }}>R$ {formatCurrencyBRL(pData.serviceCommission)}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--adm-muted)', display: 'block' }}>Produtos ({commProd}%)</span>
                        <strong style={{ fontSize: '0.88rem', color: 'var(--adm-text)' }}>R$ {formatCurrencyBRL(pData.productCommission)}</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => {
                        setCommissionWithdrawalForm(prev => ({
                          ...prev,
                          professionalId: p.id,
                          value: pData.pendingCommission > 0 ? pData.pendingCommission.toFixed(2) : ''
                        }));
                        setShowCommissionWithdrawalModal(true);
                      }}
                      style={{
                        marginTop: 4,
                        padding: '6px 12px',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        background: 'rgba(220,163,84,0.08)',
                        color: 'var(--adm-gold)',
                        border: '1px solid var(--adm-rule-gold)',
                        borderRadius: 6,
                        cursor: 'pointer'
                      }}
                    >
                      💸 Pagar / Retirar Comissão ({p.name})
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TABELA: MODO POR DIA */}
          {commissionViewMode === 'dia' && (
            <div className="financial-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h3 style={{ margin: 0 }}>Comissões por Dia</h3>
                  <p style={{ color: 'var(--adm-muted)', fontSize: '0.82rem', margin: '4px 0 0 0' }}>
                    Demonstrativo consolidado diário dos atendimentos executados e repasses a pagar.
                  </p>
                </div>
              </div>

              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Profissional(is)</th>
                      <th style={{ textAlign: 'center' }}>Atendimentos</th>
                      <th style={{ textAlign: 'right' }}>Faturamento Serviços</th>
                      <th style={{ textAlign: 'right' }}>Comissão Serviços</th>
                      <th style={{ textAlign: 'right' }}>Faturamento Produtos</th>
                      <th style={{ textAlign: 'right' }}>Comissão Produtos</th>
                      <th style={{ textAlign: 'right' }}>Total Comissão / Repasse</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissionAggregatedStats.days.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: 24, color: 'var(--adm-muted)' }}>
                          Nenhum lançamento de comissão no período filtrado.
                        </td>
                      </tr>
                    ) : (
                      commissionAggregatedStats.days.map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            <strong>{item.label}</strong>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {Object.values(item.professionals).map(prof => (
                                <span key={prof.id} style={{ background: 'rgba(220,163,84,0.12)', color: 'var(--adm-gold)', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>
                                  {prof.name}: R$ {formatCurrencyBRL(prof.totalCommission)}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.count}</td>
                          <td style={{ textAlign: 'right' }}>R$ {formatCurrencyBRL(item.serviceRevenue)}</td>
                          <td style={{ textAlign: 'right', color: 'var(--adm-gold)', fontWeight: 600 }}>R$ {formatCurrencyBRL(item.serviceCommission)}</td>
                          <td style={{ textAlign: 'right' }}>R$ {formatCurrencyBRL(item.productRevenue)}</td>
                          <td style={{ textAlign: 'right', color: '#4299e1', fontWeight: 600 }}>R$ {formatCurrencyBRL(item.productCommission)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#48bb78', fontSize: '0.95rem' }}>
                            R$ {formatCurrencyBRL(item.totalCommission)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TABELA: MODO POR SEMANA */}
          {commissionViewMode === 'semana' && (
            <div className="financial-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h3 style={{ margin: 0 }}>Comissões por Semana</h3>
                  <p style={{ color: 'var(--adm-muted)', fontSize: '0.82rem', margin: '4px 0 0 0' }}>
                    Fechamento semanal para controle de pagamentos da equipe.
                  </p>
                </div>
              </div>

              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Semana</th>
                      <th>Profissional(is)</th>
                      <th style={{ textAlign: 'center' }}>Atendimentos</th>
                      <th style={{ textAlign: 'right' }}>Faturamento Serviços</th>
                      <th style={{ textAlign: 'right' }}>Comissão Serviços</th>
                      <th style={{ textAlign: 'right' }}>Faturamento Produtos</th>
                      <th style={{ textAlign: 'right' }}>Comissão Produtos</th>
                      <th style={{ textAlign: 'right' }}>Total Comissão / Repasse</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissionAggregatedStats.weeks.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: 24, color: 'var(--adm-muted)' }}>
                          Nenhum lançamento de comissão no período filtrado.
                        </td>
                      </tr>
                    ) : (
                      commissionAggregatedStats.weeks.map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            <strong>{item.label}</strong>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {Object.values(item.professionals).map(prof => (
                                <span key={prof.id} style={{ background: 'rgba(220,163,84,0.12)', color: 'var(--adm-gold)', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>
                                  {prof.name}: R$ {formatCurrencyBRL(prof.totalCommission)}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.count}</td>
                          <td style={{ textAlign: 'right' }}>R$ {formatCurrencyBRL(item.serviceRevenue)}</td>
                          <td style={{ textAlign: 'right', color: 'var(--adm-gold)', fontWeight: 600 }}>R$ {formatCurrencyBRL(item.serviceCommission)}</td>
                          <td style={{ textAlign: 'right' }}>R$ {formatCurrencyBRL(item.productRevenue)}</td>
                          <td style={{ textAlign: 'right', color: '#4299e1', fontWeight: 600 }}>R$ {formatCurrencyBRL(item.productCommission)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#48bb78', fontSize: '0.95rem' }}>
                            R$ {formatCurrencyBRL(item.totalCommission)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TABELA: MODO POR QUINZENA */}
          {commissionViewMode === 'quinzena' && (
            <div className="financial-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h3 style={{ margin: 0 }}>Comissões por Quinzena</h3>
                  <p style={{ color: 'var(--adm-muted)', fontSize: '0.82rem', margin: '4px 0 0 0' }}>
                    Fechamento quinzenal (1ª Quinzena: 01 a 15 / 2ª Quinzena: 16 ao fim do mês) para acerto com os profissionais.
                  </p>
                </div>
              </div>

              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Quinzena</th>
                      <th>Profissional(is)</th>
                      <th style={{ textAlign: 'center' }}>Atendimentos</th>
                      <th style={{ textAlign: 'right' }}>Faturamento Serviços</th>
                      <th style={{ textAlign: 'right' }}>Comissão Serviços</th>
                      <th style={{ textAlign: 'right' }}>Faturamento Produtos</th>
                      <th style={{ textAlign: 'right' }}>Comissão Produtos</th>
                      <th style={{ textAlign: 'right' }}>Total Comissão / Repasse</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissionAggregatedStats.fortnights.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: 24, color: 'var(--adm-muted)' }}>
                          Nenhum lançamento de comissão no período filtrado.
                        </td>
                      </tr>
                    ) : (
                      commissionAggregatedStats.fortnights.map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            <strong>{item.label}</strong>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {Object.values(item.professionals).map(prof => (
                                <span key={prof.id} style={{ background: 'rgba(220,163,84,0.12)', color: 'var(--adm-gold)', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>
                                  {prof.name}: R$ {formatCurrencyBRL(prof.totalCommission)}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.count}</td>
                          <td style={{ textAlign: 'right' }}>R$ {formatCurrencyBRL(item.serviceRevenue)}</td>
                          <td style={{ textAlign: 'right', color: 'var(--adm-gold)', fontWeight: 600 }}>R$ {formatCurrencyBRL(item.serviceCommission)}</td>
                          <td style={{ textAlign: 'right' }}>R$ {formatCurrencyBRL(item.productRevenue)}</td>
                          <td style={{ textAlign: 'right', color: '#4299e1', fontWeight: 600 }}>R$ {formatCurrencyBRL(item.productCommission)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#48bb78', fontSize: '0.95rem' }}>
                            R$ {formatCurrencyBRL(item.totalCommission)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TABELA: MODO POR MÊS */}
          {commissionViewMode === 'mes' && (
            <div className="financial-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h3 style={{ margin: 0 }}>Comissões Consolidadas por Mês</h3>
                  <p style={{ color: 'var(--adm-muted)', fontSize: '0.82rem', margin: '4px 0 0 0' }}>
                    Resumo mensal completo dos repasses e produtividade de cada profissional.
                  </p>
                </div>
              </div>

              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Mês</th>
                      <th>Profissional(is)</th>
                      <th style={{ textAlign: 'center' }}>Atendimentos</th>
                      <th style={{ textAlign: 'right' }}>Faturamento Serviços</th>
                      <th style={{ textAlign: 'right' }}>Comissão Serviços</th>
                      <th style={{ textAlign: 'right' }}>Faturamento Produtos</th>
                      <th style={{ textAlign: 'right' }}>Comissão Produtos</th>
                      <th style={{ textAlign: 'right' }}>Total Comissão / Repasse</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissionAggregatedStats.months.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: 24, color: 'var(--adm-muted)' }}>
                          Nenhum lançamento de comissão no período filtrado.
                        </td>
                      </tr>
                    ) : (
                      commissionAggregatedStats.months.map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            <strong>{item.label}</strong>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {Object.values(item.professionals).map(prof => (
                                <span key={prof.id} style={{ background: 'rgba(220,163,84,0.12)', color: 'var(--adm-gold)', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>
                                  {prof.name}: R$ {formatCurrencyBRL(prof.totalCommission)}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.count}</td>
                          <td style={{ textAlign: 'right' }}>R$ {formatCurrencyBRL(item.serviceRevenue)}</td>
                          <td style={{ textAlign: 'right', color: 'var(--adm-gold)', fontWeight: 600 }}>R$ {formatCurrencyBRL(item.serviceCommission)}</td>
                          <td style={{ textAlign: 'right' }}>R$ {formatCurrencyBRL(item.productRevenue)}</td>
                          <td style={{ textAlign: 'right', color: '#4299e1', fontWeight: 600 }}>R$ {formatCurrencyBRL(item.productCommission)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#48bb78', fontSize: '0.95rem' }}>
                            R$ {formatCurrencyBRL(item.totalCommission)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TABELA: MODO PERÍODO PERSONALIZADO */}
          {commissionViewMode === 'personalizado' && (
            <div className="financial-card">
              <div style={{ padding: 16, borderRadius: 8, background: 'rgba(220,163,84,0.06)', border: '0.5px solid var(--adm-gold-border)', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h4 style={{ margin: 0, color: 'var(--adm-gold)' }}>{commissionAggregatedStats.customPeriod.label}</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--adm-muted)' }}>
                    Total de {commissionAggregatedStats.customPeriod.count} atendimento(s) e vendas no período personalizado
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--adm-muted)', display: 'block' }}>Total de Repasses:</span>
                  <strong style={{ fontSize: '1.4rem', color: '#48bb78' }}>
                    R$ {formatCurrencyBRL(commissionAggregatedStats.customPeriod.totalCommission)}
                  </strong>
                </div>
              </div>

              {/* Cards dos Profissionais no Período Personalizado */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14, marginBottom: 20 }}>
                {Object.values(commissionAggregatedStats.customPeriod.professionals).map(p => (
                  <div key={p.id} style={{ border: '0.5px solid var(--adm-rule)', padding: 14, borderRadius: 8, background: 'var(--adm-surface)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <strong style={{ fontSize: '1rem', color: 'var(--adm-gold)' }}>{p.name}</strong>
                      <span style={{ fontWeight: 700, color: '#48bb78', fontSize: '1.05rem' }}>
                        R$ {formatCurrencyBRL(p.totalCommission)}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--adm-muted)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Serviços: R$ {formatCurrencyBRL(p.serviceCommission)}</span>
                      <span>Produtos: R$ {formatCurrencyBRL(p.productCommission)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tabela de Lançamentos no Período Personalizado */}
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Cliente</th>
                      <th>Profissional</th>
                      <th>Forma</th>
                      <th style={{ textAlign: 'right' }}>Bruto</th>
                      <th style={{ textAlign: 'right' }}>Comissão</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissionAggregatedStats.customPeriod.items.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: 24, color: 'var(--adm-muted)' }}>
                          Nenhum atendimento encontrado para o período selecionado.
                        </td>
                      </tr>
                    ) : (
                      commissionAggregatedStats.customPeriod.items.map(item => (
                        <tr key={item.id}>
                          <td>{item.date.split('-').reverse().join('/')} às {item.time}</td>
                          <td>
                            <strong>{item.clientName}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>{item.description}</div>
                          </td>
                          <td><span style={{ color: 'var(--adm-gold)', fontWeight: 600 }}>{item.profName}</span></td>
                          <td>{item.paymentMethod}</td>
                          <td style={{ textAlign: 'right' }}>R$ {formatCurrencyBRL(item.grossValue)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#48bb78' }}>
                            R$ {formatCurrencyBRL(item.totalComm)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TABELA: MODO EXTRATO DETALHADO */}
          {commissionViewMode === 'detalhado' && (
            <div className="financial-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h3 style={{ margin: 0 }}>Extrato Detalhado de Comissões</h3>
                  <p style={{ color: 'var(--adm-muted)', fontSize: '0.82rem', margin: '4px 0 0 0' }}>
                    Lista de cada atendimento com o detalhamento das porcentagens de serviços e produtos aplicadas.
                  </p>
                </div>

                <div style={{ position: 'relative', minWidth: 240 }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--adm-muted)' }} />
                  <input
                    type="text"
                    placeholder="Filtrar por cliente, serviço ou profissional..."
                    value={commissionSearch}
                    onChange={e => setCommissionSearch(e.target.value)}
                    style={{ paddingLeft: 30, width: '100%', paddingRight: 10, paddingTop: 6, paddingBottom: 6, fontSize: '0.82rem', border: '1px solid var(--adm-rule)', borderRadius: 6, background: 'var(--adm-card)', color: 'var(--adm-text)' }}
                  />
                </div>
              </div>

              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Data / Hora</th>
                      <th>Cliente & Serviço</th>
                      <th>Forma Pagamento</th>
                      <th>Valor Bruto</th>
                      <th>Valor Líquido</th>
                      <th>Profissional</th>
                      <th>Comissão Calculada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissionAggregatedStats.detailedList.filter(item => 
                      !commissionSearch || 
                      item.clientName.toLowerCase().includes(commissionSearch.toLowerCase()) || 
                      item.description.toLowerCase().includes(commissionSearch.toLowerCase()) ||
                      item.profName.toLowerCase().includes(commissionSearch.toLowerCase())
                    ).length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: 24, color: 'var(--adm-muted)' }}>
                          Nenhum atendimento corresponde aos filtros.
                        </td>
                      </tr>
                    ) : (
                      commissionAggregatedStats.detailedList
                        .filter(item => 
                          !commissionSearch || 
                          item.clientName.toLowerCase().includes(commissionSearch.toLowerCase()) || 
                          item.description.toLowerCase().includes(commissionSearch.toLowerCase()) ||
                          item.profName.toLowerCase().includes(commissionSearch.toLowerCase())
                        )
                        .map(item => {
                          const parts = [];
                          if (item.rawServ > 0) parts.push(`Serv: R$ ${formatCurrencyBRL(item.servComm)} (${item.commServRate}%)`);
                          if (item.rawProd > 0) parts.push(`Prod: R$ ${formatCurrencyBRL(item.prodComm)} (${item.commProdRate}%)`);
                          const detailsStr = parts.join(' + ');

                          return (
                            <tr key={item.id}>
                              <td>{item.date.split('-').reverse().join('/')} às {item.time}</td>
                              <td>
                                <div style={{ fontWeight: 600 }}>{item.clientName}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--adm-muted)' }}>{item.description}</div>
                              </td>
                              <td>{item.paymentMethod}</td>
                              <td>R$ {formatCurrencyBRL(item.grossValue)}</td>
                              <td>R$ {formatCurrencyBRL(item.netValue)}</td>
                              <td>
                                <span style={{ fontWeight: 600, color: 'var(--adm-gold)' }}>{item.profName}</span>
                              </td>
                              <td style={{ color: item.totalComm > 0 ? '#48bb78' : 'var(--adm-muted)' }}>
                                {item.totalComm > 0 ? (
                                  <div>
                                    <div style={{ fontWeight: 700 }}>R$ {formatCurrencyBRL(item.totalComm)}</div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--adm-muted)', marginTop: 2 }}>{detailsStr}</div>
                                  </div>
                                ) : 'R$ 0,00'}
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

          {/* TABELA: HISTÓRICO DE RETIRADAS E PAGAMENTOS DE COMISSÃO */}
          <div className="financial-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <DollarSign size={20} color="#fc8181" /> Histórico de Retiradas e Pagamentos de Comissão
                </h3>
                <p style={{ color: 'var(--adm-muted)', fontSize: '0.82rem', margin: '4px 0 0 0' }}>
                  Extrato de adiantamentos, vales e pagamentos de comissão efetuados aos profissionais no período ({commissionKPIs.label}).
                </p>
              </div>
              <button 
                type="button" 
                className="btn btn-spectro-gold" 
                onClick={() => setShowCommissionWithdrawalModal(true)}
                style={{ padding: '6px 14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                💸 + Nova Retirada / Pagar
              </button>
            </div>

            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Data / Hora</th>
                    <th>Profissional</th>
                    <th>Descrição / Motivo</th>
                    <th>Forma de Pagamento</th>
                    <th>Observações</th>
                    <th style={{ textAlign: 'right' }}>Valor Deduzido</th>
                    <th style={{ textAlign: 'center' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {commissionKPIs.withdrawalsList.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: 24, color: 'var(--adm-muted)' }}>
                        Nenhuma retirada ou adiantamento de comissão registrado no período selecionado.
                      </td>
                    </tr>
                  ) : (
                    commissionKPIs.withdrawalsList.map(w => (
                      <tr key={w.id}>
                        <td>{w.date.split('-').reverse().join('/')} às {w.time || '00:00'}</td>
                        <td>
                          <strong style={{ color: 'var(--adm-gold)' }}>{w.profName}</strong>
                        </td>
                        <td>{w.description}</td>
                        <td>
                          <span style={{ padding: '2px 8px', borderRadius: 4, background: 'var(--adm-surface)', border: '0.5px solid var(--adm-rule)', fontSize: '0.78rem' }}>
                            {w.paymentMethod}
                          </span>
                        </td>
                        <td style={{ color: 'var(--adm-muted)', fontSize: '0.8rem' }}>{w.notes || '—'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#fc8181', fontSize: '0.95rem' }}>
                          - R$ {formatCurrencyBRL(w.value)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleDeleteTransaction(w.id)}
                            title="Excluir retirada de comissão"
                            style={{ background: 'transparent', border: 'none', color: '#e53e3e', cursor: 'pointer', padding: 4 }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB: ATENDIMENTOS (POR DIA, SEMANA, MÊS, PERÍODO) */}
      {activeSubTab === 'atendimentos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="financial-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ margin: 0 }}>Relatório de Atendimentos</h3>
                <p style={{ color: 'var(--adm-muted)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                  Acompanhe a quantidade de clientes atendidas, bem como a lista de serviços e produtos consumidos por período.
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: 8, background: 'var(--adm-surface)', padding: 4, borderRadius: 6, border: '0.5px solid var(--adm-rule)' }}>
                {[
                  { id: 'detalhado', label: 'Lista Detalhada' },
                  { id: 'dia', label: 'Por Dia' },
                  { id: 'semana', label: 'Por Semana' },
                  { id: 'mes', label: 'Por Mês' }
                ].map(mode => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setAttendanceViewMode(mode.id)}
                    style={{
                      padding: '6px 12px', fontSize: '0.78rem', fontWeight: 600, border: 'none', borderRadius: 4, cursor: 'pointer',
                      background: attendanceViewMode === mode.id ? 'var(--adm-gold)' : 'transparent',
                      color: attendanceViewMode === mode.id ? '#000' : 'var(--adm-muted)',
                      transition: 'all 0.2s'
                    }}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* RESUMO RÁPIDO DO MODO */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
              <div style={{ padding: 16, borderRadius: 8, background: 'rgba(220,163,84,0.04)', border: '0.5px solid var(--adm-rule)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--adm-muted)', display: 'block', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Total Clientes Atendidos</span>
                <strong style={{ fontSize: '1.4rem', color: 'var(--adm-gold)' }}>
                  {detailedAttendanceList.filter(item => item.services.length > 0).length}
                </strong>
              </div>
              <div style={{ padding: 16, borderRadius: 8, background: 'rgba(220,163,84,0.04)', border: '0.5px solid var(--adm-rule)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--adm-muted)', display: 'block', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Receita Est. de Serviços</span>
                <strong style={{ fontSize: '1.4rem', color: 'var(--adm-success)' }}>
                  R$ {detailedAttendanceList.reduce((sum, item) => sum + item.services.reduce((sSum, s) => sSum + s.price, 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </strong>
              </div>
              <div style={{ padding: 16, borderRadius: 8, background: 'rgba(220,163,84,0.04)', border: '0.5px solid var(--adm-rule)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--adm-muted)', display: 'block', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Receita Est. de Produtos</span>
                <strong style={{ fontSize: '1.4rem', color: '#4299e1' }}>
                  R$ {detailedAttendanceList.reduce((sum, item) => sum + item.products.reduce((pSum, p) => pSum + p.price, 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </strong>
              </div>
            </div>

            {/* TABELA: DETALHADO */}
            {attendanceViewMode === 'detalhado' && (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Data / Hora</th>
                      <th>Cliente</th>
                      <th>Serviços Consumidos</th>
                      <th>Produtos Consumidos</th>
                      <th style={{ textAlign: 'right' }}>Total Consumido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailedAttendanceList.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: 24, color: 'var(--adm-muted)' }}>
                          Nenhum atendimento finalizado ou venda de produto registrada no período.
                        </td>
                      </tr>
                    ) : (
                      detailedAttendanceList.map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            <strong>{new Date(item.date + 'T00:00:00').toLocaleDateString('pt-BR')}</strong>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--adm-muted)', marginTop: 2 }}>
                              {item.time}
                            </span>
                          </td>
                          <td>
                            <strong style={{ color: '#fff' }}>{item.clientName}</strong>
                            {item.clientPhone && (
                              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--adm-muted)', marginTop: 2 }}>
                                {item.clientPhone}
                              </span>
                            )}
                          </td>
                          <td>
                            {item.services.length === 0 ? (
                              <span style={{ color: 'var(--adm-muted)', fontSize: '0.8rem' }}>Sem serviços</span>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {item.services.map((s, sIdx) => (
                                  <span key={sIdx} style={{ fontSize: '0.82rem', color: 'var(--adm-text)' }}>
                                    ✅ {s.name} <span style={{ color: 'var(--adm-gold)', fontSize: '0.78rem' }}>(R$ {formatCurrencyBRL(s.price)})</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td>
                            {item.products.length === 0 ? (
                              <span style={{ color: 'var(--adm-muted)', fontSize: '0.8rem' }}>Sem produtos</span>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {item.products.map((p, pIdx) => (
                                  <span key={pIdx} style={{ fontSize: '0.82rem', color: 'var(--adm-text)' }}>
                                    🛍️ {p.quantity}x {p.name} <span style={{ color: '#4299e1', fontSize: '0.78rem' }}>(R$ {formatCurrencyBRL(p.price)})</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--adm-success)' }}>
                            R$ {item.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TABELA: DIÁRIO */}
            {attendanceViewMode === 'dia' && (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th style={{ textAlign: 'center' }}>Clientes Atendidas (Serviço)</th>
                      <th style={{ textAlign: 'right' }}>Faturamento Serviços</th>
                      <th style={{ textAlign: 'right' }}>Faturamento Produtos</th>
                      <th style={{ textAlign: 'right' }}>Total Geral</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceAggregatedStats.days.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: 24, color: 'var(--adm-muted)' }}>
                          Nenhum dado diário consolidado para o período.
                        </td>
                      </tr>
                    ) : (
                      attendanceAggregatedStats.days.map((item, idx) => (
                        <tr key={idx}>
                          <td><strong>{new Date(item.date + 'T00:00:00').toLocaleDateString('pt-BR')}</strong></td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.count}</td>
                          <td style={{ textAlign: 'right', color: 'var(--adm-success)' }}>
                            R$ {item.serviceRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ textAlign: 'right', color: '#4299e1' }}>
                            R$ {item.productRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--adm-gold)' }}>
                            R$ {item.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TABELA: SEMANAL */}
            {attendanceViewMode === 'semana' && (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Semana (Segunda-Feira)</th>
                      <th style={{ textAlign: 'center' }}>Clientes Atendidas (Serviço)</th>
                      <th style={{ textAlign: 'right' }}>Faturamento Serviços</th>
                      <th style={{ textAlign: 'right' }}>Faturamento Produtos</th>
                      <th style={{ textAlign: 'right' }}>Total Geral</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceAggregatedStats.weeks.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: 24, color: 'var(--adm-muted)' }}>
                          Nenhum dado semanal consolidado para o período.
                        </td>
                      </tr>
                    ) : (
                      attendanceAggregatedStats.weeks.map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            <strong>{new Date(item.weekStart + 'T00:00:00').toLocaleDateString('pt-BR')}</strong>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.count}</td>
                          <td style={{ textAlign: 'right', color: 'var(--adm-success)' }}>
                            R$ {item.serviceRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ textAlign: 'right', color: '#4299e1' }}>
                            R$ {item.productRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--adm-gold)' }}>
                            R$ {item.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TABELA: MENSAL */}
            {attendanceViewMode === 'mes' && (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Mês / Ano</th>
                      <th style={{ textAlign: 'center' }}>Clientes Atendidas (Serviço)</th>
                      <th style={{ textAlign: 'right' }}>Faturamento Serviços</th>
                      <th style={{ textAlign: 'right' }}>Faturamento Produtos</th>
                      <th style={{ textAlign: 'right' }}>Total Geral</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceAggregatedStats.months.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: 24, color: 'var(--adm-muted)' }}>
                          Nenhum dado mensal consolidado para o período.
                        </td>
                      </tr>
                    ) : (
                      attendanceAggregatedStats.months.map((item, idx) => {
                        const [year, month] = item.month.split('-');
                        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
                        const monthLabel = `${monthNames[Number(month) - 1]} / ${year}`;
                        return (
                          <tr key={idx}>
                            <td><strong>{monthLabel}</strong></td>
                            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.count}</td>
                            <td style={{ textAlign: 'right', color: 'var(--adm-success)' }}>
                              R$ {item.serviceRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ textAlign: 'right', color: '#4299e1' }}>
                              R$ {item.productRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--adm-gold)' }}>
                              R$ {item.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </div>
      )}

      {/* SUBTAB: PRODUTOS (LISTA DE PRODUTOS VENDIDOS NO PERÍODO) */}
      {activeSubTab === 'produtos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Resumo de Vendas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div className="financial-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ background: 'rgba(212, 163, 89, 0.1)', color: 'var(--adm-gold)', padding: 12, borderRadius: 8 }}>
                <ShoppingBag size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--adm-muted)' }}>Itens Vendidos</span>
                <h2 style={{ margin: '4px 0 0 0', fontSize: '1.8rem' }}>{totalProductsSold}</h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>no período selecionado</span>
              </div>
            </div>

            <div className="financial-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ background: 'rgba(52, 211, 153, 0.1)', color: 'var(--adm-success)', padding: 12, borderRadius: 8 }}>
                <DollarSign size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--adm-muted)' }}>Faturamento de Vendas</span>
                <h2 style={{ margin: '4px 0 0 0', fontSize: '1.8rem', color: 'var(--adm-success)' }}>
                  R$ {productGrossRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>bruto consolidado</span>
              </div>
            </div>

            <div className="financial-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ background: 'rgba(212, 163, 89, 0.1)', color: 'var(--adm-gold)', padding: 12, borderRadius: 8 }}>
                <TrendingUp size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--adm-muted)' }}>Lucro Líquido</span>
                <h2 style={{ margin: '4px 0 0 0', fontSize: '1.8rem', color: 'var(--adm-gold)' }}>
                  R$ {productNetProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>
                  Margem: {productGrossRevenue > 0 ? ((productNetProfit / productGrossRevenue) * 100).toFixed(0) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Tabela de Vendas e Filtro de Busca */}
          <div className="financial-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ margin: 0 }}>Relatório Detalhado de Vendas</h3>
                <p style={{ color: 'var(--adm-muted)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                  Lista unitária de cada produto comercializado no período filtrado.
                </p>
              </div>
              <div className="search-box" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--adm-surface)', padding: '6px 12px', borderRadius: 8, border: '0.5px solid var(--adm-rule)', width: '300px' }}>
                <Search size={16} style={{ color: 'var(--adm-muted)' }} />
                <input
                  type="text"
                  placeholder="Pesquisar por produto ou cliente..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  style={{ background: 'none', border: 'none', color: 'inherit', fontSize: '0.85rem', width: '100%', outline: 'none' }}
                />
              </div>
            </div>

            <div className="table-responsive">
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--adm-rule)', color: 'var(--adm-muted)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Data</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Produto</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Cliente</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Qtd</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Preço Venda</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Custo Unit.</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Faturamento</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Lucro</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProductSales.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: 32, color: 'var(--adm-muted)' }}>
                        Nenhuma venda de produto encontrada para o termo ou período selecionado.
                      </td>
                    </tr>
                  ) : (
                    filteredProductSales.map((item, idx) => {
                      const [year, month, day] = item.date.split('-');
                      const formattedDate = `${day}/${month}`;
                      return (
                        <tr key={item.id || idx} style={{ borderBottom: '0.5px solid var(--adm-rule)', transition: 'background-color 0.2s' }} className="table-row-hover">
                          <td style={{ padding: '12px 16px', color: 'var(--adm-muted)' }}>{formattedDate}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 600 }}>{item.productName}</td>
                          <td style={{ padding: '12px 16px' }}>{item.clientName}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>{item.quantity}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            R$ {item.sellingPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--adm-muted)' }}>
                            R$ {item.costPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            R$ {item.totalSale.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold', color: 'var(--adm-gold)' }}>
                            R$ {item.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
      )}

      {/* SUBTAB: TAXAS DE MAQUININHA */}
      {activeSubTab === 'taxas' && (
        <div style={{ maxWidth: '600px' }}>
          <form className="financial-card" onSubmit={handleSaveFees}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <CreditCard size={18} style={{ color: '#f97316' }} />
              <h3 style={{ margin: 0 }}>Taxas de Meios de Recebimento</h3>
            </div>
            <p style={{ color: 'var(--adm-muted)', fontSize: '0.82rem', marginBottom: 20 }}>
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

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Modo de Antecipação de Recebíveis</label>
              <select 
                value={feesForm.autoAnticipation ? 'auto' : 'manual'} 
                onChange={e => setFeesForm({ ...feesForm, autoAnticipation: e.target.value === 'auto' })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--adm-rule)', borderRadius: '6px', background: 'var(--adm-card)', color: 'var(--adm-text)', fontSize: '0.85rem' }}
              >
                <option value="manual">Modo Manual (Padrão - Sem Antecipação Automática nas Operadoras)</option>
                <option value="auto">Modo Automático (Antecipação em todas as vendas no crédito)</option>
              </select>
              <span style={{ fontSize: '0.75rem', color: feesForm.autoAnticipation ? '#f97316' : '#22c55e', display: 'block', marginTop: 6, fontWeight: 500 }}>
                {feesForm.autoAnticipation 
                  ? '⚡ Modo Automático: A taxa de antecipação é descontada automaticamente em todas as transações com cartão de crédito.' 
                  : '🛡️ Modo Manual (Ativo): As vendas com cartão descontam apenas a taxa da adquirente. A antecipação só será calculada se for selecionada manualmente.'}
              </span>
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
              <span style={{ fontSize: '0.75rem', color: 'var(--adm-muted)', display: 'block', marginTop: 4 }}>
                Esta taxa será aplicada quando a antecipação for ativada na venda/comanda ou no modo automático.
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
                <h3 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--adm-muted)', fontWeight: 600 }}>Pacotes Ativos</h3>
                <div style={{ fontSize: '1.6rem', marginTop: 8, fontWeight: 700, color: 'var(--adm-text)' }}>{activeCount}</div>
              </div>
              <div className="stat-card" style={{ border: '0.5px solid var(--adm-rule)' }}>
                <h3 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--adm-muted)', fontWeight: 600 }}>Receita Total Gerada</h3>
                <div style={{ fontSize: '1.6rem', marginTop: 8, fontWeight: 700, color: '#2f855a' }}>
                  R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="stat-card" style={{ border: '0.5px solid var(--adm-rule)' }}>
                <h3 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--adm-muted)', fontWeight: 600 }}>Sessões Restantes</h3>
                <div style={{ fontSize: '1.6rem', marginTop: 8, fontWeight: 700, color: 'var(--adm-gold)' }}>{remainingCredits} sessões</div>
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
                  <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--adm-muted)' }} />
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
                              <div style={{ fontSize: '0.8rem', color: 'var(--adm-muted)' }}>{cp.clientPhone || 'Sem telefone'}</div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{cp.packageName}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>Cód: {cp.packageId}</div>
                            </td>
                            <td>{cp.datePurchased ? cp.datePurchased.split('-').reverse().join('/') : 'N/A'}</td>
                            <td style={{ fontWeight: 'bold', color: '#2f855a' }}>
                              R$ {(Number(cp.pricePaid) || 0).toFixed(2)}
                              <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--adm-muted)', fontWeight: 'normal' }}>
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
                                      <span style={{ fontWeight: 'bold', color: rem > 0 ? 'var(--adm-gold)' : 'var(--adm-muted)' }}>
                                        {rem} sessões
                                      </span>
                                    </div>
                                  );
                                })}
                                {totalCredits === 0 && (
                                  <span style={{ fontSize: '0.8rem', color: 'var(--adm-muted)', fontStyle: 'italic' }}>
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
                                  style={{ padding: 6, color: 'var(--adm-gold)' }} 
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

      {activeSubTab === 'precificacao' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Calculadoras */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
            {/* Calculadora 1: Custo por Hora */}
            <Card>
              <h3 style={{ margin: '0 0 16px 0', color: 'var(--adm-gold)', display: 'flex', alignItems: 'center', gap: 8 }}>
                💰 Simulador de Custo-Hora (A Hora-Salão)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--adm-muted)' }}>Custo Fixo Mensal (R$)</label>
                  <input
                    type="number"
                    value={fixedCosts}
                    onChange={(e) => setFixedCosts(Number(e.target.value))}
                    style={{ padding: 8, background: '#fff', color: '#111', fontWeight: 'bold', border: '1px solid var(--adm-gold)', borderRadius: 6 }}
                  />
                  <span style={{ fontSize: '0.65rem', color: 'var(--adm-muted)' }}>Soma de aluguel, luz, sistemas, água, etc.</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--adm-muted)' }}>Pró-labore Desejado (R$)</label>
                  <input
                    type="number"
                    value={proLabore}
                    onChange={(e) => setProLabore(Number(e.target.value))}
                    style={{ padding: 8, background: '#fff', color: '#111', fontWeight: 'bold', border: '1px solid var(--adm-gold)', borderRadius: 6 }}
                  />
                  <span style={{ fontSize: '0.65rem', color: 'var(--adm-muted)' }}>Seu salário fixo de gestor/profissional.</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--adm-muted)' }}>Dias Úteis/Mês</label>
                    <input
                      type="number"
                      value={workDays}
                      onChange={(e) => setWorkDays(Number(e.target.value))}
                      style={{ padding: 8, background: '#fff', color: '#111', fontWeight: 'bold', border: '1px solid var(--adm-gold)', borderRadius: 6 }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--adm-muted)' }}>Horas Abertas/Dia</label>
                    <input
                      type="number"
                      value={workHours}
                      onChange={(e) => setWorkHours(Number(e.target.value))}
                      style={{ padding: 8, background: '#fff', color: '#111', fontWeight: 'bold', border: '1px solid var(--adm-gold)', borderRadius: 6 }}
                    />
                  </div>
                </div>
                
                <div style={{ marginTop: 16, padding: 12, background: 'rgba(220,163,84,0.06)', borderRadius: 8, border: '0.5px solid var(--adm-rule-gold)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--adm-text-2)' }}>Custo por Hora da Cadeira:</span>
                    <strong style={{ color: 'var(--adm-gold)' }}>R$ {((fixedCosts + proLabore) / (workDays * workHours || 1)).toFixed(2).replace('.', ',')}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--adm-text-2)' }}>Custo por Minuto de Cadeira:</span>
                    <strong style={{ color: 'var(--adm-gold)' }}>R$ {(((fixedCosts + proLabore) / (workDays * workHours || 1)) / 60).toFixed(4).replace('.', ',')}</strong>
                  </div>
                </div>
              </div>
            </Card>

            {/* Calculadora 2: Precificação de Serviço */}
            <Card>
              <h3 style={{ margin: '0 0 16px 0', color: 'var(--adm-gold)', display: 'flex', alignItems: 'center', gap: 8 }}>
                ✂️ Simulador de Preço de Venda
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--adm-muted)' }}>Tempo do Serviço (min)</label>
                    <input
                      type="number"
                      value={serviceDuration}
                      onChange={(e) => setServiceDuration(Number(e.target.value))}
                      style={{ padding: 8, background: '#fff', color: '#111', fontWeight: 'bold', border: '1px solid var(--adm-gold)', borderRadius: 6 }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--adm-muted)' }}>Custo Insumos (R$)</label>
                    <input
                      type="number"
                      value={productCostInput}
                      onChange={(e) => setProductCostInput(Number(e.target.value))}
                      style={{ padding: 8, background: '#fff', color: '#111', fontWeight: 'bold', border: '1px solid var(--adm-gold)', borderRadius: 6 }}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--adm-muted)' }}>Margem de Lucro (%)</label>
                    <input
                      type="number"
                      value={markup}
                      onChange={(e) => setMarkup(Number(e.target.value))}
                      style={{ padding: 8, background: '#fff', color: '#111', fontWeight: 'bold', border: '1px solid var(--adm-gold)', borderRadius: 6 }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--adm-muted)' }}>Impostos & Taxas (%)</label>
                    <input
                      type="number"
                      value={feesTaxPercentage}
                      onChange={(e) => setFeesTaxPercentage(Number(e.target.value))}
                      style={{ padding: 8, background: '#fff', color: '#111', fontWeight: 'bold', border: '1px solid var(--adm-gold)', borderRadius: 6 }}
                    />
                  </div>
                </div>

                {(() => {
                  const hourCost = (fixedCosts + proLabore) / (workDays * workHours || 1);
                  const minCost = hourCost / 60;
                  const serviceTimeCost = serviceDuration * minCost;
                  const totalPercent = 1 - (markup / 100) - (feesTaxPercentage / 100);
                  const finalPrice = totalPercent > 0.05 ? (serviceTimeCost + productCostInput) / totalPercent : 0;
                  const taxValue = finalPrice * (feesTaxPercentage / 100);
                  const netProfit = finalPrice * (markup / 100);
                  
                  return (
                    <div style={{ marginTop: 12, padding: 12, background: 'rgba(56,161,105,0.06)', borderRadius: 8, border: '0.5px solid var(--adm-rule-success)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--adm-text-2)' }}>Custo de Cadeira do Serviço:</span>
                        <span>R$ {serviceTimeCost.toFixed(2).replace('.', ',')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--adm-text-2)' }}>Custo de Insumo + Perdas:</span>
                        <span>R$ {productCostInput.toFixed(2).replace('.', ',')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--adm-text-2)' }}>Impostos e Taxas (DAS/Cartão):</span>
                        <span>R$ {taxValue.toFixed(2).replace('.', ',')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '0.5px solid var(--adm-rule)', paddingTop: 8, marginTop: 8 }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>Preço Mínimo Sugerido:</span>
                        <strong style={{ color: 'var(--adm-success)', fontSize: '1.1rem' }}>
                          {finalPrice > 0 ? `R$ ${finalPrice.toFixed(2).replace('.', ',')}` : 'Erro na margem'}
                        </strong>
                      </div>
                      {finalPrice > 0 && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--adm-muted)', textAlign: 'right', marginTop: 4 }}>
                          Garante R$ {netProfit.toFixed(2).replace('.', ',')} de Lucro Líquido Real ({markup}%)
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </Card>
          </div>

          {/* Custos e Vendas de Produtos / Uso do Salão */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 20 }}>
            {/* Tabela de Produtos de Venda (Estoque Comercial) */}
            <Card>
              <h3 style={{ margin: '0 0 12px 0', color: 'var(--adm-gold)', display: 'flex', alignItems: 'center', gap: 8 }}>
                📦 Custos e Vendas de Produtos (Estoque de Venda)
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--adm-muted)', marginBottom: 16 }}>
                Simulação e controle de margem de lucro de revenda de produtos comerciais para clientes.
              </p>
              <div className="table-responsive" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th style={{ textAlign: 'right' }}>Custo</th>
                      <th style={{ textAlign: 'right' }}>Venda</th>
                      <th style={{ textAlign: 'right' }}>Margem Lucro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', color: 'var(--adm-muted)', padding: 12 }}>
                          Nenhum produto cadastrado para revenda.
                        </td>
                      </tr>
                    ) : (
                      products.map(p => {
                        const cost = Number(p.costPrice) || 0;
                        const sell = Number(p.sellingPrice) || 0;
                        const profit = sell - cost;
                        const marginPercent = sell > 0 ? (profit / sell) * 100 : 0;
                        return (
                          <tr key={p.id}>
                            <td>
                              <strong>{p.name}</strong>
                              <div style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>Qtd: {p.quantity} un.</div>
                            </td>
                            <td style={{ textAlign: 'right', color: 'var(--adm-danger)' }}>
                              R$ {cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ textAlign: 'right', color: 'var(--adm-success)' }}>
                              R$ {sell.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--adm-gold)' }}>
                              R$ {profit.toFixed(2).replace('.', ',')} ({marginPercent.toFixed(0)}%)
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Tabela de Produtos de Uso Interno (Salão) */}
            <Card>
              <h3 style={{ margin: '0 0 12px 0', color: 'var(--adm-gold)', display: 'flex', alignItems: 'center', gap: 8 }}>
                🧪 Insumos e Produtos de Uso do Salão
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--adm-muted)', marginBottom: 16 }}>
                Preço por g/ml de insumos químicos e técnicos de lavatório e bancada, usados para calcular o custo do serviço.
              </p>
              <div className="table-responsive" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Produto do Salão</th>
                      <th>Tipo</th>
                      <th style={{ textAlign: 'right' }}>Volumetria</th>
                      <th style={{ textAlign: 'right' }}>Custo Total</th>
                      <th style={{ textAlign: 'right' }}>Custo por Unidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salonProducts.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: 'var(--adm-muted)', padding: 12 }}>
                          Nenhum produto de uso interno cadastrado.
                        </td>
                      </tr>
                    ) : (
                      salonProducts.map(sp => {
                        const vol = Number(sp.volumetry) || 1;
                        const cost = Number(sp.costPrice) || 0;
                        const pricePerUnit = cost / vol;
                        return (
                          <tr key={sp.id}>
                            <td><strong>{sp.name}</strong></td>
                            <td><span style={{ fontSize: '0.75rem', padding: '2px 6px', background: '#6b5a4b', color: '#fbf8f3', borderRadius: 4, fontWeight: 500 }}>{sp.type}</span></td>
                            <td style={{ textAlign: 'right' }}>{vol} {sp.unit}</td>
                            <td style={{ textAlign: 'right', color: 'var(--adm-danger)' }}>
                              R$ {cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--adm-gold)' }}>
                              R$ {pricePerUnit.toLocaleString('pt-BR', { minimumFractionDigits: 4 })} / {sp.unit}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Guia Prático */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ margin: '12px 0 0 0', color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}>
              📘 O que Não Pode Faltar de Dados (Por Categoria)
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <Card>
                <h4 style={{ color: 'var(--adm-gold)', margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: 700 }}>
                  📋 Sobre os Serviços
                </h4>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.8rem', color: 'var(--adm-text-2)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <li><strong>Tempo de Execução Real:</strong> Quantos minutos ou horas o serviço realmente leva (do diagnóstico à finalização). Tempo é dinheiro.</li>
                  <li><strong>Mão de Obra Qualificada:</strong> Serviços complexos (como Leitura de Fio, cortes técnicos ou colorimetria avançada) embutem o valor do conhecimento, não apenas o tempo.</li>
                  <li><strong>Capacidade de Atendimento:</strong> Quantos desses services você consegue realizar por dia mantendo o padrão de qualidade do estúdio.</li>
                </ul>
              </Card>

              <Card>
                <h4 style={{ color: 'var(--adm-gold)', margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: 700 }}>
                  🧪 Sobre os Produtos (Uso Técnico)
                </h4>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.8rem', color: 'var(--adm-text-2)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <li><strong>Custo por Grama/Mililitro (g/ml):</strong> Saiba o custo exato da dose utilizada. Ex: Se 1L de shampoo custa R$ 100 e usa 10ml, o custo é R$ 1,00.</li>
                  <li><strong>Desperdício Estimado:</strong> Margem de segurança de 5% a 10% para cobrir o produto residual nos pincéis, cumbucas ou lavagem de acessórios.</li>
                </ul>
              </Card>

              <Card>
                <h4 style={{ color: 'var(--adm-gold)', margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: 700 }}>
                  💆‍♀️ Sobre os Tratamentos (Terapia / Cronograma)
                </h4>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.8rem', color: 'var(--adm-text-2)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <li><strong>Custo dos Ativos e Tecnologia:</strong> Acidificantes, reconstrutores biotecnológicos e óleos vegetais puros têm custo de insumo diferenciado.</li>
                  <li><strong>Frequência e Rentabilidade do Kit:</strong> Rendimento do kit profissional e intervalo ideal que o cliente precisa retornar (ajuda a prever receita recorrente).</li>
                  <li><strong>Equipamentos Associados:</strong> Depreciação e energia de vapor de ozônio, laser ou climazon devem ser diluídos na conta do serviço.</li>
                </ul>
              </Card>

              <Card>
                <h4 style={{ color: 'var(--adm-gold)', margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: 700 }}>
                  👤 Sobre os Clientes (Ficha Anamnese)
                </h4>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.8rem', color: 'var(--adm-text-2)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <li><strong>Histórico e Características do Fio:</strong> Textura/curvatura, densidade, porosidade e espessura. Alta densidade e porosidade consome o triplo de produto e tempo.</li>
                  <li><strong>Histórico Químico e Transição:</strong> Procedimentos anteriores ditam o risco, cuidado extra e complexidade técnica da aplicação.</li>
                  <li><strong>Frequência de Retorno (LTV):</strong> Recorrência reduz custo de marketing. Clientes fiéis gastam mais e custam menos para reter.</li>
                </ul>
              </Card>
            </div>

            <div style={{ background: 'rgba(220,163,84,0.08)', border: '1px solid rgba(220,163,84,0.2)', padding: '16px 20px', borderRadius: 8, marginTop: 8 }}>
              <h4 style={{ color: 'var(--adm-gold)', margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 800 }}>
                💡 Dica de Ouro
              </h4>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--adm-text)', lineHeight: 1.5 }}>
                O erro mais comum é calcular o preço pensando apenas no produto gasto. O que mais pesa na precificação de um salão de beleza é o <strong>tempo de cadeira ocupada</strong> e o seu <strong>grau de especialização</strong>. Se o seu serviço entrega um diagnóstico personalizado (como a Leitura de Fio) que resolve a dor do cliente, o valor percebido vai muito além do custo do produto físico!
              </p>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'insumos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* KPI Cards specific to insumos */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <KpiCard
              label="Custo Total de Insumos (Geral)"
              value={`R$ ${(insumosUsageStats.totalInsumosCost + insumosUsageStats.totalManualExtraCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              sub={`No período selecionado`}
              icon={<ShoppingBag size={16} />}
              variant="danger"
            />
            <KpiCard
              label="Custo de Insumos Cadastrados"
              value={`R$ ${insumosUsageStats.totalInsumosCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              sub={`${insumosUsageStats.products.length} insumos catalogados utilizados`}
              icon={<TrendingDown size={16} />}
            />
            <KpiCard
              label="Custos Extras Manuais"
              value={`R$ ${insumosUsageStats.totalManualExtraCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              sub={`Lançamentos manuais no fechamento`}
              icon={<DollarSign size={16} />}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 20 }}>
            {/* Table of products/insumos usage */}
            <Card>
              <h3 style={{ margin: '0 0 16px 0', color: 'var(--adm-gold)', display: 'flex', alignItems: 'center', gap: 8 }}>
                📊 Consolidação de Insumos por Produto
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="financial-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Nome do Insumo / Produto</th>
                      <th style={{ textAlign: 'center' }}>Vezes Utilizado</th>
                      <th style={{ textAlign: 'right' }}>Custo Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insumosUsageStats.products.length === 0 ? (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center', color: 'var(--adm-muted)', padding: '24px 0' }}>
                          Nenhum uso de insumo catalogado registrado neste período.
                        </td>
                      </tr>
                    ) : (
                      insumosUsageStats.products.map((p, idx) => (
                        <tr key={idx} style={{ borderBottom: '0.5px solid var(--adm-rule)' }}>
                          <td style={{ color: '#fff', fontWeight: 600, padding: '12px 8px' }}>{p.name}</td>
                          <td style={{ textAlign: 'center', padding: '12px 8px' }}>{p.quantity}</td>
                          <td style={{ textAlign: 'right', color: 'var(--adm-gold)', fontWeight: 700, padding: '12px 8px' }}>
                            R$ {p.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Historical list of transaction closures */}
            <Card>
              <h3 style={{ margin: '0 0 16px 0', color: 'var(--adm-gold)', display: 'flex', alignItems: 'center', gap: 8 }}>
                📜 Histórico de Fechamentos e Custos
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '500px', overflowY: 'auto', paddingRight: 4 }}>
                {insumosUsageStats.history.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--adm-muted)', padding: '24px 0' }}>
                    Nenhum fechamento com insumos registrado neste período.
                  </p>
                ) : (
                  insumosUsageStats.history.map((h, idx) => (
                    <div key={idx} style={{ padding: 12, background: 'rgba(255,255,255,0.02)', border: '0.5px solid var(--adm-rule)', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>{h.clientName}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>{h.date.split('-').reverse().join('/')}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--adm-text-2)', lineHeight: 1.4 }}>
                        {h.description}
                      </div>
                      
                      {h.usedProducts && h.usedProducts.length > 0 && (
                        <div style={{ borderTop: '0.5px solid var(--adm-rule)', paddingTop: 6, marginTop: 2 }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--adm-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
                            Insumos Detalhados:
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {h.usedProducts.map((p, pIdx) => (
                              <div key={pIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--adm-text-2)' }}>
                                <span>{p.quantity}x {p.name}</span>
                                <span style={{ fontWeight: 600 }}>R$ {((p.price || 0) * (p.quantity || 0)).toFixed(2).replace('.', ',')}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR VENDA DE PRODUTO */}
      {showProductSaleModal && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleAddProductSale}>
            <h3>Lançar Venda de Produto Avulsa</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--adm-muted)', marginBottom: 12 }}>
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
                    setProductSaleForm(prev => ({ 
                      ...prev, 
                      paymentMethod: method
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

      {/* MODAL: REGISTRAR RETIRADA / PAGAMENTO DE COMISSÃO */}
      {showCommissionWithdrawalModal && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleSaveCommissionWithdrawal}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <DollarSign size={20} color="var(--adm-gold)" /> Registrar Retirada / Pagamento de Comissão
            </h3>
            <p style={{ color: 'var(--adm-muted)', fontSize: '0.85rem', marginTop: 4, marginBottom: 16 }}>
              O valor registrado será lançado como saída no fluxo de caixa e deduzido automaticamente do saldo de comissões do profissional.
            </p>

            <div className="form-group">
              <label>Profissional *</label>
              <select
                value={commissionWithdrawalForm.professionalId}
                onChange={e => setCommissionWithdrawalForm(prev => ({ ...prev, professionalId: e.target.value }))}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '0.5px solid var(--adm-rule)', background: 'var(--adm-card)', color: 'var(--adm-text)' }}
              >
                {professionals.map(p => {
                  const pData = commissionKPIs.professionalsMap && commissionKPIs.professionalsMap[p.id];
                  const pendente = pData ? pData.pendingCommission : 0;
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} (Saldo Pendente: R$ {formatCurrencyBRL(pendente)})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              <div className="form-group">
                <label>Valor da Retirada (R$) *</label>
                <input 
                  type="number" 
                  required 
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={commissionWithdrawalForm.value}
                  onChange={e => setCommissionWithdrawalForm(prev => ({ ...prev, value: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Forma de Pagamento *</label>
                <select 
                  value={commissionWithdrawalForm.paymentMethod}
                  onChange={e => setCommissionWithdrawalForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                >
                  <option value="Pix">Pix</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Transferência Bancária">Transferência Bancária</option>
                </select>
              </div>
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              <div className="form-group">
                <label>Motivo / Tipo de Repasse *</label>
                <select
                  value={commissionWithdrawalForm.motive}
                  onChange={e => setCommissionWithdrawalForm(prev => ({ ...prev, motive: e.target.value }))}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '0.5px solid var(--adm-rule)', background: 'var(--adm-card)', color: 'var(--adm-text)' }}
                >
                  <option value="Pagamento de Comissão">Pagamento de Comissão</option>
                  <option value="Adiantamento / Vale">Adiantamento / Vale</option>
                  <option value="Retirada Parcial">Retirada Parcial</option>
                  <option value="Fechamento Quinzenal">Fechamento Quinzenal</option>
                  <option value="Fechamento Mensal">Fechamento Mensal</option>
                </select>
              </div>

              <div className="form-group">
                <label>Data da Retirada *</label>
                <input 
                  type="date" 
                  required
                  value={commissionWithdrawalForm.date}
                  onChange={e => setCommissionWithdrawalForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 12 }}>
              <label>Observações / Comprovante (opcional)</label>
              <input 
                type="text" 
                placeholder="Ex: Chave Pix, adiantamento referente ao sábado, etc."
                value={commissionWithdrawalForm.notes}
                onChange={e => setCommissionWithdrawalForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <div className="modal-actions" style={{ justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowCommissionWithdrawalModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-spectro-gold" style={{ padding: '8px 20px', fontWeight: 600 }}>Confirmar Retirada</button>
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
              <p style={{ fontSize: '0.8rem', color: 'var(--adm-muted)', marginBottom: 16 }}>
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

      {/* MODAL: DETALHES / EDIÇÃO DE TRANSAÇÃO */}
      {showTxDetailModal && selectedTransaction && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', width: '90%' }}>
            {isEditingTx ? (
              <form onSubmit={handleSaveEditTx}>
                <h3>Editar Lançamento</h3>

                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label>Descrição *</label>
                  <input 
                    type="text" 
                    required 
                    value={editTxForm.description}
                    onChange={e => setEditTxForm(prev => ({ ...prev, description: e.target.value }))}
                    style={{ width: '100%', padding: '10px', borderRadius: 4, border: '0.5px solid var(--adm-rule)', background: 'var(--adm-card)', color: 'var(--adm-text)' }}
                  />
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div className="form-group">
                    <label>Tipo *</label>
                    <select
                      value={editTxForm.type}
                      onChange={e => setEditTxForm(prev => ({ ...prev, type: e.target.value }))}
                      style={{ width: '100%', padding: '10px', borderRadius: 4, border: '0.5px solid var(--adm-rule)', background: 'var(--adm-card)', color: 'var(--adm-text)' }}
                    >
                      <option value="entrada">Entrada (Receita)</option>
                      <option value="saida">Saída (Despesa)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Valor (R$) *</label>
                    <input 
                      type="number" 
                      required 
                      step="0.01"
                      min="0.01"
                      value={editTxForm.value}
                      onChange={e => setEditTxForm(prev => ({ ...prev, value: e.target.value }))}
                      style={{ width: '100%', padding: '10px', borderRadius: 4, border: '0.5px solid var(--adm-rule)', background: 'var(--adm-card)', color: 'var(--adm-text)' }}
                    />
                  </div>
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div className="form-group">
                    <label>Categoria</label>
                    <input 
                      type="text" 
                      value={editTxForm.category}
                      onChange={e => setEditTxForm(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="Ex: estoque, marketing, etc."
                      style={{ width: '100%', padding: '10px', borderRadius: 4, border: '0.5px solid var(--adm-rule)', background: 'var(--adm-card)', color: 'var(--adm-text)' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Cliente</label>
                    <input 
                      type="text" 
                      value={editTxForm.clientName}
                      onChange={e => setEditTxForm(prev => ({ ...prev, clientName: e.target.value }))}
                      placeholder="Nome do cliente (ou N/A)"
                      style={{ width: '100%', padding: '10px', borderRadius: 4, border: '0.5px solid var(--adm-rule)', background: 'var(--adm-card)', color: 'var(--adm-text)' }}
                    />
                  </div>
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div className="form-group">
                    <label>Forma de Pagamento / Saída *</label>
                    <select
                      value={editTxForm.paymentMethod}
                      onChange={e => setEditTxForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      style={{ width: '100%', padding: '10px', borderRadius: 4, border: '0.5px solid var(--adm-rule)', background: 'var(--adm-card)', color: 'var(--adm-text)' }}
                    >
                      <option value="Pix">Pix</option>
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="Cartão de Débito">Débito</option>
                      <option value="Cartão de Crédito">Crédito à Vista</option>
                      <option value="Crédito 2x">Crédito 2x</option>
                      <option value="Crédito 3x">Crédito 3x</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Data *</label>
                    <input 
                      type="date" 
                      required
                      value={editTxForm.date}
                      onChange={e => setEditTxForm(prev => ({ ...prev, date: e.target.value }))}
                      style={{ width: '100%', padding: '10px', borderRadius: 4, border: '0.5px solid var(--adm-rule)', background: 'var(--adm-card)', color: 'var(--adm-text)' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label>Horário</label>
                  <input 
                    type="time" 
                    value={editTxForm.time}
                    onChange={e => setEditTxForm(prev => ({ ...prev, time: e.target.value }))}
                    style={{ width: '100%', padding: '10px', borderRadius: 4, border: '0.5px solid var(--adm-rule)', background: 'var(--adm-card)', color: 'var(--adm-text)' }}
                  />
                </div>

                <div className="modal-actions" style={{ justifyContent: 'space-between', gap: 12 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setIsEditingTx(false)}>Voltar para Detalhes</button>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button type="button" className="btn btn-ghost" onClick={() => setShowTxDetailModal(false)}>Cancelar</button>
                    <button type="submit" className="btn btn-accent" style={{ background: '#48bb78', borderColor: '#48bb78' }}>Salvar Alterações</button>
                  </div>
                </div>
              </form>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ margin: 0 }}>Detalhes do Lançamento</h3>
                  <span className={`status-badge ${selectedTransaction.type === 'entrada' ? 'confirmado' : 'cancelado'}`}>
                    {selectedTransaction.type === 'entrada' ? 'Entrada' : 'Saída'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24, fontSize: '0.9rem' }}>
                  <div style={{ borderBottom: '1px solid var(--adm-rule)', paddingBottom: 8 }}>
                    <span style={{ color: 'var(--adm-muted)', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>DESCRIÇÃO</span>
                    <strong>{selectedTransaction.description}</strong>
                  </div>
                  <div style={{ borderBottom: '1px solid var(--adm-rule)', paddingBottom: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <span style={{ color: 'var(--adm-muted)', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>VALOR BRUTO</span>
                      <strong style={{ fontSize: '1.1rem', color: selectedTransaction.type === 'entrada' ? '#48bb78' : '#e53e3e' }}>
                        R$ {selectedTransaction.value.toFixed(2)}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--adm-muted)', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>CATEGORIA</span>
                      <span>{selectedTransaction.category || 'N/A'}</span>
                    </div>
                  </div>
                  <div style={{ borderBottom: '1px solid var(--adm-rule)', paddingBottom: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <span style={{ color: 'var(--adm-muted)', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>DATA / HORA</span>
                      <span>{selectedTransaction.date.split('-').reverse().join('/')} às {selectedTransaction.time || '00:00'}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--adm-muted)', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>MÉTODO</span>
                      <span>{selectedTransaction.paymentMethod}</span>
                    </div>
                  </div>
                  <div style={{ borderBottom: '1px solid var(--adm-rule)', paddingBottom: 8 }}>
                    <span style={{ color: 'var(--adm-muted)', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>CLIENTE</span>
                    <span>{selectedTransaction.clientName || 'N/A'}</span>
                  </div>
                </div>

                <div className="modal-actions" style={{ justifyContent: 'space-between', gap: 12 }}>
                  <button 
                    type="button" 
                    className="btn btn-spectro-red" 
                    style={{ background: '#e53e3e', borderColor: '#e53e3e', color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }} 
                    onClick={() => handleDeleteTransaction(selectedTransaction.id)}
                  >
                    <Trash2 size={14} /> Excluir Lançamento
                  </button>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button type="button" className="btn btn-ghost" onClick={() => setShowTxDetailModal(false)}>Fechar</button>
                    <button 
                      type="button" 
                      className="btn btn-accent" 
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                      onClick={startEditTx}
                    >
                      <Edit3 size={14} /> Editar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFinancial;
