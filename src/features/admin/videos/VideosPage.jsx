import { useState } from 'react';
import { CirclePlay, Eye, EyeOff, Pencil, Play, Trash2, Upload } from 'lucide-react';
import {
  Button,
  Card,
  DataTable,
  EmptyState,
  ErrorState,
  FilterSelect,
  Modal,
  PageHeader,
  Pagination,
  PageLoader,
  SearchInput,
  StatusBadge,
  useConfirm,
} from '@/components';
import { useApiAction } from '@/hooks/useApiAction';
import { useFetch } from '@/hooks/useFetch';
import { useCreateDialog, useListQuery } from '@/hooks/useListQuery';
import { api } from '@/services/api';
import { formatBytes, formatDate, formatDuration } from '@/utils/format';
import { AvailabilityChips } from '../shared/BatchAvailability';
import { VideoFormModal } from './VideoFormModal';

function PreviewModal({ video, onClose }) {
  const access = useFetch(`/admin/videos/${video.id}/access`);
  return (
    <Modal open title={video.title} onClose={onClose} size="xl">
      {access.data ? (
        <div className="player">
          <video src={access.data.url} controls autoPlay controlsList="nodownload" />
        </div>
      ) : (
        <PageLoader />
      )}
    </Modal>
  );
}

export default function VideosPage() {
  const { query, apiQuery, update, setPage, setSort } = useListQuery({ sort: 'created_at' });
  const state = useFetch('/admin/videos', apiQuery);
  const courses = useFetch('/admin/lookups/courses');
  const batches = useFetch('/admin/lookups/batches');
  const [uploading, setUploading] = useCreateDialog();
  const [editing, setEditing] = useState(null);
  const [previewing, setPreviewing] = useState(null);
  const confirm = useConfirm();
  const { run } = useApiAction();

  const togglePublish = (v) =>
    run(() => api.patch(`/admin/videos/${v.id}/publish`, { isPublished: !v.isPublished }), {
      success: v.isPublished ? 'Video unpublished' : 'Video published — enrolled students were notified',
      onDone: state.reload,
    });

  const remove = async (v) => {
    const ok = await confirm({
      title: `Delete “${v.title}”?`,
      message: `The file is deleted permanently${v.completedViews ? ` and ${v.completedViews} student(s) lose their watch progress for it` : ''}.`,
      confirmLabel: 'Delete video',
      danger: true,
    });
    if (ok) await run(() => api.delete(`/admin/videos/${v.id}`), { success: 'Video deleted', onDone: state.reload });
  };

  return (
    <>
      <PageHeader
        title="Video Upload"
        subtitle="Upload lecture videos and assign them to courses, modules and lessons."
        actions={
          <Button icon={Upload} onClick={() => setUploading(true)}>
            Upload Video
          </Button>
        }
      />
      <Card flush>
        <div className="toolbar">
          <SearchInput value={query.search} onSearch={(search) => update({ search })} placeholder="Search videos, courses or modules" />
          <FilterSelect
            label="Course"
            allLabel="All courses"
            value={query.courseId}
            onChange={(courseId) => update({ courseId })}
            options={(courses.data ?? []).map((c) => ({ value: c.id, label: c.title }))}
          />
          <FilterSelect
            label="Batch"
            allLabel="All batches"
            value={query.batchId}
            onChange={(batchId) => update({ batchId })}
            options={(batches.data ?? []).map((b) => ({ value: b.id, label: `Available to ${b.name}` }))}
          />
          <FilterSelect
            label="Visibility"
            allLabel="Published & drafts"
            value={query.published}
            onChange={(published) => update({ published })}
            options={[
              { value: 'true', label: 'Published' },
              { value: 'false', label: 'Drafts' },
            ]}
          />
        </div>
        {state.error ? (
          <ErrorState error={state.error} onRetry={state.reload} />
        ) : (
          <DataTable
            rows={state.data}
            loading={state.loading}
            sort={query.sort}
            order={query.order}
            onSort={setSort}
            columns={[
              {
                key: 'title',
                header: 'Video',
                sortKey: 'title',
                render: (v) => (
                  <button
                    type="button"
                    className="row"
                    style={{ border: 0, background: 'none', padding: 0, textAlign: 'left' }}
                    onClick={() => setPreviewing(v)}
                  >
                    <span className="timeline-icon tone-blue">
                      <Play aria-hidden="true" />
                    </span>
                    <span>
                      <strong style={{ color: 'var(--ink)' }}>{v.title}</strong>
                      <span className="cell-person__sub" style={{ display: 'block' }}>
                        {v.fileName} · {formatBytes(v.fileSize)}
                      </span>
                    </span>
                  </button>
                ),
              },
              {
                key: 'placement',
                header: 'Course / module / lesson',
                render: (v) => (
                  <span>
                    {v.courseTitle}
                    <span className="cell-person__sub" style={{ display: 'block' }}>
                      {[v.moduleTitle, v.lessonTitle].filter(Boolean).join(' · ') || 'Course-level'}
                    </span>
                  </span>
                ),
              },
              { key: 'batches', header: 'Available to', render: (v) => <AvailabilityChips batches={v.batches} /> },
              {
                key: 'duration',
                header: 'Duration',
                align: 'right',
                render: (v) => <span className="num">{formatDuration(v.durationSeconds)}</span>,
              },
              { key: 'views', header: 'Completed views', align: 'right', render: (v) => <span className="num">{v.completedViews}</span> },
              {
                key: 'createdAt',
                header: 'Uploaded',
                sortKey: 'created_at',
                render: (v) => <span className="nowrap">{formatDate(v.createdAt)}</span>,
              },
              {
                key: 'status',
                header: 'Status',
                render: (v) => (
                  <span className="row" style={{ gap: 6 }}>
                    <StatusBadge status={v.isPublished ? 'published' : 'draft'} />
                    {!v.isRequired && <span className="badge badge--gray">Optional</span>}
                  </span>
                ),
              },
              {
                key: 'actions',
                header: <span className="sr-only">Actions</span>,
                align: 'right',
                render: (v) => (
                  <span className="row" style={{ gap: 4, justifyContent: 'flex-end' }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={v.isPublished ? EyeOff : Eye}
                      onClick={() => togglePublish(v)}
                      aria-label={v.isPublished ? 'Unpublish' : 'Publish'}
                    />
                    <Button variant="ghost" size="sm" icon={Pencil} onClick={() => setEditing(v)} aria-label="Edit video" />
                    <Button variant="ghost" size="sm" icon={Trash2} onClick={() => remove(v)} aria-label="Delete video" />
                  </span>
                ),
              },
            ]}
            empty={<EmptyState icon={CirclePlay} title="No videos yet" message="Upload the first lecture video." />}
          />
        )}
        <Pagination meta={state.meta} onPage={setPage} noun="videos" />
      </Card>
      <VideoFormModal open={uploading} defaultCourseId={query.courseId} onClose={() => setUploading(false)} onSaved={state.reload} />
      <VideoFormModal open={Boolean(editing)} video={editing} onClose={() => setEditing(null)} onSaved={state.reload} />
      {previewing && <PreviewModal video={previewing} onClose={() => setPreviewing(null)} />}
    </>
  );
}
