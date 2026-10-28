import { useState } from 'react';
import { Mail, Plus } from 'lucide-react';
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
  StatusBadge,
  Tabs,
  useToast,
} from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { useCreateDialog, useListQuery } from '@/hooks/useListQuery';
import { api } from '@/services/api';
import { formatDate } from '@/utils/format';
import { EnquiryDetailModal } from './EnquiryDetailModal';
import { ENQUIRY_STATUSES } from './enquiryStatuses';

const MANUAL_FIELDS = [
  { name: 'name', label: 'Name', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'phone', label: 'Phone', type: 'tel' },
  { name: 'courseInterest', label: 'Course of interest' },
  { name: 'subject', label: 'Subject', span: true },
  { name: 'message', label: 'Message / details', type: 'textarea', required: true, span: true },
];

export default function EnquiriesPage() {
  const toast = useToast();
  const { query, apiQuery, update, setPage, setSort } = useListQuery({ sort: 'created_at' });
  const state = useFetch('/admin/enquiries', apiQuery);
  const counts = useFetch('/admin/enquiries/counts');
  const [creating, setCreating] = useCreateDialog();
  const [openId, setOpenId] = useState(null);
  const refresh = () => {
    state.reload();
    counts.reload();
  };
  const total = counts.data ? Object.values(counts.data).reduce((a, b) => a + b, 0) : undefined;

  return (
    <>
      <PageHeader
        title="Enquiries"
        subtitle="Website enquiries and follow-ups. New website enquiries notify the admissions team by email."
        actions={
          <Button icon={Plus} onClick={() => setCreating(true)}>
            Add Enquiry
          </Button>
        }
      />
      <Tabs
        value={query.status ?? 'all'}
        onChange={(status) => update({ status: status === 'all' ? undefined : status })}
        tabs={[
          { value: 'all', label: 'All', count: total },
          ...ENQUIRY_STATUSES.map((s) => ({ ...s, count: counts.data?.[s.value === 'follow_up' ? 'followUp' : s.value] })),
        ]}
      />
      <Card flush>
        <div className="toolbar">
          <SearchInput
            value={query.search}
            onSearch={(search) => update({ search })}
            placeholder="Search name, email, phone, subject or course"
          />
          <FilterSelect
            label="Source"
            allLabel="All sources"
            value={query.source}
            onChange={(source) => update({ source })}
            options={[
              { value: 'website', label: 'Website form' },
              { value: 'admin', label: 'Added by admin' },
            ]}
          />
          <label className="row" style={{ gap: 6, fontSize: 'var(--fs-sm)' }}>
            From
            <input
              type="date"
              className="input"
              style={{ width: 150 }}
              value={query.from ?? ''}
              onChange={(e) => update({ from: e.target.value || undefined })}
            />
          </label>
          <label className="row" style={{ gap: 6, fontSize: 'var(--fs-sm)' }}>
            To
            <input
              type="date"
              className="input"
              style={{ width: 150 }}
              value={query.to ?? ''}
              onChange={(e) => update({ to: e.target.value || undefined })}
            />
          </label>
        </div>
        {state.error ? (
          <ErrorState error={state.error} onRetry={state.reload} />
        ) : (
          <DataTable
            rows={state.data}
            loading={state.loading}
            sort={query.sort}
            order={query.order}
            onSort={setSort}
            onRowClick={(e) => setOpenId(e.id)}
            columns={[
              {
                key: 'name',
                header: 'Name',
                sortKey: 'name',
                render: (e) => (
                  <span>
                    <strong style={{ color: 'var(--ink)' }}>{e.name}</strong>
                    <span className="cell-person__sub" style={{ display: 'block' }}>
                      {e.email}
                      {e.phone ? ` · ${e.phone}` : ''}
                    </span>
                  </span>
                ),
              },
              {
                key: 'subject',
                header: 'Enquiry',
                render: (e) => (
                  <span style={{ display: 'block', maxWidth: 360 }}>
                    <strong style={{ color: 'var(--ink)' }}>{e.subject || e.courseInterest || 'General enquiry'}</strong>
                    <span
                      className="cell-person__sub"
                      style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {e.messagePreview}
                    </span>
                  </span>
                ),
              },
              {
                key: 'createdAt',
                header: 'Received',
                sortKey: 'created_at',
                render: (e) => <span className="nowrap">{formatDate(e.createdAt)}</span>,
              },
              {
                key: 'followUpOn',
                header: 'Follow-up',
                sortKey: 'follow_up_on',
                render: (e) => (e.followUpOn ? <span className="nowrap">{formatDate(e.followUpOn)}</span> : '—'),
              },
              {
                key: 'email',
                header: 'Email',
                render: (e) => (e.source === 'website' ? <StatusBadge status={e.emailStatus} /> : <span className="muted">—</span>),
              },
              { key: 'status', header: 'Status', sortKey: 'status', render: (e) => <StatusBadge status={e.status} /> },
            ]}
            empty={
              <EmptyState icon={Mail} title="No enquiries" message="Enquiries submitted through the website contact form appear here." />
            }
          />
        )}
        <Pagination meta={state.meta} onPage={setPage} noun="enquiries" />
      </Card>

      {openId && <EnquiryDetailModal enquiryId={openId} onClose={() => setOpenId(null)} onChange={refresh} />}
      <FormModal
        open={creating}
        title="Add enquiry"
        submitLabel="Save enquiry"
        fields={MANUAL_FIELDS}
        initialValues={{ name: '', email: '', phone: '', courseInterest: '', subject: '', message: '' }}
        onSubmit={async (values) => {
          await api.post('/admin/enquiries', { ...values, phone: values.phone || null });
          toast.success('Enquiry saved');
          refresh();
        }}
        onClose={() => setCreating(false)}
      />
    </>
  );
}
