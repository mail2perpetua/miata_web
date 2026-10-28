import { useState } from 'react';
import { CircleCheck, Clock, RefreshCw, UserRound, Users, GraduationCap } from 'lucide-react';
import { useParams } from 'react-router-dom';
import {
  AsyncContent,
  Avatar,
  Button,
  Card,
  DataTable,
  FilterSelect,
  InfoList,
  LineChart,
  PageHeader,
  Pagination,
  SearchInput,
  StatCard,
  StatusBadge,
  useConfirm,
} from '@/components';
import { useApiAction } from '@/hooks/useApiAction';
import { useFetch } from '@/hooks/useFetch';
import { api } from '@/services/api';
import { formatDate, formatMonth } from '@/utils/format';
import { ReferralLinkCard } from '@/features/shared/ReferralLinkCard';
import { ReferralTable } from '@/features/shared/ReferralTable';
import { REFERRAL_STATUS_OPTIONS } from '@/features/shared/referralStatus';
import { AccountActions } from '../shared/AccountActions';

function AgentReferrals({ agentId }) {
  const [query, setQuery] = useState({ page: 1, pageSize: 10, order: 'desc' });
  const state = useFetch(`/admin/agents/${agentId}/referrals`, query);
  return (
    <Card title="Referred students" subtitle="Every student attributed to this agent" flush>
      <div className="toolbar">
        <SearchInput
          value={query.search}
          onSearch={(search) => setQuery((q) => ({ ...q, search, page: 1 }))}
          placeholder="Search by name, ID or email"
        />
        <FilterSelect
          label="Status"
          allLabel="All status"
          value={query.status}
          onChange={(status) => setQuery((q) => ({ ...q, status, page: 1 }))}
          options={REFERRAL_STATUS_OPTIONS}
        />
      </div>
      <ReferralTable
        state={state}
        query={query}
        admin
        onSort={(sort) => setQuery((q) => ({ ...q, sort, order: q.sort === sort && q.order === 'desc' ? 'asc' : 'desc' }))}
      />
      <Pagination meta={state.meta} onPage={(page) => setQuery((q) => ({ ...q, page }))} noun="students" />
    </Card>
  );
}

export default function AgentDetailPage() {
  const { userId } = useParams();
  const state = useFetch(`/admin/agents/${userId}`);
  const confirm = useConfirm();
  const { run, busy } = useApiAction();

  const regenerate = async () => {
    const ok = await confirm({
      title: 'Generate a new referral code?',
      message: 'The current referral link stops working immediately. Students already referred stay attributed to this agent.',
      confirmLabel: 'Generate new code',
      danger: true,
    });
    if (ok)
      await run(() => api.post(`/admin/agents/${userId}/referral-code`), {
        success: 'New referral code generated',
        onDone: state.reload,
        key: 'code',
      });
  };

  return (
    <AsyncContent state={state}>
      {(a) => (
        <>
          <PageHeader
            back={{ to: '/admin/agents', label: 'All agents' }}
            title={a.fullName}
            subtitle={
              <>
                {a.profile?.organization || 'Education agent'} · <StatusBadge status={a.isActive ? 'active' : 'inactive'} />
              </>
            }
            actions={
              <AccountActions
                role="agent"
                person={a}
                onChange={state.reload}
                extra={
                  <Button variant="secondary" icon={RefreshCw} loading={busy === 'code'} onClick={regenerate}>
                    New referral code
                  </Button>
                }
              />
            }
          />
          <div className="dash-grid dash-grid--stats4" style={{ marginBottom: 'var(--gutter)' }}>
            <StatCard
              icon={Users}
              tone="amber"
              label="Total Referrals"
              value={a.referralCounts.total}
              hint={`${a.referralCounts.thisMonth} this month`}
            />
            <StatCard icon={CircleCheck} tone="green" label="Active Students" value={a.referralCounts.active} hint="Currently learning" />
            <StatCard icon={Clock} tone="blue" label="Pending" value={a.referralCounts.pending} hint="Registered, not enrolled" />
            <StatCard icon={GraduationCap} tone="purple" label="Course Completed" value={a.referralCounts.completed} />
          </div>
          <div className="split" style={{ marginBottom: 'var(--gutter)' }}>
            <Card title="Referral Overview" subtitle="Total referred students over the last 12 months">
              <LineChart
                data={a.monthlyReferrals}
                xKey="month"
                xFormat={formatMonth}
                series={[{ key: 'cumulative', label: 'Total referrals', color: 'var(--accent)' }]}
                ariaLabel="Cumulative referrals per month"
              />
            </Card>
            <div className="stack">
              <ReferralLinkCard code={a.profile.referralCode} link={a.profile.referralLink} />
            </div>
          </div>
          <div className="split">
            <AgentReferrals agentId={a.id} />
            <div className="stack">
              <Card title="Profile" icon={UserRound}>
                <div className="profile-summary">
                  <Avatar name={a.fullName} size="lg" />
                  <div>
                    <strong>{a.fullName}</strong>
                    <div className="muted">{a.email}</div>
                  </div>
                </div>
                <InfoList
                  items={[
                    ['Phone', a.phone],
                    ['Organization', a.profile?.organization],
                    ['City', a.profile?.city],
                    ['Country', a.profile?.country],
                    ['Joined', formatDate(a.createdAt)],
                  ]}
                />
              </Card>
              <Card title="Referrals by course" flush>
                <DataTable
                  compact
                  rows={a.referralsByCourse}
                  rowKey="courseId"
                  columns={[
                    { key: 'title', header: 'Course' },
                    { key: 'students', header: 'Students', align: 'right', render: (r) => <span className="num">{r.students}</span> },
                    { key: 'completed', header: 'Completed', align: 'right', render: (r) => <span className="num">{r.completed}</span> },
                  ]}
                />
              </Card>
            </div>
          </div>
        </>
      )}
    </AsyncContent>
  );
}
