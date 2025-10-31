import React from 'react';

function ConfirmModal({ isOpen, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <p style={{ 
          marginTop: 0, 
          marginBottom: '1.5rem',
          fontSize: '1rem',
          color: '#333'
        }}>
          {message}
        </p>
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '0.5rem 1.5rem',
              fontSize: '0.9rem',
              backgroundColor: '#f0f0f0',
              color: '#333',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '0.5rem 1.5rem',
              fontSize: '0.9rem',
              backgroundColor: '#ff6b6b',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;

