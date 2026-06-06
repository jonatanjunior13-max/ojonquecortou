import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler from './gcal.js';

// Mock Firebase
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  doc: vi.fn((db, collection, id) => ({ collection, id })),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
}));

import { getDoc, updateDoc, getDocs, addDoc } from 'firebase/firestore';

describe('gcal handler', () => {
  let req, res;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());

    req = {
      method: 'GET',
      query: {},
      body: {},
      headers: { host: 'localhost:3000' }
    };

    res = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
      json: vi.fn(),
      end: vi.fn(),
      redirect: vi.fn()
    };

    process.env.GOOGLE_CLIENT_ID = 'mock-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'mock-client-secret';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle OPTIONS request', async () => {
    req.method = 'OPTIONS';
    await handler(req, res);

    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.end).toHaveBeenCalled();
  });

  it('should return 404 if action is missing or unknown', async () => {
    req.query.action = 'unknown';
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Ação não encontrada.' });
  });

  it('should handle "auth" action and redirect to Google', async () => {
    req.query.action = 'auth';
    await handler(req, res);

    expect(res.redirect).toHaveBeenCalled();
    const redirectUrl = res.redirect.mock.calls[0][0];
    expect(redirectUrl).toContain('https://accounts.google.com/o/oauth2/v2/auth');
    expect(redirectUrl).toContain('client_id=mock-client-id');
  });

  it('should handle "callback" action with missing code', async () => {
    req.query.action = 'callback';
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith('Código de autorização ausente.');
  });

  it('should handle "callback" action successfully', async () => {
    req.query.action = 'callback';
    req.query.code = 'mock-code';

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'mock-access', refresh_token: 'mock-refresh' })
    });

    await handler(req, res);

    expect(global.fetch).toHaveBeenCalledWith('https://oauth2.googleapis.com/token', expect.any(Object));
    expect(updateDoc).toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith('/admin/configuracoes?gcal_status=success');
  });

  it('should handle "callback" action failure', async () => {
    req.query.action = 'callback';
    req.query.code = 'mock-code';

    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'invalid_grant' })
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith('Erro ao obter token: invalid_grant');
  });

  describe('sync action', () => {
    beforeEach(() => {
      req.query.action = 'sync';

      // Mock refreshAccessToken fetch
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'mock-refreshed-token' })
      });
    });

    it('should return 400 if bookingId is missing', async () => {
      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'bookingId é obrigatório.' });
    });

    it('should return 200 with success:false if Google Calendar is not connected', async () => {
      req.query.bookingId = 'b1';
      getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ automations: { googleCalendarConnected: false } }) });

      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Google Agenda não conectado.' });
    });

    it('should handle delete booking directly', async () => {
      req.query.bookingId = 'b1';
      req.query.delete = 'true';

      getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ automations: { googleCalendarConnected: true, googleCalendarRefreshToken: 'mock' } }) });
      getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ googleCalendarEventId: 'evt1' }) });

      global.fetch.mockResolvedValueOnce({ ok: true }); // delete response

      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Exclusão sincronizada.' });
    });

    it('should handle sync canceled booking', async () => {
      req.query.bookingId = 'b1';

      getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ automations: { googleCalendarConnected: true, googleCalendarRefreshToken: 'mock' } }) });
      getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ status: 'cancelado', googleCalendarEventId: 'evt1' }) });

      global.fetch.mockResolvedValueOnce({ ok: true }); // delete response

      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Agendamento cancelado sincronizado.' });
    });

    it('should create new event for a booking', async () => {
      req.query.bookingId = 'b1';

      getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ automations: { googleCalendarConnected: true, googleCalendarRefreshToken: 'mock' } }) });
      getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({
        status: 'pendente',
        date: '2025-06-01',
        time: '14:00',
        clientName: 'Test Client'
      }) });

      global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'new-evt-id' }) }); // create response

      await handler(req, res);

      expect(global.fetch).toHaveBeenCalledTimes(2); // 1 for refresh token, 1 for create event
      const createUrl = global.fetch.mock.calls[1][0];
      expect(createUrl).toBe('https://www.googleapis.com/calendar/v3/calendars/primary/events');

      expect(updateDoc).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, eventId: 'new-evt-id' });
    });
  });

  describe('syncAll action', () => {
    beforeEach(() => {
      req.query.action = 'syncAll';
    });

    it('should return 200 with success:false if Google Calendar is not connected', async () => {
      getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ automations: { googleCalendarConnected: false } }) });

      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Google Agenda não conectado.' });
    });

    it('should fetch events and return stats', async () => {
      getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ automations: { googleCalendarConnected: true, googleCalendarRefreshToken: 'mock' } }) });

      global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'mock-refreshed-token' }) }); // refresh token

      getDocs.mockResolvedValueOnce([
        { id: 'b1', data: () => ({ date: '2025-06-01', time: '14:00', status: 'confirmado', clientName: 'Jon Doe' }) }
      ]); // Firestore bookings

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [
          { id: 'evt1', summary: 'Bloqueado', start: { dateTime: '2025-06-02T10:00:00-03:00' }, end: { dateTime: '2025-06-02T11:00:00-03:00' } }
        ] })
      }); // list events response

      global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'new-evt-id' }) }); // create for b1

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        stats: expect.any(Object)
      }));
    });
  });
});
