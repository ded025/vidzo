# Vidzo Product Experience Overhaul

## Goal
Make login reliably land on the workspace, preserve users’ place across navigation, and turn Vidzo into a focused creator production product rather than a generic AI dashboard.

## What will change

### 1. Fix authentication and entry flow
- Make email and Google sign-in wait for the session to be stored before entering the workspace.
- Send authenticated visitors directly to the dashboard without briefly showing the landing page.
- Add a clear loading state while authentication is being restored instead of showing a blank or looping screen.
- Handle expired sessions with an explicit sign-in message instead of a silent redirect.

### 2. Repair navigation and chat continuity
- Change “New chat” into a composer-first flow so users see what they are starting before a thread is created.
- Show immediate, persistent progress after submission: brief accepted, source research, pack assembly, and completion.
- Preserve draft text and the last active chat when users navigate away or press Back.
- Make browser Back return to the prior dashboard, trend, library, or chat state rather than an unexpected page.
- Remove duplicate and obsolete navigation items, clarify active states, and make mobile navigation consistent.
- Add visible failure and retry states for thread creation and message generation.

### 3. Redesign the authenticated workspace
- Replace the colorful generic card grid with a restrained editorial production-console style using Roboto Flex.
- Establish a stronger hierarchy: production brief, current work, recent packs, live signals, and quality insights.
- Use a compact left navigation, a contextual top bar, sharper surfaces, fewer gradients, and consistent spacing.
- Make the dashboard useful at a glance with real user data: pack count, drafts, source coverage, recent work, and quality scores.
- Keep Content Pack and Visual Story outputs unchanged while improving how users reach and understand them.

### 4. Refine key modules
- Dashboard: one dominant “Start a production” area, recent work with status, and relevant trend signals.
- Chat: clear thread title, generation stages, stable input area, autosaved draft, and better empty/error states.
- Library: scannable pack list with topic, format, date, quality, and direct return to its originating chat.
- Trends and Visual Story: align controls and feedback with the same production-console system.

### 5. Polish the public website
- Reduce decorative AI-style gradients and excessive rounded cards.
- Use strong product screenshots/data layouts, precise copy, restrained motion, and clear feature connections.
- Keep the existing random-card hero concept, but integrate it into a more credible, structured product story.
- Ensure both light and dark themes remain legible and intentional on mobile and desktop.

### 6. Verify end to end
- Test email and Google post-login routing.
- Test dashboard loading, new-chat creation, message submission, Back navigation, draft restoration, recent-thread reopening, and sign-out.
- Test mobile and desktop layouts and check for browser/runtime errors.
- Confirm every content page has unique sharing metadata.

## Technical details
- Use the existing TanStack routes and Lovable Cloud session flow.
- Persist composer drafts and the last workspace location locally per user; never store auth or role decisions there.
- Keep protected data calls inside the authenticated route tree and prevent them from firing before session hydration.
- Use semantic design tokens and existing controls; remove hardcoded theme-breaking styles encountered in edited screens.
- Preserve current content generation schemas and outputs; this phase changes reliability, navigation, and presentation.
