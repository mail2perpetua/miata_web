import { useState } from 'react';

/**
 * Week / module / lecturer filters for a course timetable (as the API returns it), and the timetable narrowed to them
 * in the browser: only the chosen week, and only the sessions of the chosen module and lecturer.
 */
export function useTimetableFilters(timetable, initial = {}) {
  const [filters, setFilters] = useState(initial);
  const view = {
    ...timetable,
    weeks: timetable.weeks
      .filter((w) => !filters.week || w.number === filters.week)
      .map((w) => ({
        ...w,
        sessions: w.sessions.filter(
          (s) =>
            (!filters.moduleId || s.moduleId === filters.moduleId) && (!filters.lecturerId || s.courseLecturerId === filters.lecturerId),
        ),
      })),
  };
  const setFilter = (key) => (value) => setFilters((f) => ({ ...f, [key]: value ? Number(value) : undefined }));
  return { filters, setFilter, view };
}
