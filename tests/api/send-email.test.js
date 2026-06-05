import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from '../../api/send-email.js';
import nodemailer from 'nodemailer';

vi.mock('nodemailer');

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({ empty: true })),
  doc: vi.fn(),
  getDoc: vi.fn(() => Promise.resolve({ exists: () => false })),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
}));

describe('api/send-email', () => {
  let req;
  let res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      method: 'POST',
      body: {
        clientEmail: 'test@example.com',
        clientName: 'Test Client',
        type: 'horario_confirmado'
      }
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_USER = 'testuser';
    process.env.SMTP_PASS = 'testpass';
    process.env.SEND_REAL_EMAILS = 'true';
  });

  it('returns 500 when email generation fails (e.g., html manipulation error)', async () => {
    req.body.type = 'launch_campaign';
    req.body.htmlBody = {
      includes: vi.fn().mockImplementation(() => { throw new Error('Email generation failed'); })
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Email generation failed'
    });
  });

  it('returns 500 when email sending fails', async () => {
    const error = new Error('Test Error');
    nodemailer.createTransport.mockReturnValue({
      sendMail: vi.fn().mockRejectedValue(error)
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Test Error'
    });
  });

  it('returns 400 when an invalid email type is provided', async () => {
    req.body.type = 'invalid_type_that_triggers_error';

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Tipo de e-mail inválido'
    });
  });
});
