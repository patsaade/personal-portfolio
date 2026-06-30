// Generate src/data/d3fend-techniques.generated.ts from MITRE D3FEND's official
// ontology + the inferred D3FEND→ATT&CK mappings. Mirrors gen-attack-map.mjs.
//
// Usage:
//   curl -sL -o /tmp/d3fend.json https://d3fend.mitre.org/ontologies/d3fend.json
//   curl -sL -o /tmp/d3fend-mappings.json \
//     https://d3fend.mitre.org/api/ontology/inference/d3fend-full-mappings.json
//   node scripts/gen-d3fend-map.mjs /tmp/d3fend.json /tmp/d3fend-mappings.json
//
// D3FEND models defensive techniques as OWL classes carrying a `d3fend-id`
// (D3-XX). Each base technique is `subClassOf [d3f:enables some <Tactic>]`; sub-
// techniques inherit the tactic via the class hierarchy. ATT&CK counter-mappings
// are not in the ontology directly (they're inferred through digital artifacts),
// so they come from the separate inference (SPARQL results) file.
import fs from 'node:fs';

const [, , ontPath, mapPath] = process.argv;
if (!ontPath) {
  console.error('Usage: node scripts/gen-d3fend-map.mjs <d3fend.json> [<d3fend-full-mappings.json>]');
  process.exit(1);
}

const graph = JSON.parse(fs.readFileSync(ontPath, 'utf8'))['@graph'];
const byId = {};
for (const n of graph) byId[n['@id']] = n;

const arr = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);
const lit = (x) => arr(x).map((v) => (v && v['@value'] != null ? v['@value'] : v)).filter((v) => typeof v === 'string');
const ids = (x) => arr(x).map((v) => (v && v['@id'] ? v['@id'] : v)).filter((v) => typeof v === 'string');

// ── Tactics (the 7 D3FEND tactics, in display order) ──────────────────────
const TACTIC_IDS = ['d3f:Model', 'd3f:Harden', 'd3f:Detect', 'd3f:Isolate', 'd3f:Deceive', 'd3f:Evict', 'd3f:Restore'];
const tactics = TACTIC_IDS.map((id) => {
  const n = byId[id] || {};
  return { id, name: lit(n['rdfs:label'])[0] || id.split(':').pop(), definition: lit(n['d3f:definition'])[0] || '', order: Number(lit(n['d3f:display-order'])[0] ?? 99) };
}).sort((a, b) => a.order - b.order);
const TACTIC_ORDER = tactics.map((t) => t.name);

// ── Techniques ────────────────────────────────────────────────────────────
const techNodes = graph.filter((n) => arr(n['@type']).includes('owl:Class') && lit(n['d3f:d3fend-id']).length);

// Class-parent technique ids (subClassOf entries that are themselves techniques).
const classParents = (n) => ids(n['rdfs:subClassOf']).filter((s) => byId[s] && lit(byId[s]['d3f:d3fend-id']).length);
// A base technique declares `subClassOf [d3f:enables some <Tactic>]`.
const enablesTactic = (n) => {
  for (const sid of ids(n['rdfs:subClassOf'])) {
    const r = byId[sid];
    if (r && ids(r['owl:onProperty'])[0] === 'd3f:enables') {
      const t = ids(r['owl:someValuesFrom'])[0];
      if (TACTIC_IDS.includes(t)) return t;
    }
  }
  return null;
};
// Resolve a technique's tactic by walking up the class hierarchy to the base technique.
const tacticCache = {};
function tacticOf(atId, seen = new Set()) {
  if (tacticCache[atId]) return tacticCache[atId];
  if (seen.has(atId)) return null;
  seen.add(atId);
  const n = byId[atId];
  if (!n) return null;
  const direct = enablesTactic(n);
  if (direct) return (tacticCache[atId] = direct);
  for (const p of classParents(n)) {
    const t = tacticOf(p, seen);
    if (t) return (tacticCache[atId] = t);
  }
  return null;
}

// ── ATT&CK counter-mappings (optional second file) ────────────────────────
const counters = {}; // local name → Set(ATT&CK ids)
if (mapPath) {
  const bindings = JSON.parse(fs.readFileSync(mapPath, 'utf8')).results.bindings;
  for (const r of bindings) {
    if (!r.def_tech || !r.off_tech_id) continue;
    const local = r.def_tech.value.split('#').pop();
    (counters[local] ||= new Set()).add(r.off_tech_id.value);
  }
}

// Pull the authoritative "How it works" section out of a technique's kb-article
// (markdown) for use as the on-page example. Empty when the article has no such section.
const howItWorks = (kb) => {
  if (!kb) return '';
  const m = kb.match(/##+\s*How it works\b([\s\S]*?)(?=\n##+\s|$)/i);
  return m ? m[1].replace(/\s*\n\s*/g, ' ').replace(/\s{2,}/g, ' ').trim() : '';
};

const nameById = {};
for (const t of tactics) nameById[t.id] = t.name;

const techniques = techNodes
  .map((n) => {
    const local = n['@id'].split(':').pop();
    const tacticId = tacticOf(n['@id']);
    const parents = classParents(n);
    const parentId = parents.length ? lit(byId[parents[0]]['d3f:d3fend-id'])[0] : null;
    return {
      id: lit(n['d3f:d3fend-id'])[0],
      name: lit(n['rdfs:label'])[0],
      tactic: tacticId ? nameById[tacticId] : 'Other',
      parentId: parentId ?? null,
      definition: (lit(n['d3f:definition'])[0] || '').trim(),
      howItWorks: howItWorks(lit(n['d3f:kb-article'])[0]),
      url: `https://d3fend.mitre.org/technique/${n['@id']}/`,
      counters: [...(counters[local] || [])].sort(),
    };
  })
  .filter((t) => t.id && t.name && t.tactic !== 'Other')
  .sort((a, b) => a.id.localeCompare(b.id));

// Version (ontology header → owl:versionInfo), fall back to today.
const ontology = graph.find((n) => arr(n['@type']).includes('owl:Ontology')) || {};
const version = lit(ontology['owl:versionInfo'])[0] || 'latest';

const banner = `// AUTO-GENERATED by scripts/gen-d3fend-map.mjs from MITRE D3FEND's official
// ontology + inferred ATT&CK mappings. Do not edit by hand — re-run the script.
// D3FEND version: ${version}\n`;

const body = `${banner}
export interface D3fendTechnique {
  id: string; // D3-XX
  name: string;
  tactic: string; // one of D3FEND_TACTIC_ORDER
  parentId: string | null; // parent technique's D3-id (lineage), or null for a base technique
  definition: string;
  howItWorks: string; // MITRE's "How it works" example (from the kb-article), or ''
  url: string; // canonical D3FEND page
  counters: string[]; // ATT&CK technique IDs this defensive technique counters
}

export const D3FEND_VERSION = ${JSON.stringify(version)};
export const D3FEND_TACTIC_ORDER: string[] = ${JSON.stringify(TACTIC_ORDER)};
export const D3FEND_TACTICS: { name: string; definition: string }[] = ${JSON.stringify(tactics.map((t) => ({ name: t.name, definition: t.definition })))};
export const D3FEND_GENERATED: D3fendTechnique[] = ${JSON.stringify(techniques)};
`;

const outPath = 'src/data/d3fend-techniques.generated.ts';
fs.writeFileSync(outPath, body);
const mapped = techniques.filter((t) => t.counters.length).length;
console.log(`Wrote ${outPath}`);
console.log(`  D3FEND ${version}: ${techniques.length} techniques across ${TACTIC_ORDER.length} tactics; ${mapped} map to ATT&CK`);
