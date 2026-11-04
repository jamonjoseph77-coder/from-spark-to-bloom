-- Index foreign-key columns used by Explore content engagement.
create index if not exists discover_content_comments_author_idx on public.discover_content_comments(author_id);
create index if not exists discover_content_reactions_user_idx on public.discover_content_reactions(user_id);
