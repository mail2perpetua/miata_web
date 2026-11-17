import { Fragment, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components';
import { useAuth } from '@/features/auth/AuthContext';

/**
 * Three-dot (⋮) menu with View / Edit / Delete for one row of an admin list (admins only). Each item appears when its
 * handler is given; `editDisabled` / `deleteDisabled` (a reason) disable it and show the reason under it.
 *
 * The menu is rendered in a portal with fixed positioning, so the table's horizontal scroll container cannot clip it,
 * and opens upwards when there is no room below. Keyboard: ↑ ↓ Home End move, Enter selects, Escape closes (back to
 * the button), Tab closes. Clicks inside never reach the row's own click handler.
 */
export function RowActionsMenu({ label, onView, onEdit, onDelete, editDisabled, deleteDisabled, deleting = false }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const menuRef = useRef(null);
  const menuId = useId();

  const items = [
    onView && { key: 'view', label: 'View', icon: Eye, onSelect: onView },
    onEdit && { key: 'edit', label: 'Edit', icon: Pencil, onSelect: onEdit, disabled: editDisabled },
    onDelete && { key: 'delete', label: 'Delete', icon: Trash2, onSelect: onDelete, disabled: deleteDisabled, danger: true },
  ].filter(Boolean);

  const focusTrigger = () => anchorRef.current?.querySelector('button')?.focus();

  // Place the menu under the button (right-aligned), or above it when it would run off the bottom of the window.
  useLayoutEffect(() => {
    const menu = menuRef.current;
    const anchor = anchorRef.current;
    if (!open || !menu || !anchor) return;
    const r = anchor.getBoundingClientRect();
    const { offsetHeight: h, offsetWidth: w } = menu;
    const below = r.bottom + 6;
    const above = r.top - 6 - h;
    menu.style.top = `${below + h <= window.innerHeight - 8 || above < 8 ? below : above}px`;
    menu.style.left = `${Math.max(8, Math.min(r.right - w, window.innerWidth - w - 8))}px`;
    menu.style.visibility = 'visible';
    menu.querySelector('[role="menuitem"]:not(:disabled)')?.focus();
  }, [open]);

  // Close on a click elsewhere, on scrolling (the menu would drift from its button) and on resizing.
  useEffect(() => {
    if (!open) return undefined;
    const outside = (e) => !menuRef.current?.contains(e.target) && !anchorRef.current?.contains(e.target);
    const onDown = (e) => outside(e) && setOpen(false);
    const onScroll = (e) => !menuRef.current?.contains(e.target) && setOpen(false);
    const onResize = () => setOpen(false);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  if (user?.role !== 'admin' || !items.length) return null;

  const onKeyDown = (e) => {
    const enabled = [...menuRef.current.querySelectorAll('[role="menuitem"]:not(:disabled)')];
    const i = enabled.indexOf(document.activeElement);
    const moveTo = (index) => {
      e.preventDefault();
      enabled[(index + enabled.length) % enabled.length]?.focus();
    };
    if (e.key === 'ArrowDown') moveTo(i + 1);
    else if (e.key === 'ArrowUp') moveTo(i - 1);
    else if (e.key === 'Home') moveTo(0);
    else if (e.key === 'End') moveTo(enabled.length - 1);
    else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      focusTrigger();
    } else if (e.key === 'Tab') setOpen(false);
  };

  return (
    <span className="action-menu__anchor" ref={anchorRef}>
      <Button
        variant="ghost"
        size="sm"
        icon={MoreVertical}
        loading={deleting}
        aria-label={`Actions for ${label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      />
      {open &&
        createPortal(
          // Clicks inside must not reach the table row (React events bubble through portals).
          <div
            id={menuId}
            ref={menuRef}
            role="menu"
            aria-label={`Actions for ${label}`}
            className="action-menu"
            onKeyDown={onKeyDown}
            onClick={(e) => e.stopPropagation()}
          >
            {items.map((item, index) => (
              <Fragment key={item.key}>
                {item.danger && index > 0 && <div className="dropdown__divider" role="separator" />}
                <button
                  type="button"
                  role="menuitem"
                  className={`dropdown__item ${item.danger ? 'dropdown__item--danger' : ''}`}
                  disabled={Boolean(item.disabled)}
                  onClick={() => {
                    setOpen(false);
                    item.onSelect();
                  }}
                >
                  <item.icon aria-hidden="true" />
                  <span className="dropdown__item-text">
                    {item.label}
                    {item.disabled && <small>{item.disabled}</small>}
                  </span>
                </button>
              </Fragment>
            ))}
          </div>,
          document.body,
        )}
    </span>
  );
}
