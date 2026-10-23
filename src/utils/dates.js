/**
 * Date helpers.
 *
 * All dates are handled as plain `YYYY-MM-DD` strings in the hotel's local
 * timezone. Working with date strings avoids the off-by-one bugs you get
 * when a `Date` crosses a UTC boundary.
 */

/** Parse a `YYYY-MM-DD` string into a local Date at midnight. */
export function parseDate(dateString) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString || '')) {
    throw new Error(`তারিখের ফরম্যাট ঠিক নেই: ${dateString}`);
  }
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) throw new Error(`তারিখটি সঠিক নয়: ${dateString}`);
  return date;
}

/** Format a Date back into `YYYY-MM-DD`. */
export function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Today in local time as `YYYY-MM-DD`. */
export function today() {
  return formatDate(new Date());
}

/** Add `days` calendar days to a date string. */
export function addDays(dateString, days) {
  const date = parseDate(dateString);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

/** Number of nights between check-in and check-out. */
export function nightsBetween(checkIn, checkOut) {
  const start = parseDate(checkIn).getTime();
  const end = parseDate(checkOut).getTime();
  return Math.round((end - start) / 86400000);
}

/**
 * Every date string covered by [checkIn, checkOut).
 * The checkout date itself is never occupied - a guest leaving at 11 AM
 * frees the room for the next arrival the same day.
 */
export function dateRange(checkIn, checkOut) {
  const nights = nightsBetween(checkIn, checkOut);
  const range = [];
  let cursor = checkIn;
  for (let i = 0; i < nights; i += 1) {
    range.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return range;
}

/**
 * Human friendly Bengali label, e.g. "বুধ, ১ মে ২০৩০".
 * Rendered with the `bn-BD` locale so month and weekday names come out in
 * Bengali with Bengali digits.
 */
export function humanDate(dateString) {
  if (!dateString) return '';
  try {
    return parseDate(dateString).toLocaleDateString('bn-BD', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/** Short Bengali label without the year, e.g. "১ মে". */
export function shortDate(dateString) {
  if (!dateString) return '';
  try {
    return parseDate(dateString).toLocaleDateString('bn-BD', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return dateString;
  }
}
