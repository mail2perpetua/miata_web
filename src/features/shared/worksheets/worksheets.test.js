import { describe, expect, it } from 'vitest';
import { CATEGORIES, categoryLabel, entryErrors, formatHours, scanHoursLabel } from './worksheets';

describe('worksheet helpers', () => {
  it('lists the twelve logbook categories with their labels', () => {
    expect(CATEGORIES).toHaveLength(12);
    expect(categoryLabel('cardiac_echo')).toBe('Cardiac / Echocardiography');
    expect(categoryLabel('unknown')).toBe('unknown');
  });

  it('formats hours and totals', () => {
    expect(formatHours(2.5)).toBe('2.5');
    expect(formatHours(3)).toBe('3');
    expect(formatHours('1.25')).toBe('1.25');
    expect(scanHoursLabel(1, 0.5)).toBe('1 scan · 0.5 h');
    expect(scanHoursLabel(12, 7.5)).toBe('12 scans · 7.5 h');
  });

  it('checks scan log entries like the API', () => {
    expect(entryErrors({ scanCount: '4', durationHours: '2.5' })).toEqual({});
    expect(entryErrors({ scanCount: '0', durationHours: '1' })).toEqual({});
    expect(entryErrors({ scanCount: '', durationHours: '' })).toEqual({ scanCount: 'Enter the number of scans or the training hours' });
    expect(entryErrors({ scanCount: '2.5', durationHours: '1' }).scanCount).toBe('Use a whole number');
    expect(entryErrors({ scanCount: '1', durationHours: '1.255' }).durationHours).toMatch(/two decimals/);
    expect(entryErrors({ scanCount: '1', durationHours: '25' }).durationHours).toMatch(/24 hours/);
  });
});
