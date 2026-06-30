import { describe, it, expect } from 'vitest';
import {
  SECURITY_TERMS,
  CATEGORIES,
  CATEGORY_META,
  termBySlug,
  daySerial,
  termIndexForDay,
  termForDate,
} from '../src/data/securityTerms';
import { assignTermSymbols, TERM_GLYPHS } from '../src/data/termSymbols';

const slugs = new Set(SECURITY_TERMS.map((t) => t.slug));

describe('security term bank', () => {
  it('has a healthy number of terms', () => {
    expect(SECURITY_TERMS.length).toBeGreaterThanOrEqual(20);
  });

  it('has unique slugs', () => {
    expect(slugs.size).toBe(SECURITY_TERMS.length);
  });

  it('uses url-safe, lowercase slugs', () => {
    for (const t of SECURITY_TERMS) {
      expect(t.slug, t.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it('gives every term complete, non-empty content', () => {
    for (const t of SECURITY_TERMS) {
      for (const field of ['term', 'short', 'definition', 'significance', 'example'] as const) {
        expect(t[field].trim().length, `${t.slug}.${field}`).toBeGreaterThan(0);
      }
    }
  });

  it('assigns every term a known category', () => {
    for (const t of SECURITY_TERMS) {
      expect(CATEGORIES, t.slug).toContain(t.category);
      expect(CATEGORY_META[t.category]).toBeTruthy();
    }
  });

  it('keeps ticker one-liners short', () => {
    for (const t of SECURITY_TERMS) {
      expect(t.short.length, `${t.slug} short`).toBeLessThanOrEqual(90);
    }
  });

  it('cross-links only to real terms, never to itself', () => {
    for (const t of SECURITY_TERMS) {
      for (const r of t.related) {
        expect(slugs.has(r), `${t.slug} → ${r}`).toBe(true);
        expect(r, `${t.slug} self-link`).not.toBe(t.slug);
      }
    }
  });
});

describe('term symbols', () => {
  it('has a glyph pool larger than the term bank', () => {
    expect(TERM_GLYPHS.length).toBeGreaterThan(SECURITY_TERMS.length);
  });

  it('assigns a unique, non-empty glyph to every term', () => {
    const all = [...slugs];
    const map = assignTermSymbols(all);
    const glyphs = all.map((s) => map[s]);
    expect(glyphs.every((g) => typeof g === 'string' && g.length > 0)).toBe(true);
    expect(new Set(glyphs).size).toBe(all.length); // no two terms share a symbol
  });

  it('is deterministic regardless of input order', () => {
    const a = assignTermSymbols([...slugs]);
    const b = assignTermSymbols([...slugs].reverse());
    expect(b).toEqual(a);
  });
});

describe('termBySlug', () => {
  it('resolves a known slug and rejects an unknown one', () => {
    expect(termBySlug(SECURITY_TERMS[0].slug)?.slug).toBe(SECURITY_TERMS[0].slug);
    expect(termBySlug('not-a-real-term')).toBeUndefined();
  });
});

describe('daySerial', () => {
  it('advances by exactly 1 per calendar day', () => {
    expect(daySerial(2026, 5, 20) - daySerial(2026, 5, 19)).toBe(1);
  });

  it('spans 365 days across a non-leap year', () => {
    expect(daySerial(2026, 0, 1) - daySerial(2025, 0, 1)).toBe(365);
  });

  it('accounts for a leap day', () => {
    // 2024 is a leap year: Jan (31) + Feb (29) = 60 days to Mar 1.
    expect(daySerial(2024, 2, 1) - daySerial(2024, 0, 1)).toBe(60);
  });
});

describe('termIndexForDay', () => {
  const n = SECURITY_TERMS.length;

  it('always returns an in-range index', () => {
    for (let s = -5; s < n * 3 + 5; s++) {
      const i = termIndexForDay(s);
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThan(n);
    }
  });

  it('wraps cleanly at the boundaries', () => {
    expect(termIndexForDay(0)).toBe(0);
    expect(termIndexForDay(n)).toBe(0);
    expect(termIndexForDay(n - 1)).toBe(n - 1);
    expect(termIndexForDay(-1)).toBe(n - 1);
  });

  it('cycles through the whole bank exactly once per period', () => {
    const seen = new Set<number>();
    for (let s = 1000; s < 1000 + n; s++) seen.add(termIndexForDay(s));
    expect(seen.size).toBe(n);
  });
});

describe('termForDate', () => {
  it('is deterministic for a given date', () => {
    const a = termForDate(new Date(Date.UTC(2026, 5, 19)));
    const b = termForDate(new Date(Date.UTC(2026, 5, 19)));
    expect(a.slug).toBe(b.slug);
  });

  it('keys off the UTC calendar day (same term regardless of runner timezone)', () => {
    // Two instants on the same UTC day but far apart within it resolve identically.
    const morning = termForDate(new Date('2026-06-19T00:30:00Z'));
    const evening = termForDate(new Date('2026-06-19T23:30:00Z'));
    expect(morning.slug).toBe(evening.slug);
    expect(morning.slug).toBe(SECURITY_TERMS[termIndexForDay(daySerial(2026, 5, 19))].slug);
  });

  it('advances to the next term the following day', () => {
    const d1 = new Date(Date.UTC(2026, 5, 19));
    const d2 = new Date(Date.UTC(2026, 5, 20));
    const i1 = termIndexForDay(daySerial(2026, 5, 19));
    const i2 = termIndexForDay(daySerial(2026, 5, 20));
    expect(i2).toBe((i1 + 1) % SECURITY_TERMS.length);
    expect(termForDate(d1).slug).toBe(SECURITY_TERMS[i1].slug);
    expect(termForDate(d2).slug).toBe(SECURITY_TERMS[i2].slug);
  });
});
