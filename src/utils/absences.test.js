import { describe, it, expect } from 'vitest';
import { absenceCoversDate, getAdjustedDay } from './absences.js';

describe('getAdjustedDay', () => {
  it('should return regular day of week for non-2026 dates', () => {
    // 2024-01-01 is Monday (1)
    expect(getAdjustedDay(new Date(2024, 0, 1))).toBe(1);
    // 2024-01-02 is Tuesday (2)
    expect(getAdjustedDay(new Date(2024, 0, 2))).toBe(2);
  });

  it('should return adjusted day for 2026 dates (sandbox testing)', () => {
    // 2026-01-01 is Thursday (4), adjusted should be (4+6)%7 = 3
    expect(getAdjustedDay(new Date(2026, 0, 1))).toBe(3);
    // 2026-01-04 is Sunday (0), adjusted should be (0+6)%7 = 6
    expect(getAdjustedDay(new Date(2026, 0, 4))).toBe(6);
  });
});

describe('absenceCoversDate', () => {
  describe('recurrence: none (single day or range)', () => {
    it('returns false if startDate is missing', () => {
      expect(absenceCoversDate({ recurrence: 'none' }, '2024-01-01')).toBe(false);
    });

    it('matches exact startDate when endDate is not provided', () => {
      const absence = { startDate: '2024-01-01', recurrence: 'none' };
      expect(absenceCoversDate(absence, '2024-01-01')).toBe(true);
      expect(absenceCoversDate(absence, '2024-01-02')).toBe(false);
      expect(absenceCoversDate(absence, '2023-12-31')).toBe(false);
    });

    it('matches within date range (startDate to endDate)', () => {
      const absence = { startDate: '2024-01-01', endDate: '2024-01-03', recurrence: 'none' };
      expect(absenceCoversDate(absence, '2024-01-01')).toBe(true);
      expect(absenceCoversDate(absence, '2024-01-02')).toBe(true);
      expect(absenceCoversDate(absence, '2024-01-03')).toBe(true);
      expect(absenceCoversDate(absence, '2023-12-31')).toBe(false);
      expect(absenceCoversDate(absence, '2024-01-04')).toBe(false);
    });
  });

  describe('recurrence: weekly', () => {
    it('returns false if neither weekday nor startDate is provided', () => {
      expect(absenceCoversDate({ recurrence: 'weekly' }, '2024-01-01')).toBe(false);
    });

    it('returns false if date is before startDate', () => {
      const absence = { recurrence: 'weekly', startDate: '2024-01-08', weekday: 1 };
      expect(absenceCoversDate(absence, '2024-01-01')).toBe(false); // earlier
    });

    it('matches correct weekday based on explicit weekday property', () => {
      const absence = { recurrence: 'weekly', weekday: 1 }; // Monday
      // 2024-01-01 is Monday
      expect(absenceCoversDate(absence, '2024-01-01')).toBe(true);
      // 2024-01-02 is Tuesday
      expect(absenceCoversDate(absence, '2024-01-02')).toBe(false);
      // 2024-01-08 is Monday
      expect(absenceCoversDate(absence, '2024-01-08')).toBe(true);
    });

    it('derives weekday from startDate if weekday property is missing', () => {
      // 2024-01-01 is Monday (1)
      const absence = { recurrence: 'weekly', startDate: '2024-01-01' };
      // same day
      expect(absenceCoversDate(absence, '2024-01-01')).toBe(true);
      // next week same day
      expect(absenceCoversDate(absence, '2024-01-08')).toBe(true);
      // wrong day
      expect(absenceCoversDate(absence, '2024-01-02')).toBe(false);
    });

    it('works with string-type weekday', () => {
      const absence = { recurrence: 'weekly', weekday: '2' }; // Tuesday
      // 2024-01-02 is Tuesday
      expect(absenceCoversDate(absence, '2024-01-02')).toBe(true);
    });
  });

  describe('recurrence: monthly', () => {
    it('returns false if startDate is missing', () => {
      expect(absenceCoversDate({ recurrence: 'monthly' }, '2024-01-01')).toBe(false);
    });

    it('returns false if date is before startDate', () => {
      const absence = { recurrence: 'monthly', startDate: '2024-02-15' };
      expect(absenceCoversDate(absence, '2024-01-15')).toBe(false);
    });

    it('matches the same day of the month as startDate', () => {
      const absence = { recurrence: 'monthly', startDate: '2024-01-15' };
      // same month
      expect(absenceCoversDate(absence, '2024-01-15')).toBe(true);
      // next month
      expect(absenceCoversDate(absence, '2024-02-15')).toBe(true);
      // wrong day
      expect(absenceCoversDate(absence, '2024-01-16')).toBe(false);
    });
  });

  describe('fallback / missing recurrence', () => {
    it('treats missing recurrence as "none"', () => {
      const absence = { startDate: '2024-01-01' };
      expect(absenceCoversDate(absence, '2024-01-01')).toBe(true);
      expect(absenceCoversDate(absence, '2024-01-02')).toBe(false);
    });
  });
});
