// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  site: 'https://patricksaade.com',
  output: 'server',
  // Enforce a single canonical URL form (matches our canonical tags + sitemap, which
  // already use trailing slashes) so /about and /about/ don't become duplicate URLs.
  trailingSlash: 'always',
  adapter: vercel({
    webAnalytics: { enabled: true },
  }),
  integrations: [mdx(), sitemap()],
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
