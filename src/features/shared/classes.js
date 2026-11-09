import { DAY_LABEL, timeRange, weekDates } from './timetable';

// Classes as the API dates them (GET /student/classes, GET /student/courses/:id, GET /professor/modules/:id): weekly
// timetable sessions and online classes. These helpers lay them out by calendar week (Monday to Sunday) and label them.
// Calendar dates ('YYYY-MM-DD') are handled as UTC days so they never shift; instants are shown in the viewer's time zone.

const DAY_MS = 86_400_000;
const toUtc = (iso) => Date.parse(`${iso}T00:00:00Z`);
const fromUtc = (ms) => new Date(ms).toISOString().slice(0, 10);
const pad = (n) => String(n).padStart(2, '0');

export const addDays = (iso, days) => fromUtc(toUtc(iso) + days * DAY_MS);

/** The Monday of the week a date falls in. */
export const weekStart = (iso) => addDays(iso, -((new Date(toUtc(iso)).getUTCDay() + 6) % 7));

/** The viewer's calendar date of an instant (now by default). */
export function localDate(instant = Date.now()) {
  const d = new Date(instant);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** The day a class is on (a timed class: in the viewer's time zone), or null when only its week is known. */
export const classDay = (c) => (c.startsAt ? localDate(c.startsAt) : c.date);

/** upcoming | live | completed | cancelled. A timed class is live between its start and end, so a page left open stays right. */
export function classState(c, now = Date.now()) {
  if (c.status === 'cancelled' || !c.startsAt || !c.endsAt) return c.status;
  if (now >= Date.parse(c.endsAt)) return 'completed';
  return now >= Date.parse(c.startsAt) ? 'live' : 'upcoming';
}

// Within a day, classes without a time come first, then in time order.
const timeOf = (c) => (c.startsAt ? Date.parse(c.startsAt) : 0);

/**
 * The week starting on Monday `start`: its seven days with their classes, and the sessions taught that week on a day
 * still to be agreed (`open`).
 */
export function weekSchedule(classes, start) {
  const end = addDays(start, 6);
  const days = Array.from({ length: 7 }, (_, i) => ({ date: addDays(start, i), classes: [] }));
  const open = [];
  for (const c of classes) {
    const day = classDay(c);
    if (day) {
      if (day >= start && day <= end) days[(toUtc(day) - toUtc(start)) / DAY_MS].classes.push(c);
    } else if (c.windowStart && c.windowStart <= end && c.windowEnd >= start) {
      open.push(c);
    }
  }
  for (const d of days) d.classes.sort((a, b) => timeOf(a) - timeOf(b));
  return { days, open };
}

/** The first day with a class after the week starting on `start` (direction 1), or the last one before it (−1); null if none. */
export function nearestClassDay(classes, start, direction) {
  const end = addDays(start, 6);
  const days = classes
    .map((c) => classDay(c) ?? (direction > 0 ? c.windowStart : c.windowEnd))
    .filter((d) => d && (direction > 0 ? d > end : d < start))
    .sort();
  return (direction > 0 ? days[0] : days.at(-1)) ?? null;
}

/**
 * Up to `limit` sessions of a schedule around now: from the one before the next class onwards, filled up with earlier
 * ones near the end. Every session when there are no more than `limit`.
 */
export function sessionWindow(sessions, limit) {
  if (sessions.length <= limit) return sessions;
  const next = sessions.findIndex((s) => s.status !== 'completed');
  const from = next === -1 ? sessions.length - limit : Math.min(Math.max(next - 1, 0), sessions.length - limit);
  return sessions.slice(from, from + limit);
}

const longDay = new Intl.DateTimeFormat('en-AU', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const shortDay = new Intl.DateTimeFormat('en-AU', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
const clock = new Intl.DateTimeFormat('en-AU', { hour: 'numeric', minute: '2-digit' });

const weekdayName = new Intl.DateTimeFormat('en-AU', { weekday: 'short', timeZone: 'UTC' });

/** 'YYYY-MM-DD' → "Sunday 8 Nov 2026", or with `short` "Sun 8 Nov". */
export const dayLabel = (iso, { short = false } = {}) => (short ? shortDay : longDay).format(new Date(toUtc(iso)));

/** 'YYYY-MM-DD' → ["Sun", 8]: the weekday and day of the month, for a calendar cell. */
export const dayParts = (iso) => [weekdayName.format(new Date(toUtc(iso))), Number(iso.slice(8))];

/** "Sunday 8 Nov 2026"; for a session on a day still open, "Mutually agreed day · 2–8 Nov 2026". */
export function classDateLabel(c, { short = false } = {}) {
  const day = classDay(c);
  if (day) return dayLabel(day, { short });
  if (!c.windowStart) return 'Date to be confirmed';
  return `${DAY_LABEL[c.deliveryDay] ?? 'Day to be confirmed'} · ${weekDates({ startsOn: c.windowStart, endsOn: c.windowEnd })}`;
}

/** Start and end in the viewer's time zone ("6:00 pm – 7:30 pm"), the timetable's time, or "Time to be confirmed". */
export function classTimeLabel(c) {
  if (c.startsAt) {
    const start = clock.format(new Date(c.startsAt));
    return c.endsAt ? `${start} – ${clock.format(new Date(c.endsAt))}` : `From ${start}`;
  }
  return timeRange(c.startTime, c.endTime) ?? 'Time to be confirmed';
}

/** The start and end clock times of a timed class, for a time column (null when it has no time). */
export const classClock = (c) => (c.startsAt ? [clock.format(new Date(c.startsAt)), c.endsAt && clock.format(new Date(c.endsAt))] : null);

/** "Sun 8 Nov · 6:00 pm – 7:00 pm", or the date alone while the time is to be confirmed. */
export function classWhenShort(c) {
  const date = classDateLabel(c, { short: true });
  const time = c.startsAt || c.startTime ? classTimeLabel(c) : null;
  return time ? `${date} · ${time}` : date;
}

export const CLASS_STATE = {
  upcoming: ['Upcoming', 'blue'],
  live: ['Live now', 'green'],
  completed: ['Completed', 'purple'],
  cancelled: ['Cancelled', 'red'],
};

export const MODE_LABEL = { online: 'Online', offline: 'Offline' };

/** A module as the timetable labels it: "M3 · Obstetric Sonography". */
export const moduleLabel = (c) => (c.moduleId ? `M${c.moduleNumber} · ${c.moduleTitle}` : null);

// The faculty of a module (GET /student/courses/:id → modules[].faculty) and what each role means.
export const ROLE_LABEL = {
  lecturer: 'Lecturer',
  module_professor: 'Module Professor',
  batch_professor: 'Batch Professor',
  course_professor: 'Course Professor',
};

/** "Lecturer · Module Professor": a person's designation on a module. */
export const designation = (person) => person.roles.map((r) => ROLE_LABEL[r]).join(' · ');
