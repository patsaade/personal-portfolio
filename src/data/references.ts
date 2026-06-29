// Authoritative external references for the glossary, plus the MITRE ATT&CK
// coverage map. These point to vendor-neutral standards bodies and primary
// sources — MITRE ATT&CK / CWE / CAPEC, OWASP, NIST (CSRC, NVD, SP series),
// the RFC series, SANS, CISA, Microsoft Learn, Apple, the Linux man-pages, and
// Kubernetes — so each term can credit and link the canonical documentation for
// the concept. Every URL was machine-verified live at authoring time. Full credit
// to those organizations for the underlying source material.
//
// Generated from research; edit by appending. Term refs key off the glossary slug.

import { ATTACK_GENERATED } from './attack-techniques.generated';
import { ATTACK_OVERLAY } from './attack-overlay';

export interface Reference {
  name: string;
  url: string;
}

/** Authoritative sources per glossary category (shown on each term in it). */
export const CATEGORY_SOURCES: Record<string, Reference[]> = {
  "Memory Forensics": [
    {
      "name": "NIST CSRC — SP 800-86: Guide to Integrating Forensic Techniques into Incident Response",
      "url": "https://csrc.nist.gov/pubs/sp/800/86/final"
    },
    {
      "name": "RFC Editor — RFC 3227: Guidelines for Evidence Collection and Archiving",
      "url": "https://www.rfc-editor.org/rfc/rfc3227.html"
    },
    {
      "name": "The Volatility Foundation — Open Source Memory Forensics",
      "url": "https://volatilityfoundation.org/"
    }
  ],
  "Host & Disk Forensics": [
    {
      "name": "NIST CSRC Glossary — Digital Forensics",
      "url": "https://csrc.nist.gov/glossary/term/digital_forensics"
    },
    {
      "name": "NIST Computer Forensics Tool Testing Program (CFTT)",
      "url": "https://www.nist.gov/itl/csd/secure-systems-and-applications/computer-forensics-tool-testing-program-cftt"
    },
    {
      "name": "SANS Windows Forensic Analysis Poster (FOR500)",
      "url": "https://www.sans.org/posters/windows-forensic-analysis/"
    }
  ],
  "Malware Analysis & RE": [
    {
      "name": "MITRE ATT&CK (Enterprise Matrix)",
      "url": "https://attack.mitre.org/matrices/enterprise/"
    },
    {
      "name": "NIST Computer Security Resource Center (CSRC) Glossary",
      "url": "https://csrc.nist.gov/glossary"
    },
    {
      "name": "CISA Malware Analysis",
      "url": "https://www.cisa.gov/resources-tools/services/malware-analysis"
    }
  ],
  "Network Forensics & C2": [
    {
      "name": "MITRE ATT&CK — Command and Control (TA0011)",
      "url": "https://attack.mitre.org/tactics/TA0011/"
    },
    {
      "name": "MITRE ATT&CK — Exfiltration (TA0010)",
      "url": "https://attack.mitre.org/tactics/TA0010/"
    },
    {
      "name": "NIST Computer Security Resource Center (CSRC) Glossary",
      "url": "https://csrc.nist.gov/glossary"
    }
  ],
  "Adversary Tactics": [
    {
      "name": "MITRE ATT&CK — Enterprise Tactics",
      "url": "https://attack.mitre.org/tactics/enterprise/"
    },
    {
      "name": "CISA — Identifying and Mitigating Living Off the Land Techniques",
      "url": "https://www.cisa.gov/resources-tools/resources/identifying-and-mitigating-living-land-techniques"
    }
  ],
  "Credential & Identity Attacks": [
    {
      "name": "MITRE ATT&CK — Credential Access (TA0006)",
      "url": "https://attack.mitre.org/tactics/TA0006/"
    },
    {
      "name": "OWASP Cheat Sheet Series",
      "url": "https://cheatsheetseries.owasp.org/"
    }
  ],
  "Cloud & Container Security": [
    {
      "name": "MITRE ATT&CK — Cloud Matrix",
      "url": "https://attack.mitre.org/matrices/enterprise/cloud/"
    },
    {
      "name": "OWASP Kubernetes Top Ten",
      "url": "https://owasp.org/www-project-kubernetes-top-ten/"
    },
    {
      "name": "NIST SP 800-145: The NIST Definition of Cloud Computing",
      "url": "https://csrc.nist.gov/pubs/sp/800/145/final"
    }
  ],
  "Cryptography & Data Protection": [
    {
      "name": "NIST CSRC — Cryptographic Standards and Guidelines",
      "url": "https://csrc.nist.gov/projects/cryptographic-standards-and-guidelines"
    },
    {
      "name": "OWASP Cryptographic Storage Cheat Sheet",
      "url": "https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html"
    },
    {
      "name": "NIST CSRC Glossary",
      "url": "https://csrc.nist.gov/glossary"
    }
  ],
  "Detection, Hunting & IR": [
    {
      "name": "MITRE ATT&CK",
      "url": "https://attack.mitre.org/"
    },
    {
      "name": "NIST Computer Security Resource Center (CSRC) Glossary",
      "url": "https://csrc.nist.gov/glossary"
    },
    {
      "name": "CISA Threat Hunting",
      "url": "https://www.cisa.gov/threat-hunting"
    }
  ],
  "Threat Intelligence & Frameworks": [
    {
      "name": "MITRE ATT&CK",
      "url": "https://attack.mitre.org/"
    },
    {
      "name": "SANS Institute",
      "url": "https://www.sans.org/tools/the-pyramid-of-pain"
    }
  ],
  "Vulnerabilities & Exploitation": [
    {
      "name": "MITRE CWE (Common Weakness Enumeration)",
      "url": "https://cwe.mitre.org/"
    },
    {
      "name": "OWASP Top 10",
      "url": "https://owasp.org/www-project-top-ten/"
    },
    {
      "name": "NIST CSRC Glossary",
      "url": "https://csrc.nist.gov/glossary"
    }
  ],
  "Web, Email & Application Security": [
    {
      "name": "OWASP Foundation",
      "url": "https://owasp.org/"
    },
    {
      "name": "MITRE ATT&CK",
      "url": "https://attack.mitre.org/"
    },
    {
      "name": "RFC Editor",
      "url": "https://www.rfc-editor.org/"
    }
  ],
  "Logging & Telemetry": [
    {
      "name": "NIST SP 800-92, Guide to Computer Security Log Management",
      "url": "https://csrc.nist.gov/pubs/sp/800/92/final"
    },
    {
      "name": "MITRE ATT&CK Data Sources",
      "url": "https://attack.mitre.org/datasources/"
    },
    {
      "name": "RFC Editor (IETF logging & telemetry standards)",
      "url": "https://www.rfc-editor.org/"
    }
  ],
  "Linux, macOS & Mobile Forensics": [
    {
      "name": "NIST SP 800-101 Rev. 1 — Guidelines on Mobile Device Forensics",
      "url": "https://csrc.nist.gov/pubs/sp/800/101/r1/final"
    },
    {
      "name": "Apple Platform Security Guide",
      "url": "https://support.apple.com/guide/security/welcome/web"
    },
    {
      "name": "MITRE ATT&CK — Mobile Matrix",
      "url": "https://attack.mitre.org/matrices/mobile/"
    }
  ]
};

/** The single best canonical reference for a specific term (by slug). */
export const TERM_REFERENCES: Record<string, Reference> = {
  "order-of-volatility": {
    "name": "RFC 3227 §2.1 — Order of Volatility (Guidelines for Evidence Collection and Archiving)",
    "url": "https://www.rfc-editor.org/rfc/rfc3227.html"
  },
  "memory-acquisition": {
    "name": "NIST SP 800-86 — Guide to Integrating Forensic Techniques into Incident Response (volatile data collection)",
    "url": "https://csrc.nist.gov/pubs/sp/800/86/final"
  },
  "master-file-table": {
    "name": "Microsoft Learn — Master File Table (Local File Systems)",
    "url": "https://learn.microsoft.com/en-us/windows/win32/fileio/master-file-table"
  },
  "prefetch": {
    "name": "SANS Windows Forensic Analysis Poster (FOR500)",
    "url": "https://www.sans.org/posters/windows-forensic-analysis/"
  },
  "shellbags": {
    "name": "SANS Windows Forensic Analysis Poster (FOR500)",
    "url": "https://www.sans.org/posters/windows-forensic-analysis/"
  },
  "alternate-data-streams": {
    "name": "MITRE ATT&CK — Hide Artifacts: NTFS File Attributes (T1564.004)",
    "url": "https://attack.mitre.org/techniques/T1564/004/"
  },
  "timestomping": {
    "name": "MITRE ATT&CK — Indicator Removal: Timestomp (T1070.006)",
    "url": "https://attack.mitre.org/techniques/T1070/006/"
  },
  "windows-event-log": {
    "name": "Microsoft Learn — Windows Event Log",
    "url": "https://learn.microsoft.com/en-us/windows/win32/wes/windows-event-log"
  },
  "file-carving": {
    "name": "NIST Computer Forensics Tool Testing Program (CFTT)",
    "url": "https://www.nist.gov/itl/csd/secure-systems-and-applications/computer-forensics-tool-testing-program-cftt"
  },
  "process-hollowing": {
    "name": "MITRE ATT&CK T1055.012: Process Injection: Process Hollowing",
    "url": "https://attack.mitre.org/techniques/T1055/012/"
  },
  "entropy": {
    "name": "NIST CSRC Glossary: Entropy",
    "url": "https://csrc.nist.gov/glossary/term/entropy"
  },
  "packing": {
    "name": "MITRE ATT&CK T1027.002: Obfuscated Files or Information: Software Packing",
    "url": "https://attack.mitre.org/techniques/T1027/002/"
  },
  "sandboxing": {
    "name": "NIST CSRC Glossary: Sandbox",
    "url": "https://csrc.nist.gov/glossary/term/sandbox"
  },
  "rootkit": {
    "name": "MITRE ATT&CK T1014: Rootkit",
    "url": "https://attack.mitre.org/techniques/T1014/"
  },
  "beaconing": {
    "name": "MITRE ATT&CK — Application Layer Protocol (T1071)",
    "url": "https://attack.mitre.org/techniques/T1071/"
  },
  "command-and-control": {
    "name": "MITRE ATT&CK — Command and Control, Tactic TA0011",
    "url": "https://attack.mitre.org/tactics/TA0011/"
  },
  "dns-tunneling": {
    "name": "MITRE ATT&CK — Application Layer Protocol: DNS (T1071.004)",
    "url": "https://attack.mitre.org/techniques/T1071/004/"
  },
  "domain-generation-algorithm": {
    "name": "MITRE ATT&CK — Dynamic Resolution: Domain Generation Algorithms (T1568.002)",
    "url": "https://attack.mitre.org/techniques/T1568/002/"
  },
  "data-exfiltration": {
    "name": "NIST CSRC Glossary — Exfiltration",
    "url": "https://csrc.nist.gov/glossary/term/exfiltration"
  },
  "living-off-the-land": {
    "name": "CISA — Identifying and Mitigating Living Off the Land Techniques",
    "url": "https://www.cisa.gov/resources-tools/resources/identifying-and-mitigating-living-land-techniques"
  },
  "lateral-movement": {
    "name": "MITRE ATT&CK — Lateral Movement (TA0008)",
    "url": "https://attack.mitre.org/tactics/TA0008/"
  },
  "privilege-escalation": {
    "name": "MITRE ATT&CK — Privilege Escalation (TA0004)",
    "url": "https://attack.mitre.org/tactics/TA0004/"
  },
  "persistence": {
    "name": "MITRE ATT&CK — Persistence (TA0003)",
    "url": "https://attack.mitre.org/tactics/TA0003/"
  },
  "credential-dumping": {
    "name": "MITRE ATT&CK — OS Credential Dumping (T1003)",
    "url": "https://attack.mitre.org/techniques/T1003/"
  },
  "pass-the-hash": {
    "name": "MITRE ATT&CK — Use Alternate Authentication Material: Pass the Hash (T1550.002)",
    "url": "https://attack.mitre.org/techniques/T1550/002/"
  },
  "kerberoasting": {
    "name": "MITRE ATT&CK T1558.003 — Steal or Forge Kerberos Tickets: Kerberoasting",
    "url": "https://attack.mitre.org/techniques/T1558/003/"
  },
  "as-rep-roasting": {
    "name": "MITRE ATT&CK T1558.004 — Steal or Forge Kerberos Tickets: AS-REP Roasting",
    "url": "https://attack.mitre.org/techniques/T1558/004/"
  },
  "golden-ticket": {
    "name": "MITRE ATT&CK T1558.001 — Steal or Forge Kerberos Tickets: Golden Ticket",
    "url": "https://attack.mitre.org/techniques/T1558/001/"
  },
  "silver-ticket": {
    "name": "MITRE ATT&CK T1558.002 — Steal or Forge Kerberos Tickets: Silver Ticket",
    "url": "https://attack.mitre.org/techniques/T1558/002/"
  },
  "pass-the-ticket": {
    "name": "MITRE ATT&CK T1550.003 — Use Alternate Authentication Material: Pass the Ticket",
    "url": "https://attack.mitre.org/techniques/T1550/003/"
  },
  "overpass-the-hash": {
    "name": "MITRE ATT&CK T1550.002 — Use Alternate Authentication Material: Pass the Hash (documents overpass-the-hash)",
    "url": "https://attack.mitre.org/techniques/T1550/002/"
  },
  "unconstrained-delegation-abuse": {
    "name": "Microsoft Learn — Kerberos Constrained Delegation Overview (delegation model incl. unconstrained/S4U)",
    "url": "https://learn.microsoft.com/en-us/windows-server/security/kerberos/kerberos-constrained-delegation-overview"
  },
  "constrained-delegation-abuse": {
    "name": "Microsoft Learn — Kerberos Constrained Delegation Overview (S4U2Self/S4U2Proxy)",
    "url": "https://learn.microsoft.com/en-us/windows-server/security/kerberos/kerberos-constrained-delegation-overview"
  },
  "resource-based-constrained-delegation-abuse": {
    "name": "Microsoft Learn — ms-DS-Allowed-To-Act-On-Behalf-Of-Other-Identity attribute (RBCD)",
    "url": "https://learn.microsoft.com/en-us/windows/win32/adschema/a-msds-allowedtoactonbehalfofotheridentity"
  },
  "dcsync": {
    "name": "MITRE ATT&CK T1003.006 — OS Credential Dumping: DCSync",
    "url": "https://attack.mitre.org/techniques/T1003/006/"
  },
  "dcshadow": {
    "name": "MITRE ATT&CK T1207 — Rogue Domain Controller (DCShadow)",
    "url": "https://attack.mitre.org/techniques/T1207/"
  },
  "ntlm-relay": {
    "name": "MITRE ATT&CK T1557.001 — Adversary-in-the-Middle: LLMNR/NBT-NS Poisoning and SMB Relay",
    "url": "https://attack.mitre.org/techniques/T1557/001/"
  },
  "llmnr-nbtns-poisoning": {
    "name": "MITRE ATT&CK T1557.001 — Adversary-in-the-Middle: LLMNR/NBT-NS Poisoning and SMB Relay",
    "url": "https://attack.mitre.org/techniques/T1557/001/"
  },
  "password-spraying": {
    "name": "MITRE ATT&CK T1110.003 — Brute Force: Password Spraying",
    "url": "https://attack.mitre.org/techniques/T1110/003/"
  },
  "credential-stuffing": {
    "name": "MITRE ATT&CK T1110.004 — Brute Force: Credential Stuffing",
    "url": "https://attack.mitre.org/techniques/T1110/004/"
  },
  "brute-force-attack": {
    "name": "MITRE ATT&CK T1110 — Brute Force",
    "url": "https://attack.mitre.org/techniques/T1110/"
  },
  "rainbow-table": {
    "name": "MITRE ATT&CK T1110.002 — Brute Force: Password Cracking (precomputed rainbow tables)",
    "url": "https://attack.mitre.org/techniques/T1110/002/"
  },
  "pass-the-cookie": {
    "name": "MITRE ATT&CK T1539 — Steal Web Session Cookie",
    "url": "https://attack.mitre.org/techniques/T1539/"
  },
  "golden-saml": {
    "name": "MITRE ATT&CK T1606.002 — Forge Web Credentials: SAML Tokens (Golden SAML)",
    "url": "https://attack.mitre.org/techniques/T1606/002/"
  },
  "oauth-token-theft": {
    "name": "MITRE ATT&CK T1528 — Steal Application Access Token",
    "url": "https://attack.mitre.org/techniques/T1528/"
  },
  "mfa-fatigue": {
    "name": "MITRE ATT&CK T1621 — Multi-Factor Authentication Request Generation",
    "url": "https://attack.mitre.org/techniques/T1621/"
  },
  "sid-history-injection": {
    "name": "MITRE ATT&CK T1134.005 — Access Token Manipulation: SID-History Injection",
    "url": "https://attack.mitre.org/techniques/T1134/005/"
  },
  "ad-cs-abuse": {
    "name": "MITRE ATT&CK T1649 — Steal or Forge Authentication Certificates (AD CS abuse)",
    "url": "https://attack.mitre.org/techniques/T1649/"
  },
  "dpapi-abuse": {
    "name": "MITRE ATT&CK T1555 — Credentials from Password Stores (documents DPAPI)",
    "url": "https://attack.mitre.org/techniques/T1555/"
  },
  "lsass-credential-theft": {
    "name": "MITRE ATT&CK T1003.001 — OS Credential Dumping: LSASS Memory",
    "url": "https://attack.mitre.org/techniques/T1003/001/"
  },
  "sam-lsa-secrets-extraction": {
    "name": "MITRE ATT&CK T1003.002 — OS Credential Dumping: Security Account Manager",
    "url": "https://attack.mitre.org/techniques/T1003/002/"
  },
  "access-token-manipulation": {
    "name": "MITRE ATT&CK T1134 — Access Token Manipulation",
    "url": "https://attack.mitre.org/techniques/T1134/"
  },
  "kerberos-pre-authentication": {
    "name": "Microsoft Learn — [MS-KILE]: Pre-authentication Data (PA-ENC-TIMESTAMP)",
    "url": "https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-kile/ae60c948-fda8-45c2-b1d1-a71b484dd1f7"
  },
  "adversary-in-the-middle-phishing": {
    "name": "MITRE ATT&CK T1557 — Adversary-in-the-Middle",
    "url": "https://attack.mitre.org/techniques/T1557/"
  },
  "session-hijacking": {
    "name": "OWASP Cheat Sheet Series — Session Management Cheat Sheet",
    "url": "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html"
  },
  "conditional-access-bypass": {
    "name": "MITRE ATT&CK T1556.009 — Modify Authentication Process: Conditional Access Policies",
    "url": "https://attack.mitre.org/techniques/T1556/009/"
  },
  "just-in-time-access": {
    "name": "Microsoft Learn — What is Privileged Identity Management? (just-in-time access)",
    "url": "https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/pim-configure"
  },
  "shared-responsibility-model": {
    "name": "NIST SP 800-145: The NIST Definition of Cloud Computing",
    "url": "https://csrc.nist.gov/pubs/sp/800/145/final"
  },
  "role-assumption": {
    "name": "MITRE ATT&CK T1550.001 — Application Access Token",
    "url": "https://attack.mitre.org/techniques/T1550/001/"
  },
  "cloud-privilege-escalation": {
    "name": "MITRE ATT&CK T1098.003 — Account Manipulation: Additional Cloud Roles",
    "url": "https://attack.mitre.org/techniques/T1098/003/"
  },
  "instance-metadata-service": {
    "name": "MITRE ATT&CK T1552.005 — Unsecured Credentials: Cloud Instance Metadata API",
    "url": "https://attack.mitre.org/techniques/T1552/005/"
  },
  "server-side-request-forgery-to-credentials": {
    "name": "OWASP — Server Side Request Forgery",
    "url": "https://owasp.org/www-community/attacks/Server_Side_Request_Forgery"
  },
  "access-keys": {
    "name": "MITRE ATT&CK T1078.004 — Valid Accounts: Cloud Accounts",
    "url": "https://attack.mitre.org/techniques/T1078/004/"
  },
  "workload-identity": {
    "name": "MITRE ATT&CK T1528 — Steal Application Access Token",
    "url": "https://attack.mitre.org/techniques/T1528/"
  },
  "misconfigured-storage-bucket": {
    "name": "MITRE ATT&CK T1530 — Data from Cloud Storage",
    "url": "https://attack.mitre.org/techniques/T1530/"
  },
  "container-escape": {
    "name": "MITRE ATT&CK T1611 — Escape to Host",
    "url": "https://attack.mitre.org/techniques/T1611/"
  },
  "image-provenance": {
    "name": "MITRE ATT&CK T1525 — Implant Internal Image",
    "url": "https://attack.mitre.org/techniques/T1525/"
  },
  "kubernetes-rbac": {
    "name": "Kubernetes — Using RBAC Authorization",
    "url": "https://kubernetes.io/docs/reference/access-authn-authz/rbac/"
  },
  "pod-security": {
    "name": "Kubernetes — Pod Security Standards",
    "url": "https://kubernetes.io/docs/concepts/security/pod-security-standards/"
  },
  "key-management-service": {
    "name": "NIST CSRC Glossary — Key Management",
    "url": "https://csrc.nist.gov/glossary/term/key_management"
  },
  "cloud-persistence": {
    "name": "MITRE ATT&CK T1098.001 — Account Manipulation: Additional Cloud Credentials",
    "url": "https://attack.mitre.org/techniques/T1098/001/"
  },
  "resource-hijacking": {
    "name": "MITRE ATT&CK T1496 — Resource Hijacking",
    "url": "https://attack.mitre.org/techniques/T1496/"
  },
  "identity-federation": {
    "name": "NIST CSRC Glossary — Federated Identity Management",
    "url": "https://csrc.nist.gov/glossary/term/federated_identity_management"
  },
  "serverless-function-security": {
    "name": "OWASP Serverless Top 10",
    "url": "https://owasp.org/www-project-serverless-top-10/"
  },
  "identity-and-access-management": {
    "name": "NIST — Identity & Access Management",
    "url": "https://www.nist.gov/identity-access-management"
  },
  "privileged-container": {
    "name": "MITRE ATT&CK T1611 — Escape to Host",
    "url": "https://attack.mitre.org/techniques/T1611/"
  },
  "indicator-of-compromise": {
    "name": "Indicator of Compromise - NIST CSRC Glossary",
    "url": "https://csrc.nist.gov/glossary/term/indicator_of_compromise"
  },
  "chain-of-custody": {
    "name": "Chain of Custody - NIST CSRC Glossary",
    "url": "https://csrc.nist.gov/glossary/term/chain_of_custody"
  },
  "threat-hunting": {
    "name": "Threat Hunting - CISA",
    "url": "https://www.cisa.gov/threat-hunting"
  },
  "yara": {
    "name": "YARA Documentation (official)",
    "url": "https://yara.readthedocs.io/en/stable/"
  },
  "mitre-attack": {
    "name": "MITRE ATT&CK - Get Started",
    "url": "https://attack.mitre.org/"
  },
  "pyramid-of-pain": {
    "name": "SANS - The Pyramid of Pain (David Bianco)",
    "url": "https://www.sans.org/tools/the-pyramid-of-pain"
  },
  "diamond-model": {
    "name": "The Diamond Model of Intrusion Analysis (Caltagirone, Pendergast, Betz) — DTIC",
    "url": "https://apps.dtic.mil/sti/tr/pdf/ADA586960.pdf"
  },
  "buffer-overflow": {
    "name": "NIST CSRC Glossary: buffer overflow",
    "url": "https://csrc.nist.gov/glossary/term/buffer_overflow"
  },
  "stack-buffer-overflow": {
    "name": "CWE-121: Stack-based Buffer Overflow",
    "url": "https://cwe.mitre.org/data/definitions/121.html"
  },
  "heap-overflow": {
    "name": "CWE-122: Heap-based Buffer Overflow",
    "url": "https://cwe.mitre.org/data/definitions/122.html"
  },
  "use-after-free": {
    "name": "CWE-416: Use After Free",
    "url": "https://cwe.mitre.org/data/definitions/416.html"
  },
  "out-of-bounds-write": {
    "name": "CWE-787: Out-of-bounds Write",
    "url": "https://cwe.mitre.org/data/definitions/787.html"
  },
  "integer-overflow": {
    "name": "CWE-190: Integer Overflow or Wraparound",
    "url": "https://cwe.mitre.org/data/definitions/190.html"
  },
  "format-string": {
    "name": "CWE-134: Use of Externally-Controlled Format String",
    "url": "https://cwe.mitre.org/data/definitions/134.html"
  },
  "type-confusion": {
    "name": "CWE-843: Access of Resource Using Incompatible Type ('Type Confusion')",
    "url": "https://cwe.mitre.org/data/definitions/843.html"
  },
  "off-by-one": {
    "name": "CWE-193: Off-by-one Error",
    "url": "https://cwe.mitre.org/data/definitions/193.html"
  },
  "aslr": {
    "name": "NIST CSRC Glossary: Address Space Layout Randomization",
    "url": "https://csrc.nist.gov/glossary/term/address_space_layout_randomization"
  },
  "data-execution-prevention": {
    "name": "Microsoft Learn: Data Execution Prevention",
    "url": "https://learn.microsoft.com/en-us/windows/win32/memory/data-execution-prevention"
  },
  "stack-canary": {
    "name": "Microsoft Learn: /GS (Buffer Security Check)",
    "url": "https://learn.microsoft.com/en-us/cpp/build/reference/gs-buffer-security-check"
  },
  "control-flow-integrity": {
    "name": "Microsoft Learn: Control Flow Guard",
    "url": "https://learn.microsoft.com/en-us/windows/win32/secbp/control-flow-guard"
  },
  "heap-spray": {
    "name": "CWE-122: Heap-based Buffer Overflow",
    "url": "https://cwe.mitre.org/data/definitions/122.html"
  },
  "information-leak": {
    "name": "CWE-200: Exposure of Sensitive Information to an Unauthorized Actor",
    "url": "https://cwe.mitre.org/data/definitions/200.html"
  },
  "arbitrary-read-write": {
    "name": "CWE-123: Write-what-where Condition",
    "url": "https://cwe.mitre.org/data/definitions/123.html"
  },
  "write-what-where": {
    "name": "CWE-123: Write-what-where Condition",
    "url": "https://cwe.mitre.org/data/definitions/123.html"
  },
  "shellcode": {
    "name": "MITRE ATT&CK T1055: Process Injection",
    "url": "https://attack.mitre.org/techniques/T1055/"
  },
  "zero-day": {
    "name": "NIST CSRC Glossary: zero day attack",
    "url": "https://csrc.nist.gov/glossary/term/zero_day_attack"
  },
  "remote-code-execution": {
    "name": "CWE-94: Improper Control of Generation of Code ('Code Injection')",
    "url": "https://cwe.mitre.org/data/definitions/94.html"
  },
  "local-privilege-escalation": {
    "name": "MITRE ATT&CK T1068: Exploitation for Privilege Escalation",
    "url": "https://attack.mitre.org/techniques/T1068/"
  },
  "race-condition": {
    "name": "CWE-362: Concurrent Execution using Shared Resource with Improper Synchronization ('Race Condition')",
    "url": "https://cwe.mitre.org/data/definitions/362.html"
  },
  "insecure-deserialization": {
    "name": "CWE-502: Deserialization of Untrusted Data",
    "url": "https://cwe.mitre.org/data/definitions/502.html"
  },
  "server-side-request-forgery": {
    "name": "CWE-918: Server-Side Request Forgery (SSRF)",
    "url": "https://cwe.mitre.org/data/definitions/918.html"
  },
  "path-traversal": {
    "name": "CWE-22: Improper Limitation of a Pathname to a Restricted Directory ('Path Traversal')",
    "url": "https://cwe.mitre.org/data/definitions/22.html"
  },
  "command-injection": {
    "name": "CWE-78: OS Command Injection",
    "url": "https://cwe.mitre.org/data/definitions/78.html"
  },
  "sql-injection": {
    "name": "CWE-89: SQL Injection",
    "url": "https://cwe.mitre.org/data/definitions/89.html"
  },
  "insecure-direct-object-reference": {
    "name": "CWE-639: Authorization Bypass Through User-Controlled Key (IDOR)",
    "url": "https://cwe.mitre.org/data/definitions/639.html"
  },
  "broken-access-control": {
    "name": "OWASP Top 10 A01:2021 - Broken Access Control",
    "url": "https://owasp.org/Top10/A01_2021-Broken_Access_Control/"
  },
  "default-credentials": {
    "name": "CWE-1392: Use of Default Credentials",
    "url": "https://cwe.mitre.org/data/definitions/1392.html"
  },
  "supply-chain-vulnerability": {
    "name": "CWE-1395: Dependency on Vulnerable Third-Party Component",
    "url": "https://cwe.mitre.org/data/definitions/1395.html"
  },
  "vulnerability-scanning": {
    "name": "NIST CSRC Glossary: vulnerability scanning",
    "url": "https://csrc.nist.gov/glossary/term/vulnerability_scanning"
  },
  "exploit-chain": {
    "name": "MITRE ATT&CK T1190: Exploit Public-Facing Application",
    "url": "https://attack.mitre.org/techniques/T1190/"
  },
  "phishing": {
    "name": "MITRE ATT&CK T1566: Phishing",
    "url": "https://attack.mitre.org/techniques/T1566/"
  },
  "spear-phishing": {
    "name": "MITRE ATT&CK T1566.001: Spearphishing Attachment",
    "url": "https://attack.mitre.org/techniques/T1566/001/"
  },
  "whaling": {
    "name": "MITRE ATT&CK T1566 — Phishing",
    "url": "https://attack.mitre.org/techniques/T1566/"
  },
  "email-spoofing": {
    "name": "MITRE ATT&CK T1684.002 — Social Engineering: Email Spoofing",
    "url": "https://attack.mitre.org/techniques/T1684/002/"
  },
  "lookalike-domain": {
    "name": "MITRE ATT&CK T1583.001: Acquire Infrastructure: Domains",
    "url": "https://attack.mitre.org/techniques/T1583/001/"
  },
  "sender-policy-framework": {
    "name": "RFC 7208: Sender Policy Framework (SPF) for Authorizing Use of Domains in Email",
    "url": "https://www.rfc-editor.org/rfc/rfc7208"
  },
  "domainkeys-identified-mail": {
    "name": "RFC 6376: DomainKeys Identified Mail (DKIM) Signatures",
    "url": "https://www.rfc-editor.org/rfc/rfc6376"
  },
  "domain-based-message-authentication": {
    "name": "RFC 7489: Domain-based Message Authentication, Reporting, and Conformance (DMARC)",
    "url": "https://www.rfc-editor.org/rfc/rfc7489"
  },
  "thread-hijacking": {
    "name": "MITRE ATT&CK T1566 — Phishing",
    "url": "https://attack.mitre.org/techniques/T1566/"
  },
  "attachment-based-delivery": {
    "name": "MITRE ATT&CK T1566.001: Spearphishing Attachment",
    "url": "https://attack.mitre.org/techniques/T1566/001/"
  },
  "malicious-macro": {
    "name": "MITRE ATT&CK T1059.005: Command and Scripting Interpreter: Visual Basic",
    "url": "https://attack.mitre.org/techniques/T1059/005/"
  },
  "html-smuggling": {
    "name": "MITRE ATT&CK T1027.006: Obfuscated Files or Information: HTML Smuggling",
    "url": "https://attack.mitre.org/techniques/T1027/006/"
  },
  "cross-site-scripting": {
    "name": "OWASP: Cross Site Scripting (XSS)",
    "url": "https://owasp.org/www-community/attacks/xss/"
  },
  "cross-site-request-forgery": {
    "name": "OWASP: Cross Site Request Forgery (CSRF)",
    "url": "https://owasp.org/www-community/attacks/csrf"
  },
  "clickjacking": {
    "name": "OWASP: Clickjacking",
    "url": "https://owasp.org/www-community/attacks/Clickjacking"
  },
  "cookie-security": {
    "name": "OWASP Session Management Cheat Sheet (Cookie Attributes)",
    "url": "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html"
  },
  "cross-origin-resource-sharing": {
    "name": "MDN: Cross-Origin Resource Sharing (CORS)",
    "url": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS"
  },
  "content-security-policy": {
    "name": "OWASP Content Security Policy Cheat Sheet",
    "url": "https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html"
  },
  "json-web-token": {
    "name": "RFC 7519 — JSON Web Token (JWT)",
    "url": "https://www.rfc-editor.org/rfc/rfc7519"
  },
  "oauth": {
    "name": "RFC 6749: The OAuth 2.0 Authorization Framework",
    "url": "https://www.rfc-editor.org/rfc/rfc6749"
  },
  "api-security": {
    "name": "OWASP API Security Project (API Security Top 10)",
    "url": "https://owasp.org/www-project-api-security/"
  },
  "rate-limiting": {
    "name": "OWASP: Blocking Brute Force Attacks",
    "url": "https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks"
  },
  "web-application-firewall": {
    "name": "OWASP: Web Application Firewall",
    "url": "https://owasp.org/www-community/Web_Application_Firewall"
  },
  "input-validation": {
    "name": "OWASP Input Validation Cheat Sheet",
    "url": "https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html"
  },
  "output-encoding": {
    "name": "OWASP Cross Site Scripting Prevention Cheat Sheet (Output Encoding)",
    "url": "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html"
  },
  "parameter-tampering": {
    "name": "OWASP: Web Parameter Tampering",
    "url": "https://owasp.org/www-community/attacks/Web_Parameter_Tampering"
  },
  "web-shell": {
    "name": "MITRE ATT&CK T1505.003: Server Software Component: Web Shell",
    "url": "https://attack.mitre.org/techniques/T1505/003/"
  },
  "subdomain-takeover": {
    "name": "OWASP WSTG: Test for Subdomain Takeover",
    "url": "https://owasp.org/www-project-web-security-testing-guide/stable/4-Web_Application_Security_Testing/02-Configuration_and_Deployment_Management_Testing/10-Test_for_Subdomain_Takeover"
  },
  "dependency-confusion": {
    "name": "OWASP CICD-SEC-3: Dependency Chain Abuse",
    "url": "https://owasp.org/www-project-top-10-ci-cd-security-risks/CICD-SEC-03-Dependency-Chain-Abuse"
  },
  "credential-harvesting-page": {
    "name": "MITRE ATT&CK T1598: Phishing for Information",
    "url": "https://attack.mitre.org/techniques/T1598/"
  },
  "owasp-top-ten": {
    "name": "OWASP Top Ten Web Application Security Risks",
    "url": "https://owasp.org/www-project-top-ten/"
  },
  "security-headers": {
    "name": "OWASP Secure Headers Project",
    "url": "https://owasp.org/www-project-secure-headers/"
  },
  "sysmon": {
    "name": "Sysmon - Sysinternals (Microsoft Learn)",
    "url": "https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon"
  },
  "event-tracing-for-windows": {
    "name": "About Event Tracing (ETW) - Win32 apps (Microsoft Learn)",
    "url": "https://learn.microsoft.com/en-us/windows/win32/etw/about-event-tracing"
  },
  "powershell-logging": {
    "name": "about_Logging_Windows - PowerShell (Microsoft Learn)",
    "url": "https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_logging_windows"
  },
  "process-creation-auditing": {
    "name": "Command line process auditing (Microsoft Learn)",
    "url": "https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/component-updates/command-line-process-auditing"
  },
  "amsi": {
    "name": "Antimalware Scan Interface (AMSI) - Win32 apps (Microsoft Learn)",
    "url": "https://learn.microsoft.com/en-us/windows/win32/amsi/antimalware-scan-interface-portal"
  },
  "windows-event-forwarding": {
    "name": "Use Windows Event Forwarding to help with intrusion detection (Microsoft Learn)",
    "url": "https://learn.microsoft.com/en-us/windows/security/operating-system-security/device-management/use-windows-event-forwarding-to-assist-in-intrusion-detection"
  },
  "auditd": {
    "name": "auditd(8) - Linux manual page (man7.org)",
    "url": "https://man7.org/linux/man-pages/man8/auditd.8.html"
  },
  "syslog": {
    "name": "RFC 5424: The Syslog Protocol (RFC Editor)",
    "url": "https://www.rfc-editor.org/info/rfc5424/"
  },
  "journald": {
    "name": "systemd-journald.service(8) - Linux manual page (man7.org)",
    "url": "https://man7.org/linux/man-pages/man8/systemd-journald.service.8.html"
  },
  "ebpf-telemetry": {
    "name": "What is eBPF? (ebpf.io)",
    "url": "https://ebpf.io/what-is-ebpf/"
  },
  "dns-logging": {
    "name": "Network Traffic, Data Source DS0029 (MITRE ATT&CK)",
    "url": "https://attack.mitre.org/datasources/DS0029/"
  },
  "firewall-logs": {
    "name": "Firewall Rule Modification, Data Component DC0051 (MITRE ATT&CK)",
    "url": "https://attack.mitre.org/datacomponents/DC0051/"
  },
  "flow-logs": {
    "name": "RFC 7011: Specification of the IPFIX Protocol (RFC Editor)",
    "url": "https://www.rfc-editor.org/info/rfc7011/"
  },
  "web-access-logs": {
    "name": "mod_log_config - Apache HTTP Server 2.4 (Common Log Format)",
    "url": "https://httpd.apache.org/docs/current/mod/mod_log_config.html"
  },
  "authentication-logs": {
    "name": "Logon Session Creation, Data Component DC0067 (MITRE ATT&CK)",
    "url": "https://attack.mitre.org/datacomponents/DC0067/"
  },
  "cloud-audit-logs": {
    "name": "Logging management events - AWS CloudTrail User Guide",
    "url": "https://docs.aws.amazon.com/awscloudtrail/latest/userguide/logging-management-events-with-cloudtrail.html"
  },
  "common-event-format": {
    "name": "Common Event Format (CEF) key and CommonSecurityLog field mapping (Microsoft Learn)",
    "url": "https://learn.microsoft.com/en-us/azure/sentinel/cef-name-mapping"
  },
  "log-retention": {
    "name": "log retention - NIST CSRC Glossary",
    "url": "https://csrc.nist.gov/glossary/term/log_retention"
  },
  "log-aggregation": {
    "name": "NIST SP 800-92, Guide to Computer Security Log Management",
    "url": "https://csrc.nist.gov/pubs/sp/800/92/final"
  },
  "time-synchronization": {
    "name": "RFC 5905: Network Time Protocol Version 4 (RFC Editor)",
    "url": "https://www.rfc-editor.org/info/rfc5905/"
  },
  "unified-logging": {
    "name": "OSLog — Apple Developer Documentation (macOS Unified Logging)",
    "url": "https://developer.apple.com/documentation/OSLog"
  },
  "systemd-journal": {
    "name": "systemd.journal-fields(7) — systemd journal fields manual page (man7.org)",
    "url": "https://man7.org/linux/man-pages/man7/systemd.journal-fields.7.html"
  },
  "process-injection": {
    "name": "MITRE ATT&CK T1055 — Process Injection",
    "url": "https://attack.mitre.org/techniques/T1055/"
  },
  "service-creation": {
    "name": "MITRE ATT&CK T1543.003 — Create or Modify System Process: Windows Service",
    "url": "https://attack.mitre.org/techniques/T1543/003/"
  },
  "hide-artifacts": {
    "name": "MITRE ATT&CK T1564 — Hide Artifacts",
    "url": "https://attack.mitre.org/techniques/T1564/"
  },
  "process-discovery": {
    "name": "MITRE ATT&CK T1057 — Process Discovery",
    "url": "https://attack.mitre.org/techniques/T1057/"
  },
  "web-service-c2": {
    "name": "MITRE ATT&CK T1102 — Web Service",
    "url": "https://attack.mitre.org/techniques/T1102/"
  },
  "inhibit-system-recovery": {
    "name": "MITRE ATT&CK T1490 — Inhibit System Recovery",
    "url": "https://attack.mitre.org/techniques/T1490/"
  }
};

export interface AttackTechnique {
  id: string;
  name: string;
  /** Every ATT&CK tactic this technique falls under. */
  tactics: string[];
  url: string;
  /** Glossary term that documents this technique, if any. */
  glossarySlug?: string;
  /** One-line "what it is" (cards, meta description). */
  summary?: string;
  /** Fuller MITRE description — the detail-page definition. */
  description?: string;
  /** Platforms the technique applies to (MITRE). */
  platforms?: string[];
  /** "Data component" telemetry that detects it (MITRE). */
  detection?: string[];
  /** Real-world procedure examples (MITRE), a capped sample. */
  examples?: string[];
  /** Total documented uses behind `examples`. */
  examplesTotal?: number;
  /** Mitigations with MITRE's technique-specific guidance. */
  mitigations?: { name: string; text: string }[];
  /** Curated: why it matters / how it's detected (DFIR framing). */
  significance?: string;
  /** Curated: a concrete "in practice" example. */
  example?: string;
}

// The full Enterprise matrix is generated from MITRE's official STIX bundle
// (scripts/gen-attack-map.mjs -> attack-techniques.generated.ts) so names, IDs,
// tactics, URLs, and definitions stay authoritative. A small hand-maintained
// overlay (attack-overlay.ts) adds the glossary link + bespoke DFIR framing
// (summary / significance / example) for the techniques covered in depth.

/** MITRE ATT&CK Enterprise tactics in kill-chain order (only populated render). */
export { ATTACK_TACTIC_ORDER, ATTACK_VERSION } from './attack-techniques.generated';

/** Every Enterprise technique — MITRE data enriched with the curated overlay. */
export const ATTACK_TECHNIQUES: AttackTechnique[] = ATTACK_GENERATED.map((t) => {
  const o = ATTACK_OVERLAY[t.id];
  return o ? { ...t, ...o, summary: o.summary ?? t.summary } : t;
});
