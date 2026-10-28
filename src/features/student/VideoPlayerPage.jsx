import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, CircleCheck, Info } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, AsyncContent, Button, Card, InfoList, PageHeader, ProgressBar, useToast } from '@/components';
import { useAuth } from '@/features/auth/AuthContext';
import { useFetch } from '@/hooks/useFetch';
import { api, apiUrl } from '@/services/api';
import { formatDuration } from '@/utils/format';

const HEARTBEAT_MS = 10_000;

function Player({ video, onRefreshStream }) {
  const toast = useToast();
  const navigate = useNavigate();
  const { endSession } = useAuth();
  const videoRef = useRef(null);
  const lastBeat = useRef(0);
  const [progress, setProgress] = useState(video.progress);
  const [src, setSrc] = useState(apiUrl(video.stream.url));
  const completedRef = useRef(Boolean(video.progress.completedAt));

  const beat = useCallback(
    async (force = false) => {
      const el = videoRef.current;
      if (!el || (!force && Date.now() - lastBeat.current < HEARTBEAT_MS)) return;
      lastBeat.current = Date.now();
      try {
        const res = await api.post(`/student/videos/${video.id}/progress`, { position: Math.floor(el.currentTime * 10) / 10 });
        const p = res.data;
        setProgress({ watchedSeconds: p.watchedSeconds, lastPosition: p.lastPosition, completedAt: p.completedAt });
        if (p.videoCompleted && !completedRef.current) {
          completedRef.current = true;
          toast.success('Video completed — it now counts towards your course progress.');
        }
        if (p.courseCompleted) {
          if (p.sessionEnded) {
            el.pause();
            endSession('course_completed');
            navigate('/login/student', { replace: true });
          } else {
            toast.success('Congratulations! You have completed the course.');
          }
        }
      } catch {
        // Session problems are handled globally; a missed heartbeat only delays credit.
      }
    },
    [video.id, toast, endSession, navigate],
  );

  // Send a final heartbeat when leaving the page mid-video.
  useEffect(() => () => videoRef.current && !videoRef.current.paused && beat(true), [beat]);

  const onLoaded = () => {
    const el = videoRef.current;
    const resumeAt = progress.lastPosition;
    if (resumeAt > 5 && resumeAt < el.duration - 5) el.currentTime = resumeAt;
  };

  // Signed stream URLs expire after two hours; fetch a fresh one and continue from the same spot.
  const onError = async () => {
    const at = videoRef.current?.currentTime ?? 0;
    const fresh = await onRefreshStream();
    if (fresh) {
      setSrc(fresh);
      requestAnimationFrame(() => {
        if (videoRef.current) videoRef.current.currentTime = at;
      });
    }
  };

  const pct = Math.min(100, Math.round((progress.watchedSeconds / video.durationSeconds) * 100));
  return (
    <>
      <div className="player">
        <video
          ref={videoRef}
          src={src}
          controls
          controlsList="nodownload"
          preload="metadata"
          onLoadedMetadata={onLoaded}
          onPlay={() => beat(true)}
          onPause={() => beat(true)}
          onSeeked={() => beat(true)}
          onEnded={() => beat(true)}
          onTimeUpdate={() => beat(false)}
          onError={onError}
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>
      <div className="row" style={{ marginTop: 14 }}>
        <ProgressBar value={pct} tone={progress.completedAt ? 'green' : undefined} label="Watch progress" />
        <span className="num nowrap" style={{ fontSize: 'var(--fs-sm)' }}>
          {progress.completedAt ? (
            <span className="row" style={{ gap: 6, color: 'var(--green-600)', fontWeight: 600 }}>
              <CircleCheck size={16} aria-hidden="true" /> Completed
            </span>
          ) : (
            `${formatDuration(progress.watchedSeconds)} of ${formatDuration(video.durationSeconds)} watched`
          )}
        </span>
      </div>
    </>
  );
}

export default function VideoPlayerPage() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const state = useFetch(`/student/videos/${videoId}`);

  const refreshStream = useCallback(async () => {
    try {
      const res = await api.get(`/student/videos/${videoId}`);
      return apiUrl(res.data.stream.url);
    } catch {
      return null;
    }
  }, [videoId]);

  return (
    <AsyncContent state={state}>
      {(v) => (
        <>
          <PageHeader
            back={{ to: '/student/videos', label: 'All videos' }}
            title={v.title}
            subtitle={[v.courseTitle, v.moduleTitle, v.lessonTitle].filter(Boolean).join(' · ')}
          />
          <div className="split">
            <div className="stack">
              <Card>
                <Player key={v.id} video={v} onRefreshStream={refreshStream} />
              </Card>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <Button
                  variant="secondary"
                  icon={ChevronLeft}
                  disabled={!v.previous}
                  onClick={() => navigate(`/student/videos/${v.previous.id}`)}
                >
                  {v.previous ? `Previous: ${v.previous.title}` : 'Previous'}
                </Button>
                <Button variant="secondary" disabled={!v.next} onClick={() => navigate(`/student/videos/${v.next.id}`)}>
                  {v.next ? `Next: ${v.next.title}` : 'Next'} <ChevronRight aria-hidden="true" />
                </Button>
              </div>
            </div>
            <div className="stack">
              <Card title="About this video">
                {v.description && (
                  <p className="instructions" style={{ marginBottom: 14 }}>
                    {v.description}
                  </p>
                )}
                <InfoList
                  items={[
                    ['Course', v.courseTitle],
                    ['Module', v.moduleTitle],
                    ['Lesson', v.lessonTitle],
                    ['Duration', formatDuration(v.durationSeconds)],
                    ['Required', v.isRequired ? 'Yes' : 'Optional'],
                  ]}
                />
              </Card>
              <Alert icon={Info}>
                Your watch time is recorded while the video plays. Skipping ahead does not count — watch the whole lecture to complete it.
              </Alert>
            </div>
          </div>
        </>
      )}
    </AsyncContent>
  );
}
