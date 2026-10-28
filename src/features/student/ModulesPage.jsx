import { BookOpen } from 'lucide-react';
import { AsyncContent, Card, EmptyState, PageHeader, ProgressBar } from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { ModuleRow } from './StudentWidgets';

export default function ModulesPage() {
  const state = useFetch('/student/modules');
  return (
    <>
      <PageHeader title="Modules" subtitle="Every module of your courses, in order, with your progress." />
      <AsyncContent state={state}>
        {(modules) => {
          if (!modules.length) {
            return (
              <Card>
                <EmptyState icon={BookOpen} title="No modules yet" message="Modules appear once you are enrolled in a course." />
              </Card>
            );
          }
          const byCourse = Object.values(
            modules.reduce((acc, m) => {
              (acc[m.courseId] ??= { courseId: m.courseId, title: m.courseTitle, modules: [] }).modules.push(m);
              return acc;
            }, {}),
          );
          return (
            <div className="stack">
              {byCourse.map((course) => {
                const done = course.modules.filter((m) => m.status === 'completed').length;
                return (
                  <Card
                    key={course.courseId}
                    title={course.title}
                    subtitle={`${done} of ${course.modules.length} modules completed`}
                    icon={BookOpen}
                    flush
                  >
                    <div style={{ padding: '0 22px 8px' }}>
                      <ProgressBar value={course.modules.length ? Math.round((done / course.modules.length) * 100) : 0} />
                    </div>
                    <ul className="list">
                      {course.modules.map((m, i) => (
                        <ModuleRow key={m.id} module={m} index={i} />
                      ))}
                    </ul>
                  </Card>
                );
              })}
            </div>
          );
        }}
      </AsyncContent>
    </>
  );
}
