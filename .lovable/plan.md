
# Vidzo V2 — Phased Overhaul Plan

This is a very large scope. To ship it safely without breaking the working chat/AI pipeline, I'll split it into **5 phases**. Each phase is shippable on its own — you can review after each before I move to the next.

Tell me which phases to run, in what order, or "do all in order".

---

## Phase 1 — Critical fixes + Landing/Dashboard polish (fast, no schema)
1. **Auth flash fix**: hydrate Supabase session in the router root before first paint; if authenticated, `/` redirects straight to `/chat/dashboard` (no landing flash).
2. **Dashboard click delay**: trend/format cards navigate immediately to a new thread route with an optimistic skeleton; thread creation happens in the background, message dispatched once ready. Sub-100ms perceived response.
3. **Landing hero cards**: enforce equal dimensions / spacing with CSS grid auto-rows, keep the scattered offsets via `translate` only. Fix mobile clipping.
4. **Light/Dark theme switcher**: token-based, persisted in `localStorage`, applied via `data-theme` on `<html>`. Switcher in header + dashboard.
5. **Typography**: Playfair Display for hero/section headlines, Inter for body. Wired via `src/styles.css`.

## Phase 2 — Mobile-first + Library rebuild
1. **Bottom nav** (mobile only): Home / Trends / Library / Create / Settings. Sidebar stays on desktop.
2. **Responsive audit pass** on dashboard, chat, library, trends, presets.
3. **Library rebuild**: searchable + filterable card grid (thumbnail, title, date, format, platform, quality score). Actions: Open, Duplicate, Delete, Favorite, Export (JSON), Share (copy link). Favorites stored on `scripts.data.favorite`.

## Phase 3 — Auth expansion + Session memory
1. **Email auth**: sign up, sign in, forgot password, reset password page (`/reset-password`), remember-me/session persistence. Google stays via the Lovable broker.
2. **Session memory table** (`user_settings`): theme, language, default tone/length/format, last-used trend, AI provider preference.

## Phase 4 — Trend engine + Remix
1. **Global hourly trend cache** (`trend_snapshots` table): scheduled `pg_cron` job hits a public `/api/public/refresh-trends` route that uses Firecrawl + a small curated source list (YouTube/Reddit/X/HN/etc.) and stores normalized cards (title, summary, category, velocity, source, confidence, emoji, color). All users read the same global feed.
2. **Rich trend cards** with color/emoji/category/velocity/confidence chips.
3. **Trend detail page** `/chat/trends/$id`: summary, why-trending, sources, audience, growth, risk, suggested formats.
4. **Remix button**: opens a new thread with a hidden remix-prompt that forbids reusing the original angle and forces a fresh hook/positioning.

## Phase 5 — Marketing mode + Prompt Engine 2.0 + Provider layer
1. **Marketing Pack mode** alongside Content Pack: dedicated form (product, features, audience, competitors, offer, CTA, URL) → new server tool `generate_marketing_pack` returning positioning, hooks, UGC/founder/problem-solution/demo scripts, thumbnails, captions, hashtags.
2. **Prompt Engine 2.0**: server-side orchestrator that composes user prompt + format/tone/length/language + trend + session memory + history; runs a hidden validation pass (hook, script, voice, thumbnails, image/video prompts, captions, hashtags, sources, facts) and auto-regenerates missing fields. Nothing internal exposed in UI.
3. **Crawled-URL hiding** in chat (already partly done — extend to all tool parts; only show "Researched N sources" + final source list inside the pack).
4. **AI provider abstraction**: `src/lib/ai-providers.server.ts` selects between Lovable AI (default), OpenAI, Anthropic, Gemini, OpenRouter based on `user_settings.ai_provider` + optional user-supplied keys (stored via secrets). Settings UI to choose provider + model.

---

## Technical notes (for the technical reviewer)
- New tables: `user_settings(user_id pk, theme, language, default_format, default_tone, default_length, ai_provider, ai_model, updated_at)`, `trend_snapshots(id, category, title, summary, source_url, source_name, velocity, confidence, emoji, color, payload jsonb, fetched_at, expires_at)`. Both with GRANTs + RLS (`user_settings` user-scoped, `trend_snapshots` readable by `authenticated`, writable by `service_role`).
- New server fns: `getUserSettings`, `updateUserSettings`, `listTrendSnapshots`, `getTrendSnapshot`, `generateMarketingPack` (tool).
- New public route: `/api/public/refresh-trends` (HMAC via anon key per scheduled jobs pattern).
- New routes: `/chat/marketing`, `/chat/trends/$id`, `/chat/settings`, `/reset-password`.
- Dashboard click latency fix: pre-create thread on hover/idle, or navigate first to `/chat/new?prompt=...` which mounts skeleton + creates thread in parallel.

---

## What I need from you
1. **Approve phases** — all 5, or pick a subset to start.
2. **AI providers**: confirm we add OpenAI/Anthropic/Gemini/OpenRouter as bring-your-own-key (stored as secrets). OK?
3. **Trend sources**: Firecrawl is already connected. OK to start with a curated list (YouTube trending, Reddit r/popular + niche subs, HackerNews, Product Hunt, X via nitter mirrors) and expand later?
4. **Theme default**: light or dark?
