-- Run this in the Supabase SQL editor for your project
-- (Dashboard → SQL Editor → New query → paste → Run)

-- ----------------------------------------------------------------
-- time_entries
-- ----------------------------------------------------------------
create table if not exists public.time_entries (
  id          uuid        primary key default gen_random_uuid(),
  user_id     text        not null default 'default',
  start       bigint      not null,          -- Unix ms
  "end"       bigint      not null,          -- Unix ms
  duration    int         not null,          -- seconds
  label       text        not null default '',
  project     text        not null default 'General',
  invoiced    boolean     not null default false,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- user_settings
-- ----------------------------------------------------------------
create table if not exists public.user_settings (
  id          text        primary key,       -- 'default' for single-user
  projects    jsonb       not null default '["General"]',
  theme       text        not null default 'light',
  running     jsonb                          -- nullable — stores in-progress timer
);

-- ----------------------------------------------------------------
-- Row Level Security
-- Permissive for now (single-user, no auth). Replace policies
-- with auth.uid()-based checks when you add real authentication.
-- ----------------------------------------------------------------
alter table public.time_entries  enable row level security;
alter table public.user_settings enable row level security;

-- Allow all operations for the anon key (single-user mode)
create policy "anon full access to time_entries"
  on public.time_entries
  for all
  to anon
  using (true)
  with check (true);

create policy "anon full access to user_settings"
  on public.user_settings
  for all
  to anon
  using (true)
  with check (true);

-- ----------------------------------------------------------------
-- Index for common query pattern
-- ----------------------------------------------------------------
create index if not exists time_entries_user_id_start_idx
  on public.time_entries (user_id, start desc);
