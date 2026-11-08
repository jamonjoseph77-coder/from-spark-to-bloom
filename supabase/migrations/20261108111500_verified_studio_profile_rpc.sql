-- Allow verified studio owners to edit only their public profile fields.
-- SECURITY DEFINER is narrowly scoped: caller identity comes from auth.uid(),
-- and the update cannot change ownership, studio name, or verification state.

create or replace function public.update_my_verified_studio_profile(
  p_description text,
  p_website_url text default null,
  p_logo_url text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_owner_id uuid := auth.uid();
  v_updated_rows integer;
begin
  if v_owner_id is null then
    raise exception 'Authentication is required to update a studio profile.';
  end if;

  if length(btrim(coalesce(p_description, ''))) < 20
     or length(btrim(coalesce(p_description, ''))) > 1200 then
    raise exception 'Studio description must be between 20 and 1200 characters.';
  end if;

  if p_website_url is not null
     and (length(p_website_url) > 2048 or p_website_url !~* '^https://') then
    raise exception 'Studio website must use HTTPS.';
  end if;

  if p_logo_url is not null
     and (length(p_logo_url) > 2048 or p_logo_url !~* '^https://') then
    raise exception 'Studio logo URL must use HTTPS.';
  end if;

  update public.studio_accounts
  set
    description = btrim(p_description),
    website_url = nullif(btrim(p_website_url), ''),
    logo_url = nullif(btrim(p_logo_url), ''),
    updated_at = now()
  where owner_id = v_owner_id
    and verification_status = 'verified';

  get diagnostics v_updated_rows = row_count;
  return v_updated_rows > 0;
end;
$function$;

revoke all on function public.update_my_verified_studio_profile(text, text, text) from public;
revoke all on function public.update_my_verified_studio_profile(text, text, text) from anon;
grant execute on function public.update_my_verified_studio_profile(text, text, text) to authenticated;
