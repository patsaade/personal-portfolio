// Guards docs/STYLE_GUIDE.md's "never hard-code a color" rule with an actual
// check, rather than leaving it as prose alone — a hardcoded `color: 'white'`
// on a `primary`-filled button (readable in some themes, ~2:1 contrast and
// unreadable in others) shipped to production three times before this test
// existed, because nothing enforced the rule.
//
// Scans every component/page/layout source file for a color-related Panda
// css() property (color, bg, background, backgroundColor, borderColor, fill,
// stroke) whose value is a literal hex code or a bare CSS color keyword
// (white/black) — both bypass the semantic token system, so neither adapts
// across the site's 10 themes. `src/themes.ts` (the token *definitions*
// themselves) and `panda.config.ts` (token/recipe base values) are the only
// legitimate places for literal color values and are excluded.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const EXCLUDED = new Set([path.join(SRC, 'themes.ts')]);

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(astro|ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const COLOR_PROP = '(?:color|bg|background|backgroundColor|borderColor|fill|stroke)';
const HARDCODED_VALUE = /(['"])(#[0-9a-fA-F]{3,8}|white|black)\1/;
const VIOLATION = new RegExp(`\\b${COLOR_PROP}\\s*:\\s*${HARDCODED_VALUE.source}`, 'g');

describe('no hardcoded colors outside the theme definitions', () => {
  const files = walk(SRC).filter((f) => !EXCLUDED.has(f));

  it('found source files to check (sanity check the walker itself)', () => {
    expect(files.length).toBeGreaterThan(50);
  });

  for (const file of files) {
    const rel = path.relative(ROOT, file);
    it(`${rel} has no hardcoded color property values`, () => {
      const content = fs.readFileSync(file, 'utf8');
      const hits: string[] = [];
      let m: RegExpExecArray | null;
      VIOLATION.lastIndex = 0;
      while ((m = VIOLATION.exec(content))) {
        const line = content.slice(0, m.index).split('\n').length;
        hits.push(`line ${line}: ${m[0]}`);
      }
      expect(hits, `${rel} — use a semantic token (see docs/STYLE_GUIDE.md § Color & theming) instead of:\n${hits.join('\n')}`).toEqual([]);
    });
  }
});
