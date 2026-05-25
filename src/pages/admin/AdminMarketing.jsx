import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, onSnapshot, doc, updateDoc, getDoc, query, orderBy, limit } from 'firebase/firestore';
import { Sparkles, Phone, Mail, Search, CheckSquare, Square, Send, Eye } from 'lucide-react';
import './Admin.css';
import { HTML_TEMPLATES, EMAIL_CSS, ADMIN_HTML_TEMPLATES } from '../../utils/emailTemplates.js';


const EMAIL_PREVIEWS = {
  seqD1: { subject: '{nome}, como tá o fio hoje?', body: HTML_TEMPLATES['d1'] },
  seqD7: { subject: 'A semana mais importante do seu cabelo (e quase ninguém fala sobre isso)', body: HTML_TEMPLATES['d7'] },
  seqD21: { subject: '3 semanas de corte novo. Agora vem a parte boa.', body: HTML_TEMPLATES['d21'] },
  seqD35: { subject: '{nome}, chegou a hora.', body: HTML_TEMPLATES['d35'] },
  seqD60: { subject: 'Uma coisa que percebi depois de anos cortando cacheado', body: HTML_TEMPLATES['d60'] },
  seqD90: { subject: 'Esse é o último email que mando, {nome}.', body: HTML_TEMPLATES['d90'] },
  seqD150: {
    subject: 'Seu cabelo tem memória, {nome}',
    body: `
<div class="mail-body cream">
  <div class="mail-mast">
    <div class="brand">
      <div class="mark">J</div>
      Studio do Jon
    </div>
    <div class="tag">D+150 · Reativação</div>
  </div>

  <span class="m-eyebrow">Saudade</span>
  <h1 class="m-display m-h1 mt-20" style="max-width: 14ch;">
    Faz tempo, <span class="m-italic">{nome}.</span>
  </h1>

  <hr class="m-rule" />

  <p class="m-body mt-28" style="max-width: 54ch;">
    Já faz cerca de 5 meses desde o seu último corte no Studio. O cabelo ondulado, cacheado e crespo tem memória e perde a forma à medida que cresce.
  </p>
  <p class="m-body mt-12" style="max-width: 54ch;">
    Que tal agendar um horário para resgatar o corte, devolver a definição e cuidar da saúde dos fios?
  </p>

  <div class="m-btn-row mt-28">
    <a href="https://ojonquecortou.com.br/agendar" class="m-btn m-btn-primary">Quero agendar meu horário</a>
  </div>

  <hr class="m-rule" />
  <div class="m-signoff">
    <div class="sig-name">Jon</div>
  </div>
  <p class="m-body mt-12" style="max-width: 52ch; font-size: 14px; color: var(--muted);">
    <strong style="color: var(--ink);">Studio do Jon</strong><br />
    Especialista em corte para cabelos ondulados, cacheados e crespos<br />
    com foco em visagismo em Belo Horizonte.
  </p>
  <p class="m-small mt-12" style="color: var(--muted);">
    @ojonquecortou · ojonquecortou.com.br/agendar
  </p>
  <div style="height: 48px;"></div>
</div>
<div class="mail-footer">
  <div class="m-footer-grid">
    <div>
      <div class="m-footer-brand">Studio do Jon <span class="italic">— corte com leitura.</span></div>
      <p class="addr">Rua Francisco Ovídio, 184 · Caiçara<br>Belo Horizonte · MG · 30000-000<br>Quarta a Sábado · 9h às 19h</p>
    </div>
  </div>
  <div class="legal">© 2026 Studio do Jon</div>
</div>
`
  },
  birthdayEnabled: { subject: 'Parabéns, {nome}.', body: HTML_TEMPLATES['aniversario'] }
};


const AdminMarketing = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);

  // Marketing states
  const [searchTerm, setSearchTerm] = useState('');
  const [marketingTarget, setMarketingTarget] = useState('todos');
  const [marketingChannel, setMarketingChannel] = useState('whatsapp');
  const [campaignMessage, setCampaignMessage] = useState('Oi {nome}, vimos que faz {dias_ausente} dias desde seu último {ultimo_servico}. Saudade dos seus cachos!');
  const [emailCampaignSubject, setEmailCampaignSubject] = useState('Sentimos sua falta no Studio do Jon! ✂️');
  const [emailCampaignBody, setEmailCampaignBody] = useState('<p>Olá <b>{nome}</b>!</p><p>Já faz {dias_ausente} dias que não cuidamos do seu cabelo. Seu último procedimento foi {ultimo_servico}.</p><p>Que tal agendar um horário esta semana?</p>');
  
  const [selectedCampaignPhones, setSelectedCampaignPhones] = useState([]);
  
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showEmailPreviewModal, setShowEmailPreviewModal] = useState(false);
  const [showEmailEditModal, setShowEmailEditModal] = useState(false);
  const [editingTemplateKey, setEditingTemplateKey] = useState(null);
  const [editingTemplateContent, setEditingTemplateContent] = useState({ subject: '', body: '' });
  const [emailPreviewContent, setEmailPreviewContent] = useState({ subject: '', body: '' });
  const [isSendingWhatsapp, setIsSendingWhatsapp] = useState(false);
  const [showCustomHtmlModal, setShowCustomHtmlModal] = useState(false);
  const [showCustomPreviewModal, setShowCustomPreviewModal] = useState(false);
  const [editingCustomKey, setEditingCustomKey] = useState(null);
  const [editingCustomHtml, setEditingCustomHtml] = useState('');
  const [customPreviewHtml, setCustomPreviewHtml] = useState('');
  const [emailLogs, setEmailLogs] = useState([]);
  const [whatsappLogs, setWhatsappLogs] = useState([]);
  const [automationLogs, setAutomationLogs] = useState([]);
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [selectedAdminNotif, setSelectedAdminNotif] = useState(null);
  const [showAdminNotifModal, setShowAdminNotifModal] = useState(false);

  useEffect(() => {
    let unsubscribeProfiles;
    let unsubscribeBookings;
    let unsubscribeLogs;
    let unsubscribeSettings;
    let unsubscribeAdminNotifs;

    const loadData = async () => {
      try {
        unsubscribeSettings = onSnapshot(doc(db, 'settings', 'studio'), (docSnap) => {
          if (docSnap.exists()) {
            setSettings(docSnap.data());
          } else {
            setSettings({ automations: {} });
          }
        });

        unsubscribeLogs = onSnapshot(collection(db, 'automation_logs'), (logsSnap) => {
          const lgs = [];
          logsSnap.forEach(d => lgs.push({ id: d.id, ...d.data() }));
          lgs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          setAutomationLogs(lgs);
        });

        unsubscribeAdminNotifs = onSnapshot(
          query(collection(db, 'admin_notifications'), orderBy('timestamp', 'desc'), limit(50)),
          (snap) => {
            const list = [];
            snap.forEach(d => list.push({ id: d.id, ...d.data() }));
            setAdminNotifications(list);
          }
        );

        const profiles = [];
        unsubscribeProfiles = onSnapshot(collection(db, 'client_profiles'), (profSnap) => {
          profiles.length = 0;
          profSnap.forEach(d => profiles.push({ phone: d.id, ...d.data() }));
          
          unsubscribeBookings = onSnapshot(collection(db, 'bookings'), (bookSnap) => {
            const bookings = [];
            bookSnap.forEach(d => bookings.push({ id: d.id, ...d.data() }));
            
            // Build unified clients array
            const clientMap = new Map();
            bookings.forEach(b => {
              if (['Pendente', 'Confirmado', 'Concluído'].includes(b.status)) {
                const existing = clientMap.get(b.phone) || { name: b.clientName, phone: b.phone, visits: [], lastServiceName: b.serviceName, email: '' };
                existing.visits.push(new Date(b.date + 'T00:00:00'));
                if (!existing.email && b.email) existing.email = b.email;
                clientMap.set(b.phone, existing);
              }
            });

            profiles.forEach(p => {
              const existing = clientMap.get(p.phone) || { name: p.name || 'Cliente', phone: p.phone, visits: [], lastServiceName: 'Nenhum', email: p.email || '' };
              if (p.email) existing.email = p.email;
              if (p.name) existing.name = p.name;
              clientMap.set(p.phone, existing);
            });

            const merged = Array.from(clientMap.values()).map(c => {
              c.visits.sort((a, b) => b - a);
              return {
                ...c,
                lastVisit: c.visits.length > 0 ? c.visits[0].toISOString() : 'Nunca visitou',
                totalVisits: c.visits.length
              };
            });
            
            setClients(merged);
            setLoading(false);
          });
        });

      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    if (db) loadData();

    return () => {
      if (unsubscribeProfiles) unsubscribeProfiles();
      if (unsubscribeBookings) unsubscribeBookings();
      if (unsubscribeLogs) unsubscribeLogs();
      if (unsubscribeSettings) unsubscribeSettings();
      if (unsubscribeAdminNotifs) unsubscribeAdminNotifs();
    };
  }, []);

  const getDaysAbsent = (lastVisitDate) => {
    if (lastVisitDate === 'Nunca visitou' || !lastVisitDate) return Infinity;
    const diffTime = Math.abs(new Date() - new Date(lastVisitDate));
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const toggleClientSelection = (phone) => {
    setSelectedCampaignPhones(prev => 
      prev.includes(phone) ? prev.filter(p => p !== phone) : [...prev, phone]
    );
  };

  const toggleAutomation = async (key, newValue) => {
    try {
      await updateDoc(doc(db, 'settings', 'studio'), {
        [`automations.${key}`]: newValue
      });
      // A UI vai atualizar automaticamente via onSnapshot
    } catch (err) {
      console.error("Erro ao atualizar automação:", err);
      alert("Erro ao salvar configuração.");
    }
  };

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const marketingTargetsList = clients.filter(c => {
    const days = getDaysAbsent(c.lastVisit);
    if (marketingTarget === 'todos') return true;
    if (marketingTarget === 'inativos_30') return days >= 30 && days <= 60;
    if (marketingTarget === 'inativos_60') return days > 60 && days !== Infinity;
    if (marketingTarget === 'nunca_visitaram') return days === Infinity;
    if (marketingTarget === 'selecionados') return selectedCampaignPhones.includes(c.phone);
    return false;
  });

  const getCampaignMessageLink = (client) => {
    const days = getDaysAbsent(client.lastVisit);
    let msg = campaignMessage
      .replace(/{nome}/g, client.name.split(' ')[0])
      .replace(/{ultimo_servico}/g, client.lastServiceName || 'Corte')
      .replace(/{dias_ausente}/g, days === Infinity ? 'muito tempo' : days);
    
    return `https://wa.me/55${client.phone}?text=${encodeURIComponent(msg)}`;
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplateKey) return;
    try {
      await updateDoc(doc(db, 'settings', 'studio'), {
        [`email_templates.${editingTemplateKey}`]: editingTemplateContent
      });
      setShowEmailEditModal(false);
      alert('Template salvo com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar template.');
    }
  };

  const handleSendWhatsappCampaign = async () => {
    if (marketingTargetsList.length === 0) return;
    setIsSendingWhatsapp(true);
    setWhatsappLogs(['[SYSTEM] Iniciando disparo em lote (WhatsApp)...']);

    for (const client of marketingTargetsList) {
      await new Promise(r => setTimeout(r, 1200));
      setWhatsappLogs(prev => [...prev, `[✅ OK] Mensagem enfileirada para ${client.name} (${client.phone})`]);
    }

    setWhatsappLogs(prev => [...prev, '[SYSTEM] Lote finalizado!']);
    setIsSendingWhatsapp(false);
  };

  const handleSendEmailCampaign = async () => {
    if (marketingTargetsList.length === 0) return;
    setIsSendingEmail(true);
    setEmailLogs(['[SYSTEM] Conectando ao gateway de E-mail (Resend)...']);

    for (const client of marketingTargetsList) {
      await new Promise(r => setTimeout(r, 800));
      if (!client.email || client.email === 'Não informado' || !client.email.includes('@')) {
        setEmailLogs(prev => [...prev, `[❌ Pulo] ${client.name} não possui e-mail cadastrado.`]);
      } else {
        const days = getDaysAbsent(client.lastVisit);
        const firstName = client.name.split(' ')[0];
        
        const subject = emailCampaignSubject
          .replace(/{nome}/g, firstName)
          .replace(/{ultimo_servico}/g, client.lastServiceName || 'Corte')
          .replace(/{dias_ausente}/g, days === Infinity ? 'muito tempo' : days);
          
        let content = emailCampaignBody
          .replace(/{nome}/g, firstName)
          .replace(/{ultimo_servico}/g, client.lastServiceName || 'Corte')
          .replace(/{dias_ausente}/g, days === Infinity ? 'muito tempo' : days);

        if (!content.includes('<p') && !content.includes('<br')) {
          content = '<p>' + content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>') + '</p>';
        }

        try {
          const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'campanha',
              subject,
              htmlBody: content,
              clientEmail: client.email,
              clientName: client.name
            })
          });
          if (response.ok) {
            setEmailLogs(prev => [...prev, `[✅ Enviado] E-mail disparado para ${client.email}`]);
          } else {
            setEmailLogs(prev => [...prev, `[❌ Erro] Falha ao enviar para ${client.email}`]);
          }
        } catch (error) {
          setEmailLogs(prev => [...prev, `[❌ Erro] Falha ao enviar para ${client.email}: ${error.message}`]);
        }
      }
    }

    setEmailLogs(prev => [...prev, '[SYSTEM] Lote finalizado!']);
    setIsSendingEmail(false);
  };

  const handleSaveCustomHtml = async () => {
    if (!editingCustomKey) return;
    try {
      await updateDoc(doc(db, 'settings', 'studio'), {
        [`custom_automations.${editingCustomKey}`]: editingCustomHtml
      });
      setShowCustomHtmlModal(false);
      alert('Automação HTML salva com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar automação HTML.');
    }
  };

  const handleCustomFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setEditingCustomHtml(event.target.result);
    };
    reader.readAsText(file);
  };

  return (
    <div className="admin-clients-page">
      <div className="crm-header-tabs" style={{ marginBottom: 20 }}>
        <button className="crm-tab-btn active" style={{ cursor: 'default' }}>
          <Sparkles size={16} /> Central de Campanhas
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>Carregando dados...</div>
      ) : (
        <div className="crm-body-content">
          <div className="marketing-tab-view">
            <header className="report-header">
              <h3>Campanhas & Automações de Relacionamento (Marketing CRM)</h3>
              <p>Selecione um segmento de clientes, defina o canal de disparo (WhatsApp ou E-mail) e crie campanhas direcionadas.</p>
            </header>

            <div className="marketing-layout-grid">
              
              {/* Client Selection Tool */}
              <div className="marketing-automations-card" style={{ gridColumn: '1 / -1', padding: '20px', background: 'var(--panel-bg)', borderRadius: '8px', border: '1px solid var(--rule)' }}>
                <h4 style={{ margin: '0 0 12px 0' }}>Buscar e Marcar Clientes</h4>
                <div className="search-wrap" style={{ marginBottom: '16px', maxWidth: '400px' }}>
                  <Search size={14} className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Pesquisar por nome ou telefone..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ width: '100%', padding: '8px 8px 8px 32px', borderRadius: '4px', border: '1px solid var(--rule)' }}
                  />
                </div>

                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--rule)', borderRadius: '6px' }}>
                  <table className="admin-table" style={{ margin: 0 }}>
                    <thead style={{ position: 'sticky', top: 0, background: 'var(--panel-bg)', zIndex: 1 }}>
                      <tr>
                        <th style={{ width: 40, textAlign: 'center' }}>
                          <button 
                            className="btn-icon" 
                            onClick={() => {
                              if (selectedCampaignPhones.length === filteredClients.length) {
                                setSelectedCampaignPhones([]);
                              } else {
                                setSelectedCampaignPhones(filteredClients.map(c => c.phone));
                              }
                            }}
                          >
                            {selectedCampaignPhones.length === filteredClients.length && filteredClients.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
                          </button>
                        </th>
                        <th>Nome</th>
                        <th>Telefone</th>
                        <th>Última Visita</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClients.map(c => {
                        const days = getDaysAbsent(c.lastVisit);
                        return (
                          <tr key={c.phone} style={{ background: selectedCampaignPhones.includes(c.phone) ? 'rgba(47, 133, 90, 0.1)' : 'transparent' }}>
                            <td style={{ textAlign: 'center' }}>
                              <input 
                                type="checkbox" 
                                checked={selectedCampaignPhones.includes(c.phone)}
                                onChange={() => toggleClientSelection(c.phone)}
                                style={{ width: 16, height: 16, cursor: 'pointer' }}
                              />
                            </td>
                            <td>{c.name}</td>
                            <td>{c.phone}</td>
                            <td>{days === Infinity ? 'Sem visitas' : `${days} dias atrás`}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {selectedCampaignPhones.length > 0 && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--accent)', marginTop: '8px', fontWeight: 600 }}>
                    {selectedCampaignPhones.length} clientes marcados. (Escolha "Selecionadas no Relatório" abaixo).
                  </p>
                )}
              </div>
              
              {/* Automações Fixas */}
              <div className="marketing-automations-card" style={{ gridColumn: '1 / -1', padding: '20px', background: 'var(--panel-bg)', borderRadius: '8px', border: '1px solid var(--rule)' }}>
                <h4 style={{ margin: '0 0 6px 0' }}>Régua de Relacionamento (Automática)</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '20px', marginTop: 0 }}>
                  Acompanhe a jornada pós-atendimento. O sistema verifica diariamente e dispara a sequência abaixo.
                </p>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center', background: 'var(--sidebar-bg)', padding: '12px', borderRadius: '6px' }}>
                  <strong style={{ flex: 1 }}>Régua Completa (Mestre)</strong>
                  <button 
                    className={`btn-toggle ${settings?.automations?.sequenceEnabled !== false ? 'active' : ''}`}
                    onClick={() => toggleAutomation('sequenceEnabled', settings?.automations?.sequenceEnabled === false)}
                  >
                    {settings?.automations?.sequenceEnabled !== false ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  {[
                    { key: 'seqD1', label: 'E-mail 1 (D+1)', desc: 'Cuidado Imediato' },
                    { key: 'seqD7', label: 'E-mail 2 (D+7)', desc: 'Semana Crítica' },
                    { key: 'seqD21', label: 'E-mail 3 (D+21)', desc: 'Pico de Definição' },
                    { key: 'seqD35', label: 'E-mail 4 (D+35/50)', desc: 'Rebooking Ideal' },
                    { key: 'seqD60', label: 'E-mail 5 (D+60)', desc: 'Reativação Suave' },
                    { key: 'seqD90', label: 'E-mail 6 (D+90)', desc: 'Último Contato' },
                    { key: 'seqD150', label: 'E-mail 7 (D+150)', desc: 'Reativação (150 dias)' },
                    { key: 'birthdayEnabled', label: 'Aniversário (D-5)', desc: 'Convite c/ antecedência' }
                  ].map(step => (

                    <div key={step.key} style={{ padding: '12px', border: '1px solid var(--rule)', borderRadius: '6px', background: 'var(--sidebar-bg)', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{step.label}</span>
                        <button 
                          className={`btn-toggle ${settings?.automations?.[step.key] !== false ? 'active' : ''}`}
                          style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                          onClick={() => toggleAutomation(step.key, settings?.automations?.[step.key] === false)}
                        >
                          {settings?.automations?.[step.key] !== false ? 'ON' : 'OFF'}
                        </button>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{step.desc}</span>
                      
                      <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                        <button 
                          className="btn btn-outline btn-small"
                          style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', fontSize: '0.7rem', padding: '4px' }}
                          onClick={() => {
                            setEditingTemplateKey(step.key);
                            setEditingTemplateContent(settings?.email_templates?.[step.key] || EMAIL_PREVIEWS[step.key]);
                            setShowEmailEditModal(true);
                          }}
                        >
                          ✏️ Editar
                        </button>
                        <button 
                          className="btn btn-outline btn-small"
                          style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', fontSize: '0.7rem', padding: '4px' }}
                          onClick={() => {
                            setEmailPreviewContent(settings?.email_templates?.[step.key] || EMAIL_PREVIEWS[step.key]);
                            setShowEmailPreviewModal(true);
                          }}
                        >
                          <Eye size={12} /> Ver
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '30px' }}>
                  <h5 style={{ margin: '0 0 10px 0' }}>Histórico de Disparos da Régua</h5>
                  {automationLogs.length === 0 ? (
                    <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Nenhum e-mail automático disparado ainda.</p>
                  ) : (
                    <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--rule)', borderRadius: '6px' }}>
                      <table className="admin-table" style={{ margin: 0 }}>
                        <thead style={{ position: 'sticky', top: 0, background: 'var(--panel-bg)' }}>
                          <tr>
                            <th>Data</th>
                            <th>Cliente</th>
                            <th>Etapa (Trigger)</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {automationLogs.slice(0, 50).map(log => (
                            <tr key={log.id}>
                              <td>{new Date(log.timestamp).toLocaleString('pt-BR')}</td>
                              <td>{log.clientName}</td>
                              <td><span className="status-badge concluded">{log.stage}</span></td>
                              <td>✅ Enviado</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* E-mails do Sistema e Notificações */}
              <div className="marketing-automations-card" style={{ gridColumn: '1 / -1', padding: '20px', background: 'var(--panel-bg)', borderRadius: '8px', border: '1px solid var(--rule)', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 6px 0' }}>E-mails do Sistema e Notificações</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '20px', marginTop: 0 }}>
                  Edite o HTML das automações automáticas do sistema e acompanhe o histórico de notificações de agendamentos.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  {[
                    { key: 'solicitacao_recebida', label: 'Pedido em Espera', desc: 'Disparado quando um cliente solicita agendamento (aguardando aprovação).', toggleKey: 'waitingRequestEmailEnabled' },
                    { key: 'horario_confirmado', label: 'Confirmação de Horário', desc: 'Disparado quando o agendamento é confirmado pelo administrador.', toggleKey: 'bookingConfirmationEmailEnabled' },
                    { key: 'lembrete_24h', label: 'Lembrete de Agendamento (24h)', desc: 'Disparado automaticamente 24 horas antes do horário marcado.', toggleKey: 'reminder24hEmailEnabled' },
                    { key: 'reativacao_5_meses', label: 'Reativação (150+ dias)', desc: 'Enviado para clientes inativos há mais de 5 meses sem novas reservas.', toggleKey: 'seqD150' },
                    { key: 'admin_solicitacao_recebida', label: 'Pedido em Espera (Admin)', desc: 'Enviado para você (Administrador) quando há uma nova solicitação.', toggleKey: 'adminWaitingRequestEmailEnabled' },
                    { key: 'admin_horario_confirmado', label: 'Confirmação de Horário (Admin)', desc: 'Enviado para você (Administrador) quando um agendamento é confirmado.', toggleKey: 'adminBookingConfirmationEmailEnabled' }
                  ].map(item => (
                    <div key={item.key} style={{ padding: '16px', border: '1px solid var(--rule)', borderRadius: '8px', background: 'var(--sidebar-bg)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.label}</span>
                          <button 
                            className={`btn-toggle ${settings?.automations?.[item.toggleKey] !== false ? 'active' : ''}`}
                            style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                            onClick={() => toggleAutomation(item.toggleKey, settings?.automations?.[item.toggleKey] === false)}
                          >
                            {settings?.automations?.[item.toggleKey] !== false ? 'ON' : 'OFF'}
                          </button>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: '0 0 16px 0', lineHeight: 1.4 }}>{item.desc}</p>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                        <button 
                          className="btn btn-outline btn-small"
                          style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', fontSize: '0.75rem', padding: '6px' }}
                          onClick={() => {
                            setEditingCustomKey(item.key);
                            setEditingCustomHtml(settings?.custom_automations?.[item.key] || '');
                            setShowCustomHtmlModal(true);
                          }}
                        >
                          ⚙️ Configurar HTML
                        </button>
                        <button 
                          className="btn btn-outline btn-small"
                          style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', fontSize: '0.75rem', padding: '6px' }}
                          onClick={() => {
                            const customHtml = settings?.custom_automations?.[item.key];
                            const fallback = ADMIN_HTML_TEMPLATES[item.key];
                            if (customHtml || fallback) {
                              setEmailPreviewContent({ subject: item.label, body: customHtml || fallback });
                              setShowEmailPreviewModal(true);
                            } else {
                              setCustomPreviewHtml('<h3>Nenhum template HTML enviado ainda para esta automação.</h3>');
                              setShowCustomPreviewModal(true);
                            }
                          }}
                        >
                          <Eye size={14} /> Ver
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <hr style={{ border: '0', borderTop: '1px solid var(--rule)', margin: '30px 0' }} />
                
                <h4 style={{ margin: '0 0 6px 0' }}>Histórico de Notificações Recebidas pelo Administrador</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '15px', marginTop: 0 }}>
                  Acompanhe os e-mails de solicitação de pedido, confirmação e cancelamento enviados para você.
                </p>
                
                {adminNotifications.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)', background: 'var(--sidebar-bg)', borderRadius: '6px', border: '1px solid var(--rule)' }}>
                    Nenhuma notificação enviada ao administrador foi registrada ainda.
                  </div>
                ) : (
                  <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--rule)', borderRadius: '6px', background: 'var(--sidebar-bg)' }}>
                    <table className="admin-table" style={{ margin: 0 }}>
                      <thead style={{ position: 'sticky', top: 0, background: 'var(--panel-bg)' }}>
                        <tr>
                          <th>Data/Hora</th>
                          <th>Cliente</th>
                          <th>Assunto / Tipo</th>
                          <th style={{ textAlign: 'center' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminNotifications.map(notif => (
                          <tr key={notif.id}>
                            <td>{new Date(notif.timestamp).toLocaleString('pt-BR')}</td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{notif.clientName}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{notif.clientEmail}</div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 500 }}>{notif.subject}</div>
                              <span className={`status-badge ${
                                notif.type === 'solicitacao_recebida' ? 'pending' : 
                                notif.type === 'horario_confirmado' ? 'concluded' : 'cancelled'
                              }`} style={{ fontSize: '0.7rem', padding: '2px 6px', marginTop: '4px', display: 'inline-block' }}>
                                {notif.type === 'solicitacao_recebida' ? 'Solicitação' : 
                                 notif.type === 'horario_confirmado' ? 'Confirmação' : 'Cancelamento'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button 
                                className="btn btn-outline btn-small"
                                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                onClick={() => {
                                  setSelectedAdminNotif(notif);
                                  setShowAdminNotifModal(true);
                                }}
                              >
                                👁️ Ver E-mail
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Template */}
              <div className="marketing-config-card">
                <h4>Configurar Campanha</h4>

                <div className="form-group-sleek">
                  <label>Público Alvo Segmentado</label>
                  <select value={marketingTarget} onChange={e => setMarketingTarget(e.target.value)}>
                    <option value="todos">Todos os Clientes ({clients.length})</option>
                    <option value="inativos_30">Clientes Ausentes (30 a 60 dias) ({clients.filter(c => { const d = getDaysAbsent(c.lastVisit); return d >= 30 && d <= 60; }).length})</option>
                    <option value="inativos_60">Clientes Adormecidos (&gt;60 dias) ({clients.filter(c => { const d = getDaysAbsent(c.lastVisit); return d > 60 && d !== Infinity; }).length})</option>
                    <option value="nunca_visitaram">Sem Agendamento no Salão ({clients.filter(c => getDaysAbsent(c.lastVisit) === Infinity).length})</option>
                    <option value="selecionados">Selecionados Acima ({selectedCampaignPhones.length})</option>
                  </select>
                </div>

                <div className="form-group-sleek">
                  <label>Canal de Disparo</label>
                  <div className="campaign-channel-toggle" style={{ display: 'flex', gap: '12px', margin: '8px 0' }}>
                    <button 
                      type="button" 
                      className={`btn ${marketingChannel === 'whatsapp' ? 'btn-accent' : 'btn-outline'}`}
                      onClick={() => setMarketingChannel('whatsapp')}
                      style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
                    >
                      <Phone size={14} style={{ marginRight: 6 }} /> WhatsApp
                    </button>
                    <button 
                      type="button" 
                      className={`btn ${marketingChannel === 'email' ? 'btn-accent' : 'btn-outline'}`}
                      onClick={() => setMarketingChannel('email')}
                      style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
                    >
                      <Mail size={14} style={{ marginRight: 6 }} /> E-mail (Automático)
                    </button>
                  </div>
                </div>

                {marketingChannel === 'whatsapp' ? (
                  <div className="form-group-sleek">
                    <label>Texto da Campanha (Suporta Tags Dinâmicas)</label>
                    <textarea 
                      rows="5"
                      value={campaignMessage}
                      onChange={e => setCampaignMessage(e.target.value)}
                      placeholder="Use as tags para personalizar..."
                    ></textarea>
                    
                    <div className="tags-legend">
                      <strong>Tags disponíveis:</strong>
                      <span className="tag-pill-ref" onClick={() => setCampaignMessage(prev => prev + ' {nome}')}>{`{nome}`}</span>
                      <span className="tag-pill-ref" onClick={() => setCampaignMessage(prev => prev + ' {ultimo_servico}')}>{`{ultimo_servico}`}</span>
                      <span className="tag-pill-ref" onClick={() => setCampaignMessage(prev => prev + ' {dias_ausente}')}>{`{dias_ausente}`}</span>
                    </div>
                  </div>
                ) : (
                  <div className="email-campaign-form">
                    <div className="form-group-sleek">
                      <label>Assunto do E-mail</label>
                      <input 
                        type="text"
                        value={emailCampaignSubject}
                        onChange={e => setEmailCampaignSubject(e.target.value)}
                        placeholder="Assunto da campanha..."
                      />
                    </div>
                    
                    <div className="form-group-sleek" style={{ marginTop: '12px' }}>
                      <label>Corpo do E-mail (HTML permitido)</label>
                      <textarea 
                        rows="6"
                        value={emailCampaignBody}
                        onChange={e => setEmailCampaignBody(e.target.value)}
                        style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                      ></textarea>
                      
                      <div className="tags-legend">
                        <strong>Tags disponíveis:</strong>
                        <span className="tag-pill-ref" onClick={() => setEmailCampaignBody(prev => prev + ' {nome}')}>{`{nome}`}</span>
                        <span className="tag-pill-ref" onClick={() => setEmailCampaignBody(prev => prev + ' {ultimo_servico}')}>{`{ultimo_servico}`}</span>
                        <span className="tag-pill-ref" onClick={() => setEmailCampaignBody(prev => prev + ' {dias_ausente}')}>{`{dias_ausente}`}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Targets */}
              <div className="marketing-targets-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0 }}>Alvos da Campanha ({marketingTargetsList.length} Clientes)</h4>
                  
                  {marketingChannel === 'email' && (
                    <button 
                      className="btn btn-accent" 
                      onClick={handleSendEmailCampaign}
                      disabled={isSendingEmail || marketingTargetsList.length === 0}
                      style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                    >
                      {isSendingEmail ? 'Disparando...' : 'Disparar E-mails'}
                    </button>
                  )}

                  {marketingChannel === 'whatsapp' && (
                    <button 
                      className="btn btn-accent" 
                      onClick={handleSendWhatsappCampaign}
                      disabled={isSendingWhatsapp || marketingTargetsList.length === 0}
                      style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      {isSendingWhatsapp ? 'Disparando...' : '🚀 Disparar em Lote'}
                    </button>
                  )}
                </div>

                {marketingChannel === 'whatsapp' ? (
                  <p className="sub-instruction">Dispare automaticamente via API Gateway configurada ou clique em "WhatsApp" em cada linha para enviar manualmente.</p>
                ) : (
                  <p className="sub-instruction">Simule ou conecte o disparo de e-mails em massa através de nossa API integrada.</p>
                )}

                {marketingChannel === 'whatsapp' && whatsappLogs.length > 0 && (
                  <div className="email-sim-console" style={{ background: '#1e1e1e', color: '#00ff00', fontFamily: 'monospace', padding: '12px', borderRadius: '6px', fontSize: '0.8rem', height: '160px', overflowY: 'auto', border: '1px solid #333', marginBottom: '16px' }}>
                    {whatsappLogs.map((log, index) => <div key={index} style={{ marginBottom: '2px' }}>{log}</div>)}
                  </div>
                )}

                {marketingChannel === 'email' && emailLogs.length > 0 && (
                  <div className="email-sim-console" style={{ background: '#1e1e1e', color: '#00ff00', fontFamily: 'monospace', padding: '12px', borderRadius: '6px', fontSize: '0.8rem', height: '160px', overflowY: 'auto', border: '1px solid #333', marginBottom: '16px' }}>
                    {emailLogs.map((log, index) => <div key={index} style={{ marginBottom: '2px' }}>{log}</div>)}
                  </div>
                )}

                <div className="targets-scroll-list" style={{ maxHeight: '350px' }}>
                  {marketingTargetsList.length === 0 ? (
                    <p className="no-data-msg">Nenhum cliente no segmento escolhido.</p>
                  ) : (
                    marketingTargetsList.map(c => (
                      <div key={c.phone} className="marketing-target-row">
                        <div className="target-client-info">
                          <h5>{c.name}</h5>
                          <span>WhatsApp: {c.phone} | Ausente há: {getDaysAbsent(c.lastVisit) === Infinity ? 'Sem Visitas' : `${getDaysAbsent(c.lastVisit)} dias`}</span>
                        </div>
                        
                        {marketingChannel === 'whatsapp' ? (
                          <a 
                            href={getCampaignMessageLink(c)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-accent btn-small btn-whatsapp-direct"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Send size={12} /> WhatsApp
                          </a>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                            {c.email && c.email !== 'Não informado' ? c.email : 'Sem E-mail'}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEmailEditModal && (
        <div className="modal-overlay" onClick={() => setShowEmailEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '100%' }}>
            <h3>Editar E-mail da Régua</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>As tags dinâmicas como <b>{'{'}nome{'}'}</b> serão substituídas no disparo.</p>
            
            <div className="form-group-sleek">
              <label>Assunto</label>
              <input 
                type="text" 
                value={editingTemplateContent.subject} 
                onChange={e => setEditingTemplateContent({...editingTemplateContent, subject: e.target.value})} 
              />
            </div>
            <div className="form-group-sleek" style={{ marginTop: '12px' }}>
              <label>Corpo do E-mail (HTML permitido)</label>
              <textarea 
                rows="10" 
                value={editingTemplateContent.body} 
                onChange={e => setEditingTemplateContent({...editingTemplateContent, body: e.target.value})} 
                style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
              ></textarea>
            </div>

            <div className="modal-actions" style={{ justifyContent: 'flex-end', marginTop: 24 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowEmailEditModal(false)}>Cancelar</button>
              <button type="button" className="btn btn-accent" onClick={handleSaveTemplate}>Salvar E-mail</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR AUTOMACAO HTML */}
      {showCustomHtmlModal && (
        <div className="modal-overlay" onClick={() => setShowCustomHtmlModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', width: '100%' }}>
            <h3>Configurar HTML para Automação</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Suba um arquivo HTML ou cole o código fonte abaixo. Use a tag <b>{'{nome}'}</b> para exibir o nome da cliente.</p>
            
            <div style={{ marginBottom: 16 }}>
              <input 
                type="file" 
                accept=".html" 
                id="custom-html-file-upload" 
                style={{ display: 'none' }} 
                onChange={handleCustomFileUpload} 
              />
              <label htmlFor="custom-html-file-upload" className="btn btn-outline" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                📁 Escolher arquivo HTML
              </label>
            </div>

            <div className="form-group-sleek">
              <label>Código Fonte HTML</label>
              <textarea 
                rows="15" 
                value={editingCustomHtml} 
                onChange={e => setEditingCustomHtml(e.target.value)} 
                style={{ fontFamily: 'monospace', fontSize: '0.82rem', width: '100%', background: '#1e1e1e', color: '#f8f8f2', border: '1px solid #333', borderRadius: 4, padding: 8 }}
                placeholder="<!-- Cole seu HTML aqui -->"
              ></textarea>
            </div>

            <div className="modal-actions" style={{ justifyContent: 'flex-end', marginTop: 20 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowCustomHtmlModal(false)}>Cancelar</button>
              <button type="button" className="btn btn-accent" onClick={handleSaveCustomHtml}>Salvar HTML</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW AUTOMACAO HTML */}
      {showCustomPreviewModal && (
        <div className="modal-overlay" onClick={() => setShowCustomPreviewModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', width: '100%', padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--rule)' }}>
              <div style={{ color: 'var(--muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                Visualização do Template HTML
              </div>
              <strong style={{ color: '#fff' }}>Preview</strong>
            </div>
            
            <div style={{ backgroundColor: '#f0eee9', width: '100%', height: '550px' }}>
              <iframe 
                srcDoc={`
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <meta charset="utf-8">
                    <title>Preview</title>
                  </head>
                  <body style="margin: 0; padding: 0;">
                    ${customPreviewHtml.replace(/{nome}/g, 'Cliente Exemplo')}
                  </body>
                  </html>
                `}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Custom HTML Preview"
              />
            </div>
            
            <div className="modal-actions" style={{ padding: '16px' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowCustomPreviewModal(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização de E-mail do Admin */}
      {showAdminNotifModal && selectedAdminNotif && (
        <div className="modal-overlay" onClick={() => setShowAdminNotifModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', width: '95%', padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '80vh' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--rule)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                    E-mail Enviado ao Administrador
                  </div>
                  <strong style={{ color: '#fff' }}>{selectedAdminNotif.subject}</strong>
                </div>
                <button style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setShowAdminNotifModal(false)}>✕</button>
              </div>
            </div>
            
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--rule)', background: 'var(--sidebar-bg)', fontSize: '0.85rem' }}>
              <div style={{ marginBottom: '4px' }}><strong>Destinatário:</strong> Notificação do Salão</div>
              <div style={{ marginBottom: '4px' }}><strong>Data de Envio:</strong> {new Date(selectedAdminNotif.timestamp).toLocaleString('pt-BR')}</div>
              <div><strong>Cliente Relacionado:</strong> {selectedAdminNotif.clientName}</div>
            </div>
            
            <div style={{ backgroundColor: '#fff', width: '100%', flex: 1, overflow: 'hidden' }}>
              <iframe 
                srcDoc={selectedAdminNotif.htmlBody || '<h3>Nenhum conteúdo no e-mail.</h3>'}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Admin Notification E-mail"
              />
            </div>
            
            <div className="modal-actions" style={{ padding: '16px', borderTop: '1px solid var(--rule)' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowAdminNotifModal(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW DE EMAIL */}
      {showEmailPreviewModal && (
        <div className="modal-overlay" onClick={() => setShowEmailPreviewModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', width: '100%', padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--rule)' }}>
              <div style={{ color: 'var(--muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Preview de E-mail
              </div>
              <div style={{ fontWeight: 600, fontSize: '1.05rem', color: '#fff' }}>{emailPreviewContent.subject.replace(/{nome}/g, '[Nome]')}</div>
            </div>
            
            <div style={{ backgroundColor: '#f0eee9', width: '100%', height: '600px' }}>
              <iframe 
                srcDoc={`
                  <!DOCTYPE html>
                  <html lang="pt-BR">
                  <head>
                    <meta charset="utf-8">
                    <title>Preview</title>
                    <style>${EMAIL_CSS}</style>
                  </head>
                  <body style="margin: 0; padding: 0; background-color: #f0eee9; -webkit-font-smoothing: antialiased;">
                    <div class="mail-stage">
                      ${emailPreviewContent.body.replace(/{nome}/g, '[Nome]')}
                    </div>
                  </body>
                  </html>
                `}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Email Preview"
              />
            </div>
            
            <div className="modal-actions" style={{ padding: '20px' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowEmailPreviewModal(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMarketing;
