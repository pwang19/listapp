import React, { useState } from 'react';
import List from './List';
import ConfirmModal from './ConfirmModal';
import ImportExportModal from './ImportExportModal';

function Main() {
  const [inputValue, setInputValue] = useState('');
  const [lists, setLists] = useState([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [listToDelete, setListToDelete] = useState(null);
  const [importExportModalOpen, setImportExportModalOpen] = useState(false);

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      if (inputValue.trim() !== '') {
        const newList = { 
          name: inputValue,
          items: []
        };
        setLists([...lists, newList]);
        setInputValue('');
      }
    }
  };

  const handleListNameChange = (index, newName) => {
    const updatedLists = lists.map((list, i) => 
      i === index ? { ...list, name: newName } : list
    );
    setLists(updatedLists);
  };

  const handleDeleteClick = (index) => {
    setListToDelete(index);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (listToDelete !== null) {
      const updatedLists = lists.filter((list, i) => i !== listToDelete);
      setLists(updatedLists);
    }
    setDeleteModalOpen(false);
    setListToDelete(null);
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setListToDelete(null);
  };

  // Handlers for list items
  const handleAddItem = (listIndex, itemText) => {
    const updatedLists = lists.map((list, i) => {
      if (i === listIndex) {
        const newItem = {
          text: itemText,
          complete: false,
          description: '',
          subItems: []
        };
        return { ...list, items: [...list.items, newItem] };
      }
      return list;
    });
    setLists(updatedLists);
  };

  const handleItemCheckboxChange = (listIndex, itemIndex) => {
    const updatedLists = lists.map((list, i) => {
      if (i === listIndex) {
        const updatedItems = list.items.map((item, j) =>
          j === itemIndex ? { ...item, complete: !item.complete } : item
        );
        return { ...list, items: updatedItems };
      }
      return list;
    });
    setLists(updatedLists);
  };

  const handleItemNameChange = (listIndex, itemIndex, newName) => {
    const updatedLists = lists.map((list, i) => {
      if (i === listIndex) {
        const updatedItems = list.items.map((item, j) =>
          j === itemIndex ? { ...item, text: newName } : item
        );
        return { ...list, items: updatedItems };
      }
      return list;
    });
    setLists(updatedLists);
  };

  const handleItemDescriptionChange = (listIndex, itemIndex, description) => {
    const updatedLists = lists.map((list, i) => {
      if (i === listIndex) {
        const updatedItems = list.items.map((item, j) =>
          j === itemIndex ? { ...item, description } : item
        );
        return { ...list, items: updatedItems };
      }
      return list;
    });
    setLists(updatedLists);
  };

  const handleAddSubItem = (listIndex, itemIndex, subItemText) => {
    const updatedLists = lists.map((list, i) => {
      if (i === listIndex) {
        const updatedItems = list.items.map((item, j) => {
          if (j === itemIndex) {
            return {
              ...item,
              subItems: [...(item.subItems || []), { text: subItemText, complete: false }]
            };
          }
          return item;
        });
        return { ...list, items: updatedItems };
      }
      return list;
    });
    setLists(updatedLists);
  };

  const handleToggleSubItem = (listIndex, itemIndex, subItemIndex) => {
    const updatedLists = lists.map((list, i) => {
      if (i === listIndex) {
        const updatedItems = list.items.map((item, j) => {
          if (j === itemIndex) {
            const updatedSubItems = (item.subItems || []).map((subItem, k) =>
              k === subItemIndex ? { ...subItem, complete: !subItem.complete } : subItem
            );
            return { ...item, subItems: updatedSubItems };
          }
          return item;
        });
        return { ...list, items: updatedItems };
      }
      return list;
    });
    setLists(updatedLists);
  };

  const handleDeleteSubItem = (listIndex, itemIndex, subItemIndex) => {
    const updatedLists = lists.map((list, i) => {
      if (i === listIndex) {
        const updatedItems = list.items.map((item, j) => {
          if (j === itemIndex) {
            const updatedSubItems = (item.subItems || []).filter((_, k) => k !== subItemIndex);
            return { ...item, subItems: updatedSubItems };
          }
          return item;
        });
        return { ...list, items: updatedItems };
      }
      return list;
    });
    setLists(updatedLists);
  };

  const handleArchiveItem = (listIndex, itemIndex) => {
    const updatedLists = lists.map((list, i) => {
      if (i === listIndex) {
        const updatedItems = list.items.filter((_, j) => j !== itemIndex);
        return { ...list, items: updatedItems };
      }
      return list;
    });
    setLists(updatedLists);
  };

  const handleArchiveCompletedItems = (listIndex) => {
    const updatedLists = lists.map((list, i) => {
      if (i === listIndex) {
        const remainingItems = list.items.filter(item => !item.complete);
        return { ...list, items: remainingItems };
      }
      return list;
    });
    setLists(updatedLists);
  };

  // Import/Export handlers
  const handleImportExportClick = () => {
    setImportExportModalOpen(true);
  };

  const handleImportExportClose = () => {
    setImportExportModalOpen(false);
  };

  const getJsonData = () => {
    return JSON.stringify(lists, null, 2);
  };

  const handleImport = (importedData) => {
    // Validate the imported data structure
    if (Array.isArray(importedData)) {
      // Ensure all lists have the expected structure
      const validatedLists = importedData.map(list => ({
        name: list.name || '',
        items: Array.isArray(list.items) ? list.items.map(item => ({
          text: item.text || '',
          complete: Boolean(item.complete),
          description: item.description || '',
          subItems: Array.isArray(item.subItems) ? item.subItems.map(subItem => ({
            text: subItem.text || '',
            complete: Boolean(subItem.complete)
          })) : []
        })) : []
      }));
      setLists(validatedLists);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '1200px' }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '2rem',
        marginBottom: '2rem',
        width: '100%'
      }}>
        {lists.map((list, index) => (
          <List 
            key={index}
            id={index} 
            name={list.name}
            items={list.items || []}
            onNameChange={(newName) => handleListNameChange(index, newName)}
            onDelete={() => handleDeleteClick(index)}
            onAddItem={(itemText) => handleAddItem(index, itemText)}
            onItemCheckboxChange={(itemIndex) => handleItemCheckboxChange(index, itemIndex)}
            onItemNameChange={(itemIndex, newName) => handleItemNameChange(index, itemIndex, newName)}
            onItemDescriptionChange={(itemIndex, description) => handleItemDescriptionChange(index, itemIndex, description)}
            onAddSubItem={(itemIndex, subItemText) => handleAddSubItem(index, itemIndex, subItemText)}
            onToggleSubItem={(itemIndex, subItemIndex) => handleToggleSubItem(index, itemIndex, subItemIndex)}
            onDeleteSubItem={(itemIndex, subItemIndex) => handleDeleteSubItem(index, itemIndex, subItemIndex)}
            onArchiveItem={(itemIndex) => handleArchiveItem(index, itemIndex)}
            onArchiveCompletedItems={() => handleArchiveCompletedItems(index)}
          />
        ))}
      </div>
      <div style={{ textAlign: 'center' }}>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Add a new list..."
          style={{ 
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            borderRadius: '4px',
            border: '1px solid #ccc',
            minWidth: '300px'
          }}
        />
        <div style={{ marginTop: '1rem' }}>
          <button
            onClick={handleImportExportClick}
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
            Import/Export
          </button>
        </div>
      </div>
      <ConfirmModal
        isOpen={deleteModalOpen}
        message={`Are you sure you want to delete "${listToDelete !== null ? lists[listToDelete]?.name : ''}"?`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
      <ImportExportModal
        isOpen={importExportModalOpen}
        jsonData={getJsonData()}
        onClose={handleImportExportClose}
        onImport={handleImport}
      />
    </div>
  );
}

export default Main;

