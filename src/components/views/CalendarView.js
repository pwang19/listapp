import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  getMonthGrid,
  getWeekDays,
  groupItemsByDueDate,
  WEEKDAY_LABELS,
} from '../../utils/calendar';
import { todayDateString } from '../../utils/snooze';
import { isOverdue } from '../../utils/helpers';

function CalendarView({
  lists,
  mode = 'month',
  anchorDate,
  onAnchorChange,
  onItemClick,
  focusedItemKey,
}) {
  const [year, month, day] = useMemo(() => {
    const base = anchorDate ? new Date(`${anchorDate}T00:00:00`) : new Date();
    return [base.getFullYear(), base.getMonth(), base.getDate()];
  }, [anchorDate]);

  const today = todayDateString();
  const itemsByDate = useMemo(() => groupItemsByDueDate(lists), [lists]);

  const toDateStr = (d) => d.toISOString().slice(0, 10);

  const shiftAnchor = (direction) => {
    const d = new Date(year, month, day);
    if (mode === 'month') d.setMonth(d.getMonth() + direction);
    else d.setDate(d.getDate() + direction * 7);
    onAnchorChange(toDateStr(d));
  };

  const cells = mode === 'week'
    ? getWeekDays(year, month, day)
    : getMonthGrid(year, month);

  const monthLabel = new Date(year, month, 1).toLocaleString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => shiftAnchor(-1)}>
          ←
        </button>
        <h2 className="calendar-title">{mode === 'week' ? `Week of ${anchorDate || today}` : monthLabel}</h2>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => shiftAnchor(1)}>
          →
        </button>
        <button type="button" className="btn-link calendar-today" onClick={() => onAnchorChange(today)}>
          Today
        </button>
      </div>

      <div className={`calendar-grid calendar-grid--${mode}`}>
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="calendar-weekday">{label}</div>
        ))}
        {cells.map((cell, idx) => {
          if (!cell.inMonth && mode === 'month' && !cell.date) {
            return <div key={`pad-${idx}`} className="calendar-cell calendar-cell--pad" />;
          }
          const dayItems = cell.date ? (itemsByDate.get(cell.date) || []) : [];
          const isToday = cell.date === today;
          return (
            <div
              key={cell.date || `empty-${idx}`}
              className={`calendar-cell${isToday ? ' is-today' : ''}${!cell.inMonth ? ' is-outside' : ''}`}
            >
              {cell.day ? <span className="calendar-day-num">{cell.day}</span> : null}
              <ul className="calendar-items">
                {dayItems.slice(0, mode === 'week' ? 20 : 3).map(({ listId, listName, listIcon, item }) => {
                  const focusKey = `${listId}:${item.id}`;
                  const overdue = isOverdue(item.dueDate, false);
                  return (
                    <li key={focusKey}>
                      <button
                        type="button"
                        className={`calendar-item-btn${overdue ? ' is-overdue' : ''}${focusedItemKey === focusKey ? ' is-keyboard-focused' : ''}`}
                        data-item-key={focusKey}
                        onClick={() => onItemClick(listId, item.id)}
                        title={`${listName}: ${item.text}`}
                      >
                        <span className="calendar-item-icon">{listIcon}</span>
                        <span className="calendar-item-text">{item.text}</span>
                      </button>
                    </li>
                  );
                })}
                {dayItems.length > (mode === 'week' ? 20 : 3) ? (
                  <li className="calendar-more">+{dayItems.length - (mode === 'week' ? 20 : 3)} more</li>
                ) : null}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

CalendarView.propTypes = {
  lists: PropTypes.array.isRequired,
  mode: PropTypes.oneOf(['month', 'week']),
  anchorDate: PropTypes.string,
  onAnchorChange: PropTypes.func.isRequired,
  onItemClick: PropTypes.func.isRequired,
  focusedItemKey: PropTypes.string,
};

export default CalendarView;
