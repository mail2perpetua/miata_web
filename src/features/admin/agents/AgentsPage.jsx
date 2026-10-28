import { Handshake, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  DataTable,
  EmptyState,
  ErrorState,
  FilterSelect,
  PageHeader,
  Pagination,
  PersonCell,
  SearchInput,
  StatusBadge,
} from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { useCreateDialog, useListQuery } from '@/hooks/useListQuery';
import { PersonFormModal } from '../shared/PersonFormModal';

export default function AgentsPage() {
  const navigate = useNavigate();
  const { query, apiQuery, update, setPage, setSort } = useListQuery({ sort: 'created_at' });
  const state = useFetch('/admin/agents', apiQuery);
  const [creating, setCreating] = useCreateDialog();

  return (
    <>
      <PageHeader
        title="Agents & Referrals"
        subtitle="Education agents, their referral codes and the students they referred."
        actions={
          <>
            <Button variant="secondary" to="/admin/referrals">
              Referral students
            </Button>
            <Button icon={Plus} onClick={() => setCreating(true)}>
              Add Agent
            </Button>
          </>
        }
      />
      <Card flush>
        <div className="toolbar">
          <SearchInput
            value={query.search}
            onSearch={(search) => update({ search })}
            placeholder="Search name, email, code, organization or city"
          />
          <FilterSelect
            label="Status"
            allLabel="All statuses"
            value={query.status}
            onChange={(status) => update({ status })}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
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
            onRowClick={(a) => navigate(`/admin/agents/${a.id}`)}
            columns={[
              { key: 'name', header: 'Agent', sortKey: 'full_name', render: (a) => <PersonCell name={a.fullName} sub={a.email} /> },
              { key: 'code', header: 'Referral code', render: (a) => <span className="chip">{a.referralCode}</span> },
              { key: 'org', header: 'Organization', render: (a) => [a.organization, a.city].filter(Boolean).join(' · ') || '—' },
              {
                key: 'total',
                header: 'Referrals',
                align: 'right',
                sortKey: 'referrals',
                render: (a) => <strong className="num">{a.totalReferrals}</strong>,
              },
              { key: 'active', header: 'Active', align: 'right', render: (a) => <span className="num">{a.activeReferrals}</span> },
              { key: 'pending', header: 'Pending', align: 'right', render: (a) => <span className="num">{a.pendingReferrals}</span> },
              { key: 'completed', header: 'Completed', align: 'right', render: (a) => <span className="num">{a.completedReferrals}</span> },
              { key: 'status', header: 'Status', render: (a) => <StatusBadge status={a.isActive ? 'active' : 'inactive'} /> },
            ]}
            empty={<EmptyState icon={Handshake} title="No agents yet" message="Add an agent to generate their referral link." />}
          />
        )}
        <Pagination meta={state.meta} onPage={setPage} noun="agents" />
      </Card>
      <PersonFormModal open={creating} role="agent" onClose={() => setCreating(false)} onSaved={(a) => navigate(`/admin/agents/${a.id}`)} />
    </>
  );
}
