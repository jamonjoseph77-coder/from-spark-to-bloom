import { supabase } from '@/lib/supabase';

export interface CreatorShortSubmission {
  id: string;
  user_id: string;
  headline: string;
  description: string;
  publisher_name: string;
  video_path: string;
  poster_path: string | null;
  title_id: string | null;
  duration_seconds: number | null;
  status: 'pending' | 'approved' | 'rejected';
  review_note: string;
  created_at: string;
  reviewed_at: string | null;
  preview_url?: string;
}

export async function fetchPendingCreatorShorts(): Promise<CreatorShortSubmission[]> {
  const { data, error } = await supabase
    .from('creator_short_submissions')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) throw error;
  const submissions = (data ?? []) as CreatorShortSubmission[];
  return Promise.all(submissions.map(async (submission) => {
    const { data: signed } = await supabase.storage
      .from('cinema-creator-submissions')
      .createSignedUrl(submission.video_path, 60 * 30);
    return { ...submission, preview_url: signed?.signedUrl };
  }));
}

export async function submitCreatorShort(input: {
  user_id: string;
  headline: string;
  description: string;
  publisher_name: string;
  video_path: string;
  poster_path: string | null;
  title_id: string | null;
  duration_seconds: number | null;
}): Promise<void> {
  const { error } = await supabase.from('creator_short_submissions').insert({
    ...input,
    status: 'pending',
  });
  if (error) throw error;
}

export async function removeCreatorShortUploads(videoPath: string, posterPath: string | null): Promise<void> {
  const paths = [videoPath, posterPath].filter((path): path is string => Boolean(path));
  if (!paths.length) return;
  const { error } = await supabase.storage.from('cinema-creator-submissions').remove(paths);
  if (error) console.warn('Temporary creator upload cleanup could not complete', error);
}

export async function reviewCreatorShort(
  submission: CreatorShortSubmission,
  decision: 'approved' | 'rejected',
  reviewNote = '',
): Promise<void> {
  // Make repeated review actions safe and prevent stale admin screens from
  // reprocessing submissions another reviewer has already completed.
  const { data: current, error: currentError } = await supabase
    .from('creator_short_submissions')
    .select('status')
    .eq('id', submission.id)
    .maybeSingle();
  if (currentError) throw currentError;
  if (!current) throw new Error('This creator submission no longer exists.');
  if (current.status === decision) return;
  if (current.status !== 'pending') {
    throw new Error('This creator submission has already been reviewed. Refresh the review queue.');
  }

  if (decision === 'approved') {
    const copiedPaths: string[] = [];
    let clipPublished = false;
    try {
      const { data: videoFile, error: videoDownloadError } = await supabase.storage
        .from('cinema-creator-submissions')
        .download(submission.video_path);
      if (videoDownloadError || !videoFile) throw videoDownloadError ?? new Error('The submitted video could not be read.');
      const { error: videoCopyError } = await supabase.storage
        .from('cinema-shorts')
        .upload(submission.video_path, videoFile, { contentType: videoFile.type || 'video/mp4', upsert: true });
      if (videoCopyError) throw videoCopyError;
      copiedPaths.push(submission.video_path);

      let posterUrl = '';
      if (submission.poster_path) {
        const { data: posterFile, error: posterDownloadError } = await supabase.storage
          .from('cinema-creator-submissions')
          .download(submission.poster_path);
        if (posterDownloadError || !posterFile) throw posterDownloadError ?? new Error('The submitted poster could not be read.');
        const { error: posterCopyError } = await supabase.storage
          .from('cinema-shorts')
          .upload(submission.poster_path, posterFile, { contentType: posterFile.type || 'image/jpeg', upsert: true });
        if (posterCopyError) throw posterCopyError;
        copiedPaths.push(submission.poster_path);
        posterUrl = supabase.storage.from('cinema-shorts').getPublicUrl(submission.poster_path).data.publicUrl;
      }

      const videoUrl = supabase.storage.from('cinema-shorts').getPublicUrl(submission.video_path).data.publicUrl;
      const { data: existingClip, error: existingClipError } = await supabase
        .from('discover_clips')
        .select('id')
        .eq('video_url', videoUrl)
        .limit(1)
        .maybeSingle();
      if (existingClipError) throw existingClipError;

      if (existingClip) {
        clipPublished = true;
      } else {
        const { error: clipError } = await supabase.from('discover_clips').insert({
          kind: 'short',
          headline: submission.headline,
          description: submission.description,
          video_url: videoUrl,
          poster_url: posterUrl,
          publisher_name: submission.publisher_name,
          title_id: submission.title_id,
          duration_seconds: submission.duration_seconds,
          sort_order: 0,
          is_published: true,
        });
        if (clipError) throw clipError;
        clipPublished = true;
      }
    } catch (error) {
      // Retain the existing cleanup safeguard: only remove copied media when
      // no published Discover clip references those files.
      if (!clipPublished && copiedPaths.length) {
        const { error: cleanupError } = await supabase.storage.from('cinema-shorts').remove(copiedPaths);
        if (cleanupError) console.warn('Unpublished creator media cleanup could not complete', cleanupError);
      }
      throw error;
    }
  }

  const { data: updated, error } = await supabase
    .from('creator_short_submissions')
    .update({
      status: decision,
      review_note: reviewNote,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', submission.id)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!updated) {
    const { data: latest, error: latestError } = await supabase
      .from('creator_short_submissions')
      .select('status')
      .eq('id', submission.id)
      .maybeSingle();
    if (latestError) throw latestError;
    if (latest?.status !== decision) {
      throw new Error('The creator submission changed during review. Refresh the queue before trying again.');
    }
  }
}
