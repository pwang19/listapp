import React from 'react';
import PropTypes from 'prop-types';
import { getTagById } from '../../utils/tags';
import { isOverdue, isDueSoon } from '../../utils/helpers';
import { LIST_COLORS, PRIORITIES } from '../../utils/constants';

function AllItemsView({
  rows,
  customTags,
  onItemClick,
  selectedKeys = new Set(),
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  focusedItemKey,
}) {
  if (!rows.length) {
    return <p className="empty-state">No items yet. Add items to your lists.</p>;
  }

  const selectedRowCount = rows.filter(({ listId, item }) => selectedKeys.has(`${listId}:${item.id}`)).length;
  const allSelected = selectedRowCount === rows.length;

  return (
    <div className="all-items-view">
      <table className="all-items-table">
        <thead>
          <tr>
            <th scope="col" className="col-check">
              <input
                type="checkbox"
                className="select-checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = selectedRowCount > 0 && !allSelected;
                }}
                onChange={() => (allSelected ? onClearSelection?.() : onSelectAll?.())}
                aria-label={allSelected ? 'Clear selection' : 'Select all items'}
              />
            </th>
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
            const key = `${listId}:${item.id}`;
            const selected = selectedKeys.has(key);
            return (
              <tr
                key={key}
                className={`${item.complete ? 'is-complete' : ''}${focusedItemKey === key ? ' is-keyboard-focused' : ''}${selected ? ' is-selected' : ''}`}
                data-item-key={key}
              >
                <td className="col-check">
                  <input
                    type="checkbox"
                    className="select-checkbox"
                    checked={selected}
                    onChange={() => {}}
                    onClick={(e) => onToggleSelect?.(listId, item.id, { range: e.shiftKey })}
                    aria-label={`Select ${item.text}`}
                  />
                </td>
                <td>
                  <span className="all-items-list" style={{ borderLeftColor: colorMeta.value }}>
                    {listIcon} {listName}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className="item-name-button"
                    onClick={(e) => {
                      if (onToggleSelect && (e.metaKey || e.ctrlKey || e.shiftKey)) {
                        onToggleSelect(listId, item.id, { range: e.shiftKey });
                      } else {
                        onItemClick(listId, item.id);
                      }
                    }}
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
  selectedKeys: PropTypes.instanceOf(Set),
  onToggleSelect: PropTypes.func,
  onSelectAll: PropTypes.func,
  onClearSelection: PropTypes.func,
  focusedItemKey: PropTypes.string,
};

export default AllItemsView;
