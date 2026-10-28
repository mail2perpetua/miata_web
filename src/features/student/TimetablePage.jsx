import { CalendarDays } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { AsyncContent, Card, EmptyState, PageHeader, Tabs } from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { CourseTimetableView } from '@/features/shared/TimetableViews';

/** Weekly timetables of the student's courses (GET /student/timetable): sessions of the modules available to them. */
export default function TimetablePage() {
  const state = useFetch('/student/timetable');
  const [params, setParams] = useSearchParams();

  return (
    <>
      <PageHeader title="Timetable" subtitle="Your course’s weekly teaching plan: each lecturer’s topic and module, week by week." />
      <AsyncContent state={state}>
        {(timetables) => {
          if (!timetables.length) {
            return (
              <Card>
                <EmptyState
                  icon={CalendarDays}
                  title="No timetable yet"
                  message="The weekly timetable of your course appears here once it is published."
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
              <CourseTimetableView key={timetable.course.id} timetable={timetable} />
            </>
          );
        }}
      </AsyncContent>
    </>
  );
}
