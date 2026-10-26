-- Run in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run: every statement is idempotent.

-- One row per user holding their synced lists (see src/utils/sync.js).
create table if not exists public.user_state (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  doc jsonb not null,
  version integer not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.user_state enable row level security;

grant select, insert, update on public.user_state to authenticated;

drop policy if exists "Users read their own state" on public.user_state;
create policy "Users read their own state"
  on public.user_state for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users create their own state" on public.user_state;
create policy "Users create their own state"
  on public.user_state for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users update their own state" on public.user_state;
create policy "Users update their own state"
  on public.user_state for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Version history: earlier copies of user_state.doc, restorable from the Sync dialog.
-- The app saves every couple of seconds while editing, so keep at most one copy
-- per 10 minutes, and the newest 100 copies per user.
create table if not exists public.user_state_history (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  version integer not null,
  doc jsonb not null,
  list_count integer not null,
  item_count integer not null,
  saved_at timestamptz not null
);

create index if not exists user_state_history_user_id_idx
  on public.user_state_history (user_id, id desc);

alter table public.user_state_history enable row level security;

grant select on public.user_state_history to authenticated;

drop policy if exists "Users read their own history" on public.user_state_history;
create policy "Users read their own history"
  on public.user_state_history for select to authenticated
  using ((select auth.uid()) = user_id);

-- security definer: users can't write history directly, only through this trigger.
create or replace function public.keep_user_state_history()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Server clock, so the 10-minute spacing doesn't depend on device clocks.
  new.updated_at := now();

  if not exists (
    select 1 from public.user_state_history
    where user_id = old.user_id and saved_at > old.updated_at - interval '10 minutes'
  ) then
    insert into public.user_state_history (user_id, version, doc, list_count, item_count, saved_at)
    select
      old.user_id,
      old.version,
      old.doc,
      coalesce(jsonb_array_length(old.doc -> 'lists'), 0),
      coalesce((select sum(jsonb_array_length(l -> 'items'))
                from jsonb_array_elements(old.doc -> 'lists') as l), 0),
      old.updated_at;

    delete from public.user_state_history
    where user_id = old.user_id
      and id not in (
        select id from public.user_state_history
        where user_id = old.user_id
        order by id desc
        limit 100
      );
  end if;
  return new;
end;
$$;

drop trigger if exists keep_user_state_history on public.user_state;
create trigger keep_user_state_history
  before update on public.user_state
  for each row execute function public.keep_user_state_history();

-- Devices subscribed to the daily reminder (web push). Written by the app,
-- read and updated by the send-reminders edge function using the service key.
create table if not exists public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  p256dh text not null,
  auth text not null,
  time_zone text not null,
  last_sent_on date,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

grant select, insert, update, delete on public.push_subscriptions to authenticated;

drop policy if exists "Users manage their own push subscriptions" on public.push_subscriptions;
create policy "Users manage their own push subscriptions"
  on public.push_subscriptions for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
