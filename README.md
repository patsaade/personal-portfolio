<h1 align="center">patricksaade.com</h1>

<p align="center">
  A fast <strong>DFIR portfolio &amp; blog</strong> — digital forensics &amp;
  incident response, in the open.
</p>

<p align="center">
  <img alt="Astro" src="https://img.shields.io/badge/Astro-BC52EE?logo=astro&logoColor=white">
  <img alt="Panda CSS" src="https://img.shields.io/badge/Panda_CSS-E7C400?logoColor=black">
  <img alt="MDX" src="https://img.shields.io/badge/MDX-1B1F24?logo=mdx&logoColor=white">
  <img alt="Vercel" src="https://img.shields.io/badge/Vercel-000?logo=vercel&logoColor=white">
</p>

---

## ✨ Highlights

- ⚡ **Lean & fast** — content prerendered to HTML; just small inline scripts plus Vercel Web Analytics & Speed Insights.
- 🎨 **10 themes** (5 dark · 5 light) + a System / Light / Dark switch, no flash of unstyled theme.
- 📝 **MDX content** with Shiki code highlighting, auto table of contents, tags, RSS & sitemap.
- 🔍 **SEO-ready** — OG image, JSON-LD, canonical URLs, `robots.txt`, `security.txt`.
- 🔒 **Privacy-first** — cookieless Vercel analytics, no marketing trackers.

## 🚀 Quick start

```bash
npm install     # also runs `panda codegen`
npm run dev     # → http://localhost:4321
```

## 📜 Scripts

| Script | Does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | `panda codegen` + `astro build` → `.vercel/output/` |
| `npm run preview` | Serve the production build |
| `npm run check` | `astro check` (types & diagnostics) |
| `npm test` | Run the Vitest unit suite |

## 📁 Structure

```
src/
├── components/   UI — Icon, Badge, Navigation, ThemePicker, Background…
├── layouts/      BaseLayout (shell) · PostLayout (article + TOC)
├── pages/        index · blog/ · labs/ · tags/ · about · tools · 404 · rss
├── content/      MDX collections — blog/ · labs/
├── themes.ts     The 10-theme registry (single source of truth)
└── consts.ts     Site config, nav, pillars, category icons
```

## 📚 Docs

| File | What |
| --- | --- |
| [docs/AUTHORING.md](docs/AUTHORING.md) | Writing posts & lab writeups (frontmatter reference) |
| [docs/STYLE_GUIDE.md](docs/STYLE_GUIDE.md) | Design language, voice & project direction |
| [CLAUDE.md](CLAUDE.md) | Architecture invariants & conventions |

## ☁️ Deploy

Push to GitHub → import in **Vercel**. The site uses the **`@astrojs/vercel`** adapter
(`output: 'server'`; content routes are prerendered) — the build runs
`panda codegen && astro build` (see [`vercel.json`](vercel.json)) and emits the Vercel
build output. **Web Analytics** (adapter) and **Speed Insights** (`@vercel/speed-insights`)
are wired in `BaseLayout`; enable them in the Vercel dashboard to start collecting.

---

<sub>Design & front-end built with AI assistance ([Claude Code](https://claude.com/claude-code)), then reviewed & refined — see <a href="src/pages/colophon.astro">/colophon</a>. Content © Patrick Saade.</sub>
