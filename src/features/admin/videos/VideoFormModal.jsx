import { useState } from 'react';
import { Alert, FileDrop, FormModal, ProgressBar, useToast } from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { api, toFormData, upload } from '@/services/api';
import { CourseBatchChecklist } from '../shared/BatchAvailability';

const VIDEO_ACCEPT = '.mp4,.m4v,.webm,.ogv';
const MAX_VIDEO_BYTES = 1024 * 1024 * 1024;

/** Read a local video's duration from its metadata (the server re-reads MP4 durations itself). */
function readDuration(file) {
  return new Promise((resolve) => {
    const el = document.createElement('video');
    el.preload = 'metadata';
    const url = URL.createObjectURL(file);
    el.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(el.duration) ? Math.round(el.duration) : '');
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      resolve('');
    };
    el.src = url;
  });
}

/** Upload a new video (video = null) or edit an existing video's details. */
export function VideoFormModal({ open, video, defaultCourseId, onClose, onSaved }) {
  const toast = useToast();
  const courses = useFetch(open ? '/admin/lookups/courses' : null);
  const [courseId, setCourseId] = useState(null);
  const [moduleId, setModuleId] = useState(null);
  const selectedCourse = courseId ?? String(video?.courseId ?? defaultCourseId ?? '');
  const selectedModule = moduleId ?? String(video?.moduleId ?? '');
  const curriculum = useFetch(open && selectedCourse ? `/admin/lookups/courses/${selectedCourse}/curriculum` : null);
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(null);
  const [detected, setDetected] = useState('');

  const modules = curriculum.data ?? [];
  const lessons = modules.find((m) => String(m.id) === selectedModule)?.lessons ?? [];

  const close = () => {
    setCourseId(null);
    setModuleId(null);
    setFile(null);
    setProgress(null);
    setDetected('');
    onClose();
  };

  const fields = [
    { name: 'title', label: 'Video title', required: true, span: true },
    {
      name: 'courseId',
      label: 'Course',
      type: 'select',
      required: true,
      resets: ['moduleId', 'lessonId', 'batchIds'],
      options: (courses.data ?? []).map((c) => ({ value: c.id, label: c.title })),
    },
    {
      name: 'moduleId',
      label: 'Module',
      type: 'select',
      resets: ['lessonId'],
      options: modules.map((m) => ({ value: m.id, label: m.title })),
      placeholder: 'Whole course',
    },
    {
      name: 'lessonId',
      label: 'Lesson',
      type: 'select',
      options: lessons.map((l) => ({ value: l.id, label: l.title })),
      placeholder: 'No specific lesson',
      disabled: !lessons.length,
    },
    {
      name: 'durationSeconds',
      label: 'Duration (seconds)',
      type: 'number',
      required: true,
      hint: detected ? 'Read from the file' : 'Detected automatically when you choose a file',
    },
    { name: 'position', label: 'Order within module', type: 'number' },
    { name: 'description', label: 'Description', type: 'textarea', span: true, rows: 3 },
    { name: 'isRequired', label: 'Required for course completion', type: 'checkbox', span: false },
    { name: 'isPublished', label: 'Published (visible to enrolled students)', type: 'checkbox', span: false },
  ];

  return (
    <FormModal
      open={open}
      title={video ? 'Edit video' : 'Upload video'}
      submitLabel={video ? 'Save changes' : 'Upload video'}
      fields={fields}
      initialValues={{
        title: video?.title ?? '',
        courseId: selectedCourse,
        moduleId: selectedModule,
        lessonId: video?.lessonId ? String(video.lessonId) : '',
        durationSeconds: video?.durationSeconds ?? '',
        position: video?.position ?? 1,
        description: video?.description ?? '',
        isRequired: video?.isRequired ?? true,
        isPublished: video?.isPublished ?? false,
        batchIds: video?.batches?.map((b) => b.id) ?? [],
      }}
      validate={() => ({ video: !video && !file ? 'Choose a video file' : null })}
      onValuesChange={(values) => {
        if (values.courseId !== selectedCourse) setCourseId(values.courseId);
        if (values.moduleId !== selectedModule) setModuleId(values.moduleId);
      }}
      onSubmit={async (values) => {
        const payload = {
          ...values,
          moduleId: values.moduleId || '',
          lessonId: values.lessonId || '',
          durationSeconds: Number(values.durationSeconds),
          position: Number(values.position) || 0,
          batchIds: values.batchIds || [], // cleared to '' when the course changes
        };
        let res;
        if (video) {
          res = await api.put(`/admin/videos/${video.id}`, {
            ...payload,
            moduleId: payload.moduleId || null,
            lessonId: payload.lessonId || null,
          });
        } else {
          setProgress(0);
          try {
            res = await upload('/admin/videos', toFormData(payload, { video: file }), { onProgress: setProgress });
          } finally {
            setProgress(null);
          }
        }
        toast.success(video ? 'Video updated' : 'Video uploaded');
        return res.data;
      }}
      onSuccess={onSaved}
      onClose={close}
    >
      {(form) => (
        <div className="stack" style={{ gap: 16 }}>
          {selectedCourse && (
            <CourseBatchChecklist
              courseId={selectedCourse}
              value={form.values.batchIds || []}
              onChange={form.set('batchIds')}
              label="Available to batches"
            />
          )}
          {!video && (
            <div className="stack" style={{ gap: 10 }}>
              <span className="field__label">
                Video file <span className="req">*</span>
              </span>
              <FileDrop
                accept={VIDEO_ACCEPT}
                maxBytes={MAX_VIDEO_BYTES}
                file={file}
                error={form.errors.video}
                hint="MP4, WebM or OGG · up to 1 GB"
                onChange={async (f) => {
                  setFile(f);
                  form.setErrors((e) => ({ ...e, video: undefined }));
                  const seconds = await readDuration(f);
                  setDetected(seconds);
                  form.setValues((vals) => ({
                    ...vals,
                    durationSeconds: seconds || vals.durationSeconds,
                    title: vals.title || f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
                  }));
                }}
              />
              {progress !== null && (
                <div className="upload-progress" aria-live="polite">
                  <ProgressBar value={progress} label="Upload progress" />
                  <span className="num">{progress}%</span>
                </div>
              )}
              {progress === 100 && <Alert tone="info">Processing the upload…</Alert>}
            </div>
          )}
        </div>
      )}
    </FormModal>
  );
}
