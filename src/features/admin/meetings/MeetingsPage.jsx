import { useState } from 'react';
import { MonitorPlay } from 'lucide-react';
import { Card, DataTable, EmptyState, ErrorState, FilterSelect, PageHeader, Pagination, SearchInput, Tabs } from '@/components';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useFetch } from '@/hooks/useFetch';
import { useListQuery } from '@/hooks/useListQuery';
import { audienceLabel, meetingDate, meetingTime, PLATFORM_LABEL } from '@/features/shared/meetings';
import { EmailSummary, JoinMeetingButton, MeetingDetailsModal, MeetingStateBadge } from '@/features/shared/MeetingWidgets';

const TABS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
  { value: 'cancelled', label: 'Cancelled' },
];

/** Every online class across batches, with who was invited and whether their e-mails arrived (read-only: professors schedule them). */
export default function MeetingsPage() {
  useDocumentTitle('Online Classes');
  const { query, apiQuery, update, setPage } = useListQuery({ when: 'upcoming', sort: 'starts_at', order: 'asc' });
  const state = useFetch('/admin/meetings', apiQuery);
  const batches = useFetch('/admin/lookups/batches');
  const professors = useFetch('/admin/lookups/professors', { limit: 200 });
  const [viewing, setViewing] = useState(null);

  return (
    <>
      <PageHeader
        title="Online Classes"
        subtitle="Google Meet and Zoom classes scheduled by professors for their batches, and the e-mails sent about them."
      />
      <Tabs
        label="Online classes"
        tabs={TABS}
        value={query.when}
        onChange={(when) => update({ when, order: when === 'upcoming' ? 'asc' : 'desc' })}
      />
      <Card flush>
        <div className="toolbar">
          <SearchInput value={query.search} onSearch={(search) => update({ search })} placeholder="Search class, batch or professor" />
          <FilterSelect
            label="Batch"
            allLabel="All batches"
            value={query.batchId}
            onChange={(batchId) => update({ batchId })}
            options={(batches.data ?? []).map((b) => ({ value: b.id, label: b.name }))}
          />
          <FilterSelect
            label="Professor"
            allLabel="All professors"
            value={query.professorId}
            onChange={(professorId) => update({ professorId })}
            options={(professors.data ?? []).map((p) => ({ value: p.id, label: p.fullName }))}
          />
        </div>
        {state.error ? (
          <ErrorState error={state.error} onRetry={state.reload} />
        ) : (
          <DataTable
            rows={state.data}
            loading={state.loading}
            onRowClick={(m) => setViewing(m.id)}
            columns={[
              {
                key: 'title',
                header: 'Class',
                render: (m) => (
                  <span>
                    <strong style={{ color: 'var(--ink)' }}>{m.title}</strong>
                    <span className="cell-person__sub" style={{ display: 'block' }}>
                      {PLATFORM_LABEL[m.platform]}
                    </span>
                  </span>
                ),
              },
              { key: 'batch', header: 'Batch', render: (m) => m.batchName },
              { key: 'professor', header: 'Professor', render: (m) => m.professorName },
              {
                key: 'when',
                header: 'Date & Time',
                render: (m) => (
                  <span className="nowrap">
                    {meetingDate(m)}
                    <span className="cell-person__sub" style={{ display: 'block' }}>
                      {meetingTime(m)}
                    </span>
                  </span>
                ),
              },
              {
                key: 'audience',
                header: 'Invited',
                render: (m) => (
                  <span>
                    <strong className="num">{m.recipientCount}</strong>
                    <span className="cell-person__sub" style={{ display: 'block' }}>
                      {audienceLabel(m)}
                    </span>
                  </span>
                ),
              },
              { key: 'emails', header: 'E-mails', render: (m) => <EmailSummary emails={m.emails} invited={m.recipientCount} /> },
              { key: 'status', header: 'Status', render: (m) => <MeetingStateBadge meeting={m} /> },
              {
                key: 'join',
                header: <span className="sr-only">Join</span>,
                align: 'right',
                render: (m) => <JoinMeetingButton meeting={m} />,
              },
            ]}
            empty={<EmptyState icon={MonitorPlay} title="No online classes" message="Professors schedule classes from their dashboard." />}
          />
        )}
        <Pagination meta={state.meta} onPage={setPage} noun="classes" />
      </Card>
      {viewing && <MeetingDetailsModal path={`/admin/meetings/${viewing}`} onClose={() => setViewing(null)} />}
    </>
  );
}
