-- Migration: Update locked founder name to Hammad Ullah (with space)
-- Safe to run in Supabase SQL Editor or migration runner.

do $$
begin
  -- Temporarily disable the locked team member trigger so we can update the founder name
  alter table public.team_members disable trigger protect_locked_team_members;

  update public.team_members
  set name = 'Hammad Ullah'
  where slug = 'hammadullah';

  -- Re-enable the trigger
  alter table public.team_members enable trigger protect_locked_team_members;
end $$;
