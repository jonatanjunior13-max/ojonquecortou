import React, { useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Check, Phone, Clock, TrendingUp, TrendingDown, Users, Calendar, AlertCircle, Gift } from 'lucide-react';
import KpiCard from '../../components/admin/ui/KpiCard';
import Card from '../../components/admin/ui/Card';
import EmptyState from '../../components/admin/ui/EmptyState';
import '../../styles/admin-tokens.css';

const todayStr = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
};

const isBirthdayToday = (birthDate) => {
  if (!birthDate) return false;
  const today = new Date();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const str = typeof birthDate === 'string' ? birthDate : '';
  return str.endsWith(`-${mm}-${dd}`) || str.startsWith(`${dd}/${mm}`);
};

const fmtBRL = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

const fmtTime = (t) => t || '--:--';

const statusLabel = { pendente: 'Pendente', confirmado: 'Confirmado', finalizado: 'Finalizado', cancelado: 'Cancelado', faltou: 'Faltou', bloqueado: 'Bloqueado' };

const statusColor = {
  pendente: 'var(--adm-warning)',
  confirmado: 'var(--adm-info)',
  finalizado: 'var(--adm-success)',
  cancelado: 'var(--adm-danger)',
  faltou: 'var(--adm-danger)',
  bloqueado: 'var(--adm-muted)',
};

const AdminHoje = () => {
  const context = useOutletContext() || {};
  const { globalData = {}, handleAcceptBooking } = context;
  const navigate = useNavigate();
  const today = todayStr();

  const bookings = globalData.bookings || [];
  const transactions = globalData.financial_transactions || [];
  const clients = globalData.clients || [];

  const todayBookings = useMemo(
    () => bookings.filter(b => b.date === today && b.status !== 'bloqueado').sort((a, b) => (a.time || '').localeCompare(b.time || '')),
    [bookings, today]
  );

  const todayRevenue = useMemo(() => {
    return transactions
      .filter(t => {
        const d = t.date || t.createdAt || '';
        return (typeof d === 'string' ? d : d?.toDate?.()?.toISOString?.() || '').startsWith(today);
      })
      .filter(t => t.type === 'entrada' || t.amount > 0)
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions, today]);

  const pendingBookings = useMemo(() => bookings.filter(b => b.status === 'pendente'), [bookings]);
  const confirmedToday = useMemo(() => todayBookings.filter(b => b.status === 'confirmado').length, [todayBookings]);
  const finishedToday = useMemo(() => todayBookings.filter(b => b.status === 'finalizado').length, [todayBookings]);

  const birthdays = useMemo(() => clients.filter(c => isBirthdayToday(c.birthDate || c.birthdate)), [clients]);

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nextClients = useMemo(() => {
    return todayBookings
      .filter(b => b.status === 'confirmado' || b.status === 'pendente')
      .filter(b => {
        if (!b.time) return false;
        const [h, m] = b.time.split(':').map(Number);
        return (h * 60 + m) >= nowMin;
      })
      .slice(0, 5);
  }, [todayBookings, nowMin]);

  return (
    <div className="admin-app" style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '24px' }}>
      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <KpiCard
          label="Faturamento hoje"
          value={fmtBRL(todayRevenue)}
          icon={<TrendingUp size={18} />}
        />
        <KpiCard
          label="Atendimentos"
          value={`${finishedToday + confirmedToday}`}
          sub={`${finishedToday} finalizados · ${confirmedToday} a caminho`}
          icon={<Calendar size={18} />}
        />
        <KpiCard
          label="Pendentes de aceite"
          value={`${pendingBookings.length}`}
          variant={pendingBookings.length > 0 ? 'warning' : undefined}
          icon={<AlertCircle size={18} />}
        />
        <KpiCard
          label="Clientes na base"
          value={`${clients.length}`}
          icon={<Users size={18} />}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        {/* Proximos clientes */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--adm-text)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Próximos de Hoje
            </span>
            <button
              type="button"
              onClick={() => navigate('/admin/agenda')}
              style={{ background: 'none', border: 'none', color: 'var(--adm-gold)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
            >
              Ver agenda completa
            </button>
          </div>

          {nextClients.length === 0 ? (
            <EmptyState icon={Calendar} message="Nada mais por hoje. Agenda livre para o resto do dia." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {nextClients.map(b => (
                <div
                  key={b.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '12px 14px',
                    background: 'var(--adm-card)',
                    borderRadius: 'var(--adm-radius-sm)',
                    border: '0.5px solid var(--adm-rule)',
                  }}
                >
                  <span style={{ fontSize: '1.05rem', fontFamily: 'Georgia, serif', fontWeight: 700, color: 'var(--adm-gold)', minWidth: 48 }}>
                    {fmtTime(b.time)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--adm-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {b.clientName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--adm-muted)', marginTop: 2 }}>
                      {b.serviceName || b.service?.name || 'Serviço'}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 4,
                    background: `${statusColor[b.status]}22`,
                    color: statusColor[b.status],
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    flexShrink: 0,
                  }}>
                    {statusLabel[b.status]}
                  </span>
                  {b.clientPhone && (
                    <a
                      href={`https://wa.me/${b.clientPhone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--adm-success)', flexShrink: 0, display: 'flex' }}
                      title="Abrir WhatsApp"
                    >
                      <Phone size={15} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Pendentes */}
          <Card variant={pendingBookings.length > 0 ? 'gold' : undefined}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--adm-text)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>
              Aguardando Aceite
              {pendingBookings.length > 0 && (
                <span style={{ marginLeft: 8, background: 'var(--adm-gold)', color: '#121110', borderRadius: 10, padding: '1px 7px', fontSize: '0.72rem' }}>
                  {pendingBookings.length}
                </span>
              )}
            </div>

            {pendingBookings.length === 0 ? (
              <div style={{ color: 'var(--adm-muted)', fontSize: '0.82rem' }}>Nenhum pedido pendente.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pendingBookings.slice(0, 4).map(b => (
                  <div key={b.id} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 12px', background: 'var(--adm-card)', borderRadius: 8, border: '0.5px solid var(--adm-rule)' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--adm-text)' }}>{b.clientName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>
                      {b.date ? b.date.split('-').reverse().join('/') : ''} às {b.time} · {b.serviceName || b.service?.name}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAcceptBooking(b)}
                      style={{
                        background: 'var(--adm-gold)',
                        color: '#121110',
                        border: 'none',
                        borderRadius: 6,
                        padding: '6px 0',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        fontFamily: 'inherit',
                      }}
                    >
                      <Check size={13} /> Aceitar
                    </button>
                  </div>
                ))}
                {pendingBookings.length > 4 && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--adm-muted)', textAlign: 'center' }}>
                    +{pendingBookings.length - 4} mais na agenda
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Aniversariantes */}
          {birthdays.length > 0 && (
            <Card>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--adm-text)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>
                <Gift size={14} style={{ marginRight: 6, color: 'var(--adm-gold)', verticalAlign: 'middle' }} />
                Aniversariantes Hoje
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {birthdays.slice(0, 5).map(c => (
                  <div key={c.id || c.phone} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', color: 'var(--adm-text)' }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(220,163,84,0.12)', border: '0.5px solid var(--adm-rule-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--adm-gold)', flexShrink: 0 }}>
                      {(c.name || c.clientName || '?')[0].toUpperCase()}
                    </div>
                    <span>{c.name || c.clientName}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Todos agendamentos do dia */}
      {todayBookings.length > 0 && (
        <Card>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--adm-text)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 16 }}>
            Todos os Agendamentos de Hoje — {todayBookings.length} no total
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid var(--adm-rule)' }}>
                  {['Hora', 'Cliente', 'Serviço', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--adm-muted)', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {todayBookings.map(b => (
                  <tr key={b.id} style={{ borderBottom: '0.5px solid var(--adm-rule)' }}>
                    <td style={{ padding: '10px 12px', fontFamily: 'Georgia, serif', fontWeight: 700, color: 'var(--adm-gold)' }}>{b.time}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--adm-text)', fontWeight: 600 }}>{b.clientName}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--adm-text-2)' }}>{b.serviceName || b.service?.name}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: `${statusColor[b.status]}22`, color: statusColor[b.status], textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {statusLabel[b.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminHoje;
