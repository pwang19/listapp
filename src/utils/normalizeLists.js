import { createId } from './ids';
import { LIST_COLORS, LIST_ICONS, RECURRING_OPTIONS } from './constants';
import { getAllTags } from './tags';

const validColorIds = new Set(LIST_COLORS.map((c) => c.id));
const validIcons = new Set(LIST_ICONS);
const validRecurring = new Set(RECURRING_OPTIONS.map((r) => r.id));

export function normalizeSubItem(subItem = {}) {
  return {
    id: subItem.id || createId(),
    text: typeof subItem.text === 'string' ? subItem.text : '',
    complete: Boolean(subItem.complete),
  };
}

export function normalizeItem(item = {}, customTags = []) {
  const validTagIds = new Set(getAllTags(customTags).map((t) => t.id));
  const tags = Array.isArray(item.tags)
    ? item.tags.filter((tag) => typeof tag === 'string' && validTagIds.has(tag))
    : [];
  const dueDate =
    typeof item.dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.dueDate)
      ? item.dueDate
      : '';
  const priority = [0, 1, 2, 3].includes(item.priority) ? item.priority : 0;
  const recurring =
    typeof item.recurring === 'string' && validRecurring.has(item.recurring)
      ? item.recurring
      : 'none';

  return {
    id: item.id || createId(),
    text: typeof item.text === 'string' ? item.text : '',
    complete: Boolean(item.complete),
    description: typeof item.description === 'string' ? item.description : '',
    dueDate,
    tags,
    priority,
    recurring,
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
    completedAt: typeof item.completedAt === 'string' ? item.completedAt : '',
    subItems: Array.isArray(item.subItems)
      ? item.subItems.map(normalizeSubItem)
      : [],
  };
}

export function normalizeList(list = {}, customTags = []) {
  const color =
    typeof list.color === 'string' && validColorIds.has(list.color)
      ? list.color
      : 'slate';
  const icon =
    typeof list.icon === 'string' && validIcons.has(list.icon) ? list.icon : '📋';
  const sortMode =
    typeof list.sortMode === 'string'
      ? list.sortMode
      : 'manual';

  return {
    id: list.id || createId(),
    name: typeof list.name === 'string' ? list.name : '',
    color,
    icon,
    sortMode,
    collapsed: Boolean(list.collapsed),
    pinned: Boolean(list.pinned),
    items: Array.isArray(list.items) ? list.items.map((i) => normalizeItem(i, customTags)) : [],
  };
}

export function normalizeArchivedEntry(entry = {}, customTags = []) {
  const item = normalizeItem(entry, customTags);
  return {
    ...item,
    archivedAt: typeof entry.archivedAt === 'string' ? entry.archivedAt : new Date().toISOString(),
    fromListId: typeof entry.fromListId === 'string' ? entry.fromListId : '',
    fromListName: typeof entry.fromListName === 'string' ? entry.fromListName : '',
  };
}

export function normalizeLists(data, customTags = []) {
  if (!Array.isArray(data)) {
    return { ok: false, error: 'Imported data must be a JSON array of lists.' };
  }
  return { ok: true, lists: data.map((l) => normalizeList(l, customTags)) };
}

export function normalizeArchived(data, customTags = []) {
  if (!Array.isArray(data)) return [];
  return data.map((e) => normalizeArchivedEntry(e, customTags));
}

export function normalizeCustomTag(tag = {}) {
  return {
    id: typeof tag.id === 'string' ? tag.id : createId(),
    label: typeof tag.label === 'string' ? tag.label : '',
    color: typeof tag.color === 'string' ? tag.color : '#64748b',
  };
}
