// Real, verified external websites/tools that complement each of the site's
// own interactive DFIR tools — researched and WebFetch-verified before
// inclusion (same no-invention discipline as eventIds.ts/tools.ts). Distinct
// from RelatedTools.astro's toolChip, which links to OTHER PAGES ON THIS
// SITE; every resource here is off-site. Keyed by the tool page's own route
// slug (the segment after /tools/, or 'osint' for the OSINT Toolkit).
export interface ExternalResource {
  name: string;
  url: string;
  blurb: string;
}

export const EXTERNAL_RESOURCES: Record<string, ExternalResource[]> = {
  'hash-calculator': [
    {
      name: 'CyberChef',
      url: 'https://gchq.github.io/CyberChef/',
      blurb: "GCHQ's browser-based \"Cyber Swiss Army Knife\" runs entirely client-side like this tool, but lets you chain hash generation with dozens of other decoding/encoding operations — useful when the data needs unwrapping (Base64, XOR, etc.) before you can even hash it.",
    },
    {
      name: 'VirusTotal',
      url: 'https://www.virustotal.com/',
      blurb: 'Paste an MD5, SHA-1, or SHA-256 into VirusTotal\'s free search box to check it against 70+ antivirus engines and community reputation data — the natural next step once this tool computes or verifies a hash and you need to know if it matches known malware.',
    },
    {
      name: 'Hashes.com Hash Type Identifier',
      url: 'https://hashes.com/en/tools/hash_identifier',
      blurb: "A free, no-signup complement to this tool's own algorithm-guessing feature, covering a much wider range of hash formats (NTLM, bcrypt, and dozens more) for bare hashes that fall outside the MD5/SHA family this tool checks.",
    },
  ],
  'ioc-extractor': [
    {
      name: 'CyberChef',
      url: 'https://gchq.github.io/CyberChef/',
      blurb: "GCHQ's browser-based \"Cyber Swiss Army Knife\" has dedicated Extract IP address/URL/Email operations plus Defang IP Address and Defang URL recipes you can chain after decoding steps (Base64, hex, gzip, etc.) — useful when the IOCs you need aren't sitting in plaintext but buried inside obfuscated or encoded log data first.",
    },
    {
      name: 'VirusTotal',
      url: 'https://www.virustotal.com/',
      blurb: 'The natural next step after extraction: paste an extracted hash, IP, domain, or URL into VirusTotal\'s free lookup to check its reputation against 70+ antivirus engines and blocklists, no account required for a basic search.',
    },
    {
      name: 'NVD (National Vulnerability Database)',
      url: 'https://nvd.nist.gov/',
      blurb: "For CVE IDs the extractor flags, NIST's own NVD is the authoritative source behind those identifiers — full descriptions, CVSS severity scores, and affected products for any CVE you search.",
    },
    {
      name: 'Blockchain.com Explorer',
      url: 'https://www.blockchain.com/explorer',
      blurb: 'For Bitcoin addresses pulled out of a ransom note or fraud report, this free block explorer lets you paste the address and instantly see its balance and full transaction history, no signup needed.',
    },
  ],
  'regex-tester': [
    {
      name: 'regex101',
      url: 'https://regex101.com/',
      blurb: 'A full-featured online regex debugger supporting PCRE2, Python, Golang, and JavaScript flavors with live match highlighting, a plain-English breakdown of every capture group, and a substitution/unit-test mode — worth reaching for when an investigation needs a specific engine\'s exact behavior or more elaborate testing than this site\'s single-flavor playground offers.',
    },
    {
      name: 'CyberChef',
      url: 'https://gchq.github.io/CyberChef/',
      blurb: "GCHQ's browser-based \"Cyber Swiss Army Knife\" chains regex extraction (via its Find/Replace and Register operations) together with base64/hex decoding, XOR, and hundreds of other transforms — the natural next step when a DFIR pattern match on this site's tester needs to feed into further decoding of obfuscated or encoded artifact data, all still fully client-side.",
    },
    {
      name: 'iHateRegex',
      url: 'https://ihateregex.io/',
      blurb: 'A community-maintained regex cheat sheet with visual railroad-diagram breakdowns and a live testing playground for common general-purpose patterns (IPs, emails, dates, phone numbers) — a useful complement to this site\'s DFIR-specific pattern library (SIDs, GUIDs, Windows paths) when a broader, non-forensics pattern is needed.',
    },
  ],
  deobfuscator: [
    {
      name: 'CyberChef',
      url: 'https://gchq.github.io/CyberChef/',
      blurb: "GCHQ's browser-based \"Cyber Swiss Army Knife\" uses the same drag-and-drop recipe-chaining idea as this tool (Base64, hex, XOR, Gunzip, ROT13…) but with 300+ operations — reach for it when a payload needs a step this tool doesn't have, like AES/RC4 decryption, regex extraction, or hex-dump parsing.",
    },
    {
      name: 'dCode.fr — XOR Cipher',
      url: 'https://www.dcode.fr/xor-cipher',
      blurb: "Adds automatic XOR key bruteforce (1–16 bytes), key-length cryptanalysis, and frequency-analysis attacks for recovering an unknown key — useful when this tool's single-byte XOR step needs a key you don't already have (dCode's companion ROT-13/ROT-47 pages cover the same rotation ciphers this tool implements).",
    },
    {
      name: 'de4js',
      url: 'https://lelinhtinh.github.io/de4js/',
      blurb: "A dedicated JavaScript deobfuscator/unpacker (eval-based packers, JJencode, AAencode, JSFuck, Dean Edwards' Packer) for droppers whose payload is obfuscated JavaScript source itself rather than Base64/hex/XOR/gzip-wrapped binary data, which is outside this tool's scope.",
    },
  ],
  'email-header-analyzer': [
    {
      name: 'MxToolbox Email Header Analyzer',
      url: 'https://mxtoolbox.com/EmailHeaders.aspx',
      blurb: "A free web-based alternative that parses the same Received chain and SPF/DKIM/DMARC results, but adds sender-IP blacklist and reputation checks this site's client-side tool doesn't perform.",
    },
    {
      name: 'Google Admin Toolbox Messageheader',
      url: 'https://toolbox.googleapps.com/apps/messageheader/',
      blurb: "Google's free header analyzer visualizes the hop-by-hop delay timeline across the Received chain, useful as a second opinion when triaging Gmail/Workspace-originated mail.",
    },
    {
      name: 'CyberChef',
      url: 'https://gchq.github.io/CyberChef/',
      blurb: "GCHQ's browser-based \"Cyber Swiss Army Knife\" complements the header tool by decoding obfuscated or encoded content (Base64, quoted-printable, URL-encoding) often found in phishing headers and bodies that a header parser alone won't unpack.",
    },
    {
      name: 'VirusTotal',
      url: 'https://www.virustotal.com/gui/home/url',
      blurb: 'The natural next step after this tool flags a Received-chain hop, sending IP, or spoofed domain: look up that indicator\'s reputation across 70+ security engines for free, with no account required for a query.',
    },
  ],
  'pe-explorer': [
    {
      name: 'PEStudio',
      url: 'https://www.winitor.com/',
      blurb: "A free/freemium Windows-only static PE inspector built specifically for malware initial assessment — it goes deeper than a headers/imports/imphash view by also flagging suspicious strings, checking imports against a blocklist of suspicious API calls, and auto-querying VirusTotal for the file's hash reputation.",
    },
    {
      name: 'VirusTotal',
      url: 'https://www.virustotal.com/',
      blurb: "Free hash/file lookup against 70+ antivirus engines and sandboxes — after computing a file's imphash or other hashes locally with PE Header Explorer, paste the hash into VirusTotal to check reputation and see if the same import-hash cluster has been seen in known malware families.",
    },
    {
      name: 'Detect It Easy (DIE)',
      url: 'https://github.com/horsicq/Detect-It-Easy',
      blurb: 'A free, open-source (MIT) file-type and packer/compiler/cryptor identification tool for PE, ELF, and Mach-O binaries — a natural next step after PE Header Explorer\'s static header parse, since a packed or encrypted section table often explains why imports/exports look sparse or obfuscated.',
    },
    {
      name: 'CFF Explorer (NTCore Explorer Suite)',
      url: 'https://ntcore.com/explorer-suite/',
      blurb: 'A free Windows PE editor/viewer with full PE32/64 and .NET support — where PE Header Explorer is read-only, CFF Explorer lets an analyst interactively edit headers, rebuild the import table, and disassemble sections for deeper manual reverse engineering.',
    },
  ],
  'lnk-parser': [
    {
      name: "Eric Zimmerman's LECmd (EZ Tools)",
      url: 'https://ericzimmerman.github.io/',
      blurb: 'The de facto industry-standard offline LNK parser (part of the free EZ Tools/KAPE suite used by FBI and Kroll IR teams), useful as a deeper, batch-capable alternative when you need to process an entire evidence set of .lnk files with CSV/timeline output rather than one file at a time in the browser.',
    },
    {
      name: '[MS-SHLLINK]: Shell Link (.LNK) Binary File Format — Microsoft Learn',
      url: 'https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-shllink/16cb4ca1-9339-4d0c-a68d-bf1d6cc0f943',
      blurb: "Microsoft's own authoritative binary-format spec that this tool's parsing logic implements, worth consulting directly when you need to verify a specific field or dig into a structure (e.g. LinkInfo, the LinkTargetIDList shell-item breadcrumb) beyond what the summarized output shows.",
    },
    {
      name: 'ExifTool',
      url: 'https://exiftool.org/',
      blurb: "Phil Harvey's widely used cross-platform metadata utility ships a dedicated LNK module, making it a handy way to cross-check a shortcut's extracted fields as part of a broader multi-format triage workflow spanning many file types at once.",
    },
    {
      name: 'LnkParse3',
      url: 'https://github.com/Matmaus/LnkParse3',
      blurb: 'An actively maintained open-source Python LNK parser with JSON output, useful as a scriptable alternative when you need to batch-process or pipeline many .lnk files programmatically instead of pasting them one at a time into a browser tool.',
    },
  ],
  'mft-usn-analyzer': [
    {
      name: "MFTECmd (Eric Zimmerman's EZ Tools)",
      url: 'https://github.com/EricZimmerman/MFTECmd',
      blurb: 'The free, actively-maintained, industry-standard command-line parser for $MFT, $J (USN journal), $LogFile, $Boot and $SDS — run it against a full disk image or extracted $MFT to batch-extract every $SI/$FN timestamp pair at scale, complementing this page\'s single-record deep dive.',
    },
    {
      name: 'USN Journal Viewer & Parser',
      url: 'https://www.usnparser.com/en',
      blurb: 'A free tool that parses a raw $UsnJrnl:$J file entirely client-side in the browser (WebAssembly, nothing uploaded to a server) and can optionally cross-reference an uploaded $MFT to resolve full paths, useful for triaging a full USN journal export before drilling into one record here.',
    },
    {
      name: 'SANS DFIR: Detecting Time Stamp Manipulation',
      url: 'https://www.sans.org/blog/digital-forensics-detecting-time-stamp-manipulation',
      blurb: 'A SANS walkthrough of a real intrusion where comparing $STANDARD_INFORMATION against $FILE_NAME timestamps exposed an attacker disguising a malicious binary as a legitimate system file — the same $SI-vs-$FN detection logic this tool automates, shown against a live case.',
    },
    {
      name: 'MITRE ATT&CK T1070.006 — Timestomp',
      url: 'https://attack.mitre.org/techniques/T1070/006/',
      blurb: "MITRE's authoritative reference for the Timestomp defense-evasion technique, including 'double timestomping' (where both $SI and $FN are altered to defeat exactly this kind of comparison) and real-world procedure examples for interpreting what a flagged mismatch actually indicates.",
    },
  ],
  'sigma-tester': [
    {
      name: 'Uncoder IO (SOC Prime)',
      url: 'https://uncoder.io/',
      blurb: 'A free browser-based IDE that translates Sigma rules into 12+ real SIEM/EDR/XDR query languages (Splunk, Elastic, Microsoft Sentinel, and more) — use it once a rule passes here to actually deploy it in a production platform.',
    },
    {
      name: 'SigmaHQ Rule Repository',
      url: 'https://github.com/SigmaHQ/sigma',
      blurb: 'The official, peer-reviewed collection of thousands of community-maintained Sigma detection rules, a ready source of real-world rules to paste into this tester and validate against your own sample log events.',
    },
    {
      name: 'Sigma Detection Format (sigmahq.io)',
      url: 'https://sigmahq.io/',
      blurb: 'The authoritative Sigma specification and documentation site, the reference to consult for full YAML syntax, field modifiers, and correlation-rule features beyond what this tool\'s built-in builder exposes.',
    },
    {
      name: 'Chainsaw (WithSecure Labs)',
      url: 'https://github.com/WithSecureLabs/chainsaw',
      blurb: 'A free, actively maintained command-line tool that runs Sigma rules directly against real Windows Event Log (EVTX) artifacts, a next step from this tool\'s sample-event testing when you need to hunt across an actual forensic dataset.',
    },
  ],
  'timestamp-converter': [
    {
      name: 'DCode (Digital Detective)',
      url: 'https://www.digital-detective.net/dcode/',
      blurb: "A free downloadable Windows forensic utility supporting dozens of timestamp formats decoded directly from raw little/big-endian hex, integers, or floats pulled out of a forensic image — the deeper reference when a value needs decoding straight from a hex dump or a format falls outside this tool's 19.",
    },
    {
      name: 'Epoch Converter',
      url: 'https://www.epochconverter.com/',
      blurb: 'A browser-based converter with dedicated sub-pages for formats like LDAP/Active Directory FILETIME, .NET ticks, and GPS time, handy as a quick second opinion to cross-check a conversion this tool just produced.',
    },
    {
      name: 'CyberChef',
      url: 'https://gchq.github.io/CyberChef/',
      blurb: 'A free, open-source, browser-only "data Swiss Army knife" with dedicated recipe operations such as From UNIX Timestamp and Windows Filetime to UNIX Timestamp, useful when a timestamp has to be pulled out of a larger blob of hex/base64 as one step in a longer decode chain rather than converted on its own.',
    },
  ],
  osint: [
    {
      name: 'OSINT Framework',
      url: 'https://osintframework.com/',
      blurb: 'A free, categorized directory of hundreds of OSINT tools and resources (usernames, email, domains, social media, and more) — a good next stop once a dork built here surfaces a lead that needs a specialized lookup tool rather than a search engine.',
    },
    {
      name: 'Google Hacking Database (GHDB)',
      url: 'https://www.exploit-db.com/google-hacking-database',
      blurb: 'Offensive Security\'s maintained archive of thousands of categorized real-world Google dorks (exposed files, login portals, error messages, vulnerable servers) — a library of proven query patterns to pull from or adapt when building custom dorks in this tool.',
    },
    {
      name: 'IntelTechniques Search Tools',
      url: 'https://inteltechniques.com/tools/',
      blurb: "Michael Bazzell's (former FBI cyber investigator) collection of purpose-built search forms that auto-generate multi-source queries for emails, usernames, phone numbers, domains, and more — complements this tool's generic dork builder with pre-built, data-type-specific OSINT search automation.",
    },
  ],
};
