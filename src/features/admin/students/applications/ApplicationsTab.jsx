import { useState } from 'react';
import { Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, DataTable, EmptyState, ErrorState, FilterSelect, Pagination, PersonCell, SearchInput, StatusBadge } from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { useListQuery } from '@/hooks/useListQuery';
import { formatDate } from '@/utils/format';
import { actionsColumn } from '../../shared/columns';
import { RowActions } from '../../shared/RowActions';
import { useDeleteAction } from '../../shared/useDeleteAction';
import { APPLICATION_STATUSES, STUDY_MODES, studyModeShort } from './applications';
import { ApplicationEditModal } from './ApplicationEditModal';
import { ApplicationReviewModal } from './ApplicationReviewModal';

/** Students → Online Applications: everything sent through the website's Apply Now form. */
export function ApplicationsTab({ onChange }) {
  const { query, apiQuery, update, setPage, setSort } = useListQuery({ sort: 'created_at' });
  const state = useFetch('/admin/applications', apiQuery);
  const [openId, setOpenId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const { remove, deleting } = useDeleteAction();
  const refresh = () => {
    state.reload();
    onChange?.();
  };

  const confirmDelete = (a) =>
    remove({
      path: `/admin/applications/${a.id}`,
      title: `Delete the application from ${a.fullName}?`,
      message:
        a.status === 'approved'
          ? `${a.referenceNumber} and its ${a.documentCount} uploaded document(s) are deleted permanently. ${a.fullName}'s student account is not affected.`
          : `${a.referenceNumber} and its ${a.documentCount} uploaded document(s) are deleted permanently.`,
      success: 'Application deleted',
      onDone: refresh,
    });

  return (
    <Card flush>
      <div className="toolbar">
        <SearchInput
          value={query.search}
          onSearch={(search) => update({ search })}
          placeholder="Search name, email, phone, country or reference"
        />
        <FilterSelect
          label="Status"
          allLabel="All statuses"
          value={query.status}
          onChange={(status) => update({ status })}
          options={APPLICATION_STATUSES}
        />
        <FilterSelect
          label="Mode of study"
          allLabel="All modes of study"
          value={query.studyMode}
          onChange={(studyMode) => update({ studyMode })}
          options={STUDY_MODES}
        />
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
          onRowClick={(a) => setOpenId(a.id)}
          columns={[
            {
              key: 'name',
              header: 'Applicant',
              sortKey: 'full_name',
              render: (a) => <PersonCell name={a.fullName} sub={`${a.email} · ${a.phone}`} />,
            },
            { key: 'reference', header: 'Reference', render: (a) => <span className="nowrap">{a.referenceNumber}</span> },
            { key: 'country', header: 'Country', render: (a) => a.country },
            { key: 'mode', header: 'Mode of study', render: (a) => <span className="nowrap">{studyModeShort(a.studyMode)}</span> },
            { key: 'agent', header: 'Agent', render: (a) => a.agentName || a.agentContact || <span className="muted">Direct</span> },
            { key: 'documents', header: 'Documents', align: 'right', render: (a) => <span className="num">{a.documentCount}</span> },
            {
              key: 'createdAt',
              header: 'Submitted',
              sortKey: 'created_at',
              render: (a) => <span className="nowrap">{formatDate(a.createdAt)}</span>,
            },
            {
              key: 'status',
              header: 'Status',
              sortKey: 'status',
              render: (a) => (
                <span className="application-status">
                  <StatusBadge status={a.status} label={a.status === 'pending' ? 'Pending review' : undefined} />
                  {a.studentId && (
                    <Link to={`/admin/students/${a.studentId}`} onClick={(e) => e.stopPropagation()} className="nowrap">
                      {a.studentCode || 'Student'}
                    </Link>
                  )}
                </span>
              ),
            },
            actionsColumn((a) => (
              <RowActions
                label={`the application from ${a.fullName}`}
                onView={() => setOpenId(a.id)}
                onEdit={() => setEditingId(a.id)}
                editDisabled={a.status === 'approved' ? 'Approved — edit the student instead' : null}
                onDelete={() => confirmDelete(a)}
                deleting={deleting(`/admin/applications/${a.id}`)}
              />
            )),
          ]}
          empty={
            <EmptyState
              icon={Inbox}
              title={query.search || query.status || query.studyMode ? 'No matching applications' : 'No online applications yet'}
              message="Applications sent with the website's Apply Now form appear here for review."
            />
          }
        />
      )}
      <Pagination meta={state.meta} onPage={setPage} noun="applications" />

      {openId && (
        <ApplicationReviewModal
          applicationId={openId}
          onClose={() => setOpenId(null)}
          onChange={refresh}
          onEdit={(id) => {
            setOpenId(null);
            setEditingId(id);
          }}
        />
      )}
      {editingId && <ApplicationEditModal applicationId={editingId} onClose={() => setEditingId(null)} onSaved={refresh} />}
    </Card>
  );
}
