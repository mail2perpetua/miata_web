import { useState } from 'react';
import { CalendarX, MonitorPlay, Pencil, Plus } from 'lucide-react';
import {
  Button,
  Card,
  DataTable,
  EmptyState,
  ErrorState,
  FilterSelect,
  FormModal,
  PageHeader,
  Pagination,
  SearchInput,
  Tabs,
  useToast,
} from '@/components';
import { useApiAction } from '@/hooks/useApiAction';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useFetch } from '@/hooks/useFetch';
import { useCreateDialog, useListQuery } from '@/hooks/useListQuery';
import { api } from '@/services/api';
import { audienceLabel, meetingDate, meetingState, meetingTime, PLATFORM_LABEL } from '@/features/shared/meetings';
import { EmailSummary, JoinMeetingButton, MeetingDetailsModal, MeetingStateBadge } from '@/features/shared/MeetingWidgets';
import { MeetingFormModal } from './MeetingFormModal';

const TABS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function MeetingsPage() {
  useDocumentTitle('Online Classes');
  const toast = useToast();
  const { query, apiQuery, update, setPage } = useListQuery({ when: 'upcoming', sort: 'starts_at', order: 'asc' });
  const state = useFetch('/professor/meetings', apiQuery);
  const batches = useFetch('/professor/batches');
  const [creating, setCreating] = useCreateDialog();
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const { run, busy } = useApiAction();

  // The list has no participant ids; the form needs them for "selected students".
  const edit = (m) => run(() => api.get(`/professor/meetings/${m.id}`), { key: `edit-${m.id}`, onDone: (res) => setEditing(res.data) });

  return (
    <>
      <PageHeader
        title="Online Classes"
        subtitle="Schedule Google Meet or Zoom classes for your batches. Students are e-mailed the details and see the link on their dashboard."
      />
      <Tabs
        label="Online classes"
        tabs={TABS}
        value={query.when}
        onChange={(when) => update({ when, order: when === 'upcoming' ? 'asc' : 'desc' })}
      />
      <Card flush>
        <div className="toolbar">
          <SearchInput value={query.search} onSearch={(search) => update({ search })} placeholder="Search classes" />
          <FilterSelect
            label="Batch"
            allLabel="All my batches"
            value={query.batchId}
            onChange={(batchId) => update({ batchId })}
            options={(batches.data ?? []).map((b) => ({ value: b.id, label: b.name }))}
          />
          <div className="spacer" />
          <Button icon={Plus} size="sm" onClick={() => setCreating(true)} disabled={batches.data?.length === 0}>
            Schedule Class
          </Button>
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
                key: 'actions',
                header: <span className="sr-only">Actions</span>,
                align: 'right',
                render: (m) => {
                  const live = ['upcoming', 'live'].includes(meetingState(m));
                  return (
                    <span className="row" style={{ gap: 4, justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                      <JoinMeetingButton meeting={m} />
                      {live && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Pencil}
                            loading={busy === `edit-${m.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              edit(m);
                            }}
                            aria-label={`Edit ${m.title}`}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={CalendarX}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCancelling(m);
                            }}
                            aria-label={`Cancel ${m.title}`}
                          />
                        </>
                      )}
                    </span>
                  );
                },
              },
            ]}
            empty={
              <EmptyState
                icon={MonitorPlay}
                title={
                  query.when === 'upcoming' ? 'No upcoming classes' : query.when === 'past' ? 'No past classes' : 'No cancelled classes'
                }
                message={
                  query.when === 'upcoming'
                    ? batches.data?.length === 0
                      ? 'You are not assigned to a batch yet. An administrator assigns professors to batches.'
                      : 'Schedule a Google Meet or Zoom class for one of your batches.'
                    : undefined
                }
              />
            }
          />
        )}
        <Pagination meta={state.meta} onPage={setPage} noun="classes" />
      </Card>

      <MeetingFormModal open={creating} onClose={() => setCreating(false)} onSaved={state.reload} />
      <MeetingFormModal open={Boolean(editing)} meeting={editing} onClose={() => setEditing(null)} onSaved={state.reload} />
      {viewing && (
        <MeetingDetailsModal path={`/professor/meetings/${viewing}`} onClose={() => setViewing(null)} onChange={state.reload} canResend />
      )}
      <FormModal
        open={Boolean(cancelling)}
        title={`Cancel "${cancelling?.title}"?`}
        size="md"
        submitLabel="Cancel class and notify"
        fields={[
          {
            name: 'reason',
            label: 'Reason (optional, included in the e-mail)',
            type: 'textarea',
            span: true,
            rows: 3,
          },
        ]}
        initialValues={{ reason: '' }}
        intro={<p className="muted">Every invited student is e-mailed that the class is cancelled. This cannot be undone.</p>}
        onSubmit={async (values) => {
          const res = await api.post(`/professor/meetings/${cancelling.id}/cancel`, { reason: values.reason || null });
          const n = res.data.notified?.cancelled ?? 0;
          toast.success(n ? `Class cancelled. ${n} student${n === 1 ? ' is' : 's are'} being notified.` : 'Class cancelled.');
        }}
        onSuccess={state.reload}
        onClose={() => setCancelling(null)}
      />
    </>
  );
}
