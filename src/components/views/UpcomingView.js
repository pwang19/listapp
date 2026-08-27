import React from 'react';
import PropTypes from 'prop-types';
import { isOverdue, isDueSoon } from '../../utils/helpers';

function UpcomingView({ items, blockedItems = [], onItemClick, focusedItemKey }) {
  const overdue = items.filter((r) => r.overdue);
  const dueSoon = items.filter((r) => r.dueSoon && !r.overdue);
  const upcoming = items.filter((r) => !r.overdue && !r.dueSoon);
  const hasContent = items.length > 0 || blockedItems.length > 0;

  if (!hasContent) {
    return (
      <p className="empty-state">
        No upcoming, overdue, or blocked items. Add due dates to items to see them here.
      </p>
    );
  }

  const renderGroup = (title, rows, { showDue = true } = {}) => {
    if (!rows.length) return null;
    return (
      <section className="upcoming-group">
        <h3 className="upcoming-group-title">{title}</h3>
        <ul className="upcoming-list">
          {rows.map(({ listId, listName, listIcon, item }) => {
            const focusKey = `${listId}:${item.id}`;
            return (
              <li key={`${listId}-${item.id}`} data-item-key={focusKey}>
                <button
                  type="button"
                  className={`upcoming-row${focusedItemKey === focusKey ? ' is-keyboard-focused' : ''}`}
                  onClick={() => onItemClick(listId, item.id)}
                >
                  <span className="upcoming-list-label">
                    {listIcon} {listName}
                  </span>
                  <span className="upcoming-item-text">{item.text}</span>
                  {showDue && item.dueDate ? (
                    <span
                      className={`due-badge${isOverdue(item.dueDate, false) ? ' is-overdue' : ''}${isDueSoon(item.dueDate, false) ? ' is-due-soon' : ''}`}
                    >
                      {item.dueDate}
                    </span>
                  ) : (
                    <span className="blocked-badge" title="Blocked">🔒</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    );
  };

  return (
    <div className="upcoming-view">
      {renderGroup('Blocked', blockedItems, { showDue: false })}
      {renderGroup('Overdue', overdue)}
      {renderGroup('Due soon', dueSoon)}
      {renderGroup('Upcoming', upcoming)}
    </div>
  );
}

UpcomingView.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  blockedItems: PropTypes.arrayOf(PropTypes.object),
  onItemClick: PropTypes.func.isRequired,
  focusedItemKey: PropTypes.string,
};

export default UpcomingView;
