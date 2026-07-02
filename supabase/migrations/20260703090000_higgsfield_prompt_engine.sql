-- Higgsfield UGC Prompt Engine
-- Non-destructive schema: the existing public.scripts table is preserved and extended only
-- with optional metadata columns so current Vidzo content-pack flows keep working.

alter table public.scripts
  add column if not exists engine text not null default 'content_pack',
  add column if not exists source_render_id uuid,
  add column if not exists prompt_schema jsonb,
  add column if not exists model_route jsonb;

create table if not exists public.personas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  persona_key text not null,
  persona_name text not null,
  age int not null check (age between 16 and 75),
  gender text not null,
  accent text not null,
  energy text not null,
  trust_level text not null,
  creator_style text not null,
  speaking_speed text not null,
  tone text not null,
  appearance text not null,
  is_default boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint personas_owner_for_custom check (is_default or user_id is not null)
);

create table if not exists public.hooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  render_history_id uuid,
  category text not null,
  platform text not null,
  hook text not null,
  predicted_engagement_score int not null check (predicted_engagement_score between 0 and 100),
  reason text,
  intelligence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.camera_presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  preset_key text not null,
  preset_name text not null,
  camera_type text not null,
  lens text not null,
  movement text not null,
  framing text not null,
  focus text not null,
  best_for text[] not null default '{}',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint camera_presets_owner_for_custom check (is_default or user_id is not null)
);

create table if not exists public.motion_presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  preset_key text not null,
  primary_motion text not null,
  secondary_motion text not null,
  intensity text not null check (intensity in ('subtle', 'medium', 'aggressive')),
  instructions text not null,
  timing text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint motion_presets_owner_for_custom check (is_default or user_id is not null)
);

create table if not exists public.negative_prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  model text not null,
  items text[] not null default '{}',
  prompt text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint negative_prompts_owner_for_custom check (is_default or user_id is not null)
);

create table if not exists public.render_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  engine text not null default 'higgsfield_ugc',
  status text not null default 'prompt_ready',
  product_name text not null,
  brief text not null,
  request jsonb not null default '{}'::jsonb,
  intelligence jsonb not null default '{}'::jsonb,
  intent jsonb not null default '{}'::jsonb,
  persona jsonb not null default '{}'::jsonb,
  script jsonb not null default '{}'::jsonb,
  camera jsonb not null default '{}'::jsonb,
  motion jsonb not null default '{}'::jsonb,
  negative_prompt jsonb not null default '{}'::jsonb,
  model_route jsonb not null default '{}'::jsonb,
  prompt_schema jsonb not null default '{}'::jsonb,
  compiled_prompt text not null,
  output_format text not null default '9:16',
  duration_seconds int not null check (duration_seconds between 1 and 300),
  platform text not null,
  generation jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.generated_variations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  render_history_id uuid references public.render_history(id) on delete cascade,
  variation_index int not null check (variation_index between 1 and 20),
  title text not null,
  score int not null check (score between 0 and 100),
  persona jsonb not null default '{}'::jsonb,
  hook jsonb not null default '{}'::jsonb,
  script jsonb not null default '{}'::jsonb,
  camera jsonb not null default '{}'::jsonb,
  motion jsonb not null default '{}'::jsonb,
  cta text not null,
  model_route jsonb not null default '{}'::jsonb,
  prompt_schema jsonb not null default '{}'::jsonb,
  compiled_prompt text not null,
  created_at timestamptz not null default now(),
  unique (render_history_id, variation_index)
);

create table if not exists public.higgsfield_scripts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  render_history_id uuid references public.render_history(id) on delete cascade,
  framework text not null,
  style text not null,
  hook text not null,
  problem text not null,
  solution text not null,
  proof text not null,
  cta text not null,
  full_script text not null,
  duration_seconds int not null check (duration_seconds between 1 and 300),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.hooks
  add constraint hooks_render_history_id_fkey
  foreign key (render_history_id)
  references public.render_history(id)
  on delete cascade
  not valid;

alter table public.hooks validate constraint hooks_render_history_id_fkey;

create unique index if not exists personas_default_key_idx
  on public.personas (persona_key)
  where user_id is null;
create index if not exists personas_user_idx on public.personas (user_id, created_at desc);

create index if not exists hooks_user_created_idx on public.hooks (user_id, created_at desc);
create index if not exists hooks_platform_score_idx on public.hooks (platform, predicted_engagement_score desc);

create unique index if not exists camera_presets_default_key_idx
  on public.camera_presets (preset_key)
  where user_id is null;
create index if not exists camera_presets_user_idx on public.camera_presets (user_id, created_at desc);

create unique index if not exists motion_presets_default_key_idx
  on public.motion_presets (preset_key)
  where user_id is null;
create index if not exists motion_presets_user_idx on public.motion_presets (user_id, created_at desc);

create unique index if not exists negative_prompts_default_model_idx
  on public.negative_prompts (model)
  where user_id is null;
create index if not exists negative_prompts_user_idx on public.negative_prompts (user_id, created_at desc);

create index if not exists render_history_user_created_idx on public.render_history (user_id, created_at desc);
create index if not exists render_history_engine_created_idx on public.render_history (engine, created_at desc);
create index if not exists render_history_prompt_search_idx
  on public.render_history using gin (to_tsvector('english', product_name || ' ' || brief));

create index if not exists generated_variations_user_created_idx
  on public.generated_variations (user_id, created_at desc);
create index if not exists generated_variations_render_idx
  on public.generated_variations (render_history_id, variation_index);

create index if not exists higgsfield_scripts_user_created_idx
  on public.higgsfield_scripts (user_id, created_at desc);
create index if not exists higgsfield_scripts_render_idx
  on public.higgsfield_scripts (render_history_id);

alter table public.personas enable row level security;
alter table public.hooks enable row level security;
alter table public.camera_presets enable row level security;
alter table public.motion_presets enable row level security;
alter table public.negative_prompts enable row level security;
alter table public.render_history enable row level security;
alter table public.generated_variations enable row level security;
alter table public.higgsfield_scripts enable row level security;

grant select, insert, update, delete on public.personas to authenticated;
grant select, insert, update, delete on public.hooks to authenticated;
grant select, insert, update, delete on public.camera_presets to authenticated;
grant select, insert, update, delete on public.motion_presets to authenticated;
grant select, insert, update, delete on public.negative_prompts to authenticated;
grant select, insert, update, delete on public.render_history to authenticated;
grant select, insert, update, delete on public.generated_variations to authenticated;
grant select, insert, update, delete on public.higgsfield_scripts to authenticated;

grant all on public.personas to service_role;
grant all on public.hooks to service_role;
grant all on public.camera_presets to service_role;
grant all on public.motion_presets to service_role;
grant all on public.negative_prompts to service_role;
grant all on public.render_history to service_role;
grant all on public.generated_variations to service_role;
grant all on public.higgsfield_scripts to service_role;

drop policy if exists "personas_read_catalog_or_own" on public.personas;
create policy "personas_read_catalog_or_own"
on public.personas for select
to authenticated
using (user_id is null or (select auth.uid()) = user_id);

drop policy if exists "personas_insert_own" on public.personas;
create policy "personas_insert_own"
on public.personas for insert
to authenticated
with check ((select auth.uid()) = user_id and is_default = false);

drop policy if exists "personas_update_own" on public.personas;
create policy "personas_update_own"
on public.personas for update
to authenticated
using ((select auth.uid()) = user_id and is_default = false)
with check ((select auth.uid()) = user_id and is_default = false);

drop policy if exists "personas_delete_own" on public.personas;
create policy "personas_delete_own"
on public.personas for delete
to authenticated
using ((select auth.uid()) = user_id and is_default = false);

drop policy if exists "hooks_own_all" on public.hooks;
create policy "hooks_own_all"
on public.hooks for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "camera_presets_read_catalog_or_own" on public.camera_presets;
create policy "camera_presets_read_catalog_or_own"
on public.camera_presets for select
to authenticated
using (user_id is null or (select auth.uid()) = user_id);

drop policy if exists "camera_presets_insert_own" on public.camera_presets;
create policy "camera_presets_insert_own"
on public.camera_presets for insert
to authenticated
with check ((select auth.uid()) = user_id and is_default = false);

drop policy if exists "camera_presets_update_own" on public.camera_presets;
create policy "camera_presets_update_own"
on public.camera_presets for update
to authenticated
using ((select auth.uid()) = user_id and is_default = false)
with check ((select auth.uid()) = user_id and is_default = false);

drop policy if exists "camera_presets_delete_own" on public.camera_presets;
create policy "camera_presets_delete_own"
on public.camera_presets for delete
to authenticated
using ((select auth.uid()) = user_id and is_default = false);

drop policy if exists "motion_presets_read_catalog_or_own" on public.motion_presets;
create policy "motion_presets_read_catalog_or_own"
on public.motion_presets for select
to authenticated
using (user_id is null or (select auth.uid()) = user_id);

drop policy if exists "motion_presets_insert_own" on public.motion_presets;
create policy "motion_presets_insert_own"
on public.motion_presets for insert
to authenticated
with check ((select auth.uid()) = user_id and is_default = false);

drop policy if exists "motion_presets_update_own" on public.motion_presets;
create policy "motion_presets_update_own"
on public.motion_presets for update
to authenticated
using ((select auth.uid()) = user_id and is_default = false)
with check ((select auth.uid()) = user_id and is_default = false);

drop policy if exists "motion_presets_delete_own" on public.motion_presets;
create policy "motion_presets_delete_own"
on public.motion_presets for delete
to authenticated
using ((select auth.uid()) = user_id and is_default = false);

drop policy if exists "negative_prompts_read_catalog_or_own" on public.negative_prompts;
create policy "negative_prompts_read_catalog_or_own"
on public.negative_prompts for select
to authenticated
using (user_id is null or (select auth.uid()) = user_id);

drop policy if exists "negative_prompts_insert_own" on public.negative_prompts;
create policy "negative_prompts_insert_own"
on public.negative_prompts for insert
to authenticated
with check ((select auth.uid()) = user_id and is_default = false);

drop policy if exists "negative_prompts_update_own" on public.negative_prompts;
create policy "negative_prompts_update_own"
on public.negative_prompts for update
to authenticated
using ((select auth.uid()) = user_id and is_default = false)
with check ((select auth.uid()) = user_id and is_default = false);

drop policy if exists "negative_prompts_delete_own" on public.negative_prompts;
create policy "negative_prompts_delete_own"
on public.negative_prompts for delete
to authenticated
using ((select auth.uid()) = user_id and is_default = false);

drop policy if exists "render_history_own_all" on public.render_history;
create policy "render_history_own_all"
on public.render_history for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "generated_variations_own_all" on public.generated_variations;
create policy "generated_variations_own_all"
on public.generated_variations for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "higgsfield_scripts_own_all" on public.higgsfield_scripts;
create policy "higgsfield_scripts_own_all"
on public.higgsfield_scripts for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop trigger if exists personas_touch_updated_at on public.personas;
create trigger personas_touch_updated_at
before update on public.personas
for each row execute function public.touch_updated_at();

drop trigger if exists camera_presets_touch_updated_at on public.camera_presets;
create trigger camera_presets_touch_updated_at
before update on public.camera_presets
for each row execute function public.touch_updated_at();

drop trigger if exists motion_presets_touch_updated_at on public.motion_presets;
create trigger motion_presets_touch_updated_at
before update on public.motion_presets
for each row execute function public.touch_updated_at();

drop trigger if exists negative_prompts_touch_updated_at on public.negative_prompts;
create trigger negative_prompts_touch_updated_at
before update on public.negative_prompts
for each row execute function public.touch_updated_at();

insert into public.personas (
  user_id, persona_key, persona_name, age, gender, accent, energy, trust_level,
  creator_style, speaking_speed, tone, appearance, is_default
) values
  (null, 'indian_female_22', 'Indian Female 22', 22, 'female', 'urban Indian English with light Hinglish warmth', 'bright, curious, quick', 'peer recommendation', 'UGC lifestyle creator', 'medium fast', 'casual, expressive, slightly playful', 'young Indian creator, natural makeup, clean casual outfit', true),
  (null, 'indian_female_28', 'Indian Female 28', 28, 'female', 'clear Indian English', 'calm, confident, relatable', 'trusted everyday buyer', 'testimonial creator', 'medium', 'honest, specific, practical', 'Indian creator in a modern apartment, minimal jewelry, polished casual look', true),
  (null, 'indian_female_35', 'Indian Female 35', 35, 'female', 'neutral Indian English', 'grounded, assured', 'experienced reviewer', 'premium product reviewer', 'medium', 'warm, discerning, low hype', 'Indian woman with elegant everyday styling and natural lighting', true),
  (null, 'indian_mom_40', 'Indian Mom 40', 40, 'female', 'warm Indian English with conversational Hindi touches', 'caring, direct', 'family-first recommender', 'mom creator', 'medium', 'protective, practical, reassuring', 'Indian mother in a bright home, simple kurta or comfortable casual outfit', true),
  (null, 'indian_male_tech_reviewer', 'Indian Male Tech Reviewer', 30, 'male', 'Indian English tech-review cadence', 'sharp, analytical', 'expert reviewer', 'tech reviewer', 'medium fast', 'clear, skeptical, evidence-led', 'Indian male creator at a clean desk setup with laptop and product props', true),
  (null, 'startup_founder', 'Startup Founder', 32, 'any', 'global Indian startup English', 'focused, candid', 'builder credibility', 'founder-led talking head', 'medium', 'plainspoken, mission-driven, specific', 'founder in a minimal office or coworking space, laptop nearby', true),
  (null, 'finance_creator', 'Finance Creator', 29, 'any', 'clear Indian English', 'composed, precise', 'educator credibility', 'finance explainer', 'medium', 'trustworthy, jargon-free, practical', 'creator in a tidy office, neutral outfit, confident eye contact', true),
  (null, 'beauty_creator', 'Beauty Creator', 26, 'female', 'urban Indian English', 'expressive, polished', 'beauty enthusiast', 'beauty UGC creator', 'medium fast', 'friendly, observant, product-aware', 'beauty creator near a mirror or vanity, fresh makeup, product visible', true),
  (null, 'fitness_creator', 'Fitness Creator', 27, 'any', 'energetic Indian English', 'active, motivating', 'routine-based credibility', 'fitness UGC creator', 'medium fast', 'direct, encouraging, no-nonsense', 'creator in gym wear, real gym or home workout background', true),
  (null, 'college_student', 'College Student', 20, 'any', 'casual Indian English with Gen Z phrasing', 'fast, spontaneous', 'peer discovery', 'student creator', 'fast', 'casual, funny, very native to short-form video', 'student in hostel or campus-style room with casual clothes', true),
  (null, 'corporate_professional', 'Corporate Professional', 31, 'any', 'neutral professional Indian English', 'calm, efficient', 'professional credibility', 'workday lifestyle creator', 'medium', 'practical, composed, honest', 'professional in workwear at desk, commute, or apartment setting', true),
  (null, 'luxury_lifestyle_creator', 'Luxury Lifestyle Creator', 34, 'any', 'polished global English', 'controlled, aspirational', 'taste-maker credibility', 'luxury lifestyle creator', 'slow medium', 'understated, premium, sensory', 'elegant creator in a refined apartment or boutique setting', true)
on conflict do nothing;

insert into public.camera_presets (
  user_id, preset_key, preset_name, camera_type, lens, movement, framing, focus, best_for, is_default
) values
  (null, 'selfie_handheld', 'Selfie Handheld', 'handheld selfie', '35mm', 'natural hand shake', 'medium closeup', 'face tracking', array['UGC Testimonial', 'Talking Head', 'TikTok Hook', 'Problem Solution'], true),
  (null, 'walk_and_talk', 'Walk And Talk', 'phone camera, front-facing', '28mm', 'walk forward with soft stabilization', 'medium shot with headroom', 'face tracking with background motion', array['Lifestyle Ad', 'Founder Story', 'Talking Head'], true),
  (null, 'product_closeup', 'Product Closeup', 'rear phone camera closeup', '50mm macro feel', 'slow push in', 'tight product closeup with hands', 'product and label priority', array['Product Demo', 'Feature Highlight', 'Before After'], true),
  (null, 'orbit_shot', 'Orbit Shot', 'stabilized phone camera', '35mm', 'gentle orbit around subject', 'medium product and creator frame', 'subject lock with slight background parallax', array['Cinematic Commercial', 'Lifestyle Ad'], true),
  (null, 'table_review', 'Table Review', 'phone on mini tripod', '35mm', 'minimal tripod drift', 'waist-up creator at table', 'face then product rack focus', array['Product Demo', 'Comparison Ad', 'UGC Testimonial'], true),
  (null, 'unboxing_shot', 'Unboxing Shot', 'handheld rear phone camera', '35mm', 'subtle handheld reveal', 'hands and product packaging', 'hands and packaging details', array['Product Unboxing', 'Product Demo'], true),
  (null, 'desk_setup', 'Desk Setup', 'tripod phone camera', '35mm', 'slow push in toward laptop', 'creator plus desktop workspace', 'screen and creator alternation', array['SaaS Explainer', 'App Demo', 'Feature Highlight'], true),
  (null, 'street_interview', 'Street Interview', 'handheld street interviewer camera', '35mm', 'subtle shoulder movement', 'two-person medium closeup', 'speaker tracking', array['Street Interview', 'Social Proof'], true),
  (null, 'laptop_setup', 'Laptop Setup', 'tripod camera beside laptop', '35mm', 'screen-side push in', 'laptop, hands, and creator reaction', 'screen content then face', array['App Demo', 'SaaS Explainer', 'Feature Highlight'], true),
  (null, 'overhead_product_shot', 'Overhead Product Shot', 'top-down phone camera', '35mm', 'table rotation', 'overhead product layout', 'product surface and hand interaction', array['Product Demo', 'Product Unboxing', 'Comparison Ad'], true),
  (null, 'pov_creator', 'POV Creator', 'creator POV phone camera', '28mm', 'camera follow', 'hands, product, and environment from creator perspective', 'action tracking', array['Lifestyle Ad', 'Product Demo', 'Voiceover B-roll'], true)
on conflict do nothing;

insert into public.motion_presets (
  user_id, preset_key, primary_motion, secondary_motion, intensity, instructions, timing, is_default
) values
  (null, 'subtle_handheld', 'subtle shake', 'slight pan left', 'subtle', 'subtle handheld movement, natural creator imperfection, keep the face and product readable', 'micro movement throughout, slight emphasis on hook and CTA', true),
  (null, 'medium_push', 'slow push in', 'pull back reveal', 'medium', 'slow push in during the hook, settle for script clarity, show product naturally', 'movement in first 2 seconds, stable mid-section, small CTA reveal', true),
  (null, 'aggressive_hook', 'crash zoom', 'camera follow', 'aggressive', 'fast hook movement, energetic but still realistic, avoid motion blur on face or product', 'strong first 1.5 seconds, then settle', true)
on conflict do nothing;

insert into public.negative_prompts (user_id, model, items, prompt, is_default)
values
  (
    null,
    'Higgsfield',
    array['extra fingers', 'deformed hands', 'floating objects', 'warped products', 'robotic expression', 'plastic skin', 'uncanny smile', 'oversaturated image', 'over sharpened image', 'incorrect lip sync', 'text artifacts', 'cinematic movie look'],
    'extra fingers, deformed hands, floating objects, warped products, robotic expression, plastic skin, uncanny smile, oversaturated image, over sharpened image, incorrect lip sync, text artifacts, cinematic movie look',
    true
  )
on conflict do nothing;
