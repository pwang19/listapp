import { getUpcomingItems, flattenAllItems } from './helpers';
import { isStaleItem } from './staleItems';
import { isItemBlocked } from './dependencies';

function weekStart(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

/**
 * @param {import('../types').List[]} lists
 */
export function buildReviewData(lists, { staleThresholdDays = 14 } = {}) {
  const today = new Date();
  const weekStartDate = weekStart(today);
  const overdue = [];
  const stale = [];
  const blocked = [];
  const completedThisWeek = [];
  const dueSoon = getUpcomingItems(lists, { daysAhead: 7 }).filter((r) => r.dueSoon || r.overdue);

  flattenAllItems(lists).forEach(({ listId, listName, listIcon, item }) => {
    if (isItemBlocked(lists, item)) {
      blocked.push({ listId, listName, listIcon, item });
    }
    if (isStaleItem(item, staleThresholdDays)) {
      stale.push({ listId, listName, listIcon, item });
    }
    if (item.complete && item.completedAt) {
      const completed = new Date(item.completedAt);
      if (completed >= weekStartDate) {
        completedThisWeek.push({ listId, listName, listIcon, item });
      }
    }
  });

  getUpcomingItems(lists, { daysAhead: 365 }).forEach((row) => {
    if (row.overdue) overdue.push(row);
  });

  return { overdue, dueSoon, stale, blocked, completedThisWeek };
}
