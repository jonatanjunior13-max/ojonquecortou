import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { syncBookingToGoogle } from './gcalSync';

describe('syncBookingToGoogle', () => {
  let originalFetch;
  let originalConsoleWarn;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    originalConsoleWarn = console.warn;
    console.warn = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    console.warn = originalConsoleWarn;
    vi.restoreAllMocks();
  });

  it('should sync successfully (happy path)', async () => {
    const mockData = { success: true };
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue(mockData),
    });

    const result = await syncBookingToGoogle('123');

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/gcal?action=sync&bookingId=123', {
      method: 'POST',
    });
    expect(result).toEqual(mockData);
  });

  it('should sync successfully when deleting a booking', async () => {
    const mockData = { success: true };
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue(mockData),
    });

    const result = await syncBookingToGoogle('456', true);

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/gcal?action=sync&bookingId=456&delete=true', {
      method: 'POST',
    });
    expect(result).toEqual(mockData);
  });

  it('should handle fetch errors gracefully (error path)', async () => {
    const errorMessage = 'Network Error';
    globalThis.fetch = vi.fn().mockRejectedValue(new Error(errorMessage));

    const result = await syncBookingToGoogle('789');

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/gcal?action=sync&bookingId=789', {
      method: 'POST',
    });
    expect(console.warn).toHaveBeenCalledWith('Error calling Google Calendar sync:', expect.any(Error));
    expect(result).toEqual({ success: false, error: errorMessage });
  });
});
