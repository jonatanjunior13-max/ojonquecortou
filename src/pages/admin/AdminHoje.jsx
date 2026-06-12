import React, { useMemo, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Check, Phone, Clock, TrendingUp, TrendingDown, Users, Calendar, AlertCircle, Gift, X } from 'lucide-react';
import { db } from '../../config/firebase';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import KpiCard from '../../components/admin/ui/KpiCard';
import Card from '../../components/admin/ui/Card';
import EmptyState from '../../components/admin/ui/EmptyState';
import '../../styles/admin-tokens.css';

const todayStr = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
};

const isBirthdayToday = (birthDate) => {
  if (!birthDate) return false;
  const today = new Date();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const str = typeof birthDate === 'string' ? birthDate : '';
  return str.endsWith(`-${mm}-${dd}`) || str.startsWith(`${dd}/${mm}`);
};

const fmtBRL = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

const fmtTime = (t) => t || '--:--';

const statusLabel = { pendente: 'Pendente', confirmado: 'Confirmado', finalizado: 'Finalizado', cancelado: 'Cancelado', faltou: 'Faltou', bloqueado: 'Bloqueado' };

const statusColor = {
  pendente: 'var(--adm-warning)',
  confirmado: 'var(--adm-info)',
  finalizado: 'var(--adm-success)',
  cancelado: 'var(--adm-danger)',
  faltou: 'var(--adm-danger)',
  bloqueado: 'var(--adm-muted)',
};

const AdminHoje = () => {
  const context = useOutletContext() || {};
  const { globalData = {}, handleAcceptBooking, setGlobalData } = context;
  const navigate = useNavigate();
  const today = todayStr();
  const isDemoMode = !db;

  const bookings = globalData.bookings || [];
  const transactions = globalData.financial_transactions || [];
  const clients = globalData.clients || [];
  const products = globalData.products || [];

  const [selectedBooking, setSelectedBooking] = useState(null);

  const todayBookings = useMemo(
    () => bookings.filter(b => b.date === today && b.status !== 'bloqueado').sort((a, b) => (a.time || '').localeCompare(b.time || '')),
    [bookings, today]
  );

  const todayRevenue = useMemo(() => {
    return transactions
      .filter(t => {
        const d = t.date || t.createdAt || '';
        return (typeof d === 'string' ? d : d?.toDate?.()?.toISOString?.() || '').startsWith(today);
      })
      .filter(t => t.type === 'entrada' || t.value > 0)
      .reduce((sum, t) => sum + (Number(t.value) || 0), 0);
  }, [transactions, today]);

  const pendingBookings = useMemo(() => bookings.filter(b => b.status === 'pendente'), [bookings]);
  const confirmedToday = useMemo(() => todayBookings.filter(b => b.status === 'confirmado').length, [todayBookings]);
  const finishedToday = useMemo(() => todayBookings.filter(b => b.status === 'finalizado').length, [todayBookings]);

  const birthdays = useMemo(() => clients.filter(c => isBirthdayToday(c.birthDate || c.birthdate)), [clients]);

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nextClients = useMemo(() => {
    return todayBookings
      .filter(b => b.status === 'confirmado' || b.status === 'pendente')
      .filter(b => {
        if (!b.time) return false;
        const [h, m] = b.time.split(':').map(Number);
        return (h * 60 + m) >= nowMin;
      })
      .slice(0, 5);
  }, [todayBookings, nowMin]);

  return (
    <div className="admin-app" style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '24px' }}>
      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <KpiCard
          label="Faturamento hoje"
          value={fmtBRL(todayRevenue)}
          icon={<TrendingUp size={18} />}
        />
        <KpiCard
          label="Atendimentos"
          value={`${finishedToday + confirmedToday}`}
          sub={`${finishedToday} finalizados · ${confirmedToday} a caminho`}
          icon={<Calendar size={18} />}
        />
        <KpiCard
          label="Pendentes de aceite"
          value={`${pendingBookings.length}`}
          variant={pendingBookings.length > 0 ? 'warning' : undefined}
          icon={<AlertCircle size={18} />}
        />
        <KpiCard
          label="Clientes na base"
          value={`${clients.length}`}
          icon={<Users size={18} />}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        {/* Proximos clientes */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--adm-text)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Próximos de Hoje
            </span>
            <button
              type="button"
              onClick={() => navigate('/admin/agenda')}
              style={{ background: 'none', border: 'none', color: 'var(--adm-gold)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
            >
              Ver agenda completa
            </button>
          </div>

          {nextClients.length === 0 ? (
            <EmptyState icon={Calendar} message="Nada mais por hoje. Agenda livre para o resto do dia." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {nextClients.map(b => (
                <div
                  key={b.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '12px 14px',
                    background: 'var(--adm-card)',
                    borderRadius: 'var(--adm-radius-sm)',
                    border: '0.5px solid var(--adm-rule)',
                  }}
                >
                  <span style={{ fontSize: '1.05rem', fontFamily: 'Georgia, serif', fontWeight: 700, color: 'var(--adm-gold)', minWidth: 48 }}>
                    {fmtTime(b.time)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--adm-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {b.clientName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--adm-muted)', marginTop: 2 }}>
                      {b.serviceName || b.service?.name || 'Serviço'}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 4,
                    background: `${statusColor[b.status]}22`,
                    color: statusColor[b.status],
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    flexShrink: 0,
                  }}>
                    {statusLabel[b.status]}
                  </span>
                  {b.clientPhone && (
                    <a
                      href={`https://wa.me/${b.clientPhone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--adm-success)', flexShrink: 0, display: 'flex' }}
                      title="Abrir WhatsApp"
                    >
                      <Phone size={15} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Pendentes */}
          <Card variant={pendingBookings.length > 0 ? 'gold' : undefined}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--adm-text)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>
              Aguardando Aceite
              {pendingBookings.length > 0 && (
                <span style={{ marginLeft: 8, background: 'var(--adm-gold)', color: '#121110', borderRadius: 10, padding: '1px 7px', fontSize: '0.72rem' }}>
                  {pendingBookings.length}
                </span>
              )}
            </div>

            {pendingBookings.length === 0 ? (
              <div style={{ color: 'var(--adm-muted)', fontSize: '0.82rem' }}>Nenhum pedido pendente.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pendingBookings.slice(0, 4).map(b => (
                  <div key={b.id} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 12px', background: 'var(--adm-card)', borderRadius: 8, border: '0.5px solid var(--adm-rule)' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--adm-text)' }}>{b.clientName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>
                      {b.date ? b.date.split('-').reverse().join('/') : ''} às {b.time} · {b.serviceName || b.service?.name}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAcceptBooking(b)}
                      style={{
                        background: 'var(--adm-gold)',
                        color: '#121110',
                        border: 'none',
                        borderRadius: 6,
                        padding: '6px 0',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        fontFamily: 'inherit',
                      }}
                    >
                      <Check size={13} /> Aceitar
                    </button>
                  </div>
                ))}
                {pendingBookings.length > 4 && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--adm-muted)', textAlign: 'center' }}>
                    +{pendingBookings.length - 4} mais na agenda
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Aniversariantes */}
          {birthdays.length > 0 && (
            <Card>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--adm-text)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>
                <Gift size={14} style={{ marginRight: 6, color: 'var(--adm-gold)', verticalAlign: 'middle' }} />
                Aniversariantes Hoje
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {birthdays.slice(0, 5).map(c => (
                  <div key={c.id || c.phone} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', color: 'var(--adm-text)' }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(220,163,84,0.12)', border: '0.5px solid var(--adm-rule-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--adm-gold)', flexShrink: 0 }}>
                      {(c.name || c.clientName || '?')[0].toUpperCase()}
                    </div>
                    <span>{c.name || c.clientName}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Todos agendamentos do dia */}
      {todayBookings.length > 0 && (
        <Card>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--adm-text)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 16 }}>
            Todos os Agendamentos de Hoje — {todayBookings.length} no total
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid var(--adm-rule)' }}>
                  {['Hora', 'Cliente', 'Serviço', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--adm-muted)', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
               <tbody>
                {todayBookings.map(b => (
                  <tr 
                    key={b.id} 
                    onClick={() => setSelectedBooking(b)} 
                    style={{ borderBottom: '0.5px solid var(--adm-rule)', cursor: 'pointer', transition: 'background 0.2s' }}
                    className="hover-row"
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '10px 12px', fontFamily: 'Georgia, serif', fontWeight: 700, color: 'var(--adm-gold)' }}>{b.time}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--adm-text)', fontWeight: 600 }}>{b.clientName}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--adm-text-2)' }}>{b.serviceName || b.service?.name}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: `${statusColor[b.status]}22`, color: statusColor[b.status], textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {statusLabel[b.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {selectedBooking && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(4px)'
        }} onClick={() => setSelectedBooking(null)}>
          <div className="modal-content trinks-modal" style={{
            background: 'var(--adm-card)',
            color: 'var(--adm-text)',
            borderRadius: '12px',
            border: '1px solid var(--adm-rule)',
            padding: '24px',
            maxWidth: '520px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: 'var(--adm-gold)', fontFamily: 'Georgia, serif', fontSize: '1.25rem' }}>Ficha do Agendamento</h3>
              <button 
                className="btn-icon" 
                style={{ background: 'none', border: 'none', color: 'var(--adm-muted)', cursor: 'pointer', padding: 4 }}
                onClick={() => setSelectedBooking(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '0.5px solid var(--adm-rule)', paddingBottom: 8 }}>
                <span style={{ color: 'var(--adm-muted)', fontWeight: 600 }}>Cliente:</span>
                <span style={{ fontWeight: 700 }}>{selectedBooking.clientName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '0.5px solid var(--adm-rule)', paddingBottom: 8 }}>
                <span style={{ color: 'var(--adm-muted)', fontWeight: 600 }}>WhatsApp:</span>
                <span>{selectedBooking.clientPhone || 'Não informado'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '0.5px solid var(--adm-rule)', paddingBottom: 8 }}>
                <span style={{ color: 'var(--adm-muted)', fontWeight: 600 }}>Serviço:</span>
                <span>{selectedBooking.service?.name || selectedBooking.serviceName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '0.5px solid var(--adm-rule)', paddingBottom: 8 }}>
                <span style={{ color: 'var(--adm-muted)', fontWeight: 600 }}>Preço do Serviço:</span>
                <span>R$ {selectedBooking.servicePrice || selectedBooking.service?.price || 150}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '0.5px solid var(--adm-rule)', paddingBottom: 8 }}>
                <span style={{ color: 'var(--adm-muted)', fontWeight: 600 }}>Data/Hora:</span>
                <span>{selectedBooking.date ? selectedBooking.date.split('-').reverse().join('/') : ''} às {selectedBooking.time}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '0.5px solid var(--adm-rule)', paddingBottom: 8 }}>
                <span style={{ color: 'var(--adm-muted)', fontWeight: 600 }}>Status Atual:</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: `${statusColor[selectedBooking.status]}22`, color: statusColor[selectedBooking.status], textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {statusLabel[selectedBooking.status]}
                </span>
              </div>

              {selectedBooking.status === 'finalizado' && (() => {
                const tx = transactions.find(t => t.bookingId === selectedBooking.id);
                return (
                  <div className="comanda-details" style={{ marginTop: 16, padding: 12, border: '1px solid var(--adm-rule)', borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: 'var(--adm-gold)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      💳 Comanda / Financeiro
                    </h4>
                    {tx ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>Método de Pagamento:</span>
                          <span style={{ fontSize: '0.85rem' }}>{tx.paymentMethod}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>Valor Total:</span>
                          <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--adm-gold)' }}>R$ {tx.value?.toFixed(2).replace('.', ',')}</span>
                        </div>
                        
                        <div style={{ marginTop: 8 }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--adm-text)', display: 'block', marginBottom: 4 }}>
                            Produtos Vendidos:
                          </span>
                          {tx.productSales && tx.productSales.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {tx.productSales.map((ps, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '4px 6px', background: 'rgba(255,255,255,0.03)', borderRadius: 4 }}>
                                  <span>{ps.name} (x{ps.quantity})</span>
                                  <span style={{ fontWeight: 600 }}>R$ {(ps.sellingPrice * ps.quantity).toFixed(2).replace('.', ',')}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.78rem', color: 'var(--adm-muted)', fontStyle: 'italic' }}>Nenhum produto vendido registrado.</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.78rem', color: 'var(--adm-muted)', fontStyle: 'italic' }}>
                        Nenhum registro financeiro encontrado para este agendamento.
                      </div>
                    )}
                    
                    {/* Interface para Adicionar Produto */}
                    <div style={{ marginTop: 12, borderTop: '0.5px solid var(--adm-rule)', paddingTop: 10 }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 'bold', color: 'var(--adm-gold)', display: 'block', marginBottom: 6 }}>
                        🛒 Adicionar Produto Vendido
                      </span>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <select
                          id="add-prod-select-hoje"
                          style={{ flex: 1, padding: '6px', borderRadius: 4, background: 'var(--adm-card)', color: 'var(--adm-text)', border: '0.5px solid var(--adm-rule)', fontSize: '0.8rem' }}
                        >
                          <option value="">-- Selecione o Produto --</option>
                          {products.filter(p => p.quantity > 0).map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} (R$ {p.sellingPrice} - Qtd: {p.quantity})
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          id="add-prod-qty-hoje"
                          defaultValue={1}
                          min={1}
                          style={{ width: 50, padding: '6px', borderRadius: 4, background: 'var(--adm-card)', color: 'var(--adm-text)', border: '0.5px solid var(--adm-rule)', fontSize: '0.8rem', textAlign: 'center' }}
                        />
                        <button
                          type="button"
                          className="btn btn-accent"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'var(--adm-gold)', color: '#121110', border: 'none', borderRadius: 4, fontWeight: 700, cursor: 'pointer' }}
                          onClick={async () => {
                            const prodSelect = document.getElementById('add-prod-select-hoje');
                            const qtyInput = document.getElementById('add-prod-qty-hoje');
                            const productId = prodSelect.value;
                            const qty = parseInt(qtyInput.value) || 1;
                            if (!productId) {
                              alert('Por favor, selecione um produto.');
                              return;
                            }
                            
                            const product = products.find(p => p.id === productId);
                            if (!product) return;
                            
                            if (product.quantity < qty) {
                              alert(`Quantidade indisponível em estoque. Estoque atual: ${product.quantity}`);
                              return;
                            }
                            
                            try {
                              if (tx) {
                                const updatedSales = [...(tx.productSales || [])];
                                const existingSaleIdx = updatedSales.findIndex(s => s.productId === productId);
                                if (existingSaleIdx >= 0) {
                                  updatedSales[existingSaleIdx].quantity += qty;
                                } else {
                                  updatedSales.push({
                                    productId: product.id,
                                    name: product.name,
                                    quantity: qty,
                                    sellingPrice: product.sellingPrice,
                                    costPrice: product.costPrice || 0
                                  });
                                }
                                
                                const addedValue = product.sellingPrice * qty;
                                const newValue = tx.value + addedValue;
                                
                                if (isDemoMode || !db) {
                                  const updatedTx = { ...tx, productSales: updatedSales, value: newValue };
                                  const demoTxStr = localStorage.getItem('demo_financial') || '[]';
                                  const demoTx = JSON.parse(demoTxStr).map(t => t.id === tx.id ? updatedTx : t);
                                  localStorage.setItem('demo_financial', JSON.stringify(demoTx));
                                  localStorage.setItem('demo_transactions', JSON.stringify(demoTx));
                                  if (setGlobalData) {
                                    setGlobalData(prev => ({
                                      ...prev,
                                      financial_transactions: demoTx,
                                      products: prev.products.map(p => p.id === productId ? { ...p, quantity: Math.max(0, p.quantity - qty) } : p)
                                    }));
                                  }
                                  const demoProdsStr = localStorage.getItem('demo_products') || '[]';
                                  const demoProds = JSON.parse(demoProdsStr).map(p => p.id === productId ? { ...p, quantity: Math.max(0, p.quantity - qty) } : p);
                                  localStorage.setItem('demo_products', JSON.stringify(demoProds));
                                } else {
                                  await updateDoc(doc(db, 'financial_transactions', tx.id), {
                                    productSales: updatedSales,
                                    value: newValue
                                  });
                                  await updateDoc(doc(db, 'products', productId), {
                                    quantity: Math.max(0, product.quantity - qty)
                                  });
                                }
                              } else {
                                const transactionPayload = {
                                  bookingId: selectedBooking.id,
                                  clientName: selectedBooking.clientName,
                                  clientPhone: selectedBooking.clientPhone || '',
                                  type: 'entrada',
                                  paymentMethod: 'Pix',
                                  value: (selectedBooking.servicePrice || selectedBooking.service?.price || 130) + (product.sellingPrice * qty),
                                  discount: 0,
                                  description: `${selectedBooking.serviceName || selectedBooking.service?.name || 'Serviço'} + ${product.name}`,
                                  professionalId: selectedBooking.professionalId || selectedBooking.profissional || 'jon',
                                  productSales: [{
                                    productId: product.id,
                                    name: product.name,
                                    quantity: qty,
                                    sellingPrice: product.sellingPrice,
                                    costPrice: product.costPrice || 0
                                  }],
                                  createdAt: new Date().toISOString(),
                                  date: selectedBooking.date,
                                  time: selectedBooking.time
                                };
                                
                                if (isDemoMode || !db) {
                                  const newTx = { id: 'tx_' + Date.now(), ...transactionPayload };
                                  const demoTxStr = localStorage.getItem('demo_financial') || '[]';
                                  const demoTx = [newTx, ...JSON.parse(demoTxStr)];
                                  localStorage.setItem('demo_financial', JSON.stringify(demoTx));
                                  localStorage.setItem('demo_transactions', JSON.stringify(demoTx));
                                  if (setGlobalData) {
                                    setGlobalData(prev => ({
                                      ...prev,
                                      financial_transactions: demoTx,
                                      products: prev.products.map(p => p.id === productId ? { ...p, quantity: Math.max(0, p.quantity - qty) } : p)
                                    }));
                                  }
                                  const demoProdsStr = localStorage.getItem('demo_products') || '[]';
                                  const demoProds = JSON.parse(demoProdsStr).map(p => p.id === productId ? { ...p, quantity: Math.max(0, p.quantity - qty) } : p);
                                  localStorage.setItem('demo_products', JSON.stringify(demoProds));
                                } else {
                                  await addDoc(collection(db, 'financial_transactions'), transactionPayload);
                                  await updateDoc(doc(db, 'products', productId), {
                                    quantity: Math.max(0, product.quantity - qty)
                                  });
                                }
                              }
                              alert('Produto adicionado com sucesso e estoque atualizado!');
                              setSelectedBooking(null);
                            } catch (e) {
                              console.error(e);
                              alert('Erro ao atualizar comanda: ' + e.message);
                            }
                          }}
                        >
                          Adicionar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHoje;
