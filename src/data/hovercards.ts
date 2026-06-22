// Entities for the site-wide hover/tap context cards (see components/HoverCards.astro).
//
// These are the AUTO-detected sets — companies, certifications, and a few
// distinctive tools — wrapped wherever their name appears in page content.
// Glossary TERMS are handled separately (manually, via <Term>, sourced from the
// glossary bank). Keep tool aliases distinctive to avoid matching common words.
export type EntityType = 'company' | 'cert' | 'tool';

export interface HoverEntity {
  id: string;
  type: EntityType;
  name: string;
  /** Strings to auto-match in content (longest matched first). */
  aliases: string[];
  blurb: string;
  url: string;
}

export const HOVER_ENTITIES: HoverEntity[] = [
  // ── Companies ─────────────────────────────────────────────────────────
  {
    id: 'first-american',
    type: 'company',
    name: 'First American',
    aliases: ['First American'],
    blurb: 'A Fortune 500 title-insurance and real-estate settlement-services company.',
    url: 'https://www.firstam.com/',
  },
  {
    id: 'red-canary',
    type: 'company',
    name: 'Red Canary',
    aliases: ['Red Canary'],
    blurb: 'A managed detection & response (MDR) and security-operations company, now part of Zscaler.',
    url: 'https://redcanary.com/',
  },
  {
    id: 'zscaler',
    type: 'company',
    name: 'Zscaler',
    aliases: ['Zscaler'],
    blurb: 'A cloud-security company known for zero trust and Secure Service Edge (SSE).',
    url: 'https://www.zscaler.com/',
  },
  {
    id: 'reliaquest',
    type: 'company',
    name: 'ReliaQuest',
    aliases: ['ReliaQuest'],
    blurb: 'A security-operations company behind the GreyMatter security-operations platform.',
    url: 'https://www.reliaquest.com/',
  },

  // ── Certifications ────────────────────────────────────────────────────
  {
    id: 'cissp',
    type: 'cert',
    name: 'CISSP',
    aliases: ['CISSP'],
    blurb: 'Certified Information Systems Security Professional — ISC2’s broad information-security certification.',
    url: 'https://www.isc2.org/certifications/cissp',
  },
  {
    id: 'gcfa',
    type: 'cert',
    name: 'GCFA',
    aliases: ['GCFA'],
    blurb: 'GIAC Certified Forensic Analyst — advanced incident response and host forensics.',
    url: 'https://www.giac.org/certifications/certified-forensic-analyst-gcfa/',
  },
  {
    id: 'gcfe',
    type: 'cert',
    name: 'GCFE',
    aliases: ['GCFE'],
    blurb: 'GIAC Certified Forensic Examiner — Windows forensic analysis.',
    url: 'https://www.giac.org/certifications/certified-forensic-examiner-gcfe/',
  },
  {
    id: 'gcih',
    type: 'cert',
    name: 'GCIH',
    aliases: ['GCIH'],
    blurb: 'GIAC Certified Incident Handler — detecting and responding to intrusions.',
    url: 'https://www.giac.org/certifications/certified-incident-handler-gcih/',
  },
  {
    id: 'cysa',
    type: 'cert',
    name: 'CySA+',
    aliases: ['CySA+'],
    blurb: 'CompTIA Cybersecurity Analyst — behavioral analytics and threat detection.',
    url: 'https://www.comptia.org/certifications/cybersecurity-analyst',
  },
  {
    id: 'pentest',
    type: 'cert',
    name: 'PenTest+',
    aliases: ['PenTest+'],
    blurb: 'CompTIA PenTest+ — penetration testing and vulnerability assessment.',
    url: 'https://www.comptia.org/certifications/pentest',
  },
  {
    id: 'securityx',
    type: 'cert',
    name: 'SecurityX',
    aliases: ['SecurityX', 'CASP+'],
    blurb: 'CompTIA SecurityX (formerly CASP+) — advanced security-practitioner certification.',
    url: 'https://www.comptia.org/certifications/securityx',
  },

  // ── Tools (distinctive names only — avoid common words) ────────────────
  {
    id: 'volatility',
    type: 'tool',
    name: 'Volatility 3',
    aliases: ['Volatility 3', 'Volatility'],
    blurb: 'Open-source memory-forensics framework for extracting artifacts from RAM.',
    url: 'https://github.com/volatilityfoundation/volatility3',
  },
  {
    id: 'memprocfs',
    type: 'tool',
    name: 'MemProcFS',
    aliases: ['MemProcFS'],
    blurb: 'Mounts a memory image as a browsable file system for fast triage.',
    url: 'https://github.com/ufrisk/MemProcFS',
  },
  {
    id: 'velociraptor',
    type: 'tool',
    name: 'Velociraptor',
    aliases: ['Velociraptor'],
    blurb: 'Endpoint visibility and remote evidence collection at scale.',
    url: 'https://docs.velociraptor.app/',
  },
  {
    id: 'wireshark',
    type: 'tool',
    name: 'Wireshark',
    aliases: ['Wireshark'],
    blurb: 'Deep packet capture and protocol analysis.',
    url: 'https://www.wireshark.org/',
  },
  {
    id: 'ghidra',
    type: 'tool',
    name: 'Ghidra',
    aliases: ['Ghidra'],
    blurb: 'Open-source software reverse-engineering suite.',
    url: 'https://ghidra-sre.org/',
  },
  {
    id: 'autopsy',
    type: 'tool',
    name: 'Autopsy',
    aliases: ['Autopsy'],
    blurb: 'GUI disk-forensics and artifact-analysis platform.',
    url: 'https://www.autopsy.com/',
  },
  {
    id: 'kape',
    type: 'tool',
    name: 'KAPE',
    aliases: ['KAPE'],
    blurb: 'Targeted artifact collection and module processing.',
    url: 'https://www.kroll.com/kape',
  },
  {
    id: 'cyberchef',
    type: 'tool',
    name: 'CyberChef',
    aliases: ['CyberChef'],
    blurb: 'Web app to decode, deobfuscate, and transform data.',
    url: 'https://gchq.github.io/CyberChef/',
  },
  {
    id: 'virustotal',
    type: 'tool',
    name: 'VirusTotal',
    aliases: ['VirusTotal'],
    blurb: 'Multi-engine file/URL/hash reputation and intelligence.',
    url: 'https://www.virustotal.com/',
  },
  {
    id: 'plaso',
    type: 'tool',
    name: 'Plaso',
    aliases: ['log2timeline', 'Plaso'],
    blurb: 'Super-timeline generation across many artifact types.',
    url: 'https://github.com/log2timeline/plaso',
  },
  {
    id: 'timesketch',
    type: 'tool',
    name: 'Timesketch',
    aliases: ['Timesketch'],
    blurb: 'Collaborative timeline review and annotation.',
    url: 'https://timesketch.org/',
  },
  {
    id: 'sysmon',
    type: 'tool',
    name: 'Sysmon',
    aliases: ['Sysmon'],
    blurb: 'Windows system-activity logging for richer detection telemetry.',
    url: 'https://learn.microsoft.com/sysinternals/downloads/sysmon',
  },
  {
    id: 'hayabusa',
    type: 'tool',
    name: 'Hayabusa',
    aliases: ['Hayabusa'],
    blurb: 'Sigma-based Windows event-log threat hunting.',
    url: 'https://github.com/Yamato-Security/hayabusa',
  },
];
