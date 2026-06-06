import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler from './indexnow.js';

// Mock the global fetch
global.fetch = vi.fn();

describe('IndexNow Cron Handler', () => {
  let req;
  let res;

  const OLD_ENV = process.env;

  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();

    // Set up environment variables
    process.env = { ...OLD_ENV, CRON_SECRET: 'test-secret', INDEXNOW_KEY: 'test-key' };

    // Setup mock req and res
    req = {
      headers: {
        authorization: 'Bearer test-secret'
      }
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis()
    };
  });

  afterEach(() => {
    process.env = OLD_ENV; // Restore old environment
  });

  it('should return 401 if unauthorized', async () => {
    req.headers.authorization = 'Bearer wrong-secret';
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('should return 500 if sitemap fetch fails', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    });

    await handler(req, res);

    expect(global.fetch).toHaveBeenCalledWith('https://www.ojonquecortou.com.br/sitemap.xml', { cache: 'no-store' });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith('Erro ao carregar sitemap: 404 Not Found');
  });

  it('should return 400 if no valid URLs found in sitemap', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => '<urlset></urlset>' // No <loc> tags
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith('Nenhuma URL válida encontrada no sitemap.');
  });

  it('should handle Bing API failure', async () => {
    const sitemapXml = `
      <urlset>
        <url><loc>https://www.ojonquecortou.com.br/</loc></url>
      </urlset>
    `;

    // Mock sitemap fetch
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => sitemapXml
    });

    // Mock Bing API fetch
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: async () => 'Forbidden'
    });

    await handler(req, res);

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith('Erro ao falar com o Bing (403): Forbidden');
  });

  it('should successfully submit to Bing', async () => {
    const sitemapXml = `
      <urlset>
        <url><loc>https://www.ojonquecortou.com.br/</loc></url>
        <url><loc>https://www.ojonquecortou.com.br/sobre</loc></url>
      </urlset>
    `;

    // Mock sitemap fetch
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => sitemapXml
    });

    // Mock Bing API fetch
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => 'OK'
    });

    await handler(req, res);

    // Verify sitemap fetch
    expect(global.fetch).toHaveBeenNthCalledWith(1, 'https://www.ojonquecortou.com.br/sitemap.xml', { cache: 'no-store' });

    // Verify Bing API fetch
    expect(global.fetch).toHaveBeenNthCalledWith(2, 'https://www.bing.com/indexnow', expect.objectContaining({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
        host: 'www.ojonquecortou.com.br',
        key: 'test-key',
        keyLocation: 'https://www.ojonquecortou.com.br/test-key.txt',
        urlList: [
          'https://www.ojonquecortou.com.br/',
          'https://www.ojonquecortou.com.br/sobre'
        ]
      })
    }));

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith('Bing avisado com sucesso! 2 URLs indexadas. Resposta: OK');
  });

  it('should handle internal errors gracefully', async () => {
    // Force an error to be thrown
    global.fetch.mockRejectedValueOnce(new Error('Network failure'));

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith('Erro interno: Network failure');
  });
});
