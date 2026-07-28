import { isOverdue } from './helpers';
import { todayDateString } from './snooze';

/**
 * @param {import('../types').List} list
 */
export function computeListStats(list) {
  const items = list.items || [];
  const total = items.length;
  const completed = items.filter((i) => i.complete).length;
  const active = total - completed;
  const overdue = items.filter((i) => isOverdue(i.dueDate, i.complete)).length;
  const withDue = items.filter((i) => i.dueDate);
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const completionDurations = items
    .filter((i) => i.complete && i.createdAt && i.completedAt)
    .map((i) => new Date(i.completedAt).getTime() - new Date(i.createdAt).getTime())
    .filter((ms) => ms >= 0);

  let avgDaysToComplete = null;
  if (completionDurations.length > 0) {
    const avgMs =
      completionDurations.reduce((sum, ms) => sum + ms, 0) / completionDurations.length;
    avgDaysToComplete = Math.round((avgMs / (1000 * 60 * 60 * 24)) * 10) / 10;
  }

  const today = todayDateString();
  const dueThisWeek = items.filter((i) => {
    if (!i.dueDate || i.complete) return false;
    const due = new Date(`${i.dueDate}T00:00:00`);
    const end = new Date();
    end.setDate(end.getDate() + 7);
    return i.dueDate >= today && due <= end;
  }).length;

  const tagged = items.filter((i) => (i.tags || []).length > 0).length;
  const withSubItems = items.filter((i) => (i.subItems || []).length > 0).length;

  return {
    total,
    completed,
    active,
    overdue,
    dueThisWeek,
    completionRate,
    avgDaysToComplete,
    withDueDate: withDue.length,
    tagged,
    withSubItems,
  };
}
