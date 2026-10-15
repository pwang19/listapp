-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- One row per user holding their synced lists (see src/utils/sync.js).

create table if not exists public.user_state (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  doc jsonb not null,
  version integer not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.user_state enable row level security;

grant select, insert, update on public.user_state to authenticated;

create policy "Users read their own state"
  on public.user_state for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users create their own state"
  on public.user_state for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users update their own state"
  on public.user_state for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
