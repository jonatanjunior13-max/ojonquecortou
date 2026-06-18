import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { db } from '../../config/firebase';
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Plus, Edit2, Trash2, ArrowUp, Scissors, Package, Beaker } from 'lucide-react';
import './Admin.css';

const SEED_PRODUCTS = [
  { id: 'p1', name: 'Shampoo Curly Special 250ml', category: 'Shampoo', quantity: 15, costPrice: 25, sellingPrice: 55 },
  { id: 'p2', name: 'Condicionador Curly Hydrate 250ml', category: 'Condicionador', quantity: 12, costPrice: 28, sellingPrice: 60 },
  { id: 'p3', name: 'Ativador de Cachos Premium 500ml', category: 'Finalizador', quantity: 3, costPrice: 35, sellingPrice: 80 },
  { id: 'p4', name: 'Gelatina Capilar Modeladora 300g', category: 'Finalizador', quantity: 8, costPrice: 20, sellingPrice: 45 },
  { id: 'p5', name: 'Óleo Reparador de Argan 60ml', category: 'Óleo', quantity: 20, costPrice: 40, sellingPrice: 90 }
];

const CATEGORIES = ['Shampoo', 'Condicionador', 'Máscara', 'Finalizador', 'Óleo', 'Acessório', 'Outros'];

const SALON_PRODUCT_TYPES = ['Creme', 'Pó Descolorante', 'Oxidante', 'Shampoo', 'Condicionador', 'Máscara', 'Finalizador', 'Coloração', 'Tonalizante', 'Ampola', 'Óleo', 'Outros'];

const AdminInventory = () => {
  const { globalData, setGlobalData } = useOutletContext() || {};
  const [activeTab, setActiveTab] = useState('venda');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Salon products state
  const salonProducts = globalData?.salon_products || [];
  const [showSalonModal, setShowSalonModal] = useState(false);
  const [editingSalonProduct, setEditingSalonProduct] = useState(null);
  const [salonForm, setSalonForm] = useState({
    name: '',
    type: 'Creme',
    volumetry: 0,
    unit: 'g',
    costPrice: 0
  });

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

  const [form, setForm] = useState({
    name: '',
    category: 'Shampoo',
    quantity: 0,
    costPrice: 0,
    sellingPrice: 0,
    image: ''
  });
  const [photoSearchLoading, setPhotoSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    let unsubscribe;

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

  // Buscador de imagens de produto comercial usando a API aberta da Wikipedia (CORS livre, sem chaves)
  const searchProductImage = async (productName) => {
    if (!productName) return;
    setPhotoSearchLoading(true);
    try {
      const query = encodeURIComponent(productName);
      // Busca artigos da Wikipedia correspondentes ao termo
      const wikiRes = await fetch(`https://pt.wikipedia.org/w/api.php?action=query&origin=*&format=json&generator=search&gsrsearch=${query}&gsrlimit=6&prop=pageimages&piprop=thumbnail&pithumbsize=400`);
      if (wikiRes.ok) {
        const data = await wikiRes.json();
        const pages = data.query?.pages || {};
        const urls = Object.values(pages)
          .map(page => page.thumbnail?.source)
          .filter(url => !!url);
        
        // Se a Wikipedia não retornar nada, adicionamos imagens genéricas de alta qualidade do Picsum
        if (urls.length === 0) {
          const fallbackUrls = [
            'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&q=80', // Cosmético Genérico
            'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400&q=80', // Óleo capilar
            'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&q=80', // Sabonete/Shampoo
            'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&q=80', // Cuidados com cabelo
            'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=400&q=80', // Spray capilar
            'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&q=80'  // Pote de creme
          ];
          setSearchResults(fallbackUrls);
        } else {
          setSearchResults(urls);
        }
      } else {
        throw new Error('Erro na resposta da API.');
      }
    } catch (err) {
      console.error('Erro ao buscar fotos:', err);
      // Fallback em caso de erro na rede
      const fallbackUrls = [
        'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&q=80',
        'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400&q=80',
        'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&q=80'
      ];
      setSearchResults(fallbackUrls);
    } finally {
      setPhotoSearchLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setForm({
      name: '',
      category: 'Shampoo',
      quantity: 10,
      costPrice: 20,
      sellingPrice: 45,
      image: ''
    });
    setSearchResults([]);
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
      image: product.image || ''
    });
    setSearchResults([]);
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
      image: form.image
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
          // Sincronizar com o Google Meu Negócio
          fetch('/api/gbp?action=sync-product', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editingProduct.id, ...payload })
          }).catch(err => console.error('Erro de sincronização automática:', err));
        } else {
          const docRef = await addDoc(collection(db, 'products'), payload);
          await logProductExpense(payload.name, payload.quantity, payload.costPrice, 'Compra');
          // Sincronizar com o Google Meu Negócio
          fetch('/api/gbp?action=sync-product', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: docRef.id, ...payload })
          }).catch(err => console.error('Erro de sincronização automática:', err));
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

  // ===== SALON PRODUCTS (Uso Interno) CRUD =====

  const saveLocalSalonProducts = (updated) => {
    localStorage.setItem('demo_salon_products', JSON.stringify(updated));
    if (setGlobalData) {
      setGlobalData(prev => ({ ...prev, salon_products: updated }));
    }
  };

  const handleOpenAddSalon = () => {
    setEditingSalonProduct(null);
    setSalonForm({ name: '', type: 'Creme', volumetry: 500, unit: 'g', costPrice: 50 });
    setShowSalonModal(true);
  };

  const handleOpenEditSalon = (product) => {
    setEditingSalonProduct(product);
    setSalonForm({
      name: product.name,
      type: product.type || 'Creme',
      volumetry: product.volumetry || 0,
      unit: product.unit || 'g',
      costPrice: product.costPrice || 0
    });
    setShowSalonModal(true);
  };

  const handleSaveSalonProduct = async (e) => {
    e.preventDefault();
    const vol = Number(salonForm.volumetry);
    const cost = Number(salonForm.costPrice);
    const pricePerUnit = vol > 0 ? cost / vol : 0;

    const payload = {
      name: salonForm.name,
      type: salonForm.type,
      volumetry: vol,
      unit: salonForm.unit,
      costPrice: cost,
      pricePerUnit: Number(pricePerUnit.toFixed(4)),
      updatedAt: new Date().toISOString()
    };

    try {
      if (isDemoMode || !db) {
        const current = [...salonProducts];
        if (editingSalonProduct) {
          const updated = current.map(p => p.id === editingSalonProduct.id ? { ...p, ...payload } : p);
          saveLocalSalonProducts(updated);
        } else {
          const newItem = { id: 'sp_' + Date.now(), ...payload, createdAt: new Date().toISOString() };
          saveLocalSalonProducts([...current, newItem]);
        }
      } else {
        if (editingSalonProduct) {
          const docRef = doc(db, 'salon_products', editingSalonProduct.id);
          await updateDoc(docRef, payload);
        } else {
          await addDoc(collection(db, 'salon_products'), { ...payload, createdAt: new Date().toISOString() });
        }
      }
      setShowSalonModal(false);
    } catch (err) {
      console.error('Erro ao salvar produto de uso interno:', err);
      alert('Não foi possível salvar o produto.');
    }
  };

  const handleDeleteSalonProduct = async (id) => {
    if (!confirm('Deseja realmente excluir este produto de uso interno?')) return;
    try {
      if (isDemoMode || !db) {
        const updated = salonProducts.filter(p => p.id !== id);
        saveLocalSalonProducts(updated);
      } else {
        await deleteDoc(doc(db, 'salon_products', id));
      }
    } catch (err) {
      console.error('Erro ao excluir produto de uso interno:', err);
      alert('Erro ao excluir produto.');
    }
  };

  // Estatísticas de almoxarifado
  const totalItems = products.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalValue = products.reduce((acc, curr) => acc + (curr.quantity * curr.sellingPrice), 0);

  // Estatísticas de produtos de uso interno
  const totalSalonProducts = salonProducts.length;
  const totalSalonValue = salonProducts.reduce((acc, curr) => acc + Number(curr.costPrice || 0), 0);

  return (
    <div className="admin-inventory-page">
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '2px solid var(--adm-rule)' }}>
        <button
          type="button"
          onClick={() => setActiveTab('venda')}
          style={{
            padding: '10px 20px',
            fontSize: '0.88rem',
            fontWeight: activeTab === 'venda' ? 700 : 500,
            color: activeTab === 'venda' ? 'var(--adm-gold)' : 'var(--adm-muted)',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'venda' ? '2px solid var(--adm-gold)' : '2px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.2s',
            marginBottom: -2
          }}
        >
          <Package size={16} /> Estoque de Venda
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('interno')}
          style={{
            padding: '10px 20px',
            fontSize: '0.88rem',
            fontWeight: activeTab === 'interno' ? 700 : 500,
            color: activeTab === 'interno' ? 'var(--adm-gold)' : 'var(--adm-muted)',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'interno' ? '2px solid var(--adm-gold)' : '2px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.2s',
            marginBottom: -2
          }}
        >
          <Beaker size={16} /> Uso Interno do Salão
        </button>
      </div>

      {/* ===== ABA: ESTOQUE DE VENDA ===== */}
      {activeTab === 'venda' && (
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
                          <td style={{ fontWeight: 600 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              {p.image ? (
                                <div style={{ width: 32, height: 32, borderRadius: 4, overflow: 'hidden', border: '1px solid var(--adm-rule)', flexShrink: 0 }}>
                                  <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                              ) : (
                                <div style={{ width: 32, height: 32, borderRadius: 4, background: '#222', border: '1px solid #444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: '0.75rem', flexShrink: 0 }}>
                                  N/A
                                </div>
                              )}
                              <span>{p.name}</span>
                            </div>
                          </td>
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
        </>
      )}

      {/* ===== ABA: USO INTERNO DO SALÃO ===== */}
      {activeTab === 'interno' && (
        <>
          {/* Cards de Métricas */}
          <section className="admin-stats-grid">
            <div className="stat-card">
              <h3>Produtos Cadastrados</h3>
              <div className="value">{totalSalonProducts}</div>
            </div>
            <div className="stat-card">
              <h3>Custo Total em Insumos</h3>
              <div className="value" style={{ color: 'var(--adm-warning, #e6a23c)' }}>R$ {totalSalonValue.toFixed(2)}</div>
            </div>
          </section>

          {/* Controles */}
          <div className="calendar-controls">
            <div className="nav-buttons">
              <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                Produtos de Uso Interno {(isDemoMode || !db) && <span className="status-badge pendente" style={{ marginLeft: 8 }}>Demonstração</span>}
              </span>
            </div>
            <button className="btn btn-accent" style={{ padding: '8px 16px', fontSize: '0.9rem' }} onClick={handleOpenAddSalon}>
              <Plus size={16} style={{ marginRight: 6 }} /> Novo Insumo
            </button>
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--adm-muted)', marginBottom: 14 }}>
            Produtos utilizados internamente nos serviços do salão (cremes, oxidantes, pós, etc.). 
            Esses insumos serão associados aos serviços para cálculo automático de custo por atendimento.
          </p>

          {/* Tabela */}
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Tipo</th>
                  <th>Volumetria</th>
                  <th>Unidade</th>
                  <th>Preço do Produto (R$)</th>
                  <th>Preço por g/ml (R$)</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {salonProducts.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                      Nenhum produto de uso interno cadastrado. Clique em "Novo Insumo" para começar.
                    </td>
                  </tr>
                ) : (
                  salonProducts.map(p => {
                    const vol = Number(p.volumetry || 0);
                    const cost = Number(p.costPrice || 0);
                    const ppu = vol > 0 ? (cost / vol) : 0;
                    return (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td>{p.type || '—'}</td>
                        <td>{vol > 0 ? vol : '—'}</td>
                        <td>{p.unit === 'ml' ? 'ml' : 'g'}</td>
                        <td>R$ {cost.toFixed(2)}</td>
                        <td style={{ color: 'var(--adm-gold)', fontWeight: 600 }}>R$ {ppu.toFixed(4)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button className="btn-icon" onClick={() => handleOpenEditSalon(p)} title="Editar"><Edit2 size={14} /></button>
                            <button className="btn-icon" style={{ color: 'var(--adm-danger)' }} onClick={() => handleDeleteSalonProduct(p.id)} title="Excluir"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal de Cadastro/Edição - Estoque de Venda */}
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

            <div className="form-group" style={{ marginTop: 12 }}>
              <label>Link da Foto do Produto</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input 
                  type="text" 
                  placeholder="Cole a URL da imagem ou busque ao lado"
                  value={form.image}
                  onChange={e => setForm(prev => ({ ...prev, image: e.target.value }))}
                  style={{ flexGrow: 1 }}
                />
                <button 
                  type="button" 
                  className="btn" 
                  style={{ background: 'var(--adm-gold)', color: '#000', fontWeight: 'bold', padding: '10px 14px' }}
                  onClick={() => searchProductImage(form.name)}
                  disabled={photoSearchLoading}
                >
                  {photoSearchLoading ? 'Buscando...' : 'Buscar Foto'}
                </button>
              </div>
            </div>

            {/* Grid de Resultados do Unsplash */}
            {searchResults.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--adm-gold)' }}>Fotos encontradas (clique para escolher):</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginTop: 6 }}>
                  {searchResults.map((url, i) => (
                    <div 
                      key={i} 
                      onClick={() => setForm(prev => ({ ...prev, image: url }))}
                      style={{ 
                        aspectRatio: '1', 
                        cursor: 'pointer', 
                        borderRadius: 6, 
                        overflow: 'hidden', 
                        border: form.image === url ? '3px solid var(--adm-gold)' : '1px solid #444',
                        background: '#111'
                      }}
                    >
                      <img src={url} alt={`Option ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview do Produto Selecionado */}
            {form.image && (
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 50, height: 50, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--adm-rule)' }}>
                  <img src={form.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--adm-success)' }}>Imagem selecionada com sucesso e pronta para enviar ao Google!</span>
              </div>
            )}

            <div className="modal-actions" style={{ justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-accent">Salvar Produto</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal de Cadastro/Edição - Uso Interno do Salão */}
      {showSalonModal && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleSaveSalonProduct}>
            <h3>{editingSalonProduct ? 'Editar Insumo' : 'Cadastrar Novo Insumo'}</h3>

            <div className="form-group">
              <label>Nome do Produto *</label>
              <input 
                type="text" 
                required 
                placeholder="Ex: Creme Hidratante Profissional"
                value={salonForm.name}
                onChange={e => setSalonForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Tipo *</label>
                <select 
                  value={salonForm.type}
                  onChange={e => setSalonForm(prev => ({ ...prev, type: e.target.value }))}
                >
                  {SALON_PRODUCT_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Unidade de Medida *</label>
                <select 
                  value={salonForm.unit}
                  onChange={e => setSalonForm(prev => ({ ...prev, unit: e.target.value }))}
                >
                  <option value="g">Gramas (g)</option>
                  <option value="ml">Mililitros (ml)</option>
                </select>
              </div>
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              <div className="form-group">
                <label>Volumetria ({salonForm.unit}) *</label>
                <input 
                  type="number" 
                  required 
                  min="1"
                  step="1"
                  placeholder="Ex: 500"
                  value={salonForm.volumetry}
                  onChange={e => setSalonForm(prev => ({ ...prev, volumetry: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Preço do Produto (R$) *</label>
                <input 
                  type="number" 
                  required 
                  min="0"
                  step="0.01"
                  placeholder="Ex: 89.90"
                  value={salonForm.costPrice}
                  onChange={e => setSalonForm(prev => ({ ...prev, costPrice: e.target.value }))}
                />
              </div>
            </div>

            {/* Preview do cálculo */}
            {Number(salonForm.volumetry) > 0 && Number(salonForm.costPrice) > 0 && (
              <div style={{ 
                marginTop: 16, 
                padding: '10px 14px', 
                background: 'var(--adm-bg, #1a1a2e)', 
                borderRadius: 8, 
                border: '1px solid var(--adm-rule)',
                fontSize: '0.85rem'
              }}>
                <strong style={{ color: 'var(--adm-gold)' }}>Preço por {salonForm.unit}:</strong>{' '}
                R$ {(Number(salonForm.costPrice) / Number(salonForm.volumetry)).toFixed(4)}/{salonForm.unit}
              </div>
            )}

            <div className="modal-actions" style={{ justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowSalonModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-accent">Salvar Insumo</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminInventory;
