import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from './confirm-booking-direct.js';

// Mock dependencies
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
}));

vi.mock('firebase/firestore', () => {
  return {
    getFirestore: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    updateDoc: vi.fn(),
  };
});

import { getDoc, updateDoc } from 'firebase/firestore';

describe('confirm-booking-direct handler', () => {
  let mockReq;
  let mockRes;
  let mockGetDoc;
  let mockUpdateDoc;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup basic req/res objects
    mockReq = {
      method: 'POST',
      query: {},
      headers: {
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'example.com',
        host: 'example.com',
      },
    };

    mockRes = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
      json: vi.fn(),
      end: vi.fn(),
    };

    // Replace the imported firestore mocks with references we can control
    mockGetDoc = getDoc;
    mockUpdateDoc = updateDoc;

    // Mock global fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  });


  it('Test Case 1: Missing id parameter', async () => {
    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.send).toHaveBeenCalled();
    const sendArg = mockRes.send.mock.calls[0][0];
    expect(sendArg).toContain('Solicitação Inválida');
    expect(sendArg).toContain('O link acessado é inválido');
  });

  it('Test Case 2: Booking not found', async () => {
    mockReq.query.id = 'invalid-id';

    // Setup mockGetDoc to return an object where exists() returns false
    mockGetDoc.mockResolvedValueOnce({
      exists: () => false,
    });

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.send).toHaveBeenCalled();
    const sendArg = mockRes.send.mock.calls[0][0];
    expect(sendArg).toContain('Agendamento não Encontrado');
  });

  it('Test Case 3: Booking already confirmed', async () => {
    mockReq.query.id = 'valid-id';

    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        status: 'confirmado',
        clientName: 'John Doe',
        serviceName: 'Haircut',
        date: '2023-10-25',
        time: '14:00',
      }),
    });

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.send).toHaveBeenCalled();
    const sendArg = mockRes.send.mock.calls[0][0];
    expect(sendArg).toContain('Já Confirmado');
  });

  it('Test Case 4: Booking cancelled', async () => {
    mockReq.query.id = 'valid-id';

    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        status: 'cancelado',
        clientName: 'John Doe',
        serviceName: 'Haircut',
        date: '2023-10-25',
        time: '14:00',
      }),
    });

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.send).toHaveBeenCalled();
    const sendArg = mockRes.send.mock.calls[0][0];
    expect(sendArg).toContain('Horário Cancelado');
  });

  it('Test Case 5: Successful confirmation', async () => {
    mockReq.query.id = 'valid-id';

    const mockData = {
      status: 'pendente',
      clientName: 'John Doe',
      clientEmail: 'john@example.com',
      serviceName: 'Haircut',
      date: '2023-10-25',
      time: '14:00',
    };

    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => mockData,
    });

    mockUpdateDoc.mockResolvedValueOnce(undefined);

    await handler(mockReq, mockRes);

    // Verify status update
    expect(mockUpdateDoc).toHaveBeenCalled();
    const updateArgs = mockUpdateDoc.mock.calls[0][1];
    expect(updateArgs.status).toBe('confirmado');
    expect(updateArgs.confirmedVia).toBe('direct_whatsapp_link');

    // Verify email fetching
    expect(global.fetch).toHaveBeenCalledWith('https://example.com/api/send-email', expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('horario_confirmado'),
    }));

    // Verify final response
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.send).toHaveBeenCalled();
    const sendArg = mockRes.send.mock.calls[0][0];
    expect(sendArg).toContain('Confirmado com Sucesso');
  });

  it('Test Case 6: Internal Error', async () => {
    mockReq.query.id = 'valid-id';

    mockGetDoc.mockRejectedValueOnce(new Error('Firebase error'));

    // We expect console.error to be called, suppress it to keep output clean
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalled();
    const sendArg = mockRes.send.mock.calls[0][0];
    expect(sendArg).toContain('Erro Interno');

    consoleSpy.mockRestore();
  });
});
