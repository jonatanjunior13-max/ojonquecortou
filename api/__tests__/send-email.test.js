import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from '../send-email.js';
import * as nodemailer from 'nodemailer';
import { getDocs, getDoc } from 'firebase/firestore';

// --- Mocks ---

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn()
}));

vi.mock('firebase/firestore', () => {
  return {
    getFirestore: vi.fn().mockReturnValue({}), // Return an object so `db` is truthy
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    getDocs: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    addDoc: vi.fn(),
    updateDoc: vi.fn()
  };
});

vi.mock('nodemailer', () => {
  return {
    default: {
      createTransport: vi.fn()
    }
  };
});

// Mocking fetch for Evolution API / WhatsApp / Resend API
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ id: 'resend-ok' }),
    text: () => Promise.resolve('ok')
  })
);


describe('api/send-email', () => {
  let req;
  let res;
  let mockSendMail;
  let mockTransport;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      method: 'POST',
      body: {}
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    mockSendMail = vi.fn().mockResolvedValue({ messageId: 'test-message-id' });
    mockTransport = { sendMail: mockSendMail };
    nodemailer.default.createTransport.mockReturnValue(mockTransport);

    // Default envs
    process.env.VITEST = 'true';
    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_USER = 'user@test.com';
    process.env.SMTP_PASS = 'pass';
    process.env.SMTP_FROM = 'from@test.com';
    process.env.SEND_REAL_EMAILS = 'true';

    // Default db responses
    getDocs.mockResolvedValue({ empty: true });
    getDoc.mockResolvedValue({ exists: () => false });
  });

  it('should return 405 if method is not POST', async () => {
    req.method = 'GET';
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ message: 'Method Not Allowed' });
  });

  it('should return 400 if clientEmail is missing', async () => {
    req.body = { type: 'horario_confirmado' }; // missing clientEmail
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Campos obrigatórios ausentes: clientEmail' });
  });

  it('should handle simulation mode when real emails are disabled', async () => {
    process.env.SEND_REAL_EMAILS = 'false';
    req.body = { clientEmail: 'test@example.com', type: 'horario_confirmado' };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, simulated: true, message: 'Simulado' });
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('should handle simulation mode when SMTP credentials are missing', async () => {
    process.env.SMTP_HOST = '';
    req.body = { clientEmail: 'test@example.com', type: 'horario_confirmado' };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, simulated: true, message: 'Simulado' });
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('should not send email if user is unsubscribed', async () => {
    req.body = { clientEmail: 'optout@example.com', type: 'horario_confirmado' };

    // Mock getDocs to return a user with unsubscribed = true
    getDocs.mockResolvedValueOnce({
      empty: false,
      docs: [{ data: () => ({ unsubscribed: true }) }]
    });

    // The handler has a check `if (db && clientEmail)`.
    // It creates db inside a try block at the module top level.
    // However, our getDocs mock should be hit. Let's trace it.
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Usuário opt-out', unsubscribed: true });
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('should send email for horario_confirmado and notify admin', async () => {
    req.body = {
      clientEmail: 'test@example.com',
      clientName: 'Test Client',
      type: 'horario_confirmado',
      date: '10/10/2023',
      time: '14:00',
      serviceName: 'Corte',
      duration: 60
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, messageId: 'test-message-id' });

    // Should send 2 emails: 1 to client, 1 to admin notification
    expect(mockSendMail).toHaveBeenCalledTimes(2);

    const clientEmailCall = mockSendMail.mock.calls.find(call => call[0].to === 'test@example.com');
    expect(clientEmailCall).toBeDefined();
    expect(clientEmailCall[0].subject).toContain('Está marcado — 10 de Out às 14:00');
    expect(clientEmailCall[0].html).toContain('Te espero, <span>Test.</span>');

    const adminEmailCall = mockSendMail.mock.calls.find(call => call[0].to === process.env.SMTP_USER);
    expect(adminEmailCall).toBeDefined();
    expect(adminEmailCall[0].subject).toContain('[AGENDAMENTO CONFIRMADO]');
  });

  it('should send email for agendamento_alterado', async () => {
    req.body = {
      clientEmail: 'test2@example.com',
      clientName: 'Alice',
      type: 'agendamento_alterado',
      date: '2023-11-05',
      time: '15:30',
      serviceName: 'Barba'
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);

    const clientEmailCall = mockSendMail.mock.calls.find(call => call[0].to === 'test2@example.com');
    expect(clientEmailCall).toBeDefined();
    expect(clientEmailCall[0].subject).toBe('Solicitação de Alteração de Horário - O Jon Que Cortou');
    expect(clientEmailCall[0].html).toContain('Alteração solicitada, <span>Alice.</span>');
  });

  it('should format duration correctly', async () => {
      req.body = {
          clientEmail: 'test@example.com',
          clientName: 'Bob',
          type: 'horario_confirmado',
          date: '15/12/2023',
          time: '10:00',
          serviceName: 'Corte e Barba',
          duration: 90
      };

      await handler(req, res);

      const clientEmailCall = mockSendMail.mock.calls.find(call => call[0].to === 'test@example.com');
      expect(clientEmailCall).toBeDefined();
      expect(clientEmailCall[0].html).toContain('1h30');
  });
});
