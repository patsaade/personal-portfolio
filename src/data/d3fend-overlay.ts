// Curated overlay for D3FEND techniques — glossary links + bespoke DFIR framing
// (significance / example), mirroring attack-overlay.ts. Hand-maintained; merged
// onto the generated MITRE data in d3fend.ts. Add an entry to enrich a technique's
// detail page with a "Why it matters" / "In practice" section — same pattern the
// ATT&CK Map already uses for its 34 curated techniques.
//
// Empty on purpose: this is plumbing, not content. Populating it is genuine DFIR
// analyst authorship (the site's own voice, not generic/AI-invented text) — see
// docs/STYLE_GUIDE.md's Voice & tone and Content accuracy sections before adding
// entries. Until an entry exists for a technique, its detail page renders MITRE's
// own Definition + How it works only, same as every technique renders today.
export interface D3fendOverlay {
  glossarySlug?: string;
  significance?: string;
  example?: string;
}

export const D3FEND_OVERLAY: Record<string, D3fendOverlay> = {};
