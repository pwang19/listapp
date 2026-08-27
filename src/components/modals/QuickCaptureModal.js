import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Modal from './Modal';

function QuickCaptureModal({ isOpen, onClose, onSubmit, inboxName = 'Inbox' }) {
  const [text, setText] = useState('');

  useEffect(() => {
    if (isOpen) setText('');
  }, [isOpen]);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setText('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} panelClassName="modal-panel--narrow">
      <h2 className="modal-title">Quick capture</h2>
      <p className="modal-hint">Adds to {inboxName}. Supports #tags, !dates, ~30m estimates.</p>
      <input
        type="text"
        className="text-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        placeholder="Capture a thought…"
        autoFocus
      />
      <div className="button-row">
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={!text.trim()}>
          Add to inbox
        </button>
      </div>
    </Modal>
  );
}

QuickCaptureModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  inboxName: PropTypes.string,
};

export default QuickCaptureModal;
