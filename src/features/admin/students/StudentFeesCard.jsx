import { useState } from 'react';
import { Pencil, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, Card, DataTable, EmptyState, StatusBadge } from '@/components';
import { Balance } from '@/features/shared/FeeWidgets';
import { formatDate, formatMoney } from '@/utils/format';
import { EnrolmentFeeModal } from './EnrolmentModals';

/** Fees per enrolment (editable), totals, and the payments the student reported (verified on the Fee Payments page). */
export function StudentFeesCard({ student, onChange }) {
  const [editing, setEditing] = useState(null);
  const { currency, payable, paid, pending, balance } = student.fees;

  return (
    <Card title="Fees & payments" icon={Wallet} flush>
      <div className="row row--wrap" style={{ gap: 24, padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
        {[
          ['Total fees', formatMoney(payable, currency)],
          ['Paid', formatMoney(paid, currency)],
          ['Awaiting verification', formatMoney(pending, currency)],
          ['Balance', <Balance key="b" value={balance} currency={currency} />],
        ].map(([label, value]) => (
          <div key={label}>
            <div className="muted" style={{ fontSize: 'var(--fs-xs)' }}>
              {label}
            </div>
            <strong className="num">{value}</strong>
          </div>
        ))}
      </div>
      <DataTable
        compact
        rows={student.enrolments}
        rowKey="enrolmentId"
        columns={[
          { key: 'course', header: 'Course', render: (e) => e.courseTitle },
          {
            key: 'fee',
            header: 'Fee',
            align: 'right',
            render: (e) => <span className="num nowrap">{formatMoney(e.feeAmount, currency)}</span>,
          },
          {
            key: 'discount',
            header: 'Discount',
            align: 'right',
            render: (e) => <span className="num nowrap">{e.discountAmount ? `−${formatMoney(e.discountAmount, currency)}` : '—'}</span>,
          },
          {
            key: 'paid',
            header: 'Paid',
            align: 'right',
            render: (e) => <span className="num nowrap">{formatMoney(e.paid, currency)}</span>,
          },
          {
            key: 'balance',
            header: 'Balance',
            align: 'right',
            render: (e) => (
              <strong className="num nowrap">
                <Balance value={e.balance} currency={currency} />
              </strong>
            ),
          },
          {
            key: 'edit',
            header: <span className="sr-only">Edit fee</span>,
            align: 'right',
            render: (e) => (
              <Button variant="ghost" size="sm" icon={Pencil} onClick={() => setEditing(e)} aria-label={`Edit fee for ${e.courseTitle}`} />
            ),
          },
        ]}
        empty={<EmptyState icon={Wallet} title="No fees yet" message="Fees are set per course when the student is enrolled." />}
      />
      {student.payments.length > 0 && (
        <>
          <div className="card__subtitle" style={{ padding: '14px 20px 6px', fontWeight: 600 }}>
            Payments reported
          </div>
          <DataTable
            compact
            rows={student.payments}
            columns={[
              { key: 'paidOn', header: 'Paid on', render: (p) => <span className="nowrap">{formatDate(p.paidOn)}</span> },
              { key: 'course', header: 'Course', render: (p) => p.courseTitle },
              {
                key: 'amount',
                header: 'Amount',
                align: 'right',
                render: (p) => <span className="num nowrap">{formatMoney(p.amount, currency)}</span>,
              },
              {
                key: 'status',
                header: 'Status',
                render: (p) => (
                  <Link to={`/admin/payments/${p.id}`}>
                    <StatusBadge status={p.status} />
                  </Link>
                ),
              },
            ]}
          />
        </>
      )}
      {editing && <EnrolmentFeeModal enrolment={editing} currency={currency} onClose={() => setEditing(null)} onSaved={onChange} />}
    </Card>
  );
}
