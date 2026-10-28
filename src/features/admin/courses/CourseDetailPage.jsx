import { useState } from 'react';
import { BookOpen, CircleCheck, ClipboardList, Pencil, Power, Stethoscope, Users, Video } from 'lucide-react';
import { useParams, useSearchParams } from 'react-router-dom';
import { AsyncContent, Button, PageHeader, StatCard, StatusBadge, Tabs, useConfirm } from '@/components';
import { useApiAction } from '@/hooks/useApiAction';
import { useFetch } from '@/hooks/useFetch';
import { api } from '@/services/api';
import { dateRange, durationLabel, formatNumber } from '@/utils/format';
import { CourseBatchesTab } from './CourseBatchesTab';
import { CourseFormModal } from './CourseFormModal';
import { CourseProfessorsTab } from './CourseProfessorsTab';
import { CourseStudentsTab } from './CourseStudentsTab';
import { CourseTimetableTab } from './CourseTimetableTab';
import { CurriculumTab } from './CurriculumTab';

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'curriculum';
  const state = useFetch(`/admin/courses/${courseId}`);
  const professors = useFetch('/admin/lookups/professors');
  const [editing, setEditing] = useState(false);
  const confirm = useConfirm();
  const { run, busy } = useApiAction();

  const toggleStatus = async (course) => {
    const activating = !course.isActive;
    const ok = await confirm({
      title: activating ? 'Activate course?' : 'Deactivate course?',
      message: activating
        ? 'Enrolled students will be able to access the course content again.'
        : 'Students will no longer be able to open this course. Completion records are kept.',
      confirmLabel: activating ? 'Activate' : 'Deactivate',
      danger: !activating,
    });
    if (!ok) return;
    await run(() => api.patch(`/admin/courses/${course.id}/status`, { isActive: activating }), {
      success: activating ? 'Course activated' : 'Course deactivated',
      onDone: state.reload,
      key: 'status',
    });
  };

  return (
    <AsyncContent state={state}>
      {(course) => (
        <>
          <PageHeader
            back={{ to: '/admin/courses', label: 'All courses' }}
            title={course.title}
            subtitle={
              <>
                {course.code} · {course.category || 'Uncategorised'} · {durationLabel(course.durationValue, course.durationUnit)}
                {course.academicYear && ` · Academic year ${course.academicYear}`}
                {course.startDate && ` · ${dateRange(course.startDate, course.endDate)}`}
                {course.feeAmount !== null && ` · Fee ${formatNumber(course.feeAmount)}`}{' '}
                <StatusBadge status={course.isActive ? 'active' : 'inactive'} />
              </>
            }
            actions={
              <>
                <Button variant="secondary" icon={Pencil} onClick={() => setEditing(true)}>
                  Edit
                </Button>
                <Button
                  variant={course.isActive ? 'secondary' : 'primary'}
                  icon={Power}
                  loading={busy === 'status'}
                  onClick={() => toggleStatus(course)}
                >
                  {course.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              </>
            }
          />
          {course.description && (
            <p className="muted" style={{ marginTop: -10, marginBottom: 20, maxWidth: 900 }}>
              {course.description}
            </p>
          )}

          <div className="dash-grid dash-grid--stats6" style={{ marginBottom: 'var(--gutter)' }}>
            <StatCard icon={Users} tone="blue" label="Students" value={course.studentCount} />
            <StatCard icon={CircleCheck} tone="green" label="Completed" value={course.completedCount} />
            <StatCard icon={BookOpen} tone="amber" label="Modules" value={course.moduleCount} />
            <StatCard icon={Stethoscope} tone="purple" label="Professors" value={course.professorCount} />
            <StatCard icon={Video} tone="rose" label="Videos" value={course.videoCount} to={`/admin/videos?courseId=${course.id}`} />
            <StatCard
              icon={ClipboardList}
              tone="orange"
              label="Assignments"
              value={course.assignmentCount}
              to={`/admin/assignments?courseId=${course.id}`}
            />
          </div>

          <Tabs
            value={tab}
            onChange={(value) => setParams({ tab: value }, { replace: true })}
            tabs={[
              { value: 'curriculum', label: 'Modules & Lessons', count: course.moduleCount },
              { value: 'timetable', label: 'Weekly Timetable' },
              { value: 'students', label: 'Students', count: course.studentCount },
              { value: 'professors', label: 'Professors', count: course.professorCount },
              { value: 'batches', label: 'Batches', count: course.batchCount },
            ]}
          />
          {tab === 'curriculum' && <CurriculumTab course={course} professors={professors.data ?? []} onChange={state.reload} />}
          {tab === 'timetable' && (
            <CourseTimetableTab
              course={course}
              onChange={() => {
                // A lecturer's new professor account must also appear in the professor lists.
                state.reload();
                professors.reload();
              }}
              onEditCourse={() => setEditing(true)}
            />
          )}
          {tab === 'students' && <CourseStudentsTab course={course} onChange={state.reload} />}
          {tab === 'professors' && <CourseProfessorsTab course={course} professors={professors.data ?? []} onChange={state.reload} />}
          {tab === 'batches' && <CourseBatchesTab course={course} />}

          <CourseFormModal open={editing} course={course} onClose={() => setEditing(false)} onSaved={state.reload} />
        </>
      )}
    </AsyncContent>
  );
}
