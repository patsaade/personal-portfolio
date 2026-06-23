// Single source of truth for which pages get a social card and what it says.
// Both the OG endpoint (src/pages/og/[...slug].png.ts) and BaseHead import this,
// so the per-page <meta og:image> URL always matches a generated image.
import { getCollection } from 'astro:content';
import { tagSlug } from '../utils/posts';

export interface OgEntry {
  /** Path-style slug, e.g. 'index', 'tools', 'blog/why-dfir', 'tags/dfir'. */
  slug: string;
  title: string;
  eyebrow: string;
}

// Static pages. Titles/eyebrows mirror each page's PageHeader for consistency.
const STATIC_ENTRIES: OgEntry[] = [
  { slug: 'index', title: 'Patrick Saade', eyebrow: 'DFIR portfolio & blog' },
  { slug: 'about', title: 'Patrick Saade', eyebrow: 'About' },
  { slug: 'blog', title: 'DFIR deep dives', eyebrow: 'Blog' },
  { slug: 'labs', title: 'Hands-on challenges, solved', eyebrow: 'Labs' },
  { slug: 'tools', title: 'The DFIR toolkit', eyebrow: 'Tooling' },
  { slug: 'glossary', title: 'Cybersecurity glossary', eyebrow: 'Reference' },
  { slug: 'certifications', title: 'Certifications', eyebrow: 'Credentials' },
  { slug: 'colophon', title: 'How this site is built', eyebrow: 'Colophon' },
  { slug: 'privacy', title: 'Privacy policy', eyebrow: 'Legal' },
  { slug: 'tags', title: 'Browse by tag', eyebrow: 'Index' },
];

const STATIC_SLUGS = new Set(STATIC_ENTRIES.map((e) => e.slug));

/** Every social card to generate: static pages + each post, lab, and tag. */
export async function getOgEntries(): Promise<OgEntry[]> {
  const entries: OgEntry[] = [...STATIC_ENTRIES];

  const posts = (await getCollection('blog')).filter((p) => !p.data.draft);
  for (const p of posts) {
    entries.push({ slug: `blog/${p.id}`, title: p.data.title, eyebrow: `Blog · ${p.data.category}` });
  }

  const labs = (await getCollection('labs')).filter((l) => !l.data.draft);
  for (const l of labs) {
    entries.push({ slug: `labs/${l.id}`, title: l.data.title, eyebrow: `Lab · ${l.data.source}` });
  }

  const tags = new Map<string, string>();
  for (const p of posts) for (const t of p.data.tags) tags.set(tagSlug(t), t);
  for (const [slug, display] of tags) {
    entries.push({ slug: `tags/${slug}`, title: `#${display}`, eyebrow: 'Tag' });
  }

  return entries;
}

/**
 * The OG-image slug for a page path. ALWAYS resolves to a slug that
 * getOgEntries() produced, so the <meta og:image> never 404s. Glossary term
 * pages (500+) and the legacy redirect pages share the glossary card rather than
 * generating one image each.
 */
export function ogSlugForPath(pathname: string): string {
  const s = pathname.replace(/^\/+|\/+$/g, '');
  if (s === '') return 'index';
  if (s === 'glossary' || s.startsWith('glossary/')) return 'glossary';
  if (s === 'word-of-the-day' || s === 'term-of-the-day') return 'glossary';
  if (STATIC_SLUGS.has(s)) return s;
  if (s.startsWith('blog/') || s.startsWith('labs/') || s.startsWith('tags/')) return s;
  return 'index';
}
