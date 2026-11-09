import { describe, expect, it } from 'vitest';
import { addDays, classDateLabel, classState, designation, nearestClassDay, sessionWindow, weekSchedule, weekStart } from './classes';

// A Sunday session (date known), an agreed-day session (only its week known) and an online class at midday UTC (the same
// calendar day in every time zone from UTC−11 to UTC+11, so the test does not depend on where it runs).
const sunday = { key: 's1', status: 'upcoming', date: '2026-11-08', windowStart: '2026-11-02', windowEnd: '2026-11-08' };
const agreed = { key: 's2', status: 'upcoming', date: null, windowStart: '2026-11-02', windowEnd: '2026-11-08', deliveryDay: 'agreed' };
const online = {
  key: 'o1',
  status: 'upcoming',
  date: '2026-11-05',
  startsAt: '2026-11-05T12:00:00Z',
  endsAt: '2026-11-05T13:00:00Z',
};
const later = { key: 's3', status: 'upcoming', date: '2026-11-22', windowStart: '2026-11-16', windowEnd: '2026-11-22' };

describe('calendar weeks', () => {
  it('starts weeks on Monday', () => {
    expect(weekStart('2026-11-04')).toBe('2026-11-02'); // Wednesday
    expect(weekStart('2026-11-02')).toBe('2026-11-02'); // Monday
    expect(weekStart('2026-11-08')).toBe('2026-11-02'); // Sunday
    expect(weekStart('2027-01-01')).toBe('2026-12-28'); // across the year
    expect(addDays('2026-12-28', 7)).toBe('2027-01-04');
  });

  it('puts dated classes on their day and agreed-day sessions with their week', () => {
    const { days, open } = weekSchedule([later, agreed, sunday, online], '2026-11-02');
    expect(days.map((d) => d.date)).toEqual([
      '2026-11-02',
      '2026-11-03',
      '2026-11-04',
      '2026-11-05',
      '2026-11-06',
      '2026-11-07',
      '2026-11-08',
    ]);
    expect(days[3].classes.map((c) => c.key)).toEqual(['o1']);
    expect(days[6].classes.map((c) => c.key)).toEqual(['s1']);
    expect(open.map((c) => c.key)).toEqual(['s2']);
    expect(weekSchedule([later, agreed], '2026-11-09')).toMatchObject({ open: [] });
  });

  it('finds the nearest class day before or after a week', () => {
    const classes = [sunday, agreed, later];
    expect(nearestClassDay(classes, '2026-11-09', 1)).toBe('2026-11-22');
    expect(nearestClassDay(classes, '2026-11-09', -1)).toBe('2026-11-08');
    expect(nearestClassDay(classes, '2026-11-23', 1)).toBe(null);
  });
});

describe('class state and labels', () => {
  it('derives live and completed from the times, and keeps cancelled', () => {
    const at = (iso) => Date.parse(iso);
    expect(classState(online, at('2026-11-05T11:59:00Z'))).toBe('upcoming');
    expect(classState(online, at('2026-11-05T12:30:00Z'))).toBe('live');
    expect(classState(online, at('2026-11-05T13:00:00Z'))).toBe('completed');
    expect(classState({ ...online, status: 'cancelled' }, at('2026-11-05T12:30:00Z'))).toBe('cancelled');
    expect(classState({ ...sunday, status: 'completed' })).toBe('completed');
  });

  it('labels a fixed day and a day still to be agreed', () => {
    expect(classDateLabel(sunday)).toMatch(/Sunday.*8 Nov.*2026/);
    expect(classDateLabel(agreed)).toBe('Mutually agreed day · 2–8 Nov 2026');
    expect(classDateLabel({ ...agreed, windowStart: null })).toBe('Date to be confirmed');
  });

  it('names a person by their roles on the module', () => {
    expect(designation({ roles: ['lecturer', 'module_professor'] })).toBe('Lecturer · Module Professor');
    expect(designation({ roles: ['batch_professor'] })).toBe('Batch Professor');
  });
});

describe('session window', () => {
  const sessions = Array.from({ length: 10 }, (_, i) => ({ key: `s${i}`, status: i < 4 ? 'completed' : 'upcoming' }));
  it('shows the last completed session and the next ones', () => {
    expect(sessionWindow(sessions, 4).map((s) => s.key)).toEqual(['s3', 's4', 's5', 's6']);
  });
  it('fills up from earlier sessions near the end, and keeps short schedules whole', () => {
    const done = sessions.map((s) => ({ ...s, status: 'completed' }));
    expect(sessionWindow(done, 3).map((s) => s.key)).toEqual(['s7', 's8', 's9']);
    expect(sessionWindow(sessions.slice(0, 3), 4)).toHaveLength(3);
  });
});
