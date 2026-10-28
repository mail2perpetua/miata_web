import { Card, FilterSelect, PageHeader, SearchInput } from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { useListQuery } from '@/hooks/useListQuery';
import { SubmissionsTable } from './SubmissionsTable';

/** "Review / Comment": the professor's review queue (awaiting review by default). */
export default function ReviewQueuePage() {
  const { query, apiQuery, update, setPage, setSort } = useListQuery({ sort: 'submitted_at', order: 'asc', status: 'pending' });
  const courses = useFetch('/professor/courses');
  const batches = useFetch('/professor/batches');

  return (
    <>
      <PageHeader
        title="Review / Comment"
        subtitle="Open a submission to download the file, comment, and mark it Completed or Rework Required."
      />
      <Card flush>
        <div className="toolbar">
          <SearchInput value={query.search} onSearch={(search) => update({ search })} placeholder="Search student, ID or assignment" />
          <FilterSelect
            label="Status"
            allLabel="All statuses"
            value={query.status === 'all' ? '' : query.status}
            onChange={(status) => update({ status: status ?? 'all' })}
            options={[
              { value: 'pending', label: 'Awaiting review' },
              { value: 'submitted', label: 'Submitted (not opened)' },
              { value: 'in_review', label: 'In review' },
            ]}
          />
          <FilterSelect
            label="Course"
            allLabel="All my courses"
            value={query.courseId}
            onChange={(courseId) => update({ courseId })}
            options={(courses.data ?? []).map((c) => ({ value: c.id, label: c.title }))}
          />
          {batches.data?.length > 0 && (
            <FilterSelect
              label="Batch"
              allLabel="All my batches"
              value={query.batchId}
              onChange={(batchId) => update({ batchId })}
              options={batches.data.map((b) => ({ value: b.id, label: b.name }))}
            />
          )}
        </div>
        <SubmissionsTable
          query={{ ...apiQuery, status: apiQuery.status === 'all' ? undefined : apiQuery.status }}
          onSort={setSort}
          onPage={setPage}
          emptyTitle="All caught up — nothing awaiting review"
        />
      </Card>
    </>
  );
}
