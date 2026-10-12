import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { flattenAllItems } from '../../utils/helpers';
import { formatEstimate } from '../../utils/estimates';

function ItemExtendedFields({
  estimateMinutes = 0,
  blockedBy = [],
  recurring = 'none',
  recurringIntervalDays = 0,
  recurringEndDate = '',
  customFieldValues = {},
  listCustomFields = [],
  lists = [],
  currentListId,
  currentItemId,
  onSave,
  onSkipRecurring,
  onSaveAsTemplate,
}) {
  const [blockerInput, setBlockerInput] = useState('');

  const allItems = flattenAllItems(lists).filter(
    (r) => !(r.listId === currentListId && r.item.id === currentItemId)
  );

  const addBlocker = (itemId) => {
    if (!itemId || blockedBy.includes(itemId)) return;
    onSave({ blockedBy: [...blockedBy, itemId] });
    setBlockerInput('');
  };

  return (
    <>
      <div className="field-row">
        <div className="field">
          <label htmlFor="estimate-input">Time estimate (minutes)</label>
          <input
            id="estimate-input"
            type="number"
            min="0"
            className="text-input"
            value={estimateMinutes || ''}
            onChange={(e) => onSave({ estimateMinutes: Number(e.target.value) || 0 })}
            placeholder="e.g. 30"
          />
          {estimateMinutes > 0 ? (
            <span className="field-hint">{formatEstimate(estimateMinutes)}</span>
          ) : null}
        </div>
      </div>

      <div className="field">
        <span className="field-label">Blocked by</span>
        {blockedBy.length > 0 ? (
          <ul className="blocker-list">
            {blockedBy.map((id) => {
              const found = allItems.find((r) => r.item.id === id);
              return (
                <li key={id}>
                  <span>{found ? `${found.listName}: ${found.item.text}` : id}</span>
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => onSave({ blockedBy: blockedBy.filter((b) => b !== id) })}
                  >
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="empty-hint">Not blocked</p>
        )}
        <select
          className="style-select"
          value={blockerInput}
          onChange={(e) => {
            setBlockerInput(e.target.value);
            addBlocker(e.target.value);
          }}
        >
          <option value="">Add blocker…</option>
          {allItems.map((r) => (
            <option key={r.item.id} value={r.item.id}>
              {r.listName}: {r.item.text}
            </option>
          ))}
        </select>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="recurring-interval">Custom interval (days)</label>
          <input
            id="recurring-interval"
            type="number"
            min="0"
            className="text-input"
            value={recurringIntervalDays || ''}
            onChange={(e) => onSave({ recurringIntervalDays: Number(e.target.value) || 0 })}
          />
        </div>
        <div className="field">
          <label htmlFor="recurring-end">Recurring end date</label>
          <input
            id="recurring-end"
            type="date"
            className="text-input"
            value={recurringEndDate || ''}
            onChange={(e) => onSave({ recurringEndDate: e.target.value })}
          />
        </div>
      </div>

      {recurring && recurring !== 'none' ? (
        <div className="field">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onSkipRecurring}>
            Skip next occurrence
          </button>
        </div>
      ) : null}

      {listCustomFields.length > 0 ? (
        <div className="field">
          <span className="field-label">Custom fields</span>
          {listCustomFields.map((field) => (
            <div key={field.id} className="custom-field-row">
              <label htmlFor={`cf-${field.id}`}>{field.label}</label>
              {field.type === 'checkbox' ? (
                <input
                  id={`cf-${field.id}`}
                  type="checkbox"
                  checked={Boolean(customFieldValues[field.id])}
                  onChange={(e) => onSave({
                    customFieldValues: { ...customFieldValues, [field.id]: e.target.checked },
                  })}
                />
              ) : (
                <input
                  id={`cf-${field.id}`}
                  type={field.type === 'number' ? 'number' : field.type === 'url' ? 'url' : 'text'}
                  className="text-input"
                  value={customFieldValues[field.id] ?? ''}
                  onChange={(e) => onSave({
                    customFieldValues: {
                      ...customFieldValues,
                      [field.id]: field.type === 'number' ? Number(e.target.value) : e.target.value,
                    },
                  })}
                />
              )}
            </div>
          ))}
        </div>
      ) : null}

      {onSaveAsTemplate ? (
        <div className="field">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onSaveAsTemplate}>
            Save as item template
          </button>
        </div>
      ) : null}
    </>
  );
}

ItemExtendedFields.propTypes = {
  estimateMinutes: PropTypes.number,
  blockedBy: PropTypes.array,
  recurring: PropTypes.string,
  recurringIntervalDays: PropTypes.number,
  recurringEndDate: PropTypes.string,
  customFieldValues: PropTypes.object,
  listCustomFields: PropTypes.array,
  lists: PropTypes.array,
  currentListId: PropTypes.string,
  currentItemId: PropTypes.string,
  onSave: PropTypes.func.isRequired,
  onSkipRecurring: PropTypes.func,
  onSaveAsTemplate: PropTypes.func,
};

export default ItemExtendedFields;
