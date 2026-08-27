/** @returns {string} YYYY-MM-DD */
export function formatDate(year, month, day) {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

/**
 * @param {number} year
 * @param {number} month 0-indexed
 */
export function getMonthGrid(year, month) {
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];

  for (let i = 0; i < startDay; i += 1) {
    cells.push({ date: '', day: 0, inMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ date: formatDate(year, month, day), day, inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ date: '', day: 0, inMonth: false });
  }
  return cells;
}

/**
 * @param {number} year
 * @param {number} month 0-indexed
 */
export function getWeekDays(year, month, day) {
  const anchor = new Date(year, month, day);
  const start = new Date(anchor);
  start.setDate(anchor.getDate() - anchor.getDay());
  const days = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push({
      date: formatDate(d.getFullYear(), d.getMonth(), d.getDate()),
      day: d.getDate(),
      inMonth: d.getMonth() === month,
    });
  }
  return days;
}

/**
 * @param {import('../types').List[]} lists
 * @returns {Map<string, { listId: string; listName: string; listIcon: string; item: import('../types').Item }[]>}
 */
export function groupItemsByDueDate(lists) {
  const map = new Map();
  lists.forEach((list) => {
    (list.items || []).forEach((item) => {
      if (!item.dueDate || item.complete) return;
      if (!map.has(item.dueDate)) map.set(item.dueDate, []);
      map.get(item.dueDate).push({
        listId: list.id,
        listName: list.name,
        listIcon: list.icon,
        item,
      });
    });
  });
  return map;
}

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
