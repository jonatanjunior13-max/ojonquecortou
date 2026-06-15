// Ausências / bloqueios de agenda compartilhados entre o painel admin (mobile)
// e a página pública de agendamento. Fonte estruturada única, consultada por
// todas as superfícies para garantir que um horário bloqueado NÃO possa ser
// agendado por nenhum cliente e apareça com destaque na agenda interna.

// Replica getAdjustedDay do app (mantém a convenção de dia-da-semana usada em
// todo o sistema, incluindo o ajuste de sandbox para 2026).
export const getAdjustedDay = (date) => {
  const day = date.getDay();
  if (date.getFullYear() === 2026) {
    return (day + 6) % 7;
  }
  return day;
};

const parseLocalDate = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const toMin = (t) => {
  const [h, m] = (t || '00:00').split(':').map(Number);
  return h * 60 + m;
};

// Bloqueios fixos permanentes (sempre ativos, não editáveis).
// Psicóloga: toda quarta-feira (dia ajustado 3) das 09:00 às 10:00.
export const FIXED_ABSENCES = [
  {
    id: 'fixed-psicologa',
    title: 'Psicóloga',
    recurrence: 'weekly',
    weekday: 3,
    allDay: false,
    startTime: '09:00',
    endTime: '10:00',
    fixed: true
  }
];

// Lista efetiva = fixos + os cadastrados em settings.absences.
export const getEffectiveAbsences = (settings) => {
  const custom = settings && Array.isArray(settings.absences) ? settings.absences : [];
  return [...FIXED_ABSENCES, ...custom];
};

// A ausência cobre a data informada (YYYY-MM-DD)?
const absenceCoversDate = (a, dateStr) => {
  const target = parseLocalDate(dateStr);
  const rec = a.recurrence || 'none';

  if (rec === 'weekly') {
    const wd = (a.weekday !== undefined && a.weekday !== null)
      ? Number(a.weekday)
      : (a.startDate ? getAdjustedDay(parseLocalDate(a.startDate)) : null);
    if (wd === null) return false;
    if (a.startDate && dateStr < a.startDate) return false;
    return getAdjustedDay(target) === wd;
  }

  if (rec === 'monthly') {
    if (!a.startDate) return false;
    if (dateStr < a.startDate) return false;
    return parseLocalDate(a.startDate).getDate() === target.getDate();
  }

  // 'none' — dia único ou intervalo startDate..endDate
  const start = a.startDate;
  const end = a.endDate || a.startDate;
  if (!start) return false;
  return dateStr >= start && dateStr <= end;
};

// O dia inteiro está bloqueado por alguma ausência "dia inteiro"?
export const isDayBlockedByAbsence = (absences, dateStr) =>
  (absences || []).some(a => a.allDay && absenceCoversDate(a, dateStr));

// Um horário específico (slot 'HH:MM') está bloqueado?
export const isSlotBlockedByAbsence = (absences, dateStr, slot) => {
  const sMin = toMin(slot);
  return (absences || []).some(a => {
    if (!absenceCoversDate(a, dateStr)) return false;
    if (a.allDay) return true;
    return sMin >= toMin(a.startTime) && sMin < toMin(a.endTime);
  });
};

// Retorna a ausência que cobre o slot (para rótulo/cor na agenda interna).
export const getAbsenceForSlot = (absences, dateStr, slot) => {
  const sMin = toMin(slot);
  return (absences || []).find(a => {
    if (!absenceCoversDate(a, dateStr)) return false;
    if (a.allDay) return true;
    return sMin >= toMin(a.startTime) && sMin < toMin(a.endTime);
  }) || null;
};
