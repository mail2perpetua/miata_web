import { ChartColumn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AsyncContent, Card, EmptyState, PageHeader, ProgressBar, ProgressRing, StatusBadge } from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { formatDate } from '@/utils/format';

export default function ProgressPage() {
  const state = useFetch('/student/progress');
  return (
    <>
      <PageHeader
        title="Course Progress"
        subtitle="Progress is calculated from the videos you have watched and the assignments your professors have marked Completed."
      />
      <AsyncContent state={state}>
        {(courses) =>
          courses.length === 0 ? (
            <Card>
              <EmptyState icon={ChartColumn} title="No courses yet" />
            </Card>
          ) : (
            <div className="stack">
              {courses.map((c) => (
                <Card
                  key={c.courseId}
                  title={<Link to={`/student/courses/${c.courseId}`}>{c.title}</Link>}
                  subtitle={`Enrolled ${formatDate(c.enrolledAt)}`}
                  action={<StatusBadge status={c.status} />}
                >
                  <div className="grid" style={{ gridTemplateColumns: 'auto minmax(0, 1fr)', alignItems: 'start', gap: 28 }}>
                    <div style={{ textAlign: 'center' }}>
                      <ProgressRing value={c.progress.percent} size={130} caption={c.status === 'completed' ? 'Completed' : 'complete'} />
                      <div className="stack" style={{ gap: 0, marginTop: 12, fontSize: 'var(--fs-sm)', minWidth: 200 }}>
                        {c.progress.requiresVideos && (
                          <div className="kv-row">
                            <span className="muted">Videos watched</span>
                            <strong className="num">
                              {c.progress.videosDone}/{c.progress.videosTotal}
                            </strong>
                          </div>
                        )}
                        {c.progress.requiresAssignments && (
                          <div className="kv-row">
                            <span className="muted">Assignments completed</span>
                            <strong className="num">
                              {c.progress.assignmentsDone}/{c.progress.assignmentsTotal}
                            </strong>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 style={{ fontSize: 'var(--fs-base)', marginBottom: 10 }}>By module</h3>
                      {c.modules.length === 0 && <p className="muted">No modules yet.</p>}
                      {c.modules.map((m, i) => (
                        <div key={m.id} style={{ marginBottom: 14 }}>
                          <div className="row" style={{ justifyContent: 'space-between', fontSize: 'var(--fs-sm)', marginBottom: 5 }}>
                            <span style={{ fontWeight: 600, color: 'var(--ink)' }}>
                              {i + 1}. {m.title}
                            </span>
                            <span className="muted num">
                              {m.progress.itemsTotal ? `${m.progress.itemsDone}/${m.progress.itemsTotal}` : 'No requirements'}
                            </span>
                          </div>
                          <ProgressBar
                            value={m.progress.itemsTotal ? m.progress.percent : 0}
                            tone={m.status === 'completed' ? 'green' : undefined}
                            label={`${m.title} progress`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )
        }
      </AsyncContent>
    </>
  );
}
