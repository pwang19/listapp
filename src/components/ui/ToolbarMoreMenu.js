import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

function ToolbarMoreMenu({
  archivedCount,
  bulkMode,
  onTemplates,
  onArchive,
  onPrintShare,
  onToggleBulk,
  onImportExport,
  onHelp,
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const run = (action) => {
    action();
    setOpen(false);
  };

  return (
    <div className="toolbar-more-wrap" ref={containerRef}>
      <button
        type="button"
        className="btn btn-secondary btn-icon"
        onClick={() => setOpen((v) => !v)}
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        ⋯
      </button>
      {open ? (
        <div className="toolbar-more-menu" role="menu">
          <button type="button" role="menuitem" onClick={() => run(onTemplates)}>
            Templates
          </button>
          <button type="button" role="menuitem" onClick={() => run(onArchive)}>
            Archived ({archivedCount})
          </button>
          <button type="button" role="menuitem" onClick={() => run(onPrintShare)}>
            Print / Share
          </button>
          <button type="button" role="menuitem" onClick={() => run(onToggleBulk)}>
            {bulkMode ? 'Exit bulk select' : 'Bulk select'}
          </button>
          <button type="button" role="menuitem" onClick={() => run(onImportExport)}>
            Import/Export
          </button>
          <button type="button" role="menuitem" onClick={() => run(onHelp)}>
            Keyboard shortcuts
          </button>
        </div>
      ) : null}
    </div>
  );
}

ToolbarMoreMenu.propTypes = {
  archivedCount: PropTypes.number.isRequired,
  bulkMode: PropTypes.bool.isRequired,
  onTemplates: PropTypes.func.isRequired,
  onArchive: PropTypes.func.isRequired,
  onPrintShare: PropTypes.func.isRequired,
  onToggleBulk: PropTypes.func.isRequired,
  onImportExport: PropTypes.func.isRequired,
  onHelp: PropTypes.func.isRequired,
};

export default ToolbarMoreMenu;
