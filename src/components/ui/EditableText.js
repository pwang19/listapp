import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

function EditableText({ value, onSave, className = '', style = {} }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = () => {
    if (editValue.trim() !== '') {
      onSave(editValue.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSave();
    } else if (event.key === 'Escape') {
      setIsEditing(false);
      setEditValue(value);
    }
  };

  if (isEditing) {
    return (
      <input
        type="text"
        value={editValue}
        onChange={(event) => setEditValue(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        autoFocus
        className={className}
        style={style}
        aria-label="Edit text"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setIsEditing(true);
        setEditValue(value);
      }}
      className={`editable-text ${className}`.trim()}
      style={style}
    >
      {value}
    </button>
  );
}

EditableText.propTypes = {
  value: PropTypes.string.isRequired,
  onSave: PropTypes.func.isRequired,
  className: PropTypes.string,
  style: PropTypes.object,
};

export default EditableText;
