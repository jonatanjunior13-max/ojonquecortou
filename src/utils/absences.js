// Ausências / bloqueios de agenda compartilhados entre o painel admin (mobile)
// e a página pública de agendamento. Fonte estruturada única, consultada por
// todas as superfícies para garantir que um horário bloqueado NÃO possa ser
// agendado por nenhum cliente e apareça com destaque na agenda interna.

// Dia da semana (0=domingo..6=sábado), convenção única do sistema.
// HISTÓRICO: entre 776e7ee (15/06/2026 06:53) e 1df7e6d (15/06/2026 13:10)
// existiu aqui um desvio "if (date.getFullYear() === 2026) return (day+6)%7"
// copiado de um hack de sandbox introduzido em 66ce3147 (mesmo dia, 05:15) e
// já revertido nos outros 3 arquivos por 1df7e6d ("fix calendar 2026 day
// names") por produzir o dia errado — só este arquivo, criado no meio desse
// intervalo, nunca recebeu o revert. Não reintroduzir esse desvio: a
// convenção correta e única do sistema é date.getDay() puro.
export const getAdjustedDay = (date) => date.getDay();

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
export const FIXED_ABSENCES = [];

// Lista efetiva = fixos + os cadastrados em settings.absences.
export const getEffectiveAbsences = (settings) => {
  const custom = settings && Array.isArray(settings.absences) ? settings.absences : [];
  const fixed = settings?.disablePsicologa ? [] : FIXED_ABSENCES;
  return [...fixed, ...custom];
};

// A ausência cobre a data informada (YYYY-MM-DD)?
export const absenceCoversDate = (a, dateStr) => {
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
