import { Modal } from '@/components/ui/Modal';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { isDirectVideoUrl, toEmbedUrl } from '@/lib/media';
import type { VideoSource } from '@/lib/videoSource';

interface VideoDialogProps extends VideoSource {
  onClose: () => void;
}

export function VideoDialog({ url, label, heading, onClose }: VideoDialogProps) {
  const direct = isDirectVideoUrl(url);
  const embedUrl = direct ? null : toEmbedUrl(url, { autoplay: true });

  return (
    <Modal label={label} onClose={onClose} wide>
      <div className="space-y-4 pr-8">
        <div className="rounded-2xl border border-sky-300/15 bg-gradient-to-r from-sky-400/[.08] to-white/[.02] px-4 py-3"><p className="text-[9px] font-black uppercase tracking-[.24em] text-sky-200">Cinema · Official video</p><p className="mt-1 text-sm font-semibold text-white">{heading}</p></div>
        {direct && <VideoPlayer src={url} title={label} />}
        {embedUrl && (
          <div className="aspect-video overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
            <iframe
              src={embedUrl}
              loading="eager"
              title={label}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        )}
        {!direct && embedUrl && (
          <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.04] px-4 py-2.5 text-xs font-bold text-slate-200 transition hover:border-sky-200/35 hover:bg-white/[.08]">If playback is blocked, open the original video</a>
        )}
        {!direct && !embedUrl && (
          <p className="rounded-xl border border-white/10 bg-ink-850 p-4 text-sm text-slate-400">
            This video link cannot be played here. Ask an administrator to use a direct video link or a YouTube or Vimeo link.
          </p>
        )}
      </div>
    </Modal>
  );
}
