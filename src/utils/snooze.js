/** @returns {string} YYYY-MM-DD */
export function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

/** @param {number} daysFromToday */
export function dateFromToday(daysFromToday) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + daysFromToday);
  return d.toISOString().slice(0, 10);
}

/**
 * @param {string} snoozedUntil YYYY-MM-DD
 * @param {string} [today]
 */
export function isSnoozed(snoozedUntil, today = todayDateString()) {
  if (!snoozedUntil) return false;
  return snoozedUntil > today;
}

export const SNOOZE_OPTIONS = [
  { id: 'tomorrow', label: 'Tomorrow', days: 1 },
  { id: 'next_week', label: 'Next week', days: 7 },
  { id: 'two_weeks', label: 'In 2 weeks', days: 14 },
];

/**
 * @param {import('../types').Item} item
 * @param {number} days
 */
export function buildSnoozePatch(item, days) {
  const until = dateFromToday(days);
  const dueDate = item.dueDate && item.dueDate > until ? item.dueDate : until;
  return { snoozedUntil: until, dueDate };
}
