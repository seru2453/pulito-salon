create extension if not exists pgcrypto;

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kana text not null,
  phone text not null,
  email text not null,
  service text not null,
  preferred_date date not null,
  preferred_time text not null,
  note text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'completed', 'canceled')),
  created_at timestamptz not null default now()
);

create index if not exists reservations_preferred_date_idx
on public.reservations (preferred_date, preferred_time);

create index if not exists reservations_status_idx
on public.reservations (status);

create table if not exists public.reservation_blocks (
  id uuid primary key default gen_random_uuid(),
  blocked_date date not null,
  blocked_time text not null,
  reason text,
  created_at timestamptz not null default now(),
  unique (blocked_date, blocked_time)
);

create index if not exists reservation_blocks_date_idx
on public.reservation_blocks (blocked_date, blocked_time);

alter table public.reservations enable row level security;
alter table public.reservation_blocks enable row level security;

drop policy if exists "service role can manage reservations" on public.reservations;

create policy "service role can manage reservations"
on public.reservations
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "service role can manage reservation blocks" on public.reservation_blocks;

create policy "service role can manage reservation blocks"
on public.reservation_blocks
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
