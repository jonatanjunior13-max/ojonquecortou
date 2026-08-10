/**
 * Formats any number or numeric string to standard BRL currency format (e.g. "1.866,35" or "11,99").
 * Always returns 2 decimal places separated by comma with optional thousands dot.
 */
export const formatCurrencyBRL = (val) => {
  const num = Number(val || 0);
  if (isNaN(num)) return '0,00';
  const parts = num.toFixed(2).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${integerPart},${parts[1]}`;
};

export const formatBRL = formatCurrencyBRL;

/**
 * Calculates net value after card operator fees and optional anticipation deductions.
 * Default mode is Manual (autoAnticipation: false): credit card transactions only deduct base MDR fees,
 * unless explicitly marked as (Antecipado) or autoAnticipation setting is true.
 */
export const calculateNetValue = (val, method, settings = {}) => {
  const fees = {
    feePix: settings.feePix ?? 0,
    feeDebit: settings.feeDebit ?? 1.40,
    feeCredit: settings.feeCredit ?? 2.49,
    feeCredit2x: settings.feeCredit2x ?? 4.5,
    feeCredit3x: settings.feeCredit3x ?? 5.5,
    feeAnticipation: settings.feeAnticipation ?? 2.50
  };

  const autoAnticipation = settings.autoAnticipation ?? false;

  const m = (method || '').toLowerCase();
  if (val === 0 || m.includes('pacote') || m.includes('cortesia')) return 0;
  let rate = 0;

  if (m === 'pix') {
    rate = fees.feePix;
    return val * (1 - rate / 100);
  } else if (m === 'dinheiro') {
    return val;
  } else if (m.includes('débito') || m.includes('debito')) {
    rate = fees.feeDebit;
    if (m.includes('antecipad')) {
      return val * (1 - rate / 100) * (1 - fees.feeAnticipation / 100);
    }
    return val * (1 - rate / 100);
  } else if (m.includes('crédito') || m.includes('credito') || m.includes('credit')) {
    let installments = 1;
    const match = m.match(/(\d+)x/);
    if (match) {
      installments = parseInt(match[1], 10);
    }

    if (installments === 2) {
      rate = fees.feeCredit2x;
    } else if (installments >= 3) {
      rate = fees.feeCredit3x;
    } else {
      rate = fees.feeCredit;
    }

    const isAnticipated = m.includes('antecipad') || autoAnticipation;

    if (isAnticipated) {
      const valPerInstallment = val / installments;
      let totalNet = 0;
      const antRatePerMonth = fees.feeAnticipation / 100;
      
      for (let i = 1; i <= installments; i++) {
        const days = 30 * i - 1;
        const netInstallment = valPerInstallment * (1 - rate / 100);
        const payout = netInstallment * (1 - antRatePerMonth * (days / 30));
        totalNet += payout;
      }
      return totalNet;
    }

    // Default Manual Mode: calculate net strictly using adquirente MDR rate
    return val * (1 - rate / 100);
  }

  return val;
};

/**
 * Calculates total processing fee retained by card operators.
 */
export const calculateTransactionFee = (val, method, settings = {}) => {
  return val - calculateNetValue(val, method, settings);
};

/**
 * Calculates professional commission based strictly on the gross values of services and products.
 */
export const calculateProfessionalCommission = (prof, transactions) => {
  if (!prof) return { services: 0, products: 0, total: 0 };
  const commServ = prof.commissionService !== undefined ? prof.commissionService : (prof.commission || 0);
  const commProd = prof.commissionProduct !== undefined ? prof.commissionProduct : 0;
  
  let servicesPayout = 0;
  let productsPayout = 0;

  transactions
    .filter(t => t.type === 'entrada' && (t.professionalId || t.profissional || 'jon') === prof.id)
    .forEach(t => {
      const productVal = t.productSales ? t.productSales.reduce((acc, p) => acc + (p.sellingPrice * p.quantity), 0) : 0;
      const isProdSale = t.isProductSale || t.category === 'venda_produto';
      
      let rawProd = 0;
      let rawServ = 0;

      if (isProdSale) {
        rawProd = t.value;
      } else {
        rawProd = productVal;
        rawServ = Math.max(0, t.value - productVal);
      }

      // Calculated on gross values (without deducting transaction fees)
      servicesPayout += rawServ * (commServ / 100);
      productsPayout += rawProd * (commProd / 100);
    });

  return {
    services: servicesPayout,
    products: productsPayout,
    total: servicesPayout + productsPayout
  };
};

/**
 * Helper to add calendar days to a Date or 'YYYY-MM-DD' string
 */
export const addCalendarDays = (dateInput, days) => {
  const d = new Date(typeof dateInput === 'string' ? dateInput + 'T12:00:00' : dateInput);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

/**
 * Helper to add business days (ignoring weekends Saturday & Sunday)
 */
export const addBusinessDays = (dateInput, businessDays) => {
  const d = new Date(typeof dateInput === 'string' ? dateInput + 'T12:00:00' : dateInput);
  let added = 0;
  while (added < businessDays) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) { // Not Sunday (0) or Saturday (6)
      added++;
    }
  }
  return d.toISOString().split('T')[0];
};

/**
 * Adjusts a target date to the next business day if it falls on a weekend
 */
export const adjustToNextBusinessDay = (dateInput) => {
  const d = new Date(typeof dateInput === 'string' ? dateInput + 'T12:00:00' : dateInput);
  const day = d.getDay();
  if (day === 6) { // Saturday -> Monday (+2)
    d.setDate(d.getDate() + 2);
  } else if (day === 0) { // Sunday -> Monday (+1)
    d.setDate(d.getDate() + 1);
  }
  return d.toISOString().split('T')[0];
};

/**
 * Generates itemized schedule of expected receivables for each entry transaction.
 * Accounts for 30/60/90 days for credit card (1x, 2x, 3x), 1 business day for debit, and instant for Pix/Cash.
 */
export const calculateReceivablesSchedule = (transactions = [], settings = {}) => {
  const fees = {
    feePix: settings.feePix ?? 0,
    feeDebit: settings.feeDebit ?? 1.40,
    feeCredit: settings.feeCredit ?? 2.49,
    feeCredit2x: settings.feeCredit2x ?? 4.5,
    feeCredit3x: settings.feeCredit3x ?? 5.5,
    feeAnticipation: settings.feeAnticipation ?? 2.50
  };

  const autoAnticipation = settings.autoAnticipation ?? false;
  const todayStr = new Date().toISOString().split('T')[0];
  const schedule = [];

  transactions
    .filter(t => t.type === 'entrada' && Number(t.value || 0) > 0)
    .forEach(t => {
      const val = Number(t.value || 0);
      const m = (t.paymentMethod || '').toLowerCase();
      if (val <= 0 || m.includes('pacote') || m.includes('cortesia')) return;

      const saleDate = t.date || todayStr;
      const isAnticipated = m.includes('antecipad') || autoAnticipation;

      // Handle split payments if present
      const paymentsToProcess = (t.splitPayments && t.splitPayments.length > 0)
        ? t.splitPayments
        : [{ method: t.paymentMethod, value: val, installments: null, anticipation: isAnticipated }];

      paymentsToProcess.forEach((p, pIdx) => {
        const pVal = Number(p.value || val);
        const pMethod = (p.method || t.paymentMethod || '').toLowerCase();
        const pAnticipated = p.anticipation || pMethod.includes('antecipad') || isAnticipated;

        if (pMethod.includes('pix')) {
          const fee = pVal * (fees.feePix / 100);
          const net = pVal - fee;
            schedule.push({
            id: `${t.id}_pix_${pIdx}`,
            transactionId: t.id,
            clientName: t.clientName || 'Cliente',
            description: t.description || 'Recebimento Pix',
            paymentMethod: 'Pix',
            professionalId: t.professionalId || t.profissional || 'jon',
            saleDate: saleDate,
            dueDate: saleDate,
            installmentNumber: 1,
            totalInstallments: 1,
            grossValue: pVal,
            feeValue: fee,
            netValue: net,
            daysToReceive: 0,
            status: 'liquidado',
            statusLabel: 'Disponível (Na Hora)'
          });
        } else if (pMethod.includes('dinheiro')) {
          schedule.push({
            id: `${t.id}_din_${pIdx}`,
            transactionId: t.id,
            clientName: t.clientName || 'Cliente',
            description: t.description || 'Venda Dinheiro',
            paymentMethod: 'Dinheiro',
            professionalId: t.professionalId || t.profissional || 'jon',
            saleDate: saleDate,
            dueDate: saleDate,
            installmentNumber: 1,
            totalInstallments: 1,
            grossValue: pVal,
            feeValue: 0,
            netValue: pVal,
            daysToReceive: 0,
            status: 'liquidado',
            statusLabel: 'Disponível (Na Hora)'
          });
        } else if (pMethod.includes('débito') || pMethod.includes('debito')) {
          const feeRate = fees.feeDebit;
          const fee = pVal * (feeRate / 100);
          let net = pVal - fee;
          
          let dueDate = addBusinessDays(saleDate, 1);
          if (pAnticipated) {
            net = net * (1 - fees.feeAnticipation / 100);
            dueDate = saleDate;
          }

          const isLiquidated = dueDate <= todayStr;

          schedule.push({
            id: `${t.id}_deb_${pIdx}`,
            transactionId: t.id,
            clientName: t.clientName || 'Cliente',
            description: t.description || 'Cartão de Débito',
            paymentMethod: pAnticipated ? 'Cartão de Débito (Antecipado)' : 'Cartão de Débito',
            professionalId: t.professionalId || t.profissional || 'jon',
            saleDate: saleDate,
            dueDate: dueDate,
            installmentNumber: 1,
            totalInstallments: 1,
            grossValue: pVal,
            feeValue: pVal - net,
            netValue: net,
            daysToReceive: 1,
            status: pAnticipated ? 'antecipado' : (isLiquidated ? 'liquidado' : 'a_receber'),
            statusLabel: pAnticipated ? 'Antecipado (Na Hora)' : (isLiquidated ? 'Disponível (D+1)' : 'A Receber (D+1 Útil)')
          });
        } else if (pMethod.includes('crédito') || pMethod.includes('credito') || pMethod.includes('credit')) {
          let installments = 1;
          const match = pMethod.match(/(\d+)x/);
          if (match) {
            installments = parseInt(match[1], 10);
          } else if (p.installments) {
            const instMatch = String(p.installments).match(/(\d+)/);
            if (instMatch) installments = parseInt(instMatch[1], 10);
          }

          let rate = fees.feeCredit;
          if (installments === 2) rate = fees.feeCredit2x;
          else if (installments >= 3) rate = fees.feeCredit3x;

          const grossPerInstallment = pVal / installments;

          if (pAnticipated) {
            const antRatePerMonth = fees.feeAnticipation / 100;
            let totalNet = 0;
            for (let i = 1; i <= installments; i++) {
              const days = 30 * i - 1;
              const netInst = grossPerInstallment * (1 - rate / 100);
              const payout = netInst * (1 - antRatePerMonth * (days / 30));
              totalNet += payout;
            }

            schedule.push({
              id: `${t.id}_cred_ant_${pIdx}`,
              transactionId: t.id,
              clientName: t.clientName || 'Cliente',
              description: `${t.description || 'Crédito'} (${installments}x Antecipado)`,
              paymentMethod: `Cartão de Crédito (${installments}x Antecipado)`,
              professionalId: t.professionalId || t.profissional || 'jon',
              saleDate: saleDate,
              dueDate: saleDate,
              installmentNumber: 1,
              totalInstallments: installments,
              grossValue: pVal,
              feeValue: pVal - totalNet,
              netValue: totalNet,
              daysToReceive: 0,
              status: 'antecipado',
              statusLabel: 'Antecipado (Na Hora)'
            });
          } else {
            // Manual Mode: 30, 60, 90 calendar days
            const netTotal = pVal * (1 - rate / 100);
            const netPerInstallment = netTotal / installments;
            const feePerInstallment = (pVal - netTotal) / installments;

            for (let i = 1; i <= installments; i++) {
              const daysToAdd = 30 * i;
              const rawDueDate = addCalendarDays(saleDate, daysToAdd);
              const adjustedDueDate = adjustToNextBusinessDay(rawDueDate);
              const isLiquidated = adjustedDueDate <= todayStr;

              schedule.push({
                id: `${t.id}_cred_${pIdx}_${i}`,
                transactionId: t.id,
                clientName: t.clientName || 'Cliente',
                description: `${t.description || 'Crédito'} (${i}/${installments}x)`,
                paymentMethod: `Cartão de Crédito (${installments}x)`,
                professionalId: t.professionalId || t.profissional || 'jon',
                saleDate: saleDate,
                dueDate: adjustedDueDate,
                installmentNumber: i,
                totalInstallments: installments,
                grossValue: grossPerInstallment,
                feeValue: feePerInstallment,
                netValue: netPerInstallment,
                daysToReceive: daysToAdd,
                status: isLiquidated ? 'liquidado' : 'a_receber',
                statusLabel: isLiquidated ? `Disponível (+${daysToAdd}d)` : `A Receber em ${daysToAdd} dias`
              });
            }
          }
        }
      });
    });

  return schedule.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
};
