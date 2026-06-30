# Style Guide

The design language for patricksaade.com. Follow this for any new page, component, or
copy so the site stays consistent. (Architecture rules live in `CLAUDE.md`, kept local to the
project; content/frontmatter rules in [AUTHORING.md](AUTHORING.md).)

## Project direction

The decisions every change should serve:

- **Goal:** land a **DFIR-specific role**. Everything optimizes for that.
- **Audience priority (in order):** 1) hiring managers/recruiters (skim fast), 2) DFIR
  practitioners/peers (read deep), 3) students/newcomers. So: the hero must convey identity +
  current role + headline certs at a glance, and the About page is one click for recruiters —
  but the body goes deep enough for practitioners.
- **Home emphasis:** **blog-forward**. Lead with content (featured/latest posts); keep a
  concise credentials hero, but push depth of "about me" to the About page.
- **Content pillars (priority order):** **Host forensics** and **Memory forensics** first;
  then EDR analysis, Labs/CTF, Tools/exam-prep.
- **Content source:** **public lab & CTF challenges and personal study only** — CyberDefenders,
  13Cubed, MemLabs, Magnet, home lab. **Never real/employer/client investigations** (employer
  constraint). No redacted-case framing anywhere.
- **Voice:** see *Voice & tone* below — conversational practitioner, first-person, original.
- **Visual direction:** **richly technical** (see *Visual direction* below).
- **Brand:** keep the "Patrick Saade" wordmark, the pixel-star mark (`PixelStar`, also the
  favicon), and current palette system.
- **Contact/CTA:** **LinkedIn only**. No contact form, no résumé PDF, no newsletter,
  no "available for work" banner.
- **Discoverability:** invest in it — be findable by name, profession, experience, labs, and
  blog. Tags/series, search, related posts, structured data all in scope.

## Voice & tone

- **Conversational practitioner**, first person ("here's how I'd approach this", "the artifact
  that cracked it"). Confident but not boastful; show the work, including dead ends.
- **Original** — do not imitate other blogs' style; this is Patrick's voice.
- Lead with the finding/insight, then the evidence. Explain *why*, not just *what*.
- No marketing fluff, no employer name-dropping for cases, no invented metrics.
- **Copy is the site's voice, never the prompt.** Write everything — page copy, glossary
  definitions, metadata — as natural prose Patrick would write. **Never** let task instructions
  or meta-phrasing leak into user-facing text (no "vendor-agnostic", "as requested", "never a
  product", "this glossary", etc.). State the thing itself, plainly; if a rule shaped the copy,
  the rule belongs in this guide, not on the page.
  - **In particular, never restate the content-source / confidentiality constraint as an on-page
    disclaimer** — no "no client data", "no real-incident details", "nothing from employer
    casework", "no redacted real cases". That rule (public-only sources; see CLAUDE.md) governs
    *what* you write, not something to announce. Name the public sources positively instead
    (e.g. "public data lets me walk the whole investigation in the open") and stop there. It
    reads as a compliance disclaimer, not Patrick's voice.
- **Signature capitalization.** Patrick capitalizes **Threat**, **Root Cause Analysis**, and
  **Incident Response** as a deliberate voice tic — but only inside first-person narrative he
  authored (hero, About, colophon, posts). Keep them lowercase everywhere else (headings, meta
  descriptions, glossary definitions, card/label microcopy); they land *because* they're rare.
  (Distinct from DFIR/SIEM/EDR/SOC/IR, which are capped everywhere as acronyms.)

### Glossary terms (Term of the Day)

Entries in `src/data/securityTerms.ts` / `src/data/terms/*.json` are **concepts, techniques,
artifacts, or models — never products, tools, vendors, or companies** (the generic idea, e.g.
"credential dumping", not a named tool). Keep each field tight and factual: `short` ≤ 90 chars,
`definition` 1–2 sentences (what it is), `significance` 1–2 sentences (why it matters in DFIR),
`example` one concrete sentence. Accuracy over volume — only real, established industry terms.

## Visual direction

Aim **richly technical** while keeping the dark, terminal-adjacent base, the ambient node
background, and the theme system:

- Favor **diagrams, annotated screenshots, data tables, and timelines** in posts over plain
  prose where they clarify.
- Lean into **monospace** for artifacts, paths, commands, IOCs, and labels; code blocks are
  first-class (Shiki, copy affordance).
- Forensic/technical motifs (timelines, artifact tables, attack-path diagrams) are encouraged;
  keep them legible and theme-aware (use tokens, never hard-coded colors).

## Color & theming

- Style with the `css()` function from `styled-system/css`. **Never hard-code hex** in
  components — reference semantic tokens so themes work.
- Semantic tokens: `bg`, `bgSubtle`, `bgCard`, `border`, `text`, `textMuted`, `primary`,
  `primaryHover`, `accent`, `codeBg`.
- Inside string values use `token(colors.x)` — e.g. `border: '1px solid token(colors.border)'`.
- Tinted fills use `color-mix` with a token — e.g.
  `bg: 'color-mix(in srgb, token(colors.primary) 13%, transparent)'` (icon tiles, cert chips).
- Palettes/modes are defined in `src/themes.ts`; never add a bare `data-mode` attribute to a
  child element (see CLAUDE.md).

## Typography

The site uses **only two faces**, both under the SIL Open Font License: **Redaction** (by Jeremy
Mickel / MCKL, for Titus Kaphar & Reginald Dwayne Betts' *The Redaction*) for everything readable,
and **Fira Mono** (Mozilla) for code. Both are self-hosted under `public/fonts/`, declared in
`src/styles/fonts.css`, and credited on the colophon. Redaction is a serif with seven optical
**grades of degradation** (0 = clean … 100 = heavily eroded).

- **`fontFamily: 'sans'`** is Redaction **grade 0** (clean), with a Georgia/Times serif
  fallback. Use it for everything readable — body, headings, titles, stat values, and
  metadata/eyebrows/badges.
- **`fontFamily: 'mono'`** is **Fira Mono**, reserved for **code-like text only**: code blocks,
  inline `code`, file paths, IOCs, commands, and the footer version hash. Don't put labels/dates in mono.
- **Degraded grades** are tokens — `redaction20`, `redaction35`, `redaction50` — used only on
  specific display areas: **ticker → 50, wordmark → 50** (applied statically). The **hero `<h1>`
  decodes** from the heaviest grade through to clean (grade 0) via the `declassify` animation, so
  it settles fully clean like every other title — don't pin the hero to a degraded resting grade.
  Keep static degradation to the *medium* range (≤ 50) and to large/display text; the grades share
  metrics with grade 0. The heavier grades (70/100) are self-hosted but reserved for the decode
  animation and big one-off display, never body or small text.
- Headings/eyebrows are **sentence case** ("DFIR deep dives", not "DFIR Deep Dives") except
  proper nouns and the site/brand wordmark "Patrick Saade".

## Emphasis & bolding (copy)

**One rule, applied uniformly — this is the #1 source of past inconsistency.**

In bio / career / experience prose, bold **only employer & company names** with
`<strong class={css({ color: 'text' })}>…</strong>`:

- ✅ Bold: **First American**, **Red Canary**, **Zscaler**, **ReliaQuest**.
- ❌ Do **not** bold role titles, tools/products, or generic phrases. Every role is written
  the same way — `Senior Information Security Analyst at <strong>First American</strong>`,
  `Threat Response Engineer at <strong>Red Canary</strong>` — so current and past roles match.
- Tools/products get emphasis through dedicated UI (the Tools page, badges), **not** bold in
  prose. So no bold for "Velociraptor", "Volatility 3", etc. in sentences.
- This applies to narrative prose only, not compact UI (badges, card sub-labels, stat
  descriptions) — those carry weight via component styling.

**Exception — policy/legal pages** (e.g. `/privacy`): bold may emphasize key *facts/guarantees*
for scannability (e.g. "**no cookies**", "**cookieless**", does "**not**" track). This is a
distinct, intentional pattern; keep it to the key guarantees, not proper nouns.

### Casing in headlines vs. prose
- **Headline lines** (the hero `<h1>` statements, eyebrows) may use title/headline case —
  e.g. "SOC & Incident Response @ First American."
- **Sentence prose** uses normal sentence case — e.g. "…detection-and-response and incident
  response…" (lowercase). Don't title-case mid-sentence.

## Language conventions

- Certifications in progress are **"in pursuit of"**, never "in progress". (A degree may use
  "(in progress)".)
- Dates: `Mon YYYY` (e.g. `Jun 2026`); ranges with an en dash: `Aug 2025 – Jun 2026`;
  current roles end in `Present`.
- Write **DFIR**, **SIEM**, **EDR**, **SOC**, **IR** in caps. Product names as branded
  (Volatility 3, Velociraptor, CrowdStrike).
- Use em dashes — like this — for asides; "·" as an inline separator in meta rows.
- **Content accuracy:** never invent titles, dates, employers, certs, or metrics
  (see CLAUDE.md).

## Components & patterns

- **Card:** `bg: 'bgCard'`, `border: '1px solid token(colors.border)'`, `borderRadius: 'lg'`,
  optional `boxShadow: 'card'`. Hover: `transform: 'translateY(-2px/-3px)'` +
  `borderColor: 'primary'` (+ `boxShadow: 'cardHover'`), `transition` ~200ms.
- **One card size across listing pages.** The Glossary, Tools, Certifications, MITRE
  ATT&CK Coverage Map, and MITRE D3FEND Map grids all use the single shared
  `.card-grid` class (in `global.css`: `repeat(auto-fill, minmax(min(100%, 232px), 1fr))`,
  `gap: 0.65rem`) with `0.7rem 0.85rem` card padding — so cards are a consistent size
  site-wide, not congested and not oversized. Don't fork per-page column widths; change
  `.card-grid` once if the size needs tuning. Pages add only their own `mt` via `css()`.
- **Icon tile** (stat/section/timeline markers): rounded square (`borderRadius: 'md'`,
  ~2.25rem), `bg` = primary tint (`color-mix … 13%`), `color: 'primary'`, icon ~18px.
- **Badges** ([Badge.astro](../src/components/Badge.astro)): variants `default` (muted),
  `primary` (category — pass `icon`), `accent` (certs/tools/featured), `difficulty`. Mono,
  small, uppercase-ish. Use `categoryIcon()` from `consts.ts` for category badges.
- **Icons** ([Icon.astro](../src/components/Icon.astro)): lucide-style inline SVG, stroke,
  `currentColor`, 24×24 viewBox. Add new ones to the `ICONS` map. Default size 18; 13–15 in
  badges/inline, 20 in section headings.
- **Buttons:** primary = solid `bg: 'primary'` / `color: 'onPrimary'` / `borderRadius: 'md'`,
  hover `bg: 'primaryHover'` + lift; ghost = `border` + transparent, hover `borderColor: 'primary'`.
- **Links:** `color: 'primary'`, underline-on-hover (or persistent underline in prose).
  External links: `target="_blank" rel="noopener"` + an `external-link` icon when it aids clarity.
- **Internal links must end with a trailing slash** — `/blog/`, `/tools/`, `` `/blog/${id}/` ``,
  `` `/glossary/${slug}/` ``. The site sets `trailingSlash: 'always'`, so an unslashed internal link
  **404s in `astro dev`** and 308-redirects in production. File URLs keep their extension and no
  slash (`/rss.xml`). The site root is just `/`.
- **Section heading:** an `<Icon>` (primary) + sentence-case title; see About/Tools.
- **Hover cards:** companies, certs, and key tools auto-render context cards site-wide; tag a
  glossary term inline with `<Term slug="…">` (see AUTHORING + CLAUDE.md invariant 11). Triggers
  show a subtle dotted underline; keep them in prose, not headings.
- **Shared list/detail-page parts — reuse, don't rebuild.** `PageHeader` (eyebrow + title +
  description + breadcrumbs), `Breadcrumbs`, `CollapseAll` (expand/collapse a set of `<details>`),
  `TagCombobox` (typeahead search with removable facet tokens — suggestions appear at 2+ chars;
  drives Blog, Glossary, Tools, Certifications, and both MITRE maps), `FilterToggle` (the pill
  filters — "Covered only", "In glossary", "Maps to ATT&CK"; `tone` `accent`|`primary`), and
  `EntryNav` (prev/next on detail pages). The listing grids all use the shared `.card-grid` (above),
  and the two MITRE maps (`/attack-map/`, `/d3fend/`) share this whole scaffolding — extend it,
  don't fork it.
- **Experience: detailed vs. condensed.** Headline/relevant roles get full timeline cards
  (company header, per-role title + dates + one-sentence summary + skill tags). Earlier,
  contract, or foundational roles go in **one condensed block** below — a single bordered
  card listing one line each (`title · org` left, `type · year` right, mono/muted), no
  per-role detail. Keeps the trajectory visible without diluting the headline roles.

## Layout & motion

- Content max width **960px**, centered, `px: '1.25rem'`.
- Section rhythm: ~2.5–3.5rem vertical gaps; cards gap ~1–1.25rem.
- Animations are **subtle** (150–300ms) and must respect `prefers-reduced-motion`
  (the background animation disables itself; honor this for anything new).

## Accessibility

- Semantic elements (`<nav>`, `<header>`, `<main>`, `<section>`, `<ol>`); one `<h1>` per page.
- Interactive controls are real `<button>`/`<a>` with `aria-label` when icon-only.
- Decorative SVG/icons get `aria-hidden`; meaningful ones get a `label`.
- Maintain text/background contrast — rely on the semantic tokens, which are tuned per theme.
