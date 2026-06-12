import React, { useState, useMemo, useCallback } from 'react';
import { X, Plus, Minus, Search, CreditCard, Banknote, Smartphone as SmartIcon, DollarSign } from 'lucide-react';

const fmtBRL = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

const PAYMENT_METHODS = [
  { id: 'Pix', label: 'Pix', icon: <SmartIcon size={14} /> },
  { id: 'Dinheiro', label: 'Dinheiro', icon: <Banknote size={14} /> },
  { id: 'Débito', label: 'Débito', icon: <CreditCard size={14} /> },
  { id: 'Crédito', label: 'Crédito', icon: <CreditCard size={14} /> },
  { id: 'Crédito 2x', label: 'Créd. 2x', icon: <CreditCard size={14} /> },
  { id: 'Crédito 3x', label: 'Créd. 3x', icon: <CreditCard size={14} /> },
];

const TIP_OPTIONS = [
  { label: 'Sem gorjeta', value: 0 },
  { label: '5%', value: 5 },
  { label: '10%', value: 10 },
  { label: 'Outro', value: -1 },
];

const getFee = (settings, method) => {
  if (!settings || !method) return 0;
  const m = method.toLowerCase();
  if (m === 'pix') return settings.feePix ?? 0;
  if (m === 'dinheiro') return 0;
  if (m.includes('débito') || m.includes('debito')) return settings.feeDebit ?? 1.4;
  if (m.includes('2x')) return settings.feeCredit2x ?? 4.5;
  if (m.includes('3x')) return settings.feeCredit3x ?? 5.5;
  if (m.includes('créd') || m.includes('cred') || m.includes('credit')) return settings.feeCredit ?? 2.49;
  return 0;
};

const ComandaModal = ({ booking, products = [], services = [], settings = {}, onClose, onConfirm }) => {
  const basePrice = booking?.servicePrice || booking?.service?.price || 0;
  const serviceName = booking?.serviceName || booking?.service?.name || 'Serviço';

  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [tipMode, setTipMode] = useState(0);
  const [customTip, setCustomTip] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [addedProducts, setAddedProducts] = useState([]);
  const [overridePrice, setOverridePrice] = useState('');

  const servicePrice = overridePrice !== '' ? Number(overridePrice) || 0 : basePrice;

  const tipValue = useMemo(() => {
    if (tipMode === 0) return 0;
    if (tipMode === -1) return Number(customTip) || 0;
    return (servicePrice * tipMode) / 100;
  }, [tipMode, customTip, servicePrice]);

  const productTotal = useMemo(
    () => addedProducts.reduce((s, p) => s + p.price * p.qty, 0),
    [addedProducts]
  );

  const subtotal = servicePrice + productTotal + tipValue;
  const feeRate = getFee(settings, paymentMethod);
  const feeAmount = subtotal * (feeRate / 100);
  const netTotal = subtotal - feeAmount;

  const professionalCommissionRate = useMemo(() => {
    const prof = (settings.professionals || []).find(p => p.id === (booking?.profissional || 'jon'));
    return prof?.commission ?? 50;
  }, [settings, booking]);

  const commissionValue = (servicePrice * professionalCommissionRate) / 100;

  const filteredProducts = useMemo(
    () => products.filter(p =>
      p.quantity > 0 &&
      (p.name || '').toLowerCase().includes(productSearch.toLowerCase())
    ).slice(0, 8),
    [products, productSearch]
  );

  const handleAddProduct = useCallback((prod) => {
    setAddedProducts(prev => {
      const existing = prev.find(p => p.productId === prod.id);
      if (existing) {
        return prev.map(p => p.productId === prod.id ? { ...p, qty: p.qty + 1 } : p);
      }
      return [...prev, { productId: prod.id, name: prod.name, price: prod.sellingPrice || prod.price || 0, qty: 1 }];
    });
  }, []);

  const handleQtyChange = useCallback((productId, delta) => {
    setAddedProducts(prev =>
      prev.map(p => p.productId === productId ? { ...p, qty: Math.max(0, p.qty + delta) } : p)
        .filter(p => p.qty > 0)
    );
  }, []);

  const handleConfirm = () => {
    onConfirm({
      paymentMethod,
      tipValue,
      addedProducts,
      overrideBasePrice: overridePrice !== '' ? Number(overridePrice) : null,
      total: subtotal,
      netTotal,
      feeAmount,
    });
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 10000, padding: 16,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: 'var(--adm-surface)', border: '0.5px solid var(--adm-rule-gold)',
        borderRadius: 'var(--adm-radius-lg)', width: '100%', maxWidth: 560,
        maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 16px', borderBottom: '0.5px solid var(--adm-rule)' }}>
          <div>
            <div style={{ fontSize: '1.05rem', fontFamily: 'Georgia, serif', fontWeight: 700, color: 'var(--adm-text)' }}>Fechar Comanda</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--adm-muted)', marginTop: 2 }}>{booking?.clientName} · {booking?.date?.split('-').reverse().join('/')} às {booking?.time}</div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--adm-muted)', cursor: 'pointer', padding: 4, display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Service */}
          <section>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--adm-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>Serviço</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--adm-card)', borderRadius: 'var(--adm-radius-sm)', border: '0.5px solid var(--adm-rule)' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--adm-text)' }}>{serviceName}</span>
              <input
                type="number"
                value={overridePrice !== '' ? overridePrice : basePrice}
                onChange={e => setOverridePrice(e.target.value)}
                style={{ width: 90, textAlign: 'right', background: 'none', border: 'none', fontSize: '1rem', fontWeight: 700, color: 'var(--adm-gold)', outline: 'none', fontFamily: 'Georgia, serif' }}
              />
            </div>
          </section>

          {/* Products */}
          <section>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--adm-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>Produtos (opcional)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--adm-card)', border: '0.5px solid var(--adm-rule)', borderRadius: 'var(--adm-radius-sm)', padding: '8px 12px', marginBottom: 8 }}>
              <Search size={14} style={{ color: 'var(--adm-muted)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Buscar produto..."
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                style={{ border: 'none', background: 'none', outline: 'none', fontSize: '0.85rem', color: 'var(--adm-text)', width: '100%', fontFamily: 'inherit' }}
              />
            </div>
            {productSearch && filteredProducts.length > 0 && (
              <div style={{ border: '0.5px solid var(--adm-rule)', borderRadius: 'var(--adm-radius-sm)', overflow: 'hidden', marginBottom: 8 }}>
                {filteredProducts.map(prod => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => handleAddProduct(prod)}
                    style={{ width: '100%', background: 'var(--adm-card)', border: 'none', borderBottom: '0.5px solid var(--adm-rule)', padding: '9px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--adm-text)', fontSize: '0.83rem' }}
                  >
                    <span>{prod.name}</span>
                    <span style={{ color: 'var(--adm-gold)', fontWeight: 700 }}>{fmtBRL(prod.sellingPrice || prod.price)}</span>
                  </button>
                ))}
              </div>
            )}
            {addedProducts.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {addedProducts.map(p => (
                  <div key={p.productId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--adm-card)', borderRadius: 8, border: '0.5px solid var(--adm-rule)' }}>
                    <span style={{ flex: 1, fontSize: '0.83rem', color: 'var(--adm-text)' }}>{p.name}</span>
                    <span style={{ fontSize: '0.83rem', color: 'var(--adm-muted)' }}>{fmtBRL(p.price)}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button type="button" onClick={() => handleQtyChange(p.productId, -1)} style={{ background: 'var(--adm-card-hover)', border: 'none', color: 'var(--adm-text)', width: 22, height: 22, borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={12} /></button>
                      <span style={{ fontSize: '0.83rem', fontWeight: 700, color: 'var(--adm-text)', minWidth: 16, textAlign: 'center' }}>{p.qty}</span>
                      <button type="button" onClick={() => handleQtyChange(p.productId, 1)} style={{ background: 'var(--adm-card-hover)', border: 'none', color: 'var(--adm-text)', width: 22, height: 22, borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Tip */}
          <section>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--adm-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>Gorjeta</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {TIP_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTipMode(opt.value)}
                  style={{
                    padding: '7px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    background: tipMode === opt.value ? 'rgba(220,163,84,0.15)' : 'var(--adm-card)',
                    color: tipMode === opt.value ? 'var(--adm-gold)' : 'var(--adm-muted)',
                    border: tipMode === opt.value ? '0.5px solid var(--adm-gold)' : '0.5px solid var(--adm-rule)',
                    transition: 'all 0.2s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {tipMode === -1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, padding: '8px 12px', background: 'var(--adm-card)', borderRadius: 8, border: '0.5px solid var(--adm-rule)' }}>
                <span style={{ fontSize: '0.83rem', color: 'var(--adm-muted)' }}>R$</span>
                <input
                  type="number"
                  placeholder="0,00"
                  value={customTip}
                  onChange={e => setCustomTip(e.target.value)}
                  style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: '0.9rem', color: 'var(--adm-text)', fontFamily: 'inherit' }}
                />
              </div>
            )}
          </section>

          {/* Payment Method */}
          <section>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--adm-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>Forma de Pagamento</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    background: paymentMethod === m.id ? 'rgba(220,163,84,0.15)' : 'var(--adm-card)',
                    color: paymentMethod === m.id ? 'var(--adm-gold)' : 'var(--adm-muted)',
                    border: paymentMethod === m.id ? '0.5px solid var(--adm-gold)' : '0.5px solid var(--adm-rule)',
                    transition: 'all 0.2s',
                  }}
                >
                  {m.icon} {m.label}
                  {paymentMethod === m.id && feeRate > 0 && (
                    <span style={{ fontSize: '0.68rem', opacity: 0.7 }}>({feeRate}%)</span>
                  )}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Summary + Footer */}
        <div style={{ padding: '16px 24px 24px', borderTop: '0.5px solid var(--adm-rule)', background: 'var(--adm-card)' }}>
          {/* Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--adm-muted)' }}>
              <span>Serviço</span><span>{fmtBRL(servicePrice)}</span>
            </div>
            {productTotal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--adm-muted)' }}>
                <span>Produtos</span><span>{fmtBRL(productTotal)}</span>
              </div>
            )}
            {tipValue > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--adm-muted)' }}>
                <span>Gorjeta</span><span>{fmtBRL(tipValue)}</span>
              </div>
            )}
            {feeAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--adm-danger)' }}>
                <span>Taxa ({feeRate}%)</span><span>- {fmtBRL(feeAmount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '0.5px solid var(--adm-rule)', fontSize: '1.1rem', fontFamily: 'Georgia, serif', fontWeight: 700, color: 'var(--adm-gold)' }}>
              <span>Total líquido</span><span>{fmtBRL(netTotal)}</span>
            </div>
          </div>

          {/* Commission Info */}
          <div style={{ padding: '8px 12px', background: 'rgba(220,163,84,0.06)', borderRadius: 8, border: '0.5px solid var(--adm-rule)', marginBottom: 14, fontSize: '0.78rem', color: 'var(--adm-muted)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Comissão do profissional ({professionalCommissionRate}%)</span>
            <span style={{ fontWeight: 700, color: 'var(--adm-text-2)' }}>{fmtBRL(commissionValue)}</span>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            style={{
              width: '100%', background: 'var(--adm-gold)', color: '#121110',
              border: 'none', borderRadius: 'var(--adm-radius-sm)', padding: '14px 0',
              fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--adm-gold-deep)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--adm-gold)'; }}
          >
            <DollarSign size={18} /> Receber e Fechar Comanda
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComandaModal;
