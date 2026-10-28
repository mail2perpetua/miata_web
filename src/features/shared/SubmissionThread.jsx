import { Download, FileText, MessageSquare, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Avatar, Button, EmptyState, StatusBadge, TextArea, useToast } from '@/components';
import { download } from '@/services/api';
import { formatBytes, formatDateTime } from '@/utils/format';

/** All attempts for one student + assignment, newest first, each with a download button. */
export function AttemptsList({ attempts, fileUrl }) {
  if (!attempts?.length) return <EmptyState icon={FileText} title="No submissions yet" />;
  return (
    <ul className="list">
      {attempts.map((a) => (
        <li key={a.id} className="list__item" style={{ paddingLeft: 0, paddingRight: 0 }}>
          <span className="timeline-icon tone-blue">
            <FileText aria-hidden="true" />
          </span>
          <div className="list__main">
            <div className="list__title">
              Attempt {a.attemptNo} · {a.fileName}
            </div>
            <div className="list__sub">
              Submitted {formatDateTime(a.submittedAt)} · {formatBytes(a.fileSize)}
              {a.notes && <> · “{a.notes}”</>}
            </div>
          </div>
          <StatusBadge status={a.status} />
          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={() => download(fileUrl(a.id))}
            aria-label={`Download attempt ${a.attemptNo}`}
          />
        </li>
      ))}
    </ul>
  );
}

/** Professor decisions and the comment thread, merged into one chronological feed. */
export function ReviewFeed({ reviews = [], comments = [] }) {
  const items = [
    ...reviews.map((r) => ({ ...r, kind: 'review', at: r.createdAt, author: r.professorName })),
    ...comments.map((c) => ({ ...c, kind: 'comment', at: c.createdAt, author: c.authorName })),
  ].sort((a, b) => new Date(a.at) - new Date(b.at));

  if (!items.length) return <EmptyState icon={MessageSquare} title="No feedback yet" message="Reviews and comments will appear here." />;
  return (
    <ul className="feed">
      {items.map((item) => (
        <li key={`${item.kind}-${item.id}`} className={`feed__item ${item.kind === 'review' ? `feed__item--${item.decision}` : ''}`}>
          <Avatar name={item.author} size="sm" />
          <div className="feed__body">
            <div className="feed__meta">
              <strong>{item.author}</strong>
              {item.kind === 'review' ? (
                <StatusBadge status={item.decision} label={item.decision === 'completed' ? 'Marked Completed' : 'Rework Requested'} />
              ) : (
                item.authorRole && <span className="chip">{item.authorRole}</span>
              )}
              <span className="muted">
                Attempt {item.attemptNo} · {formatDateTime(item.at)}
              </span>
            </div>
            {(item.feedback || item.body) && <p className="feed__text">{item.feedback || item.body}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Comment box shared by professors and students. `onSubmit(body)` must return a promise. */
export function CommentBox({ onSubmit, placeholder = 'Write a comment…' }) {
  const toast = useToast();
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const send = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    try {
      await onSubmit(body.trim());
      setBody('');
      toast.success('Comment added');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={send} className="stack" style={{ gap: 10 }}>
      <TextArea
        label="Add a comment"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        rows={3}
        maxLength={5000}
      />
      <div className="form-actions">
        <Button type="submit" variant="secondary" icon={MessageSquare} loading={busy} disabled={!body.trim()}>
          Post comment
        </Button>
      </div>
    </form>
  );
}

export function ResubmitHint() {
  return (
    <p className="muted row" style={{ fontSize: 'var(--fs-sm)' }}>
      <RefreshCw size={16} aria-hidden="true" /> The student can upload a revised file. It will appear as a new attempt.
    </p>
  );
}
