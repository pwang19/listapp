import React, { useState, useEffect } from 'react';

function EditableText({ value, onSave, className = "", style = {} }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleClick = () => {
    setIsEditing(true);
    setEditValue(value);
  };

  const handleChange = (event) => {
    setEditValue(event.target.value);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSave();
    } else if (event.key === 'Escape') {
      setIsEditing(false);
      setEditValue(value);
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  const handleSave = () => {
    if (editValue.trim() !== '') {
      onSave(editValue.trim());
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <input
        type="text"
        value={editValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        autoFocus
        className={className}
        style={style}
      />
    );
  }

  return (
    <span 
      onClick={handleClick} 
      className={className} 
      style={{ cursor: 'pointer', ...style }}
    >
      {value}
    </span>
  );
}

export default EditableText;

