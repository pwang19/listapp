import React, { useState } from 'react';
import EditableText from './EditableText';
import ListItemDisplay from './ListItemDisplay';
import ListItemModal from './ListItemModal';

function List({
  name,
  items = [],
  onNameChange,
  onDelete,
  onAddItem,
  onItemCheckboxChange,
  onItemNameChange,
  onItemDescriptionChange,
  onAddSubItem,
  onToggleSubItem,
  onDeleteSubItem,
  onArchiveItem,
  onArchiveCompletedItems
}) {
  const [inputValue, setInputValue] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      if (inputValue.trim() !== '') {
        if (onAddItem) {
          onAddItem(inputValue.trim());
        }
        setInputValue('');
      }
    }
  };

  const handleCheckboxChange = (index) => {
    if (onItemCheckboxChange) {
      onItemCheckboxChange(index);
    }
  };

  const handleItemNameClick = (index) => {
    setSelectedItemIndex(index);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedItemIndex(null);
  };

  const handleSaveDescription = (description) => {
    if (selectedItemIndex !== null && onItemDescriptionChange) {
      onItemDescriptionChange(selectedItemIndex, description);
    }
  };

  const handleItemNameChange = (newName) => {
    if (selectedItemIndex !== null && onItemNameChange) {
      onItemNameChange(selectedItemIndex, newName);
    }
  };

  const handleAddSubItem = (subItemText) => {
    if (selectedItemIndex !== null && subItemText.trim() !== '' && onAddSubItem) {
      onAddSubItem(selectedItemIndex, subItemText.trim());
    }
  };

  const handleToggleSubItemInModal = (subItemIndex) => {
    if (selectedItemIndex !== null && onToggleSubItem) {
      onToggleSubItem(selectedItemIndex, subItemIndex);
    }
  };

  const handleDeleteSubItem = (subItemIndex) => {
    if (selectedItemIndex !== null && onDeleteSubItem) {
      onDeleteSubItem(selectedItemIndex, subItemIndex);
    }
  };

  const handleArchiveItem = () => {
    if (selectedItemIndex !== null && onArchiveItem) {
      onArchiveItem(selectedItemIndex);
      setSelectedItemIndex(null);
      setModalOpen(false);
    }
  };

  const handleArchiveClick = () => {
    if (onArchiveCompletedItems) {
      onArchiveCompletedItems();
    }
  }

  return (
    <div style={{ 
      border: '1px solid #ddd', 
      borderRadius: '8px', 
      padding: '1.5rem',
      backgroundColor: '#f9f9f9',
      minHeight: '400px',
      position: 'relative'
    }}>
      <button
        onClick={onDelete}
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
        marginBottom: '1rem',
        textAlign: 'center',
        color: '#333'
      }}>
        <EditableText 
          value={name} 
          onSave={onNameChange}
          className="list-title"
        />
      </h2>
      <ul style={{ 
        listStyle: 'none', 
        padding: 0, 
        marginBottom: '1rem',
        minHeight: '200px'
      }}>
        {items.map((item, index) => (
          <li key={index} style={{ marginBottom: '0.5rem' }}>
            <ListItemDisplay 
              name={item.text}
              isComplete={item.complete}
              subItems={item.subItems || []}
              onCheckboxChange={() => handleCheckboxChange(index)}
              onNameClick={() => handleItemNameClick(index)}
              onSubItemToggle={(subItemIndex) => {
                if (onToggleSubItem) {
                  onToggleSubItem(index, subItemIndex);
                }
              }}
            />
          </li>
        ))}
      </ul>
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Add a new item..."
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
      <button
        onClick={handleArchiveClick}
        style={{
          width: '100%',
          padding: '0.5rem',
          fontSize: '0.9rem',
          backgroundColor: '#ff6b6b',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Archive completed tasks
      </button>
      {selectedItemIndex !== null && items[selectedItemIndex] && (
        <ListItemModal
          isOpen={modalOpen}
          itemName={items[selectedItemIndex]?.text || ''}
          description={items[selectedItemIndex]?.description || ''}
          subItems={items[selectedItemIndex]?.subItems || []}
          onClose={handleModalClose}
          onArchive={handleArchiveItem}
          onSaveChanges={handleSaveDescription}
          onNameChange={handleItemNameChange}
          onAddSubItem={handleAddSubItem}
          onToggleSubItem={handleToggleSubItemInModal}
          onDeleteSubItem={handleDeleteSubItem}
        />
      )}
    </div>
  );
}

export default List;

