import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from './Modal';
import { getAllTags } from '../../utils/tags';

function BulkTagModal({
  isOpen,
  selectedCount,
  customTags,
  onClose,
  onConfirm,
  onAddCustomTag,
}) {
  const [selectedTags, setSelectedTags] = useState([]);
  const [newTagInput, setNewTagInput] = useState('');
  const allTags = getAllTags(customTags);

  const toggleTag = (tagId) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  const handleAddCustomTag = () => {
    const label = newTagInput.trim();
    if (!label) return;
    const tag = onAddCustomTag(label);
    if (tag) setSelectedTags((prev) => [...prev, tag.id]);
    setNewTagInput('');
  };

  const handleConfirm = () => {
    if (!selectedTags.length) return;
    onConfirm(selectedTags);
    setSelectedTags([]);
    setNewTagInput('');
    onClose();
  };

  const handleClose = () => {
    setSelectedTags([]);
    setNewTagInput('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} panelClassName="modal-panel--narrow">
      <h2 className="modal-title">Add tags to {selectedCount} item{selectedCount === 1 ? '' : 's'}</h2>
      <div className="tag-picker">
        {allTags.map((tag) => {
          const active = selectedTags.includes(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              className={`tag-chip tag-chip--picker${active ? ' is-active' : ''}`}
              style={{
                backgroundColor: active ? `${tag.color}33` : '#f3f4f6',
                color: active ? tag.color : '#6b7785',
                borderColor: active ? tag.color : 'transparent',
              }}
              onClick={() => toggleTag(tag.id)}
            >
              {tag.label}
            </button>
          );
        })}
      </div>
      <div className="tag-create-row">
        <input
          type="text"
          className="text-input"
          placeholder="New tag…"
          value={newTagInput}
          onChange={(e) => setNewTagInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag()}
        />
        <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddCustomTag}>
          Add
        </button>
      </div>
      <div className="button-row">
        <button type="button" className="btn btn-secondary" onClick={handleClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleConfirm}
          disabled={!selectedTags.length}
        >
          Add tags
        </button>
      </div>
    </Modal>
  );
}

BulkTagModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  selectedCount: PropTypes.number.isRequired,
  customTags: PropTypes.array,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onAddCustomTag: PropTypes.func.isRequired,
};

export default BulkTagModal;
