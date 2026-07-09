// Prerendered site-wide search index, consumed by the ⌘K palette (Search.astro).
// One compact JSON file (cached) covering posts, labs, glossary terms, and key
// pages — so the whole site is searchable client-side with no backend. Mirrors
// the static-CDN model of /glossary/bank.json.
import type { APIRoute } from 'astro';
import { getSortedPosts, getSortedLabs } from '../utils/posts';
import { SECURITY_TERMS } from '../data/securityTerms';
import { ATTACK_TECHNIQUES } from '../data/references';
import { D3FEND_TECHNIQUES } from '../data/d3fend';
import { TOOLS } from '../data/tools';
import { EVENT_IDS } from '../data/eventIds';

export const prerender = true;

// Stable, hand-listed destinations that aren't collection/term pages.
const STATIC_PAGES = [
  { title: 'About', url: '/about/', kind: 'Page', desc: 'Patrick Saade — DFIR-focused security analyst.', keywords: 'about bio experience career work history' },
  { title: 'Tool Catalog', url: '/tools/', kind: 'Page', desc: 'Free & open-source DFIR tools, grouped by platform.', keywords: 'tools toolkit catalog volatility velociraptor autopsy' },
  { title: 'DFIR Command Cheat Sheet', url: '/tools/cheatsheet/', kind: 'Page', desc: 'Genuinely useful, verified DFIR commands for the toolkit, grouped by platform.', keywords: 'cheat sheet cheatsheet quick reference commands syntax' },
  { title: 'Timestamp Decoder', url: '/tools/timestamp-converter/', kind: 'Page', desc: 'Comprehensive bidirectional timestamp/epoch converter — Unix, FILETIME, WebKit, Mac Absolute Time, .NET Ticks, UUID v1, GPS, TAI64, and text/log formats.', keywords: 'timestamp epoch converter filetime webkit unix time uuid gps tai64 date time conversion decoder' },
  { title: 'IOC Extractor', url: '/tools/ioc-extractor/', kind: 'Page', desc: 'Paste a log, alert, or report and extract every IOC it contains — IPs, domains, URLs, emails, hashes, CVE IDs, MITRE ATT&CK IDs, Bitcoin addresses — with a defang/refang toggle.', keywords: 'ioc extractor indicator of compromise defang refang hash ip domain url cve attack bitcoin triage' },
  { title: 'Hash Calculator & Verifier', url: '/tools/hash-calculator/', kind: 'Page', desc: "Compute MD5/SHA-1/SHA-256/SHA-384/SHA-512 for text or a local file, verify against a known hash, and identify a bare hash's likely algorithm with a confidence level — entirely local.", keywords: 'hash calculator verifier md5 sha1 sha256 sha512 checksum file identity ntlm identify confidence local' },
  { title: 'OSINT Toolkit', url: '/osint/', kind: 'Page', desc: 'Interactive search-operator (dork) builder plus recon recipes and OSINT tools.', keywords: 'osint dork dorking google bing duckduckgo search operators recon attack surface open source intelligence' },
  { title: 'Certifications', url: '/certifications/', kind: 'Page', desc: 'Security certifications — CISSP, CompTIA, the GIAC forensics track.', keywords: 'certifications cissp giac gcfa comptia credly' },
  { title: 'Glossary', url: '/glossary/', kind: 'Page', desc: 'A cybersecurity & DFIR glossary.', keywords: 'glossary terms definitions reference' },
  { title: 'Windows Event ID / Sysmon Reference', url: '/event-ids/', kind: 'Page', desc: 'A comprehensive, fully-cited reference for Windows Security auditing log and Sysmon event IDs that matter for DFIR.', keywords: 'windows event id sysmon security log auditing reference 4624 4688 logon process creation' },
  { title: 'MITRE ATT&CK Coverage Map', url: '/attack-map/', kind: 'Page', desc: 'MITRE ATT&CK techniques covered across the site.', keywords: 'mitre attack techniques tactics coverage matrix' },
  { title: 'MITRE D3FEND map', url: '/d3fend/', kind: 'Page', desc: 'MITRE D3FEND defensive techniques, mapped to ATT&CK.', keywords: 'mitre d3fend defensive techniques tactics countermeasures harden detect isolate' },
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
    ...ATTACK_TECHNIQUES.map((t) => ({
      title: `${t.id} ${t.name}`,
      url: `/attack-map/${t.id}/`,
      kind: 'ATT&CK',
      desc: t.summary ?? '',
      keywords: `${t.tactics.join(' ')} mitre att&ck technique`.toLowerCase(),
    })),
    ...D3FEND_TECHNIQUES.map((t) => ({
      title: `${t.id} ${t.name}`,
      url: `/d3fend/${t.id}/`,
      kind: 'D3FEND',
      desc: t.definition,
      keywords: `${t.tactic} mitre d3fend defensive countermeasure technique`.toLowerCase(),
    })),
    ...TOOLS.map((t) => ({
      title: t.name,
      url: `/tools/${t.slug}/`,
      kind: 'Tool',
      desc: t.use,
      keywords: `${t.fn} ${t.cost} ${t.platform} ${t.tags.join(' ')} dfir tool`.toLowerCase(),
    })),
    ...EVENT_IDS.map((e) => ({
      title: `${e.id} ${e.name}`,
      url: `/event-ids/${e.slug}/`,
      kind: 'Event ID',
      desc: e.category,
      keywords: `${e.channel} ${e.source} windows event id sysmon`.toLowerCase(),
    })),
    ...STATIC_PAGES,
  ];

  return new Response(JSON.stringify(entries), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
