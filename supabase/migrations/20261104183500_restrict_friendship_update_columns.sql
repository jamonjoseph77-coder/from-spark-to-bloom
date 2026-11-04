-- An accepted friend request may only change its status and timestamp.
-- RLS already limits the update to the request's addressee; column grants prevent
-- that member from rewriting requester_id or addressee_id to forge another link.
revoke update on table public.friendships from public, anon, authenticated;
grant update (status, updated_at) on table public.friendships to authenticated;
