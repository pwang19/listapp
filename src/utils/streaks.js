import { todayDateString } from './snooze';
import { localDateString } from './helpers';

/**
 * @param {import('../types').List[]} lists
 * @param {string} today YYYY-MM-DD
 */
export function hasOverdueIncomplete(lists, today = todayDateString()) {
  for (const list of lists) {
    for (const item of list.items || []) {
      if (item.complete) continue;
      if (!item.dueDate || item.dueDate > today) continue;
      if (item.snoozedUntil && item.snoozedUntil > today) continue;
      return true;
    }
  }
  return false;
}

/**
 * @param {import('../types').List[]} lists
 * @param {string} today
 */
export function hasDueOnOrBefore(lists, today = todayDateString()) {
  for (const list of lists) {
    for (const item of list.items || []) {
      if (!item.dueDate || item.dueDate > today) continue;
      if (item.snoozedUntil && item.snoozedUntil > today) continue;
      return true;
    }
  }
  return false;
}

function previousDay(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() - 1);
  return localDateString(d);
}

/**
 * Sync streak counters when lists change.
 * @param {import('../types').AppSettings} settings
 * @param {import('../types').List[]} lists
 * @returns {Record<string, *>|null} patch or null if unchanged
 */
export function syncStreak(settings, lists) {
  if (!settings.streaksEnabled) return null;

  const today = todayDateString();
  const overdue = hasOverdueIncomplete(lists, today);
  const hasDue = hasDueOnOrBefore(lists, today);

  let streakCurrent = settings.streakCurrent || 0;
  let streakLongest = settings.streakLongest || 0;
  const streakLastGoodDate = settings.streakLastGoodDate || '';

  if (overdue) {
    if (streakCurrent === 0 && streakLastGoodDate === '') return null;
    return { streakCurrent: 0, streakLongest, streakLastGoodDate: '' };
  }

  if (!hasDue) return null;

  if (streakLastGoodDate === today) return null;

  if (streakLastGoodDate === previousDay(today)) {
    streakCurrent += 1;
  } else {
    streakCurrent = 1;
  }
  streakLongest = Math.max(streakLongest, streakCurrent);

  return {
    streakCurrent,
    streakLongest,
    streakLastGoodDate: today,
  };
}
