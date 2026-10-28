import { CalendarClock, MonitorPlay, User } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { AsyncContent, Card, EmptyState, PageHeader, Tabs } from '@/components';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useFetch } from '@/hooks/useFetch';
import { meetingDate, meetingState, meetingTime, PLATFORM_LABEL } from '@/features/shared/meetings';
import { JoinMeetingButton, MeetingStateBadge } from '@/features/shared/MeetingWidgets';

/** Online classes of the student's batch, or shared with them by a professor. */
export default function MeetingsPage() {
  useDocumentTitle('Online Classes');
  const [params, setParams] = useSearchParams();
  const when = params.get('tab') === 'past' ? 'past' : 'upcoming';
  const state = useFetch('/student/meetings', { when });

  return (
    <>
      <PageHeader
        title="Online Classes"
        subtitle="Live Google Meet and Zoom classes scheduled by your professors. Join from here, or from the link in your e-mail."
      />
      <Tabs
        label="Online classes"
        value={when}
        onChange={(value) => setParams(value === 'past' ? { tab: 'past' } : {}, { replace: true })}
        tabs={[
          { value: 'upcoming', label: 'Upcoming' },
          { value: 'past', label: 'Past' },
        ]}
      />
      <Card flush>
        <AsyncContent state={state}>
          {(meetings) =>
            meetings.length ? (
              <ul className="list">
                {meetings.map((m) => (
                  <li key={m.id} className="list__item" style={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <span className={`timeline-icon tone-${meetingState(m) === 'cancelled' ? 'rose' : 'blue'}`}>
                      <MonitorPlay aria-hidden="true" />
                    </span>
                    <div className="list__main">
                      <div className="list__title">{m.title}</div>
                      <div className="list__sub">
                        <CalendarClock size={14} style={{ display: 'inline', verticalAlign: -2 }} aria-hidden="true" /> {meetingDate(m)} ·{' '}
                        {meetingTime(m)} · {m.durationMinutes} min · {PLATFORM_LABEL[m.platform]}
                      </div>
                      <div className="list__sub">
                        <User size={14} style={{ display: 'inline', verticalAlign: -2 }} aria-hidden="true" /> {m.professorName} ·{' '}
                        {m.batchName}
                      </div>
                      {m.status === 'cancelled' ? (
                        <p className="list__sub" style={{ marginTop: 6, color: 'var(--red-600)' }}>
                          This class has been cancelled{m.cancelReason ? `: ${m.cancelReason}` : '.'}
                        </p>
                      ) : (
                        m.description && (
                          <p className="list__sub" style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>
                            {m.description}
                          </p>
                        )
                      )}
                    </div>
                    <div className="row" style={{ gap: 8 }}>
                      {meetingState(m) !== 'upcoming' && <MeetingStateBadge meeting={m} />}
                      <JoinMeetingButton meeting={m} size="md" />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={MonitorPlay}
                title={when === 'upcoming' ? 'No upcoming online classes' : 'No past online classes'}
                message={
                  when === 'upcoming'
                    ? 'When a professor schedules a class for your batch, it appears here and you get an e-mail.'
                    : undefined
                }
              />
            )
          }
        </AsyncContent>
      </Card>
    </>
  );
}
