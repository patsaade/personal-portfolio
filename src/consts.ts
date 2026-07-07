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
export const REFERENCE_LINKS = [
  { href: '/tools/', label: 'Tool Catalog' },
  { href: '/tools/cheatsheet/', label: 'Command Cheat Sheet' },
  { href: '/glossary/', label: 'Glossary' },
] as const;

// The two MITRE framework maps — kept together since they're explicit
// offensive/defensive counterparts, cross-linked throughout the site.
export const FRAMEWORK_LINKS = [
  { href: '/attack-map/', label: 'MITRE ATT&CK Coverage Map' },
  { href: '/d3fend/', label: 'MITRE D3FEND Map' },
] as const;

// Tools you *do* something with (convert, build a query) rather than browse —
// as opposed to the static reference pages above.
export const INTERACTIVE_TOOL_LINKS = [
  { href: '/tools/timestamp-converter/', label: 'Timestamp Decoder' },
  { href: '/osint/', label: 'OSINT Toolkit' },
] as const;

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
