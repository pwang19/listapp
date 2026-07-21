import React from 'react';
import PropTypes from 'prop-types';
import { isOverdue, isDueSoon } from '../../utils/helpers';
import { LIST_COLORS } from '../../utils/constants';

function UpcomingView({ items, onItemClick }) {
  if (!items.length) {
    return (
      <p className="empty-state">
        No upcoming or overdue items. Add due dates to items to see them here.
      </p>
    );
  }

  const overdue = items.filter((r) => r.overdue);
  const dueSoon = items.filter((r) => r.dueSoon && !r.overdue);
  const upcoming = items.filter((r) => !r.overdue && !r.dueSoon);

  const renderGroup = (title, rows) => {
    if (!rows.length) return null;
    return (
      <section className="upcoming-group">
        <h3 className="upcoming-group-title">{title}</h3>
        <ul className="upcoming-list">
          {rows.map(({ listId, listName, listIcon, item }) => {
            const colorMeta = LIST_COLORS.find((c) => c.id === item.listColor) || LIST_COLORS[0];
            return (
              <li key={`${listId}-${item.id}`}>
                <button
                  type="button"
                  className="upcoming-row"
                  onClick={() => onItemClick(listId, item.id)}
                >
                  <span className="upcoming-list-label">
                    {listIcon} {listName}
                  </span>
                  <span className="upcoming-item-text">{item.text}</span>
                  <span
                    className={`due-badge${isOverdue(item.dueDate, false) ? ' is-overdue' : ''}${isDueSoon(item.dueDate, false) ? ' is-due-soon' : ''}`}
                  >
                    {item.dueDate}
                  </span>
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
      {renderGroup('Overdue', overdue)}
      {renderGroup('Due soon', dueSoon)}
      {renderGroup('Upcoming', upcoming)}
    </div>
  );
}

UpcomingView.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  onItemClick: PropTypes.func.isRequired,
};

export default UpcomingView;
