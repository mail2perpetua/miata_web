import { ChevronDown, LogOut, Settings, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar, Dropdown } from '@/components';
import { ROLE_LABEL } from '@/routes/navigation';
import { ROLE_HOME } from '@/features/auth/AuthContext';

export function UserMenu({ user, onLogout }) {
  const home = ROLE_HOME[user.role];
  return (
    <Dropdown
      trigger={({ toggle, open }) => (
        <button type="button" className="user-menu__trigger" onClick={toggle} aria-expanded={open} aria-haspopup="menu">
          <Avatar name={user.fullName} size="lg" />
          <span className="user-menu__text">
            <span className="user-menu__name" style={{ display: 'block' }}>
              {user.role === 'admin' ? 'Admin' : user.fullName}
            </span>
            {user.role !== 'admin' && <span className="user-menu__role">{ROLE_LABEL[user.role]}</span>}
          </span>
          <ChevronDown size={18} aria-hidden="true" />
        </button>
      )}
    >
      {({ close }) => (
        <div role="menu">
          <div className="dropdown__header" style={{ display: 'block' }}>
            {user.fullName}
            <div className="muted" style={{ fontWeight: 400, fontSize: 'var(--fs-xs)' }}>
              {user.email}
            </div>
          </div>
          <Link to={`${home}/profile`} className="dropdown__item" role="menuitem" onClick={close}>
            <User /> My profile
          </Link>
          {user.role === 'admin' && (
            <Link to="/admin/settings" className="dropdown__item" role="menuitem" onClick={close}>
              <Settings /> Settings
            </Link>
          )}
          <button type="button" className="dropdown__item" role="menuitem" onClick={onLogout}>
            <LogOut /> Logout
          </button>
        </div>
      )}
    </Dropdown>
  );
}
