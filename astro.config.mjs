// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  // www is the canonical serving domain in production (the apex domain 307s
  // here); matching it avoids a redirect hop on every generated absolute URL
  // (canonical tags, sitemap, RSS, OG images, JSON-LD).
  site: 'https://www.patricksaade.com',
  output: 'server',
  // Canonical URL form is trailing-slash (matches the canonical tags + sitemap).
  // 'always' 308-redirects any no-slash URL (typed or external) to that form;
  // internal links must therefore end in '/' (see docs/STYLE_GUIDE.md).
  trailingSlash: 'always',
  adapter: vercel({
    webAnalytics: { enabled: true },
  }),
  integrations: [
    mdx(),
    sitemap({
      // Keep the sitemap free of pages that carry a noindex meta tag — listing a
      // noindex URL in the sitemap sends crawlers a contradictory signal. Both
      // legacy URLs meta-refresh to /glossary/ and are marked noindex there.
      filter: (page) => !page.includes('/word-of-the-day/') && !page.includes('/term-of-the-day/'),
    }),
  ],
  markdown: {
    shikiConfig: {
      // Dark theme for code blocks (matches DFIR aesthetic)
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      wrap: false,
    },
  },
  image: {
    // Allow optimization of local forensics screenshots
    responsiveStyles: true,
  },
  vite: {
    build: {
      // Astro hoists non-`is:inline` component <script> tags into their own
      // chunk, then — by Vite's default assetsInlineLimit (4096 bytes) —
      // silently re-inlines any chunk under that size back into every page
      // that uses it. That's the opposite of what hoisting a shared,
      // site-wide component script (nav, background canvas, …) is for: the
      // point is one cached file, not N re-inlined copies. Only override the
      // threshold for those hoisted-script chunks (named
      // `<Component>.astro_astro_type_script_*`); everything else (images,
      // etc.) keeps Vite's normal inlining behavior.
      assetsInlineLimit: (filePath) =>
        /\.astro_astro_type_script_index_\d+_lang/.test(filePath) ? false : undefined,
    },
  },
});
