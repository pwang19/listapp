import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from './Modal';

function TagManagerModal({
  isOpen,
  onClose,
  customTags = [],
  onUpdateTag,
  onDeleteTag,
}) {
  const [editingId, setEditingId] = useState('');

  if (!isOpen) return null;

  const editing = customTags.find((t) => t.id === editingId);

  return (
    <Modal title="Manage tags" onClose={onClose}>
      <p className="modal-hint">Set parent tags and comma-separated aliases for quick-add.</p>
      {customTags.length === 0 ? (
        <p className="empty-hint">No custom tags yet. Create tags from an item or quick-add with #tag.</p>
      ) : (
        <ul className="tag-manager-list">
          {customTags.map((tag) => (
            <li key={tag.id} className="tag-manager-row">
              <button
                type="button"
                className="tag-chip"
                style={{ backgroundColor: `${tag.color}33`, color: tag.color, borderColor: tag.color }}
                onClick={() => setEditingId(tag.id === editingId ? '' : tag.id)}
              >
                {tag.label}
              </button>
              {tag.parentId ? (
                <span className="tag-manager-meta">
                  under {customTags.find((t) => t.id === tag.parentId)?.label || tag.parentId}
                </span>
              ) : null}
              {(tag.aliases || []).length > 0 ? (
                <span className="tag-manager-meta">aliases: {(tag.aliases || []).join(', ')}</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {editing ? (
        <div className="tag-manager-editor">
          <h3 className="tag-manager-editor-title">Edit “{editing.label}”</h3>
          <label className="field">
            <span className="field-label">Parent tag</span>
            <select
              className="style-select"
              value={editing.parentId || ''}
              onChange={(e) => onUpdateTag(editing.id, { parentId: e.target.value })}
            >
              <option value="">None</option>
              {customTags
                .filter((t) => t.id !== editing.id)
                .map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Aliases (comma-separated)</span>
            <input
              type="text"
              className="text-input"
              defaultValue={(editing.aliases || []).join(', ')}
              onBlur={(e) => {
                const aliases = e.target.value
                  .split(',')
                  .map((a) => a.trim().toLowerCase())
                  .filter(Boolean);
                onUpdateTag(editing.id, { aliases });
              }}
            />
          </label>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              onDeleteTag(editing.id);
              setEditingId('');
            }}
          >
            Delete tag
          </button>
        </div>
      ) : null}
    </Modal>
  );
}

TagManagerModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  customTags: PropTypes.array,
  onUpdateTag: PropTypes.func.isRequired,
  onDeleteTag: PropTypes.func.isRequired,
};

export default TagManagerModal;
