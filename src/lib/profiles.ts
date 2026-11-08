import { supabase } from '@/lib/supabase';
import type { Profile, ProfileInput } from '@/lib/types';

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return (data ?? null) as Profile | null;
}

export async function fetchProfileByUsername(username: string): Promise<Profile | null> {
  const clean = username.trim().toLowerCase();
  if (!clean) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('username', clean).maybeSingle();
  if (error) throw error;
  return (data ?? null) as Profile | null;
}

export async function fetchDiscoverableProfileByDisplayName(displayName: string): Promise<Profile | null> {
  const clean = displayName.trim();
  if (!clean) return null;
  const escaped = clean.replace(/[\\%_]/g, '\\$&');
  const { data, error } = await supabase.from('profiles').select('*')
    .eq('is_discoverable', true)
    .ilike('display_name', escaped)
    .limit(2);
  if (error) throw error;
  // A display name is not a unique identifier. Never attach the wrong
  // member's avatar when two discoverable profiles share the same name.
  return data?.length === 1 ? data[0] as Profile : null;
}

export async function fetchProfilesByIds(userIds: string[]): Promise<Profile[]> {
  if (userIds.length === 0) return [];
  const { data, error } = await supabase.from('profiles').select('*').in('user_id', userIds);
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function searchProfiles(term: string, excludeUserId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_discoverable', true)
    .ilike('username', `%${term}%`)
    .neq('user_id', excludeUserId)
    .order('username', { ascending: true })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function saveProfile(userId: string, input: ProfileInput, exists: boolean): Promise<Profile> {
  const { data, error } = exists
    ? await supabase
        .from('profiles')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .select()
        .single()
    : await supabase.from('profiles').insert({ id: userId, user_id: userId, ...input }).select().single();
  if (error) throw error;
  return data as Profile;
}
