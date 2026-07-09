// Site-wide configuration and shared constants.
import type { IconName } from './components/Icon.astro';

export const SITE = {
  title: 'Patrick Saade',
  // Display wordmark (nav + footer). `title` stays formal for <title>/SEO/JSON-LD.
  brand: 'Patrick (Pat) Saade',
  brandShort: 'Pat Saade', // nav wordmark on narrow screens (avoids nav overflow)
  tagline: 'Digital Forensics & Incident Response',
  description:
    'Hands-on DFIR — digital forensics & incident response: memory & host forensics, EDR investigation, timeline reconstruction, and public lab & CTF writeups.',
  // www is the canonical serving domain in production (the apex domain 307s
  // here) — every absolute URL this site generates (canonical tags, sitemap,
  // RSS, OG images, JSON-LD) should point straight at it, not through a redirect.
  url: 'https://www.patricksaade.com',
  author: 'Patrick Saade',
} as const;

export const SOCIALS = {
  linkedin: 'https://www.linkedin.com/in/patsaade',
  github: 'https://github.com/patsaade',
  credly: 'https://www.credly.com/users/patsaade',
} as const;

// Source repository — used for the footer version/commit link (see utils/version.ts).
export const REPO = 'https://github.com/patsaade/personal-portfolio';

export const NAV_LINKS = [
  { href: '/blog/', label: 'Blog' },
  { href: '/labs/', label: 'Labs' },
  { href: '/about/', label: 'About' },
] as const;

// DFIR working / reference resources, grouped under the single nav "DFIR"
// dropdown (short enough to stay on one line) and a footer column. Split
// into categories by *purpose* rather than lumping everything into one
// "Toolkit" bucket — browse-and-look-things-up resources, the two paired
// MITRE framework maps, and the interactive converter/builder tools each
// get their own labeled group.
// `icon` is consumed by ToolSidebar's icon rail (see invariant 13) — every
// DFIR_GROUPS entry across all three categories needs one now that the rail
// is site-wide, not just INTERACTIVE_TOOL_LINKS. ToolSidebar renders all 10
// icons together in one rail, so every icon across REFERENCE_LINKS +
// FRAMEWORK_LINKS + INTERACTIVE_TOOL_LINKS must be unique (a repeat makes two
// different destinations look like the same one at a glance) and as literally
// relevant to its own label as possible — pick the most fitting icon per
// entry first, then break any collision by giving ground to whichever entry
// is less central to that icon's meaning.
export const REFERENCE_LINKS: { href: string; label: string; icon: IconName }[] = [
  { href: '/tools/', label: 'Tool Catalog', icon: 'wrench' },
  { href: '/tools/cheatsheet/', label: 'Command Cheat Sheet', icon: 'terminal' },
  { href: '/glossary/', label: 'Glossary', icon: 'book-open' },
  { href: '/event-ids/', label: 'Event ID Reference', icon: 'file-text' },
];

// The two MITRE framework maps — kept together since they're explicit
// offensive/defensive counterparts, cross-linked throughout the site.
export const FRAMEWORK_LINKS: { href: string; label: string; icon: IconName }[] = [
  { href: '/attack-map/', label: 'MITRE ATT&CK Coverage Map', icon: 'crosshair' },
  { href: '/d3fend/', label: 'MITRE D3FEND Map', icon: 'shield' },
];

// Tools you *do* something with (convert, build a query) rather than browse —
// as opposed to the static reference pages above. Deliberately not `search`
// for IOC Extractor / OSINT Toolkit even though that's their own in-page
// header icon — see the uniqueness rule above REFERENCE_LINKS.
export const INTERACTIVE_TOOL_LINKS: { href: string; label: string; icon: IconName }[] = [
  { href: '/tools/timestamp-converter/', label: 'Timestamp Decoder', icon: 'clock' },
  { href: '/tools/ioc-extractor/', label: 'IOC Extractor', icon: 'alert-triangle' },
  { href: '/tools/hash-calculator/', label: 'Hash Calculator', icon: 'check' },
  { href: '/osint/', label: 'OSINT Toolkit', icon: 'globe' },
];

// The DFIR dropdown's category groups, in display order.
export const DFIR_GROUPS = [
  { category: 'Reference', links: REFERENCE_LINKS },
  { category: 'Frameworks', links: FRAMEWORK_LINKS },
  { category: 'Interactive Tools', links: INTERACTIVE_TOOL_LINKS },
] as const;

// Secondary / meta links — surfaced in the nav "More" dropdown and footer column.
export const MORE_LINKS = [
  { href: '/certifications/', label: 'Certifications' },
  { href: '/privacy/', label: 'Privacy' },
  { href: '/colophon/', label: 'Colophon' },
] as const;

// Icon name (see Icon.astro) for each content pillar / category.
export const CATEGORY_ICONS: Record<string, IconName> = {
  'Memory Forensics': 'cpu',
  'Host Forensics': 'hard-drive',
  'EDR Analysis': 'shield',
  Labs: 'flask',
  Tools: 'wrench',
  Notes: 'file-text',
};

export const categoryIcon = (category: string): IconName =>
  CATEGORY_ICONS[category] ?? 'activity';

// Headline stats for the home page
export const STATS = [
  { icon: 'shield', title: 'Live incident response', desc: 'Containment at Red Canary' },
  { icon: 'clock', title: '3+ years hands-on', desc: 'Detection & response' },
  { icon: 'cpu', title: 'Endpoint forensics', desc: 'EDR, host & memory' },
  { icon: 'award', title: 'CISSP certified', desc: 'In pursuit of GCFA / GCFE / GCIH' },
] as const;
