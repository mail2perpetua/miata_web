import { useState } from 'react';
import { Checkbox, FormModal, Spinner, useToast } from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { api } from '@/services/api';
import { fromLocalInput, toLocalInput } from '@/utils/format';
import { classLength, durationLabel, linkPlatform, meetingLink } from '@/features/shared/meetings';

// The API's limits on a class's length.
const MIN_MINUTES = 15;
const MAX_MINUTES = 480;
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** Why the end time cannot be used (undefined when it can). An end "before" the start that is too long is a mistake. */
function endTimeError(length) {
  if (!length) return undefined;
  if (length.minutes > MAX_MINUTES) return length.nextDay ? 'Choose an end time after the start time' : 'A class can last at most 8 hours';
  if (length.minutes < MIN_MINUTES) return 'A class must last at least 15 minutes';
  return undefined;
}

/** The Duration field: calculated from the start and end times. */
function durationText({ time, endTime }) {
  const length = classLength(time, endTime);
  if (!length || (length.nextDay && length.minutes > MAX_MINUTES)) return '';
  return `${durationLabel(length.minutes)}${length.nextDay ? ' (ends the next day)' : ''}`;
}

/** What the save told students, for the confirmation toast. */
function savedMessage(meeting, creating) {
  const { scheduled = 0, updated = 0, cancelled = 0 } = meeting.notified ?? {};
  if (creating) {
    return scheduled
      ? `Class scheduled. Invitations are being e-mailed to ${plural(scheduled, 'student')}.`
      : 'Class scheduled. No students are in its audience yet.';
  }
  const parts = [
    updated && `${plural(updated, 'student')} told about the changes`,
    scheduled && `${plural(scheduled, 'student')} newly invited`,
    cancelled && `${plural(cancelled, 'student')} told it is no longer scheduled for them`,
  ].filter(Boolean);
  return parts.length ? `Class updated: ${parts.join(', ')}.` : 'Class updated.';
}

/** The batch's students as checkboxes, bound to form.values.studentIds. */
function StudentPicker({ batchId, value, onChange, error }) {
  const students = useFetch(`/professor/meetings/batches/${batchId}/students`);
  const selected = Array.isArray(value) ? value : [];
  const toggle = (id) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  const all = students.data ?? [];
  return (
    <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
      <legend className="field__label" style={{ marginBottom: 8, display: 'flex', gap: 12, width: '100%' }}>
        <span>
          Students ({selected.length} of {all.length} selected) <span className="req">*</span>
        </span>
        {all.length > 0 && (
          <button
            type="button"
            className="link-btn"
            style={{ marginLeft: 'auto' }}
            onClick={() => onChange(selected.length === all.length ? [] : all.map((s) => s.id))}
          >
            {selected.length === all.length ? 'Clear all' : 'Select all'}
          </button>
        )}
      </legend>
      {students.loading && !students.data ? (
        <Spinner />
      ) : all.length ? (
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {all.map((s) => (
            <Checkbox
              key={s.id}
              checked={selected.includes(s.id)}
              onChange={() => toggle(s.id)}
              label={`${s.fullName}${s.studentCode ? ` (${s.studentCode})` : ''}`}
            />
          ))}
        </div>
      ) : (
        <p className="muted">This batch has no active students yet.</p>
      )}
      {error && (
        <span className="field__error" role="alert">
          {error}
        </span>
      )}
    </fieldset>
  );
}

/**
 * Schedule or edit an online class for one of the professor's batches. Students in the audience are e-mailed the
 * details (and told again about changes) by the API.
 */
export function MeetingFormModal({ open, meeting, onClose, onSaved }) {
  const toast = useToast();
  const creating = !meeting;
  const batches = useFetch(open ? '/professor/batches' : null);
  const [current, setCurrent] = useState({});
  const [date, time] = toLocalInput(meeting?.startsAt).split('T');
  const endTime = toLocalInput(meeting?.endsAt).split('T')[1];

  const fields = [
    { name: 'title', label: 'Meeting title', required: true, span: true, placeholder: 'e.g. Abdominal scanning — live Q&A' },
    {
      name: 'batchId',
      label: 'Batch',
      type: 'select',
      required: true,
      resets: ['studentIds'],
      options: (batches.data ?? []).map((b) => ({
        value: b.id,
        label: `${b.name} (${b.code})${b.isActive ? '' : ' — inactive'}`,
        disabled: !b.isActive,
      })),
    },
    {
      name: 'audience',
      label: 'Share with',
      type: 'select',
      required: true,
      options: [
        { value: 'batch', label: 'Whole batch' },
        { value: 'selected', label: 'Selected students of the batch' },
      ],
    },
    { name: 'date', label: 'Date', type: 'date', required: true },
    { name: 'time', label: 'Start time', type: 'time', required: true },
    { name: 'endTime', label: 'End time', type: 'time', required: true },
    { name: 'duration', label: 'Duration', required: true, compute: durationText, placeholder: 'Calculated from the start and end times' },
    {
      name: 'meetingUrl',
      label: 'Google Meet, Zoom or Teams link',
      required: true,
      span: true,
      placeholder: 'https://meet.google.com/abc-defg-hij',
      hint: 'Paste the meeting link from Google Meet (meet.google.com/…), Zoom (zoom.us/j/…) or Microsoft Teams (teams.microsoft.com/… or teams.live.com/…).',
    },
    { name: 'description', label: 'Description (optional)', type: 'textarea', span: true, rows: 3 },
  ];

  const close = () => {
    setCurrent({});
    onClose();
  };

  return (
    <FormModal
      open={open}
      title={creating ? 'Schedule an online class' : 'Edit online class'}
      submitLabel={creating ? 'Schedule and notify' : 'Save and notify'}
      fields={fields}
      initialValues={{
        title: meeting?.title ?? '',
        batchId: meeting?.batchId ? String(meeting.batchId) : '',
        audience: meeting?.audience ?? 'batch',
        date: date ?? '',
        time: time ?? '',
        endTime: endTime ?? '',
        meetingUrl: meeting?.meetingUrl ?? '',
        description: meeting?.description ?? '',
        studentIds: meeting?.participantIds ?? [],
      }}
      validate={(values) => {
        const startsAt = values.date && values.time ? new Date(`${values.date}T${values.time}`) : null;
        const timeChanged = !meeting || startsAt?.getTime() !== new Date(meeting.startsAt).getTime();
        return {
          meetingUrl:
            values.meetingUrl && !linkPlatform(values.meetingUrl) ? 'Use a Google Meet, Zoom or Microsoft Teams meeting link' : undefined,
          time: startsAt && timeChanged && startsAt <= new Date() ? 'Choose a time in the future' : undefined,
          endTime: endTimeError(classLength(values.time, values.endTime)),
          studentIds:
            values.audience === 'selected' && !(Array.isArray(values.studentIds) && values.studentIds.length)
              ? 'Select at least one student'
              : undefined,
        };
      }}
      onSubmit={async (values) => {
        const body = {
          batchId: Number(values.batchId),
          title: values.title,
          audience: values.audience,
          studentIds: values.audience === 'selected' ? values.studentIds : [],
          startsAt: fromLocalInput(`${values.date}T${values.time}`),
          durationMinutes: classLength(values.time, values.endTime).minutes,
          meetingUrl: meetingLink(values.meetingUrl),
          description: values.description || null,
        };
        try {
          const res = creating ? await api.post('/professor/meetings', body) : await api.put(`/professor/meetings/${meeting.id}`, body);
          if (res.data.unchanged) toast.info('No changes to save — nobody was notified.');
          else toast.success(savedMessage(res.data, creating));
          return res.data;
        } catch (err) {
          // The API reports the start and the length as fields of their own; the form shows them under the times.
          if (err.details?.startsAt) err.details.time = err.details.startsAt;
          if (err.details?.durationMinutes) err.details.endTime = err.details.durationMinutes;
          throw err;
        }
      }}
      onSuccess={onSaved}
      onClose={close}
      onValuesChange={(values) =>
        (values.batchId !== current.batchId || values.audience !== current.audience) &&
        setCurrent({ batchId: values.batchId, audience: values.audience })
      }
    >
      {(form) =>
        current.audience === 'selected' &&
        current.batchId && (
          <StudentPicker
            key={current.batchId}
            batchId={current.batchId}
            value={form.values.studentIds}
            onChange={form.set('studentIds')}
            error={form.errors.studentIds}
          />
        )
      }
    </FormModal>
  );
}
