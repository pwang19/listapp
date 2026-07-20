import React, { useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { getTagById } from '../utils/tags';
import { isOverdue, isDueSoon } from '../utils/helpers';
import { PRIORITIES } from '../utils/constants';
import SortableRow from './SortableRow';

const subItemShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  complete: PropTypes.bool,
});

const SWIPE_THRESHOLD = 60;

function ListItemDisplay({
  id,
  name,
  isComplete,
  dueDate = '',
  tags = [],
  priority = 0,
  onCheckboxChange,
  onNameClick,
  onArchive,
  subItems = [],
  onSubItemToggle,
  onAddSubItem,
  sortable = false,
  bulkMode = false,
  bulkSelected = false,
  onBulkToggle,
  customTags = [],
}) {
  const checkboxId = useId();
  const [expanded, setExpanded] = useState(false);
  const [subInput, setSubInput] = useState('');
  const [offsetX, setOffsetX] = useState(0);
  const touchStart = useRef(null);
  const overdue = isOverdue(dueDate, isComplete);
  const dueSoon = isDueSoon(dueDate, isComplete);
  const pri = PRIORITIES.find((p) => p.id === priority);

  const handleTouchStart = (e) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchMove = (e) => {
    if (!touchStart.current) return;
    const dx = e.touches[0].clientX - touchStart.current.x;
    const dy = e.touches[0].clientY - touchStart.current.y;
    if (Math.abs(dy) > Math.abs(dx)) return;
    setOffsetX(dx);
  };

  const handleTouchEnd = () => {
    if (offsetX > SWIPE_THRESHOLD) {
      onCheckboxChange();
    } else if (offsetX < -SWIPE_THRESHOLD && onArchive) {
      onArchive();
    }
    setOffsetX(0);
    touchStart.current = null;
  };

  const body = (
    <div
      className="list-item swipe-item"
      style={{ transform: offsetX ? `translateX(${offsetX}px)` : undefined }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="list-item-main">
        {bulkMode ? (
          <input
            type="checkbox"
            checked={bulkSelected}
            onChange={onBulkToggle}
            aria-label={`Select ${name}`}
          />
        ) : null}
        <input
          id={checkboxId}
          type="checkbox"
          checked={isComplete}
          onChange={onCheckboxChange}
        />
        <button
          type="button"
          className={`item-name-button${isComplete ? ' is-complete' : ''}`}
          onClick={onNameClick}
          aria-label={`Open details for ${name}`}
        >
          {name}
        </button>
        {pri && pri.id > 0 ? (
          <span className="priority-badge" style={{ color: pri.color }} title={pri.label}>
            P{pri.id}
          </span>
        ) : null}
        {dueDate ? (
          <span
            className={`due-badge${overdue ? ' is-overdue' : ''}${dueSoon ? ' is-due-soon' : ''}`}
          >
            {dueDate}
          </span>
        ) : null}
      </div>
      {tags.length > 0 ? (
        <div className="tag-row">
          {tags.map((tagId) => {
            const tag = getTagById(tagId, customTags);
            if (!tag) return null;
            return (
              <span
                key={tagId}
                className="tag-chip"
                style={{ backgroundColor: `${tag.color}22`, color: tag.color }}
              >
                {tag.label}
              </span>
            );
          })}
        </div>
      ) : null}
      {subItems.length > 0 ? (
        <div className="inline-subitems-section">
          <button
            type="button"
            className="btn-link subitems-toggle"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            {expanded ? '▾' : '▸'} {subItems.length} sub-item{subItems.length === 1 ? '' : 's'}
          </button>
          {expanded ? (
            <div className="inline-subitems">
              {subItems.map((subItem) => {
                const subId = `${id}-sub-${subItem.id}`;
                return (
                  <div key={subItem.id} className="inline-subitem">
                    <input
                      id={subId}
                      type="checkbox"
                      checked={subItem.complete || false}
                      onChange={() => onSubItemToggle && onSubItemToggle(subItem.id)}
                    />
                    <label
                      htmlFor={subId}
                      className={`inline-subitem-label${subItem.complete ? ' is-complete' : ''}`}
                    >
                      {subItem.text}
                    </label>
                  </div>
                );
              })}
              {onAddSubItem ? (
                <input
                  type="text"
                  className="text-input text-input--sm"
                  placeholder="Quick add sub-item…"
                  value={subInput}
                  onChange={(e) => setSubInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && subInput.trim()) {
                      onAddSubItem(subInput.trim());
                      setSubInput('');
                    }
                  }}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      ) : onAddSubItem ? (
        <button
          type="button"
          className="btn-link subitems-toggle"
          onClick={() => setExpanded(true)}
        >
          + Add sub-item
        </button>
      ) : null}
    </div>
  );

  if (!sortable) return body;

  return (
    <SortableRow id={id} className="item-sortable">
      {body}
    </SortableRow>
  );
}

ListItemDisplay.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  isComplete: PropTypes.bool,
  dueDate: PropTypes.string,
  tags: PropTypes.arrayOf(PropTypes.string),
  priority: PropTypes.number,
  onCheckboxChange: PropTypes.func.isRequired,
  onNameClick: PropTypes.func.isRequired,
  onArchive: PropTypes.func,
  subItems: PropTypes.arrayOf(subItemShape),
  onSubItemToggle: PropTypes.func,
  onAddSubItem: PropTypes.func,
  sortable: PropTypes.bool,
  bulkMode: PropTypes.bool,
  bulkSelected: PropTypes.bool,
  onBulkToggle: PropTypes.func,
  customTags: PropTypes.array,
};

export default ListItemDisplay;
