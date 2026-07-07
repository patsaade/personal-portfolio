import { describe, it, expect } from 'vitest';
import { formatById, detectFormat, DEFAULT_CONTEXT, type ConvertContext } from '../src/utils/timestamps';

// Every worked example below is either lifted directly from the tool's own
// independently fact-checked research (adversarially verified against
// Microsoft Learn / RFC text / Apple & forensic documentation), or derived
// from first-principles day-counting where the research's own illustrative
// example had a labeling slip in the final displayed clock time (the offset
// constants themselves were confirmed correct in all cases — see the format's
// implementation comments in src/utils/timestamps.ts for the citation).

const UTC: ConvertContext = { refOffsetMinutes: 0, refYear: 2026 };
const nsFor = (unixSeconds: number, fracSeconds = 0) => BigInt(Math.round((unixSeconds + fracSeconds) * 1e9));

describe('linear epoch formats — parse', () => {
  it('Unix seconds is the identity', () => {
    expect(formatById('unix-s')!.parse('971211336', UTC)).toBe(nsFor(971211336));
  });

  it('Unix milliseconds/microseconds/nanoseconds scale correctly', () => {
    expect(formatById('unix-ms')!.parse('971211336000', UTC)).toBe(nsFor(971211336));
    expect(formatById('unix-us')!.parse('971211336000000', UTC)).toBe(nsFor(971211336));
    expect(formatById('unix-ns')!.parse('971211336000000000', UTC)).toBe(nsFor(971211336));
  });

  it('Windows FILETIME: 132587904000000000 -> 2021-02-26T05:20:00Z (Unix 1,614,316,800)', () => {
    expect(formatById('filetime')!.parse('132587904000000000', UTC)).toBe(nsFor(1_614_316_800));
  });

  it('WebKit/Chrome timestamp shares FILETIME\'s epoch at microsecond precision', () => {
    // Same instant as the FILETIME case above (100ns ticks / 10 = microseconds).
    expect(formatById('webkit')!.parse('13258790400000000', UTC)).toBe(nsFor(1_614_316_800));
  });

  it('HFS+ timestamp: 3,786,933,600 -> 2024-01-01T06:00:00Z (Unix 1,704,088,800)', () => {
    expect(formatById('hfsplus')!.parse('3786933600', UTC)).toBe(nsFor(1_704_088_800));
  });

  it('.NET Ticks: 638538912000000000 -> 2024-06-13T16:00:00Z (Unix 1,718,294,400)', () => {
    expect(formatById('net-ticks')!.parse('638538912000000000', UTC)).toBe(nsFor(1_718_294_400));
  });

  it('.NET Ticks and FILETIME share a tick unit but NOT an epoch', () => {
    const filetimeNs = formatById('filetime')!.parse('132587904000000000', UTC)!;
    const netTicksNs = formatById('net-ticks')!.parse('132587904000000000', UTC)!;
    expect(filetimeNs).not.toBe(netTicksNs);
  });

  it('Mac Absolute Time (Cocoa): 773100000 -> Unix 1,751,407,200 (2025-07-01T22:00:00Z)', () => {
    expect(formatById('mac-absolute')!.parse('773100000', UTC)).toBe(nsFor(1_751_407_200));
  });

  it('UUID v1 timestamp: 138857432315160832 (100ns since 1582-10-15) -> Unix 1,666,450,431.5160832', () => {
    // The research's own prose rounds this to "1,666,450,431.5" for readability;
    // the exact value implied by the raw 100ns tick count is .5160832, not .5 —
    // verified here via the exact BigInt arithmetic (ticks*100ns - epoch offset).
    expect(formatById('uuid-v1')!.parse('138857432315160832', UTC)).toBe(1_666_450_431_516_083_200n);
  });

  it('GPS time: 1,375,000,000 -> Unix 1,690,964,782 (2023-08-02T08:26:22Z, 18s ahead of UTC)', () => {
    expect(formatById('gps')!.parse('1375000000', UTC)).toBe(nsFor(1_690_964_782));
  });

  it('TAI64 (hex): 0x400000006144CD00 -> Unix 1,631,898,843 (37s TAI-UTC offset applied)', () => {
    expect(formatById('tai64')!.parse('0x400000006144CD00', UTC)).toBe(nsFor(1_631_898_843));
  });

  it('TAI64 also accepts a plain decimal raw value', () => {
    const hex = formatById('tai64')!.parse('0x400000006144CD00', UTC);
    const decimalValue = BigInt('0x400000006144CD00').toString();
    expect(formatById('tai64')!.parse(decimalValue, UTC)).toBe(hex);
  });

  it('rejects non-integer garbage for a linear format', () => {
    expect(formatById('unix-s')!.parse('not-a-number', UTC)).toBeNull();
    expect(formatById('filetime')!.parse('12.5', UTC)).toBeNull();
  });
});

describe('linear epoch formats — format (round-trip)', () => {
  it('round-trips Unix seconds/ms/us/ns through canonical ns', () => {
    for (const id of ['unix-s', 'unix-ms', 'unix-us', 'unix-ns', 'filetime', 'webkit', 'mac-absolute', 'hfsplus', 'net-ticks', 'uuid-v1', 'gps']) {
      const fmt = formatById(id)!;
      const ns = nsFor(1_700_000_000);
      const raw = fmt.format(ns, UTC);
      expect(fmt.parse(raw, UTC)).toBe(ns);
    }
  });

  it('formats FILETIME back to the exact verified tick value', () => {
    expect(formatById('filetime')!.format(nsFor(1_614_316_800), UTC)).toBe('132587904000000000');
  });
});

describe('OLE Automation Date / Excel serial', () => {
  it('serial 36526 -> 2000-01-01T00:00:00Z (Unix 946,684,800; 10,957 days since 1899-12-30)', () => {
    expect(formatById('ole-date')!.parse('36526', UTC)).toBe(nsFor(946_684_800));
  });

  it('round-trips a fractional (time-of-day) serial', () => {
    const fmt = formatById('ole-date')!;
    const ns = fmt.parse('36526.5', UTC)!; // noon on 2000-01-01
    expect(ns).toBe(nsFor(946_684_800 + 43_200));
    expect(fmt.format(ns, UTC)).toBe('36526.5');
  });
});

describe('text/calendar formats', () => {
  it('ISO 8601 with explicit offset: 2024-03-05T13:22:07+02:00 -> Unix 1,709,637,727', () => {
    expect(formatById('iso8601')!.parse('2024-03-05T13:22:07+02:00', UTC)).toBe(nsFor(1_709_637_727));
  });

  it('RFC 3339 with fractional seconds: 1985-04-12T23:20:50.52Z -> Unix 482,196,050.52', () => {
    expect(formatById('iso8601')!.parse('1985-04-12T23:20:50.52Z', UTC)).toBe(nsFor(482_196_050.52));
  });

  it('RFC 3339 with negative offset: 1996-12-19T16:39:57-08:00 -> Unix 851,042,397', () => {
    expect(formatById('iso8601')!.parse('1996-12-19T16:39:57-08:00', UTC)).toBe(nsFor(851_042_397));
  });

  it('formats back to strict RFC 3339 (Z for UTC context)', () => {
    expect(formatById('iso8601')!.format(nsFor(1_709_637_727 + 2 * 3600), UTC)).toBe('2024-03-05T13:22:07Z');
  });

  it('RFC 2822 with numeric offset: Thu, 13 Feb 1969 23:32:54 -0330 -> 1969-02-14T03:02:54Z', () => {
    const ns = formatById('rfc2822')!.parse('Thu, 13 Feb 1969 23:32:54 -0330', UTC);
    expect(ns).toBe(formatById('iso8601')!.parse('1969-02-14T03:02:54Z', UTC));
  });

  it('RFC 2822 obs-year windowing: 2-digit year 97 -> 1997', () => {
    const ns = formatById('rfc2822')!.parse('Fri, 21 Nov 97 09:55:06 GMT', UTC)!;
    const civil = formatById('iso8601')!.format(ns, UTC);
    expect(civil.startsWith('1997-11-21')).toBe(true);
  });

  it('RFC 2822 obs-year windowing: 2-digit year 26 -> 2026', () => {
    const ns = formatById('rfc2822')!.parse('Mon, 05 Jan 26 09:00:00 GMT', UTC)!;
    const civil = formatById('iso8601')!.format(ns, UTC);
    expect(civil.startsWith('2026-01-05')).toBe(true);
  });

  it('HTTP-date (IMF-fixdate): Sun, 06 Nov 1994 08:49:37 GMT -> Unix 784,111,777', () => {
    expect(formatById('http-date')!.parse('Sun, 06 Nov 1994 08:49:37 GMT', UTC)).toBe(nsFor(784_111_777));
  });

  it('HTTP-date always formats as GMT regardless of reference offset', () => {
    const localCtx: ConvertContext = { refOffsetMinutes: -480, refYear: 2026 };
    expect(formatById('http-date')!.format(nsFor(784_111_777), localCtx)).toBe('Sun, 06 Nov 1994 08:49:37 GMT');
  });

  it('Apache/NCSA CLF: [10/Oct/2000:13:55:36 -0700] -> Unix 971,211,336', () => {
    expect(formatById('clf')!.parse('[10/Oct/2000:13:55:36 -0700]', UTC)).toBe(nsFor(971_211_336));
  });

  it('Apache/NCSA CLF: [01/May/2025:07:20:10 +0000] -> Unix 1,746,084,010', () => {
    expect(formatById('clf')!.parse('[01/May/2025:07:20:10 +0000]', UTC)).toBe(nsFor(1_746_084_010));
  });

  it('Syslog RFC 3164 resolves against the supplied reference year', () => {
    const ctx: ConvertContext = { refOffsetMinutes: 0, refYear: 2026 };
    const ns = formatById('syslog-3164')!.parse('Aug  7 10:03:22', ctx)!;
    expect(formatById('iso8601')!.format(ns, UTC)).toBe('2026-08-07T10:03:22Z');
  });

  it('Syslog RFC 3164 formats with the two-space day padding for single-digit days', () => {
    const ctx: ConvertContext = { refOffsetMinutes: 0, refYear: 2026 };
    expect(formatById('syslog-3164')!.format(formatById('iso8601')!.parse('2026-08-07T10:03:22Z', ctx)!, ctx)).toBe(
      'Aug  7 10:03:22',
    );
  });
});

describe('FAT/DOS packed date-time', () => {
  it('date word 0x2144 + time word 0x6234 -> 1996-10-04T12:17:40', () => {
    // Verified bit-by-bit against the FAT spec: date>>9=16 (year 1996), (date>>5)&0xF=10
    // (month), date&0x1F=4 (day); time>>11=12 (hour), (time>>5)&0x3F=17 (minute),
    // (time&0x1F)*2=40 (second).
    const packed = (0x2144 << 16) | 0x6234;
    const ns = formatById('fat-dos')!.parse('0x' + packed.toString(16), UTC);
    expect(ns).toBe(formatById('iso8601')!.parse('1996-10-04T12:17:40Z', UTC));
  });

  it('round-trips through parse/format at UTC', () => {
    const fmt = formatById('fat-dos')!;
    const ns = formatById('iso8601')!.parse('2020-05-15T08:30:00Z', UTC)!;
    const raw = fmt.format(ns, UTC);
    expect(fmt.parse(raw, UTC)).toBe(ns);
  });

  it('rejects years before the FAT epoch (1980)', () => {
    const ns = formatById('iso8601')!.parse('1975-01-01T00:00:00Z', UTC)!;
    expect(formatById('fat-dos')!.format(ns, UTC)).toBe('');
  });
});

describe('detectFormat', () => {
  it('finds Unix seconds as a plausible interpretation of a 10-digit number', () => {
    const matches = detectFormat('1735689600');
    expect(matches.some((m) => m.format.id === 'unix-s')).toBe(true);
  });

  it('finds Windows FILETIME as a plausible interpretation of an 18-digit number', () => {
    const matches = detectFormat('132587904000000000');
    expect(matches.some((m) => m.format.id === 'filetime')).toBe(true);
  });

  it('recognizes an ISO 8601 string', () => {
    const matches = detectFormat('2024-03-05T13:22:07+02:00');
    expect(matches.some((m) => m.format.id === 'iso8601')).toBe(true);
  });

  it('returns nothing for unparseable garbage', () => {
    expect(detectFormat('not a timestamp at all')).toEqual([]);
  });
});

describe('DEFAULT_CONTEXT', () => {
  it('defaults refYear to a real, current-ish year (not a placeholder like 1970)', () => {
    expect(DEFAULT_CONTEXT.refYear).toBeGreaterThan(2020);
  });
});
