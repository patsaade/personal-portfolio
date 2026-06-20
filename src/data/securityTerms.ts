// ─────────────────────────────────────────────────────────────────────────
// Cybersecurity "Term of the Day" bank — the single source of truth.
//
// Vendor-agnostic on purpose: every entry is a concept, technique, artifact, or
// model — never a product. Each field is natural prose (see docs/STYLE_GUIDE.md →
// "Glossary terms"); task instructions must never leak into a definition. This
// data drives the site-wide ticker, the /term-of-the-day/ glossary index, and
// each prerendered detail page.
//
// A small curated core lives inline below; the bulk is authored per-domain in
// src/data/terms/*.json and merged, de-duplicated, and link-sanitized at load.
//
// The daily term is chosen deterministically from the calendar date (see
// `termForDate`), so it changes every day and is the same for everyone on a
// given day — no rebuild required. Add a term by appending to SECURITY_TERMS;
// test/securityTerms.test.ts guards slug uniqueness, related-link integrity,
// and the rotation math.
// ─────────────────────────────────────────────────────────────────────────

import memoryTerms from './terms/memory.json';
import hostDiskTerms from './terms/host-disk.json';
import malwareReTerms from './terms/malware-re.json';
import networkTerms from './terms/network.json';
import adversaryTerms from './terms/adversary.json';
import credentialIdentityTerms from './terms/credential-identity.json';
import cloudTerms from './terms/cloud.json';
import cryptoTerms from './terms/crypto.json';
import detectionIrTerms from './terms/detection-ir.json';
import threatIntelTerms from './terms/threat-intel-frameworks.json';
import vulnExploitTerms from './terms/vuln-exploit.json';
import webAppEmailTerms from './terms/web-app-email.json';
import loggingTerms from './terms/logging.json';
import linuxMacMobileTerms from './terms/linux-mac-mobile.json';

export const CATEGORIES = [
  'Memory Forensics',
  'Host & Disk Forensics',
  'Malware Analysis & RE',
  'Network Forensics & C2',
  'Adversary Tactics',
  'Credential & Identity Attacks',
  'Cloud & Container Security',
  'Cryptography & Data Protection',
  'Detection, Hunting & IR',
  'Threat Intelligence & Frameworks',
  'Vulnerabilities & Exploitation',
  'Web, Email & Application Security',
  'Logging & Telemetry',
  'Linux, macOS & Mobile Forensics',
] as const;

export type SecurityCategory = (typeof CATEGORIES)[number];

export interface SecurityTerm {
  term: string;
  slug: string;
  category: SecurityCategory;
  /** Synonyms / abbreviations shown under the title. */
  aka?: string[];
  /** One-liner for the ticker and glossary cards. Keep it short. */
  short: string;
  /** What it is (plain English). */
  definition: string;
  /** Why it matters in DFIR / incident response. */
  significance: string;
  /** A concrete, investigation-flavored example. */
  example: string;
  /** Slugs of related terms (cross-links). */
  related: string[];
}

/** Icon (see Icon.astro) + blurb for each category, used on the glossary index. */
export const CATEGORY_META: Record<SecurityCategory, { icon: string; blurb: string }> = {
  'Memory Forensics': { icon: 'cpu', blurb: 'Evidence that lives only in RAM.' },
  'Host & Disk Forensics': { icon: 'hard-drive', blurb: 'Artifacts left behind on disk.' },
  'Malware Analysis & RE': { icon: 'bug', blurb: 'How malicious code hides, runs, and is reversed.' },
  'Network Forensics & C2': { icon: 'radio', blurb: 'Traffic, callbacks, tunnels, and exfil.' },
  'Adversary Tactics': { icon: 'crosshair', blurb: 'How attackers move, escalate, and evade.' },
  'Credential & Identity Attacks': { icon: 'key', blurb: 'Stealing and abusing authentication.' },
  'Cloud & Container Security': { icon: 'cloud', blurb: 'IAM, workloads, and container risk.' },
  'Cryptography & Data Protection': { icon: 'lock', blurb: 'Ciphers, hashing, keys, and PKI.' },
  'Detection, Hunting & IR': { icon: 'shield', blurb: 'Finding, scoping, and responding.' },
  'Threat Intelligence & Frameworks': { icon: 'layers', blurb: 'Actors, models, and shared language.' },
  'Vulnerabilities & Exploitation': { icon: 'alert-triangle', blurb: 'Flaws, classes, and exploit primitives.' },
  'Web, Email & Application Security': { icon: 'globe', blurb: 'Phishing, web, and app-layer attacks.' },
  'Logging & Telemetry': { icon: 'activity', blurb: 'The sources that make detection possible.' },
  'Linux, macOS & Mobile Forensics': { icon: 'terminal', blurb: 'Artifacts beyond Windows.' },
};

// Curated core — hand-written, highest-quality entries. Merged ahead of (and
// de-duplicated against) the per-domain JSON batches below.
const CURATED_TERMS: SecurityTerm[] = [
  // ── Memory Forensics ──────────────────────────────────────────────────
  {
    term: 'Order of Volatility',
    slug: 'order-of-volatility',
    category: 'Memory Forensics',
    short: 'Collect the most fleeting evidence first, before it disappears.',
    definition:
      'A principle that ranks digital evidence by how quickly it decays — from CPU registers and RAM down to disk and archival media. Investigators acquire the most volatile sources first so transient data is not lost.',
    significance:
      'In live response, powering a host down — or even waiting too long — can erase running processes, network connections, and encryption keys that exist only in memory. Following the order of volatility preserves the evidence that is hardest to recover.',
    example:
      'Capturing a RAM image and the active network connections before pulling a disk image, because a reboot would wipe that volatile state.',
    related: ['memory-acquisition', 'chain-of-custody', 'process-hollowing'],
  },
  {
    term: 'Memory Acquisition',
    slug: 'memory-acquisition',
    category: 'Memory Forensics',
    short: "Capturing a live system's RAM into an image for analysis.",
    definition:
      'The process of copying the contents of volatile memory (RAM) from a running system into a forensic image. Capture can be software-based from within the OS, or hardware- and hypervisor-assisted.',
    significance:
      'Memory holds artifacts that never touch disk — injected code, decrypted payloads, command history, and network state. A sound acquisition is the foundation of memory forensics and must change the target as little as possible.',
    example:
      'Imaging RAM from a suspected-compromised host, then parsing it for hidden processes and injected code with a memory-analysis framework.',
    related: ['order-of-volatility', 'process-hollowing', 'rootkit'],
  },

  // ── Host Forensics ────────────────────────────────────────────────────
  {
    term: 'Master File Table',
    slug: 'master-file-table',
    category: 'Host & Disk Forensics',
    aka: ['$MFT', 'MFT'],
    short: 'The NTFS index of every file — a forensic goldmine of timestamps.',
    definition:
      'The Master File Table is the core metadata structure of the NTFS file system. It holds a record for every file and directory, including names, sizes, parent references, and multiple sets of timestamps.',
    significance:
      'The $MFT can reveal files that were created, renamed, or deleted, and the gap between its $STANDARD_INFORMATION and $FILE_NAME timestamps exposes timestomping. It is often the first artifact a host examiner parses.',
    example:
      'Reconstructing the order in which an attacker dropped and deleted tools by parsing $MFT records and their timestamps.',
    related: ['timestomping', 'prefetch', 'file-carving'],
  },
  {
    term: 'Prefetch',
    slug: 'prefetch',
    category: 'Host & Disk Forensics',
    short: 'A Windows artifact proving a program ran — and when.',
    definition:
      'Prefetch files are created by Windows to speed up application launches. Each one records the executable name, a run count, and the last several execution times.',
    significance:
      'Prefetch is one of the cleanest proofs of execution on Windows — it can show that a now-deleted tool ran, how many times, and when, helping build an attacker timeline.',
    example:
      'A prefetch entry for a malicious binary that no longer exists on disk, confirming it executed three times last Tuesday.',
    related: ['master-file-table', 'windows-event-log', 'living-off-the-land'],
  },
  {
    term: 'Shellbags',
    slug: 'shellbags',
    category: 'Host & Disk Forensics',
    short: 'Registry traces of which folders a user browsed in Explorer.',
    definition:
      'Shellbags are registry keys that store the view settings of folders a user has opened in Windows Explorer. They persist even after the folder — or an external/removable volume — is gone.',
    significance:
      'They prove a user navigated to a specific path, including network shares and USB drives that no longer exist, which is powerful evidence of knowledge and access.',
    example:
      'Shellbag entries showing a user browsed an encrypted USB volume that was never imaged.',
    related: ['windows-event-log', 'master-file-table', 'timestomping'],
  },
  {
    term: 'Alternate Data Streams',
    slug: 'alternate-data-streams',
    category: 'Host & Disk Forensics',
    aka: ['ADS'],
    short: 'Hidden NTFS streams that stash data behind a normal-looking file.',
    definition:
      'NTFS lets a file carry additional named data streams beyond its main content. These Alternate Data Streams are not shown by default directory listings.',
    significance:
      'Attackers use ADS to hide payloads or scripts behind innocuous files, while the "Zone.Identifier" stream (mark-of-the-web) records that a file came from the internet — useful both ways.',
    example:
      'Malware hidden in "report.docx:evil.exe" — invisible to a normal file listing but still executable.',
    related: ['master-file-table', 'living-off-the-land', 'timestomping'],
  },
  {
    term: 'Timestomping',
    slug: 'timestomping',
    category: 'Host & Disk Forensics',
    short: 'Forging file timestamps to hide when something really happened.',
    definition:
      'An anti-forensic technique that alters a file’s timestamps to blend malicious files into normal system activity or to break timeline analysis.',
    significance:
      'It defeats naive timeline review — but NTFS keeps two timestamp sets ($STANDARD_INFORMATION and $FILE_NAME), and mismatches between them are a reliable sign of tampering.',
    example:
      'A dropped tool back-dated to 2009 to match system files — caught because its $FILE_NAME timestamps tell the real story.',
    related: ['master-file-table', 'prefetch', 'order-of-volatility'],
  },
  {
    term: 'Windows Event Log',
    slug: 'windows-event-log',
    category: 'Host & Disk Forensics',
    aka: ['EVTX', 'Event Logs'],
    short: 'Windows’ record of logons, process starts, and system activity.',
    definition:
      'Windows Event Logs (.evtx) record security, system, and application events such as logons, privilege use, service installs, and process creation.',
    significance:
      'They are central to intrusion timelines — tracking lateral movement via logon types, new-service persistence, and (with auditing on) command-line process creation. Attackers often clear them, which is itself a logged event.',
    example:
      'Event ID 4624 logon events mapping an attacker’s hop from a beachhead host to a domain controller.',
    related: ['lateral-movement', 'prefetch', 'persistence'],
  },
  {
    term: 'File Carving',
    slug: 'file-carving',
    category: 'Host & Disk Forensics',
    aka: ['Data Carving'],
    short: 'Recovering files from raw bytes using signatures, not the file system.',
    definition:
      'Carving reconstructs files by scanning raw disk or memory for known header and footer signatures and structures, independent of file-system metadata.',
    significance:
      'It recovers deleted or otherwise unreferenced data — files whose directory entries are gone but whose contents still sit in unallocated space or slack.',
    example:
      'Recovering a deleted JPEG from unallocated space by locating its 0xFFD8 header and 0xFFD9 footer.',
    related: ['master-file-table', 'memory-acquisition', 'data-exfiltration'],
  },

  // ── Malware Analysis ──────────────────────────────────────────────────
  {
    term: 'Process Hollowing',
    slug: 'process-hollowing',
    category: 'Malware Analysis & RE',
    short: 'Malware starts a legit process, then swaps its guts for malicious code.',
    definition:
      'A code-injection technique where an attacker launches a legitimate process in a suspended state, unmaps its original image, and replaces it with malicious code before resuming it. The process keeps a trusted name and path.',
    significance:
      'It lets malware masquerade as a benign, often signed program, evading naive process-name checks. Detecting it usually means comparing the on-disk image to what is actually mapped in memory.',
    example:
      'A process listed as "svchost.exe" whose in-memory code does not match the real binary on disk — a classic hollowing tell.',
    related: ['memory-acquisition', 'rootkit', 'living-off-the-land'],
  },
  {
    term: 'Entropy',
    slug: 'entropy',
    category: 'Malware Analysis & RE',
    short: 'A randomness score that flags packed or encrypted data.',
    definition:
      'In file analysis, entropy measures the randomness of a file’s bytes on a 0–8 scale. Compressed or encrypted data pushes toward the high end.',
    significance:
      'High entropy in a section of an executable is a strong hint of packing or encryption, helping triage which samples warrant deeper reverse engineering.',
    example:
      'A PE section measuring ~7.9 entropy, signaling a packed payload that must be unpacked before static analysis.',
    related: ['packing', 'sandboxing', 'yara'],
  },
  {
    term: 'Packing',
    slug: 'packing',
    category: 'Malware Analysis & RE',
    aka: ['Packer'],
    short: 'Compressing or encrypting a binary to hide its real code.',
    definition:
      'Packing wraps an executable in a layer that compresses or encrypts the original code and restores it in memory at runtime. Packers range from common compressors to bespoke crypters.',
    significance:
      'It defeats static analysis and signature matching by hiding strings and logic until execution, so analysts often must unpack — by running it under control — to see the true behavior.',
    example:
      'A sample whose only readable strings belong to the unpacking stub; its real payload appears only once it runs.',
    related: ['entropy', 'sandboxing', 'rootkit'],
  },
  {
    term: 'Sandboxing',
    slug: 'sandboxing',
    category: 'Malware Analysis & RE',
    short: 'Detonating a sample in an isolated environment to watch its behavior.',
    definition:
      'A sandbox is an instrumented, isolated environment where suspicious code is executed so analysts can observe file, registry, and network behavior without risking production systems.',
    significance:
      'Dynamic analysis reveals what packed or obfuscated malware actually does — its C2, dropped files, and persistence — that static review can miss. Capable malware tries to detect and evade sandboxes.',
    example:
      'Running a suspicious attachment in a sandbox and capturing the C2 domain it beacons to.',
    related: ['packing', 'beaconing', 'command-and-control'],
  },
  {
    term: 'Rootkit',
    slug: 'rootkit',
    category: 'Malware Analysis & RE',
    short: 'Stealth malware that hides itself deep in the OS.',
    definition:
      'A rootkit is malware designed to conceal its own presence and that of other tools, typically by hooking or modifying the operating system at the user or kernel level.',
    significance:
      'Because rootkits subvert the very APIs investigators rely on, they can hide processes and files from a live OS — which is why memory forensics, which bypasses the running OS, is essential to find them.',
    example:
      'A kernel rootkit hiding a malicious driver that is invisible to the OS but plainly listed in a memory image.',
    related: ['memory-acquisition', 'process-hollowing', 'persistence'],
  },

  // ── Network & C2 ──────────────────────────────────────────────────────
  {
    term: 'Beaconing',
    slug: 'beaconing',
    category: 'Network Forensics & C2',
    short: "Malware 'phoning home' on a regular interval.",
    definition:
      'Beaconing is the periodic check-in traffic from a compromised host to its command-and-control server, asking for instructions. It often follows a regular interval, sometimes with jitter to look less robotic.',
    significance:
      'That rhythmic pattern is a reliable network detection opportunity — spotting regular, low-volume callbacks can surface an implant even when the payload itself is unknown.',
    example:
      'A host contacting the same domain every 60 seconds (±10% jitter) — a textbook beacon.',
    related: ['command-and-control', 'dns-tunneling', 'domain-generation-algorithm'],
  },
  {
    term: 'Command and Control',
    slug: 'command-and-control',
    category: 'Network Forensics & C2',
    aka: ['C2', 'C&C'],
    short: 'The channel an attacker uses to control compromised hosts.',
    definition:
      'Command and control is the infrastructure and communication channel adversaries use to issue commands to, and receive data from, compromised systems.',
    significance:
      'Cutting off C2 is a core containment goal — without it, implants go inert. Identifying C2 domains and IPs also yields indicators to hunt across the environment.',
    example:
      'Blocking a newly identified C2 domain at the firewall to sever an active intrusion’s control channel.',
    related: ['beaconing', 'dns-tunneling', 'data-exfiltration'],
  },
  {
    term: 'DNS Tunneling',
    slug: 'dns-tunneling',
    category: 'Network Forensics & C2',
    short: 'Smuggling data or C2 inside DNS queries and responses.',
    definition:
      'DNS tunneling encodes data within DNS queries and responses, abusing a protocol that is almost always allowed out of networks to carry C2 traffic or exfiltrate data.',
    significance:
      'Because DNS is rarely blocked and often under-inspected, tunneling slips past controls that only watch HTTP. Unusually long, high-volume, or high-entropy subdomains are the tell.',
    example:
      'Long, random-looking subdomains under a single domain carrying encoded command output.',
    related: ['command-and-control', 'domain-generation-algorithm', 'data-exfiltration'],
  },
  {
    term: 'Domain Generation Algorithm',
    slug: 'domain-generation-algorithm',
    category: 'Network Forensics & C2',
    aka: ['DGA'],
    short: 'Malware that algorithmically generates many C2 domains.',
    definition:
      'A DGA programmatically produces large numbers of pseudo-random domain names that malware and its operators independently compute, so the implant can still find its C2 as domains are taken down.',
    significance:
      'It makes blunt domain blocklists ineffective and resilient to takedowns. Detection leans on the statistical randomness of the generated names.',
    example:
      'An implant querying dozens of gibberish domains per hour until one resolves to live C2.',
    related: ['command-and-control', 'beaconing', 'dns-tunneling'],
  },
  {
    term: 'Data Exfiltration',
    slug: 'data-exfiltration',
    category: 'Network Forensics & C2',
    aka: ['Exfil'],
    short: 'Stealing data out of a network to attacker-controlled systems.',
    definition:
      'Exfiltration is the unauthorized transfer of data out of a victim environment to systems the attacker controls — often staged, compressed, and encrypted first.',
    significance:
      'It is frequently the adversary’s end goal, and the moment an incident becomes a breach. Spotting large or unusual outbound transfers is both a key detection and a containment priority.',
    example:
      'A staging archive split into chunks and sent out over HTTPS to cloud storage after hours.',
    related: ['command-and-control', 'dns-tunneling', 'file-carving'],
  },

  // ── Adversary Tactics ─────────────────────────────────────────────────
  {
    term: 'Living off the Land',
    slug: 'living-off-the-land',
    category: 'Adversary Tactics',
    aka: ['LOLBins', 'LOLBAS', 'LotL'],
    short: 'Attackers abuse built-in, trusted tools instead of dropping malware.',
    definition:
      'A tradecraft approach where adversaries use legitimate, pre-installed system binaries and scripts (such as PowerShell, WMI, or certutil) to operate, rather than custom malware.',
    significance:
      'Because the tools are signed and expected, this evades allow-listing and signature detection and blends into normal admin activity — pushing defenders toward behavioral detection.',
    example:
      'Using certutil to download a payload and PowerShell to run it in memory, leaving little on disk.',
    related: ['windows-event-log', 'process-hollowing', 'persistence'],
  },
  {
    term: 'Lateral Movement',
    slug: 'lateral-movement',
    category: 'Adversary Tactics',
    short: 'Spreading from the first foothold to other systems.',
    definition:
      'Lateral movement is how an attacker pivots from an initial compromised host to additional systems, using stolen credentials, remote services, or admin tooling.',
    significance:
      'It turns a single foothold into domain-wide access, so detecting it early limits blast radius. Logon events, remote-execution traces, and new sessions are prime signals.',
    example:
      'Reusing a harvested admin hash to open an SMB session and run tools on a file server.',
    related: ['pass-the-hash', 'credential-dumping', 'windows-event-log'],
  },
  {
    term: 'Privilege Escalation',
    slug: 'privilege-escalation',
    category: 'Adversary Tactics',
    aka: ['PrivEsc'],
    short: 'Gaining higher permissions than you started with.',
    definition:
      'Privilege escalation is the act of moving from limited access to higher privileges — vertically (user to admin/SYSTEM) or horizontally (into another user’s access).',
    significance:
      'Most impactful actions — credential theft, persistence, log tampering — require elevated rights, making privesc a pivotal step defenders aim to detect and block.',
    example:
      'Abusing a misconfigured service to run code as SYSTEM from a standard-user shell.',
    related: ['credential-dumping', 'persistence', 'living-off-the-land'],
  },
  {
    term: 'Persistence',
    slug: 'persistence',
    category: 'Adversary Tactics',
    short: 'Mechanisms that keep attacker access across reboots.',
    definition:
      'Persistence is any technique that lets an adversary keep access through reboots, logoffs, or credential changes — registry run keys, scheduled tasks, services, and many more.',
    significance:
      'Persistence is what makes an intrusion durable; eradication fails if even one mechanism is missed, so enumerating all of them is central to recovery.',
    example:
      'A scheduled task that re-launches an implant at every login, surviving a reboot.',
    related: ['windows-event-log', 'living-off-the-land', 'lateral-movement'],
  },
  {
    term: 'Credential Dumping',
    slug: 'credential-dumping',
    category: 'Adversary Tactics',
    short: 'Harvesting passwords and hashes from a compromised host.',
    definition:
      'Credential dumping extracts account secrets — plaintext passwords, hashes, or tickets — from memory, the registry, or credential stores on a compromised system.',
    significance:
      'Stolen credentials fuel lateral movement and privilege escalation, often with no malware at all, which is why protecting and monitoring credential stores (like LSASS) is critical.',
    example:
      'Dumping hashes from LSASS memory, then reusing them to authenticate elsewhere.',
    related: ['pass-the-hash', 'lateral-movement', 'privilege-escalation'],
  },
  {
    term: 'Pass-the-Hash',
    slug: 'pass-the-hash',
    category: 'Adversary Tactics',
    aka: ['PtH'],
    short: 'Authenticating with a password hash instead of the password.',
    definition:
      'Pass-the-hash abuses authentication protocols that accept a password’s hash as proof of identity, letting an attacker log in with a stolen hash without ever cracking it.',
    significance:
      'It renders strong passwords moot once a hash is captured and enables fast lateral movement — which is why credential isolation and least privilege matter so much.',
    example:
      'Using an admin’s NTLM hash harvested from one host to authenticate to many others.',
    related: ['credential-dumping', 'lateral-movement', 'privilege-escalation'],
  },

  // ── IR & Detection ────────────────────────────────────────────────────
  {
    term: 'Indicator of Compromise',
    slug: 'indicator-of-compromise',
    category: 'Detection, Hunting & IR',
    aka: ['IOC'],
    short: 'Forensic breadcrumbs that a system was compromised.',
    definition:
      'An Indicator of Compromise is an observable artifact — a file hash, domain, IP, registry key, or filename — associated with malicious activity.',
    significance:
      'IOCs let teams sweep an environment for known-bad and share threat data, but they are brittle: attackers change them easily, which is why behavior-based detection has to complement them.',
    example:
      'Searching every endpoint for a malware hash and C2 domain pulled from one infected host.',
    related: ['pyramid-of-pain', 'threat-hunting', 'mitre-attack'],
  },
  {
    term: 'Dwell Time',
    slug: 'dwell-time',
    category: 'Detection, Hunting & IR',
    short: 'How long an attacker goes undetected in a network.',
    definition:
      'Dwell time is the elapsed period between an adversary’s initial compromise and their detection or eviction. It is a headline incident-response metric.',
    significance:
      'Longer dwell time means more time to move laterally, steal data, and entrench — so shrinking it through faster detection is a core program goal.',
    example:
      'An intrusion discovered 90 days after initial access — a dwell time defenders aim to cut to days.',
    related: ['threat-hunting', 'indicator-of-compromise', 'lateral-movement'],
  },
  {
    term: 'Chain of Custody',
    slug: 'chain-of-custody',
    category: 'Detection, Hunting & IR',
    short: 'The documented trail proving evidence integrity.',
    definition:
      'Chain of custody is the chronological documentation of who collected, handled, transferred, and stored a piece of evidence, and when.',
    significance:
      'It establishes that evidence was not altered, which is what makes forensic findings defensible — in court or in an internal investigation. A broken chain can render evidence worthless.',
    example:
      'Recording each handoff and hash of a disk image, from acquisition through analysis.',
    related: ['order-of-volatility', 'memory-acquisition', 'file-carving'],
  },
  {
    term: 'Threat Hunting',
    slug: 'threat-hunting',
    category: 'Detection, Hunting & IR',
    short: 'Proactively searching for threats that evaded detection.',
    definition:
      'Threat hunting is the proactive, hypothesis-driven search through data for adversary activity that automated alerts missed, rather than waiting for a tool to fire.',
    significance:
      'It catches stealthy intrusions early, reduces dwell time, and feeds new detections back into monitoring. Good hunts target behaviors (TTPs), not just known indicators.',
    example:
      'Hypothesizing an attacker used a built-in tool, then hunting its command-line usage fleet-wide.',
    related: ['pyramid-of-pain', 'dwell-time', 'mitre-attack'],
  },
  {
    term: 'YARA',
    slug: 'yara',
    category: 'Detection, Hunting & IR',
    short: 'A pattern-matching rule language to classify malware.',
    definition:
      'YARA is an open rule language and scanner that matches files or memory against patterns — strings, byte sequences, and conditions — to identify and classify malware families.',
    significance:
      'It turns analyst knowledge into shareable, reusable detection logic that works across tools and offline, bridging malware analysis and hunting.',
    example:
      'Writing a YARA rule for a family’s unique strings, then scanning memory images and endpoints for it.',
    related: ['entropy', 'packing', 'threat-hunting'],
  },

  // ── Frameworks & Models ───────────────────────────────────────────────
  {
    term: 'MITRE ATT&CK',
    slug: 'mitre-attack',
    category: 'Threat Intelligence & Frameworks',
    aka: ['ATT&CK'],
    short: 'A public knowledge base of real adversary tactics and techniques.',
    definition:
      'MITRE ATT&CK is a freely available, curated matrix of the tactics (goals) and techniques (methods) adversaries use, drawn from real-world intrusions.',
    significance:
      'It gives defenders a shared language to map detections, find coverage gaps, and describe adversary behavior consistently across tools and teams.',
    example:
      'Tagging a detection as T1003 (OS Credential Dumping) so coverage and gaps are easy to track.',
    related: ['indicator-of-compromise', 'diamond-model', 'threat-hunting'],
  },
  {
    term: 'Pyramid of Pain',
    slug: 'pyramid-of-pain',
    category: 'Threat Intelligence & Frameworks',
    short: 'Ranks indicators by how much they hurt attackers to lose.',
    definition:
      'The Pyramid of Pain ranks indicator types by how costly they are for an adversary to change — from trivial (hashes, IPs) up to tough (tools and TTPs).',
    significance:
      'It argues defenders should detect higher up the pyramid: blocking a hash is a nuisance, but detecting behavior forces real, expensive change on the adversary.',
    example:
      'Choosing to hunt an attacker’s technique rather than just blocklisting their swappable IP.',
    related: ['indicator-of-compromise', 'mitre-attack', 'threat-hunting'],
  },
  {
    term: 'Diamond Model',
    slug: 'diamond-model',
    category: 'Threat Intelligence & Frameworks',
    short: 'Links adversary, capability, infrastructure, and victim in one event.',
    definition:
      'The Diamond Model of Intrusion Analysis frames every intrusion event around four linked vertices: adversary, capability, infrastructure, and victim.',
    significance:
      'Pivoting across those relationships — say, from infrastructure to other victims — drives analysis and attribution and structures how findings connect across an investigation.',
    example:
      'Linking two intrusions by shared C2 infrastructure to infer a common adversary.',
    related: ['mitre-attack', 'pyramid-of-pain', 'command-and-control'],
  },
];

// ─── Assemble the bank, then lookup + rotation helpers (pure; unit-tested) ─────────────────────────

type RawTerm = Omit<SecurityTerm, 'category'>;
const tag = (raw: unknown, category: SecurityCategory): SecurityTerm[] =>
  (raw as RawTerm[]).map((t) => ({ ...t, category }));

// Curated core first (so it wins de-dup), then each per-domain JSON batch.
const ALL_RAW: SecurityTerm[] = [
  ...CURATED_TERMS,
  ...tag(memoryTerms, 'Memory Forensics'),
  ...tag(hostDiskTerms, 'Host & Disk Forensics'),
  ...tag(malwareReTerms, 'Malware Analysis & RE'),
  ...tag(networkTerms, 'Network Forensics & C2'),
  ...tag(adversaryTerms, 'Adversary Tactics'),
  ...tag(credentialIdentityTerms, 'Credential & Identity Attacks'),
  ...tag(cloudTerms, 'Cloud & Container Security'),
  ...tag(cryptoTerms, 'Cryptography & Data Protection'),
  ...tag(detectionIrTerms, 'Detection, Hunting & IR'),
  ...tag(threatIntelTerms, 'Threat Intelligence & Frameworks'),
  ...tag(vulnExploitTerms, 'Vulnerabilities & Exploitation'),
  ...tag(webAppEmailTerms, 'Web, Email & Application Security'),
  ...tag(loggingTerms, 'Logging & Telemetry'),
  ...tag(linuxMacMobileTerms, 'Linux, macOS & Mobile Forensics'),
];

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isComplete = (t: SecurityTerm): boolean =>
  !!(t.term && t.slug && t.short && t.definition && t.significance && t.example);

// Dedupe by slug (first occurrence wins), keeping only valid, complete entries.
const deduped: SecurityTerm[] = [];
const seenSlugs = new Set<string>();
for (const t of ALL_RAW) {
  if (!SLUG_RE.test(t.slug) || seenSlugs.has(t.slug) || !isComplete(t)) continue;
  seenSlugs.add(t.slug);
  deduped.push(t);
}

// Sanitize cross-links: drop self-links and any related slug that doesn't resolve.
const validSlugs = new Set(deduped.map((t) => t.slug));

/** The full term bank — curated core + per-domain batches, deduped + sanitized. */
export const SECURITY_TERMS: SecurityTerm[] = deduped.map((t) => ({
  ...t,
  related: (t.related ?? []).filter((r) => r !== t.slug && validSlugs.has(r)).slice(0, 4),
}));

const BY_SLUG: Map<string, SecurityTerm> = new Map(
  SECURITY_TERMS.map((t) => [t.slug, t]),
);

/** Look up a term by slug. */
export function termBySlug(slug: string): SecurityTerm | undefined {
  return BY_SLUG.get(slug);
}

/**
 * Whole days since the Unix epoch for a given calendar date. Timezone-free:
 * it treats the supplied Y/M/D as the date, so the build (UTC) and the client
 * (visitor-local) compute the same serial from the same calendar day.
 */
export function daySerial(year: number, monthIndex: number, day: number): number {
  return Math.floor(Date.UTC(year, monthIndex, day) / 86_400_000);
}

/** Map a day serial onto a bank index (safe for negative serials). */
export function termIndexForDay(serial: number, count = SECURITY_TERMS.length): number {
  return ((serial % count) + count) % count;
}

/** The term for a given date, using that date's local calendar day. */
export function termForDate(date: Date): SecurityTerm {
  const serial = daySerial(date.getFullYear(), date.getMonth(), date.getDate());
  return SECURITY_TERMS[termIndexForDay(serial)];
}
