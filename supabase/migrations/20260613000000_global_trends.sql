-- Global trends: shared across all users, synced from live web sources

create table if not exists public.global_trends (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  summary       text not null,
  category      text not null,
  sub_tags      text[] default '{}',
  platform_signals text[] default '{}',
  source_url    text,
  source_name   text,
  published_at  timestamptz,
  synced_at     timestamptz not null default now(),
  popularity    int not null default 50 check (popularity between 0 and 100),
  freshness     int not null default 50 check (freshness between 0 and 100),
  content_ready boolean not null default true,
  dedup_key     text unique -- title+category hash for deduplication
);

-- Track sync runs so UI can show "last synced X min ago"
create table if not exists public.trend_sync_runs (
  id          uuid primary key default gen_random_uuid(),
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  status      text not null default 'running' check (status in ('running','success','error')),
  trends_added int not null default 0,
  error_msg   text
);

-- Indexes
create index if not exists global_trends_category_idx on public.global_trends (category);
create index if not exists global_trends_synced_at_idx on public.global_trends (synced_at desc);
create index if not exists global_trends_popularity_idx on public.global_trends (popularity desc);

-- Enable RLS — all authenticated users can read trends, nobody can write directly
alter table public.global_trends enable row level security;
alter table public.trend_sync_runs enable row level security;

drop policy if exists "trends_read" on public.global_trends;
create policy "trends_read" on public.global_trends
  for select using (auth.uid() is not null);

drop policy if exists "sync_runs_read" on public.trend_sync_runs;
create policy "sync_runs_read" on public.trend_sync_runs
  for select using (auth.uid() is not null);

-- Service-role bypass (needed for server-side upserts via the anon API call from the sync function)
grant select on public.global_trends to anon;
grant select on public.trend_sync_runs to anon;
