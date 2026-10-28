import { describe, expect, it } from 'vitest';
import { emptySlot, sessionLength, sessionSummary, timeRange, weekBounds, weekDates, weeksInRange, weeksLabel } from './timetable';

describe('course timetable helpers', () => {
  it('counts and dates programme weeks as the printed timetable does', () => {
    expect(weeksInRange('2026-10-19', '2027-04-18')).toBe(26);
    expect(weekDates(weekBounds('2026-10-19', 1))).toBe('19–25 Oct 2026');
    expect(weekDates(weekBounds('2026-10-19', 2))).toBe('26 Oct – 1 Nov 2026');
    expect(weekDates(weekBounds('2026-10-19', 11))).toBe('28 Dec 2026 – 3 Jan 2027');
    expect(weekDates(weekBounds('2026-10-19', 26))).toBe('12–18 Apr 2027');
  });

  it('says "module complete" after a lecturer’s last session, never padding the stream', () => {
    const saranya = { lastWeek: 8 };
    expect(emptySlot(saranya, 9)).toBe('Module complete — no further scheduled weekly teaching');
    expect(emptySlot(saranya, 10)).toBe('Module complete');
    expect(emptySlot(saranya, 5)).toBe('No session this week');
    expect(emptySlot({ lastWeek: null }, 3)).toBe('No session this week');
  });

  it('describes a lecturer’s weekly session without inventing missing times', () => {
    expect(sessionSummary({ deliveryDay: 'sunday', sessionMinutes: 60 })).toBe('Sunday · 1 hour · time to be confirmed');
    expect(sessionSummary({ deliveryDay: 'weekday', startTime: '18:00:00', endTime: '19:00:00', sessionMinutes: 60 })).toBe(
      'Weekday · 6:00 pm – 7:00 pm · 1 hour',
    );
    expect(sessionSummary({})).toBe('Session not set');
    expect(timeRange(null, null)).toBeNull();
    expect(sessionLength(90)).toBe('1 h 30 min');
  });

  it('summarises weeks as ranges', () => {
    expect(weeksLabel([1, 2, 3, 4, 21, 24])).toBe('Weeks 1–4, 21, 24');
    expect(weeksLabel([5])).toBe('Week 5');
    expect(weeksLabel([])).toBe('Not scheduled');
  });
});
