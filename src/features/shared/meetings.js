// Online classes: helpers shared by the professor, student and admin pages.

export const PLATFORM_LABEL = { google_meet: 'Google Meet', zoom: 'Zoom' };

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

/** The API's rule: an https Google Meet or Zoom link. Returns the platform, or null. */
export function linkPlatform(value) {
  let url;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname.length < 2) return null;
  const host = url.hostname.toLowerCase();
  if (host === 'meet.google.com') return 'google_meet';
  if (host === 'zoom.us' || host.endsWith('.zoom.us')) return 'zoom';
  return null;
}

export const audienceLabel = (m) => (m.audience === 'batch' ? 'Whole batch' : 'Selected students');
