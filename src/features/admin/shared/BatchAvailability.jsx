import { useState } from 'react';
import { Alert, Button, Checkbox, Modal } from '@/components';
import { useApiAction } from '@/hooks/useApiAction';
import { useFetch } from '@/hooks/useFetch';
import { api } from '@/services/api';

/** Who a module or video is for: "All batches", or the batches it is restricted to. */
export function AvailabilityChips({ batches }) {
  if (!batches?.length) return <span className="badge badge--gray">All batches</span>;
  return (
    <span className="row row--wrap" style={{ gap: 4 }}>
      {batches.map((b) => (
        <span key={b.id} className="badge badge--purple" title={b.code}>
          {b.name}
        </span>
      ))}
    </span>
  );
}

/**
 * Checkboxes of the batches taking a course, bound to a list of batch ids. No ticks = available to every batch
 * (and to students who are not in a batch), which is how material behaves without batches.
 */
export function BatchChecklist({ batches, value, onChange, label = 'Available to' }) {
  const toggle = (id) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  return (
    <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
      <legend className="field__label" style={{ marginBottom: 8 }}>
        {label}
      </legend>
      {batches.length ? (
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {batches.map((b) => (
            <Checkbox
              key={b.id}
              checked={value.includes(b.id)}
              onChange={() => toggle(b.id)}
              label={`${b.name} (${b.code})${b.isActive ? '' : ' — inactive'}`}
            />
          ))}
        </div>
      ) : (
        <p className="muted">No batch takes this course yet.</p>
      )}
      <div className="field__hint" style={{ marginTop: 8 }}>
        {value.length
          ? 'Only students of the ticked batches see it.'
          : 'Nothing ticked: every student of the course sees it, in any batch or none.'}
      </div>
    </fieldset>
  );
}

/** `BatchChecklist` over the batches that take the course (loaded from the batch lookup). */
export function CourseBatchChecklist({ courseId, ...props }) {
  const lookup = useFetch('/admin/lookups/batches');
  if (!lookup.data) return null;
  return <BatchChecklist batches={lookup.data.filter((b) => b.courseIds.includes(Number(courseId)))} {...props} />;
}

/** Change which batches a module or video (`kind`) belongs to. */
export function AvailabilityModal({ kind, item, courseId, onClose, onSaved }) {
  const [value, setValue] = useState(item.batches.map((b) => b.id));
  const { run, busy } = useApiAction();
  const save = () =>
    run(() => api.put(`/admin/${kind}s/${item.id}/batches`, { batchIds: value }), {
      success: value.length ? 'Availability restricted to the selected batches' : 'Now available to every batch',
      onDone: () => {
        onSaved();
        onClose();
      },
    });
  return (
    <Modal
      open
      title={`Who can see “${item.title}”?`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} loading={Boolean(busy)}>
            Save availability
          </Button>
        </>
      }
    >
      <div className="stack" style={{ gap: 14 }}>
        {kind === 'module' && <Alert tone="info">The module’s lessons, videos and assignments follow its availability.</Alert>}
        <CourseBatchChecklist courseId={courseId} value={value} onChange={setValue} />
      </div>
    </Modal>
  );
}
