import { useState } from 'react';
import { Mail, Phone, RefreshCw, Send } from 'lucide-react';
import { Alert, Button, InfoList, Modal, PageLoader, SelectField, StatusBadge, TextArea, TextField } from '@/components';
import { useApiAction } from '@/hooks/useApiAction';
import { useFetch } from '@/hooks/useFetch';
import { api } from '@/services/api';
import { formatDate, formatDateTime } from '@/utils/format';
import { ENQUIRY_STATUSES } from './enquiryStatuses';

export function EnquiryDetailModal({ enquiryId, onClose, onChange }) {
  const state = useFetch(`/admin/enquiries/${enquiryId}`);
  const { run, busy } = useApiAction();
  const [note, setNote] = useState('');

  const apply = (promise, success) =>
    run(() => promise, {
      success,
      onDone: (res) => {
        state.setData(res.data);
        onChange();
      },
    });

  const e = state.data;
  return (
    <Modal open title={e ? `Enquiry from ${e.name}` : 'Enquiry'} onClose={onClose} size="lg">
      {!e ? (
        <PageLoader />
      ) : (
        <div className="stack" style={{ gap: 18 }}>
          <div className="row row--wrap">
            <StatusBadge status={e.status} />
            <StatusBadge status={e.emailStatus} />
            <span className="muted">
              Received {formatDateTime(e.createdAt)} via {e.source === 'website' ? 'website form' : 'admin entry'}
            </span>
          </div>
          {e.emailStatus === 'failed' && (
            <Alert tone="error">
              The notification email could not be sent: {e.emailError}
              <div style={{ marginTop: 8 }}>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={RefreshCw}
                  loading={busy === 'retry'}
                  onClick={() =>
                    run(() => api.post(`/admin/enquiries/${e.id}/notify`), {
                      success: 'Notification retried',
                      key: 'retry',
                      onDone: (res) => state.setData(res.data),
                    })
                  }
                >
                  Retry email
                </Button>
              </div>
            </Alert>
          )}
          {e.emailStatus === 'skipped' && e.source === 'website' && (
            <Alert tone="info">No notification email was sent: {e.emailError || 'email is not configured'}.</Alert>
          )}

          <InfoList
            items={[
              [
                'Email',
                <a key="e" href={`mailto:${e.email}`}>
                  <Mail size={14} style={{ display: 'inline', verticalAlign: -2 }} /> {e.email}
                </a>,
              ],
              [
                'Phone',
                e.phone ? (
                  <a key="p" href={`tel:${e.phone}`}>
                    <Phone size={14} style={{ display: 'inline', verticalAlign: -2 }} /> {e.phone}
                  </a>
                ) : null,
              ],
              ['Subject', e.subject],
              ['Course interest', e.courseInterest],
            ]}
          />
          <div>
            <div className="field__label" style={{ marginBottom: 6 }}>
              Message
            </div>
            <p className="instructions" style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 10 }}>
              {e.message}
            </p>
          </div>

          <div className="form-grid">
            <SelectField
              label="Status"
              value={e.status}
              options={ENQUIRY_STATUSES}
              onChange={(ev) => apply(api.patch(`/admin/enquiries/${e.id}`, { status: ev.target.value }), 'Status updated')}
            />
            <TextField
              label="Follow-up date"
              type="date"
              value={e.followUpOn ?? ''}
              onChange={(ev) =>
                apply(api.patch(`/admin/enquiries/${e.id}`, { followUpOn: ev.target.value || null }), 'Follow-up date saved')
              }
              hint={e.followUpOn ? `Follow up on ${formatDate(e.followUpOn)}` : 'Optional reminder date'}
            />
          </div>

          <div>
            <div className="field__label" style={{ marginBottom: 8 }}>
              Follow-up notes
            </div>
            <form
              className="stack"
              style={{ gap: 8 }}
              onSubmit={(ev) => {
                ev.preventDefault();
                if (!note.trim()) return;
                apply(api.post(`/admin/enquiries/${e.id}/notes`, { note: note.trim() }), 'Note added').then(() => setNote(''));
              }}
            >
              <TextArea
                label="Add a note"
                value={note}
                onChange={(ev) => setNote(ev.target.value)}
                rows={2}
                placeholder="e.g. Called the student, sent the brochure"
              />
              <div className="form-actions">
                <Button type="submit" size="sm" icon={Send} disabled={!note.trim()}>
                  Add note
                </Button>
              </div>
            </form>
            <ul className="list" style={{ marginTop: 8 }}>
              {e.notes.map((n) => (
                <li key={n.id} className="list__item" style={{ paddingLeft: 0, paddingRight: 0 }}>
                  <div className="list__main">
                    <div className="list__title" style={{ whiteSpace: 'pre-wrap', fontWeight: 500 }}>
                      {n.note}
                    </div>
                    <div className="list__sub">
                      {n.authorName ?? 'System'} · {formatDateTime(n.createdAt)}
                    </div>
                  </div>
                </li>
              ))}
              {e.notes.length === 0 && (
                <li className="muted" style={{ padding: '8px 0' }}>
                  No notes yet.
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </Modal>
  );
}
