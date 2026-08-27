import React from 'react';
import PropTypes from 'prop-types';
import Modal from './Modal';

function ItemTemplatesModal({ isOpen, onClose, templates, onSelect, onDelete }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} panelClassName="modal-panel--medium">
      <h2 className="modal-title">Item templates</h2>
      {templates.length === 0 ? (
        <p className="empty-hint">No item templates yet. Save one from an item&apos;s details modal.</p>
      ) : (
        <ul className="template-list">
          {templates.map((t) => (
            <li key={t.id} className="template-list-row">
              <button type="button" className="template-card" onClick={() => onSelect(t.id)}>
                <span className="template-name">{t.name}</span>
                <span className="template-count">{t.text}</span>
              </button>
              <button type="button" className="btn-link" onClick={() => onDelete(t.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

ItemTemplatesModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  templates: PropTypes.array.isRequired,
  onSelect: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default ItemTemplatesModal;
