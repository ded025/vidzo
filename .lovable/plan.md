# Vidzo — Full Upgrade Plan

## 1. Brand: Reel Engine → Vidzo
- Rename across `src/routes/index.tsx`, `auth.tsx`, `__root.tsx` (`<head>` title/meta), `chat.tsx` sidebar header, `package.json`, `public/llms.txt`.
- Add **Roboto Flex** via Google Fonts in `src/routes/__root.tsx` `<head>`; set as default in `src/styles.css` (`--font-sans`, `body { font-family }`). Replace any other font families.

## 2. New AI-Ready Content Pack (replaces current "script-only" output)
Replace `ScriptSchema` in `src/routes/api/chat.ts` + `ScriptCard` with a richer schema. Each generation = a complete "production brick set":

**Schema fields:**
- `topic`, `niche`, `format` (reel/short/long/etc — inferred from chat context), `whyViral`
- `script.dialogue` — clean copy-pasteable voiceover text (no stage directions inline), ElevenLabs-ready
- `script.voiceDirection` — separate field: tone, pace, emotion, pauses (so dialogue stays clean)
- `script.suggestedElevenLabsVoice` — voice name + voice_id from the known catalog
- `visuals[]` — per beat, each with:
  - `beat` (e.g. "0–3s hook")
  - `imagePrompt` — detailed prompt ready for Midjourney/DALL·E/Gemini/etc
  - `videoPrompt` — detailed prompt ready for Sora/Runway/Veo/Kling
  - `onScreenText`
- `thumbnailPrompts[]` — 3 full image-gen prompts (not one-liners), each with composition, lighting, text overlay
- `caption`, `hashtags[]`
- `sources[]` — array of `{claim, url, publisher}`. **Required for every factual claim.**

## 3. Validation Layer (silently drops unverified)
New server step before `generate_script` returns:
1. Model drafts content.
2. **Validator pass** (second `generateText` call, low temp) receives draft + the firecrawl search results from earlier in the conversation. It returns the same object with any claim lacking a matching source rewritten to a safe, source-backed version, or removed.
3. If after validation a claim has no source, it is removed and the surrounding sentence is rewritten. `sources[]` only contains verified entries.
4. If the whole topic has zero verifiable sources, tool returns `{ insufficientSources: true }` and the assistant tells the user to pick another angle — never fabricates.

System prompt updated: "Every numeric claim, name, funding figure, date must come from a tool-returned source. If not in sources, do not include it."

## 4. Chat Context Locking
- On thread create, capture the first user message as `thread.context_brief` (new column).
- System prompt is dynamically built: `MASTER_PROMPT + "\n\nLocked brief for this chat: <context_brief>. All subsequent generations must serve this brief."`
- Migration: add `context_brief text` to `threads`.

## 5. Output UI (`ScriptCard` → `ContentPackCard`)
Sectioned card with copy-to-clipboard on every block:
- **Voiceover (ElevenLabs ready)** — dialogue + "Copy for ElevenLabs" button + voice suggestion chip
- **Visuals** — per beat, tabs `[Image prompt | Video prompt]`, each with copy
- **Thumbnails** — 3 prompt cards with copy
- **Caption + hashtags**
- **Sources** — collapsible list of `{publisher → url}` links
Remove the "Verify before posting" section entirely (replaced by sources).

## 6. Industry-Grade Dashboard
New route `src/routes/_authenticated/dashboard.tsx` becomes the default landing after login (redirect `/chat` → `/dashboard` for the index; chats remain accessible). Layout: sidebar (Dashboard / Chats / Library / Trends / Presets / Settings) + main grid.

Sections:
- **Stats row** — total scripts, scripts this week, credits used (from `ai_usage` count), avg sources/script
- **Library** — grid of saved scripts from `scripts` table, search, filter by niche, folder tags. Add `folder text` column to `scripts` via migration.
- **Trends feed** — auto-runs `search_trending_topics` for the user's saved niches every visit (cached 1h in localStorage), one-click "Generate pack" → creates a thread with that topic.
- **Brand/voice presets** — new table `presets (id, user_id, name, niche, audience, tone, language, default_voice_id)`. CRUD UI. Active preset gets injected into the system prompt for every new chat.

Migrations needed:
- `threads.context_brief text`
- `scripts.folder text`
- `presets` table (full CRUD with RLS + GRANTs)
- `ai_usage` table optional — or derive from `messages` count

## 7. Landing Page Redesign (Schbang-style, colorful)
Rewrite `src/routes/index.tsx`:
- Generate 3 hero images (premium model): bold media-company aesthetic, color-blocked abstract collages with Vidzo brand colors (electric blue, hot magenta, acid yellow, off-white).
- Sections: oversized animated headline → "what Vidzo does" 3-column → live ticker of generated reel topics → case-study cards (use generated images) → testimonials placeholder → giant **VIDZO** wordmark at the bottom (full-bleed, Roboto Flex variable weight animated on scroll via GSAP).
- GSAP: ScrollTrigger pinned sections, character-by-character headline reveal, parallax color blocks, marquee.
- Keep Roboto Flex everywhere; use variable axis (`wght`, `wdth`) for the giant footer wordmark.

## Technical Notes
- All AI calls stay in `src/routes/api/chat.ts` using existing Lovable AI Gateway provider.
- Validation pass uses same `google/gemini-3-flash-preview` model with `generateText` (non-streaming) inside the `generate_script` tool's `execute`.
- Hero images saved to `src/assets/landing-*.jpg`.
- No new dependencies needed beyond what's installed (`gsap` already added).

## Out of Scope (ask later if wanted)
- Direct ElevenLabs API call from the app (currently we output copy-pasteable text only).
- Direct video/image generation inside Vidzo (we output prompts only, per your spec).
- Stripe/credits billing UI beyond the usage counter.
