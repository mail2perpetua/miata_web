import { useEffect } from 'react';
import { ExternalLink, MonitorPlay, RefreshCw, Users } from 'lucide-react';
import {
  Alert,
  Button,
  Card,
  DataTable,
  EmptyState,
  ErrorState,
  InfoList,
  Modal,
  PageLoader,
  PersonCell,
  StatusBadge,
  useToast,
  ViewAll,
} from '@/components';
import { useApiAction } from '@/hooks/useApiAction';
import { useFetch } from '@/hooks/useFetch';
import { api } from '@/services/api';
import { formatDateTime } from '@/utils/format';
import { audienceLabel, meetingDate, meetingState, meetingTime, PLATFORM_LABEL } from './meetings';

export function MeetingStateBadge({ meeting }) {
  return <StatusBadge status={meetingState(meeting)} />;
}

/** Opens the Google Meet / Zoom link in a new tab. Hidden once the class has ended or was cancelled. */
export function JoinMeetingButton({ meeting, size = 'sm' }) {
  const state = meetingState(meeting);
  if (!meeting.meetingUrl || state === 'ended' || state === 'cancelled') return null;
  return (
    <a
      className={`btn btn--${state === 'live' ? 'primary' : 'secondary'}${size === 'sm' ? ' btn--sm' : ''}`}
      href={meeting.meetingUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      aria-label={`Join ${meeting.title} on ${PLATFORM_LABEL[meeting.platform]} (opens in a new tab)`}
    >
      <ExternalLink aria-hidden="true" /> Join Meeting
    </a>
  );
}

/** Dashboard card: the next online classes with their Join links. `sub(meeting)` is the second line (batch or professor). */
export function UpcomingMeetingsCard({ meetings, to, sub, emptyMessage }) {
  return (
    <Card title="Online Classes" icon={MonitorPlay} action={<ViewAll to={to} />} flush>
      {meetings.length ? (
        <ul className="list">
          {meetings.map((m) => {
            const state = meetingState(m);
            return (
              <li key={m.id} className="list__item">
                <div className="list__main">
                  <div className="list__title" title={m.title}>
                    {m.title}
                  </div>
                  <div className="list__sub">
                    {meetingDate(m)} · {meetingTime(m)}
                  </div>
                  <div className="list__sub">{sub(m)}</div>
                  <div className="row" style={{ gap: 8, marginTop: 8 }}>
                    {state !== 'upcoming' && <MeetingStateBadge meeting={m} />}
                    <JoinMeetingButton meeting={m} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState icon={MonitorPlay} title="No upcoming online classes" message={emptyMessage} />
      )}
    </Card>
  );
}

/** Delivery summary for a list row: the latest e-mail each invited student received. */
export function EmailSummary({ emails, invited }) {
  if (!emails || !invited) return <span className="muted">—</span>;
  const undelivered = emails.failed + emails.skipped;
  if (undelivered) return <StatusBadge status="failed" label={`${undelivered} not delivered`} />;
  if (emails.pending) return <StatusBadge status="pending" label="Sending…" />;
  return <StatusBadge status="sent" label={`${emails.sent} sent`} />;
}

const NOTICE = { meeting_scheduled: 'Invitation', meeting_updated: 'Update', meeting_cancelled: 'Cancellation' };

/**
 * Meeting details with every invited student and the e-mail they last received about it (organiser and admins).
 * `path` is the API path of the meeting; with `canResend`, failed or skipped e-mails can be sent again.
 */
export function MeetingDetailsModal({ path, onClose, onChange, canResend = false }) {
  const state = useFetch(path);
  const toast = useToast();
  const { run, busy } = useApiAction();
  const m = state.data;
  const sending = m?.recipients.some((r) => r.emailStatus === 'pending');
  const undelivered = m?.recipients.filter((r) => r.emailRetryable).length ?? 0;

  // E-mails are sent in the background right after a change: refresh until they have gone out.
  useEffect(() => {
    if (!sending) return undefined;
    const timer = setTimeout(state.reload, 1500);
    return () => clearTimeout(timer);
  }, [sending, state.reload, state.data]);

  const resend = () =>
    run(() => api.post(`${path}/resend`), {
      key: 'resend',
      onDone: (res) => {
        const r = res.data;
        state.setData(r.meeting);
        onChange?.();
        if (r.sent) toast.success(`${r.sent} e-mail${r.sent === 1 ? '' : 's'} sent`);
        if (r.skipped) toast.error('E-mail is not set up on the server (SMTP), so nothing could be sent.');
        else if (r.failed) toast.error(`${r.failed} e-mail${r.failed === 1 ? '' : 's'} still could not be delivered`);
        if (!r.retried) toast.info('Nothing to resend');
      },
    });

  return (
    <Modal open title={m ? m.title : 'Online class'} onClose={onClose} size="lg">
      {state.error ? (
        <ErrorState error={state.error} onRetry={state.reload} />
      ) : !m ? (
        <PageLoader />
      ) : (
        <div className="stack" style={{ gap: 18 }}>
          <div className="row row--wrap">
            <MeetingStateBadge meeting={m} />
            <span className="muted">
              {PLATFORM_LABEL[m.platform]} · {audienceLabel(m)} · {m.recipientCount} invited
            </span>
            <div className="spacer" />
            <JoinMeetingButton meeting={m} />
          </div>
          {m.status === 'cancelled' && (
            <Alert tone="warning">
              Cancelled {formatDateTime(m.cancelledAt)}
              {m.cancelReason ? ` — ${m.cancelReason}` : ''}
            </Alert>
          )}
          <InfoList
            items={[
              ['Batch', `${m.batchName} (${m.batchCode})`],
              ['Professor', m.professorName],
              ['Date', meetingDate(m)],
              ['Time', `${meetingTime(m)} (${m.durationMinutes} min)`],
              [
                'Meeting link',
                <a key="link" href={m.meetingUrl} target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all' }}>
                  {m.meetingUrl}
                </a>,
              ],
              ['Description', m.description && <span style={{ whiteSpace: 'pre-wrap' }}>{m.description}</span>],
            ]}
          />
          {undelivered > 0 && (
            <Alert tone="error">
              {undelivered} student{undelivered === 1 ? '' : 's'} did not receive the latest e-mail about this class.
              {canResend && (
                <div style={{ marginTop: 8 }}>
                  <Button size="sm" variant="secondary" icon={RefreshCw} loading={busy === 'resend'} onClick={resend}>
                    Resend e-mails
                  </Button>
                </div>
              )}
            </Alert>
          )}
          <DataTable
            compact
            rows={m.recipients}
            rowKey="studentId"
            caption="Invited students and e-mail delivery"
            columns={[
              {
                key: 'student',
                header: 'Student',
                render: (r) => <PersonCell name={r.fullName} sub={[r.studentCode, r.email].filter(Boolean).join(' · ')} />,
              },
              { key: 'notice', header: 'Last e-mail', render: (r) => (r.emailKind ? NOTICE[r.emailKind] : '—') },
              {
                key: 'status',
                header: 'Delivery',
                render: (r) =>
                  r.emailStatus ? (
                    <span title={r.emailError ?? undefined}>
                      <StatusBadge status={r.emailStatus} label={r.emailStatus === 'pending' ? 'Sending…' : undefined} />
                    </span>
                  ) : (
                    <span className="muted">Not e-mailed</span>
                  ),
              },
              {
                key: 'at',
                header: 'Sent',
                render: (r) => <span className="nowrap">{r.emailSentAt ? formatDateTime(r.emailSentAt) : '—'}</span>,
              },
            ]}
            empty={
              <EmptyState icon={Users} title="No students in this class" message="Students appear here once they belong to the batch." />
            }
          />
        </div>
      )}
    </Modal>
  );
}
