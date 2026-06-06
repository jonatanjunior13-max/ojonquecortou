import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler from './reviews.js';

describe('Reviews API Handler', () => {
  let req;
  let res;

  beforeEach(() => {
    // Reset global fetch mock before each test
    global.fetch = vi.fn();

    // Mock request object
    req = {
      method: 'GET',
    };

    // Mock response object with chained methods
    res = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      end: vi.fn(),
    };

    // Save original env vars
    vi.stubEnv('GOOGLE_PLACES_API_KEY', 'test_api_key');
    vi.stubEnv('GOOGLE_PLACE_ID', 'test_place_id');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('should handle OPTIONS request for CORS', async () => {
    req.method = 'OPTIONS';

    await handler(req, res);

    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Credentials', true);
    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET,OPTIONS');
    expect(res.setHeader).toHaveBeenCalledWith(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.end).toHaveBeenCalled();
  });

  it('should return 500 if environment variables are missing', async () => {
    vi.unstubAllEnvs(); // Remove env vars for this test

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Configuração da API ausente (GOOGLE_PLACES_API_KEY ou GOOGLE_PLACE_ID)',
    });
  });

  it('should return successfully processed reviews when API returns OK', async () => {
    const mockApiResponse = {
      status: 'OK',
      result: {
        rating: 4.8,
        user_ratings_total: 100,
        reviews: [
          // Good review (rating 5, length > 10)
          { rating: 5, text: 'This place is absolutely fantastic!', time: 1000 },
          // Bad review (rating 3, will be filtered out)
          { rating: 3, text: 'It was okay, not great.', time: 2000 },
          // Short review (length <= 10, will be filtered out)
          { rating: 5, text: 'Great!', time: 3000 },
          // No text review (will be filtered out)
          { rating: 5, time: 4000 },
          // Good review (rating 4, length > 10, newest)
          { rating: 4, text: 'Really good experience overall.', time: 5000 },
          // More good reviews to test slice(0, 6)
          { rating: 5, text: 'Awesome 11111111', time: 6000 },
          { rating: 5, text: 'Awesome 22222222', time: 7000 },
          { rating: 5, text: 'Awesome 33333333', time: 8000 },
          { rating: 5, text: 'Awesome 44444444', time: 9000 },
          { rating: 5, text: 'Awesome 55555555', time: 10000 },
        ],
      },
    };

    global.fetch.mockResolvedValueOnce({
      json: vi.fn().mockResolvedValueOnce(mockApiResponse),
    });

    await handler(req, res);

    // Verify fetch was called with correct URL
    expect(global.fetch).toHaveBeenCalledWith(
      'https://maps.googleapis.com/maps/api/place/details/json?place_id=test_place_id&fields=reviews,rating,user_ratings_total&language=pt-BR&reviews_sort=newest&key=test_api_key'
    );

    // Verify cache control header
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 's-maxage=900, stale-while-revalidate');

    // Verify response status and json
    expect(res.status).toHaveBeenCalledWith(200);

    // We expect exactly 6 reviews, sorted by time descending
    expect(res.json).toHaveBeenCalledWith({
      rating: 4.8,
      total: 100,
      reviews: [
        { rating: 5, text: 'Awesome 55555555', time: 10000 },
        { rating: 5, text: 'Awesome 44444444', time: 9000 },
        { rating: 5, text: 'Awesome 33333333', time: 8000 },
        { rating: 5, text: 'Awesome 22222222', time: 7000 },
        { rating: 5, text: 'Awesome 11111111', time: 6000 },
        { rating: 4, text: 'Really good experience overall.', time: 5000 },
      ],
    });
  });

  it('should return 500 if API response status is not OK', async () => {
    const mockApiResponse = {
      status: 'INVALID_REQUEST',
      error_message: 'The provided API key is invalid.',
    };

    global.fetch.mockResolvedValueOnce({
      json: vi.fn().mockResolvedValueOnce(mockApiResponse),
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Falha ao buscar avaliações',
      details: mockApiResponse,
    });
  });

  it('should return 500 if network request fails', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    // We might want to spy on console.error to avoid cluttering test output,
    // but the handler calls console.error('Erro na API de Reviews:', error);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Erro interno no servidor',
    });

    consoleSpy.mockRestore();
  });
});
