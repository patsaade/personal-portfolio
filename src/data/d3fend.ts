// MITRE D3FEND — the defensive counterpart to ATT&CK. Drives the /d3fend/ map and
// the per-technique /d3fend/[id]/ pages. The dataset is generated from MITRE's
// official D3FEND ontology + inferred ATT&CK mappings by scripts/gen-d3fend-map.mjs
// → d3fend-techniques.generated.ts (re-run to refresh). Each technique knows the
// ATT&CK techniques it `counters`, which powers the two-way cross-link with the
// MITRE ATT&CK Map (a D3FEND technique lists what it defends against; an ATT&CK
// technique lists the D3FEND countermeasures).
import {
  D3FEND_GENERATED,
  D3FEND_TACTIC_ORDER,
  D3FEND_TACTICS,
  D3FEND_VERSION,
  type D3fendTechnique,
} from './d3fend-techniques.generated';

export { D3FEND_TACTIC_ORDER, D3FEND_TACTICS, D3FEND_VERSION };
export type { D3fendTechnique };

export const D3FEND_TECHNIQUES = D3FEND_GENERATED;

export const d3fendById = (id: string): D3fendTechnique | undefined =>
  D3FEND_TECHNIQUES.find((t) => t.id === id);

/** D3FEND techniques that counter a given ATT&CK technique id (reverse cross-link). */
export function d3fendCountering(attackId: string): D3fendTechnique[] {
  return D3FEND_TECHNIQUES.filter((t) => t.counters.includes(attackId));
}
