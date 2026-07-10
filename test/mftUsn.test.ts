import { describe, it, expect } from 'vitest';
import {
  applyMftFixup,
  parseMftRecord,
  parseUsnRecord,
  hexToBytes,
  decodeFileReference,
  decodeUsnReason,
  MISMATCH_THRESHOLD_SECONDS,
} from '../src/utils/mftUsn';

// ---------------------------------------------------------------------------
// Hand-constructed minimal MFT FILE record / USN_RECORD_V2 byte buffers.
// Every offset below is computed against the real NTFS FILE_RECORD_HEADER /
// ATTRIBUTE_RECORD_HEADER / STANDARD_INFORMATION / FILE_NAME layouts (see
// src/utils/mftUsn.ts's own header comment) — nothing here is a captured
// real artifact, it's a synthetic fixture built byte-by-byte for the test.
// Same helper shape as test/pe.test.ts's binary fixtures.
// ---------------------------------------------------------------------------

function u8(view: DataView, off: number, v: number) {
  view.setUint8(off, v);
}
function u16(view: DataView, off: number, v: number) {
  view.setUint16(off, v, true);
}
function u32(view: DataView, off: number, v: number) {
  view.setUint32(off, v, true);
}
function u64(view: DataView, off: number, v: bigint) {
  view.setBigUint64(off, v, true);
}
function ascii(bytes: Uint8Array, off: number, s: string) {
  for (let i = 0; i < s.length; i++) bytes[off + i] = s.charCodeAt(i);
}
function utf16le(view: DataView, off: number, s: string) {
  for (let i = 0; i < s.length; i++) view.setUint16(off + i * 2, s.charCodeAt(i), true);
}

// ---------------------------------------------------------------------------
// MFT FILE record fixture
//
// Layout (1024-byte record, 2x512-byte sectors):
//   0x000  "FILE" magic + FILE_RECORD_HEADER (48 bytes)
//   0x030  Update Sequence Array: USN(2) + sector0 original(2) + sector1 original(2)
//   0x038  $STANDARD_INFORMATION (type 0x10), resident, 416 bytes total
//   0x1D8  $FILE_NAME (type 0x30), resident, 112 bytes total
//
// The $FILE_NAME "Created" FILETIME is DELIBERATELY placed so its last 2
// bytes land exactly on sector 0's last 2 bytes (offset 510-511) — the exact
// region the Update Sequence Array fixup overwrites on disk and must restore
// before any attribute is trusted. This is the single most important
// property this fixture exercises: parseMftRecord() must read the POST-fixup
// value there, never the raw on-disk marker bytes.
// ---------------------------------------------------------------------------

const SECTOR_SIZE = 512;
const RECORD_SIZE = 1024; // 2 sectors

const USA_OFFSET = 48;
const USA_ENTRY_COUNT = 3; // 1 USN + 2 sector originals (2 sectors)

const FIRST_ATTR_OFFSET = 56;

const SI_OFFSET = FIRST_ATTR_OFFSET; // 56
const SI_HEADER_SIZE = 24;
const SI_CONTENT_OFFSET = SI_OFFSET + SI_HEADER_SIZE; // 80
const SI_CONTENT_LEN = 392;
const SI_TOTAL_LEN = SI_HEADER_SIZE + SI_CONTENT_LEN; // 416

const FN_OFFSET = SI_OFFSET + SI_TOTAL_LEN; // 472
const FN_HEADER_SIZE = 24;
const FN_CONTENT_OFFSET = FN_OFFSET + FN_HEADER_SIZE; // 496 -> "created" @ +8 = 504..511
const FN_NAME = 'evil.exe'; // fabricated placeholder, not a captured artifact
const FN_CONTENT_LEN = 88; // 66 (fixed fields) + 16 (name bytes) + 6 padding
const FN_TOTAL_LEN = FN_HEADER_SIZE + FN_CONTENT_LEN; // 112

const USED_SIZE = FN_OFFSET + FN_TOTAL_LEN + 16; // 600 — a little slack past both attributes

// Sector 0's tail (offset 510-511) is exactly FN's "created" field's last 2
// bytes (504 + 8 - 2 = 510). On disk (pre-fixup) this holds the USN marker;
// after fixup it holds the real data restored from the Update Sequence Array.
const USN_MARKER = 0x0001;
const FN_CREATED_LOW48 = 0n; // bytes 504-509, shared by both raw and fixed views
const FN_CREATED_RAW_TOP16 = 0x0001; // == USN_MARKER: what's on disk before fixup
const FN_CREATED_FIXED_TOP16 = 0x0002; // what the USA restores it to
const FN_CREATED_RAW_TICKS = (BigInt(FN_CREATED_RAW_TOP16) << 48n) | FN_CREATED_LOW48;
const FN_CREATED_FIXED_TICKS = (BigInt(FN_CREATED_FIXED_TOP16) << 48n) | FN_CREATED_LOW48;

const SI_MODIFIED_BASE = 100_000_000_000_000n;
const SI_MFT_MODIFIED = 200_000_000_000_000n;
const SI_ACCESSED = 300_000_000_000_000n;

interface BuildOpts {
  /** Introduce a >2s gap between $SI and $FN "Modified" so the mismatch flag fires. */
  mismatchModified?: boolean;
  /** Flip sector 0's on-disk tail so it no longer matches the USN — fixup must fail. */
  corruptSector0?: boolean;
}

function buildMftRecord(opts: BuildOpts = {}): Uint8Array {
  const bytes = new Uint8Array(RECORD_SIZE);
  const view = new DataView(bytes.buffer);

  // --- FILE_RECORD_HEADER -----------------------------------------------
  ascii(bytes, 0, 'FILE');
  u16(view, 4, USA_OFFSET); // UpdateSequenceArrayOffset
  u16(view, 6, USA_ENTRY_COUNT); // UpdateSequenceArraySize
  u16(view, 16, 1); // SequenceNumber
  u16(view, 18, 1); // HardLinkCount
  u16(view, 20, FIRST_ATTR_OFFSET);
  u16(view, 22, 0x0001); // Flags: in-use, not a directory
  u32(view, 24, USED_SIZE);
  u32(view, 28, RECORD_SIZE); // AllocatedSize
  u64(view, 32, 0n); // BaseFileRecord (this is the base record)
  u32(view, 44, 42); // MFT record number

  // --- Update Sequence Array ----------------------------------------------
  u16(view, USA_OFFSET, USN_MARKER); // USN
  u16(view, USA_OFFSET + 2, FN_CREATED_FIXED_TOP16); // sector 0's real original bytes
  u16(view, USA_OFFSET + 4, 0x0003); // sector 1's real original bytes (unused by any field here)

  // Raw on-disk sector tails — MUST match the USN for a valid record. Sector
  // 0's tail (offset 510-511) is written here provisionally; it gets
  // overwritten again below by $FN's "Created" field, since that field's
  // last 2 bytes deliberately land on this exact same offset (see the
  // fixture's header comment) — so the REAL, final value is set last.
  u16(view, RECORD_SIZE - 2, USN_MARKER);

  // --- $STANDARD_INFORMATION (type 0x10), resident ------------------------
  u32(view, SI_OFFSET + 0, 0x10); // Type
  u32(view, SI_OFFSET + 4, SI_TOTAL_LEN); // Length
  u8(view, SI_OFFSET + 8, 0); // NonResident = false
  u8(view, SI_OFFSET + 9, 0); // NameLength
  u16(view, SI_OFFSET + 10, 0); // NameOffset
  u16(view, SI_OFFSET + 12, 0); // Flags
  u16(view, SI_OFFSET + 14, 0); // AttributeId
  u32(view, SI_OFFSET + 16, SI_CONTENT_LEN); // Resident ValueLength
  u16(view, SI_OFFSET + 20, SI_HEADER_SIZE); // Resident ValueOffset
  u8(view, SI_OFFSET + 22, 0); // IndexedFlag

  const siModified = opts.mismatchModified ? SI_MODIFIED_BASE + 30_000_000n : SI_MODIFIED_BASE; // +3s worth of 100ns ticks
  u64(view, SI_CONTENT_OFFSET + 0, FN_CREATED_FIXED_TICKS); // Created — matches $FN's post-fixup value
  u64(view, SI_CONTENT_OFFSET + 8, siModified); // Modified
  u64(view, SI_CONTENT_OFFSET + 16, SI_MFT_MODIFIED); // MFT Modified
  u64(view, SI_CONTENT_OFFSET + 24, SI_ACCESSED); // Accessed
  u32(view, SI_CONTENT_OFFSET + 32, 0x20); // FileAttributes (ARCHIVE)

  // --- $FILE_NAME (type 0x30), resident ------------------------------------
  u32(view, FN_OFFSET + 0, 0x30); // Type
  u32(view, FN_OFFSET + 4, FN_TOTAL_LEN); // Length
  u8(view, FN_OFFSET + 8, 0); // NonResident = false
  u8(view, FN_OFFSET + 9, 0); // NameLength
  u16(view, FN_OFFSET + 10, 0); // NameOffset
  u16(view, FN_OFFSET + 12, 0); // Flags
  u16(view, FN_OFFSET + 14, 0); // AttributeId
  u32(view, FN_OFFSET + 16, FN_CONTENT_LEN); // Resident ValueLength
  u16(view, FN_OFFSET + 20, FN_HEADER_SIZE); // Resident ValueOffset
  u8(view, FN_OFFSET + 22, 0); // IndexedFlag

  u64(view, FN_CONTENT_OFFSET + 0, 5n); // ParentDirectory (record #5, sequence 0)
  // "Created" is written as the RAW on-disk bytes here — the fixup must
  // transform this into FN_CREATED_FIXED_TICKS before parseMftRecord() ever
  // hands it to the caller.
  u64(view, FN_CONTENT_OFFSET + 8, FN_CREATED_RAW_TICKS);
  const fnModified = SI_MODIFIED_BASE; // $FN's own Modified never carries the mismatch — only $SI's does
  u64(view, FN_CONTENT_OFFSET + 16, fnModified);
  u64(view, FN_CONTENT_OFFSET + 24, SI_MFT_MODIFIED);
  u64(view, FN_CONTENT_OFFSET + 32, SI_ACCESSED);
  u64(view, FN_CONTENT_OFFSET + 40, 4096n); // AllocatedSize
  u64(view, FN_CONTENT_OFFSET + 48, 4096n); // RealSize
  u32(view, FN_CONTENT_OFFSET + 56, 0x20); // Flags (ARCHIVE)
  u8(view, FN_CONTENT_OFFSET + 64, FN_NAME.length); // name length, in CHARACTERS
  u8(view, FN_CONTENT_OFFSET + 65, 1); // namespace: Win32
  utf16le(view, FN_CONTENT_OFFSET + 66, FN_NAME);

  // Corrupt sector 0's tail LAST, after every other write — it must win over
  // $FN's "Created" field write above, which shares this same offset.
  if (opts.corruptSector0) u16(view, SECTOR_SIZE - 2, 0x9999);

  return bytes;
}

describe('applyMftFixup', () => {
  it('replaces each sector-tail marker with its Update Sequence Array original, never mutating the input', () => {
    const raw = buildMftRecord();
    const rawSector0Tail = new DataView(raw.buffer).getUint16(SECTOR_SIZE - 2, true);
    const result = applyMftFixup(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.usn).toBe(USN_MARKER);
    expect(result.sectorsChecked).toBe(2);

    const fixedView = new DataView(result.data.buffer);
    expect(fixedView.getUint16(SECTOR_SIZE - 2, true)).toBe(FN_CREATED_FIXED_TOP16);
    expect(fixedView.getUint16(RECORD_SIZE - 2, true)).toBe(0x0003);
    // The fixed-up value must differ from the raw on-disk marker — proves the
    // correction actually changed something, not a no-op.
    expect(fixedView.getUint16(SECTOR_SIZE - 2, true)).not.toBe(rawSector0Tail);
    // Input buffer is untouched.
    expect(new DataView(raw.buffer).getUint16(SECTOR_SIZE - 2, true)).toBe(rawSector0Tail);
  });

  it('fails when a sector tail does not match the Update Sequence Number (torn write)', () => {
    const corrupt = buildMftRecord({ corruptSector0: true });
    const result = applyMftFixup(corrupt);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/fixup check failed/i);
    expect(result.error).toMatch(/sector 1 of 2/i);
  });

  it('fails cleanly on a buffer too short to hold a USA header', () => {
    const result = applyMftFixup(new Uint8Array(4));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/too short/i);
  });
});

describe('parseMftRecord', () => {
  it('rejects a buffer too short to contain a record header', () => {
    const result = parseMftRecord(new Uint8Array(10));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/too short/i);
  });

  it('gives a specific "BAAD" message distinct from a generic bad-magic error', () => {
    const bytes = new Uint8Array(RECORD_SIZE);
    ascii(bytes, 0, 'BAAD');
    const result = parseMftRecord(bytes);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/BAAD/);
    expect(result.error).toMatch(/corrupt|unrepaired/i);
  });

  it('rejects an arbitrary bad magic with the found bytes shown, distinct from the BAAD case', () => {
    const bytes = new Uint8Array(RECORD_SIZE);
    ascii(bytes, 0, 'XXXX');
    const result = parseMftRecord(bytes);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/"FILE"/);
    expect(result.error).toMatch(/XXXX/);
  });

  it('propagates a fixup failure as the top-level parse error, never reads attribute data from an unrepaired record', () => {
    const corrupt = buildMftRecord({ corruptSector0: true });
    const result = parseMftRecord(corrupt);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/fixup check failed/i);
  });

  it('parses $SI and $FN using the POST-fixup bytes, and reports no timestomping when they agree', () => {
    const bytes = buildMftRecord();
    const result = parseMftRecord(bytes);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { record } = result;

    expect(record.header.signature).toBe('FILE');
    expect(record.header.inUse).toBe(true);
    expect(record.header.isDirectory).toBe(false);
    expect(record.header.mftRecordNumber).toBe(42);
    expect(record.fixup.usn).toBe(USN_MARKER);
    expect(record.fixup.sectorsChecked).toBe(2);

    expect(record.standardInformation).not.toBeNull();
    expect(record.fileName).not.toBeNull();
    expect(record.fileName?.fileName).toBe(FN_NAME);
    expect(record.fileName?.namespaceLabel).toBe('Win32');

    // The headline assertion: $FILE_NAME's "Created" ticks must reflect the
    // FIXED-UP value, never the raw on-disk marker bytes that were actually
    // stored at that offset before the Update Sequence Array correction.
    expect(record.fileName?.created.ticks).toBe(FN_CREATED_FIXED_TICKS);
    expect(record.fileName?.created.ticks).not.toBe(FN_CREATED_RAW_TICKS);
    expect(record.standardInformation?.created.ticks).toBe(FN_CREATED_FIXED_TICKS);

    expect(record.comparisons).toHaveLength(4);
    expect(record.timestompDetected).toBe(false);
    for (const cmp of record.comparisons) {
      expect(cmp.mismatch).toBe(false);
      expect(cmp.deltaSeconds).toBe(0);
    }
  });

  it('flags a $SI/$FN Modified-time mismatch above the threshold as timestomping, and only that field', () => {
    const bytes = buildMftRecord({ mismatchModified: true });
    const result = parseMftRecord(bytes);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { record } = result;

    expect(record.timestompDetected).toBe(true);
    const byField = Object.fromEntries(record.comparisons.map((c) => [c.field, c]));
    expect(byField.modified.mismatch).toBe(true);
    expect(byField.modified.deltaSeconds).not.toBeNull();
    expect(byField.modified.deltaSeconds as number).toBeGreaterThan(MISMATCH_THRESHOLD_SECONDS);
    expect(byField.created.mismatch).toBe(false);
    expect(byField.mftModified.mismatch).toBe(false);
    expect(byField.accessed.mismatch).toBe(false);
  });
});

describe('decodeFileReference', () => {
  it('splits the low 48 bits (record number) from the high 16 bits (sequence number)', () => {
    const raw = 1000n | (7n << 48n);
    const ref = decodeFileReference(raw);
    expect(ref.recordNumber).toBe(1000n);
    expect(ref.sequenceNumber).toBe(7);
  });
});

describe('hexToBytes', () => {
  it('accepts spaces, "0x" prefixes, commas, and newlines', () => {
    const bytes = hexToBytes('0x46 49,4C\n45');
    expect(bytes).not.toBeNull();
    expect(Array.from(bytes!)).toEqual([0x46, 0x49, 0x4c, 0x45]);
  });

  it('rejects an odd number of hex digits', () => {
    expect(hexToBytes('abc')).toBeNull();
  });

  it('rejects non-hex characters', () => {
    expect(hexToBytes('zz11')).toBeNull();
  });

  it('rejects empty input', () => {
    expect(hexToBytes('   ')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// USN_RECORD_V2 fixture
// ---------------------------------------------------------------------------

const USN_HEADER_SIZE = 60;
const USN_NAME = 'sample.dll'; // fabricated placeholder, 10 chars / 20 UTF-16LE bytes

function buildUsnRecord(): Uint8Array {
  const nameBytes = USN_NAME.length * 2;
  const total = USN_HEADER_SIZE + nameBytes;
  const bytes = new Uint8Array(total);
  const view = new DataView(bytes.buffer);

  u32(view, 0, total); // RecordLength
  u16(view, 4, 2); // MajorVersion
  u16(view, 6, 0); // MinorVersion
  u64(view, 8, 1000n | (7n << 48n)); // FileReferenceNumber: record #1000, sequence 7
  u64(view, 16, 5n | (2n << 48n)); // ParentFileReferenceNumber: record #5, sequence 2
  view.setBigInt64(24, 123456789n, true); // Usn
  view.setBigInt64(32, 133_000_000_000_000_000n, true); // TimeStamp (FILETIME)
  u32(view, 40, 0x00000100 | 0x00008000); // Reason: FILE_CREATE | BASIC_INFO_CHANGE
  u32(view, 44, 0); // SourceInfo
  u32(view, 48, 0); // SecurityId
  u32(view, 52, 0x20); // FileAttributes (ARCHIVE)
  u16(view, 56, nameBytes); // FileNameLength — BYTES, not characters
  u16(view, 58, USN_HEADER_SIZE); // FileNameOffset
  utf16le(view, USN_HEADER_SIZE, USN_NAME);

  return bytes;
}

describe('decodeUsnReason', () => {
  it('decodes a combined bitmask into exactly its set flags, nothing else', () => {
    const flags = decodeUsnReason(0x00000100 | 0x00008000);
    const names = flags.map((f) => f.name);
    expect(names).toContain('FILE_CREATE');
    expect(names).toContain('BASIC_INFO_CHANGE');
    expect(flags).toHaveLength(2);
  });

  it('returns an empty array when no flags are set', () => {
    expect(decodeUsnReason(0)).toEqual([]);
  });

  it('still decodes the top bit (0x80000000) despite JS bitwise ops being signed 32-bit', () => {
    const flags = decodeUsnReason(0x80000000);
    expect(flags.map((f) => f.name)).toEqual(['CLOSE']);
  });
});

describe('parseUsnRecord', () => {
  it('rejects a buffer too short for the fixed USN_RECORD_V2 header', () => {
    const result = parseUsnRecord(new Uint8Array(10));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/too short/i);
  });

  it('rejects a MajorVersion other than 2', () => {
    const bytes = buildUsnRecord();
    new DataView(bytes.buffer).setUint16(4, 3, true); // MajorVersion = 3
    const result = parseUsnRecord(bytes);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/MajorVersion/);
    expect(result.error).toMatch(/V3\/V4/);
  });

  it('parses every fixed field correctly, decoding FileReferenceNumber/ParentFileReferenceNumber', () => {
    const bytes = buildUsnRecord();
    const result = parseUsnRecord(bytes);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { record } = result;

    expect(record.majorVersion).toBe(2);
    expect(record.minorVersion).toBe(0);
    expect(record.fileReferenceNumber.recordNumber).toBe(1000n);
    expect(record.fileReferenceNumber.sequenceNumber).toBe(7);
    expect(record.parentFileReferenceNumber.recordNumber).toBe(5n);
    expect(record.parentFileReferenceNumber.sequenceNumber).toBe(2);
    expect(record.usn).toBe(123456789n);
    expect(record.timeStamp.ticks).toBe(133_000_000_000_000_000n);
    expect(record.sourceInfo).toBe(0);
    expect(record.securityId).toBe(0);
    expect(record.fileAttributes).toBe(0x20);
  });

  it('decodes FileName using FileNameLength as a BYTE count, not a character count', () => {
    const bytes = buildUsnRecord();
    const result = parseUsnRecord(bytes);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // FileNameLength was written as 20 (bytes) for a 10-character name — if
    // the parser mistakenly treated it as a character count it would either
    // overrun the buffer or read twice as many UTF-16 code units.
    expect(result.record.fileName).toBe(USN_NAME);
    expect(result.record.fileName).toHaveLength(10);
  });

  it('decodes the combined Reason bitmask on a real record', () => {
    const bytes = buildUsnRecord();
    const result = parseUsnRecord(bytes);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const names = result.record.reasonFlags.map((f) => f.name);
    expect(names).toContain('FILE_CREATE');
    expect(names).toContain('BASIC_INFO_CHANGE');
    expect(result.record.reasonFlags).toHaveLength(2);
  });

  it('rejects a FileName that would extend past the end of the buffer', () => {
    const bytes = buildUsnRecord();
    new DataView(bytes.buffer).setUint16(56, 5000, true); // FileNameLength way past the buffer
    const result = parseUsnRecord(bytes);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/extends past the end/i);
  });
});
