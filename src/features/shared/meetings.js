// Online classes: helpers shared by the professor, student and admin pages.

export const PLATFORM_LABEL = { google_meet: 'Google Meet', zoom: 'Zoom', teams: 'Microsoft Teams' };

/** upcoming | live | ended | cancelled — derived from the times, so badges stay right while a page is open. */
export function meetingState(meeting, now = Date.now()) {
  if (meeting.status === 'cancelled') return 'cancelled';
  if (now >= new Date(meeting.endsAt).getTime()) return 'ended';
  if (now >= new Date(meeting.startsAt).getTime()) return 'live';
  return 'upcoming';
}

const dayFmt = new Intl.DateTimeFormat('en-AU', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('en-AU', { hour: 'numeric', minute: '2-digit' });

/** "Tue, 20 Oct 2026" and "10:00 am – 11:00 am", in the viewer's time zone. */
export const meetingDate = (m) => dayFmt.format(new Date(m.startsAt));
export const meetingTime = (m) => `${timeFmt.format(new Date(m.startsAt))} – ${timeFmt.format(new Date(m.endsAt))}`;

// [platform, hosts matched exactly, domains matched with any subdomain] — the same list as the API (meetings.service.js).
const PLATFORM_HOSTS = [
  ['google_meet', ['meet.google.com'], []],
  ['zoom', [], ['zoom.us', 'zoom.com', 'zoomgov.com']],
  ['teams', ['teams.microsoft.com', 'teams.live.com', 'teams.cloud.microsoft'], ['teams.microsoft.us']],
];

/** The link as the API stores it: trimmed, and read as https when pasted without a scheme ("teams.live.com/meet/…"). */
export function meetingLink(value) {
  const link = value.trim();
  return /^[a-z][a-z\d+.-]*:/i.test(link) ? link : `https://${link.replace(/^\/+/, '')}`;
}

/** The API's rule: an https Google Meet, Zoom or Microsoft Teams link. Returns the platform, or null. */
export function linkPlatform(value) {
  let url;
  try {
    url = new URL(meetingLink(value));
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname.length < 2) return null;
  const host = url.hostname.toLowerCase();
  const match = PLATFORM_HOSTS.find(
    ([, hosts, domains]) => hosts.includes(host) || domains.some((d) => host === d || host.endsWith(`.${d}`)),
  );
  return match ? match[0] : null;
}

const clockMinutes = (time) => {
  const match = /^(\d{2}):(\d{2})/.exec(time ?? '');
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
};

/**
 * Length of a class from its start and end times ("HH:MM"). An end time at or before the start time is on the next day,
 * so a late class can run past midnight. null until both times are set.
 */
export function classLength(start, end) {
  const from = clockMinutes(start);
  const to = clockMinutes(end);
  if (from === null || to === null) return null;
  const nextDay = to <= from;
  return { minutes: to - from + (nextDay ? 24 * 60 : 0), nextDay };
}

/** 90 → "1 hour 30 minutes", 45 → "45 minutes", 120 → "2 hours". */
export function durationLabel(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const parts = [hours && `${hours} hour${hours === 1 ? '' : 's'}`, rest && `${rest} minute${rest === 1 ? '' : 's'}`];
  return parts.filter(Boolean).join(' ') || '0 minutes';
}

export const audienceLabel = (m) => (m.audience === 'batch' ? 'Whole batch' : 'Selected students');
