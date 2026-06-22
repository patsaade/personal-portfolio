// Certifications — single source of truth, shared by the /certifications/ page
// (shows everything) and the About page (shows the featured set).
//
// Content accuracy: the earned list is pulled verbatim from the Credly profile
// (credly.com/users/patsaade) — name, issuer, and badge id. Earned certs link to
// their Credly badge; in-pursuit certs link to the official cert page (no badge
// yet). Don't invent certs, issuers, or badge URLs.

export interface Certification {
  /** Short display name (e.g. "CySA+", "CSIE"). */
  name: string;
  /** Full certification name. */
  full: string;
  /** Short focus tag (the tile's category chip). */
  focus: string;
  /** Issuer display name — must match a CERT_ISSUERS name. */
  issuer: string;
  /** Credly badge (earned) or official cert page (in pursuit). */
  url: string;
  earned: boolean;
  /** Surfaced on the About page's curated cert row. */
  featured?: boolean;
}

export interface CertIssuer {
  name: string;
  icon: string;
  blurb: string;
}

const credly = (id: string) => `https://www.credly.com/badges/${id}/public_url`;

// Issuers in display order; each becomes a collapsible category on the page.
export const CERT_ISSUERS: CertIssuer[] = [
  { name: 'ISC2', icon: 'shield', blurb: 'Information-security certification body.' },
  { name: 'CompTIA', icon: 'layers', blurb: 'Vendor-neutral IT & security certifications, including stackable credentials.' },
  { name: 'GIAC', icon: 'crosshair', blurb: 'Hands-on forensics & incident-response certifications — currently in pursuit.' },
];

export const CERTIFICATIONS: Certification[] = [
  // ── ISC2 ──────────────────────────────────────────────────────────────
  { name: 'CISSP', full: 'Certified Information Systems Security Professional', focus: 'Security', issuer: 'ISC2', url: credly('66ba2583-f710-413c-989f-6ab2eaca6a8e'), earned: true, featured: true },

  // ── CompTIA — certifications ──────────────────────────────────────────
  { name: 'SecurityX (CASP+)', full: 'CompTIA SecurityX (formerly CASP+)', focus: 'Advanced', issuer: 'CompTIA', url: credly('75b925a7-fe2a-48a2-9976-21648d24a20c'), earned: true, featured: true },
  { name: 'CySA+', full: 'CompTIA Cybersecurity Analyst (CySA+)', focus: 'Analyst', issuer: 'CompTIA', url: credly('fc07214a-db98-4fac-8b78-c4b2d350c433'), earned: true, featured: true },
  { name: 'PenTest+', full: 'CompTIA PenTest+', focus: 'Pentest', issuer: 'CompTIA', url: credly('b918b8d7-9eef-4e64-b6fb-36dbd1c69a29'), earned: true, featured: true },
  { name: 'Cloud+', full: 'CompTIA Cloud+', focus: 'Cloud', issuer: 'CompTIA', url: credly('e40c4bdf-9ce5-4004-b23e-e61879e9cb92'), earned: true, featured: true },
  { name: 'Server+', full: 'CompTIA Server+', focus: 'Server', issuer: 'CompTIA', url: credly('9ab10287-084a-45ab-8d93-0880a9145e89'), earned: true, featured: true },
  { name: 'Linux+', full: 'CompTIA Linux+', focus: 'Linux', issuer: 'CompTIA', url: credly('2b565d4b-1aa7-4fbe-aea7-850fa53ac96f'), earned: true },
  { name: 'Security+', full: 'CompTIA Security+', focus: 'Security', issuer: 'CompTIA', url: credly('dd088109-f2f5-4ddd-8bce-c36105f91785'), earned: true },
  { name: 'Network+', full: 'CompTIA Network+', focus: 'Network', issuer: 'CompTIA', url: credly('dd48358b-128f-4464-a978-117b4ce97ab2'), earned: true },
  { name: 'ITF+', full: 'CompTIA IT Fundamentals+ (ITF+)', focus: 'Fundamentals', issuer: 'CompTIA', url: credly('7ab49bde-f41f-4b8b-b1f5-d36c6569f788'), earned: true },
  { name: 'A+', full: 'CompTIA A+', focus: 'Support', issuer: 'CompTIA', url: credly('2735b99b-2148-4a50-b352-d7823ffa6a2e'), earned: true },

  // ── CompTIA — stackable credentials ───────────────────────────────────
  { name: 'CSIE', full: 'Secure Infrastructure Expert', focus: 'Stackable', issuer: 'CompTIA', url: credly('ddbf9516-fe86-4bc6-9aee-9883ec66c18e'), earned: true },
  { name: 'CSAE', full: 'Security Analytics Expert', focus: 'Stackable', issuer: 'CompTIA', url: credly('dfa61669-c841-4e1f-b1ab-3f3fe9228d4f'), earned: true },
  { name: 'CCAP', full: 'Cloud Admin Professional', focus: 'Stackable', issuer: 'CompTIA', url: credly('8b921eb0-664a-477d-9b1b-38ac9f71919e'), earned: true },
  { name: 'CSCP', full: 'Secure Cloud Professional', focus: 'Stackable', issuer: 'CompTIA', url: credly('3d7da996-4148-45e7-824a-2e47665d2e12'), earned: true },
  { name: 'CNSP', full: 'Network Security Professional', focus: 'Stackable', issuer: 'CompTIA', url: credly('179af340-d054-4ee1-af67-dbe6f8f987e1'), earned: true },
  { name: 'CNVP', full: 'Network Vulnerability Assessment Professional', focus: 'Stackable', issuer: 'CompTIA', url: credly('eef38e66-56d2-4fdf-8b55-edb55fe29b63'), earned: true },
  { name: 'CSAP', full: 'Security Analytics Professional', focus: 'Stackable', issuer: 'CompTIA', url: credly('87b25695-a900-4989-892b-f8eab6329561'), earned: true },
  { name: 'CNIP', full: 'Network Infrastructure Professional', focus: 'Stackable', issuer: 'CompTIA', url: credly('fc5164ca-1c9d-44bb-8743-877d289d3150'), earned: true },
  { name: 'CLNP', full: 'Linux Network Professional', focus: 'Stackable', issuer: 'CompTIA', url: credly('4d8a38cd-84d0-461b-8313-11a45fb9ba80'), earned: true },
  { name: 'CSSS', full: 'Systems Support Specialist', focus: 'Stackable', issuer: 'CompTIA', url: credly('83dc9ee3-5114-4d86-ae33-5b7fc99fc054'), earned: true },
  { name: 'CSIS', full: 'Secure Infrastructure Specialist', focus: 'Stackable', issuer: 'CompTIA', url: credly('7b94d1e4-f7be-4bd1-916e-7205fee7f9c1'), earned: true },
  { name: 'CIOS', full: 'IT Operations Specialist', focus: 'Stackable', issuer: 'CompTIA', url: credly('ff022574-041e-4dc2-ad34-12aac0fbff72'), earned: true },

  // ── GIAC — in pursuit (no badge yet; links to the official cert page) ──
  { name: 'GCFA', full: 'GIAC Certified Forensic Analyst', focus: 'Forensics', issuer: 'GIAC', url: 'https://www.giac.org/certifications/certified-forensic-analyst-gcfa/', earned: false },
  { name: 'GCFE', full: 'GIAC Certified Forensic Examiner', focus: 'Forensics', issuer: 'GIAC', url: 'https://www.giac.org/certifications/certified-forensic-examiner-gcfe/', earned: false },
  { name: 'GCIH', full: 'GIAC Certified Incident Handler', focus: 'IR', issuer: 'GIAC', url: 'https://www.giac.org/certifications/certified-incident-handler-gcih/', earned: false },
];

export const EARNED_CERTS = CERTIFICATIONS.filter((c) => c.earned);
export const PURSUING_CERTS = CERTIFICATIONS.filter((c) => !c.earned);

// Curated, strongest-first set for the About page (keeps it uncluttered). Ordered
// explicitly so About stays stable regardless of the full list's order.
export const FEATURED_CERTS = ['CISSP', 'SecurityX (CASP+)', 'CySA+', 'PenTest+', 'Cloud+', 'Server+']
  .map((n) => CERTIFICATIONS.find((c) => c.name === n))
  .filter((c): c is Certification => Boolean(c));
