import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import EditableText from './EditableText';
import ListItemDisplay from './ListItemDisplay';
import ListItemModal from './ListItemModal';
import { LIST_COLORS, LIST_ICONS } from '../utils/constants';

const itemShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  complete: PropTypes.bool,
  description: PropTypes.string,
  dueDate: PropTypes.string,
  tags: PropTypes.arrayOf(PropTypes.string),
  subItems: PropTypes.array,
});

function List({
  id: listId,
  name,
  color = 'slate',
  icon = '📋',
  items = [],
  itemFilter = 'all',
  searchQuery = '',
  tagFilter = '',
  onNameChange,
  onDelete,
  onAddItem,
  onItemCheckboxChange,
  onItemNameChange,
  onItemSave,
  onAddSubItem,
  onToggleSubItem,
  onDeleteSubItem,
  onDeleteItem,
  onDeleteCompletedItems,
  onReorderItems,
  onReorderSubItems,
  onSetListStyle,
}) {
  const [inputValue, setInputValue] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const colorMeta = LIST_COLORS.find((c) => c.id === color) || LIST_COLORS[0];

  const visibleItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (itemFilter === 'active' && item.complete) return false;
      if (itemFilter === 'completed' && !item.complete) return false;
      if (tagFilter && !(item.tags || []).includes(tagFilter)) return false;
      if (!q) return true;
      const hay = [
        item.text,
        item.description || '',
        ...(item.subItems || []).map((s) => s.text),
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items, itemFilter, searchQuery, tagFilter]);

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
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorderItems(active.id, over.id);
  };

  return (
    <article
      className="list-card"
      data-list-id={listId}
      style={{ borderTop: `4px solid ${colorMeta.value}` }}
    >
      <button
        type="button"
        className="icon-button list-card-delete"
        onClick={onDelete}
        aria-label={`Delete list ${name}`}
      >
        ×
      </button>

      <div className="list-card-header">
        <span className="list-icon" aria-hidden="true">
          {icon}
        </span>
        <h2 className="list-card-title">
          <EditableText value={name} onSave={onNameChange} className="list-title" />
        </h2>
      </div>

      <div className="list-style-row">
        <label className="sr-only" htmlFor={`icon-${listId}`}>
          List icon
        </label>
        <select
          id={`icon-${listId}`}
          className="style-select"
          value={icon}
          onChange={(e) => onSetListStyle({ icon: e.target.value })}
          aria-label="List icon"
        >
          {LIST_ICONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor={`color-${listId}`}>
          List color
        </label>
        <select
          id={`color-${listId}`}
          className="style-select"
          value={color}
          onChange={(e) => onSetListStyle({ color: e.target.value })}
          aria-label="List color"
        >
          {LIST_COLORS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {visibleItems.length === 0 ? (
        <p className="empty-hint list-empty-hint">
          {items.length === 0
            ? 'No items yet. Add one below, then click a name to open details.'
            : 'No items match the current filters.'}
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
                    subItems={item.subItems || []}
                    sortable
                    onCheckboxChange={() => onItemCheckboxChange(item.id)}
                    onNameClick={() => handleItemNameClick(item.id)}
                    onSubItemToggle={(subItemId) => onToggleSubItem(item.id, subItemId)}
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
          placeholder="Add a new item..."
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

      {selectedItem ? (
        <ListItemModal
          isOpen={modalOpen}
          itemName={selectedItem.text}
          description={selectedItem.description || ''}
          dueDate={selectedItem.dueDate || ''}
          tags={selectedItem.tags || []}
          subItems={selectedItem.subItems || []}
          onClose={handleModalClose}
          onDelete={() => {
            onDeleteItem(selectedItem.id);
            handleModalClose();
          }}
          onSaveChanges={(patch) => onItemSave(selectedItem.id, patch)}
          onNameChange={(newName) => onItemNameChange(selectedItem.id, newName)}
          onAddSubItem={(text) => onAddSubItem(selectedItem.id, text)}
          onToggleSubItem={(subItemId) => onToggleSubItem(selectedItem.id, subItemId)}
          onDeleteSubItem={(subItemId) => onDeleteSubItem(selectedItem.id, subItemId)}
          onReorderSubItems={(activeId, overId) =>
            onReorderSubItems(selectedItem.id, activeId, overId)
          }
        />
      ) : null}
    </article>
  );
}

List.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  color: PropTypes.string,
  icon: PropTypes.string,
  items: PropTypes.arrayOf(itemShape),
  itemFilter: PropTypes.string,
  searchQuery: PropTypes.string,
  tagFilter: PropTypes.string,
  onNameChange: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onAddItem: PropTypes.func.isRequired,
  onItemCheckboxChange: PropTypes.func.isRequired,
  onItemNameChange: PropTypes.func.isRequired,
  onItemSave: PropTypes.func.isRequired,
  onAddSubItem: PropTypes.func.isRequired,
  onToggleSubItem: PropTypes.func.isRequired,
  onDeleteSubItem: PropTypes.func.isRequired,
  onDeleteItem: PropTypes.func.isRequired,
  onDeleteCompletedItems: PropTypes.func.isRequired,
  onReorderItems: PropTypes.func.isRequired,
  onReorderSubItems: PropTypes.func.isRequired,
  onSetListStyle: PropTypes.func.isRequired,
};

export default List;
