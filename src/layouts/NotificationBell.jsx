import { useCallback, useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dropdown, EmptyState, Spinner } from '@/components';
import { api } from '@/services/api';
import { timeAgo } from '@/utils/format';

const POLL_MS = 120_000;

export function NotificationBell() {
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState(null);

  // Badge stays as it was on failure; session problems are handled by the API client.
  const load = useCallback(
    () =>
      api
        .get('/notifications', { limit: 12 })
        .then((res) => {
          setItems(res.data);
          setUnread(res.meta.unread);
        })
        .catch(() => {}),
    [],
  );

  useEffect(() => {
    const first = setTimeout(load, 0);
    const id = setInterval(load, POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [load]);

  const open = async (n, close) => {
    close();
    if (!n.readAt) {
      setItems((list) => list.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)));
      setUnread((u) => Math.max(0, u - 1));
      api.patch(`/notifications/${n.id}/read`).catch(() => {});
    }
    if (n.link) navigate(n.link);
  };

  const markAll = async () => {
    await api.post('/notifications/read-all');
    setUnread(0);
    setItems((list) => list?.map((x) => ({ ...x, readAt: x.readAt ?? new Date().toISOString() })));
  };

  return (
    <Dropdown
      panelClassName="notifications"
      trigger={({ toggle, open: isOpen }) => (
        <button
          type="button"
          className="icon-btn"
          onClick={() => {
            if (!isOpen) load();
            toggle();
          }}
          aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
          aria-expanded={isOpen}
        >
          <Bell />
          {unread > 0 && <span className="icon-btn__badge">{unread > 99 ? '99+' : unread}</span>}
        </button>
      )}
    >
      {({ close }) => (
        <>
          <div className="dropdown__header">
            Notifications
            {unread > 0 && (
              <button type="button" className="link-btn" onClick={markAll}>
                Mark all as read
              </button>
            )}
          </div>
          {!items && (
            <div className="page-loader" style={{ minHeight: 120 }}>
              <Spinner />
            </div>
          )}
          {items?.length === 0 && <EmptyState icon={Bell} title="You're all caught up" />}
          {items?.map((n) => (
            <button
              key={n.id}
              type="button"
              className={`notification ${n.readAt ? 'notification--read' : ''}`}
              onClick={() => open(n, close)}
            >
              <span className="notification__dot" />
              <span>
                <span className="notification__title" style={{ display: 'block' }}>
                  {n.title}
                </span>
                {n.body && (
                  <span className="notification__meta" style={{ display: 'block' }}>
                    {n.body}
                  </span>
                )}
                <span className="notification__meta">{timeAgo(n.createdAt)}</span>
              </span>
            </button>
          ))}
        </>
      )}
    </Dropdown>
  );
}
