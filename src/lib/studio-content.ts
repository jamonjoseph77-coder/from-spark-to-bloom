import { supabase } from '@/lib/supabase';

export type StudioTitleSubmissionStatus = 'pending' | 'changes_requested' | 'approved' | 'rejected';
export type StudioContentType = 'movie' | 'series' | 'sport' | 'news' | 'live';
export type StudioRightsBasis = 'owned' | 'exclusive_license' | 'non_exclusive_license' | 'distribution_agreement' | 'commissioned' | 'other_authorised';

export interface StudioTitleSubmissionInput {
  studio_id: string;
  submitted_by: string;
  content_type: StudioContentType;
  title: string;
  synopsis: string;
  genre: string;
  release_year: number | null;
  duration_minutes: number | null;
  poster_url: string;
  backdrop_url: string | null;
  trailer_url: string | null;
  playback_url: string | null;
  rights_holder: string;
  rights_basis: StudioRightsBasis;
  territories: string[];
  languages: string[];
  platforms: string[];
  rights_start: string | null;
  rights_end: string | null;
  is_exclusive: boolean;
  promotional_rights_confirmed: boolean;
  rights_evidence_url: string | null;
  delivery_notes: string;
}

export interface StudioTitleSubmission extends StudioTitleSubmissionInput {
  id: string;
  status: StudioTitleSubmissionStatus;
  review_note: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

const SUBMISSION_FIELDS = 'id,studio_id,submitted_by,content_type,title,synopsis,genre,release_year,duration_minutes,poster_url,backdrop_url,trailer_url,playback_url,rights_holder,rights_basis,territories,languages,platforms,rights_start,rights_end,is_exclusive,promotional_rights_confirmed,rights_evidence_url,delivery_notes,status,review_note,reviewed_at,reviewed_by,created_at,updated_at';

export async function submitStudioTitle(input: StudioTitleSubmissionInput): Promise<StudioTitleSubmission> {
  const { data, error } = await supabase
    .from('studio_title_submissions')
    .insert(input)
    .select(SUBMISSION_FIELDS)
    .single();
  if (error) throw error;
  return data as StudioTitleSubmission;
}

export async function fetchMyStudioTitleSubmissions(studioId: string): Promise<StudioTitleSubmission[]> {
  if (!studioId) return [];
  const { data, error } = await supabase
    .from('studio_title_submissions')
    .select(SUBMISSION_FIELDS)
    .eq('studio_id', studioId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as StudioTitleSubmission[];
}

export async function fetchStudioTitleSubmissionsForReview(): Promise<StudioTitleSubmission[]> {
  const { data, error } = await supabase
    .from('studio_title_submissions')
    .select(SUBMISSION_FIELDS)
    .order('created_at', { ascending: true })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as StudioTitleSubmission[];
}

export async function reviewStudioTitleSubmission(
  submissionId: string,
  status: Exclude<StudioTitleSubmissionStatus, 'pending'>,
  reviewNote: string,
): Promise<void> {
  const { data: userResult, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userResult.user) throw new Error('Sign in as a Cinema administrator to review submissions.');
  const { error } = await supabase
    .from('studio_title_submissions')
    .update({
      status,
      review_note: reviewNote.trim(),
      reviewed_at: new Date().toISOString(),
      reviewed_by: userResult.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', submissionId);
  if (error) throw error;
}
