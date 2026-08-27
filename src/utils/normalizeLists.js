import { createId } from './ids';
import { LIST_COLORS, LIST_ICONS, RECURRING_OPTIONS } from './constants';
import { LIST_THEME_IDS } from './listThemes';
import { getAllTags, resolveTagId } from './tags';

const CUSTOM_FIELD_TYPES = new Set(['text', 'url', 'number', 'checkbox']);

const validColorIds = new Set(LIST_COLORS.map((c) => c.id));
const validIcons = new Set(LIST_ICONS);
const validRecurring = new Set(RECURRING_OPTIONS.map((r) => r.id));

export function migrateLegacyPriority(priority) {
  if (!priority) return 0;
  return 4 - priority;
}

export function migrateListsPriorities(lists = []) {
  return lists.map((list) => ({
    ...list,
    items: Array.isArray(list.items)
      ? list.items.map((item) => ({
          ...item,
          priority: migrateLegacyPriority(item.priority),
        }))
      : [],
  }));
}

export function migrateArchivedPriorities(entries = []) {
  return entries.map((entry) => ({
    ...entry,
    priority: migrateLegacyPriority(entry.priority),
  }));
}

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
    ? [...new Set(
        item.tags
          .map((tag) => (typeof tag === 'string' ? resolveTagId(tag, customTags) : ''))
          .filter((tag) => tag && validTagIds.has(tag))
      )]
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

  const snoozedUntil =
    typeof item.snoozedUntil === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.snoozedUntil)
      ? item.snoozedUntil
      : '';
  const history = Array.isArray(item.history)
    ? item.history
        .filter((h) => h && typeof h.type === 'string')
        .map((h) => ({
          id: h.id || createId(),
          type: h.type,
          at: typeof h.at === 'string' ? h.at : new Date().toISOString(),
          detail: typeof h.detail === 'string' ? h.detail : '',
        }))
        .slice(-50)
    : [];

  const recurringEndDate =
    typeof item.recurringEndDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.recurringEndDate)
      ? item.recurringEndDate
      : '';
  const recurringIntervalDays =
    typeof item.recurringIntervalDays === 'number' && item.recurringIntervalDays > 0
      ? Math.round(item.recurringIntervalDays)
      : 0;
  const blockedBy = Array.isArray(item.blockedBy)
    ? item.blockedBy.filter((id) => typeof id === 'string')
    : [];
  const estimateMinutes =
    typeof item.estimateMinutes === 'number' && item.estimateMinutes > 0
      ? Math.min(Math.round(item.estimateMinutes), 9999)
      : 0;
  const customFieldValues =
    item.customFieldValues && typeof item.customFieldValues === 'object'
      ? item.customFieldValues
      : {};
  const createdAt = typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString();
  const lastTouchedAt =
    typeof item.lastTouchedAt === 'string' ? item.lastTouchedAt : createdAt;

  return {
    id: item.id || createId(),
    text: typeof item.text === 'string' ? item.text : '',
    complete: Boolean(item.complete),
    description: typeof item.description === 'string' ? item.description : '',
    dueDate,
    tags,
    priority,
    recurring,
    recurringIntervalDays,
    recurringEndDate,
    blockedBy,
    estimateMinutes,
    customFieldValues,
    snoozedUntil,
    history,
    createdAt,
    lastTouchedAt,
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
  const theme =
    typeof list.theme === 'string' && LIST_THEME_IDS.has(list.theme)
      ? list.theme
      : 'none';
  const parentId = typeof list.parentId === 'string' ? list.parentId : '';
  const isFolder = Boolean(list.isFolder);
  const customFields = Array.isArray(list.customFields)
    ? list.customFields
        .filter((f) => f && typeof f.label === 'string')
        .map((f) => ({
          id: f.id || createId(),
          label: f.label,
          type: CUSTOM_FIELD_TYPES.has(f.type) ? f.type : 'text',
        }))
    : [];

  return {
    id: list.id || createId(),
    name: typeof list.name === 'string' ? list.name : '',
    color,
    icon,
    theme,
    parentId,
    isFolder,
    customFields,
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

export function normalizeLists(data, customTags = [], { migrateLegacyPriorities = false } = {}) {
  if (!Array.isArray(data)) {
    return { ok: false, error: 'Imported data must be a JSON array of lists.' };
  }
  const lists = data.map((l) => normalizeList(l, customTags));
  return {
    ok: true,
    lists: migrateLegacyPriorities ? migrateListsPriorities(lists) : lists,
  };
}

export function normalizeArchived(data, customTags = [], { migrateLegacyPriorities = false } = {}) {
  if (!Array.isArray(data)) return [];
  const entries = data.map((e) => normalizeArchivedEntry(e, customTags));
  return migrateLegacyPriorities ? migrateArchivedPriorities(entries) : entries;
}

export function normalizeCustomTag(tag = {}) {
  return {
    id: typeof tag.id === 'string' ? tag.id : createId(),
    label: typeof tag.label === 'string' ? tag.label : '',
    color: typeof tag.color === 'string' ? tag.color : '#64748b',
    parentId: typeof tag.parentId === 'string' ? tag.parentId : '',
    aliases: Array.isArray(tag.aliases)
      ? tag.aliases.filter((a) => typeof a === 'string').map((a) => a.toLowerCase())
      : [],
  };
}
