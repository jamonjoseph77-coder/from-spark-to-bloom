-- Read-only regression checks. All six results should be true.
select
  not has_table_privilege('authenticated', 'public.friendships', 'UPDATE') as no_table_wide_update,
  has_column_privilege('authenticated', 'public.friendships', 'status', 'UPDATE') as can_accept_status,
  has_column_privilege('authenticated', 'public.friendships', 'updated_at', 'UPDATE') as can_set_timestamp,
  not has_column_privilege('authenticated', 'public.friendships', 'requester_id', 'UPDATE') as cannot_rewrite_requester,
  not has_column_privilege('authenticated', 'public.friendships', 'addressee_id', 'UPDATE') as cannot_rewrite_addressee,
  not has_table_privilege('anon', 'public.friendships', 'UPDATE') as anonymous_cannot_update;
