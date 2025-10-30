export function dateToDMYAbbrev(date: Date): string {
  return date
    .toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    .replace(',', '')
    .replace(' ', '-');
}

export function dateToMDYNumeric(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  });
}
