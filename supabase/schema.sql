-- Run this once in Supabase: SQL Editor -> New query -> paste -> Run
create table if not exists public.pages (
  id         text primary key,
  name       text not null default 'Untitled',
  content    text not null default '',
  chars      integer not null default 0,
  paste_n    integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Lock the table: only the server (service_role key) can touch it.
alter table public.pages enable row level security;
