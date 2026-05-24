import React, { useState, useEffect } from 'react';
import { Save, Building, Clock, ShieldCheck, CreditCard, Send, Users, UserPlus, Trash2, Edit } from 'lucide-react';
import { db } from '../../config/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import './Admin.css';

const DEFAULT_SETTINGS = {
  // Estabelecimento
  name: 'Studio do Jon',
  phone: '3135866673',
  address: 'Rua Francisco Ovídio, 184 - Caiçara, Belo Horizonte - MG',
  instagram: 'https://instagram.com/ojonquecortou',
  
  // Taxas de Maquininha
  feePix: 0,
  feeDebit: 1.9,
  feeCredit: 3.5,

  // Horários de Atendimento
  hours: {
    segunda: { active: true, start: '09:00', end: '19:00' },
    terca: { active: true, start: '09:00', end: '19:00' },
    quarta: { active: true, start: '09:00', end: '19:00' },
    quinta: { active: true, start: '09:00', end: '19:00' },
    sexta: { active: true, start: '09:00', end: '19:00' },
    sabado: { active: true, start: '09:00', end: '18:00' },
    domingo: { active: false, start: '09:00', end: '13:00' }
  },

  // Políticas
  minAdvance: '2', // horas
  autoApprove: false,
  waTemplate: 'Olá Jon, gostaria de confirmar meu agendamento de {servico} para o dia {data} às {hora}.',

  // Integração WhatsApp 24h
  waReminderEnabled: true,
  waReminderGateway: 'evolution',
  zApiInstanceId: '',
  zApiToken: '',
  evolutionApiUrl: 'https://evolution-api-production-1e65.up.railway.app',
  evolutionApiKey: 'de173acec677c6da63cf021049ffa7c6c120a82c765b7e540d585a9ea9ced356',
  evolutionInstanceName: 'JonStudio',
  customWebhookUrl: '',
  waReminderTemplate: 'Olá, {cliente}! Passando para lembrar do seu horário amanhã ({data} às {hora}) para o serviço: {servico}. Podemos confirmar? 💇‍♂️✨',
  professionals: [
    { id: 'jon', name: 'Jon', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80', commission: 50, phone: '31995097613', email: 'jon@studio.com', active: true }
  ]
};

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') === 'profissionais' ? 'profissionais' : 'perfil';
  });
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isSaved, setIsSaved] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const [newProf, setNewProf] = useState({
    name: '',
    avatar: '',
    commission: 50,
    phone: '',
    email: '',
    active: true,
    workStart: '09:00',
    workEnd: '19:00',
    lunchStart: '12:00',
    lunchEnd: '13:00',
    daysOff: [0, 1], // default Sunday (0) and Monday (1)
    blockedDates: []
  });
  const [editingProfId, setEditingProfId] = useState(null);

  const handleAddProf = () => {
    if (!newProf.name.trim()) {
      alert('Por favor, informe o nome do profissional.');
      return;
    }
    const id = newProf.name.toLowerCase().trim().replace(/\s+/g, '-');
    const existing = settings.professionals || [];
    if (existing.some(p => p.id === id)) {
      alert('Já existe um profissional cadastrado com este nome.');
      return;
    }
    const profToAdd = {
      ...newProf,
      id: id || `prof-${Date.now()}`,
      avatar: newProf.avatar.trim() || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
      commission: Number(newProf.commission) || 0,
      workStart: newProf.workStart || '09:00',
      workEnd: newProf.workEnd || '19:00',
      lunchStart: newProf.lunchStart || '12:00',
      lunchEnd: newProf.lunchEnd || '13:00',
      daysOff: newProf.daysOff || [0, 1],
      blockedDates: newProf.blockedDates || []
    };
    setSettings(prev => ({
      ...prev,
      professionals: [...(prev.professionals || []), profToAdd]
    }));
    setNewProf({
      name: '',
      avatar: '',
      commission: 50,
      phone: '',
      email: '',
      active: true,
      workStart: '09:00',
      workEnd: '19:00',
      lunchStart: '12:00',
      lunchEnd: '13:00',
      daysOff: [0, 1],
      blockedDates: []
    });
  };

  const handleEditProfStart = (prof) => {
    setEditingProfId(prof.id);
    setNewProf({
      name: prof.name,
      avatar: prof.avatar || '',
      commission: prof.commission,
      phone: prof.phone || '',
      email: prof.email || '',
      active: prof.active ?? true,
      workStart: prof.workStart || '09:00',
      workEnd: prof.workEnd || '19:00',
      lunchStart: prof.lunchStart || '12:00',
      lunchEnd: prof.lunchEnd || '13:00',
      daysOff: prof.daysOff || [0, 1],
      blockedDates: prof.blockedDates || []
    });
  };

  const handleEditProfCancel = () => {
    setEditingProfId(null);
    setNewProf({
      name: '',
      avatar: '',
      commission: 50,
      phone: '',
      email: '',
      active: true,
      workStart: '09:00',
      workEnd: '19:00',
      lunchStart: '12:00',
      lunchEnd: '13:00',
      daysOff: [0, 1],
      blockedDates: []
    });
  };

  const handleUpdateProf = () => {
    if (!newProf.name.trim()) {
      alert('Por favor, informe o nome do profissional.');
      return;
    }
    setSettings(prev => ({
      ...prev,
      professionals: (prev.professionals || []).map(p => 
        p.id === editingProfId 
          ? { ...p, ...newProf, commission: Number(newProf.commission) || 0 } 
          : p
      )
    }));
    handleEditProfCancel();
  };

  const handleDeleteProf = (id) => {
    if (id === 'jon') {
      alert('O profissional principal (Jon) não pode ser removido.');
      return;
    }
    if (window.confirm('Tem certeza que deseja remover este profissional?')) {
      setSettings(prev => ({
        ...prev,
        professionals: (prev.professionals || []).filter(p => p.id !== id)
      }));
    }
  };

  const handleToggleProfActive = (id) => {
    setSettings(prev => ({
      ...prev,
      professionals: (prev.professionals || []).map(p => p.id === id ? { ...p, active: !p.active } : p)
    }));
  };

  useEffect(() => {
    const loadSettings = (savedRaw) => {
      try {
        const parsed = JSON.parse(savedRaw);
        const merged = { ...DEFAULT_SETTINGS };
        Object.keys(parsed).forEach(key => {
          if (parsed[key] !== undefined && parsed[key] !== null && parsed[key] !== '') {
            merged[key] = parsed[key];
          }
        });
        return merged;
      } catch (err) {
        return DEFAULT_SETTINGS;
      }
    };

    if (!db) {
      setIsDemoMode(true);
      const saved = localStorage.getItem('demo_studio_settings');
      if (saved) {
        setSettings(loadSettings(saved));
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
      return;
    }

    const unsub = onSnapshot(doc(db, 'settings', 'studio'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data());
        setIsDemoMode(false);
      } else {
        setDoc(doc(db, 'settings', 'studio'), DEFAULT_SETTINGS);
        setSettings(DEFAULT_SETTINGS);
      }
    }, (error) => {
      console.warn('Erro ao carregar configurações do Firestore, usando local:', error);
      setIsDemoMode(true);
      const saved = localStorage.getItem('demo_studio_settings');
      if (saved) {
        setSettings(loadSettings(saved));
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
    });

    return () => unsub();
  }, []);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    try {
      if (isDemoMode || !db) {
        localStorage.setItem('demo_studio_settings', JSON.stringify(settings));
      } else {
        await setDoc(doc(db, 'settings', 'studio'), settings);
      }
      
      // Salva localmente como redundância
      localStorage.setItem('demo_studio_settings', JSON.stringify(settings));
      window.dispatchEvent(new Event('settingsUpdated'));
      
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar configurações:', err);
      alert('Não foi possível salvar as configurações.');
    }
  };

  const handleHourChange = (day, field, value) => {
    setSettings(prev => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: {
          ...prev.hours[day],
          [field]: value
        }
      }
    }));
  };

  return (
    <div className="admin-settings-page">
      {/* Abas */}
      <div className="tab-menu" style={{ marginBottom: 24 }}>
        <button type="button" className={`tab-btn ${activeTab === 'perfil' ? 'active' : ''}`} onClick={() => setActiveTab('perfil')}>
          <Building size={16} /> Perfil & Taxas
        </button>
        <button type="button" className={`tab-btn ${activeTab === 'horarios' ? 'active' : ''}`} onClick={() => setActiveTab('horarios')}>
          <Clock size={16} /> Horários da Grade
        </button>
        <button type="button" className={`tab-btn ${activeTab === 'politicas' ? 'active' : ''}`} onClick={() => setActiveTab('politicas')}>
          <ShieldCheck size={16} /> Políticas de Agendamento
        </button>
        <button type="button" className={`tab-btn ${activeTab === 'whatsapp' ? 'active' : ''}`} onClick={() => setActiveTab('whatsapp')}>
          <Send size={16} /> Integração WhatsApp
        </button>
        <button type="button" className={`tab-btn ${activeTab === 'profissionais' ? 'active' : ''}`} onClick={() => setActiveTab('profissionais')}>
          <Users size={16} /> Profissionais
        </button>
      </div>

      <form onSubmit={handleSave}>
        {/* CONTEÚDO: PERFIL & TAXAS */}
        {activeTab === 'perfil' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
            {/* Informações básicas */}
            <div className="financial-card">
              <h3>Perfil do Estabelecimento</h3>
              
              <div className="form-group">
                <label>Nome do Salão / Studio</label>
                <input 
                  type="text" 
                  value={settings.name}
                  onChange={e => setSettings({ ...settings, name: e.target.value })}
                />
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                <div className="form-group">
                  <label>WhatsApp de Contato (ex: 3135866673)</label>
                  <input 
                    type="text" 
                    value={settings.phone}
                    onChange={e => setSettings({ ...settings, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Instagram Link</label>
                  <input 
                    type="text" 
                    value={settings.instagram}
                    onChange={e => setSettings({ ...settings, instagram: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 12 }}>
                <label>Endereço Físico Completo</label>
                <input 
                  type="text" 
                  value={settings.address}
                  onChange={e => setSettings({ ...settings, address: e.target.value })}
                />
              </div>
            </div>

            {/* Taxas de Maquininha */}
            <div className="financial-card" style={{ height: 'fit-content' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <CreditCard size={18} style={{ color: 'var(--accent)' }} />
                <h3 style={{ margin: 0 }}>Taxas de Cartão</h3>
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label>Taxa de Pix (%)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={settings.feePix} 
                  onChange={e => setSettings({ ...settings, feePix: Number(e.target.value) })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label>Taxa de Débito (%)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={settings.feeDebit} 
                  onChange={e => setSettings({ ...settings, feeDebit: Number(e.target.value) })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label>Taxa de Crédito à Vista (%)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={settings.feeCredit} 
                  onChange={e => setSettings({ ...settings, feeCredit: Number(e.target.value) })}
                />
              </div>

              <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: 0 }}>
                Essas taxas serão aplicadas automaticamente para deduzir o valor líquido nas entradas financeiras registradas.
              </p>
            </div>
          </div>
        )}

        {/* CONTEÚDO: HORÁRIOS DA GRADE */}
        {activeTab === 'horarios' && (
          <div className="financial-card">
            <h3>Grade Horária Semanal</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 20 }}>
              Defina os dias da semana e os intervalos de horários nos quais a grade do Studio estará ativa para agendamentos.
            </p>

            <div className="hours-settings-list" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Object.keys(settings.hours).map(day => {
                const hourData = settings.hours[day];
                return (
                  <div 
                    key={day} 
                    style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '150px 120px 1fr', 
                      alignItems: 'center', 
                      padding: 12, 
                      background: hourData.active ? 'var(--bg-warm)' : 'none', 
                      borderRadius: 6,
                      border: '1px solid var(--rule)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input 
                        type="checkbox" 
                        id={`check-${day}`}
                        checked={hourData.active}
                        onChange={e => handleHourChange(day, 'active', e.target.checked)}
                      />
                      <label htmlFor={`check-${day}`} style={{ fontWeight: 600, textTransform: 'capitalize', cursor: 'pointer' }}>
                        {day}
                      </label>
                    </div>

                    <div>
                      <span className={`status-badge ${hourData.active ? 'confirmado' : 'cancelado'}`}>
                        {hourData.active ? 'Aberto' : 'Fechado'}
                      </span>
                    </div>

                    {hourData.active ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span>Horário de Funcionamento:</span>
                        <input 
                          type="time" 
                          value={hourData.start} 
                          onChange={e => handleHourChange(day, 'start', e.target.value)}
                          style={{ width: 90, padding: 4 }}
                        />
                        <span>até</span>
                        <input 
                          type="time" 
                          value={hourData.end} 
                          onChange={e => handleHourChange(day, 'end', e.target.value)}
                          style={{ width: 90, padding: 4 }}
                        />
                      </div>
                    ) : (
                      <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Não há atendimento neste dia.</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CONTEÚDO: POLÍTICAS DE AGENDAMENTO */}
        {activeTab === 'politicas' && (
          <div className="financial-card">
            <h3>Políticas de Reservas & Regras</h3>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>Antecedência Mínima para Agendamento do Cliente (em horas)</label>
              <select 
                value={settings.minAdvance} 
                onChange={e => setSettings({ ...settings, minAdvance: e.target.value })}
                style={{ maxWidth: 200 }}
              >
                <option value="1">1 hora</option>
                <option value="2">2 horas</option>
                <option value="4">4 horas</option>
                <option value="12">12 horas</option>
                <option value="24">24 horas (1 dia)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                <input 
                  type="checkbox" 
                  checked={settings.autoApprove}
                  onChange={e => setSettings({ ...settings, autoApprove: e.target.checked })}
                />
                Aprovação automática de novos agendamentos via site
              </label>
              <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginLeft: 22, marginTop: 4 }}>
                Se marcado, os agendamentos feitos por clientes são criados automaticamente como "Confirmado". 
                Caso contrário, entram no status "Pendente" aguardando ação do administrador.
              </p>
            </div>

            <div className="form-group">
              <label>Mensagem Padrão de Envio para WhatsApp</label>
              <textarea 
                rows="3"
                value={settings.waTemplate}
                onChange={e => setSettings({ ...settings, waTemplate: e.target.value })}
                placeholder="Ex: Olá Jon, agendei o serviço..."
                style={{ width: '100%', padding: 10, fontFamily: 'sans-serif', fontSize: '0.9rem', border: '1px solid var(--rule)', borderRadius: 6 }}
              />
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginTop: 4 }}>
                Use as tags mágicas <code>{"{servico}"}</code>, <code>{"{data}"}</code> e <code>{"{hora}"}</code> para preencher os dados dinamicamente.
              </span>
            </div>
          </div>
        )}

        {/* CONTEÚDO: INTEGRAÇÃO WHATSAPP */}
        {activeTab === 'whatsapp' && (
          <div className="financial-card">
            <h3>Disparos Automáticos de Confirmação (24h Antes)</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 20 }}>
              Ative e configure o envio automático de lembretes aos clientes com agendamento para o dia seguinte. A automação ocorre em segundo plano sempre que você ou sua equipe acessam o painel de controle.
            </p>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={settings.waReminderEnabled || false}
                  onChange={e => setSettings({ ...settings, waReminderEnabled: e.target.checked })}
                />
                Ativar envio automático de lembretes (24 horas antes)
              </label>
            </div>

            {settings.waReminderEnabled && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, borderTop: '1px solid var(--rule)', paddingTop: 20 }}>
                <div className="form-group" style={{ maxWidth: 300 }}>
                  <label>Gateway de Disparo WhatsApp</label>
                  <select 
                    value={settings.waReminderGateway || 'zapi'} 
                    onChange={e => setSettings({ ...settings, waReminderGateway: e.target.value })}
                  >
                    <option value="zapi">Z-API (Recomendado)</option>
                    <option value="evolution">Evolution API (Open Source)</option>
                    <option value="custom">Webhook Customizado</option>
                  </select>
                </div>

                {/* Z-API Config */}
                {settings.waReminderGateway === 'zapi' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group">
                      <label>ID da Instância Z-API</label>
                      <input 
                        type="text" 
                        value={settings.zApiInstanceId || ''} 
                        onChange={e => setSettings({ ...settings, zApiInstanceId: e.target.value })}
                        placeholder="Ex: 3C53896564B9A..."
                      />
                    </div>
                    <div className="form-group">
                      <label>Token Z-API</label>
                      <input 
                        type="text" 
                        value={settings.zApiToken || ''} 
                        onChange={e => setSettings({ ...settings, zApiToken: e.target.value })}
                        placeholder="Ex: E4887C815049B..."
                      />
                    </div>
                  </div>
                )}

                {/* Evolution API Config */}
                {settings.waReminderGateway === 'evolution' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="form-group">
                      <label>URL do Servidor Evolution API</label>
                      <input 
                        type="text" 
                        value={settings.evolutionApiUrl || ''} 
                        onChange={e => setSettings({ ...settings, evolutionApiUrl: e.target.value })}
                        placeholder="Ex: https://api.evolution-api.com"
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div className="form-group">
                        <label>Nome da Instância</label>
                        <input 
                          type="text" 
                          value={settings.evolutionInstanceName || ''} 
                          onChange={e => setSettings({ ...settings, evolutionInstanceName: e.target.value })}
                          placeholder="Ex: JonStudio"
                        />
                      </div>
                      <div className="form-group">
                        <label>API Key Global / Instância</label>
                        <input 
                          type="text" 
                          value={settings.evolutionApiKey || ''} 
                          onChange={e => setSettings({ ...settings, evolutionApiKey: e.target.value })}
                          placeholder="Ex: apikey_12345..."
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Custom Webhook Config */}
                {settings.waReminderGateway === 'custom' && (
                  <div className="form-group">
                    <label>URL do Webhook (POST)</label>
                    <input 
                      type="text" 
                      value={settings.customWebhookUrl || ''} 
                      onChange={e => setSettings({ ...settings, customWebhookUrl: e.target.value })}
                      placeholder="Ex: https://n8n.meuservidor.com/webhook/lembrete"
                    />
                    <span style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginTop: 4 }}>
                      Enviaremos uma requisição HTTP POST contendo os campos <code>phone</code>, <code>message</code>, <code>bookingId</code>, <code>clientName</code>, <code>date</code>, <code>time</code> e <code>service</code>.
                    </span>
                  </div>
                )}

                <div className="form-group">
                  <label>Template da Mensagem de Lembrete</label>
                  <textarea 
                    rows="4"
                    value={settings.waReminderTemplate || ''}
                    onChange={e => setSettings({ ...settings, waReminderTemplate: e.target.value })}
                    placeholder="Ex: Olá, {cliente}..."
                    style={{ width: '100%', padding: 10, fontFamily: 'sans-serif', fontSize: '0.9rem', border: '1px solid var(--rule)', borderRadius: 6 }}
                  />
                  <span style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginTop: 4 }}>
                    Use as tags: <code>{"{cliente}"}</code> para o nome do cliente, <code>{"{data}"}</code> para a data formatada por extenso, <code>{"{hora}"}</code> para o horário e <code>{"{servico}"}</code> para o serviço.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CONTEÚDO: PROFISSIONAIS */}
        {activeTab === 'profissionais' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="financial-card">
              <h3>{editingProfId ? `Editar Profissional: ${newProf.name}` : 'Cadastrar Novo Profissional'}</h3>
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 16 }}>
                {editingProfId 
                  ? 'Atualize os dados e comissão deste profissional.' 
                  : 'Adicione um profissional para que ele apareça como coluna na agenda e configure seu e-mail, telefone e comissão.'}
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, alignItems: 'flex-end' }}>
                <div className="form-group">
                  <label>Nome do Profissional *</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Lucas Silva"
                    value={newProf.name}
                    onChange={e => setNewProf({ ...newProf, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Comissão (%) *</label>
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={newProf.commission}
                    onChange={e => setNewProf({ ...newProf, commission: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>WhatsApp / Telefone</label>
                  <input 
                    type="text" 
                    placeholder="Ex: 31999998888"
                    value={newProf.phone}
                    onChange={e => setNewProf({ ...newProf, phone: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginTop: 12, alignItems: 'flex-end' }}>
                <div className="form-group">
                  <label>URL da Foto do Perfil (opcional)</label>
                  <input 
                    type="text" 
                    placeholder="Ex: https://images.unsplash.com/..."
                    value={newProf.avatar}
                    onChange={e => setNewProf({ ...newProf, avatar: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>E-mail</label>
                  <input 
                    type="email" 
                    placeholder="Ex: lucas@email.com"
                    value={newProf.email}
                    onChange={e => setNewProf({ ...newProf, email: e.target.value })}
                  />
                </div>
              </div>

              {/* Novas Configurações de Agenda do Profissional */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginTop: 16 }}>
                <div className="form-group">
                  <label>Início do Expediente</label>
                  <input 
                    type="time"
                    value={newProf.workStart || '09:00'}
                    onChange={e => setNewProf({ ...newProf, workStart: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Fim do Expediente</label>
                  <input 
                    type="time"
                    value={newProf.workEnd || '19:00'}
                    onChange={e => setNewProf({ ...newProf, workEnd: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Início do Almoço</label>
                  <input 
                    type="time"
                    value={newProf.lunchStart || '12:00'}
                    onChange={e => setNewProf({ ...newProf, lunchStart: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Fim do Almoço</label>
                  <input 
                    type="time"
                    value={newProf.lunchEnd || '13:00'}
                    onChange={e => setNewProf({ ...newProf, lunchEnd: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                <div className="form-group">
                  <label>Dias de Folga Semanais</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: 6 }}>
                    {[
                      { label: 'Dom', val: 0 },
                      { label: 'Seg', val: 1 },
                      { label: 'Ter', val: 2 },
                      { label: 'Qua', val: 3 },
                      { label: 'Qui', val: 4 },
                      { label: 'Sex', val: 5 },
                      { label: 'Sáb', val: 6 }
                    ].map(d => {
                      const isChecked = (newProf.daysOff || []).includes(d.val);
                      return (
                        <label key={d.val} style={{ display: 'flex', alignItems: 'center', gap: 4, background: isChecked ? 'var(--accent)' : 'var(--bg-warm)', padding: '6px 10px', borderRadius: 4, fontSize: '0.8rem', cursor: 'pointer', color: isChecked ? '#0a0a0a' : 'inherit', fontWeight: isChecked ? 'bold' : 'normal', border: '1px solid var(--rule)' }}>
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const current = newProf.daysOff || [];
                              const updated = current.includes(d.val)
                                ? current.filter(x => x !== d.val)
                                : [...current, d.val];
                              setNewProf({ ...newProf, daysOff: updated });
                            }}
                            style={{ display: 'none' }}
                          />
                          {d.label}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="form-group">
                  <label>Datas de Folga Específicas (ex: DD/MM/AAAA, separadas por vírgula)</label>
                  <input 
                    type="text"
                    placeholder="Ex: 25/12/2026, 01/01/2027"
                    value={(newProf.blockedDates || []).map(d => {
                      const parts = d.split('-');
                      if (parts.length === 3) return parts[2] + '/' + parts[1] + '/' + parts[0];
                      return d;
                    }).join(', ')}
                    onChange={e => {
                      const val = e.target.value;
                      const dates = val.split(',').map(d => {
                        const clean = d.trim();
                        const parts = clean.split('/');
                        if (parts.length === 3) {
                          return parts[2] + '-' + parts[1].padStart(2, '0') + '-' + parts[0].padStart(2, '0');
                        }
                        return clean;
                      }).filter(d => d.match(/^\d{4}-\d{2}-\d{2}$/));
                      setNewProf({ ...newProf, blockedDates: dates });
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
                {editingProfId ? (
                  <>
                    <button 
                      type="button" 
                      className="btn btn-accent" 
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                      onClick={handleUpdateProf}
                    >
                      <Save size={16} /> Salvar Alterações
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-outline" 
                      style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--rule)', background: 'none', color: 'var(--text)' }}
                      onClick={handleEditProfCancel}
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button 
                    type="button" 
                    className="btn btn-accent" 
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    onClick={handleAddProf}
                  >
                    <UserPlus size={16} /> Adicionar Profissional
                  </button>
                )}
              </div>
            </div>

            <div className="financial-card">
              <h3>Profissionais Cadastrados</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
                {(settings.professionals || []).map(prof => (
                  <div 
                    key={prof.id} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      padding: 16, 
                      background: 'var(--bg-warm)', 
                      borderRadius: 8, 
                      border: '1px solid var(--rule)' 
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <img 
                        src={prof.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'} 
                        alt={prof.name} 
                        style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)' }}
                      />
                      <div>
                        <strong style={{ fontSize: '1rem', display: 'block' }}>{prof.name}</strong>
                        <span style={{ fontSize: '0.82rem', color: 'var(--muted)', display: 'block' }}>
                          Comissão: {prof.commission}% | Contato: {prof.phone || 'Sem telefone'} | E-mail: {prof.email || 'Sem e-mail'}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginTop: 4 }}>
                          Expediente: <strong>{prof.workStart || '09:00'} às {prof.workEnd || '19:00'}</strong> (Almoço: {prof.lunchStart || '12:00'} - {prof.lunchEnd || '13:00'}) | 
                          Folgas: <strong>{prof.daysOff && prof.daysOff.length > 0 ? prof.daysOff.map(d => ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d]).join(', ') : 'Nenhuma'}</strong>
                          {prof.blockedDates && prof.blockedDates.length > 0 && (' | Datas Bloqueadas: ' + prof.blockedDates.map(d => d.split('-').reverse().join('/')).join(', '))}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={prof.active}
                          onChange={() => handleToggleProfActive(prof.id)}
                        />
                        Ativo na agenda
                      </label>

                      <button 
                        type="button" 
                        style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 4 }}
                        onClick={() => handleEditProfStart(prof)}
                        title="Editar profissional"
                      >
                        <Edit size={16} />
                      </button>

                      {prof.id !== 'jon' && (
                        <button 
                          type="button" 
                          style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', padding: 4 }}
                          onClick={() => handleDeleteProf(prof.id)}
                          title="Remover profissional"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Barra de Ação */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16, marginTop: 24 }}>
          {isSaved && <span style={{ color: '#48bb78', fontWeight: 600, fontSize: '0.9rem' }}>Configurações salvas com sucesso!</span>}
          <button type="submit" className="btn btn-accent" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Save size={16} /> Salvar Configurações
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
