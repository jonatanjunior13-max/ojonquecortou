/**
 * Attribution & Marketing Parameter Persistence Utility
 * Persists gclid, fbclid, wbraid, gbraid, and UTM tags across SPA navigation,
 * ensuring conversions in Google Ads and Meta Ads are accurately attributed.
 */

const STORAGE_KEY = 'ojon_attribution';
const FIRST_TOUCH_KEY = 'ojon_first_touch';

export const getCookie = (name) => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

export const setCookie = (name, value, days = 90) => {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const domain = window.location.hostname.includes('ojonquecortou.com.br')
    ? '; domain=.ojonquecortou.com.br'
    : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/${domain}; SameSite=Lax`;
};

export const initAttribution = () => {
  if (typeof window === 'undefined') return null;

  try {
    const params = new URLSearchParams(window.location.search);
    const trackingKeys = [
      'gclid', 'fbclid', 'wbraid', 'gbraid', 'gad_source',
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'
    ];

    const currentData = {};
    let hasTracking = false;

    trackingKeys.forEach(key => {
      const val = params.get(key);
      if (val) {
        currentData[key] = val;
        hasTracking = true;
      }
    });

    if (hasTracking) {
      currentData.timestamp = Date.now();
      currentData.landingPage = window.location.pathname;

      // Persist in localStorage and sessionStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentData));
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(currentData));

      if (!localStorage.getItem(FIRST_TOUCH_KEY)) {
        localStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(currentData));
      }

      // First-party cookie fallbacks for Google Ads & Meta
      if (currentData.gclid && !getCookie('_gcl_aw')) {
        setCookie('_gcl_aw', `GCL.${Math.floor(Date.now() / 1000)}.${currentData.gclid}`);
      }
      if (currentData.fbclid && !getCookie('_fbc')) {
        setCookie('_fbc', `fb.1.${Date.now()}.${currentData.fbclid}`);
      }
    }

    return getAttribution();
  } catch (err) {
    console.warn('Erro ao inicializar atribuição:', err);
    return null;
  }
};

export const getAttribution = () => {
  if (typeof window === 'undefined') return {};

  try {
    const sessionStr = sessionStorage.getItem(STORAGE_KEY);
    const localStr = localStorage.getItem(STORAGE_KEY);
    const firstTouchStr = localStorage.getItem(FIRST_TOUCH_KEY);

    const sessionData = sessionStr ? JSON.parse(sessionStr) : {};
    const localData = localStr ? JSON.parse(localStr) : {};
    const firstData = firstTouchStr ? JSON.parse(firstTouchStr) : {};

    const merged = { ...firstData, ...localData, ...sessionData };

    // Resolve fbc & fbp
    let fbc = getCookie('_fbc');
    if (!fbc && merged.fbclid) {
      fbc = `fb.1.${merged.timestamp || Date.now()}.${merged.fbclid}`;
    }
    const fbp = getCookie('_fbp');

    // Resolve gclid
    let gclid = merged.gclid;
    if (!gclid) {
      const gclCookie = getCookie('_gcl_aw');
      if (gclCookie) {
        const parts = gclCookie.split('.');
        if (parts.length >= 3) gclid = parts[2];
      }
    }

    return {
      ...merged,
      gclid: gclid || undefined,
      fbc: fbc || undefined,
      fbp: fbp || undefined
    };
  } catch (e) {
    return {};
  }
};

/**
 * Track manual/offline bookings created by Jon/Admin in GA4
 */
export const trackManualBooking = ({
  bookingId,
  clientName,
  clientPhone,
  clientEmail,
  serviceName,
  servicePrice,
  date,
  time,
  profissional = 'jon',
  source = 'admin_desktop'
} = {}) => {
  if (typeof window === 'undefined') return;

  const numericValue = Number(servicePrice) || 0;

  try {
    // 1. Google Analytics 4 (GA4) custom event
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'manual_booking', {
        event_category: 'booking',
        booking_id: bookingId || `manual-${Date.now()}`,
        service_name: serviceName || 'Serviço',
        value: numericValue,
        currency: 'BRL',
        booking_date: date,
        booking_time: time,
        profissional: profissional || 'jon',
        booking_source: source,
        created_by: 'jon_admin',
        client_name: clientName || '',
        send_to: 'G-BC8WXZKTLL'
      });
    }

    // 2. DataLayer push (for Google Tag Manager & GA4 custom definitions)
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({
        event: 'manual_booking',
        booking_id: bookingId || `manual-${Date.now()}`,
        service_name: serviceName || 'Serviço',
        value: numericValue,
        currency: 'BRL',
        profissional: profissional || 'jon',
        booking_source: source,
        created_by: 'jon_admin'
      });
    }

    console.log(`[GA4] Manual booking tracked: ${bookingId} (${serviceName} - R$${numericValue}) via ${source}`);
  } catch (err) {
    console.warn('[GA4] Erro ao registrar agendamento manual:', err);
  }
};
