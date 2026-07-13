import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import List from './List';
import ConfirmModal from './ConfirmModal';
import ImportExportModal from './ImportExportModal';
import Toast from './Toast';
import ArchiveShelf from './ArchiveShelf';
import TemplatesModal from './TemplatesModal';
import PrintShareModal from './PrintShareModal';
import SortableRow from './SortableRow';
import { useLists } from '../hooks/useLists';
import { TAG_PALETTE } from '../utils/constants';

function Main() {
  const {
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

  const searchRef = useRef(null);
  const newListRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const anyModalOpen =
    deleteModalOpen ||
    importExportModalOpen ||
    archiveOpen ||
    templatesOpen ||
    printOpen ||
    helpOpen;

  const listsToShow = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return lists.filter((list) => {
      if (!q && !tagFilter) return true;
      const nameHit = q && list.name.toLowerCase().includes(q);
      const itemHit = list.items.some((item) => {
        if (tagFilter && !(item.tags || []).includes(tagFilter)) return false;
        if (!q) return Boolean(tagFilter);
        const hay = [
          item.text,
          item.description || '',
          ...(item.subItems || []).map((s) => s.text),
        ]
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });
      if (tagFilter && !itemHit) return false;
      if (q) return nameHit || itemHit;
      return true;
    });
  }, [lists, searchQuery, tagFilter]);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && inputValue.trim() !== '') {
      addList(inputValue.trim());
      setInputValue('');
    }
  };

  const listPendingDelete = lists.find((list) => list.id === listToDelete);

  const handleConfirmDelete = () => {
    if (listToDelete) {
      deleteList(listToDelete);
    }
    setDeleteModalOpen(false);
    setListToDelete(null);
  };

  const isTypingTarget = (target) => {
    if (!target) return false;
    const tag = target.tagName;
    return (
      tag === 'INPUT' ||
      tag === 'TEXTAREA' ||
      tag === 'SELECT' ||
      target.isContentEditable
    );
  };

  const onGlobalKeyDown = useCallback(
    (event) => {
      if (anyModalOpen) return;
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
          if (undoStack.length) {
            event.preventDefault();
            applyUndo();
          }
          break;
        default:
          break;
      }
    },
    [anyModalOpen, undoStack.length, applyUndo]
  );

  useEffect(() => {
    document.addEventListener('keydown', onGlobalKeyDown);
    return () => document.removeEventListener('keydown', onGlobalKeyDown);
  }, [onGlobalKeyDown]);

  const handleListsDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    reorderLists(active.id, over.id);
  };

  return (
    <div className="main">
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
          {TAG_PALETTE.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.label}
            </option>
          ))}
        </select>
      </div>

      <div className="toolbar toolbar--actions">
        <button type="button" className="btn btn-secondary" onClick={() => setTemplatesOpen(true)}>
          Templates
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => setArchiveOpen(true)}>
          Archived ({archived.length})
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => setPrintOpen(true)}>
          Print / Share
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setImportExportModalOpen(true)}
        >
          Import/Export
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setHelpOpen(true)}
          aria-label="Keyboard shortcuts"
        >
          ?
        </button>
      </div>

      {listsToShow.length === 0 ? (
        <p className="empty-state">
          {lists.length === 0
            ? 'No lists yet. Type a name below, press Enter, or open Templates (t).'
            : 'No lists match the current search or tag filter.'}
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleListsDragEnd}
        >
          <SortableContext items={listsToShow.map((l) => l.id)} strategy={rectSortingStrategy}>
            <div className="lists-grid">
              {listsToShow.map((list) => (
                <SortableRow key={list.id} id={list.id} className="list-sortable">
                  <List
                    id={list.id}
                    name={list.name}
                    color={list.color}
                    icon={list.icon}
                    items={list.items || []}
                    itemFilter={itemFilter}
                    searchQuery={searchQuery}
                    tagFilter={tagFilter}
                    onNameChange={(newName) => renameList(list.id, newName)}
                    onDelete={() => {
                      setListToDelete(list.id);
                      setDeleteModalOpen(true);
                    }}
                    onAddItem={(itemText) => addItem(list.id, itemText)}
                    onItemCheckboxChange={(itemId) => toggleItem(list.id, itemId)}
                    onItemNameChange={(itemId, newName) => renameItem(list.id, itemId, newName)}
                    onItemSave={(itemId, patch) => updateItemFields(list.id, itemId, patch)}
                    onAddSubItem={(itemId, subItemText) =>
                      addSubItem(list.id, itemId, subItemText)
                    }
                    onToggleSubItem={(itemId, subItemId) =>
                      toggleSubItem(list.id, itemId, subItemId)
                    }
                    onDeleteSubItem={(itemId, subItemId) =>
                      deleteSubItem(list.id, itemId, subItemId)
                    }
                    onDeleteItem={(itemId) => deleteItem(list.id, itemId)}
                    onDeleteCompletedItems={() => deleteCompletedItems(list.id)}
                    onReorderItems={(activeId, overId) =>
                      reorderItems(list.id, activeId, overId)
                    }
                    onReorderSubItems={(itemId, activeId, overId) =>
                      reorderSubItems(list.id, itemId, activeId, overId)
                    }
                    onSetListStyle={(style) => setListStyle(list.id, style)}
                  />
                </SortableRow>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

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
        onCancel={() => {
          setDeleteModalOpen(false);
          setListToDelete(null);
        }}
      />

      <ImportExportModal
        isOpen={importExportModalOpen}
        jsonData={JSON.stringify(lists, null, 2)}
        onClose={() => setImportExportModalOpen(false)}
        onImport={importLists}
        hasExistingLists={lists.length > 0}
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
      />

      <PrintShareModal
        isOpen={printOpen}
        onClose={() => setPrintOpen(false)}
        lists={lists}
      />

      <ConfirmModal
        isOpen={helpOpen}
        message={`Keyboard shortcuts:
/ search · n new list · t templates · a archived · z undo · ? help
Click item names for details. Drag ⋮⋮ handles to reorder.`}
        confirmLabel="Got it"
        onConfirm={() => setHelpOpen(false)}
        onCancel={() => setHelpOpen(false)}
      />

      <Toast
        message={toast?.message}
        onUndo={undoStack.length ? applyUndo : null}
        onDismiss={dismissToast}
        undoCount={undoStack.length}
      />
    </div>
  );
}

export default Main;
