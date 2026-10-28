import { useState } from 'react';
import { CalendarPlus, CircleCheck, Clock, Trophy, Users } from 'lucide-react';
import { AsyncContent, BarChart, Card, DataTable, EmptyState, LineChart, PageHeader, StatCard } from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { formatMonth } from '@/utils/format';

export default function ReferralCountPage() {
  const [months, setMonths] = useState(12);
  const state = useFetch('/agent/stats', { months });

  return (
    <>
      <PageHeader
        title="Referral Count"
        subtitle="Your referral numbers, calculated from registration and enrolment records."
        actions={
          <select
            className="select select--inline"
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            aria-label="Time range"
          >
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
            <option value={24}>Last 24 months</option>
          </select>
        }
      />
      <AsyncContent state={state}>
        {({ counts, monthly, byCourse }) => (
          <div className="stack">
            <div className="dash-grid dash-grid--stats6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
              <StatCard icon={Users} tone="amber" label="Total referrals" value={counts.total} />
              <StatCard icon={CalendarPlus} tone="blue" label="This month" value={counts.thisMonth} />
              <StatCard icon={CircleCheck} tone="green" label="Active" value={counts.active} />
              <StatCard icon={Clock} tone="orange" label="Pending" value={counts.pending} />
              <StatCard icon={Trophy} tone="purple" label="Completed" value={counts.completed} />
            </div>
            <div className="dash-grid dash-grid--chart">
              <Card title="New referrals per month" subtitle="Students who registered with your link each month">
                <LineChart
                  data={monthly}
                  xKey="month"
                  xFormat={formatMonth}
                  series={[{ key: 'count', label: 'New referrals', color: 'var(--accent)' }]}
                  ariaLabel="New referrals per month"
                />
              </Card>
              <Card title="Referrals by course" subtitle="Enrolments of your referred students">
                {byCourse.length ? (
                  <BarChart
                    items={byCourse.map((c) => ({
                      key: c.courseId,
                      label: c.title,
                      value: c.students,
                      detail: `${c.completed} completed`,
                    }))}
                    valueLabel="students"
                  />
                ) : (
                  <EmptyState title="No enrolments yet" />
                )}
              </Card>
            </div>
            <Card title="Monthly breakdown" flush>
              <DataTable
                compact
                rows={[...monthly].reverse()}
                rowKey="month"
                columns={[
                  { key: 'month', header: 'Month', render: (m) => `${formatMonth(m.month)} ${m.month.slice(0, 4)}` },
                  { key: 'count', header: 'New referrals', align: 'right', render: (m) => <span className="num">{m.count}</span> },
                  {
                    key: 'cumulative',
                    header: 'Running total',
                    align: 'right',
                    render: (m) => <strong className="num">{m.cumulative}</strong>,
                  },
                ]}
              />
            </Card>
          </div>
        )}
      </AsyncContent>
    </>
  );
}
