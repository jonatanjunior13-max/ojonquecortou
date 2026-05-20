import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, onSnapshot, query, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { Search, Save, UserCheck } from 'lucide-react';
import './Admin.css';

const AdminClients = () => {
  const [bookings, setBookings] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClientPhone, setSelectedClientPhone] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Ficha técnica para o cliente selecionado
  const [hairProfile, setHairProfile] = useState({
    curvatura: '3A',
    porosidade: 'Média',
    elasticidade: 'Normal',
    quimicas: 'Nenhuma',
    produtosRecomendados: 'Creme definidor leve, gelatina hidratante',
    observacoes: ''
  });

  const [saving, setSaving] = useState(false);

  // Carrega agendamentos para agrupar em clientes únicos e ver históricos
  useEffect(() => {
    if (!db) {
      setIsDemoMode(true);
      const demoAppts = [
        {
          id: 'demo-1',
          clientName: 'Ana Souza',
          clientPhone: '31988887777',
          clientEmail: 'ana@email.com',
          service: { name: 'Corte com o Jon', price: 150 },
          date: '2026-05-15',
          time: '09:00',
          status: 'finalizado',
          hairType: '3B'
        },
        {
          id: 'demo-2',
          clientName: 'Carla Lima',
          clientPhone: '31977776666',
          clientEmail: 'carla@email.com',
          service: { name: 'Combo Corte + Tratamento', price: 220 },
          date: '2026-05-18',
          time: '13:00',
          status: 'finalizado',
          hairType: '3C'
        },
        {
          id: 'demo-3',
          clientName: 'Ana Souza',
          clientPhone: '31988887777',
          clientEmail: 'ana@email.com',
          service: { name: 'Tratamento Personalizado', price: 120 },
          date: '2026-05-25',
          time: '14:30',
          status: 'confirmado',
          hairType: '3B'
        }
      ];
      setBookings(demoAppts);
      groupClients(demoAppts);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const q = query(collection(db, 'bookings'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const appts = [];
        snapshot.forEach((doc) => {
          appts.push({ id: doc.id, ...doc.data() });
        });
        setBookings(appts);
        groupClients(appts);
        setLoading(false);
        setIsDemoMode(false);
      }, (error) => {
        console.warn('Erro ao carregar clientes do Firestore, iniciando modo Demo:', error);
        setIsDemoMode(true);
        
        const demoAppts = [
          {
            id: 'demo-1',
            clientName: 'Ana Souza',
            clientPhone: '31988887777',
            clientEmail: 'ana@email.com',
            service: { name: 'Corte com o Jon', price: 150 },
            date: '2026-05-15',
            time: '09:00',
            status: 'finalizado',
            hairType: '3B'
          },
          {
            id: 'demo-2',
            clientName: 'Carla Lima',
            clientPhone: '31977776666',
            clientEmail: 'carla@email.com',
            service: { name: 'Combo Corte + Tratamento', price: 220 },
            date: '2026-05-18',
            time: '13:00',
            status: 'finalizado',
            hairType: '3C'
          },
          {
            id: 'demo-3',
            clientName: 'Ana Souza',
            clientPhone: '31988887777',
            clientEmail: 'ana@email.com',
            service: { name: 'Tratamento Personalizado', price: 120 },
            date: '2026-05-25',
            time: '14:30',
            status: 'confirmado',
            hairType: '3B'
          }
        ];
        setBookings(demoAppts);
        groupClients(demoAppts);
        setLoading(false);
      });
  
      return () => unsubscribe();
    } catch (err) {
      console.warn('Error querying client database from Firestore:', err);
      setIsDemoMode(true);
      setLoading(false);
    }
  }, []);

  // Agrupa agendamentos por telefone (ID único de cliente)
  const groupClients = (appts) => {
    const clientsMap = {};
    appts.forEach((appt) => {
      const phone = appt.clientPhone;
      if (!phone) return;

      if (!clientsMap[phone]) {
        clientsMap[phone] = {
          name: appt.clientName,
          phone: appt.clientPhone,
          email: appt.clientEmail || 'Não informado',
          hairType: appt.hairType || 'Desconhecido',
          lastVisit: appt.date
        };
      } else {
        // Atualiza para a data mais recente
        if (new Date(appt.date) > new Date(clientsMap[phone].lastVisit)) {
          clientsMap[phone].lastVisit = appt.date;
        }
      }
    });
    setClients(Object.values(clientsMap));
  };

  // Carrega a ficha técnica do cliente selecionado no Firestore (coleção `client_profiles`)
  useEffect(() => {
    if (!selectedClientPhone) return;

    const fetchProfile = async () => {
      try {
        if (isDemoMode) {
          // Mock profile local
          const demoProfiles = {
            '31988887777': {
              curvatura: '3B',
              porosidade: 'Alta',
              elasticidade: 'Fraca',
              quimicas: 'Luzes loiras há 6 meses',
              produtosRecomendados: 'Máscara Reconstrutora de Queratina, Óleo de Argan',
              observacoes: 'Sensibilidade no couro cabeludo após descoloração.'
            },
            '31977776666': {
              curvatura: '3C',
              porosidade: 'Média',
              elasticidade: 'Normal',
              quimicas: 'Nenhuma',
              produtosRecomendados: 'Creme de Pentear Nutritivo, Leave-in modelador',
              observacoes: 'Prefere muito volume e corte em camadas arredondadas.'
            }
          };
          setHairProfile(demoProfiles[selectedClientPhone] || {
            curvatura: '3A',
            porosidade: 'Média',
            elasticidade: 'Normal',
            quimicas: 'Nenhuma',
            produtosRecomendados: '',
            observacoes: ''
          });
        } else {
          const docRef = doc(db, 'client_profiles', selectedClientPhone);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setHairProfile(docSnap.data());
          } else {
            // Se não existir, inicializa com o tipo de cacho do último agendamento
            const clientObj = clients.find(c => c.phone === selectedClientPhone);
            setHairProfile({
              curvatura: clientObj?.hairType || '3A',
              porosidade: 'Média',
              elasticidade: 'Normal',
              quimicas: 'Nenhuma',
              produtosRecomendados: '',
              observacoes: ''
            });
          }
        }
      } catch (err) {
        console.error('Erro ao buscar ficha técnica:', err);
      }
    };

    fetchProfile();
  }, [selectedClientPhone, isDemoMode, clients]);

  // Salva alterações na Ficha Técnica (Firestore ou Estado Local)
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (isDemoMode) {
        console.log(`Ficha técnica salva localmente para ${selectedClientPhone}:`, hairProfile);
        alert('Ficha Técnica atualizada com sucesso (Modo Demonstração).');
      } else {
        const docRef = doc(db, 'client_profiles', selectedClientPhone);
        await setDoc(docRef, hairProfile);
        alert('Ficha Técnica do Cabelo salva com sucesso no Firestore!');
      }
    } catch (err) {
      console.error('Erro ao salvar ficha técnica:', err);
      alert('Falha ao salvar a ficha técnica.');
    } finally {
      setSaving(false);
    }
  };

  const selectedClient = clients.find(c => c.phone === selectedClientPhone);
  
  // Histórico de visitas do cliente selecionado
  const clientVisits = bookings
    .filter(b => b.clientPhone === selectedClientPhone)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Filtra lista de clientes pelo campo de pesquisa
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  return (
    <div className="admin-clients-page">
      {loading ? (
        <p>Carregando base de clientes...</p>
      ) : (
        <div className="clients-layout">
          
          {/* Painel Esquerdo: Lista de Clientes */}
          <div className="clients-list-pane">
            <div className="pane-search">
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  placeholder="Pesquisar cliente por nome..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="clients-scroll-list">
              {filteredClients.length === 0 ? (
                <p style={{ padding: 20, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nenhum cliente encontrado.</p>
              ) : (
                filteredClients.map(c => (
                  <div 
                    key={c.phone} 
                    className={`client-list-item ${selectedClientPhone === c.phone ? 'selected' : ''}`}
                    onClick={() => setSelectedClientPhone(c.phone)}
                  >
                    <h4>{c.name}</h4>
                    <span className="client-sub">WhatsApp: {c.phone}</span>
                    <span className="client-sub">Último corte: {c.lastVisit}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Painel Direito: Ficha Técnica */}
          <div className="client-detail-pane">
            {!selectedClientPhone ? (
              <div className="no-client-selected">
                <Search size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
                <h3>Selecione uma cliente</h3>
                <p>Escolha um registro na lista ao lado para ver o histórico e ficha técnica.</p>
              </div>
            ) : (
              <div>
                <header className="detail-header">
                  <h2>{selectedClient?.name}</h2>
                  <p>Contato: {selectedClient?.phone} | E-mail: {selectedClient?.email}</p>
                </header>

                {/* Exibição resumida perfil do cabelo */}
                <div className="hair-profile-grid">
                  <div className="profile-stat-box">
                    <label>Curvatura</label>
                    <span>{hairProfile.curvatura}</span>
                  </div>
                  <div className="profile-stat-box">
                    <label>Porosidade</label>
                    <span>{hairProfile.porosidade}</span>
                  </div>
                  <div className="profile-stat-box">
                    <label>Elasticidade</label>
                    <span>{hairProfile.elasticidade}</span>
                  </div>
                </div>

                {/* Diagnóstico técnico */}
                <section className="diagnose-section">
                  <h3>Ficha Técnica & Análise de Fio</h3>
                  
                  <form onSubmit={handleSaveProfile} className="diagnosis-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="curvatura">Curvatura Dominante</label>
                        <select 
                          id="curvatura"
                          value={hairProfile.curvatura}
                          onChange={e => setHairProfile(prev => ({ ...prev, curvatura: e.target.value }))}
                        >
                          <option value="2A">2A</option><option value="2B">2B</option><option value="2C">2C</option>
                          <option value="3A">3A</option><option value="3B">3B</option><option value="3C">3C</option>
                          <option value="4A">4A</option><option value="4B">4B</option><option value="4C">4C</option>
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="porosidade">Porosidade Capilar</label>
                        <select 
                          id="porosidade"
                          value={hairProfile.porosidade}
                          onChange={e => setHairProfile(prev => ({ ...prev, porosidade: e.target.value }))}
                        >
                          <option value="Baixa">Baixa Porosidade (Cutículas seladas)</option>
                          <option value="Média">Média Porosidade (Normal/Saudável)</option>
                          <option value="Alta">Alta Porosidade (Ressecado/Quimicamente danificado)</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="elasticidade">Elasticidade</label>
                        <select 
                          id="elasticidade"
                          value={hairProfile.elasticidade}
                          onChange={e => setHairProfile(prev => ({ ...prev, elasticidade: e.target.value }))}
                        >
                          <option value="Normal">Normal (Fibra saudável)</option>
                          <option value="Fraca">Fraca/Elástica (Fio frágil/Sem força)</option>
                          <option value="Rígida">Rígida (Excesso de queratina/Ressecado)</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="quimicas">Histórico Químico Anterior</label>
                      <input 
                        type="text" 
                        id="quimicas"
                        placeholder="Ex: Progressiva há 1 ano, descoloração recente, etc."
                        value={hairProfile.quimicas}
                        onChange={e => setHairProfile(prev => ({ ...prev, quimicas: e.target.value }))}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="produtosRecomendados">Produtos Indicados de Manutenção</label>
                      <input 
                        type="text" 
                        id="produtosRecomendados"
                        placeholder="Ex: Condicionador acidificante, creme finalizador com óleo, etc."
                        value={hairProfile.produtosRecomendados}
                        onChange={e => setHairProfile(prev => ({ ...prev, produtosRecomendados: e.target.value }))}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="observacoes">Observações Técnicas Gerais</label>
                      <textarea 
                        id="observacoes"
                        rows="3"
                        placeholder="Histórico capilar, sensibilidade ao couro, preferências de corte e estilização."
                        value={hairProfile.observacoes}
                        onChange={e => setHairProfile(prev => ({ ...prev, observacoes: e.target.value }))}
                      ></textarea>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                      <button type="submit" className="btn btn-accent" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Save size={16} /> {saving ? 'Salvando...' : 'Salvar Ficha Técnica'}
                      </button>
                    </div>
                  </form>
                </section>

                {/* Histórico de Visitas */}
                <section className="client-visits-history">
                  <h3>Histórico de Visitas ({clientVisits.length})</h3>
                  {clientVisits.map(visit => (
                    <div key={visit.id} className="visit-card">
                      <div className="visit-card-header">
                        <span>{visit.date} às {visit.time}</span>
                        <span className={`status-badge ${visit.status}`}>{visit.status}</span>
                      </div>
                      <div style={{ fontSize: '0.9rem' }}>
                        <strong>{visit.service?.name || visit.serviceName}</strong> (R$ {visit.service?.price})
                      </div>
                      {visit.notes && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 6, fontStyle: 'italic' }}>
                          Nota do agendamento: "{visit.notes}"
                        </div>
                      )}
                    </div>
                  ))}
                </section>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default AdminClients;
