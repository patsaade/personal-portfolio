import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE } from '../consts';
import { getSortedPosts, getSortedLabs } from '../utils/posts';

// Prerender the feed to a static file (output: 'server' is on-demand by default).
export const prerender = true;

export async function GET(context: APIContext) {
  const posts = await getSortedPosts();
  const labs = await getSortedLabs();

  const items = [
    ...posts.map((p) => ({
      title: p.data.title,
      pubDate: p.data.date,
      description: p.data.excerpt,
      link: `/blog/${p.id}/`,
      categories: [p.data.category, ...p.data.tags],
    })),
    ...labs.map((l) => ({
      title: l.data.title,
      pubDate: l.data.date,
      description: l.data.excerpt,
      link: `/labs/${l.id}/`,
      categories: ['Labs', l.data.source, ...l.data.tags],
    })),
  ].sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());

  // Channel metadata mirrors the live site: title/tagline/description come from
  // src/consts.ts; lastBuildDate tracks the newest item.
  const lastBuild = items[0]?.pubDate ?? new Date();

  return rss({
    title: `${SITE.title} — ${SITE.tagline}`,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items,
    trailingSlash: true,
    customData: [
      '<language>en-us</language>',
      `<lastBuildDate>${lastBuild.toUTCString()}</lastBuildDate>`,
      `<copyright>© ${new Date().getFullYear()} ${SITE.author}</copyright>`,
    ].join(''),
  });
}
