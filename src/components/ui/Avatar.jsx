import { initials } from '@/utils/format';

// Deterministic colour per name, so the same person always gets the same avatar.
const COLORS = ['#1d519b', '#0f766e', '#7c3aed', '#b45309', '#be185d', '#0369a1', '#4d7c0f', '#c2410c'];

function colorFor(name = '') {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return COLORS[hash % COLORS.length];
}

export function Avatar({ name, size = 'md' }) {
  return (
    <span className={`avatar avatar--${size}`} style={{ background: colorFor(name) }} aria-hidden="true">
      {initials(name) || '?'}
    </span>
  );
}

/** Avatar + name + secondary line, used in table cells. */
export function PersonCell({ name, sub, size = 'sm' }) {
  return (
    <span className="cell-person">
      <Avatar name={name} size={size} />
      <span>
        <span className="cell-person__name" style={{ display: 'block' }}>
          {name}
        </span>
        {sub && <span className="cell-person__sub">{sub}</span>}
      </span>
    </span>
  );
}
