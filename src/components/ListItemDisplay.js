import React, { useId } from 'react';
import PropTypes from 'prop-types';
import { TAG_PALETTE } from '../utils/constants';
import { isOverdue, isDueSoon } from '../utils/helpers';
import SortableRow from './SortableRow';

const subItemShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  complete: PropTypes.bool,
});

function ListItemDisplay({
  id,
  name,
  isComplete,
  dueDate = '',
  tags = [],
  onCheckboxChange,
  onNameClick,
  subItems = [],
  onSubItemToggle,
  sortable = false,
}) {
  const checkboxId = useId();
  const overdue = isOverdue(dueDate, isComplete);
  const dueSoon = isDueSoon(dueDate, isComplete);

  const body = (
    <div className="list-item">
      <div className="list-item-main">
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
            const tag = TAG_PALETTE.find((t) => t.id === tagId);
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
        </div>
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
  onCheckboxChange: PropTypes.func.isRequired,
  onNameClick: PropTypes.func.isRequired,
  subItems: PropTypes.arrayOf(subItemShape),
  onSubItemToggle: PropTypes.func,
  sortable: PropTypes.bool,
};

export default ListItemDisplay;
