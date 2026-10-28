import { useState } from 'react';
import { Download, Landmark, Receipt, Upload, Wallet } from 'lucide-react';
import { Alert, AsyncContent, Button, Card, DataTable, EmptyState, PageHeader, StatusBadge } from '@/components';
import { Balance, FeeTotals } from '@/features/shared/FeeWidgets';
import { methodLabel } from '@/features/shared/fees';
import { useApiAction } from '@/hooks/useApiAction';
import { useFetch } from '@/hooks/useFetch';
import { download } from '@/services/api';
import { formatDate, formatMoney } from '@/utils/format';
import { SubmitPaymentModal } from './SubmitPaymentModal';

/** The student's course fees, what is paid and still due, how to pay, and the payments they reported. */
export default function FeesPage() {
  const state = useFetch('/student/fees');
  const [submitting, setSubmitting] = useState(false);
  const { run, busy } = useApiAction();

  return (
    <AsyncContent state={state}>
      {({ currency, paymentInstructions, totals, courses, payments }) => {
        const canPay = courses.some((c) => c.balance - c.pending > 0);
        return (
          <>
            <PageHeader
              title="Fees & Payments"
              subtitle="Your course fees, what you have paid and what is still due. Upload a proof after each transfer."
              actions={
                <Button icon={Upload} onClick={() => setSubmitting(true)} disabled={!canPay}>
                  Upload payment proof
                </Button>
              }
            />
            <div className="stack">
              <FeeTotals totals={totals} currency={currency} />
              <div className="split">
                <div className="stack">
                  <Card title="Course fees" icon={Receipt} flush>
                    <DataTable
                      rows={courses}
                      rowKey="enrolmentId"
                      columns={[
                        {
                          key: 'course',
                          header: 'Course',
                          render: (c) => (
                            <span>
                              <strong>{c.courseTitle}</strong>
                              <span className="cell-person__sub" style={{ display: 'block' }}>
                                {c.courseCode}
                              </span>
                            </span>
                          ),
                        },
                        {
                          key: 'fee',
                          header: 'Course fee',
                          align: 'right',
                          render: (c) => <span className="num nowrap">{formatMoney(c.feeAmount, currency)}</span>,
                        },
                        {
                          key: 'discount',
                          header: 'Discount',
                          align: 'right',
                          render: (c) => (
                            <span className="num nowrap">{c.discountAmount ? `−${formatMoney(c.discountAmount, currency)}` : '—'}</span>
                          ),
                        },
                        {
                          key: 'paid',
                          header: 'Paid',
                          align: 'right',
                          render: (c) => <span className="num nowrap">{formatMoney(c.paid, currency)}</span>,
                        },
                        {
                          key: 'pending',
                          header: 'Awaiting verification',
                          align: 'right',
                          render: (c) => <span className="num muted nowrap">{c.pending ? formatMoney(c.pending, currency) : '—'}</span>,
                        },
                        {
                          key: 'balance',
                          header: 'Balance',
                          align: 'right',
                          render: (c) => (
                            <strong className="num nowrap">
                              <Balance value={c.balance} currency={currency} />
                            </strong>
                          ),
                        },
                      ]}
                      empty={
                        <EmptyState
                          icon={Receipt}
                          title="No course fees yet"
                          message="Your fees appear here once you are enrolled in a course."
                        />
                      }
                    />
                  </Card>

                  <Card title="Payment history" icon={Wallet} flush>
                    <DataTable
                      rows={payments}
                      columns={[
                        { key: 'paidOn', header: 'Paid on', render: (p) => <span className="nowrap">{formatDate(p.paidOn)}</span> },
                        { key: 'course', header: 'Course', render: (p) => p.courseTitle },
                        {
                          key: 'amount',
                          header: 'Amount',
                          align: 'right',
                          render: (p) => <strong className="num nowrap">{formatMoney(p.amount, currency)}</strong>,
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
                          key: 'status',
                          header: 'Status',
                          render: (p) => (
                            <span>
                              <StatusBadge status={p.status} label={p.status === 'pending' ? 'Awaiting verification' : undefined} />
                              {p.reviewNote && (
                                <span className="cell-person__sub" style={{ display: 'block', whiteSpace: 'normal', maxWidth: 260 }}>
                                  {p.reviewNote}
                                </span>
                              )}
                            </span>
                          ),
                        },
                        {
                          key: 'proof',
                          header: <span className="sr-only">Proof</span>,
                          align: 'right',
                          render: (p) => (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Download}
                              loading={busy === `proof-${p.id}`}
                              aria-label={`Download proof ${p.proofName}`}
                              title={p.proofName}
                              onClick={() =>
                                run(() => download(`/student/payments/${p.id}/proof`, null, p.proofName), { key: `proof-${p.id}` })
                              }
                            />
                          ),
                        },
                      ]}
                      empty={
                        <EmptyState
                          icon={Wallet}
                          title="No payments reported yet"
                          message="After you transfer a fee, upload the screenshot or receipt so MIATA can verify it."
                        />
                      }
                    />
                  </Card>
                </div>

                <aside className="stack">
                  <Card title="How to pay" icon={Landmark}>
                    {paymentInstructions ? (
                      <p className="instructions" style={{ margin: 0 }}>
                        {paymentInstructions}
                      </p>
                    ) : (
                      <p className="muted" style={{ margin: 0 }}>
                        Contact MIATA admissions for the payment details.
                      </p>
                    )}
                    <ol className="muted" style={{ fontSize: 'var(--fs-sm)', paddingLeft: 18, margin: '14px 0 0', lineHeight: 1.7 }}>
                      <li>Transfer the amount using the details above.</li>
                      <li>Take a screenshot of the confirmation or keep the receipt.</li>
                      <li>
                        Choose <strong>Upload payment proof</strong> and add it with the amount and date.
                      </li>
                      <li>MIATA verifies it; once approved, your balance is updated and you are notified.</li>
                    </ol>
                  </Card>
                  {totals.pending > 0 && (
                    <Alert tone="info">
                      {formatMoney(totals.pending, currency)} is awaiting verification. It counts as paid once MIATA approves it.
                    </Alert>
                  )}
                  {courses.length > 0 && !canPay && totals.balance <= 0 && (
                    <Alert tone="success">Your fees are fully paid. Thank you!</Alert>
                  )}
                </aside>
              </div>
            </div>
            {submitting && (
              <SubmitPaymentModal
                open
                courses={courses}
                currency={currency}
                onClose={() => setSubmitting(false)}
                onSubmitted={() => state.reload()}
              />
            )}
          </>
        );
      }}
    </AsyncContent>
  );
}
