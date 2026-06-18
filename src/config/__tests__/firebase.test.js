import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchCollectionRest } from '../firebase.js';

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  setPersistence: vi.fn(() => Promise.resolve()),
  indexedDBLocalPersistence: {},
  browserLocalPersistence: {},
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(),
}));

describe('fetchCollectionRest', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch collection and parse documents correctly', async () => {
    const mockResponse = {
      documents: [
        {
          name: 'projects/test-project/databases/(default)/documents/test-collection/doc1',
          fields: {
            title: { stringValue: 'Test Document' },
            count: { integerValue: '42' },
          },
        },
      ],
    };

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await fetchCollectionRest('test-collection', 'fake-token');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test-collection'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer fake-token'
        })
      })
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 'doc1',
      title: 'Test Document',
      count: 42,
    });
  });

  it('should return an empty array if json.documents is falsy', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const result = await fetchCollectionRest('test-collection', 'fake-token');
    expect(result).toEqual([]);
  });

  it('should throw an error if the response is not ok', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: async () => 'Permission denied',
    });

    await expect(fetchCollectionRest('test-collection', 'fake-token')).rejects.toThrow();
  });
});
