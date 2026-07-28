import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  closestCorners,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { getTagById } from '../../utils/tags';

function parseCardId(id) {
  const str = String(id);
  if (!str.startsWith('kanban::')) return null;
  const parts = str.slice(8).split('::');
  if (parts.length !== 2) return null;
  return { listId: parts[0], itemId: parts[1] };
}

function KanbanCard({
  list,
  item,
  onItemClick,
  keyboardFocused,
  focusKey,
}) {
  const cardId = `kanban::${list.id}::${item.id}`;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: cardId,
    data: { listId: list.id, itemId: item.id },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.5 : 1 }
    : undefined;

  return (
    <li ref={setNodeRef} style={style} data-item-key={focusKey}>
      <button
        type="button"
        className={`kanban-card${item.complete ? ' is-complete' : ''}${keyboardFocused ? ' is-keyboard-focused' : ''}`}
        onClick={() => onItemClick(list.id, item.id)}
        {...listeners}
        {...attributes}
      >
        <span className="kanban-drag-hint" aria-hidden="true">⋮⋮</span>
        <span className="kanban-card-list">{list.icon} {list.name}</span>
        <span className="kanban-card-text">{item.text}</span>
        {item.dueDate ? (
          <span className="due-badge">{item.dueDate}</span>
        ) : null}
      </button>
    </li>
  );
}

KanbanCard.propTypes = {
  list: PropTypes.object.isRequired,
  item: PropTypes.object.isRequired,
  onItemClick: PropTypes.func.isRequired,
  keyboardFocused: PropTypes.bool,
  focusKey: PropTypes.string,
};

function KanbanColumn({ col, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: `kanban-col-${col.id}` });
  return (
    <div
      ref={setNodeRef}
      className={`kanban-column${isOver ? ' is-drop-over' : ''}`}
      data-column-id={col.id}
    >
      <h3 className="kanban-column-title">
        {col.label}
        <span className="kanban-count">{col.items.length}</span>
      </h3>
      <ul className="kanban-cards">{children}</ul>
    </div>
  );
}

KanbanColumn.propTypes = {
  col: PropTypes.object.isRequired,
  children: PropTypes.node,
};

function KanbanView({
  lists,
  customTags,
  groupBy,
  onItemClick,
  onColumnDrop,
  focusedItemKey,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const columns = useMemo(() => {
    const cols = [];
    if (groupBy === 'status') {
      cols.push({ id: 'active', label: 'Active', items: [] });
      cols.push({ id: 'completed', label: 'Completed', items: [] });
      lists.forEach((list) => {
        list.items.forEach((item) => {
          const col = item.complete ? cols[1] : cols[0];
          col.items.push({ list, item });
        });
      });
    } else {
      const tagMap = new Map();
      tagMap.set('_none', { id: '_none', label: 'No tag', items: [] });
      lists.forEach((list) => {
        list.items.forEach((item) => {
          const tags = item.tags?.length ? item.tags : ['_none'];
          tags.forEach((tagId) => {
            if (!tagMap.has(tagId)) {
              const tag = getTagById(tagId, customTags);
              tagMap.set(tagId, { id: tagId, label: tag?.label || tagId, items: [] });
            }
            tagMap.get(tagId).items.push({ list, item });
          });
        });
      });
      cols.push(...tagMap.values());
    }
    return cols;
  }, [lists, customTags, groupBy]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || !onColumnDrop) return;
    const card = parseCardId(active.id);
    const overId = String(over.id);
    if (!card || !overId.startsWith('kanban-col-')) return;
    const columnId = overId.replace('kanban-col-', '');
    onColumnDrop(card.listId, card.itemId, columnId, groupBy);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="kanban-board">
        {columns.map((col) => (
          <KanbanColumn key={col.id} col={col}>
            {col.items.map(({ list, item }) => {
              const focusKey = `${list.id}:${item.id}`;
              return (
                <KanbanCard
                  key={focusKey}
                  list={list}
                  item={item}
                  onItemClick={onItemClick}
                  focusKey={focusKey}
                  keyboardFocused={focusedItemKey === focusKey}
                />
              );
            })}
          </KanbanColumn>
        ))}
      </div>
    </DndContext>
  );
}

KanbanView.propTypes = {
  lists: PropTypes.array.isRequired,
  customTags: PropTypes.array,
  groupBy: PropTypes.string,
  onItemClick: PropTypes.func.isRequired,
  onColumnDrop: PropTypes.func,
  focusedItemKey: PropTypes.string,
};

export default KanbanView;
