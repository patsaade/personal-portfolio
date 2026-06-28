// DFIR toolkit — the single source of truth for the Tools index (/tools/) and the
// per-tool detail pages (/tools/[slug]/). Grouped by the platform a tool runs on.
// Each tool carries a short `use` (card one-liner), a `fn` function tag, a `cost`
// licensing tag, and — for the detail page, in the glossary format — `what` it is,
// `why` it matters in DFIR, and an `example` of it in practice. `core` marks the
// tools in the day-to-day kit. Content is factual (public tools); add a tool by
// appending to its platform.

export type ToolCost = 'Open source' | 'Free' | 'Freemium';

export interface Tool {
  name: string;
  slug: string;
  use: string; // short one-liner for the card
  fn: string; // function/category tag
  url: string; // official site
  cost: ToolCost;
  core?: boolean; // in the day-to-day kit
  what?: string; // "What it is" — definition
  why?: string; // "Why it matters" — DFIR significance
  example?: string; // "In practice" — concrete example
}

export interface ToolPlatform {
  id: string;
  title: string;
  icon: string;
  blurb: string;
  tools: Tool[];
}

export const TOOL_PLATFORMS: ToolPlatform[] = [
  {
    id: 'cross',
    title: 'Cross-platform',
    icon: 'layers',
    blurb: 'Runs on Windows, macOS, and Linux.',
    tools: [
      {
        name: 'Volatility 3', slug: 'volatility-3', use: 'Memory image analysis & plugin framework', fn: 'Memory', cost: 'Open source', core: true,
        url: 'https://github.com/volatilityfoundation/volatility3',
        what: 'An open-source memory-forensics framework that parses a RAM image into processes, network connections, loaded modules, and kernel structures through a plugin system.',
        why: 'Memory holds evidence that never touches disk — injected code, decrypted payloads, live network state — so a memory framework is central to modern incident response.',
        example: 'Running the malfind plugin surfaces a process with injected, executable memory that has no backing file on disk.',
      },
      {
        name: 'MemProcFS', slug: 'memprocfs', use: 'Mount a memory image as a browsable file system', fn: 'Memory', cost: 'Open source', core: true,
        url: 'https://github.com/ufrisk/MemProcFS',
        what: 'Mounts a physical memory image (or live memory) as a virtual file system, exposing processes, handles, and artifacts as ordinary files and folders.',
        why: 'It turns memory analysis into familiar file navigation, letting an analyst triage a capture without memorizing plugin names.',
        example: 'Browsing the proc directory shows each process as a folder you can open to read its modules and strings.',
      },
      {
        name: 'Autopsy', slug: 'autopsy', use: 'GUI disk forensics & keyword/artifact analysis', fn: 'Host', cost: 'Open source', core: true,
        url: 'https://www.autopsy.com/',
        what: 'A graphical digital-forensics platform built on The Sleuth Kit for working disk images — keyword search, file carving, timelines, and artifact extraction.',
        why: 'It gives examiners a single GUI to take a disk image from end to end, with ingest modules that automate common artifact parsing.',
        example: 'Loading a disk image, the web-artifacts module reconstructs the user’s browser history and downloads for review.',
      },
      {
        name: 'The Sleuth Kit', slug: 'the-sleuth-kit', use: 'Command-line disk & file-system forensics', fn: 'Host', cost: 'Open source',
        url: 'https://www.sleuthkit.org/',
        what: 'A command-line collection of tools for disk and file-system forensics — listing files, recovering deleted entries, and walking file-system metadata.',
        why: 'It’s the scriptable engine beneath many GUI tools, ideal for repeatable, automatable disk analysis.',
        example: 'fls and icat together recover and export a deleted file straight from the raw image.',
      },
      {
        name: 'Plaso (log2timeline)', slug: 'plaso', use: 'Super-timeline generation across artifacts', fn: 'Timeline', cost: 'Open source', core: true,
        url: 'https://github.com/log2timeline/plaso',
        what: 'An engine that extracts timestamps from across an acquired system — logs, registry, browser data, file systems — into one normalized super-timeline.',
        why: 'A unified timeline collapses dozens of artifact sources into a single chronology, the backbone of most intrusion reconstructions.',
        example: 'log2timeline builds a storage file that pinpoints the minute a malicious binary first executed.',
      },
      {
        name: 'Timesketch', slug: 'timesketch', use: 'Collaborative timeline review & annotation (self-hosted)', fn: 'Timeline', cost: 'Open source', core: true,
        url: 'https://timesketch.org/',
        what: 'A collaborative, self-hosted platform for reviewing and annotating timelines (often Plaso output) with tagging, search, and shared stories.',
        why: 'Investigations are team efforts; Timesketch lets multiple analysts pivot on the same timeline and mark findings together.',
        example: 'Analysts tag the events around initial access so the rest of the team can filter straight to them.',
      },
      {
        name: 'Velociraptor', slug: 'velociraptor', use: 'Endpoint visibility & remote collection at scale', fn: 'Triage', cost: 'Open source', core: true,
        url: 'https://docs.velociraptor.app/',
        what: 'An endpoint visibility and collection platform that queries and hunts across many hosts using its VQL query language.',
        why: 'It scales triage and live response from one machine to a whole fleet, collecting artifacts on demand during an incident.',
        example: 'A single VQL hunt sweeps every endpoint for the persistence registry key tied to the intrusion.',
      },
      {
        name: 'Wireshark', slug: 'wireshark', use: 'Deep packet capture & protocol analysis', fn: 'Network', cost: 'Open source',
        url: 'https://www.wireshark.org/',
        what: 'The de-facto network protocol analyzer for capturing and dissecting traffic packet by packet across hundreds of protocols.',
        why: 'Packet-level ground truth confirms what actually crossed the wire — C2 beacons, exfil, lateral movement — when logs are ambiguous.',
        example: 'Following a TCP stream exposes the plaintext commands a backdoor exchanged with its server.',
      },
      {
        name: 'Zeek', slug: 'zeek', use: 'Network security monitoring & rich connection logs', fn: 'Network', cost: 'Open source',
        url: 'https://zeek.org/',
        what: 'A network security monitor that turns traffic into rich, structured connection and protocol logs rather than raw packets.',
        why: 'Zeek logs give compact, queryable visibility into network behavior over long periods, ideal for hunting and scoping.',
        example: 'The conn.log reveals a host beaconing to one external IP at a fixed interval all week.',
      },
      {
        name: 'Suricata', slug: 'suricata', use: 'IDS/IPS & network traffic analysis', fn: 'Network', cost: 'Open source',
        url: 'https://suricata.io/',
        what: 'A high-performance IDS/IPS and monitoring engine that matches traffic against signatures and emits alerts plus protocol metadata.',
        why: 'Signature detection flags known-bad traffic in real time and produces evidence for retrospective analysis.',
        example: 'A ruleset hit fires the moment a host downloads a payload matching a known malware signature.',
      },
      {
        name: 'Arkime', slug: 'arkime', use: 'Full-packet capture, indexing & search', fn: 'Network', cost: 'Open source',
        url: 'https://arkime.com/',
        what: 'A large-scale full-packet capture, indexing, and search system (formerly Moloch) with a web interface over stored sessions.',
        why: 'When you need to return to the actual packets weeks later, Arkime makes historical full-PCAP searchable.',
        example: 'Searching by IP and date pulls the exact session where data left the network.',
      },
      {
        name: 'YARA', slug: 'yara', use: 'Pattern-matching to identify & classify malware', fn: 'Malware', cost: 'Open source',
        url: 'https://virustotal.github.io/yara/',
        what: 'A pattern-matching engine and rule language for identifying and classifying files by textual or binary signatures.',
        why: 'YARA rules encode malware-family traits, turning analyst knowledge into reusable, shareable detections.',
        example: 'Scanning a directory, a rule flags every sample carrying a known loader’s byte pattern.',
      },
      {
        name: 'Sigma', slug: 'sigma', use: 'Vendor-neutral detection rule format & converter', fn: 'Detection', cost: 'Open source',
        url: 'https://github.com/SigmaHQ/sigma',
        what: 'A vendor-neutral, YAML-based rule format for log detections, with converters that compile rules to many SIEM query languages.',
        why: 'Sigma decouples detection logic from any one SIEM, so a rule written once can run everywhere.',
        example: 'One Sigma rule for suspicious PowerShell converts cleanly to both Splunk and Elastic queries.',
      },
      {
        name: 'Hayabusa', slug: 'hayabusa', use: 'Sigma-based Windows event log threat hunting', fn: 'Logs', cost: 'Open source',
        url: 'https://github.com/Yamato-Security/hayabusa',
        what: 'A fast Windows event-log threat-hunting tool that applies a Sigma-based ruleset to EVTX files and produces a timeline of findings.',
        why: 'It rapidly distills noisy Windows logs into a ranked list of suspicious events for triage.',
        example: 'Pointed at a host’s EVTX, it surfaces the failed-then-successful logon pattern of a password spray.',
      },
      {
        name: 'Chainsaw', slug: 'chainsaw', use: 'Fast EVTX & MFT hunting with Sigma rules', fn: 'Logs', cost: 'Open source',
        url: 'https://github.com/WithSecureLabs/chainsaw',
        what: 'A fast first-response tool for hunting through Windows Event Logs and the MFT using Sigma rules and built-in detections.',
        why: 'It gives rapid, searchable triage of the artifacts that matter first when you land on a Windows host.',
        example: 'A single run flags the service-creation events tied to lateral movement across the logs.',
      },
      {
        name: 'Ghidra', slug: 'ghidra', use: 'Software reverse-engineering suite', fn: 'Malware', cost: 'Open source',
        url: 'https://github.com/NationalSecurityAgency/ghidra',
        what: 'A full software reverse-engineering suite (from the NSA) with a disassembler and decompiler for many architectures.',
        why: 'Free decompilation puts deep static malware analysis within reach without a commercial license.',
        example: 'The decompiler reveals the domain-generation algorithm hidden inside a stripped binary.',
      },
      {
        name: 'Cutter', slug: 'cutter', use: 'Reverse-engineering platform built on rizin', fn: 'Malware', cost: 'Open source',
        url: 'https://cutter.re/',
        what: 'A free reverse-engineering platform built on the rizin framework, with a graph view, decompiler, and debugger.',
        why: 'It offers an approachable GUI for static and dynamic reverse engineering on top of an open-source engine.',
        example: 'Stepping through a function in Cutter shows how a packer unpacks its next stage.',
      },
      {
        name: 'capa', slug: 'capa', use: 'Identify capabilities in executables & shellcode', fn: 'Malware', cost: 'Open source',
        url: 'https://github.com/mandiant/capa',
        what: 'A tool that identifies capabilities in executables and shellcode by matching against a library of behavioral rules.',
        why: 'It tells you what a sample can do — persist, inject, encrypt — before you spend time reversing it.',
        example: 'capa reports that a sample can install a service and communicate over HTTP, guiding triage.',
      },
      {
        name: 'Detect It Easy', slug: 'detect-it-easy', use: 'File type, packer & compiler identification', fn: 'Malware', cost: 'Open source',
        url: 'https://github.com/horsicq/Detect-It-Easy',
        what: 'A file type, packer, and compiler identification tool (DIE) for quick static triage of unknown binaries.',
        why: 'Knowing how a sample was packed or compiled shapes the rest of the analysis plan.',
        example: 'DIE flags a binary as UPX-packed, so you unpack it before further static review.',
      },
      {
        name: 'Hindsight', slug: 'hindsight', use: 'Browser history & artifact parsing', fn: 'Host', cost: 'Open source',
        url: 'https://github.com/RyanDFIR/hindsight',
        what: 'A tool that parses Chromium-based browser history and artifacts into a reviewable timeline.',
        why: 'Browser activity often documents the human side of an intrusion — phishing clicks, downloads, webmail.',
        example: 'Hindsight reconstructs the download of a malicious installer from the user’s history.',
      },
    ],
  },
  {
    id: 'windows',
    title: 'Windows',
    icon: 'monitor',
    blurb: 'Run on a Windows analysis workstation.',
    tools: [
      {
        name: 'KAPE', slug: 'kape', use: 'Targeted artifact collection & module processing', fn: 'Triage', cost: 'Free', core: true,
        url: 'https://www.kroll.com/kape',
        what: 'Kroll Artifact Parser and Extractor — targeted collection of forensic artifacts plus module-driven processing, fast and selective.',
        why: 'It grabs just the high-value artifacts in minutes, ideal for rapid triage at scale without imaging whole disks.',
        example: 'A KAPE target collects the registry, event logs, and prefetch from a live host in one pass.',
      },
      {
        name: 'Eric Zimmerman Tools', slug: 'eric-zimmerman-tools', use: 'MFTECmd, Registry Explorer, PECmd, EvtxECmd & more', fn: 'Host', cost: 'Free', core: true,
        url: 'https://ericzimmerman.github.io/',
        what: 'A suite of free Windows forensic parsers — MFTECmd, Registry Explorer, PECmd, EvtxECmd, and more — each focused on one artifact.',
        why: 'These are the reference parsers for core Windows artifacts, trusted for accurate, examiner-grade output.',
        example: 'PECmd parses prefetch to show exactly when and how often a program ran.',
      },
      {
        name: 'WinDbg', slug: 'windbg', use: 'Kernel & user-mode debugging of dumps', fn: 'Memory', cost: 'Free', core: true,
        url: 'https://learn.microsoft.com/windows-hardware/drivers/debugger/',
        what: 'Microsoft’s debugger for user-mode and kernel-mode analysis of live systems and crash/memory dumps.',
        why: 'It’s the authoritative tool for deep Windows internals and dump analysis, shipped by the OS vendor itself.',
        example: 'Loading a kernel dump, the !process command lists the processes alive at the moment of capture.',
      },
      {
        name: 'Sysinternals Suite', slug: 'sysinternals', use: 'Procmon, Process Explorer, Autoruns, TCPView', fn: 'Triage', cost: 'Free',
        url: 'https://learn.microsoft.com/sysinternals/',
        what: 'Microsoft’s collection of Windows utilities — Process Explorer, Procmon, Autoruns, TCPView — for live system inspection.',
        why: 'They give immediate, trusted visibility into processes, autostarts, and activity during live response.',
        example: 'Autoruns lists every autostart entry, exposing a persistence mechanism at a glance.',
      },
      {
        name: 'Sysmon', slug: 'sysmon', use: 'Detailed system-activity logging for detection', fn: 'Logs', cost: 'Free',
        url: 'https://learn.microsoft.com/sysinternals/downloads/sysmon',
        what: 'A Windows system service (Sysinternals) that logs detailed process, network, and file activity to the event log.',
        why: 'Sysmon turns a host into a rich telemetry source, the foundation for many detections and investigations.',
        example: 'Process-creation events with full command lines reveal a living-off-the-land attack chain.',
      },
      {
        name: 'System Informer', slug: 'system-informer', use: 'Live process, handle & token inspection', fn: 'Triage', cost: 'Open source',
        url: 'https://systeminformer.io/',
        what: 'An open-source live process, handle, and token inspector (formerly Process Hacker) with deep system visibility.',
        why: 'It exposes what’s running right now in far more detail than Task Manager, useful for live triage.',
        example: 'Inspecting a suspicious process’s handles reveals it has injected into a browser.',
      },
      {
        name: 'FTK Imager', slug: 'ftk-imager', use: 'Disk & memory imaging plus preview (free)', fn: 'Imaging', cost: 'Free',
        url: 'https://www.exterro.com/digital-forensics-software/ftk-imager',
        what: 'A free disk and memory imaging and preview tool that creates forensic images and inspects their contents.',
        why: 'Sound, verifiable acquisition is the first step of any examination; FTK Imager is a long-standing free option.',
        example: 'It captures a verified E01 image of a suspect drive with a matching hash.',
      },
      {
        name: 'WinPmem', slug: 'winpmem', use: 'Windows physical-memory acquisition', fn: 'Memory', cost: 'Open source',
        url: 'https://github.com/Velocidex/WinPmem',
        what: 'An open-source Windows physical-memory acquisition driver and tool from the Velocidex project.',
        why: 'Reliable RAM capture preserves volatile evidence before a host is powered down.',
        example: 'WinPmem writes a full physical-memory image for later Volatility analysis.',
      },
      {
        name: 'RegRipper', slug: 'regripper', use: 'Registry hive parsing with a plugin ecosystem', fn: 'Registry', cost: 'Open source',
        url: 'https://github.com/keydet89/RegRipper3.0',
        what: 'A registry hive parser with a plugin ecosystem that extracts and interprets keys of forensic interest.',
        why: 'The registry records configuration, execution, and persistence; RegRipper automates pulling the useful parts.',
        example: 'A plugin dumps the Run keys, exposing a program set to launch at every logon.',
      },
      {
        name: 'PEStudio', slug: 'pestudio', use: 'Static PE triage & malware indicators', fn: 'Malware', cost: 'Free',
        url: 'https://www.winitor.com/',
        what: 'A static PE triage tool that surfaces indicators — imports, strings, signatures — without running the file.',
        why: 'Fast static indicators help decide whether a sample warrants deeper, riskier dynamic analysis.',
        example: 'PEStudio flags suspicious imports and a blacklisted section name in a dropped binary.',
      },
      {
        name: 'x64dbg', slug: 'x64dbg', use: 'Open-source Windows debugger', fn: 'Malware', cost: 'Open source',
        url: 'https://x64dbg.com/',
        what: 'An open-source x64/x86 debugger for Windows used for dynamic malware analysis and reverse engineering.',
        why: 'Stepping through a live sample reveals behavior that static analysis alone can miss.',
        example: 'A breakpoint on an API call catches the moment malware decrypts its configuration.',
      },
      {
        name: 'NirSoft Tools', slug: 'nirsoft', use: 'Focused artifact viewers (browser, USB, more)', fn: 'Host', cost: 'Free',
        url: 'https://www.nirsoft.net/',
        what: 'A large set of small, focused Windows utilities for viewing specific artifacts — browser data, USB history, and more.',
        why: 'Each tool answers one artifact question quickly, handy for targeted host examination.',
        example: 'USBDeview lists every USB device ever connected, with first and last connection times.',
      },
      {
        name: 'Loki', slug: 'loki', use: 'IOC & YARA scanner for compromise checks', fn: 'Malware', cost: 'Open source',
        url: 'https://github.com/Neo23x0/Loki',
        what: 'An open-source IOC and YARA scanner for checking endpoints for signs of known compromise.',
        why: 'It provides a quick, free way to sweep a host for known indicators during triage.',
        example: 'Loki matches a filename IOC and a YARA rule, flagging a host as suspicious.',
      },
    ],
  },
  {
    id: 'macos-linux',
    title: 'macOS & Linux',
    icon: 'terminal',
    blurb: 'Run on a macOS or Linux workstation.',
    tools: [
      {
        name: 'SANS SIFT Workstation', slug: 'sift-workstation', use: 'Pre-built DFIR analysis environment', fn: 'Platform', cost: 'Free', core: true,
        url: 'https://www.sans.org/tools/sift-workstation/',
        what: 'A free, pre-built Ubuntu-based DFIR analysis environment bundling a broad set of open-source forensic tools.',
        why: 'It gives examiners a ready, consistent toolkit without assembling and configuring everything by hand.',
        example: 'A fresh SIFT VM already has Plaso, The Sleuth Kit, and Volatility installed and ready.',
      },
      {
        name: 'REMnux', slug: 'remnux', use: 'Linux toolkit for malware analysis', fn: 'Malware', cost: 'Free',
        url: 'https://remnux.org/',
        what: 'A free Linux toolkit and distribution for reverse-engineering and analyzing malicious software.',
        why: 'It collects malware-analysis tools into one curated environment, lowering setup friction.',
        example: 'Spinning up REMnux gives instant access to tools for unpacking and inspecting a sample.',
      },
      {
        name: 'Tsurugi Linux', slug: 'tsurugi-linux', use: 'DFIR-focused Linux distribution', fn: 'Platform', cost: 'Free',
        url: 'https://tsurugi-linux.org/',
        what: 'A DFIR-focused Linux distribution preloaded with forensic, OSINT, and analysis tooling.',
        why: 'It’s a portable, ready-made lab for examiners who prefer a Linux base.',
        example: 'Booting Tsurugi live provides a controlled environment for triaging a drive.',
      },
      {
        name: 'AVML', slug: 'avml', use: 'Acquire Linux memory to an image', fn: 'Memory', cost: 'Open source',
        url: 'https://github.com/microsoft/avml',
        what: 'A small open-source tool from Microsoft to acquire physical memory from Linux systems into an image.',
        why: 'Linux RAM capture is awkward; AVML makes it a single portable command across kernels.',
        example: 'AVML writes a memory image from a compromised Linux server for offline analysis.',
      },
      {
        name: 'LiME', slug: 'lime', use: 'Linux Memory Extractor (kernel module)', fn: 'Memory', cost: 'Open source',
        url: 'https://github.com/jtsylve/LiME',
        what: 'A Loadable Kernel Module that extracts volatile memory from Linux (and Android) systems.',
        why: 'It’s a long-standing method for full Linux memory capture when loading a kernel module is acceptable.',
        example: 'Loading LiME dumps RAM to a file before the incident host is rebooted.',
      },
      {
        name: 'UAC', slug: 'uac', use: 'Unix-like Artifacts Collector (Linux/macOS/ESXi)', fn: 'Triage', cost: 'Open source',
        url: 'https://github.com/tclahr/uac',
        what: 'Unix-like Artifacts Collector — a shell script that gathers live-response data from Linux, macOS, and ESXi.',
        why: 'It standardizes artifact collection across Unix systems with nothing to install.',
        example: 'UAC bundles logs, process lists, and persistence locations from a Linux host into one archive.',
      },
      {
        name: 'mac_apt', slug: 'mac-apt', use: 'macOS artifact parsing framework', fn: 'Host', cost: 'Open source',
        url: 'https://github.com/ydkhatri/mac_apt',
        what: 'A macOS artifact parsing framework that extracts and reports on a wide range of macOS forensic artifacts.',
        why: 'macOS has its own artifact landscape; mac_apt automates parsing it from images or live systems.',
        example: 'mac_apt reconstructs user activity from Spotlight, unified logs, and plist artifacts.',
      },
      {
        name: 'aftermath', slug: 'aftermath', use: 'macOS incident-response collection', fn: 'Triage', cost: 'Open source',
        url: 'https://github.com/jamf/aftermath',
        what: 'A Swift-based macOS incident-response collection framework from Jamf for gathering and processing artifacts.',
        why: 'Native macOS tooling collects current, relevant artifacts during Mac incidents.',
        example: 'Aftermath collects a Mac’s recent file and process activity into a reviewable bundle.',
      },
      {
        name: 'UnifiedLogReader', slug: 'unifiedlogreader', use: 'Parse macOS unified logs', fn: 'Logs', cost: 'Open source',
        url: 'https://github.com/ydkhatri/UnifiedLogReader',
        what: 'A tool to parse Apple’s binary Unified Logging (.tracev3) into readable records.',
        why: 'macOS unified logs hold rich activity but are opaque; this tool makes them analyzable.',
        example: 'Parsing the logs reveals process launches around the time of a suspected compromise.',
      },
    ],
  },
  {
    id: 'web',
    title: 'Web',
    icon: 'globe',
    blurb: 'Run in the browser — free to use (some have paid tiers).',
    tools: [
      {
        name: 'VirusTotal', slug: 'virustotal', use: 'Multi-engine file/URL/hash reputation & intel', fn: 'Malware', cost: 'Freemium', core: true,
        url: 'https://www.virustotal.com/',
        what: 'A web service that scans files, URLs, and hashes against dozens of engines and aggregates threat intelligence.',
        why: 'It’s the fast first-look reputation check for any indicator, with community and relationship data.',
        example: 'Pasting a hash shows 40-plus engine verdicts and which campaigns the sample is linked to.',
      },
      {
        name: 'CyberChef', slug: 'cyberchef', use: 'Decode, deobfuscate & transform data', fn: 'Utility', cost: 'Open source', core: true,
        url: 'https://gchq.github.io/CyberChef/',
        what: 'A web app (GCHQ) for decoding, deobfuscating, and transforming data through chained operations called recipes.',
        why: 'Analysts constantly decode and transform artifacts; CyberChef does it without writing scripts.',
        example: 'A recipe base64-decodes then gunzips an obfuscated PowerShell payload in one step.',
      },
      {
        name: 'urlscan.io', slug: 'urlscan', use: 'Sandbox & inspect suspicious URLs', fn: 'OSINT', cost: 'Freemium',
        url: 'https://urlscan.io/',
        what: 'A service that visits and sandboxes a URL, recording the resources, screenshots, and behavior of the page.',
        why: 'It lets you safely inspect a suspicious link without visiting it yourself.',
        example: 'Scanning a phishing URL captures the cloned login page and the domain it posts credentials to.',
      },
      {
        name: 'ANY.RUN', slug: 'any-run', use: 'Interactive online malware sandbox', fn: 'Malware', cost: 'Freemium',
        url: 'https://any.run/',
        what: 'An interactive online malware sandbox that runs a sample in a VM you can control in real time.',
        why: 'Interactivity lets analysts click through multi-stage malware that automated sandboxes miss.',
        example: 'Detonating a document, you watch it spawn PowerShell and reach out to its C2.',
      },
      {
        name: 'Hybrid Analysis', slug: 'hybrid-analysis', use: 'Free file & URL sandbox plus scanning', fn: 'Malware', cost: 'Free',
        url: 'https://www.hybrid-analysis.com/',
        what: 'A free file and URL sandbox (CrowdStrike Falcon Sandbox) with behavioral reports and scanning.',
        why: 'It provides detailed automated behavior analysis at no cost for community use.',
        example: 'Submitting a sample returns its dropped files, network calls, and ATT&CK mapping.',
      },
      {
        name: 'Joe Sandbox', slug: 'joe-sandbox', use: 'Automated malware sandbox (Cloud Basic tier)', fn: 'Malware', cost: 'Freemium',
        url: 'https://www.joesandbox.com/',
        what: 'An automated malware analysis sandbox with a free Cloud Basic tier and detailed behavior reports.',
        why: 'Deep, structured detonation reports help analysts understand a sample’s full behavior.',
        example: 'A report details the registry, file, and network changes a sample makes.',
      },
      {
        name: 'MalwareBazaar', slug: 'malwarebazaar', use: 'Search & download malware samples (abuse.ch)', fn: 'Intel', cost: 'Free',
        url: 'https://bazaar.abuse.ch/',
        what: 'An abuse.ch project for searching and downloading malware samples shared by the community.',
        why: 'Access to real samples supports detection development and hands-on analysis.',
        example: 'Searching by family pulls recent samples to test a new YARA rule against.',
      },
      {
        name: 'URLhaus', slug: 'urlhaus', use: 'Malware URL feed & lookup (abuse.ch)', fn: 'Intel', cost: 'Free',
        url: 'https://urlhaus.abuse.ch/',
        what: 'An abuse.ch feed and lookup of malware distribution URLs.',
        why: 'It supplies fresh, community-sourced indicators for blocking and enrichment.',
        example: 'A lookup confirms a URL is a known malware payload host.',
      },
      {
        name: 'ThreatFox', slug: 'threatfox', use: 'IOC search & sharing (abuse.ch)', fn: 'Intel', cost: 'Free',
        url: 'https://threatfox.abuse.ch/',
        what: 'An abuse.ch platform for searching and sharing indicators of compromise.',
        why: 'It’s a free, current IOC source to enrich and correlate findings.',
        example: 'An IP lookup returns the malware family and campaign it’s associated with.',
      },
      {
        name: 'AbuseIPDB', slug: 'abuseipdb', use: 'IP address reputation lookups', fn: 'OSINT', cost: 'Freemium',
        url: 'https://www.abuseipdb.com/',
        what: 'A community database of reported abusive IP addresses with reputation scoring.',
        why: 'It helps judge whether a source IP has a history of malicious behavior.',
        example: 'Checking an IP shows it’s been reported repeatedly for SSH brute forcing.',
      },
      {
        name: 'Shodan', slug: 'shodan', use: 'Search internet-exposed hosts & services', fn: 'OSINT', cost: 'Freemium',
        url: 'https://www.shodan.io/',
        what: 'A search engine for internet-connected hosts and services, indexing banners and exposures.',
        why: 'It reveals an organization’s external attack surface and a suspect host’s exposed services.',
        example: 'Searching an IP lists its open ports and the software versions they advertise.',
      },
      {
        name: 'GreyNoise', slug: 'greynoise', use: 'Tell targeted activity from internet scan noise', fn: 'OSINT', cost: 'Freemium',
        url: 'https://viz.greynoise.io/',
        what: 'A service that characterizes internet-wide scan and background noise to separate targeted activity from spray.',
        why: 'It helps analysts ignore opportunistic internet noise and focus on activity aimed at them.',
        example: 'An alerting IP turns out to be a benign internet-wide scanner, de-prioritizing the alert.',
      },
      {
        name: 'crt.sh', slug: 'crt-sh', use: 'Certificate transparency log search', fn: 'OSINT', cost: 'Free',
        url: 'https://crt.sh/',
        what: 'A searchable interface to Certificate Transparency logs for discovering issued TLS certificates.',
        why: 'Certificate history exposes subdomains and infrastructure relevant to scoping and OSINT.',
        example: 'Searching a domain reveals forgotten subdomains from its certificate history.',
      },
      {
        name: 'MXToolbox', slug: 'mxtoolbox', use: 'DNS, email & blocklist diagnostics', fn: 'OSINT', cost: 'Freemium',
        url: 'https://mxtoolbox.com/',
        what: 'A web toolset for DNS, email, and blocklist diagnostics and lookups.',
        why: 'Email and DNS checks support phishing investigation and infrastructure analysis.',
        example: 'An MX and SPF lookup helps validate whether a sender domain is spoofable.',
      },
      {
        name: 'Unfurl', slug: 'unfurl', use: 'Break down & visualize complex URLs', fn: 'Utility', cost: 'Open source',
        url: 'https://dfir.blog/unfurl/',
        what: 'A tool (dfir.blog) that breaks a complex URL into its components and visualizes the embedded data.',
        why: 'Many URLs encode timestamps, IDs, and tracking data useful to an investigation.',
        example: 'Unfurl decodes a long redirect URL to expose the embedded original destination.',
      },
    ],
  },
];

/** Flattened tools, each carrying its platform context (for detail pages + search). */
export interface ToolEntry extends Tool {
  platform: string;
  platformId: string;
  platformIcon: string;
}
export const TOOLS: ToolEntry[] = TOOL_PLATFORMS.flatMap((p) =>
  p.tools.map((t) => ({ ...t, platform: p.title, platformId: p.id, platformIcon: p.icon })),
);
export const TOTAL_TOOLS = TOOLS.length;
export const toolBySlug = (slug: string): ToolEntry | undefined => TOOLS.find((t) => t.slug === slug);

/** Tag tone per cost, for the shared `tag` recipe (open source = accent, freemium = primary). */
export const costTone = (cost: ToolCost): 'muted' | 'primary' | 'accent' =>
  cost === 'Open source' ? 'accent' : cost === 'Freemium' ? 'primary' : 'muted';
