import { filterItems } from './filterItems';
import { sortItems } from './sortItems';
import { flattenAllItems } from './helpers';

/**
 * Build flat navigable item keys for keyboard navigation.
 * @returns {{ listId: string; itemId: string; key: string }[]}
 */
export function buildNavigableItems({
  viewMode,
  lists,
  listsToShow,
  allItemRows,
  upcomingItems,
  itemFilter,
  searchQuery,
  tagFilter,
}) {
  if (viewMode === 'all') {
    return allItemRows.map((row) => ({
      listId: row.listId,
      itemId: row.item.id,
      key: `${row.listId}:${row.item.id}`,
    }));
  }

  if (viewMode === 'upcoming') {
    return upcomingItems.map((row) => ({
      listId: row.listId,
      itemId: row.item.id,
      key: `${row.listId}:${row.item.id}`,
    }));
  }

  if (viewMode === 'kanban') {
    const keys = [];
    const seen = new Set();
    lists.forEach((list) => {
      list.items.forEach((item) => {
        const key = `${list.id}:${item.id}`;
        if (!seen.has(key)) {
          seen.add(key);
          keys.push({ listId: list.id, itemId: item.id, key });
        }
      });
    });
    return keys;
  }

  if (viewMode === 'calendar') {
    const keys = [];
    lists.forEach((list) => {
      (list.items || []).forEach((item) => {
        if (!item.dueDate || item.complete) return;
        keys.push({ listId: list.id, itemId: item.id, key: `${list.id}:${item.id}` });
      });
    });
    return keys.sort((a, b) => a.key.localeCompare(b.key));
  }

  const rows = [];
  listsToShow.forEach((list) => {
    const filtered = filterItems(list.items, { itemFilter, searchQuery, tagFilter });
    const sorted = list.sortMode === 'manual' ? filtered : sortItems(filtered, list.sortMode);
    sorted.forEach((item) => {
      rows.push({ listId: list.id, itemId: item.id, key: `${list.id}:${item.id}` });
    });
  });
  return rows;
}
