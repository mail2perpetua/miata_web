import { useState } from 'react';
import { History, Mail, ShieldCheck, Wallet } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import {
  Alert,
  AsyncContent,
  Button,
  Card,
  DataTable,
  EmptyState,
  PageHeader,
  Pagination,
  SearchInput,
  Tabs,
  TextArea,
  TextField,
  useToast,
} from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { api } from '@/services/api';
import { activityVisual } from '@/utils/activity';
import { formatDateTime } from '@/utils/format';

function Toggle({ label, hint, checked, onChange, disabled }) {
  return (
    <div className="toggle-row">
      <div>
        <div className="toggle-row__label">{label}</div>
        {hint && <div className="toggle-row__hint">{hint}</div>}
      </div>
      <label className="switch">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} aria-label={label} />
        <span />
      </label>
    </div>
  );
}

function CompletionPolicyForm({ initial, onSaved }) {
  const toast = useToast();
  const [policy, setPolicy] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const set = (key) => (value) => setPolicy((p) => ({ ...p, [key]: value }));
  const resetRequired = policy.passwordResetOnCompletion !== 'none';

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await api.put('/admin/settings/completion-policy', {
        ...policy,
        videoWatchThreshold: Number(policy.videoWatchThreshold),
      });
      onSaved(res.data.completionPolicy);
      toast.success('Completion policy saved');
    } catch (err) {
      setError(err.details?.requireAllVideos || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="settings-section">
        <h3 style={{ fontSize: 'var(--fs-md)' }}>Completion requirements</h3>
        <p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
          A course is completed automatically by the system — never by a button — once every enabled requirement is met. Only published
          items marked “required” count.
        </p>
        <Toggle
          label="Watch all required videos"
          hint="Watch time is measured on the server from real playback; skipping ahead does not count."
          checked={policy.requireAllVideos}
          onChange={set('requireAllVideos')}
        />
        <Toggle
          label="Complete all required assignments"
          hint="The latest submission must be marked Completed by a professor."
          checked={policy.requireAllAssignments}
          onChange={set('requireAllAssignments')}
        />
        <div className="toggle-row">
          <div>
            <div className="toggle-row__label">Video watch threshold</div>
            <div className="toggle-row__hint">Share of a video's length that must be watched (50–100%).</div>
          </div>
          <div className="row" style={{ gap: 6 }}>
            <input
              type="number"
              className="input"
              style={{ width: 90 }}
              min={50}
              max={100}
              value={policy.videoWatchThreshold}
              onChange={(e) => set('videoWatchThreshold')(e.target.value)}
              aria-label="Video watch threshold percent"
            />
            %
          </div>
        </div>
      </div>
      <div className="settings-section">
        <h3 style={{ fontSize: 'var(--fs-md)' }}>When a student completes a course</h3>
        <div className="toggle-row">
          <div>
            <div className="toggle-row__label">Password reset</div>
            <div className="toggle-row__hint">Reset links are single-use and expire after 30 minutes. Passwords are never emailed.</div>
          </div>
          <select
            className="select select--inline"
            value={policy.passwordResetOnCompletion}
            onChange={(e) => set('passwordResetOnCompletion')(e.target.value)}
            aria-label="Password reset policy"
          >
            <option value="next_login">Required at next sign-in</option>
            <option value="email_link">Required — also email a reset link</option>
            <option value="none">Not required</option>
          </select>
        </div>
        <Toggle
          label="Sign the student out"
          hint={
            resetRequired
              ? 'Always on while a password reset is required — the session ends so the reset cannot be bypassed.'
              : 'End every active session of the student immediately.'
          }
          checked={resetRequired || policy.logoutOnCompletion}
          disabled={resetRequired}
          onChange={set('logoutOnCompletion')}
        />
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      <div className="form-actions" style={{ marginTop: 16 }}>
        <Button loading={saving} onClick={save}>
          Save policy
        </Button>
      </div>
    </>
  );
}

/** Currency of every fee and payment, and the transfer details students see on their Fees page. */
function FeeSettingsForm({ initial, onSaved }) {
  const toast = useToast();
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    setErrors({});
    try {
      const res = await api.put('/admin/settings/fees', values);
      onSaved(res.data.fees);
      setValues(res.data.fees);
      toast.success('Fee settings saved');
    } catch (err) {
      setErrors(err.details && Object.keys(err.details).length ? err.details : { form: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="stack" style={{ gap: 14 }}>
      <TextField
        label="Currency"
        value={values.currency}
        onChange={(e) => setValues((v) => ({ ...v, currency: e.target.value.toUpperCase() }))}
        maxLength={3}
        hint="3-letter code used for every fee and payment, e.g. AUD, INR, USD."
        error={errors.currency}
      />
      <TextArea
        label="Payment instructions for students"
        rows={5}
        value={values.paymentInstructions}
        onChange={(e) => setValues((v) => ({ ...v, paymentInstructions: e.target.value }))}
        maxLength={2000}
        hint="Shown on the student's Fees page: bank or UPI details and what to use as the payment reference."
        error={errors.paymentInstructions}
      />
      {errors.form && <Alert tone="error">{errors.form}</Alert>}
      <div className="form-actions">
        <Button loading={saving} onClick={save}>
          Save fee settings
        </Button>
      </div>
    </div>
  );
}

function ActivityLog() {
  const [query, setQuery] = useState({ page: 1, pageSize: 20 });
  const state = useFetch('/admin/activity', query);
  return (
    <Card flush>
      <div className="toolbar">
        <SearchInput
          value={query.search}
          onSearch={(search) => setQuery((q) => ({ ...q, search, page: 1 }))}
          placeholder="Search activity or person"
        />
        <select
          className="select select--inline"
          value={query.action ?? ''}
          onChange={(e) => setQuery((q) => ({ ...q, action: e.target.value || undefined, page: 1 }))}
          aria-label="Activity type"
        >
          <option value="">All activity</option>
          <option value="auth.">Sign-ins & passwords</option>
          <option value="course.">Courses</option>
          <option value="enrolment.">Enrolments</option>
          <option value="submission.">Submissions & reviews</option>
          <option value="referral.">Referrals</option>
          <option value="video.">Videos</option>
          <option value="enquiry.">Enquiries</option>
          <option value="payment.">Fee payments</option>
          <option value="settings.">Settings</option>
        </select>
      </div>
      <DataTable
        rows={state.data}
        loading={state.loading}
        columns={[
          {
            key: 'description',
            header: 'Activity',
            render: (a) => {
              const { icon: Icon, tone } = activityVisual(a.action);
              return (
                <span className="row">
                  <span className={`timeline-icon tone-${tone}`} style={{ width: 32, height: 32 }}>
                    <Icon aria-hidden="true" />
                  </span>
                  <span>
                    {a.description}
                    <span className="cell-person__sub" style={{ display: 'block' }}>
                      {a.action}
                    </span>
                  </span>
                </span>
              );
            },
          },
          { key: 'actor', header: 'By', render: (a) => (a.actorName ? `${a.actorName} (${a.actorRole})` : 'System') },
          { key: 'ip', header: 'IP', render: (a) => a.ipAddress || '—' },
          { key: 'createdAt', header: 'When', render: (a) => <span className="nowrap">{formatDateTime(a.createdAt)}</span> },
        ]}
        empty={<EmptyState icon={History} title="No activity recorded" />}
      />
      <Pagination meta={state.meta} onPage={(page) => setQuery((q) => ({ ...q, page }))} noun="entries" />
    </Card>
  );
}

export default function SettingsPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'completion';
  const state = useFetch('/admin/settings');

  return (
    <>
      <PageHeader title="Settings" subtitle="Course completion policy, fees and payments, email status and the audit trail." />
      <Tabs
        value={tab}
        onChange={(value) => setParams({ tab: value }, { replace: true })}
        tabs={[
          { value: 'completion', label: 'Completion policy' },
          { value: 'activity', label: 'Activity log' },
        ]}
      />
      {tab === 'activity' ? (
        <ActivityLog />
      ) : (
        <AsyncContent state={state}>
          {(settings) => (
            <div className="split">
              <Card title="Course completion policy" icon={ShieldCheck}>
                <CompletionPolicyForm
                  initial={settings.completionPolicy}
                  onSaved={(completionPolicy) => state.setData((s) => ({ ...s, completionPolicy }))}
                />
              </Card>
              <div className="stack">
                <Card title="Fees & payments" icon={Wallet}>
                  <FeeSettingsForm initial={settings.fees} onSaved={(fees) => state.setData((s) => ({ ...s, fees }))} />
                </Card>
                <Card title="Email notifications" icon={Mail}>
                  {settings.email.configured ? (
                    <Alert tone="success">
                      SMTP is configured. Enquiry notifications go to {settings.email.enquiryRecipients} recipient(s).
                    </Alert>
                  ) : (
                    <Alert tone="warning">
                      SMTP is not configured, so no emails are sent (enquiries are still stored and marked “Email not sent”). Set the SMTP_*
                      and ENQUIRY_NOTIFY_EMAIL values in miata-api/.env and restart the API.
                    </Alert>
                  )}
                  {settings.email.configured && settings.email.enquiryRecipients === 0 && (
                    <div style={{ marginTop: 10 }}>
                      <Alert tone="warning">ENQUIRY_NOTIFY_EMAIL is empty — nobody receives new-enquiry emails.</Alert>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}
        </AsyncContent>
      )}
    </>
  );
}
