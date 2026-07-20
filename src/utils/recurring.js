export function getNextDueDate(dueDate, recurring) {
  if (!dueDate || !recurring || recurring === 'none') return '';
  const d = new Date(`${dueDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  switch (recurring) {
    case 'daily':
      d.setDate(d.getDate() + 1);
      break;
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      break;
    default:
      return '';
  }
  return d.toISOString().slice(0, 10);
}

export function applyRecurringOnComplete(item) {
  if (!item.complete || !item.recurring || item.recurring === 'none') return item;
  const nextDue = getNextDueDate(item.dueDate, item.recurring);
  return {
    ...item,
    complete: false,
    dueDate: nextDue || item.dueDate,
    completedAt: new Date().toISOString(),
  };
}
