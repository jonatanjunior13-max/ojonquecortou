import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, onSnapshot, doc, addDoc, deleteDoc } from 'firebase/firestore';
import { Plus, Trash2, DollarSign, TrendingUp, TrendingDown, CreditCard } from 'lucide-react';
import './Admin.css';

const SEED_TRANSACTIONS = [
  { id: 't1', date: new Date().toISOString().split('T')[0], time: '09:00', clientName: 'Ana Souza', type: 'entrada', paymentMethod: 'Pix', value: 150, description: 'Corte com o Jon' },
  { id: 't2', date: new Date().toISOString().split('T')[0], time: '13:00', clientName: 'Carla Lima', type: 'entrada', paymentMethod: 'Cartão de Crédito', value: 220, description: 'Combo Corte + Tratamento' },
  { id: 't3', date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0], time: '15:30', clientName: 'Bruna Melo', type: 'entrada', paymentMethod: 'Pix', value: 205, description: 'Tratamento Personalizado + 1 Shampoo Curly' },
  { id: 't4', date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString().split('T')[0], time: '11:00', clientName: 'Fornecedor Embalagens', type: 'saida', paymentMethod: 'Pix', value: 80, description: 'Compra de sacolas e caixas de presente' }
];

const AdminFinancial = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Form states for manual outflow (despesa)
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    value: '',
    paymentMethod: 'Pix',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (!db) {
      setIsDemoMode(true);
      const localData = localStorage.getItem('demo_transactions');
      if (localData) {
        setTransactions(JSON.parse(localData));
      } else {
        localStorage.setItem('demo_transactions', JSON.stringify(SEED_TRANSACTIONS));
        setTransactions(SEED_TRANSACTIONS);
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const unsubscribe = onSnapshot(collection(db, 'financial_transactions'), (snapshot) => {
        const txList = [];
        snapshot.forEach((doc) => {
          txList.push({ id: doc.id, ...doc.data() });
        });
        
        // Ordena por data decrescente
        txList.sort((a, b) => new Date(b.date + 'T' + (b.time || '00:00')) - new Date(a.date + 'T' + (a.time || '00:00')));
        
        setTransactions(txList);
        setLoading(false);
        setIsDemoMode(false);
      }, (error) => {
        console.warn('Erro ao carregar Firestore, mudando para Demo local:', error);
        setIsDemoMode(true);
        const localData = localStorage.getItem('demo_transactions') || JSON.stringify(SEED_TRANSACTIONS);
        setTransactions(JSON.parse(localData));
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn('Erro na conexão do banco para finanças:', err);
      setIsDemoMode(true);
      const localData = localStorage.getItem('demo_transactions') || JSON.stringify(SEED_TRANSACTIONS);
      setTransactions(JSON.parse(localData));
      setLoading(false);
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

  // Cálculo das métricas financeiras
  const todayStr = new Date().toISOString().split('T')[0];

  const getWeekRange = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(d.setDate(diff));
    const end = new Date(start);
    end.setDate(start.getDate() + 5); // até sábado
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };
  const weekRange = getWeekRange();

  const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM

  // Métricas
  const revenueToday = transactions
    .filter(t => t.type === 'entrada' && t.date === todayStr)
    .reduce((sum, t) => sum + t.value, 0);

  const revenueWeek = transactions
    .filter(t => t.type === 'entrada' && t.date >= weekRange.start && t.date <= weekRange.end)
    .reduce((sum, t) => sum + t.value, 0);

  const revenueMonth = transactions
    .filter(t => t.type === 'entrada' && t.date.startsWith(currentMonthStr))
    .reduce((sum, t) => sum + t.value, 0);

  const totalEntradas = transactions
    .filter(t => t.type === 'entrada')
    .reduce((sum, t) => sum + t.value, 0);

  const totalSaidas = transactions
    .filter(t => t.type === 'saida')
    .reduce((sum, t) => sum + t.value, 0);

  const netBalance = totalEntradas - totalSaidas;

  // Divisão por método de pagamento (Entradas)
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
            R$ {netBalance}
          </div>
        </div>
      </section>

      {/* Controles da Tela */}
      <div className="calendar-controls">
        <div className="nav-buttons">
          <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>
            Extrato Financeiro {isDemoMode && <span className="status-badge pendente" style={{ marginLeft: 8 }}>Demonstração</span>}
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
                          </span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <span className={`transaction-value ${isEntrada ? 'positive' : 'negative'}`}>
                          {isEntrada ? '+' : '-'} R$ {t.value}
                        </span>
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
          <h3>Entradas por Forma</h3>
          <div className="payment-method-box">
            <div className="payment-method-row">
              <span style={{ fontWeight: 600 }}>Pix:</span>
              <span style={{ color: '#2f855a', fontWeight: 700 }}>R$ {paymentMethodsStats['Pix']}</span>
            </div>
            <div className="payment-method-row">
              <span style={{ fontWeight: 600 }}>Cartão de Crédito:</span>
              <span style={{ color: '#2f855a', fontWeight: 700 }}>R$ {paymentMethodsStats['Cartão de Crédito']}</span>
            </div>
            <div className="payment-method-row">
              <span style={{ fontWeight: 600 }}>Cartão de Débito:</span>
              <span style={{ color: '#2f855a', fontWeight: 700 }}>R$ {paymentMethodsStats['Cartão de Débito']}</span>
            </div>
            <div className="payment-method-row">
              <span style={{ fontWeight: 600 }}>Dinheiro:</span>
              <span style={{ color: '#2f855a', fontWeight: 700 }}>R$ {paymentMethodsStats['Dinheiro']}</span>
            </div>
          </div>
          
          <div style={{ marginTop: 24, padding: 12, background: 'var(--bg-warm)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <CreditCard size={16} />
            <span>Faturamento bruto total recebido das comandas: R$ {totalEntradas}</span>
          </div>
        </div>
      </div>

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
    </div>
  );
};

export default AdminFinancial;
