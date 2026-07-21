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
  { slug: 'dfir', title: 'DFIR', eyebrow: 'Reference & Tools' },
  { slug: 'tools', title: 'Tool Catalog', eyebrow: 'Tooling' },
  { slug: 'tools/cheatsheet', title: 'DFIR Command Cheat Sheet', eyebrow: 'Quick Reference' },
  { slug: 'tools/timestamp-converter', title: 'Timestamp Decoder', eyebrow: 'Time & Correlation' },
  { slug: 'tools/ioc-extractor', title: 'IOC Extractor', eyebrow: 'Triage & Correlation' },
  { slug: 'tools/hash-calculator', title: 'Hash Calculator & Verifier', eyebrow: 'Triage & Correlation' },
  { slug: 'tools/email-header-analyzer', title: 'Email Header & Auth-Chain Analyzer', eyebrow: 'Triage & Correlation' },
  { slug: 'tools/regex-tester', title: 'DFIR Regex Tester & Pattern Library', eyebrow: 'Triage & Correlation' },
  { slug: 'tools/deobfuscator', title: 'Deobfuscation Recipe Builder', eyebrow: 'Malware & Static Analysis' },
  { slug: 'tools/pe-explorer', title: 'PE Header Explorer', eyebrow: 'Malware & Static Analysis' },
  { slug: 'tools/lnk-parser', title: 'LNK (Shell Link) Forensic Parser', eyebrow: 'Host Forensics' },
  { slug: 'tools/mft-usn-analyzer', title: 'MFT & USN Journal Timestomp Analyzer', eyebrow: 'Host Forensics' },
  { slug: 'osint', title: 'OSINT Toolkit', eyebrow: 'Recon & Discovery' },
  { slug: 'tools/sigma-tester', title: 'Sigma Rule Tester & Builder', eyebrow: 'Detection Engineering' },
  { slug: 'glossary', title: 'Cybersecurity glossary', eyebrow: 'Reference' },
  { slug: 'event-ids', title: 'Windows Event ID / Sysmon Reference', eyebrow: 'Reference' },
  { slug: 'network-ports', title: 'Network Port Reference', eyebrow: 'Reference' },
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
  // The bare 'glossary'/'event-ids'/'attack-map'/'d3fend' slugs are each already
  // in STATIC_SLUGS and fall through to that check below with the same result —
  // only their sub-path prefixes need handling here.
  if (s.startsWith('glossary/')) return 'glossary';
  if (s === 'word-of-the-day' || s === 'term-of-the-day') return 'glossary';
  if (s.startsWith('event-ids/')) return 'event-ids';
  if (s.startsWith('network-ports/')) return 'network-ports';
  // Every technique detail page shares its map's one card, same as glossary terms.
  if (s.startsWith('attack-map/')) return 'attack-map';
  if (s.startsWith('d3fend/')) return 'd3fend';
  if (STATIC_SLUGS.has(s)) return s;
  if (s.startsWith('blog/') || s.startsWith('labs/')) return s;
  return 'index';
}
