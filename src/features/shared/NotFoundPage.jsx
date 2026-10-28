import { Compass } from 'lucide-react';
import { ROLE_HOME, useAuth } from '@/features/auth/AuthContext';
import { Button, EmptyState } from '@/components';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function NotFoundPage() {
  useDocumentTitle('Page not found');
  const { user } = useAuth();
  return (
    <div className="card" style={{ maxWidth: 560, margin: '40px auto' }}>
      <EmptyState
        icon={Compass}
        title="Page not found"
        message="The page you are looking for does not exist or you do not have access to it."
        action={<Button to={ROLE_HOME[user.role]}>Go to my dashboard</Button>}
      />
    </div>
  );
}
