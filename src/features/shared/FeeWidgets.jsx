import { useEffect, useState } from 'react';
import { CircleCheck, Clock, Download, ExternalLink, FileText, Receipt, Wallet } from 'lucide-react';
import { Alert, Spinner, StatCard } from '@/components';
import { api } from '@/services/api';
import { formatMoney } from '@/utils/format';

/** A balance; a negative one means the student paid more than they owe. */
export function Balance({ value, currency }) {
  if (value < 0) return <span className="amount-negative">Overpaid {formatMoney(-value, currency)}</span>;
  return formatMoney(value, currency);
}

/** Total fees, paid (approved), awaiting verification and balance. */
export function FeeTotals({ totals, currency, compact = false }) {
  return (
    <div className="dash-grid dash-grid--stats4">
      <StatCard
        compact={compact}
        icon={Receipt}
        tone="blue"
        label="Total Fees"
        value={formatMoney(totals.payable, currency)}
        hint="After discounts"
      />
      <StatCard
        compact={compact}
        icon={CircleCheck}
        tone="green"
        label="Paid"
        value={formatMoney(totals.paid, currency)}
        hint="Approved payments"
      />
      <StatCard
        compact={compact}
        icon={Clock}
        tone="amber"
        label="Awaiting Verification"
        value={formatMoney(totals.pending, currency)}
        hint="Not counted as paid yet"
      />
      <StatCard
        compact={compact}
        icon={Wallet}
        tone={totals.balance > 0 ? 'rose' : 'green'}
        label="Pending Balance"
        value={totals.balance < 0 ? `−${formatMoney(-totals.balance, currency)}` : formatMoney(totals.balance, currency)}
        hint={totals.balance > 0 ? 'Still to pay' : totals.balance < 0 ? 'Overpaid' : 'Fully paid'}
      />
    </div>
  );
}

/**
 * Shows a payment proof fetched with the signed-in user's token (an <img src> cannot send it): images inline, PDFs as a
 * link. Both can be opened in a new tab or downloaded.
 */
export function ProofPreview({ path, name, mimeType }) {
  const [proof, setProof] = useState({ url: null, error: null });

  useEffect(() => {
    let cancelled = false;
    let url = null;
    api
      .raw(path)
      .then((res) => res.blob())
      .then((blob) => {
        url = URL.createObjectURL(blob);
        if (cancelled) URL.revokeObjectURL(url);
        else setProof({ url, error: null });
      })
      .catch((error) => !cancelled && setProof({ url: null, error }));
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [path]);

  if (proof.error) return <Alert tone="error">The proof could not be loaded: {proof.error.message}</Alert>;
  const isImage = mimeType?.startsWith('image/');
  return (
    <div className="proof-preview">
      <div className="proof-preview__frame">
        {!proof.url ? (
          <Spinner label="Loading proof" />
        ) : isImage ? (
          <img src={proof.url} alt={`Payment proof ${name}`} />
        ) : (
          <span className="row muted">
            <FileText aria-hidden="true" /> {name}
          </span>
        )}
      </div>
      {proof.url && (
        <div className="row row--wrap">
          <a className="btn btn--secondary btn--sm" href={proof.url} target="_blank" rel="noreferrer">
            <ExternalLink aria-hidden="true" /> Open in new tab
          </a>
          <a className="btn btn--secondary btn--sm" href={proof.url} download={name}>
            <Download aria-hidden="true" /> Download
          </a>
        </div>
      )}
    </div>
  );
}
