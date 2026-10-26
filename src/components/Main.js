import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import GridView from './GridView';
import Toolbar from './Toolbar';
import ListItemModal from './lists/ListItemModal';
import ConfirmModal from './modals/ConfirmModal';
import ImportExportModal from './modals/ImportExportModal';
import Toast from './ui/Toast';
import ArchiveShelf from './modals/ArchiveShelf';
import TemplatesModal from './modals/TemplatesModal';
import PrintShareModal from './modals/PrintShareModal';
import UpcomingView from './views/UpcomingView';
import AllItemsView from './views/AllItemsView';
import KanbanView from './views/KanbanView';
import CalendarView from './views/CalendarView';
import CommandPalette from './ui/CommandPalette';
import BulkActionBar from './ui/BulkActionBar';
import LiveRegion from './ui/LiveRegion';
import { useLists } from '../hooks/useLists';
import { useSync } from '../hooks/useSync';
import { pickSyncedSettings } from '../utils/sync';
import SyncModal from './modals/SyncModal';
import { getAllTags } from '../utils/tags';
import { listMatchesFilters, hasActiveFilters, filterItemRows } from '../utils/filterItems';
import { sortListsForDisplay } from '../utils/sortItems';
import { getUpcomingItems, flattenAllItems } from '../utils/helpers';
import { decodeListFromHash } from '../utils/shareLink';
import { normalizeList } from '../utils/normalizeLists';
import BulkTagModal from './modals/BulkTagModal';
import ListStatsModal from './modals/ListStatsModal';
import SaveFilterModal from './modals/SaveFilterModal';
import QuickCaptureModal from './modals/QuickCaptureModal';
import ReviewModal from './modals/ReviewModal';
import ItemTemplatesModal from './modals/ItemTemplatesModal';
import TagManagerModal from './modals/TagManagerModal';
import FocusTimer from './ui/FocusTimer';
import { buildNavigableItems } from '../utils/keyboardNav';
import { createId } from '../utils/ids';
import { buildSnoozePatch, todayDateString } from '../utils/snooze';
import { isItemBlocked } from '../utils/dependencies';

function Main() {
  const {
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
    restoreArchived,
    purgeArchived,
    importLists,
    replaceSyncedState,
    restoreSyncedVersion,
    exportBackup,
    clearStorageError,
  } = useLists();

  // Keyed by content so changes to device-only settings don't produce a new doc.
  const syncedSettingsJson = JSON.stringify(pickSyncedSettings(settings));
  const syncedSettings = useMemo(() => JSON.parse(syncedSettingsJson), [syncedSettingsJson]);
  const syncDoc = useMemo(
    () => ({ lists, archived, customTags, userTemplates, itemTemplates, settings: syncedSettings }),
    [lists, archived, customTags, userTemplates, itemTemplates, syncedSettings]
  );
  const sync = useSync(syncDoc, replaceSyncedState);
  const [syncOpen, setSyncOpen] = useState(false);

  const [inputValue, setInputValue] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [listToDelete, setListToDelete] = useState(null);
  const [importExportModalOpen, setImportExportModalOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [itemFilter, setItemFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkSelected, setBulkSelected] = useState(new Map());
  const [liveMessage, setLiveMessage] = useState('');
  const [shareImportOpen, setShareImportOpen] = useState(false);
  const [pendingShareList, setPendingShareList] = useState(null);
  const [activeDragId, setActiveDragId] = useState(null);
  const [modalTarget, setModalTarget] = useState(null);
  const [bulkTagModalOpen, setBulkTagModalOpen] = useState(false);
  const [saveFilterModalOpen, setSaveFilterModalOpen] = useState(false);
  const [statsListId, setStatsListId] = useState(null);
  const [focusedItemKey, setFocusedItemKey] = useState('');
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [itemTemplatesOpen, setItemTemplatesOpen] = useState(false);
  const [tagManagerOpen, setTagManagerOpen] = useState(false);

  const searchRef = useRef(null);
  const newListRef = useRef(null);
  const fileDropRef = useRef(null);

  const filtersActive = hasActiveFilters({ searchQuery, tagFilter, itemFilter });
  const allTags = getAllTags(customTags);
  const viewMode = settings.viewMode || 'grid';

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const anyModalOpen =
    deleteModalOpen || importExportModalOpen || archiveOpen || templatesOpen ||
    printOpen || helpOpen || commandOpen || shareImportOpen || bulkTagModalOpen ||
    saveFilterModalOpen || Boolean(statsListId) || quickCaptureOpen || reviewOpen ||
    itemTemplatesOpen || tagManagerOpen || Boolean(modalTarget);

  const matchingLists = useMemo(
    () => lists.filter((list) => listMatchesFilters(list, { searchQuery, tagFilter, itemFilter })),
    [lists, searchQuery, tagFilter, itemFilter]
  );

  const listsToShow = useMemo(() => {
    const pinned = settings.pinnedListIds || [];
    let sorted = sortListsForDisplay(
      matchingLists.filter((l) => l.isFolder || !l.parentId),
      { pinnedIds: pinned }
    );
    if (settings.focusListId) {
      sorted = sorted.filter((l) => l.id === settings.focusListId);
    }
    return sorted;
  }, [matchingLists, settings.pinnedListIds, settings.focusListId]);

  const upcomingItems = useMemo(
    () => getUpcomingItems(lists).map((r) => ({ ...r, item: { ...r.item, listColor: lists.find((l) => l.id === r.listId)?.color } })),
    [lists]
  );

  const blockedItems = useMemo(() => {
    const rows = [];
    lists.forEach((list) => {
      if (list.isFolder) return;
      (list.items || []).forEach((item) => {
        if (isItemBlocked(lists, item)) {
          rows.push({
            listId: list.id,
            listName: list.name,
            listIcon: list.icon,
            item: { ...item, listColor: list.color },
          });
        }
      });
    });
    return rows;
  }, [lists]);

  const allItemRows = useMemo(
    () => filterItemRows(flattenAllItems(lists), { itemFilter, searchQuery, tagFilter }),
    [lists, itemFilter, tagFilter, searchQuery]
  );

  const navigableItems = useMemo(
    () =>
      buildNavigableItems({
        viewMode,
        lists,
        listsToShow,
        allItemRows,
        upcomingItems,
        itemFilter,
        searchQuery,
        tagFilter,
      }),
    [viewMode, lists, listsToShow, allItemRows, upcomingItems, itemFilter, searchQuery, tagFilter]
  );

  const savedFilters = settings.savedFilters || [];
  const statsList = statsListId ? lists.find((l) => l.id === statsListId) : null;

  const inboxList = lists.find((l) => l.id === settings.inboxListId) ||
    lists.find((l) => l.name.toLowerCase() === 'inbox');

  const handleToggleItem = useCallback((listId, itemId) => {
    const ok = toggleItem(listId, itemId);
    if (!ok) announce('Item is blocked by incomplete dependencies');
    return ok;
  }, [toggleItem]);

  const handleToggleFolder = useCallback((folderId) => {
    const expanded = new Set(settings.expandedFolderIds || []);
    if (expanded.has(folderId)) expanded.delete(folderId);
    else expanded.add(folderId);
    updateSettings({ expandedFolderIds: [...expanded] });
  }, [settings.expandedFolderIds, updateSettings]);

  const [pomodoroRemaining, setPomodoroRemaining] = useState(0);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);

  useEffect(() => {
    if (!pomodoroRunning || pomodoroRemaining <= 0) return undefined;
    const id = setTimeout(() => {
      setPomodoroRemaining((value) => {
        if (value <= 1) {
          setPomodoroRunning(false);
          announce('Focus session complete');
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearTimeout(id);
  }, [pomodoroRunning, pomodoroRemaining]);

  const openItemModal = useCallback((listId, itemId) => {
    setModalTarget({ listId, itemId });
  }, []);

  const closeItemModal = useCallback(() => {
    setModalTarget(null);
  }, []);

  const modalList = modalTarget ? lists.find((l) => l.id === modalTarget.listId) : null;
  const modalItem = modalList?.items.find((i) => i.id === modalTarget?.itemId) ?? null;

  useEffect(() => {
    const shared = decodeListFromHash(window.location.hash);
    if (shared) {
      setPendingShareList(shared);
      setShareImportOpen(true);
    }
  }, []);

  useEffect(() => {
    const mode = settings.darkMode || 'system';
    const root = document.documentElement;
    if (mode === 'dark') root.setAttribute('data-theme', 'dark');
    else if (mode === 'light') root.removeAttribute('data-theme');
    else {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      root.setAttribute('data-theme', mq.matches ? 'dark' : 'light');
      const handler = (e) => root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
    return undefined;
  }, [settings.darkMode]);

  useEffect(() => {
    const density = settings.density || 'comfortable';
    document.documentElement.setAttribute('data-density', density);
  }, [settings.density]);

  useEffect(() => {
    const onDragOver = (e) => {
      if (e.dataTransfer?.types?.includes('Files')) e.preventDefault();
    };
    const onDrop = (e) => {
      const file = e.dataTransfer?.files?.[0];
      if (file?.name.endsWith('.json')) {
        e.preventDefault();
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const parsed = JSON.parse(reader.result);
            const data = Array.isArray(parsed) ? parsed : parsed.lists;
            const migrateLegacyPriorities = Array.isArray(parsed)
              ? true
              : (parsed.version || 1) < 3;
            if (!Array.isArray(data)) {
              announce('Invalid JSON file');
              return;
            }
            importLists(data, 'merge', { migrateLegacyPriorities });
            announce('File imported');
          } catch {
            announce('Invalid JSON file');
          }
        };
        reader.readAsText(file);
      }
    };
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', onDrop);
    };
  }, [importLists]);

  const announce = (msg) => setLiveMessage(msg);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && inputValue.trim() !== '') {
      addList(inputValue.trim());
      setInputValue('');
      announce('List added');
    }
  };

  const listPendingDelete = lists.find((list) => list.id === listToDelete);

  const handleConfirmDelete = () => {
    if (listToDelete) deleteList(listToDelete);
    setDeleteModalOpen(false);
    setListToDelete(null);
  };

  const isTypingTarget = (target) => {
    if (!target) return false;
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
  };

  const clearFilters = () => {
    setSearchQuery('');
    setTagFilter('');
    setItemFilter('all');
    announce('Filters cleared');
  };

  const applySavedFilter = useCallback((filterId) => {
    const filter = savedFilters.find((f) => f.id === filterId);
    if (!filter) return;
    setSearchQuery(filter.searchQuery || '');
    setItemFilter(filter.itemFilter || 'all');
    setTagFilter(filter.tagFilter || '');
    announce(`Applied view “${filter.name}”`);
  }, [savedFilters]);

  const handleSaveFilter = useCallback((name) => {
    const entry = {
      id: createId(),
      name,
      searchQuery,
      itemFilter,
      tagFilter,
    };
    updateSettings({ savedFilters: [...savedFilters, entry] });
    announce(`Saved view “${name}”`);
  }, [savedFilters, searchQuery, itemFilter, tagFilter, updateSettings]);

  const deleteSavedFilter = useCallback((filterId) => {
    updateSettings({ savedFilters: savedFilters.filter((f) => f.id !== filterId) });
    announce('Saved view deleted');
  }, [savedFilters, updateSettings]);

  const focusNavItem = useCallback((key) => {
    setFocusedItemKey(key);
    requestAnimationFrame(() => {
      document.querySelector(`[data-item-key="${key}"]`)?.scrollIntoView({ block: 'nearest' });
    });
  }, []);

  const navigateItems = useCallback((direction) => {
    if (!navigableItems.length) return;
    const currentIndex = navigableItems.findIndex((item) => item.key === focusedItemKey);
    let nextIndex;
    if (currentIndex < 0) {
      nextIndex = direction > 0 ? 0 : navigableItems.length - 1;
    } else {
      nextIndex = currentIndex + direction;
      if (nextIndex < 0) nextIndex = navigableItems.length - 1;
      if (nextIndex >= navigableItems.length) nextIndex = 0;
    }
    focusNavItem(navigableItems[nextIndex].key);
  }, [navigableItems, focusedItemKey, focusNavItem]);

  const toggleBulkSelect = (listId, itemId) => {
    setBulkSelected((prev) => {
      const next = new Map(prev);
      const key = `${listId}:${itemId}`;
      if (next.has(key)) next.delete(key);
      else next.set(key, { listId, itemId });
      return next;
    });
  };

  const bulkByList = useMemo(() => {
    const map = new Map();
    bulkSelected.forEach(({ listId, itemId }) => {
      if (!map.has(listId)) map.set(listId, []);
      map.get(listId).push(itemId);
    });
    return map;
  }, [bulkSelected]);

  const handleBulkComplete = () => {
    bulkByList.forEach((itemIds, listId) => {
      bulkUpdateItems(listId, itemIds, { complete: true });
    });
    setBulkSelected(new Map());
    announce('Items completed');
  };

  const handleBulkArchive = () => {
    bulkByList.forEach((itemIds, listId) => {
      bulkArchiveItems(listId, itemIds);
    });
    setBulkSelected(new Map());
    announce('Items archived');
  };

  const handleBulkMove = (toListId) => {
    bulkByList.forEach((itemIds, fromListId) => {
      if (fromListId !== toListId) bulkMoveItems(fromListId, itemIds, toListId);
    });
    setBulkSelected(new Map());
    announce('Items moved');
  };

  const handleBulkAddTag = () => {
    setBulkTagModalOpen(true);
  };

  const handleBulkTagConfirm = (tagIds) => {
    bulkByList.forEach((itemIds, listId) => {
      itemIds.forEach((itemId) => {
        const list = lists.find((l) => l.id === listId);
        const item = list?.items.find((i) => i.id === itemId);
        if (item) {
          const tags = [...new Set([...(item.tags || []), ...tagIds])];
          updateItemFields(listId, itemId, { tags });
        }
      });
    });
    setBulkSelected(new Map());
    announce('Tags added');
  };

  const handleKanbanColumnDrop = useCallback((listId, itemId, columnId, groupBy) => {
    const list = lists.find((l) => l.id === listId);
    const item = list?.items.find((i) => i.id === itemId);
    if (!item) return;

    if (groupBy === 'status') {
      const shouldComplete = columnId === 'completed';
      if (item.complete !== shouldComplete) toggleItem(listId, itemId);
      return;
    }

    if (columnId === '_none') {
      updateItemFields(listId, itemId, { tags: [] });
    } else {
      updateItemFields(listId, itemId, { tags: [columnId] });
    }
    announce('Item updated');
  }, [lists, toggleItem, updateItemFields]);

  const handleSnoozeItem = useCallback((days) => {
    if (!modalTarget) return;
    const list = lists.find((l) => l.id === modalTarget.listId);
    const item = list?.items.find((i) => i.id === modalTarget.itemId);
    if (!item) return;
    updateItemFields(modalTarget.listId, modalTarget.itemId, buildSnoozePatch(item, days));
    announce('Item snoozed');
  }, [modalTarget, lists, updateItemFields]);

  const handleClearSnooze = useCallback(() => {
    if (!modalTarget) return;
    updateItemFields(modalTarget.listId, modalTarget.itemId, { snoozedUntil: '' });
    announce('Snooze cleared');
  }, [modalTarget, updateItemFields]);

  const commands = useMemo(() => [
    { id: 'search', label: 'Focus search', shortcut: '/', action: () => searchRef.current?.focus() },
    ...(viewMode === 'grid' ? [{ id: 'new-list', label: 'New list', shortcut: 'n', action: () => newListRef.current?.focus() }] : []),
    { id: 'templates', label: 'Templates', shortcut: 't', keywords: 'template', action: () => setTemplatesOpen(true) },
    { id: 'archive', label: 'Archived items', shortcut: 'a', action: () => setArchiveOpen(true) },
    { id: 'import', label: 'Import / Export', keywords: 'backup export', action: () => setImportExportModalOpen(true) },
    { id: 'backup', label: 'Download backup', keywords: 'export save', action: exportBackup },
    { id: 'view-grid', label: 'Grid view', action: () => updateSettings({ viewMode: 'grid' }) },
    { id: 'view-all', label: 'All items view', action: () => updateSettings({ viewMode: 'all' }) },
    { id: 'view-kanban', label: 'Kanban view', action: () => updateSettings({ viewMode: 'kanban' }) },
    { id: 'view-upcoming', label: 'Upcoming / overdue', action: () => updateSettings({ viewMode: 'upcoming' }) },
    { id: 'view-calendar', label: 'Calendar view', action: () => updateSettings({ viewMode: 'calendar' }) },
    { id: 'capture', label: 'Quick capture to inbox', keywords: 'inbox gtd', action: () => setQuickCaptureOpen(true) },
    { id: 'review', label: 'Weekly review', keywords: 'overdue stale', action: () => setReviewOpen(true) },
    { id: 'item-templates', label: 'Item templates', action: () => setItemTemplatesOpen(true) },
    { id: 'new-folder', label: 'New folder', action: () => addFolder('New folder') },
    { id: 'streaks', label: settings.streaksEnabled ? 'Disable streaks' : 'Enable completion streaks', action: () => {
      const enabling = !settings.streaksEnabled;
      updateSettings({
        streaksEnabled: enabling,
        ...(enabling ? {} : { streakCurrent: 0, streakLastGoodDate: '' }),
      });
    }},
    { id: 'density', label: `Density: ${settings.density === 'compact' ? 'comfortable' : 'compact'}`, action: () => {
      updateSettings({ density: settings.density === 'compact' ? 'comfortable' : 'compact' });
    }},
    { id: 'bulk', label: 'Toggle bulk select', keywords: 'multi select', action: () => setBulkMode((v) => !v) },
    ...savedFilters.map((f) => ({
      id: `filter-${f.id}`,
      label: `Apply view: ${f.name}`,
      keywords: 'filter saved view',
      action: () => applySavedFilter(f.id),
    })),
    { id: 'dark', label: 'Toggle dark mode', action: () => {
      const next = settings.darkMode === 'dark' ? 'light' : 'dark';
      updateSettings({ darkMode: next });
    }},
    { id: 'focus-clear', label: 'Exit focus mode', action: () => updateSettings({ focusListId: '' }) },
    { id: 'help', label: 'Keyboard shortcuts', shortcut: '?', action: () => setHelpOpen(true) },
  ], [exportBackup, updateSettings, settings.darkMode, settings.streaksEnabled, settings.density, viewMode, savedFilters, applySavedFilter, addFolder]);

  const onGlobalKeyDown = useCallback(
    (event) => {
      if (anyModalOpen && !(commandOpen && event.key === 'Escape')) return;

      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setCommandOpen(true);
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key === 'z') {
        event.preventDefault();
        if (event.shiftKey && redoStack.length) applyRedo();
        else if (undoStack.length) applyUndo();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'i') {
        event.preventDefault();
        setQuickCaptureOpen(true);
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === '/' && !isTypingTarget(event.target)) {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }

      if (isTypingTarget(event.target)) return;

      const focused = navigableItems.find((item) => item.key === focusedItemKey);

      if (event.key === 'j') {
        event.preventDefault();
        navigateItems(1);
        return;
      }
      if (event.key === 'k') {
        event.preventDefault();
        navigateItems(-1);
        return;
      }
      if (focused && event.key === 'x') {
        event.preventDefault();
        handleToggleItem(focused.listId, focused.itemId);
        return;
      }
      if (focused && (event.key === 'e' || event.key === 'Enter')) {
        event.preventDefault();
        openItemModal(focused.listId, focused.itemId);
        return;
      }

      switch (event.key) {
        case 'n':
          if (viewMode === 'grid') {
            event.preventDefault();
            newListRef.current?.focus();
          }
          break;
        case '?':
          event.preventDefault();
          setHelpOpen(true);
          break;
        case 'a':
          event.preventDefault();
          setArchiveOpen(true);
          break;
        case 't':
          event.preventDefault();
          setTemplatesOpen(true);
          break;
        case 'z':
          if (undoStack.length) { event.preventDefault(); applyUndo(); }
          break;
        default:
          break;
      }
    },
    [anyModalOpen, commandOpen, undoStack.length, redoStack.length, applyUndo, applyRedo, viewMode,
      navigableItems, focusedItemKey, navigateItems, handleToggleItem, openItemModal]
  );

  useEffect(() => {
    document.addEventListener('keydown', onGlobalKeyDown);
    return () => document.removeEventListener('keydown', onGlobalKeyDown);
  }, [onGlobalKeyDown]);

  const handleListsDragEnd = (event) => {
    const { active, over } = event;
    setActiveDragId(null);
    if (!over) return;

    const overId = String(over.id);
    if (overId.startsWith('list-drop-') && active.id) {
      const toListId = overId.replace('list-drop-', '');
      const fromList = lists.find((l) => l.items.some((i) => i.id === active.id));
      if (fromList && fromList.id !== toListId) {
        moveItem(fromList.id, active.id, toListId);
        announce('Item moved');
      }
      return;
    }

    if (!over || active.id === over.id) return;
    reorderLists(active.id, over.id);
  };

  return (
    <div className="main" ref={fileDropRef} data-density={settings.density || 'comfortable'}>
      <LiveRegion message={liveMessage} />

      {storageError ? (
        <div className="alert alert--error" role="alert">
          {storageError}
          <button type="button" className="btn-link" onClick={clearStorageError}>Dismiss</button>
        </div>
      ) : null}

      {showBackupReminder ? (
        <div className="alert alert--warn" role="status">
          Haven&apos;t backed up recently.
          <button type="button" className="btn btn-secondary btn-sm" onClick={exportBackup}>Backup now</button>
          <button type="button" className="btn-link" onClick={() => updateSettings({ dismissedBackupReminder: true })}>
            Dismiss
          </button>
        </div>
      ) : null}

      <Toolbar
        searchRef={searchRef}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        itemFilter={itemFilter}
        onItemFilterChange={setItemFilter}
        tagFilter={tagFilter}
        onTagFilterChange={setTagFilter}
        allTags={allTags}
        filtersActive={filtersActive}
        onClearFilters={clearFilters}
        savedFilters={savedFilters}
        onApplySavedFilter={applySavedFilter}
        onSaveFilter={() => setSaveFilterModalOpen(true)}
        onDeleteSavedFilter={deleteSavedFilter}
        viewMode={viewMode}
        settings={settings}
        onUpdateSettings={updateSettings}
        archivedCount={archived.length}
        bulkMode={bulkMode}
        onTemplates={() => setTemplatesOpen(true)}
        onArchive={() => setArchiveOpen(true)}
        onPrintShare={() => setPrintOpen(true)}
        onToggleBulk={() => setBulkMode((v) => !v)}
        onImportExport={() => setImportExportModalOpen(true)}
        onHelp={() => setHelpOpen(true)}
        onCommandPalette={() => setCommandOpen(true)}
        onToggleStreaks={() => {
          const enabling = !settings.streaksEnabled;
          updateSettings({
            streaksEnabled: enabling,
            ...(enabling ? {} : { streakCurrent: 0, streakLastGoodDate: '' }),
          });
          announce(enabling ? 'Streaks enabled' : 'Streaks disabled');
        }}
        onToggleDensity={() => {
          const next = settings.density === 'compact' ? 'comfortable' : 'compact';
          updateSettings({ density: next });
          announce(`${next === 'compact' ? 'Compact' : 'Comfortable'} density`);
        }}
        onQuickCapture={() => setQuickCaptureOpen(true)}
        onReview={() => setReviewOpen(true)}
        onItemTemplates={() => setItemTemplatesOpen(true)}
        onManageTags={() => setTagManagerOpen(true)}
        syncStatus={sync.status}
        onOpenSync={() => setSyncOpen(true)}
      />

      <BulkActionBar
        selectedCount={bulkSelected.size}
        lists={lists}
        onComplete={handleBulkComplete}
        onArchive={handleBulkArchive}
        onMove={handleBulkMove}
        onAddTag={handleBulkAddTag}
        onClear={() => setBulkSelected(new Map())}
      />

      {viewMode === 'grid' ? (
        <GridView
          lists={lists}
          listsToShow={listsToShow}
          matchingLists={matchingLists}
          settings={settings}
          itemFilter={itemFilter}
          searchQuery={searchQuery}
          tagFilter={tagFilter}
          customTags={customTags}
          bulkMode={bulkMode}
          bulkSelected={bulkSelected}
          filtersActive={filtersActive}
          sensors={sensors}
          activeDragId={activeDragId}
          onDragStart={(e) => setActiveDragId(e.active.id)}
          onDragEnd={handleListsDragEnd}
          onOpenTemplates={() => setTemplatesOpen(true)}
          onClearFilters={clearFilters}
          onBulkToggle={toggleBulkSelect}
          onOpenItem={openItemModal}
          onDeleteList={(listId) => { setListToDelete(listId); setDeleteModalOpen(true); }}
          onDuplicateList={duplicateList}
          onSaveAsTemplate={(listId) => { saveListAsTemplate(listId); announce('Saved as template'); }}
          onFocusMode={(listId) => updateSettings({ focusListId: listId, viewMode: 'grid' })}
          onShare={(msg) => announce(msg)}
          onAddItem={addItem}
          onAddItems={addItems}
          onToggleItem={handleToggleItem}
          onRenameItem={renameItem}
          onUpdateItemFields={updateItemFields}
          onDuplicateItem={duplicateItem}
          onMoveItem={moveItem}
          onAddSubItem={addSubItem}
          onToggleSubItem={toggleSubItem}
          onDeleteSubItem={deleteSubItem}
          onDeleteItem={deleteItem}
          onDeleteCompletedItems={deleteCompletedItems}
          onReorderItems={reorderItems}
          onReorderSubItems={reorderSubItems}
          onSetListStyle={setListStyle}
          onSetListMeta={setListMeta}
          onAddCustomTag={addCustomTag}
          onRenameList={renameList}
          focusedItemKey={focusedItemKey}
          onShowStats={setStatsListId}
          onToggleFolder={handleToggleFolder}
          staleThresholdDays={settings.staleThresholdDays || 14}
        />
      ) : null}
      {viewMode === 'upcoming' ? (
        <UpcomingView
          items={upcomingItems}
          blockedItems={blockedItems}
          onItemClick={openItemModal}
          focusedItemKey={focusedItemKey}
        />
      ) : null}
      {viewMode === 'all' ? (
        <AllItemsView
          rows={allItemRows}
          customTags={customTags}
          onItemClick={openItemModal}
          bulkMode={bulkMode}
          selectedIds={new Set([...bulkSelected.keys()])}
          onToggleSelect={(key, listId, itemId) => toggleBulkSelect(listId, itemId)}
          focusedItemKey={focusedItemKey}
        />
      ) : null}
      {viewMode === 'kanban' ? (
        <>
          <div className="kanban-controls">
            <label>
              Group by
              <select
                className="style-select"
                value={settings.kanbanGroupBy || 'status'}
                onChange={(e) => updateSettings({ kanbanGroupBy: e.target.value })}
              >
                <option value="status">Status</option>
                <option value="tag">Tag</option>
              </select>
            </label>
          </div>
          <KanbanView
            lists={lists}
            customTags={customTags}
            groupBy={settings.kanbanGroupBy || 'status'}
            onItemClick={openItemModal}
            onColumnDrop={handleKanbanColumnDrop}
            focusedItemKey={focusedItemKey}
          />
        </>
      ) : null}
      {viewMode === 'calendar' ? (
        <>
          <div className="calendar-controls">
            <label>
              View
              <select
                className="style-select"
                value={settings.calendarMode || 'month'}
                onChange={(e) => updateSettings({ calendarMode: e.target.value })}
              >
                <option value="month">Month</option>
                <option value="week">Week</option>
              </select>
            </label>
          </div>
          <CalendarView
            lists={lists}
            mode={settings.calendarMode || 'month'}
            anchorDate={settings.calendarAnchor || todayDateString()}
            onAnchorChange={(date) => updateSettings({ calendarAnchor: date })}
            onItemClick={openItemModal}
            focusedItemKey={focusedItemKey}
          />
        </>
      ) : null}

      {settings.focusListId ? (
        <>
          <FocusTimer
            minutes={settings.pomodoroMinutes || 25}
            remaining={pomodoroRemaining}
            running={pomodoroRunning}
            listName={lists.find((l) => l.id === settings.focusListId)?.name}
            onStart={() => {
              setPomodoroRemaining((settings.pomodoroMinutes || 25) * 60);
              setPomodoroRunning(true);
            }}
            onPause={() => setPomodoroRunning(false)}
            onReset={() => { setPomodoroRunning(false); setPomodoroRemaining(0); }}
          />
          <button type="button" className="btn btn-secondary focus-exit" onClick={() => updateSettings({ focusListId: '' })}>
            Exit focus mode
          </button>
        </>
      ) : null}

      {viewMode === 'grid' ? (
        <div className="main-controls">
          <input
            ref={newListRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a new list… (n)"
            aria-label="Add a new list"
            className="text-input text-input--wide"
          />
        </div>
      ) : null}

      <ConfirmModal
        isOpen={deleteModalOpen}
        message={`Are you sure you want to delete "${listPendingDelete?.name || ''}"?`}
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => { setDeleteModalOpen(false); setListToDelete(null); }}
      />

      <ImportExportModal
        isOpen={importExportModalOpen}
        jsonData={JSON.stringify({ lists, archived, customTags }, null, 2)}
        onClose={() => setImportExportModalOpen(false)}
        onImport={importLists}
        hasExistingLists={lists.length > 0}
        onBackup={exportBackup}
      />

      <ArchiveShelf
        isOpen={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        archived={archived}
        lists={lists}
        customTags={customTags}
        onRestore={restoreArchived}
        onPurge={purgeArchived}
      />

      <TemplatesModal
        isOpen={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        onSelect={addTemplate}
        userTemplates={userTemplates}
      />

      <PrintShareModal isOpen={printOpen} onClose={() => setPrintOpen(false)} lists={lists} />

      <CommandPalette isOpen={commandOpen} onClose={() => setCommandOpen(false)} commands={commands} />

      <BulkTagModal
        isOpen={bulkTagModalOpen}
        selectedCount={bulkSelected.size}
        customTags={customTags}
        onClose={() => setBulkTagModalOpen(false)}
        onConfirm={handleBulkTagConfirm}
        onAddCustomTag={addCustomTag}
      />

      <SaveFilterModal
        isOpen={saveFilterModalOpen}
        onClose={() => setSaveFilterModalOpen(false)}
        onSave={handleSaveFilter}
      />

      <ListStatsModal
        isOpen={Boolean(statsListId)}
        list={statsList}
        onClose={() => setStatsListId(null)}
      />

      <QuickCaptureModal
        isOpen={quickCaptureOpen}
        onClose={() => setQuickCaptureOpen(false)}
        onSubmit={captureToInbox}
        inboxName={inboxList?.name || 'Inbox'}
      />

      <ReviewModal
        isOpen={reviewOpen}
        onClose={() => setReviewOpen(false)}
        lists={lists}
        staleThresholdDays={settings.staleThresholdDays || 14}
        onItemClick={(listId, itemId) => { setReviewOpen(false); openItemModal(listId, itemId); }}
        onComplete={() => {
          updateSettings({ lastReviewAt: new Date().toISOString() });
          setReviewOpen(false);
          announce('Review completed');
        }}
      />

      <ItemTemplatesModal
        isOpen={itemTemplatesOpen}
        onClose={() => setItemTemplatesOpen(false)}
        templates={itemTemplates}
        onSelect={(templateId) => {
          const listId = settings.lastUsedListId || lists[0]?.id;
          if (listId) addItemFromTemplate(listId, templateId);
          setItemTemplatesOpen(false);
        }}
        onDelete={deleteItemTemplate}
      />

      {sync.enabled ? (
        <SyncModal
          isOpen={syncOpen}
          onClose={() => setSyncOpen(false)}
          sync={sync}
          onRestore={restoreSyncedVersion}
        />
      ) : null}

      <TagManagerModal
        isOpen={tagManagerOpen}
        onClose={() => setTagManagerOpen(false)}
        customTags={customTags}
        onUpdateTag={updateCustomTag}
        onDeleteTag={deleteCustomTag}
      />

      {modalTarget && modalItem ? (
        <ListItemModal
          isOpen
          itemName={modalItem.text}
          description={modalItem.description || ''}
          dueDate={modalItem.dueDate || ''}
          tags={modalItem.tags || []}
          priority={modalItem.priority || 0}
          recurring={modalItem.recurring || 'none'}
          recurringIntervalDays={modalItem.recurringIntervalDays || 0}
          recurringEndDate={modalItem.recurringEndDate || ''}
          estimateMinutes={modalItem.estimateMinutes || 0}
          blockedBy={modalItem.blockedBy || []}
          customFieldValues={modalItem.customFieldValues || {}}
          listCustomFields={modalList?.customFields || []}
          currentItemId={modalItem.id}
          snoozedUntil={modalItem.snoozedUntil || ''}
          history={modalItem.history || []}
          completedAt={modalItem.completedAt || ''}
          subItems={modalItem.subItems || []}
          customTags={customTags}
          lists={lists}
          currentListId={modalTarget.listId}
          onClose={closeItemModal}
          onDelete={() => { deleteItem(modalTarget.listId, modalItem.id); closeItemModal(); }}
          onSaveChanges={(patch) => updateItemFields(modalTarget.listId, modalItem.id, patch)}
          onNameChange={(newName) => renameItem(modalTarget.listId, modalItem.id, newName)}
          onDuplicate={() => duplicateItem(modalTarget.listId, modalItem.id)}
          onMove={(toListId) => { moveItem(modalTarget.listId, modalItem.id, toListId); closeItemModal(); }}
          onAddSubItem={(text) => addSubItem(modalTarget.listId, modalItem.id, text)}
          onToggleSubItem={(subId) => toggleSubItem(modalTarget.listId, modalItem.id, subId)}
          onDeleteSubItem={(subId) => deleteSubItem(modalTarget.listId, modalItem.id, subId)}
          onReorderSubItems={(a, o) => reorderSubItems(modalTarget.listId, modalItem.id, a, o)}
          onAddCustomTag={addCustomTag}
          onSnooze={handleSnoozeItem}
          onClearSnooze={handleClearSnooze}
          onSkipRecurring={() => skipRecurring(modalTarget.listId, modalItem.id)}
          onSaveAsTemplate={() => {
            saveItemAsTemplate(modalTarget.listId, modalItem.id, modalItem.text);
            announce('Saved as item template');
          }}
          onNavigateToList={(listId) => {
            updateSettings({ focusListId: listId, viewMode: 'grid' });
            closeItemModal();
          }}
        />
      ) : null}

      <ConfirmModal
        isOpen={helpOpen}
        message={`Keyboard shortcuts:
/ search · n new list · t templates · a archived · z undo
j/k navigate items · x complete · e/Enter open details
⌘Z undo · ⌘⇧Z redo · ⌘K command palette
Click item names for details. Drag ⋮⋮ handles to reorder.
Quick add: Buy milk #errand !2026-07-25 !p2
Swipe right on mobile to complete, left to archive.`}
        confirmLabel="Got it"
        onConfirm={() => setHelpOpen(false)}
        onCancel={() => setHelpOpen(false)}
      />

      <ConfirmModal
        isOpen={shareImportOpen}
        message={`Import shared list "${pendingShareList?.name || ''}"?`}
        confirmLabel="Import"
        onConfirm={() => {
          if (pendingShareList) {
            const list = normalizeList(pendingShareList, customTags);
            importLists([...lists, list], 'replace');
            window.location.hash = '';
          }
          setShareImportOpen(false);
          setPendingShareList(null);
        }}
        onCancel={() => { setShareImportOpen(false); setPendingShareList(null); window.location.hash = ''; }}
      />

      <Toast
        message={toast?.message}
        onUndo={undoStack.length ? applyUndo : null}
        onDismiss={dismissToast}
        undoCount={undoStack.length}
        redoCount={redoStack.length}
        onRedo={redoStack.length ? applyRedo : null}
      />
    </div>
  );
}

export default Main;
