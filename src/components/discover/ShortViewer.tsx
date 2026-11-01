import { Modal } from '@/components/ui/Modal';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { isDirectVideoUrl, toEmbedUrl } from '@/lib/media';
import type { DiscoverClip } from '@/lib/clips';

export function ShortViewer({ clip, onClose }: { clip: DiscoverClip; onClose: () => void }) {
  const direct = isDirectVideoUrl(clip.video_url);
  const embed = direct ? null : toEmbedUrl(clip.video_url);
  return (
    <Modal label={clip.headline} onClose={onClose}>
      <div className="mx-auto max-w-[420px] space-y-3 pr-7">
        <div className="mx-auto aspect-[9/16] max-h-[72vh] overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
          {direct && <VideoPlayer src={clip.video_url} title={clip.headline} />}
          {embed && <iframe src={embed} title={clip.headline} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />}
          {!direct && !embed && <div className="grid h-full place-items-center p-6 text-center text-sm text-slate-400">This short needs a supported MP4, HLS, YouTube or Vimeo video link.</div>}
        </div>
        <div><p className="font-semibold text-white">{clip.headline}</p><p className="text-xs text-slate-400">{clip.publisher_name || 'Cinema'}{clip.duration_seconds ? ` · ${clip.duration_seconds}s` : ''}</p>{clip.title && <a href={`/title/${clip.title.id}`} className="mt-2 inline-block text-sm font-semibold text-cinema-300 hover:text-white">Explore {clip.title.title}</a>}</div>
      </div>
    </Modal>
  );
}
