import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { db } from '../../config/firebase';
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Plus, Edit2, Trash2, AlertTriangle, ArrowUp, Scissors, Clock, Sparkles } from 'lucide-react';
import { SEED_SERVICES } from '../../data/seedServices';
import { setDoc } from 'firebase/firestore';
import './Admin.css';

const SEED_PRODUCTS = [
  { id: 'p1', name: 'Shampoo Curly Special 250ml', category: 'Shampoo', quantity: 15, costPrice: 25, sellingPrice: 55, minStock: 5 },
  { id: 'p2', name: 'Condicionador Curly Hydrate 250ml', category: 'Condicionador', quantity: 12, costPrice: 28, sellingPrice: 60, minStock: 4 },
  { id: 'p3', name: 'Ativador de Cachos Premium 500ml', category: 'Finalizador', quantity: 3, costPrice: 35, sellingPrice: 80, minStock: 5 },
  { id: 'p4', name: 'Gelatina Capilar Modeladora 300g', category: 'Finalizador', quantity: 8, costPrice: 20, sellingPrice: 45, minStock: 3 },
  { id: 'p5', name: 'Óleo Reparador de Argan 60ml', category: 'Óleo', quantity: 20, costPrice: 40, sellingPrice: 90, minStock: 5 }
];

const CATEGORIES = ['Shampoo', 'Condicionador', 'Máscara', 'Finalizador', 'Óleo', 'Acessório', 'Outros'];

const AdminInventory = () => {
  const { setGlobalData } = useOutletContext() || {};
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Services State Integration
  const [activeTab, setActiveTab] = useState('products');
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const [serviceForm, setServiceForm] = useState({
    name: '',
    category: 'Corte',
    description: '',
    price: '',
    priceType: 'Fixo',
    duration: '60',
    isPrimary: true,
    scheduledViaWhatsapp: false
  });

  useEffect(() => {
    let unsubscribe;
    const getMockServices = () => {
      const localData = localStorage.getItem('demo_services');
      return localData ? JSON.parse(localData) : SEED_SERVICES;
    };

    if (!db) {
      setServices(getMockServices());
      return;
    }

    setServicesLoading(true);
    try {
      unsubscribe = onSnapshot(collection(db, 'services'), (snapshot) => {
        const list = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        if (list.length === 0 && !localStorage.getItem('services_seeded')) {
          SEED_SERVICES.forEach(async (serv) => {
            await setDoc(doc(db, 'services', serv.id), serv);
          });
          localStorage.setItem('services_seeded', 'true');
        }
        list.sort((a, b) => (a.position ?? 99) - (b.position ?? 99));
        setServices(list);
        setServicesLoading(false);
      }, (error) => {
        console.warn('Erro ao conectar serviços:', error);
        setServicesLoading(false);
      });
      return () => {
        if (unsubscribe) unsubscribe();
      };
    } catch (err) {
      console.warn('Erro nos serviços:', err);
      setServicesLoading(false);
    }
  }, [isDemoMode]);

  const handleOpenAddService = () => {
    setEditingService(null);
    setServiceForm({
      name: '',
      category: 'Corte',
      description: '',
      price: '',
      cost: '',
      priceType: 'Fixo',
      duration: '60',
      isPrimary: true,
      scheduledViaWhatsapp: false
    });
    setShowServiceModal(true);
  };

  const handleOpenEditService = (service) => {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      category: service.category || 'Corte',
      description: service.description || '',
      price: service.price.toString(),
      cost: service.cost !== undefined && service.cost !== null ? service.cost.toString() : '',
      priceType: service.priceType || 'Fixo',
      duration: service.duration.toString(),
      isPrimary: service.isPrimary ?? true,
      scheduledViaWhatsapp: service.scheduledViaWhatsapp ?? false
    });
    setShowServiceModal(true);
  };

  const saveLocalServices = (updated) => {
    setServices(updated);
    localStorage.setItem('demo_services', JSON.stringify(updated));
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    const payload = {
      name: serviceForm.name,
      category: serviceForm.category,
      description: serviceForm.description,
      price: Number(serviceForm.price),
      cost: Number(serviceForm.cost) || 0,
      priceType: serviceForm.priceType,
      duration: Number(serviceForm.duration),
      isPrimary: !!serviceForm.isPrimary,
      scheduledViaWhatsapp: !!serviceForm.scheduledViaWhatsapp
    };

    try {
      if (isDemoMode) {
        if (editingService) {
          const updated = services.map(s => s.id === editingService.id ? { ...s, ...payload } : s);
          saveLocalServices(updated);
        } else {
          const newId = serviceForm.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
          saveLocalServices([...services, { id: newId, ...payload }]);
        }
      } else {
        if (editingService) {
          await updateDoc(doc(db, 'services', editingService.id), payload);
        } else {
          const newId = serviceForm.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
          await setDoc(doc(db, 'services', newId), payload);
        }
      }
      setShowServiceModal(false);
    } catch (err) {
      console.error('Erro ao salvar serviço:', err);
      alert('Erro ao salvar serviço.');
    }
  };

  const handleDeleteService = async (id) => {
    if (!confirm('Deseja realmente excluir este serviço da grade do salão?')) return;
    try {
      if (isDemoMode) {
        const updated = services.filter(s => s.id !== id);
        saveLocalServices(updated);
      } else {
        await deleteDoc(doc(db, 'services', id));
      }
    } catch (err) {
      console.error('Erro ao excluir serviço:', err);
      alert('Erro ao excluir serviço.');
    }
  };

  const logProductExpense = async (productName, quantity, costPrice, actionType = 'Compra') => {
    const cost = Number(quantity) * Number(costPrice);
    if (cost <= 0) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const payload = {
      date: todayStr,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      clientName: 'Estoque/Almoxarifado',
      type: 'saida',
      paymentMethod: 'Outro',
      value: cost,
      description: `${actionType} de estoque: ${productName} (+${quantity} un.)`,
      createdAt: new Date().toISOString()
    };

    try {
      if (isDemoMode) {
        const local = JSON.parse(localStorage.getItem('demo_financial') || '[]');
        const updated = [{ id: 'tx_' + Date.now(), ...payload }, ...local];
        localStorage.setItem('demo_financial', JSON.stringify(updated));
        if (setGlobalData) {
          setGlobalData(prev => ({
            ...prev,
            financial_transactions: updated
          }));
        }
      } else {
        await addDoc(collection(db, 'financial_transactions'), payload);
      }
      console.log('Despesa de produto adicionada com sucesso:', payload);
    } catch (err) {
      console.error('Erro ao registrar despesa de produto:', err);
    }
  };
  
  // Quick restock states
  const [quickRestockId, setQuickRestockId] = useState(null);
  const [quickRestockAmount, setQuickRestockAmount] = useState(5);

  // Form states
  const [form, setForm] = useState({
    name: '',
    category: 'Shampoo',
    quantity: 0,
    costPrice: 0,
    sellingPrice: 0,
    minStock: 3
  });

  useEffect(() => {
    let unsubscribe;
    let timedOut = false;

    const getMockProducts = () => {
      const localData = localStorage.getItem('demo_products');
      if (localData) return JSON.parse(localData);
      localStorage.setItem('demo_products', JSON.stringify(SEED_PRODUCTS));
      return SEED_PRODUCTS;
    };

    if (!db) {
      setIsDemoMode(true);
      setProducts(getMockProducts());
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
        const prodList = [];
        snapshot.forEach((doc) => {
          prodList.push({ id: doc.id, ...doc.data() });
        });
        setProducts(prodList);
        setLoading(false);
        setIsDemoMode(false);
      }, (error) => {
        console.warn('Erro ao carregar Firestore:', error);
        alert('Erro ao carregar o estoque. Tente recarregar a página.');
        setLoading(false);
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    } catch (err) {
      console.warn('Falha na conexão com Firestore para produtos:', err);
      setLoading(false);
    }
  }, []);

  // Salva no localStorage no modo Demo
  const saveLocalProducts = (updated) => {
    setProducts(updated);
    localStorage.setItem('demo_products', JSON.stringify(updated));
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setForm({
      name: '',
      category: 'Shampoo',
      quantity: 10,
      costPrice: 20,
      sellingPrice: 45,
      minStock: 3
    });
    setShowModal(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      category: product.category,
      quantity: product.quantity,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      minStock: product.minStock
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      category: form.category,
      quantity: Number(form.quantity),
      costPrice: Number(form.costPrice),
      sellingPrice: Number(form.sellingPrice),
      minStock: Number(form.minStock)
    };

    try {
      if (isDemoMode) {
        if (editingProduct) {
          const qtyDiff = payload.quantity - editingProduct.quantity;
          const updated = products.map(p => p.id === editingProduct.id ? { ...p, ...payload } : p);
          saveLocalProducts(updated);
          if (qtyDiff > 0) {
            await logProductExpense(payload.name, qtyDiff, payload.costPrice, 'Reabastecimento');
          }
        } else {
          const newProd = { id: 'p_' + Date.now(), ...payload };
          saveLocalProducts([...products, newProd]);
          await logProductExpense(payload.name, payload.quantity, payload.costPrice, 'Compra');
        }
      } else {
        if (editingProduct) {
          const qtyDiff = payload.quantity - editingProduct.quantity;
          const docRef = doc(db, 'products', editingProduct.id);
          await updateDoc(docRef, payload);
          if (qtyDiff > 0) {
            await logProductExpense(payload.name, qtyDiff, payload.costPrice, 'Reabastecimento');
          }
        } else {
          await addDoc(collection(db, 'products'), payload);
          await logProductExpense(payload.name, payload.quantity, payload.costPrice, 'Compra');
        }
      }
      setShowModal(false);
    } catch (err) {
      console.error('Erro ao salvar produto:', err);
      alert('Não foi possível salvar as alterações.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deseja realmente excluir este produto do estoque?')) return;

    try {
      if (isDemoMode) {
        const updated = products.filter(p => p.id !== id);
        saveLocalProducts(updated);
      } else {
        await deleteDoc(doc(db, 'products', id));
      }
    } catch (err) {
      console.error('Erro ao excluir produto:', err);
      alert('Erro ao excluir produto.');
    }
  };

  const handleQuickRestock = async (product) => {
    const amount = Number(quickRestockAmount);
    const newQty = product.quantity + amount;
    try {
      if (isDemoMode) {
        const updated = products.map(p => p.id === product.id ? { ...p, quantity: newQty } : p);
        saveLocalProducts(updated);
        await logProductExpense(product.name, amount, product.costPrice, 'Reabastecimento');
      } else {
        const docRef = doc(db, 'products', product.id);
        await updateDoc(docRef, { quantity: newQty });
        await logProductExpense(product.name, amount, product.costPrice, 'Reabastecimento');
      }
      setQuickRestockId(null);
    } catch (err) {
      console.error('Erro no reabastecimento:', err);
    }
  };

  // Estatísticas de almoxarifado
  const totalItems = products.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalValue = products.reduce((acc, curr) => acc + (curr.quantity * curr.sellingPrice), 0);
  const lowStockProducts = products.filter(p => p.quantity <= p.minStock);

  return (
    <div className="admin-inventory-page">
      {/* Abas de Navegação */}
      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--rule)', marginBottom: '24px', paddingBottom: '8px' }}>
        <button 
          type="button"
          onClick={() => setActiveTab('products')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'products' ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeTab === 'products' ? 'var(--text)' : 'var(--muted)',
            fontWeight: 'bold',
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: '0.95rem'
          }}
        >
          📦 Produtos em Estoque
        </button>
        <button 
          type="button"
          onClick={() => setActiveTab('services')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'services' ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeTab === 'services' ? 'var(--text)' : 'var(--muted)',
            fontWeight: 'bold',
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: '0.95rem'
          }}
        >
          ✂️ Serviços Oferecidos
        </button>
      </div>

      {activeTab === 'products' ? (
        <>
          {/* Cards de Métricas */}
          <section className="admin-stats-grid">
            <div className="stat-card">
              <h3>Variedade de Produtos</h3>
              <div className="value">{products.length}</div>
            </div>
            <div className="stat-card">
              <h3>Total de Itens em Estoque</h3>
              <div className="value">{totalItems}</div>
            </div>
            <div className="stat-card">
              <h3>Alerta Estoque Baixo</h3>
              <div className="value" style={{ color: lowStockProducts.length > 0 ? '#e53e3e' : 'var(--ink)' }}>
                {lowStockProducts.length}
              </div>
            </div>
            <div className="stat-card">
              <h3>Valor Comercial em Estoque</h3>
              <div className="value" style={{ color: '#48bb78' }}>R$ {totalValue.toFixed(2)}</div>
            </div>
          </section>

          {/* Controles */}
          <div className="calendar-controls">
            <div className="nav-buttons">
              <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                Listagem do Almoxarifado {isDemoMode && <span className="status-badge pendente" style={{ marginLeft: 8 }}>Demonstração</span>}
              </span>
            </div>
            <button className="btn btn-accent" style={{ padding: '8px 16px', fontSize: '0.9rem' }} onClick={handleOpenAdd}>
              <Plus size={16} style={{ marginRight: 6 }} /> Novo Produto
            </button>
          </div>

          {/* Alerta de atenção para estoque baixo */}
          {lowStockProducts.length > 0 && (
            <div className="error-message" style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(229, 62, 62, 0.05)', color: '#c53030' }}>
              <AlertTriangle size={18} />
              <span>Atenção: Existem {lowStockProducts.length} produto(s) com nível de estoque abaixo do limite mínimo de segurança!</span>
            </div>
          )}

          {/* Tabela de Estoque */}
          {loading ? (
            <p>Carregando almoxarifado...</p>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Categoria</th>
                    <th>Qtd Atual</th>
                    <th>Estoque Mínimo</th>
                    <th>Custo Unit.</th>
                    <th>Preço Venda</th>
                    <th>Lucro Unit.</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                        Nenhum produto cadastrado no estoque.
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => {
                      const isLow = p.quantity <= p.minStock;
                      return (
                        <tr key={p.id}>
                          <td style={{ fontWeight: 600 }}>{p.name}</td>
                          <td>{p.category}</td>
                          <td>
                            {quickRestockId === p.id ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <input 
                                  type="number" 
                                  value={quickRestockAmount} 
                                  onChange={e => setQuickRestockAmount(e.target.value)} 
                                  style={{ width: 60, padding: '4px 8px', borderRadius: 4, border: '1px solid var(--rule)' }}
                                />
                                <button 
                                  className="btn btn-accent" 
                                  style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                                  onClick={() => handleQuickRestock(p)}
                                >
                                  Salvar
                                </button>
                                <button 
                                  className="btn btn-ghost" 
                                  style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                                  onClick={() => setQuickRestockId(null)}
                                >
                                  X
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span>{p.quantity} unid.</span>
                                <button 
                                  className="btn-icon" 
                                  title="Reabastecer Rápido"
                                  style={{ padding: 4 }}
                                  onClick={() => {
                                    setQuickRestockId(p.id);
                                    setQuickRestockAmount(5);
                                  }}
                                >
                                  <ArrowUp size={12} />
                                </button>
                              </div>
                            )}
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>{p.minStock} unid.</td>
                          <td>R$ {Number(p.costPrice).toFixed(2)}</td>
                          <td>R$ {Number(p.sellingPrice).toFixed(2)}</td>
                          <td style={{ color: '#48bb78', fontWeight: 600 }}>R$ {(Number(p.sellingPrice) - Number(p.costPrice)).toFixed(2)}</td>
                          <td>
                            <span className={`stock-badge ${isLow ? 'low' : 'normal'}`}>
                              {isLow ? 'Estoque Baixo' : 'Normal'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: 6 }}>
                              <button type="button" className="btn-icon" onClick={() => handleOpenEdit(p)} title="Editar"><Edit2 size={14} /></button>
                              <button type="button" className="btn-icon" style={{ color: '#e53e3e' }} onClick={() => handleDelete(p.id)} title="Excluir"><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Métricas de Serviços */}
          <section className="admin-stats-grid">
            <div className="stat-card">
              <h3>Total de Serviços</h3>
              <div className="value">{services.length}</div>
            </div>
            <div className="stat-card">
              <h3>Serviços em Destaque</h3>
              <div className="value" style={{ color: 'var(--accent)' }}>
                {services.filter(s => s.isPrimary).length}
              </div>
            </div>
            <div className="stat-card">
              <h3>Categorias</h3>
              <div className="value">
                {Array.from(new Set(services.map(s => s.category || 'Corte'))).length}
              </div>
            </div>
          </section>

          {/* Controles de Serviços */}
          <div className="calendar-controls">
            <div className="nav-buttons">
              <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                Catálogo de Procedimentos {isDemoMode && <span className="status-badge pendente" style={{ marginLeft: 8 }}>Demonstração</span>}
              </span>
            </div>
            <button className="btn btn-accent" style={{ padding: '8px 16px', fontSize: '0.9rem' }} onClick={handleOpenAddService}>
              <Plus size={16} style={{ marginRight: 6 }} /> Novo Serviço
            </button>
          </div>

          {/* Tabela de Serviços */}
          {servicesLoading ? (
            <p>Carregando grade de serviços...</p>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Serviço</th>
                    <th>Categoria</th>
                    <th>Duração Média</th>
                    <th>Valor</th>
                    <th>Custo</th>
                    <th>Preço Tipo</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {services.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                        Nenhum serviço cadastrado na grade.
                      </td>
                    </tr>
                  ) : (
                    services.map((s) => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                        <td>{s.category || 'Corte'}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Clock size={12} style={{ color: 'var(--muted)' }} />
                            <span>{s.duration} min</span>
                          </div>
                        </td>
                        <td style={{ fontWeight: 700 }}>R$ {Number(s.price).toFixed(2)}</td>
                        <td style={{ color: 'var(--text-muted)' }}>R$ {Number(s.cost || 0).toFixed(2)}</td>
                        <td>{s.priceType || 'Fixo'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {s.isPrimary && (
                              <span className="stock-badge normal" style={{ background: 'rgba(176,90,46,0.15)', color: 'var(--accent)' }}>
                                <Sparkles size={10} style={{ marginRight: 3, display: 'inline' }} /> Destaque
                              </span>
                            )}
                            {s.scheduledViaWhatsapp && (
                              <span className="stock-badge low" style={{ background: 'rgba(56,161,105,0.15)', color: '#38a169' }}>
                                WhatsApp
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button type="button" className="btn-icon" onClick={() => handleOpenEditService(s)} title="Editar"><Edit2 size={14} /></button>
                            <button type="button" className="btn-icon" style={{ color: '#e53e3e' }} onClick={() => handleDeleteService(s.id)} title="Excluir"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Modal de Cadastro/Edição de Produto */}
      {showModal && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleSave}>
            <h3>{editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}</h3>

            <div className="form-group">
              <label>Nome do Produto *</label>
              <input 
                type="text" 
                required 
                placeholder="Ex: Creme definidor 250ml"
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Categoria *</label>
                <select 
                  value={form.category}
                  onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Qtd. Inicial *</label>
                <input 
                  type="number" 
                  required 
                  min="0"
                  value={form.quantity}
                  onChange={e => setForm(prev => ({ ...prev, quantity: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 12 }}>
              <div className="form-group">
                <label>Preço Custo (R$) *</label>
                <input 
                  type="number" 
                  required 
                  min="0"
                  step="0.01"
                  value={form.costPrice}
                  onChange={e => setForm(prev => ({ ...prev, costPrice: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Preço Venda (R$) *</label>
                <input 
                  type="number" 
                  required 
                  min="0"
                  step="0.01"
                  value={form.sellingPrice}
                  onChange={e => setForm(prev => ({ ...prev, sellingPrice: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Estoque Mín. *</label>
                <input 
                  type="number" 
                  required 
                  min="0"
                  value={form.minStock}
                  onChange={e => setForm(prev => ({ ...prev, minStock: e.target.value }))}
                />
              </div>
            </div>

            <div className="modal-actions" style={{ justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-accent">Salvar Produto</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal de Cadastro/Edição de Serviço */}
      {showServiceModal && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleSaveService}>
            <h3>{editingService ? 'Editar Serviço' : 'Cadastrar Novo Serviço'}</h3>

            <div className="form-group">
              <label>Nome do Serviço *</label>
              <input 
                type="text" 
                required 
                placeholder="Ex: Corte com o Jon"
                value={serviceForm.name}
                onChange={e => setServiceForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Categoria *</label>
                <select 
                  value={serviceForm.category}
                  onChange={e => setServiceForm(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="Corte">Corte</option>
                  <option value="Tratamento">Tratamento</option>
                  <option value="Coloração">Coloração</option>
                  <option value="Combo">Combo</option>
                  <option value="Finalização">Finalização</option>
                  <option value="Análise">Análise</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div className="form-group">
                <label>Duração Estimada (minutos) *</label>
                <input 
                  type="number" 
                  required 
                  min="1"
                  value={serviceForm.duration}
                  onChange={e => setServiceForm(prev => ({ ...prev, duration: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 12 }}>
              <div className="form-group">
                <label>Valor (R$) *</label>
                <input 
                  type="number" 
                  required 
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={serviceForm.price}
                  onChange={e => setServiceForm(prev => ({ ...prev, price: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Custo do Serviço (R$)</label>
                <input 
                  type="number" 
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={serviceForm.cost}
                  onChange={e => setServiceForm(prev => ({ ...prev, cost: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Tipo de Preço *</label>
                <select 
                  value={serviceForm.priceType}
                  onChange={e => setServiceForm(prev => ({ ...prev, priceType: e.target.value }))}
                >
                  <option value="Fixo">Fixo</option>
                  <option value="A partir de">A partir de</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 12 }}>
              <label>Descrição</label>
              <textarea 
                rows="3"
                placeholder="Detalhe o procedimento..."
                value={serviceForm.description}
                onChange={e => setServiceForm(prev => ({ ...prev, description: e.target.value }))}
                style={{ width: '100%', padding: '8px', background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--rule)', borderRadius: '4px' }}
              />
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem' }}>
                <input 
                  type="checkbox"
                  checked={serviceForm.isPrimary}
                  onChange={e => setServiceForm(prev => ({ ...prev, isPrimary: e.target.checked }))}
                />
                Destaque no Catálogo?
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem' }}>
                <input 
                  type="checkbox"
                  checked={serviceForm.scheduledViaWhatsapp}
                  onChange={e => setServiceForm(prev => ({ ...prev, scheduledViaWhatsapp: e.target.checked }))}
                />
                Agendar via WhatsApp?
              </label>
            </div>

            <div className="modal-actions" style={{ justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowServiceModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-accent">Salvar Serviço</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminInventory;
