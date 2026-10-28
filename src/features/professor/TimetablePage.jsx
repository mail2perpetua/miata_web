import { CalendarDays } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { AsyncContent, Card, EmptyState, PageHeader, Tabs } from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { CourseTimetableView } from '@/features/shared/TimetableViews';

/**
 * Weekly timetables of the courses the professor lectures in or teaches (GET /professor/timetable). Their own lecturer
 * rows are highlighted, and the plan opens filtered to them.
 */
export default function TimetablePage() {
  const state = useFetch('/professor/timetable');
  const [params, setParams] = useSearchParams();

  return (
    <>
      <PageHeader title="Timetable" subtitle="The weekly teaching plan of your courses. Your own sessions are highlighted." />
      <AsyncContent state={state}>
        {(timetables) => {
          if (!timetables.length) {
            return (
              <Card>
                <EmptyState
                  icon={CalendarDays}
                  title="No timetable yet"
                  message="When a course you teach has a weekly timetable, or you are one of its lecturers, it appears here."
                />
              </Card>
            );
          }
          const timetable = timetables.find((t) => String(t.course.id) === params.get('courseId')) ?? timetables[0];
          return (
            <>
              {timetables.length > 1 && (
                <Tabs
                  label="Courses"
                  value={String(timetable.course.id)}
                  onChange={(value) => setParams({ courseId: value }, { replace: true })}
                  tabs={timetables.map((t) => ({ value: String(t.course.id), label: t.course.code }))}
                />
              )}
              <CourseTimetableView key={timetable.course.id} timetable={timetable} mineIds={timetable.myLecturerIds} />
            </>
          );
        }}
      </AsyncContent>
    </>
  );
}
