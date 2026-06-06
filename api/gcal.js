import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// Helper to refresh Google OAuth access token
async function refreshAccessToken(refreshToken) {
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });

  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok) {
    throw new Error(`Failed to refresh token: ${tokenData.error_description || tokenData.error}`);
  }
  return tokenData.access_token;
}

// Convert Google Calendar dateTime to local Brazil date & time
function parseGcalDateTime(dateTimeStr) {
  const dateObj = new Date(dateTimeStr);
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(dateObj);
  const dy = parts.find(p => p.type === 'day').value;
  const mo = parts.find(p => p.type === 'month').value;
  const yr = parts.find(p => p.type === 'year').value;
  const hr = parts.find(p => p.type === 'hour').value;
  const mn = parts.find(p => p.type === 'minute').value;

  return {
    date: `${yr}-${mo}-${dy}`,
    time: `${hr}:${mn}`
  };
}

export default async function handler(req, res) {
  const allowedOrigins = ['https://www.ojonquecortou.com.br', 'https://ojonquecortou.com.br'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://www.ojonquecortou.com.br');
  }
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const action = req.query.action || '';

  // 1. ACTION: AUTH (Inicia o login para o Google Agenda)
  if (action === 'auth') {
    const client_id = process.env.GOOGLE_CLIENT_ID;
    const isLocal = req.headers.host.includes('localhost') || req.headers.host.includes('127.0.0.1');
    const protocol = isLocal ? 'http' : 'https';
    const redirect_uri = `${protocol}://${req.headers.host}/api/gcal?action=callback`;
    const scope = 'https://www.googleapis.com/auth/calendar';

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;

    return res.redirect(authUrl);
  }

  // 2. ACTION: CALLBACK (Salva as credenciais do Google Agenda)
  if (action === 'callback') {
    const { code } = req.query;
    if (!code) {
      return res.status(400).send('Código de autorização ausente.');
    }

    const client_id = process.env.GOOGLE_CLIENT_ID;
    const client_secret = process.env.GOOGLE_CLIENT_SECRET;
    const isLocal = req.headers.host.includes('localhost') || req.headers.host.includes('127.0.0.1');
    const protocol = isLocal ? 'http' : 'https';
    const redirect_uri = `${protocol}://${req.headers.host}/api/gcal?action=callback`;

    try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id,
          client_secret,
          redirect_uri,
          grant_type: 'authorization_code'
        })
      });

      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok) {
        console.error('Erro ao obter token do Google:', tokenData);
        return res.status(500).send(`Erro ao obter token: ${tokenData.error_description || tokenData.error}`);
      }

      const { access_token, refresh_token } = tokenData;

      // Salvar credenciais no Firestore
      const settingsRef = doc(db, 'settings', 'studio');
      const updateData = {
        'automations.googleCalendarConnected': true,
        'automations.googleCalendarAccessToken': access_token,
        'automations.googleCalendarId': 'primary',
        'automations.googleCalendarLastError': null
      };

      if (refresh_token) {
        updateData['automations.googleCalendarRefreshToken'] = refresh_token;
      }

      await updateDoc(settingsRef, updateData);

      return res.redirect('/admin/configuracoes?gcal_status=success');

    } catch (error) {
      console.error('Erro no callback do Google Agenda:', error);
      return res.redirect(`/admin/configuracoes?gcal_status=error&msg=${encodeURIComponent(error.message)}`);
    }
  }

  // 3. ACTION: SYNC (Sincroniza um agendamento individual App -> Google Agenda)
  if (action === 'sync') {
    const bookingId = req.query.bookingId || req.body.bookingId;
    const isDelete = req.query.delete === 'true' || req.body.delete === true;

    if (!bookingId) {
      return res.status(400).json({ error: 'bookingId é obrigatório.' });
    }

    try {
      const settingsSnap = await getDoc(doc(db, 'settings', 'studio'));
      const settings = settingsSnap.exists() ? settingsSnap.data() : {};
      const automations = settings.automations || {};

      if (!automations.googleCalendarConnected || !automations.googleCalendarRefreshToken) {
        return res.status(200).json({ success: false, message: 'Google Agenda não conectado.' });
      }

      const accessToken = await refreshAccessToken(automations.googleCalendarRefreshToken);

      // Se for exclusão, tenta deletar diretamente se soubermos o eventId
      if (isDelete) {
        const bookingSnap = await getDoc(doc(db, 'bookings', bookingId));
        if (bookingSnap.exists()) {
          const booking = bookingSnap.data();
          if (booking.googleCalendarEventId) {
            const deleteUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${booking.googleCalendarEventId}`;
            await fetch(deleteUrl, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${accessToken}` }
            });
          }
        }
        return res.status(200).json({ success: true, message: 'Exclusão sincronizada.' });
      }

      // Buscar agendamento atualizado
      const bookingSnap = await getDoc(doc(db, 'bookings', bookingId));
      if (!bookingSnap.exists()) {
        return res.status(404).json({ error: 'Agendamento não encontrado.' });
      }

      const booking = bookingSnap.data();

      // Se o status for cancelado, exclui do Google Calendar para liberar o espaço
      if (booking.status === 'cancelado') {
        if (booking.googleCalendarEventId) {
          const deleteUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${booking.googleCalendarEventId}`;
          await fetch(deleteUrl, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });
          await updateDoc(doc(db, 'bookings', bookingId), {
            googleCalendarEventId: null
          });
        }
        return res.status(200).json({ success: true, message: 'Agendamento cancelado sincronizado.' });
      }

      // Preparar payload do evento
      const date = booking.date; // YYYY-MM-DD
      const time = booking.time; // HH:MM
      if (!date || !time) {
        return res.status(400).json({ error: 'Data ou hora ausente no agendamento.' });
      }

      const [yr, mo, dy] = date.split('-').map(Number);
      const [hr, mn] = time.split(':').map(Number);
      const start = new Date(yr, mo - 1, dy, hr, mn, 0);
      const durationMin = booking.duration || 60;
      const end = new Date(start.getTime() + durationMin * 60000);

      const pad = (num) => String(num).padStart(2, '0');
      const startStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}T${pad(start.getHours())}:${pad(start.getMinutes())}:00`;
      const endStr = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}T${pad(end.getHours())}:${pad(end.getMinutes())}:00`;

      let summary = '';
      if (booking.status === 'bloqueado') {
        summary = `[BLOQUEADO] ${booking.clientName || 'Horário Bloqueado'}`;
      } else if (booking.status === 'pendente') {
        summary = `[PENDENTE] ${booking.clientName} - ${booking.serviceName || 'Serviço'}`;
      } else {
        summary = `[Studio] ${booking.clientName} - ${booking.serviceName || 'Serviço'}`;
      }

      const description = `Cliente: ${booking.clientName || ''}
Serviço: ${booking.serviceName || ''}
Profissional: ${booking.professionalName || 'Jon'}
Status: ${booking.status || ''}
WhatsApp: ${booking.clientPhone || ''}
E-mail: ${booking.clientEmail || ''}
Observações: ${booking.notes || ''}`;

      // Cor do evento:
      // Confirmado -> Verde (colorId: 10 - Basil)
      // Pendente -> Laranja (colorId: 6 - Tangerine)
      // Bloqueado -> Cinza (colorId: 8 - Graphite)
      let colorId = '10';
      if (booking.status === 'pendente') colorId = '6';
      else if (booking.status === 'bloqueado') colorId = '8';

      const eventData = {
        summary,
        description,
        colorId,
        start: {
          dateTime: startStr,
          timeZone: 'America/Sao_Paulo'
        },
        end: {
          dateTime: endStr,
          timeZone: 'America/Sao_Paulo'
        }
      };

      let responseEvent;
      if (booking.googleCalendarEventId) {
        // Atualizar evento existente
        const updateUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${booking.googleCalendarEventId}`;
        const resGcal = await fetch(updateUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(eventData)
        });

        if (resGcal.status === 404) {
          // Evento foi deletado no Google Agenda, criamos outro
          const createUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events`;
          const resCreate = await fetch(createUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventData)
          });
          responseEvent = await resCreate.json();
          if (resCreate.ok && responseEvent.id) {
            await updateDoc(doc(db, 'bookings', bookingId), {
              googleCalendarEventId: responseEvent.id
            });
          }
        } else {
          responseEvent = await resGcal.json();
        }
      } else {
        // Criar novo evento
        const createUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events`;
        const resGcal = await fetch(createUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(eventData)
        });
        responseEvent = await resGcal.json();

        if (resGcal.ok && responseEvent.id) {
          await updateDoc(doc(db, 'bookings', bookingId), {
            googleCalendarEventId: responseEvent.id
          });
        } else {
          console.error('Erro ao criar evento na API do Google:', responseEvent);
          return res.status(resGcal.status).json({ error: 'Erro ao criar evento no Google.', details: responseEvent });
        }
      }

      return res.status(200).json({ success: true, eventId: responseEvent.id });

    } catch (err) {
      console.error('Erro de sincronização individual:', err);
      return res.status(500).json({ error: 'Erro interno.', details: err.message });
    }
  }

  // 4. ACTION: SYNCALL (Sincronização em lote bidirecional completa Google <-> Firestore)
  if (action === 'syncAll') {
    try {
      const settingsSnap = await getDoc(doc(db, 'settings', 'studio'));
      const settings = settingsSnap.exists() ? settingsSnap.data() : {};
      const automations = settings.automations || {};

      if (!automations.googleCalendarConnected || !automations.googleCalendarRefreshToken) {
        return res.status(200).json({ success: false, message: 'Google Agenda não conectado.' });
      }

      const accessToken = await refreshAccessToken(automations.googleCalendarRefreshToken);

      // Definir janela de tempo (-30 dias a +90 dias)
      const now = new Date();
      const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const next90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

      const pad = (num) => String(num).padStart(2, '0');
      const minDateStr = `${past30.getFullYear()}-${pad(past30.getMonth() + 1)}-${pad(past30.getDate())}`;
      const maxDateStr = `${next90.getFullYear()}-${pad(next90.getMonth() + 1)}-${pad(next90.getDate())}`;

      // 1. CARREGAR AGENDAMENTOS FIRESTORE
      const bookingsSnap = await getDocs(collection(db, 'bookings'));
      const bookingsList = [];
      bookingsSnap.forEach(d => {
        const b = d.data();
        if (b.date >= minDateStr && b.date <= maxDateStr) {
          bookingsList.push({ id: d.id, ...b });
        }
      });

      // 2. BUSCAR EVENTOS GOOGLE CALENDAR
      const timeMin = `${minDateStr}T00:00:00Z`;
      const timeMax = `${maxDateStr}T23:59:59Z`;
      const listUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&maxResults=2500`;

      const listResponse = await fetch(listUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const listData = await listResponse.json();

      if (!listResponse.ok) {
        console.error('Erro ao buscar eventos do Google:', listData);
        return res.status(listResponse.status).json({ error: 'Erro ao buscar eventos do Google.', details: listData });
      }

      const gcalEvents = listData.items || [];
      const googleEventsById = {};
      gcalEvents.forEach(evt => {
        googleEventsById[evt.id] = evt;
      });

      // Mapear Firestore bookings indexados por googleCalendarEventId
      const bookingsByEventId = {};
      bookingsList.forEach(b => {
        if (b.googleCalendarEventId) {
          bookingsByEventId[b.googleCalendarEventId] = b;
        }
      });

      let stats = { imported: 0, exported: 0, updatedFirestore: 0, updatedGoogle: 0, deletedFirestore: 0 };
      let logs = [];

      // ==============================================================
      // FLUXO A: FIRESTORE -> GOOGLE CALENDAR
      // ==============================================================
      for (const booking of bookingsList) {
        if (booking.status === 'cancelado') {
          // Se já está cancelado, remove se houver ID
          if (booking.googleCalendarEventId) {
            const deleteUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${booking.googleCalendarEventId}`;
            await fetch(deleteUrl, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            await updateDoc(doc(db, 'bookings', booking.id), {
              googleCalendarEventId: null
            });
            stats.deletedFirestore++;
            logs.push(`Removido evento do Google para agendamento cancelado: ${booking.clientName}`);
          }
          continue;
        }

        const [yr, mo, dy] = booking.date.split('-').map(Number);
        const [hr, mn] = booking.time.split(':').map(Number);
        const start = new Date(yr, mo - 1, dy, hr, mn, 0);
        const durationMin = booking.duration || 60;
        const end = new Date(start.getTime() + durationMin * 60000);

        const startStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}T${pad(start.getHours())}:${pad(start.getMinutes())}:00`;
        const endStr = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}T${pad(end.getHours())}:${pad(end.getMinutes())}:00`;

        let summary = '';
        if (booking.status === 'bloqueado') {
          summary = `[BLOQUEADO] ${booking.clientName || 'Horário Bloqueado'}`;
        } else if (booking.status === 'pendente') {
          summary = `[PENDENTE] ${booking.clientName} - ${booking.serviceName || 'Serviço'}`;
        } else {
          summary = `[Studio] ${booking.clientName} - ${booking.serviceName || 'Serviço'}`;
        }

        const description = `Cliente: ${booking.clientName || ''}
Serviço: ${booking.serviceName || ''}
Profissional: ${booking.professionalName || 'Jon'}
Status: ${booking.status || ''}
WhatsApp: ${booking.clientPhone || ''}
E-mail: ${booking.clientEmail || ''}
Observações: ${booking.notes || ''}`;

        let colorId = '10';
        if (booking.status === 'pendente') colorId = '6';
        else if (booking.status === 'bloqueado') colorId = '8';

        const eventData = {
          summary,
          description,
          colorId,
          start: {
            dateTime: startStr,
            timeZone: 'America/Sao_Paulo'
          },
          end: {
            dateTime: endStr,
            timeZone: 'America/Sao_Paulo'
          }
        };

        if (booking.googleCalendarEventId) {
          const gEvent = googleEventsById[booking.googleCalendarEventId];
          if (gEvent) {
            // Verificar se precisa atualizar
            const gStart = gEvent.start.dateTime || gEvent.start.date;
            const isDifferentTime = !gStart.startsWith(startStr);
            const isDifferentSummary = gEvent.summary !== summary;

            if (isDifferentTime || isDifferentSummary) {
              const updateUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${booking.googleCalendarEventId}`;
              await fetch(updateUrl, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
              });
              stats.updatedGoogle++;
              logs.push(`Atualizado Google Agenda para agendamento modificado: ${booking.clientName}`);
            }
          } else {
            // O evento foi excluído do Google Agenda diretamente
            // Marcamos o agendamento no Firestore como cancelado!
            await updateDoc(doc(db, 'bookings', booking.id), {
              status: 'cancelado',
              googleCalendarEventId: null
            });
            stats.updatedFirestore++;
            logs.push(`Agendamento cancelado no Firestore pois foi excluído no Google: ${booking.clientName}`);
          }
        } else {
          // Criar no Google Agenda
          const createUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events`;
          const resGcal = await fetch(createUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventData)
          });
          const newEvent = await resGcal.json();
          if (resGcal.ok && newEvent.id) {
            await updateDoc(doc(db, 'bookings', booking.id), {
              googleCalendarEventId: newEvent.id
            });
            stats.exported++;
            logs.push(`Exportado para o Google Agenda: ${booking.clientName}`);
          }
        }
      }

      // ==============================================================
      // FLUXO B: GOOGLE CALENDAR -> FIRESTORE
      // ==============================================================
      for (const event of gcalEvents) {
        if (event.status === 'cancelled') continue;

        const booking = bookingsByEventId[event.id];

        if (booking) {
          // Já existe correspondência. Verificar se a data/hora mudou no Google Agenda
          const eventStartStr = event.start.dateTime;
          if (eventStartStr) {
            const localGcal = parseGcalDateTime(eventStartStr);
            const isChanged = localGcal.date !== booking.date || localGcal.time !== booking.time;

            if (isChanged) {
              await updateDoc(doc(db, 'bookings', booking.id), {
                date: localGcal.date,
                time: localGcal.time
              });
              stats.updatedFirestore++;
              logs.push(`Reagendado Firestore a partir do Google Agenda: ${booking.clientName} para ${localGcal.date} às ${localGcal.time}`);
            }
          }
        } else {
          // Evento foi criado diretamente no Google Agenda
          // Importa como Horário Bloqueado
          const eventStartStr = event.start.dateTime || event.start.date;
          let localGcal;

          if (eventStartStr.includes('T')) {
            localGcal = parseGcalDateTime(eventStartStr);
          } else {
            // All-day event
            localGcal = { date: eventStartStr, time: '09:00' };
          }

          // Calcular duração do bloqueio
          let duration = 60;
          if (event.start.dateTime && event.end.dateTime) {
            const diffMs = new Date(event.end.dateTime) - new Date(event.start.dateTime);
            duration = Math.max(30, Math.round(diffMs / 60000));
          } else {
            duration = 1440; // All-day = 24h
          }

          const newBookingPayload = {
            clientName: event.summary || 'Bloqueado (Google Calendar)',
            clientPhone: '',
            clientEmail: '',
            date: localGcal.date,
            time: localGcal.time,
            duration: duration,
            serviceName: 'Bloqueio Manual',
            professionalId: 'jon',
            professionalName: 'Jon',
            status: 'bloqueado',
            notes: event.description || 'Importado do Google Agenda',
            googleCalendarEventId: event.id
          };

          await addDoc(collection(db, 'bookings'), newBookingPayload);
          stats.imported++;
          logs.push(`Importado bloqueio do Google Agenda: ${newBookingPayload.clientName} em ${localGcal.date}`);
        }
      }

      return res.status(200).json({
        success: true,
        stats,
        logs
      });

    } catch (err) {
      console.error('Erro na sincronização em lote:', err);
      return res.status(500).json({ error: 'Erro interno no sincronizador.', details: err.message });
    }
  }

  return res.status(404).json({ error: 'Ação não encontrada.' });
}
