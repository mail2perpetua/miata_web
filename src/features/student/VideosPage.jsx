import { CirclePlay } from 'lucide-react';
import { AsyncContent, Card, EmptyState, FilterSelect, PageHeader } from '@/components';
import { useFetch } from '@/hooks/useFetch';
import { useListQuery } from '@/hooks/useListQuery';
import { VideoCard } from './StudentWidgets';

export default function VideosPage() {
  const { query, apiQuery, update } = useListQuery();
  const { courseId, status } = apiQuery;
  const state = useFetch('/student/videos', { courseId, status });
  const courses = useFetch('/student/courses');

  return (
    <>
      <PageHeader
        title="Videos"
        subtitle="Lecture videos from your courses. Watch each required video to the end to count it towards completion."
      />
      <Card flush>
        <div className="toolbar">
          <FilterSelect
            label="Course"
            allLabel="All courses"
            value={query.courseId}
            onChange={(value) => update({ courseId: value })}
            options={(courses.data ?? [])
              .filter((c) => c.courseActive && c.status !== 'suspended')
              .map((c) => ({ value: c.courseId, label: c.title }))}
          />
          <FilterSelect
            label="Watched"
            allLabel="All videos"
            value={query.status}
            onChange={(value) => update({ status: value })}
            options={[
              { value: 'unwatched', label: 'Not watched yet' },
              { value: 'watched', label: 'Watched' },
            ]}
          />
        </div>
        <div className="card__body">
          <AsyncContent state={state}>
            {(videos) =>
              videos.length ? (
                <div className="video-grid">
                  {videos.map((v) => (
                    <VideoCard key={v.id} video={v} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={CirclePlay}
                  title="No videos found"
                  message={query.status || query.courseId ? 'Try another filter.' : 'Videos appear when your professors publish them.'}
                />
              )
            }
          </AsyncContent>
        </div>
      </Card>
    </>
  );
}
