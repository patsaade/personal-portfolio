// Email Header & Auth-Chain Analyzer — parses a pasted raw RFC 5322 header
// block (e.g. copied from a mail client's "Show original" / "View source"
// view) entirely client-side. Four independent, regex/string-based parsers,
// all pure functions with no DOM dependency — unit-tested directly
// (test/emailHeaders.test.ts) and imported into the client bundle
// (EmailHeaderAnalyzer.astro) for live parsing as you type. Nothing pasted
// here is ever transmitted anywhere, and none of these functions perform a
// live network lookup of any kind (no DNS, no SPF/DKIM/DMARC verification) —
// they only read back what's already written in the pasted text.
//
//   1. unfoldHeaders()/getHeader(s)() — RFC 5322 §2.2.3-compliant header
//      unfolding (a physical line beginning with a space/tab is a
//      continuation of the previous header, not a new one), the shared
//      building block every parser below is built on.
//   2. parseReceivedChain() — every Received: header, reordered oldest-hop-
//      first (each new hop is PREPENDED by the server that adds it, so the
//      raw top-to-bottom order in the pasted text is newest-first), with an
//      inter-hop time delta computed by reusing this codebase's own RFC 2822
//      date parser (src/utils/timestamps.ts's `rfc2822` format, via
//      formatById) rather than reimplementing date math.
//   3. parseAuthenticationResults()/summarizeAuthResults() — SPF/DKIM/DMARC
//      verdicts read straight out of an existing Authentication-Results:
//      header via plain regex matching. This performs NO live SPF/DKIM/DMARC
//      lookup of its own — it only reports what a mail server already
//      decided and stamped into the header (the UI surfaces this
//      explicitly, not just here).
//   4. extractAddressFields()/detectMismatches() — pulls the domain out of
//      From/Reply-To/Return-Path and flags when they disagree, a classic
//      phishing tell.
//   5. decodeM365Headers() — a small static reference table for the
//      Microsoft 365 / Exchange Online headers analysts see most often
//      (X-MS-Exchange-Organization-*, X-Forefront-Antispam-Report's
//      SCL/BCL/PCL fields). Sourced from Microsoft Learn's own
//      documentation:
//        - "Anti-spam message headers in Microsoft 365"
//          (learn.microsoft.com/microsoft-365/security/office-365-security/anti-spam-message-headers)
//        - The Spam Confidence Level (SCL) and Bulk Complaint Level (BCL)
//          reference tables in the same doc set.
//      PCL (Phishing Confidence Level) also appears in
//      X-Forefront-Antispam-Report, but Microsoft's public docs don't
//      publish as granular a per-value table for it as they do for
//      SCL/BCL — its description below is deliberately kept general rather
//      than inventing specific number bands that aren't documented.

import { formatById, DEFAULT_CONTEXT } from './timestamps';

// ---------------------------------------------------------------------------
// 1. Header unfolding
// ---------------------------------------------------------------------------

export interface RawHeader {
  name: string;
  value: string;
}

/** Split a pasted raw header block into unfolded {name, value} pairs, per
 *  RFC 5322 §2.2.3: a physical line beginning with a space or tab is a
 *  continuation of the previous header, not a new one. Stops at the first
 *  blank line (the header/body boundary), so a paste that includes the
 *  message body too is handled gracefully. */
export function unfoldHeaders(text: string): RawHeader[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const headers: RawHeader[] = [];
  let buf: string[] = [];

  function flush() {
    if (buf.length === 0) return;
    const joined = buf.map((l, i) => (i === 0 ? l : ' ' + l.replace(/^[ \t]+/, ''))).join('').trim();
    const idx = joined.indexOf(':');
    if (idx > 0) headers.push({ name: joined.slice(0, idx).trim(), value: joined.slice(idx + 1).trim() });
    buf = [];
  }

  for (const line of lines) {
    if (/^[ \t]/.test(line)) {
      if (buf.length) buf.push(line); // a continuation before any header started is meaningless — drop it
      continue;
    }
    if (line.trim() === '') {
      flush();
      break; // header/body boundary
    }
    flush();
    buf.push(line);
  }
  flush();
  return headers;
}

/** Every header matching `name`, case-insensitively, in the order they
 *  appear in the pasted text (top to bottom). */
export function getHeaders(text: string, name: string): RawHeader[] {
  const target = name.toLowerCase();
  return unfoldHeaders(text).filter((h) => h.name.toLowerCase() === target);
}

/** The first header matching `name`, or null. */
export function getHeader(text: string, name: string): RawHeader | null {
  return getHeaders(text, name)[0] ?? null;
}

// ---------------------------------------------------------------------------
// 2. Received chain
// ---------------------------------------------------------------------------

export interface ReceivedHop {
  /** 1-based position within the oldest-first chain (1 = earliest/originating hop shown). */
  index: number;
  /** The header's full unfolded value. */
  raw: string;
  from: string | null;
  by: string | null;
  withProtocol: string | null;
  /** The trailing date string as it appeared in the header, or null if none was found. */
  timestampRaw: string | null;
  /** Canonical nanoseconds since the Unix epoch (via the shared RFC 2822 parser), or null if the date couldn't be parsed. */
  ns: bigint | null;
  /** Milliseconds elapsed since the previous hop with a parseable timestamp, in this oldest-first ordering. Null for the first such hop, or when this hop's own timestamp didn't parse. */
  deltaMs: number | null;
}

// "from X" / "by Y" / "with Z" — captures the run of text after the keyword
// up to the next recognized RFC 5321/5322 Received-header keyword, a ';', or
// the end of the string. Best-effort, string-shape parsing only (real
// Received headers have no single canonical grammar in the wild).
function extractField(value: string, keyword: string): string | null {
  const re = new RegExp(`\\b${keyword}\\s+([^;]*?)(?=\\s+(?:from|by|via|with|id|for)\\b|;|$)`, 'i');
  const m = re.exec(value);
  const captured = m ? m[1].trim() : '';
  return captured || null;
}

function extractTimestamp(value: string): string | null {
  const idx = value.lastIndexOf(';');
  if (idx === -1) return null;
  // Strip a trailing parenthetical zone comment, e.g. "... -0800 (PST)" — the
  // shared RFC 2822 parser expects the zone token to be the last thing in the string.
  const tail = value.slice(idx + 1).replace(/\s*\([^)]*\)\s*$/, '').trim();
  return tail || null;
}

/** Parse every Received: header in the pasted text, oldest hop first. Each
 *  new hop a message passes through is PREPENDED to the header block by the
 *  server that adds it, so the raw pasted order (top to bottom) is
 *  newest-first — this reverses that so index 1 is the originating hop. */
export function parseReceivedChain(text: string): ReceivedHop[] {
  const oldestFirst = getHeaders(text, 'Received').slice().reverse();
  const rfc2822 = formatById('rfc2822');

  let prevNs: bigint | null = null;
  return oldestFirst.map((h, i) => {
    const timestampRaw = extractTimestamp(h.value);
    const ns = timestampRaw && rfc2822 ? rfc2822.parse(timestampRaw, DEFAULT_CONTEXT) : null;
    const deltaMs = ns !== null && prevNs !== null ? Number((ns - prevNs) / 1_000_000n) : null;
    if (ns !== null) prevNs = ns;
    return {
      index: i + 1,
      raw: h.value,
      from: extractField(h.value, 'from'),
      by: extractField(h.value, 'by'),
      withProtocol: extractField(h.value, 'with'),
      timestampRaw,
      ns,
      deltaMs,
    };
  });
}

/** Human-friendly "+Xh Ym Zs" rendering of a hop's deltaMs (a leading "-"
 *  marks a negative delta — hops that appear out of chronological order,
 *  worth flagging as a possible sign of clock skew or a tampered header). */
export function formatDeltaMs(ms: number): string {
  const sign = ms < 0 ? '-' : '+';
  const abs = Math.abs(ms);
  const totalSec = Math.round(abs / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const parts: string[] = [];
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (s || parts.length === 0) parts.push(`${s}s`);
  return sign + parts.join(' ');
}

// ---------------------------------------------------------------------------
// 3. Authentication-Results (SPF / DKIM / DMARC)
// ---------------------------------------------------------------------------

type AuthMechanism = 'spf' | 'dkim' | 'dmarc';

export interface AuthResult {
  mechanism: AuthMechanism;
  /** The verdict token exactly as it appeared, lowercased (e.g. "pass", "fail", "softfail", "none", "temperror", "permerror"). */
  verdict: string;
  /** A short trailing detail fragment captured up to the next ';', for context (e.g. "smtp.mailfrom=user@example.com"). */
  detail: string;
}

const AUTH_TOKEN_RE = /\b(spf|dkim|dmarc)=([a-z0-9_-]+)/gi;

/** Parse every Authentication-Results: header present (there can be more
 *  than one — different hops sometimes add their own) via plain regex
 *  matching. Performs NO live SPF/DKIM/DMARC lookup of its own; it only
 *  reads back what a mail server already decided and wrote into the header. */
export function parseAuthenticationResults(text: string): AuthResult[] {
  const results: AuthResult[] = [];
  for (const h of getHeaders(text, 'Authentication-Results')) {
    AUTH_TOKEN_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = AUTH_TOKEN_RE.exec(h.value))) {
      const mechanism = m[1].toLowerCase() as AuthMechanism;
      const verdict = m[2].toLowerCase();
      const after = h.value.slice(AUTH_TOKEN_RE.lastIndex);
      const detailMatch = /^([^;]*)/.exec(after);
      const detail = detailMatch ? detailMatch[1].trim() : '';
      results.push({ mechanism, verdict, detail });
    }
  }
  return results;
}

export interface AuthSummary {
  spf: AuthResult | null;
  dkim: AuthResult | null;
  dmarc: AuthResult | null;
  /** Additional matches beyond each mechanism's first (e.g. a multi-signature message with more than one dkim= result). */
  extra: AuthResult[];
}

/** Reduce a flat list of AuthResults down to one primary verdict per
 *  mechanism (the first occurrence of each), plus anything left over. */
export function summarizeAuthResults(results: AuthResult[]): AuthSummary {
  const summary: AuthSummary = { spf: null, dkim: null, dmarc: null, extra: [] };
  for (const r of results) {
    if (!summary[r.mechanism]) summary[r.mechanism] = r;
    else summary.extra.push(r);
  }
  return summary;
}

// ---------------------------------------------------------------------------
// 4. From / Reply-To / Return-Path domain mismatch
// ---------------------------------------------------------------------------

type AddressHeaderName = 'From' | 'Reply-To' | 'Return-Path';

interface AddressField {
  header: AddressHeaderName;
  /** The raw header value, or null if that header wasn't present at all. */
  raw: string | null;
  address: string | null;
  domain: string | null;
}

function extractAddress(value: string): string | null {
  const angled = /<([^>]*)>/.exec(value);
  const candidate = angled ? angled[1] : value;
  const m = /[^\s<>"',;]+@[^\s<>"',;]+/.exec(candidate);
  return m ? m[0].trim() : null;
}

function domainOf(address: string): string | null {
  const at = address.lastIndexOf('@');
  if (at === -1) return null;
  const domain = address
    .slice(at + 1)
    .replace(/[.\s>]+$/, '')
    .toLowerCase();
  return domain || null;
}

function fieldFor(text: string, header: AddressHeaderName): AddressField {
  const h = getHeader(text, header);
  const address = h ? extractAddress(h.value) : null;
  return { header, raw: h ? h.value : null, address, domain: address ? domainOf(address) : null };
}

export interface AddressFields {
  from: AddressField;
  replyTo: AddressField;
  returnPath: AddressField;
}

export function extractAddressFields(text: string): AddressFields {
  return {
    from: fieldFor(text, 'From'),
    replyTo: fieldFor(text, 'Reply-To'),
    returnPath: fieldFor(text, 'Return-Path'),
  };
}

export interface MismatchFlag {
  label: string;
  a: AddressField;
  b: AddressField;
  /** True only when BOTH domains are present and they differ (case-insensitive — domainOf already lowercases). */
  mismatch: boolean;
}

/** Classic phishing tells: does the visible From domain match where a reply
 *  actually goes (Reply-To) and where a bounce actually goes (Return-Path)? */
export function detectMismatches(fields: AddressFields): MismatchFlag[] {
  const pairs: [string, AddressField, AddressField][] = [
    ['From vs. Reply-To', fields.from, fields.replyTo],
    ['From vs. Return-Path', fields.from, fields.returnPath],
  ];
  return pairs.map(([label, a, b]) => ({
    label,
    a,
    b,
    mismatch: !!a.domain && !!b.domain && a.domain !== b.domain,
  }));
}

// ---------------------------------------------------------------------------
// 5. Microsoft 365 / Exchange headers
// ---------------------------------------------------------------------------

const ORG_HEADER_DEFS: Record<string, string> = {
  'x-ms-exchange-organization-authas': 'How the sender authenticated to Exchange: Internal, External, or Anonymous.',
  'x-ms-exchange-organization-authmechanism': "Exchange's internal numeric code for which authentication mechanism was used.",
  'x-ms-exchange-organization-authsource': 'The Exchange server that performed the authentication check.',
  'x-ms-exchange-organization-network-message-id': "Exchange Online's internal per-message tracking GUID — useful for correlating with message trace logs.",
  'x-ms-exchange-organization-scl': 'Spam Confidence Level assigned by Exchange Online Protection — see the SCL reference below.',
  'x-ms-exchange-organization-messagedirectionality': 'Whether Exchange classified the message as Incoming, Outgoing, Intra-Org (internal), or Originating.',
  'x-ms-exchange-organization-skiplistedinternetsender': 'Present when the sender matched an admin-configured allow entry that skipped some spam filtering.',
  'x-ms-exchange-organization-expirationstarttime': 'Internal Exchange transport timestamp used for message expiration/retry tracking — routing metadata, not a security signal.',
};

function describeOrgHeader(name: string): string {
  return (
    ORG_HEADER_DEFS[name.toLowerCase()] ??
    'Microsoft Exchange Online / Exchange Server organizational header (internal routing or policy metadata).'
  );
}

interface M365HeaderEntry {
  name: string;
  value: string;
  description: string;
}

const ANTISPAM_FIELD_DEFS: Record<string, string> = {
  cip: 'Connecting IP address of the server that delivered the message to Microsoft 365.',
  ctry: "Country/region Microsoft inferred for the connecting IP (CIP) — not necessarily the sender's true location.",
  lang: "Language Microsoft's content filters inferred for the message.",
  scl: 'Spam Confidence Level — see the SCL reference below.',
  bcl: 'Bulk Complaint Level — see the BCL reference below.',
  pcl: 'Phishing Confidence Level — higher generally means a higher likelihood of phishing. Microsoft does not publish as granular a per-value table for this field as it does for SCL/BCL.',
  srv: 'Bulk-mail categorization, e.g. BULK for newsletter/bulk senders.',
  ipv: 'Whether the connecting IP matched an internal reputation list — CAL (allow-listed), NLI (not listed), etc.',
  sfv: 'Spam filtering verdict shorthand, e.g. SPM (marked spam), NSPM (not spam), SKI (filtering skipped).',
  h: 'The HELO/EHLO hostname string the connecting server presented.',
  ptr: 'Reverse-DNS (PTR) hostname resolved for the connecting IP.',
  cat: 'The category the message was filtered under, e.g. SPOOF, PHSH, BULK, SPM.',
  sfty: 'Additional safety-related category tagging used by anti-phishing filtering.',
};

function describeAntispamField(key: string): string {
  return (
    ANTISPAM_FIELD_DEFS[key.toLowerCase()] ??
    "Anti-spam scan field — see Microsoft Learn's Anti-spam message headers reference for the full field list."
  );
}

interface AntispamField {
  key: string;
  value: string;
  description: string;
}

/** Documented Microsoft Learn SCL (Spam Confidence Level) value bands. */
export function describeSclValue(value: string): string | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n === -1) return 'Skipped spam filtering entirely (e.g. safe sender/safe list, or between two Exchange Online orgs).';
  if (n === 0 || n === 1) return 'Determined NOT to be spam.';
  if (n === 5 || n === 6) return 'Marked as Spam.';
  if (n === 9) return 'Marked as High confidence spam.';
  return 'Not one of the specifically documented SCL values (-1, 0, 1, 5, 6, 9).';
}

/** Documented Microsoft Learn BCL (Bulk Complaint Level) value bands. */
export function describeBclValue(value: string): string | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n === 0) return 'Not from a bulk sender.';
  if (n >= 1 && n <= 3) return 'From a bulk sender that generates few complaints.';
  if (n >= 4 && n <= 6) return 'From a bulk sender that generates a mixed/moderate number of complaints.';
  if (n >= 7 && n <= 9) return 'From a bulk sender that generates a high number of complaints.';
  return null;
}

export interface M365Decoded {
  orgHeaders: M365HeaderEntry[];
  antispam: AntispamField[];
  /** True if any M365/Exchange-specific header was found in the pasted text at all. */
  present: boolean;
}

/** Decode any X-MS-Exchange-Organization-* headers and the
 *  X-Forefront-Antispam-Report field block present in the pasted text
 *  against a small static reference table. Returns an empty-but-valid
 *  result (present: false) when none of these headers exist. */
export function decodeM365Headers(text: string): M365Decoded {
  const orgHeaders: M365HeaderEntry[] = unfoldHeaders(text)
    .filter((h) => /^x-ms-exchange-organization-/i.test(h.name))
    .map((h) => ({ name: h.name, value: h.value, description: describeOrgHeader(h.name) }));

  const antispamHeader = getHeader(text, 'X-Forefront-Antispam-Report');
  const antispam: AntispamField[] = [];
  if (antispamHeader) {
    for (const part of antispamHeader.value.split(';')) {
      const idx = part.indexOf(':');
      if (idx === -1) continue;
      const key = part.slice(0, idx).trim();
      const value = part.slice(idx + 1).trim();
      if (!key) continue;
      let description = describeAntispamField(key);
      const lower = key.toLowerCase();
      if (lower === 'scl') {
        const d = describeSclValue(value);
        if (d) description = `${description} ${d}`;
      }
      if (lower === 'bcl') {
        const d = describeBclValue(value);
        if (d) description = `${description} ${d}`;
      }
      antispam.push({ key, value, description });
    }
  }

  return { orgHeaders, antispam, present: orgHeaders.length > 0 || antispam.length > 0 };
}
