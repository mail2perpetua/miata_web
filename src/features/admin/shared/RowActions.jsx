import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components';
import { useAuth } from '@/features/auth/AuthContext';

/**
 * View / Edit / Delete buttons for one row of an admin list (shown to admins only). Each button appears when its handler
 * is given; clicks never reach the row's own click handler. `editDisabled` / `deleteDisabled` (a reason) disable a
 * button and explain why in its hint. `viewIcon` replaces the eye (e.g. a play icon for videos).
 */
export function RowActions({ label, onView, onEdit, onDelete, editDisabled, deleteDisabled, deleting = false, viewIcon = Eye, children }) {
  const { user } = useAuth();
  if (user?.role !== 'admin') return null;
  const handle = (fn) => (event) => {
    event.stopPropagation();
    fn();
  };
  return (
    // The wrapper also swallows clicks between the buttons, so they never open the row.
    <span className="row-actions" onClick={(e) => e.stopPropagation()}>
      {children}
      {onView && <Button variant="ghost" size="sm" icon={viewIcon} tooltip="View" aria-label={`View ${label}`} onClick={handle(onView)} />}
      {onEdit && (
        <Button
          variant="ghost"
          size="sm"
          icon={Pencil}
          tooltip={editDisabled || 'Edit'}
          aria-label={editDisabled ? `Edit ${label} (${editDisabled})` : `Edit ${label}`}
          disabled={Boolean(editDisabled)}
          onClick={handle(onEdit)}
        />
      )}
      {onDelete && (
        <Button
          variant="ghost-danger"
          size="sm"
          icon={Trash2}
          tooltip={deleteDisabled || 'Delete'}
          aria-label={deleteDisabled ? `Delete ${label} (${deleteDisabled})` : `Delete ${label}`}
          disabled={Boolean(deleteDisabled)}
          loading={deleting}
          onClick={handle(onDelete)}
        />
      )}
    </span>
  );
}
