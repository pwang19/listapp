// Plain JS with no imports: used by the Deno edge function (index.ts) and by Vitest.

export const REMINDER_HOUR = 8;
// If an hourly run is missed, catch up until noon rather than skipping the day.
const LAST_CATCH_UP_HOUR = 11;
const MAX_NAMES = 3;

/** Calendar date (YYYY-MM-DD) and hour (0–23) at `now` in an IANA time zone. Throws on a bad zone. */
export function localDateAndHour(now, timeZone) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value])
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) };
}

/**
 * The local date a subscription's reminder is due for, or null if it isn't due now
 * (outside the morning window, or already sent today). `force` sends regardless.
 */
export function reminderDateFor(subscription, now, force = false) {
  const { date, hour } = localDateAndHour(now, subscription.time_zone);
  if (force) return date;
  if (hour < REMINDER_HOUR || hour > LAST_CATCH_UP_HOUR) return null;
  if (subscription.last_sent_on === date) return null;
  return date;
}

/**
 * The daily summary for a synced doc on `today`, or null when nothing is due.
 * Mirrors the app: completed items are skipped, and snoozed items are hidden until their date.
 */
export function buildReminder(doc, today) {
  const dueToday = [];
  const overdue = [];
  (doc?.lists || []).forEach((list) => {
    (list?.items || []).forEach((item) => {
      if (!item || item.complete || !item.dueDate) return;
      if (item.snoozedUntil && item.snoozedUntil > today) return;
      if (item.dueDate === today) dueToday.push(item.text);
      else if (item.dueDate < today) overdue.push(item.text);
    });
  });
  if (dueToday.length === 0 && overdue.length === 0) return null;

  const title = [
    dueToday.length ? `${dueToday.length} due today` : '',
    overdue.length ? `${overdue.length} overdue` : '',
  ]
    .filter(Boolean)
    .join(' · ');
  const names = [...dueToday, ...overdue];
  const more = names.length - MAX_NAMES;
  const body = names.slice(0, MAX_NAMES).join(', ') + (more > 0 ? `, and ${more} more` : '');
  return { title, body };
}
