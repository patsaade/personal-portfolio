// IOC (indicator of compromise) extraction + defang/refang engine — pure
// functions, no DOM dependency, so this is unit-tested directly
// (test/iocs.test.ts) and imported into the client bundle (IocExtractor.astro)
// for live extraction as you type.
//
// Each category is a self-contained global regex; extractIocs() runs every
// one over the pasted text and dedupes exact matches within that category
// (not across categories — a domain that's also part of an extracted URL is
// expected to show up in both lists, which is normal for this kind of tool).
// This is inherently best-effort: domain/ATT&CK-ID matching in particular can
// have false positives on ordinary text that happens to look like an
// indicator — an analyst reviews the results, this doesn't replace judgment.

export interface IocCategory {
  id: string;
  label: string;
  pattern: RegExp;
  placeholder: string;
}

const IPV4 =
  /\b(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\b/g;

// Canonical comprehensive IPv6 pattern (covers full, compressed "::", and
// leading/trailing-compressed forms); a negative lookaround on both sides
// keeps it from matching mid-token inside a longer hex/colon run.
const IPV6 =
  /(?<![\w:])(?:(?:[A-Fa-f0-9]{1,4}:){7}[A-Fa-f0-9]{1,4}|(?:[A-Fa-f0-9]{1,4}:){1,7}:|(?:[A-Fa-f0-9]{1,4}:){1,6}:[A-Fa-f0-9]{1,4}|(?:[A-Fa-f0-9]{1,4}:){1,5}(?::[A-Fa-f0-9]{1,4}){1,2}|(?:[A-Fa-f0-9]{1,4}:){1,4}(?::[A-Fa-f0-9]{1,4}){1,3}|(?:[A-Fa-f0-9]{1,4}:){1,3}(?::[A-Fa-f0-9]{1,4}){1,4}|(?:[A-Fa-f0-9]{1,4}:){1,2}(?::[A-Fa-f0-9]{1,4}){1,5}|[A-Fa-f0-9]{1,4}:(?:(?::[A-Fa-f0-9]{1,4}){1,6})|:(?:(?::[A-Fa-f0-9]{1,4}){1,7}|:))(?![\w:])/g;

const URL_RE = /\bhttps?:\/\/[^\s<>"'\)\]]+/gi;

const DOMAIN =
  /\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}\b/g;

const EMAIL = /\b[a-zA-Z0-9][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;

const MD5 = /\b[a-fA-F0-9]{32}\b/g;
const SHA1 = /\b[a-fA-F0-9]{40}\b/g;
const SHA256 = /\b[a-fA-F0-9]{64}\b/g;
const SHA512 = /\b[a-fA-F0-9]{128}\b/g;

const CVE = /\bCVE-\d{4}-\d{4,7}\b/gi;
const ATTACK_ID = /\bT\d{4}(?:\.\d{3})?\b/g;
const BTC = /\b(?:[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{25,90})\b/g;

export const IOC_CATEGORIES: IocCategory[] = [
  { id: 'ipv4', label: 'IPv4 addresses', pattern: IPV4, placeholder: '203.0.113.42' },
  { id: 'ipv6', label: 'IPv6 addresses', pattern: IPV6, placeholder: '2001:db8::8a2e:370:7334' },
  { id: 'url', label: 'URLs', pattern: URL_RE, placeholder: 'http://example.com/path' },
  { id: 'domain', label: 'Domains', pattern: DOMAIN, placeholder: 'evil-domain.example' },
  { id: 'email', label: 'Email addresses', pattern: EMAIL, placeholder: 'user@example.com' },
  { id: 'md5', label: 'MD5 hashes', pattern: MD5, placeholder: '32 hex chars' },
  { id: 'sha1', label: 'SHA1 hashes', pattern: SHA1, placeholder: '40 hex chars' },
  { id: 'sha256', label: 'SHA256 hashes', pattern: SHA256, placeholder: '64 hex chars' },
  { id: 'sha512', label: 'SHA512 hashes', pattern: SHA512, placeholder: '128 hex chars' },
  { id: 'cve', label: 'CVE IDs', pattern: CVE, placeholder: 'CVE-2021-44228' },
  { id: 'attack', label: 'MITRE ATT&CK IDs', pattern: ATTACK_ID, placeholder: 'T1055.001' },
  { id: 'btc', label: 'Bitcoin addresses', pattern: BTC, placeholder: 'bc1q… / 1… / 3…' },
];

/** Extract + dedupe every category's matches from a block of text. */
// The URL pattern's character class is deliberately permissive (a real URL can
// contain almost anything in its path/query), which means a URL sitting at the
// end of a sentence in ordinary prose greedily swallows the sentence's own
// trailing punctuation too ("...see http://evil.example/x." -> matches the
// trailing "."). Trim that back off; URLs essentially never legitimately end
// in these characters when embedded in prose, and this is standard practice
// for link-extraction tools generally.
function trimTrailingPunctuation(value: string): string {
  return value.replace(/[.,;:!?'")\]}]+$/, '');
}

export function extractIocs(text: string): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const cat of IOC_CATEGORIES) {
    const re = new RegExp(cat.pattern.source, cat.pattern.flags);
    const seen = new Set<string>();
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const value = cat.id === 'url' ? trimTrailingPunctuation(m[0]) : m[0];
      if (value) seen.add(value);
      if (m.index === re.lastIndex) re.lastIndex += 1; // guard a zero-width match from looping forever
    }
    result[cat.id] = Array.from(seen);
  }
  return result;
}

const DEFANGABLE_DOT = new Set(['ipv4', 'domain', 'email', 'url']);

/** Defang one extracted IOC value for safe sharing (e.g. in a report) — reversible via refangValue. */
export function defangValue(value: string, categoryId: string): string {
  let out = value;
  if (categoryId === 'url') out = out.replace(/https?/gi, (m) => (m[m.length - 1].toLowerCase() === 's' ? 'hxxps' : 'hxxp'));
  if (categoryId === 'ipv6') out = out.replace(/:/g, '[:]');
  if (DEFANGABLE_DOT.has(categoryId)) out = out.replace(/\./g, '[.]');
  if (categoryId === 'email') out = out.replace(/@/g, '[at]');
  return out;
}

/** Reverse defangValue. */
export function refangValue(value: string, categoryId: string): string {
  let out = value;
  if (categoryId === 'url') out = out.replace(/hxxps/gi, 'https').replace(/hxxp/gi, 'http');
  if (categoryId === 'ipv6') out = out.replace(/\[:\]/g, ':');
  if (DEFANGABLE_DOT.has(categoryId)) out = out.replace(/\[\.\]/g, '.');
  if (categoryId === 'email') out = out.replace(/\[at\]/gi, '@');
  return out;
}
