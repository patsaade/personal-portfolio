// Site-wide configuration and shared constants.

export const SITE = {
  title: 'Patrick Saade',
  // Display wordmark (nav + footer). `title` stays formal for <title>/SEO/JSON-LD.
  brand: 'Patrick (Pat) Saade',
  brandShort: 'Pat Saade', // nav wordmark on narrow screens (avoids nav overflow)
  tagline: 'Digital Forensics & Incident Response',
  description:
    'Hands-on DFIR — digital forensics & incident response: memory & host forensics, EDR investigation, timeline reconstruction, and public lab & CTF writeups.',
  url: 'https://patricksaade.com',
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
  { href: '/tools/', label: 'Tools' },
  { href: '/about/', label: 'About' },
] as const;

// Secondary links — surfaced in the nav "More" dropdown and the footer "More" column.
export const MORE_LINKS = [
  { href: '/glossary/', label: 'Glossary' },
  { href: '/attack-map/', label: 'MITRE ATT&CK Map' },
  { href: '/d3fend/', label: 'MITRE D3FEND' },
  { href: '/certifications/', label: 'Certifications' },
  { href: '/privacy/', label: 'Privacy' },
  { href: '/colophon/', label: 'Colophon' },
] as const;

// Icon name (see Icon.astro) for each content pillar / category.
export const CATEGORY_ICONS: Record<string, string> = {
  'Memory Forensics': 'cpu',
  'Host Forensics': 'hard-drive',
  'EDR Analysis': 'shield',
  Labs: 'flask',
  Tools: 'wrench',
  Notes: 'file-text',
};

export const categoryIcon = (category: string): string =>
  CATEGORY_ICONS[category] ?? 'activity';

// Headline stats for the home page
export const STATS = [
  { icon: 'shield', title: 'Live incident response', desc: 'Containment at Red Canary' },
  { icon: 'clock', title: '3+ years hands-on', desc: 'Detection & response' },
  { icon: 'cpu', title: 'Endpoint forensics', desc: 'EDR, host & memory' },
  { icon: 'award', title: 'CISSP certified', desc: 'In pursuit of GCFA / GCFE / GCIH' },
] as const;
