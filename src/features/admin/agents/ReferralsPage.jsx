import { useState } from 'react';
import { ArrowRightLeft, CircleCheck, Clock, Users, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AsyncContent,
  Button,
  Card,
  DataTable,
  FilterSelect,
  LineChart,
  Modal,
  PageHeader,
  Pagination,
  SearchInput,
  StatCard,
  useConfirm,
} from '@/components';
import { useApiAction } from '@/hooks/useApiAction';
import { useFetch } from '@/hooks/useFetch';
import { useListQuery } from '@/hooks/useListQuery';
import { api } from '@/services/api';
import { formatMonth } from '@/utils/format';
import { ReferralTable } from '@/features/shared/ReferralTable';
import { REFERRAL_STATUS_OPTIONS } from '@/features/shared/referralStatus';

function ReassignModal({ referral, agents, onClose, onDone }) {
  const [agentId, setAgentId] = useState('');
  const confirm = useConfirm();
  const { run, busy } = useApiAction();
  const submit = async () => {
    const agent = agents.find((a) => a.id === Number(agentId));
    if (
      !(await confirm({
        title: 'Reassign referral?',
        message: `${referral.fullName} will move from ${referral.agentName} to ${agent.fullName}. The change is logged.`,
        confirmLabel: 'Reassign',
      }))
    )
      return;
    await run(() => api.put(`/admin/students/${referral.studentId}/referral`, { agentId: Number(agentId) }), {
      success: 'Referral reassigned',
      onDone: () => {
        onDone();
        onClose();
      },
    });
  };
  return (
    <Modal
      open
      size="md"
      title={`Reassign ${referral.fullName}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!agentId} loading={Boolean(busy)} onClick={submit}>
            Reassign
          </Button>
        </>
      }
    >
      <p className="muted" style={{ marginBottom: 12 }}>
        Currently attributed to <strong>{referral.agentName}</strong>.
      </p>
      <select className="select" value={agentId} onChange={(e) => setAgentId(e.target.value)} aria-label="New agent">
        <option value="">Select the new agent…</option>
        {agents
          .filter((a) => a.isActive && a.id !== referral.agentId)
          .map((a) => (
            <option key={a.id} value={a.id}>
              {a.fullName} ({a.code})
            </option>
          ))}
      </select>
    </Modal>
  );
}

export default function ReferralsPage() {
  const { query, apiQuery, update, setPage, setSort } = useListQuery({ sort: 'registered_at' });
  const list = useFetch('/admin/referrals', apiQuery);
  const report = useFetch('/admin/referrals/report');
  const agents = useFetch('/admin/lookups/agents');
  const courses = useFetch('/admin/lookups/courses');
  const [reassigning, setReassigning] = useState(null);

  return (
    <>
      <PageHeader
        title="Agent Referral Students"
        subtitle="All referred students, their agents and course status — calculated from enrolment records."
      />
      <AsyncContent state={report}>
        {({ totals, byAgent, monthly }) => (
          <div className="stack" style={{ marginBottom: 'var(--gutter)' }}>
            <div className="dash-grid dash-grid--stats4">
              <StatCard icon={Users} tone="amber" label="Total Referrals" value={totals.total} hint={`${totals.thisMonth} this month`} />
              <StatCard icon={CircleCheck} tone="green" label="Active Students" value={totals.active} />
              <StatCard icon={Clock} tone="blue" label="Pending" value={totals.pending} />
              <StatCard icon={GraduationCap} tone="purple" label="Course Completed" value={totals.completed} />
            </div>
            <div className="dash-grid dash-grid--chart">
              <Card title="Referral report by agent" flush>
                <DataTable
                  compact
                  rows={byAgent}
                  rowKey="agentId"
                  columns={[
                    {
                      key: 'agent',
                      header: 'Agent',
                      render: (r) => (
                        <Link to={`/admin/agents/${r.agentId}`} className="cell-person__name">
                          {r.agentName}
                        </Link>
                      ),
                    },
                    { key: 'code', header: 'Code', render: (r) => <span className="chip">{r.referralCode}</span> },
                    { key: 'total', header: 'Total', align: 'right', render: (r) => <strong className="num">{r.total}</strong> },
                    { key: 'active', header: 'Active', align: 'right', render: (r) => <span className="num">{r.active}</span> },
                    { key: 'pending', header: 'Pending', align: 'right', render: (r) => <span className="num">{r.pending}</span> },
                    { key: 'completed', header: 'Completed', align: 'right', render: (r) => <span className="num">{r.completed}</span> },
                    { key: 'inactive', header: 'Inactive', align: 'right', render: (r) => <span className="num">{r.inactive}</span> },
                  ]}
                />
              </Card>
              <Card title="New referrals per month" subtitle="Last 12 months, all agents">
                <LineChart
                  data={monthly}
                  xKey="month"
                  xFormat={formatMonth}
                  series={[{ key: 'count', label: 'New referrals', color: 'var(--accent)' }]}
                  ariaLabel="New referrals per month"
                />
              </Card>
            </div>
          </div>
        )}
      </AsyncContent>

      <Card flush>
        <div className="toolbar">
          <SearchInput value={query.search} onSearch={(search) => update({ search })} placeholder="Search student, ID, email or agent" />
          <FilterSelect
            label="Agent"
            allLabel="All agents"
            value={query.agentId}
            onChange={(agentId) => update({ agentId })}
            options={(agents.data ?? []).map((a) => ({ value: a.id, label: a.fullName }))}
          />
          <FilterSelect
            label="Status"
            allLabel="All status"
            value={query.status}
            onChange={(status) => update({ status })}
            options={REFERRAL_STATUS_OPTIONS}
          />
          <FilterSelect
            label="Course"
            allLabel="All courses"
            value={query.courseId}
            onChange={(courseId) => update({ courseId })}
            options={(courses.data ?? []).map((c) => ({ value: c.id, label: c.title }))}
          />
        </div>
        <ReferralTable
          state={list}
          query={query}
          onSort={setSort}
          admin
          showAgent
          actions={(r) => (
            <Button variant="ghost" size="sm" icon={ArrowRightLeft} onClick={() => setReassigning(r)} aria-label={`Reassign ${r.fullName}`}>
              Reassign
            </Button>
          )}
        />
        <Pagination meta={list.meta} onPage={setPage} noun="students" />
      </Card>
      {reassigning && (
        <ReassignModal
          referral={reassigning}
          agents={agents.data ?? []}
          onClose={() => setReassigning(null)}
          onDone={() => {
            list.reload();
            report.reload();
          }}
        />
      )}
    </>
  );
}
