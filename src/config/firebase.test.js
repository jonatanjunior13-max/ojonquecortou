import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}));

const mockAuth = { currentUser: null };

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => mockAuth),
  setPersistence: vi.fn(() => Promise.resolve()),
  indexedDBLocalPersistence: {},
  browserLocalPersistence: {},
}));

vi.stubEnv('VITE_FIREBASE_API_KEY', 'valid-api-key');

import * as firebaseConfig from './firebase.js';

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
}));

describe('getRefreshedToken', () => {
  let consoleErrorMock;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorMock.mockRestore();
  });

  it('should return null if there is no current user', async () => {
    firebaseConfig.auth.currentUser = null;
    const result = await firebaseConfig.getRefreshedToken();
    expect(result).toBeNull();
  });

  it('should return the token when getIdToken succeeds', async () => {
    const mockToken = 'mock-id-token';
    firebaseConfig.auth.currentUser = {
      getIdToken: vi.fn().mockResolvedValue(mockToken),
    };

    const result = await firebaseConfig.getRefreshedToken();

    expect(firebaseConfig.auth.currentUser.getIdToken).toHaveBeenCalledWith(true);
    expect(result).toBe(mockToken);
  });

  it('should return null and log an error if getIdToken throws', async () => {
    const mockError = new Error('Refresh failed');
    firebaseConfig.auth.currentUser = {
      getIdToken: vi.fn().mockRejectedValue(mockError),
    };

    const result = await firebaseConfig.getRefreshedToken();

    expect(firebaseConfig.auth.currentUser.getIdToken).toHaveBeenCalledWith(true);
    expect(consoleErrorMock).toHaveBeenCalledWith('Error refreshing token:', mockError);
    expect(result).toBeNull();
  });
});
