-- New public-schema functions must opt in to browser/API execution explicitly.
-- Existing RPC permissions are unchanged by ALTER DEFAULT PRIVILEGES.

alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated;
