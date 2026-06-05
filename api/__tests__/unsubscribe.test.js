import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

const mockUpdate = vi.fn();
const mockGet = vi.fn();

vi.mock('module', () => {
  return {
    createRequire: () => () => ({
      apps: [{ name: '[DEFAULT]' }],
      credential: { cert: vi.fn() },
      initializeApp: vi.fn(),
      firestore: () => ({
        collection: () => ({
          where: () => ({
            get: globalThis.__mockGet
          })
        })
      })
    })
  };
});

import handler from '../unsubscribe.js';

describe('unsubscribe handler', () => {
  let req;
  let res;

  beforeAll(() => {
     process.env.FIREBASE_SERVICE_ACCOUNT = '{}';
  });

  beforeEach(() => {
    globalThis.__mockGet = mockGet;

    req = {
      method: 'GET',
      query: {
        email: 'test@example.com'
      }
    };

    res = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      send: vi.fn(),
      end: vi.fn(),
    };

    vi.clearAllMocks();
  });

  it('should return 200 for OPTIONS method', async () => {
    req.method = 'OPTIONS';
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.end).toHaveBeenCalled();
  });

  it('should return 405 for non-GET requests', async () => {
    req.method = 'POST';
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ message: 'Method Not Allowed' });
  });

  it('should return 400 if email is missing', async () => {
    req.query = {};
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith('Email ausente.');
  });

  it('should handle case where email is not found', async () => {
    mockGet.mockResolvedValue({ empty: true });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(expect.stringContaining('Tudo certo!'));
    expect(res.send).toHaveBeenCalledWith(expect.stringContaining('O email test@example.com'));
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should update documents and return success if email is found', async () => {
    const mockDocs = [
      { id: 'doc1', ref: { update: mockUpdate } },
      { id: 'doc2', ref: { update: mockUpdate } },
    ];

    mockGet.mockResolvedValue({
      empty: false,
      forEach: (callback) => mockDocs.forEach(callback)
    });

    mockUpdate.mockResolvedValue(undefined);

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(expect.stringContaining('Inscrição Cancelada'));
    expect(res.send).toHaveBeenCalledWith(expect.stringContaining('test@example.com'));
    expect(mockUpdate).toHaveBeenCalledTimes(2);
    expect(mockUpdate).toHaveBeenCalledWith({ unsubscribed: true });
  });

  it('should return 500 on internal server error', async () => {
    mockGet.mockRejectedValue(new Error('Firebase error'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith('Erro interno do servidor.');

    consoleSpy.mockRestore();
  });
});
