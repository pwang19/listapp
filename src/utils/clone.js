import { createId } from './ids';
import { normalizeItem, normalizeList } from './normalizeLists';

function cloneSubItem(sub) {
  return { ...sub, id: createId(), complete: false };
}

export function cloneItem(item, { resetComplete = false } = {}) {
  return normalizeItem({
    ...item,
    id: createId(),
    complete: resetComplete ? false : item.complete,
    completedAt: resetComplete ? '' : item.completedAt,
    subItems: (item.subItems || []).map(cloneSubItem),
  });
}

export function cloneList(list, { resetComplete = false } = {}) {
  return normalizeList({
    ...list,
    id: createId(),
    name: `${list.name} (copy)`,
    items: (list.items || []).map((item) => cloneItem(item, { resetComplete })),
    collapsed: false,
    pinned: false,
  });
}
