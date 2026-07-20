import React from 'react';
import PropTypes from 'prop-types';
import Modal from './Modal';
import { TEMPLATES } from '../utils/templates';

function TemplatesModal({ isOpen, onClose, onSelect, userTemplates = [] }) {
  const allTemplates = [...TEMPLATES, ...userTemplates];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Templates"
      panelClassName="modal-panel--medium"
    >
      <button
        type="button"
        className="icon-button modal-close"
        onClick={onClose}
        aria-label="Close"
      >
        ×
      </button>
      <p className="empty-hint" style={{ fontStyle: 'normal', marginBottom: '1rem' }}>
        Add a ready-made list. Save your own lists via the list menu (⋯).
      </p>
      <div className="template-grid">
        {allTemplates.map((template) => (
          <button
            key={template.id}
            type="button"
            className="template-card"
            onClick={() => {
              onSelect(template.id);
              onClose();
            }}
          >
            <span className="template-icon">{template.icon}</span>
            <span className="template-name">{template.name}</span>
            <span className="template-count">{template.items.length} items</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}

TemplatesModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  userTemplates: PropTypes.array,
};

export default TemplatesModal;
