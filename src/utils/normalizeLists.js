import { createId } from './ids';
import { LIST_COLORS, LIST_ICONS, TAG_PALETTE } from './constants';

const validTagIds = new Set(TAG_PALETTE.map((t) => t.id));
const validColorIds = new Set(LIST_COLORS.map((c) => c.id));
const validIcons = new Set(LIST_ICONS);

export function normalizeSubItem(subItem = {}) {
  return {
    id: subItem.id || createId(),
    text: typeof subItem.text === 'string' ? subItem.text : '',
    complete: Boolean(subItem.complete),
  };
}

export function normalizeItem(item = {}) {
  const tags = Array.isArray(item.tags)
    ? item.tags.filter((tag) => typeof tag === 'string' && validTagIds.has(tag))
    : [];
  const dueDate =
    typeof item.dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.dueDate)
      ? item.dueDate
      : '';

  return {
    id: item.id || createId(),
    text: typeof item.text === 'string' ? item.text : '',
    complete: Boolean(item.complete),
    description: typeof item.description === 'string' ? item.description : '',
    dueDate,
    tags,
    subItems: Array.isArray(item.subItems)
      ? item.subItems.map(normalizeSubItem)
      : [],
  };
}

export function normalizeList(list = {}) {
  const color =
    typeof list.color === 'string' && validColorIds.has(list.color)
      ? list.color
      : 'slate';
  const icon =
    typeof list.icon === 'string' && validIcons.has(list.icon) ? list.icon : '📋';

  return {
    id: list.id || createId(),
    name: typeof list.name === 'string' ? list.name : '',
    color,
    icon,
    items: Array.isArray(list.items) ? list.items.map(normalizeItem) : [],
  };
}

export function normalizeArchivedEntry(entry = {}) {
  const item = normalizeItem(entry);
  return {
    ...item,
    archivedAt: typeof entry.archivedAt === 'string' ? entry.archivedAt : new Date().toISOString(),
    fromListId: typeof entry.fromListId === 'string' ? entry.fromListId : '',
    fromListName: typeof entry.fromListName === 'string' ? entry.fromListName : '',
  };
}

export function normalizeLists(data) {
  if (!Array.isArray(data)) {
    return { ok: false, error: 'Imported data must be a JSON array of lists.' };
  }
  return { ok: true, lists: data.map(normalizeList) };
}

export function normalizeArchived(data) {
  if (!Array.isArray(data)) return [];
  return data.map(normalizeArchivedEntry);
}
