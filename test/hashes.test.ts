import { describe, it, expect } from 'vitest';
import { md5Hex, digestHex, computeAllHashes, identifyHash, HASH_ALGORITHMS } from '../src/utils/hashes';

const enc = (s: string) => new TextEncoder().encode(s);

describe('md5Hex', () => {
  // RFC 1321 ("The MD5 Message-Digest Algorithm"), Section A.5 test suite —
  // the standard's own reference vectors.
  it('matches every RFC 1321 test vector', () => {
    const vectors: [string, string][] = [
      ['', 'd41d8cd98f00b204e9800998ecf8427e'],
      ['a', '0cc175b9c0f1b6a831c399e269772661'],
      ['abc', '900150983cd24fb0d6963f7d28e17f72'],
      ['message digest', 'f96b697d7cb7938d525a2f31aaf161d0'],
      ['abcdefghijklmnopqrstuvwxyz', 'c3fcd3d76192e4007dfb496cca67e13b'],
      ['ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 'd174ab98d277d9f5a5611c2c9f419d9f'],
    ];
    for (const [input, expected] of vectors) {
      expect(md5Hex(enc(input))).toBe(expected);
    }
  });

  it('handles a message long enough to require padding into a second 64-byte block', () => {
    // 56-byte input: content + the 0x80 padding byte alone already exceeds the
    // 56-byte threshold within a single block, forcing a second block — the
    // classic MD5 padding edge case.
    const input = 'x'.repeat(56);
    // Cross-checked independently via Node's own crypto module at authoring time.
    const md5 = require('node:crypto').createHash('md5').update(input).digest('hex');
    expect(md5Hex(enc(input))).toBe(md5);
  });

  it('handles a message that is an exact multiple of the 64-byte block size', () => {
    const input = 'y'.repeat(128);
    const md5 = require('node:crypto').createHash('md5').update(input).digest('hex');
    expect(md5Hex(enc(input))).toBe(md5);
  });
});

describe('digestHex / computeAllHashes', () => {
  it('SHA family digests match Node\'s own crypto module for the same input', async () => {
    const input = 'The quick brown fox jumps over the lazy dog';
    const data = enc(input);
    const nodeCrypto = require('node:crypto');
    for (const algo of ['sha1', 'sha256', 'sha384', 'sha512'] as const) {
      const nodeName = { sha1: 'sha1', sha256: 'sha256', sha384: 'sha384', sha512: 'sha512' }[algo];
      const expected = nodeCrypto.createHash(nodeName).update(input).digest('hex');
      expect(await digestHex(algo, data)).toBe(expected);
    }
  });

  it('computeAllHashes returns all 5 algorithms, each the correct hex length', async () => {
    const out = await computeAllHashes(enc('hello world'));
    for (const a of HASH_ALGORITHMS) {
      expect(out[a.id]).toHaveLength(a.hexLength);
      expect(out[a.id]).toMatch(/^[0-9a-f]+$/);
    }
  });

  it('empty input produces the well-known empty-string digests', async () => {
    const out = await computeAllHashes(enc(''));
    expect(out.md5).toBe('d41d8cd98f00b204e9800998ecf8427e');
    expect(out.sha1).toBe('da39a3ee5e6b4b0d3255bfef95601890afd80709');
    expect(out.sha256).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });
});

describe('identifyHash', () => {
  it('returns nothing for empty or non-hash-shaped input', () => {
    expect(identifyHash('')).toEqual([]);
    expect(identifyHash('   ')).toEqual([]);
    expect(identifyHash('not a hash at all')).toEqual([]);
  });

  it('identifies a 32-hex-char string as ambiguous between MD5 and NTLM, both medium confidence', () => {
    const out = identifyHash('d41d8cd98f00b204e9800998ecf8427e');
    const algos = out.map((c) => c.algorithm);
    expect(algos).toContain('MD5');
    expect(algos).toContain('NTLM');
    expect(out.find((c) => c.algorithm === 'MD5')?.confidence).toBe('medium');
    expect(out.find((c) => c.algorithm === 'NTLM')?.confidence).toBe('medium');
  });

  it('identifies a 40-hex-char string as SHA-1 with high confidence', () => {
    const out = identifyHash('da39a3ee5e6b4b0d3255bfef95601890afd80709');
    expect(out[0]).toMatchObject({ algorithm: 'SHA-1', confidence: 'high' });
  });

  it('identifies a 64-hex-char string as SHA-256 (high) with SHA3-256/BLAKE2s-256 as low-confidence alternatives', () => {
    const out = identifyHash('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(out.find((c) => c.algorithm === 'SHA-256')?.confidence).toBe('high');
    expect(out.some((c) => c.algorithm === 'SHA3-256' && c.confidence === 'low')).toBe(true);
  });

  it('identifies a 128-hex-char string as SHA-512 with high confidence', () => {
    const sha512Empty =
      'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e';
    const out = identifyHash(sha512Empty);
    expect(out[0]).toMatchObject({ algorithm: 'SHA-512', confidence: 'high' });
  });

  it('recognizes bcrypt by its distinctive $2b$ prefix at high confidence, not by length', () => {
    const out = identifyHash('$2b$12$KIXQ6b7GRAo1z2s3z9F2XeYQhF5m8Y3s0m0m0m0m0m0m0m0m0m0m0');
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ algorithm: 'bcrypt', confidence: 'high' });
  });

  it('recognizes a Linux shadow SHA-512 crypt by its $6$ prefix', () => {
    expect(identifyHash('$6$somesalt$abcdefghijklmnop')[0]).toMatchObject({ confidence: 'high' });
  });

  it('flags an unrecognized hex length as low confidence rather than guessing an algorithm', () => {
    const out = identifyHash('deadbeef00');
    expect(out[0].confidence).toBe('low');
    expect(out[0].algorithm).toBe('Unrecognized length');
  });

  it('trims surrounding whitespace before identifying', () => {
    expect(identifyHash('  da39a3ee5e6b4b0d3255bfef95601890afd80709  ')[0].algorithm).toBe('SHA-1');
  });
});
