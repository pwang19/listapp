import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Modal from './Modal';

function SaveFilterModal({ isOpen, onClose, onSave }) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) setName('');
  }, [isOpen]);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
    setName('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} panelClassName="modal-panel--narrow">
      <h2 className="modal-title">Save current filters</h2>
      <p className="modal-hint">Saves search, status, and tag filters as a smart view.</p>
      <input
        type="text"
        className="text-input"
        placeholder="View name…"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        autoFocus
      />
      <div className="button-row">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSave}
          disabled={!name.trim()}
        >
          Save view
        </button>
      </div>
    </Modal>
  );
}

SaveFilterModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default SaveFilterModal;
