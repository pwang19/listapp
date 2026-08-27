import { useReducer, useEffect, useCallback, useRef, useState } from 'react';
import { createId } from '../utils/ids';
import {
  saveLists,
  loadArchived,
  saveArchived,
  loadSettings,
  saveSettings,
  loadCustomTags,
  saveCustomTags,
  loadUserTemplates,
  saveUserTemplates,
  loadItemTemplates,
  saveItemTemplates,
  downloadBackup,
  needsBackupReminder,
} from '../utils/storage';
import {
  normalizeLists,
  normalizeItem,
  normalizeList,
  normalizeCustomTag,
} from '../utils/normalizeLists';
import { mergeLists } from '../utils/mergeLists';
import { PRIORITY_SCALE_VERSION, BUILTIN_TAG_IDS } from '../utils/constants';
import { TEMPLATES } from '../utils/templates';
import { parseQuickAdd } from '../utils/parseQuickAdd';
import { parseBatchQuickAdd } from '../utils/batchQuickAdd';
import { isItemBlocked } from '../utils/dependencies';
import { createCustomTag } from '../utils/tags';
import { launchConfetti } from '../utils/confetti';
import { syncStreak } from '../utils/streaks';
import { listsReducer, getInitialLists, getInitialArchived } from '../state/listsReducer';
import {
  trimStack,
  createUndoEntry,
  createRedoEntry,
  popUndoEntry,
  popRedoEntry,
  applySnapshot,
} from '../state/undoStack';

export function useLists() {
  const [lists, dispatch] = useReducer(listsReducer, undefined, getInitialLists);
  const [archived, setArchived] = useState(getInitialArchived);
  const [customTags, setCustomTags] = useState(loadCustomTags);
  const [userTemplates, setUserTemplates] = useState(loadUserTemplates);
  const [itemTemplates, setItemTemplates] = useState(loadItemTemplates);
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
  useEffect(() => { saveItemTemplates(itemTemplates); }, [itemTemplates]);
  useEffect(() => { saveSettings(settings); }, [settings]);

  useEffect(() => {
    if (!settings.streaksEnabled) return;
    setSettings((prev) => {
      if (!prev.streaksEnabled) return prev;
      const patch = syncStreak(prev, lists);
      if (!patch) return prev;
      const next = { ...prev, ...patch };
      if (
        prev.streakCurrent === next.streakCurrent &&
        prev.streakLongest === next.streakLongest &&
        prev.streakLastGoodDate === next.streakLastGoodDate
      ) {
        return prev;
      }
      return next;
    });
  }, [lists, settings.streaksEnabled]);

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
      const entry = createUndoEntry(message, before);
      setUndoStack((stack) => trimStack([entry, ...stack]));
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
      const { entry, rest } = popUndoEntry(stack);
      if (!entry) return stack;
      const current = snapshot();
      setRedoStack((redo) => trimStack([{ ...entry, redoSnapshot: current }, ...redo]));
      applySnapshot(entry, { dispatch, setArchived, setCustomTags });
      clearUndoTimer();
      setToast(null);
      return rest;
    });
  }, [clearUndoTimer, snapshot]);

  const applyRedo = useCallback(() => {
    setRedoStack((stack) => {
      const { entry, rest } = popRedoEntry(stack);
      if (!entry) return stack;
      const before = snapshot();
      setUndoStack((undo) => trimStack([createRedoEntry(before), ...undo]));
      if (entry.redoSnapshot) {
        applySnapshot(entry.redoSnapshot, { dispatch, setArchived, setCustomTags });
      } else {
        applySnapshot(entry, { dispatch, setArchived, setCustomTags });
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

  const updateCustomTag = useCallback((tagId, patch) => {
    setCustomTags((prev) =>
      prev.map((tag) => (tag.id === tagId ? normalizeCustomTag({ ...tag, ...patch }) : tag))
    );
  }, []);

  const deleteCustomTag = useCallback((tagId) => {
    setCustomTags((prev) => prev.filter((tag) => tag.id !== tagId && tag.parentId !== tagId));
  }, []);

  const addList = useCallback(
    (name, style = {}) => {
      withUndo('List added', () => {
        dispatch({
          type: 'ADD_LIST',
          name,
          color: style.color,
          icon: style.icon,
          isFolder: style.isFolder,
          parentId: style.parentId,
          customTags: customTagsRef.current,
        });
      });
      updateSettings({ lastUsedListId: '' });
    },
    [withUndo, updateSettings]
  );

  const ensureInbox = useCallback(() => {
    const existing = listsRef.current.find((l) => l.name.toLowerCase() === 'inbox');
    if (existing) {
      if (settings.inboxListId !== existing.id) {
        updateSettings({ inboxListId: existing.id });
      }
      return existing.id;
    }
    const list = normalizeList({ name: 'Inbox', icon: '📥', color: 'blue' }, customTagsRef.current);
    dispatch({ type: 'SET_LISTS', lists: [list, ...listsRef.current] });
    updateSettings({ inboxListId: list.id });
    return list.id;
  }, [settings.inboxListId, updateSettings]);

  const addFolder = useCallback(
    (name) => {
      addList(name, { icon: '📁', color: 'slate', isFolder: true });
    },
    [addList]
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
    (listId, style = {}) => {
      withUndo('List style updated', () => {
        dispatch({ type: 'SET_LIST_STYLE', listId, ...style });
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
            !BUILTIN_TAG_IDS.includes(tagId)) {
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
          estimateMinutes: parsed.estimateMinutes,
          customTags: customTagsRef.current,
        });
      });
      updateSettings({ lastUsedListId: listId });
    },
    [withUndo, addCustomTag, updateSettings]
  );

  const addItems = useCallback(
    (listId, lines) => {
      const parsedItems = parseBatchQuickAdd(lines);
      if (!parsedItems.length) return;
      parsedItems.forEach((parsed) => {
        parsed.tags.forEach((tagId) => {
          if (!customTagsRef.current.some((t) => t.id === tagId) &&
              !BUILTIN_TAG_IDS.includes(tagId)) {
            addCustomTag(tagId);
          }
        });
      });
      withUndo(`Added ${parsedItems.length} items`, () => {
        dispatch({
          type: 'ADD_ITEMS',
          listId,
          items: parsedItems,
          customTags: customTagsRef.current,
        });
      });
      updateSettings({ lastUsedListId: listId });
    },
    [withUndo, addCustomTag, updateSettings]
  );

  const captureToInbox = useCallback(
    (text) => {
      const listId = ensureInbox();
      addItem(listId, text);
    },
    [ensureInbox, addItem]
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
      if (!item) return false;
      const wasComplete = item.complete;
      if (!wasComplete && isItemBlocked(listsRef.current, item)) return false;
      withUndo(wasComplete ? 'Item unchecked' : 'Item completed', () => {
        dispatch({ type: 'TOGGLE_ITEM', listId, itemId });
      });
      if (!wasComplete && list) {
        const othersIncomplete = list.items.filter((i) => i.id !== itemId && !i.complete);
        if (othersIncomplete.length === 0) {
          setTimeout(() => launchConfetti(), 100);
        }
      }
      return true;
    },
    [withUndo]
  );

  const skipRecurring = useCallback((listId, itemId) => {
    withUndo('Skipped recurring occurrence', () => {
      dispatch({ type: 'SKIP_RECURRING', listId, itemId });
    });
  }, [withUndo]);

  const saveItemAsTemplate = useCallback((listId, itemId, name) => {
    const list = listsRef.current.find((l) => l.id === listId);
    const item = list?.items.find((i) => i.id === itemId);
    if (!item) return;
    const template = {
      id: createId(),
      name: name || item.text,
      text: item.text,
      description: item.description || '',
      tags: item.tags || [],
      priority: item.priority || 0,
      estimateMinutes: item.estimateMinutes || 0,
      subItems: (item.subItems || []).map((s) => ({ text: s.text })),
    };
    setItemTemplates((prev) => [...prev, template]);
  }, []);

  const addItemFromTemplate = useCallback(
    (listId, templateId) => {
      const template = itemTemplates.find((t) => t.id === templateId);
      if (!template) return;
      withUndo(`Added "${template.name}"`, () => {
        dispatch({
          type: 'ADD_ITEM',
          listId,
          text: template.text,
          description: template.description || '',
          tags: template.tags || [],
          priority: template.priority || 0,
          estimateMinutes: template.estimateMinutes || 0,
          subItems: (template.subItems || []).map((s) => ({ text: s.text, complete: false })),
          customTags: customTagsRef.current,
        });
      });
    },
    [withUndo, itemTemplates]
  );

  const deleteItemTemplate = useCallback((templateId) => {
    setItemTemplates((prev) => prev.filter((t) => t.id !== templateId));
  }, []);

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
    itemTemplates,
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
    updateCustomTag,
    deleteCustomTag,
    addList,
    addFolder,
    ensureInbox,
    captureToInbox,
    duplicateList,
    saveListAsTemplate,
    addTemplate,
    renameList,
    setListStyle,
    setListMeta,
    deleteList,
    reorderLists,
    addItem,
    addItems,
    duplicateItem,
    moveItem,
    bulkUpdateItems,
    bulkMoveItems,
    bulkArchiveItems,
    toggleItem,
    skipRecurring,
    saveItemAsTemplate,
    addItemFromTemplate,
    deleteItemTemplate,
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
