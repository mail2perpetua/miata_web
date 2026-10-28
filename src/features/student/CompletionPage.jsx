import { Circle, CircleCheck, Trophy } from 'lucide-react';
import { AsyncContent, Card, EmptyState, PageHeader, ProgressBar } from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { formatDate } from '@/utils/format';

function Criterion({ met, children }) {
  return (
    <li className={met ? 'is-met' : 'is-open'}>
      {met ? <CircleCheck aria-hidden="true" /> : <Circle aria-hidden="true" />}
      <span>{children}</span>
      <span className="sr-only">{met ? '(done)' : '(not yet)'}</span>
    </li>
  );
}

export default function CompletionPage() {
  const state = useFetch('/student/completion');
  return (
    <>
      <PageHeader title="Course Completion" subtitle="Your completed courses and what remains for the ones in progress." />
      <AsyncContent state={state}>
        {({ policy, courses }) => {
          const completed = courses.filter((c) => c.status === 'completed');
          const inProgress = courses.filter((c) => c.status !== 'completed');
          return (
            <div className="stack">
              {completed.map((c) => (
                <div key={c.courseId} className="completion-hero">
                  <Trophy aria-hidden="true" />
                  <div>
                    <h2 style={{ fontSize: 'var(--fs-lg)' }}>{c.title}</h2>
                    <p className="muted">Completed on {formatDate(c.completedAt)} · Your completion has been recorded by MIATA.</p>
                  </div>
                </div>
              ))}
              {courses.length === 0 && (
                <Card>
                  <EmptyState icon={Trophy} title="No courses yet" />
                </Card>
              )}
              {inProgress.map((c) => (
                <Card
                  key={c.courseId}
                  title={c.title}
                  subtitle={c.status === 'suspended' ? 'Enrolment suspended' : `${c.progress.percent}% complete`}
                >
                  <ProgressBar value={c.progress.percent} />
                  <ul className="criteria" style={{ marginTop: 16 }}>
                    {policy.requireAllVideos && (
                      <Criterion met={c.progress.videosTotal > 0 && c.progress.videosDone >= c.progress.videosTotal}>
                        Watch all required videos to at least {policy.videoWatchThreshold}% — {c.progress.videosDone} of{' '}
                        {c.progress.videosTotal} done
                      </Criterion>
                    )}
                    {policy.requireAllAssignments && (
                      <Criterion met={c.progress.assignmentsTotal > 0 && c.progress.assignmentsDone >= c.progress.assignmentsTotal}>
                        Have all required assignments marked Completed — {c.progress.assignmentsDone} of {c.progress.assignmentsTotal} done
                      </Criterion>
                    )}
                  </ul>
                  {c.progress.itemsTotal === 0 && (
                    <p className="muted" style={{ marginTop: 12 }}>
                      Course requirements have not been published yet.
                    </p>
                  )}
                </Card>
              ))}
              {inProgress.length > 0 && (
                <p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
                  When the last requirement is met, the course is completed automatically.
                  {policy.passwordResetOnCompletion !== 'none'
                    ? ' For your security you will then be signed out and asked to set a new password at your next sign-in; your completion record stays available.'
                    : policy.logoutOnCompletion
                      ? ' You will then be signed out and can sign in again with your current password.'
                      : ''}
                </p>
              )}
            </div>
          );
        }}
      </AsyncContent>
    </>
  );
}
