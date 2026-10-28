import { Card, FilterSelect, PageHeader, SearchInput, Tabs } from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { useListQuery } from '@/hooks/useListQuery';
import { SubmissionsTable } from './SubmissionsTable';

/** "Completed / Rework": reviewed submissions, split by outcome (latest attempt per student). */
export default function CompletedReworkPage() {
  const { query, apiQuery, update, setPage, setSort } = useListQuery({ sort: 'submitted_at' });
  const tab = query.tab === 'rework' ? 'rework' : 'completed';
  const batches = useFetch('/professor/batches');

  return (
    <>
      <PageHeader
        title="Completed / Rework"
        subtitle="Submissions you have marked Completed, and those waiting for the student's revised attempt."
      />
      <Tabs
        value={tab}
        onChange={(value) => update({ tab: value === 'completed' ? undefined : value, page: undefined })}
        tabs={[
          { value: 'completed', label: 'Completed' },
          { value: 'rework', label: 'Rework Required' },
        ]}
      />
      <Card flush>
        <div className="toolbar">
          <SearchInput value={query.search} onSearch={(search) => update({ search })} placeholder="Search student, ID or assignment" />
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
          query={{ ...apiQuery, status: tab, latestOnly: true }}
          onSort={setSort}
          onPage={setPage}
          emptyTitle={tab === 'completed' ? 'No completed submissions yet' : 'No submissions awaiting rework'}
        />
      </Card>
    </>
  );
}
