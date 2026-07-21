import React from 'react';
import PropTypes from 'prop-types';
import { getTagById } from '../../utils/tags';
import { isOverdue, isDueSoon } from '../../utils/helpers';
import { LIST_COLORS, PRIORITIES } from '../../utils/constants';

function AllItemsView({ rows, customTags, onItemClick, bulkMode, selectedIds, onToggleSelect }) {
  if (!rows.length) {
    return <p className="empty-state">No items yet. Add items to your lists.</p>;
  }

  return (
    <div className="all-items-view">
      <table className="all-items-table">
        <thead>
          <tr>
            {bulkMode ? <th scope="col" className="col-check" /> : null}
            <th scope="col">List</th>
            <th scope="col">Item</th>
            <th scope="col">Due</th>
            <th scope="col">Tags</th>
            <th scope="col">Priority</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ listId, listName, listIcon, listColor, item }) => {
            const colorMeta = LIST_COLORS.find((c) => c.id === listColor) || LIST_COLORS[0];
            const pri = PRIORITIES.find((p) => p.id === (item.priority || 0));
            const rowKey = `${listId}-${item.id}`;
            return (
              <tr key={rowKey} className={item.complete ? 'is-complete' : ''}>
                {bulkMode ? (
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(rowKey)}
                      onChange={() => onToggleSelect(rowKey, listId, item.id)}
                      aria-label={`Select ${item.text}`}
                    />
                  </td>
                ) : null}
                <td>
                  <span className="all-items-list" style={{ borderLeftColor: colorMeta.value }}>
                    {listIcon} {listName}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className="item-name-button"
                    onClick={() => onItemClick(listId, item.id)}
                  >
                    {item.text}
                  </button>
                </td>
                <td>
                  {item.dueDate ? (
                    <span
                      className={`due-badge${isOverdue(item.dueDate, item.complete) ? ' is-overdue' : ''}${isDueSoon(item.dueDate, item.complete) ? ' is-due-soon' : ''}`}
                    >
                      {item.dueDate}
                    </span>
                  ) : '—'}
                </td>
                <td>
                  <div className="tag-row tag-row--inline">
                    {(item.tags || []).map((tagId) => {
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
                </td>
                <td>{pri?.label || '—'}</td>
                <td>{item.complete ? 'Done' : 'Active'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

AllItemsView.propTypes = {
  rows: PropTypes.arrayOf(PropTypes.object).isRequired,
  customTags: PropTypes.array,
  onItemClick: PropTypes.func.isRequired,
  bulkMode: PropTypes.bool,
  selectedIds: PropTypes.instanceOf(Set),
  onToggleSelect: PropTypes.func,
};

export default AllItemsView;
