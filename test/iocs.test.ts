import { describe, it, expect } from 'vitest';
import { extractIocs, defangValue, refangValue, containsDefanged, IOC_CATEGORIES } from '../src/utils/iocs';

describe('extractIocs', () => {
  it('extracts IPv4 addresses and ignores out-of-range octets', () => {
    const out = extractIocs('beaconed to 203.0.113.42 and 10.0.0.1, but 999.1.1.1 is not valid');
    expect(out.ipv4.sort()).toEqual(['10.0.0.1', '203.0.113.42']);
  });

  it('extracts IPv6 in full and compressed forms', () => {
    const out = extractIocs('full 2001:0db8:85a3:0000:0000:8a2e:0370:7334 loopback ::1 compressed fe80::1');
    expect(out.ipv6).toContain('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    expect(out.ipv6).toContain('::1');
    expect(out.ipv6).toContain('fe80::1');
  });

  it('extracts URLs', () => {
    const out = extractIocs('phished via http://evil-domain.example/login and https://second.example/a?b=1');
    expect(out.url).toEqual(['http://evil-domain.example/login', 'https://second.example/a?b=1']);
  });

  it('trims trailing sentence punctuation off a URL at the end of a sentence', () => {
    const out = extractIocs('The payload phoned home to http://evil.example/reset?token=abc123. Then it moved laterally.');
    expect(out.url).toEqual(['http://evil.example/reset?token=abc123']);
  });

  it('trims a URL wrapped in a parenthetical, not just sentence-final', () => {
    const out = extractIocs('(see http://evil.example/x, for details)');
    expect(out.url).toEqual(['http://evil.example/x']);
  });

  it('extracts domains (including ones embedded in a URL) and dedupes', () => {
    const out = extractIocs('C2 at evil-domain.example, also seen evil-domain.example again, and in http://evil-domain.example/x');
    expect(out.domain).toEqual(['evil-domain.example']);
  });

  it('extracts email addresses', () => {
    const out = extractIocs('phishing sender was attacker@evil-domain.example');
    expect(out.email).toEqual(['attacker@evil-domain.example']);
  });

  it('extracts hashes by exact length without cross-category contamination', () => {
    const md5 = 'd41d8cd98f00b204e9800998ecf8427e';
    const sha1 = 'da39a3ee5e6b4b0d3255bfef95601890afd80709';
    const sha256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    const sha512 =
      'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e';
    const out = extractIocs(`md5=${md5} sha1=${sha1} sha256=${sha256} sha512=${sha512}`);
    expect(out.md5).toEqual([md5]);
    expect(out.sha1).toEqual([sha1]);
    expect(out.sha256).toEqual([sha256]);
    expect(out.sha512).toEqual([sha512]);
  });

  it('does not let a longer hash bleed into a shorter hash category', () => {
    const sha256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    const out = extractIocs(`hash: ${sha256}`);
    expect(out.md5).toEqual([]);
    expect(out.sha1).toEqual([]);
    expect(out.sha256).toEqual([sha256]);
  });

  it('extracts CVE IDs case-insensitively', () => {
    const out = extractIocs('exploited via CVE-2021-44228 and cve-2017-0144');
    expect(out.cve).toEqual(['CVE-2021-44228', 'cve-2017-0144']);
  });

  it('extracts MITRE ATT&CK technique IDs including sub-techniques', () => {
    const out = extractIocs('mapped to T1055 and T1055.001, plus T1059');
    expect(out.attack.sort()).toEqual(['T1055', 'T1055.001', 'T1059']);
  });

  it('extracts Bitcoin addresses (legacy and bech32)', () => {
    const out = extractIocs(
      'ransom to 1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2 or bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
    );
    expect(out.btc).toContain('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2');
    expect(out.btc).toContain('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq');
  });

  it('returns an empty array per category for text with nothing to find', () => {
    const out = extractIocs('nothing indicator-shaped here');
    for (const cat of IOC_CATEGORIES) expect(out[cat.id]).toEqual([]);
  });

  it('every category id in IOC_CATEGORIES appears as a key in the result', () => {
    const out = extractIocs('');
    for (const cat of IOC_CATEGORIES) expect(Object.prototype.hasOwnProperty.call(out, cat.id)).toBe(true);
  });

  it('recognizes a defanged IPv4 address ([.]) and extracts it in live form', () => {
    const out = extractIocs('beaconed to 203[.]0[.]113[.]42');
    expect(out.ipv4).toEqual(['203.0.113.42']);
  });

  it('recognizes a defanged domain and URL (hxxp + [.]) in live form', () => {
    const out = extractIocs('phished via hxxp://evil-domain[.]example/login');
    expect(out.url).toEqual(['http://evil-domain.example/login']);
    expect(out.domain).toContain('evil-domain.example');
  });

  it('recognizes a defanged https URL, preserving the "s"', () => {
    const out = extractIocs('C2 at hxxps://evil[.]example/beacon');
    expect(out.url).toEqual(['https://evil.example/beacon']);
  });

  it('recognizes a defanged email address ([at] + [.])', () => {
    const out = extractIocs('sender was attacker[at]evil-domain[.]example');
    expect(out.email).toEqual(['attacker@evil-domain.example']);
  });

  it('recognizes a defanged IPv6 address ([:])', () => {
    const out = extractIocs('loopback [:][:]1 and fe80[:][:]1');
    expect(out.ipv6).toContain('::1');
    expect(out.ipv6).toContain('fe80::1');
  });

  it('recognizes (dot) and (at) parenthesized defanging too', () => {
    const out = extractIocs('contact attacker(at)evil-domain(dot)example');
    expect(out.email).toEqual(['attacker@evil-domain.example']);
  });

  it('handles text that mixes already-live and defanged indicators together', () => {
    const out = extractIocs('seen 203.0.113.42 and also 198[.]51[.]100[.]7');
    expect(out.ipv4.sort()).toEqual(['198.51.100.7', '203.0.113.42']);
  });

  it('does not double-count when the same IP appears in both live and defanged form', () => {
    const out = extractIocs('203.0.113.42 vs 203[.]0[.]113[.]42');
    expect(out.ipv4).toEqual(['203.0.113.42']);
  });
});

describe('containsDefanged', () => {
  it('detects bracketed-dot defanging', () => {
    expect(containsDefanged('203[.]0[.]113[.]42')).toBe(true);
  });

  it('detects hxxp defanging', () => {
    expect(containsDefanged('hxxp://evil.example')).toBe(true);
  });

  it('returns false for plain live text', () => {
    expect(containsDefanged('http://evil.example, 203.0.113.42')).toBe(false);
  });

  it('does not false-positive on ordinary prose containing the words "dot" or "at"', () => {
    expect(containsDefanged('meet me at the dot on the map')).toBe(false);
  });
});

describe('defangValue / refangValue', () => {
  it('defangs and refangs an IPv4 address', () => {
    const defanged = defangValue('203.0.113.42', 'ipv4');
    expect(defanged).toBe('203[.]0[.]113[.]42');
    expect(refangValue(defanged, 'ipv4')).toBe('203.0.113.42');
  });

  it('defangs and refangs a domain', () => {
    const defanged = defangValue('evil-domain.example', 'domain');
    expect(defanged).toBe('evil-domain[.]example');
    expect(refangValue(defanged, 'domain')).toBe('evil-domain.example');
  });

  it('defangs and refangs a URL, preserving http vs https', () => {
    const http = defangValue('http://evil.example/x', 'url');
    expect(http).toBe('hxxp://evil[.]example/x');
    expect(refangValue(http, 'url')).toBe('http://evil.example/x');

    const https = defangValue('https://evil.example/x', 'url');
    expect(https).toBe('hxxps://evil[.]example/x');
    expect(refangValue(https, 'url')).toBe('https://evil.example/x');
  });

  it('defangs and refangs an email address', () => {
    const defanged = defangValue('attacker@evil.example', 'email');
    expect(defanged).toBe('attacker[at]evil[.]example');
    expect(refangValue(defanged, 'email')).toBe('attacker@evil.example');
  });

  it('defangs and refangs an IPv6 address', () => {
    const defanged = defangValue('fe80::1', 'ipv6');
    expect(defanged).toBe('fe80[:][:]1');
    expect(refangValue(defanged, 'ipv6')).toBe('fe80::1');
  });

  it('leaves non-defangable categories (hashes, CVE, ATT&CK, BTC) unchanged', () => {
    const md5 = 'd41d8cd98f00b204e9800998ecf8427e';
    expect(defangValue(md5, 'md5')).toBe(md5);
    expect(defangValue('CVE-2021-44228', 'cve')).toBe('CVE-2021-44228');
    expect(defangValue('T1055.001', 'attack')).toBe('T1055.001');
  });
});
