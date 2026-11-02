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
}

export async function fetchPendingCreatorShorts(): Promise<CreatorShortSubmission[]> {
  const { data, error } = await supabase
    .from('creator_short_submissions')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as CreatorShortSubmission[];
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

export async function reviewCreatorShort(
  submission: CreatorShortSubmission,
  decision: 'approved' | 'rejected',
  reviewNote = '',
): Promise<void> {
  if (decision === 'approved') {
    const { data } = supabase.storage.from('cinema-shorts').getPublicUrl(submission.video_path);
    const posterUrl = submission.poster_path
      ? supabase.storage.from('cinema-shorts').getPublicUrl(submission.poster_path).data.publicUrl
      : '';
    const { error: clipError } = await supabase.from('discover_clips').insert({
      kind: 'short',
      headline: submission.headline,
      description: submission.description,
      video_url: data.publicUrl,
      poster_url: posterUrl,
      publisher_name: submission.publisher_name,
      title_id: submission.title_id,
      duration_seconds: submission.duration_seconds,
      sort_order: 0,
      is_published: true,
    });
    if (clipError) throw clipError;
  }

  const { error } = await supabase
    .from('creator_short_submissions')
    .update({
      status: decision,
      review_note: reviewNote,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', submission.id)
    .eq('status', 'pending');
  if (error) throw error;
}
