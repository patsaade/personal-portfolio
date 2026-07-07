// Single source of truth for which pages get a social card and what it says.
// Both the OG endpoint (src/pages/og/[...slug].png.ts) and BaseHead import this,
// so the per-page <meta og:image> URL always matches a generated image.
import { getCollection } from 'astro:content';

export interface OgEntry {
  /** Path-style slug, e.g. 'index', 'tools', 'blog/why-dfir'. */
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
  { slug: 'tools', title: 'Tool Catalog', eyebrow: 'Tooling' },
  { slug: 'tools/cheatsheet', title: 'DFIR Command Cheat Sheet', eyebrow: 'Quick Reference' },
  { slug: 'tools/timestamp-converter', title: 'Timestamp Decoder', eyebrow: 'Time & Correlation' },
  { slug: 'osint', title: 'OSINT Toolkit', eyebrow: 'Recon & Discovery' },
  { slug: 'glossary', title: 'Cybersecurity glossary', eyebrow: 'Reference' },
  { slug: 'attack-map', title: 'MITRE ATT&CK Coverage Map', eyebrow: 'Coverage' },
  { slug: 'd3fend', title: 'MITRE D3FEND Map', eyebrow: 'Countermeasures' },
  { slug: 'certifications', title: 'Certifications', eyebrow: 'Credentials' },
  { slug: 'colophon', title: 'How this site is built', eyebrow: 'Colophon' },
  { slug: 'privacy', title: 'Privacy policy', eyebrow: 'Legal' },
];

const STATIC_SLUGS = new Set(STATIC_ENTRIES.map((e) => e.slug));

/** Every social card to generate: static pages + each post and lab. */
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

  return entries;
}

/**
 * The OG-image slug for a page path. ALWAYS resolves to a slug that
 * getOgEntries() produced, so the <meta og:image> never 404s. Glossary term
 * pages (500+), the legacy redirect pages, and every ATT&CK/D3FEND technique
 * detail page (500+ combined) share their section's one card rather than
 * generating one image each.
 */
export function ogSlugForPath(pathname: string): string {
  const s = pathname.replace(/^\/+|\/+$/g, '');
  if (s === '') return 'index';
  if (s === 'glossary' || s.startsWith('glossary/')) return 'glossary';
  if (s === 'word-of-the-day' || s === 'term-of-the-day') return 'glossary';
  // Every technique detail page shares its map's one card, same as glossary terms.
  if (s === 'attack-map' || s.startsWith('attack-map/')) return 'attack-map';
  if (s === 'd3fend' || s.startsWith('d3fend/')) return 'd3fend';
  if (STATIC_SLUGS.has(s)) return s;
  if (s.startsWith('blog/') || s.startsWith('labs/')) return s;
  return 'index';
}
