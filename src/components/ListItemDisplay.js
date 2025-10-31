import React from 'react';

function ListItemDisplay({ name, isComplete, onCheckboxChange, onNameClick, subItems = [], onSubItemToggle }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input 
          type="checkbox" 
          checked={isComplete}
          onChange={onCheckboxChange}
        />
        <span
          onClick={onNameClick}
          style={{ 
            color: isComplete ? '#888' : 'black',
            textDecoration: isComplete ? 'line-through' : 'none',
            cursor: 'pointer'
          }}
        >
          {name}
        </span>
      </div>
      {subItems.length > 0 && (
        <div style={{ marginTop: '0.5rem', marginLeft: '2rem' }}>
          {subItems.map((subItem, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '0.25rem'
              }}
            >
              <input
                type="checkbox"
                checked={subItem.complete || false}
                onChange={() => onSubItemToggle && onSubItemToggle(index)}
                style={{ cursor: 'pointer' }}
              />
              <span
                style={{
                  color: subItem.complete ? '#888' : '#666',
                  textDecoration: subItem.complete ? 'line-through' : 'none',
                  fontSize: '0.85rem'
                }}
              >
                {subItem.text}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ListItemDisplay;

