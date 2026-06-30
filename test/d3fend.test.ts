import { describe, it, expect } from 'vitest';
import {
  D3FEND_TECHNIQUES,
  D3FEND_TACTIC_ORDER,
  D3FEND_TACTICS,
  d3fendById,
  d3fendCountering,
} from '../src/data/d3fend';

const ids = new Set(D3FEND_TECHNIQUES.map((t) => t.id));

describe('D3FEND dataset', () => {
  it('has the full matrix across 7 tactics', () => {
    expect(D3FEND_TACTIC_ORDER.length).toBe(7);
    expect(D3FEND_TECHNIQUES.length).toBeGreaterThan(200);
  });

  it('uses unique D3-style ids', () => {
    expect(ids.size).toBe(D3FEND_TECHNIQUES.length);
    for (const t of D3FEND_TECHNIQUES) expect(t.id).toMatch(/^D3F?-[A-Z0-9]+$/);
  });

  it('assigns every technique a known tactic', () => {
    const order = new Set(D3FEND_TACTIC_ORDER);
    for (const t of D3FEND_TECHNIQUES) expect(order.has(t.tactic)).toBe(true);
  });

  it('points every parentId at a real technique (or null)', () => {
    for (const t of D3FEND_TECHNIQUES) {
      if (t.parentId !== null) expect(ids.has(t.parentId)).toBe(true);
    }
  });

  it('gives each technique a definition and a canonical D3FEND url', () => {
    for (const t of D3FEND_TECHNIQUES) {
      expect(t.name.length).toBeGreaterThan(0);
      expect(t.url).toMatch(/^https:\/\/d3fend\.mitre\.org\/technique\//);
    }
  });

  it('records ATT&CK counter-mappings as valid technique ids', () => {
    let withCounters = 0;
    for (const t of D3FEND_TECHNIQUES) {
      if (t.counters.length) withCounters++;
      for (const c of t.counters) expect(c).toMatch(/^T\d{4}(\.\d{3})?$/);
      expect(new Set(t.counters).size).toBe(t.counters.length); // no dupes
    }
    expect(withCounters).toBeGreaterThan(50);
  });

  it('every tactic in the order has a definition', () => {
    const defined = new Set(D3FEND_TACTICS.filter((t) => t.definition).map((t) => t.name));
    for (const name of D3FEND_TACTIC_ORDER) expect(defined.has(name)).toBe(true);
  });
});

describe('d3fend helpers', () => {
  it('resolves a known id and rejects an unknown one', () => {
    const any = D3FEND_TECHNIQUES[0];
    expect(d3fendById(any.id)?.id).toBe(any.id);
    expect(d3fendById('D3-NOPE')).toBeUndefined();
  });

  it('inverts counters: d3fendCountering returns techniques that list the ATT&CK id', () => {
    const mapped = D3FEND_TECHNIQUES.find((t) => t.counters.length)!;
    const attackId = mapped.counters[0];
    const defenders = d3fendCountering(attackId);
    expect(defenders.some((d) => d.id === mapped.id)).toBe(true);
    for (const d of defenders) expect(d.counters).toContain(attackId);
  });
});
