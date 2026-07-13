import { useReducer, useEffect, useCallback, useRef, useState } from 'react';
import { createId } from '../utils/ids';
import {
  loadLists,
  saveLists,
  loadArchived,
  saveArchived,
} from '../utils/storage';
import {
  normalizeLists,
  normalizeItem,
  normalizeSubItem,
  normalizeList,
  normalizeArchived,
} from '../utils/normalizeLists';
import { mergeLists } from '../utils/mergeLists';
import { reorderArray } from '../utils/helpers';
import { MAX_UNDO } from '../utils/constants';
import { TEMPLATES } from '../utils/templates';

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
        }),
      ];
    case 'RENAME_LIST':
      return updateList(state, action.listId, (list) => ({ ...list, name: action.name }));
    case 'SET_LIST_STYLE':
      return updateList(state, action.listId, (list) => ({
        ...list,
        color: action.color ?? list.color,
        icon: action.icon ?? list.icon,
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
            dueDate: '',
            tags: [],
            subItems: [],
          }),
        ],
      }));
    case 'RESTORE_ITEM':
      return updateList(state, action.listId, (list) => ({
        ...list,
        items: [...list.items, normalizeItem(action.item)],
      }));
    case 'TOGGLE_ITEM':
      return updateItem(state, action.listId, action.itemId, (item) => ({
        ...item,
        complete: !item.complete,
      }));
    case 'RENAME_ITEM':
      return updateItem(state, action.listId, action.itemId, (item) => ({
        ...item,
        text: action.name,
      }));
    case 'SET_ITEM_DESCRIPTION':
      return updateItem(state, action.listId, action.itemId, (item) => ({
        ...item,
        description: action.description,
      }));
    case 'SET_ITEM_DUE_DATE':
      return updateItem(state, action.listId, action.itemId, (item) => ({
        ...item,
        dueDate: action.dueDate,
      }));
    case 'SET_ITEM_TAGS':
      return updateItem(state, action.listId, action.itemId, (item) => ({
        ...item,
        tags: action.tags,
      }));
    case 'UPDATE_ITEM':
      return updateItem(state, action.listId, action.itemId, (item) =>
        normalizeItem({ ...item, ...action.patch })
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
  const result = normalizeLists(stored);
  return result.ok ? result.lists : [];
}

function getInitialArchived() {
  return normalizeArchived(loadArchived());
}

export function useLists() {
  const [lists, dispatch] = useReducer(listsReducer, undefined, getInitialLists);
  const [archived, setArchived] = useState(getInitialArchived);
  const [undoStack, setUndoStack] = useState([]);
  const [toast, setToast] = useState(null);
  const undoTimerRef = useRef(null);
  const listsRef = useRef(lists);
  const archivedRef = useRef(archived);

  useEffect(() => {
    listsRef.current = lists;
  }, [lists]);

  useEffect(() => {
    archivedRef.current = archived;
  }, [archived]);

  useEffect(() => {
    saveLists(lists);
  }, [lists]);

  useEffect(() => {
    saveArchived(archived);
  }, [archived]);

  const clearUndoTimer = useCallback(() => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }, []);

  const pushHistory = useCallback(
    (message, snapshot) => {
      const entry = {
        id: createId(),
        message,
        lists: snapshot.lists,
        archived: snapshot.archived,
      };
      setUndoStack((stack) => [entry, ...stack].slice(0, MAX_UNDO));
      clearUndoTimer();
      setToast({ id: entry.id, message });
      undoTimerRef.current = setTimeout(() => {
        setToast(null);
        undoTimerRef.current = null;
      }, 5000);
      if (typeof undoTimerRef.current.unref === 'function') {
        undoTimerRef.current.unref();
      }
    },
    [clearUndoTimer]
  );

  const snapshot = useCallback(
    () => ({
      lists: listsRef.current,
      archived: archivedRef.current,
    }),
    []
  );

  const dismissToast = useCallback(() => {
    clearUndoTimer();
    setToast(null);
  }, [clearUndoTimer]);

  const applyUndo = useCallback(() => {
    setUndoStack((stack) => {
      if (!stack.length) return stack;
      const [latest, ...rest] = stack;
      dispatch({ type: 'RESTORE_SNAPSHOT', lists: latest.lists });
      setArchived(latest.archived);
      clearUndoTimer();
      setToast(null);
      return rest;
    });
  }, [clearUndoTimer]);

  useEffect(() => () => clearUndoTimer(), [clearUndoTimer]);

  const withUndo = useCallback(
    (message, fn) => {
      const before = snapshot();
      fn();
      // Defer push so refs update after React processes? Actually fn sync dispatches
      // but listsRef updates in useEffect. Need to compute next state or capture before.
      pushHistory(message, before);
    },
    [snapshot, pushHistory]
  );

  const addList = useCallback((name, style = {}) => {
    dispatch({
      type: 'ADD_LIST',
      name,
      color: style.color,
      icon: style.icon,
    });
  }, []);

  const addTemplate = useCallback(
    (templateId) => {
      const template = TEMPLATES.find((t) => t.id === templateId);
      if (!template) return;
      withUndo(`Added "${template.name}" template`, () => {
        const list = normalizeList({
          name: template.name,
          icon: template.icon,
          color: template.color,
          items: template.items.map((item) => normalizeItem(item)),
        });
        dispatch({ type: 'SET_LISTS', lists: [...listsRef.current, list] });
      });
    },
    [withUndo]
  );

  const renameList = useCallback(
    (listId, name) => {
      withUndo('List renamed', () => {
        dispatch({ type: 'RENAME_LIST', listId, name });
      });
    },
    [withUndo]
  );

  const setListStyle = useCallback((listId, { color, icon }) => {
    dispatch({ type: 'SET_LIST_STYLE', listId, color, icon });
  }, []);

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
      withUndo('Lists reordered', () => {
        dispatch({ type: 'REORDER_LISTS', activeId, overId });
      });
    },
    [withUndo]
  );

  const addItem = useCallback((listId, text) => {
    dispatch({ type: 'ADD_ITEM', listId, text });
  }, []);

  const toggleItem = useCallback((listId, itemId) => {
    dispatch({ type: 'TOGGLE_ITEM', listId, itemId });
  }, []);

  const renameItem = useCallback((listId, itemId, name) => {
    dispatch({ type: 'RENAME_ITEM', listId, itemId, name });
  }, []);

  const setItemDescription = useCallback((listId, itemId, description) => {
    dispatch({ type: 'SET_ITEM_DESCRIPTION', listId, itemId, description });
  }, []);

  const setItemDueDate = useCallback((listId, itemId, dueDate) => {
    dispatch({ type: 'SET_ITEM_DUE_DATE', listId, itemId, dueDate });
  }, []);

  const setItemTags = useCallback((listId, itemId, tags) => {
    dispatch({ type: 'SET_ITEM_TAGS', listId, itemId, tags });
  }, []);

  const updateItemFields = useCallback((listId, itemId, patch) => {
    dispatch({ type: 'UPDATE_ITEM', listId, itemId, patch });
  }, []);

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
        dispatch({ type: 'RESTORE_ITEM', listId, item });
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
    (listId, itemId) => {
      archiveItem(listId, itemId);
    },
    [archiveItem]
  );

  const deleteCompletedItems = useCallback(
    (listId) => {
      archiveCompletedItems(listId);
    },
    [archiveCompletedItems]
  );

  const importLists = useCallback(
    (data, mode = 'replace') => {
      if (mode === 'merge') {
        const result = mergeLists(listsRef.current, data);
        if (!result.ok) return result;
        withUndo('Lists merged', () => {
          dispatch({ type: 'SET_LISTS', lists: result.lists });
        });
        return result;
      }
      const result = normalizeLists(data);
      if (!result.ok) return result;
      withUndo('Lists imported', () => {
        dispatch({ type: 'SET_LISTS', lists: result.lists });
      });
      return result;
    },
    [withUndo]
  );

  return {
    lists,
    archived,
    undoStack,
    toast,
    applyUndo,
    dismissToast,
    addList,
    addTemplate,
    renameList,
    setListStyle,
    deleteList,
    reorderLists,
    addItem,
    toggleItem,
    renameItem,
    setItemDescription,
    setItemDueDate,
    setItemTags,
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
  };
}
