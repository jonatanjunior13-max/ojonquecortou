import { describe, it, expect } from 'vitest';
import { absenceCoversDate, isDayBlockedByAbsence } from './absences.js';

describe('absences utils', () => {
  describe('absenceCoversDate', () => {
    it('should handle recurrence: none (single day)', () => {
      const absence = { recurrence: 'none', startDate: '2023-10-15', endDate: '2023-10-15' };
      expect(absenceCoversDate(absence, '2023-10-15')).toBe(true);
      expect(absenceCoversDate(absence, '2023-10-14')).toBe(false);
      expect(absenceCoversDate(absence, '2023-10-16')).toBe(false);
    });

    it('should handle recurrence: none (date range)', () => {
      const absence = { recurrence: 'none', startDate: '2023-10-15', endDate: '2023-10-20' };
      expect(absenceCoversDate(absence, '2023-10-14')).toBe(false);
      expect(absenceCoversDate(absence, '2023-10-15')).toBe(true);
      expect(absenceCoversDate(absence, '2023-10-17')).toBe(true);
      expect(absenceCoversDate(absence, '2023-10-20')).toBe(true);
      expect(absenceCoversDate(absence, '2023-10-21')).toBe(false);
    });

    it('should default to recurrence: none if not provided', () => {
      const absence = { startDate: '2023-10-15', endDate: '2023-10-15' };
      expect(absenceCoversDate(absence, '2023-10-15')).toBe(true);
      expect(absenceCoversDate(absence, '2023-10-16')).toBe(false);
    });

    it('should handle missing startDate for recurrence: none', () => {
      const absence = { recurrence: 'none' };
      expect(absenceCoversDate(absence, '2023-10-15')).toBe(false);
    });

    it('should handle missing endDate for recurrence: none (treats as same as startDate)', () => {
      const absence = { recurrence: 'none', startDate: '2023-10-15' };
      expect(absenceCoversDate(absence, '2023-10-15')).toBe(true);
      expect(absenceCoversDate(absence, '2023-10-16')).toBe(false);
    });

    it('should handle recurrence: weekly', () => {
      // 2023-10-16 is Monday (adjusted day 1 in 2023)
      // Note: getAdjustedDay returns standard getDay() except for year 2026.
      // Date('2023-10-16') is Monday (day 1).
      const absence = { recurrence: 'weekly', startDate: '2023-10-16', weekday: 1 };

      // Before start date
      expect(absenceCoversDate(absence, '2023-10-09')).toBe(false);

      // On start date (Monday)
      expect(absenceCoversDate(absence, '2023-10-16')).toBe(true);

      // Next Monday
      expect(absenceCoversDate(absence, '2023-10-23')).toBe(true);

      // Next Tuesday
      expect(absenceCoversDate(absence, '2023-10-24')).toBe(false);
    });

    it('should handle recurrence: weekly deriving weekday from startDate if missing', () => {
      // 2023-10-16 is Monday
      const absence = { recurrence: 'weekly', startDate: '2023-10-16' };
      expect(absenceCoversDate(absence, '2023-10-16')).toBe(true);
      expect(absenceCoversDate(absence, '2023-10-23')).toBe(true);
      expect(absenceCoversDate(absence, '2023-10-24')).toBe(false);
    });

    it('should handle recurrence: weekly with missing weekday and missing startDate', () => {
      const absence = { recurrence: 'weekly' };
      expect(absenceCoversDate(absence, '2023-10-16')).toBe(false);
    });

    it('should handle recurrence: monthly', () => {
      // Starts on the 15th
      const absence = { recurrence: 'monthly', startDate: '2023-10-15' };

      // Before start date
      expect(absenceCoversDate(absence, '2023-09-15')).toBe(false);

      // Same month, same day
      expect(absenceCoversDate(absence, '2023-10-15')).toBe(true);

      // Same month, different day
      expect(absenceCoversDate(absence, '2023-10-16')).toBe(false);

      // Next month, same day
      expect(absenceCoversDate(absence, '2023-11-15')).toBe(true);

      // Next month, different day
      expect(absenceCoversDate(absence, '2023-11-16')).toBe(false);
    });

    it('should handle missing startDate for recurrence: monthly', () => {
      const absence = { recurrence: 'monthly' };
      expect(absenceCoversDate(absence, '2023-10-15')).toBe(false);
    });
  });

  describe('isDayBlockedByAbsence', () => {
    it('should return true if any absence covers the date and is allDay', () => {
      const absences = [
        { allDay: false, recurrence: 'none', startDate: '2023-10-15' },
        { allDay: true, recurrence: 'none', startDate: '2023-10-15' }
      ];
      expect(isDayBlockedByAbsence(absences, '2023-10-15')).toBe(true);
    });

    it('should return false if absence covers the date but is not allDay', () => {
      const absences = [
        { allDay: false, recurrence: 'none', startDate: '2023-10-15' }
      ];
      expect(isDayBlockedByAbsence(absences, '2023-10-15')).toBe(false);
    });

    it('should return false if allDay absence does not cover the date', () => {
      const absences = [
        { allDay: true, recurrence: 'none', startDate: '2023-10-15' }
      ];
      expect(isDayBlockedByAbsence(absences, '2023-10-16')).toBe(false);
    });

    it('should handle empty or null/undefined absences array', () => {
      expect(isDayBlockedByAbsence([], '2023-10-15')).toBe(false);
      expect(isDayBlockedByAbsence(null, '2023-10-15')).toBe(false);
      expect(isDayBlockedByAbsence(undefined, '2023-10-15')).toBe(false);
    });
  });
});
