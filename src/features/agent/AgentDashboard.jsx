import { useState } from 'react';
import { CircleCheck, Clock, Trophy, UserPlus, Users } from 'lucide-react';
import { AsyncContent, Button, Card, LineChart, PageHeader, StatCard } from '@/components';
import { useAuth } from '@/features/auth/AuthContext';
import { ReferralLinkCard } from '@/features/shared/ReferralLinkCard';
import { useFetch } from '@/hooks/useFetch';
import { useListQuery } from '@/hooks/useListQuery';
import { formatMonth } from '@/utils/format';
import { ApplyNowModal } from './ApplyNowModal';
import { ReferredStudentsList } from './ReferredStudentsList';

export default function AgentDashboard() {
  const { user } = useAuth();
  const [months, setMonths] = useState(6);
  const state = useFetch('/agent/dashboard', { months });
  const list = useListQuery({ sort: 'registered_at', pageSize: 5 });
  const [applying, setApplying] = useState(false);
  const [version, setVersion] = useState(0);

  return (
    <>
      <PageHeader
        title="Agent Dashboard"
        subtitle={
          <>
            Welcome back, {user.fullName}!
            <br />
            Track your referrals and help students achieve their goals.
          </>
        }
        actions={
          <Button icon={UserPlus} onClick={() => setApplying(true)}>
            Apply Now
          </Button>
        }
      />
      <AsyncContent state={state}>
        {({ counts, monthly, referralCode, referralLink }) => (
          <div className="stack">
            <div className="dash-grid dash-grid--stats4">
              <StatCard
                icon={Users}
                tone="amber"
                label="Total Referrals"
                value={counts.total}
                hint="All referred students"
                to="/agent/students"
              />
              <StatCard
                icon={CircleCheck}
                tone="green"
                label="Active Students"
                value={counts.active}
                hint="Currently learning"
                to="/agent/students?status=active"
              />
              <StatCard
                icon={Clock}
                tone="blue"
                label="Pending Students"
                value={counts.pending}
                hint="Registered, awaiting enrolment"
                to="/agent/students?status=pending"
              />
              <StatCard
                icon={Trophy}
                tone="purple"
                label="Course Completed"
                value={counts.completed}
                hint="Completed a course"
                to="/agent/students?status=completed"
              />
            </div>
            <div className="dash-grid dash-grid--chart">
              <Card
                title="Referral Overview"
                subtitle={`Your student referral performance (last ${months} months)`}
                action={
                  <select
                    className="select select--inline"
                    value={months}
                    onChange={(e) => setMonths(Number(e.target.value))}
                    aria-label="Time range"
                  >
                    <option value={6}>Last 6 Months</option>
                    <option value={12}>Last 12 Months</option>
                  </select>
                }
              >
                <LineChart
                  data={monthly}
                  xKey="month"
                  xFormat={formatMonth}
                  series={[{ key: 'cumulative', label: 'Total referrals', color: 'var(--accent)' }]}
                  ariaLabel="Total referrals per month"
                />
              </Card>
              <ReferralLinkCard code={referralCode} link={referralLink} />
            </div>
            <Card title="My Referred Students" subtitle="Track your referred students and their progress" flush>
              <ReferredStudentsList {...list} version={version} />
            </Card>
          </div>
        )}
      </AsyncContent>
      <ApplyNowModal
        open={applying}
        onClose={() => setApplying(false)}
        onApplied={() => {
          setVersion((v) => v + 1);
          state.reload();
        }}
      />
    </>
  );
}
