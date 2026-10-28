// Course timetables: the API returns the weeks (dates, current week) and their sessions; these helpers format them for
// the admin, professor and student timetables. A session is a lesson with a programme week and a course lecturer.

export const DAY_LABEL = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
  weekday: 'Weekday',
  agreed: 'Mutually agreed day',
};
export const DAY_OPTIONS = Object.entries(DAY_LABEL).map(([value, label]) => ({ value, label }));

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const parts = (iso) => iso.split('-').map(Number);
const toUtc = (iso) => Date.UTC(...parts(iso).map((n, i) => (i === 1 ? n - 1 : n)));
const fromUtc = (ms) => new Date(ms).toISOString().slice(0, 10);

/** Programme weeks from the start to the end date inclusive (week 1 begins on the start date), as the API counts them. */
export const weeksInRange = (start, end) => Math.ceil(((toUtc(end) - toUtc(start)) / 86_400_000 + 1) / 7);

/** First and last day of week `n` of a course starting on `start`. */
export const weekBounds = (start, n) => ({
  startsOn: fromUtc(toUtc(start) + (n - 1) * 7 * 86_400_000),
  endsOn: fromUtc(toUtc(start) + ((n - 1) * 7 + 6) * 86_400_000),
});

/** "19–25 Oct 2026", "26 Oct – 1 Nov 2026", "28 Dec 2026 – 3 Jan 2027". */
export function weekDates({ startsOn, endsOn }) {
  const [sy, sm, sd] = parts(startsOn);
  const [ey, em, ed] = parts(endsOn);
  if (sy === ey && sm === em) return `${sd}–${ed} ${MONTHS[em - 1]} ${ey}`;
  if (sy === ey) return `${sd} ${MONTHS[sm - 1]} – ${ed} ${MONTHS[em - 1]} ${ey}`;
  return `${sd} ${MONTHS[sm - 1]} ${sy} – ${ed} ${MONTHS[em - 1]} ${ey}`;
}

export const weekLabel = (n) => `Week ${String(n).padStart(2, '0')}`;

/** 60 → "1 hour", 90 → "1 h 30 min", 45 → "45 min". */
export function sessionLength(minutes) {
  if (!minutes) return null;
  if (minutes % 60 === 0) return minutes === 60 ? '1 hour' : `${minutes / 60} hours`;
  return minutes > 60 ? `${Math.floor(minutes / 60)} h ${minutes % 60} min` : `${minutes} min`;
}

const timeFmt = new Intl.DateTimeFormat('en-AU', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });
const clock = (t) => timeFmt.format(new Date(`1970-01-01T${t.slice(0, 5)}:00Z`));

/** "6:00 pm – 7:00 pm", "From 6:00 pm", or null when no time is set. */
export function timeRange(start, end) {
  if (start && end) return `${clock(start)} – ${clock(end)}`;
  if (start) return `From ${clock(start)}`;
  return null;
}

/** [1, 2, 3, 4, 21, 24] → "Weeks 1–4, 21, 24"; [5] → "Week 5". */
export function weeksLabel(weeks) {
  if (!weeks.length) return 'Not scheduled';
  const ranges = [];
  for (const w of weeks) {
    const last = ranges.at(-1);
    if (last && w === last[1] + 1) last[1] = w;
    else if (!last || w !== last[1]) ranges.push([w, w]);
  }
  return `${weeks.length === 1 ? 'Week' : 'Weeks'} ${ranges.map(([a, b]) => (a === b ? `${a}` : `${a}–${b}`)).join(', ')}`;
}

/** "Sunday · 1 hour · time to be confirmed": a lecturer's weekly session, saying so when no time is set. */
export function sessionSummary(lecturer) {
  const time = timeRange(lecturer.startTime, lecturer.endTime);
  const text = [DAY_LABEL[lecturer.deliveryDay], time, sessionLength(lecturer.sessionMinutes)].filter(Boolean).join(' · ');
  if (!text) return 'Session not set';
  return time ? text : `${text} · time to be confirmed`;
}

/**
 * What a lecturer's row shows in a week without a session: their stream has ended after their last session (the first
 * such week says so in full), else simply nothing that week.
 */
export function emptySlot(lecturer, weekNumber) {
  if (lecturer.lastWeek && weekNumber > lecturer.lastWeek) {
    return weekNumber === lecturer.lastWeek + 1 ? 'Module complete — no further scheduled weekly teaching' : 'Module complete';
  }
  return 'No session this week';
}
