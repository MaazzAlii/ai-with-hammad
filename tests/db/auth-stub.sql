-- Minimal stand-in for Supabase's auth schema used by the isolated DB tests.
-- (E2E tests use the real GoTrue migrations instead.)
create table if not exists auth.users (
  id uuid primary key,
  email varchar(255),
  raw_user_meta_data jsonb,
  created_at timestamptz default now()
);
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(
    coalesce(current_setting('request.jwt.claim.sub', true),
             (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')), ''
  )::uuid
$$;
grant execute on function auth.uid() to anon, authenticated, service_role;
