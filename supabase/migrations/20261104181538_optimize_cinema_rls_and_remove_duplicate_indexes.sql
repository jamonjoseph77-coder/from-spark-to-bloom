-- Cache auth.uid() once per statement in the remaining RLS policies.
-- This preserves the existing access predicates and policy roles.

alter policy "Creators read own Shorts submissions" on public."creator_short_submissions"
  using (((user_id = (select auth.uid())) OR is_cinema_admin()));

alter policy "Creators submit own Shorts" on public."creator_short_submissions"
  with check (((user_id = (select auth.uid())) AND (status = 'pending'::text) AND (reviewed_at IS NULL)));

alter policy "People can read comments on visible Letterbox posts" on public."letterbox_comments"
  using (((status = 'published'::text) AND (EXISTS ( SELECT 1
   FROM letterbox_posts p
  WHERE ((p.id = letterbox_comments.post_id) AND (p.status = 'published'::text) AND ((p.visibility = 'public'::text) OR (p.author_id = (select auth.uid())) OR ((p.visibility = 'friends'::text) AND (EXISTS ( SELECT 1
           FROM friendships f
          WHERE ((f.status = 'accepted'::text) AND (((f.requester_id = (select auth.uid())) AND (f.addressee_id = p.author_id)) OR ((f.addressee_id = (select auth.uid())) AND (f.requester_id = p.author_id)))))))))))));

alter policy "Users comment on visible Letterbox posts" on public."letterbox_comments"
  with check (((author_id = (select auth.uid())) AND (status = 'published'::text) AND (EXISTS ( SELECT 1
   FROM letterbox_posts p
  WHERE ((p.id = letterbox_comments.post_id) AND (p.status = 'published'::text))))));

alter policy "Users delete their own Letterbox comments" on public."letterbox_comments"
  using ((author_id = (select auth.uid())));

alter policy "People can read published Letterbox posts" on public."letterbox_posts"
  using (((status = 'published'::text) AND ((visibility = 'public'::text) OR (author_id = (select auth.uid())) OR ((visibility = 'friends'::text) AND (EXISTS ( SELECT 1
   FROM friendships f
  WHERE ((f.status = 'accepted'::text) AND (((f.requester_id = (select auth.uid())) AND (f.addressee_id = letterbox_posts.author_id)) OR ((f.addressee_id = (select auth.uid())) AND (f.requester_id = letterbox_posts.author_id))))))))));

alter policy "Users create their own Letterbox posts" on public."letterbox_posts"
  with check (((author_id = (select auth.uid())) AND (status = 'published'::text)));

alter policy "Users delete their own Letterbox posts" on public."letterbox_posts"
  using ((author_id = (select auth.uid())));

alter policy "Users edit their own Letterbox posts" on public."letterbox_posts"
  using ((author_id = (select auth.uid())))
  with check ((author_id = (select auth.uid())));

alter policy "People can read reactions on visible Letterbox posts" on public."letterbox_reactions"
  using ((EXISTS ( SELECT 1
   FROM letterbox_posts p
  WHERE ((p.id = letterbox_reactions.post_id) AND (p.status = 'published'::text) AND ((p.visibility = 'public'::text) OR (p.author_id = (select auth.uid())) OR ((p.visibility = 'friends'::text) AND (EXISTS ( SELECT 1
           FROM friendships f
          WHERE ((f.status = 'accepted'::text) AND (((f.requester_id = (select auth.uid())) AND (f.addressee_id = p.author_id)) OR ((f.addressee_id = (select auth.uid())) AND (f.requester_id = p.author_id))))))))))));

alter policy "Users react to visible Letterbox posts" on public."letterbox_reactions"
  with check (((user_id = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM letterbox_posts p
  WHERE ((p.id = letterbox_reactions.post_id) AND (p.status = 'published'::text))))));

alter policy "Users remove their own reactions" on public."letterbox_reactions"
  using ((user_id = (select auth.uid())));

alter policy "Users mark their own notifications as read" on public."notifications"
  using ((user_id = (select auth.uid())))
  with check ((user_id = (select auth.uid())));

alter policy "Users read their own notifications" on public."notifications"
  using ((user_id = (select auth.uid())));

alter policy "Users can apply for studio verification" on public."studio_accounts"
  with check (((owner_id = (select auth.uid())) AND (verification_status = 'pending'::text) AND (verified_at IS NULL)));

-- Remove redundant non-constraint unique indexes; the primary-key indexes
-- already enforce the same (user_id, content_id) uniqueness.
drop index if exists public.watch_progress_user_content_uidx;
drop index if exists public.watchlist_user_content_uidx;
