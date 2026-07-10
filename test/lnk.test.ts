import { describe, it, expect } from 'vitest';
import { parseLnk } from '../src/utils/lnk';

// {00021401-0000-0000-C000-000000000046} (CLSID_ShellLink) as its fixed
// 16-byte on-disk GUID layout — see src/utils/lnk.ts's own SHELL_LINK_CLSID.
const VALID_CLSID = [0x01, 0x14, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0xc0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x46];

const FLAG = {
  HasLinkTargetIDList: 0x00000001,
  HasLinkInfo: 0x00000002,
  HasName: 0x00000004,
  HasRelativePath: 0x00000008,
  HasWorkingDir: 0x00000010,
  HasArguments: 0x00000020,
  HasIconLocation: 0x00000040,
  IsUnicode: 0x00000080,
};

interface HeaderOpts {
  headerSize?: number;
  clsid?: number[];
  linkFlags?: number;
  fileAttributes?: number;
  creationTime?: bigint;
  accessTime?: bigint;
  writeTime?: bigint;
  fileSize?: number;
  iconIndex?: number;
  showCommand?: number;
  hotKey?: number;
}

/** Hand-build a valid 76-byte ShellLinkHeader per [MS-SHLLINK] §2.1, with
 *  every field independently overridable for the malformed-input cases. */
function buildHeader(opts: HeaderOpts = {}): Uint8Array {
  const buf = new Uint8Array(76);
  const view = new DataView(buf.buffer);
  view.setUint32(0, opts.headerSize ?? 0x0000004c, true);
  buf.set(opts.clsid ?? VALID_CLSID, 4);
  view.setUint32(20, opts.linkFlags ?? 0, true);
  view.setUint32(24, opts.fileAttributes ?? 0, true);
  view.setBigUint64(28, opts.creationTime ?? 0n, true);
  view.setBigUint64(36, opts.accessTime ?? 0n, true);
  view.setBigUint64(44, opts.writeTime ?? 0n, true);
  view.setUint32(52, opts.fileSize ?? 0, true);
  view.setInt32(56, opts.iconIndex ?? 0, true);
  view.setUint32(60, opts.showCommand ?? 1, true);
  view.setUint16(64, opts.hotKey ?? 0, true);
  // bytes 66-75: Reserved1 (2) + Reserved2 (4) + Reserved3 (4), left as 0.
  return buf;
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

/** Build one StringData field: a 2-byte CHARACTER-count prefix followed by
 *  the string's raw bytes — Unicode (UTF-16LE, byteLen = count*2) or ANSI
 *  (Latin-1-safe, byteLen = count). */
function buildStringDataField(text: string, unicode: boolean): Uint8Array {
  if (unicode) {
    const charBytes = new Uint8Array(text.length * 2);
    const view = new DataView(charBytes.buffer);
    for (let i = 0; i < text.length; i++) view.setUint16(i * 2, text.charCodeAt(i), true);
    const out = new Uint8Array(2 + charBytes.length);
    new DataView(out.buffer).setUint16(0, text.length, true);
    out.set(charBytes, 2);
    return out;
  }
  const out = new Uint8Array(2 + text.length);
  new DataView(out.buffer).setUint16(0, text.length, true);
  for (let i = 0; i < text.length; i++) out[2 + i] = text.charCodeAt(i);
  return out;
}

/** Build a LinkTargetIDList section: IDListSize (u16) + one ItemID
 *  (ItemIDSize u16 including the size field itself, then its data) + the
 *  2-byte 0x0000 terminal ID. */
function buildTargetIdList(itemData: Uint8Array): Uint8Array {
  const itemSize = 2 + itemData.length;
  const item = new Uint8Array(itemSize);
  new DataView(item.buffer).setUint16(0, itemSize, true);
  item.set(itemData, 2);
  const terminator = new Uint8Array([0x00, 0x00]);
  const body = concat(item, terminator);
  const out = new Uint8Array(2 + body.length);
  new DataView(out.buffer).setUint16(0, body.length, true);
  out.set(body, 2);
  return out;
}

describe('parseLnk — ShellLinkHeader validation', () => {
  it('accepts the simplest valid LNK: a correct 76-byte header, LinkFlags=0, no optional sections', () => {
    const result = parseLnk(buildHeader());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.header.headerSize).toBe(0x4c);
    expect(result.data.header.linkFlagNames).toEqual([]);
    expect(result.data.header.fileAttributeNames).toEqual([]);
    expect(result.data.targetIdList).toBeNull();
    expect(result.data.linkInfo).toBeNull();
    expect(result.data.strings).toEqual({
      description: null,
      relativePath: null,
      workingDir: null,
      commandLineArguments: null,
      iconLocation: null,
    });
  });

  it('rejects a wrong HeaderSize with a specific, friendly error (not a generic throw)', () => {
    const result = parseLnk(buildHeader({ headerSize: 0x50 }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/HeaderSize/);
    expect(result.error).toMatch(/0x00000050/i);
    expect(result.error).toMatch(/0x0000004C/i);
  });

  it('rejects a wrong LinkCLSID with a specific, friendly error (not a generic throw)', () => {
    const badClsid = [...VALID_CLSID];
    badClsid[15] = 0x00; // corrupt the last byte
    const result = parseLnk(buildHeader({ clsid: badClsid }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/LinkCLSID/);
    expect(result.error).toMatch(/00021401-0000-0000-C000-000000000046/i);
  });

  it('rejects a file smaller than the 76-byte header', () => {
    const result = parseLnk(new Uint8Array(10));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/76-byte header/);
  });

  it('decodes FileAttributes bitmask into readable names', () => {
    const result = parseLnk(buildHeader({ fileAttributes: 0x00000001 | 0x00000010 })); // READONLY | DIRECTORY
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.header.fileAttributeNames).toEqual(['FILE_ATTRIBUTE_READONLY', 'FILE_ATTRIBUTE_DIRECTORY']);
  });

  it('decodes ShowCommand for all three known values and labels an unknown value explicitly', () => {
    const normal = parseLnk(buildHeader({ showCommand: 1 }));
    expect(normal.ok && normal.data.header.showCommandLabel).toBe('SW_SHOWNORMAL');
    const max = parseLnk(buildHeader({ showCommand: 3 }));
    expect(max.ok && max.data.header.showCommandLabel).toBe('SW_SHOWMAXIMIZED');
    const min = parseLnk(buildHeader({ showCommand: 7 }));
    expect(min.ok && min.data.header.showCommandLabel).toBe('SW_SHOWMINNOACTIVE');
    const unknown = parseLnk(buildHeader({ showCommand: 42 }));
    expect(unknown.ok && unknown.data.header.showCommandLabel).toMatch(/Unrecognized/);
  });

  it('decodes a HotKey with modifiers', () => {
    // Ctrl+Alt+F1: modifier byte = HOTKEYF_CONTROL(0x2)|HOTKEYF_ALT(0x4) = 0x06, vk = 0x70 (F1)
    const raw = (0x06 << 8) | 0x70;
    const result = parseLnk(buildHeader({ hotKey: raw }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.header.hotKeyLabel).toBe('Ctrl+Alt+F1');
  });

  it('reports no timestamp (FILETIME 0) as null, not the 1601 epoch', () => {
    const result = parseLnk(buildHeader());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.header.creationTime).toBeNull();
    expect(result.data.header.accessTime).toBeNull();
    expect(result.data.header.writeTime).toBeNull();
  });

  it('decodes a known-good FILETIME via timestamps.ts\'s own conversion (132587904000000000 -> 2021-02-26T05:20:00Z)', () => {
    const result = parseLnk(buildHeader({ writeTime: 132587904000000000n }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.header.writeTime).toBe('2021-02-26T05:20:00Z');
  });
});

describe('parseLnk — StringData character-count-not-byte-count semantics', () => {
  it('reads a 3-character Unicode Description using the length prefix as a CHARACTER count, not a byte count', () => {
    // "abc" as UTF-16LE: 3 characters -> length prefix 0x0003, followed by
    // 6 bytes (61 00 62 00 63 00), NOT 3 bytes. Getting this backwards
    // (treating 0x0003 as a byte count) would read only 1.5 UTF-16 code
    // units and corrupt every field after it.
    const stringData = buildStringDataField('abc', true);
    expect(stringData).toHaveLength(2 + 6);
    expect(Array.from(stringData)).toEqual([0x03, 0x00, 0x61, 0x00, 0x62, 0x00, 0x63, 0x00]);

    const header = buildHeader({ linkFlags: FLAG.IsUnicode | FLAG.HasName });
    const result = parseLnk(concat(header, stringData));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.strings.description).toBe('abc');
  });

  it('reads a non-Unicode (ANSI) Description using the length prefix as a character count equal to its byte count', () => {
    const stringData = buildStringDataField('hi', false);
    expect(stringData).toHaveLength(2 + 2); // no *2 multiplier for ANSI
    const header = buildHeader({ linkFlags: FLAG.HasName }); // IsUnicode NOT set
    const result = parseLnk(concat(header, stringData));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.strings.description).toBe('hi');
  });

  it('reads every StringData field present, in spec order, each gated on its own LinkFlags bit', () => {
    const flags = FLAG.HasName | FLAG.HasRelativePath | FLAG.HasWorkingDir | FLAG.HasArguments | FLAG.HasIconLocation;
    const header = buildHeader({ linkFlags: flags });
    const body = concat(
      buildStringDataField('desc', false),
      buildStringDataField('..\\rel.exe', false),
      buildStringDataField('C:\\work', false),
      buildStringDataField('--flag', false),
      buildStringDataField('C:\\icon.ico', false),
    );
    const result = parseLnk(concat(header, body));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.strings).toEqual({
      description: 'desc',
      relativePath: '..\\rel.exe',
      workingDir: 'C:\\work',
      commandLineArguments: '--flag',
      iconLocation: 'C:\\icon.ico',
    });
  });

  it('leaves a field null when its LinkFlags bit is not set, even if bytes exist afterward', () => {
    // Only HasWorkingDir set — Description/RelativePath must stay null.
    const header = buildHeader({ linkFlags: FLAG.HasWorkingDir });
    const body = buildStringDataField('C:\\work', false);
    const result = parseLnk(concat(header, body));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.strings.description).toBeNull();
    expect(result.data.strings.relativePath).toBeNull();
    expect(result.data.strings.workingDir).toBe('C:\\work');
  });
});

describe('parseLnk — LinkTargetIDList / Shell Items', () => {
  it('renders "unrecognized item type (0xNN)" for a deliberately-unrecognized Shell Item, never fabricating a path segment', () => {
    // Class-type 0x99 falls outside both the file-entry (0x30-0x3F) and
    // named-volume (0x20-0x2E) ranges this tool decodes.
    const itemData = new Uint8Array([0x99, 0xaa, 0xbb]);
    const idList = buildTargetIdList(itemData);
    const header = buildHeader({ linkFlags: FLAG.HasLinkTargetIDList });
    const result = parseLnk(concat(header, idList));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.targetIdList).not.toBeNull();
    const items = result.data.targetIdList!.items;
    expect(items).toHaveLength(1);
    expect(items[0].kind).toBe('unrecognized');
    expect(items[0].text).toBe('unrecognized item type (0x99)');
    expect(result.data.targetIdList!.breadcrumb).toBe('unrecognized item type (0x99)');
  });

  it('decodes a recognized file-entry Shell Item (folder) into its name', () => {
    // classType 0x31 = file-entry, directory bit set, no Unicode bit.
    // [0]=0x31 [1]=reserved [2..5]=fileSize=0 [6..9]=packed FAT date=0
    // [10..11]=fileAttributes=0 [12..]="MyFolder\0"
    const name = 'MyFolder';
    const data = new Uint8Array(12 + name.length + 1);
    data[0] = 0x31;
    for (let i = 0; i < name.length; i++) data[12 + i] = name.charCodeAt(i);
    const idList = buildTargetIdList(data);
    const header = buildHeader({ linkFlags: FLAG.HasLinkTargetIDList });
    const result = parseLnk(concat(header, idList));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const items = result.data.targetIdList!.items;
    expect(items[0].kind).toBe('file-entry');
    expect(items[0].text).toBe('MyFolder');
    expect(items[0].isDirectory).toBe(true);
  });

  it('has no LinkTargetIDList at all when HasLinkTargetIDList is unset', () => {
    const result = parseLnk(buildHeader({ linkFlags: 0 }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.targetIdList).toBeNull();
  });
});

describe('parseLnk — LinkInfo', () => {
  it('parses VolumeID (drive type + serial) and a LocalBasePath when HasLinkInfo + VolumeIDAndLocalBasePath are set', () => {
    // LinkInfo layout (offsets relative to LinkInfo start):
    // 0: LinkInfoSize, 4: LinkInfoHeaderSize, 8: LinkInfoFlags,
    // 12: VolumeIDOffset, 16: LocalBasePathOffset,
    // 20: CommonNetworkRelativeLinkOffset, 24: CommonPathSuffixOffset,
    // then VolumeID struct, then the LocalBasePath string, then an empty
    // (zero-length) CommonPathSuffix string at the very end.
    const localBasePath = 'C:\\Users\\test\\file.txt\0';
    const volumeIdOffset = 28; // right after the 28-byte fixed header
    const volumeIdSize = 16; // size(4)+driveType(4)+serial(4)+labelOffset(4), no label
    const localBasePathOffset = volumeIdOffset + volumeIdSize;
    const commonPathSuffixOffset = localBasePathOffset + localBasePath.length; // points at a lone 0x00

    const totalSize = commonPathSuffixOffset + 1; // + the empty suffix's null terminator
    const buf = new Uint8Array(totalSize);
    const view = new DataView(buf.buffer);
    view.setUint32(0, totalSize, true); // LinkInfoSize
    view.setUint32(4, 0x1c, true); // LinkInfoHeaderSize (minimal, 28)
    view.setUint32(8, 0x1, true); // LinkInfoFlags: VolumeIDAndLocalBasePath
    view.setUint32(12, volumeIdOffset, true);
    view.setUint32(16, localBasePathOffset, true);
    view.setUint32(20, 0, true); // CommonNetworkRelativeLinkOffset (unused)
    view.setUint32(24, commonPathSuffixOffset, true);
    // VolumeID struct
    view.setUint32(volumeIdOffset + 0, volumeIdSize, true);
    view.setUint32(volumeIdOffset + 4, 3, true); // DRIVE_FIXED
    view.setUint32(volumeIdOffset + 8, 0xa1b2c3d4, true); // serial
    view.setUint32(volumeIdOffset + 12, 0, true); // VolumeLabelOffset = 0 (none)
    // LocalBasePath string
    for (let i = 0; i < localBasePath.length; i++) buf[localBasePathOffset + i] = localBasePath.charCodeAt(i);
    // CommonPathSuffix: empty string, just its null terminator (already 0)

    const header = buildHeader({ linkFlags: FLAG.HasLinkInfo });
    const result = parseLnk(concat(header, buf));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.linkInfo).not.toBeNull();
    const li = result.data.linkInfo!;
    expect(li.volume?.driveType).toBe(3);
    expect(li.volume?.driveTypeLabel).toBe('DRIVE_FIXED');
    expect(li.volume?.driveSerialNumber).toBe('A1B2-C3D4');
    expect(li.localBasePath).toBe('C:\\Users\\test\\file.txt');
    expect(li.fullPath).toBe('C:\\Users\\test\\file.txt');
  });

  it('has no LinkInfo at all when HasLinkInfo is unset', () => {
    const result = parseLnk(buildHeader({ linkFlags: 0 }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.linkInfo).toBeNull();
  });
});
