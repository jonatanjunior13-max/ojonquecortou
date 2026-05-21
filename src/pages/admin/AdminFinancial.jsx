import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, onSnapshot, doc, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Plus, Trash2, DollarSign, TrendingUp, TrendingDown, CreditCard, Users, Percent, ShieldCheck } from 'lucide-react';
import './Admin.css';

const SEED_TRANSACTIONS = [
  { id: 't1', date: new Date().toISOString().split('T')[0], time: '09:00', clientName: 'Ana Souza', type: 'entrada', paymentMethod: 'Pix', value: 150, description: 'Corte com o Jon' },
  { id: 't2', date: new Date().toISOString().split('T')[0], time: '13:00', clientName: 'Carla Lima', type: 'entrada', paymentMethod: 'Cartão de Crédito', value: 220, description: 'Combo Corte + Tratamento' },
  { id: 't3', date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0], time: '15:30', clientName: 'Bruna Melo', type: 'entrada', paymentMethod: 'Pix', value: 205, description: 'Tratamento Personalizado + 1 Shampoo Curly' },
  { id: 't4', date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString().split('T')[0], time: '11:00', clientName: 'Fornecedor Embalagens', type: 'saida', paymentMethod: 'Pix', value: 80, description: 'Compra de sacolas e caixas de presente' }
];

const DEFAULT_PROFESSIONALS = [
  { id: 'p1', name: 'Jon (Proprietário)', commission: 100 },
  { id: 'p2', name: 'Auxiliar Amanda', commission: 40 },
  { id: 'p3', name: 'Esteticista Carol', commission: 50 }
];

const AdminFinancial = () => {
  const [activeSubTab, setActiveSubTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') === 'comissao' ? 'comissao' : 'fluxo';
  });

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showAddProfModal, setShowAddProfModal] = useState(false);

  // Fee configuration (dynamically synced with Settings page)
  const [fees, setFees] = useState({ feePix: 0, feeDebit: 1.9, feeCredit: 3.5 });

  // Professionals list
  const [professionals, setProfessionals] = useState([]);
  const [newProfForm, setNewProfForm] = useState({ name: '', commission: 40 });

  // Transaction to Professional association: { [transactionId]: professionalId }
  const [txProfs, setTxProfs] = useState({});

  // Form states for manual outflow (despesa)
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    value: '',
    paymentMethod: 'Pix',
    date: new Date().toISOString().split('T')[0]
  });

  // Load configuration and professional mappings
  useEffect(() => {
    // 1. Load fees from settings
    const loadSettings = () => {
      const saved = localStorage.getItem('demo_studio_settings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setFees({
            feePix: parsed.feePix ?? 0,
            feeDebit: parsed.feeDebit ?? 1.9,
            feeCredit: parsed.feeCredit ?? 3.5
          });
        } catch (e) {}
      }
    };
    loadSettings();

    // Listen to changes in configurations
    const handleSettingsUpdate = () => loadSettings();
    window.addEventListener('settingsUpdated', handleSettingsUpdate);

    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdate);
    };
  }, []);

  // Sync tab change from URL query changes
  useEffect(() => {
    const handleLocationChange = () => {
      const params = new URLSearchParams(window.location.search);
      setActiveSubTab(params.get('tab') === 'comissao' ? 'comissao' : 'fluxo');
    };
    window.addEventListener('popstate', handleLocationChange);
    // Poll query parameters in case navigation happens within the SPA
    const interval = setInterval(handleLocationChange, 500);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      clearInterval(interval);
    };
  }, []);

  // Fetch transactions and professionals from database
  useEffect(() => {
    let unsubscribeTx;
    let unsubscribeProfs;
    let timedOut = false;

    const getMockTransactions = () => {
      const localData = localStorage.getItem('demo_transactions');
      if (localData) return JSON.parse(localData);
      localStorage.setItem('demo_transactions', JSON.stringify(SEED_TRANSACTIONS));
      return SEED_TRANSACTIONS;
    };

    const getMockProfessionals = () => {
      const savedProfs = localStorage.getItem('demo_professionals');
      if (savedProfs) return JSON.parse(savedProfs);
      localStorage.setItem('demo_professionals', JSON.stringify(DEFAULT_PROFESSIONALS));
      return DEFAULT_PROFESSIONALS;
    };

    const getMockTxProfs = () => {
      const savedTxProfs = localStorage.getItem('demo_tx_professionals');
      return savedTxProfs ? JSON.parse(savedTxProfs) : {};
    };

    if (!db) {
      setIsDemoMode(true);
      setTransactions(getMockTransactions());
      setProfessionals(getMockProfessionals());
      setTxProfs(getMockTxProfs());
      setLoading(false);
      return;
    }

    setLoading(true);

    const timeoutId = setTimeout(() => {
      timedOut = true;
      console.warn('Firestore subscription for financials timed out. Falling back to Demo Mode.');
      setIsDemoMode(true);
      if (unsubscribeTx) unsubscribeTx();
      if (unsubscribeProfs) unsubscribeProfs();
      setTransactions(getMockTransactions());
      setProfessionals(getMockProfessionals());
      setTxProfs(getMockTxProfs());
      setLoading(false);
    }, 3500);

    try {
      // 1. Subscribe to transactions
      unsubscribeTx = onSnapshot(collection(db, 'financial_transactions'), (snapshot) => {
        if (timedOut) return;
        
        const txList = [];
        const mappings = {};
        snapshot.forEach((doc) => {
          const data = doc.data();
          txList.push({ id: doc.id, ...data });
          if (data.professionalId) {
            mappings[doc.id] = data.professionalId;
          }
        });
        
        txList.sort((a, b) => new Date(b.date + 'T' + (b.time || '00:00')) - new Date(a.date + 'T' + (a.time || '00:00')));
        
        setTransactions(txList);
        setTxProfs(prev => ({ ...prev, ...mappings }));
        setIsDemoMode(false);
      }, (error) => {
        console.warn('Erro ao carregar transações do Firestore:', error);
      });

      // 2. Subscribe to professionals
      unsubscribeProfs = onSnapshot(collection(db, 'professionals'), (snapshot) => {
        if (timedOut) return;
        clearTimeout(timeoutId);

        const profList = [];
        snapshot.forEach((doc) => {
          profList.push({ id: doc.id, ...doc.data() });
        });
        
        if (profList.length > 0) {
          setProfessionals(profList);
        } else {
          setProfessionals(DEFAULT_PROFESSIONALS);
        }
        setLoading(false);
      }, (error) => {
        console.warn('Erro ao carregar profissionais do Firestore:', error);
        setProfessionals(getMockProfessionals());
        setLoading(false);
      });

      return () => {
        clearTimeout(timeoutId);
        if (unsubscribeTx) unsubscribeTx();
        if (unsubscribeProfs) unsubscribeProfs();
      };
    } catch (err) {
      if (!timedOut) {
        clearTimeout(timeoutId);
        console.warn('Erro na conexão do banco para finanças:', err);
        setIsDemoMode(true);
        setTransactions(getMockTransactions());
        setProfessionals(getMockProfessionals());
        setTxProfs(getMockTxProfs());
        setLoading(false);
      }
    }
  }, []);

  const saveLocalTransactions = (updated) => {
    setTransactions(updated);
    localStorage.setItem('demo_transactions', JSON.stringify(updated));
  };

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
        const updated = [ { id: 'tx_' + Date.now(), ...payload }, ...transactions ];
        saveLocalTransactions(updated);
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
      alert('Não foi possível salvar a despesa.');
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (!confirm('Deseja realmente remover esta movimentação?')) return;

    try {
      if (isDemoMode) {
        const updated = transactions.filter(t => t.id !== id);
        saveLocalTransactions(updated);
      } else {
        await deleteDoc(doc(db, 'financial_transactions', id));
      }
    } catch (err) {
      console.error('Erro ao excluir transação:', err);
    }
  };

  // Helper values for calculating net value and credit card fee deduction
  const getNetValue = (val, method) => {
    if (method === 'Pix') return val * (1 - fees.feePix / 100);
    if (method === 'Cartão de Débito') return val * (1 - fees.feeDebit / 100);
    if (method === 'Cartão de Crédito') return val * (1 - fees.feeCredit / 100);
    return val;
  };

  const getTransactionFee = (val, method) => {
    if (method === 'Pix') return val * (fees.feePix / 100);
    if (method === 'Cartão de Débito') return val * (fees.feeDebit / 100);
    if (method === 'Cartão de Crédito') return val * (fees.feeCredit / 100);
    return 0;
  };

  // Finance calculations
  const todayStr = new Date().toISOString().split('T')[0];

  const getWeekRange = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(d.setDate(diff));
    const end = new Date(start);
    end.setDate(start.getDate() + 5);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };
  const weekRange = getWeekRange();

  const currentMonthStr = new Date().toISOString().slice(0, 7);

  // Metrics (Gross)
  const revenueToday = transactions
    .filter(t => t.type === 'entrada' && t.date === todayStr)
    .reduce((sum, t) => sum + t.value, 0);

  const revenueWeek = transactions
    .filter(t => t.type === 'entrada' && t.date >= weekRange.start && t.date <= weekRange.end)
    .reduce((sum, t) => sum + t.value, 0);

  const revenueMonth = transactions
    .filter(t => t.type === 'entrada' && t.date.startsWith(currentMonthStr))
    .reduce((sum, t) => sum + t.value, 0);

  // Metrics (Net Profit)
  const totalEntradasBruto = transactions
    .filter(t => t.type === 'entrada')
    .reduce((sum, t) => sum + t.value, 0);

  const totalEntradasLiquido = transactions
    .filter(t => t.type === 'entrada')
    .reduce((sum, t) => sum + getNetValue(t.value, t.paymentMethod), 0);

  const totalSaidas = transactions
    .filter(t => t.type === 'saida')
    .reduce((sum, t) => sum + t.value, 0);

  const netBalance = totalEntradasLiquido - totalSaidas;

  // Breakdown by payment methods (Entradas)
  const paymentMethodsStats = {
    'Pix': 0,
    'Cartão de Crédito': 0,
    'Cartão de Débito': 0,
    'Dinheiro': 0
  };

  transactions.forEach(t => {
    if (t.type === 'entrada' && paymentMethodsStats[t.paymentMethod] !== undefined) {
      paymentMethodsStats[t.paymentMethod] += t.value;
    }
  });

  // Calculate Commissions for each professional
  const calculateProfessionalPayout = (profId, commissionPct) => {
    return transactions
      .filter(t => t.type === 'entrada' && txProfs[t.id] === profId)
      .reduce((sum, t) => sum + (getNetValue(t.value, t.paymentMethod) * (commissionPct / 100)), 0);
  };

  const handleAddProfessional = async (e) => {
    e.preventDefault();
    if (!newProfForm.name.trim()) return;
    const payload = {
      name: newProfForm.name,
      commission: Number(newProfForm.commission)
    };
    try {
      if (isDemoMode) {
        const localPayload = { id: 'p_' + Date.now(), ...payload };
        const list = [...professionals, localPayload];
        setProfessionals(list);
        localStorage.setItem('demo_professionals', JSON.stringify(list));
      } else {
        await addDoc(collection(db, 'professionals'), payload);
      }
      setNewProfForm({ name: '', commission: 40 });
      setShowAddProfModal(false);
    } catch (err) {
      console.error('Erro ao adicionar profissional:', err);
      alert('Erro ao salvar profissional.');
    }
  };

  const handleDeleteProfessional = async (id) => {
    if (id === 'p1') {
      alert('Não é possível remover o proprietário.');
      return;
    }
    if (!confirm('Deseja realmente remover este profissional?')) return;
    try {
      if (isDemoMode) {
        const list = professionals.filter(p => p.id !== id);
        setProfessionals(list);
        localStorage.setItem('demo_professionals', JSON.stringify(list));
      } else {
        await deleteDoc(doc(db, 'professionals', id));
      }
    } catch (err) {
      console.error('Erro ao excluir profissional:', err);
      alert('Erro ao remover profissional.');
    }
  };

  const handleAssignProfWrapper = async (txId, profId) => {
    try {
      if (isDemoMode) {
        const updated = { ...txProfs, [txId]: profId };
        setTxProfs(updated);
        localStorage.setItem('demo_tx_professionals', JSON.stringify(updated));
      } else {
        const txRef = doc(db, 'financial_transactions', txId);
        await updateDoc(txRef, { professionalId: profId });
        setTxProfs(prev => ({ ...prev, [txId]: profId }));
      }
    } catch (err) {
      console.error('Erro ao associar profissional à transação:', err);
      alert('Erro ao associar profissional.');
    }
  };

  return (
    <div className="admin-financial-page">
      {/* Cards de Métricas */}
      <section className="admin-stats-grid">
        <div className="stat-card">
          <h3>Faturamento Hoje</h3>
          <div className="value" style={{ color: '#48bb78' }}>R$ {revenueToday}</div>
        </div>
        <div className="stat-card">
          <h3>Faturamento Semana</h3>
          <div className="value" style={{ color: '#48bb78' }}>R$ {revenueWeek}</div>
        </div>
        <div className="stat-card">
          <h3>Faturamento Mês</h3>
          <div className="value" style={{ color: '#48bb78' }}>R$ {revenueMonth}</div>
        </div>
        <div className="stat-card">
          <h3>Saldo Líquido Geral</h3>
          <div className="value" style={{ color: netBalance >= 0 ? 'var(--accent)' : '#e53e3e' }}>
            R$ {netBalance.toFixed(2)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginTop: 4 }}>
            Deduzidas taxas e despesas
          </span>
        </div>
      </section>

      {/* Sub-Abas do Financeiro */}
      <div className="tab-menu" style={{ marginBottom: 24 }}>
        <button className={`tab-btn ${activeSubTab === 'fluxo' ? 'active' : ''}`} onClick={() => setActiveSubTab('fluxo')}>
          <DollarSign size={16} /> Fluxo de Caixa
        </button>
        <button className={`tab-btn ${activeSubTab === 'comissao' ? 'active' : ''}`} onClick={() => setActiveSubTab('comissao')}>
          <Users size={16} /> Comissões & Repasses
        </button>
      </div>

      {isDemoMode && (
        <div style={{ marginBottom: 16, padding: '8px 16px', background: 'rgba(176, 90, 46, 0.08)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent)' }}>Ambiente de Demonstração / Dados Locais</span>
        </div>
      )}

      {/* CONTEÚDO: FLUXO DE CAIXA */}
      {activeSubTab === 'fluxo' && (
        <>
          <div className="calendar-controls">
            <div className="nav-buttons">
              <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                Extrato Financeiro
              </span>
            </div>
            <button className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: '0.9rem', color: '#e53e3e', borderColor: '#e53e3e' }} onClick={() => setShowExpenseModal(true)}>
              <Plus size={16} style={{ marginRight: 6 }} /> Registrar Saída/Despesa
            </button>
          </div>

          <div className="financial-split-grid">
            {/* Tabela de Transações */}
            <div className="financial-card" style={{ flexGrow: 2 }}>
              <h3>Fluxo de Lançamentos Recentes</h3>
              {loading ? (
                <p>Carregando movimentações...</p>
              ) : (
                <div className="timeline-transactions">
                  {transactions.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Nenhum lançamento registrado.</p>
                  ) : (
                    transactions.map((t) => {
                      const isEntrada = t.type === 'entrada';
                      const netVal = getNetValue(t.value, t.paymentMethod);
                      const taxFee = getTransactionFee(t.value, t.paymentMethod);
                      return (
                        <div key={t.id} className={`transaction-item ${t.type}`}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              padding: 8,
                              borderRadius: '50%',
                              background: isEntrada ? 'rgba(72, 187, 120, 0.1)' : 'rgba(229, 62, 62, 0.1)',
                              color: isEntrada ? '#2f855a' : '#c53030'
                            }}>
                              {isEntrada ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                            </div>
                            <div className="transaction-info">
                              <h4>{t.description}</h4>
                              <span>
                                {t.date.split('-').reverse().join('/')} às {t.time} • Método: {t.paymentMethod}
                                {isEntrada && taxFee > 0 && ` (Taxa maquininha: R$ ${taxFee.toFixed(2)})`}
                              </span>
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ textAlign: 'right' }}>
                              <span className={`transaction-value ${isEntrada ? 'positive' : 'negative'}`} style={{ display: 'block' }}>
                                {isEntrada ? '+' : '-'} R$ {t.value.toFixed(2)}
                              </span>
                              {isEntrada && taxFee > 0 && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                                  Líq. R$ {netVal.toFixed(2)}
                                </span>
                              )}
                            </div>
                            <button 
                              className="btn-icon" 
                              style={{ padding: 4, border: 'none', background: 'none', color: 'var(--text-muted)' }}
                              onClick={() => handleDeleteTransaction(t.id)}
                              title="Remover Registro"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Métodos de Recebimento */}
            <div className="financial-card" style={{ height: 'fit-content' }}>
              <h3>Entradas por Forma (Bruto)</h3>
              <div className="payment-method-box">
                <div className="payment-method-row">
                  <span style={{ fontWeight: 600 }}>Pix:</span>
                  <span style={{ color: '#2f855a', fontWeight: 700 }}>R$ {paymentMethodsStats['Pix'].toFixed(2)}</span>
                </div>
                <div className="payment-method-row">
                  <span style={{ fontWeight: 600 }}>Cartão de Crédito:</span>
                  <span style={{ color: '#2f855a', fontWeight: 700 }}>R$ {paymentMethodsStats['Cartão de Crédito'].toFixed(2)}</span>
                </div>
                <div className="payment-method-row">
                  <span style={{ fontWeight: 600 }}>Cartão de Débito:</span>
                  <span style={{ color: '#2f855a', fontWeight: 700 }}>R$ {paymentMethodsStats['Cartão de Débito'].toFixed(2)}</span>
                </div>
                <div className="payment-method-row">
                  <span style={{ fontWeight: 600 }}>Dinheiro:</span>
                  <span style={{ color: '#2f855a', fontWeight: 700 }}>R$ {paymentMethodsStats['Dinheiro'].toFixed(2)}</span>
                </div>
              </div>
              
              <div style={{ marginTop: 24, padding: 12, background: 'var(--bg-warm)', borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CreditCard size={14} />
                  <strong>Resumo de Taxas Deduzidas:</strong>
                </div>
                <div>Faturamento Bruto: R$ {totalEntradasBruto.toFixed(2)}</div>
                <div>Faturamento Líquido: R$ {totalEntradasLiquido.toFixed(2)}</div>
                <div style={{ color: 'var(--accent)' }}>Diferença (Taxas retidas): R$ {(totalEntradasBruto - totalEntradasLiquido).toFixed(2)}</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* CONTEÚDO: COMISSÕES & REPASSES */}
      {activeSubTab === 'comissao' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Cadastro de Profissionais */}
          <div className="financial-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Profissionais e Comissionamento</h3>
              <button className="btn btn-accent" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => setShowAddProfModal(true)}>
                <Plus size={16} style={{ marginRight: 6 }} /> Cadastrar Profissional
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {professionals.map(p => {
                const totalComm = calculateProfessionalPayout(p.id, p.commission);
                return (
                  <div key={p.id} style={{ border: '1px solid var(--rule)', padding: 16, borderRadius: 8, background: 'var(--surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: 0, fontWeight: 700 }}>{p.name}</h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginTop: 4 }}>
                        Comissão: <span style={{ fontWeight: 600 }}>{p.commission}%</span>
                      </span>
                      <span style={{ fontSize: '0.95rem', color: '#48bb78', fontWeight: 700, display: 'block', marginTop: 8 }}>
                        Repasse devido: R$ {totalComm.toFixed(2)}
                      </span>
                    </div>
                    {p.id !== 'p1' && (
                      <button className="btn-icon text-danger" onClick={() => handleDeleteProfessional(p.id)}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lançamento / Lincagem de transações */}
          <div className="financial-card">
            <h3>Lançar Profissional no Serviço Realizado</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginBottom: 16 }}>
              Associe a profissional executora a cada entrada recebida para rodar o cálculo de comissões e repasses corretos.
            </p>

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
                {transactions.filter(t => t.type === 'entrada').map(t => {
                  const currentAssigned = txProfs[t.id] || '';
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
                      <td>
                        <select 
                          value={currentAssigned} 
                          onChange={e => handleAssignProfWrapper(t.id, e.target.value)}
                          style={{ padding: '4px 8px', fontSize: '0.85rem', width: '100%', maxWidth: 200 }}
                        >
                          <option value="">-- Não Associado --</option>
                          {professionals.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </td>
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

      {/* Modal para Registrar Despesa */}
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

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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

      {/* Modal para Cadastrar Profissional */}
      {showAddProfModal && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleAddProfessional}>
            <h3>Cadastrar Novo Colaborador</h3>

            <div className="form-group">
              <label>Nome Completo da Profissional *</label>
              <input 
                type="text" 
                required 
                placeholder="Ex: Auxiliar Amanda"
                value={newProfForm.name}
                onChange={e => setNewProfForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="form-group" style={{ marginTop: 12 }}>
              <label>Comissão Padrão (%) *</label>
              <input 
                type="number" 
                required 
                min="0"
                max="100"
                placeholder="40"
                value={newProfForm.commission}
                onChange={e => setNewProfForm(prev => ({ ...prev, commission: e.target.value }))}
              />
            </div>

            <div className="modal-actions" style={{ justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowAddProfModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-accent">Adicionar Profissional</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminFinancial;
