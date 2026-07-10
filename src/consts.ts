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
// dropdown (short enough to stay on one line), a footer column, and (see
// src/pages/dfir.astro) the /dfir/ landing page. Split into categories by
// *purpose* rather than lumping everything into one bucket — browse-and-
// look-things-up resources, the two paired MITRE framework maps, and (now
// that there are 11 of them) the interactive tools split further by
// workflow shape: extractors, converters, binary-artifact parsers, and
// query/rule builders.
// `icon` is consumed by ToolSidebar's icon rail (see invariant 13) — every
// DFIR_GROUPS entry across all six categories needs one, since the rail
// renders all of them together in one list. Every icon across all six arrays
// must be unique (a repeat makes two different destinations look like the
// same one at a glance) and as literally relevant to its own label as
// possible — pick the most fitting icon per entry first, then break any
// collision by giving ground to whichever entry is less central to that
// icon's meaning.
// Nav labels here are kept short — ToolSidebar's expanded rail width
// (`RAIL_EXPANDED_W`) is sized to the longest current label with no
// truncation ever added, so a tool's fuller descriptive name belongs on its
// own page (H1/title), not here. `description` is the one-line card blurb
// used on /dfir/ only — Navigation/Footer/ToolSidebar ignore it.
const REFERENCE_LINKS: { href: string; label: string; icon: IconName; description: string }[] = [
  { href: '/tools/', label: 'Tool Catalog', icon: 'wrench', description: 'Free & open-source DFIR tools, grouped by platform.' },
  { href: '/tools/cheatsheet/', label: 'Command Cheat Sheet', icon: 'terminal', description: 'Verified DFIR commands for the toolkit, by platform.' },
  { href: '/glossary/', label: 'Glossary', icon: 'book-open', description: 'A cybersecurity & DFIR glossary.' },
  { href: '/event-ids/', label: 'Event ID Reference', icon: 'file-text', description: 'Windows Security + Sysmon event IDs that matter for DFIR.' },
];

// The two MITRE framework maps — kept together since they're explicit
// offensive/defensive counterparts, cross-linked throughout the site.
const FRAMEWORK_LINKS: { href: string; label: string; icon: IconName; description: string }[] = [
  { href: '/attack-map/', label: 'MITRE ATT&CK Coverage Map', icon: 'crosshair', description: 'MITRE ATT&CK techniques covered across the site.' },
  { href: '/d3fend/', label: 'MITRE D3FEND Map', icon: 'shield', description: 'MITRE D3FEND defensive techniques, mapped to ATT&CK.' },
];

// Tools that pull structured indicators out of freeform pasted text.
const EXTRACTOR_LINKS: { href: string; label: string; icon: IconName; description: string }[] = [
  { href: '/tools/ioc-extractor/', label: 'IOC Extractor', icon: 'alert-triangle', description: 'Paste a log or report and extract every IOC it contains.' },
  { href: '/tools/email-header-analyzer/', label: 'Email Header Analyzer', icon: 'mail', description: 'Walk the Received chain and read SPF/DKIM/DMARC verdicts.' },
  { href: '/tools/regex-tester/', label: 'Regex Tester', icon: 'search', description: 'Live regex playground with a library of common DFIR patterns.' },
];

// Tools that transform or compute a value (a timestamp, a hash, an
// obfuscated blob) rather than extract structure from it.
const CONVERTER_LINKS: { href: string; label: string; icon: IconName; description: string }[] = [
  { href: '/tools/timestamp-converter/', label: 'Timestamp Decoder', icon: 'clock', description: 'Bidirectional converter across 19 timestamp/epoch formats.' },
  { href: '/tools/hash-calculator/', label: 'Hash Calculator', icon: 'check', description: 'Compute, verify, and identify hashes — entirely local.' },
  { href: '/tools/deobfuscator/', label: 'Deobfuscator', icon: 'key', description: 'Chain Base64/hex/XOR/gzip steps to peel back obfuscated payloads.' },
];

// Tools that parse a specific Windows binary artifact format end to end.
const ARTIFACT_PARSER_LINKS: { href: string; label: string; icon: IconName; description: string }[] = [
  { href: '/tools/pe-explorer/', label: 'PE Header Explorer', icon: 'layers', description: 'Parse a local EXE/DLL — headers, sections, imports, imphash.' },
  { href: '/tools/lnk-parser/', label: 'LNK Parser', icon: 'link', description: "Parse a .lnk shortcut file's headers and embedded target path." },
  { href: '/tools/mft-usn-analyzer/', label: 'Timestomp Analyzer', icon: 'hard-drive', description: 'Compare $SI vs $FN timestamps in a raw MFT/USN record.' },
];

// Tools that build a piece of syntax to run elsewhere (a search engine, a
// detection pipeline) rather than analyze something already in hand.
const QUERY_BUILDER_LINKS: { href: string; label: string; icon: IconName; description: string }[] = [
  { href: '/osint/', label: 'OSINT Toolkit', icon: 'globe', description: 'Interactive search-operator (dork) builder plus recon recipes.' },
  { href: '/tools/sigma-tester/', label: 'Sigma Rule Tester', icon: 'target', description: 'Build or paste a Sigma rule and test it against sample events.' },
];

// The DFIR dropdown's category groups, in display order — also the section
// order on /dfir/ and the footer's compact anchor list, so a visitor's
// mental model of "category order" never shifts between surfaces. `id` is
// the anchor slug shared verbatim by /dfir/'s <section id> and the footer's
// `/dfir/#${id}` links (one field, not two independently-derived strings,
// so they can't drift apart); `blurb` is the one-line category summary used
// by /dfir/'s GroupOverview tiles and section intros.
export const DFIR_GROUPS = [
  { category: 'Reference', id: 'reference', blurb: 'Browse-and-look-up material — the tool catalog, command reference, glossary, and event ID lookup.', links: REFERENCE_LINKS },
  { category: 'Frameworks', id: 'frameworks', blurb: 'The two MITRE maps, cross-linked throughout the site as offensive/defensive counterparts.', links: FRAMEWORK_LINKS },
  { category: 'Extractors', id: 'extractors', blurb: 'Tools that pull structured indicators out of freeform pasted text.', links: EXTRACTOR_LINKS },
  { category: 'Converters', id: 'converters', blurb: 'Tools that transform or compute a value rather than extract structure from it.', links: CONVERTER_LINKS },
  { category: 'Artifact Parsers', id: 'artifact-parsers', blurb: 'Tools that parse a specific Windows binary artifact format end to end.', links: ARTIFACT_PARSER_LINKS },
  { category: 'Query Builders', id: 'query-builders', blurb: 'Tools that build a piece of syntax to run elsewhere, rather than analyze something already in hand.', links: QUERY_BUILDER_LINKS },
] as const;

// Secondary / meta links — surfaced in the nav "More" dropdown and footer column.
export const MORE_LINKS = [
  { href: '/certifications/', label: 'Certifications' },
  { href: '/privacy/', label: 'Privacy' },
  { href: '/colophon/', label: 'Colophon' },
] as const;

// Icon name (see Icon.astro) for each content pillar / category.
const CATEGORY_ICONS: Record<string, IconName> = {
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
