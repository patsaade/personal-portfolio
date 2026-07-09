// Hashing utilities for the Hash Calculator & Verifier tool. Every digest here
// runs entirely client-side: the SHA family via the browser's native Web
// Crypto API (crypto.subtle.digest), and MD5 via a from-scratch RFC 1321
// implementation since Web Crypto doesn't expose it (deprecated for security
// use, but still ubiquitous in DFIR for file-identity/triage checks). Nothing
// hashed here is ever transmitted anywhere — see test/hashes.test.ts for the
// MD5 implementation's verification against the RFC's own test vectors.

export type HashAlgorithm = 'md5' | 'sha1' | 'sha256' | 'sha384' | 'sha512';

export const HASH_ALGORITHMS: { id: HashAlgorithm; label: string; bits: number; hexLength: number }[] = [
  { id: 'md5', label: 'MD5', bits: 128, hexLength: 32 },
  { id: 'sha1', label: 'SHA-1', bits: 160, hexLength: 40 },
  { id: 'sha256', label: 'SHA-256', bits: 256, hexLength: 64 },
  { id: 'sha384', label: 'SHA-384', bits: 384, hexLength: 96 },
  { id: 'sha512', label: 'SHA-512', bits: 512, hexLength: 128 },
];

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

const MD5_K = [
  0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501, 0x698098d8,
  0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821, 0xf61e2562, 0xc040b340,
  0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8, 0x21e1cde6, 0xc33707d6, 0xf4d50d87,
  0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a, 0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
  0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70, 0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039,
  0xe6db99e5, 0x1fa27cf8, 0xc4ac5665, 0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92,
  0xffeff47d, 0x85845dd1, 0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb,
  0xeb86d391,
];
const MD5_S = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15,
  21,
];

function rotl32(x: number, c: number): number {
  return ((x << c) | (x >>> (32 - c))) >>> 0;
}

/** From-scratch MD5 (RFC 1321). Operates on the raw bytes given — the caller
 *  is responsible for encoding text to bytes (see hashText/hashBuffer below). */
export function md5Hex(data: Uint8Array): string {
  const bitLen = BigInt(data.length) * 8n;
  // Smallest multiple of 64 that leaves room for the 0x80 byte + 8-byte length.
  const paddedLen = ((data.length + 8) >> 6 << 6) + 64;
  const buf = new Uint8Array(paddedLen);
  buf.set(data);
  buf[data.length] = 0x80;
  const view = new DataView(buf.buffer);
  view.setUint32(paddedLen - 8, Number(bitLen & 0xffffffffn), true);
  view.setUint32(paddedLen - 4, Number((bitLen >> 32n) & 0xffffffffn), true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  const M = new Uint32Array(16);
  for (let chunkStart = 0; chunkStart < paddedLen; chunkStart += 64) {
    for (let j = 0; j < 16; j++) M[j] = view.getUint32(chunkStart + j * 4, true);

    let A = a0;
    let B = b0;
    let C = c0;
    let D = d0;
    for (let i = 0; i < 64; i++) {
      let F: number;
      let g: number;
      if (i < 16) {
        F = (B & C) | (~B & D);
        g = i;
      } else if (i < 32) {
        F = (D & B) | (~D & C);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        F = B ^ C ^ D;
        g = (3 * i + 5) % 16;
      } else {
        F = C ^ (B | ~D);
        g = (7 * i) % 16;
      }
      F = (F + A + MD5_K[i] + M[g]) >>> 0;
      A = D;
      D = C;
      C = B;
      B = (B + rotl32(F, MD5_S[i])) >>> 0;
    }
    a0 = (a0 + A) >>> 0;
    b0 = (b0 + B) >>> 0;
    c0 = (c0 + C) >>> 0;
    d0 = (d0 + D) >>> 0;
  }

  const out = new Uint8Array(16);
  const outView = new DataView(out.buffer);
  outView.setUint32(0, a0, true);
  outView.setUint32(4, b0, true);
  outView.setUint32(8, c0, true);
  outView.setUint32(12, d0, true);
  return toHex(out);
}

// The Web Crypto algorithm name for each SHA-family entry is exactly its
// HASH_ALGORITHMS label ('SHA-1', 'SHA-256', ...) — derive it from that single
// source instead of hand-maintaining a second, easy-to-drift copy of the same
// four strings.
const SUBTLE_NAME = Object.fromEntries(
  HASH_ALGORITHMS.filter((a) => a.id !== 'md5').map((a) => [a.id, a.label]),
) as Record<Exclude<HashAlgorithm, 'md5'>, string>;

/** Digest raw bytes with one algorithm — MD5 runs synchronously in-process;
 *  the SHA family goes through the native (async) Web Crypto API. */
export async function digestHex(algorithm: HashAlgorithm, data: Uint8Array): Promise<string> {
  if (algorithm === 'md5') return md5Hex(data);
  // Cast needed: TS's DOM lib types BufferSource against a plain ArrayBuffer,
  // but Uint8Array is generic over ArrayBufferLike (which also covers
  // SharedArrayBuffer) — a type-level mismatch only, not a runtime one.
  const buf = await crypto.subtle.digest(SUBTLE_NAME[algorithm], data as BufferSource);
  return toHex(new Uint8Array(buf));
}

/** Digest the same bytes with every supported algorithm at once. */
export async function computeAllHashes(data: Uint8Array): Promise<Record<HashAlgorithm, string>> {
  const entries = await Promise.all(HASH_ALGORITHMS.map(async (a) => [a.id, await digestHex(a.id, data)] as const));
  return Object.fromEntries(entries) as Record<HashAlgorithm, string>;
}

export interface HashCandidate {
  algorithm: string;
  confidence: 'high' | 'medium' | 'low';
  note: string;
}

const PREFIXED_FORMATS: { re: RegExp; algorithm: string; note: string }[] = [
  {
    re: /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/,
    algorithm: 'bcrypt',
    note: 'Modular crypt format ($2a$/$2b$/$2y$) — a salted, adaptive password hash, not a raw digest.',
  },
  {
    re: /^\$6\$/,
    algorithm: 'SHA-512 crypt (Unix /etc/shadow)',
    note: 'Modular crypt format ($6$) used in Linux/BSD shadow password files.',
  },
  {
    re: /^\$5\$/,
    algorithm: 'SHA-256 crypt (Unix /etc/shadow)',
    note: 'Modular crypt format ($5$) used in Linux/BSD shadow password files.',
  },
  {
    re: /^\$1\$/,
    algorithm: 'MD5 crypt (Unix /etc/shadow, legacy)',
    note: 'Modular crypt format ($1$) — legacy and considered weak; superseded by $5$/$6$.',
  },
  {
    re: /^\{SHA\}[A-Za-z0-9+/]{27}=$/,
    algorithm: 'SHA-1 (LDAP {SHA} base64)',
    note: 'LDAP userPassword format — a base64-encoded raw SHA-1 digest, unsalted.',
  },
];

// Common hash lengths that collide across multiple real-world algorithms —
// every candidate below is genuinely producible at that exact hex length, so
// format/length alone cannot fully disambiguate them. "high" is reserved for
// either a distinctive format or overwhelming real-world prevalence at that
// length; "medium" marks a genuine, common two-way tie (MD5 vs NTLM turn up
// with similar frequency in Windows/AD DFIR work); "low" marks a
// technically-possible but rare/legacy alternative.
const BY_HEX_LENGTH: Record<number, HashCandidate[]> = {
  8: [
    {
      algorithm: 'CRC32',
      confidence: 'low',
      note: '32-bit — consistent with a CRC32 checksum, but 8 hex characters is short enough to also just be a truncated ID or unrelated string.',
    },
  ],
  32: [
    {
      algorithm: 'MD5',
      confidence: 'medium',
      note: '128-bit — the most common source of a bare 32-hex-char digest.',
    },
    {
      algorithm: 'NTLM',
      confidence: 'medium',
      note: 'Windows NTLM password hashes are also 128-bit/32 hex chars — identical format to MD5, genuinely indistinguishable without knowing where the value came from (e.g. a SAM/NTDS dump vs. a file hash).',
    },
    {
      algorithm: 'LM hash (legacy)',
      confidence: 'low',
      note: 'Legacy Windows LAN Manager hash — same length/format, now rare outside old dumps.',
    },
  ],
  40: [
    { algorithm: 'SHA-1', confidence: 'high', note: '160-bit — overwhelmingly the most common source of a 40-hex-char digest.' },
    {
      algorithm: 'RIPEMD-160',
      confidence: 'low',
      note: 'Also 160-bit/40 hex chars — same format, much less commonly encountered in DFIR contexts than SHA-1.',
    },
  ],
  56: [{ algorithm: 'SHA-224', confidence: 'high', note: '224-bit — no commonly-encountered algorithm shares this exact length.' }],
  64: [
    { algorithm: 'SHA-256', confidence: 'high', note: '256-bit — overwhelmingly the most common source of a 64-hex-char digest.' },
    { algorithm: 'SHA3-256', confidence: 'low', note: 'Same length/format as SHA-256, far less commonly seen in practice.' },
    { algorithm: 'BLAKE2s-256', confidence: 'low', note: 'Same length/format as SHA-256, far less commonly seen in practice.' },
  ],
  96: [{ algorithm: 'SHA-384', confidence: 'high', note: '384-bit — no commonly-encountered algorithm shares this exact length.' }],
  128: [
    { algorithm: 'SHA-512', confidence: 'high', note: '512-bit — overwhelmingly the most common source of a 128-hex-char digest.' },
    { algorithm: 'SHA3-512', confidence: 'low', note: 'Same length/format as SHA-512, far less commonly seen in practice.' },
    { algorithm: 'BLAKE2b-512', confidence: 'low', note: 'Same length/format as SHA-512, far less commonly seen in practice.' },
    { algorithm: 'Whirlpool', confidence: 'low', note: 'Same length/format as SHA-512, rarely encountered outside legacy systems.' },
  ],
};

/** Best-effort identification of an unknown hash string's likely algorithm(s)
 *  from its format/length alone — genuinely ambiguous in several cases (a
 *  32-hex-char string is equally consistent with MD5 or an NTLM hash), so
 *  every candidate carries an explicit confidence level and a plain-language
 *  reason instead of a single false-certain guess. Returns [] for input that
 *  matches no known hash shape at all. */
export function identifyHash(raw: string): HashCandidate[] {
  const s = raw.trim();
  if (!s) return [];

  for (const p of PREFIXED_FORMATS) {
    if (p.re.test(s)) return [{ algorithm: p.algorithm, confidence: 'high', note: p.note }];
  }

  if (!/^[0-9a-fA-F]+$/.test(s)) return [];
  return (
    BY_HEX_LENGTH[s.length] ?? [
      { algorithm: 'Unrecognized length', confidence: 'low', note: `${s.length} hex characters doesn't match a common hash length.` },
    ]
  );
}
