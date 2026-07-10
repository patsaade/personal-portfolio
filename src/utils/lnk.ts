// LNK (Shell Link) forensic parser — decodes a Windows .lnk shortcut file
// per [MS-SHLLINK] (the public "Shell Link Binary File Format" spec)
// entirely client-side from a File's raw bytes (see LnkParser.astro — a
// chosen file is read locally via File#arrayBuffer() and never uploaded).
//
// The fixed 76-byte ShellLinkHeader, the LinkFlags/FileAttributes bitmasks,
// the three FILETIME fields (reusing timestamps.ts's own FILETIME<->ns
// conversion rather than reimplementing the 1601 epoch math — see
// filetimeToIso below), LinkInfo (VolumeID + Local/CommonNetworkRelativeLink
// path), and the StringData section (Description/RelativePath/WorkingDir/
// CommandLineArguments/IconLocation) are all decoded per spec. Every section
// is read strictly gated on its own LinkFlags bit — a section is only ever
// parsed when the header actually says it's present, never assumed.
//
// The LinkTargetIDList is walked structurally (every Shell Item ID carries
// its own 2-byte length prefix, so the walk never desyncs even on an item
// type this tool doesn't understand) but only the common item types are
// actually decoded into breadcrumb text: [MS-SHLLINK] itself deliberately
// does NOT define the internal Shell Item ID formats — that's a separate,
// much larger, only semi-officially-documented "Windows Shell Item" format
// family (file-entry items, volume items, network-location items, control
// panel items, ...). This tool decodes file-entry items (the common case:
// folders/files in a target path) and simple "named" volume items (drive
// roots like "C:\"); every other class-type byte is explicitly labeled
// "unrecognized item type (0xNN)" rather than guessed at — never fabricated.

import { formatById, DEFAULT_CONTEXT } from './timestamps';

const winFiletimeFmt = formatById('filetime')!;
const fatDosFmt = formatById('fat-dos')!;
const iso8601Fmt = formatById('iso8601')!;

/** Convert a raw 64-bit FILETIME tick count (100-ns ticks since 1601-01-01)
 *  to a human-readable ISO 8601 UTC string, reusing timestamps.ts's own
 *  FILETIME<->canonical-ns conversion rather than reimplementing the epoch
 *  math. A raw value of 0 means "not set" per [MS-SHLLINK] §2.1 — returned
 *  as null, never rendered as the literal 1601-01-01 epoch instant. */
function filetimeToIso(ticks: bigint): string | null {
  if (ticks === 0n) return null;
  const ns = winFiletimeFmt.parse(ticks.toString(), DEFAULT_CONTEXT);
  if (ns === null) return null;
  return iso8601Fmt.format(ns, DEFAULT_CONTEXT);
}

/** Convert a packed 32-bit FAT/DOS date-time (as found in a file-entry Shell
 *  Item's LastModificationDateTime field — the same dateWord<<16|timeWord
 *  packed DWORD that timestamps.ts's own FAT/DOS format already handles) to
 *  an ISO 8601 string, resolved as UTC (no local-offset context is available
 *  this deep inside a Shell Item, so this is a best-effort literal read of
 *  the packed clock fields, not a timezone-corrected instant). */
function fatDosToIso(packed: number): string | null {
  if (packed === 0) return null;
  const ns = fatDosFmt.parse('0x' + packed.toString(16), DEFAULT_CONTEXT);
  if (ns === null) return null;
  return iso8601Fmt.format(ns, DEFAULT_CONTEXT);
}

// ---------------------------------------------------------------------------
// LinkCLSID — every valid .lnk file's LinkCLSID field must equal this fixed
// 16-byte value (the GUID {00021401-0000-0000-C000-000000000046},
// CLSID_ShellLink, MS-SHLLINK §2.1). A GUID's on-disk byte layout is
// Data1 (4 bytes LE) + Data2 (2 bytes LE) + Data3 (2 bytes LE) + Data4
// (8 bytes, written verbatim) — this is the resulting fixed byte sequence.
// ---------------------------------------------------------------------------
const SHELL_LINK_CLSID: readonly number[] = [
  0x01, 0x14, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0xc0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x46,
];

// LinkFlags bits (MS-SHLLINK §2.1.1) — only the ones this tool actually
// gates behavior on are named individually; the rest still get decoded into
// header.linkFlagNames for display via the full LINK_FLAGS table below.
const FLAG = {
  HasLinkTargetIDList: 0x00000001,
  HasLinkInfo: 0x00000002,
  HasName: 0x00000004,
  HasRelativePath: 0x00000008,
  HasWorkingDir: 0x00000010,
  HasArguments: 0x00000020,
  HasIconLocation: 0x00000040,
  IsUnicode: 0x00000080,
} as const;

const LINK_FLAGS: { bit: number; name: string }[] = [
  { bit: 0x00000001, name: 'HasLinkTargetIDList' },
  { bit: 0x00000002, name: 'HasLinkInfo' },
  { bit: 0x00000004, name: 'HasName' },
  { bit: 0x00000008, name: 'HasRelativePath' },
  { bit: 0x00000010, name: 'HasWorkingDir' },
  { bit: 0x00000020, name: 'HasArguments' },
  { bit: 0x00000040, name: 'HasIconLocation' },
  { bit: 0x00000080, name: 'IsUnicode' },
  { bit: 0x00000100, name: 'ForceNoLinkInfo' },
  { bit: 0x00000200, name: 'HasExpString' },
  { bit: 0x00000400, name: 'RunInSeparateProcess' },
  { bit: 0x00001000, name: 'HasDarwinID' },
  { bit: 0x00002000, name: 'RunAsUser' },
  { bit: 0x00004000, name: 'HasExpIcon' },
  { bit: 0x00008000, name: 'NoPidlAlias' },
  { bit: 0x00020000, name: 'RunWithShimLayer' },
  { bit: 0x00040000, name: 'ForceNoLinkTrack' },
  { bit: 0x00080000, name: 'EnableTargetMetadata' },
  { bit: 0x00100000, name: 'DisableLinkPathTracking' },
  { bit: 0x00200000, name: 'DisableKnownFolderTracking' },
  { bit: 0x00400000, name: 'DisableKnownFolderAlias' },
  { bit: 0x00800000, name: 'AllowLinkToLink' },
  { bit: 0x01000000, name: 'UnaliasOnSave' },
  { bit: 0x02000000, name: 'PreferEnvironmentPath' },
  { bit: 0x04000000, name: 'KeepLocalIDListForUNCTarget' },
];

// FileAttributes bits (MS-SHLLINK §2.1.2 — the standard Windows FAT/NTFS
// file-attribute bitmask, same field shape as FindFirstFile's dwFileAttributes).
const FILE_ATTRIBUTE_FLAGS: { bit: number; name: string }[] = [
  { bit: 0x00000001, name: 'FILE_ATTRIBUTE_READONLY' },
  { bit: 0x00000002, name: 'FILE_ATTRIBUTE_HIDDEN' },
  { bit: 0x00000004, name: 'FILE_ATTRIBUTE_SYSTEM' },
  { bit: 0x00000010, name: 'FILE_ATTRIBUTE_DIRECTORY' },
  { bit: 0x00000020, name: 'FILE_ATTRIBUTE_ARCHIVE' },
  { bit: 0x00000080, name: 'FILE_ATTRIBUTE_NORMAL' },
  { bit: 0x00000100, name: 'FILE_ATTRIBUTE_TEMPORARY' },
  { bit: 0x00000200, name: 'FILE_ATTRIBUTE_SPARSE_FILE' },
  { bit: 0x00000400, name: 'FILE_ATTRIBUTE_REPARSE_POINT' },
  { bit: 0x00000800, name: 'FILE_ATTRIBUTE_COMPRESSED' },
  { bit: 0x00001000, name: 'FILE_ATTRIBUTE_OFFLINE' },
  { bit: 0x00002000, name: 'FILE_ATTRIBUTE_NOT_CONTENT_INDEXED' },
  { bit: 0x00004000, name: 'FILE_ATTRIBUTE_ENCRYPTED' },
];

function decodeFlags(value: number, table: { bit: number; name: string }[]): string[] {
  return table.filter((f) => (value & f.bit) === f.bit).map((f) => f.name);
}
function hasFlag(flags: number, bit: number): boolean {
  return (flags & bit) === bit;
}

const SHOW_COMMANDS: Record<number, string> = {
  1: 'SW_SHOWNORMAL',
  3: 'SW_SHOWMAXIMIZED',
  7: 'SW_SHOWMINNOACTIVE',
};
function showCommandLabel(value: number): string {
  return SHOW_COMMANDS[value] ?? `Unrecognized ShowCommand value (0x${value.toString(16).padStart(8, '0')})`;
}

// HotKey (MS-SHLLINK §2.1.1): low byte = a virtual-key code, high byte =
// HOTKEYF_SHIFT(0x1)/HOTKEYF_CONTROL(0x2)/HOTKEYF_ALT(0x4) modifier bits.
const HOTKEY_VK_NAMES: Record<number, string> = {
  0x70: 'F1', 0x71: 'F2', 0x72: 'F3', 0x73: 'F4', 0x74: 'F5', 0x75: 'F6',
  0x76: 'F7', 0x77: 'F8', 0x78: 'F9', 0x79: 'F10', 0x7a: 'F11', 0x7b: 'F12',
};
function hotKeyLabel(raw: number): string {
  if (raw === 0) return 'None';
  const vk = raw & 0xff;
  const mods = (raw >> 8) & 0xff;
  const parts: string[] = [];
  if (mods & 0x02) parts.push('Ctrl');
  if (mods & 0x04) parts.push('Alt');
  if (mods & 0x01) parts.push('Shift');
  let keyName: string;
  if (vk >= 0x30 && vk <= 0x39) keyName = String.fromCharCode(vk); // '0'-'9'
  else if (vk >= 0x41 && vk <= 0x5a) keyName = String.fromCharCode(vk); // 'A'-'Z'
  else keyName = HOTKEY_VK_NAMES[vk] ?? `VK 0x${vk.toString(16).padStart(2, '0')}`;
  parts.push(keyName);
  return parts.join('+');
}

const DRIVE_TYPES: Record<number, string> = {
  0: 'DRIVE_UNKNOWN',
  1: 'DRIVE_NO_ROOT_DIR',
  2: 'DRIVE_REMOVABLE',
  3: 'DRIVE_FIXED',
  4: 'DRIVE_REMOTE',
  5: 'DRIVE_CDROM',
  6: 'DRIVE_RAMDISK',
};

/** Latin-1-safe byte->string decode for the LNK format's non-Unicode strings
 *  (StringData/LinkInfo text when IsUnicode is unset uses the system default
 *  code page — this tool treats that as Latin-1/ASCII-safe, per brief). */
function latin1Decode(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return s;
}

/** Thrown internally for any structurally invalid/truncated input; always
 *  caught at the top of parseLnk() and turned into a friendly {ok:false}
 *  result — never escapes to the caller. */
class LnkFormatError extends Error {}

/** Sequential little-endian binary reader over the whole file's bytes, with
 *  a bounds check on every read so a truncated/malformed file fails with a
 *  specific message instead of an uncaught exception or garbage output.
 *  Every multi-byte read below passes `true` (little-endian) explicitly. */
class Reader {
  readonly bytes: Uint8Array;
  private readonly view: DataView;
  offset: number;
  constructor(bytes: Uint8Array, offset = 0) {
    this.bytes = bytes;
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    this.offset = offset;
  }
  private need(n: number, what: string) {
    if (this.offset + n > this.bytes.length) {
      throw new LnkFormatError(`Unexpected end of file while reading ${what}.`);
    }
  }
  u16(what = 'a 16-bit field'): number {
    this.need(2, what);
    const v = this.view.getUint16(this.offset, true);
    this.offset += 2;
    return v;
  }
  i32(what = 'a 32-bit field'): number {
    this.need(4, what);
    const v = this.view.getInt32(this.offset, true);
    this.offset += 4;
    return v;
  }
  u32(what = 'a 32-bit field'): number {
    this.need(4, what);
    const v = this.view.getUint32(this.offset, true);
    this.offset += 4;
    return v;
  }
  u64(what = 'a 64-bit field'): bigint {
    this.need(8, what);
    const v = this.view.getBigUint64(this.offset, true);
    this.offset += 8;
    return v;
  }
  bytesRead(n: number, what = 'bytes'): Uint8Array {
    this.need(n, what);
    const v = this.bytes.slice(this.offset, this.offset + n);
    this.offset += n;
    return v;
  }
  skip(n: number, what = 'reserved bytes') {
    this.need(n, what);
    this.offset += n;
  }
}

// ---------------------------------------------------------------------------
// ShellLinkHeader (MS-SHLLINK §2.1) — fixed 76 bytes.
// ---------------------------------------------------------------------------

interface LnkHeader {
  headerSize: number;
  linkFlags: number;
  linkFlagNames: string[];
  fileAttributes: number;
  fileAttributeNames: string[];
  /** ISO 8601 UTC, or null when the field's raw FILETIME value is 0 ("not set"). */
  creationTime: string | null;
  accessTime: string | null;
  writeTime: string | null;
  fileSize: number;
  iconIndex: number;
  showCommand: number;
  showCommandLabel: string;
  hotKey: number;
  hotKeyLabel: string;
}

function parseHeader(r: Reader): LnkHeader {
  const headerSize = r.u32('HeaderSize');
  if (headerSize !== 0x0000004c) {
    throw new LnkFormatError(
      `Not a valid LNK file: HeaderSize is 0x${headerSize.toString(16).padStart(8, '0')}, expected exactly 0x0000004C.`,
    );
  }
  const clsid = r.bytesRead(16, 'LinkCLSID');
  const clsidOk = SHELL_LINK_CLSID.every((b, i) => clsid[i] === b);
  if (!clsidOk) {
    throw new LnkFormatError(
      'Not a recognized LNK file: the 16-byte LinkCLSID field does not match the required Shell Link CLSID ({00021401-0000-0000-C000-000000000046}).',
    );
  }
  const linkFlags = r.u32('LinkFlags');
  const fileAttributes = r.u32('FileAttributes');
  const creationTicks = r.u64('CreationTime');
  const accessTicks = r.u64('AccessTime');
  const writeTicks = r.u64('WriteTime');
  const fileSize = r.u32('FileSize');
  const iconIndex = r.i32('IconIndex');
  const showCommand = r.u32('ShowCommand');
  const hotKey = r.u16('HotKey');
  r.skip(2, 'Reserved1');
  r.skip(4, 'Reserved2');
  r.skip(4, 'Reserved3');
  return {
    headerSize,
    linkFlags,
    linkFlagNames: decodeFlags(linkFlags, LINK_FLAGS),
    fileAttributes,
    fileAttributeNames: decodeFlags(fileAttributes, FILE_ATTRIBUTE_FLAGS),
    creationTime: filetimeToIso(creationTicks),
    accessTime: filetimeToIso(accessTicks),
    writeTime: filetimeToIso(writeTicks),
    fileSize,
    iconIndex,
    showCommand,
    showCommandLabel: showCommandLabel(showCommand),
    hotKey,
    hotKeyLabel: hotKeyLabel(hotKey),
  };
}

// ---------------------------------------------------------------------------
// LinkTargetIDList (MS-SHLLINK §2.2) — gated on LinkFlags.HasLinkTargetIDList.
// ---------------------------------------------------------------------------

interface ShellItem {
  /** First byte of the item's own data, or null for a zero-length item. */
  classType: number | null;
  kind: 'file-entry' | 'volume' | 'unrecognized' | 'empty';
  /** Best-effort decoded breadcrumb text, or an explicit
   *  "unrecognized item type (0xNN)" label — never a fabricated path segment. */
  text: string;
  isDirectory?: boolean;
  fileSize?: number;
  /** ISO 8601, or null if unset/unparseable. Only present for file-entry items. */
  modified?: string | null;
}

interface LinkTargetIdList {
  items: ShellItem[];
  /** items' text joined with " \ ", for a single at-a-glance breadcrumb. */
  breadcrumb: string;
}

function decodeShellItem(data: Uint8Array): ShellItem {
  if (data.length === 0) {
    return { classType: null, kind: 'empty', text: '(empty item)' };
  }
  const classType = data[0];

  // File entry shell item — the well-established 0x30-0x3F class-type range
  // used by essentially every public LNK/JumpList parser for folders/files
  // in a target path. Layout: [0]=class type (bit 0x01=directory, bit
  // 0x04=Unicode name), [1]=reserved, [2..5]=FileSize (u32 LE), [6..9]=
  // LastModificationDateTime (packed FAT/DOS date-time, u32 LE),
  // [10..11]=FileAttributes (u16 LE), [12..]=PrimaryName (null-terminated).
  if ((classType & 0xf0) === 0x30 && data.length >= 12) {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const isDirectory = (classType & 0x01) === 0x01;
    const isUnicode = (classType & 0x04) === 0x04;
    const fileSize = view.getUint32(2, true);
    const packedDate = view.getUint32(6, true);
    const modified = fatDosToIso(packedDate);
    let name: string;
    if (isUnicode) {
      let end = 12;
      while (end + 1 < data.length && !(data[end] === 0 && data[end + 1] === 0)) end += 2;
      name = new TextDecoder('utf-16le').decode(data.slice(12, end));
    } else {
      let end = 12;
      while (end < data.length && data[end] !== 0) end += 1;
      name = latin1Decode(data.slice(12, end));
    }
    return { classType, kind: 'file-entry', text: name || '(unnamed)', isDirectory, fileSize, modified };
  }

  // Volume shell item, "has a name" variant (0x20-0x2E; 0x2F is a distinct
  // GUID-identified variant with no textual name, intentionally left
  // unrecognized rather than guessed at) — a null-terminated ANSI drive
  // spec (e.g. "C:\") starting right after the class-type byte. This is the
  // common drive-root breadcrumb segment seen at the start of most target
  // ID lists.
  if (classType >= 0x20 && classType <= 0x2e && data.length > 1) {
    let end = 1;
    while (end < data.length && data[end] !== 0) end += 1;
    const name = latin1Decode(data.slice(1, end));
    if (name) return { classType, kind: 'volume', text: name };
  }

  return {
    classType,
    kind: 'unrecognized',
    text: `unrecognized item type (0x${classType.toString(16).padStart(2, '0')})`,
  };
}

function parseLinkTargetIdList(r: Reader): LinkTargetIdList {
  const idListSize = r.u16('IDListSize');
  const end = r.offset + idListSize;
  if (end > r.bytes.length) {
    throw new LnkFormatError('Malformed LinkTargetIDList: its declared size exceeds the remaining file.');
  }
  const items: ShellItem[] = [];
  while (r.offset < end) {
    const itemSize = r.u16('an ItemID size prefix');
    if (itemSize === 0) break; // 2-byte 0x0000 terminal ID
    if (itemSize < 2) {
      throw new LnkFormatError('Malformed LinkTargetIDList: an item declares an impossible size.');
    }
    const dataLen = itemSize - 2;
    if (r.offset + dataLen > end) {
      throw new LnkFormatError('Malformed LinkTargetIDList: an item runs past the declared list size.');
    }
    items.push(decodeShellItem(r.bytesRead(dataLen, 'shell item data')));
  }
  // IDListSize is the authoritative boundary for everything that follows in
  // the file — always land there exactly, whether we broke on the terminal
  // marker or simply ran out of declared list bytes.
  r.offset = end;
  return { items, breadcrumb: items.map((it) => it.text).join(' \\ ') };
}

// ---------------------------------------------------------------------------
// LinkInfo (MS-SHLLINK §2.3) — gated on LinkFlags.HasLinkInfo.
// ---------------------------------------------------------------------------

interface VolumeInfo {
  driveType: number;
  driveTypeLabel: string;
  /** Formatted like "XXXX-XXXX", the conventional DFIR display for a volume serial. */
  driveSerialNumber: string;
  volumeLabel: string | null;
}
interface NetworkInfo {
  netName: string | null;
  deviceName: string | null;
}
interface LinkInfoData {
  linkInfoSize: number;
  headerSize: number;
  hasVolumeIdAndLocalBasePath: boolean;
  hasCommonNetworkRelativeLink: boolean;
  volume: VolumeInfo | null;
  localBasePath: string | null;
  network: NetworkInfo | null;
  commonPathSuffix: string | null;
  /** Best-effort combined path: (localBasePath or network.netName) + commonPathSuffix. */
  fullPath: string | null;
}

function joinPath(base: string, suffix: string): string {
  if (!suffix) return base;
  return base.replace(/\\?$/, '\\') + suffix.replace(/^\\/, '');
}

function parseLinkInfo(r: Reader): LinkInfoData {
  const bytes = r.bytes;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const start = r.offset;

  if (start + 4 > bytes.length) throw new LnkFormatError('Malformed LinkInfo: LinkInfoSize is out of range.');
  const linkInfoSize = view.getUint32(start, true);
  if (linkInfoSize < 4) {
    throw new LnkFormatError('Malformed LinkInfo: declared size is smaller than its own size field.');
  }
  const sectionEnd = start + linkInfoSize;
  if (sectionEnd > bytes.length) {
    throw new LnkFormatError('Malformed LinkInfo: declared size exceeds the remaining file.');
  }
  if (start + 28 > sectionEnd) {
    throw new LnkFormatError('Malformed LinkInfo: too small to contain its own fixed header fields.');
  }

  const headerSize = view.getUint32(start + 4, true);
  const flags = view.getUint32(start + 8, true);
  const volumeIdOffset = view.getUint32(start + 12, true);
  const localBasePathOffset = view.getUint32(start + 16, true);
  const commonNetworkRelativeLinkOffset = view.getUint32(start + 20, true);
  const commonPathSuffixOffset = view.getUint32(start + 24, true);

  const hasVolumeIdAndLocalBasePath = (flags & 0x1) === 0x1;
  const hasCommonNetworkRelativeLink = (flags & 0x2) === 0x2;

  function ansiAt(absOffset: number): string | null {
    if (absOffset <= 0 || absOffset >= sectionEnd) return null;
    let end = absOffset;
    while (end < sectionEnd && bytes[end] !== 0) end += 1;
    const s = latin1Decode(bytes.slice(absOffset, end));
    return s || null;
  }

  let volume: VolumeInfo | null = null;
  let localBasePath: string | null = null;
  if (hasVolumeIdAndLocalBasePath) {
    const volStart = start + volumeIdOffset;
    if (volumeIdOffset > 0 && volStart + 16 <= sectionEnd) {
      const driveType = view.getUint32(volStart + 4, true);
      const serial = view.getUint32(volStart + 8, true);
      const labelOffset = view.getUint32(volStart + 12, true);
      volume = {
        driveType,
        driveTypeLabel: DRIVE_TYPES[driveType] ?? `Unknown (${driveType})`,
        driveSerialNumber: serial
          .toString(16)
          .toUpperCase()
          .padStart(8, '0')
          .replace(/(.{4})(.{4})/, '$1-$2'),
        volumeLabel: ansiAt(volStart + labelOffset),
      };
    }
    localBasePath = ansiAt(start + localBasePathOffset);
  }

  let network: NetworkInfo | null = null;
  if (hasCommonNetworkRelativeLink) {
    const netStart = start + commonNetworkRelativeLinkOffset;
    if (commonNetworkRelativeLinkOffset > 0 && netStart + 16 <= sectionEnd) {
      const netFlags = view.getUint32(netStart + 4, true);
      const netNameOffset = view.getUint32(netStart + 8, true);
      const deviceNameOffset = view.getUint32(netStart + 12, true);
      network = {
        netName: ansiAt(netStart + netNameOffset),
        deviceName: (netFlags & 0x1) === 0x1 ? ansiAt(netStart + deviceNameOffset) : null,
      };
    }
  }

  const commonPathSuffix = ansiAt(start + commonPathSuffixOffset);

  r.offset = sectionEnd; // LinkInfo is a fixed-size block; always land at its declared end.

  const base = localBasePath ?? network?.netName ?? null;
  const fullPath = base ? joinPath(base, commonPathSuffix ?? '') : null;

  return {
    linkInfoSize,
    headerSize,
    hasVolumeIdAndLocalBasePath,
    hasCommonNetworkRelativeLink,
    volume,
    localBasePath,
    network,
    commonPathSuffix,
    fullPath,
  };
}

// ---------------------------------------------------------------------------
// StringData (MS-SHLLINK §2.4) — each field gated on its own LinkFlags bit.
// CRITICAL: the 2-byte length prefix on every field is a CHARACTER count,
// not a byte count. When IsUnicode is set the string is UTF-16LE (byte
// length = count*2); otherwise it's count bytes of the system default code
// page (treated here as Latin-1/ASCII-safe). Getting this backwards is a
// well-known off-by-2x bug spot for this format.
// ---------------------------------------------------------------------------

interface StringDataFields {
  description: string | null;
  relativePath: string | null;
  workingDir: string | null;
  commandLineArguments: string | null;
  iconLocation: string | null;
}

function readStringDataField(r: Reader, isUnicode: boolean, what: string): string {
  const charCount = r.u16(`${what} length`);
  const byteLen = isUnicode ? charCount * 2 : charCount;
  const raw = r.bytesRead(byteLen, what);
  return isUnicode ? new TextDecoder('utf-16le').decode(raw) : latin1Decode(raw);
}

function parseStringData(r: Reader, linkFlags: number): StringDataFields {
  const isUnicode = hasFlag(linkFlags, FLAG.IsUnicode);
  const out: StringDataFields = {
    description: null,
    relativePath: null,
    workingDir: null,
    commandLineArguments: null,
    iconLocation: null,
  };
  if (hasFlag(linkFlags, FLAG.HasName)) out.description = readStringDataField(r, isUnicode, 'Description');
  if (hasFlag(linkFlags, FLAG.HasRelativePath)) out.relativePath = readStringDataField(r, isUnicode, 'RelativePath');
  if (hasFlag(linkFlags, FLAG.HasWorkingDir)) out.workingDir = readStringDataField(r, isUnicode, 'WorkingDir');
  if (hasFlag(linkFlags, FLAG.HasArguments)) {
    out.commandLineArguments = readStringDataField(r, isUnicode, 'CommandLineArguments');
  }
  if (hasFlag(linkFlags, FLAG.HasIconLocation)) out.iconLocation = readStringDataField(r, isUnicode, 'IconLocation');
  return out;
}

// ---------------------------------------------------------------------------
// Top-level orchestration.
// ---------------------------------------------------------------------------

interface LnkFile {
  header: LnkHeader;
  targetIdList: LinkTargetIdList | null;
  linkInfo: LinkInfoData | null;
  strings: StringDataFields;
  fileSizeBytes: number;
}

export type LnkParseResult = { ok: true; data: LnkFile } | { ok: false; error: string };

/** Parse a .lnk file's raw bytes. Never throws — any structurally invalid or
 *  truncated input comes back as {ok:false, error: <specific message>}. */
export function parseLnk(bytes: Uint8Array): LnkParseResult {
  try {
    if (bytes.length < 76) {
      return {
        ok: false,
        error: `Not a valid LNK file: the file is only ${bytes.length} byte${bytes.length === 1 ? '' : 's'}, smaller than the required 76-byte header.`,
      };
    }
    const r = new Reader(bytes);
    const header = parseHeader(r);

    const targetIdList = hasFlag(header.linkFlags, FLAG.HasLinkTargetIDList) ? parseLinkTargetIdList(r) : null;
    const linkInfo = hasFlag(header.linkFlags, FLAG.HasLinkInfo) ? parseLinkInfo(r) : null;
    const strings = parseStringData(r, header.linkFlags);

    return { ok: true, data: { header, targetIdList, linkInfo, strings, fileSizeBytes: bytes.length } };
  } catch (e) {
    if (e instanceof LnkFormatError) return { ok: false, error: e.message };
    return { ok: false, error: 'Could not parse this file as a LNK shortcut — it may be corrupt or truncated.' };
  }
}
