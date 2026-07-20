import { useReducer, useEffect, useCallback, useRef, useState } from 'react';
import { createId } from '../utils/ids';
import {
  loadLists,
  saveLists,
  loadArchived,
  saveArchived,
  loadSettings,
  saveSettings,
  loadCustomTags,
  saveCustomTags,
  loadUserTemplates,
  saveUserTemplates,
  downloadBackup,
  needsBackupReminder,
} from '../utils/storage';
import {
  normalizeLists,
  normalizeItem,
  normalizeSubItem,
  normalizeList,
  normalizeArchived,
  normalizeCustomTag,
} from '../utils/normalizeLists';
import { mergeLists } from '../utils/mergeLists';
import { reorderArray } from '../utils/helpers';
import { MAX_UNDO, PRIORITY_SCALE_VERSION } from '../utils/constants';
import { TEMPLATES } from '../utils/templates';
import { cloneList, cloneItem } from '../utils/clone';
import { parseQuickAdd } from '../utils/parseQuickAdd';
import { createCustomTag } from '../utils/tags';
import { applyRecurringOnComplete } from '../utils/recurring';
import { launchConfetti } from '../utils/confetti';

function updateList(lists, listId, updater) {
  return lists.map((list) => (list.id === listId ? updater(list) : list));
}

function updateItem(lists, listId, itemId, updater) {
  return updateList(lists, listId, (list) => ({
    ...list,
    items: list.items.map((item) => (item.id === itemId ? updater(item) : item)),
  }));
}

function listsReducer(state, action) {
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

function getInitialLists() {
  const stored = loadLists();
  if (!stored) return [];
  const customTags = loadCustomTags();
  const settings = loadSettings();
  const migrateLegacyPriorities = (settings.priorityScaleVersion || 1) < PRIORITY_SCALE_VERSION;
  const result = normalizeLists(stored, customTags, { migrateLegacyPriorities });
  return result.ok ? result.lists : [];
}

function getInitialArchived() {
  const settings = loadSettings();
  const migrateLegacyPriorities = (settings.priorityScaleVersion || 1) < PRIORITY_SCALE_VERSION;
  return normalizeArchived(loadArchived(), loadCustomTags(), { migrateLegacyPriorities });
}

export function useLists() {
  const [lists, dispatch] = useReducer(listsReducer, undefined, getInitialLists);
  const [archived, setArchived] = useState(getInitialArchived);
  const [customTags, setCustomTags] = useState(loadCustomTags);
  const [userTemplates, setUserTemplates] = useState(loadUserTemplates);
  const [settings, setSettings] = useState(loadSettings);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [toast, setToast] = useState(null);
  const [storageError, setStorageError] = useState(null);
  const undoTimerRef = useRef(null);
  const listsRef = useRef(lists);
  const archivedRef = useRef(archived);
  const customTagsRef = useRef(customTags);

  useEffect(() => { listsRef.current = lists; }, [lists]);
  useEffect(() => { archivedRef.current = archived; }, [archived]);
  useEffect(() => { customTagsRef.current = customTags; }, [customTags]);

  useEffect(() => {
    const result = saveLists(lists);
    if (!result.ok) setStorageError(result.error);
  }, [lists]);

  useEffect(() => {
    const result = saveArchived(archived);
    if (!result.ok) setStorageError(result.error);
  }, [archived]);

  useEffect(() => { saveCustomTags(customTags); }, [customTags]);
  useEffect(() => { saveUserTemplates(userTemplates); }, [userTemplates]);
  useEffect(() => { saveSettings(settings); }, [settings]);

  useEffect(() => {
    const stored = loadSettings();
    if ((stored.priorityScaleVersion || 1) >= PRIORITY_SCALE_VERSION) return;
    setSettings((prev) => ({ ...prev, priorityScaleVersion: PRIORITY_SCALE_VERSION }));
  }, []);

  const clearUndoTimer = useCallback(() => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }, []);

  const snapshot = useCallback(
    () => ({
      lists: listsRef.current,
      archived: archivedRef.current,
      customTags: customTagsRef.current,
    }),
    []
  );

  const pushHistory = useCallback(
    (message, before) => {
      const entry = {
        id: createId(),
        message,
        lists: before.lists,
        archived: before.archived,
        customTags: before.customTags,
      };
      setUndoStack((stack) => [entry, ...stack].slice(0, MAX_UNDO));
      setRedoStack([]);
      clearUndoTimer();
      setToast({ id: entry.id, message });
      undoTimerRef.current = setTimeout(() => {
        setToast(null);
        undoTimerRef.current = null;
      }, 5000);
    },
    [clearUndoTimer]
  );

  const dismissToast = useCallback(() => {
    clearUndoTimer();
    setToast(null);
  }, [clearUndoTimer]);

  const applyUndo = useCallback(() => {
    setUndoStack((stack) => {
      if (!stack.length) return stack;
      const [latest, ...rest] = stack;
      const current = snapshot();
      setRedoStack((redo) => [{ ...latest, redoSnapshot: current }, ...redo].slice(0, MAX_UNDO));
      dispatch({ type: 'RESTORE_SNAPSHOT', lists: latest.lists });
      setArchived(latest.archived);
      setCustomTags(latest.customTags || []);
      clearUndoTimer();
      setToast(null);
      return rest;
    });
  }, [clearUndoTimer, snapshot]);

  const applyRedo = useCallback(() => {
    setRedoStack((stack) => {
      if (!stack.length) return stack;
      const [latest, ...rest] = stack;
      const before = snapshot();
      const entry = {
        id: createId(),
        message: 'Redo',
        lists: before.lists,
        archived: before.archived,
        customTags: before.customTags,
      };
      setUndoStack((undo) => [entry, ...undo].slice(0, MAX_UNDO));
      if (latest.redoSnapshot) {
        dispatch({ type: 'RESTORE_SNAPSHOT', lists: latest.redoSnapshot.lists });
        setArchived(latest.redoSnapshot.archived);
        setCustomTags(latest.redoSnapshot.customTags || []);
      } else {
        dispatch({ type: 'RESTORE_SNAPSHOT', lists: latest.lists });
        setArchived(latest.archived);
        setCustomTags(latest.customTags || []);
      }
      clearUndoTimer();
      setToast(null);
      return rest;
    });
  }, [clearUndoTimer, snapshot]);

  useEffect(() => () => clearUndoTimer(), [clearUndoTimer]);

  const withUndo = useCallback(
    (message, fn) => {
      const before = snapshot();
      fn();
      pushHistory(message, before);
    },
    [snapshot, pushHistory]
  );

  const updateSettings = useCallback((patch) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const addCustomTag = useCallback((label) => {
    const tag = createCustomTag(label, customTagsRef.current);
    if (!tag) return null;
    if (!customTagsRef.current.some((t) => t.id === tag.id)) {
      setCustomTags((prev) => [...prev, normalizeCustomTag(tag)]);
    }
    return tag;
  }, []);

  const addList = useCallback(
    (name, style = {}) => {
      withUndo('List added', () => {
        dispatch({
          type: 'ADD_LIST',
          name,
          color: style.color,
          icon: style.icon,
          customTags: customTagsRef.current,
        });
      });
      updateSettings({ lastUsedListId: '' });
    },
    [withUndo, updateSettings]
  );

  const duplicateList = useCallback(
    (listId) => {
      withUndo('List duplicated', () => {
        dispatch({ type: 'DUPLICATE_LIST', listId });
      });
    },
    [withUndo]
  );

  const saveListAsTemplate = useCallback((listId) => {
    const list = listsRef.current.find((l) => l.id === listId);
    if (!list) return;
    const template = {
      id: createId(),
      name: list.name,
      icon: list.icon,
      color: list.color,
      items: list.items.map((i) => ({
        text: i.text,
        description: i.description,
        dueDate: '',
        tags: i.tags,
        priority: i.priority,
        subItems: (i.subItems || []).map((s) => ({ text: s.text })),
      })),
    };
    setUserTemplates((prev) => [...prev, template]);
  }, []);

  const addTemplate = useCallback(
    (templateId) => {
      const allTemplates = [...TEMPLATES, ...userTemplates];
      const template = allTemplates.find((t) => t.id === templateId);
      if (!template) return;
      withUndo(`Added "${template.name}" template`, () => {
        const list = normalizeList({
          name: template.name,
          icon: template.icon,
          color: template.color,
          items: template.items.map((item) => normalizeItem(item, customTagsRef.current)),
        }, customTagsRef.current);
        dispatch({ type: 'SET_LISTS', lists: [...listsRef.current, list] });
      });
    },
    [withUndo, userTemplates]
  );

  const renameList = useCallback(
    (listId, name) => {
      withUndo('List renamed', () => {
        dispatch({ type: 'RENAME_LIST', listId, name });
      });
    },
    [withUndo]
  );

  const setListStyle = useCallback(
    (listId, { color, icon }) => {
      withUndo('List style updated', () => {
        dispatch({ type: 'SET_LIST_STYLE', listId, color, icon });
      });
    },
    [withUndo]
  );

  const setListMeta = useCallback(
    (listId, patch) => {
      dispatch({ type: 'SET_LIST_META', listId, patch });
      if (patch.pinned !== undefined) {
        setSettings((prev) => {
          const pinned = new Set(prev.pinnedListIds || []);
          if (patch.pinned) pinned.add(listId);
          else pinned.delete(listId);
          return { ...prev, pinnedListIds: [...pinned] };
        });
      }
    },
    []
  );

  const deleteList = useCallback(
    (listId) => {
      withUndo('List deleted', () => {
        dispatch({ type: 'DELETE_LIST', listId });
      });
    },
    [withUndo]
  );

  const reorderLists = useCallback(
    (activeId, overId) => {
      if (settings.focusListId) return;
      withUndo('Lists reordered', () => {
        dispatch({ type: 'REORDER_LISTS', activeId, overId });
      });
    },
    [withUndo, settings.focusListId]
  );

  const addItem = useCallback(
    (listId, text) => {
      const parsed = parseQuickAdd(text);
      parsed.tags.forEach((tagId) => {
        if (!customTagsRef.current.some((t) => t.id === tagId) &&
            !['work', 'personal', 'urgent', 'errand', 'home', 'idea'].includes(tagId)) {
          addCustomTag(tagId);
        }
      });
      withUndo('Item added', () => {
        dispatch({
          type: 'ADD_ITEM',
          listId,
          text: parsed.text,
          tags: parsed.tags,
          dueDate: parsed.dueDate,
          priority: parsed.priority,
          customTags: customTagsRef.current,
        });
      });
      updateSettings({ lastUsedListId: listId });
    },
    [withUndo, addCustomTag, updateSettings]
  );

  const duplicateItem = useCallback(
    (listId, itemId) => {
      withUndo('Item duplicated', () => {
        dispatch({ type: 'DUPLICATE_ITEM', listId, itemId });
      });
    },
    [withUndo]
  );

  const moveItem = useCallback(
    (fromListId, itemId, toListId) => {
      if (fromListId === toListId) return;
      withUndo('Item moved', () => {
        dispatch({ type: 'MOVE_ITEM', fromListId, itemId, toListId });
      });
    },
    [withUndo]
  );

  const bulkUpdateItems = useCallback(
    (listId, itemIds, patch) => {
      withUndo(`Updated ${itemIds.length} item(s)`, () => {
        dispatch({
          type: 'BULK_UPDATE_ITEMS',
          listId,
          itemIds,
          patch,
          customTags: customTagsRef.current,
        });
      });
    },
    [withUndo]
  );

  const bulkMoveItems = useCallback(
    (fromListId, itemIds, toListId) => {
      withUndo(`Moved ${itemIds.length} item(s)`, () => {
        dispatch({ type: 'BULK_MOVE_ITEMS', fromListId, itemIds, toListId });
      });
    },
    [withUndo]
  );

  const bulkArchiveItems = useCallback(
    (listId, itemIds) => {
      const list = listsRef.current.find((l) => l.id === listId);
      if (!list) return;
      const items = list.items.filter((i) => itemIds.includes(i.id));
      if (!items.length) return;
      withUndo(`Archived ${items.length} item(s)`, () => {
        dispatch({ type: 'BULK_ARCHIVE_ITEMS', listId, itemIds });
        setArchived((prev) => [
          ...items.map((item) => ({
            ...item,
            archivedAt: new Date().toISOString(),
            fromListId: list.id,
            fromListName: list.name,
          })),
          ...prev,
        ]);
      });
    },
    [withUndo]
  );

  const toggleItem = useCallback(
    (listId, itemId) => {
      const list = listsRef.current.find((l) => l.id === listId);
      const item = list?.items.find((i) => i.id === itemId);
      const wasComplete = item?.complete;
      withUndo(wasComplete ? 'Item unchecked' : 'Item completed', () => {
        dispatch({ type: 'TOGGLE_ITEM', listId, itemId });
      });
      if (!wasComplete && list) {
        const othersIncomplete = list.items.filter((i) => i.id !== itemId && !i.complete);
        if (othersIncomplete.length === 0) {
          setTimeout(() => launchConfetti(), 100);
        }
      }
    },
    [withUndo]
  );

  const renameItem = useCallback(
    (listId, itemId, name) => {
      withUndo('Item renamed', () => {
        dispatch({ type: 'RENAME_ITEM', listId, itemId, name });
      });
    },
    [withUndo]
  );

  const updateItemFields = useCallback(
    (listId, itemId, patch) => {
      dispatch({
        type: 'UPDATE_ITEM',
        listId,
        itemId,
        patch,
        customTags: customTagsRef.current,
      });
    },
    []
  );

  const addSubItem = useCallback((listId, itemId, text) => {
    dispatch({ type: 'ADD_SUB_ITEM', listId, itemId, text });
  }, []);

  const toggleSubItem = useCallback((listId, itemId, subItemId) => {
    dispatch({ type: 'TOGGLE_SUB_ITEM', listId, itemId, subItemId });
  }, []);

  const deleteSubItem = useCallback((listId, itemId, subItemId) => {
    dispatch({ type: 'DELETE_SUB_ITEM', listId, itemId, subItemId });
  }, []);

  const reorderItems = useCallback(
    (listId, activeId, overId) => {
      withUndo('Items reordered', () => {
        dispatch({ type: 'REORDER_ITEMS', listId, activeId, overId });
      });
    },
    [withUndo]
  );

  const reorderSubItems = useCallback(
    (listId, itemId, activeId, overId) => {
      withUndo('Sub-items reordered', () => {
        dispatch({ type: 'REORDER_SUB_ITEMS', listId, itemId, activeId, overId });
      });
    },
    [withUndo]
  );

  const archiveItem = useCallback(
    (listId, itemId) => {
      const list = listsRef.current.find((l) => l.id === listId);
      const item = list?.items.find((i) => i.id === itemId);
      if (!list || !item) return;
      withUndo('Item archived', () => {
        dispatch({ type: 'DELETE_ITEM', listId, itemId });
        setArchived((prev) => [
          {
            ...item,
            archivedAt: new Date().toISOString(),
            fromListId: list.id,
            fromListName: list.name,
          },
          ...prev,
        ]);
      });
    },
    [withUndo]
  );

  const archiveCompletedItems = useCallback(
    (listId) => {
      const list = listsRef.current.find((l) => l.id === listId);
      if (!list) return;
      const completed = list.items.filter((i) => i.complete);
      if (!completed.length) return;
      withUndo(
        `Archived ${completed.length} completed item${completed.length === 1 ? '' : 's'}`,
        () => {
          dispatch({ type: 'DELETE_COMPLETED_ITEMS', listId });
          setArchived((prev) => [
            ...completed.map((item) => ({
              ...item,
              archivedAt: new Date().toISOString(),
              fromListId: list.id,
              fromListName: list.name,
            })),
            ...prev,
          ]);
        }
      );
    },
    [withUndo]
  );

  const restoreArchived = useCallback(
    (archivedId, targetListId) => {
      const entry = archivedRef.current.find((a) => a.id === archivedId);
      if (!entry) return;
      const listId =
        targetListId ||
        (listsRef.current.some((l) => l.id === entry.fromListId)
          ? entry.fromListId
          : listsRef.current[0]?.id);
      if (!listId) return;
      withUndo('Item restored', () => {
        const { archivedAt, fromListId, fromListName, ...item } = entry;
        dispatch({
          type: 'RESTORE_ITEM',
          listId,
          item,
          customTags: customTagsRef.current,
        });
        setArchived((prev) => prev.filter((a) => a.id !== archivedId));
      });
    },
    [withUndo]
  );

  const purgeArchived = useCallback(
    (archivedId) => {
      withUndo('Archived item removed', () => {
        setArchived((prev) => prev.filter((a) => a.id !== archivedId));
      });
    },
    [withUndo]
  );

  const deleteItem = useCallback(
    (listId, itemId) => archiveItem(listId, itemId),
    [archiveItem]
  );

  const deleteCompletedItems = useCallback(
    (listId) => archiveCompletedItems(listId),
    [archiveCompletedItems]
  );

  const importLists = useCallback(
    (data, mode = 'replace', { migrateLegacyPriorities = false } = {}) => {
      const incoming = migrateLegacyPriorities
        ? normalizeLists(data, customTagsRef.current, { migrateLegacyPriorities: true }).lists
        : data;
      if (mode === 'merge') {
        const result = mergeLists(listsRef.current, incoming);
        if (!result.ok) return result;
        withUndo('Lists merged', () => {
          dispatch({ type: 'SET_LISTS', lists: result.lists });
        });
        return result;
      }
      const result = normalizeLists(incoming, customTagsRef.current);
      if (!result.ok) return result;
      withUndo('Lists imported', () => {
        dispatch({ type: 'SET_LISTS', lists: result.lists });
      });
      return result;
    },
    [withUndo]
  );

  const exportBackup = useCallback(() => {
    downloadBackup(listsRef.current, archivedRef.current, customTagsRef.current);
    updateSettings({ lastBackupAt: new Date().toISOString() });
  }, [updateSettings]);

  const showBackupReminder = needsBackupReminder(settings);

  return {
    lists,
    archived,
    customTags,
    userTemplates,
    settings,
    undoStack,
    redoStack,
    toast,
    storageError,
    showBackupReminder,
    applyUndo,
    applyRedo,
    dismissToast,
    updateSettings,
    addCustomTag,
    addList,
    duplicateList,
    saveListAsTemplate,
    addTemplate,
    renameList,
    setListStyle,
    setListMeta,
    deleteList,
    reorderLists,
    addItem,
    duplicateItem,
    moveItem,
    bulkUpdateItems,
    bulkMoveItems,
    bulkArchiveItems,
    toggleItem,
    renameItem,
    updateItemFields,
    addSubItem,
    toggleSubItem,
    deleteSubItem,
    reorderItems,
    reorderSubItems,
    deleteItem,
    deleteCompletedItems,
    archiveItem,
    archiveCompletedItems,
    restoreArchived,
    purgeArchived,
    importLists,
    exportBackup,
    clearStorageError: () => setStorageError(null),
  };
}
