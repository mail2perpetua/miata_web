import { CircleCheck, Clock, Landmark, Wallet } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Card,
  DataTable,
  EmptyState,
  ErrorState,
  FilterSelect,
  PageHeader,
  Pagination,
  PersonCell,
  SearchInput,
  StatCard,
  StatusBadge,
} from '@/components';
import { methodLabel, PAYMENT_STATUS_OPTIONS } from '@/features/shared/fees';
import { useFetch } from '@/hooks/useFetch';
import { useListQuery } from '@/hooks/useListQuery';
import { formatDate, formatMoney, timeAgo } from '@/utils/format';
import { PaymentReviewModal } from './PaymentReviewModal';

/** Fee payments students reported with a proof: verify them (approve / reject) and follow what is paid and outstanding. */
export default function PaymentsPage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const { paymentId } = useParams();
  const { query, apiQuery, update, setPage, setSort } = useListQuery({ sort: 'created_at' });
  const state = useFetch('/admin/payments', apiQuery);
  const stats = useFetch('/admin/payments/stats');
  const courses = useFetch('/admin/lookups/courses');
  const currency = state.meta?.currency ?? stats.data?.currency ?? 'AUD';
  const s = stats.data;

  return (
    <>
      <PageHeader title="Fee Payments" subtitle="Verify the payment proofs students upload. Approved payments count towards their fees." />
      <div className="stack">
        {s && (
          <div className="dash-grid dash-grid--stats4">
            <StatCard
              icon={Clock}
              tone="amber"
              label="Awaiting Verification"
              value={s.pendingCount}
              hint={formatMoney(s.pendingAmount, currency)}
              to="/admin/payments?status=pending"
            />
            <StatCard
              icon={CircleCheck}
              tone="green"
              label="Approved This Month"
              value={formatMoney(s.approvedThisMonth, currency)}
              to="/admin/payments?status=approved"
            />
            <StatCard
              icon={Landmark}
              tone="blue"
              label="Total Collected"
              value={formatMoney(s.approvedAmount, currency)}
              hint={`${s.approvedCount} approved payments`}
            />
            <StatCard
              icon={Wallet}
              tone="rose"
              label="Outstanding Balance"
              value={formatMoney(s.outstanding, currency)}
              hint="Across all enrolments"
            />
          </div>
        )}
        <Card flush>
          <div className="toolbar">
            <SearchInput
              value={query.search}
              onSearch={(value) => update({ search: value })}
              placeholder="Search student, ID, e-mail or reference"
            />
            <FilterSelect
              label="Status"
              allLabel="All statuses"
              value={query.status}
              onChange={(status) => update({ status })}
              options={PAYMENT_STATUS_OPTIONS}
            />
            <FilterSelect
              label="Course"
              allLabel="All courses"
              value={query.courseId}
              onChange={(courseId) => update({ courseId })}
              options={(courses.data ?? []).map((c) => ({ value: c.id, label: c.title }))}
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
              onRowClick={(p) => navigate(`/admin/payments/${p.id}${search}`)}
              columns={[
                {
                  key: 'student',
                  header: 'Student',
                  sortKey: 'student',
                  render: (p) => <PersonCell name={p.studentName} sub={p.studentCode} />,
                },
                { key: 'course', header: 'Course', render: (p) => p.courseTitle },
                {
                  key: 'amount',
                  header: 'Amount',
                  sortKey: 'amount',
                  align: 'right',
                  render: (p) => <strong className="num nowrap">{formatMoney(p.amount, currency)}</strong>,
                },
                {
                  key: 'paidOn',
                  header: 'Paid on',
                  sortKey: 'paid_on',
                  render: (p) => <span className="nowrap">{formatDate(p.paidOn)}</span>,
                },
                {
                  key: 'method',
                  header: 'Method / reference',
                  render: (p) => (
                    <span>
                      {methodLabel(p.method)}
                      {p.reference && (
                        <span className="cell-person__sub" style={{ display: 'block' }}>
                          {p.reference}
                        </span>
                      )}
                    </span>
                  ),
                },
                {
                  key: 'createdAt',
                  header: 'Submitted',
                  sortKey: 'created_at',
                  render: (p) => <span className="nowrap muted">{timeAgo(p.createdAt)}</span>,
                },
                { key: 'status', header: 'Status', sortKey: 'status', render: (p) => <StatusBadge status={p.status} /> },
              ]}
              empty={
                <EmptyState
                  icon={Wallet}
                  title="No payments found"
                  message={query.status === 'pending' ? 'Nothing is waiting for verification.' : 'Adjust the filters to see more payments.'}
                />
              }
            />
          )}
          <Pagination meta={state.meta} onPage={setPage} noun="payments" />
        </Card>
      </div>
      {paymentId && (
        <PaymentReviewModal
          key={paymentId}
          paymentId={paymentId}
          onClose={() => navigate(`/admin/payments${search}`)}
          onChanged={() => {
            state.reload();
            stats.reload();
          }}
        />
      )}
    </>
  );
}
