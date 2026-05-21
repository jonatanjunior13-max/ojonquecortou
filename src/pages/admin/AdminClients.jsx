import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../config/firebase';
import { collection, onSnapshot, query, doc, setDoc, getDocs, writeBatch } from 'firebase/firestore';
import { Search, Save, UserCheck, Plus, Send, Mail, Phone, Calendar, Sparkles, AlertCircle, Upload } from 'lucide-react';
import { parseClientCSV } from '../../utils/clientImport';
import './Admin.css';

import { useOutletContext } from 'react-router-dom';

const AdminClients = () => {
  const [activeTab, setActiveTab] = useState('fichas');
  
  const { globalData, setGlobalData } = useOutletContext();
  const bookings = globalData.bookings || [];
  const profiles = globalData.clients || [];
  
  // As we need a merged version of bookings+profiles, we keep this local derived state
  const [clients, setClients] = useState([]);
  
  const setProfiles = (updater) => setGlobalData(prev => ({ ...prev, clients: typeof updater === 'function' ? updater(prev.clients) : updater }));
  const [clientDisplayLimit, setClientDisplayLimit] = useState(50);
  const [selectedClientPhone, setSelectedClientPhone] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const settings = globalData.settings || null;
  const setSettings = (updater) => setGlobalData(prev => ({ ...prev, settings: typeof updater === 'function' ? updater(prev.settings) : updater }));
  const [isSendingWhatsapp, setIsSendingWhatsapp] = useState(false);
  const [whatsappLogs, setWhatsappLogs] = useState([]);
  const [isDemoMode, setIsDemoMode] = useState(!db);
  const [loading, setLoading] = useState(false);

  // Modal de Novo Cliente
  const [showAddModal, setShowAddModal] = useState(false);

  // Modal de Importação CSV
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importErrors, setImportErrors] = useState([]);
  const [importSummary, setImportSummary] = useState('');
  const importFileRef = useRef(null);
  const [newClient, setNewClient] = useState({
    name: '',
    phone: '',
    email: '',
    curvatura: '3A',
    porosidade: 'Média',
    elasticidade: 'Normal',
    quimicas: 'Nenhuma',
    produtosRecomendados: '',
    observacoes: '',
    sexo: 'Feminino',
    birthdate: ''
  });

  // Ficha técnica para o cliente selecionado
  const [hairProfile, setHairProfile] = useState({
    curvatura: '3A',
    porosidade: 'Média',
    elasticidade: 'Normal',
    quimicas: 'Nenhuma',
    produtosRecomendados: '',
    observacoes: '',
    sexo: 'Feminino',
    birthdate: ''
  });

  const [saving, setSaving] = useState(false);
  const [savingNew, setSavingNew] = useState(false);

  // States do Relatório de Frequência
  const [absenceWindow, setAbsenceWindow] = useState('todos'); // 'todos', '30d', '60d', 'adormecidos', 'nunca'
  const [genderFilter, setGenderFilter] = useState('todos'); // 'todos', 'Feminino', 'Masculino', 'Outro'
  const [serviceFilter, setServiceFilter] = useState('todos'); // 'todos' ou nome do serviço
  const [checkedClients, setCheckedClients] = useState({}); // { [phone]: boolean }
  const [selectedCampaignPhones, setSelectedCampaignPhones] = useState([]); // array de fones para campanha manual

  // States de Marketing CRM
  const [marketingTarget, setMarketingTarget] = useState('inativos_30'); // 'todos', 'inativos_30', 'inativos_60', 'nunca_visitaram'
  const [marketingChannel, setMarketingChannel] = useState('whatsapp'); // 'whatsapp', 'email'
  const [campaignMessage, setCampaignMessage] = useState(
    'Olá {nome}! Já faz um tempinho que você não passa aqui no Studio do Jon. Seus cachos estão precisando de um cuidado especial? Seu último serviço foi {ultimo_servico}. Vamos agendar uma visita? Use o link para marcar: ojonquecortou.com.br'
  );

  const [emailCampaignSubject, setEmailCampaignSubject] = useState('Saudade de você no Studio do Jon! ❤️');
  const [emailCampaignBody, setEmailCampaignBody] = useState(
    `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
  <h2 style="color: #b05a2e;">Olá, {nome}!</h2>
  <p>Faz um tempo que você não nos visita para cuidar dos seus cachos. Seu último procedimento foi <strong>{ultimo_servico}</strong>.</p>
  <p>Que tal agendar um horário com o Jon esta semana e manter a definição e a saúde dos fios em dia?</p>
  <div style="margin: 24px 0; text-align: center;">
    <a href="https://www.ojonquecortou.com.br/agendar" style="background-color: #b05a2e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Agendar Agora no Site</a>
  </div>
  <hr style="border: none; border-top: 1px solid #eaeaea; margin: 24px 0;" />
  <p style="font-size: 12px; color: #888888; text-align: center;">Studio do Jon • Rua Jacuí, 312 - Floresta, Belo Horizonte - MG</p>
</div>`
  );
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailLogs, setEmailLogs] = useState([]);
  
  // SEED Data em caso de offline/demo
  const SEED_PROFILES = [
    {
      phone: '31988887777',
      name: 'Ana Souza',
      email: 'ana@email.com',
      curvatura: '3B',
      porosidade: 'Alta',
      elasticidade: 'Fraca',
      quimicas: 'Luzes loiras há 6 meses',
      produtosRecomendados: 'Máscara Reconstrutora de Queratina, Óleo de Argan',
      observacoes: 'Sensibilidade no couro cabeludo após descoloração.',
      sexo: 'Feminino'
    },
    {
      phone: '31977776666',
      name: 'Carla Lima',
      email: 'carla@email.com',
      curvatura: '3C',
      porosidade: 'Média',
      elasticidade: 'Normal',
      quimicas: 'Nenhuma',
      produtosRecomendados: 'Creme de Pentear Nutritivo, Leave-in modelador',
      observacoes: 'Prefere muito volume e corte em camadas arredondadas.',
      sexo: 'Feminino'
    },
    {
      phone: '31900001111',
      name: 'Mariana Costa',
      email: 'mariana@email.com',
      curvatura: '4A',
      porosidade: 'Média',
      elasticidade: 'Normal',
      quimicas: 'Nenhuma',
      produtosRecomendados: 'Manteiga de Karité pura, Co-wash nutritivo',
      observacoes: 'Fez transição capilar recentemente. Foco em cronograma de nutrição.',
      sexo: 'Feminino'
    },
    {
      phone: '31911112222',
      name: 'Bruno Silva',
      email: 'bruno@email.com',
      curvatura: '2A',
      porosidade: 'Baixa',
      elasticidade: 'Normal',
      quimicas: 'Nenhuma',
      produtosRecomendados: 'Gel modelador leve',
      observacoes: 'Corte curto nas laterais, finalização natural.',
      sexo: 'Masculino'
    }
  ];

  const SEED_BOOKINGS = [
    {
      id: 'demo-1',
      clientName: 'Ana Souza',
      clientPhone: '31988887777',
      clientEmail: 'ana@email.com',
      service: { name: 'Corte com o Jon', price: 190 },
      date: new Date(new Date().setDate(new Date().getDate() - 12)).toISOString().split('T')[0], // 12 dias atrás
      time: '09:00',
      status: 'finalizado',
      hairType: '3B'
    },
    {
      id: 'demo-2',
      clientName: 'Carla Lima',
      clientPhone: '31977776666',
      clientEmail: 'carla@email.com',
      service: { name: 'Combo Corte + Tratamento', price: 320 },
      date: new Date(new Date().setDate(new Date().getDate() - 45)).toISOString().split('T')[0], // 45 dias atrás
      time: '13:00',
      status: 'finalizado',
      hairType: '3C'
    },
    {
      id: 'demo-3',
      clientName: 'Bruno Silva',
      clientPhone: '31911112222',
      clientEmail: 'bruno@email.com',
      service: { name: 'Corte com o Jon', price: 190 },
      date: new Date(new Date().setDate(new Date().getDate() - 15)).toISOString().split('T')[0], // 15 dias atrás
      time: '14:30',
      status: 'finalizado',
      hairType: '2A'
    }
  ];

  // 1. Usa os dados já injetados via globalData (AdminLayout). Não precisa mais criar um Snapshot local, evitando lentidão.
  useEffect(() => {
    if (!db) {
      setIsDemoMode(true);
    }
  }, []);

  // 2. Agrupa e mescla perfis de clientes e agendamentos sempre que alterados
  useEffect(() => {
    groupClients(bookings, profiles);
  }, [bookings, profiles]);

  const groupClients = (appts, loadedProfiles) => {
    const clientsMap = {};

    // Insere todos os cadastrados via Ficha/Manual
    loadedProfiles.forEach((prof) => {
      clientsMap[prof.phone] = {
        name: prof.name || 'Sem nome',
        phone: prof.phone,
        email: prof.email || 'Não informado',
        hairType: prof.curvatura || 'Desconhecido',
        lastVisit: 'Nunca visitou',
        lastServiceName: 'Nenhum',
        sexo: prof.sexo || 'Feminino'
      };
    });

    // Mescla com os dados vindos dos agendamentos
    appts.forEach((appt) => {
      const phone = appt.clientPhone;
      if (!phone) return;

      const dateStr = appt.date;
      const serviceName = appt.service?.name || appt.serviceName || 'Serviço';

      if (!clientsMap[phone]) {
        clientsMap[phone] = {
          name: appt.clientName || 'Cliente sem nome',
          phone: phone,
          email: appt.clientEmail || 'Não informado',
          hairType: appt.hairType || 'Desconhecido',
          lastVisit: dateStr || 'Nunca visitou',
          lastServiceName: serviceName,
          sexo: appt.sexo || 'Feminino'
        };
      } else {
        // Atualiza para a visita mais recente
        if (dateStr && (clientsMap[phone].lastVisit === 'Nunca visitou' || new Date(dateStr) > new Date(clientsMap[phone].lastVisit))) {
          clientsMap[phone].lastVisit = dateStr;
          clientsMap[phone].lastServiceName = serviceName;
        }
        if (appt.sexo && clientsMap[phone].sexo === 'Feminino') {
          clientsMap[phone].sexo = appt.sexo;
        }
      }
    });

    const parsedClients = Object.values(clientsMap);
    setClients(parsedClients);

    // Se nenhum cliente estiver selecionado e houver lista, seleciona o primeiro
    if (parsedClients.length > 0 && !selectedClientPhone) {
      setSelectedClientPhone(parsedClients[0].phone);
    }
  };

  // Carrega ficha capilar específica do Firestore para o cliente selecionado
  useEffect(() => {
    if (!selectedClientPhone) return;
    const clientProf = profiles.find(p => p.phone === selectedClientPhone);
    
    if (clientProf) {
      setHairProfile({
        curvatura: clientProf.curvatura || '3A',
        porosidade: clientProf.porosidade || 'Média',
        elasticidade: clientProf.elasticidade || 'Normal',
        quimicas: clientProf.quimicas || 'Nenhuma',
        produtosRecomendados: clientProf.produtosRecomendados || '',
        observacoes: clientProf.observacoes || '',
        sexo: clientProf.sexo || 'Feminino',
        birthdate: clientProf.birthdate || ''
      });
    } else {
      // Se não tem perfil salvo ainda, herda o tipo do agendamento
      const clientObj = clients.find(c => c.phone === selectedClientPhone);
      setHairProfile({
        curvatura: clientObj?.hairType || '3A',
        porosidade: 'Média',
        elasticidade: 'Normal',
        quimicas: 'Nenhuma',
        produtosRecomendados: '',
        observacoes: '',
        sexo: clientObj?.sexo || 'Feminino',
        birthdate: ''
      });
    }
  }, [selectedClientPhone, profiles, clients]);

  // Salva ficha técnica do cliente selecionado
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

    const clientObj = clients.find(c => c.phone === selectedClientPhone);
    const updatedProfile = {
      ...hairProfile,
      name: clientObj?.name || 'Cliente',
      email: clientObj?.email || '',
      phone: selectedClientPhone
    };

    try {
      if (isDemoMode || !db) {
        // Modo local
        const updatedList = profiles.filter(p => p.phone !== selectedClientPhone);
        updatedList.push(updatedProfile);
        setProfiles(updatedList);
        localStorage.setItem('demo_client_profiles', JSON.stringify(updatedList));
        alert('Ficha capilar atualizada localmente.');
      } else {
        const docRef = doc(db, 'client_profiles', selectedClientPhone);
        await setDoc(docRef, updatedProfile);
        alert('Ficha capilar salva com sucesso no Firestore!');
      }
    } catch (err) {
      console.error('Erro ao salvar ficha:', err);
      alert('Erro de conexão ao salvar ficha técnica.');
    } finally {
      setSaving(false);
    }
  };

  // Cadastra um novo cliente manualmente
  const handleCreateClient = async (e) => {
    e.preventDefault();
    if (!newClient.name || !newClient.phone) {
      alert('Nome e Telefone são campos obrigatórios.');
      return;
    }
    setSavingNew(true);

    const cleanPhone = newClient.phone.replace(/\D/g, '');
    const profilePayload = {
      name: newClient.name,
      phone: cleanPhone,
      email: newClient.email || 'Não informado',
      curvatura: newClient.curvatura,
      porosidade: newClient.porosidade,
      elasticidade: newClient.elasticidade,
      quimicas: newClient.quimicas || 'Nenhuma',
      produtosRecomendados: newClient.produtosRecomendados || '',
      observacoes: newClient.observacoes || '',
      sexo: newClient.sexo || 'Feminino',
      birthdate: newClient.birthdate || ''
    };

    try {
      if (isDemoMode || !db) {
        const updatedList = [...profiles, profilePayload];
        setProfiles(updatedList);
        localStorage.setItem('demo_client_profiles', JSON.stringify(updatedList));
      } else {
        const docRef = doc(db, 'client_profiles', cleanPhone);
        await setDoc(docRef, profilePayload);
      }

      alert('Cliente cadastrado com sucesso!');
      setSelectedClientPhone(cleanPhone);
      setShowAddModal(false);
      // Reset form
      setNewClient({
        name: '',
        phone: '',
        email: '',
        curvatura: '3A',
        porosidade: 'Média',
        elasticidade: 'Normal',
        quimicas: 'Nenhuma',
        produtosRecomendados: '',
        observacoes: '',
        sexo: 'Feminino',
        birthdate: ''
      });
    } catch (err) {
      console.error('Erro ao cadastrar cliente:', err);
      alert('Não foi possível salvar o cadastro.');
    } finally {
      setSavingNew(false);
    }
  };

  // Importação em massa de clientes via CSV
  const handleImportClients = async (e) => {
    e.preventDefault();
    if (!importFile) {
      alert('Selecione um arquivo CSV.');
      return;
    }
    setImportProgress(5);
    setImportErrors([]);
    setImportSummary('');

    parseClientCSV(importFile, async ({ clients: parsed, errors: validationErrors }) => {
      setImportErrors(validationErrors);

      if (parsed.length === 0) {
        setImportProgress(0);
        setImportSummary('Nenhum registro válido encontrado no arquivo.');
        return;
      }

      setImportProgress(20);

      let created = 0;
      let updated = 0;
      const total = parsed.length;

      try {
        if (isDemoMode || !db) {
          // Demo mode: save to localStorage
          const currentProfiles = [...profiles];
          for (const c of parsed) {
            const idx = currentProfiles.findIndex(p => p.phone === c.phone);
            if (idx >= 0) {
              if (replaceExisting) {
                currentProfiles[idx] = { ...currentProfiles[idx], ...c };
                updated++;
              }
            } else {
              currentProfiles.push(c);
              created++;
            }
            setImportProgress(prev => Math.min(prev + Math.floor(60 / total), 90));
          }
          setProfiles(currentProfiles);
          localStorage.setItem('demo_client_profiles', JSON.stringify(currentProfiles));
        } else {
          // Firestore: batch writes in chunks of 50 to avoid overloading and slow network drops
          const CHUNK = 50;
          const totalChunks = Math.ceil(parsed.length / CHUNK);
          
          for (let i = 0; i < parsed.length; i += CHUNK) {
            const chunkIndex = Math.floor(i / CHUNK) + 1;
            setImportSummary(`Processando lote ${chunkIndex} de ${totalChunks}... (Aguarde, pode demorar alguns segundos)`);
            
            const chunk = parsed.slice(i, i + CHUNK);
            const batch = writeBatch(db);
            for (const c of chunk) {
              const docRef = doc(db, 'client_profiles', c.phone);
              if (replaceExisting) {
                batch.set(docRef, c, { merge: true });
                updated++;
              } else {
                batch.set(docRef, c, { merge: false });
                created++;
              }
            }
            
            // Timeout de 60 segundos por lote para conexões lentas ou long-polling
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error(`O lote ${chunkIndex} demorou mais de 60s para responder. Verifique sua conexão.`)), 60000));
            await Promise.race([batch.commit(), timeoutPromise]);
            
            setImportProgress(prev => Math.min(prev + Math.floor(80 / totalChunks), 95));
          }
        }

        setImportProgress(100);
        setImportSummary(
          `✅ Importação concluída: ${created} cliente(s) criado(s)${updated > 0 ? `, ${updated} atualizado(s)` : ''}.${validationErrors.length > 0 ? ` ${validationErrors.length} linha(s) inválida(s).` : ''}`
        );

        // Reset file input
        setImportFile(null);
        if (importFileRef.current) importFileRef.current.value = '';

      } catch (err) {
        console.error('Erro na importação:', err);
        setImportErrors(prev => [...prev, `Erro interno ao gravar dados: ${err.message}`]);
        setImportProgress(0);
      }
    });
  };

  // Cálculo de dias de ausência para relatórios
  const getDaysAbsent = (lastVisitDate) => {
    if (lastVisitDate === 'Nunca visitou' || !lastVisitDate) return Infinity;
    const diffTime = Math.abs(new Date() - new Date(lastVisitDate));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Divide clientes em categorias de frequência (Ativo, Inativo 30, Inativo 60, Nunca)
  const getClientCRMStatus = (client) => {
    const days = getDaysAbsent(client.lastVisit);
    if (days === Infinity) return { code: 'nunca', text: 'Sem Visitas', color: '#8A7866' };
    if (days < 30) return { code: 'ativo', text: 'Ativo (<30d)', color: '#2f855a' };
    if (days >= 30 && days <= 60) return { code: 'inativo_30', text: 'Ausente (30-60d)', color: '#b05a2e' };
    return { code: 'inativo_60', text: 'Adormecido (>60d)', color: '#c53030' };
  };

  // Clientes filtrados na barra de pesquisa
  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  // Clientes filtrados por janela de tempo, gênero e serviço no Relatório
  const reportClients = clients.filter(c => {
    const days = getDaysAbsent(c.lastVisit);
    
    // 1. Filtro de Janela de Ausência
    let matchesWindow = true;
    if (absenceWindow === '30d') matchesWindow = days < 30;
    else if (absenceWindow === '60d') matchesWindow = days >= 30 && days <= 60;
    else if (absenceWindow === 'adormecidos') matchesWindow = days > 60 && days !== Infinity;
    else if (absenceWindow === 'nunca') matchesWindow = days === Infinity;

    // 2. Filtro de Gênero
    let matchesGender = true;
    if (genderFilter !== 'todos') {
      matchesGender = (c.sexo || 'Feminino') === genderFilter;
    }

    // 3. Filtro de Serviço Executado
    let matchesService = true;
    if (serviceFilter !== 'todos') {
      matchesService = c.lastServiceName === serviceFilter;
    }

    return matchesWindow && matchesGender && matchesService;
  });

  // Clientes alvos da campanha de marketing
  const marketingTargetsList = clients.filter(c => {
    const days = getDaysAbsent(c.lastVisit);
    if (marketingTarget === 'todos') return true;
    if (marketingTarget === 'inativos_30') return days >= 30 && days <= 60;
    if (marketingTarget === 'inativos_60') return days > 60 && days !== Infinity;
    if (marketingTarget === 'nunca_visitaram') return days === Infinity;
    if (marketingTarget === 'selecionados') return selectedCampaignPhones.includes(c.phone);
    return false;
  });

  // Exportar dados como CSV UTF-8 com BOM
  const handleExportCSV = () => {
    let csvContent = 'Nome;Telefone;E-mail;Gênero;Última Visita;Último Serviço Realizado\n';
    
    reportClients.forEach(c => {
      const lastVisitStr = c.lastVisit === 'Nunca visitou' ? 'Nunca visitou' : new Date(c.lastVisit).toLocaleDateString('pt-BR');
      const genderStr = c.sexo || 'Feminino';
      const serviceStr = c.lastServiceName || 'Nenhum';
      csvContent += `"${c.name}";"${c.phone}";"${c.email}";"${genderStr}";"${lastVisitStr}";"${serviceStr}"\n`;
    });

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_clientes_${absenceWindow}_${genderFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Simular Envio de Campanha de E-mail via Resend
  const handleSimulateEmailCampaign = () => {
    if (marketingTargetsList.length === 0) {
      alert('Nenhum cliente no segmento escolhido para disparar.');
      return;
    }
    setIsSendingEmail(true);
    setEmailLogs([]);
    
    let currentIdx = 0;
    const targets = [...marketingTargetsList];
    const logTime = () => new Date().toLocaleTimeString('pt-BR');
    
    setEmailLogs(prev => [...prev, `[${logTime()}] 🚀 Iniciando campanha de e-mail: "${emailCampaignSubject}"`]);
    setEmailLogs(prev => [...prev, `[${logTime()}] 📬 Total de destinatários: ${targets.length}`]);
    setEmailLogs(prev => [...prev, `[${logTime()}] 🔗 Endpoint: POST https://api.resend.com/emails`]);
    
    const sendNext = () => {
      if (currentIdx >= targets.length) {
        setEmailLogs(prev => [...prev, `[${logTime()}] ✅ Campanha finalizada com sucesso! Todos os e-mails foram entregues via Resend.`]);
        setIsSendingEmail(false);
        return;
      }
      
      const client = targets[currentIdx];
      const emailBodyCompiled = emailCampaignBody
        .replace(/{nome}/g, client.name)
        .replace(/{ultimo_servico}/g, client.lastServiceName || 'serviço')
        .replace(/{dias_ausente}/g, getDaysAbsent(client.lastVisit) === Infinity ? 'algum' : getDaysAbsent(client.lastVisit));

      setEmailLogs(prev => [...prev, `[${logTime()}] 🔄 Enviando para ${client.name} (${client.email || 'sem e-mail'})...`]);
      
      setTimeout(() => {
        if (!client.email || client.email === 'Não informado' || !client.email.includes('@')) {
          setEmailLogs(prev => [...prev, `[${logTime()}] ⚠️ Pulado: E-mail inválido ou não cadastrado`]);
        } else {
          setEmailLogs(prev => [...prev, `[${logTime()}] 📧 Sucesso: enviado para ${client.email} (ID: re_${Math.random().toString(36).substr(2, 9)})`]);
        }
        currentIdx++;
        sendNext();
      }, 700);
    };
    
    setTimeout(sendNext, 800);
  };

  // Disparar Campanha de WhatsApp em Lote via Gateway
  const handleSendWhatsappCampaign = () => {
    if (marketingTargetsList.length === 0) {
      alert('Nenhum cliente no segmento escolhido para disparar.');
      return;
    }

    const gateway = settings?.waReminderGateway || 'zapi';
    const isGatewayConfigured = 
      (gateway === 'zapi' && settings?.zApiInstanceId && settings?.zApiToken) ||
      (gateway === 'evolution' && settings?.evolutionApiUrl && settings?.evolutionApiKey && settings?.evolutionInstanceName) ||
      (gateway === 'custom' && settings?.customWebhookUrl);

    if (!settings?.waReminderEnabled || !isGatewayConfigured) {
      alert('Por favor, ative e configure suas credenciais de integração do WhatsApp na aba "Configurações" antes de realizar disparos em lote.');
      return;
    }

    if (!confirm(`Deseja iniciar o envio automático de mensagens para ${marketingTargetsList.length} clientes via ${gateway.toUpperCase()}?`)) {
      return;
    }

    setIsSendingWhatsapp(true);
    setWhatsappLogs([]);

    let currentIdx = 0;
    const targets = [...marketingTargetsList];
    const logTime = () => new Date().toLocaleTimeString('pt-BR');

    setWhatsappLogs(prev => [...prev, `[${logTime()}] 🚀 Iniciando campanha em lote via ${gateway.toUpperCase()}...`]);
    setWhatsappLogs(prev => [...prev, `[${logTime()}] 👥 Total de destinatários: ${targets.length}`]);

    const sendNext = async () => {
      if (currentIdx >= targets.length) {
        setWhatsappLogs(prev => [...prev, `[${logTime()}] 🎉 Campanha finalizada com sucesso! Todos os disparos concluídos.`]);
        setIsSendingWhatsapp(false);
        return;
      }

      const client = targets[currentIdx];
      const days = getDaysAbsent(client.lastVisit);
      const daysText = days === Infinity ? 'algum' : days;
      const msgText = campaignMessage
        .replace(/{nome}/g, client.name)
        .replace(/{ultimo_servico}/g, client.lastServiceName || 'serviço')
        .replace(/{dias_ausente}/g, daysText);

      const cleanPhone = (client.phone || '').replace(/\D/g, '');
      if (!cleanPhone || cleanPhone.length < 10) {
        setWhatsappLogs(prev => [...prev, `[${logTime()}] ⚠️ Pulado: ${client.name} (Telefone inválido)`]);
        currentIdx++;
        setTimeout(sendNext, 400);
        return;
      }

      const phoneWithDDI = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
      setWhatsappLogs(prev => [...prev, `[${logTime()}] 🔄 Enviando para ${client.name}...`]);

      let url = '';
      let headers = { 'Content-Type': 'application/json' };
      let body = {};

      if (gateway === 'zapi') {
        url = `https://api.z-api.io/instances/${settings.zApiInstanceId}/token/${settings.zApiToken}/send-text`;
        body = {
          phone: phoneWithDDI,
          message: msgText
        };
      } else if (gateway === 'evolution') {
        url = `${settings.evolutionApiUrl.replace(/\/$/, '')}/message/sendText/${settings.evolutionInstanceName}`;
        headers['apikey'] = settings.evolutionApiKey;
        body = {
          number: phoneWithDDI,
          text: msgText
        };
      } else if (gateway === 'custom') {
        url = settings.customWebhookUrl;
        body = {
          phone: phoneWithDDI,
          message: msgText,
          clientName: client.name,
          daysAbsent: daysText,
          lastService: client.lastServiceName
        };
      }

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body)
        });

        if (response.ok) {
          setWhatsappLogs(prev => [...prev, `[${logTime()}] ✅ Sucesso: enviado para ${client.name}`]);
        } else {
          throw new Error('Falha no gateway');
        }
      } catch (err) {
        setWhatsappLogs(prev => [...prev, `[${logTime()}] ❌ Falha no envio para ${client.name}`]);
      }

      currentIdx++;
      setTimeout(sendNext, 1200); // 1.2s delay para evitar ban do whats
    };

    setTimeout(sendNext, 500);
  };

  // Gera o link para WhatsApp de campanha individual
  const getCampaignMessageLink = (client) => {
    const days = getDaysAbsent(client.lastVisit);
    const daysText = days === Infinity ? 'algum' : days;
    const cleanMessage = campaignMessage
      .replace(/{nome}/g, client.name)
      .replace(/{ultimo_servico}/g, client.lastServiceName || 'serviço')
      .replace(/{dias_ausente}/g, daysText);
      
    return `https://wa.me/55${client.phone}?text=${encodeURIComponent(cleanMessage)}`;
  };

  const selectedClient = clients.find(c => c.phone === selectedClientPhone);

  const clientVisits = bookings
    .filter(b => b.clientPhone === selectedClientPhone)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const uniqueServices = Array.from(
    new Set(bookings.map(b => b.service?.name || b.serviceName).filter(Boolean))
  );

  return (
    <div className="crm-panel">
      {/* Sub-Header com Abas CRM */}
      <div className="crm-nav-tabs">
        <button 
          className={`crm-tab-btn ${activeTab === 'fichas' ? 'active' : ''}`}
          onClick={() => setActiveTab('fichas')}
        >
          <UserCheck size={16} /> Fichas & Prontuários
        </button>
        <button 
          className={`crm-tab-btn ${activeTab === 'relatorios' ? 'active' : ''}`}
          onClick={() => setActiveTab('relatorios')}
        >
          <Calendar size={16} /> Relatório de Visitas
        </button>
        <button 
          className={`crm-tab-btn ${activeTab === 'marketing' ? 'active' : ''}`}
          onClick={() => setActiveTab('marketing')}
        >
          <Sparkles size={16} /> Central de Campanhas
        </button>

        {isDemoMode && (
          <span className="demo-badge-inline">
            Modo Demo (Offline)
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>
          Carregando base de relacionamento...
        </div>
      ) : (
        <div className="crm-body-content">
          
          {/* ==================== ABA 1: FICHAS E PRONTUÁRIOS ==================== */}
          {activeTab === 'fichas' && (
            <div className="clients-layout">
              {/* Painel Lateral: Lista de Clientes */}
              <div className="clients-list-pane">
                <div className="pane-search-row">
                  <div className="search-wrap">
                    <Search size={14} className="search-icon" />
                    <input 
                      type="text" 
                      placeholder="Pesquisar..." 
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button 
                    className="btn btn-primary btn-icon-only"
                    title="Cadastrar Cliente"
                    onClick={() => setShowAddModal(true)}
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    className="btn btn-outline btn-icon-only"
                    title="Importar Clientes (CSV)"
                    onClick={() => { setShowImportModal(true); setImportProgress(0); setImportErrors([]); setImportSummary(''); }}
                  >
                    <Upload size={16} />
                  </button>
                </div>

                <div className="clients-scroll-list">
                  {filteredClients.length === 0 ? (
                    <p className="no-data-msg">Nenhuma cliente encontrada.</p>
                  ) : (
                    filteredClients.slice(0, clientDisplayLimit).map(c => {
                      const status = getClientCRMStatus(c);
                      return (
                        <div 
                          key={c.phone} 
                          className={`client-list-item ${selectedClientPhone === c.phone ? 'selected' : ''}`}
                          onClick={() => setSelectedClientPhone(c.phone)}
                        >
                          <div className="client-item-header">
                            <h4>{c.name}</h4>
                            <span className="crm-badge" style={{ background: status.color + '18', color: status.color, border: `1px solid ${status.color}33` }}>
                              {status.text}
                            </span>
                          </div>
                          <span className="client-sub">WhatsApp: {c.phone}</span>
                          <span className="client-sub">
                            Última visita: {c.lastVisit === 'Nunca visitou' ? 'Sem visitas' : new Date(c.lastVisit).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      );
                    })
                  )}
                  {filteredClients.length > clientDisplayLimit && (
                    <div className="client-load-more" style={{ textAlign: 'center', margin: '20px 0' }}>
                      <button className="btn btn-outline" onClick={() => setClientDisplayLimit(prev => prev + 50)}>
                        Carregar mais ({filteredClients.length - clientDisplayLimit} restantes)
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Detalhes e Ficha Capilar */}
              <div className="client-detail-pane">
                {!selectedClient ? (
                  <div className="no-client-selected">
                    <Search size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
                    <h3>Nenhum cliente selecionado</h3>
                    <p>Selecione uma cliente na lista para exibir sua ficha capilar e visitas.</p>
                  </div>
                ) : (
                  <div className="detail-scrollable">
                    <header className="detail-header-card">
                      <div className="header-info">
                        <h2>{selectedClient.name}</h2>
                        <span className="email-phone-sub">
                          <Phone size={12} /> {selectedClient.phone} | <Mail size={12} /> {selectedClient.email}
                        </span>
                      </div>
                      <div className="badge-frequency">
                        <strong>Frequência Capilar:</strong>{' '}
                        <span style={{ color: getClientCRMStatus(selectedClient).color, fontWeight: 'bold' }}>
                          {getClientCRMStatus(selectedClient).text}
                        </span>
                      </div>
                    </header>

                    {/* Ficha Capilar do Studio do Jon */}
                    <form onSubmit={handleSaveProfile} className="hair-profile-form">
                      <h3>Ficha Capilar Técnica & Análise</h3>
                      
                      <div className="form-grid-three">
                        <div className="form-group-sleek">
                          <label>Curvatura de Cacho</label>
                          <select 
                            value={hairProfile.curvatura}
                            onChange={e => setHairProfile(prev => ({ ...prev, curvatura: e.target.value }))}
                          >
                            <option value="2A">2A (Ondulado leve)</option>
                            <option value="2B">2B (Ondulado médio)</option>
                            <option value="2C">2C (Ondulado forte)</option>
                            <option value="3A">3A (Cacho solto)</option>
                            <option value="3B">3B (Cacho espiral)</option>
                            <option value="3C">3C (Cacho fechado)</option>
                            <option value="4A">4A (Crespo definido)</option>
                            <option value="4B">4B (Crespo ziguezague)</option>
                            <option value="4C">4C (Crespo muito cerrado)</option>
                            <option value="Não Identificado">Não identificado</option>
                          </select>
                        </div>

                        <div className="form-group-sleek">
                          <label>Porosidade Capilar</label>
                          <select 
                            value={hairProfile.porosidade}
                            onChange={e => setHairProfile(prev => ({ ...prev, porosidade: e.target.value }))}
                          >
                            <option value="Baixa">Baixa (Cutículas seladas)</option>
                            <option value="Média">Média (Fios saudáveis)</option>
                            <option value="Alta">Alta (Ressecado/Pós-química)</option>
                          </select>
                        </div>

                        <div className="form-group-sleek">
                          <label>Elasticidade</label>
                          <select 
                            value={hairProfile.elasticidade}
                            onChange={e => setHairProfile(prev => ({ ...prev, elasticidade: e.target.value }))}
                          >
                            <option value="Normal">Normal (Fibra com força)</option>
                            <option value="Fraca">Fraca/Elástica (Fio frágil)</option>
                            <option value="Rígida">Rígida (Excesso queratina)</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-group-sleek">
                        <label>Sexo / Gênero</label>
                        <select 
                          value={hairProfile.sexo || 'Feminino'}
                          onChange={e => setHairProfile(prev => ({ ...prev, sexo: e.target.value }))}
                          style={{ maxWidth: '200px' }}
                        >
                          <option value="Feminino">Feminino</option>
                          <option value="Masculino">Masculino</option>
                          <option value="Outro">Outro / Não informado</option>
                        </select>
                      </div>

                      <div className="form-group-sleek">
                        <label>Data de Nascimento</label>
                        <input 
                          type="date"
                          value={hairProfile.birthdate || ''}
                          onChange={e => setHairProfile(prev => ({ ...prev, birthdate: e.target.value }))}
                          style={{ maxWidth: '200px' }}
                        />
                      </div>

                      <div className="form-group-sleek">
                        <label>Histórico Químico Anterior</label>
                        <input 
                          type="text" 
                          placeholder="Progressivas, colorações, alisamentos anteriores..."
                          value={hairProfile.quimicas}
                          onChange={e => setHairProfile(prev => ({ ...prev, quimicas: e.target.value }))}
                        />
                      </div>

                      <div className="form-group-sleek">
                        <label>Produtos Recomendados para Home Care</label>
                        <input 
                          type="text" 
                          placeholder="Modeladores, óleos ou tratamentos indicados pelo Jon..."
                          value={hairProfile.produtosRecomendados}
                          onChange={e => setHairProfile(prev => ({ ...prev, produtosRecomendados: e.target.value }))}
                        />
                      </div>

                      <div className="form-group-sleek">
                        <label>Observações & Notas de Corte</label>
                        <textarea 
                          rows="3" 
                          placeholder="Estilizações preferidas, caimento em camadas, formato do rosto..."
                          value={hairProfile.observacoes}
                          onChange={e => setHairProfile(prev => ({ ...prev, observacoes: e.target.value }))}
                        ></textarea>
                      </div>

                      <div className="btn-save-wrap">
                        <button type="submit" className="btn btn-accent btn-small" disabled={saving}>
                          <Save size={14} /> {saving ? 'Salvando...' : 'Salvar Ficha Técnica'}
                        </button>
                      </div>
                    </form>

                    {/* Histórico do Cliente */}
                    <div className="detail-visits-history">
                      <h3>Visitas Anteriores ({clientVisits.length})</h3>
                      {clientVisits.length === 0 ? (
                        <p className="no-visits-txt">Sem visitas cadastradas no salão para esta cliente.</p>
                      ) : (
                        <div className="visits-mini-timeline">
                          {clientVisits.map(v => (
                            <div key={v.id} className="visit-mini-card">
                              <div className="card-top-row">
                                <span className="visit-date">
                                  <Calendar size={12} style={{ marginRight: 4 }} />{' '}
                                  {new Date(v.date).toLocaleDateString('pt-BR')} às {v.time}
                                </span>
                                <span className={`status-pill ${v.status}`}>{v.status}</span>
                              </div>
                              <div className="visit-detail-service">
                                {v.service?.name || v.serviceName}{' '}
                                <span className="price-tag">
                                  (R$ {Number(v.service?.price || v.servicePrice || 0).toFixed(2)})
                                </span>
                              </div>
                              {v.notes && <p className="visit-note-snippet">Nota: "{v.notes}"</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== ABA 2: RELATÓRIO DE AUSÊNCIA (CRM) ==================== */}
          {activeTab === 'relatorios' && (
            <div className="reports-tab-view">
              <header className="report-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3>Janela de Ausência & Segmentação para Campanhas</h3>
                  <p>Monitore suas clientes com base no tempo de ausência, sexo ou último serviço realizado para gerar campanhas certeiras.</p>
                </div>
              </header>

              {/* Filtros da Janela */}
              <div className="absence-window-selectors">
                <button className={`filter-badge-btn ${absenceWindow === 'todos' ? 'active' : ''}`} onClick={() => setAbsenceWindow('todos')}>
                  Todas ({clients.length})
                </button>
                <button className={`filter-badge-btn active-clients ${absenceWindow === '30d' ? 'active' : ''}`} onClick={() => setAbsenceWindow('30d')}>
                  Ativas - Menos de 30 dias ({clients.filter(c => getDaysAbsent(c.lastVisit) < 30).length})
                </button>
                <button className={`filter-badge-btn warning-clients ${absenceWindow === '60d' ? 'active' : ''}`} onClick={() => setAbsenceWindow('60d')}>
                  Ausentes - 30 a 60 dias ({clients.filter(c => { const d = getDaysAbsent(c.lastVisit); return d >= 30 && d <= 60; }).length})
                </button>
                <button className={`filter-badge-btn danger-clients ${absenceWindow === 'adormecidos' ? 'active' : ''}`} onClick={() => setAbsenceWindow('adormecidos')}>
                  Adormecidas - Mais de 60 dias ({clients.filter(c => { const d = getDaysAbsent(c.lastVisit); return d > 60 && d !== Infinity; }).length})
                </button>
                <button className={`filter-badge-btn neutral-clients ${absenceWindow === 'nunca' ? 'active' : ''}`} onClick={() => setAbsenceWindow('nunca')}>
                  Sem Agendamentos ({clients.filter(c => getDaysAbsent(c.lastVisit) === Infinity).length})
                </button>
              </div>

              {/* Filtros Avançados de Relatório */}
              <div className="report-filters-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', margin: '16px 0', padding: '16px', background: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--rule)' }}>
                <div className="filter-group-sleek" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 'bold' }}>Sexo / Gênero</label>
                  <select 
                    value={genderFilter} 
                    onChange={e => setGenderFilter(e.target.value)}
                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--rule)', background: 'var(--panel-bg)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                  >
                    <option value="todos">Todos</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Outro">Outro / Não informado</option>
                  </select>
                </div>

                <div className="filter-group-sleek" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 'bold' }}>Último Serviço Realizado</label>
                  <select 
                    value={serviceFilter} 
                    onChange={setServiceFilter}
                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--rule)', background: 'var(--panel-bg)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                  >
                    <option value="todos">Todos os Serviços</option>
                    {uniqueServices.map(srv => (
                      <option key={srv} value={srv}>{srv}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
                  <button 
                    className="btn btn-outline" 
                    onClick={handleExportCSV}
                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                  >
                    Exportar Relatório (CSV)
                  </button>
                  
                  {Object.values(checkedClients).filter(Boolean).length > 0 && (
                    <button 
                      className="btn btn-accent" 
                      onClick={() => {
                        const targetPhones = Object.keys(checkedClients).filter(k => checkedClients[k]);
                        setSelectedCampaignPhones(targetPhones);
                        setMarketingTarget('selecionados');
                        setActiveTab('marketing');
                        alert(`${targetPhones.length} clientes carregados para a campanha.`);
                      }}
                      style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                    >
                      Criar Campanha para Selecionados ({Object.values(checkedClients).filter(Boolean).length})
                    </button>
                  )}
                </div>
              </div>

              {/* Grade de Clientes Segmentada */}
              <div className="report-table-card">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>
                        <input 
                          type="checkbox"
                          checked={reportClients.length > 0 && reportClients.every(c => checkedClients[c.phone])}
                          onChange={e => {
                            const val = e.target.checked;
                            const nextChecked = { ...checkedClients };
                            reportClients.forEach(c => {
                              nextChecked[c.phone] = val;
                            });
                            setCheckedClients(nextChecked);
                          }}
                        />
                      </th>
                      <th>Cliente</th>
                      <th>WhatsApp</th>
                      <th>E-mail</th>
                      <th>Sexo</th>
                      <th>Status Frequência</th>
                      <th>Última Visita</th>
                      <th>Último Serviço</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportClients.length === 0 ? (
                      <tr>
                        <td colSpan="9" style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>
                          Nenhum cliente atende ao critério de segmentação selecionado.
                        </td>
                      </tr>
                    ) : (
                      reportClients.map(c => {
                        const status = getClientCRMStatus(c);
                        const days = getDaysAbsent(c.lastVisit);
                        return (
                          <tr key={c.phone}>
                            <td style={{ textAlign: 'center' }}>
                              <input 
                                type="checkbox"
                                checked={!!checkedClients[c.phone]}
                                onChange={e => {
                                  setCheckedClients(prev => ({
                                    ...prev,
                                    [c.phone]: e.target.checked
                                  }));
                                }}
                              />
                            </td>
                            <td><strong>{c.name}</strong></td>
                            <td>{c.phone}</td>
                            <td>{c.email}</td>
                            <td>{c.sexo || 'Feminino'}</td>
                            <td>
                              <span className="crm-badge" style={{ background: status.color + '18', color: status.color, border: `1px solid ${status.color}33` }}>
                                {status.text}
                              </span>
                            </td>
                            <td>
                              {c.lastVisit === 'Nunca visitou' ? (
                                <span style={{ color: 'var(--muted)' }}>Sem visitas</span>
                              ) : (
                                `${new Date(c.lastVisit).toLocaleDateString('pt-BR')} (${days}d atrás)`
                              )}
                            </td>
                            <td>{c.lastServiceName || '-'}</td>
                            <td>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <a 
                                  href={`https://wa.me/55${c.phone}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="btn btn-outline btn-small"
                                  style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                >
                                  <Phone size={10} /> Conversar
                                </a>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================== ABA 3: CAMPANHAS DE MARKETING ==================== */}
          {activeTab === 'marketing' && (
            <div className="marketing-tab-view">
              <header className="report-header">
                <h3>Campanhas & Automações de Relacionamento (Marketing CRM)</h3>
                <p>Selecione um segmento de clientes, defina o canal de disparo (WhatsApp ou E-mail) e gere links de engajamento ou chamadas de API.</p>
              </header>

              <div className="marketing-layout-grid">
                {/* Painel do Template da Campanha */}
                <div className="marketing-config-card">
                  <h4>Configurar Mensagem</h4>

                  <div className="form-group-sleek">
                    <label>Público Alvo Segmentado</label>
                    <select 
                      value={marketingTarget} 
                      onChange={e => setMarketingTarget(e.target.value)}
                    >
                      <option value="todos">Todos os Clientes ({clients.length})</option>
                      <option value="inativos_30">Clientes Ausentes (30 a 60 dias) ({clients.filter(c => { const d = getDaysAbsent(c.lastVisit); return d >= 30 && d <= 60; }).length})</option>
                      <option value="inativos_60">Clientes Adormecidas (&gt;60 dias) ({clients.filter(c => { const d = getDaysAbsent(c.lastVisit); return d > 60 && d !== Infinity; }).length})</option>
                      <option value="nunca_visitaram">Sem Agendamento no Salão ({clients.filter(c => getDaysAbsent(c.lastVisit) === Infinity).length})</option>
                      {selectedCampaignPhones.length > 0 && (
                        <option value="selecionados">Selecionadas no Relatório ({selectedCampaignPhones.length})</option>
                      )}
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
                        <Mail size={14} style={{ marginRight: 6 }} /> E-mail (Resend API)
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

                      <div className="message-preview-box" style={{ marginTop: '16px' }}>
                        <h5>Pré-visualização do WhatsApp:</h5>
                        <div className="preview-bubble">
                          {campaignMessage
                            .replace(/{nome}/g, 'Mariana Costa')
                            .replace(/{ultimo_servico}/g, 'Corte com o Jon')
                            .replace(/{dias_ausente}/g, '42')}
                        </div>
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

                      <div className="message-preview-box" style={{ marginTop: '16px' }}>
                        <h5>Pré-visualização do HTML:</h5>
                        <div 
                          className="email-html-preview" 
                          style={{ background: 'white', color: 'black', padding: '16px', borderRadius: '6px', border: '1px solid var(--rule)', maxHeight: '200px', overflowY: 'auto' }}
                          dangerouslySetInnerHTML={{ 
                            __html: emailCampaignBody
                              .replace(/{nome}/g, 'Mariana Costa')
                              .replace(/{ultimo_servico}/g, 'Corte com o Jon')
                              .replace(/{dias_ausente}/g, '42') 
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Disparo e Links Gerados */}
                <div className="marketing-targets-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ margin: 0 }}>Alvos da Campanha ({marketingTargetsList.length} Clientes)</h4>
                    
                    {marketingChannel === 'email' && (
                      <button 
                        className="btn btn-accent" 
                        onClick={handleSimulateEmailCampaign}
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
                      {whatsappLogs.map((log, index) => (
                        <div key={index} style={{ marginBottom: '2px' }}>{log}</div>
                      ))}
                    </div>
                  )}

                  {marketingChannel === 'email' && emailLogs.length > 0 && (
                    <div className="email-sim-console" style={{ background: '#1e1e1e', color: '#00ff00', fontFamily: 'monospace', padding: '12px', borderRadius: '6px', fontSize: '0.8rem', height: '160px', overflowY: 'auto', border: '1px solid #333', marginBottom: '16px' }}>
                      {emailLogs.map((log, index) => (
                        <div key={index} style={{ marginBottom: '2px' }}>{log}</div>
                      ))}
                    </div>
                  )}

                  {marketingChannel === 'whatsapp' && (!settings || !settings.waReminderEnabled) && (
                    <div className="api-config-tip" style={{ padding: '12px', background: 'var(--panel-bg)', borderRadius: '6px', borderLeft: '3px solid var(--accent)', marginBottom: '16px' }}>
                      <h5 style={{ margin: '0 0 6px 0', fontSize: '0.85rem' }}>💡 Disparos Automáticos em Lote</h5>
                      <p style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: 0 }}>
                        Deseja fazer disparos 100% automáticos em lote em vez de clicar de um por um? Ative e configure o seu gateway de WhatsApp (Z-API ou Evolution API) na aba <strong>Configurações</strong>.
                      </p>
                    </div>
                  )}

                  {marketingChannel === 'email' && (
                    <div className="api-config-tip" style={{ padding: '12px', background: 'var(--panel-bg)', borderRadius: '6px', borderLeft: '3px solid var(--accent)', marginBottom: '16px' }}>
                      <h5 style={{ margin: '0 0 6px 0', fontSize: '0.85rem' }}>💡 Integração do Desenvolvedor (Resend API)</h5>
                      <p style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: '0 0 8px 0' }}>Para ativar em produção, use esta chamada de API no seu servidor Node.js/Firebase:</p>
                      <pre style={{ fontSize: '0.7rem', background: 'rgba(0,0,0,0.1)', padding: '6px', borderRadius: '4px', overflowX: 'auto', margin: 0, fontFamily: 'monospace' }}>
{`import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'Studio do Jon <no-reply@ojonquecortou.com.br>',
  to: client.email,
  subject: '${emailCampaignSubject}',
  html: emailBody
});`}
                      </pre>
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
          )}

        </div>
      )}

      {/* ==================== MODAL: IMPORTAR CLIENTES CSV ==================== */}
      {showImportModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h2><Upload size={18} style={{ marginRight: 8 }} />Importar Clientes (CSV)</h2>
              <button className="btn-close" onClick={() => setShowImportModal(false)}>×</button>
            </div>

            <form onSubmit={handleImportClients} className="modal-form-scroll">
              <div className="form-group-sleek">
                <label>Arquivo CSV *</label>
                <input
                  ref={importFileRef}
                  type="file"
                  accept=".csv"
                  required
                  onChange={e => { setImportFile(e.target.files[0]); setImportProgress(0); setImportErrors([]); setImportSummary(''); }}
                />
                <small style={{ color: 'var(--muted)', marginTop: 4, display: 'block' }}>
                  Colunas esperadas: <code>nome, telefone, email, ultimaVisita, aniversario</code> &nbsp;|
                  &nbsp;<a href="/client_import_template.csv" download style={{ color: 'var(--accent)' }}>Baixar template</a>
                </small>
              </div>

              <div className="form-group-sleek" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }}>
                <input
                  id="replace-check"
                  type="checkbox"
                  checked={replaceExisting}
                  onChange={e => setReplaceExisting(e.target.checked)}
                  style={{ width: 'auto' }}
                />
                <label htmlFor="replace-check" style={{ marginBottom: 0 }}>Substituir registros existentes (mesmo telefone)</label>
              </div>

              {importProgress > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 4 }}>
                    <span>Progresso</span><span>{importProgress}%</span>
                  </div>
                  <div style={{ background: 'var(--rule)', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${importProgress}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              )}

              {importSummary && (
                <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, background: '#2f855a18', color: '#2f855a', fontSize: '0.88rem', fontWeight: 500 }}>
                  {importSummary}
                </div>
              )}

              {importErrors.length > 0 && (
                <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: '#c5303018', color: '#c53030', fontSize: '0.82rem' }}>
                  <strong>Erros de validação ({importErrors.length}):</strong>
                  <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                    {importErrors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}

              <div className="modal-actions" style={{ marginTop: 20 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowImportModal(false)}>Fechar</button>
                <button type="submit" className="btn btn-accent" disabled={importProgress > 0 && importProgress < 100}>
                  {importProgress > 0 && importProgress < 100 ? 'Importando...' : 'Importar Clientes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: CADASTRO MANUAL DE NOVO CLIENTE ==================== */}
      {showAddModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>Cadastrar Nova Cliente</h2>
              <button className="btn-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleCreateClient} className="modal-form-scroll">
              <div className="form-row">
                <div className="form-group-sleek">
                  <label>Nome Completo *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ex: Maria Oliveira"
                    value={newClient.name}
                    onChange={e => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="form-group-sleek">
                  <label>WhatsApp (com DDD) *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ex: 31988887777"
                    value={newClient.phone}
                    onChange={e => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group-sleek" style={{ flex: 2 }}>
                  <label>E-mail (opcional)</label>
                  <input 
                    type="email" 
                    placeholder="Ex: maria@exemplo.com"
                    value={newClient.email}
                    onChange={e => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="form-group-sleek" style={{ flex: 1 }}>
                  <label>Sexo / Gênero</label>
                  <select 
                    value={newClient.sexo || 'Feminino'}
                    onChange={e => setNewClient(prev => ({ ...prev, sexo: e.target.value }))}
                  >
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Outro">Outro / Não informado</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group-sleek" style={{ flex: 1 }}>
                  <label>Data de Nascimento (opcional)</label>
                  <input 
                    type="date"
                    value={newClient.birthdate || ''}
                    onChange={e => setNewClient(prev => ({ ...prev, birthdate: e.target.value }))}
                  />
                </div>
              </div>

              <h4 style={{ margin: '16px 0 8px', borderBottom: '1px solid var(--rule)', paddingBottom: '4px', fontSize: '0.9rem', color: 'var(--muted)' }}>
                Ficha Técnica Inicial
              </h4>

              <div className="form-grid-three">
                <div className="form-group-sleek">
                  <label>Curvatura</label>
                  <select 
                    value={newClient.curvatura}
                    onChange={e => setNewClient(prev => ({ ...prev, curvatura: e.target.value }))}
                  >
                    <option value="2A">2A</option><option value="2B">2B</option><option value="2C">2C</option>
                    <option value="3A">3A</option><option value="3B">3B</option><option value="3C">3C</option>
                    <option value="4A">4A</option><option value="4B">4B</option><option value="4C">4C</option>
                    <option value="Não Identificado">Não Identificado</option>
                  </select>
                </div>
                <div className="form-group-sleek">
                  <label>Porosidade</label>
                  <select 
                    value={newClient.porosidade}
                    onChange={e => setNewClient(prev => ({ ...prev, porosidade: e.target.value }))}
                  >
                    <option value="Média">Média</option>
                    <option value="Baixa">Baixa</option>
                    <option value="Alta">Alta</option>
                  </select>
                </div>
                <div className="form-group-sleek">
                  <label>Elasticidade</label>
                  <select 
                    value={newClient.elasticidade}
                    onChange={e => setNewClient(prev => ({ ...prev, elasticidade: e.target.value }))}
                  >
                    <option value="Normal">Normal</option>
                    <option value="Fraca">Fraca</option>
                    <option value="Rígida">Rígida</option>
                  </select>
                </div>
              </div>

              <div className="form-group-sleek">
                <label>Histórico Químico Anterior</label>
                <input 
                  type="text" 
                  placeholder="Ex: Descoloração recente, sem químicas, etc."
                  value={newClient.quimicas}
                  onChange={e => setNewClient(prev => ({ ...prev, quimicas: e.target.value }))}
                />
              </div>

              <div className="form-group-sleek">
                <label>Produtos Recomendados</label>
                <input 
                  type="text" 
                  placeholder="Ex: Condicionador hidratante, leave-in protetor..."
                  value={newClient.produtosRecomendados}
                  onChange={e => setNewClient(prev => ({ ...prev, produtosRecomendados: e.target.value }))}
                />
              </div>

              <div className="form-group-sleek">
                <label>Observações Adicionais</label>
                <textarea 
                  rows="2"
                  placeholder="Instruções sobre corte, couro cabeludo sensível, etc."
                  value={newClient.observacoes}
                  onChange={e => setNewClient(prev => ({ ...prev, observacoes: e.target.value }))}
                ></textarea>
              </div>

              <div className="modal-actions" style={{ marginTop: 20 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-accent" disabled={savingNew}>
                  {savingNew ? 'Salvando...' : 'Salvar Cadastro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminClients;
