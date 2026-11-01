-- Allow authorised Cinema administrators to inspect pending and previously reviewed studio applications.
-- Public visitors can still read only explicitly verified studio records.
create policy "Cinema admins can review studio applications"
on public.studio_accounts
for select
to authenticated
using (public.is_cinema_admin());
