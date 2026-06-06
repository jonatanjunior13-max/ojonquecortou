import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from './meta-capi.js';

// Mock fetch
global.fetch = vi.fn();

describe('Meta CAPI Handler', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.resetAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return 200 for OPTIONS requests', async () => {
    const { req, res } = createMocks({
      method: 'OPTIONS',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
  });

  it('should return 405 for non-POST requests', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({ error: 'Method not allowed' });
  });

  it('should return 500 if META_CAPI_TOKEN is not configured', async () => {
    delete process.env.META_CAPI_TOKEN;

    const { req, res } = createMocks({
      method: 'POST',
      body: {},
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({ message: 'Token da API não configurado no servidor' });
  });

  it('should send payload to Meta CAPI and return 200 on success', async () => {
    process.env.META_CAPI_TOKEN = 'test-token';

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        eventName: 'Purchase',
        eventData: { value: 100 },
        pixelId: '12345',
      },
      headers: {
        'referer': 'https://example.com',
        'user-agent': 'test-agent',
        'x-forwarded-for': '127.0.0.1',
      },
    });

    const mockResponse = { success: true };
    fetch.mockResolvedValueOnce({
      json: vi.fn().mockResolvedValueOnce(mockResponse),
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({ success: true, data: mockResponse });

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      'https://graph.facebook.com/v19.0/12345/events?access_token=test-token',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const fetchArgs = fetch.mock.calls[0][1];
    const body = JSON.parse(fetchArgs.body);
    expect(body.data[0].event_name).toBe('Purchase');
    expect(body.data[0].custom_data).toEqual({ value: 100 });
  });

  it('should return 500 if Meta CAPI fetch fails', async () => {
    process.env.META_CAPI_TOKEN = 'test-token';
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        eventName: 'Purchase',
      },
      headers: {
        'referer': 'https://example.com',
        'user-agent': 'test-agent',
        'x-forwarded-for': '127.0.0.1',
      },
    });

    fetch.mockRejectedValueOnce(new Error('Fetch failed'));

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({ success: false, error: 'Fetch failed' });
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
