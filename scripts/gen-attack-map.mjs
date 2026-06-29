// Regenerate the ATT&CK technique dataset from MITRE's official Enterprise STIX
// bundle so names, IDs, tactics, URLs, definitions, AND the per-technique reference
// content (platforms, detection telemetry, real-world procedure examples, and
// mitigations) are authoritative — never hand-invented.
//
//   node scripts/gen-attack-map.mjs <path-to-enterprise-attack.json>
//
// Source bundle (≈50 MB, not committed):
//   https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack.json
//
// Emits:
//   src/data/attack-techniques.generated.ts — every base technique (+ any curated
//       sub-technique) with summary, description, platforms, detection[] (data
//       source:component telemetry, from `detects` relationships), examples[]
//       (procedure examples from group/software `uses` relationships) + the total
//       count, and mitigations[]. AUTO-GENERATED; do not hand-edit.
//   src/data/attack-overlay.ts — curated glossary links + bespoke significance /
//       example, keyed by id. Hand-maintained; only written on first migration.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const STIX = process.argv[2] || path.join(ROOT, 'enterprise-attack.json');
const objects = JSON.parse(fs.readFileSync(STIX, 'utf8')).objects || [];

// Caps keep the generated file (and each prerendered page) a sane size.
const MAX_EXAMPLES = 4;
const MAX_MITIGATIONS = 5;
const MAX_DETECTION = 10;

// ── clean MITRE markdown (strip citations, links → text, code/emphasis) ───────
function strip(s) {
  return String(s || '')
    .replace(/\(Citation:[^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<\/?code>/g, '')
    .replace(/[*`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
// One clean sentence (cards + meta description).
function summarize(desc) {
  const s = strip(desc);
  const parts = s.split(/(?<=\.)\s+/);
  let out = parts[0] || s;
  if (out.length < 60 && parts[1]) out += ' ' + parts[1];
  return out.length > 240 ? out.slice(0, 237).replace(/\s+\S*$/, '') + '…' : out;
}
// Fuller cleaned text, cut at a sentence boundary near `max`.
function trimTo(desc, max) {
  let s = strip(desc);
  if (s.length <= max) return s;
  s = s.slice(0, max);
  const dot = s.lastIndexOf('. ');
  return dot > max * 0.5 ? s.slice(0, dot + 1) : s.replace(/\s+\S*$/, '') + '…';
}
function ref(o) {
  const r = (o.external_references || []).find((x) => x.source_name === 'mitre-attack' && x.external_id);
  return r ? { id: r.external_id, url: r.url } : null;
}

// ── tactics + kill-chain order ────────────────────────────────────────────────
const tacticName = {}, tacticById = {};
for (const o of objects) {
  if (o.type === 'x-mitre-tactic' && !o.revoked) {
    if (o.x_mitre_shortname) tacticName[o.x_mitre_shortname] = o.name;
    tacticById[o.id] = o.name;
  }
}
const matrix = objects.find((o) => o.type === 'x-mitre-matrix' && !o.revoked);
const tacticOrder = matrix ? (matrix.tactic_refs || []).map((id) => tacticById[id]).filter(Boolean) : [];

// ── lookups for relationship resolution ───────────────────────────────────────
// v19 detection model: technique ← detects ← detection-strategy → analytics →
// log-source references → data components. We surface the data-component names as a
// technique's "detection telemetry" (e.g. Process Creation, Command Execution).
const nameById = {}; // any named object → name
const dcName = {};   // x-mitre-data-component id → name
for (const o of objects) {
  if (o.name) nameById[o.id] = o.name;
  if (o.type === 'x-mitre-data-component') dcName[o.id] = o.name;
}
const analyticDC = {}; // analytic id → Set(data-component names)
for (const o of objects) {
  if (o.type !== 'x-mitre-analytic' || o.x_mitre_deprecated) continue;
  const s = new Set();
  for (const ls of o.x_mitre_log_source_references || []) { const n = dcName[ls.x_mitre_data_component_ref]; if (n) s.add(n); }
  analyticDC[o.id] = s;
}
const stratDC = {}; // detection-strategy id → Set(data-component names)
for (const o of objects) {
  if (o.type !== 'x-mitre-detection-strategy' || o.x_mitre_deprecated) continue;
  const s = new Set();
  for (const aref of o.x_mitre_analytic_refs || []) for (const n of analyticDC[aref] || []) s.add(n);
  stratDC[o.id] = s;
}

// ── relationships → per-technique examples / mitigations / detection ──────────
const examples = {}, mitigations = {}, detection = {};
for (const o of objects) {
  if (o.type !== 'relationship' || o.revoked) continue;
  const t = o.target_ref;
  if (o.relationship_type === 'uses' && o.description && nameById[o.source_ref]) {
    (examples[t] ??= []).push({ source: nameById[o.source_ref], text: trimTo(o.description, 240) });
  } else if (o.relationship_type === 'mitigates') {
    (mitigations[t] ??= []).push({ name: nameById[o.source_ref] || '', text: trimTo(o.description, 180) });
  } else if (o.relationship_type === 'detects') {
    const s = stratDC[o.source_ref];
    if (s && s.size) { detection[t] ??= new Set(); for (const n of s) detection[t].add(n); }
  }
}

// ── techniques ────────────────────────────────────────────────────────────────
const byId = {};
for (const o of objects) {
  if (o.type !== 'attack-pattern' || o.revoked || o.x_mitre_deprecated) continue;
  const r = ref(o);
  if (!r) continue;
  const tactics = [...new Set((o.kill_chain_phases || []).filter((p) => p.kill_chain_name === 'mitre-attack').map((p) => tacticName[p.phase_name]).filter(Boolean))];
  byId[r.id] = {
    id: r.id, name: o.name, tactics, url: r.url,
    summary: summarize(o.description),
    description: trimTo(o.description, 500),
    platforms: o.x_mitre_platforms || [],
    sub: !!o.x_mitre_is_subtechnique,
    stix: o.id,
  };
}

// ── curated overlay (preserve existing; migrate from references.ts once) ──────
const overlayPath = path.join(ROOT, 'src/data/attack-overlay.ts');
let overlay = {};
if (fs.existsSync(overlayPath)) {
  const m = fs.readFileSync(overlayPath, 'utf8').match(/ATTACK_OVERLAY[^=]*=\s*(\{[\s\S]*?\n\};)/);
  if (m) overlay = JSON.parse(m[1].replace(/;\s*$/, '').replace(/,(\s*[\]}])/g, '$1'));
} else {
  const src = fs.readFileSync(path.join(ROOT, 'src/data/references.ts'), 'utf8');
  const m = src.match(/ATTACK_TECHNIQUES:\s*AttackTechnique\[\]\s*=\s*(\[[\s\S]*?\n\];)/);
  if (m) for (const c of JSON.parse(m[1].replace(/;\s*$/, '').replace(/,(\s*[\]}])/g, '$1'))) {
    const e = {};
    if (c.glossarySlug) e.glossarySlug = c.glossarySlug;
    if (c.summary) e.summary = c.summary;
    if (c.significance) e.significance = c.significance;
    if (c.example) e.example = c.example;
    overlay[c.id] = e;
  }
}

// ── assemble: every base technique + any curated sub-technique ────────────────
const wanted = new Set(Object.values(byId).filter((t) => !t.sub).map((t) => t.id));
for (const id of Object.keys(overlay)) wanted.add(id);

const out = [];
for (const id of [...wanted].sort()) {
  const t = byId[id];
  if (!t) { console.warn('  overlay id missing from STIX (skipped):', id); continue; }
  const allEx = examples[t.stix] || [];
  const ex = allEx.slice().sort((a, b) => (a.source < b.source ? -1 : 1)).slice(0, MAX_EXAMPLES).map((e) => e.text);
  const seen = new Set();
  const mit = (mitigations[t.stix] || [])
    .filter((m) => m.name && !seen.has(m.name) && seen.add(m.name))
    .slice(0, MAX_MITIGATIONS)
    .map((m) => ({ name: m.name, text: m.text }));
  const det = [...(detection[t.stix] || [])].sort().slice(0, MAX_DETECTION);
  const rec = { id: t.id, name: t.name, tactics: t.tactics, url: t.url, summary: t.summary, description: t.description, platforms: t.platforms };
  if (det.length) rec.detection = det;
  if (ex.length) { rec.examples = ex; rec.examplesTotal = allEx.length; }
  if (mit.length) rec.mitigations = mit;
  out.push(rec);
}

const attackVer = (objects.find((o) => o.type === 'x-mitre-collection') || {}).x_mitre_version || '?';
const iface =
  'export interface GeneratedTechnique {\n' +
  '  id: string;\n  name: string;\n  tactics: string[];\n  url: string;\n' +
  '  /** One-line summary (cards, meta description). */\n  summary: string;\n' +
  '  /** Fuller MITRE description — the detail-page definition. */\n  description: string;\n' +
  '  /** Platforms the technique applies to. */\n  platforms: string[];\n' +
  '  /** "Data source: component" telemetry that detects it. */\n  detection?: string[];\n' +
  '  /** Real-world procedure examples (adversary / software use). */\n  examples?: string[];\n' +
  '  /** Total documented uses (examples is a capped sample). */\n  examplesTotal?: number;\n' +
  '  /** Mitigations with MITRE technique-specific guidance. */\n  mitigations?: { name: string; text: string }[];\n' +
  '}\n\n';
const genFile =
  '// AUTO-GENERATED by scripts/gen-attack-map.mjs from the MITRE ATT&CK Enterprise\n' +
  `// STIX bundle (v${attackVer}). Do not edit by hand — re-run the script to refresh.\n\n` +
  `/** The ATT&CK Enterprise version this dataset was generated from. */\nexport const ATTACK_VERSION = '${attackVer}';\n\n` +
  '/** Tactics in kill-chain order, straight from the ATT&CK matrix definition. */\n' +
  'export const ATTACK_TACTIC_ORDER: string[] = ' + JSON.stringify(tacticOrder, null, 2) + ';\n\n' +
  iface +
  '// Compact one-line array (generated; not meant to be hand-reviewed).\n' +
  'export const ATTACK_GENERATED: GeneratedTechnique[] = ' + JSON.stringify(out) + ';\n';
fs.writeFileSync(path.join(ROOT, 'src/data/attack-techniques.generated.ts'), genFile);

if (!fs.existsSync(overlayPath)) {
  const ovHeader =
    '// Curated overlay for ATT&CK techniques — glossary links + bespoke DFIR framing\n' +
    '// (summary / significance / example). Hand-maintained; merged onto the generated\n' +
    '// MITRE data in references.ts. Add an entry to enrich a technique’s detail page.\n' +
    'export interface AttackOverlay {\n  glossarySlug?: string;\n  summary?: string;\n  significance?: string;\n  example?: string;\n}\n\n' +
    'export const ATTACK_OVERLAY: Record<string, AttackOverlay> = ';
  fs.writeFileSync(overlayPath, ovHeader + JSON.stringify(overlay, null, 2) + ';\n');
}

console.log('wrote', out.length, 'techniques (v' + attackVer + ');', Object.keys(overlay).length, 'curated overlay entries');
