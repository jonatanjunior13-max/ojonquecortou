import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Plus, Edit2, Trash2, AlertTriangle, ArrowUp } from 'lucide-react';
import './Admin.css';

const SEED_PRODUCTS = [
  { id: 'p1', name: 'Shampoo Curly Special 250ml', category: 'Shampoo', quantity: 15, costPrice: 25, sellingPrice: 55, minStock: 5 },
  { id: 'p2', name: 'Condicionador Curly Hydrate 250ml', category: 'Condicionador', quantity: 12, costPrice: 28, sellingPrice: 60, minStock: 4 },
  { id: 'p3', name: 'Ativador de Cachos Premium 500ml', category: 'Finalizador', quantity: 3, costPrice: 35, sellingPrice: 80, minStock: 5 },
  { id: 'p4', name: 'Gelatina Capilar Modeladora 300g', category: 'Finalizador', quantity: 8, costPrice: 20, sellingPrice: 45, minStock: 3 },
  { id: 'p5', name: 'Óleo Reparador de Argan 60ml', category: 'Óleo', quantity: 20, costPrice: 40, sellingPrice: 90, minStock: 5 }
];

const CATEGORIES = ['Shampoo', 'Condicionador', 'Finalizador', 'Óleo', 'Acessório', 'Outros'];

const AdminInventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
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

    const timeoutId = setTimeout(() => {
      timedOut = true;
      console.warn('Firestore subscription for products timed out. Falling back to Demo Mode.');
      setIsDemoMode(true);
      if (unsubscribe) unsubscribe();
      setProducts(getMockProducts());
      setLoading(false);
    }, 3500);

    try {
      unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
        if (timedOut) return;
        clearTimeout(timeoutId);

        const prodList = [];
        snapshot.forEach((doc) => {
          prodList.push({ id: doc.id, ...doc.data() });
        });
        setProducts(prodList);
        setLoading(false);
        setIsDemoMode(false);
      }, (error) => {
        if (timedOut) return;
        clearTimeout(timeoutId);
        console.warn('Erro ao carregar Firestore, mudando para Demo local:', error);
        setIsDemoMode(true);
        setProducts(getMockProducts());
        setLoading(false);
      });

      return () => {
        clearTimeout(timeoutId);
        if (unsubscribe) unsubscribe();
      };
    } catch (err) {
      if (!timedOut) {
        clearTimeout(timeoutId);
        console.warn('Falha na conexão com Firestore para produtos:', err);
        setIsDemoMode(true);
        setProducts(getMockProducts());
        setLoading(false);
      }
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
          const updated = products.map(p => p.id === editingProduct.id ? { ...p, ...payload } : p);
          saveLocalProducts(updated);
        } else {
          const newProd = { id: 'p_' + Date.now(), ...payload };
          saveLocalProducts([...products, newProd]);
        }
      } else {
        if (editingProduct) {
          const docRef = doc(db, 'products', editingProduct.id);
          await updateDoc(docRef, payload);
        } else {
          await addDoc(collection(db, 'products'), payload);
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
    const newQty = product.quantity + Number(quickRestockAmount);
    try {
      if (isDemoMode) {
        const updated = products.map(p => p.id === product.id ? { ...p, quantity: newQty } : p);
        saveLocalProducts(updated);
      } else {
        const docRef = doc(db, 'products', product.id);
        await updateDoc(docRef, { quantity: newQty });
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
          <div className="value" style={{ color: '#48bb78' }}>R$ {totalValue}</div>
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
                      <td>R$ {p.costPrice}</td>
                      <td>R$ {p.sellingPrice}</td>
                      <td style={{ color: '#48bb78', fontWeight: 600 }}>R$ {p.sellingPrice - p.costPrice}</td>
                      <td>
                        <span className={`stock-badge ${isLow ? 'low' : 'normal'}`}>
                          {isLow ? 'Estoque Baixo' : 'Normal'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button className="btn-icon" onClick={() => handleOpenEdit(p)} title="Editar"><Edit2 size={14} /></button>
                          <button className="btn-icon" style={{ color: '#e53e3e' }} onClick={() => handleDelete(p.id)} title="Excluir"><Trash2 size={14} /></button>
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

      {/* Modal de Cadastro/Edição */}
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
    </div>
  );
};

export default AdminInventory;
