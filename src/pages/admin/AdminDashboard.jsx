import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, onSnapshot, query, addDoc, updateDoc, doc } from 'firebase/firestore';
import { ChevronLeft, ChevronRight, Plus, X, Trash2 } from 'lucide-react';
import './Admin.css';

// Lista de horários padrão
const TIME_SLOTS = ['09:00', '10:30', '13:00', '14:30', '16:00', '17:30'];

// Mapeia dias da semana
const DAYS_TRANSLATION = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const SEED_TRANSACTIONS = [
  { id: 't1', date: new Date().toISOString().split('T')[0], time: '09:00', clientName: 'Ana Souza', type: 'entrada', paymentMethod: 'Pix', value: 150, description: 'Corte com o Jon' },
  { id: 't2', date: new Date().toISOString().split('T')[0], time: '13:00', clientName: 'Carla Lima', type: 'entrada', paymentMethod: 'Cartão de Crédito', value: 220, description: 'Combo Corte + Tratamento' },
  { id: 't3', date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0], time: '15:30', clientName: 'Bruna Melo', type: 'entrada', paymentMethod: 'Pix', value: 205, description: 'Tratamento Personalizado + 1 Shampoo Curly' }
];

const AdminDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  // Checkout / Comanda states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [addedServices, setAddedServices] = useState([]);
  const [addedProducts, setAddedProducts] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [selectedExtraService, setSelectedExtraService] = useState('');
  const [selectedExtraProduct, setSelectedExtraProduct] = useState('');

  // Filtros de data (semana atual)
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // ajusta para segunda-feira
    return new Date(d.setDate(diff));
  });

  // Formulário para novo agendamento manual
  const [newBooking, setNewBooking] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    serviceName: 'Corte com o Jon',
    servicePrice: 150,
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    notes: ''
  });

  // Carrega produtos para o dropdown de vendas da comanda
  useEffect(() => {
    if (!db) {
      const localData = localStorage.getItem('demo_products');
      if (localData) {
        setProducts(JSON.parse(localData));
      }
      return;
    }
    const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
      const prodList = [];
      snapshot.forEach((doc) => {
        prodList.push({ id: doc.id, ...doc.data() });
      });
      setProducts(prodList);
    });
    return () => unsubscribe();
  }, []);

  // Escuta agendamentos no Firestore em tempo real
  useEffect(() => {
    if (!db) {
      setIsDemoMode(true);
      // Mock data para demonstração
      setBookings([
        {
          id: 'demo-1',
          clientName: 'Ana Souza',
          clientPhone: '31988887777',
          clientEmail: 'ana@email.com',
          service: { name: 'Corte com o Jon', price: 150 },
          date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0], // amanhã
          time: '09:00',
          status: 'confirmado',
          notes: 'Deseja volume e definição'
        },
        {
          id: 'demo-2',
          clientName: 'Carla Lima',
          clientPhone: '31977776666',
          clientEmail: 'carla@email.com',
          service: { name: 'Combo Corte + Tratamento', price: 220 },
          date: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().split('T')[0],
          time: '13:00',
          status: 'pendente',
          notes: 'Histórico de descoloração recente'
        }
      ]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const q = query(collection(db, 'bookings'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const appts = [];
        snapshot.forEach((doc) => {
          appts.push({ id: doc.id, ...doc.data() });
        });
        setBookings(appts);
        setLoading(false);
        setIsDemoMode(false);
      }, (error) => {
        console.warn('Firestore real-time error, switching to Demo Mode:', error);
        setIsDemoMode(true);
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (err) {
      console.warn('Error fetching bookings from Firestore:', err);
      setIsDemoMode(true);
      setLoading(false);
    }
  }, [currentWeekStart]);

  const changeWeek = (direction) => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() + (direction * 7));
    setCurrentWeekStart(newStart);
  };

  // Gera os 5 dias de atendimento da semana atual (Terça a Sábado)
  const getWeekDays = () => {
    const days = [];
    for (let i = 1; i <= 5; i++) { // Terça (2) a Sábado (6)
      const d = new Date(currentWeekStart);
      d.setDate(currentWeekStart.getDate() + i);
      days.push({
        raw: d.toISOString().split('T')[0],
        formattedWeekday: DAYS_TRANSLATION[d.getDay()],
        formattedDay: d.getDate(),
        displayDate: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      });
    }
    return days;
  };

  const weekDays = getWeekDays();

  // Atualizar status do agendamento simples
  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      if (isDemoMode) {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
        if (selectedBooking && selectedBooking.id === bookingId) {
          setSelectedBooking(prev => ({ ...prev, status: newStatus }));
        }
      } else {
        const apptRef = doc(db, 'bookings', bookingId);
        await updateDoc(apptRef, { status: newStatus });
        setSelectedBooking(null);
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      alert('Não foi possível atualizar o status do agendamento.');
    }
  };

  // Criar agendamento manual
  const handleAddManualBooking = async (e) => {
    e.preventDefault();
    const serviceMap = {
      'Corte com o Jon': 150,
      'Combo Corte + Tratamento': 220,
      'Tratamento Personalizado': 120
    };

    const payload = {
      clientName: newBooking.clientName,
      clientPhone: newBooking.clientPhone,
      clientEmail: newBooking.clientEmail,
      service: {
        name: newBooking.serviceName,
        price: serviceMap[newBooking.serviceName]
      },
      date: newBooking.date,
      time: newBooking.time,
      notes: newBooking.notes,
      status: 'confirmado',
      createdAt: new Date().toISOString()
    };

    try {
      if (isDemoMode) {
        setBookings(prev => [...prev, { id: 'demo-' + Date.now(), ...payload }]);
      } else {
        await addDoc(collection(db, 'bookings'), payload);
      }
      setShowAddModal(false);
      // Reset formulário
      setNewBooking({
        clientName: '',
        clientPhone: '',
        clientEmail: '',
        serviceName: 'Corte com o Jon',
        servicePrice: 150,
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        notes: ''
      });
    } catch (err) {
      console.error('Erro ao criar agendamento manual:', err);
      alert('Falha ao registrar agendamento manual.');
    }
  };

  // Funções Auxiliares da Comanda
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
    
    // Verifica se já adicionou
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

  const calculateTotal = () => {
    const base = selectedBooking?.service?.price || 150;
    const extras = addedServices.reduce((sum, item) => sum + item.price, 0);
    const prods = addedProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return base + extras + prods;
  };

  const handleCloseComanda = async (booking) => {
    const baseServicePrice = booking.service?.price || 150;
    const extraServicesTotal = addedServices.reduce((sum, item) => sum + item.price, 0);
    const productsTotal = addedProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalComanda = baseServicePrice + extraServicesTotal + productsTotal;

    const itemsDescription = [
      booking.service?.name || booking.serviceName || 'Serviço Base',
      ...addedServices.map(s => s.name),
      ...addedProducts.map(p => `${p.quantity}x ${p.name}`)
    ].join(', ');

    const transactionPayload = {
      date: booking.date || new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      clientName: booking.clientName,
      clientPhone: booking.clientPhone || '',
      type: 'entrada',
      paymentMethod,
      value: totalComanda,
      description: itemsDescription,
      createdAt: new Date().toISOString()
    };

    try {
      if (isDemoMode || !db) {
        // 1. Atualiza agendamento no estado local
        setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: 'finalizado' } : b));

        // 2. Deduz estoque local
        const localProducts = localStorage.getItem('demo_products');
        if (localProducts) {
          const prods = JSON.parse(localProducts);
          const updatedProds = prods.map(p => {
            const added = addedProducts.find(ap => ap.productId === p.id);
            if (added) {
              return { ...p, quantity: Math.max(0, p.quantity - added.quantity) };
            }
            return p;
          });
          localStorage.setItem('demo_products', JSON.stringify(updatedProds));
          setProducts(updatedProds);
        }

        // 3. Salva transação no localStorage
        const localTx = localStorage.getItem('demo_transactions');
        const transactions = localTx ? JSON.parse(localTx) : SEED_TRANSACTIONS;
        const newTx = { id: 'tx_' + Date.now(), ...transactionPayload };
        localStorage.setItem('demo_transactions', JSON.stringify([...transactions, newTx]));
      } else {
        // 1. Atualizar agendamento no Firestore
        const apptRef = doc(db, 'bookings', booking.id);
        await updateDoc(apptRef, { status: 'finalizado' });

        // 2. Deduzir estoque no Firestore
        for (const added of addedProducts) {
          const prodRef = doc(db, 'products', added.productId);
          const match = products.find(p => p.id === added.productId);
          if (match) {
            const newQty = Math.max(0, match.quantity - added.quantity);
            await updateDoc(prodRef, { quantity: newQty });
          }
        }

        // 3. Salvar transação no Firestore
        await addDoc(collection(db, 'financial_transactions'), transactionPayload);
      }

      alert('Comanda fechada com sucesso! Estoque deduzido e receita registrada.');
      setSelectedBooking(null);
      setIsCheckoutOpen(false);
      setAddedServices([]);
      setAddedProducts([]);
    } catch (err) {
      console.error('Erro ao fechar comanda:', err);
      alert('Falha ao concluir o fechamento da comanda.');
    }
  };

  // Métricas do Dashboard
  const activeBookings = bookings.filter(b => b.status !== 'cancelado');
  const pendingCount = bookings.filter(b => b.status === 'pendente').length;
  
  // Receita semanal calculada a partir de transações locais ou do Firestore
  const [revenueThisWeek, setRevenueThisWeek] = useState(0);

  useEffect(() => {
    // Calcula com base nas comandas/transações da semana
    const startStr = weekDays[0]?.raw;
    const endStr = weekDays[4]?.raw;
    if (!startStr || !endStr) return;

    if (isDemoMode || !db) {
      const localTx = localStorage.getItem('demo_transactions');
      const transactions = localTx ? JSON.parse(localTx) : SEED_TRANSACTIONS;
      const weekEntradas = transactions
        .filter(t => t.type === 'entrada' && t.date >= startStr && t.date <= endStr)
        .reduce((sum, t) => sum + t.value, 0);
      setRevenueThisWeek(weekEntradas);
    } else {
      // Se em Firestore, lê as comandas de forma simplificada da lista local de agendamentos
      const apptRevenue = bookings
        .filter(b => b.status === 'finalizado' && b.date >= startStr && b.date <= endStr)
        .reduce((sum, b) => sum + (b.service?.price || 150), 0);
      setRevenueThisWeek(apptRevenue);
    }
  }, [bookings, weekDays, isDemoMode]);

  return (
    <div className="admin-dashboard">
      
      {/* Cards de Métricas */}
      <section className="admin-stats-grid">
        <div className="stat-card">
          <h3>Agendamentos Ativos</h3>
          <div className="value">{activeBookings.length}</div>
        </div>
        <div className="stat-card">
          <h3>Aguardando Confirmação</h3>
          <div className="value" style={{ color: '#ecc94b' }}>{pendingCount}</div>
        </div>
        <div className="stat-card">
          <h3>Receita Consolidada (Semana)</h3>
          <div className="value" style={{ color: '#48bb78' }}>R$ {revenueThisWeek}</div>
        </div>
      </section>

      {/* Controles da Agenda */}
      <section className="calendar-controls">
        <div className="nav-buttons">
          <button className="btn-icon" onClick={() => changeWeek(-1)}><ChevronLeft size={16} /></button>
          <span style={{ fontWeight: 600 }}>
            Semana de {weekDays[0]?.displayDate} a {weekDays[4]?.displayDate}
          </span>
          <button className="btn-icon" onClick={() => changeWeek(1)}><ChevronRight size={16} /></button>
        </div>

        <button className="btn btn-accent" style={{ padding: '8px 16px', fontSize: '0.9rem' }} onClick={() => setShowAddModal(true)}>
          <Plus size={16} style={{ marginRight: 6 }} /> Agendamento Manual
        </button>
      </section>

      {/* Grade da Agenda */}
      {loading ? (
        <p>Carregando agenda...</p>
      ) : (
        <div className="calendar-grid">
          {/* Cabeçalho de dias */}
          <div className="calendar-header">
            <div className="header-cell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Hora</div>
            {weekDays.map(day => (
              <div key={day.raw} className="header-cell">
                <span className="weekday">{day.formattedWeekday}</span>
                <span className="day">{day.formattedDay}</span>
              </div>
            ))}
          </div>

          {/* Linhas de Horários */}
          <div className="calendar-body">
            {TIME_SLOTS.map(slot => (
              <div key={slot} className="time-row">
                <div className="time-label-cell">{slot}</div>
                {weekDays.map(day => {
                  const appt = bookings.find(b => b.date === day.raw && b.time === slot);
                  return (
                    <div key={day.raw} className="day-cell">
                      {appt && (
                        <div 
                          className={`appt-card ${appt.status}`}
                          onClick={() => {
                            setSelectedBooking(appt);
                            setIsCheckoutOpen(false);
                            setAddedServices([]);
                            setAddedProducts([]);
                          }}
                        >
                          <span className="appt-time">{appt.time}</span>
                          <span className="appt-client">{appt.clientName}</span>
                          <span className="appt-service">{appt.service?.name || appt.serviceName}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: DETALHE DO AGENDAMENTO E COMANDA */}
      {selectedBooking && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: isCheckoutOpen ? 640 : 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3>{isCheckoutOpen ? 'Fechar Comanda da Cliente' : 'Ficha do Agendamento'}</h3>
              <button className="btn-icon" onClick={() => {
                setSelectedBooking(null);
                setIsCheckoutOpen(false);
              }}><X size={18} /></button>
            </div>
            
            {!isCheckoutOpen ? (
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
                  <span>R$ {selectedBooking.service?.price || 150}</span>
                </div>
                <div className="detail-row">
                  <label>Data/Hora:</label>
                  <span>{selectedBooking.date} às {selectedBooking.time}</span>
                </div>
                <div className="detail-row">
                  <label>Curvatura:</label>
                  <span>{selectedBooking.hairType || 'Não informada'}</span>
                </div>
                <div className="detail-row">
                  <label>Observações:</label>
                  <span>{selectedBooking.notes || 'Nenhuma observação.'}</span>
                </div>
                <div className="detail-row">
                  <label>Status Atual:</label>
                  <span className={`status-badge ${selectedBooking.status}`}>{selectedBooking.status}</span>
                </div>

                <div className="modal-actions">
                  <div style={{ display: 'flex', gap: 8 }}>
                    {selectedBooking.status === 'pendente' && (
                      <button className="btn btn-accent" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => handleUpdateStatus(selectedBooking.id, 'confirmado')}>
                        Confirmar Horário
                      </button>
                    )}
                    {selectedBooking.status === 'confirmado' && (
                      <button className="btn btn-accent" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => setIsCheckoutOpen(true)}>
                        Fechar Comanda / Pagar
                      </button>
                    )}
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
            ) : (
              <div className="checkout-section">
                <p style={{ fontSize: '0.9rem', marginBottom: 12, color: 'var(--muted)' }}>
                  Gere o faturamento da cliente <strong>{selectedBooking.clientName}</strong>. Adicione itens se necessário.
                </p>
                
                {/* Lista de Itens atuais na comanda */}
                <div className="comanda-items-list">
                  <div className="comanda-item-row" style={{ fontWeight: 600 }}>
                    <span>{selectedBooking.service?.name || selectedBooking.serviceName} (Serviço Agendado)</span>
                    <span>R$ {selectedBooking.service?.price || 150}</span>
                  </div>
                  
                  {addedServices.map((s, idx) => (
                    <div key={'s-' + idx} className="comanda-item-row">
                      <span>{s.name} (Serviço Extra)</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>R$ {s.price}</span>
                        <button type="button" className="btn-remove" onClick={() => removeService(idx)}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {addedProducts.map((p, idx) => (
                    <div key={'p-' + idx} className="comanda-item-row">
                      <span>{p.quantity}x {p.name} (Produto)</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>R$ {p.price * p.quantity}</span>
                        <button type="button" className="btn-remove" onClick={() => removeProduct(idx)}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="comanda-total-row">
                    <span>Total a Receber</span>
                    <span>R$ {calculateTotal()}</span>
                  </div>
                </div>

                {/* Formulário de acréscimo rápido */}
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.8rem' }}>Lançar Serviço Extra</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <select 
                        value={selectedExtraService} 
                        onChange={e => setSelectedExtraService(e.target.value)}
                        style={{ padding: '6px', fontSize: '0.8rem', flexGrow: 1 }}
                      >
                        <option value="">-- Selecione --</option>
                        <option value="Lavagem Especial|40">Lavagem Especial (R$ 40)</option>
                        <option value="Secagem Diferenciada|50">Secagem Diferenciada (R$ 50)</option>
                        <option value="Tratamento Rápido|60">Tratamento Rápido (R$ 60)</option>
                      </select>
                      <button type="button" className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '0.9rem' }} onClick={addExtraService}>+</button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.8rem' }}>Lançar Produto</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <select 
                        value={selectedExtraProduct} 
                        onChange={e => setSelectedExtraProduct(e.target.value)}
                        style={{ padding: '6px', fontSize: '0.8rem', flexGrow: 1 }}
                      >
                        <option value="">-- Selecione --</option>
                        {products.map(p => (
                          <option key={p.id} value={`${p.id}|${p.name}|${p.sellingPrice}`} disabled={p.quantity <= 0}>
                            {p.name} (R$ {p.sellingPrice}) {p.quantity <= 0 ? '[Sem Estoque]' : `[Qtd: ${p.quantity}]`}
                          </option>
                        ))}
                      </select>
                      <button type="button" className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '0.9rem' }} onClick={addExtraProduct}>+</button>
                    </div>
                  </div>
                </div>

                {/* Forma de Pagamento */}
                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label>Forma de Pagamento *</label>
                  <select 
                    value={paymentMethod} 
                    onChange={e => setPaymentMethod(e.target.value)}
                    style={{ padding: '8px', width: '100%' }}
                  >
                    <option value="Pix">Pix</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Dinheiro">Dinheiro</option>
                  </select>
                </div>

                <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setIsCheckoutOpen(false)}>Voltar</button>
                  <button type="button" className="btn btn-accent" onClick={() => handleCloseComanda(selectedBooking)}>Finalizar e Baixar Estoque</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: CRIAR AGENDAMENTO MANUAL */}
      {showAddModal && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleAddManualBooking}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3>Registrar Horário Manual</h3>
              <button type="button" className="btn-icon" onClick={() => setShowAddModal(false)}><X size={18} /></button>
            </div>

            <div className="form-group">
              <label>Nome Completo do Cliente *</label>
              <input 
                type="text" 
                required 
                placeholder="Ex: Pedro Santos"
                value={newBooking.clientName}
                onChange={e => setNewBooking(prev => ({ ...prev, clientName: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label>WhatsApp *</label>
              <input 
                type="tel" 
                required 
                placeholder="Ex: 31999998888"
                value={newBooking.clientPhone}
                onChange={e => setNewBooking(prev => ({ ...prev, clientPhone: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label>E-mail (Opcional)</label>
              <input 
                type="email" 
                placeholder="Ex: pedro@email.com"
                value={newBooking.clientEmail}
                onChange={e => setNewBooking(prev => ({ ...prev, clientEmail: e.target.value }))}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Serviço *</label>
                <select 
                  value={newBooking.serviceName}
                  onChange={e => setNewBooking(prev => ({ ...prev, serviceName: e.target.value }))}
                >
                  <option value="Corte com o Jon">Corte com o Jon (R$ 150)</option>
                  <option value="Combo Corte + Tratamento">Combo Corte + Tratamento (R$ 220)</option>
                  <option value="Tratamento Personalizado">Tratamento Personalizado (R$ 120)</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Data *</label>
                <input 
                  type="date" 
                  required
                  value={newBooking.date}
                  onChange={e => setNewBooking(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Horário *</label>
                <select 
                  value={newBooking.time}
                  onChange={e => setNewBooking(prev => ({ ...prev, time: e.target.value }))}
                >
                  {TIME_SLOTS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Notas Internas</label>
              <textarea 
                rows="2"
                placeholder="Ex: Cliente prefere finalização sem creme pesado."
                value={newBooking.notes}
                onChange={e => setNewBooking(prev => ({ ...prev, notes: e.target.value }))}
              ></textarea>
            </div>

            <div className="modal-actions" style={{ justifyContent: 'flex-end', gap: 12 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-accent">Salvar na Agenda</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
