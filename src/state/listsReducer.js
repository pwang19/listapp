import {
  normalizeLists,
  normalizeItem,
  normalizeSubItem,
  normalizeList,
  normalizeArchived,
} from '../utils/normalizeLists';
import { reorderArray } from '../utils/helpers';
import { PRIORITY_SCALE_VERSION } from '../utils/constants';
import { cloneList, cloneItem } from '../utils/clone';
import { applyRecurringOnComplete } from '../utils/recurring';
import {
  loadLists,
  loadArchived,
  loadSettings,
  loadCustomTags,
} from '../utils/storage';

export function updateList(lists, listId, updater) {
  return lists.map((list) => (list.id === listId ? updater(list) : list));
}

export function updateItem(lists, listId, itemId, updater) {
  return updateList(lists, listId, (list) => ({
    ...list,
    items: list.items.map((item) => (item.id === itemId ? updater(item) : item)),
  }));
}

export function listsReducer(state, action) {
  switch (action.type) {
    case 'SET_LISTS':
      return action.lists;
    case 'ADD_LIST':
      return [
        ...state,
        normalizeList({
          name: action.name,
          items: [],
          color: action.color,
          icon: action.icon,
        }, action.customTags),
      ];
    case 'DUPLICATE_LIST': {
      const source = state.find((l) => l.id === action.listId);
      if (!source) return state;
      return [...state, cloneList(source, { resetComplete: action.resetComplete })];
    }
    case 'RENAME_LIST':
      return updateList(state, action.listId, (list) => ({ ...list, name: action.name }));
    case 'SET_LIST_STYLE':
      return updateList(state, action.listId, (list) => ({
        ...list,
        color: action.color ?? list.color,
        icon: action.icon ?? list.icon,
      }));
    case 'SET_LIST_META':
      return updateList(state, action.listId, (list) => ({
        ...list,
        ...action.patch,
      }));
    case 'DELETE_LIST':
      return state.filter((list) => list.id !== action.listId);
    case 'REORDER_LISTS':
      return reorderArray(state, action.activeId, action.overId);
    case 'ADD_ITEM':
      return updateList(state, action.listId, (list) => ({
        ...list,
        items: [
          ...list.items,
          normalizeItem({
            text: action.text,
            complete: false,
            description: '',
            dueDate: action.dueDate || '',
            tags: action.tags || [],
            priority: action.priority || 0,
            subItems: [],
          }, action.customTags),
        ],
      }));
    case 'DUPLICATE_ITEM': {
      const list = state.find((l) => l.id === action.listId);
      const item = list?.items.find((i) => i.id === action.itemId);
      if (!item) return state;
      return updateList(state, action.listId, (l) => ({
        ...l,
        items: [...l.items, cloneItem(item)],
      }));
    }
    case 'MOVE_ITEM': {
      const fromList = state.find((l) => l.id === action.fromListId);
      const item = fromList?.items.find((i) => i.id === action.itemId);
      if (!item || !state.some((l) => l.id === action.toListId)) return state;
      return updateList(
        updateList(state, action.fromListId, (l) => ({
          ...l,
          items: l.items.filter((i) => i.id !== action.itemId),
        })),
        action.toListId,
        (l) => ({ ...l, items: [...l.items, normalizeItem(item)] })
      );
    }
    case 'BULK_UPDATE_ITEMS':
      return state.map((list) => {
        if (list.id !== action.listId) return list;
        return {
          ...list,
          items: list.items.map((item) =>
            action.itemIds.includes(item.id)
              ? normalizeItem({ ...item, ...action.patch }, action.customTags)
              : item
          ),
        };
      });
    case 'BULK_MOVE_ITEMS': {
      const fromList = state.find((l) => l.id === action.fromListId);
      if (!fromList || !state.some((l) => l.id === action.toListId)) return state;
      const moving = fromList.items.filter((i) => action.itemIds.includes(i.id));
      return updateList(
        updateList(state, action.fromListId, (l) => ({
          ...l,
          items: l.items.filter((i) => !action.itemIds.includes(i.id)),
        })),
        action.toListId,
        (l) => ({ ...l, items: [...l.items, ...moving.map((i) => normalizeItem(i))] })
      );
    }
    case 'BULK_ARCHIVE_ITEMS': {
      return updateList(state, action.listId, (list) => ({
        ...list,
        items: list.items.filter((i) => !action.itemIds.includes(i.id)),
      }));
    }
    case 'RESTORE_ITEM':
      return updateList(state, action.listId, (list) => ({
        ...list,
        items: [...list.items, normalizeItem(action.item, action.customTags)],
      }));
    case 'TOGGLE_ITEM':
      return updateItem(state, action.listId, action.itemId, (item) => {
        const next = { ...item, complete: !item.complete };
        if (next.complete) {
          next.completedAt = new Date().toISOString();
          return applyRecurringOnComplete(next);
        }
        return { ...next, completedAt: '' };
      });
    case 'RENAME_ITEM':
      return updateItem(state, action.listId, action.itemId, (item) => ({
        ...item,
        text: action.name,
      }));
    case 'UPDATE_ITEM':
      return updateItem(state, action.listId, action.itemId, (item) =>
        normalizeItem({ ...item, ...action.patch }, action.customTags)
      );
    case 'ADD_SUB_ITEM':
      return updateItem(state, action.listId, action.itemId, (item) => ({
        ...item,
        subItems: [
          ...(item.subItems || []),
          normalizeSubItem({ text: action.text, complete: false }),
        ],
      }));
    case 'TOGGLE_SUB_ITEM':
      return updateItem(state, action.listId, action.itemId, (item) => ({
        ...item,
        subItems: (item.subItems || []).map((sub) =>
          sub.id === action.subItemId ? { ...sub, complete: !sub.complete } : sub
        ),
      }));
    case 'DELETE_SUB_ITEM':
      return updateItem(state, action.listId, action.itemId, (item) => ({
        ...item,
        subItems: (item.subItems || []).filter((sub) => sub.id !== action.subItemId),
      }));
    case 'REORDER_ITEMS':
      return updateList(state, action.listId, (list) => ({
        ...list,
        items: reorderArray(list.items, action.activeId, action.overId),
      }));
    case 'REORDER_SUB_ITEMS':
      return updateItem(state, action.listId, action.itemId, (item) => ({
        ...item,
        subItems: reorderArray(item.subItems || [], action.activeId, action.overId),
      }));
    case 'DELETE_ITEM':
      return updateList(state, action.listId, (list) => ({
        ...list,
        items: list.items.filter((item) => item.id !== action.itemId),
      }));
    case 'DELETE_COMPLETED_ITEMS':
      return updateList(state, action.listId, (list) => ({
        ...list,
        items: list.items.filter((item) => !item.complete),
      }));
    case 'RESTORE_SNAPSHOT':
      return action.lists;
    default:
      return state;
  }
}

export function getInitialLists() {
  const stored = loadLists();
  if (!stored) return [];
  const customTags = loadCustomTags();
  const settings = loadSettings();
  const migrateLegacyPriorities = (settings.priorityScaleVersion || 1) < PRIORITY_SCALE_VERSION;
  const result = normalizeLists(stored, customTags, { migrateLegacyPriorities });
  return result.ok ? result.lists : [];
}

export function getInitialArchived() {
  const settings = loadSettings();
  const migrateLegacyPriorities = (settings.priorityScaleVersion || 1) < PRIORITY_SCALE_VERSION;
  return normalizeArchived(loadArchived(), loadCustomTags(), { migrateLegacyPriorities });
}
