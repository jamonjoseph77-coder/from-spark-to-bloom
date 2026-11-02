import { useState } from 'react';
import { ArrowUpRight, BadgeCheck, Share2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { useToast } from '@/hooks/useToast';
import { isDirectVideoUrl, toEmbedUrl } from '@/lib/media';
import type { DiscoverClip } from '@/lib/clips';

export function ShortViewer({ clip, onClose }: { clip: DiscoverClip; onClose: () => void }) {
  const direct = isDirectVideoUrl(clip.video_url);
  const embed = direct ? null : toEmbedUrl(clip.video_url, { autoplay: true, muted: true });
  const canWatchTitle = Boolean(clip.title?.playback_url?.trim()) && clip.title?.type !== 'series';
  const [sharing, setSharing] = useState(false);
  const { notify } = useToast();

  async function shareShort() {
    const url = window.location.href.split('#')[0] + `#short-${clip.id}`;
    try {
      setSharing(true);
      if (navigator.share) await navigator.share({ title: clip.headline, text: `Watch this official Cinema Short from ${clip.publisher_name} on Cinema.`, url });
      else if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(url); notify('Short link copied.'); }
      else notify('Sharing is not available on this browser.', 'error');
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') notify('Could not share this short. Try again.', 'error');
    } finally { setSharing(false); }
  }

  return (
    <Modal label={clip.headline} onClose={onClose} immersive>
      <div className="relative flex h-full min-h-[620px] flex-col justify-center overflow-hidden bg-black">
        <div className="absolute inset-0">
          {direct && <VideoPlayer src={clip.video_url} title={clip.headline} layout="portrait" autoPlay muted />}
          {embed && <iframe src={embed} title={clip.headline} className="h-full w-full bg-black" allow="autoplay; accelerometer; clipboard-write; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />}
          {!direct && !embed && <div className="grid h-full place-items-center p-8 text-center text-sm text-slate-400">This short needs a supported MP4, HLS, YouTube or Vimeo video link.</div>}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black via-black/75 to-transparent px-5 pb-[max(28px,env(safe-area-inset-bottom))] pt-28">
          <div className="pointer-events-auto flex items-end gap-3">
            <div className="min-w-0 flex-1">
              <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-200"><BadgeCheck className="h-3.5 w-3.5" /> Publisher short</p>
              <h2 className="line-clamp-3 text-lg font-extrabold leading-snug text-white drop-shadow-lg">{clip.headline}</h2>
              <p className="mt-1 text-xs text-slate-300">{clip.publisher_name || 'Cinema'}{clip.duration_seconds ? ` · ${clip.duration_seconds}s` : ''}</p>
              {clip.description && <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-300">{clip.description}</p>}
              {canWatchTitle && clip.title && <a href={`/watch/${clip.title.id}`} className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-extrabold text-ink-950 shadow-lg transition hover:bg-sky-100">Watch full title <ArrowUpRight className="h-3.5 w-3.5" /></a>}
              {clip.title && !canWatchTitle && <a href={`/title/${clip.title.id}`} className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/20">Explore title <ArrowUpRight className="h-3.5 w-3.5" /></a>}
            </div>
            <button type="button" disabled={sharing} onClick={() => void shareShort()} aria-label="Share this short" className="mb-1 grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/20 bg-black/50 text-white shadow-xl backdrop-blur-md transition hover:scale-105 hover:bg-cinema-600 disabled:opacity-50"><Share2 className="h-5 w-5" /></button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
