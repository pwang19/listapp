import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

function ToolbarMoreMenu({
  archivedCount,
  bulkMode,
  streaksEnabled,
  streakCurrent,
  density,
  notificationsEnabled,
  onTemplates,
  onArchive,
  onPrintShare,
  onToggleBulk,
  onImportExport,
  onHelp,
  onToggleStreaks,
  onToggleDensity,
  onQuickCapture,
  onReview,
  onItemTemplates,
  onManageTags,
  onToggleNotifications,
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
          <button type="button" role="menuitem" onClick={() => run(onQuickCapture)}>
            Quick capture
          </button>
          <button type="button" role="menuitem" onClick={() => run(onReview)}>
            Weekly review
          </button>
          <button type="button" role="menuitem" onClick={() => run(onItemTemplates)}>
            Item templates
          </button>
          <div className="toolbar-more-separator" role="separator" />
          <button type="button" role="menuitem" onClick={() => run(onTemplates)}>
            List templates
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
          <div className="toolbar-more-separator" role="separator" />
          <button type="button" role="menuitem" onClick={() => run(onToggleStreaks)}>
            {streaksEnabled ? '✓ Completion streaks' : 'Completion streaks'}
          </button>
          <button type="button" role="menuitem" onClick={() => run(onToggleDensity)}>
            Density: {density === 'compact' ? 'Compact' : 'Comfortable'}
          </button>
          <button type="button" role="menuitem" onClick={() => run(onToggleNotifications)}>
            {notificationsEnabled ? '✓ Notifications' : 'Notifications'}
          </button>
          <button type="button" role="menuitem" onClick={() => run(onManageTags)}>
            Manage tags
          </button>
          <div className="toolbar-more-separator" role="separator" />
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
  streaksEnabled: PropTypes.bool,
  streakCurrent: PropTypes.number,
  density: PropTypes.string,
  notificationsEnabled: PropTypes.bool,
  onTemplates: PropTypes.func.isRequired,
  onArchive: PropTypes.func.isRequired,
  onPrintShare: PropTypes.func.isRequired,
  onToggleBulk: PropTypes.func.isRequired,
  onImportExport: PropTypes.func.isRequired,
  onHelp: PropTypes.func.isRequired,
  onToggleStreaks: PropTypes.func.isRequired,
  onToggleDensity: PropTypes.func.isRequired,
  onQuickCapture: PropTypes.func.isRequired,
  onReview: PropTypes.func.isRequired,
  onItemTemplates: PropTypes.func.isRequired,
  onManageTags: PropTypes.func.isRequired,
  onToggleNotifications: PropTypes.func.isRequired,
};

export default ToolbarMoreMenu;
