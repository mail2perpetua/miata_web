import { useState } from 'react';
import { CircleCheck, CircleX, Undo2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Alert, Button, InfoList, Modal, PageLoader, StatusBadge, TextArea, useConfirm } from '@/components';
import { Balance, ProofPreview } from '@/features/shared/FeeWidgets';
import { methodLabel } from '@/features/shared/fees';
import { useApiAction } from '@/hooks/useApiAction';
import { useFetch } from '@/hooks/useFetch';
import { api } from '@/services/api';
import { formatDate, formatDateTime, formatMoney } from '@/utils/format';

function FeeFigure({ label, children, total = false }) {
  return (
    <div className={`fee-figure ${total ? 'fee-figure--total' : ''}`}>
      <span className={total ? undefined : 'muted'}>{label}</span>
      <span className="num">{children}</span>
    </div>
  );
}

/**
 * Verify one payment proof: look at the screenshot / receipt and the student's fee position, then approve it (it counts
 * as paid and lowers the balance), reject it with a note the student sees, or set it back to pending to undo a decision.
 */
export function PaymentReviewModal({ paymentId, onClose, onChanged }) {
  const state = useFetch(`/admin/payments/${paymentId}`);
  const confirm = useConfirm();
  const { run, busy } = useApiAction();
  const [note, setNote] = useState(null);
  const [noteError, setNoteError] = useState(null);
  const p = state.data;
  const noteValue = note ?? p?.reviewNote ?? '';

  const decide = async (status) => {
    if (status === 'rejected' && !noteValue.trim()) {
      setNoteError('Give the reason for rejecting the payment — the student sees it.');
      return;
    }
    if (status === 'pending') {
      const ok = await confirm({
        title: 'Set this payment back to pending?',
        message:
          p.status === 'approved'
            ? `${formatMoney(p.amount, p.currency)} no longer counts as paid until it is approved again. The student is notified.`
            : 'The decision is undone and the payment waits for verification again. The student is notified.',
        confirmLabel: 'Set to pending',
      });
      if (!ok) return;
    }
    setNoteError(null);
    await run(() => api.patch(`/admin/payments/${paymentId}/status`, { status, note: noteValue.trim() || null }), {
      key: status,
      success: { approved: 'Payment approved', rejected: 'Payment rejected', pending: 'Payment set back to pending' }[status],
      onDone: (res) => {
        state.setData(res.data);
        setNote(null);
        onChanged?.();
      },
    });
  };

  const footer = p && (
    <>
      {p.status !== 'pending' && (
        <Button variant="ghost" icon={Undo2} loading={busy === 'pending'} onClick={() => decide('pending')}>
          Set back to pending
        </Button>
      )}
      <Button
        variant="danger"
        icon={CircleX}
        loading={busy === 'rejected'}
        disabled={p.status === 'rejected' && note === null}
        onClick={() => decide('rejected')}
      >
        Reject
      </Button>
      <Button icon={CircleCheck} loading={busy === 'approved'} disabled={p.status === 'approved'} onClick={() => decide('approved')}>
        Approve
      </Button>
    </>
  );

  return (
    <Modal open title="Verify payment" onClose={onClose} size="xl" footer={footer}>
      {!p ? (
        state.error ? (
          <Alert tone="error">{state.error.message}</Alert>
        ) : (
          <PageLoader />
        )
      ) : (
        <div style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', alignItems: 'start' }}>
          <ProofPreview path={`/admin/payments/${p.id}/proof`} name={p.proofName} mimeType={p.proofMimeType} />
          <div className="stack" style={{ gap: 16 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <strong style={{ fontSize: 'var(--fs-lg)' }} className="num">
                {formatMoney(p.amount, p.currency)}
              </strong>
              <StatusBadge status={p.status} label={p.status === 'pending' ? 'Pending verification' : undefined} />
            </div>
            <InfoList
              items={[
                [
                  'Student',
                  <Link key="s" to={`/admin/students/${p.studentId}`}>
                    {p.studentName} ({p.studentCode})
                  </Link>,
                ],
                ['Course', p.courseTitle],
                ['Paid on', formatDate(p.paidOn)],
                ['Method', methodLabel(p.method)],
                ['Reference', p.reference],
                ['Student’s note', p.notes],
                ['Submitted', formatDateTime(p.createdAt)],
                ...(p.status !== 'pending'
                  ? [[p.status === 'approved' ? 'Approved' : 'Rejected', `${formatDateTime(p.reviewedAt)} · ${p.reviewedByName ?? '—'}`]]
                  : []),
              ]}
            />
            <div>
              <div className="field__label" style={{ marginBottom: 4 }}>
                Fee position — {p.courseTitle}
              </div>
              <FeeFigure label="Course fee">{formatMoney(p.fees.feeAmount, p.currency)}</FeeFigure>
              {p.fees.discountAmount > 0 && (
                <FeeFigure label="Discount / scholarship">−{formatMoney(p.fees.discountAmount, p.currency)}</FeeFigure>
              )}
              <FeeFigure label="Paid (approved)">{formatMoney(p.fees.paid, p.currency)}</FeeFigure>
              <FeeFigure label="Awaiting verification">{formatMoney(p.fees.pending, p.currency)}</FeeFigure>
              <FeeFigure label="Balance" total>
                <Balance value={p.fees.balance} currency={p.currency} />
              </FeeFigure>
              {p.status === 'pending' && (
                <FeeFigure label="Balance if approved">
                  <Balance value={Math.round((p.fees.balance - p.amount) * 100) / 100} currency={p.currency} />
                </FeeFigure>
              )}
            </div>
            <TextArea
              label="Note to the student"
              hint="Required when rejecting; shown to the student with the decision."
              rows={3}
              value={noteValue}
              error={noteError}
              onChange={(e) => {
                setNote(e.target.value);
                setNoteError(null);
              }}
              maxLength={1000}
            />
          </div>
        </div>
      )}
    </Modal>
  );
}
