// DFIR Regex Tester & Pattern Library — a small curated library of common
// DFIR-relevant regex patterns (src/components/RegexTester.astro renders them
// as clickable chips that populate the tester), plus the pure match/compile
// engine behind the live tester itself. Everything here is pure functions, no
// DOM dependency, so it's unit-tested directly (test/regexPatterns.test.ts)
// and imported straight into the client bundle for live use.
//
// Patterns are stored as plain source strings (not RegExp literals) so a
// library entry can populate the pattern/flags text inputs verbatim — the
// user then edits them freely, same as pasting a pattern in by hand. Every
// pattern below is a reasonable, general-purpose heuristic (not an exhaustive
// spec-perfect grammar) — e.g. the Base64 pattern can't tell a genuine base64
// blob from 32+ characters of coincidentally base64-alphabet text, and the
// registry-key pattern doesn't validate against the real hive/key namespace.
// An analyst reviews the results; this doesn't replace judgment, same
// disclaimer as src/utils/iocs.ts's extraction engine.

export interface DfirRegexPattern {
  id: string;
  label: string;
  /** Regex source (no delimiters) — safe to drop straight into a pattern input. */
  pattern: string;
  flags: string;
  description: string;
}

export const DFIR_REGEX_PATTERNS: DfirRegexPattern[] = [
  {
    id: 'ipv4',
    label: 'IPv4 Address',
    pattern: String.raw`\b(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\b`,
    flags: 'g',
    description: 'Four dot-separated octets, each range-checked to 0–255 (so it skips out-of-range values like 999.999.999.999).',
  },
  {
    id: 'ipv6',
    label: 'IPv6 Address',
    pattern: String.raw`(?<![\w:])(?:(?:[A-Fa-f0-9]{1,4}:){7}[A-Fa-f0-9]{1,4}|(?:[A-Fa-f0-9]{1,4}:){1,7}:|(?:[A-Fa-f0-9]{1,4}:){1,6}:[A-Fa-f0-9]{1,4}|(?:[A-Fa-f0-9]{1,4}:){1,5}(?::[A-Fa-f0-9]{1,4}){1,2}|(?:[A-Fa-f0-9]{1,4}:){1,4}(?::[A-Fa-f0-9]{1,4}){1,3}|(?:[A-Fa-f0-9]{1,4}:){1,3}(?::[A-Fa-f0-9]{1,4}){1,4}|(?:[A-Fa-f0-9]{1,4}:){1,2}(?::[A-Fa-f0-9]{1,4}){1,5}|[A-Fa-f0-9]{1,4}:(?:(?::[A-Fa-f0-9]{1,4}){1,6})|:(?:(?::[A-Fa-f0-9]{1,4}){1,7}|:))(?![\w:])`,
    flags: 'g',
    description: 'Covers full, compressed ("::"), and leading/trailing-compressed IPv6 forms.',
  },
  {
    id: 'windows-sid',
    label: 'Windows SID',
    pattern: String.raw`\bS-1-5-\d+(?:-\d+)*\b`,
    flags: 'g',
    description: 'NT Authority security identifiers in S-1-5-… form — from a bare well-known SID (S-1-5-18) to a full domain-relative SID.',
  },
  {
    id: 'guid',
    label: 'GUID / UUID',
    pattern: String.raw`\{?[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\}?`,
    flags: 'gi',
    description: 'The canonical 8-4-4-4-12 hex-group form, with or without the curly braces Windows wraps around device-class and COM GUIDs.',
  },
  {
    id: 'windows-path',
    label: 'Windows File Path',
    pattern: String.raw`[A-Za-z]:\\(?:[^\\/:*?"<>|\r\n]+\\)*[^\\/:*?"<>|\r\n]+`,
    flags: 'g',
    description: 'A drive letter and backslash-separated path (e.g. C:\\Users\\...), excluding characters Windows disallows in file names.',
  },
  {
    id: 'registry-key',
    label: 'Registry Key Path',
    pattern: String.raw`\b(?:HKEY_LOCAL_MACHINE|HKEY_CURRENT_USER|HKEY_CLASSES_ROOT|HKEY_USERS|HKEY_CURRENT_CONFIG|HKLM|HKCU|HKCR|HKU|HKCC)\b(?:\\[^\\\r\n]+)*`,
    flags: 'g',
    description: 'A registry hive (full name or the common abbreviation) followed by its backslash-separated key path.',
  },
  {
    id: 'base64',
    label: 'Base64 Blob',
    pattern: String.raw`\b(?:[A-Za-z0-9+/]{4}){8,}(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?`,
    flags: 'g',
    description: 'A heuristic for a substantial base64 run (32+ characters) with optional trailing padding — not a guarantee the bytes actually decode to anything meaningful.',
  },
  {
    id: 'email',
    label: 'Email Address',
    pattern: String.raw`\b[a-zA-Z0-9][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b`,
    flags: 'g',
    description: 'A conventional local-part@domain.tld address.',
  },
  {
    id: 'hex-hash',
    label: 'MD5 / SHA1 / SHA256 Hash',
    pattern: String.raw`\b(?:[a-fA-F0-9]{32}|[a-fA-F0-9]{40}|[a-fA-F0-9]{64})\b`,
    flags: 'gi',
    description: 'A bare hex digest at exactly the MD5 (32), SHA1 (40), or SHA256 (64) character length — length alone can’t fully disambiguate them, same caveat as the Hash Calculator’s Identify panel.',
  },
];

export type RegexCompileResult = { ok: true; regex: RegExp } | { ok: false; error: string };

/** Compile arbitrary user-supplied pattern + flags text into a RegExp,
 *  never letting `new RegExp()` throw uncaught — a malformed pattern (an
 *  unclosed group, a bad flag combination, ...) comes back as a plain,
 *  readable error string instead. */
export function compileRegexSafely(pattern: string, flags: string): RegexCompileResult {
  try {
    return { ok: true, regex: new RegExp(pattern, flags) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Invalid regular expression.' };
  }
}

interface RegexGroupMatch {
  /** 1-based capture group index, matching how the pattern itself numbers groups. */
  index: number;
  name: string | null;
  value: string | undefined;
}

export interface RegexMatchInfo {
  match: string;
  index: number;
  groups: RegexGroupMatch[];
}

// Scans a regex source for its capturing groups, in order, returning each
// one's name (or null for a plain unnamed group) — skips non-capturing groups
// (?:...), lookarounds (?=...)/(?!...)/(?<=...)/(?<!...), escaped characters,
// and anything inside a character class, none of which count as a capturing
// group. This is what lets the capture-group table show a group's name
// alongside its number: RegExpExecArray's own numbered slots (m[1], m[2], …)
// don't carry names, only m.groups does (keyed by name, not position), so
// there's no built-in way to get "group 2 is named X" without walking the
// source like this.
function extractGroupNames(source: string): (string | null)[] {
  const names: (string | null)[] = [];
  let inClass = false;
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (ch === '\\') {
      i++; // skip the escaped character
      continue;
    }
    if (ch === '[' && !inClass) {
      inClass = true;
      continue;
    }
    if (ch === ']' && inClass) {
      inClass = false;
      continue;
    }
    if (inClass) continue;
    if (ch !== '(') continue;
    if (source[i + 1] === '?') {
      if (source[i + 2] === '<' && source[i + 3] !== '=' && source[i + 3] !== '!') {
        // Named group: (?<name>...)
        const end = source.indexOf('>', i + 3);
        if (end !== -1) {
          names.push(source.slice(i + 3, end));
          i = end;
          continue;
        }
      }
      // Non-capturing group / lookahead / lookbehind — doesn't consume a slot.
      continue;
    }
    names.push(null); // plain capturing group
  }
  return names;
}

// A hard cap on how many matches a single run will report — protects the UI
// (and the DOM it builds) from pathological input, not the regex engine
// itself: a catastrophically backtracking user-supplied pattern can still
// hang the tab on a single RegExp#exec call, same inherent tradeoff every
// client-side regex tester has (there's no way to time-box regex execution
// from JS). That's a genuine, accepted limitation of running arbitrary
// user regexes entirely client-side — not something this function can fix.
const MAX_MATCHES = 2000;

/** Run `regex` against `text` and return every match with its capture
 *  groups. Always scans globally regardless of whether the caller's regex
 *  had the `g` flag set (a non-global regex would otherwise make
 *  `RegExpExecArray`-based scanning loop forever on the same match) — a
 *  fresh RegExp is compiled from the same source/flags plus `g` so the
 *  caller's own regex object is never mutated. */
export function findAllMatches(regex: RegExp, text: string): RegexMatchInfo[] {
  const flags = regex.flags.includes('g') ? regex.flags : `${regex.flags}g`;
  const scanner = new RegExp(regex.source, flags);
  const groupNames = extractGroupNames(regex.source);
  const results: RegexMatchInfo[] = [];
  let m: RegExpExecArray | null;
  while ((m = scanner.exec(text))) {
    const groups: RegexGroupMatch[] = [];
    for (let i = 1; i < m.length; i++) {
      groups.push({ index: i, name: groupNames[i - 1] ?? null, value: m[i] });
    }
    results.push({ match: m[0], index: m.index, groups });
    if (m.index === scanner.lastIndex) scanner.lastIndex += 1; // guard a zero-width match from looping forever
    if (results.length >= MAX_MATCHES) break;
  }
  return results;
}
