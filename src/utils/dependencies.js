import { flattenAllItems } from './helpers';

/** @returns {{ listId: string; item: import('../types').Item }|null} */
export function findItemById(lists, itemId) {
  for (const list of lists) {
    const item = (list.items || []).find((i) => i.id === itemId);
    if (item) return { listId: list.id, item };
  }
  return null;
}

/** @param {import('../types').List[]} lists */
export function getBlockingItems(lists, item) {
  const blockedBy = item.blockedBy || [];
  return blockedBy
    .map((id) => {
      const found = findItemById(lists, id);
      return found ? { ...found, blockerId: id } : null;
    })
    .filter(Boolean);
}

/** @param {import('../types').List[]} lists */
export function isItemBlocked(lists, item) {
  if (item.complete) return false;
  const blockers = getBlockingItems(lists, item);
  return blockers.some((b) => !b.item.complete);
}

export function getBlockedReason(lists, item) {
  const blockers = getBlockingItems(lists, item).filter((b) => !b.item.complete);
  if (!blockers.length) return '';
  return `Blocked by: ${blockers.map((b) => b.item.text).join(', ')}`;
}
