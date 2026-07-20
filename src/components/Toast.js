import React from 'react';
import PropTypes from 'prop-types';

function Toast({ message, onUndo, onDismiss, undoCount = 0, onRedo, redoCount = 0 }) {
  if (!message) return null;

  return (
    <div className="toast" role="status" aria-live="polite">
      <span className="toast-message">{message}</span>
      {onUndo ? (
        <button type="button" className="toast-undo" onClick={onUndo}>
          Undo{undoCount > 1 ? ` (${undoCount})` : ''}
        </button>
      ) : null}
      {onRedo ? (
        <button type="button" className="toast-undo" onClick={onRedo}>
          Redo{redoCount > 1 ? ` (${redoCount})` : ''}
        </button>
      ) : null}
      <button
        type="button"
        className="icon-button toast-dismiss"
        onClick={onDismiss}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

Toast.propTypes = {
  message: PropTypes.string,
  onUndo: PropTypes.func,
  onDismiss: PropTypes.func.isRequired,
  undoCount: PropTypes.number,
  onRedo: PropTypes.func,
  redoCount: PropTypes.number,
};

export default Toast;
