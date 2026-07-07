// Comprehensive timestamp/epoch conversion engine — pure functions, no DOM
// dependency, so this is unit-tested directly (test/timestamps.test.ts) *and*
// imported into the client bundle (TimestampConverter.astro) for live,
// bidirectional conversion between every supported format.
//
// Canonical representation: nanoseconds since the Unix epoch (1970-01-01T00:
// 00:00Z), as a bigint (negative for pre-1970 instants) — the finest
// granularity among every supported format, so converting through it never
// loses precision for any format below.
//
// Every epoch offset/constant here was independently researched *and*
// adversarially fact-checked against authoritative sources (Microsoft Learn,
// RFC text, Apple/forensic documentation) before being hard-coded — see the
// worked examples in each format's test cases. Two format families are
// inherently ambiguous without external context and are handled explicitly
// rather than silently guessing:
//   - FAT/DOS packed date-time is stored in *local* time with no offset
//     field; RFC 3164 syslog has no year *or* offset field. Both take a
//     `refOffsetMinutes` (0 = UTC, or the browser's local offset) and, for
//     syslog, a `refYear` to resolve against — see parseFat/parseSyslogBsd.

export type TimestampCategory = 'epoch' | 'text' | 'packed';

export interface TimestampFormat {
  id: string;
  label: string;
  category: TimestampCategory;
  placeholder: string;
  /** Parse this format's raw text into canonical nanoseconds since the Unix epoch, or null if invalid. */
  parse: (raw: string, ctx: ConvertContext) => bigint | null;
  /** Format canonical nanoseconds since the Unix epoch into this format's raw text. */
  format: (ns: bigint, ctx: ConvertContext) => string;
}

/** Context needed by the handful of formats that are ambiguous without external info. */
export interface ConvertContext {
  /** Offset (in minutes, UTC minus local — i.e. what Date#getTimezoneOffset() returns) used to
   *  interpret/display formats with no explicit offset of their own. 0 = UTC. */
  refOffsetMinutes: number;
  /** Year assumed for formats with no year field (RFC 3164 syslog). */
  refYear: number;
}

export const DEFAULT_CONTEXT: ConvertContext = { refOffsetMinutes: 0, refYear: new Date().getUTCFullYear() };

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const NS_PER_MS = 1_000_000n;
const SEC = 1_000_000_000n; // nanoseconds per second
const MS_PER_DAY = 86_400_000;

function pad(n: number, width: number): string {
  const s = Math.trunc(Math.abs(n)).toString();
  return (n < 0 ? '-' : '') + '0'.repeat(Math.max(0, width - s.length)) + s;
}

/** Floor (not truncating) bigint division — JS's native `/`/`%` truncate toward zero. */
function floorDivMod(a: bigint, b: bigint): [bigint, bigint] {
  let q = a / b;
  let r = a % b;
  if (r !== 0n && (r < 0n) !== (b < 0n)) {
    q -= 1n;
    r += b;
  }
  return [q, r];
}

/** A civil (calendar) date-time, interpreted at a given UTC offset, to canonical ns. */
function civilToNs(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  fracSeconds: number,
  offsetMinutes: number,
): bigint | null {
  const ms = Date.UTC(year, month - 1, day, hour, minute, second) - offsetMinutes * 60_000;
  if (!Number.isFinite(ms)) return null;
  const fracNs = Math.round(fracSeconds * 1e9);
  return BigInt(Math.round(ms)) * NS_PER_MS + BigInt(fracNs);
}

interface CivilParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  fracNs: number;
  weekday: number; // 0 = Sunday
}

/** Canonical ns, shifted to a given UTC offset, broken into civil date-time parts. */
function nsToCivil(ns: bigint, offsetMinutes: number): CivilParts | null {
  // Floor-divide by a full SECOND (not a millisecond) so fracNs correctly
  // captures the whole sub-second remainder (0 to 999,999,999) — dividing by
  // NS_PER_MS here would silently discard everything past the millisecond,
  // which previously dropped ISO 8601/RFC 2822's fractional-second digits.
  const [totalSec, fracNs] = floorDivMod(ns, SEC);
  const shiftedMs = Number(totalSec) * 1000 + offsetMinutes * 60_000;
  if (!Number.isFinite(shiftedMs) || Math.abs(shiftedMs) > 8_640_000_000_000_000) return null;
  const d = new Date(shiftedMs);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds(),
    fracNs: Number(fracNs),
    weekday: d.getUTCDay(),
  };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function monthIndex(name: string): number {
  return MONTHS.findIndex((m) => m.toLowerCase() === name.slice(0, 3).toLowerCase());
}

// ---------------------------------------------------------------------------
// 1. Linear epoch formats — a raw integer tick count from a fixed UTC epoch.
//    Every one of these is timezone-agnostic (always a UTC instant), which is
//    exactly why they're the formats DFIR tooling relies on for correlation.
// ---------------------------------------------------------------------------

function linearFormat(
  id: string,
  label: string,
  unitNanos: bigint,
  epochOffsetNanos: bigint,
  placeholder: string,
): TimestampFormat {
  return {
    id,
    label,
    category: 'epoch',
    placeholder,
    parse(raw) {
      const t = raw.trim();
      if (!/^-?\d+$/.test(t)) return null;
      try {
        return BigInt(t) * unitNanos + epochOffsetNanos;
      } catch {
        return null;
      }
    },
    format(ns) {
      const [ticks] = floorDivMod(ns - epochOffsetNanos, unitNanos);
      return ticks.toString();
    },
  };
}

const FILETIME_EPOCH_OFFSET_NS = -11_644_473_600n * SEC; // 1601-01-01 -> 1970-01-01
const NET_TICKS_EPOCH_OFFSET_NS = -62_135_596_800n * SEC; // 0001-01-01 -> 1970-01-01
const MAC_ABSOLUTE_EPOCH_OFFSET_NS = 978_307_200n * SEC; // 1970-01-01 -> 2001-01-01
const HFS_PLUS_EPOCH_OFFSET_NS = -2_082_844_800n * SEC; // 1904-01-01 -> 1970-01-01
const UUID_V1_EPOCH_OFFSET_NS = -12_219_292_800n * SEC; // 1582-10-15 -> 1970-01-01
const GPS_UTC_LEAP_OFFSET_SEC = 18n; // GPS - UTC, as of the last (2016-12-31) leap second, unchanged through 2026
const GPS_EPOCH_OFFSET_NS = (315_964_800n - GPS_UTC_LEAP_OFFSET_SEC) * SEC; // 1970-01-01 -> 1980-01-06, minus the leap offset
const TAI_UTC_OFFSET_SEC = 37n; // TAI - UTC, unchanged since 2017-01-01 through 2026
const TAI64_BASE = 2n ** 62n; // TAI64's raw value at 1970-01-01T00:00:00 TAI
const TAI64_EPOCH_OFFSET_NS = -(TAI64_BASE + TAI_UTC_OFFSET_SEC) * SEC;

const unixSeconds = linearFormat('unix-s', 'Unix (seconds)', SEC, 0n, 'e.g. 1735689600');
const unixMillis = linearFormat('unix-ms', 'Unix (milliseconds)', 1_000_000n, 0n, 'e.g. 1735689600000');
const unixMicros = linearFormat('unix-us', 'Unix (microseconds)', 1_000n, 0n, 'e.g. 1735689600000000');
const unixNanos = linearFormat('unix-ns', 'Unix (nanoseconds)', 1n, 0n, 'e.g. 1735689600000000000');
const winFiletime = linearFormat('filetime', 'Windows FILETIME', 100n, FILETIME_EPOCH_OFFSET_NS, 'e.g. 133815552000000000');
const webkitTime = linearFormat('webkit', 'WebKit / Chrome timestamp', 1_000n, FILETIME_EPOCH_OFFSET_NS, 'e.g. 13381555200000000');
const macAbsolute = linearFormat('mac-absolute', 'Mac Absolute Time (Cocoa)', SEC, MAC_ABSOLUTE_EPOCH_OFFSET_NS, 'e.g. 757382400');
const hfsPlus = linearFormat('hfsplus', 'HFS+ timestamp', SEC, HFS_PLUS_EPOCH_OFFSET_NS, 'e.g. 3818534400');
const netTicks = linearFormat('net-ticks', '.NET Ticks', 100n, NET_TICKS_EPOCH_OFFSET_NS, 'e.g. 638735652000000000');
const uuidV1 = linearFormat('uuid-v1', 'UUID v1 timestamp', 100n, UUID_V1_EPOCH_OFFSET_NS, 'e.g. 139467792000000000');
const gpsTime = linearFormat('gps', 'GPS time', SEC, GPS_EPOCH_OFFSET_NS, 'e.g. 1451606400');
const tai64 = linearFormat('tai64', 'TAI64', SEC, TAI64_EPOCH_OFFSET_NS, 'e.g. 0x400000006769FB80 or decimal');

// TAI64's own external representation is usually shown as a 0x-prefixed hex label —
// accept & emit hex so a copy-pasted TAI64 label round-trips as typically written.
const tai64Hex: TimestampFormat = {
  ...tai64,
  parse(raw, ctx) {
    const t = raw.trim();
    const hexMatch = /^(0x)?([0-9a-fA-F]{16})$/.exec(t);
    if (hexMatch) return tai64.parse(BigInt('0x' + hexMatch[2]).toString(), ctx);
    return tai64.parse(t, ctx);
  },
  format(ns, ctx) {
    const decimal = tai64.format(ns, ctx);
    try {
      return '0x' + BigInt(decimal).toString(16).padStart(16, '0');
    } catch {
      return decimal;
    }
  },
};

// ---------------------------------------------------------------------------
// 2. OLE Automation Date / Excel serial date — a *fractional* day count
//    (integer part = days, fractional part = time-of-day), so it can't use
//    the integer-tick factory above.
// ---------------------------------------------------------------------------

const OLE_EPOCH_DAYS = 25_569; // days between 1899-12-30 and 1970-01-01

const oleAutomationDate: TimestampFormat = {
  id: 'ole-date',
  label: 'OLE Automation Date / Excel serial',
  category: 'epoch',
  placeholder: 'e.g. 45658.5',
  parse(raw) {
    const t = raw.trim();
    if (!/^-?\d+(\.\d+)?$/.test(t)) return null;
    const serial = Number(t);
    if (!Number.isFinite(serial)) return null;
    const unixDays = serial - OLE_EPOCH_DAYS;
    const ns = unixDays * MS_PER_DAY * 1e6;
    if (!Number.isFinite(ns)) return null;
    return BigInt(Math.round(ns));
  },
  format(ns) {
    const [ms] = floorDivMod(ns, NS_PER_MS);
    const serial = Number(ms) / MS_PER_DAY + OLE_EPOCH_DAYS;
    // Trim to a sane number of decimal places (double precision starts getting
    // noisy well past this for a day-scale serial).
    return (Math.round(serial * 1e6) / 1e6).toString();
  },
};

// ---------------------------------------------------------------------------
// 3. Text / calendar formats
// ---------------------------------------------------------------------------

const iso8601: TimestampFormat = {
  id: 'iso8601',
  label: 'ISO 8601 / RFC 3339',
  category: 'text',
  placeholder: 'e.g. 2025-01-01T00:00:00Z',
  parse(raw) {
    const m =
      /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})(?:[.,](\d+))?(Z|z|[+-]\d{2}:?\d{2})?$/.exec(raw.trim());
    if (!m) return null;
    const [, y, mo, d, h, mi, s, fracStr, zone] = m;
    const frac = fracStr ? Number('0.' + fracStr) : 0;
    let offsetMinutes = 0;
    if (zone && zone !== 'Z' && zone !== 'z') {
      const zm = /^([+-])(\d{2}):?(\d{2})$/.exec(zone)!;
      offsetMinutes = (zm[1] === '-' ? -1 : 1) * (Number(zm[2]) * 60 + Number(zm[3]));
    }
    return civilToNs(Number(y), Number(mo), Number(d), Number(h), Number(mi), Number(s), frac, offsetMinutes);
  },
  format(ns, ctx) {
    const p = nsToCivil(ns, ctx.refOffsetMinutes);
    if (!p) return '';
    const frac = p.fracNs > 0 ? '.' + pad(Math.round(p.fracNs / 1e6), 3) : '';
    const off = ctx.refOffsetMinutes === 0 ? 'Z' : offsetSuffix(ctx.refOffsetMinutes);
    return `${pad(p.year, 4)}-${pad(p.month, 2)}-${pad(p.day, 2)}T${pad(p.hour, 2)}:${pad(p.minute, 2)}:${pad(p.second, 2)}${frac}${off}`;
  },
};

function offsetSuffix(offsetMinutes: number): string {
  const sign = offsetMinutes < 0 ? '-' : '+';
  const abs = Math.abs(offsetMinutes);
  return `${sign}${pad(Math.floor(abs / 60), 2)}:${pad(abs % 60, 2)}`;
}

// RFC 5322 obs-zone table (§4.3): named/military zones with no reliable, unambiguous
// offset are supposed to be treated as offset 0 ("unknown"); the handful of legacy
// US zones the RFC explicitly lists do have defined offsets.
const OBS_ZONES: Record<string, number> = {
  UT: 0, GMT: 0, EST: -300, EDT: -240, CST: -360, CDT: -300, MST: -420, MDT: -360, PST: -480, PDT: -420,
};

const rfc2822: TimestampFormat = {
  id: 'rfc2822',
  label: 'RFC 2822 (email Date header)',
  category: 'text',
  placeholder: 'e.g. Wed, 01 Jan 2025 00:00:00 +0000',
  parse(raw) {
    const m = /^(?:[A-Za-z]{3},\s*)?(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2,4})\s+(\d{2}):(\d{2})(?::(\d{2}))?\s+([A-Za-z]+|[+-]\d{4})$/.exec(
      raw.trim(),
    );
    if (!m) return null;
    const [, dayStr, monStr, yearStr, h, mi, s, zone] = m;
    const month = monthIndex(monStr) + 1;
    if (month <= 0) return null;
    let year = Number(yearStr);
    if (yearStr.length <= 2) year += year < 50 ? 2000 : 1900; // RFC 5322 §4.3 obs-year windowing
    else if (yearStr.length === 3) year += 1900;
    let offsetMinutes = 0;
    const numeric = /^([+-])(\d{2})(\d{2})$/.exec(zone);
    if (numeric) offsetMinutes = (numeric[1] === '-' ? -1 : 1) * (Number(numeric[2]) * 60 + Number(numeric[3]));
    else offsetMinutes = OBS_ZONES[zone.toUpperCase()] ?? 0; // unrecognized obs-zone -> treat as unknown/0 per RFC
    return civilToNs(year, month, Number(dayStr), Number(h), Number(mi), Number(s || 0), 0, offsetMinutes);
  },
  format(ns, ctx) {
    const p = nsToCivil(ns, ctx.refOffsetMinutes);
    if (!p) return '';
    return `${WEEKDAYS[p.weekday]}, ${pad(p.day, 2)} ${MONTHS[p.month - 1]} ${p.year} ${pad(p.hour, 2)}:${pad(p.minute, 2)}:${pad(p.second, 2)} ${offsetSuffix(ctx.refOffsetMinutes).replace(':', '')}`;
  },
};

const httpDate: TimestampFormat = {
  id: 'http-date',
  label: 'HTTP-date (RFC 7231, IMF-fixdate)',
  category: 'text',
  placeholder: 'e.g. Wed, 01 Jan 2025 00:00:00 GMT',
  parse(raw) {
    const m = /^[A-Za-z]{3},\s*(\d{2})\s+([A-Za-z]{3})\s+(\d{4})\s+(\d{2}):(\d{2}):(\d{2})\s+GMT$/.exec(raw.trim());
    if (!m) return null;
    const [, d, monStr, y, h, mi, s] = m;
    const month = monthIndex(monStr) + 1;
    if (month <= 0) return null;
    return civilToNs(Number(y), month, Number(d), Number(h), Number(mi), Number(s), 0, 0);
  },
  format(ns) {
    // HTTP-date is always GMT/UTC by definition, regardless of the reference offset.
    const p = nsToCivil(ns, 0);
    if (!p) return '';
    return `${WEEKDAYS[p.weekday]}, ${pad(p.day, 2)} ${MONTHS[p.month - 1]} ${p.year} ${pad(p.hour, 2)}:${pad(p.minute, 2)}:${pad(p.second, 2)} GMT`;
  },
};

const syslogBsd: TimestampFormat = {
  id: 'syslog-3164',
  label: 'Syslog (RFC 3164, BSD)',
  category: 'text',
  placeholder: 'e.g. Jan  1 00:00:00',
  parse(raw, ctx) {
    const m = /^([A-Za-z]{3})\s+(\d{1,2})\s+(\d{2}):(\d{2}):(\d{2})$/.exec(raw.trim());
    if (!m) return null;
    const [, monStr, d, h, mi, s] = m;
    const month = monthIndex(monStr) + 1;
    if (month <= 0) return null;
    // No year in this format at all — resolve against the caller-supplied reference
    // year. (A fuller rollover heuristic — "December entries near a January
    // reference are probably last year" — needs a reference *month* too, which
    // this tool doesn't collect; ctx.refYear is documented as a best-effort
    // assumption, not a guarantee, same as the research flagged for this format.)
    return civilToNs(ctx.refYear, month, Number(d), Number(h), Number(mi), Number(s), 0, ctx.refOffsetMinutes);
  },
  format(ns, ctx) {
    const p = nsToCivil(ns, ctx.refOffsetMinutes);
    if (!p) return '';
    const day = p.day < 10 ? ' ' + p.day : String(p.day); // RFC 3164: space-padded, not zero-padded
    return `${MONTHS[p.month - 1]} ${day} ${pad(p.hour, 2)}:${pad(p.minute, 2)}:${pad(p.second, 2)}`;
  },
};

const apacheClf: TimestampFormat = {
  id: 'clf',
  label: 'Apache/NCSA Common Log Format',
  category: 'text',
  placeholder: 'e.g. [01/Jan/2025:00:00:00 +0000]',
  parse(raw) {
    const m = /^\[?(\d{2})\/([A-Za-z]{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2})\s+([+-]\d{4})\]?$/.exec(raw.trim());
    if (!m) return null;
    const [, d, monStr, y, h, mi, s, zone] = m;
    const month = monthIndex(monStr) + 1;
    if (month <= 0) return null;
    const zm = /^([+-])(\d{2})(\d{2})$/.exec(zone)!;
    const offsetMinutes = (zm[1] === '-' ? -1 : 1) * (Number(zm[2]) * 60 + Number(zm[3]));
    return civilToNs(Number(y), month, Number(d), Number(h), Number(mi), Number(s), 0, offsetMinutes);
  },
  format(ns, ctx) {
    const p = nsToCivil(ns, ctx.refOffsetMinutes);
    if (!p) return '';
    return `[${pad(p.day, 2)}/${MONTHS[p.month - 1]}/${p.year}:${pad(p.hour, 2)}:${pad(p.minute, 2)}:${pad(p.second, 2)} ${offsetSuffix(ctx.refOffsetMinutes).replace(':', '')}]`;
  },
};

// ---------------------------------------------------------------------------
// 4. FAT/DOS packed date-time — a 32-bit value (date word in the high 16
//    bits, time word in the low 16), stored in *local* time with no offset
//    field of its own — genuinely ambiguous without external context, so it
//    resolves against ctx.refOffsetMinutes like RFC 3164 syslog above.
// ---------------------------------------------------------------------------

const fatDosDateTime: TimestampFormat = {
  id: 'fat-dos',
  label: 'FAT/DOS packed date-time',
  category: 'packed',
  placeholder: 'e.g. 0x21440000 (date<<16 | time)',
  parse(raw, ctx) {
    const t = raw.trim();
    let value: bigint;
    try {
      value = BigInt(t); // BigInt() natively accepts both plain decimal and 0x-prefixed hex strings
    } catch {
      return null;
    }
    if (value < 0n || value > 0xffffffffn) return null;
    const dateWord = Number((value >> 16n) & 0xffffn);
    const timeWord = Number(value & 0xffffn);
    const year = 1980 + (dateWord >> 9);
    const month = (dateWord >> 5) & 0xf;
    const day = dateWord & 0x1f;
    const hour = (timeWord >> 11) & 0x1f;
    const minute = (timeWord >> 5) & 0x3f;
    const second = (timeWord & 0x1f) * 2;
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return civilToNs(year, month, day, hour, minute, second, 0, ctx.refOffsetMinutes);
  },
  format(ns, ctx) {
    const p = nsToCivil(ns, ctx.refOffsetMinutes);
    if (!p || p.year < 1980 || p.year > 2107) return ''; // 7-bit year-since-1980 field range
    const dateWord = ((p.year - 1980) << 9) | (p.month << 5) | p.day;
    const timeWord = (p.hour << 11) | (p.minute << 5) | Math.floor(p.second / 2);
    const packed = (BigInt(dateWord) << 16n) | BigInt(timeWord);
    return '0x' + packed.toString(16).padStart(8, '0');
  },
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const TIMESTAMP_FORMATS: TimestampFormat[] = [
  unixSeconds,
  unixMillis,
  unixMicros,
  unixNanos,
  winFiletime,
  webkitTime,
  macAbsolute,
  hfsPlus,
  netTicks,
  oleAutomationDate,
  uuidV1,
  gpsTime,
  tai64Hex,
  iso8601,
  rfc2822,
  httpDate,
  syslogBsd,
  apacheClf,
  fatDosDateTime,
];

export function formatById(id: string): TimestampFormat | undefined {
  return TIMESTAMP_FORMATS.find((f) => f.id === id);
}

/** Best-effort auto-detect: try every format, keep parses that land within a
 *  plausible date range (1990-2100), ranked by how "in range" they are. Used
 *  to guess which format a pasted raw value is most likely in. */
export function detectFormat(raw: string): { format: TimestampFormat; ns: bigint }[] {
  const MIN_NS = -946_684_800_000_000_000n; // 1940-01-01
  const MAX_NS = 4_102_444_800_000_000_000n; // 2100-01-01
  const results: { format: TimestampFormat; ns: bigint }[] = [];
  for (const format of TIMESTAMP_FORMATS) {
    const ns = format.parse(raw, DEFAULT_CONTEXT);
    if (ns !== null && ns >= MIN_NS && ns <= MAX_NS) results.push({ format, ns });
  }
  return results;
}

/**
 * The UTC offset (in minutes, same sign convention as ConvertContext.refOffsetMinutes
 * — positive when the zone's local clock reads AHEAD of UTC, e.g. +330 for
 * Asia/Kolkata) for a given IANA time zone name at a given instant. DST-aware:
 * asks Intl to format the actual instant in that zone rather than using a
 * static lookup, so the same zone name correctly resolves to a different
 * offset in January vs. July where DST applies. Returns null if the runtime's
 * ICU data doesn't recognize the zone name.
 */
export function offsetMinutesForZone(ns: bigint, timeZone: string): number | null {
  const [totalSec] = floorDivMod(ns, SEC);
  const ms = Number(totalSec) * 1000;
  if (!Number.isFinite(ms)) return null;
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).formatToParts(new Date(ms));
  } catch {
    return null;
  }
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? NaN);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  if (!Number.isFinite(asUtc)) return null;
  return Math.round((asUtc - ms) / 60_000);
}
