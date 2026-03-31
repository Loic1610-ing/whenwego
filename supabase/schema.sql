-- ─────────────────────────────────────────────────────────────────
-- WhenWeGo — Supabase Schema
-- Run this in Supabase → SQL Editor
-- ─────────────────────────────────────────────────────────────────

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─── events ──────────────────────────────────────────────────────
create table if not exists events (
  id            text primary key,           -- 6-char code ex: "AB3X9K"
  title         text        not null,
  organizer     text        not null,
  organizer_pwd text        not null,       -- hashed with pgcrypto
  start_date    date        not null,
  end_date      date        not null,
  trip_min      int         not null default 5,
  trip_max      int         not null default 7,
  created_at    timestamptz not null default now()
);

-- ─── responses ───────────────────────────────────────────────────
create table if not exists responses (
  id           uuid primary key default gen_random_uuid(),
  event_id     text not null references events(id) on delete cascade,
  name         text not null,
  -- ranges: [{start: "YYYY-MM-DD", end: "YYYY-MM-DD"}]
  ranges       jsonb not null default '[]',
  -- destinations: [{country, flag, cities:[]}]
  destinations jsonb not null default '[]',
  budget       text,
  submitted_at timestamptz not null default now()
);

-- ─── Indexes ─────────────────────────────────────────────────────
create index if not exists responses_event_id_idx on responses(event_id);

-- ─── Row Level Security ──────────────────────────────────────────
alter table events    enable row level security;
alter table responses enable row level security;

-- Anyone can read events (needed to join with a code)
create policy "public read events"
  on events for select using (true);

-- Anyone can insert events (organizer creates one)
create policy "public insert events"
  on events for insert with check (true);

-- Anyone can read responses for a given event
create policy "public read responses"
  on responses for select using (true);

-- Anyone can insert a response
create policy "public insert responses"
  on responses for insert with check (true);

-- Only allow delete/update via service role (admin actions go through API route)
-- (no client-side delete policy — handled server-side with service key)

-- ─── Realtime ────────────────────────────────────────────────────
-- Enable realtime on responses table in Supabase dashboard:
-- Database → Replication → responses → toggle on
-- (cannot be done via SQL, must be done in dashboard)
