import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { db } from '../../config/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Plus, Edit2, Trash2, ArrowUp, Scissors } from 'lucide-react';
import './Admin.css';
import { useInventoryData } from '../../hooks/useInventoryData';

const SEED_PRODUCTS = [
  { id: 'p1', name: 'Shampoo Curly Special 250ml', category: 'Shampoo', quantity: 15, costPrice: 25, sellingPrice: 55 },
  { id: 'p2', name: 'Condicionador Curly Hydrate 250ml', category: 'Condicionador', quantity: 12, costPrice: 28, sellingPrice: 60 },
  { id: 'p3', name: 'Ativador de Cachos Premium 500ml', category: 'Finalizador', quantity: 3, costPrice: 35, sellingPrice: 80 },
  { id: 'p4', name: 'Gelatina Capilar Modeladora 300g', category: 'Finalizador', quantity: 8, costPrice: 20, sellingPrice: 45 },
  { id: 'p5', name: 'Óleo Reparador de Argan 60ml', category: 'Óleo', quantity: 20, costPrice: 40, sellingPrice: 90 }
];

const CATEGORIES = ['Shampoo', 'Condicionador', 'Máscara', 'Finalizador', 'Óleo', 'Acessório', 'Outros'];

const AdminInventory = () => {
  const { setGlobalData } = useOutletContext() || {};
  const { products, setProducts, loading, isDemoMode } = useInventoryData(SEED_PRODUCTS);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

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
      description: actionType === 'Uso do Salão'
        ? `Uso do Salão: ${productName} (-${quantity} un.)`
        : `${actionType} de estoque: ${productName} (+${quantity} un.)`,
      createdAt: new Date().toISOString()
    };

    try {
      if (isDemoMode) {
        const local = JSON.parse(localStorage.getItem('demo_financial') || '[]');
        const randomId = crypto.randomUUID().substring(0, 8);
        const updated = [{ id: 'tx_' + randomId, ...payload }, ...local];
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
    sellingPrice: 0
  });

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
      sellingPrice: 45
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
      sellingPrice: product.sellingPrice
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
      sellingPrice: Number(form.sellingPrice)
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
          const randomId = crypto.randomUUID().substring(0, 8);
          const newProd = { id: 'p_' + randomId, ...payload };
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

  const handleUseInSalon = async (product) => {
    const amountStr = prompt(`Quantidade de "${product.name}" usada no salão (estoque atual: ${product.quantity}):`, "1");
    if (amountStr === null) return;
    const amount = Number(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert("Quantidade inválida.");
      return;
    }
    if (amount > product.quantity) {
      alert("Quantidade insuficiente em estoque.");
      return;
    }

    const newQty = product.quantity - amount;
    try {
      if (isDemoMode) {
        const updated = products.map(p => p.id === product.id ? { ...p, quantity: newQty } : p);
        saveLocalProducts(updated);
        await logProductExpense(product.name, amount, product.costPrice, 'Uso do Salão');
      } else {
        const docRef = doc(db, 'products', product.id);
        await updateDoc(docRef, { quantity: newQty });
        await logProductExpense(product.name, amount, product.costPrice, 'Uso do Salão');
      }
      alert(`Registrado com sucesso: saída de ${amount} un. de "${product.name}" para uso do salão.`);
    } catch (err) {
      console.error('Erro ao registrar uso do salão:', err);
      alert('Erro ao processar a saída.');
    }
  };

  // Estatísticas de almoxarifado
  const totalItems = products.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalValue = products.reduce((acc, curr) => acc + (curr.quantity * curr.sellingPrice), 0);

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
          <h3>Valor Comercial em Estoque</h3>
          <div className="value" style={{ color: 'var(--adm-success)' }}>R$ {totalValue.toFixed(2)}</div>
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
                <th>Custo Unit.</th>
                <th>Preço Venda</th>
                <th>Lucro Unit.</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                    Nenhum produto cadastrado no estoque.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
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
                               style={{ width: 60, padding: '4px 8px', borderRadius: 4, border: '1px solid var(--adm-rule)' }}
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
                      <td>R$ {Number(p.costPrice).toFixed(2)}</td>
                      <td>R$ {Number(p.sellingPrice).toFixed(2)}</td>
                      <td style={{ color: 'var(--adm-success)', fontWeight: 600 }}>R$ {(Number(p.sellingPrice) - Number(p.costPrice)).toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button className="btn-icon" style={{ color: 'var(--adm-accent, var(--m-gold))' }} onClick={() => handleUseInSalon(p)} title="Uso do Salão"><Scissors size={14} /></button>
                          <button className="btn-icon" onClick={() => handleOpenEdit(p)} title="Editar"><Edit2 size={14} /></button>
                          <button className="btn-icon" style={{ color: 'var(--adm-danger)' }} onClick={() => handleDelete(p.id)} title="Excluir"><Trash2 size={14} /></button>
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

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
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
