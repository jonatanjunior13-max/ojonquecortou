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
    .filter(t => t.type === 'entrada' && t.professionalId === prof.id)
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
