import { useState } from 'react';
import { KeyRound, MailCheck, Pencil, Power } from 'lucide-react';
import { Button, FormModal, useConfirm, useToast } from '@/components';
import { useApiAction } from '@/hooks/useApiAction';
import { api } from '@/services/api';
import { PersonFormModal } from './PersonFormModal';

/** Header actions on a person's page: edit, e-mail a set-password link, set temporary password, activate / deactivate. */
export function AccountActions({ role, person, onChange, extra }) {
  const confirm = useConfirm();
  const toast = useToast();
  const { run, busy } = useApiAction();
  const [editing, setEditing] = useState(false);
  const [resetting, setResetting] = useState(false);

  const toggle = async () => {
    const activating = !person.isActive;
    const ok = await confirm({
      title: activating ? `Activate ${person.fullName}?` : `Deactivate ${person.fullName}?`,
      message: activating
        ? 'They will be able to sign in again.'
        : 'They are signed out immediately and cannot sign in until reactivated. Their records are kept.',
      confirmLabel: activating ? 'Activate' : 'Deactivate',
      danger: !activating,
    });
    if (ok) {
      await run(() => api.patch(`/admin/${role}s/${person.id}/status`, { isActive: activating }), {
        success: activating ? 'Account activated' : 'Account deactivated',
        onDone: onChange,
        key: 'status',
      });
    }
  };

  const sendSetupEmail = async () => {
    const ok = await confirm({
      title: `E-mail ${person.fullName} a set-password link?`,
      message: `A new single-use link to set their password is sent to ${person.email}. Any earlier link stops working.`,
      confirmLabel: 'Send e-mail',
    });
    if (!ok) return;
    const res = await run(() => api.post(`/admin/${role}s/${person.id}/setup-email`), { key: 'setup' });
    const result = res?.data;
    if (result?.status === 'sent') toast.success(`Set-password e-mail sent to ${result.recipient}`);
    else if (result?.status === 'failed') toast.error(`The e-mail could not be sent: ${result.error}`);
    else if (result) toast.error('E-mail is not set up on the server (SMTP). Set a temporary password instead.');
  };

  return (
    <>
      {extra}
      <Button variant="secondary" icon={Pencil} onClick={() => setEditing(true)}>
        Edit
      </Button>
      {person.isActive && (
        <Button variant="secondary" icon={MailCheck} loading={busy === 'setup'} onClick={sendSetupEmail}>
          Send set-password e-mail
        </Button>
      )}
      <Button variant="secondary" icon={KeyRound} onClick={() => setResetting(true)}>
        Temporary password
      </Button>
      <Button variant={person.isActive ? 'danger' : 'primary'} icon={Power} loading={busy === 'status'} onClick={toggle}>
        {person.isActive ? 'Deactivate' : 'Activate'}
      </Button>

      <PersonFormModal open={editing} role={role} person={person} onClose={() => setEditing(false)} onSaved={onChange} />
      <FormModal
        open={resetting}
        title="Set a temporary password"
        size="md"
        submitLabel="Set password"
        fields={[
          {
            name: 'temporaryPassword',
            label: 'Temporary password',
            type: 'password',
            required: true,
            span: true,
            hint: 'They are signed out everywhere and must choose a new password at next sign-in.',
          },
        ]}
        initialValues={{ temporaryPassword: '' }}
        onSubmit={async (values) => {
          await api.post(`/admin/${role}s/${person.id}/temporary-password`, values);
          toast.success('Temporary password set');
        }}
        onClose={() => setResetting(false)}
      />
    </>
  );
}
