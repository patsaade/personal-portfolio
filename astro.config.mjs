// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://patricksaade.com',
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
