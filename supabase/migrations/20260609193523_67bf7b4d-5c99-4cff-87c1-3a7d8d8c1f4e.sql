
ALTER TABLE public.threads ADD COLUMN IF NOT EXISTS context_brief text;
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS folder text;

CREATE TABLE IF NOT EXISTS public.presets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  niche text,
  audience text,
  tone text,
  language text DEFAULT 'Hinglish',
  default_voice_id text,
  default_voice_name text,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.presets TO authenticated;
GRANT ALL ON public.presets TO service_role;

ALTER TABLE public.presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own presets" ON public.presets
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER presets_touch_updated_at
  BEFORE UPDATE ON public.presets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
