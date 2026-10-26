import { localDateString } from './helpers';

function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + days);
  return localDateString(d);
}

function isWeekday(dateStr) {
  const day = new Date(`${dateStr}T00:00:00`).getDay();
  return day >= 1 && day <= 5;
}

export function getNextDueDate(item) {
  const recurring = item.recurring;
  const dueDate = item.dueDate;
  if (!dueDate || !recurring || recurring === 'none') return '';

  if (item.recurringEndDate && dueDate >= item.recurringEndDate) return '';

  if (item.recurringIntervalDays && item.recurringIntervalDays > 0) {
    return addDays(dueDate, item.recurringIntervalDays);
  }

  const d = new Date(`${dueDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '';

  switch (recurring) {
    case 'daily':
      d.setDate(d.getDate() + 1);
      break;
    case 'weekdays': {
      let next = addDays(dueDate, 1);
      let guard = 0;
      while (!isWeekday(next) && guard < 14) {
        next = addDays(next, 1);
        guard += 1;
      }
      return next;
    }
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      break;
    default:
      return '';
  }

  const next = localDateString(d);
  if (item.recurringEndDate && next > item.recurringEndDate) return '';
  return next;
}

export function applyRecurringOnComplete(item) {
  if (!item.complete || !item.recurring || item.recurring === 'none') return item;
  const nextDue = getNextDueDate(item);
  if (!nextDue) {
    return { ...item, completedAt: new Date().toISOString() };
  }
  return {
    ...item,
    complete: false,
    dueDate: nextDue,
    completedAt: new Date().toISOString(),
  };
}

export function skipRecurringOccurrence(item) {
  if (!item.recurring || item.recurring === 'none' || !item.dueDate) return item;
  const nextDue = getNextDueDate(item);
  return {
    ...item,
    dueDate: nextDue || item.dueDate,
    complete: false,
    completedAt: '',
  };
}
