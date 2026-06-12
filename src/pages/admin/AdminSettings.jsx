import React, { useState, useEffect } from 'react';
import { Save, Building, Clock, ShieldCheck, CreditCard, Send, Users, UserPlus, Trash2, Edit, Calendar } from 'lucide-react';
import { db } from '../../config/firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
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
    { id: 'jon', name: 'Jon', avatar: '/jon-perfil.webp', commissionService: 50, commissionProduct: 10, phone: '31995097613', email: 'jon@studio.com', active: true }
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
  const [gcalSyncing, setGcalSyncing] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gcalStatus = params.get('gcal_status');
    if (gcalStatus === 'success') {
      alert('Google Agenda conectado com sucesso! 🎉');
      window.history.replaceState({}, document.title, window.location.pathname);
      setActiveTab('google');
    } else if (gcalStatus === 'error') {
      const msg = params.get('msg') || 'Erro desconhecido';
      alert(`Erro ao conectar com o Google Agenda: ${msg} ❌`);
      window.history.replaceState({}, document.title, window.location.pathname);
      setActiveTab('google');
    }
  }, []);

  const [newProf, setNewProf] = useState({
    name: '',
    avatar: '',
    commissionService: 50,
    commissionProduct: 10,
    phone: '',
    email: '',
    active: true,
    workStart: '09:00',
    workEnd: '19:00',
    lunchStart: '12:00',
    lunchEnd: '13:00',
    daysOff: [0, 1], // default Sunday (0) and Monday (1)
    blockedDates: [],
    blockedWeekdayHours: [],
    blockedSpecificHours: []
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
      commissionService: Number(newProf.commissionService) || 0,
      commissionProduct: Number(newProf.commissionProduct) || 0,
      workStart: newProf.workStart || '09:00',
      workEnd: newProf.workEnd || '19:00',
      lunchStart: newProf.lunchStart || '12:00',
      lunchEnd: newProf.lunchEnd || '13:00',
      daysOff: newProf.daysOff || [0, 1],
      blockedDates: newProf.blockedDates || [],
      blockedWeekdayHours: newProf.blockedWeekdayHours || [],
      blockedSpecificHours: newProf.blockedSpecificHours || []
    };
    setSettings(prev => ({
      ...prev,
      professionals: [...(prev.professionals || []), profToAdd]
    }));
    setNewProf({
      name: '',
      avatar: '',
      commissionService: 50,
      commissionProduct: 10,
      phone: '',
      email: '',
      active: true,
      workStart: '09:00',
      workEnd: '19:00',
      lunchStart: '12:00',
      lunchEnd: '13:00',
      daysOff: [0, 1],
      blockedDates: [],
      blockedWeekdayHours: [],
      blockedSpecificHours: []
    });
  };

  const handleEditProfStart = (prof) => {
    setEditingProfId(prof.id);
    setNewProf({
      name: prof.name,
      avatar: prof.avatar || '',
      commissionService: prof.commissionService !== undefined ? prof.commissionService : (prof.commission || 50),
      commissionProduct: prof.commissionProduct !== undefined ? prof.commissionProduct : 10,
      phone: prof.phone || '',
      email: prof.email || '',
      active: prof.active ?? true,
      workStart: prof.workStart || '09:00',
      workEnd: prof.workEnd || '19:00',
      lunchStart: prof.lunchStart || '12:00',
      lunchEnd: prof.lunchEnd || '13:00',
      daysOff: prof.daysOff || [0, 1],
      blockedDates: prof.blockedDates || [],
      blockedWeekdayHours: prof.blockedWeekdayHours || [],
      blockedSpecificHours: prof.blockedSpecificHours || []
    });
  };

  const handleEditProfCancel = () => {
    setEditingProfId(null);
    setNewProf({
      name: '',
      avatar: '',
      commissionService: 50,
      commissionProduct: 10,
      phone: '',
      email: '',
      active: true,
      workStart: '09:00',
      workEnd: '19:00',
      lunchStart: '12:00',
      lunchEnd: '13:00',
      daysOff: [0, 1],
      blockedDates: [],
      blockedWeekdayHours: [],
      blockedSpecificHours: []
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
          ? { 
              ...p, 
              ...newProf, 
              commissionService: Number(newProf.commissionService) || 0,
              commissionProduct: Number(newProf.commissionProduct) || 0
            } 
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
          <Building size={16} /> Perfil
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
        <button type="button" className={`tab-btn ${activeTab === 'google' ? 'active' : ''}`} onClick={() => setActiveTab('google')}>
          <Calendar size={16} /> Google Agenda
        </button>
        <button type="button" className={`tab-btn ${activeTab === 'profissionais' ? 'active' : ''}`} onClick={() => setActiveTab('profissionais')}>
          <Users size={16} /> Profissionais
        </button>
      </div>

      <form onSubmit={handleSave}>
        {/* CONTEÚDO: PERFIL */}
        {activeTab === 'perfil' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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
          </div>
        )}

        {/* CONTEÚDO: HORÁRIOS DA GRADE */}
        {activeTab === 'horarios' && (
          <div className="financial-card">
            <h3>Grade Horária Semanal</h3>
            <p style={{ color: 'var(--adm-muted)', fontSize: '0.85rem', marginBottom: 20 }}>
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
                      background: hourData.active ? 'var(--adm-card)' : 'none', 
                      borderRadius: 6,
                      border: '1px solid var(--adm-rule)'
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
                      <span style={{ color: 'var(--adm-muted)', fontSize: '0.85rem' }}>Não há atendimento neste dia.</span>
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
              <p style={{ color: 'var(--adm-muted)', fontSize: '0.82rem', marginLeft: 22, marginTop: 4 }}>
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
                style={{ width: '100%', padding: 10, fontFamily: 'sans-serif', fontSize: '0.9rem', border: '1px solid var(--adm-rule)', borderRadius: 6 }}
              />
              <span style={{ fontSize: '0.78rem', color: 'var(--adm-muted)', display: 'block', marginTop: 4 }}>
                Use as tags mágicas <code>{"{servico}"}</code>, <code>{"{data}"}</code> e <code>{"{hora}"}</code> para preencher os dados dinamicamente.
              </span>
            </div>
          </div>
        )}

        {/* CONTEÚDO: INTEGRAÇÃO WHATSAPP */}
        {activeTab === 'whatsapp' && (
          <div className="financial-card">
            <h3>Disparos Automáticos de Confirmação (24h Antes)</h3>
            <p style={{ color: 'var(--adm-muted)', fontSize: '0.85rem', marginBottom: 20 }}>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, borderTop: '1px solid var(--adm-rule)', paddingTop: 20 }}>
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
                    <span style={{ fontSize: '0.78rem', color: 'var(--adm-muted)', display: 'block', marginTop: 4 }}>
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
                    style={{ width: '100%', padding: 10, fontFamily: 'sans-serif', fontSize: '0.9rem', border: '1px solid var(--adm-rule)', borderRadius: 6 }}
                  />
                  <span style={{ fontSize: '0.78rem', color: 'var(--adm-muted)', display: 'block', marginTop: 4 }}>
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
              <p style={{ color: 'var(--adm-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
                {editingProfId 
                  ? 'Atualize os dados e comissão deste profissional.' 
                  : 'Adicione um profissional para que ele apareça como coluna na agenda e configure seu e-mail, telefone e comissão.'}
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr', gap: 16, alignItems: 'flex-end' }}>
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
                  <label>Comissão Serv. (%) *</label>
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={newProf.commissionService || 0}
                    onChange={e => setNewProf({ ...newProf, commissionService: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Comissão Prod. (%) *</label>
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={newProf.commissionProduct || 0}
                    onChange={e => setNewProf({ ...newProf, commissionProduct: Number(e.target.value) })}
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
                        <label key={d.val} style={{ display: 'flex', alignItems: 'center', gap: 4, background: isChecked ? 'var(--adm-gold)' : 'var(--adm-card)', padding: '6px 10px', borderRadius: 4, fontSize: '0.8rem', cursor: 'pointer', color: isChecked ? '#0a0a0a' : 'inherit', fontWeight: isChecked ? 'bold' : 'normal', border: '1px solid var(--adm-rule)' }}>
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

              <div style={{ borderTop: '1px dashed var(--adm-rule)', marginTop: 20, paddingTop: 20 }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--adm-gold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Grade de Horários Bloqueados</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {/* Bloqueio Recorrente (Semanal) */}
                  <div className="financial-card" style={{ background: 'rgba(255,255,255,0.01)', padding: 16 }}>
                    <h5 style={{ margin: '0 0 12px 0', fontSize: '0.85rem' }}>Bloqueio Recorrente (Semanal)</h5>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                      <select 
                        id="block-weekday-select"
                        style={{ flex: 1, minWidth: 100, padding: 8, borderRadius: 4, background: 'var(--adm-card)', border: '1px solid var(--adm-rule)' }}
                      >
                        <option value="0">Domingo</option>
                        <option value="1">Segunda</option>
                        <option value="2">Terça</option>
                        <option value="3">Quarta</option>
                        <option value="4">Quinta</option>
                        <option value="5">Sexta</option>
                        <option value="6">Sábado</option>
                      </select>
                      <select 
                        id="block-weekday-start"
                        style={{ flex: 1, minWidth: 80, padding: 8, borderRadius: 4, background: 'var(--adm-card)', border: '1px solid var(--adm-rule)' }}
                      >
                        {['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <span style={{ fontSize: '0.8rem', color: 'var(--adm-muted)', whiteSpace: 'nowrap' }}>até</span>
                      <select 
                        id="block-weekday-end"
                        style={{ flex: 1, minWidth: 80, padding: 8, borderRadius: 4, background: 'var(--adm-card)', border: '1px solid var(--adm-rule)' }}
                      >
                        {['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <button 
                        type="button"
                        className="btn btn-accent"
                        style={{ padding: '8px 12px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                        onClick={() => {
                          const weekday = document.getElementById('block-weekday-select').value;
                          const start = document.getElementById('block-weekday-start').value;
                          const end = document.getElementById('block-weekday-end').value;
                          if (start >= end) { alert('O horário de fim deve ser após o início.'); return; }
                          const blockStr = `${weekday}-${start}-${end}`;
                          const current = newProf.blockedWeekdayHours || [];
                          if (current.includes(blockStr)) { alert('Este bloqueio já existe.'); return; }
                          setNewProf({ ...newProf, blockedWeekdayHours: [...current, blockStr] });
                        }}
                      >
                        Bloquear
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxHeight: 120, overflowY: 'auto' }}>
                      {(newProf.blockedWeekdayHours || []).map(block => {
                        const parts = block.split('-');
                        const weekdayLabel = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][Number(parts[0])];
                        const start = parts[1];
                        const end = parts[2] || parts[1];
                        return (
                          <span 
                            key={block}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--adm-rule)', padding: '4px 8px', borderRadius: 4, fontSize: '0.75rem' }}
                          >
                            {weekdayLabel} {start}{end !== start ? ` – ${end}` : ''}
                            <button 
                              type="button"
                              style={{ border: 'none', background: 'none', color: 'var(--adm-danger)', cursor: 'pointer', padding: 0, fontWeight: 'bold' }}
                              onClick={() => setNewProf({ ...newProf, blockedWeekdayHours: (newProf.blockedWeekdayHours || []).filter(x => x !== block) })}
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                      {(newProf.blockedWeekdayHours || []).length === 0 && (
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--adm-muted)' }}>Nenhum horário recorrente bloqueado.</p>
                      )}
                    </div>
                  </div>

                  {/* Bloqueio Pontual (Data/Hora) */}
                  <div className="financial-card" style={{ background: 'rgba(255,255,255,0.01)', padding: 16 }}>
                    <h5 style={{ margin: '0 0 12px 0', fontSize: '0.85rem' }}>Bloqueio Pontual (Data/Hora)</h5>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                      <input 
                        type="date"
                        id="block-specific-date"
                        style={{ flex: 1.5, minWidth: 130, padding: 8, borderRadius: 4, background: 'var(--adm-card)', border: '1px solid var(--adm-rule)' }}
                      />
                      <select 
                        id="block-specific-start"
                        style={{ flex: 1, minWidth: 80, padding: 8, borderRadius: 4, background: 'var(--adm-card)', border: '1px solid var(--adm-rule)' }}
                      >
                        {['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <span style={{ fontSize: '0.8rem', color: 'var(--adm-muted)', whiteSpace: 'nowrap' }}>até</span>
                      <select 
                        id="block-specific-end"
                        style={{ flex: 1, minWidth: 80, padding: 8, borderRadius: 4, background: 'var(--adm-card)', border: '1px solid var(--adm-rule)' }}
                      >
                        {['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <button 
                        type="button"
                        className="btn btn-accent"
                        style={{ padding: '8px 12px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                        onClick={() => {
                          const dateVal = document.getElementById('block-specific-date').value;
                          const start = document.getElementById('block-specific-start').value;
                          const end = document.getElementById('block-specific-end').value;
                          if (!dateVal) { alert('Selecione uma data para o bloqueio.'); return; }
                          if (start >= end) { alert('O horário de fim deve ser após o início.'); return; }
                          const blockStr = `${dateVal}-${start}-${end}`;
                          const current = newProf.blockedSpecificHours || [];
                          if (current.includes(blockStr)) { alert('Este bloqueio já existe.'); return; }
                          setNewProf({ ...newProf, blockedSpecificHours: [...current, blockStr] });
                        }}
                      >
                        Bloquear
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxHeight: 120, overflowY: 'auto' }}>
                      {(newProf.blockedSpecificHours || []).map(block => {
                        // format: YYYY-MM-DD-HH:MM-HH:MM
                        const datePart = block.substring(0, 10);
                        const rest = block.substring(11); // HH:MM or HH:MM-HH:MM
                        const restParts = rest.split('-');
                        const startT = restParts[0];
                        const endT = restParts[1] || restParts[0];
                        const displayDate = datePart.split('-').reverse().join('/');
                        return (
                          <span 
                            key={block}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--adm-rule)', padding: '4px 8px', borderRadius: 4, fontSize: '0.75rem' }}
                          >
                            {displayDate} {startT}{endT !== startT ? ` – ${endT}` : ''}
                            <button 
                              type="button"
                              style={{ border: 'none', background: 'none', color: 'var(--adm-danger)', cursor: 'pointer', padding: 0, fontWeight: 'bold' }}
                              onClick={() => setNewProf({ ...newProf, blockedSpecificHours: (newProf.blockedSpecificHours || []).filter(x => x !== block) })}
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                      {(newProf.blockedSpecificHours || []).length === 0 && (
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--adm-muted)' }}>Nenhum horário pontual bloqueado.</p>
                      )}
                    </div>
                  </div>
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
                      style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--adm-rule)', background: 'none', color: 'var(--text)' }}
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
                      background: 'var(--adm-card)', 
                      borderRadius: 8, 
                      border: '1px solid var(--adm-rule)' 
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <img 
                        src={prof.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'} 
                        alt={prof.name} 
                        style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--adm-gold)' }}
                      />
                      <div>
                        <strong style={{ fontSize: '1rem', display: 'block' }}>{prof.name}</strong>
                        <span style={{ fontSize: '0.82rem', color: 'var(--adm-muted)', display: 'block' }}>
                          Comissão Serviços: {prof.commissionService !== undefined ? prof.commissionService : (prof.commission || 0)}% | Comissão Produtos: {prof.commissionProduct !== undefined ? prof.commissionProduct : 0}% | Contato: {prof.phone || 'Sem telefone'} | E-mail: {prof.email || 'Sem e-mail'}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--adm-muted)', display: 'block', marginTop: 4 }}>
                          Expediente: <strong>{prof.workStart || '09:00'} às {prof.workEnd || '19:00'}</strong> (Almoço: {prof.lunchStart || '12:00'} - {prof.lunchEnd || '13:00'}) | 
                          Folgas: <strong>{prof.daysOff && prof.daysOff.length > 0 ? prof.daysOff.map(d => ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d]).join(', ') : 'Nenhuma'}</strong>
                          {prof.blockedDates && prof.blockedDates.length > 0 && (' | Datas Bloqueadas: ' + prof.blockedDates.map(d => d.split('-').reverse().join('/')).join(', '))}
                          {(prof.blockedWeekdayHours?.length > 0 || prof.blockedSpecificHours?.length > 0) && (
                            <span> | Horários Bloqueados: <strong>{(prof.blockedWeekdayHours?.length || 0) + (prof.blockedSpecificHours?.length || 0)} horários</strong></span>
                          )}
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
                        style={{ background: 'none', border: 'none', color: 'var(--adm-gold)', cursor: 'pointer', padding: 4 }}
                        onClick={() => handleEditProfStart(prof)}
                        title="Editar profissional"
                      >
                        <Edit size={16} />
                      </button>

                      {prof.id !== 'jon' && (
                        <button 
                          type="button" 
                          style={{ background: 'none', border: 'none', color: 'var(--adm-danger)', cursor: 'pointer', padding: 4 }}
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

        {/* CONTEÚDO: GOOGLE AGENDA */}
        {activeTab === 'google' && (
          <div className="financial-card">
            <h3>Integração com Google Agenda</h3>
            <p style={{ color: 'var(--adm-muted)', fontSize: '0.85rem', marginBottom: 20 }}>
              Sincronize automaticamente os agendamentos do Studio com a sua agenda pessoal do Google. 
              As marcações criadas ou alteradas no sistema irão para o Google Agenda, e bloqueios feitos lá serão importados para cá.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, borderTop: '1px solid var(--adm-rule)', paddingTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--adm-rule)' }}>
                <div>
                  <h4 style={{ margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    📅 Google Agenda
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--adm-muted)' }}>
                    {settings?.automations?.googleCalendarConnected 
                      ? 'Conectado à sua conta do Google (Agenda Principal).' 
                      : 'Não conectado. Clique para autorizar o acesso.'}
                  </p>
                </div>
                <div>
                  {settings?.automations?.googleCalendarConnected ? (
                    <button 
                      type="button"
                      className="btn-danger"
                      style={{ padding: '8px 16px', borderRadius: 4, cursor: 'pointer', background: 'var(--adm-danger)', color: '#fff', border: 'none', fontWeight: 'bold' }}
                      onClick={async () => {
                        if (window.confirm('Tem certeza que deseja desconectar o Google Agenda?')) {
                          if (isDemoMode || !db) {
                            setSettings(prev => ({
                              ...prev,
                              automations: {
                                ...prev.automations,
                                googleCalendarConnected: false,
                                googleCalendarAccessToken: null,
                                googleCalendarRefreshToken: null
                              }
                            }));
                            alert('Desconectado com sucesso (Modo Demo)!');
                          } else {
                            await updateDoc(doc(db, 'settings', 'studio'), {
                              'automations.googleCalendarConnected': false,
                              'automations.googleCalendarAccessToken': null,
                              'automations.googleCalendarRefreshToken': null,
                              'automations.googleCalendarId': null
                            });
                            alert('Google Agenda desconectado com sucesso!');
                          }
                        }
                      }}
                    >
                      Desconectar
                    </button>
                  ) : (
                    <button 
                      type="button"
                      className="btn-primary"
                      style={{ padding: '8px 16px', borderRadius: 4, cursor: 'pointer', background: 'var(--adm-gold)', color: '#0a0a0a', border: 'none', fontWeight: 'bold' }}
                      onClick={() => {
                        window.location.href = '/api/gcal?action=auth';
                      }}
                    >
                      Conectar Google Agenda
                    </button>
                  )}
                </div>
              </div>

              {settings?.automations?.googleCalendarConnected && (
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', borderRadius: 8, border: '1px dashed var(--adm-rule)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Sincronização Bidirecional Ativa</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--adm-muted)' }}>
                    O sistema executa uma sincronização delta em lote em segundo plano de tempos em tempos. Você também pode forçar a sincronização imediata de todos os horários dos últimos 30 dias e dos próximos 90 dias usando o botão abaixo.
                  </p>
                  <div>
                    <button 
                      type="button"
                      className="btn-secondary"
                      disabled={gcalSyncing}
                      style={{ padding: '8px 16px', borderRadius: 4, cursor: gcalSyncing ? 'not-allowed' : 'pointer', background: 'var(--adm-card)', color: 'var(--text)', border: '1px solid var(--adm-rule)', fontWeight: 'bold' }}
                      onClick={async () => {
                        setGcalSyncing(true);
                        try {
                          const res = await fetch('/api/gcal?action=syncAll', { method: 'POST' });
                          const data = await res.json();
                          if (data.success) {
                            const stats = data.stats || {};
                            alert(`Sincronização concluída! 🎉\n- Importados do Google: ${stats.imported || 0}\n- Exportados do Firestore: ${stats.exported || 0}\n- Atualizados no Google: ${stats.updatedGoogle || 0}\n- Atualizados no Firestore: ${stats.updatedFirestore || 0}`);
                          } else {
                            alert(`Erro ao sincronizar: ${data.error || 'Erro desconhecido'}`);
                          }
                        } catch (err) {
                          alert(`Erro de conexão com o servidor: ${err.message}`);
                        } finally {
                          setGcalSyncing(false);
                        }
                      }}
                    >
                      {gcalSyncing ? 'Sincronizando...' : 'Sincronizar Tudo Agora 🔄'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Barra de Ação */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16, marginTop: 24 }}>
          {isSaved && <span style={{ color: 'var(--adm-success)', fontWeight: 600, fontSize: '0.9rem' }}>Configurações salvas com sucesso!</span>}
          <button type="submit" className="btn btn-accent" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Save size={16} /> Salvar Configurações
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
