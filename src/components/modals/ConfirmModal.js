import React from 'react';
import PropTypes from 'prop-types';
import Modal from './Modal';

function ConfirmModal({ isOpen, message, onConfirm, onCancel, confirmLabel = 'Confirm' }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      panelClassName="modal-panel--narrow"
      zIndex={1100}
      labelledBy="confirm-modal-message"
    >
      <p id="confirm-modal-message" className="confirm-message">
        {message}
      </p>
      <div className="button-row button-row--spread">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="btn btn-danger" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

ConfirmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  message: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  confirmLabel: PropTypes.string,
};

export default ConfirmModal;
