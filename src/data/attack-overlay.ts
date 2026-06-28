// Curated overlay for ATT&CK techniques — glossary links + bespoke DFIR framing
// (summary / significance / example). Hand-maintained; merged onto the generated
// MITRE data in references.ts. Add an entry to enrich a technique’s detail page.
export interface AttackOverlay {
  glossarySlug?: string;
  summary?: string;
  significance?: string;
  example?: string;
}

export const ATTACK_OVERLAY: Record<string, AttackOverlay> = {
  "T1566": {
    "glossarySlug": "phishing",
    "summary": "Sending deceptive messages — usually email — to trick recipients into opening a malicious attachment or link, or into handing over credentials.",
    "significance": "Phishing is the most common initial-access vector, so email-gateway logs, attachment detonation, and user-reported messages are a front line for catching intrusions early.",
    "example": "An employee opens a spoofed invoice email’s macro-laden attachment and unknowingly runs the first-stage loader."
  },
  "T1078": {
    "glossarySlug": "valid-accounts",
    "summary": "Accessing systems with legitimate, stolen, or default credentials as an authorized user, rather than deploying malware.",
    "significance": "Because it looks like normal authentication, it slips past malware-based detection; anomalous logon times, source locations, and impossible travel are the tells.",
    "example": "An attacker signs into the VPN with a credential bought from a broker, blending in with normal remote workers."
  },
  "T1059": {
    "glossarySlug": "living-off-the-land",
    "summary": "Abusing built-in interpreters — PowerShell, cmd, bash, WScript — to execute commands and scripts directly on a host.",
    "significance": "It underlies most living-off-the-land activity; command-line and script-block logging turn these interpreters from blind spots into rich telemetry.",
    "example": "A single PowerShell one-liner downloads and executes a payload entirely in memory."
  },
  "T1218": {
    "glossarySlug": "living-off-the-land",
    "summary": "Proxying execution of malicious code through trusted, signed system binaries (LOLBins) such as rundll32 or mshta.",
    "significance": "Signed-binary execution bypasses naive allow-listing, so detection shifts to unusual parent–child process chains and command-line arguments.",
    "example": "rundll32.exe is used to run a malicious DLL export, so the activity rides a signed Windows binary."
  },
  "T1547": {
    "glossarySlug": "persistence",
    "summary": "Persisting by configuring code to run automatically at boot or logon — registry Run keys, the Startup folder, and similar autostart points.",
    "significance": "These autostart locations are a finite, well-known set, which makes them prime hunting ground for persistence during triage.",
    "example": "A registry Run key is added so the implant relaunches every time the user logs in."
  },
  "T1543.003": {
    "glossarySlug": "service-creation",
    "summary": "Creating or modifying a Windows service so the service control manager launches attacker code, typically as SYSTEM and across reboots.",
    "significance": "Service installs are durable and high-privilege; event ID 7045 and the service registry keys make new or altered services a reliable detection.",
    "example": "A new service named to mimic a legitimate one is registered to start the payload as SYSTEM at boot."
  },
  "T1053.005": {
    "glossarySlug": "scheduled-task-abuse",
    "summary": "Using the Windows Task Scheduler to run attacker code on a schedule or trigger, for persistence or delayed execution.",
    "significance": "Tasks survive reboots and can run as SYSTEM; the Task Scheduler operational log and on-disk task XML are key forensic artifacts.",
    "example": "A scheduled task fires hourly to re-launch a beacon that defenders keep killing."
  },
  "T1068": {
    "glossarySlug": "privilege-escalation",
    "summary": "Exploiting a software or kernel vulnerability to gain higher privileges than the current context allows.",
    "significance": "It often follows initial access on a low-privilege foothold; crashes, unusual driver loads, and unexpected SYSTEM-level child processes can signal it.",
    "example": "A vulnerable signed driver is exploited to jump from a standard user to SYSTEM."
  },
  "T1055": {
    "glossarySlug": "process-injection",
    "summary": "Executing code inside the address space of another live process to evade detection and inherit that process’s privileges.",
    "significance": "It defeats process-name allow-listing; finding it usually means comparing a process’s on-disk image to what is actually mapped in memory.",
    "example": "Shellcode is written into a running explorer.exe and executed on a new thread."
  },
  "T1055.012": {
    "glossarySlug": "process-hollowing",
    "summary": "Launching a legitimate process suspended, unmapping its image, and replacing it with malicious code before resuming it.",
    "significance": "The process keeps a trusted name and path while running attacker code; a mismatch between the on-disk and in-memory image is the classic tell.",
    "example": "A process listed as svchost.exe runs code that doesn’t match the real binary on disk."
  },
  "T1014": {
    "glossarySlug": "rootkit",
    "summary": "Malware that hides its own presence, and that of other tools, by hooking or modifying the OS at the user or kernel level.",
    "significance": "Because rootkits subvert the very APIs investigators rely on, memory forensics — which bypasses the running OS — is essential to surface them.",
    "example": "A malicious kernel driver hides its files from the live OS but is plainly visible in a memory image."
  },
  "T1027": {
    "glossarySlug": "entropy",
    "summary": "Making files or commands hard to analyze through encoding, encryption, or packing to defeat static detection.",
    "significance": "Obfuscation hides strings and logic from signatures; high entropy and decode-then-execute patterns are strong triage signals.",
    "example": "A script is layered in base64 and string concatenation so its true commands only resolve at runtime."
  },
  "T1027.002": {
    "glossarySlug": "packing",
    "summary": "Compressing or encrypting an executable so its real code is only restored in memory at runtime.",
    "significance": "Packing defeats static analysis and signatures, so analysts unpack — often by controlled detonation — to reveal the true payload.",
    "example": "A sample’s only readable strings belong to its unpacking stub; the real payload appears once it runs."
  },
  "T1070": {
    "glossarySlug": "indicator-of-compromise",
    "summary": "Deleting or altering evidence — logs, files, command history — to hamper detection and investigation.",
    "significance": "It is anti-forensics in action, but the clearing is often itself logged (e.g., event ID 1102), turning the cover-up into a detection.",
    "example": "The Security event log is cleared right after lateral movement — itself logged as event ID 1102."
  },
  "T1070.006": {
    "glossarySlug": "timestomping",
    "summary": "Altering a file’s timestamps to blend a malicious file into normal activity or to break timeline analysis.",
    "significance": "NTFS keeps two timestamp sets ($STANDARD_INFORMATION and $FILE_NAME); mismatches between them reliably expose timestomping.",
    "example": "A dropped tool is back-dated to match system files, but its $FILE_NAME timestamps tell the real story."
  },
  "T1564": {
    "glossarySlug": "hide-artifacts",
    "summary": "Concealing files, processes, windows, or accounts so operators and tooling overlook attacker activity.",
    "significance": "Hidden artifacts let intrusions operate in plain sight; knowing where attackers hide things, and which views omit them, is what surfaces them.",
    "example": "A payload is tucked into an NTFS alternate data stream so it never shows in a directory listing."
  },
  "T1564.004": {
    "glossarySlug": "alternate-data-streams",
    "summary": "Hiding data in NTFS alternate data streams or extended attributes, behind an innocuous-looking file.",
    "significance": "ADS content does not appear in normal directory listings; the Zone.Identifier stream also records mark-of-the-web provenance.",
    "example": "Malware hides in report.docx:evil.exe — invisible to a normal listing but still executable."
  },
  "T1003": {
    "glossarySlug": "credential-dumping",
    "summary": "Extracting account secrets — plaintext passwords, hashes, or tickets — from memory, the registry, or credential stores.",
    "significance": "Stolen credentials fuel lateral movement and privilege escalation, which is why monitoring access to stores like LSASS is critical.",
    "example": "Hashes are pulled from LSASS memory and reused to authenticate across the domain."
  },
  "T1003.001": {
    "glossarySlug": "memory-acquisition",
    "summary": "Reading the LSASS process memory to harvest the credentials Windows caches there for authenticated sessions.",
    "significance": "LSASS access by unusual processes is a high-fidelity detection; Credential Guard and Protected Process Light raise the bar against it.",
    "example": "A tool opens a handle to lsass.exe and dumps its memory to harvest cached credentials."
  },
  "T1550.002": {
    "glossarySlug": "pass-the-hash",
    "summary": "Authenticating with a captured NTLM password hash instead of the cleartext password, without ever cracking it.",
    "significance": "It renders strong passwords moot once a hash is captured; logon type and NTLM-authentication patterns help spot the reuse.",
    "example": "An admin’s NTLM hash captured on one host is used to open SMB sessions on dozens of others."
  },
  "T1021": {
    "glossarySlug": "lateral-movement",
    "summary": "Using remote-access services — SMB, RDP, WinRM, SSH — with valid credentials to move between systems.",
    "significance": "It is the backbone of lateral movement; new sessions, logon events, and service-specific logs reveal the hops.",
    "example": "Stolen credentials open an RDP session from the beachhead to a file server."
  },
  "T1057": {
    "glossarySlug": "process-discovery",
    "summary": "Enumerating running processes to learn what is installed — security agents, sandboxes, and candidate injection targets.",
    "significance": "It often precedes evasion or escalation; the discovery commands themselves (e.g., tasklist) are a behavioral signal.",
    "example": "On landing, the implant lists running processes to check for EDR before deploying its next stage."
  },
  "T1071": {
    "glossarySlug": "command-and-control",
    "summary": "Hiding command-and-control inside common application protocols like HTTP(S), DNS, or SMTP to blend with normal traffic.",
    "significance": "Because the protocol is expected, detection leans on traffic patterns — regular beacons, odd user-agents, and volume anomalies.",
    "example": "A beacon checks in over HTTPS every 60 seconds, hiding in normal web traffic."
  },
  "T1071.004": {
    "glossarySlug": "dns-tunneling",
    "summary": "Tunnelling command-and-control or data through DNS queries and responses, abusing a protocol that is almost always allowed out.",
    "significance": "DNS is rarely blocked and often under-inspected; long, high-entropy, or high-volume subdomains are the tell.",
    "example": "Command output is exfiltrated as long, encoded subdomain lookups under a single attacker domain."
  },
  "T1568.002": {
    "glossarySlug": "domain-generation-algorithm",
    "summary": "Algorithmically generating many candidate C2 domains so an implant can still find its server as domains are taken down.",
    "significance": "It defeats static domain blocklists, so detection leans on the statistical randomness of the queried names.",
    "example": "An implant queries dozens of gibberish domains per hour until one resolves to live C2."
  },
  "T1573": {
    "glossarySlug": "beaconing",
    "summary": "Encrypting command-and-control traffic — with standard TLS or a custom scheme — to conceal its content.",
    "significance": "Payloads are hidden, so detection shifts to metadata: JA3/JA4 fingerprints, certificate oddities, and beacon timing.",
    "example": "C2 traffic is wrapped in TLS with a self-signed certificate, so only the metadata is visible."
  },
  "T1102": {
    "glossarySlug": "web-service-c2",
    "summary": "Routing command-and-control through legitimate web services — paste sites, cloud storage, social platforms — so traffic goes to reputable domains.",
    "significance": "Trusted destinations evade reputation and blocklist controls, so behavioral cues and content inspection are needed instead.",
    "example": "The implant fetches its next command from a public paste URL and posts data to a cloud bucket."
  },
  "T1560": {
    "glossarySlug": "data-staging",
    "summary": "Compressing and often encrypting collected data into an archive to stage it for exfiltration.",
    "significance": "Staging archives in temp or user directories just before an outbound transfer is a strong pre-exfiltration signal.",
    "example": "Collected documents are zipped and split into chunks in a temp folder before being sent out."
  },
  "T1041": {
    "glossarySlug": "data-exfiltration",
    "summary": "Sending stolen data back out over the same channel the implant already uses for command-and-control.",
    "significance": "Reusing the C2 channel avoids new connections; unusual outbound volume on an existing beacon is the tell.",
    "example": "Stolen files are streamed back over the same HTTPS beacon the implant already uses."
  },
  "T1567": {
    "glossarySlug": "data-exfiltration",
    "summary": "Uploading stolen data to a legitimate external web service — cloud storage or a sharing site — to blend with normal usage.",
    "significance": "Exfil to trusted SaaS domains evades blocklists, so DLP, upload-volume baselines, and egress monitoring are the controls.",
    "example": "An archive is uploaded to a personal cloud-storage account to blend with normal SaaS traffic."
  },
  "T1029": {
    "glossarySlug": "data-exfiltration",
    "summary": "Timing data exfiltration to specific hours or intervals so it blends with normal business traffic.",
    "significance": "Scheduling dampens the signal of a single large transfer; correlating periodic outbound spikes helps surface it.",
    "example": "Exfiltration is timed to business hours so the outbound spike hides in normal activity."
  },
  "T1486": {
    "glossarySlug": "ransomware",
    "summary": "Encrypting files, drives, or systems to deny access — the core action of ransomware.",
    "significance": "It is the destructive endgame; mass file-modification rates, shadow-copy deletion, and ransom notes are detection and triage anchors.",
    "example": "Files across network shares are encrypted and a ransom note is dropped in every directory."
  },
  "T1490": {
    "glossarySlug": "inhibit-system-recovery",
    "summary": "Deleting or disabling recovery options — Volume Shadow Copies, backups, automatic repair — to prevent rollback.",
    "significance": "Shadow-copy deletion (e.g., via vssadmin) is a high-fidelity ransomware precursor that defenders alert on aggressively.",
    "example": "vssadmin is run to delete all Volume Shadow Copies seconds before encryption begins."
  }
};
