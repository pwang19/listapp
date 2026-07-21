import React from 'react';
import PropTypes from 'prop-types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableRow({ id, children, className = '', handle = true }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    // Only animate while dragging — avoids sticky transforms overlapping
    // siblings/controls after layout changes.
    transition: isDragging ? transition : undefined,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 5 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`sortable-row ${className}${isDragging ? ' is-dragging' : ''}`.trim()}
    >      {handle ? (
        <button
          type="button"
          className="drag-handle"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          ⋮⋮
        </button>
      ) : (
        <div className="drag-handle-spacer" {...attributes} {...listeners} />
      )}
      <div className="sortable-row-body">{children}</div>
    </div>
  );
}

SortableRow.propTypes = {
  id: PropTypes.string.isRequired,
  children: PropTypes.node,
  className: PropTypes.string,
  handle: PropTypes.bool,
};

export default SortableRow;
