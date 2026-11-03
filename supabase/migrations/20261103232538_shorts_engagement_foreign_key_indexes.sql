-- Cover the author/user foreign keys on Shorts engagement rows.
create index if not exists discover_clip_comments_author_idx on public.discover_clip_comments(author_id);
create index if not exists discover_clip_reactions_user_idx on public.discover_clip_reactions(user_id);
