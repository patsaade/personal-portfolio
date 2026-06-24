// Prerendered site-wide search index, consumed by the ⌘K palette (Search.astro).
// One compact JSON file (cached) covering posts, labs, glossary terms, and key
// pages — so the whole site is searchable client-side with no backend. Mirrors
// the static-CDN model of /glossary/bank.json.
import type { APIRoute } from 'astro';
import { getSortedPosts, getSortedLabs } from '../utils/posts';
import { SECURITY_TERMS } from '../data/securityTerms';

export const prerender = true;

// Stable, hand-listed destinations that aren't collection/term pages.
const STATIC_PAGES = [
  { title: 'About', url: '/about/', kind: 'Page', desc: 'Patrick Saade — DFIR-focused security analyst.', keywords: 'about bio experience career work history' },
  { title: 'The DFIR toolkit', url: '/tools/', kind: 'Page', desc: 'Free & open-source DFIR tools, grouped by platform.', keywords: 'tools toolkit volatility velociraptor autopsy' },
  { title: 'Certifications', url: '/certifications/', kind: 'Page', desc: 'Security certifications — CISSP, CompTIA, the GIAC forensics track.', keywords: 'certifications cissp giac gcfa comptia credly' },
  { title: 'Glossary', url: '/glossary/', kind: 'Page', desc: 'A cybersecurity & DFIR glossary.', keywords: 'glossary terms definitions reference' },
  { title: 'ATT&CK coverage map', url: '/attack-map/', kind: 'Page', desc: 'MITRE ATT&CK techniques covered across the site.', keywords: 'mitre attack techniques tactics coverage matrix' },
  { title: 'Blog', url: '/blog/', kind: 'Page', desc: 'DFIR deep dives.', keywords: 'blog posts writeups articles' },
  { title: 'Labs', url: '/labs/', kind: 'Page', desc: 'Lab & CTF writeups.', keywords: 'labs ctf writeups cyberdefenders 13cubed' },
];

export const GET: APIRoute = async () => {
  const [posts, labs] = await Promise.all([getSortedPosts(), getSortedLabs()]);

  const entries = [
    ...posts.map((p) => ({
      title: p.data.title,
      url: `/blog/${p.id}/`,
      kind: 'Post',
      desc: p.data.excerpt,
      keywords: `${p.data.tags.join(' ')} ${p.data.category} ${p.data.tools.join(' ')}`.toLowerCase(),
    })),
    ...labs.map((l) => ({
      title: l.data.title,
      url: `/labs/${l.id}/`,
      kind: 'Lab',
      desc: l.data.excerpt,
      keywords: `${l.data.tags.join(' ')} ${l.data.source} ${l.data.tools.join(' ')}`.toLowerCase(),
    })),
    ...SECURITY_TERMS.map((t) => ({
      title: t.term,
      url: `/glossary/${t.slug}/`,
      kind: 'Term',
      desc: t.short,
      keywords: `${(t.aka ?? []).join(' ')} ${t.category}`.toLowerCase(),
    })),
    ...STATIC_PAGES,
  ];

  return new Response(JSON.stringify(entries), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
