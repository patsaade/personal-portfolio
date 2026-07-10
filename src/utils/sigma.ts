// Sigma Rule Tester & Builder — pure functions, no DOM dependency (unit
// tested directly in test/sigma.test.ts, imported into the client bundle by
// SigmaTester.astro for live evaluation as you type).
//
// This implements an EXPLICITLY-SCOPED SUBSET of the Sigma detection-rule
// spec (https://github.com/SigmaHQ/sigma-specification), not full spec
// parity. Supported:
//   - field-value matching with modifiers: bare equals, |contains,
//     |startswith, |endswith, |re (a JS RegExp, compiled defensively — see
//     compileSigmaRegex).
//   - selection-combination logic in detection.condition: "1 of <prefix>*",
//     "all of <prefix>*", "1 of them", "all of them", and a bare "and"/"or"
//     list of selection names (mixing "and" and "or" in one condition is not
//     supported — the parser reports it as an error rather than guessing
//     precedence).
// Explicitly NOT supported (deliberate v1 scope cuts, not silent gaps):
//   - glob/wildcard FIELD-NAME matching (e.g. `Field*: value`) — every field
//     name in a selection is matched exactly. The only wildcard this tool
//     understands is on a *selection name prefix* in a condition like
//     "1 of selection*", which is a different, simpler mechanism.
//   - list-of-values-under-one-key OR semantics (real Sigma lets a single
//     field key map to a YAML list, meaning "any of these values"). This
//     tool's builder produces one row per field constraint; rows are always
//     AND'd together within a selection, never OR'd by shared field name.
//   - logsource, level, tags, and any other rule metadata beyond title +
//     detection — see generateYaml.
//   - a real bidirectional YAML parser. generateYaml is a one-way,
//     display-only renderer of the builder's current state; there is no
//     matching parser to read arbitrary YAML back into builder state.

export type SigmaModifier = 'equals' | 'contains' | 'startswith' | 'endswith' | 're';

/** Single source of truth for the modifier dropdown + the small "supported
 *  subset" reference table on the tool's page — mirrors HASH_ALGORITHMS'
 *  role in utils/hashes.ts. */
export const SIGMA_MODIFIERS: { id: SigmaModifier; label: string; syntax: string; hint: string }[] = [
  { id: 'equals', label: 'equals', syntax: '(bare field name)', hint: 'Exact match, case-insensitive.' },
  { id: 'contains', label: 'contains', syntax: '|contains', hint: 'Substring match, case-insensitive.' },
  { id: 'startswith', label: 'starts with', syntax: '|startswith', hint: 'Prefix match, case-insensitive.' },
  { id: 'endswith', label: 'ends with', syntax: '|endswith', hint: 'Suffix match, case-insensitive.' },
  { id: 're', label: 'regex (|re)', syntax: '|re', hint: 'JavaScript regular expression match against the field value.' },
];

export interface SigmaFieldValue {
  field: string;
  modifier: SigmaModifier;
  value: string;
}

/** A named selection: every field row is AND'd together (see file header —
 *  no same-field OR-list support in this subset). */
export interface SigmaSelection {
  name: string;
  fields: SigmaFieldValue[];
}

export interface SigmaRule {
  title: string;
  selections: SigmaSelection[];
  /** Raw condition text — see parseCondition for the supported grammar. */
  condition: string;
}

// ---------------------------------------------------------------------------
// Field-value matching
// ---------------------------------------------------------------------------

/** Safely compile a user-supplied regex (the |re modifier) — same
 *  never-throw-uncaught discipline as this codebase's Regex Tester tool.
 *  Returns null on an invalid pattern instead of throwing. */
export function compileSigmaRegex(pattern: string): RegExp | null {
  try {
    return new RegExp(pattern);
  } catch {
    return null;
  }
}

/** True if a single field:modifier:value row matches an event. Field-name
 *  matching is exact (see file header — no glob support in v1). Missing or
 *  null/undefined fields never match. String comparison is case-insensitive
 *  for equals/contains/startswith/endswith (matches Sigma's own default
 *  case-insensitive string matching); |re is matched with the pattern
 *  exactly as authored (no implicit flags). */
export function fieldValueMatches(fv: SigmaFieldValue, event: Record<string, unknown>): boolean {
  if (!fv.field || !Object.prototype.hasOwnProperty.call(event, fv.field)) return false;
  const raw = event[fv.field];
  if (raw === null || raw === undefined) return false;
  const haystack = String(raw);
  switch (fv.modifier) {
    case 'equals':
      return haystack.toLowerCase() === fv.value.toLowerCase();
    case 'contains':
      return haystack.toLowerCase().includes(fv.value.toLowerCase());
    case 'startswith':
      return haystack.toLowerCase().startsWith(fv.value.toLowerCase());
    case 'endswith':
      return haystack.toLowerCase().endsWith(fv.value.toLowerCase());
    case 're': {
      const re = compileSigmaRegex(fv.value);
      return re ? re.test(haystack) : false;
    }
    default:
      return false;
  }
}

/** A selection matches an event iff it has at least one field row AND every
 *  row matches (AND across rows). An empty selection (no complete rows) never
 *  matches anything — that's a deliberate "incomplete state" default, not a
 *  vacuous-truth trap. */
export function selectionMatches(selection: SigmaSelection, event: Record<string, unknown>): boolean {
  if (selection.fields.length === 0) return false;
  return selection.fields.every((fv) => fieldValueMatches(fv, event));
}

// ---------------------------------------------------------------------------
// Condition parsing + evaluation
// ---------------------------------------------------------------------------

type SigmaConditionParsed =
  | { type: 'them'; op: 'any' | 'all' }
  | { type: 'wildcard'; op: 'any' | 'all'; prefix: string }
  | { type: 'list'; op: 'and' | 'or'; names: string[] };

export interface SigmaConditionParseResult {
  parsed: SigmaConditionParsed | null;
  error: string | null;
}

const NAME_RE = /^[A-Za-z0-9_]+$/;

/** Parse a detection.condition string into one of this tool's supported
 *  forms. Never throws — an unsupported/malformed condition comes back as
 *  { parsed: null, error: <friendly message> }. */
export function parseCondition(condition: string): SigmaConditionParseResult {
  const trimmed = condition.trim();
  if (!trimmed) return { parsed: null, error: 'The condition is empty.' };

  let m = /^(1|all)\s+of\s+them$/i.exec(trimmed);
  if (m) return { parsed: { type: 'them', op: m[1] === '1' ? 'any' : 'all' }, error: null };

  m = /^(1|all)\s+of\s+([A-Za-z0-9_]+)\*$/i.exec(trimmed);
  if (m) return { parsed: { type: 'wildcard', op: m[1] === '1' ? 'any' : 'all', prefix: m[2] }, error: null };

  const andParts = trimmed.split(/\s+and\s+/i).map((s) => s.trim()).filter(Boolean);
  const orParts = trimmed.split(/\s+or\s+/i).map((s) => s.trim()).filter(Boolean);

  if (andParts.length > 1 && orParts.length > 1) {
    return { parsed: null, error: 'Mixing "and" and "or" in one condition is outside this tool’s supported subset.' };
  }
  if (andParts.length > 1) {
    if (!andParts.every((n) => NAME_RE.test(n))) {
      return { parsed: null, error: 'Unrecognized selection name in the condition.' };
    }
    return { parsed: { type: 'list', op: 'and', names: andParts }, error: null };
  }
  if (orParts.length > 1) {
    if (!orParts.every((n) => NAME_RE.test(n))) {
      return { parsed: null, error: 'Unrecognized selection name in the condition.' };
    }
    return { parsed: { type: 'list', op: 'or', names: orParts }, error: null };
  }
  if (NAME_RE.test(trimmed)) {
    return { parsed: { type: 'list', op: 'and', names: [trimmed] }, error: null };
  }
  return { parsed: null, error: 'Unrecognized condition syntax for this tool’s supported subset.' };
}

export interface ConditionEvalResult {
  matched: boolean;
  /** Selection names that actually contributed to a true result. Empty when
   *  matched is false. */
  matchedSelections: string[];
  error: string | null;
}

/** Evaluate a parsed (or freshly-parsed) condition against a rule's
 *  selections for one event. Unknown selection names / an empty wildcard
 *  match set come back as a friendly error, never a throw. */
export function evaluateCondition(
  condition: string,
  selections: SigmaSelection[],
  event: Record<string, unknown>,
): ConditionEvalResult {
  const { parsed, error } = parseCondition(condition);
  if (!parsed) return { matched: false, matchedSelections: [], error };

  const matchMap: Record<string, boolean> = {};
  for (const sel of selections) matchMap[sel.name] = selectionMatches(sel, event);

  if (parsed.type === 'them') {
    const names = selections.map((s) => s.name);
    if (names.length === 0) return { matched: false, matchedSelections: [], error: 'There are no selections to evaluate.' };
    const matchedNames = names.filter((n) => matchMap[n]);
    const matched = parsed.op === 'any' ? matchedNames.length > 0 : matchedNames.length === names.length;
    return { matched, matchedSelections: matched ? matchedNames : [], error: null };
  }

  if (parsed.type === 'wildcard') {
    const names = selections.map((s) => s.name).filter((n) => n.startsWith(parsed.prefix));
    if (names.length === 0) {
      return { matched: false, matchedSelections: [], error: `No selection name starts with "${parsed.prefix}".` };
    }
    const matchedNames = names.filter((n) => matchMap[n]);
    const matched = parsed.op === 'any' ? matchedNames.length > 0 : matchedNames.length === names.length;
    return { matched, matchedSelections: matched ? matchedNames : [], error: null };
  }

  // list
  const unknown = parsed.names.filter((n) => !(n in matchMap));
  if (unknown.length > 0) {
    return { matched: false, matchedSelections: [], error: `Unknown selection name${unknown.length > 1 ? 's' : ''}: ${unknown.join(', ')}` };
  }
  const matchedNames = parsed.names.filter((n) => matchMap[n]);
  const matched = parsed.op === 'and' ? matchedNames.length === parsed.names.length : matchedNames.length > 0;
  return { matched, matchedSelections: matched ? matchedNames : [], error: null };
}

// ---------------------------------------------------------------------------
// Condition-builder UI helper (guided dropdown/radio -> canonical condition string)
// ---------------------------------------------------------------------------

export type SigmaConditionUiType = 'list-and' | 'list-or' | 'them-all' | 'them-any' | 'wildcard-all' | 'wildcard-any';

/** Single source of truth for the guided builder's "combination logic"
 *  dropdown — mirrors HASH_ALGORITHMS' declarative-array role. */
export const CONDITION_UI_TYPES: { id: SigmaConditionUiType; label: string }[] = [
  { id: 'list-and', label: 'Selected selections must all match (and)' },
  { id: 'list-or', label: 'Any one selected selection matches (or)' },
  { id: 'them-all', label: 'All of them' },
  { id: 'them-any', label: '1 of them' },
  { id: 'wildcard-all', label: 'All of <prefix>*' },
  { id: 'wildcard-any', label: '1 of <prefix>*' },
];

/** Build a canonical condition string from a guided-builder UI choice. Pure
 *  + exported so the client script and the test suite share one code path. */
export function buildConditionString(type: SigmaConditionUiType, opts: { prefix?: string; names?: string[] } = {}): string {
  switch (type) {
    case 'them-any':
      return '1 of them';
    case 'them-all':
      return 'all of them';
    case 'wildcard-any':
      return `1 of ${(opts.prefix || 'selection').trim()}*`;
    case 'wildcard-all':
      return `all of ${(opts.prefix || 'selection').trim()}*`;
    case 'list-and':
      return (opts.names ?? []).join(' and ');
    case 'list-or':
      return (opts.names ?? []).join(' or ');
    default:
      return '';
  }
}

// ---------------------------------------------------------------------------
// Rule evaluation (ties selections + condition together for one event)
// ---------------------------------------------------------------------------

export interface RuleEvalResult {
  matched: boolean;
  matchedSelections: string[];
  selectionResults: Record<string, boolean>;
  conditionError: string | null;
}

export function evaluateRule(rule: SigmaRule, event: Record<string, unknown>): RuleEvalResult {
  const selectionResults: Record<string, boolean> = {};
  for (const sel of rule.selections) selectionResults[sel.name] = selectionMatches(sel, event);
  const { matched, matchedSelections, error } = evaluateCondition(rule.condition, rule.selections, event);
  return { matched, matchedSelections, selectionResults, conditionError: error };
}

// ---------------------------------------------------------------------------
// Sample-event parsing — auto-detect JSON vs. key=value per line
// ---------------------------------------------------------------------------

const KV_RE = /([A-Za-z0-9_.]+)=("([^"]*)"|'([^']*)'|(\S+))/g;

/** Parse one line of pasted sample-event text as either JSON (tried first)
 *  or whitespace-separated key=value tokens (fallback). Returns null for a
 *  blank line or a line that matches neither shape — callers should render
 *  that as a friendly per-line "couldn't parse this line" note, never throw. */
export function parseEventLine(line: string): Record<string, unknown> | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Not JSON — fall through to key=value parsing.
  }

  const out: Record<string, unknown> = {};
  let match: RegExpExecArray | null;
  let found = false;
  KV_RE.lastIndex = 0;
  while ((match = KV_RE.exec(trimmed))) {
    found = true;
    const key = match[1];
    const value = match[3] !== undefined ? match[3] : match[4] !== undefined ? match[4] : match[5];
    out[key] = value;
  }
  return found ? out : null;
}

// ---------------------------------------------------------------------------
// Read-only YAML generation (builder state -> display, one-way — see file header)
// ---------------------------------------------------------------------------

function yamlScalar(value: string): string {
  if (value === '') return "''";
  const looksReserved = /^(true|false|null|~|yes|no)$/i.test(value) || /^-?\d+(\.\d+)?$/.test(value);
  const needsQuote = looksReserved || /^\s|\s$|[:#[\]{}&*!|>'"%@`]/.test(value);
  if (!needsQuote) return value;
  return `'${value.replace(/'/g, "''")}'`;
}

/** Render the current builder state as Sigma-flavored YAML. This is a
 *  display-only, one-way renderer (see file header) — there is no matching
 *  parser, and the rendered rule intentionally omits logsource/level/tags/
 *  and other metadata this tool doesn't collect. Incomplete rows (blank
 *  field name or value) are skipped rather than emitted half-written. */
export function generateYaml(rule: SigmaRule): string {
  const lines: string[] = [
    '# Generated from the builder above (read-only preview) — title + detection',
    '# only. logsource, level, tags, and other Sigma fields are outside this',
    '# tool’s scope; this is not a general Sigma YAML editor.',
    `title: ${yamlScalar(rule.title || 'Untitled rule')}`,
    'detection:',
  ];
  for (const sel of rule.selections) {
    const name = sel.name.trim() || 'selection';
    const fields = sel.fields.filter((f) => f.field.trim() && f.value.trim());
    lines.push(`  ${name}:`);
    if (fields.length === 0) {
      lines.push('    {}');
      continue;
    }
    for (const f of fields) {
      const key = f.modifier === 'equals' ? f.field : `${f.field}|${f.modifier}`;
      lines.push(`    ${key}: ${yamlScalar(f.value)}`);
    }
  }
  lines.push(`  condition: ${rule.condition.trim() || '<no condition set>'}`);
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Starter example content — CLEARLY FABRICATED for illustration, not a real
// captured detection or real telemetry (see CLAUDE.md "Content accuracy").
// ---------------------------------------------------------------------------

export const STARTER_RULE: SigmaRule = {
  title: 'Suspicious PowerShell EncodedCommand Usage (fabricated example)',
  selections: [
    { name: 'selection_process', fields: [{ field: 'Image', modifier: 'endswith', value: '\\powershell.exe' }] },
    { name: 'selection_cli', fields: [{ field: 'CommandLine', modifier: 'contains', value: '-EncodedCommand' }] },
  ],
  condition: 'selection_process and selection_cli',
};

export const STARTER_EVENTS = [
  '{"EventID": 4104, "Image": "C:\\\\Windows\\\\System32\\\\WindowsPowerShell\\\\v1.0\\\\powershell.exe", "CommandLine": "powershell.exe -EncodedCommand SQBmACgAJABQAFMAVgBlAHIAcwBpAG8AbgBUAGEAYgBsAGUA"}',
  '{"EventID": 4104, "Image": "C:\\\\Windows\\\\System32\\\\cmd.exe", "CommandLine": "cmd.exe /c whoami"}',
].join('\n');
