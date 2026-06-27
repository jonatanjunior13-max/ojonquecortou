import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { X, Plus, Minus, Search, CreditCard, Banknote, Smartphone as SmartIcon, DollarSign, Trash2 } from 'lucide-react';

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

// Helper to normalize search text by stripping accents, lowercasing, and trimming
const cleanSearchText = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

// Matches product name if all search terms are prefix of at least one word in the product name
const matchSearchText = (productName, searchText) => {
  if (!productName || !searchText) return false;
  const searchTerms = cleanSearchText(searchText).split(/\s+/).filter(Boolean);
  if (searchTerms.length === 0) return false;
  
  const productWords = cleanSearchText(productName).split(/\s+/).filter(Boolean);
  
  return searchTerms.every(term => 
    productWords.some(word => word.startsWith(term))
  );
};

const ComandaModal = ({ booking, products = [], salonProducts = [], services = [], settings = {}, onClose, onConfirm }) => {
  const serviceName = booking?.serviceName || booking?.service?.name || 'Serviço';
  const matchedService = services.find(s => 
    s.id === booking?.serviceId || 
    s.id === booking?.service?.id || 
    s.name?.toLowerCase() === serviceName?.toLowerCase()
  );
  const basePrice = matchedService?.promoPrice
    ?? (booking?.servicePrice != null && booking?.servicePrice !== '' ? Number(booking.servicePrice) : null)
    ?? booking?.service?.price
    ?? matchedService?.price
    ?? 0;
  const prepay = booking?.prepayment ? Number(booking.prepayment) : 0;

  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [tipMode, setTipMode] = useState(0);
  const [customTip, setCustomTip] = useState('');
  const [saleProductSearch, setSaleProductSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [usedProductSearch, setUsedProductSearch] = useState('');
  const [saleProducts, setSaleProducts] = useState([]);
  const [addedServices, setAddedServices] = useState([]);
  const [usedProducts, setUsedProducts] = useState([]);
  const [extraCost, setExtraCost] = useState('');
  const [discount, setDiscount] = useState(0);
  const [overridePrice, setOverridePrice] = useState(basePrice);

  // Sync overridePrice when the booking changes (e.g. different booking opened without unmounting)
  useEffect(() => {
    setOverridePrice(basePrice);
  }, [booking?.id]);
  const [requestReview, setRequestReview] = useState(false);

  // Extract all supplies registered for this service
  const serviceSupplies = useMemo(() => {
    if (!matchedService || !salonProducts || salonProducts.length === 0) return [];
    const matchedSupplies = [];
    salonProducts.forEach(p => {
      if (p.usedIn && p.usedIn.length > 0) {
        const match = p.usedIn.find(ui => 
          (matchedService.id && ui.serviceId === matchedService.id) || 
          (ui.serviceName && ui.serviceName.toLowerCase() === matchedService.name?.toLowerCase())
        );
        if (match) {
          const portionAmount = Number(match.amount) || 0;
          const pricePerUnit = p.pricePerUnit || (p.volumetry > 0 ? p.costPrice / p.volumetry : 0);
          const calculatedCost = Number((pricePerUnit * portionAmount).toFixed(2)) || p.costPrice || 0;
          
          matchedSupplies.push({
            productId: p.id,
            name: p.name,
            basePrice: p.costPrice || p.price || 0,
            totalVolumetry: p.volumetry || 0,
            usedVolumetry: portionAmount,
            unit: p.unit || 'g',
            price: calculatedCost,
            qty: p.volumetry > 0 ? Number((portionAmount / p.volumetry).toFixed(4)) : 1,
            isDefault: true
          });
        }
      }
    });
    return matchedSupplies;
  }, [matchedService, salonProducts]);

  // Auto-populate usedProducts (insumos) default for this service (Shampoo, Condicionador, Finalizador, Oleo)
  useEffect(() => {
    const defaultUsed = serviceSupplies.filter(supply => {
      const ln = supply.name.toLowerCase();
      return ln.includes('shampoo') || ln.includes('condicionador') || ln.includes('finalizador') || ln.includes('oleo') || ln.includes('óleo');
    });
    setUsedProducts(defaultUsed);
  }, [serviceSupplies]);

  // Split payment states
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [splitValues, setSplitValues] = useState({
    'Pix': 0,
    'Dinheiro': 0,
    'Débito': 0,
    'Crédito': 0,
    'Crédito 2x': 0,
    'Crédito 3x': 0,
  });

  const servicePrice = (overridePrice !== '' && overridePrice !== null && overridePrice !== undefined)
    ? (Number(overridePrice) || 0)
    : (Number(basePrice) || 0);

  const tipValue = useMemo(() => {
    if (tipMode === 0) return 0;
    if (tipMode === -1) return Number(customTip) || 0;
    return (servicePrice * tipMode) / 100;
  }, [tipMode, customTip, servicePrice]);

  const extraServicesTotal = useMemo(
    () => addedServices.reduce((s, x) => s + x.price * x.qty, 0),
    [addedServices]
  );

  const saleProductsTotal = useMemo(
    () => saleProducts.reduce((s, p) => s + p.price * p.qty, 0),
    [saleProducts]
  );

  const usedProductsTotal = useMemo(
    () => usedProducts.reduce((s, p) => s + p.price, 0),
    [usedProducts]
  );

  const subtotal = servicePrice + extraServicesTotal + tipValue + saleProductsTotal;
  const valorTotal = Math.max(0, subtotal - discount);
  const totalToPay = Math.max(0, valorTotal - prepay);

  const feeRate = useMemo(() => {
    return getFee(settings, paymentMethod);
  }, [settings, paymentMethod]);

  const feeAmount = useMemo(() => {
    if (isSplitPayment) {
      return Object.entries(splitValues).reduce((sum, [method, val]) => {
        const rate = getFee(settings, method);
        return sum + (val * (rate / 100));
      }, 0);
    }
    return totalToPay * (feeRate / 100);
  }, [isSplitPayment, splitValues, feeRate, totalToPay]);

  const netTotal = totalToPay - feeAmount;

  const professionalCommissionRate = useMemo(() => {
    const prof = (settings.professionals || []).find(p => p.id === (booking?.profissional || 'jon'));
    return prof?.commission ?? 50;
  }, [settings, booking]);

  const totalServicesPrice = servicePrice + extraServicesTotal;
  const commissionValue = (totalServicesPrice * professionalCommissionRate) / 100;

  const filteredProducts = useMemo(() => {
    if (saleProductSearch.trim().length < 3) return [];
    return products.filter(p =>
      matchSearchText(p.name, saleProductSearch)
    ).slice(0, 5);
  }, [products, saleProductSearch]);

  const filteredUsedProducts = useMemo(() => {
    if (usedProductSearch.trim().length < 3) return [];
    return salonProducts.filter(p =>
      (p.name || '').toLowerCase().includes(usedProductSearch.toLowerCase())
    ).slice(0, 5);
  }, [salonProducts, usedProductSearch]);

  const filteredServices = useMemo(() => {
    if (serviceSearch.trim().length < 3) return [];
    return services.filter(s =>
      (s.name || '').toLowerCase().includes(serviceSearch.toLowerCase())
    ).slice(0, 5);
  }, [services, serviceSearch]);

  const handleAddSaleProduct = useCallback((prod) => {
    setSaleProducts(prev => {
      const existing = prev.find(p => p.productId === prod.id);
      if (existing) {
        return prev.map(p => p.productId === prod.id ? { ...p, qty: p.qty + 1 } : p);
      }
      return [...prev, {
        productId: prod.id,
        name: prod.name,
        price: prod.sellingPrice || prod.price || 0,
        qty: 1
      }];
    });
    setSaleProductSearch('');
  }, []);

  const handleSaleQtyChange = useCallback((productId, delta) => {
    setSaleProducts(prev =>
      prev.map(p => p.productId === productId ? { ...p, qty: Math.max(0, p.qty + delta) } : p)
        .filter(p => p.qty > 0)
    );
  }, []);

  const handleAddUsedProduct = useCallback((prod) => {
    setUsedProducts(prev => {
      const existing = prev.find(p => p.productId === prod.id);
      if (existing) {
        return prev;
      }
      const totalVol = Number(prod.volumetry) || 0;
      const basePr = Number(prod.costPrice || prod.price || 0);
      const unit = prod.unit || 'g';
      
      const initialUsed = totalVol > 0 ? Math.min(10, totalVol) : 1;
      const calculatedCost = totalVol > 0 ? (initialUsed / totalVol) * basePr : basePr;
      
      return [...prev, {
        productId: prod.id,
        name: prod.name,
        basePrice: basePr,
        totalVolumetry: totalVol,
        usedVolumetry: initialUsed,
        unit: unit,
        price: Number(calculatedCost.toFixed(2)),
        qty: totalVol > 0 ? Number((initialUsed / totalVol).toFixed(4)) : 1
      }];
    });
    setUsedProductSearch('');
  }, []);

  const handleUsedVolumetryChange = useCallback((productId, val) => {
    setUsedProducts(prev =>
      prev.map(p => {
        if (p.productId !== productId) return p;
        
        const usedVol = Math.max(0, val);
        const calculatedCost = p.totalVolumetry > 0 
          ? (usedVol / p.totalVolumetry) * p.basePrice 
          : usedVol * p.basePrice;
          
        return {
          ...p,
          usedVolumetry: usedVol,
          price: Number(calculatedCost.toFixed(2)),
          qty: p.totalVolumetry > 0 ? Number((usedVol / p.totalVolumetry).toFixed(4)) : usedVol
        };
      })
    );
  }, []);

  const handleAddService = useCallback((svc) => {
    setAddedServices(prev => {
      const existing = prev.find(s => s.serviceId === svc.id);
      if (existing) {
        return prev.map(s => s.serviceId === svc.id ? { ...s, qty: s.qty + 1 } : s);
      }
      return [...prev, { serviceId: svc.id, name: svc.name, price: svc.promoPrice || svc.price || 0, qty: 1 }];
    });
    setServiceSearch('');
  }, []);

  const handleServiceQtyChange = useCallback((serviceId, delta) => {
    setAddedServices(prev =>
      prev.map(s => s.serviceId === serviceId ? { ...s, qty: Math.max(0, s.qty + delta) } : s)
        .filter(s => s.qty > 0)
    );
  }, []);

  const handleConfirm = () => {
    let finalMethodLabel = '';
    let splitPaymentsList = [];

    if (isSplitPayment) {
      const activeSplits = Object.entries(splitValues).filter(([_, val]) => val > 0);
      finalMethodLabel = activeSplits.map(([method, val]) => `${method}: ${fmtBRL(val)}`).join(' + ');
      splitPaymentsList = activeSplits.map(([method, val]) => ({
        method,
        value: val
      }));
    } else {
      finalMethodLabel = paymentMethod;
    }

    onConfirm({
      paymentMethod: finalMethodLabel,
      splitPayments: splitPaymentsList,
      tipValue,
      addedProducts: saleProducts.map(p => ({
        productId: p.productId,
        name: p.name,
        price: p.price,
        qty: p.qty,
        quantity: p.qty
      })),
      addedServices,
      usedProducts,
      extraCost: 0,
      discount,
      overrideBasePrice: overridePrice !== '' ? Number(overridePrice) : null,
      total: totalToPay,
      netTotal: netTotal,
      feeAmount,
      requestReview,
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
        maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
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

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', flex: 1 }}>
          {/* Service */}
          <section>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--adm-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>Serviço</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--adm-card)', borderRadius: 'var(--adm-radius-sm)', border: '0.5px solid var(--adm-rule)' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--adm-text)' }}>{serviceName}</span>
              <input
                type="number"
                value={overridePrice !== null && overridePrice !== undefined ? overridePrice : ''}
                onChange={e => setOverridePrice(e.target.value)}
                style={{ width: 90, textAlign: 'right', background: 'none', border: 'none', fontSize: '1rem', fontWeight: 700, color: 'var(--adm-gold)', outline: 'none', fontFamily: 'Georgia, serif' }}
              />
            </div>
          </section>

          {/* Payment Method & Split (Moved up to prevent scrolling to see it) */}
          <section style={{ border: '0.5px solid var(--adm-rule)', borderRadius: 'var(--adm-radius-sm)', padding: 14, background: 'rgba(255,255,255,0.01)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--adm-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Forma de Pagamento</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input 
                  type="checkbox" 
                  id="comanda-split-payment"
                  checked={isSplitPayment} 
                  onChange={e => {
                    const checked = e.target.checked;
                    setIsSplitPayment(checked);
                    if (checked) {
                      setSplitValues({
                        'Pix': paymentMethod === 'Pix' ? totalToPay : 0,
                        'Dinheiro': paymentMethod === 'Dinheiro' ? totalToPay : 0,
                        'Débito': paymentMethod === 'Débito' ? totalToPay : 0,
                        'Crédito': paymentMethod === 'Crédito' ? totalToPay : 0,
                        'Crédito 2x': paymentMethod === 'Crédito 2x' ? totalToPay : 0,
                        'Crédito 3x': paymentMethod === 'Crédito 3x' ? totalToPay : 0,
                      });
                    }
                  }}
                  style={{ width: 14, height: 14, accentColor: 'var(--adm-gold)', cursor: 'pointer' }}
                />
                <label htmlFor="comanda-split-payment" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--adm-muted)', cursor: 'pointer' }}>
                  Dividir?
                </label>
              </div>
            </div>
            
            {isSplitPayment ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--adm-card)', padding: 12, borderRadius: 'var(--adm-radius-sm)', border: '0.5px solid var(--adm-rule)' }}>
                {PAYMENT_METHODS.map(m => {
                  const val = splitValues[m.id] || 0;
                  const rate = getFee(settings, m.id);
                  return (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '0.5px solid var(--adm-rule)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {m.icon}
                        <span style={{ fontSize: '0.8rem', color: 'var(--adm-text)', fontWeight: 600 }}>{m.label}</span>
                        {rate > 0 && <span style={{ fontSize: '0.65rem', color: 'var(--adm-muted)' }}>({rate}%)</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--adm-muted)' }}>R$</span>
                        <input 
                          type="number" 
                          min="0"
                          placeholder="0,00"
                          value={val || ''} 
                          onChange={e => {
                            const num = Number(e.target.value) || 0;
                            setSplitValues(prev => ({ ...prev, [m.id]: num }));
                          }}
                          style={{ width: 85, padding: '4px 6px', background: 'var(--adm-surface)', border: '0.5px solid var(--adm-rule)', borderRadius: 'var(--adm-radius-sm)', fontSize: '0.82rem', color: 'var(--adm-text)', textAlign: 'right', outline: 'none', fontFamily: 'inherit' }}
                        />
                      </div>
                    </div>
                  );
                })}
                
                {/* Balance validation */}
                {(() => {
                  const distributedTotal = Object.values(splitValues).reduce((a, b) => a + b, 0);
                  const diff = totalToPay - distributedTotal;
                  if (Math.abs(diff) < 0.01) {
                    return <div style={{ fontSize: '0.75rem', color: '#48bb78', fontWeight: 600, textAlign: 'center' }}>✓ Total distribuído corretamente.</div>;
                  } else if (diff > 0) {
                    return <div style={{ fontSize: '0.75rem', color: 'var(--adm-gold)', fontWeight: 600, textAlign: 'center' }}>Falta: {fmtBRL(diff)}</div>;
                  } else {
                    return <div style={{ fontSize: '0.75rem', color: 'var(--adm-danger)', fontWeight: 600, textAlign: 'center' }}>Excesso: {fmtBRL(Math.abs(diff))}</div>;
                  }
                })()}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {PAYMENT_METHODS.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '6px 10px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      background: paymentMethod === m.id ? 'rgba(220,163,84,0.15)' : 'var(--adm-card)',
                      color: paymentMethod === m.id ? 'var(--adm-gold)' : 'var(--adm-muted)',
                      border: paymentMethod === m.id ? '0.5px solid var(--adm-gold)' : '0.5px solid var(--adm-rule)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {m.icon} {m.label}
                    {paymentMethod === m.id && feeRate > 0 && (
                      <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>({feeRate}%)</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Add Services */}
          <section>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--adm-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>Adicionar Serviços Extras</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--adm-card)', border: '0.5px solid var(--adm-rule)', borderRadius: 'var(--adm-radius-sm)', padding: '8px 12px', marginBottom: 6 }}>
              <Search size={14} style={{ color: 'var(--adm-muted)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Buscar serviço (mín. 3 letras)..."
                value={serviceSearch}
                onChange={e => setServiceSearch(e.target.value)}
                style={{ border: 'none', background: 'none', outline: 'none', fontSize: '0.85rem', color: 'var(--adm-text)', width: '100%', fontFamily: 'inherit' }}
              />
            </div>
            {serviceSearch.trim().length >= 3 && filteredServices.length > 0 && (
              <div style={{ border: '0.5px solid var(--adm-rule)', borderRadius: 'var(--adm-radius-sm)', overflow: 'hidden', marginBottom: 6 }}>
                {filteredServices.map(svc => (
                  <button
                    key={svc.id}
                    type="button"
                    onClick={() => handleAddService(svc)}
                    style={{ width: '100%', background: 'var(--adm-card)', border: 'none', borderBottom: '0.5px solid var(--adm-rule)', padding: '9px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--adm-text)', fontSize: '0.83rem' }}
                  >
                    <span>{svc.name}</span>
                    <span style={{ color: 'var(--adm-gold)', fontWeight: 700 }}>{fmtBRL(svc.promoPrice || svc.price)}</span>
                  </button>
                ))}
              </div>
            )}
            {addedServices.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {addedServices.map(s => (
                  <div key={s.serviceId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--adm-card)', borderRadius: 8, border: '0.5px solid var(--adm-rule)' }}>
                    <span style={{ flex: 1, fontSize: '0.83rem', color: 'var(--adm-text)' }}>{s.name}</span>
                    <span style={{ fontSize: '0.83rem', color: 'var(--adm-muted)' }}>{fmtBRL(s.price)}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button type="button" onClick={() => handleServiceQtyChange(s.serviceId, -1)} style={{ background: 'var(--adm-card-hover)', border: 'none', color: 'var(--adm-text)', width: 22, height: 22, borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={12} /></button>
                      <span style={{ fontSize: '0.83rem', fontWeight: 700, color: 'var(--adm-text)', minWidth: 16, textAlign: 'center' }}>{s.qty}</span>
                      <button type="button" onClick={() => handleServiceQtyChange(s.serviceId, 1)} style={{ background: 'var(--adm-card-hover)', border: 'none', color: 'var(--adm-text)', width: 22, height: 22, borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Venda de Produtos (Revenda) */}
          <section>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--adm-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>Vender Produtos ao Cliente (Revenda)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--adm-card)', border: '0.5px solid var(--adm-rule)', borderRadius: 'var(--adm-radius-sm)', padding: '8px 12px', marginBottom: 6 }}>
              <Search size={14} style={{ color: 'var(--adm-muted)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Buscar produto para venda (mín. 3 letras)..."
                value={saleProductSearch}
                onChange={e => setSaleProductSearch(e.target.value)}
                style={{ border: 'none', background: 'none', outline: 'none', fontSize: '0.85rem', color: 'var(--adm-text)', width: '100%', fontFamily: 'inherit' }}
              />
            </div>
            {saleProductSearch.trim().length >= 3 && filteredProducts.length > 0 && (
              <div style={{ border: '0.5px solid var(--adm-rule)', borderRadius: 'var(--adm-radius-sm)', overflow: 'hidden', marginBottom: 6 }}>
                {filteredProducts.map(prod => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => handleAddSaleProduct(prod)}
                    style={{ width: '100%', background: 'var(--adm-card)', border: 'none', borderBottom: '0.5px solid var(--adm-rule)', padding: '9px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--adm-text)', fontSize: '0.83rem' }}
                  >
                    <span>{prod.name}</span>
                    <span style={{ color: 'var(--adm-gold)', fontWeight: 700 }}>{fmtBRL(prod.sellingPrice || prod.price)}</span>
                  </button>
                ))}
              </div>
            )}
            {saleProducts.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {saleProducts.map(p => (
                  <div key={p.productId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--adm-card)', borderRadius: 8, border: '0.5px solid var(--adm-rule)' }}>
                    <span style={{ flex: 1, fontSize: '0.83rem', color: 'var(--adm-text)' }}>{p.name}</span>
                    <span style={{ fontSize: '0.83rem', color: 'var(--adm-muted)' }}>{fmtBRL(p.price * p.qty)}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button type="button" onClick={() => handleSaleQtyChange(p.productId, -1)} style={{ background: 'var(--adm-card-hover)', border: 'none', color: 'var(--adm-text)', width: 22, height: 22, borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={12} /></button>
                        <span style={{ fontSize: '0.83rem', fontWeight: 700, color: 'var(--adm-text)', minWidth: 16, textAlign: 'center' }}>{p.qty}</span>
                        <button type="button" onClick={() => handleSaleQtyChange(p.productId, 1)} style={{ background: 'var(--adm-card-hover)', border: 'none', color: 'var(--adm-text)', width: 22, height: 22, borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={12} /></button>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setSaleProducts(prev => prev.filter(item => item.productId !== p.productId))}
                        style={{ background: 'none', border: 'none', color: '#c53030', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
                        title="Remover produto"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Produtos Utilizados no Serviço (Uso do Salão) */}
          <section>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--adm-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>Produtos Utilizados no Serviço (Insumos)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--adm-card)', border: '0.5px solid var(--adm-rule)', borderRadius: 'var(--adm-radius-sm)', padding: '8px 12px', marginBottom: 6 }}>
              <Search size={14} style={{ color: 'var(--adm-muted)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Buscar produto de uso do salão (mín. 3 letras)..."
                value={usedProductSearch}
                onChange={e => setUsedProductSearch(e.target.value)}
                style={{ border: 'none', background: 'none', outline: 'none', fontSize: '0.85rem', color: 'var(--adm-text)', width: '100%', fontFamily: 'inherit' }}
              />
            </div>
            {usedProductSearch.trim().length >= 3 && filteredUsedProducts.length > 0 && (
              <div style={{ border: '0.5px solid var(--adm-rule)', borderRadius: 'var(--adm-radius-sm)', overflow: 'hidden', marginBottom: 6 }}>
                {filteredUsedProducts.map(prod => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => handleAddUsedProduct(prod)}
                    style={{ width: '100%', background: 'var(--adm-card)', border: 'none', borderBottom: '0.5px solid var(--adm-rule)', padding: '9px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--adm-text)', fontSize: '0.83rem' }}
                  >
                    <span>{prod.name}</span>
                    <span style={{ color: 'var(--adm-gold)', fontWeight: 700 }}>{fmtBRL(prod.costPrice || prod.price)}</span>
                  </button>
                ))}
              </div>
            )}
            {usedProducts.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {usedProducts.map(p => (
                  <div key={p.productId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--adm-card)', borderRadius: 8, border: '0.5px solid var(--adm-rule)' }}>
                    <span style={{ flex: 1, fontSize: '0.83rem', color: 'var(--adm-text)' }}>{p.name} {p.isDefault ? '(Insumo Fixo)' : ''}</span>
                    <span style={{ fontSize: '0.83rem', color: 'var(--adm-muted)' }}>{fmtBRL(p.price)}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {p.totalVolumetry > 0 ? (
                        <>
                          <input
                            type="number"
                            min="0"
                            placeholder="g/ml"
                            value={p.usedVolumetry || ''}
                            onChange={(e) => handleUsedVolumetryChange(p.productId, parseFloat(e.target.value) || 0)}
                            style={{ width: 65, padding: '4px 6px', background: 'var(--adm-surface)', border: '0.5px solid var(--adm-rule)', borderRadius: 4, fontSize: '0.82rem', color: 'var(--adm-text)', textAlign: 'center', outline: 'none', fontFamily: 'inherit' }}
                          />
                          <span style={{ fontSize: '0.78rem', color: 'var(--adm-muted)' }}>{p.unit}</span>
                        </>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button type="button" onClick={() => handleUsedVolumetryChange(p.productId, Math.max(0, p.usedVolumetry - 1))} style={{ background: 'var(--adm-card-hover)', border: 'none', color: 'var(--adm-text)', width: 22, height: 22, borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={12} /></button>
                          <span style={{ fontSize: '0.83rem', fontWeight: 700, color: 'var(--adm-text)', minWidth: 16, textAlign: 'center' }}>{p.usedVolumetry}</span>
                          <button type="button" onClick={() => handleUsedVolumetryChange(p.productId, p.usedVolumetry + 1)} style={{ background: 'var(--adm-card-hover)', border: 'none', color: 'var(--adm-text)', width: 22, height: 22, borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={12} /></button>
                        </div>
                      )}
                      
                      <button 
                        type="button" 
                        onClick={() => setUsedProducts(prev => prev.filter(item => item.productId !== p.productId))}
                        style={{ background: 'none', border: 'none', color: '#c53030', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
                        title="Remover insumo"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Discount */}
          <section>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--adm-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>Desconto</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--adm-card)', border: '0.5px solid var(--adm-rule)', borderRadius: 'var(--adm-radius-sm)', padding: '8px 12px' }}>
              <span style={{ fontSize: '0.83rem', color: 'var(--adm-muted)' }}>R$</span>
              <input
                type="number"
                placeholder="0,00"
                value={discount || ''}
                onChange={e => setDiscount(Number(e.target.value) || 0)}
                style={{ border: 'none', background: 'none', outline: 'none', fontSize: '0.9rem', color: 'var(--adm-text)', width: '100%', fontFamily: 'inherit' }}
              />
            </div>
          </section>

          {/* Tip */}
          <section>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--adm-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>Gorjeta</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {TIP_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTipMode(opt.value)}
                  style={{
                    padding: '6px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
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
        </div>

        {/* Summary + Footer */}
        <div style={{ padding: '14px 24px 20px', borderTop: '0.5px solid var(--adm-rule)', background: 'var(--adm-card)' }}>
          {/* Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--adm-muted)' }}>
              <span>Serviço Base</span><span>{fmtBRL(servicePrice)}</span>
            </div>
            {addedServices.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--adm-muted)' }}>
                <span>Serviços Extras</span><span>{fmtBRL(extraServicesTotal)}</span>
              </div>
            )}
            {saleProductsTotal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--adm-muted)' }}>
                <span>Produtos (Revenda)</span><span>{fmtBRL(saleProductsTotal)}</span>
              </div>
            )}
            {(usedProductsTotal > 0 || Number(extraCost) > 0) && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--adm-muted)' }}>
                <span>Custo Interno (Insumos)</span><span>{fmtBRL(usedProductsTotal + (Number(extraCost) || 0))}</span>
              </div>
            )}
            {tipValue > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--adm-muted)' }}>
                <span>Gorjeta</span><span>{fmtBRL(tipValue)}</span>
              </div>
            )}
            {discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--adm-danger)' }}>
                <span>Desconto</span><span>- {fmtBRL(discount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, color: 'var(--adm-text)' }}>
              <span>Valor Total (Cliente)</span><span>{fmtBRL(totalToPay)}</span>
            </div>
            {feeAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--adm-danger)' }}>
                <span>Taxa da Maquininha {isSplitPayment ? '' : `(${feeRate}%)`}</span><span>- {fmtBRL(feeAmount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: '0.5px solid var(--adm-rule)', fontSize: '1.05rem', fontFamily: 'Georgia, serif', fontWeight: 700, color: 'var(--adm-gold)' }}>
              <span>Valor Líquido do Fechamento</span><span>{fmtBRL(netTotal)}</span>
            </div>
          </div>

          {/* Commission Info */}
          <div style={{ padding: '6px 10px', background: 'rgba(220,163,84,0.06)', borderRadius: 6, border: '0.5px solid var(--adm-rule)', marginBottom: 10, fontSize: '0.75rem', color: 'var(--adm-muted)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Comissão do profissional ({professionalCommissionRate}%)</span>
            <span style={{ fontWeight: 700, color: 'var(--adm-text-2)' }}>{fmtBRL(commissionValue)}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, marginBottom: 12 }}>
            <input 
              type="checkbox" 
              id="comanda-req-review" 
              checked={requestReview}
              onChange={e => setRequestReview(e.target.checked)}
              style={{ width: 14, height: 14, accentColor: 'var(--adm-gold)', cursor: 'pointer' }}
            />
            <label htmlFor="comanda-req-review" style={{ fontSize: '0.8rem', color: 'var(--adm-text)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              Pedir avaliação no Google por WhatsApp
            </label>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSplitPayment && Math.abs(totalToPay - Object.values(splitValues).reduce((a, b) => a + b, 0)) > 0.01}
            style={{
              width: '100%', background: 'var(--adm-gold)', color: '#121110',
              border: 'none', borderRadius: 'var(--adm-radius-sm)', padding: '12px 0',
              fontSize: '0.9rem', fontWeight: 700, fontFamily: 'inherit',
              transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              opacity: (isSplitPayment && Math.abs(totalToPay - Object.values(splitValues).reduce((a, b) => a + b, 0)) > 0.01) ? 0.5 : 1,
              cursor: (isSplitPayment && Math.abs(totalToPay - Object.values(splitValues).reduce((a, b) => a + b, 0)) > 0.01) ? 'not-allowed' : 'pointer'
            }}
            onMouseEnter={e => { if (!(isSplitPayment && Math.abs(totalToPay - Object.values(splitValues).reduce((a, b) => a + b, 0)) > 0.01)) e.currentTarget.style.background = 'var(--adm-gold-deep)'; }}
            onMouseLeave={e => { if (!(isSplitPayment && Math.abs(totalToPay - Object.values(splitValues).reduce((a, b) => a + b, 0)) > 0.01)) e.currentTarget.style.background = 'var(--adm-gold)'; }}
          >
            <DollarSign size={16} /> Receber {fmtBRL(totalToPay)} e Fechar Comanda
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComandaModal;
