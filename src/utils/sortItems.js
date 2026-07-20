function prioritySortKey(priority) {
  if (!priority) return 4;
  return priority;
}

export function sortItems(items, sortMode = 'manual') {
  if (sortMode === 'manual') return items;
  const sorted = [...items];
  switch (sortMode) {
    case 'dueDate':
      return sorted.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });
    case 'alpha':
      return sorted.sort((a, b) => a.text.localeCompare(b.text, undefined, { sensitivity: 'base' }));
    case 'completedLast':
      return sorted.sort((a, b) => Number(a.complete) - Number(b.complete));
    case 'priority':
      return sorted.sort(
        (a, b) => prioritySortKey(a.priority) - prioritySortKey(b.priority)
      );
    case 'created':
      return sorted.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
    default:
      return sorted;
  }
}

export function sortListsForDisplay(lists, { pinnedIds = [] } = {}) {
  const pinned = new Set(pinnedIds);
  return [...lists].sort((a, b) => {
    const aPin = pinned.has(a.id) ? 0 : 1;
    const bPin = pinned.has(b.id) ? 0 : 1;
    if (aPin !== bPin) return aPin - bPin;
    return 0;
  });
}
