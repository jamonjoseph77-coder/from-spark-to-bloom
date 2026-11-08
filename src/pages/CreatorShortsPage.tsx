import { useEffect, useState, type FormEvent } from 'react';
import { BadgeCheck, Film, UploadCloud } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/lib/supabase';
import { removeCreatorShortUploads, submitCreatorShort } from '@/lib/creator-shorts';
import { fetchPublishedTitles } from '@/lib/library';
import { fetchMyStudioApplication } from '@/lib/studios';
import { useAsyncData } from '@/hooks/useAsyncData';
import { BUTTON_PRIMARY, CARD, INPUT, LABEL, PAGE_CONTAINER } from '@/components/ui/styles';
import { ErrorState, LoadingState } from '@/components/ui/StatusViews';

function readVideoDuration(file: File): Promise<number> {
  const objectUrl = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const probe = document.createElement('video');
    const timeout = window.setTimeout(() => finish(new Error('The video length could not be checked. Please try an MP4 file.')), 15_000);
    const finish = (error?: Error, seconds?: number) => {
      window.clearTimeout(timeout);
      probe.onloadedmetadata = null;
      probe.onerror = null;
      probe.removeAttribute('src');
      URL.revokeObjectURL(objectUrl);
      if (error) reject(error);
      else resolve(seconds ?? 0);
    };
    probe.preload = 'metadata';
    probe.onloadedmetadata = () => {
      const seconds = probe.duration;
      if (!Number.isFinite(seconds) || seconds <= 0) finish(new Error('Cinema could not read this video duration.'));
      else finish(undefined, Math.ceil(seconds));
    };
    probe.onerror = () => finish(new Error('Cinema could not read this video. Please check the file and try again.'));
    probe.src = objectUrl;
  });
}

export function CreatorShortsPage() {
  const { user, loading } = useAuth();
  const { notify } = useToast();
  const { data: titles, error, reload } = useAsyncData(fetchPublishedTitles, []);
  const { data: studio } = useAsyncData(() => user ? fetchMyStudioApplication(user.id) : Promise.resolve(null), [user?.id]);
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [publisher, setPublisher] = useState('');
  const [titleId, setTitleId] = useState('');
  const [duration, setDuration] = useState('');
  const [video, setVideo] = useState<File | null>(null);
  const [poster, setPoster] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('');
  const [posterPreviewUrl, setPosterPreviewUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [busyStep, setBusyStep] = useState('');

  useEffect(() => {
    if (studio?.verification_status === 'verified' && !publisher.trim()) setPublisher(studio.studio_name);
  }, [studio?.id, studio?.verification_status, studio?.studio_name]);

  useEffect(() => {
    if (!video) { setVideoPreviewUrl(''); return; }
    const url = URL.createObjectURL(video);
    setVideoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [video]);

  useEffect(() => {
    if (!poster) { setPosterPreviewUrl(''); return; }
    const url = URL.createObjectURL(poster);
    setPosterPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [poster]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !video) return;
    if (!['video/mp4', 'video/webm', 'video/quicktime'].includes(video.type)) {
      notify('Choose an MP4, WebM or MOV video file.', 'error');
      return;
    }
    if (video.size > 100 * 1024 * 1024) {
      notify('Your video must be 100 MB or smaller.', 'error');
      return;
    }
    if (poster && (!['image/jpeg', 'image/png', 'image/webp'].includes(poster.type) || poster.size > 5 * 1024 * 1024)) {
      notify('The poster must be JPG, PNG or WebP and no larger than 5 MB.', 'error');
      return;
    }
    setBusy(true);
    const base = `${user.id}/${crypto.randomUUID()}`;
    const videoPath = `${base}/video-${video.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
    let posterPath: string | null = null;
    try {
      setBusyStep('Checking Video Length…');
      const seconds = await readVideoDuration(video);
      if (seconds < 1 || seconds > 90) {
        notify('Cinema Shorts must be between 1 and 90 seconds. Your selected video is ' + seconds + ' seconds long.', 'error');
        return;
      }
      setDuration(String(seconds));
      setBusyStep('Uploading Video…');
      const { error: uploadError } = await supabase.storage.from('cinema-creator-submissions').upload(videoPath, video, {
        contentType: video.type,
        upsert: false,
      });
      if (uploadError) throw uploadError;

      if (poster) {
        posterPath = `${base}/poster-${poster.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
        const { error: posterError } = await supabase.storage.from('cinema-creator-submissions').upload(posterPath, poster, {
          contentType: poster.type,
          upsert: false,
        });
        if (posterError) throw posterError;
      }

      setBusyStep('Sending For Review…');
      await submitCreatorShort({
        user_id: user.id,
        headline: headline.trim(),
        description: description.trim(),
        publisher_name: studio?.verification_status === 'verified' ? studio.studio_name : publisher.trim(),
        video_path: videoPath,
        poster_path: posterPath,
        title_id: titleId || null,
        duration_seconds: seconds,
      });
      setHeadline('');
      setDescription('');
      setPublisher('');
      setTitleId('');
      setDuration('');
      setVideo(null);
      setPoster(null);
      const form = event.currentTarget;
      form.reset();
      notify('Your Short has been submitted for Cinema review.');
    } catch (submitError) {
      await removeCreatorShortUploads(videoPath, posterPath);
      console.error('Creator Short submission failed', submitError);
      notify('Your Short could not be submitted. Please try again.', 'error');
    } finally {
      setBusy(false);
      setBusyStep('');
    }
  }

  if (loading) return <div className={PAGE_CONTAINER}><LoadingState /></div>;
  if (!user) return <main className={PAGE_CONTAINER}><section className={CARD}><h1 className="text-2xl font-extrabold text-white">Share A Short With Cinema</h1><p className="mt-2 text-sm text-slate-400">Sign in to submit a video for review.</p><a className={BUTTON_PRIMARY + ' mt-5 inline-flex'} href="/sign-in">Sign In</a></section></main>;
  if (!titles && error) return <main className={PAGE_CONTAINER}><ErrorState onRetry={reload} /></main>;

  return (
    <main className={PAGE_CONTAINER}>
      <section className={CARD + ' mx-auto max-w-2xl space-y-6'}>
        <div><span className="mb-3 inline-flex rounded-xl bg-cinema-500/15 p-3 text-cinema-200"><Film /></span><h1 className="text-2xl font-extrabold text-white">Submit A Cinema Short</h1><p className="mt-2 text-sm leading-6 text-slate-400">A simpler submission flow for original or authorised videos. Add the essentials, check your selected files, and send the video to Cinema for review.</p><div className="grid grid-cols-3 gap-2 pt-1"><div className="rounded-xl border border-white/10 bg-white/[.03] p-3"><span className="block text-[10px] font-bold uppercase tracking-wider text-sky-200">01</span><span className="mt-1 block text-xs font-semibold text-white">Details</span></div><div className="rounded-xl border border-white/10 bg-white/[.03] p-3"><span className="block text-[10px] font-bold uppercase tracking-wider text-sky-200">02</span><span className="mt-1 block text-xs font-semibold text-white">Video</span></div><div className="rounded-xl border border-white/10 bg-white/[.03] p-3"><span className="block text-[10px] font-bold uppercase tracking-wider text-sky-200">03</span><span className="mt-1 block text-xs font-semibold text-white">Review</span></div></div></div>
        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <div><label className={LABEL} htmlFor="creator-headline">Video Title</label><input id="creator-headline" className={INPUT} value={headline} onChange={(event) => setHeadline(event.target.value)} maxLength={160} required /></div>
          <div><label className={LABEL} htmlFor="creator-publisher">Creator Or Publisher Name</label><input id="creator-publisher" className={INPUT} value={studio?.verification_status === 'verified' ? studio.studio_name : publisher} onChange={(event) => setPublisher(event.target.value)} maxLength={120} required readOnly={studio?.verification_status === 'verified'} />{studio?.verification_status === 'verified' ? <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-sky-200"><BadgeCheck className="h-3.5 w-3.5" /> Verified Studio Submission · {studio.studio_name}</p> : <p className="mt-1.5 text-xs text-slate-500">Your video will be reviewed before it appears publicly. Studio verification is shown only when Cinema has verified the studio account.</p>}</div>
          <div><label className={LABEL} htmlFor="creator-description">Description</label><textarea id="creator-description" className={INPUT} rows={3} value={description} onChange={(event) => setDescription(event.target.value)} maxLength={1000} /></div>
          <div><label className={LABEL} htmlFor="creator-video">Video File <span className="font-normal text-slate-500">(MP4, WebM Or MOV · Up To 100 MB)</span></label><input id="creator-video" className={INPUT} type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(event) => { setVideo(event.target.files?.[0] ?? null); setDuration(''); }} required /><p className="mt-1.5 text-xs text-slate-500">MP4 is recommended for smooth playback across devices. Your video stays private while it is reviewed.</p>{video && <div className="mt-3 space-y-2 rounded-xl border border-sky-200/10 bg-sky-300/[.04] p-3"><p className="text-xs text-sky-100">Selected: {video.name} · {(video.size / (1024 * 1024)).toFixed(1)} MB</p>{videoPreviewUrl && <video src={videoPreviewUrl} controls playsInline preload="metadata" className="max-h-64 w-full rounded-lg bg-black object-contain" aria-label="Preview selected short" />}</div>}</div>
          <div><label className={LABEL} htmlFor="creator-poster">Poster Image <span className="font-normal text-slate-500">(Optional · Up To 5 MB)</span></label><input id="creator-poster" className={INPUT} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setPoster(event.target.files?.[0] ?? null)} />{poster && <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.03] p-2"><img src={posterPreviewUrl} alt="Selected poster preview" className="h-16 w-12 rounded-lg object-cover" /><span className="min-w-0 truncate text-xs text-slate-400">{poster.name}</span></div>}</div>
          <section className="space-y-3 rounded-2xl border border-sky-200/15 bg-sky-300/[.045] p-4">
            <div><p className="text-xs font-extrabold uppercase tracking-[.16em] text-sky-200">Connect This Short To A Story</p><p className="mt-1 text-xs leading-5 text-slate-400">Choose the movie or series this video is about. Cinema can then show a direct Watch Now link and use the connection to organise related discovery. This does not automatically analyse the video.</p></div>
            <label className={LABEL} htmlFor="creator-title">Related Movie Or Series <span className="font-normal text-slate-500">(Optional)</span></label>
            <select id="creator-title" className={INPUT} value={titleId} onChange={(event) => setTitleId(event.target.value)}><option value="">No Linked Title</option>{(titles ?? []).filter((title) => title.type === 'movie' || title.type === 'series').map((title) => <option key={title.id} value={title.id}>{title.title} · {title.type === 'series' ? 'Series' : 'Movie'}</option>)}</select>
            {titleId && <p className="text-xs font-semibold text-sky-100">This Short will point viewers directly to the selected Cinema title after approval.</p>}
          </section>
          <div><label className={LABEL} htmlFor="creator-duration">Duration In Seconds (Detected Automatically)</label><input id="creator-duration" className={INPUT} inputMode="numeric" value={duration} placeholder="Detected From Video" readOnly /></div>
          <label className="flex items-start gap-3 text-xs leading-5 text-slate-400"><input type="checkbox" className="mt-1 accent-cinema-500" required /><span>I Confirm I Own This Video Or Have Permission To Submit And Display It On Cinema.</span></label>
          <p className="rounded-xl border border-white/10 bg-white/[.025] p-3 text-xs leading-5 text-slate-400">Cinema may consider eligible Shorts for clearly labelled title or programme sponsorships. Submitting a video does not automatically grant advertising rights; any commercial use requires separate permission and an agreement.</p>
          <button className={BUTTON_PRIMARY} type="submit" disabled={busy || !video}><UploadCloud className="mr-2 inline h-4 w-4" />{busy ? busyStep || 'Submitting…' : 'Submit For Review'}</button>
        </form>
      </section>
    </main>
  );
}
