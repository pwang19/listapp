import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import EditableText from './EditableText';
import ListItemDisplay from './ListItemDisplay';
import ListItemModal from './ListItemModal';
import { LIST_COLORS, LIST_ICONS, SORT_MODES } from '../utils/constants';
import { filterItems, hasActiveFilters } from '../utils/filterItems';
import { sortItems } from '../utils/sortItems';
import { listToMarkdown } from '../utils/helpers';
import { encodeListToHash } from '../utils/shareLink';

const itemShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  complete: PropTypes.bool,
});

function ListDropZone({ listId, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: `list-drop-${listId}` });
  return (
    <div ref={setNodeRef} className={`list-drop-zone${isOver ? ' is-over' : ''}`}>
      {children}
    </div>
  );
}

function List({
  id: listId,
  name,
  color = 'slate',
  icon = '📋',
  items = [],
  sortMode = 'manual',
  collapsed = false,
  pinned = false,
  itemFilter = 'all',
  searchQuery = '',
  tagFilter = '',
  customTags = [],
  allLists = [],
  bulkMode = false,
  bulkSelectedIds = new Set(),
  onBulkToggle,
  onNameChange,
  onDelete,
  onDuplicate,
  onSaveAsTemplate,
  onShare,
  onFocusMode,
  onAddItem,
  onItemCheckboxChange,
  onItemNameChange,
  onItemSave,
  onDuplicateItem,
  onMoveItem,
  onAddSubItem,
  onToggleSubItem,
  onDeleteSubItem,
  onDeleteItem,
  onDeleteCompletedItems,
  onReorderItems,
  onReorderSubItems,
  onSetListStyle,
  onSetListMeta,
  onAddCustomTag,
  filtersActive = false,
}) {
  const [inputValue, setInputValue] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const colorMeta = LIST_COLORS.find((c) => c.id === color) || LIST_COLORS[0];
  const completedCount = items.filter((i) => i.complete).length;

  const visibleItems = useMemo(() => {
    const filtered = filterItems(items, { itemFilter, searchQuery, tagFilter });
    return sortMode === 'manual' ? filtered : sortItems(filtered, sortMode);
  }, [items, itemFilter, searchQuery, tagFilter, sortMode]);

  const canReorder = sortMode === 'manual' && !filtersActive;

  const selectedItem = items.find((item) => item.id === selectedItemId) || null;

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && inputValue.trim() !== '') {
      onAddItem(inputValue.trim());
      setInputValue('');
    }
  };

  const handleItemNameClick = (itemId) => {
    setSelectedItemId(itemId);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedItemId(null);
  };

  const handleDragEnd = (event) => {
    if (!canReorder) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorderItems(active.id, over.id);
  };

  const handleShare = () => {
    const hash = encodeListToHash({ name, icon, color, items });
    if (hash) {
      navigator.clipboard?.writeText(`${window.location.origin}${window.location.pathname}${hash}`);
      onShare?.('Share link copied to clipboard.');
    }
  };

  const handleExportMd = () => {
    const md = listToMarkdown({ name, icon, color, items });
    navigator.clipboard?.writeText(md);
    onShare?.('Markdown copied to clipboard.');
  };

  return (
    <ListDropZone listId={listId}>
      <article
        className={`list-card${collapsed ? ' is-collapsed' : ''}${pinned ? ' is-pinned' : ''}`}
        data-list-id={listId}
        style={{ borderTop: `4px solid ${colorMeta.value}` }}
      >
        <div className="list-card-top-actions">
          <button
            type="button"
            className="icon-button"
            onClick={() => onSetListMeta({ pinned: !pinned })}
            aria-label={pinned ? 'Unpin list' : 'Pin list'}
            title={pinned ? 'Unpin' : 'Pin'}
          >
            {pinned ? '📌' : '📍'}
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="List menu"
            aria-expanded={menuOpen}
          >
            ⋯
          </button>
          <button
            type="button"
            className="icon-button list-card-delete"
            onClick={onDelete}
            aria-label={`Delete list ${name}`}
          >
            ×
          </button>
        </div>

        {menuOpen ? (
          <div className="list-menu" role="menu">
            <button type="button" role="menuitem" onClick={() => { onDuplicate(); setMenuOpen(false); }}>
              Duplicate list
            </button>
            <button type="button" role="menuitem" onClick={() => { onSaveAsTemplate(); setMenuOpen(false); }}>
              Save as template
            </button>
            <button type="button" role="menuitem" onClick={() => { onFocusMode?.(); setMenuOpen(false); }}>
              Focus this list
            </button>
            <button type="button" role="menuitem" onClick={() => { handleShare(); setMenuOpen(false); }}>
              Copy share link
            </button>
            <button type="button" role="menuitem" onClick={() => { handleExportMd(); setMenuOpen(false); }}>
              Copy as Markdown
            </button>
          </div>
        ) : null}

        <div className="list-card-header-row">
          <button
            type="button"
            className="list-collapse-btn"
            onClick={() => onSetListMeta({ collapsed: !collapsed })}
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Expand list' : 'Collapse list'}
          >
            {collapsed ? '▸' : '▾'}
          </button>
          <div className="list-card-header">
            <span className="list-icon" aria-hidden="true">{icon}</span>
            <h2 className="list-card-title">
              <EditableText value={name} onSave={onNameChange} className="list-title" />
            </h2>
            <span className="list-progress" aria-label={`${completedCount} of ${items.length} complete`}>
              {completedCount}/{items.length}
            </span>
          </div>
        </div>

        {!collapsed ? (
          <>
            <div className="list-style-row">
              <select
                className="style-select"
                value={icon}
                onChange={(e) => onSetListStyle({ icon: e.target.value })}
                aria-label="List icon"
              >
                {LIST_ICONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <select
                className="style-select"
                value={color}
                onChange={(e) => onSetListStyle({ color: e.target.value })}
                aria-label="List color"
              >
                {LIST_COLORS.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
              <select
                className="style-select"
                value={sortMode}
                onChange={(e) => onSetListMeta({ sortMode: e.target.value })}
                aria-label="Sort items"
              >
                {SORT_MODES.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>

            {filtersActive && sortMode === 'manual' ? (
              <p className="empty-hint reorder-hint">Reordering disabled while filters are active.</p>
            ) : null}

            {visibleItems.length === 0 ? (
              <p className="empty-hint list-empty-hint">
                {items.length === 0
                  ? 'No items yet. Try: Buy milk #errand !2026-07-25'
                  : 'No items match filters.'}
              </p>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={visibleItems.map((i) => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="list-items">
                    {visibleItems.map((item) => (
                      <li key={item.id}>
                        <ListItemDisplay
                          id={item.id}
                          name={item.text}
                          isComplete={item.complete}
                          dueDate={item.dueDate}
                          tags={item.tags || []}
                          priority={item.priority}
                          subItems={item.subItems || []}
                          sortable={canReorder}
                          customTags={customTags}
                          bulkMode={bulkMode}
                          bulkSelected={bulkSelectedIds.has(item.id)}
                          onBulkToggle={() => onBulkToggle?.(listId, item.id)}
                          onCheckboxChange={() => onItemCheckboxChange(item.id)}
                          onNameClick={() => handleItemNameClick(item.id)}
                          onArchive={() => onDeleteItem(item.id)}
                          onSubItemToggle={(subId) => onToggleSubItem(item.id, subId)}
                          onAddSubItem={(text) => onAddSubItem(item.id, text)}
                        />
                      </li>
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            )}

            <div className="list-card-actions">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add item… #tag !date !p2"
                aria-label={`Add item to ${name}`}
                className="text-input"
                data-list-add-item={listId}
              />
              <button
                type="button"
                className="btn btn-danger btn-block"
                onClick={onDeleteCompletedItems}
              >
                Archive completed
              </button>
            </div>
          </>
        ) : null}

        {selectedItem ? (
          <ListItemModal
            isOpen={modalOpen}
            itemName={selectedItem.text}
            description={selectedItem.description || ''}
            dueDate={selectedItem.dueDate || ''}
            tags={selectedItem.tags || []}
            priority={selectedItem.priority || 0}
            recurring={selectedItem.recurring || 'none'}
            completedAt={selectedItem.completedAt || ''}
            subItems={selectedItem.subItems || []}
            customTags={customTags}
            lists={allLists}
            currentListId={listId}
            onClose={handleModalClose}
            onDelete={() => { onDeleteItem(selectedItem.id); handleModalClose(); }}
            onSaveChanges={(patch) => onItemSave(selectedItem.id, patch)}
            onNameChange={(newName) => onItemNameChange(selectedItem.id, newName)}
            onDuplicate={() => onDuplicateItem(selectedItem.id)}
            onMove={(toListId) => { onMoveItem(listId, selectedItem.id, toListId); handleModalClose(); }}
            onAddSubItem={(text) => onAddSubItem(selectedItem.id, text)}
            onToggleSubItem={(subId) => onToggleSubItem(selectedItem.id, subId)}
            onDeleteSubItem={(subId) => onDeleteSubItem(selectedItem.id, subId)}
            onReorderSubItems={(a, o) => onReorderSubItems(selectedItem.id, a, o)}
            onAddCustomTag={onAddCustomTag}
          />
        ) : null}
      </article>
    </ListDropZone>
  );
}

List.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  color: PropTypes.string,
  icon: PropTypes.string,
  items: PropTypes.arrayOf(itemShape),
  sortMode: PropTypes.string,
  collapsed: PropTypes.bool,
  pinned: PropTypes.bool,
  itemFilter: PropTypes.string,
  searchQuery: PropTypes.string,
  tagFilter: PropTypes.string,
  customTags: PropTypes.array,
  allLists: PropTypes.array,
  bulkMode: PropTypes.bool,
  bulkSelectedIds: PropTypes.instanceOf(Set),
  onBulkToggle: PropTypes.func,
  onNameChange: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onDuplicate: PropTypes.func,
  onSaveAsTemplate: PropTypes.func,
  onShare: PropTypes.func,
  onFocusMode: PropTypes.func,
  onAddItem: PropTypes.func.isRequired,
  onItemCheckboxChange: PropTypes.func.isRequired,
  onItemNameChange: PropTypes.func.isRequired,
  onItemSave: PropTypes.func.isRequired,
  onDuplicateItem: PropTypes.func,
  onMoveItem: PropTypes.func,
  onAddSubItem: PropTypes.func.isRequired,
  onToggleSubItem: PropTypes.func.isRequired,
  onDeleteSubItem: PropTypes.func.isRequired,
  onDeleteItem: PropTypes.func.isRequired,
  onDeleteCompletedItems: PropTypes.func.isRequired,
  onReorderItems: PropTypes.func.isRequired,
  onReorderSubItems: PropTypes.func.isRequired,
  onSetListStyle: PropTypes.func.isRequired,
  onSetListMeta: PropTypes.func,
  onAddCustomTag: PropTypes.func,
  filtersActive: PropTypes.bool,
};

export default List;
