import { useEffect, useRef, useState, type ChangeEvent, type SyntheticEvent } from 'react';
import type Hls from 'hls.js';
import { AlertTriangle, Loader2, Radio, Volume2, VolumeX } from 'lucide-react';
import { isHlsUrl } from '@/lib/media';

export interface PlaybackProgress {
  position: number;
  duration: number;
  completed: boolean;
}

interface VideoPlayerProps {
  src: string;
  title: string;
  subtitleUrl?: string;
  startAt?: number;
  poster?: string;
  isLive?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  showControls?: boolean;
  showMuteToggle?: boolean;
  onMutedChange?: (muted: boolean) => void;
  layout?: 'landscape' | 'portrait';
  onProgress?: (progress: PlaybackProgress) => void;
}

interface QualityLevel {
  index: number;
  label: string;
}

type PlayerStatus = 'loading' | 'ready' | 'error';

const SAVE_INTERVAL_SECONDS = 10;
const MIN_SAVED_POSITION_SECONDS = 1;
const COMPLETE_RATIO = 0.95;
const PLAYBACK_ERROR = 'This Video Could Not Be Played. The Link May Be Offline, Or The Host May Not Allow Playback In A Browser.';

export function VideoPlayer({
  src, title, subtitleUrl, startAt = 0, poster, isLive = false,
  autoPlay = false, muted = false, showControls = true, showMuteToggle = false, onMutedChange, layout = 'landscape', onProgress,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const startAtRef = useRef(startAt);
  const onProgressRef = useRef(onProgress);
  const lastSavedRef = useRef(0);
  const [status, setStatus] = useState<PlayerStatus>('loading');
  const [errorText, setErrorText] = useState(PLAYBACK_ERROR);
  const [levels, setLevels] = useState<QualityLevel[]>([]);
  const [quality, setQuality] = useState(-1);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(muted);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => { onProgressRef.current = onProgress; }, [onProgress]);
  useEffect(() => { startAtRef.current = startAt; }, [startAt]);
  useEffect(() => { setIsMuted(muted); }, [muted, src]);

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted && video.volume === 0) {
      video.volume = 0.85;
      setVolume(0.85);
    }
    onMutedChange?.(nextMuted);
    if (!nextMuted && video.paused) void video.play().catch(() => undefined);
  }

  // Never leave a player spinning indefinitely when a provider stalls or blocks playback.
  useEffect(() => {
    if (status !== 'loading') return;
    const timeoutId = window.setTimeout(() => {
      setErrorText('Playback Is Taking Too Long. Check The Video Link Or Your Connection, Then Try Again.');
      setStatus('error');
    }, 18_000);
    return () => window.clearTimeout(timeoutId);
  }, [status, src, retryCount]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setStatus('loading');
    setErrorText(PLAYBACK_ERROR);
    setLevels([]);
    setQuality(-1);
    lastSavedRef.current = 0;

    let hls: Hls | null = null;
    let cancelled = false;
    let networkRecoveries = 0;
    let mediaRecoveries = 0;
    const failPlayback = (message = PLAYBACK_ERROR) => {
      if (cancelled) return;
      setErrorText(message);
      setStatus('error');
      hls?.destroy();
      hls = null;
      hlsRef.current = null;
    };

    if (isHlsUrl(src)) {
      void import('hls.js').then(({ default: HlsLib }) => {
        if (cancelled) return;
        if (!HlsLib.isSupported()) {
          if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = src;
            video.load();
          } else {
            failPlayback('This Browser Cannot Play This Live Stream Format.');
          }
          return;
        }
        hls = new HlsLib({
          enableWorker: true,
          capLevelToPlayerSize: true,
          maxBufferLength: 20,
          maxMaxBufferLength: 40,
          backBufferLength: 30,
          lowLatencyMode: true,
          startLevel: -1,
        });
        hlsRef.current = hls;
        hls.on(HlsLib.Events.MANIFEST_PARSED, (_event, data) => {
          if (cancelled) return;
          setLevels(data.levels.map((level, index) => ({
            index,
            label: level.height ? `${level.height}p` : `${Math.round(level.bitrate / 1000)} kbps`,
          })));
        });
        hls.on(HlsLib.Events.ERROR, (_event, data) => {
          if (!data.fatal || cancelled) return;
          if (data.type === HlsLib.ErrorTypes.NETWORK_ERROR && networkRecoveries < 3) {
            networkRecoveries += 1;
            hls?.startLoad();
            return;
          }
          if (data.type === HlsLib.ErrorTypes.MEDIA_ERROR && mediaRecoveries < 2) {
            mediaRecoveries += 1;
            hls?.recoverMediaError();
            return;
          }
          failPlayback();
        });
        hls.loadSource(src);
        hls.attachMedia(video);
      }).catch((error: unknown) => {
        if (cancelled) return;
        console.error('Could not load the HLS playback engine', error);
        failPlayback('The Playback Engine Could Not Be Loaded. Please Try Again.');
      });
    } else {
      video.src = src;
      video.load();
    }

    return () => {
      cancelled = true;
      hls?.destroy();
      if (hlsRef.current === hls) hlsRef.current = null;
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [src, retryCount]);

  function reportProgress(video: HTMLVideoElement, completed: boolean) {
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const position = video.currentTime;
    const finished = completed || (duration > 0 && position / duration >= COMPLETE_RATIO);
    if (position < MIN_SAVED_POSITION_SECONDS) return;
    onProgressRef.current?.({ position, duration, completed: finished });
  }

  function handleLoadedMetadata(event: SyntheticEvent<HTMLVideoElement>) {
    const video = event.currentTarget;
    video.volume = volume;
    const target = startAtRef.current;
    if (target > 0 && Number.isFinite(video.duration) && target < video.duration - 5) {
      video.currentTime = target;
    }
    setStatus('ready');
  }

  function handleCanPlay(event: SyntheticEvent<HTMLVideoElement>) {
    const video = event.currentTarget;
    setStatus('ready');
    if (autoPlay && video.paused) {
      void video.play().catch(() => {
        // Browser autoplay policies may require the viewer to press Play.
      });
    }
  }

  function handleVideoError(event: SyntheticEvent<HTMLVideoElement>) {
    const mediaError = event.currentTarget.error;
    const message = mediaError?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
      ? 'This Video Format Or Source Is Not Supported By The Browser.'
      : mediaError?.code === MediaError.MEDIA_ERR_NETWORK
        ? 'The Video Could Not Be Reached. Check Your Connection And Try Again.'
        : PLAYBACK_ERROR;
    setErrorText(message);
    setStatus('error');
  }

  function handleTimeUpdate(event: SyntheticEvent<HTMLVideoElement>) {
    const video = event.currentTarget;
    if (Math.abs(video.currentTime - lastSavedRef.current) < SAVE_INTERVAL_SECONDS) return;
    lastSavedRef.current = video.currentTime;
    reportProgress(video, false);
  }

  function handleQualityChange(event: ChangeEvent<HTMLSelectElement>) {
    const next = Number(event.target.value);
    setQuality(next);
    if (hlsRef.current) hlsRef.current.currentLevel = next;
  }

  function handleVolumeChange(event: ChangeEvent<HTMLInputElement>) {
    const next = Number(event.target.value);
    setVolume(next);
    if (videoRef.current) {
      videoRef.current.volume = next;
      if (next > 0 && videoRef.current.muted) {
        videoRef.current.muted = false;
        setIsMuted(false);
        onMutedChange?.(false);
      }
    }
  }

  const hasQualityMenu = levels.length > 1;

  return (
    <div className={`cinema-video-player mx-auto w-full ${layout === 'portrait' ? 'space-y-0 rounded-none border-0 bg-transparent p-0 shadow-none' : 'space-y-3 rounded-[1.65rem] border border-sky-300/15 bg-[#080b11] p-2 shadow-[0_28px_90px_rgba(0,0,0,.5)] sm:p-3'}`}>
      {layout === 'landscape' && <div className="flex items-center justify-between gap-3 px-2 pt-1">
        <div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[.24em] text-sky-200/80">Cinema player</p><p className="mt-1 truncate text-sm font-semibold text-slate-100">{title}</p></div>
        {isLive && <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-rose-300/20 bg-rose-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-200"><Radio className="h-3 w-3" /> Live</span>}
      </div>}
      <div className={`cinema-video-stage relative mx-auto overflow-hidden bg-black ${layout === 'portrait' ? 'aspect-[9/16] h-[min(82dvh,820px)] max-h-[82dvh] w-auto max-w-full rounded-[1.35rem] shadow-[0_28px_80px_rgba(0,0,0,.65)] ring-1 ring-white/15 sm:h-[min(86dvh,860px)]' : 'aspect-video w-full rounded-[1.25rem] shadow-2xl shadow-black/60 ring-1 ring-white/10'}`}>
        <video
          ref={videoRef}
          className="h-full w-full bg-black object-contain"
          controls={showControls}
          controlsList="nodownload"
          playsInline
          autoPlay={autoPlay}
          muted={isMuted}
          preload={autoPlay ? 'auto' : 'metadata'}
          poster={poster || undefined}
          aria-label={title}
          crossOrigin={subtitleUrl ? 'anonymous' : undefined}
          onLoadedMetadata={handleLoadedMetadata}
          onCanPlay={handleCanPlay}
          onCanPlayThrough={() => setStatus('ready')}
          onSeeked={() => setStatus('ready')}
          onPlaying={() => setStatus('ready')}
          onWaiting={(event) => {
            if (!event.currentTarget.paused) setStatus('loading');
          }}
          onStalled={(event) => {
            if (!event.currentTarget.paused) setStatus('loading');
          }}
          onTimeUpdate={handleTimeUpdate}
          onVolumeChange={(event) => {
            const nextVolume = event.currentTarget.muted ? 0 : event.currentTarget.volume;
            setVolume((current) => Math.abs(current - nextVolume) > 0.03 ? nextVolume : current);
          }}
          onPause={(event) => {
            setStatus('ready');
            reportProgress(event.currentTarget, false);
          }}
          onEnded={(event) => reportProgress(event.currentTarget, true)}
          onError={handleVideoError}
        >
          {subtitleUrl && <track kind="subtitles" src={subtitleUrl} srcLang="en" label="Subtitles" />}
        </video>

        {showMuteToggle && status !== 'error' && (
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? 'Turn Sound On' : 'Mute Video'}
            aria-pressed={!isMuted}
            className="absolute left-3 top-16 z-30 grid h-12 w-12 touch-manipulation place-items-center rounded-full border border-white/25 bg-black/75 text-white shadow-[0_8px_28px_rgba(0,0,0,.6)] backdrop-blur-xl transition hover:border-sky-200/60 hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 active:scale-95"
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5 text-sky-100" />}
            <span className="sr-only">{isMuted ? 'Sound Off' : 'Sound On'}</span>
          </button>
        )}
        {status === 'loading' && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/35">
            <Loader2 className="h-10 w-10 animate-spin text-cinema-300" aria-label="Loading video" />
          </div>
        )}
        {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink-950/95 p-6">
            <div className="max-w-md text-center">
              <AlertTriangle className="mx-auto h-10 w-10 text-amber-400" />
              <p className="mt-4 text-base font-semibold text-white">Playback Unavailable</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{errorText}</p>
              <button type="button" onClick={() => { setStatus('loading'); setRetryCount((count) => count + 1); }} className="mt-4 inline-flex items-center justify-center rounded-full bg-cinema-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-cinema-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-200">Try Again</button>
            </div>
          </div>
        )}
      </div>

      {(layout !== 'portrait' && (hasQualityMenu || isLive || status === 'ready')) && (
        <div className="flex flex-wrap items-center gap-3">
          {isLive && <span className="inline-flex items-center gap-2 rounded-full bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-300"><Radio className="h-3.5 w-3.5" /> Live</span>}
          {status === 'ready' && (
            <label className="flex min-w-0 items-center gap-2 text-sm text-slate-400">
              {volume === 0 ? <VolumeX className="h-4 w-4 shrink-0 text-sky-200" /> : <Volume2 className="h-4 w-4 shrink-0 text-sky-200" />}
              <span className="sr-only">Volume</span>
              <input aria-label="Volume" type="range" min="0" max="1" step="0.01" value={volume} onChange={handleVolumeChange} className="h-1.5 w-24 cursor-pointer accent-sky-300" />
              <span className="w-8 text-right text-xs tabular-nums">{Math.round(volume * 100)}%</span>
            </label>
          )}
          {hasQualityMenu && (
            <label className="flex items-center gap-2 text-sm text-slate-400">
              <span className="font-semibold">Quality</span>
              <select value={quality} onChange={handleQualityChange} className="rounded-lg border border-sky-200/15 bg-[#080d16] px-3 py-1.5 text-sm text-slate-100 transition focus:border-sky-300/60 focus:outline-none focus:ring-2 focus:ring-sky-300/15">
                <option value={-1}>Auto</option>
                {levels.map((level) => <option key={level.index} value={level.index}>{level.label}</option>)}
              </select>
            </label>
          )}
        </div>
      )}
    </div>
  );
}
