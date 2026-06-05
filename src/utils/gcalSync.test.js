import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { syncBookingToGoogle } from './gcalSync';
import { doc, getDoc } from 'firebase/firestore';

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn()
}));

vi.mock('../config/firebase', () => ({
  db: {}
}));

describe('gcalSync delete path', () => {
  let fetchSpy;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async () => {
      return {
        json: async () => ({ success: true })
      };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('verifies that a DELETE request is made to the /api/gcal endpoint when isDelete is true', async () => {
    const bookingId = '123';

    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ googleEventId: 'event123' })
    });

    // Call the function with isDelete = true
    const result = await syncBookingToGoogle(bookingId, true);

    // Assert that a DELETE request is made to /api/gcal
    expect(fetchSpy).toHaveBeenCalledWith(`/api/gcal?action=sync&bookingId=${bookingId}`, {
      method: 'DELETE'
    });
    expect(result).toEqual({ success: true });
  });

  it('makes a POST request when isDelete is false', async () => {
    const bookingId = '123';

    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({})
    });

    const result = await syncBookingToGoogle(bookingId);

    expect(fetchSpy).toHaveBeenCalledWith(`/api/gcal?action=sync&bookingId=${bookingId}`, {
      method: 'POST'
    });
    expect(result).toEqual({ success: true });
  });

  it('handles booking not found error', async () => {
    getDoc.mockResolvedValueOnce({
      exists: () => false
    });

    const bookingId = '123';
    const result = await syncBookingToGoogle(bookingId);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result).toEqual({ success: false, error: 'Booking not found' });
  });
});
