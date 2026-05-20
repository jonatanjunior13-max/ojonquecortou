import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, onSnapshot, doc, setDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { Plus, Trash2, Edit3, Scissors, AlertTriangle } from 'lucide-react';
import './Admin.css';

const SEED_SERVICES = [
  {
    id: 'coloracao-completa',
    name: 'Coloração Completa',
    category: 'Cabelo',
    description: 'Quer uma transformação completa ou renovar a cor dos seus fios? A Coloração Completa é para quem deseja uma coloração total, seja para cobrir os fios brancos ou mudar completamente o tom. Antes de começar, conversamos sobre o tom perfeito para você, e garantimos que a cor escolhida vai realçar o seu estilo, sempre cuidando da saúde dos fios.',
    price: 499,
    priceType: 'A partir de',
    promoPrice: null,
    duration: 120,
    isPrimary: true
  },
  {
    id: 'combo-corte-tratamento-personalizado',
    name: 'Combo - Corte com o Jon + Tratamento personalizado',
    category: 'Cabelo',
    description: 'Cachos precisando de tratamento e um corte novo? Esse pacote inclui uma restauração profunda que devolve a maciez e o brilho, e um corte personalizado, pensado para valorizar os seus cachos. A finalização é sob medida para que seus cachos saiam com definição e brilho.',
    price: 320,
    priceType: 'Fixo',
    promoPrice: 230,
    duration: 60,
    isPrimary: true
  },
  {
    id: 'combo-corte-terapia-trp',
    name: 'Combo Corte com o Jon + Terapia de Reposição Proteica',
    category: 'Cabelo',
    description: 'Um tratamento completo pra quem quer se apaixonar de novo pelo próprio cabelo! O corte valoriza cada cacho e o TRP devolve vida, brilho e força com tecnologia que age na fibra capilar de dentro pra fora. Resultado? Cachos leves, saudáveis e com movimento real. Vem viver essa transformação — seu cabelo vai sentir a diferença desde o primeiro toque! 💫',
    price: 370,
    priceType: 'Fixo',
    promoPrice: 300,
    duration: 60,
    isPrimary: true
  },
  {
    id: 'corte-jon',
    name: 'Corte com o Jon',
    category: 'Cabelo',
    description: 'Nada de cortar os cachos de qualquer jeito! A gente conversa primeiro para entender o que você quer e o que seus cachos precisam. O corte é personalizado, feito para realçar o formato natural dos seus fios, garantindo movimento. Esqueça os cortes genéricos e padronizados. Aqui, cada corte é único, assim como você. Tudo começa com uma entrevista detalhada, onde eu, Jon, descubro tudo sobre o seu estilo de vida, suas preferências e suas necessidades.',
    price: 190,
    priceType: 'Fixo',
    promoPrice: null,
    duration: 60,
    isPrimary: true
  },
  {
    id: 'detox-estimulante',
    name: 'Detox Estimulante',
    category: 'Cabelo',
    description: "Dê um respiro para o seu couro cabeludo com o nosso serviço 'Purifica & Cresce'. Este tratamento esfoliante detox é a solução perfeita para eliminar impurezas, excesso de oleosidade e estimular o crescimento saudável do cabelo. Com a combinação de ingredientes naturais e técnicas especializadas, este tratamento vai revitalizar o seu couro cabeludo, promovendo um ambiente saudável para o crescimento dos seus fios.",
    price: 180,
    priceType: 'Fixo',
    promoPrice: null,
    duration: 60,
    isPrimary: false
  },
  {
    id: 'inside-trp',
    name: 'Inside TRP – Reconstrução Premium',
    category: 'Cabelo',
    description: 'Tratamento proteico premium com a tecnologia Deep Complex pra recuperar fios danificados por química, calor ou processos agressivos. Atua desde o córtex até as cutículas: repara massa perdida, reduz porosidade, evita quebra e sela a fibra. Resultado: cachos mais fortes, elásticos e vibrantes — sem sofrimento.',
    price: 180,
    priceType: 'Fixo',
    promoPrice: null,
    duration: 60,
    isPrimary: false
  },
  {
    id: 'lavar-finalizar',
    name: 'Lavar e Finalizar',
    category: 'Cabelo',
    description: 'Aqui seus cachos recebem a finalização perfeita! A gente conversa sobre o que você quer – definição, volume ou leveza – e faço a finalização sob medida. O resultado são cachos definidos, soltos, com brilho e prontos para arrasar. Tudo pensado para que seus fios fiquem no melhor formato. Importante: NÃO É DEDOLISS',
    price: 100,
    priceType: 'Fixo',
    promoPrice: null,
    duration: 60,
    isPrimary: false
  },
  {
    id: 'luzes-morena-iluminada',
    name: 'Luzes ou Morena Iluminada',
    category: 'Cabelo',
    description: 'Ilumine seus fios sem agredir! Com nossa técnica exclusiva de Mechas Sem Descolorante, você consegue um efeito iluminado e natural, perfeito para quem quer uma transformação suave e saudável. Ideal para cabelos cacheados, ondulados e lisos, garantindo brilho e definição sem danificar a estrutura do fio.',
    price: 699,
    priceType: 'A partir de',
    promoPrice: null,
    duration: 180,
    isPrimary: false
  }
];

const AdminServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);

  // Form states
  const [form, setForm] = useState({
    name: '',
    category: 'Cabelo',
    description: '',
    price: '',
    priceType: 'Fixo',
    promoPrice: '',
    duration: '',
    isPrimary: true
  });

  useEffect(() => {
    if (!db) {
      setIsDemoMode(true);
      const localData = localStorage.getItem('demo_services');
      if (localData) {
        setServices(JSON.parse(localData));
      } else {
        localStorage.setItem('demo_services', JSON.stringify(SEED_SERVICES));
        setServices(SEED_SERVICES);
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const unsubscribe = onSnapshot(collection(db, 'services'), (snapshot) => {
        const list = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        
        if (list.length === 0) {
          // Se o banco estiver vazio, semeia os dados iniciais
          SEED_SERVICES.forEach(async (serv) => {
            await setDoc(doc(db, 'services', serv.id), serv);
          });
        } else {
          setServices(list);
        }
        setLoading(false);
        setIsDemoMode(false);
      }, (error) => {
        console.warn('Erro ao conectar Firestore para serviços, usando Demo local:', error);
        setIsDemoMode(true);
        const localData = localStorage.getItem('demo_services') || JSON.stringify(SEED_SERVICES);
        setServices(JSON.parse(localData));
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn('Erro na conexão do banco para serviços:', err);
      setIsDemoMode(true);
      const localData = localStorage.getItem('demo_services') || JSON.stringify(SEED_SERVICES);
      setServices(JSON.parse(localData));
      setLoading(false);
    }
  }, []);

  const saveLocalServices = (updated) => {
    setServices(updated);
    localStorage.setItem('demo_services', JSON.stringify(updated));
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
      isPrimary: true
    });
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
      isPrimary: service.isPrimary ?? true
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      category: form.category,
      description: form.description,
      price: Number(form.price),
      priceType: form.priceType,
      promoPrice: form.promoPrice ? Number(form.promoPrice) : null,
      duration: Number(form.duration),
      isPrimary: form.isPrimary
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

  const formatDuration = (mins) => {
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remaining = mins % 60;
      return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
    }
    return `${mins} min`;
  };

  return (
    <div className="admin-inventory-page">
      <div className="calendar-controls">
        <div className="nav-buttons">
          <span style={{ fontWeight: 600, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Scissors size={20} /> Grade de Serviços {isDemoMode && <span className="status-badge pendente">Demonstração</span>}
          </span>
        </div>
        <button className="btn btn-accent" onClick={handleOpenCreate}>
          <Plus size={16} style={{ marginRight: 6 }} /> Novo Serviço
        </button>
      </div>

      {loading ? (
        <p>Carregando grade de serviços...</p>
      ) : (
        <div className="inventory-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Serviço</th>
                <th style={{ width: '40%' }}>Descrição</th>
                <th>Preço Padrão</th>
                <th>Preço Promocional</th>
                <th>Duração</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {s.category} • {s.isPrimary ? 'Principal' : 'Secundário'}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    {s.description}
                  </td>
                  <td>
                    {s.priceType === 'A partir de' ? 'A partir de ' : ''}
                    <strong>R$ {s.price.toFixed(2)}</strong>
                  </td>
                  <td>
                    {s.promoPrice ? (
                      <span style={{ color: '#2f855a', fontWeight: 600 }}>
                        R$ {s.promoPrice.toFixed(2)}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>-</span>
                    )}
                  </td>
                  <td>{formatDuration(s.duration)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button className="btn-icon" onClick={() => handleOpenEdit(s)} title="Editar Serviço">
                        <Edit3 size={16} />
                      </button>
                      <button className="btn-icon" style={{ color: '#e53e3e' }} onClick={() => handleDelete(s.id)} title="Excluir Serviço">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Cadastro/Edição */}
      {isModalOpen && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleSubmit} style={{ maxWidth: 650 }}>
            <h3>{editingService ? 'Editar Serviço' : 'Novo Serviço do Salão'}</h3>

            <div className="form-group">
              <label>Nome do Serviço *</label>
              <input 
                type="text" 
                required 
                placeholder="Ex: Corte com o Jon"
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Categoria *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Cabelo"
                  value={form.category}
                  onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Duração (em minutos) *</label>
                <input 
                  type="number" 
                  required
                  min="5"
                  value={form.duration}
                  onChange={e => setForm(prev => ({ ...prev, duration: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Tipo de Preço *</label>
                <select 
                  value={form.priceType}
                  onChange={e => setForm(prev => ({ ...prev, priceType: e.target.value }))}
                >
                  <option value="Fixo">Fixo (Ex: R$ 190)</option>
                  <option value="A partir de">A partir de (Ex: A partir de R$ 499)</option>
                </select>
              </div>

              <div className="form-group">
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

              <div className="form-group">
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

            <div className="form-group">
              <label>Descrição Completa *</label>
              <textarea 
                required
                rows="4"
                placeholder="Insira detalhes do que inclui o serviço, técnicas usadas, etc..."
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
              <input 
                type="checkbox"
                id="isPrimary"
                checked={form.isPrimary}
                onChange={e => setForm(prev => ({ ...prev, isPrimary: e.target.checked }))}
              />
              <label htmlFor="isPrimary" style={{ margin: 0, fontWeight: 500 }}>
                Serviço de Destaque (Aparece no topo da página de agendamentos)
              </label>
            </div>

            <div className="modal-actions" style={{ justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancelar</button>
              <button type="submit" className="btn btn-accent">Salvar Serviço</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminServices;
