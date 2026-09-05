import React, { useState, useEffect, useRef } from 'react';
import { db, auth, withTimeout } from '../../config/firebase';
import { collection, onSnapshot, query, doc, setDoc, getDocs, writeBatch, updateDoc } from 'firebase/firestore';
import { Search, Save, UserCheck, Plus, Send, Mail, Phone, Calendar, Sparkles, AlertCircle, Upload, ChevronLeft } from 'lucide-react';
import { parseClientCSV } from '../../utils/clientImport';
import { formatCurrencyBRL } from '../../utils/finance';
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

  // States para Edição de Agendamento
  const [editingBooking, setEditingBooking] = useState(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState('confirmado');
  const [isUpdatingBooking, setIsUpdatingBooking] = useState(false);


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
  <p style="font-size: 12px; color: #888888; text-align: center;">Studio do Jon • Rua Belmiro Braga, 544 - Caiçaras, Belo Horizonte - MG - CEP 30770-550</p>
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
        sexo: prof.sexo || 'Feminino',
        birthdate: prof.birthdate || prof.aniversario || ''
      };
    });

    // Mescla com os dados vindos dos agendamentos
    appts.forEach((appt) => {
      const phone = appt.clientPhone || appt.phone;
      if (!phone) return;

      const dateStr = appt.date;
      const serviceName = appt.service?.name || appt.serviceName || 'Serviço';

      if (!clientsMap[phone]) {
        clientsMap[phone] = {
          name: appt.clientName || 'Cliente sem nome',
          phone: phone,
          email: appt.clientEmail || appt.email || 'Não informado',
          hairType: appt.hairType || 'Desconhecido',
          lastVisit: dateStr || 'Nunca visitou',
          lastServiceName: serviceName,
          sexo: appt.sexo || 'Feminino',
          birthdate: appt.clientBirthdate || appt.birthdate || ''
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
        if ((appt.clientBirthdate || appt.birthdate) && !clientsMap[phone].birthdate) {
          clientsMap[phone].birthdate = appt.clientBirthdate || appt.birthdate;
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
    const clientObj = clients.find(c => c.phone === selectedClientPhone);
    
    if (clientProf) {
      // DEBUG TEMPORÁRIO — ver campos reais do Firestore
      console.log('[DEBUG birthdate] Firestore doc keys:', Object.keys(clientProf));
      console.log('[DEBUG birthdate] birthdate:', clientProf.birthdate, '| aniversario:', clientProf.aniversario, '| all fields:', JSON.stringify(clientProf));
      setHairProfile({
        name: clientProf.name || clientObj?.name || '',
        email: clientProf.email || clientObj?.email || '',
        phone: clientProf.phone || selectedClientPhone,
        curvatura: clientProf.curvatura || '3A',
        porosidade: clientProf.porosidade || 'Média',
        elasticidade: clientProf.elasticidade || 'Normal',
        quimicas: clientProf.quimicas || 'Nenhuma',
        produtosRecomendados: clientProf.produtosRecomendados || '',
        observacoes: clientProf.observacoes || '',
        sexo: clientProf.sexo || 'Feminino',
        birthdate: clientProf.birthdate || clientProf.aniversario || ''
      });
    } else {
      // Se não tem perfil salvo ainda, herda o tipo do agendamento
      setHairProfile({
        name: clientObj?.name || '',
        email: clientObj?.email || '',
        phone: selectedClientPhone,
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

    const cleanNewPhone = (hairProfile.phone || '').replace(/\D/g, '');
    if (!cleanNewPhone) {
      alert('Telefone inválido.');
      setSaving(false);
      return;
    }

    const updatedProfile = {
      ...hairProfile,
      phone: cleanNewPhone
    };

    try {
      if (isDemoMode || !db) {
        // Modo local
        let updatedList = [...profiles];
        if (cleanNewPhone !== selectedClientPhone) {
          updatedList = updatedList.filter(p => p.phone !== selectedClientPhone);
        }
        updatedList = updatedList.filter(p => p.phone !== cleanNewPhone);
        updatedList.push(updatedProfile);
        setProfiles(updatedList);
        localStorage.setItem('demo_client_profiles', JSON.stringify(updatedList));
        setSelectedClientPhone(cleanNewPhone);
        alert('Ficha capilar atualizada localmente.');
      } else {
        if (cleanNewPhone !== selectedClientPhone) {
          const batch = writeBatch(db);
          const newDocRef = doc(db, 'client_profiles', cleanNewPhone);
          const oldDocRef = doc(db, 'client_profiles', selectedClientPhone);
          
          batch.set(newDocRef, updatedProfile);
          batch.delete(oldDocRef);
          await batch.commit();
          
          setSelectedClientPhone(cleanNewPhone);
          alert('Ficha capilar salva e telefone atualizado com sucesso no Firestore!');
        } else {
          const docRef = doc(db, 'client_profiles', selectedClientPhone);
          await setDoc(docRef, updatedProfile);
          alert('Ficha capilar salva com sucesso no Firestore!');
        }
      }
    } catch (err) {
      console.error('Erro ao salvar ficha:', err);
      alert('Erro de conexão ao salvar ficha técnica.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditBookingClick = (booking) => {
    setEditingBooking(booking);
    setEditDate(booking.date || '');
    setEditTime(booking.time || '');
    setEditNotes(booking.notes || '');
    setEditStatus(booking.status || 'confirmado');
  };

  const handleSaveBookingEdit = async (e) => {
    if (e) e.preventDefault();
    if (!editingBooking) return;
    setIsUpdatingBooking(true);
    try {
      if (isDemoMode || !db) {
        // Modo local
        const updated = bookings.map(b => 
          b.id === editingBooking.id 
            ? { ...b, date: editDate, time: editTime, notes: editNotes, status: editStatus } 
            : b
        );
        setGlobalData(prev => ({ ...prev, bookings: updated }));
        localStorage.setItem('demo_bookings', JSON.stringify(updated));
        alert('Agendamento atualizado localmente!');
      } else {
        // Firestore Mode
        const docRef = doc(db, 'bookings', editingBooking.id);
        await updateDoc(docRef, {
          date: editDate,
          time: editTime,
          notes: editNotes,
          status: editStatus
        });
        alert('Agendamento atualizado com sucesso no Firestore!');
      }
      setEditingBooking(null);
    } catch (err) {
      console.error('Erro ao atualizar agendamento:', err);
      alert('Erro ao atualizar o agendamento.');
    } finally {
      setIsUpdatingBooking(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!editingBooking) return;
    if (!window.confirm('Tem certeza que deseja cancelar este agendamento?')) return;
    setIsUpdatingBooking(true);
    try {
      if (isDemoMode || !db) {
        // Modo local
        const updated = bookings.map(b => 
          b.id === editingBooking.id 
            ? { ...b, status: 'cancelado' } 
            : b
        );
        setGlobalData(prev => ({ ...prev, bookings: updated }));
        localStorage.setItem('demo_bookings', JSON.stringify(updated));
        alert('Agendamento cancelado localmente!');
      } else {
        // Firestore Mode
        const docRef = doc(db, 'bookings', editingBooking.id);
        await updateDoc(docRef, {
          status: 'cancelado'
        });
        alert('Agendamento cancelado com sucesso no Firestore!');
      }
      setEditingBooking(null);
    } catch (err) {
      console.error('Erro ao cancelar agendamento:', err);
      alert('Erro ao cancelar o agendamento.');
    } finally {
      setIsUpdatingBooking(false);
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
      let skipped = 0;
      let failed = 0;
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
              } else {
                skipped++;
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
          // Firestore: upload using standard SDK with writeBatch to avoid REST API GCP enablement issues
          // and prevent WebSocket/network hangs by doing chunked uploads.
          const existingPhones = new Set(profiles.map(p => p.phone));
          
          // Classify each client as update, skip or create in memory first
          const queue = [];
          for (const c of parsed) {
            if (existingPhones.has(c.phone)) {
              if (replaceExisting) {
                queue.push({ client: c, isUpdate: true });
              } else {
                skipped++;
              }
            } else {
              queue.push({ client: c, isUpdate: false });
            }
          }

          if (queue.length === 0) {
            setImportProgress(100);
            setImportSummary(
              `✅ Importação concluída! Sucesso: 0, Pulados: ${skipped}.${validationErrors.length > 0 ? ` ${validationErrors.length} linha(s) com erros de cabeçalho/validação.` : ''}`
            );
            setImportFile(null);
            if (importFileRef.current) importFileRef.current.value = '';
            return;
          }

          const BATCH_SIZE = 100; // Chunk size for write batches (limit is 500)
          const totalToUpload = queue.length;
          
          for (let i = 0; i < totalToUpload; i += BATCH_SIZE) {
            const chunk = queue.slice(i, i + BATCH_SIZE);
            const batch = writeBatch(db);

            for (const item of chunk) {
              const docRef = doc(db, 'client_profiles', item.client.phone);
              if (item.isUpdate) {
                batch.set(docRef, item.client, { merge: true });
              } else {
                batch.set(docRef, item.client);
              }
            }

            try {
              // Timeout de 15 segundos por lote (100 clientes)
              await withTimeout(batch.commit(), 15000);
              for (const item of chunk) {
                if (item.isUpdate) {
                  updated++;
                } else {
                  created++;
                }
              }
            } catch (batchErr) {
              console.error(`Erro ao gravar lote de clientes (índice ${i}):`, batchErr);
              failed += chunk.length;
              setImportErrors(prev => [...prev, `Erro no lote de ${i + 1} a ${i + chunk.length}: ${batchErr.message}`]);
            }

            const completedCount = Math.min(i + BATCH_SIZE, totalToUpload);
            setImportSummary(
              `Importados: ${created + updated} | Pulados: ${skipped} | Falhas: ${failed} (Progresso: ${completedCount}/${totalToUpload})`
            );
            setImportProgress(20 + Math.floor((completedCount / totalToUpload) * 75));
          }
        }

        setImportProgress(100);
        setImportSummary(
          `✅ Importação concluída! Sucesso: ${created + updated}${skipped > 0 ? `, Pulados: ${skipped}` : ''}${failed > 0 ? `, Falhas: ${failed}` : ''}.${validationErrors.length > 0 ? ` ${validationErrors.length} linha(s) com erros de cabeçalho/validação.` : ''}`
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
    return { code: 'inativo_60', text: 'Adormecido (>60d)', color: 'var(--adm-danger)' };
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
    if (absenceWindow === '1w') matchesWindow = days >= 7 && days < 14;
    else if (absenceWindow === '2w') matchesWindow = days >= 14 && days < 21;
    else if (absenceWindow === '3w') matchesWindow = days >= 21 && days < 30;
    else if (absenceWindow === '1m') matchesWindow = days >= 30 && days < 60;
    else if (absenceWindow === '2m') matchesWindow = days >= 60 && days < 90;
    else if (absenceWindow === '3m') matchesWindow = days >= 90 && days < 180;
    else if (absenceWindow === '6m') matchesWindow = days >= 180 && days !== Infinity;
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

  // Disparo Real de Campanha de E-mail via Vercel Function com proteção contra SPAM (Titan)
  const handleSendEmailCampaign = () => {
    if (marketingTargetsList.length === 0) {
      alert('Nenhum cliente no segmento escolhido para disparar.');
      return;
    }
    
    const targets = [...marketingTargetsList];
    const total = targets.length;
    
    // Configurações de proteção contra suspensão de SMTP (Titan)
    const BATCH_SIZE = 5; // Envia em lotes de 5
    const BATCH_DELAY = 60000; // Espera 60 segundos após cada lote
    const INDIVIDUAL_DELAY = 15000; // Espera 15 segundos entre e-mails do mesmo lote
    
    const estTimeMinutes = Math.ceil(((total * INDIVIDUAL_DELAY) + (Math.floor(total / BATCH_SIZE) * BATCH_DELAY)) / 60000);
    
    if (!confirm(`Deseja iniciar a campanha para ${total} clientes com a Proteção Anti-Spam ativada?\n\nConfiguração:\n- Intervalo entre e-mails: ${INDIVIDUAL_DELAY/1000}s\n- Lote de segurança: ${BATCH_SIZE} e-mails\n- Pausa entre lotes: ${BATCH_DELAY/1000}s\n- Tempo total estimado: ~${estTimeMinutes} minuto(s).\n\nRecomendado para evitar bloqueios na sua conta do Titan.`)) {
      return;
    }

    setIsSendingEmail(true);
    setEmailLogs([]);
    
    let currentIdx = 0;
    const logTime = () => new Date().toLocaleTimeString('pt-BR');
    
    setEmailLogs(prev => [...prev, `[${logTime()}] 🚀 Iniciando campanha com Proteção Anti-Spam (Modo Titan)`]);
    setEmailLogs(prev => [...prev, `[${logTime()}] 📬 Total de destinatários: ${total} | Tempo estimado: ~${estTimeMinutes} min`]);
    
    const sendNext = async () => {
      if (currentIdx >= total) {
        setEmailLogs(prev => [...prev, `[${logTime()}] ✅ Campanha de e-mail concluída com sucesso e sem suspensões!`]);
        setIsSendingEmail(false);
        return;
      }
      
      const client = targets[currentIdx];
      const emailBodyCompiled = emailCampaignBody
        .replace(/{nome}/g, client.name)
        .replace(/{ultimo_servico}/g, client.lastServiceName || 'serviço')
        .replace(/{dias_ausente}/g, getDaysAbsent(client.lastVisit) === Infinity ? 'algum' : getDaysAbsent(client.lastVisit));

      setEmailLogs(prev => [...prev, `[${logTime()}] 🔄 [${currentIdx + 1}/${total}] Processando: ${client.name} (${client.email || 'sem e-mail'})...`]);
      
      let sentSuccessfully = false;
      if (!client.email || client.email === 'Não informado' || !client.email.includes('@')) {
        setEmailLogs(prev => [...prev, `[${logTime()}] ⚠️ Pulado: E-mail inválido ou não cadastrado`]);
      } else {
        try {
          const res = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'campanha',
              subject: emailCampaignSubject,
              htmlBody: emailBodyCompiled,
              clientEmail: client.email,
              clientName: client.name
            })
          });
          if (res.ok) {
            setEmailLogs(prev => [...prev, `[${logTime()}] 📧 Sucesso: enviado para ${client.email}`]);
            sentSuccessfully = true;
          } else {
            setEmailLogs(prev => [...prev, `[${logTime()}] ❌ Falha no envio para ${client.email}`]);
          }
        } catch (err) {
          setEmailLogs(prev => [...prev, `[${logTime()}] ❌ Erro de conexão para ${client.email}`]);
        }
      }
      
      currentIdx++;
      
      if (currentIdx >= total) {
        setTimeout(sendNext, 500);
        return;
      }
      
      const finishedBatch = currentIdx % BATCH_SIZE === 0;
      if (finishedBatch && sentSuccessfully) {
        setEmailLogs(prev => [...prev, `[${logTime()}] ⏳ Lote de ${BATCH_SIZE} e-mails concluído. Pausa de segurança de ${BATCH_DELAY/1000}s para evitar SPAM no Titan...`]);
        setTimeout(sendNext, BATCH_DELAY);
      } else {
        setEmailLogs(prev => [...prev, `[${logTime()}] ⏳ Aguardando ${INDIVIDUAL_DELAY/1000}s de intervalo regulamentar...`]);
        setTimeout(sendNext, INDIVIDUAL_DELAY);
      }
    };
    
    setTimeout(sendNext, 500);
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

  const todayStr = new Date().toISOString().split('T')[0];
  const clientVisits = bookings
    .filter(b => b.clientPhone === selectedClientPhone)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const futureBookings = clientVisits.filter(b => b.date >= todayStr && b.status !== 'cancelado' && b.status !== 'finalizado');
  const pastVisits = clientVisits.filter(b => b.date < todayStr || b.status === 'finalizado');

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

        {isDemoMode && (
          <span className="demo-badge-inline">
            Modo Demo (Offline)
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--adm-muted)' }}>
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
                      <button 
                        type="button" 
                        className="mobile-clients-back-btn" 
                        onClick={() => setSelectedClientPhone(null)}
                      >
                        <ChevronLeft size={16} /> Voltar para Lista
                      </button>
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
                      <h3>Dados Pessoais & Ficha Capilar</h3>

                      <div className="form-grid-three">
                        <div className="form-group-sleek">
                          <label>Nome Completo</label>
                          <input 
                            type="text"
                            required
                            value={hairProfile.name || ''}
                            onChange={e => setHairProfile(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div className="form-group-sleek">
                          <label>E-mail</label>
                          <input 
                            type="email"
                            value={hairProfile.email || ''}
                            onChange={e => setHairProfile(prev => ({ ...prev, email: e.target.value }))}
                          />
                        </div>
                        <div className="form-group-sleek">
                          <label>WhatsApp / Telefone</label>
                          <input 
                            type="text"
                            required
                            value={hairProfile.phone || ''}
                            onChange={e => setHairProfile(prev => ({ ...prev, phone: e.target.value }))}
                          />
                        </div>
                      </div>
                      
                      <div className="form-grid-three" style={{ marginTop: '16px' }}>
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

                    {/* Agendamentos Futuros */}
                    <div className="detail-visits-history" style={{ marginBottom: '24px' }}>
                      <h3>Agendamentos Futuros ({futureBookings.length})</h3>
                      {futureBookings.length === 0 ? (
                        <p className="no-visits-txt">Nenhum agendamento futuro marcado.</p>
                      ) : (
                        <div className="visits-mini-timeline">
                           {futureBookings.map(v => (
                            <div 
                              key={v.id} 
                              className="visit-mini-card clickable-booking-card" 
                              style={{ 
                                cursor: 'pointer', 
                                transition: 'all 0.2s ease',
                                border: '1px solid var(--adm-rule)'
                              }}
                              onClick={() => handleEditBookingClick(v)}
                              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--adm-accent)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--adm-rule)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
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
                                  (R$ {formatCurrencyBRL(v.service?.price || v.servicePrice || 0)})
                                </span>
                              </div>
                              {v.notes && <p className="visit-note-snippet">Nota: "{v.notes}"</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Histórico do Cliente */}
                    <div className="detail-visits-history">
                      <h3>Visitas Anteriores ({pastVisits.length})</h3>
                      {pastVisits.length === 0 ? (
                        <p className="no-visits-txt">Sem visitas anteriores cadastradas no salão para esta cliente.</p>
                      ) : (
                        <div className="visits-mini-timeline">
                          {pastVisits.map(v => (
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
                                  (R$ {formatCurrencyBRL(v.service?.price || v.servicePrice || 0)})
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
              <div className="absence-window-selectors" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <button className={`filter-badge-btn ${absenceWindow === 'todos' ? 'active' : ''}`} onClick={() => setAbsenceWindow('todos')}>
                  Todas ({clients.length})
                </button>
                <button className={`filter-badge-btn active-clients ${absenceWindow === '1w' ? 'active' : ''}`} onClick={() => setAbsenceWindow('1w')}>
                  1 Semana ({clients.filter(c => { const d = getDaysAbsent(c.lastVisit); return d >= 7 && d < 14; }).length})
                </button>
                <button className={`filter-badge-btn active-clients ${absenceWindow === '2w' ? 'active' : ''}`} onClick={() => setAbsenceWindow('2w')}>
                  2 Semanas ({clients.filter(c => { const d = getDaysAbsent(c.lastVisit); return d >= 14 && d < 21; }).length})
                </button>
                <button className={`filter-badge-btn active-clients ${absenceWindow === '3w' ? 'active' : ''}`} onClick={() => setAbsenceWindow('3w')}>
                  3 Semanas ({clients.filter(c => { const d = getDaysAbsent(c.lastVisit); return d >= 21 && d < 30; }).length})
                </button>
                <button className={`filter-badge-btn warning-clients ${absenceWindow === '1m' ? 'active' : ''}`} onClick={() => setAbsenceWindow('1m')}>
                  1 Mês ({clients.filter(c => { const d = getDaysAbsent(c.lastVisit); return d >= 30 && d < 60; }).length})
                </button>
                <button className={`filter-badge-btn warning-clients ${absenceWindow === '2m' ? 'active' : ''}`} onClick={() => setAbsenceWindow('2m')}>
                  2 Meses ({clients.filter(c => { const d = getDaysAbsent(c.lastVisit); return d >= 60 && d < 90; }).length})
                </button>
                <button className={`filter-badge-btn danger-clients ${absenceWindow === '3m' ? 'active' : ''}`} onClick={() => setAbsenceWindow('3m')}>
                  3-6 Meses ({clients.filter(c => { const d = getDaysAbsent(c.lastVisit); return d >= 90 && d < 180; }).length})
                </button>
                <button className={`filter-badge-btn danger-clients ${absenceWindow === '6m' ? 'active' : ''}`} onClick={() => setAbsenceWindow('6m')}>
                  6+ Meses ({clients.filter(c => { const d = getDaysAbsent(c.lastVisit); return d >= 180 && d !== Infinity; }).length})
                </button>
                <button className={`filter-badge-btn neutral-clients ${absenceWindow === 'nunca' ? 'active' : ''}`} onClick={() => setAbsenceWindow('nunca')}>
                  Sem Visitas ({clients.filter(c => getDaysAbsent(c.lastVisit) === Infinity).length})
                </button>
              </div>

              {/* Filtros Avançados de Relatório */}
              <div className="report-filters-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', margin: '16px 0', padding: '16px', background: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--adm-rule)' }}>
                <div className="filter-group-sleek" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--adm-muted)', fontWeight: 'bold' }}>Sexo / Gênero</label>
                  <select 
                    value={genderFilter} 
                    onChange={e => setGenderFilter(e.target.value)}
                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--adm-rule)', background: 'var(--panel-bg)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                  >
                    <option value="todos">Todos</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Outro">Outro / Não informado</option>
                  </select>
                </div>

                <div className="filter-group-sleek" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--adm-muted)', fontWeight: 'bold' }}>Último Serviço Realizado</label>
                  <select 
                    value={serviceFilter} 
                    onChange={setServiceFilter}
                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--adm-rule)', background: 'var(--panel-bg)', color: 'var(--text-main)', fontSize: '0.85rem' }}
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
                        <td colSpan="9" style={{ textAlign: 'center', padding: 24, color: 'var(--adm-muted)' }}>
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
                                <span style={{ color: 'var(--adm-muted)' }}>Sem visitas</span>
                              ) : (
                                <span>
                                  {new Date(c.lastVisit).toLocaleDateString('pt-BR')}
                                  <span style={{ display: 'block', fontSize: '11px', color: 'var(--adm-gold)', marginTop: '2px' }}>
                                    {(() => {
                                      if (days < 7) return `${days}d atrás`;
                                      if (days < 30) {
                                        const w = Math.floor(days / 7);
                                        const r = days % 7;
                                        return `${w} ${w === 1 ? 'semana' : 'semanas'}${r > 0 ? ` e ${r}d` : ''} atrás`;
                                      }
                                      const m = Math.floor(days / 30);
                                      const r = days % 30;
                                      if (r >= 7) {
                                        const w = Math.floor(r / 7);
                                        return `${m} ${m === 1 ? 'mês' : 'meses'} e ${w} sem atrás`;
                                      }
                                      return `${m} ${m === 1 ? 'mês' : 'meses'} atrás`;
                                    })()}
                                  </span>
                                </span>
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
                                <a 
                                  href={getCampaignMessageLink(c)} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="btn btn-accent btn-small"
                                  style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--adm-gold)', border: 'none', color: '#000', fontWeight: 'bold' }}
                                >
                                  🔥 Reaquecer
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
                <small style={{ color: 'var(--adm-muted)', marginTop: 4, display: 'block' }}>
                  Colunas esperadas: <code>nome, telefone, email, ultimaVisita, aniversario</code> &nbsp;|
                  &nbsp;<a href="/client_import_template.csv" download style={{ color: 'var(--adm-gold)' }}>Baixar template</a>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--adm-muted)', marginBottom: 4 }}>
                    <span>Progresso</span><span>{importProgress}%</span>
                  </div>
                  <div style={{ background: 'var(--adm-rule)', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${importProgress}%`, height: '100%', background: 'var(--adm-gold)', transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              )}

              {importSummary && (
                <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, background: '#2f855a18', color: '#2f855a', fontSize: '0.88rem', fontWeight: 500 }}>
                  {importSummary}
                </div>
              )}

              {importErrors.length > 0 && (
                <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: 'var(--adm-danger)18', color: 'var(--adm-danger)', fontSize: '0.82rem' }}>
                  <strong>Lista de erros/status ({importErrors.length}):</strong>
                  <ul style={{ margin: '6px 0 0 16px', padding: 0, maxHeight: '180px', overflowY: 'auto' }}>
                    {importErrors.slice(0, 50).map((err, i) => <li key={i}>{err}</li>)}
                    {importErrors.length > 50 && <li style={{ fontWeight: 'bold', listStyle: 'none', marginTop: 4 }}>... e mais {importErrors.length - 50} erros.</li>}
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

              <h4 style={{ margin: '16px 0 8px', borderBottom: '1px solid var(--adm-rule)', paddingBottom: '4px', fontSize: '0.9rem', color: 'var(--adm-muted)' }}>
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

      {editingBooking && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2>Editar Agendamento</h2>
              <button className="btn-close" onClick={() => setEditingBooking(null)}>×</button>
            </div>
            
            <form onSubmit={handleSaveBookingEdit} className="modal-form-scroll" style={{ padding: '0 20px 20px' }}>
              <div style={{ marginBottom: '16px', fontSize: '0.9rem', background: 'rgba(205, 168, 128, 0.05)', padding: '10px 14px', borderRadius: '4px', borderLeft: '3px solid var(--adm-accent, #cda880)' }}>
                <strong>Cliente:</strong> {editingBooking.clientName || editingBooking.phone}<br/>
                <strong>Serviço:</strong> {editingBooking.service?.name || editingBooking.serviceName || 'Serviço'}
              </div>

              <div className="form-group-sleek" style={{ marginBottom: '14px' }}>
                <label>Data</label>
                <input 
                  type="date"
                  required
                  value={editDate}
                  onChange={e => setEditDate(e.target.value)}
                />
              </div>

              <div className="form-group-sleek" style={{ marginBottom: '14px' }}>
                <label>Horário</label>
                <input 
                  type="time"
                  required
                  value={editTime}
                  onChange={e => setEditTime(e.target.value)}
                />
              </div>

              <div className="form-group-sleek" style={{ marginBottom: '14px' }}>
                <label>Status</label>
                <select 
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value)}
                >
                  <option value="confirmado">Confirmado</option>
                  <option value="confirmado pela cliente">Confirmado pela Cliente</option>
                  <option value="pendente">Pendente</option>
                  <option value="finalizado">Finalizado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              <div className="form-group-sleek" style={{ marginBottom: '14px' }}>
                <label>Observações / Notas</label>
                <textarea 
                  rows="3"
                  placeholder="Instruções especiais ou detalhes sobre o serviço..."
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '24px' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  style={{ color: '#ff4d4d', borderColor: '#ff4d4d' }}
                  onClick={handleCancelBooking}
                  disabled={isUpdatingBooking}
                >
                  Cancelar Agendamento
                </button>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    onClick={() => setEditingBooking(null)}
                    disabled={isUpdatingBooking}
                  >
                    Fechar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-accent" 
                    disabled={isUpdatingBooking}
                  >
                    {isUpdatingBooking ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminClients;
