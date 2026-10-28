import { describe, expect, it } from 'vitest';
import {
  accessEndDate,
  daysUntil,
  formatBytes,
  formatDate,
  formatDuration,
  formatMoney,
  fromLocalInput,
  initials,
  todayIso,
  toLocalInput,
} from './format';

describe('format utilities', () => {
  it('treats YYYY-MM-DD as a calendar date (no timezone shift)', () => {
    expect(formatDate('2026-01-15')).toContain('15');
    expect(formatDate(null)).toBe('—');
  });

  it('formats durations as m:ss or h:mm:ss', () => {
    expect(formatDuration(38)).toBe('0:38');
    expect(formatDuration(80)).toBe('1:20');
    expect(formatDuration(3725)).toBe('1:02:05');
  });

  it('builds initials without titles', () => {
    expect(initials('Dr. Robert Wilson')).toBe('RW');
    expect(initials('Arun Kumar')).toBe('AK');
  });

  it('formats file sizes', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(20 * 1024 * 1024)).toBe('20.0 MB');
  });

  it('round-trips datetime-local values', () => {
    const iso = fromLocalInput('2026-11-03T21:00');
    expect(toLocalInput(iso)).toBe('2026-11-03T21:00');
    expect(fromLocalInput('')).toBeNull();
  });

  it('formats money in the fee currency', () => {
    expect(formatMoney(36000, 'AUD')).toBe('$36,000');
    expect(formatMoney('10000.5', 'AUD')).toBe('$10,000.50');
    expect(formatMoney(null)).toBe('$0');
    expect(formatMoney(1500, 'INR')).toBe('₹1,500');
  });

  it('computes the last day of access like the API (start + duration − 1 day)', () => {
    expect(accessEndDate('2026-01-01', 3, 'months')).toBe('2026-03-31');
    expect(accessEndDate('2026-01-31', 1, 'months')).toBe('2026-02-27');
    expect(accessEndDate('2026-01-01', 6, 'weeks')).toBe('2026-02-11');
    expect(accessEndDate('2026-01-01', 1, 'years')).toBe('2026-12-31');
    expect(accessEndDate('2026-01-01', 10, 'days')).toBe('2026-01-10');
    expect(accessEndDate('2026-01-01', null, null)).toBeNull();
  });

  it('counts days until a date', () => {
    expect(daysUntil(todayIso())).toBe(0);
    expect(daysUntil(null)).toBeNull();
    expect(daysUntil('2000-01-01')).toBeLessThan(0);
  });
});
