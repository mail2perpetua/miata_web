import { BookOpen, Clock, GraduationCap, Stethoscope } from 'lucide-react';
import { AsyncContent, Button, Card, EmptyState, PageHeader, ProgressBar, StatusBadge } from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { durationLabel, formatDate } from '@/utils/format';

export default function MyCoursesPage() {
  const state = useFetch('/student/courses');
  return (
    <>
      <PageHeader title="My Courses" subtitle="The MIATA programs you are enrolled in." />
      <AsyncContent state={state}>
        {(courses) =>
          courses.length === 0 ? (
            <Card>
              <EmptyState
                icon={GraduationCap}
                title="No courses yet"
                message="MIATA admissions will enrol you in your program. You will be notified when it is ready."
              />
            </Card>
          ) : (
            <div className="course-grid">
              {courses.map((c) => {
                const available = c.courseActive && c.status !== 'suspended';
                return (
                  <section key={c.courseId} className="card course-card">
                    <div className="course-card__head">
                      <span className="timeline-icon tone-blue" style={{ width: 46, height: 46 }}>
                        <GraduationCap aria-hidden="true" />
                      </span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="course-card__code">{c.code}</div>
                        <h2 className="course-card__title">{c.title}</h2>
                      </div>
                      <StatusBadge status={!c.courseActive ? 'inactive' : c.status} label={!c.courseActive ? 'Unavailable' : undefined} />
                    </div>
                    {c.description && (
                      <p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
                        {c.description.length > 160 ? `${c.description.slice(0, 160)}…` : c.description}
                      </p>
                    )}
                    <div className="course-card__meta">
                      <span>
                        <Clock aria-hidden="true" /> {durationLabel(c.durationValue, c.durationUnit)}
                      </span>
                      <span>
                        <BookOpen aria-hidden="true" /> {c.moduleCount} modules
                      </span>
                      {c.professorNames && (
                        <span>
                          <Stethoscope aria-hidden="true" /> {c.professorNames}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="row" style={{ justifyContent: 'space-between', fontSize: 'var(--fs-sm)', marginBottom: 6 }}>
                        <span className="muted">
                          {c.status === 'completed'
                            ? `Completed ${formatDate(c.completedAt)}`
                            : `${c.progress.itemsDone} of ${c.progress.itemsTotal} requirements`}
                        </span>
                        <strong className="num">{c.progress.percent}%</strong>
                      </div>
                      <ProgressBar value={c.progress.percent} tone={c.status === 'completed' ? 'green' : undefined} />
                    </div>
                    <div className="course-card__footer">
                      {available ? (
                        <Button to={`/student/courses/${c.courseId}`} block>
                          {c.status === 'completed' ? 'Review course' : c.progress.itemsDone ? 'Continue learning' : 'Start course'}
                        </Button>
                      ) : (
                        <p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
                          {c.status === 'suspended'
                            ? 'Your enrolment is suspended. Contact MIATA for help.'
                            : 'This course is currently unavailable.'}
                        </p>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          )
        }
      </AsyncContent>
    </>
  );
}
