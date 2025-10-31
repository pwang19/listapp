import React, { useState, useEffect } from 'react';
import EditableText from './EditableText';
import ConfirmModal from './ConfirmModal';

function ListItemModal({ isOpen, itemName, description, subItems = [], onClose, onArchive, onSaveChanges, onNameChange, onAddSubItem, onToggleSubItem, onDeleteSubItem }) {
  const [descriptionValue, setDescriptionValue] = useState(description || '');
  const [confirmArchiveOpen, setConfirmArchiveOpen] = useState(false);
  const [subItemInput, setSubItemInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDescriptionValue(description || '');
      setSubItemInput('');
      setConfirmArchiveOpen(false);
    }
  }, [isOpen, description]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveChanges(descriptionValue);
    onClose();
  };

  const handleArchiveClick = () => {
    setConfirmArchiveOpen(true);
  };

  const handleConfirmArchive = () => {
    setConfirmArchiveOpen(false);
    onArchive();
    onClose();
  };

  const handleCancelArchive = () => {
    setConfirmArchiveOpen(false);
  };

  const handleNameSave = (newName) => {
    if (onNameChange) {
      onNameChange(newName);
    }
  };

  const handleSubItemKeyDown = (event) => {
    if (event.key === 'Enter') {
      if (subItemInput.trim() !== '') {
        if (onAddSubItem) {
          onAddSubItem(subItemInput.trim());
        }
        setSubItemInput('');
      }
    }
  };

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
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#666',
            padding: '0',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px'
          }}
          onMouseEnter={(e) => e.target.style.color = '#ff6b6b'}
          onMouseLeave={(e) => e.target.style.color = '#666'}
        >
          ×
        </button>
        
        <h2 style={{ 
          marginTop: 0, 
          marginBottom: '1.5rem',
          fontSize: '1.5rem',
          color: '#333',
          paddingRight: '2rem'
        }}>
          <EditableText 
            value={itemName} 
            onSave={handleNameSave}
            style={{ fontSize: '1.5rem', fontWeight: 'bold' }}
          />
        </h2>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.9rem',
            color: '#333',
            fontWeight: '500'
          }}>
            Description
          </label>
          <textarea
            value={descriptionValue}
            onChange={(e) => setDescriptionValue(e.target.value)}
            placeholder="Add a description..."
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '0.9rem',
              borderRadius: '4px',
              border: '1px solid #ccc',
              boxSizing: 'border-box',
              minHeight: '100px',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.9rem',
            color: '#333',
            fontWeight: '500'
          }}>
            Sub-items
          </label>
          <div style={{
            maxHeight: '200px',
            overflowY: 'auto',
            marginBottom: '0.5rem',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            padding: '0.5rem'
          }}>
            {subItems.length === 0 ? (
              <p style={{ 
                margin: '0.5rem 0', 
                color: '#999', 
                fontSize: '0.85rem',
                fontStyle: 'italic'
              }}>
                No sub-items yet
              </p>
            ) : (
              subItems.map((subItem, index) => (
                <div 
                  key={index} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem',
                    marginBottom: '0.25rem',
                    backgroundColor: subItem.complete ? '#f5f5f5' : 'transparent',
                    borderRadius: '4px'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={subItem.complete || false}
                    onChange={() => onToggleSubItem && onToggleSubItem(index)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span
                    style={{
                      flex: 1,
                      color: subItem.complete ? '#888' : '#333',
                      textDecoration: subItem.complete ? 'line-through' : 'none',
                      fontSize: '0.9rem'
                    }}
                  >
                    {subItem.text}
                  </span>
                  <button
                    onClick={() => onDeleteSubItem && onDeleteSubItem(index)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#666',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      padding: '0',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '4px'
                    }}
                    onMouseEnter={(e) => e.target.style.color = '#ff6b6b'}
                    onMouseLeave={(e) => e.target.style.color = '#666'}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
          <input
            type="text"
            value={subItemInput}
            onChange={(e) => setSubItemInput(e.target.value)}
            onKeyDown={handleSubItemKeyDown}
            placeholder="Add a sub-item..."
            style={{
              width: '100%',
              padding: '0.5rem',
              fontSize: '0.9rem',
              borderRadius: '4px',
              border: '1px solid #ccc',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={handleArchiveClick}
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
            Archive
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '0.5rem 1.5rem',
              fontSize: '0.9rem',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
      <ConfirmModal
        isOpen={confirmArchiveOpen}
        message={`Are you sure you want to archive "${itemName}"?`}
        onConfirm={handleConfirmArchive}
        onCancel={handleCancelArchive}
      />
    </div>
  );
}

export default ListItemModal;

