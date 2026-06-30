// Per-term decorative glyphs for the glossary cards. Each term gets a unique
// monochrome Unicode symbol, shown as a faint watermark in the card's top-right
// corner (see pages/glossary/index.astro). The pool is drawn from four fully
// assigned, text-presentation Unicode blocks — no color-emoji, all of which render
// across the common system symbol fonts:
//   Mathematical Operators (U+2200–22FF), Arrows (U+2190–21FF),
//   Geometric Shapes (U+25A0–25FF), Supplemental Arrows-B (U+2900–297F).
// That's ~592 glyphs for ~520 terms, so every term maps to a distinct symbol with
// headroom; `test/securityTerms.test.ts` fails if the bank ever outgrows the pool.

function range(start: number, end: number): string[] {
  const out: string[] = [];
  for (let cp = start; cp <= end; cp++) out.push(String.fromCodePoint(cp));
  return out;
}

export const TERM_GLYPHS: string[] = [
  ...range(0x2200, 0x22ff), // Mathematical Operators
  ...range(0x2190, 0x21ff), // Arrows
  ...range(0x25a0, 0x25ff), // Geometric Shapes
  ...range(0x2900, 0x297f), // Supplemental Arrows-B
];

// FNV-1a — a small, stable string hash (no crypto needed; just a spread of bits).
function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Map each slug to a unique glyph. Hashing gives each term a stable starting slot;
 * linear probing resolves collisions so no two terms share a symbol (as long as the
 * pool is larger than the bank). Iterates slugs in sorted order so the result is
 * deterministic regardless of how the caller orders them.
 */
export function assignTermSymbols(slugs: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  const used = new Set<string>();
  for (const slug of [...slugs].sort()) {
    let h = fnv1a(slug) % TERM_GLYPHS.length;
    let tries = 0;
    while (used.has(TERM_GLYPHS[h]) && tries < TERM_GLYPHS.length) {
      h = (h + 1) % TERM_GLYPHS.length;
      tries++;
    }
    const glyph = TERM_GLYPHS[h];
    map[slug] = glyph;
    used.add(glyph);
  }
  return map;
}
