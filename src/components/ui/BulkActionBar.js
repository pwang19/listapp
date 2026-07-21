import React from 'react';
import PropTypes from 'prop-types';

function BulkActionBar({
  selectedCount,
  lists,
  onComplete,
  onArchive,
  onMove,
  onAddTag,
  onClear,
}) {
  if (!selectedCount) return null;

  return (
    <div className="bulk-bar" role="toolbar" aria-label="Bulk actions">
      <span className="bulk-bar-count">{selectedCount} selected</span>
      <button type="button" className="btn btn-secondary btn-sm" onClick={onComplete}>
        Complete
      </button>
      <button type="button" className="btn btn-secondary btn-sm" onClick={onArchive}>
        Archive
      </button>
      <select
        className="style-select"
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) onMove(e.target.value);
          e.target.value = '';
        }}
        aria-label="Move to list"
      >
        <option value="">Move to…</option>
        {lists.map((l) => (
          <option key={l.id} value={l.id}>
            {l.icon} {l.name}
          </option>
        ))}
      </select>
      <button type="button" className="btn btn-secondary btn-sm" onClick={onAddTag}>
        Add tag
      </button>
      <button type="button" className="btn-link" onClick={onClear}>
        Clear
      </button>
    </div>
  );
}

BulkActionBar.propTypes = {
  selectedCount: PropTypes.number.isRequired,
  lists: PropTypes.array.isRequired,
  onComplete: PropTypes.func.isRequired,
  onArchive: PropTypes.func.isRequired,
  onMove: PropTypes.func.isRequired,
  onAddTag: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
};

export default BulkActionBar;
