import { supabase } from '@/lib/supabase';

export type StudioVerificationStatus = 'pending' | 'verified' | 'rejected' | 'suspended';

export interface StudioAccount {
  id: string;
  owner_id: string;
  studio_name: string;
  description: string;
  website_url: string | null;
  logo_url: string | null;
  verification_status: StudioVerificationStatus;
  verified_at: string | null;
  created_at?: string;
  updated_at?: string;
}

const STUDIO_FIELDS = 'id,owner_id,studio_name,description,website_url,logo_url,verification_status,verified_at,created_at,updated_at';

export async function fetchVerifiedStudios(): Promise<StudioAccount[]> {
  const { data, error } = await supabase
    .from('studio_accounts')
    .select(STUDIO_FIELDS)
    .eq('verification_status', 'verified')
    .order('studio_name');
  if (error) throw error;
  return (data ?? []) as StudioAccount[];
}

export async function findVerifiedStudio(name: string): Promise<StudioAccount | null> {
  const { data, error } = await supabase
    .from('studio_accounts')
    .select(STUDIO_FIELDS)
    .eq('verification_status', 'verified')
    .ilike('studio_name', name)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as StudioAccount | null;
}

export async function fetchStudioApplications(): Promise<StudioAccount[]> {
  const { data, error } = await supabase
    .from('studio_accounts')
    .select(STUDIO_FIELDS)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as StudioAccount[];
}

export async function setStudioVerificationStatus(
  studioId: string,
  status: Exclude<StudioVerificationStatus, 'pending'>,
): Promise<void> {
  const { error } = await supabase
    .from('studio_accounts')
    .update({
      verification_status: status,
      verified_at: status === 'verified' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', studioId);
  if (error) throw error;
}

export async function fetchMyStudioApplication(ownerId: string): Promise<StudioAccount | null> {
  const { data, error } = await supabase
    .from('studio_accounts')
    .select(STUDIO_FIELDS)
    .eq('owner_id', ownerId)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as StudioAccount | null;
}

export interface StudioApplicationInput {
  owner_id: string;
  studio_name: string;
  description: string;
  website_url: string | null;
  logo_url: string | null;
}

export async function submitStudioApplication(input: StudioApplicationInput): Promise<StudioAccount> {
  const { data, error } = await supabase
    .from('studio_accounts')
    .insert({ ...input, verification_status: 'pending', verified_at: null })
    .select(STUDIO_FIELDS)
    .single();
  if (error) throw error;
  return data as StudioAccount;
}

export async function updateMyVerifiedStudioProfile(
  ownerId: string,
  input: Pick<StudioApplicationInput, 'description' | 'website_url' | 'logo_url'>,
): Promise<void> {
  if (!ownerId) throw new Error('Sign in to update this studio profile.');
  if (input.description.trim().length < 20) throw new Error('Add a description of at least 20 characters.');
  const { data, error } = await supabase.rpc('update_my_verified_studio_profile', {
    p_description: input.description.trim(),
    p_website_url: input.website_url,
    p_logo_url: input.logo_url,
  });
  if (error) throw error;
  if (data !== true) throw new Error('Only the verified studio account owner can edit this official profile.');
}
