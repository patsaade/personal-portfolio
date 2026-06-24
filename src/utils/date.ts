// Date formatting helpers. One shared Intl formatter (constructing it is the
// expensive part) for human display; ISO for machine-readable `datetime`/JSON-LD.

// Reused across calls — Intl.DateTimeFormat construction is the costly bit.
const FORMATTER = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

/** Human display date, e.g. "Jun 23, 2026". */
export function getFormattedDate(date: Date): string {
  return FORMATTER.format(date);
}

/** Machine date "YYYY-MM-DD" (UTC) for <time datetime> and structured data. */
export function getISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}
