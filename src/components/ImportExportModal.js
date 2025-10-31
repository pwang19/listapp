import React, { useState, useEffect } from 'react';

function ImportExportModal({ isOpen, jsonData, onClose, onImport }) {
  const [jsonText, setJsonText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setJsonText(jsonData);
    }
  }, [isOpen, jsonData]);

  if (!isOpen) return null;

  const handleImport = () => {
    try {
      const parsed = JSON.parse(jsonText);
      onImport(parsed);
      onClose();
    } catch (error) {
      alert('Invalid JSON format. Please check your JSON and try again.');
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
        maxWidth: '700px',
        width: '90%',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        position: 'relative',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column'
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
          Import/Export Lists
        </h2>

        <div style={{ 
          marginBottom: '1.5rem',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0
        }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.9rem',
            color: '#333',
            fontWeight: '500'
          }}>
            JSON Data
          </label>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder="Paste or edit JSON data here..."
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '0.9rem',
              borderRadius: '4px',
              border: '1px solid #ccc',
              boxSizing: 'border-box',
              minHeight: '300px',
              resize: 'vertical',
              fontFamily: 'monospace',
              flex: 1
            }}
          />
        </div>

        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
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
            onClick={handleImport}
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
            Import
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImportExportModal;

