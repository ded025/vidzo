# Vidzo V3 — Phased Overhaul Plan

Scope is too large for one turn. Splitting into **6 phases**, each independently shippable and testable. Confirm which to start with (or "all in order").

---

## Phase 1 — Foundations (Dark/Light + Pricing + Performance)

**Goal:** Every screen looks correct in both themes, Hex.tech-style sharp aesthetic, free pricing.

- Audit every page (`chat.dashboard`, `chat.trends`, `chat.library`, `chat.$threadId`, `chat.presets`, `chat.credits`, `auth`, `pricing`, marketing pages) for hardcoded `bg-white`, `text-slate-*`, `border-slate-*` → replace with semantic tokens (`bg-card`, `text-foreground`, `border-border`, `bg-muted`).
- Fix `auth-dialog` transparency in dark mode (explicit `bg-card`).
- Rebuild design tokens in `src/styles.css`: sharper radii (`--radius: 6px`), Hex-style borders, denser shadows, mono-accent palette per theme.
- Add subtle motion primitives (fade-in, slide-up, hover lift) via Tailwind keyframes + `motion-safe`.
- **Pricing:** remove "Standard" tier, mark everything **Free** for now (keep layout, single column or two-card max).
- Code-split heavy routes (`chat.trends` lazy import for Firecrawl helpers), memoize trend cards, virtualize library grid if >50 items.
- Add `OPENAI_API_KEY` secret slot (via `secrets--add_secret`) — wired but unused, ready for later.

## Phase 2 — Trends Engine (Real Content Machine)

**Goal:** Trends never feels empty; every category has fresh+evergreen items.

- **Sync logic rewrite** (`src/routes/api/trends-sync.ts`):
  - For each category: Firecrawl search → if <N fresh results, **fall back to existing rows** in `global_trends` for that category (decay popularity over time, not delete).
  - Add evergreen seed set per category (curated topics) inserted on first sync so categories never look broken.
  - Source pool expansion: YouTube, Reddit, X, TikTok hashtags via web search; news sites per category.
  - Dedup by `dedup_key` (already in schema), upsert with `popularity = max(old, new)`, refresh `synced_at`.
- **Hourly pg_cron** hitting `/api/public/hooks/trends-sync` (new public route, signature-verified by anon key) to keep dataset global + fresh.
- Trend cards: velocity arrow (▲/▼ vs prior sync), source-platform icon row, confidence bar, gradient by category.
- **Remix button** on each card → server fn that calls AI gateway with "give 3 adjacent angles, not the original" prompt → creates new thread with that brief.

## Phase 3 — Library Rebuild

**Goal:** Visual grid of every generated pack.

- Query `scripts` table grouped by thread.
- Card grid: thumbnail (first image prompt or category gradient), title, date, type (Content/Marketing), platform badge, status chip.
- Toolbar: search (title + topic), sort (newest/oldest/most-used), filter (type, platform, date range, favorites).
- Card actions menu: Open, Duplicate (clones row), Edit (opens thread), Delete (confirm), Export (JSON download), Share (copy public-link placeholder), Favorite (toggle `is_favorite` column — needs migration).
- Migration: add `is_favorite boolean`, `usage_count int`, `pack_type text` to `scripts`.

## Phase 4 — Marketing Pack Mode

**Goal:** Second generation mode alongside Content Packs.

- Mode toggle on dashboard: **Content Pack** | **Marketing Pack**.
- Marketing input form (Product Name, Description, Features, Benefits, Audience, Industry, Competitors, Offer, CTA, Landing URL).
- New prompt template in `src/lib/prompts.ts` (`MARKETING_PACK_PROMPT`) → outputs: positioning, hooks, UGC scripts, founder videos, problem-solution ads, feature launch, demo scripts, campaign ideas, thumbnail/image/video prompts, captions, hashtags.
- New renderer in `content-pack-card.tsx` handling the marketing schema (or fork into `marketing-pack-card.tsx`).
- Stored in same `scripts` table with `pack_type='marketing'`.

## Phase 5 — Email Auth + Profile + Session Memory

- **Email auth:** sign up, sign in, forgot password, `/reset-password` route, Remember Me checkbox, password HIBP check enabled. Keep Google.
- **Profile page** (`/chat/profile`): display name, avatar URL, niche, audience, default language, default tone. Backed by new `profiles` table (migration).
- **Session memory:** theme (already done), language, last mode, recent packs — stored in `user_settings` table (jsonb prefs) + localStorage mirror for instant restore.

## Phase 6 — AI Validation Layer + Intelligence Polish

- After generation, run a validator pass (Gemini Flash) checking each field (hooks, script, prompts, captions, sources) for completeness/fact accuracy.
- Missing/weak field → auto-regenerate that field only (not whole pack).
- Surface internal-only QA score; user sees "✅ Verified" badge.
- Tighten the brand/person/topic classifier in `prompts.ts` with explicit web-search step before script gen.

---

## Responsive QA (runs through every phase)

Test breakpoints: 360 (iPhone SE), 390 (iPhone 14), 768 (iPad), 1024, 1440, 1920. Rules:
- All header rows use `grid-cols-[minmax(0,1fr)_auto] sm:flex` pattern.
- All text containers have `min-w-0`, icons `shrink-0`, single-line titles `truncate`.
- Library/trend grids: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`.

---

## Technical notes

- New migrations needed: `profiles`, `user_settings`, `scripts.is_favorite/usage_count/pack_type`, evergreen seed for `global_trends`.
- New secret: `OPENAI_API_KEY` (requested via `secrets--add_secret` in Phase 1).
- New public route: `/api/public/hooks/trends-sync` for pg_cron.
- New server fns: `remixTrend`, `validatePack`, `generateMarketingPack`, `updateProfile`, `getUserSettings/setUserSettings`, library CRUD (`duplicateScript`, `deleteScript`, `toggleFavorite`).

---

## How to proceed

Reply with one of:
1. **"All phases, in order"** — I'll ship Phase 1 now and continue across follow-up turns.
2. **"Phase N first"** — pick a starting phase.
3. Or call out specific items to add/remove from the plan.

I won't start coding until you pick.
