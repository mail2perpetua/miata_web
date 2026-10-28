import {
  Activity,
  CalendarX,
  CircleCheck,
  CirclePlay,
  FileText,
  GraduationCap,
  Handshake,
  Layers,
  Mail,
  MessageSquare,
  RefreshCw,
  Settings,
  Stethoscope,
  UserPlus,
  Wallet,
} from 'lucide-react';

/** Icon + tint for an activity-log action (e.g. "course.created" → graduation cap, amber). */
export function activityVisual(action = '') {
  if (action === 'course.completed' || action.endsWith('.completed')) return { icon: CircleCheck, tone: 'green' };
  if (action.endsWith('.rework')) return { icon: RefreshCw, tone: 'orange' };
  if (action.endsWith('commented')) return { icon: MessageSquare, tone: 'blue' };
  if (action === 'student.access_expired') return { icon: CalendarX, tone: 'rose' };
  if (action === 'payment.rejected') return { icon: Wallet, tone: 'rose' };
  const prefix = action.split('.')[0];
  switch (prefix) {
    case 'course':
    case 'module':
    case 'lesson':
      return { icon: GraduationCap, tone: 'amber' };
    case 'video':
      return { icon: CirclePlay, tone: 'blue' };
    case 'batch':
      return { icon: Layers, tone: 'purple' };
    case 'assignment':
    case 'submission':
      return { icon: FileText, tone: 'blue' };
    case 'student':
    case 'enrolment':
      return { icon: UserPlus, tone: 'green' };
    case 'enquiry':
      return { icon: Mail, tone: 'rose' };
    case 'referral':
    case 'agent':
      return { icon: Handshake, tone: 'purple' };
    case 'professor':
      return { icon: Stethoscope, tone: 'green' };
    case 'payment':
      return { icon: Wallet, tone: 'green' };
    case 'settings':
      return { icon: Settings, tone: 'purple' };
    default:
      return { icon: Activity, tone: 'blue' };
  }
}
