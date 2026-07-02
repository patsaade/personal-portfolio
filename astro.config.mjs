// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  site: 'https://patricksaade.com',
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
});
