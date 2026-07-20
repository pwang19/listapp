import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { LIST_COLORS, LIST_ICONS, SORT_MODES } from '../utils/constants';

const ICON_LABELS = {
  '📋': 'clipboard',
  '🛒': 'shopping',
  '✈️': 'travel',
  '📚': 'books',
  '🏠': 'home',
  '💼': 'work',
  '🎯': 'target',
  '✨': 'sparkles',
};

function ListCustomizePopover({
  icon,
  color,
  sortMode,
  onSetListStyle,
  onSetListMeta,
  onClose,
  anchorRef,
}) {
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        popoverRef.current?.contains(event.target) ||
        anchorRef?.current?.contains(event.target)
      ) {
        return;
      }
      onClose();
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose, anchorRef]);

  useEffect(() => {
    popoverRef.current?.querySelector('button, select')?.focus();
  }, []);

  const handleIconSelect = (nextIcon) => {
    onSetListStyle({ icon: nextIcon });
    onClose();
  };

  const handleColorSelect = (nextColor) => {
    onSetListStyle({ color: nextColor });
    onClose();
  };

  return (
    <div
      ref={popoverRef}
      className="list-customize-popover"
      role="dialog"
      aria-label="List customization"
    >
      <div className="list-customize-section">
        <span className="list-customize-label">Icon</span>
        <div className="icon-grid">
          {LIST_ICONS.map((opt) => (
            <button
              key={opt}
              type="button"
              className={`icon-grid-btn${icon === opt ? ' is-active' : ''}`}
              onClick={() => handleIconSelect(opt)}
              aria-label={`Icon: ${ICON_LABELS[opt] || opt}`}
              aria-pressed={icon === opt}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div className="list-customize-section">
        <span className="list-customize-label">Color</span>
        <div className="color-swatches">
          {LIST_COLORS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`color-swatch${color === opt.id ? ' is-active' : ''}`}
              style={{ backgroundColor: opt.value }}
              onClick={() => handleColorSelect(opt.id)}
              aria-label={`Color: ${opt.label}`}
              aria-pressed={color === opt.id}
            />
          ))}
        </div>
      </div>
      <div className="list-customize-section">
        <label className="list-customize-label" htmlFor="list-sort-select">
          Sort items
        </label>
        <select
          id="list-sort-select"
          className="style-select list-customize-sort"
          value={sortMode}
          onChange={(e) => onSetListMeta({ sortMode: e.target.value })}
          aria-label="Sort items"
        >
          {SORT_MODES.map((opt) => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

ListCustomizePopover.propTypes = {
  icon: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  sortMode: PropTypes.string.isRequired,
  onSetListStyle: PropTypes.func.isRequired,
  onSetListMeta: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  anchorRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
};

export default ListCustomizePopover;
