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
import { NETWORK_PORTS } from '../data/networkPorts';

export const prerender = true;

// Stable, hand-listed destinations that aren't collection/term pages.
const STATIC_PAGES = [
  { title: 'About', url: '/about/', kind: 'Page', desc: 'Patrick Saade — DFIR-focused security analyst.', keywords: 'about bio experience career work history' },
  { title: 'DFIR', url: '/dfir/', kind: 'Page', desc: 'Every DFIR reference and tool on this site, organized by what you\'re trying to do.', keywords: 'dfir hub overview reference tools frameworks extractors converters parsers query builders' },
  { title: 'Tool Catalog', url: '/tools/', kind: 'Page', desc: 'Free & open-source DFIR tools, grouped by platform.', keywords: 'tools toolkit catalog volatility velociraptor autopsy' },
  { title: 'DFIR Command Cheat Sheet', url: '/tools/cheatsheet/', kind: 'Page', desc: 'Genuinely useful, verified DFIR commands for the toolkit, grouped by platform.', keywords: 'cheat sheet cheatsheet quick reference commands syntax' },
  { title: 'Timestamp Decoder', url: '/tools/timestamp-converter/', kind: 'Page', desc: 'Comprehensive bidirectional timestamp/epoch converter — Unix, FILETIME, WebKit, Mac Absolute Time, .NET Ticks, UUID v1, GPS, TAI64, and text/log formats.', keywords: 'timestamp epoch converter filetime webkit unix time uuid gps tai64 date time conversion decoder' },
  { title: 'IOC Extractor', url: '/tools/ioc-extractor/', kind: 'Page', desc: 'Paste a log, alert, or report and extract every IOC it contains — IPs, domains, URLs, emails, hashes, CVE IDs, MITRE ATT&CK IDs, Bitcoin addresses — with a defang/refang toggle.', keywords: 'ioc extractor indicator of compromise defang refang hash ip domain url cve attack bitcoin triage' },
  { title: 'Hash Calculator & Verifier', url: '/tools/hash-calculator/', kind: 'Page', desc: "Compute MD5/SHA-1/SHA-256/SHA-384/SHA-512 for text or a local file, verify against a known hash, and identify a bare hash's likely algorithm with a confidence level — entirely local.", keywords: 'hash calculator verifier md5 sha1 sha256 sha512 checksum file identity ntlm identify confidence local' },
  { title: 'Deobfuscation Recipe Builder', url: '/tools/deobfuscator/', kind: 'Page', desc: 'Chain Base64/hex/URL decode, ROT13/47, single-byte XOR, and Gzip/Deflate inflate to peel back obfuscated loader and dropper payloads — entirely local.', keywords: 'deobfuscator deobfuscation recipe base64 hex xor rot13 rot47 gzip deflate inflate malware loader dropper decode' },
  { title: 'PE Header Explorer', url: '/tools/pe-explorer/', kind: 'Page', desc: 'Parse a local EXE/DLL client-side — DOS/NT headers, section table, imports/exports, and a computed imphash.', keywords: 'pe header explorer portable executable dos nt coff optional header section table import export imphash malware static analysis' },
  { title: 'LNK (Shell Link) Forensic Parser', url: '/tools/lnk-parser/', kind: 'Page', desc: 'Parse a Windows .lnk shortcut file per MS-SHLLINK — target timestamps, volume/host info, and the embedded shell item breadcrumb path.', keywords: 'lnk shell link forensic parser shortcut ms-shllink shell item id list recent files jump list' },
  { title: 'MFT & USN Journal Timestomp Analyzer', url: '/tools/mft-usn-analyzer/', kind: 'Page', desc: 'Parse a raw NTFS MFT FILE record or USN journal record, comparing $STANDARD_INFORMATION vs $FILE_NAME timestamps to flag timestomping.', keywords: 'mft usn journal timestomp analyzer ntfs standard information file name filetime anti-forensics timestamp' },
  { title: 'Email Header & Auth-Chain Analyzer', url: '/tools/email-header-analyzer/', kind: 'Page', desc: 'Paste raw email headers to walk the Received chain, read SPF/DKIM/DMARC verdicts, and flag From/Reply-To mismatches — entirely local.', keywords: 'email header analyzer received chain spf dkim dmarc phishing authentication results reply-to return-path' },
  { title: 'DFIR Regex Tester & Pattern Library', url: '/tools/regex-tester/', kind: 'Page', desc: 'Live regex playground with inline match highlighting, capture-group breakdown, and a library of common DFIR patterns (IPs, SIDs, GUIDs, paths).', keywords: 'regex tester pattern library ipv4 ipv6 sid guid windows path registry key base64' },
  { title: 'Sigma Rule Tester & Builder', url: '/tools/sigma-tester/', kind: 'Page', desc: 'Build or paste a Sigma detection rule and test it live against sample log events, with per-condition match highlighting.', keywords: 'sigma rule tester builder detection engineering yaml siem detection as code' },
  { title: 'OSINT Toolkit', url: '/osint/', kind: 'Page', desc: 'Interactive search-operator (dork) builder plus recon recipes and OSINT tools.', keywords: 'osint dork dorking google bing duckduckgo search operators recon attack surface open source intelligence' },
  { title: 'Certifications', url: '/certifications/', kind: 'Page', desc: 'Security certifications — CISSP, CompTIA, the GIAC forensics track.', keywords: 'certifications cissp giac gcfa comptia credly' },
  { title: 'Glossary', url: '/glossary/', kind: 'Page', desc: 'A cybersecurity & DFIR glossary.', keywords: 'glossary terms definitions reference' },
  { title: 'Windows Event ID / Sysmon Reference', url: '/event-ids/', kind: 'Page', desc: 'A comprehensive, fully-cited reference for Windows Security auditing log and Sysmon event IDs that matter for DFIR.', keywords: 'windows event id sysmon security log auditing reference 4624 4688 logon process creation' },
  { title: 'Network Port Reference', url: '/network-ports/', kind: 'Page', desc: 'A comprehensive, fully-cited reference for TCP/UDP ports that matter for DFIR, with confidence levels.', keywords: 'network port reference tcp udp well-known registered ephemeral dynamic iana rdp smb ssh dns c2' },
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
    ...NETWORK_PORTS.map((p) => ({
      title: `${p.port} ${p.name}`,
      url: `/network-ports/${p.slug}/`,
      kind: 'Port',
      desc: p.category,
      keywords: `${p.protocol} port ${p.port} network`.toLowerCase(),
    })),
    ...STATIC_PAGES,
  ];

  return new Response(JSON.stringify(entries), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
