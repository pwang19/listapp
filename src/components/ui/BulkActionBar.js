import React from 'react';
import PropTypes from 'prop-types';

// Floating bar shown whenever items are selected. Selecting is not a mode:
// clearing the selection (✕ or Esc) is how you leave it.
function BulkActionBar({
  selectedCount,
  visibleCount,
  lists,
  onSelectAll,
  onComplete,
  onArchive,
  onMove,
  onAddTag,
  onClear,
}) {
  if (!selectedCount) return null;

  return (
    <div className="bulk-bar" role="toolbar" aria-label={`${selectedCount} selected`}>
      <span className="bulk-bar-count" aria-live="polite">
        {selectedCount} selected
      </span>
      {visibleCount > selectedCount ? (
        <button type="button" className="btn-link bulk-bar-select-all" onClick={onSelectAll}>
          Select all ({visibleCount})
        </button>
      ) : null}
      <span className="bulk-bar-divider" aria-hidden="true" />
      <button type="button" className="btn btn-secondary btn-sm" onClick={onComplete}>
        ✓ Complete
      </button>
      <select
        className="style-select"
        value=""
        onChange={(e) => {
          if (e.target.value) onMove(e.target.value);
        }}
        aria-label="Move selected items to list"
      >
        <option value="">Move to…</option>
        {lists.map((l) => (
          <option key={l.id} value={l.id}>
            {l.icon} {l.name}
          </option>
        ))}
      </select>
      <button type="button" className="btn btn-secondary btn-sm" onClick={onAddTag}>
        # Tag
      </button>
      <button type="button" className="btn btn-secondary btn-sm" onClick={onArchive}>
        Archive
      </button>
      <button
        type="button"
        className="bulk-bar-close"
        onClick={onClear}
        aria-label="Clear selection"
        title="Clear selection (Esc)"
      >
        ✕
      </button>
    </div>
  );
}

BulkActionBar.propTypes = {
  selectedCount: PropTypes.number.isRequired,
  visibleCount: PropTypes.number.isRequired,
  lists: PropTypes.array.isRequired,
  onSelectAll: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,
  onArchive: PropTypes.func.isRequired,
  onMove: PropTypes.func.isRequired,
  onAddTag: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
};

export default BulkActionBar;
