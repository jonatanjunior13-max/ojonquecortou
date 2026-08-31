import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { db } from '../../config/firebase';
import { collection, doc, setDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { Plus, Trash2, Edit3, Scissors, AlertTriangle, Clock, Sparkles, Tag, Percent, Layers, HelpCircle, X, Package, ChevronDown } from 'lucide-react';
import './Admin.css';

import { SEED_SERVICES } from '../../data/seedServices';
import { formatCurrencyBRL } from '../../utils/finance';

const normalizeCategory = (cat) => {
  const c = (cat || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  if (c === 'almoco' || c === 'almoço' || c.includes('almoco') || c.includes('almoço')) return 'Almoço';
  // Use word-boundary test so 'cor' doesn't match inside 'corte'
  const hasCor = /\b(cor|coloracao|colora|mechas|luzes|tonaliza)\b/.test(c);
  const hasCorte = /\b(corte|cortes)\b/.test(c);
  const hasTratamento = /\b(tratamento|terapia|cronograma|hidrat)\b/.test(c);
  if (c.includes('misto') || c.includes('combo') || (hasCorte && (hasTratamento || hasCor))) {
    return 'Combo';
  }
  if (hasCorte) return 'Corte';
  if (hasCor) return 'Cor';
  if (c.includes('analise') || c.includes('avaliacao') || c.includes('teste')) return 'Análise';
  if (c.includes('finaliza')) return 'Finalização';
  if (hasTratamento || c.includes('terapia')) return 'Tratamento';
  return 'Corte'; // default fallback
};

const AdminServices = () => {
  const { globalData, setGlobalData } = useOutletContext() || {};
  const services = globalData?.services || [];
  const loading = false; // Layout handles critical loading
  const isDemoMode = !db;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  
  // Catalog View states
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [activeViewTab, setActiveViewTab] = useState('list'); // 'list', 'reorder', or 'packages'

  // Salon products for cost picker
  const salonProducts = globalData?.salon_products || [];

  // Form states
  const [form, setForm] = useState({
    name: '',
    category: 'Corte',
    description: '',
    price: '',
    priceType: 'Fixo',
    promoPrice: '',
    duration: '',
    cost: '',
    isPrimary: true,
    scheduledViaWhatsapp: false,
    position: ''
  });
  // Cost items state (replaces the simple 'cost' field)
  const [costItems, setCostItems] = useState([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [tempAmount, setTempAmount] = useState({});

  // Auto-calculated total cost from selected cost items
  const calculatedCost = useMemo(
    () => costItems.reduce((sum, item) => sum + (Number(item.pricePerUnit) * Number(item.amount)), 0),
    [costItems]
  );

  const packages = globalData?.packages || [];
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [selectedServiceForPackage, setSelectedServiceForPackage] = useState('');
  const [serviceSessionsForPackage, setServiceSessionsForPackage] = useState('4');
  const [packageForm, setPackageForm] = useState({
    name: '',
    description: '',
    price: '',
    services: [] // array of { serviceId, serviceName, sessions }
  });

  const packageFormOriginalTotal = packageForm.services ? packageForm.services.reduce((sum, item) => {
    const sObj = services.find(s => s.id === item.serviceId);
    const price = sObj ? (Number(sObj.price) || 0) : 0;
    return sum + (price * item.sessions);
  }, 0) : 0;

  const saveLocalPackages = (updated) => {
    localStorage.setItem('demo_packages', JSON.stringify(updated));
    if (setGlobalData) {
      setGlobalData(prev => ({ ...prev, packages: updated }));
    }
  };

  const saveLocalServices = (updated) => {
    localStorage.setItem('demo_services', JSON.stringify(updated));
    if (setGlobalData) {
      setGlobalData(prev => ({ ...prev, services: updated }));
    }
  };

  const handleOpenCreatePackage = () => {
    setEditingPackage(null);
    setPackageForm({
      name: '',
      description: '',
      price: '',
      services: []
    });
    setSelectedServiceForPackage('');
    setServiceSessionsForPackage('4');
    setIsPackageModalOpen(true);
  };

  const handleOpenEditPackage = (pkg) => {
    setEditingPackage(pkg);
    setPackageForm({
      name: pkg.name,
      description: pkg.description || '',
      price: pkg.price.toString(),
      services: pkg.services || []
    });
    setSelectedServiceForPackage('');
    setServiceSessionsForPackage('4');
    setIsPackageModalOpen(true);
  };

  const handleAddServiceToPackage = () => {
    if (!selectedServiceForPackage) return;
    const serv = services.find(s => s.id === selectedServiceForPackage);
    if (!serv) return;

    // Check if already in the list
    if (packageForm.services.some(s => s.serviceId === selectedServiceForPackage)) {
      alert('Este serviço já foi adicionado ao pacote.');
      return;
    }

    setPackageForm(prev => ({
      ...prev,
      services: [...prev.services, {
        serviceId: selectedServiceForPackage,
        serviceName: serv.name,
        sessions: Number(serviceSessionsForPackage)
      }]
    }));
    setSelectedServiceForPackage('');
  };

  const handleRemoveServiceFromPackage = (serviceId) => {
    setPackageForm(prev => ({
      ...prev,
      services: prev.services.filter(s => s.serviceId !== serviceId)
    }));
  };

  const handleSubmitPackage = async (e) => {
    e.preventDefault();
    if (packageForm.services.length === 0) {
      alert('Adicione pelo menos um serviço ao pacote.');
      return;
    }

    const payload = {
      name: packageForm.name,
      description: packageForm.description,
      price: Number(packageForm.price),
      services: packageForm.services,
      createdAt: new Date().toISOString()
    };

    try {
      if (editingPackage) {
        if (isDemoMode) {
          const updated = packages.map(p => p.id === editingPackage.id ? { ...p, ...payload } : p);
          saveLocalPackages(updated);
        } else {
          await setDoc(doc(db, 'packages', editingPackage.id), payload, { merge: true });
        }
      } else {
        const id = packageForm.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-pkg';
        if (isDemoMode) {
          const updated = [...packages, { id, ...payload }];
          saveLocalPackages(updated);
        } else {
          await setDoc(doc(db, 'packages', id), payload);
        }
      }
      setIsPackageModalOpen(false);
    } catch (err) {
      console.error('Erro ao salvar pacote:', err);
      alert('Não foi possível salvar o pacote.');
    }
  };

  const handleDeletePackage = async (id) => {
    if (!confirm('Deseja realmente remover este pacote?')) return;
    try {
      if (isDemoMode) {
        const updated = packages.filter(p => p.id !== id);
        saveLocalPackages(updated);
      } else {
        await deleteDoc(doc(db, 'packages', id));
      }
    } catch (err) {
      console.error('Erro ao excluir pacote:', err);
      alert('Erro ao excluir pacote.');
    }
  };



  const handleOpenCreate = () => {
    setEditingService(null);
    setForm({
      name: '',
      category: 'Cabelo',
      description: '',
      price: '',
      priceType: 'Fixo',
      promoPrice: '',
      duration: '60',
      isPrimary: true,
      scheduledViaWhatsapp: false,
      position: services.length.toString()
    });
    setCostItems([]);
    setProductSearchQuery('');
    setShowProductDropdown(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (service) => {
    setEditingService(service);
    setForm({
      name: service.name,
      category: service.category || 'Cabelo',
      description: service.description || '',
      price: service.price.toString(),
      priceType: service.priceType || 'Fixo',
      promoPrice: service.promoPrice ? service.promoPrice.toString() : '',
      duration: service.duration.toString(),
      isPrimary: service.isPrimary ?? true,
      scheduledViaWhatsapp: service.scheduledViaWhatsapp ?? false,
      position: service.position !== undefined ? service.position.toString() : ''
    });
    // Restore cost items from saved data
    setCostItems(service.costItems || []);
    setProductSearchQuery('');
    setShowProductDropdown(false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const totalCost = calculatedCost > 0 ? calculatedCost : 0;
    const payload = {
      name: form.name,
      category: form.category,
      description: form.description,
      price: Number(form.price),
      priceType: form.priceType,
      promoPrice: form.promoPrice ? Number(form.promoPrice) : null,
      duration: Number(form.duration),
      cost: Number(totalCost.toFixed(2)),
      costItems: costItems.map(item => ({
        productId: item.productId,
        name: item.name,
        unit: item.unit || 'g',
        amount: Number(item.amount),
        pricePerUnit: Number(item.pricePerUnit),
        subtotal: Number((item.pricePerUnit * item.amount).toFixed(2))
      })),
      isPrimary: form.isPrimary,
      scheduledViaWhatsapp: !!form.scheduledViaWhatsapp,
      position: form.position !== '' ? Number(form.position) : services.length
    };

    try {
      if (editingService) {
        if (isDemoMode) {
          const updated = services.map(s => s.id === editingService.id ? { ...s, ...payload } : s);
          saveLocalServices(updated);
        } else {
          await setDoc(doc(db, 'services', editingService.id), payload, { merge: true });
        }
      } else {
        const id = form.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        if (isDemoMode) {
          const updated = [...services, { id, ...payload }];
          saveLocalServices(updated);
        } else {
          await setDoc(doc(db, 'services', id), payload);
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Erro ao salvar serviço:', err);
      alert('Não foi possível salvar o serviço.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deseja realmente remover este serviço da grade do salão?')) return;

    try {
      if (isDemoMode) {
        const updated = services.filter(s => s.id !== id);
        saveLocalServices(updated);
      } else {
        await deleteDoc(doc(db, 'services', id));
      }
    } catch (err) {
      console.error('Erro ao excluir serviço:', err);
    }
  };

  const handleMoveService = async (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= services.length) return;

    const updated = [...services];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;

    const finalServices = updated.map((s, idx) => ({ ...s, position: idx }));
    setServices(finalServices);

    if (isDemoMode) {
      localStorage.setItem('demo_services', JSON.stringify(finalServices));
    } else {
      await Promise.all(
        finalServices.map(s =>
          setDoc(doc(db, 'services', s.id), { position: s.position }, { merge: true }).catch(err => {
            console.error('Erro ao atualizar posição do serviço:', err);
          })
        )
      );
    }
  };

  const formatDuration = (mins) => {
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remaining = mins % 60;
      return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
    }
    return `${mins} min`;
  };

  const toggleDescription = (id) => {
    setExpandedDescriptions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Get unique categories list dynamically
  const categoriesList = ['Todos', ...Array.from(new Set(services.map(s => s.category || 'Cabelo')))];

  // Filter services by category
  const filteredServices = selectedCategory === 'Todos'
    ? services
    : services.filter(s => (s.category || 'Cabelo') === selectedCategory);

  return (
    <div className="admin-inventory-page">
      {/* Top Header controls */}
      <div className="services-catalog-header">
        <div className="catalog-title-sec">
          <Scissors size={24} className="scissors-logo-icon" />
          <div>
            <h2>Grade de Serviços</h2>
            <p className="catalog-subtitle">
              Configure os procedimentos, preços e promoções exibidos no agendamento do site.
            </p>
          </div>
          {isDemoMode && <span className="demo-badge-inline" style={{ alignSelf: 'center', margin: '0 0 0 12px' }}>Modo Demo (Offline)</span>}
        </div>
        
        {activeViewTab === 'packages' ? (
          <button className="btn btn-accent btn-add-service" onClick={handleOpenCreatePackage}>
            <Plus size={16} /> Novo Pacote
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="btn btn-outline" 
              onClick={async () => {
                try {
                  const toSeed = SEED_SERVICES.filter(s => !services.some(curr => curr.id === s.id));
                  if (toSeed.length === 0) {
                    alert('Todos os serviços do site já estão sincronizados no CRM!');
                    return;
                  }
                  for (const serv of toSeed) {
                    await setDoc(doc(db, 'services', serv.id), { ...serv, category: normalizeCategory(serv.category) });
                  }
                  alert(`${toSeed.length} novos serviços sincronizados com sucesso no CRM!`);
                } catch (e) {
                  console.error(e);
                  alert('Erro ao sincronizar. Verifique se você está logado no painel.');
                }
              }}
            >
              🔄 Sincronizar Novos Serviços
            </button>
            <button className="btn btn-accent btn-add-service" onClick={handleOpenCreate}>
              <Plus size={16} /> Novo Serviço
            </button>
          </div>
        )}
      </div>

      {/* Subtabs for List vs Order View */}
      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--adm-rule)', marginBottom: '24px', paddingBottom: '8px' }}>
        <button 
          type="button"
          onClick={() => setActiveViewTab('list')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeViewTab === 'list' ? '2px solid var(--adm-gold)' : '2px solid transparent',
            color: activeViewTab === 'list' ? 'var(--adm-text)' : 'var(--adm-muted)',
            fontWeight: 'bold',
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: '0.95rem'
          }}
        >
          Visualizar Catálogo
        </button>
        <button 
          type="button"
          onClick={() => setActiveViewTab('reorder')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeViewTab === 'reorder' ? '2px solid var(--adm-gold)' : '2px solid transparent',
            color: activeViewTab === 'reorder' ? 'var(--adm-text)' : 'var(--adm-muted)',
            fontWeight: 'bold',
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: '0.95rem'
          }}
        >
          Gerenciar Posição (Ordenação)
        </button>
        <button 
          type="button"
          onClick={() => setActiveViewTab('packages')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeViewTab === 'packages' ? '2px solid var(--adm-gold)' : '2px solid transparent',
            color: activeViewTab === 'packages' ? 'var(--adm-text)' : 'var(--adm-muted)',
            fontWeight: 'bold',
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: '0.95rem'
          }}
        >
          Pacotes Promocionais
        </button>
      </div>

      {activeViewTab === 'list' && (
        <>
          {/* Dynamic Category Navigation Tabs */}
          <div className="services-category-tabs">
            {categoriesList.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`category-tab-btn ${selectedCategory === cat ? 'active' : ''}`}
              >
                <Layers size={14} />
                {cat}
                <span className="tab-count-badge">
                  {cat === 'Todos' ? services.length : services.filter(s => (s.category || 'Cabelo') === cat).length}
                </span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="catalog-loading">
              <div className="spinner"></div>
              <p>Carregando catálogo de serviços...</p>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="catalog-empty-state">
              <Scissors size={48} className="empty-icon" />
              <h3>Nenhum serviço cadastrado nesta categoria</h3>
              <p>Você pode adicionar um novo procedimento clicando no botão acima.</p>
              <button className="btn btn-outline" onClick={handleOpenCreate}>Adicionar Serviço</button>
            </div>
          ) : (
            /* Visual Catalog Grid */
            <div className="services-catalog-grid">
              {filteredServices.map((s) => {
                const isPromo = s.promoPrice !== null && s.promoPrice !== undefined && s.promoPrice !== '';
                const isDescExpanded = !!expandedDescriptions[s.id];
                
                return (
                  <div key={s.id} className={`service-catalog-card ${s.isPrimary ? 'featured' : ''} cat-${(s.category || 'cabelo').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`}>
                    {/* Visual Top Bar / Card Header */}
                    <div className="card-top-decoration">
                      <span className="service-category-tag">{s.category || 'Cabelo'}</span>
                      <div className="service-badges-row">
                        {s.isPrimary && (
                          <span className="service-badge highlight">
                            <Sparkles size={11} /> Destaque
                          </span>
                        )}
                        {isPromo && (
                          <span className="service-badge promo">
                            <Percent size={11} /> Oferta
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="service-card-body">
                      <h3 className="service-card-title">{s.name}</h3>
                      
                      <div className="service-duration-info">
                        <Clock size={13} />
                        <span>Duração média: {formatDuration(s.duration)}</span>
                      </div>

                      {s.description && (
                        <div className="service-desc-wrapper">
                          <p className={`service-description ${isDescExpanded ? 'expanded' : 'collapsed'}`}>
                            {s.description}
                          </p>
                          {s.description.length > 120 && (
                            <button 
                              type="button" 
                              className="btn-toggle-desc" 
                              onClick={() => toggleDescription(s.id)}
                            >
                              {isDescExpanded ? 'Ler menos' : 'Ler descrição completa'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card Footer / Pricing & Actions */}
                    <div className="service-card-footer">
                      <div className="service-pricing-area">
                        {isPromo ? (
                          <div className="pricing-split">
                            <span className="pricing-label">Preço Promocional</span>
                            <div className="price-comparison">
                              <span className="price-old-strike">R$ {formatCurrencyBRL(s.price)}</span>
                              <span className="price-new-value">
                                <span className="p-type-prefix">{s.priceType === 'A partir de' ? 'A partir de ' : ''}</span>
                                <strong>R$ {formatCurrencyBRL(s.promoPrice)}</strong>
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="pricing-standard">
                            <span className="pricing-label">Valor do Serviço</span>
                            <span className="price-standard-value">
                              <span className="p-type-prefix">{s.priceType === 'A partir de' ? 'A partir de ' : ''}</span>
                              <strong>R$ {formatCurrencyBRL(s.price)}</strong>
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="service-card-actions">
                        <button 
                          className="action-btn edit" 
                          onClick={() => handleOpenEdit(s)} 
                          title="Editar Serviço"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button 
                          className="action-btn delete" 
                          onClick={() => handleDelete(s.id)} 
                          title="Excluir Serviço"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeViewTab === 'reorder' && (
        <div className="reorder-catalog-container" style={{ background: 'var(--panel-bg)', padding: '24px', borderRadius: '12px', border: '1px solid var(--adm-rule)' }}>
          <h3 style={{ marginBottom: '8px', color: 'var(--adm-text)' }}>Ordenar Grade de Exibição</h3>
          <p style={{ color: 'var(--adm-muted)', marginBottom: '24px', fontSize: '0.9rem' }}>
            Use os botões de subir e descer para organizar a ordem em que os serviços serão listados na página de agendamento do cliente. O serviço no topo será o primeiro exibido.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {services.map((s, index) => (
              <div 
                key={s.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '16px', 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid var(--adm-rule)', 
                  borderRadius: '8px',
                  gap: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(140,80,39,0.1)', color: '#8c5027', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                    {index + 1}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, color: 'var(--adm-text)', fontSize: '0.95rem' }}>{s.name}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--adm-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.category}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleMoveService(index, 'up')}
                    disabled={index === 0}
                    style={{
                      background: 'none',
                      border: '1px solid var(--adm-rule)',
                      color: index === 0 ? 'var(--adm-muted)' : 'var(--adm-text)',
                      borderRadius: '4px',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: index === 0 ? 'not-allowed' : 'pointer',
                      opacity: index === 0 ? 0.3 : 1
                    }}
                    title="Mover para Cima"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveService(index, 'down')}
                    disabled={index === services.length - 1}
                    style={{
                      background: 'none',
                      border: '1px solid var(--adm-rule)',
                      color: index === services.length - 1 ? 'var(--adm-muted)' : 'var(--adm-text)',
                      borderRadius: '4px',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: index === services.length - 1 ? 'not-allowed' : 'pointer',
                      opacity: index === services.length - 1 ? 0.3 : 1
                    }}
                    title="Mover para Baixo"
                  >
                    ▼
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeViewTab === 'packages' && (
        <div className="packages-tab-container">
          {packages.length === 0 ? (
            <div className="catalog-empty-state">
              <Tag size={48} className="empty-icon" />
              <h3>Nenhum pacote cadastrado</h3>
              <p>Cadastre um pacote de serviços promocionais para seus clientes.</p>
              <button className="btn btn-outline" onClick={handleOpenCreatePackage}>Criar Pacote</button>
            </div>
          ) : (
            <div className="services-catalog-grid">
              {packages.map((pkg) => {
                const pkgOriginalTotal = pkg.services ? pkg.services.reduce((sum, item) => {
                  const sObj = services.find(s => s.id === item.serviceId);
                  const price = sObj ? (Number(sObj.price) || 0) : 0;
                  return sum + (price * item.sessions);
                }, 0) : 0;

                return (
                  <div key={pkg.id} className="service-catalog-card featured">
                    <div className="card-top-decoration">
                      <span className="service-category-tag">Pacote</span>
                      <span className="service-badge highlight"><Sparkles size={11} /> Promocional</span>
                    </div>
                    <div className="service-card-body">
                      <h3 className="service-card-title">{pkg.name}</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--adm-muted)', margin: '4px 0 12px' }}>
                        {pkg.description || 'Sem descrição.'}
                      </p>
                      <div className="package-services-list" style={{ background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '6px', fontSize: '0.9rem' }}>
                        <strong style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Itens inclusos:</strong>
                        <ul style={{ paddingLeft: '16px', margin: 0 }}>
                          {pkg.services.map((item, idx) => (
                            <li key={idx} style={{ marginBottom: '4px', color: 'var(--adm-text)' }}>
                              {item.sessions}x {item.serviceName}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="service-card-footer" style={{ borderTop: '1px solid var(--adm-rule)', paddingTop: '12px', marginTop: '12px' }}>
                      <div className="service-pricing-area" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                        <span className="pricing-label">Valor do Combo</span>
                        {pkgOriginalTotal > pkg.price && (
                          <span style={{ fontSize: '0.85rem', textDecoration: 'line-through', color: 'var(--adm-muted)' }}>
                            De R$ {pkgOriginalTotal.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                        <span className="price-standard-value" style={{ color: 'var(--adm-gold)', fontWeight: 'bold' }}>
                          Por R$ {pkg.price.toFixed(2).replace('.', ',')}
                        </span>
                        {pkgOriginalTotal > pkg.price && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--adm-gold)', fontWeight: 'bold' }}>
                            Economia de R$ {(pkgOriginalTotal - pkg.price).toFixed(2).replace('.', ',')}!
                          </span>
                        )}
                      </div>
                    <div className="service-card-actions">
                      <button 
                        className="action-btn edit" 
                        onClick={() => handleOpenEditPackage(pkg)} 
                        title="Editar Pacote"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button 
                        className="action-btn delete" 
                        onClick={() => handleDeletePackage(pkg.id)} 
                        title="Excluir Pacote"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>
      )}

      {/* Modal de Cadastro/Edição de Pacotes */}
      {isPackageModalOpen && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleSubmitPackage} style={{ maxWidth: 650 }}>
            <div className="modal-header-with-icon" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Tag size={20} className="modal-heading-icon" />
                <h3>{editingPackage ? 'Editar Pacote' : 'Novo Pacote Promocional'}</h3>
              </div>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setIsPackageModalOpen(false)}
                aria-label="Fechar"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', cursor: 'pointer', background: 'transparent', border: 'none', color: 'var(--adm-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="form-group-sleek">
              <label>Nome do Pacote *</label>
              <input 
                type="text" 
                required 
                placeholder="Ex: Combo 4x Corte de Cabelo"
                value={packageForm.name}
                onChange={e => setPackageForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="form-row-grid">
              <div className="form-group-sleek">
                <label>Preço Total Promocional (R$) *</label>
                <input 
                  type="number" 
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={packageForm.price}
                  onChange={e => setPackageForm(prev => ({ ...prev, price: e.target.value }))}
                />
              </div>
              
              <div className="form-group-sleek" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--adm-rule)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--adm-muted)' }}>Valor Original Somado:</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', textDecoration: packageFormOriginalTotal > 0 ? 'line-through' : 'none', color: 'var(--adm-text)' }}>
                  R$ {packageFormOriginalTotal.toFixed(2).replace('.', ',')}
                </span>
                {packageFormOriginalTotal > Number(packageForm.price || 0) && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--adm-gold)', fontWeight: 'bold', marginTop: '4px' }}>
                    Economia de R$ {(packageFormOriginalTotal - Number(packageForm.price || 0)).toFixed(2).replace('.', ',')} ({(100 - (Number(packageForm.price || 0) * 100 / packageFormOriginalTotal)).toFixed(0)}% OFF)!
                  </span>
                )}
              </div>
            </div>

            <div className="form-group-sleek">
              <label>Descrição (Opcional)</label>
              <textarea 
                rows="2"
                placeholder="Insira detalhes sobre as regras de uso do pacote..."
                value={packageForm.description}
                onChange={e => setPackageForm(prev => ({ ...prev, description: e.target.value }))}
                style={{ width: '100%' }}
              />
            </div>

            <div className="form-group-sleek" style={{ borderTop: '1px solid var(--adm-rule)', paddingTop: '16px', marginTop: '16px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Adicionar Serviços ao Pacote</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <select 
                  value={selectedServiceForPackage}
                  onChange={e => setSelectedServiceForPackage(e.target.value)}
                  style={{ flexGrow: 1, padding: '8px' }}
                >
                  <option value="">-- Selecione o Serviço --</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (R$ {s.price})</option>
                  ))}
                </select>
                <input 
                  type="number" 
                  min="1"
                  value={serviceSessionsForPackage}
                  onChange={e => setServiceSessionsForPackage(e.target.value)}
                  style={{ width: '70px', padding: '8px' }}
                  placeholder="Qtd"
                />
                <button 
                  type="button" 
                  className="btn btn-accent"
                  style={{ minWidth: '70px' }}
                  onClick={handleAddServiceToPackage}
                >
                  Adicionar
                </button>
              </div>

              {/* Selected services list */}
              <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '8px', border: '1px solid var(--adm-rule)' }}>
                {packageForm.services.length === 0 ? (
                  <span style={{ fontSize: '0.85rem', color: 'var(--adm-muted)' }}>Nenhum serviço adicionado ainda. Adicione pelo menos um.</span>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {packageForm.services.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--adm-rule)' }}>
                        <span style={{ fontSize: '0.9rem', color: 'var(--adm-text)' }}>
                          <strong>{item.sessions}x</strong> {item.serviceName}
                        </span>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveServiceFromPackage(item.serviceId)}
                          style={{ background: 'none', border: 'none', color: 'var(--adm-danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions" style={{ justifyContent: 'flex-end', gap: 12, marginTop: 24, borderTop: '1px solid var(--adm-rule)', paddingTop: '16px' }}>
              <button type="button" className="btn btn-outline" onClick={() => setIsPackageModalOpen(false)}>Cancelar</button>
              <button type="submit" className="btn btn-accent">Salvar Pacote</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal de Cadastro/Edição */}
      {isModalOpen && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleSubmit} style={{ maxWidth: 650 }}>
            <div className="modal-header-with-icon" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Scissors size={20} className="modal-heading-icon" />
                <h3>{editingService ? 'Editar Serviço' : 'Novo Serviço do Salão'}</h3>
              </div>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setIsModalOpen(false)}
                aria-label="Fechar"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', cursor: 'pointer', background: 'transparent', border: 'none', color: 'var(--adm-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="form-group-sleek">
              <label>Nome do Serviço *</label>
              <input 
                type="text" 
                required 
                placeholder="Ex: Corte com o Jon"
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="form-row-grid">
              <div className="form-group-sleek">
                <label>Categoria *</label>
                <select
                  required
                  value={form.category}
                  onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="">Selecione uma categoria</option>
                  <option value="Corte">Corte</option>
                  <option value="Combo">Combo</option>
                  <option value="Tratamento">Tratamento</option>
                  <option value="Cor">Cor</option>
                  <option value="Análise">Análise</option>
                </select>
              </div>

              <div className="form-group-sleek">
                <label>Duração (em minutos) *</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="number" 
                    required
                    min="5"
                    value={form.duration}
                    onChange={e => setForm(prev => ({ ...prev, duration: e.target.value }))}
                    style={{ paddingRight: '48px' }}
                  />
                  <span style={{ position: 'absolute', right: '12px', fontSize: '0.8rem', color: 'var(--adm-muted)', pointerEvents: 'none' }}>
                    min
                  </span>
                </div>
              </div>
            </div>

            <div className="form-three-row-grid">
              <div className="form-group-sleek">
                <label>Tipo de Preço *</label>
                <select 
                  value={form.priceType}
                  onChange={e => setForm(prev => ({ ...prev, priceType: e.target.value }))}
                >
                  <option value="Fixo">Fixo (Ex: R$ 190)</option>
                  <option value="A partir de">A partir de (Ex: A partir de R$ 499)</option>
                </select>
              </div>

              <div className="form-group-sleek">
                <label>Preço Padrão (R$) *</label>
                <input 
                  type="number" 
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.price}
                  onChange={e => setForm(prev => ({ ...prev, price: e.target.value }))}
                />
              </div>

              <div className="form-group-sleek">
                <label>Preço Promocional (Opcional)</label>
                <input 
                  type="number" 
                  min="0"
                  step="0.01"
                  placeholder="Deixar em branco se nenhum"
                  value={form.promoPrice}
                  onChange={e => setForm(prev => ({ ...prev, promoPrice: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-group-sleek" style={{ marginTop: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Package size={14} />
                Produtos Usados no Serviço
              </label>

              {/* Product search input */}
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    placeholder={salonProducts.length === 0 ? 'Nenhum produto de salão cadastrado ainda...' : 'Buscar produto (ex: Creme, Oxidante...)'}
                    value={productSearchQuery}
                    onChange={e => { setProductSearchQuery(e.target.value); setShowProductDropdown(true); }}
                    onFocus={() => setShowProductDropdown(true)}
                    disabled={salonProducts.length === 0}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowProductDropdown(v => !v)}
                    disabled={salonProducts.length === 0}
                    style={{ padding: '0 10px', background: 'var(--adm-rule)', border: '1px solid var(--adm-rule)', borderRadius: 6, cursor: 'pointer', color: 'var(--adm-text-2)' }}
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>

                {/* Dropdown list */}
                {showProductDropdown && salonProducts.length > 0 && (() => {
                  const q = productSearchQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
                  const filtered = salonProducts.filter(p => {
                    const already = costItems.some(ci => ci.productId === p.id);
                    if (already) return false;
                    if (!q) return true;
                    return (p.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q);
                  });
                  if (filtered.length === 0) return null;
                  return (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                      background: 'var(--adm-surface)', border: '1px solid var(--adm-rule)',
                      borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                      maxHeight: 200, overflowY: 'auto', marginTop: 4
                    }}>
                      {filtered.map(p => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setTempAmount(prev => ({ ...prev, [p.id]: '1' }));
                            setCostItems(prev => [...prev, {
                              productId: p.id,
                              name: p.name,
                              unit: p.unit || 'g',
                              amount: 1,
                              pricePerUnit: Number(p.pricePerUnit) || 0
                            }]);
                            setProductSearchQuery('');
                            setShowProductDropdown(false);
                          }}
                          style={{
                            padding: '8px 12px', cursor: 'pointer', display: 'flex',
                            justifyContent: 'space-between', alignItems: 'center',
                            borderBottom: '1px solid var(--adm-rule)', fontSize: '0.82rem',
                            transition: 'background 0.15s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--adm-rule)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <span style={{ fontWeight: 600 }}>{p.name}</span>
                          <span style={{ color: 'var(--adm-text-2)', fontSize: '0.75rem' }}>
                            R${(Number(p.pricePerUnit) || 0).toFixed(3)}/{p.unit || 'g'}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Added products list */}
              {costItems.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {costItems.map((item, idx) => (
                    <div key={item.productId} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      background: 'var(--adm-rule)', borderRadius: 8, padding: '6px 10px',
                      fontSize: '0.8rem'
                    }}>
                      <span style={{ flex: 1, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={item.amount}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          setCostItems(prev => prev.map((ci, i) => i === idx ? { ...ci, amount: val } : ci));
                        }}
                        style={{ width: 64, padding: '3px 6px', textAlign: 'right', fontSize: '0.8rem' }}
                      />
                      <span style={{ color: 'var(--adm-text-2)', minWidth: 24 }}>{item.unit}</span>
                      <span style={{ color: 'var(--adm-gold)', minWidth: 54, textAlign: 'right', fontWeight: 700 }}>
                        R${(item.pricePerUnit * item.amount).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCostItems(prev => prev.filter((_, i) => i !== idx))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--adm-text-2)', padding: 2, lineHeight: 1 }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}

                  {/* Total */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, padding: '6px 10px', borderTop: '1px solid var(--adm-rule)', marginTop: 4 }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--adm-text-2)' }}>Custo total estimado:</span>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--adm-gold)' }}>
                      R$ {calculatedCost.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {costItems.length === 0 && (
                <p style={{ fontSize: '0.75rem', color: 'var(--adm-text-2)', marginTop: 6, marginBottom: 0 }}>
                  Selecione os produtos utilizados para calcular o custo automaticamente.
                </p>
              )}
            </div>

            <div className="form-group-sleek" style={{ marginTop: 12 }}>
              <label>Posição de Exibição no Agendamento</label>
              <input 
                type="number" 
                min="0"
                placeholder="Ex: 0 (Primeiro da lista)"
                value={form.position}
                onChange={e => setForm(prev => ({ ...prev, position: e.target.value }))}
              />
            </div>

            <div className="form-group-sleek">
              <label>Descrição Completa *</label>
              <textarea 
                required
                rows="4"
                placeholder="Insira detalhes do que inclui o serviço, técnicas usadas, etc..."
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                style={{ width: '100%' }}
              />
            </div>

            <div className="form-group-sleek-checkbox" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
              <input 
                type="checkbox"
                id="isPrimary"
                checked={form.isPrimary}
                onChange={e => setForm(prev => ({ ...prev, isPrimary: e.target.checked }))}
                style={{ width: 'auto' }}
              />
              <label htmlFor="isPrimary" style={{ margin: 0, fontWeight: 600 }}>
                Serviço de Destaque (Aparece no topo da página de agendamentos)
              </label>
            </div>

            <div className="form-group-sleek-checkbox" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
              <input 
                type="checkbox"
                id="scheduledViaWhatsapp"
                checked={form.scheduledViaWhatsapp || false}
                onChange={e => setForm(prev => ({ ...prev, scheduledViaWhatsapp: e.target.checked }))}
                style={{ width: 'auto' }}
              />
              <label htmlFor="scheduledViaWhatsapp" style={{ margin: 0, fontWeight: 600 }}>
                Agendar via WhatsApp (Exibe botão para chamar no WhatsApp ao invés de agendar online)
              </label>
            </div>

            <div className="modal-actions" style={{ justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancelar</button>
              <button type="submit" className="btn btn-accent">Salvar Serviço</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminServices;
