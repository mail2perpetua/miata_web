import { KeyRound, UserRound } from 'lucide-react';
import { Alert, AsyncContent, Avatar, Button, Card, InfoList, PageHeader, TextArea, TextField, useToast } from '@/components';
import { useAuth } from '@/features/auth/AuthContext';
import { PASSWORD_HINT, PasswordField } from '@/features/auth/PasswordField';
import { useFetch } from '@/hooks/useFetch';
import { useForm } from '@/hooks/useForm';
import { api } from '@/services/api';
import { ROLE_LABEL } from '@/routes/navigation';
import { formatDate, formatDateTime } from '@/utils/format';
import * as v from '@/utils/validation';
import { ReferralLinkCard } from './ReferralLinkCard';

// Fields each role may edit about themselves (the API enforces the same list).
const ROLE_FIELDS = {
  admin: [],
  student: [
    ['dateOfBirth', 'Date of birth', 'date'],
    ['qualification', 'Qualification'],
    ['address', 'Address', 'textarea'],
    ['city', 'City'],
    ['country', 'Country'],
  ],
  professor: [
    ['specialization', 'Specialization'],
    ['qualification', 'Qualification'],
    ['bio', 'Short bio', 'textarea'],
  ],
  agent: [
    ['organization', 'Organization'],
    ['city', 'City'],
    ['country', 'Country'],
  ],
};

const CODE_LABEL = { student: 'Student ID', professor: 'Employee ID', agent: 'Referral code' };

function ProfileForm({ profile, onSaved }) {
  const toast = useToast();
  const fields = ROLE_FIELDS[profile.role];
  const form = useForm({
    fullName: profile.fullName,
    phone: profile.phone ?? '',
    ...Object.fromEntries(fields.map(([key]) => [key, profile.profile?.[key] ?? ''])),
  });

  const onSubmit = form.submit(
    async (values) => {
      const payload = { fullName: values.fullName.trim(), phone: values.phone.trim() || null };
      for (const [key] of fields) payload[key] = values[key] === '' ? null : values[key];
      const res = await api.patch('/profile', payload);
      onSaved(res.data);
      toast.success('Profile updated');
    },
    (values) => ({ fullName: v.required(values.fullName, 'Full name'), phone: v.phone(values.phone) }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="stack" style={{ gap: 16 }}>
      {form.formError && <Alert tone="error">{form.formError}</Alert>}
      <div className="form-grid">
        <TextField label="Full name" value={form.values.fullName} onChange={form.set('fullName')} error={form.errors.fullName} required />
        <TextField label="Phone" type="tel" value={form.values.phone} onChange={form.set('phone')} error={form.errors.phone} />
        <TextField label="Email" value={profile.email} disabled hint="Contact an administrator to change your email." />
        {fields.map(([key, label, type]) =>
          type === 'textarea' ? (
            <TextArea
              key={key}
              className="span-2"
              label={label}
              value={form.values[key]}
              onChange={form.set(key)}
              error={form.errors[key]}
              rows={3}
            />
          ) : (
            <TextField
              key={key}
              label={label}
              type={type ?? 'text'}
              value={form.values[key]}
              onChange={form.set(key)}
              error={form.errors[key]}
            />
          ),
        )}
      </div>
      <div className="form-actions">
        <Button type="submit" loading={form.submitting}>
          Save changes
        </Button>
      </div>
    </form>
  );
}

function PasswordForm() {
  const toast = useToast();
  const { startSession } = useAuth();
  const form = useForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const onSubmit = form.submit(
    async (values) => {
      const res = await api.post('/profile/password', { currentPassword: values.currentPassword, newPassword: values.newPassword });
      startSession(res.data); // other devices are signed out; this one gets a fresh session
      form.setValues({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed. Other devices have been signed out.');
    },
    (values) => ({
      currentPassword: v.required(values.currentPassword, 'Current password'),
      newPassword: v.password(values.newPassword),
      confirmPassword: v.matches(values.confirmPassword, values.newPassword),
    }),
  );
  return (
    <form onSubmit={onSubmit} noValidate className="stack" style={{ gap: 14 }}>
      {form.formError && <Alert tone="error">{form.formError}</Alert>}
      <PasswordField
        label="Current password"
        value={form.values.currentPassword}
        onChange={form.set('currentPassword')}
        error={form.errors.currentPassword}
      />
      <PasswordField
        label="New password"
        autoComplete="new-password"
        value={form.values.newPassword}
        onChange={form.set('newPassword')}
        error={form.errors.newPassword}
        hint={PASSWORD_HINT}
      />
      <PasswordField
        label="Confirm new password"
        autoComplete="new-password"
        value={form.values.confirmPassword}
        onChange={form.set('confirmPassword')}
        error={form.errors.confirmPassword}
      />
      <div className="form-actions">
        <Button type="submit" variant="navy" loading={form.submitting}>
          Change password
        </Button>
      </div>
    </form>
  );
}

export default function ProfilePage() {
  const state = useFetch('/profile');
  const { updateUser } = useAuth();

  return (
    <>
      <PageHeader title="My Profile" subtitle="View and update your personal details." />
      <AsyncContent state={state}>
        {(profile) => {
          const p = profile.profile ?? {};
          const code = p.studentCode ?? p.employeeCode ?? p.referralCode;
          return (
            <div className="grid grid--main-side">
              <div className="stack">
                <Card title="Profile details" icon={UserRound}>
                  <ProfileForm
                    profile={profile}
                    onSaved={(updated) => {
                      state.setData(updated);
                      updateUser(updated);
                    }}
                  />
                </Card>
                <Card title="Change password" icon={KeyRound} subtitle="Changing your password signs you out on every other device.">
                  <PasswordForm />
                </Card>
              </div>
              <div className="stack">
                <Card>
                  <div className="profile-summary">
                    <Avatar name={profile.fullName} size="xl" />
                    <div>
                      <h2 style={{ fontSize: 'var(--fs-lg)' }}>{profile.fullName}</h2>
                      <p className="muted">{ROLE_LABEL[profile.role]}</p>
                    </div>
                  </div>
                  <InfoList
                    items={[
                      ['Email', profile.email],
                      ...(CODE_LABEL[profile.role] ? [[CODE_LABEL[profile.role], code]] : []),
                      ...(profile.role === 'professor' ? [['Department', p.department]] : []),
                      ...(profile.role === 'student'
                        ? [['Batch', profile.batch ? `${profile.batch.name} (${profile.batch.code})` : 'Not assigned yet']]
                        : []),
                      ['Member since', formatDate(profile.createdAt)],
                      ['Last sign-in', formatDateTime(profile.lastLoginAt)],
                    ]}
                  />
                </Card>
                {profile.role === 'agent' && <ReferralLinkCard code={p.referralCode} link={p.referralLink} />}
              </div>
            </div>
          );
        }}
      </AsyncContent>
    </>
  );
}
