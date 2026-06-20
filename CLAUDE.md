# CLAUDE.md

Guidance for AI assistants and contributors working in this repo. Read this before
making changes.

## What this is

An **Astro + Panda CSS + MDX** DFIR portfolio/blog, deployed on Vercel via the
`@astrojs/vercel` adapter (`output: 'server'`, but **every route is prerendered** to static
HTML — the adapter is kept for Web Analytics and the on-demand 404 fallback). Client JS
is minimal — small inline scripts plus Vercel Web Analytics & Speed Insights.
See [README.md](README.md) for setup, [docs/AUTHORING.md](docs/AUTHORING.md)
for content, and **[docs/STYLE_GUIDE.md](docs/STYLE_GUIDE.md) for the design language and
copy conventions** (color tokens, typography, when to bold company names, cert wording, etc.)
— follow it for any new page, component, or copy.

## Commands

```bash
npm run dev      # dev server
npm run build    # panda codegen + astro build (the real integration test)
npm run check    # astro check (types/diagnostics)
npm test         # vitest unit suite
```

## Architecture invariants — don't break these

1. **Panda needs codegen.** `styled-system/` is generated and git-ignored. After editing
   `panda.config.ts`, run `npx panda codegen`. The `build`, `check`, and `prepare`
   scripts already do this. Components import from `styled-system/css` (aliased in
   `tsconfig.json`).

2. **Theme state = two attributes on `<html>`:**
   - `data-theme="<id>"` → the palette (from `src/themes.ts`).
   - `data-mode="dark"|"light"` → resolved mode; drives Panda `_dark`/`_light` and Shiki.

   **⚠️ Never add a bare `data-mode` attribute to any element other than `<html>`.** Panda
   emits `[data-mode=dark] { --colors-…: … }`, so any element carrying that attribute
   re-scopes its own color variables (this caused a real invisible-text bug). Interactive
   controls use *different* attribute names: `data-theme-id`, `data-mode-pref`.

3. **`src/themes.ts` is the single source of truth** for themes. It drives the picker UI,
   the CSS variable overrides (`ThemeStyles.astro`), and the pre-paint controller
   (`BaseHead.astro`). Add a theme by appending to `THEMES`; nothing else needs editing.
   `test/themes.test.ts` guards consistency.

4. **One theme controller.** `BaseHead.astro` defines `window.__theme`
   ({ apply, setMode, setPalette, getMode, getPalette }) in an inline pre-paint script and
   dispatches a `themechange` event on `document` after every change. `ThemePicker` and
   `ModeToggle` both call `window.__theme` and re-sync on `themechange` — keep them in
   lockstep, don't fork the logic.

   **Palette is a per-mode preference, decoupled from mode.** Storage keys: `mode`
   (`system`/`light`/`dark`, set only by `ModeToggle`), plus `theme-dark` and `theme-light`
   (preferred palette per mode, set by `ThemePicker`). `setPalette(id)` saves the preference
   for *that palette's* mode and never changes the active mode — so picking a dark palette
   while in light mode just updates the dark preference for later.

5. **Minimal JS.** No client frameworks. Interactivity is small `<script is:inline>` blocks.
   The only third-party client JS is Vercel Web Analytics (injected by the adapter's
   `webAnalytics`) and Speed Insights (`<SpeedInsights/>` from `@vercel/speed-insights/astro`
   in `BaseLayout`). Keep it that way unless there's a strong reason.

6. **SSR adapter, but prerender everything.** `astro.config.mjs` uses `@astrojs/vercel`
   with `output: 'server'`, where routes render on-demand by default. So **every page sets
   `export const prerender = true`** (static pages near the top of their frontmatter; the
   dynamic routes `blog/[...slug]`, `labs/[...slug]`, `tags/[tag]` must set it too, or
   `getStaticPaths()` is ignored and they 500 with an empty `Astro.props`). The RSS endpoint
   prerenders as well. Net effect: the whole site is static HTML on Vercel's CDN, and the
   adapter is retained only for Web Analytics and the on-demand 404 fallback. **When you add a
   route, prerender it** unless it genuinely needs per-request logic. `trailingSlash: 'always'`
   makes the adapter emit 308 redirects to a single canonical URL form (matching our canonical
   tags + sitemap). The build emits the Vercel Build Output API (`.vercel/output/`), not
   `dist/`. An `.npmrc` sets `legacy-peer-deps=true` because the Vercel analytics/speed-insights
   packages declare an optional SvelteKit peer that conflicts with this project's Vite version.

7. **`examples/` is never built or deployed** (outside content collections + in
   `.vercelignore`). It holds reference templates only.

8. **Page background color lives on `<html>`, not `<body>`.** `Background.astro` paints a
   fixed `<canvas>` at `z-index: -1` (the ambient node field), which sits *above* the root
   background but *below* content. For it to be visible, `<body>` must stay transparent and
   the theme bg must be on `<html>` (see `panda.config.ts` `globalCss`). Don't move it back.
   The canvas is deliberately mobile-tuned: FPS-throttled (~30fps mobile / 45fps desktop),
   fewer nodes + capped DPR on small screens, **re-seeds only on *width*/orientation change**
   (not the mobile URL-bar height churn that used to reflow it mid-scroll), pauses when hidden,
   honors `prefers-reduced-motion`, and uses seamless vertical tiling for the scroll parallax.
   Keep those guards if you touch it.

9. **Build & CI hygiene.** Node ≥ 20.3 (`.nvmrc` pins 24 to match Vercel's serverless runtime;
   `engines` in `package.json` sets the floor). GitHub Actions (`.github/workflows/ci.yml`)
   runs `check` + `test` + `build` on every push and PR; Dependabot (`.github/dependabot.yml`)
   keeps deps + actions patched. `package-lock.json` is committed — use `npm ci`. Outstanding
   `npm audit` items have no forward fix (npm only offers major *downgrades*) and are dev-tooling
   or build-time only; **don't `audit fix --force`** (it regresses the stack) — let Dependabot
   raise real fixes. The footer surfaces the build version: `src/utils/version.ts` reads the
   `package.json` `version` plus the commit SHA from `VERCEL_GIT_COMMIT_SHA` (falling back to
   local `git`), and links it to the GitHub commit. Bump `version` for a notable release.

10. **Term of the Day = one bank, client-side daily rotation.** The glossary bank is
    `src/data/securityTerms.ts`: a small curated core inline + per-domain batches in
    `src/data/terms/*.json`, merged, de-duplicated by slug (curated wins), and link-sanitized at
    module load (vendor-agnostic concepts only — never products). It drives the site-wide ticker
    (`Ticker.astro` in `BaseLayout`, above the nav), the searchable `/term-of-the-day/` glossary
    index, and the prerendered `/term-of-the-day/[slug]/` detail pages (each with `DefinedTerm`
    JSON-LD). **The daily term is picked in the browser**, not at build: the ticker fetches the
    compact, prerendered `/term-of-the-day/bank.json` (one cached file, so the whole ~500-term bank
    isn't inlined into every page) and computes `daySerial(localY/M/D) mod bankLength` — identical
    math to `termForDate()` — so it changes at local midnight with no rebuild (the whole site is
    CDN-static, so a build-time pick would freeze until redeploy). Prerendered HTML carries the
    build-day term as a no-JS/crawler fallback. Add terms by appending to a `terms/*.json` batch
    (or the curated core); `test/securityTerms.test.ts` guards slug uniqueness, related-link
    integrity, ≤90-char shorts, and the rotation math. The ticker is a scrolling monospace
    marquee; its keyframes live in `global.css` (`@keyframes totd-marquee`, reduced-motion stops it). Old `/word-of-the-day/` URLs 308-redirect to the new
    path (`astro.config.mjs`). **Note:** the sticky nav `<header>` has `backdrop-filter`, which
    makes it the *containing block* for the theme picker's `position: fixed` mobile menu — that's
    why the picker's `top: calc(64px + 8px)` lands just below the header even though the ticker
    makes the page taller. Don't "fix" it with viewport-coordinate math (it double-counts the ticker).

## Conventions

- **Styling:** use the `css()` function from `styled-system/css`. Reference semantic tokens
  by name (`bg`, `bgCard`, `text`, `textMuted`, `primary`, `accent`, `border`, `codeBg`).
  Inside string values use `token(colors.x)` (e.g. `border: '1px solid token(colors.border)'`).
- **Icons:** add an entry to the `ICONS` map in `src/components/Icon.astro` (lucide-style,
  24×24, stroke, `currentColor`). Category→icon mapping lives in `src/consts.ts`.
- **Content:** schemas in `src/content.config.ts`; `draft: true` hides from prod;
  filenames are slugs.
- **Tests:** pure utilities only (no browser). `astro:content` is aliased to
  `test/stubs/astro-content.ts` in `vitest.config.ts`.

## Content accuracy

This is a real person's professional portfolio. **Do not invent or embellish** job titles,
dates, employers, certifications, or metrics. If real data isn't available, use clearly
marked placeholders and ask — don't guess. Work history lives in the `experience` array in
`src/pages/about.astro`.

**Content source is public-only.** All blog/lab content comes from public lab & CTF
challenges and personal study — **never** real/employer/client investigations or data
(employer/confidentiality constraint). Don't add "redacted real case" framing.

See **[docs/STYLE_GUIDE.md](docs/STYLE_GUIDE.md) → Project direction** for goals, audience
priority, pillars, voice, and the visual direction every change should serve.
