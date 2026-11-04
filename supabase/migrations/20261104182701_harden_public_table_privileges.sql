-- Remove table-level privileges that browser/API roles do not need.
-- In particular, TRUNCATE bypasses row-level security.

revoke truncate, references, trigger, maintain
  on all tables in schema public
  from anon, authenticated;

-- Keep future tables from inheriting these elevated privileges.
alter default privileges for role postgres in schema public
  revoke truncate, references, trigger, maintain
  on tables from anon, authenticated;
