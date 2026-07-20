import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import List from './List';
import ConfirmModal from './ConfirmModal';
import ImportExportModal from './ImportExportModal';
import Toast from './Toast';
import ArchiveShelf from './ArchiveShelf';
import TemplatesModal from './TemplatesModal';
import PrintShareModal from './PrintShareModal';
import SortableRow from './SortableRow';
import UpcomingView from './UpcomingView';
import AllItemsView from './AllItemsView';
import KanbanView from './KanbanView';
import CommandPalette from './CommandPalette';
import BulkActionBar from './BulkActionBar';
import LiveRegion from './LiveRegion';
import ToolbarMoreMenu from './ToolbarMoreMenu';
import { useLists } from '../hooks/useLists';
import { getAllTags } from '../utils/tags';
import { listMatchesFilters, hasActiveFilters } from '../utils/filterItems';
import { sortListsForDisplay } from '../utils/sortItems';
import { getUpcomingItems, flattenAllItems } from '../utils/helpers';
import { decodeListFromHash } from '../utils/shareLink';
import { VIEW_MODES } from '../utils/constants';
import { normalizeList } from '../utils/normalizeLists';

function Main() {
  const {
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
    restoreArchived,
    purgeArchived,
    importLists,
    exportBackup,
    clearStorageError,
  } = useLists();

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
    printOpen || helpOpen || commandOpen || shareImportOpen;

  const listsToShow = useMemo(() => {
    const filtered = lists.filter((list) =>
      listMatchesFilters(list, { searchQuery, tagFilter, itemFilter })
    );
    const pinned = settings.pinnedListIds || [];
    let sorted = sortListsForDisplay(filtered, { pinnedIds: pinned });
    if (settings.focusListId) {
      sorted = sorted.filter((l) => l.id === settings.focusListId);
    }
    return sorted;
  }, [lists, searchQuery, tagFilter, itemFilter, settings.pinnedListIds, settings.focusListId]);

  const upcomingItems = useMemo(
    () => getUpcomingItems(lists).map((r) => ({ ...r, item: { ...r.item, listColor: lists.find((l) => l.id === r.listId)?.color } })),
    [lists]
  );

  const allItemRows = useMemo(() => {
    const rows = flattenAllItems(lists);
    return rows.filter(({ item }) => {
      if (itemFilter === 'active' && item.complete) return false;
      if (itemFilter === 'completed' && !item.complete) return false;
      if (tagFilter && !(item.tags || []).includes(tagFilter)) return false;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return [item.text, item.description || ''].join(' ').toLowerCase().includes(q);
    });
  }, [lists, itemFilter, tagFilter, searchQuery]);

  const [modalTarget, setModalTarget] = useState(null);

  const openItemModal = useCallback((listId, itemId) => {
    setModalTarget({ listId, itemId });
  }, []);

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
    const tag = window.prompt('Tag name to add:');
    if (!tag) return;
    const created = addCustomTag(tag);
    const tagId = created?.id || tag.toLowerCase();
    bulkByList.forEach((itemIds, listId) => {
      itemIds.forEach((itemId) => {
        const list = lists.find((l) => l.id === listId);
        const item = list?.items.find((i) => i.id === itemId);
        if (item) {
          const tags = [...new Set([...(item.tags || []), tagId])];
          updateItemFields(listId, itemId, { tags });
        }
      });
    });
    setBulkSelected(new Map());
  };

  const commands = useMemo(() => [
    { id: 'search', label: 'Focus search', shortcut: '/', action: () => searchRef.current?.focus() },
    { id: 'new-list', label: 'New list', shortcut: 'n', action: () => newListRef.current?.focus() },
    { id: 'templates', label: 'Templates', shortcut: 't', keywords: 'template', action: () => setTemplatesOpen(true) },
    { id: 'archive', label: 'Archived items', shortcut: 'a', action: () => setArchiveOpen(true) },
    { id: 'import', label: 'Import / Export', keywords: 'backup export', action: () => setImportExportModalOpen(true) },
    { id: 'backup', label: 'Download backup', keywords: 'export save', action: exportBackup },
    { id: 'view-grid', label: 'Grid view', action: () => updateSettings({ viewMode: 'grid' }) },
    { id: 'view-all', label: 'All items view', action: () => updateSettings({ viewMode: 'all' }) },
    { id: 'view-kanban', label: 'Kanban view', action: () => updateSettings({ viewMode: 'kanban' }) },
    { id: 'view-upcoming', label: 'Upcoming / overdue', action: () => updateSettings({ viewMode: 'upcoming' }) },
    { id: 'bulk', label: 'Toggle bulk select', keywords: 'multi select', action: () => setBulkMode((v) => !v) },
    { id: 'dark', label: 'Toggle dark mode', action: () => {
      const next = settings.darkMode === 'dark' ? 'light' : 'dark';
      updateSettings({ darkMode: next });
    }},
    { id: 'focus-clear', label: 'Exit focus mode', action: () => updateSettings({ focusListId: '' }) },
    { id: 'help', label: 'Keyboard shortcuts', shortcut: '?', action: () => setHelpOpen(true) },
  ], [exportBackup, updateSettings, settings.darkMode]);

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

      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === '/' && !isTypingTarget(event.target)) {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }

      if (isTypingTarget(event.target)) return;

      switch (event.key) {
        case 'n':
          event.preventDefault();
          newListRef.current?.focus();
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
    [anyModalOpen, commandOpen, undoStack.length, redoStack.length, applyUndo, applyRedo]
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

  const renderGrid = () => {
    if (listsToShow.length === 0) {
      return (
        <div className="empty-state-block">
          <p className="empty-state">
            {lists.length === 0
              ? 'No lists yet. Type a name below, press Enter, or open Templates (t).'
              : 'No lists match the current search or tag filter.'}
          </p>
          {filtersActive ? (
            <button type="button" className="btn btn-secondary" onClick={clearFilters}>
              Clear filters
            </button>
          ) : lists.length === 0 ? (
            <button type="button" className="btn btn-primary" onClick={() => setTemplatesOpen(true)}>
              Browse templates
            </button>
          ) : null}
        </div>
      );
    }

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e) => setActiveDragId(e.active.id)}
        onDragEnd={handleListsDragEnd}
      >
        <SortableContext items={listsToShow.map((l) => l.id)} strategy={rectSortingStrategy}>
          <div className={`lists-grid${settings.focusListId ? ' lists-grid--focus' : ''}`}>
            {listsToShow.map((list) => (
              <SortableRow key={list.id} id={list.id} className="list-sortable">
                <List
                  id={list.id}
                  name={list.name}
                  color={list.color}
                  icon={list.icon}
                  items={list.items || []}
                  sortMode={list.sortMode || 'manual'}
                  collapsed={list.collapsed}
                  pinned={(settings.pinnedListIds || []).includes(list.id)}
                  itemFilter={itemFilter}
                  searchQuery={searchQuery}
                  tagFilter={tagFilter}
                  customTags={customTags}
                  allLists={lists}
                  bulkMode={bulkMode}
                  bulkSelectedIds={new Set(
                    [...bulkSelected.values()]
                      .filter((v) => v.listId === list.id)
                      .map((v) => v.itemId)
                  )}
                  onBulkToggle={toggleBulkSelect}
                  filtersActive={filtersActive}
                  onNameChange={(newName) => renameList(list.id, newName)}
                  onDelete={() => { setListToDelete(list.id); setDeleteModalOpen(true); }}
                  onDuplicate={() => duplicateList(list.id)}
                  onSaveAsTemplate={() => { saveListAsTemplate(list.id); announce('Saved as template'); }}
                  onFocusMode={() => updateSettings({ focusListId: list.id, viewMode: 'grid' })}
                  onShare={(msg) => announce(msg)}
                  onAddItem={(text) => addItem(list.id, text)}
                  onItemCheckboxChange={(itemId) => toggleItem(list.id, itemId)}
                  onItemNameChange={(itemId, newName) => renameItem(list.id, itemId, newName)}
                  onItemSave={(itemId, patch) => updateItemFields(list.id, itemId, patch)}
                  onDuplicateItem={(itemId) => duplicateItem(list.id, itemId)}
                  onMoveItem={moveItem}
                  onAddSubItem={(itemId, text) => addSubItem(list.id, itemId, text)}
                  onToggleSubItem={(itemId, subId) => toggleSubItem(list.id, itemId, subId)}
                  onDeleteSubItem={(itemId, subId) => deleteSubItem(list.id, itemId, subId)}
                  onDeleteItem={(itemId) => deleteItem(list.id, itemId)}
                  onDeleteCompletedItems={() => deleteCompletedItems(list.id)}
                  onReorderItems={(a, o) => reorderItems(list.id, a, o)}
                  onReorderSubItems={(itemId, a, o) => reorderSubItems(list.id, itemId, a, o)}
                  onSetListStyle={(style) => setListStyle(list.id, style)}
                  onSetListMeta={(patch) => setListMeta(list.id, patch)}
                  onAddCustomTag={addCustomTag}
                />
              </SortableRow>
            ))}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeDragId ? <div className="drag-overlay-hint">Dragging…</div> : null}
        </DragOverlay>
      </DndContext>
    );
  };

  return (
    <div className="main" ref={fileDropRef}>
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

      <div className="toolbar">
        <input
          ref={searchRef}
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search lists and items… (/)"
          aria-label="Search lists and items"
          className="text-input toolbar-search"
        />
        <div className="filter-group" role="group" aria-label="Item status filter">
          {['all', 'active', 'completed'].map((value) => (
            <button
              key={value}
              type="button"
              className={`chip-btn${itemFilter === value ? ' is-active' : ''}`}
              onClick={() => setItemFilter(value)}
            >
              {value.charAt(0).toUpperCase() + value.slice(1)}
            </button>
          ))}
        </div>
        <select
          className="style-select"
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          aria-label="Filter by tag"
        >
          <option value="">All tags</option>
          {allTags.map((tag) => (
            <option key={tag.id} value={tag.id}>{tag.label}</option>
          ))}
        </select>
        {filtersActive ? (
          <button type="button" className="btn-link toolbar-clear" onClick={clearFilters}>
            Clear filters
          </button>
        ) : null}
      </div>

      <div className="toolbar toolbar--actions">
        <div className="view-tabs" role="tablist" aria-label="View mode">
          {VIEW_MODES.map((v) => (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={viewMode === v.id}
              className={`chip-btn${viewMode === v.id ? ' is-active' : ''}`}
              onClick={() => updateSettings({ viewMode: v.id })}
            >
              {v.label}
            </button>
          ))}
        </div>
        <div className="toolbar-actions-end">
          <button
            type="button"
            className="btn btn-secondary btn-icon"
            onClick={() => updateSettings({ darkMode: settings.darkMode === 'dark' ? 'light' : 'dark' })}
            aria-label="Toggle dark mode"
          >
            {settings.darkMode === 'dark' ? '☀️' : '🌙'}
          </button>
          <ToolbarMoreMenu
            archivedCount={archived.length}
            bulkMode={bulkMode}
            onTemplates={() => setTemplatesOpen(true)}
            onArchive={() => setArchiveOpen(true)}
            onPrintShare={() => setPrintOpen(true)}
            onToggleBulk={() => setBulkMode((v) => !v)}
            onImportExport={() => setImportExportModalOpen(true)}
            onHelp={() => setHelpOpen(true)}
          />
          <button type="button" className="btn btn-secondary btn-icon" onClick={() => setCommandOpen(true)} title="Cmd+K" aria-label="Command palette">
            ⌘K
          </button>
        </div>
      </div>

      <BulkActionBar
        selectedCount={bulkSelected.size}
        lists={lists}
        onComplete={handleBulkComplete}
        onArchive={handleBulkArchive}
        onMove={handleBulkMove}
        onAddTag={handleBulkAddTag}
        onClear={() => setBulkSelected(new Map())}
      />

      {viewMode === 'grid' ? renderGrid() : null}
      {viewMode === 'upcoming' ? (
        <UpcomingView items={upcomingItems} onItemClick={openItemModal} />
      ) : null}
      {viewMode === 'all' ? (
        <AllItemsView
          rows={allItemRows}
          customTags={customTags}
          onItemClick={openItemModal}
          bulkMode={bulkMode}
          selectedIds={new Set([...bulkSelected.keys()])}
          onToggleSelect={(key, listId, itemId) => toggleBulkSelect(listId, itemId)}
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
          />
        </>
      ) : null}

      {settings.focusListId ? (
        <button type="button" className="btn btn-secondary focus-exit" onClick={() => updateSettings({ focusListId: '' })}>
          Exit focus mode
        </button>
      ) : null}

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

      <ConfirmModal
        isOpen={helpOpen}
        message={`Keyboard shortcuts:
/ search · n new list · t templates · a archived · z undo
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
