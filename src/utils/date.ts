const FORMATTER = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

export function getFormattedDate(date: Date): string {
  return FORMATTER.format(date);
}

export function getISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}
