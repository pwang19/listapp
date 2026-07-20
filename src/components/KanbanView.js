import React from 'react';
import PropTypes from 'prop-types';
import { getTagById } from '../utils/tags';

function KanbanView({ lists, customTags, groupBy, onItemClick }) {
  const columns = [];

  if (groupBy === 'status') {
    columns.push({ id: 'active', label: 'Active', items: [] });
    columns.push({ id: 'completed', label: 'Completed', items: [] });
    lists.forEach((list) => {
      list.items.forEach((item) => {
        const col = item.complete ? columns[1] : columns[0];
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
    columns.push(...tagMap.values());
  }

  return (
    <div className="kanban-board">
      {columns.map((col) => (
        <div key={col.id} className="kanban-column">
          <h3 className="kanban-column-title">
            {col.label}
            <span className="kanban-count">{col.items.length}</span>
          </h3>
          <ul className="kanban-cards">
            {col.items.map(({ list, item }) => (
              <li key={`${list.id}-${item.id}`}>
                <button
                  type="button"
                  className={`kanban-card${item.complete ? ' is-complete' : ''}`}
                  onClick={() => onItemClick(list.id, item.id)}
                >
                  <span className="kanban-card-list">{list.icon} {list.name}</span>
                  <span className="kanban-card-text">{item.text}</span>
                  {item.dueDate ? (
                    <span className="due-badge">{item.dueDate}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

KanbanView.propTypes = {
  lists: PropTypes.array.isRequired,
  customTags: PropTypes.array,
  groupBy: PropTypes.string,
  onItemClick: PropTypes.func.isRequired,
};

export default KanbanView;
