import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Button, Card, PageHeader } from '@/components';
import { useListQuery } from '@/hooks/useListQuery';
import { ApplyNowModal } from './ApplyNowModal';
import { ReferredStudentsList } from './ReferredStudentsList';

export default function ReferredStudentsPage() {
  const list = useListQuery({ sort: 'registered_at' });
  const [applying, setApplying] = useState(false);
  const [version, setVersion] = useState(0);
  return (
    <>
      <PageHeader
        title="My Referred Students"
        subtitle="Students who registered through your referral link or whom you registered with Apply Now — their course and current status."
        actions={
          <Button icon={UserPlus} onClick={() => setApplying(true)}>
            Apply Now
          </Button>
        }
      />
      <Card flush>
        <ReferredStudentsList {...list} version={version} />
      </Card>
      <ApplyNowModal open={applying} onClose={() => setApplying(false)} onApplied={() => setVersion((v) => v + 1)} />
    </>
  );
}
