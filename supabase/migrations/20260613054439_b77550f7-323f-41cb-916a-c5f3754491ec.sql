
CREATE TABLE public.global_trends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text,
  category text NOT NULL,
  sub_tags text[] NOT NULL DEFAULT '{}',
  platform_signals text[] NOT NULL DEFAULT '{}',
  source_url text,
  source_name text,
  published_at timestamptz,
  synced_at timestamptz NOT NULL DEFAULT now(),
  popularity int NOT NULL DEFAULT 50,
  freshness int NOT NULL DEFAULT 50,
  content_ready boolean NOT NULL DEFAULT true,
  dedup_key text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.global_trends TO authenticated;
GRANT ALL ON public.global_trends TO service_role;
ALTER TABLE public.global_trends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trends readable by authenticated" ON public.global_trends
  FOR SELECT TO authenticated USING (true);

CREATE INDEX idx_global_trends_category ON public.global_trends(category);
CREATE INDEX idx_global_trends_synced_at ON public.global_trends(synced_at DESC);
CREATE INDEX idx_global_trends_popularity ON public.global_trends(popularity DESC);

CREATE TABLE public.trend_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running',
  trends_added int NOT NULL DEFAULT 0,
  error_msg text
);
GRANT SELECT ON public.trend_sync_runs TO authenticated;
GRANT ALL ON public.trend_sync_runs TO service_role;
ALTER TABLE public.trend_sync_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sync runs readable by authenticated" ON public.trend_sync_runs
  FOR SELECT TO authenticated USING (true);
