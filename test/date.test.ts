import { describe, it, expect } from 'vitest';
import { getFormattedDate, getISODate } from '../src/utils/date';

describe('getFormattedDate', () => {
  it('formats as "Mon D, YYYY"', () => {
    const out = getFormattedDate(new Date(2026, 0, 15)); // local Jan 15 2026
    expect(out).toMatch(/^[A-Z][a-z]{2} \d{1,2}, 2026$/);
    expect(out).toContain('Jan');
  });
});

describe('getISODate', () => {
  it('returns a YYYY-MM-DD string', () => {
    expect(getISODate(new Date('2026-01-15T12:00:00Z'))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
