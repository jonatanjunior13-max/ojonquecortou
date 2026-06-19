import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import handler from './whatsapp-webhook.js';
import { getDoc, getDocs, updateDoc } from 'firebase/firestore';

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(() => ({})),
  query: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  getDocs: vi.fn(),
  updateDoc: vi.fn(),
  doc: vi.fn(() => ({})),
  getDoc: vi.fn(),
}));

describe('WhatsApp Webhook Handler', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      method: 'POST',
      body: {},
    };

    res = {
      setHeader: vi.fn(),
      status: vi.fn(() => res),
      end: vi.fn(),
      json: vi.fn(),
    };
  });

  it('should handle CORS OPTIONS request', async () => {
    req.method = 'OPTIONS';
    await handler(req, res);

    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Credentials', true);
    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'POST,OPTIONS');
    expect(res.setHeader).toHaveBeenCalledWith(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.end).toHaveBeenCalled();
  });

  it('should reject non-GET/POST/OPTIONS requests with 405', async () => {
    req.method = 'PUT';
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: 'Method Not Allowed' });
  });

  describe('Webhook Verification (GET)', () => {
    let originalEnv;

    beforeEach(() => {
      originalEnv = process.env;
      process.env = { ...originalEnv, WHATSAPP_VERIFY_TOKEN: 'test_token' };
      req.method = 'GET';
      res.send = vi.fn();
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should return 400 if mode or token are missing', async () => {
      req.query = {};
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request' });
    });

    it('should return 403 if token is invalid', async () => {
      req.query = {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'wrong_token'
      };
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden' });
    });

    it('should return 200 and challenge if mode and token are valid', async () => {
      req.query = {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'test_token',
        'hub.challenge': '123456789'
      };
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith('123456789');
    });
  });

  it('should ignore messages sent fromMe', async () => {
    req.body = {
      event: 'messages.upsert',
      data: {
        key: { fromMe: true, remoteJid: '1234567890' },
        message: { conversation: 'sim' }
      }
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: 'ignored', reason: 'message_from_me' });
  });

  it('should ignore invalid phone numbers', async () => {
    req.body = {
      event: 'messages.upsert',
      data: {
        key: { fromMe: false, remoteJid: '123' }, // Only 3 digits, valid length should be >= 8
        message: { conversation: 'sim' }
      }
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: 'ignored', reason: 'invalid_phone', phone: '123' });
  });

  describe('Business Logic', () => {
    beforeEach(() => {
      // Set up a valid basic confirmation request
      req.body = {
        event: 'messages.upsert',
        data: {
          key: { fromMe: false, remoteJid: '5511999998888' },
          message: { conversation: 'sim, confirmo' }
        }
      };
    });

    it('should ignore non-confirmation messages', async () => {
      req.body.data.message.conversation = 'olá, bom dia';

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'ignored',
        reason: 'not_a_confirmation_message'
      }));
    });

    it('should ignore when WhatsApp integration is disabled in settings', async () => {
      const { getDoc } = await import('firebase/firestore');
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ waReminderEnabled: false })
      });

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith({
        status: 'ignored',
        reason: 'whatsapp_integration_disabled'
      });
    });

    it('should return not_found when no pending booking exists for phone', async () => {
      const { getDoc, getDocs } = await import('firebase/firestore');
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ waReminderEnabled: true })
      });

      // Mock getDocs to return empty results
      getDocs.mockResolvedValueOnce({
        forEach: vi.fn() // No matching bookings
      });

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith({
        status: 'not_found',
        reason: 'no_pending_booking_for_phone',
        last8: '99998888'
      });
    });

    it('should update booking to confirmado when matching booking exists', async () => {
      const { getDoc, getDocs, updateDoc } = await import('firebase/firestore');

      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ waReminderEnabled: true })
      });

      const mockBookingRef = { id: 'booking123' };
      getDocs.mockResolvedValueOnce({
        forEach: (callback) => {
          callback({
            id: 'booking123',
            ref: mockBookingRef,
            data: () => ({ clientPhone: '11999998888', clientName: 'John Doe' })
          });
        }
      });

      await handler(req, res);

      expect(updateDoc).toHaveBeenCalledWith(mockBookingRef, expect.objectContaining({
        status: 'confirmado',
        confirmedVia: 'whatsapp_webhook',
        confirmedAt: expect.any(String)
      }));

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        bookingId: 'booking123',
        clientName: 'John Doe',
        status: 'updated_to_confirmed'
      });
    });

    it('should handle internal server errors correctly', async () => {
      const { getDoc } = await import('firebase/firestore');

      // Force an error
      getDoc.mockRejectedValueOnce(new Error('Firestore error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await handler(req, res);

      expect(consoleSpy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        details: 'Firestore error'
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Payload format extraction', () => {
    it('should correctly extract message from standard Evolution API structure', async () => {
      req.body = {
        event: 'messages.upsert',
        data: {
          key: { fromMe: false, remoteJid: '123456789' },
          message: { conversation: 'não' } // Non-confirmation to trigger earlier return
        }
      };

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'ignored',
        reason: 'not_a_confirmation_message',
        text: 'não'
      }));
    });

    it('should correctly extract message from alternative Evolution API structure', async () => {
      req.body = {
        key: { fromMe: false, remoteJid: '123456789' },
        message: { extendedTextMessage: { text: 'olá' } }
      };

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'ignored',
        reason: 'not_a_confirmation_message',
        text: 'olá'
      }));
    });

    it('should correctly extract message from Z-API standard structure', async () => {
      req.body = {
        phone: '123456789',
        fromMe: false,
        text: { message: 'hello' }
      };

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'ignored',
        reason: 'not_a_confirmation_message',
        text: 'hello'
      }));
    });
  });
});
