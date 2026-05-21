import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, onSnapshot, doc, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Plus, Trash2, Award, Ticket, Gift, Settings, Search } from 'lucide-react';
import './Admin.css';

const SEED_COUPONS = [
  { id: 'c1', code: 'BEMVINDA15', type: 'fixo', value: 15, validity: '2026-12-31', limit: 100, used: 24, status: 'ativo' },
  { id: 'c2', code: 'JONCACHEADO10', type: 'porcentagem', value: 10, validity: '2026-08-30', limit: 50, used: 12, status: 'ativo' }
];

const SEED_GIFTCARDS = [
  { id: 'g1', code: 'VALE50_XYZ', value: 50, clientName: 'Mariana Costa', status: 'ativo', createdAt: '2026-05-18' },
  { id: 'g2', code: 'VALE100_ABC', value: 100, clientName: 'Patricia Goulart', status: 'resgatado', createdAt: '2026-05-10' }
];

const SEED_FIDELITY = [
  { id: 'f1', clientName: 'Ana Souza', clientPhone: '31999998888', points: 150 },
  { id: 'f2', clientName: 'Carla Lima', clientPhone: '31988887777', points: 80 },
  { id: 'f3', clientName: 'Bruna Melo', clientPhone: '31977776666', points: 220 }
];

const AdminMarketing = () => {
  const [activeTab, setActiveTab] = useState('cupons');
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Data states
  const [coupons, setCoupons] = useState([]);
  const [giftCards, setGiftCards] = useState([]);
  const [fidelityPoints, setFidelityPoints] = useState([]);
  const [fidelityRules, setFidelityRules] = useState({
    pointsPerReal: 1,
    pointsToRedeem: 100,
    redeemValue: 10
  });

  // Modals & form states
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showFidelityAdjustModal, setShowFidelityAdjustModal] = useState(false);

  const [couponForm, setCouponForm] = useState({
    code: '',
    type: 'porcentagem',
    value: '',
    validity: '',
    limit: 100
  });

  const [giftForm, setGiftForm] = useState({
    code: '',
    value: '',
    clientName: ''
  });

  const [selectedClientFidelity, setSelectedClientFidelity] = useState(null);
  const [fidelityAdjustment, setFidelityAdjustment] = useState('');
  const [fidelitySearch, setFidelitySearch] = useState('');

  // Load Rules & Mock Data
  useEffect(() => {
    // Carrega regras de fidelidade salvas localmente
    const savedRules = localStorage.getItem('demo_fidelity_rules');
    if (savedRules) {
      setFidelityRules(JSON.parse(savedRules));
    }

    let unsubCoupons, unsubGift, unsubFidelity;
    let timedOut = false;

    const loadMockData = () => {
      const c = localStorage.getItem('demo_coupons');
      const g = localStorage.getItem('demo_giftcards');
      const f = localStorage.getItem('demo_fidelity');

      setCoupons(c ? JSON.parse(c) : SEED_COUPONS);
      setGiftCards(g ? JSON.parse(g) : SEED_GIFTCARDS);
      setFidelityPoints(f ? JSON.parse(f) : SEED_FIDELITY);
      
      if (!c) localStorage.setItem('demo_coupons', JSON.stringify(SEED_COUPONS));
      if (!g) localStorage.setItem('demo_giftcards', JSON.stringify(SEED_GIFTCARDS));
      if (!f) localStorage.setItem('demo_fidelity', JSON.stringify(SEED_FIDELITY));
    };

    if (!db) {
      setIsDemoMode(true);
      loadMockData();
      setLoading(false);
      return;
    }

    setLoading(true);

    const timeoutId = setTimeout(() => {
      timedOut = true;
      console.warn('Firestore subscription for marketing timed out. Falling back to Demo Mode.');
      setIsDemoMode(true);
      loadMockData();
      setLoading(false);
    }, 3500);

    try {
      unsubCoupons = onSnapshot(collection(db, 'coupons'), (snap) => {
        if (timedOut) return;
        const list = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        setCoupons(list);
      });

      unsubGift = onSnapshot(collection(db, 'giftcards'), (snap) => {
        if (timedOut) return;
        const list = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        setGiftCards(list);
      });

      unsubFidelity = onSnapshot(collection(db, 'clients'), (snap) => {
        if (timedOut) return;
        clearTimeout(timeoutId);
        const list = [];
        snap.forEach(d => {
          const data = d.data();
          list.push({
            id: d.id,
            clientName: data.name || data.clientName,
            clientPhone: data.phone || data.clientPhone,
            points: data.fidelityPoints || 0
          });
        });
        // Se a lista do Firestore for muito vazia, mesclamos com dados demo para ficar mais rico
        if (list.length === 0) {
          setFidelityPoints(SEED_FIDELITY);
        } else {
          setFidelityPoints(list);
        }
        setLoading(false);
        setIsDemoMode(false);
      }, (err) => {
        if (timedOut) return;
        clearTimeout(timeoutId);
        setIsDemoMode(true);
        loadMockData();
        setLoading(false);
      });

      return () => {
        clearTimeout(timeoutId);
        if (unsubCoupons) unsubCoupons();
        if (unsubGift) unsubGift();
        if (unsubFidelity) unsubFidelity();
      };
    } catch (e) {
      if (!timedOut) {
        clearTimeout(timeoutId);
        setIsDemoMode(true);
        loadMockData();
        setLoading(false);
      }
    }
  }, []);

  // Save changes wrapper
  const saveFidelityRules = (newRules) => {
    setFidelityRules(newRules);
    localStorage.setItem('demo_fidelity_rules', JSON.stringify(newRules));
  };

  const handleAddCoupon = async (e) => {
    e.preventDefault();
    const payload = {
      code: couponForm.code.toUpperCase().trim(),
      type: couponForm.type,
      value: Number(couponForm.value),
      validity: couponForm.validity,
      limit: Number(couponForm.limit),
      used: 0,
      status: 'ativo'
    };

    try {
      if (isDemoMode) {
        const list = [{ id: 'c_' + Date.now(), ...payload }, ...coupons];
        setCoupons(list);
        localStorage.setItem('demo_coupons', JSON.stringify(list));
      } else {
        await addDoc(collection(db, 'coupons'), payload);
      }
      setShowCouponModal(false);
      setCouponForm({ code: '', type: 'porcentagem', value: '', validity: '', limit: 100 });
    } catch (err) {
      console.error(err);
      alert('Falha ao adicionar cupom.');
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!confirm('Deseja realmente remover este cupom?')) return;
    try {
      if (isDemoMode) {
        const list = coupons.filter(c => c.id !== id);
        setCoupons(list);
        localStorage.setItem('demo_coupons', JSON.stringify(list));
      } else {
        await deleteDoc(doc(db, 'coupons', id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddGiftCard = async (e) => {
    e.preventDefault();
    const payload = {
      code: giftForm.code.toUpperCase().trim() || 'VALE' + Math.floor(Math.random() * 90000 + 10000),
      value: Number(giftForm.value),
      clientName: giftForm.clientName,
      status: 'ativo',
      createdAt: new Date().toISOString().split('T')[0]
    };

    try {
      if (isDemoMode) {
        const list = [{ id: 'g_' + Date.now(), ...payload }, ...giftCards];
        setGiftCards(list);
        localStorage.setItem('demo_giftcards', JSON.stringify(list));
      } else {
        await addDoc(collection(db, 'giftcards'), payload);
      }
      setShowGiftModal(false);
      setGiftForm({ code: '', value: '', clientName: '' });
    } catch (err) {
      console.error(err);
      alert('Falha ao adicionar vale-presente.');
    }
  };

  const handleRedeemGift = async (id) => {
    if (!confirm('Confirmar resgate total deste Vale-Presente?')) return;
    try {
      if (isDemoMode) {
        const list = giftCards.map(g => g.id === id ? { ...g, status: 'resgatado' } : g);
        setGiftCards(list);
        localStorage.setItem('demo_giftcards', JSON.stringify(list));
      } else {
        await updateDoc(doc(db, 'giftcards', id), { status: 'resgatado' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdjustPoints = async (e) => {
    e.preventDefault();
    const delta = Number(fidelityAdjustment);
    if (!selectedClientFidelity || isNaN(delta)) return;

    const newPoints = Math.max(0, selectedClientFidelity.points + delta);

    try {
      if (isDemoMode || !db) {
        const list = fidelityPoints.map(f => f.id === selectedClientFidelity.id ? { ...f, points: newPoints } : f);
        setFidelityPoints(list);
        localStorage.setItem('demo_fidelity', JSON.stringify(list));
      } else {
        await updateDoc(doc(db, 'clients', selectedClientFidelity.id), { fidelityPoints: newPoints });
      }
      setShowFidelityAdjustModal(false);
      setSelectedClientFidelity(null);
      setFidelityAdjustment('');
      alert('Pontos atualizados com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Não foi possível ajustar a pontuação.');
    }
  };

  const filteredFidelity = fidelityPoints.filter(f => 
    f.clientName.toLowerCase().includes(fidelitySearch.toLowerCase()) ||
    f.clientPhone.includes(fidelitySearch)
  );

  return (
    <div className="admin-marketing-page">
      {/* Abas */}
      <div className="tab-menu" style={{ marginBottom: 24 }}>
        <button className={`tab-btn ${activeTab === 'cupons' ? 'active' : ''}`} onClick={() => setActiveTab('cupons')}>
          <Ticket size={16} /> Cupons de Desconto
        </button>
        <button className={`tab-btn ${activeTab === 'fidelidade' ? 'active' : ''}`} onClick={() => setActiveTab('fidelidade')}>
          <Award size={16} /> Programa de Fidelidade
        </button>
        <button className={`tab-btn ${activeTab === 'vales' ? 'active' : ''}`} onClick={() => setActiveTab('vales')}>
          <Gift size={16} /> Vales-Presente
        </button>
      </div>

      {isDemoMode && (
        <div style={{ marginBottom: 16, padding: '8px 16px', background: 'rgba(176, 90, 46, 0.08)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent)' }}>Ambiente de Demonstração / Dados Locais</span>
        </div>
      )}

      {/* CONTEÚDO: CUPONS */}
      {activeTab === 'cupons' && (
        <div className="financial-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3>Gestão de Cupons Promocionais</h3>
            <button className="btn btn-accent" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => setShowCouponModal(true)}>
              <Plus size={16} style={{ marginRight: 6 }} /> Criar Novo Cupom
            </button>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Tipo</th>
                <th>Desconto</th>
                <th>Vencimento</th>
                <th>Usos / Limite</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{c.code}</td>
                  <td>{c.type === 'porcentagem' ? 'Porcentagem' : 'Valor Fixo'}</td>
                  <td>{c.type === 'porcentagem' ? `${c.value}%` : `R$ ${c.value}`}</td>
                  <td>{c.validity.split('-').reverse().join('/')}</td>
                  <td>{c.used} / {c.limit}</td>
                  <td>
                    <span className={`status-badge ${c.status === 'ativo' ? 'confirmado' : 'cancelado'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn-icon text-danger" onClick={() => handleDeleteCoupon(c.id)}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CONTEÚDO: PROGRAMA DE FIDELIDADE */}
      {activeTab === 'fidelidade' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
          {/* Configuração de Regras */}
          <div className="financial-card" style={{ height: 'fit-content' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Settings size={18} style={{ color: 'var(--accent)' }} />
              <h3 style={{ margin: 0 }}>Regras do Clube</h3>
            </div>
            
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>Conversão (R$ para Pontos)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>R$ 1,00 =</span>
                <input 
                  type="number" 
                  value={fidelityRules.pointsPerReal} 
                  onChange={e => saveFidelityRules({ ...fidelityRules, pointsPerReal: Number(e.target.value) })}
                  style={{ width: 70, textAlign: 'center' }}
                />
                <span>Ponto(s)</span>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>Resgate de Prêmio</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <input 
                  type="number" 
                  value={fidelityRules.pointsToRedeem} 
                  onChange={e => saveFidelityRules({ ...fidelityRules, pointsToRedeem: Number(e.target.value) })}
                  style={{ width: 75, textAlign: 'center' }}
                />
                <span>pts valem</span>
                <span style={{ fontWeight: 600 }}>R$</span>
                <input 
                  type="number" 
                  value={fidelityRules.redeemValue} 
                  onChange={e => saveFidelityRules({ ...fidelityRules, redeemValue: Number(e.target.value) })}
                  style={{ width: 75, textAlign: 'center' }}
                />
              </div>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 16 }}>
              As pontuações são lançadas nas contas dos clientes automaticamente ao fechar comandas finalizadas.
            </p>
          </div>

          {/* Saldo de Pontos dos Clientes */}
          <div className="financial-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <h3 style={{ margin: 0 }}>Pontuação das Clientes</h3>
              
              <div className="search-input-wrapper" style={{ width: 220, background: 'var(--surface)' }}>
                <Search size={14} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Filtrar por nome ou WhatsApp..." 
                  value={fidelitySearch}
                  onChange={e => setFidelitySearch(e.target.value)}
                />
              </div>
            </div>

            <table className="admin-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Contato</th>
                  <th>Saldo de Pontos</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredFidelity.map(f => (
                  <tr key={f.id}>
                    <td>{f.clientName}</td>
                    <td>{f.clientPhone}</td>
                    <td style={{ fontWeight: 700 }}>{f.points} pts</td>
                    <td>
                      <button 
                        className="btn btn-ghost" 
                        style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                        onClick={() => {
                          setSelectedClientFidelity(f);
                          setShowFidelityAdjustModal(true);
                        }}
                      >
                        Ajustar Pontos
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTEÚDO: VALES-PRESENTE */}
      {activeTab === 'vales' && (
        <div className="financial-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3>Vales-Presente Emitidos</h3>
            <button className="btn btn-accent" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => setShowGiftModal(true)}>
              <Plus size={16} style={{ marginRight: 6 }} /> Emitir Vale-Presente
            </button>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Código do Voucher</th>
                <th>Valor do Vale</th>
                <th>Beneficiário/Comprador</th>
                <th>Data de Emissão</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {giftCards.map(g => (
                <tr key={g.id}>
                  <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{g.code}</td>
                  <td>R$ {g.value}</td>
                  <td>{g.clientName}</td>
                  <td>{g.createdAt.split('-').reverse().join('/')}</td>
                  <td>
                    <span className={`status-badge ${g.status === 'ativo' ? 'confirmado' : 'cancelado'}`}>
                      {g.status}
                    </span>
                  </td>
                  <td>
                    {g.status === 'ativo' && (
                      <button className="btn btn-ghost" style={{ padding: '3px 8px', fontSize: '0.75rem' }} onClick={() => handleRedeemGift(g.id)}>
                        Marcar como Resgatado
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: CRIAR CUPOM */}
      {showCouponModal && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleAddCoupon}>
            <h3>Criar Novo Cupom Promocional</h3>

            <div className="form-group">
              <label>Código do Cupom *</label>
              <input 
                type="text" 
                required 
                placeholder="Ex: CACHOSVIP15"
                value={couponForm.code}
                onChange={e => setCouponForm(prev => ({ ...prev, code: e.target.value }))}
              />
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Tipo de Desconto *</label>
                <select 
                  value={couponForm.type}
                  onChange={e => setCouponForm(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="porcentagem">Porcentagem (%)</option>
                  <option value="fixo">Valor Fixo (R$)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Valor do Desconto *</label>
                <input 
                  type="number" 
                  required 
                  min="1"
                  placeholder={couponForm.type === 'porcentagem' ? '10' : '15.00'}
                  value={couponForm.value}
                  onChange={e => setCouponForm(prev => ({ ...prev, value: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              <div className="form-group">
                <label>Data de Validade *</label>
                <input 
                  type="date" 
                  required
                  value={couponForm.validity}
                  onChange={e => setCouponForm(prev => ({ ...prev, validity: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Limite Total de Usos *</label>
                <input 
                  type="number" 
                  required
                  value={couponForm.limit}
                  onChange={e => setCouponForm(prev => ({ ...prev, limit: e.target.value }))}
                />
              </div>
            </div>

            <div className="modal-actions" style={{ justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowCouponModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-accent">Criar Cupom</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: CRIAR VALE-PRESENTE */}
      {showGiftModal && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleAddGiftCard}>
            <h3>Emitir Vale-Presente</h3>

            <div className="form-group">
              <label>Nome do Comprador / Beneficiário *</label>
              <input 
                type="text" 
                required 
                placeholder="Ex: Patricia Goulart"
                value={giftForm.clientName}
                onChange={e => setGiftForm(prev => ({ ...prev, clientName: e.target.value }))}
              />
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              <div className="form-group">
                <label>Valor do Vale (R$) *</label>
                <input 
                  type="number" 
                  required 
                  min="10"
                  step="10"
                  placeholder="100.00"
                  value={giftForm.value}
                  onChange={e => setGiftForm(prev => ({ ...prev, value: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Código do Voucher (Opcional)</label>
                <input 
                  type="text" 
                  placeholder="Gerado automaticamente se vazio"
                  value={giftForm.code}
                  onChange={e => setGiftForm(prev => ({ ...prev, code: e.target.value }))}
                />
              </div>
            </div>

            <div className="modal-actions" style={{ justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowGiftModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-accent">Emitir Vale</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: AJUSTAR PONTOS */}
      {showFidelityAdjustModal && selectedClientFidelity && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleAdjustPoints}>
            <h3>Ajustar Pontuação de Fidelidade</h3>
            <p>Cliente: <strong>{selectedClientFidelity.clientName}</strong></p>
            <p>Saldo Atual: <strong>{selectedClientFidelity.points} pontos</strong></p>

            <div className="form-group" style={{ marginTop: 16 }}>
              <label>Valor a somar ou subtrair *</label>
              <input 
                type="number" 
                required 
                placeholder="Ex: 50 para adicionar, -30 para descontar"
                value={fidelityAdjustment}
                onChange={e => setFidelityAdjustment(e.target.value)}
              />
            </div>

            <div className="modal-actions" style={{ justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowFidelityAdjustModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-accent">Confirmar Ajuste</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminMarketing;
