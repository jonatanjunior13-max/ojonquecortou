import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncBookingToGoogle } from './gcalSync';
import { doc, getDoc } from 'firebase/firestore';

// Mock Firebase as requested by the issue description
vi.mock('firebase/firestore', () => {
  return {
    doc: vi.fn(),
    getDoc: vi.fn(),
    updateDoc: vi.fn(),
  };
});

vi.mock('../config/firebase', () => {
  return {
    db: {},
  };
});

describe('syncBookingToGoogle', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    global.fetch = vi.fn();
    vi.clearAllMocks();
  });

  it('should call fetch with correct URL for creating a booking', async () => {
    const mockResponse = { success: true };
    global.fetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse)
    });

    getDoc.mockResolvedValueOnce({
      exists: () => true
    });

    const result = await syncBookingToGoogle('booking-123');

    expect(global.fetch).toHaveBeenCalledWith('/api/gcal?action=sync&bookingId=booking-123', {
      method: 'POST'
    });
    expect(result).toEqual(mockResponse);
  });

  it('should call fetch with correct URL when isDelete is true', async () => {
    const mockResponse = { success: true };
    global.fetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse)
    });

    getDoc.mockResolvedValueOnce({
      exists: () => true
    });

    const result = await syncBookingToGoogle('booking-123', true);

    expect(global.fetch).toHaveBeenCalledWith('/api/gcal?action=sync&bookingId=booking-123&delete=true', {
      method: 'POST'
    });
    expect(result).toEqual(mockResponse);
  });

  it('should throw an error and handle it when booking does not exist', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    getDoc.mockResolvedValueOnce({
      exists: () => false
    });

    const result = await syncBookingToGoogle('booking-not-found');

    expect(consoleSpy).toHaveBeenCalledWith('Error calling Google Calendar sync:', new Error('Booking not found'));
    expect(result).toEqual({ success: false, error: 'Booking not found' });
    expect(global.fetch).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should handle fetch errors gracefully', async () => {
    // Suppress console.warn during this test to keep output clean
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    getDoc.mockResolvedValueOnce({
      exists: () => true
    });

    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await syncBookingToGoogle('booking-123');

    expect(consoleSpy).toHaveBeenCalledWith('Error calling Google Calendar sync:', expect.any(Error));
    expect(result).toEqual({ success: false, error: 'Network error' });

    consoleSpy.mockRestore();
  });
});
