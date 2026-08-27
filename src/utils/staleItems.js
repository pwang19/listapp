/**
 * @param {import('../types').Item} item
 */
export function getLastTouchedAt(item) {
  if (item.lastTouchedAt) return item.lastTouchedAt;
  const history = item.history || [];
  if (history.length) return history[history.length - 1].at;
  return item.createdAt || '';
}

/**
 * @param {import('../types').Item} item
 * @param {number} thresholdDays
 * @param {string} [todayStr]
 */
export function isStaleItem(item, thresholdDays = 14, todayStr = new Date().toISOString().slice(0, 10)) {
  if (item.complete) return false;
  const touched = getLastTouchedAt(item);
  if (!touched) return false;
  const touchedDate = touched.slice(0, 10);
  const today = new Date(`${todayStr}T00:00:00`);
  const last = new Date(`${touchedDate}T00:00:00`);
  const diff = (today - last) / (1000 * 60 * 60 * 24);
  return diff >= thresholdDays;
}

/**
 * @param {import('../types').List} list
 */
export function countStaleInList(list, thresholdDays = 14) {
  return (list.items || []).filter((item) => isStaleItem(item, thresholdDays)).length;
}
