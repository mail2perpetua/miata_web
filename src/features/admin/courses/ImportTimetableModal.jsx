import { useState } from 'react';
import { Alert, Button, InfoList, Modal, SelectField, TextField, useToast } from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { api } from '@/services/api';
import { dateRange, durationLabel } from '@/utils/format';

const NEW_COURSE = 'new';
const normalise = (text) =>
  text
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

const LECTURER_STATUS = {
  linked: (p) => `linked to ${p.name}`,
  already_linked: (p) => `already linked to ${p.name}`,
  ambiguous: (p) => `not linked: ${p.candidates.length} professor accounts have this name (${p.candidates.map((c) => c.name).join(', ')})`,
  unmatched: () => 'no professor account with this name — kept by name',
};

/** "96 sessions, 212 topics and 15 modules added" from an import summary. */
function importMessage(s) {
  const added = [
    [s.sessions.created, 'session'],
    [s.topics.created, 'topic'],
    [s.modules.filter((m) => m.action === 'created').length, 'module'],
    [s.lecturers.filter((l) => l.action === 'created').length, 'lecturer'],
  ].filter(([n]) => n > 0);
  if (!added.length) return 'Already up to date — nothing was added.';
  const text = added.map(([n, w]) => plural(n, w));
  return `Timetable imported: ${text.slice(0, -1).join(', ')}${text.length > 1 ? ' and ' : ''}${text.at(-1)} added.`;
}

function Preview({ summary, existingCourse, moduleMap, setModuleMap }) {
  const created = summary.modules.filter((m) => m.action === 'created').length;
  const reused = summary.modules.length - created;
  return (
    <div className="stack" style={{ gap: 14 }}>
      <Alert>Preview — nothing has been saved yet. Check the matches, then import.</Alert>
      <InfoList
        items={[
          [
            'Course',
            summary.course.action === 'created'
              ? 'New course'
              : `Existing course${summary.course.fieldsFilled ? ' (empty timetable details filled in)' : ''}`,
          ],
          ['Modules', `${plural(created, 'new module')} · ${reused} matched`],
          ['Topics', `${summary.topics.created} new · ${summary.topics.unchanged} already there`],
          [
            'Sessions',
            `${summary.sessions.created} new · ${summary.sessions.unchanged} already there` +
              (summary.sessions.updated ? ` · ${summary.sessions.updated} given their lecturer` : '') +
              (summary.sessions.keptDifferent.length ? ` · ${summary.sessions.keptDifferent.length} kept as edited` : ''),
          ],
        ]}
      />

      <div>
        <strong style={{ fontSize: 'var(--fs-sm)' }}>Lecturers</strong>
        <ul className="tt-notes" style={{ marginTop: 6 }}>
          {summary.lecturers.map((l) => (
            <li key={l.key}>
              <strong>{l.name}</strong> —{' '}
              {l.action === 'created'
                ? 'new'
                : l.action === 'updated'
                  ? `matched${l.existingName ? ` to “${l.existingName}”` : ''}, details filled in`
                  : 'matched'}
              ; {LECTURER_STATUS[l.professor.status](l.professor)}
              {l.professor.professorId && !l.courseAllocated ? ' (not assigned to the course)' : ''}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <strong style={{ fontSize: 'var(--fs-sm)' }}>Modules</strong>
        <div className="stack" style={{ gap: 6, marginTop: 6 }}>
          {summary.modules.map((m, i) => (
            <div key={m.key} className="kv-row" style={{ alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 'var(--fs-sm)' }}>
                {i + 1}. {m.title}
                {m.excluded && <span className="muted"> · in the catalogue, not scheduled</span>}
              </span>
              {existingCourse && (m.action === 'mapped' || m.suggestions?.length) ? (
                <select
                  className="select select--inline"
                  aria-label={`Match for ${m.title}`}
                  value={moduleMap[m.key] ? String(moduleMap[m.key]) : ''}
                  onChange={(e) => setModuleMap((map) => ({ ...map, [m.key]: e.target.value ? Number(e.target.value) : null }))}
                >
                  <option value="">Create a new module</option>
                  {[...(m.action === 'mapped' ? [{ moduleId: m.moduleId, title: m.existingTitle }] : []), ...(m.suggestions ?? [])].map(
                    (s) => (
                      <option key={s.moduleId} value={s.moduleId}>
                        Use “{s.title}”
                      </option>
                    ),
                  )}
                </select>
              ) : (
                <span className="muted" style={{ fontSize: 'var(--fs-sm)', whiteSpace: 'nowrap' }}>
                  {m.action === 'created' ? 'new' : `matches “${m.existingTitle}”`}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {summary.sessions.keptDifferent.length > 0 && (
        <Alert tone="warning">
          Kept as edited (the timetable differs):{' '}
          {summary.sessions.keptDifferent.map((d) => `week ${d.week}, ${d.lecturer}: “${d.existingTitle}”`).join('; ')}.
        </Alert>
      )}
      <details>
        <summary style={{ cursor: 'pointer', fontSize: 'var(--fs-sm)', fontWeight: 600 }}>
          {plural(summary.review.length, 'session')} placed in a module by judgement — review
        </summary>
        <ul className="tt-notes" style={{ marginTop: 8 }}>
          {summary.review.map((r) => (
            <li key={`${r.lecturer}-${r.week}`}>
              Week {r.week}, {r.lecturer}: “{r.title}” → {r.module}. {r.note}.
            </li>
          ))}
        </ul>
      </details>
      <Alert tone="warning">
        Not in the documents, left for you to confirm: {summary.missing.join('; ')}. {summary.excludedModules.join(', ')} stays in the
        curriculum but is not scheduled (excluded from the revised timetable).
      </Alert>
    </div>
  );
}

/**
 * Import a built-in course timetable (curriculum modules and topics, lecturers, weekly sessions) into a new course or an
 * existing one (`courseId` fixes it). A preview (dry run) comes first: it shows what will be created and what is reused,
 * and lets the admin match curriculum modules to existing modules with different names.
 */
export function ImportTimetableModal({ open, courseId, onClose, onImported }) {
  const toast = useToast();
  const templates = useFetch(open ? '/admin/timetable-templates' : null);
  const courses = useFetch(open && !courseId ? '/admin/lookups/courses' : null);
  const [edits, setEdits] = useState(null); // the admin's choices; null = the defaults below
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(null);
  const [moduleMap, setModuleMap] = useState({});
  const [busy, setBusy] = useState(false);
  const template = templates.data?.[0];

  // Defaults once the lists load: the course with the template's heading, if there is one.
  const ready = template && (courseId || courses.data);
  const same = ready && !courseId ? courses.data.find((c) => normalise(c.title) === normalise(template.courseTitle)) : null;
  const values =
    edits ??
    (ready
      ? { template: template.key, courseId: courseId ? String(courseId) : same ? String(same.id) : NEW_COURSE, code: '', category: '' }
      : null);

  const close = () => {
    setEdits(null);
    setPreview(null);
    setModuleMap({});
    setErrors({});
    onClose();
  };

  const body = (map, dryRun) => {
    const creating = values.courseId === NEW_COURSE;
    return {
      courseId: creating ? null : Number(values.courseId),
      code: creating ? values.code.trim().toUpperCase() : null,
      category: creating ? values.category : null,
      dryRun,
      moduleMap: map,
    };
  };

  const runPreview = async (map, preselect = false) => {
    setBusy(true);
    setErrors({});
    try {
      const res = await api.post(`/admin/timetable-templates/${values.template}/import`, body(map, true));
      let summary = res.data.summary;
      // Preselect clearly similar existing modules (shown, and changeable, before anything is saved).
      if (preselect && values.courseId !== NEW_COURSE) {
        const suggested = Object.fromEntries(
          summary.modules
            .filter((m) => m.action === 'created' && m.suggestions?.[0]?.similarity >= 0.6)
            .map((m) => [m.key, m.suggestions[0].moduleId]),
        );
        if (Object.keys(suggested).length) {
          map = { ...map, ...suggested };
          summary = (await api.post(`/admin/timetable-templates/${values.template}/import`, body(map, true))).data.summary;
        }
      }
      setModuleMap(map);
      setPreview(summary);
    } catch (err) {
      setErrors(err.details ?? { form: err.message });
      if (!err.details) toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const changeMap = (updater) => {
    const map = typeof updater === 'function' ? updater(moduleMap) : updater;
    runPreview(map);
  };

  const importNow = async () => {
    setBusy(true);
    try {
      const res = await api.post(`/admin/timetable-templates/${values.template}/import`, body(moduleMap, false));
      toast.success(importMessage(res.data.summary));
      const course = res.data.course;
      close();
      onImported?.(course);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!open || !values) return null;
  const set = (key) => (e) => setEdits({ ...values, [key]: e.target.value });
  const creating = values.courseId === NEW_COURSE;

  return (
    <Modal
      open
      title="Import course timetable"
      size="lg"
      onClose={close}
      footer={
        preview ? (
          <>
            <Button variant="secondary" onClick={() => setPreview(null)} disabled={busy}>
              Back
            </Button>
            <Button onClick={importNow} loading={busy}>
              Import
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button
              loading={busy}
              onClick={() => {
                if (creating && !values.code.trim()) setErrors({ code: 'Enter a course code for the new course' });
                else runPreview({}, true);
              }}
            >
              Preview import
            </Button>
          </>
        )
      }
    >
      {preview ? (
        <Preview summary={preview} existingCourse={!creating} moduleMap={moduleMap} setModuleMap={changeMap} />
      ) : (
        <div className="stack" style={{ gap: 16 }}>
          <Alert>
            Adds the curriculum modules and topics, the lecturers and every weekly session to the course. Anything the course already has is
            matched and kept as it is, so importing again adds nothing twice. You will see a preview first.
          </Alert>
          <div className="form-grid">
            <SelectField
              label="Timetable"
              required
              className="span-2"
              value={values.template}
              onChange={set('template')}
              options={(templates.data ?? []).map((t) => ({ value: t.key, label: t.name }))}
            />
            {!courseId && (
              <SelectField
                label="Import into"
                required
                className="span-2"
                value={values.courseId}
                onChange={set('courseId')}
                error={errors.courseId}
                options={[
                  { value: NEW_COURSE, label: `A new course: ${template.courseTitle}` },
                  ...(courses.data ?? []).map((c) => ({ value: String(c.id), label: `${c.title} (${c.code})` })),
                ]}
              />
            )}
            {creating && (
              <>
                <TextField
                  label="Course code"
                  required
                  value={values.code}
                  onChange={set('code')}
                  error={errors.code}
                  hint="Not given in the documents."
                />
                <TextField label="Category" value={values.category} onChange={set('category')} placeholder="Not given in the documents" />
              </>
            )}
          </div>
          {errors.moduleMap && <Alert tone="error">{errors.moduleMap}</Alert>}
          <InfoList
            items={[
              ['Course heading', template.courseTitle],
              ['Academic year', template.academicYear],
              [
                'Dates',
                `${dateRange(template.startDate, template.endDate)} · ${durationLabel(template.durationValue, template.durationUnit)}`,
              ],
              ['Curriculum', `${template.moduleCount} modules · ${template.topicCount} topics`],
              ['Weekly sessions', `${template.sessionCount}, taught by ${template.lecturers.join(', ')}`],
            ]}
          />
        </div>
      )}
    </Modal>
  );
}
