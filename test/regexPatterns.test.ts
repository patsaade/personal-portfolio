import { describe, it, expect } from 'vitest';
import { DFIR_REGEX_PATTERNS, compileRegexSafely, findAllMatches, type DfirRegexPattern } from '../src/utils/regexPatterns';

/** Look up a shipped library pattern by id and compile it — fails loudly if
 *  the id doesn't exist, so a typo in this test file itself is obvious. */
function libPattern(id: string): DfirRegexPattern {
  const p = DFIR_REGEX_PATTERNS.find((x) => x.id === id);
  if (!p) throw new Error(`No library pattern with id "${id}"`);
  return p;
}
function compile(p: DfirRegexPattern): RegExp {
  const result = compileRegexSafely(p.pattern, p.flags);
  if (!result.ok) throw new Error(`Library pattern "${p.id}" failed to compile: ${result.error}`);
  return result.regex;
}

describe('DFIR_REGEX_PATTERNS', () => {
  it('every shipped pattern compiles without throwing', () => {
    for (const p of DFIR_REGEX_PATTERNS) {
      expect(() => new RegExp(p.pattern, p.flags)).not.toThrow();
    }
  });

  it('every pattern has a unique id', () => {
    const ids = DFIR_REGEX_PATTERNS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ipv4 matches a real address and rejects out-of-range octets', () => {
    const re = compile(libPattern('ipv4'));
    expect('beaconed to 203.0.113.42 today').toMatch(re);
    expect('999.999.999.999').not.toMatch(re);
  });

  it('ipv6 matches full and compressed forms, and does not match an IPv4 address', () => {
    const re = compile(libPattern('ipv6'));
    expect('2001:0db8:85a3:0000:0000:8a2e:0370:7334').toMatch(re);
    expect('loopback ::1 seen').toMatch(re);
    expect('192.168.1.1').not.toMatch(re);
  });

  it('windows-sid matches a domain-relative SID and rejects the wrong revision', () => {
    const re = compile(libPattern('windows-sid'));
    expect('owner S-1-5-21-3623811015-3361044348-30300820-1013').toMatch(re);
    expect('S-1-5-18').toMatch(re); // well-known Local System SID
    expect('S-2-5-21-3623811015-3361044348-30300820-1013').not.toMatch(re);
  });

  it('guid matches with and without braces, and rejects a too-short hex run', () => {
    const re = compile(libPattern('guid'));
    expect('4d36e965-e325-11ce-bfc1-08002be10318').toMatch(re);
    expect('{4d36e965-e325-11ce-bfc1-08002be10318}').toMatch(re);
    expect('not-a-guid-at-all').not.toMatch(re);
  });

  it('windows-path matches a backslash-separated path and rejects a Unix path', () => {
    const re = compile(libPattern('windows-path'));
    expect(String.raw`C:\Users\Administrator\AppData\Local\Temp\payload.exe`).toMatch(re);
    expect('/usr/bin/bash').not.toMatch(re);
  });

  it('registry-key matches the full hive name and the common abbreviation, and rejects a key with no hive', () => {
    const re = compile(libPattern('registry-key'));
    expect(String.raw`HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters`).toMatch(re);
    expect(String.raw`HKLM\Software\Microsoft\Windows\CurrentVersion\Run`).toMatch(re);
    expect(String.raw`SOFTWARE\Microsoft\Windows\CurrentVersion\Run`).not.toMatch(re);
  });

  it('base64 matches a substantial base64 run and rejects short plain text', () => {
    const re = compile(libPattern('base64'));
    expect('VGhpcyBpcyBhIGZha2UgQmFzZTY0IHN0cmluZyBmb3IgdGVzdGluZy4=').toMatch(re);
    expect('hello world').not.toMatch(re);
  });

  it('email matches a conventional address and rejects a bare hostname with no TLD', () => {
    const re = compile(libPattern('email'));
    expect('analyst@example.com').toMatch(re);
    expect('user@localhost').not.toMatch(re);
  });

  it('hex-hash matches an exact MD5/SHA1/SHA256 length and rejects an unrecognized length', () => {
    const re = compile(libPattern('hex-hash'));
    expect('d41d8cd98f00b204e9800998ecf8427e').toMatch(re); // 32 hex chars (MD5)
    expect('da39a3ee5e6b4b0d3255bfef95601890afd80709').toMatch(re); // 40 hex chars (SHA1)
    expect('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855').toMatch(re); // 64 hex chars (SHA256)
    expect('deadbeef00').not.toMatch(re); // 10 hex chars — no algorithm is this length
  });
});

describe('compileRegexSafely', () => {
  it('returns ok:true with a working RegExp for a valid pattern', () => {
    const result = compileRegexSafely('[a-z]+', 'gi');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.regex).toBeInstanceOf(RegExp);
      expect('HELLO').toMatch(result.regex);
    }
  });

  it('returns ok:false with a readable error for an unclosed group, never throwing', () => {
    expect(() => compileRegexSafely('(', 'g')).not.toThrow();
    const result = compileRegexSafely('(', 'g');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(typeof result.error).toBe('string');
      expect(result.error.length).toBeGreaterThan(0);
    }
  });

  it('returns ok:false for an invalid flag combination, never throwing', () => {
    expect(() => compileRegexSafely('abc', 'zz')).not.toThrow();
    const result = compileRegexSafely('abc', 'zz');
    expect(result.ok).toBe(false);
  });

  it('returns ok:false for an unescaped invalid quantifier target, never throwing', () => {
    const result = compileRegexSafely('*abc', 'g');
    expect(result.ok).toBe(false);
  });
});

describe('findAllMatches', () => {
  it('finds every match with the correct index, even for a non-global input regex', () => {
    const result = compileRegexSafely('\\d+', ''); // deliberately no 'g' flag
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const matches = findAllMatches(result.regex, 'port 443 and port 8080');
    expect(matches.map((m) => m.match)).toEqual(['443', '8080']);
    expect(matches[0].index).toBe(5);
    expect(matches[1].index).toBe(18);
  });

  it('does not mutate the caller-supplied RegExp object', () => {
    const result = compileRegexSafely('\\d+', '');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const original = result.regex;
    findAllMatches(original, '1 2 3');
    expect(original.global).toBe(false);
    expect(original.lastIndex).toBe(0);
  });

  it('reports unnamed capture groups by position with a null name', () => {
    const result = compileRegexSafely('(\\w+)@(\\w+)', 'g');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const matches = findAllMatches(result.regex, 'user@host');
    expect(matches).toHaveLength(1);
    expect(matches[0].groups).toEqual([
      { index: 1, name: null, value: 'user' },
      { index: 2, name: null, value: 'host' },
    ]);
  });

  it('reports named capture groups with their name alongside their position', () => {
    const result = compileRegexSafely('(?<user>\\w+)@(?<host>\\w+)', 'g');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const matches = findAllMatches(result.regex, 'user@host');
    expect(matches[0].groups).toEqual([
      { index: 1, name: 'user', value: 'user' },
      { index: 2, name: 'host', value: 'host' },
    ]);
  });

  it('does not count non-capturing groups or lookarounds as capture groups', () => {
    const result = compileRegexSafely('(?:foo)(bar)(?=baz)(?!qux)', 'g');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const matches = findAllMatches(result.regex, 'foobarbaz');
    expect(matches[0].groups).toEqual([{ index: 1, name: null, value: 'bar' }]);
  });

  it('returns an empty array for no matches', () => {
    const result = compileRegexSafely('xyz', 'g');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(findAllMatches(result.regex, 'nothing to see here')).toEqual([]);
  });

  it('does not loop forever on a zero-width match', () => {
    const result = compileRegexSafely('a*', 'g');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const matches = findAllMatches(result.regex, 'bbb');
    // 'a*' matches an empty string at every position in 'bbb' (4 positions).
    expect(matches.every((m) => m.match === '')).toBe(true);
    expect(matches.length).toBe(4);
  });
});
