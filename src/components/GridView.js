import React from 'react';
import PropTypes from 'prop-types';
import {
  DndContext,
  closestCenter,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import List from './lists/List';
import SortableRow from './ui/SortableRow';

function GridView({
  lists,
  listsToShow,
  settings,
  itemFilter,
  searchQuery,
  tagFilter,
  customTags,
  bulkMode,
  bulkSelected,
  filtersActive,
  sensors,
  activeDragId,
  onDragStart,
  onDragEnd,
  onOpenTemplates,
  onClearFilters,
  onBulkToggle,
  onOpenItem,
  onDeleteList,
  onDuplicateList,
  onSaveAsTemplate,
  onFocusMode,
  onShare,
  onAddItem,
  onToggleItem,
  onRenameItem,
  onUpdateItemFields,
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
  onRenameList,
}) {
  if (listsToShow.length === 0) {
    return (
      <div className="empty-state-block">
        <p className="empty-state">
          {lists.length === 0
            ? 'No lists yet. Type a name below, press Enter, or open Templates (t).'
            : 'No lists match the current search or tag filter.'}
        </p>
        {filtersActive ? (
          <button type="button" className="btn btn-secondary" onClick={onClearFilters}>
            Clear filters
          </button>
        ) : lists.length === 0 ? (
          <button type="button" className="btn btn-primary" onClick={onOpenTemplates}>
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
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
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
                onBulkToggle={onBulkToggle}
                filtersActive={filtersActive}
                onNameChange={(newName) => onRenameList(list.id, newName)}
                onDelete={() => onDeleteList(list.id)}
                onDuplicate={() => onDuplicateList(list.id)}
                onSaveAsTemplate={() => onSaveAsTemplate(list.id)}
                onFocusMode={() => onFocusMode(list.id)}
                onShare={onShare}
                onAddItem={(text) => onAddItem(list.id, text)}
                onItemCheckboxChange={(itemId) => onToggleItem(list.id, itemId)}
                onItemNameChange={(itemId, newName) => onRenameItem(list.id, itemId, newName)}
                onItemSave={(itemId, patch) => onUpdateItemFields(list.id, itemId, patch)}
                onDuplicateItem={(itemId) => onDuplicateItem(list.id, itemId)}
                onMoveItem={onMoveItem}
                onAddSubItem={(itemId, text) => onAddSubItem(list.id, itemId, text)}
                onToggleSubItem={(itemId, subId) => onToggleSubItem(list.id, itemId, subId)}
                onDeleteSubItem={(itemId, subId) => onDeleteSubItem(list.id, itemId, subId)}
                onDeleteItem={(itemId) => onDeleteItem(list.id, itemId)}
                onDeleteCompletedItems={() => onDeleteCompletedItems(list.id)}
                onReorderItems={(a, o) => onReorderItems(list.id, a, o)}
                onReorderSubItems={(itemId, a, o) => onReorderSubItems(list.id, itemId, a, o)}
                onSetListStyle={(style) => onSetListStyle(list.id, style)}
                onSetListMeta={(patch) => onSetListMeta(list.id, patch)}
                onAddCustomTag={onAddCustomTag}
                onOpenItem={(itemId) => onOpenItem(list.id, itemId)}
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
}

GridView.propTypes = {
  lists: PropTypes.array.isRequired,
  listsToShow: PropTypes.array.isRequired,
  settings: PropTypes.object.isRequired,
  itemFilter: PropTypes.string.isRequired,
  searchQuery: PropTypes.string.isRequired,
  tagFilter: PropTypes.string.isRequired,
  customTags: PropTypes.array.isRequired,
  bulkMode: PropTypes.bool.isRequired,
  bulkSelected: PropTypes.instanceOf(Map).isRequired,
  filtersActive: PropTypes.bool.isRequired,
  sensors: PropTypes.object.isRequired,
  activeDragId: PropTypes.string,
  onDragStart: PropTypes.func.isRequired,
  onDragEnd: PropTypes.func.isRequired,
  onOpenTemplates: PropTypes.func.isRequired,
  onClearFilters: PropTypes.func.isRequired,
  onBulkToggle: PropTypes.func.isRequired,
  onOpenItem: PropTypes.func.isRequired,
  onDeleteList: PropTypes.func.isRequired,
  onDuplicateList: PropTypes.func.isRequired,
  onSaveAsTemplate: PropTypes.func.isRequired,
  onFocusMode: PropTypes.func.isRequired,
  onShare: PropTypes.func.isRequired,
  onAddItem: PropTypes.func.isRequired,
  onToggleItem: PropTypes.func.isRequired,
  onRenameItem: PropTypes.func.isRequired,
  onUpdateItemFields: PropTypes.func.isRequired,
  onDuplicateItem: PropTypes.func.isRequired,
  onMoveItem: PropTypes.func.isRequired,
  onAddSubItem: PropTypes.func.isRequired,
  onToggleSubItem: PropTypes.func.isRequired,
  onDeleteSubItem: PropTypes.func.isRequired,
  onDeleteItem: PropTypes.func.isRequired,
  onDeleteCompletedItems: PropTypes.func.isRequired,
  onReorderItems: PropTypes.func.isRequired,
  onReorderSubItems: PropTypes.func.isRequired,
  onSetListStyle: PropTypes.func.isRequired,
  onSetListMeta: PropTypes.func.isRequired,
  onAddCustomTag: PropTypes.func.isRequired,
  onRenameList: PropTypes.func.isRequired,
};

export default GridView;
