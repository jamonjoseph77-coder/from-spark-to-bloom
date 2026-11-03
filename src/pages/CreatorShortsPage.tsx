import { useState, type FormEvent } from 'react';
import { Film, UploadCloud, Youtube } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/lib/supabase';
import { submitCreatorShort } from '@/lib/creator-shorts';
import { fetchPublishedTitles } from '@/lib/library';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getYouTubeVideoId } from '@/lib/media';
import { BUTTON_PRIMARY, CARD, INPUT, LABEL, PAGE_CONTAINER } from '@/components/ui/styles';
import { ErrorState, LoadingState } from '@/components/ui/StatusViews';

export function CreatorShortsPage() {
  const { user, loading } = useAuth();
  const { notify } = useToast();
  const { data: titles, error, reload } = useAsyncData(fetchPublishedTitles, []);
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [publisher, setPublisher] = useState('');
  const [titleId, setTitleId] = useState('');
  const [duration, setDuration] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [video, setVideo] = useState<File | null>(null);
  const [poster, setPoster] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const videoUrl = youtubeUrl.trim();
    const hasYouTubeUrl = videoUrl.length > 0;
    if (hasYouTubeUrl && !getYouTubeVideoId(videoUrl)) {
      notify('Paste a valid YouTube video or Shorts URL.', 'error');
      return;
    }
    if (hasYouTubeUrl && video) {
      notify('Use either a YouTube URL or a video file, not both.', 'error');
      return;
    }
    if (!hasYouTubeUrl && !video) {
      notify('Paste a YouTube URL or choose a video file.', 'error');
      return;
    }
    if (video && !['video/mp4', 'video/webm', 'video/quicktime'].includes(video.type)) {
      notify('Choose an MP4, WebM or MOV video file.', 'error');
      return;
    }
    if (video && video.size > 100 * 1024 * 1024) {
      notify('Your video must be 100 MB or smaller.', 'error');
      return;
    }
    if (poster && (!['image/jpeg', 'image/png', 'image/webp'].includes(poster.type) || poster.size > 5 * 1024 * 1024)) {
      notify('The poster must be JPG, PNG or WebP and no larger than 5 MB.', 'error');
      return;
    }
    const seconds = duration.trim() ? Number(duration) : null;
    if (seconds !== null && (!Number.isInteger(seconds) || seconds < 1 || seconds > 90)) {
      notify('Cinema Shorts must be between 1 and 90 seconds.', 'error');
      return;
    }

    setBusy(true);
    let videoPath: string | null = null;
    let posterPath: string | null = null;
    try {
      const base = `${user.id}/${crypto.randomUUID()}`;
      if (video) {
        videoPath = `${base}/video-${video.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
        const { error: uploadError } = await supabase.storage.from('cinema-creator-submissions').upload(videoPath, video, {
          contentType: video.type,
          upsert: false,
        });
        if (uploadError) throw uploadError;
      }

      if (poster) {
        posterPath = `${base}/poster-${poster.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
        const { error: posterError } = await supabase.storage.from('cinema-creator-submissions').upload(posterPath, poster, {
          contentType: poster.type,
          upsert: false,
        });
        if (posterError) throw posterError;
      }

      await submitCreatorShort({
        user_id: user.id,
        headline: headline.trim(),
        description: description.trim(),
        publisher_name: publisher.trim(),
        video_path: videoPath,
        video_url: hasYouTubeUrl ? videoUrl : null,
        poster_path: posterPath,
        title_id: titleId || null,
        duration_seconds: seconds,
      });
      setHeadline('');
      setDescription('');
      setPublisher('');
      setTitleId('');
      setDuration('');
      setYoutubeUrl('');
      setVideo(null);
      setPoster(null);
      event.currentTarget.reset();
      notify('Your Short has been submitted for Cinema review.');
    } catch (submitError) {
      console.error('Creator Short submission failed', submitError);
      notify('Your Short could not be submitted. Please try again.', 'error');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className={PAGE_CONTAINER}><LoadingState /></div>;
  if (!user) return <main className={PAGE_CONTAINER}><section className={CARD}><h1 className="text-2xl font-extrabold text-white">Share A Short With Cinema</h1><p className="mt-2 text-sm text-slate-400">Sign in to submit a video for review.</p><a className={BUTTON_PRIMARY + ' mt-5 inline-flex'} href="/sign-in">Sign In</a></section></main>;
  if (!titles && error) return <main className={PAGE_CONTAINER}><ErrorState onRetry={reload} /></main>;

  return (
    <main className={PAGE_CONTAINER}>
      <section className={CARD + ' mx-auto max-w-2xl space-y-6'}>
        <div><span className="mb-3 inline-flex rounded-xl bg-cinema-500/15 p-3 text-cinema-200"><Film /></span><h1 className="text-2xl font-extrabold text-white">Submit A Cinema Short</h1><p className="mt-2 text-sm leading-6 text-slate-400">Submit an authorised YouTube video or upload a video file. Cinema reviews every submission before it appears in the public Shorts feed.</p></div>
        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <div><label className={LABEL} htmlFor="creator-headline">Video Title</label><input id="creator-headline" className={INPUT} value={headline} onChange={(event) => setHeadline(event.target.value)} maxLength={160} required /></div>
          <div><label className={LABEL} htmlFor="creator-publisher">Creator Or Publisher Name</label><input id="creator-publisher" className={INPUT} value={publisher} onChange={(event) => setPublisher(event.target.value)} maxLength={120} required /></div>
          <div><label className={LABEL} htmlFor="creator-description">Description</label><textarea id="creator-description" className={INPUT} rows={3} value={description} onChange={(event) => setDescription(event.target.value)} maxLength={1000} /></div>
          <div><label className={LABEL} htmlFor="creator-youtube">YouTube Video Or Shorts URL</label><div className="relative"><Youtube className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-300" /><input id="creator-youtube" type="url" className={INPUT + ' pl-10'} placeholder="https://www.youtube.com/shorts/..." value={youtubeUrl} onChange={(event) => setYoutubeUrl(event.target.value)} /></div><p className="mt-1.5 text-xs text-slate-500">Paste a public YouTube URL. You can use this instead of uploading a file.</p></div>
          <div className="text-center text-xs font-bold uppercase tracking-wider text-slate-500">Or Upload A Video File</div>
          <div><label className={LABEL} htmlFor="creator-video">Video File (MP4, WebM Or MOV · Up To 100 MB)</label><input id="creator-video" className={INPUT} type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(event) => setVideo(event.target.files?.[0] ?? null)} /></div>
          <div><label className={LABEL} htmlFor="creator-poster">Poster Image (Optional · Up To 5 MB)</label><input id="creator-poster" className={INPUT} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setPoster(event.target.files?.[0] ?? null)} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={LABEL} htmlFor="creator-duration">Duration In Seconds (Optional)</label><input id="creator-duration" className={INPUT} inputMode="numeric" value={duration} onChange={(event) => setDuration(event.target.value)} placeholder="Maximum 90" /></div>
            <div><label className={LABEL} htmlFor="creator-title">Related Cinema Title (Optional)</label><select id="creator-title" className={INPUT} value={titleId} onChange={(event) => setTitleId(event.target.value)}><option value="">No Linked Title</option>{(titles ?? []).map((title) => <option key={title.id} value={title.id}>{title.title}</option>)}</select></div>
          </div>
          <label className="flex items-start gap-3 text-xs leading-5 text-slate-400"><input type="checkbox" className="mt-1 accent-cinema-500" required /><span>I Confirm I Own This Video Or Have Permission To Submit And Display It On Cinema.</span></label>
          <button className={BUTTON_PRIMARY} type="submit" disabled={busy || (!video && !youtubeUrl.trim())}><UploadCloud className="mr-2 inline h-4 w-4" />{busy ? 'Submitting...' : 'Submit For Review'}</button>
        </form>
      </section>
    </main>
  );
}
