import React from 'react';
import PropTypes from 'prop-types';
import Modal from './Modal';
import { TAG_PALETTE } from '../utils/constants';

function ArchiveShelf({ isOpen, onClose, archived, lists, onRestore, onPurge }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Archived items"
      panelClassName="modal-panel--wide"
    >
      <button
        type="button"
        className="icon-button modal-close"
        onClick={onClose}
        aria-label="Close"
      >
        ×
      </button>

      {archived.length === 0 ? (
        <p className="empty-hint">No archived items. Completed tasks you archive land here.</p>
      ) : (
        <ul className="archive-list">
          {archived.map((entry) => (
            <li key={entry.id} className="archive-row">
              <div>
                <strong>{entry.text}</strong>
                <div className="archive-meta">
                  From {entry.fromListName || 'unknown list'}
                  {entry.archivedAt
                    ? ` · ${new Date(entry.archivedAt).toLocaleString()}`
                    : ''}
                </div>
                {(entry.tags || []).length > 0 ? (
                  <div className="tag-row">
                    {entry.tags.map((tagId) => {
                      const tag = TAG_PALETTE.find((t) => t.id === tagId);
                      return tag ? (
                        <span key={tagId} className="tag-chip">
                          {tag.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                ) : null}
              </div>
              <div className="archive-actions">
                <select
                  className="style-select"
                  defaultValue={
                    lists.some((l) => l.id === entry.fromListId)
                      ? entry.fromListId
                      : lists[0]?.id || ''
                  }
                  aria-label={`Restore ${entry.text} to list`}
                  id={`restore-target-${entry.id}`}
                  disabled={lists.length === 0}
                >
                  {lists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.icon} {list.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={lists.length === 0}
                  onClick={() => {
                    const select = document.getElementById(`restore-target-${entry.id}`);
                    onRestore(entry.id, select?.value);
                  }}
                >
                  Restore
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onPurge(entry.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

ArchiveShelf.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  archived: PropTypes.arrayOf(PropTypes.object).isRequired,
  lists: PropTypes.arrayOf(PropTypes.object).isRequired,
  onRestore: PropTypes.func.isRequired,
  onPurge: PropTypes.func.isRequired,
};

export default ArchiveShelf;
