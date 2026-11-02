import { Modal } from '@/components/ui/Modal';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { isDirectVideoUrl, toEmbedUrl } from '@/lib/media';
import type { DiscoverClip } from '@/lib/clips';

export function ShortViewer({ clip, onClose }: { clip: DiscoverClip; onClose: () => void }) {
  const direct = isDirectVideoUrl(clip.video_url);
  const embed = direct ? null : toEmbedUrl(clip.video_url, { autoplay: true, muted: true });
  const canWatchTitle = Boolean(clip.title?.playback_url?.trim()) && clip.title?.type !== 'series';

  return (
    <Modal label={clip.headline} onClose={onClose} wide>
      <div className="mx-auto flex max-h-[88vh] max-w-[min(92vw,480px)] flex-col gap-3 pr-7">
        <div className="flex min-h-0 justify-center overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
          {direct && <VideoPlayer src={clip.video_url} title={clip.headline} layout="portrait" autoPlay muted />}
          {embed && <iframe src={embed} title={clip.headline} className="aspect-[9/16] max-h-[76vh] w-full bg-black" allow="autoplay; accelerometer; clipboard-write; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />}
          {!direct && !embed && <div className="grid aspect-[9/16] w-full place-items-center p-6 text-center text-sm text-slate-400">This short needs a supported MP4, HLS, YouTube or Vimeo video link.</div>}
        </div>
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 font-semibold text-white">{clip.headline}</p>
            <p className="text-xs text-slate-400">{clip.publisher_name || 'Cinema'}{clip.duration_seconds ? ` · ${clip.duration_seconds}s` : ''}</p>
          </div>
          {canWatchTitle && clip.title && <a href={`/watch/${clip.title.id}`} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-ink-950 transition hover:bg-sky-100">Watch now</a>}
          {clip.title && !canWatchTitle && <a href={`/title/${clip.title.id}`} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">Explore title</a>}
        </div>
      </div>
    </Modal>
  );
}
