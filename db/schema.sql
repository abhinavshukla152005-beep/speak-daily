-- ============================================================
-- SpeakDaily — Supabase schema
-- Run this ENTIRE file ONCE in the Supabase SQL Editor of
-- project evmxccqikofqlayksvqf (Dashboard -> SQL Editor).
-- After this, every new signup automatically gets its rows
-- created by the handle_new_user() trigger.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Tables
-- ------------------------------------------------------------

create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  name       text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles (id) on delete cascade,
  topic            text not null,
  transcript       text not null default '',
  duration_seconds integer not null default 0,
  word_count       integer not null default 0,
  wpm              integer not null default 0,
  filler_count     integer not null default 0,
  score            integer not null default 0,
  created_at       timestamptz not null default now()
);

create index if not exists sessions_user_idx
  on public.sessions (user_id, created_at desc);

-- ------------------------------------------------------------
-- Row Level Security — each user sees only their own data
-- ------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.sessions enable row level security;

drop policy if exists "own profile readable" on public.profiles;
create policy "own profile readable"
  on public.profiles for select using (auth.uid() = id);

drop policy if exists "own sessions readable" on public.sessions;
create policy "own sessions readable"
  on public.sessions for select using (auth.uid() = user_id);

drop policy if exists "own sessions insertable" on public.sessions;
create policy "own sessions insertable"
  on public.sessions for insert with check (auth.uid() = user_id);

drop policy if exists "own sessions deletable" on public.sessions;
create policy "own sessions deletable"
  on public.sessions for delete using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- Auto-create a profile row when a new user signs up
-- ------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, name)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Done. New signups are handled automatically from now on.
