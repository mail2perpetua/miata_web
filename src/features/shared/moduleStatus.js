import { Circle, CircleCheck, CircleDot } from 'lucide-react';
import { formatDate } from '@/utils/format';

/** How far the teaching of a module has got, as its professors set it (badge colours come from StatusBadge). */
export const MODULE_STATUSES = [
  { value: 'not_started', label: 'Not Started', hint: 'Teaching has not begun', icon: Circle },
  { value: 'in_progress', label: 'In Progress', hint: 'Sessions are under way', icon: CircleDot },
  { value: 'completed', label: 'Completed', hint: 'Everything has been taught', icon: CircleCheck },
];

export const moduleStatusLabel = (value) => MODULE_STATUSES.find((s) => s.value === value)?.label ?? value;

/** When a module's status was set and by whom, e.g. "Completed on 24 Oct 2026 by Dr. Niveditha". */
export function moduleStatusDetail(m) {
  const by = m.teachingUpdatedBy ? ` by ${m.teachingUpdatedBy}` : '';
  if (m.teachingStatus === 'completed') return `Completed on ${formatDate(m.teachingCompletedAt)}${by}`;
  if (m.teachingStatus === 'in_progress') {
    return `In progress since ${formatDate(m.teachingStartedAt)}${m.teachingUpdatedBy ? ` · last updated by ${m.teachingUpdatedBy}` : ''}`;
  }
  return m.teachingUpdatedAt ? `Set back to Not Started on ${formatDate(m.teachingUpdatedAt)}${by}` : 'Not started yet';
}
