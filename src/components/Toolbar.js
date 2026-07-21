import React from 'react';
import PropTypes from 'prop-types';
import ToolbarMoreMenu from './ui/ToolbarMoreMenu';
import { VIEW_MODES } from '../utils/constants';

function Toolbar({
  searchRef,
  searchQuery,
  onSearchChange,
  itemFilter,
  onItemFilterChange,
  tagFilter,
  onTagFilterChange,
  allTags,
  filtersActive,
  onClearFilters,
  viewMode,
  settings,
  onUpdateSettings,
  archivedCount,
  bulkMode,
  onTemplates,
  onArchive,
  onPrintShare,
  onToggleBulk,
  onImportExport,
  onHelp,
  onCommandPalette,
}) {
  return (
    <>
      <div className="toolbar">
        <input
          ref={searchRef}
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search lists and items… (/)"
          aria-label="Search lists and items"
          className="text-input toolbar-search"
        />
        <div className="filter-group" role="group" aria-label="Item status filter">
          {['all', 'active', 'completed'].map((value) => (
            <button
              key={value}
              type="button"
              className={`chip-btn${itemFilter === value ? ' is-active' : ''}`}
              onClick={() => onItemFilterChange(value)}
            >
              {value.charAt(0).toUpperCase() + value.slice(1)}
            </button>
          ))}
        </div>
        <select
          className="style-select"
          value={tagFilter}
          onChange={(e) => onTagFilterChange(e.target.value)}
          aria-label="Filter by tag"
        >
          <option value="">All tags</option>
          {allTags.map((tag) => (
            <option key={tag.id} value={tag.id}>{tag.label}</option>
          ))}
        </select>
        {filtersActive ? (
          <button type="button" className="btn-link toolbar-clear" onClick={onClearFilters}>
            Clear filters
          </button>
        ) : null}
      </div>

      <div className="toolbar toolbar--actions">
        <div className="view-tabs" role="tablist" aria-label="View mode">
          {VIEW_MODES.map((v) => (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={viewMode === v.id}
              className={`chip-btn${viewMode === v.id ? ' is-active' : ''}`}
              onClick={() => onUpdateSettings({ viewMode: v.id })}
            >
              {v.label}
            </button>
          ))}
        </div>
        <div className="toolbar-actions-end">
          <button
            type="button"
            className="btn btn-secondary btn-icon"
            onClick={() => onUpdateSettings({ darkMode: settings.darkMode === 'dark' ? 'light' : 'dark' })}
            aria-label="Toggle dark mode"
          >
            {settings.darkMode === 'dark' ? '☀️' : '🌙'}
          </button>
          <ToolbarMoreMenu
            archivedCount={archivedCount}
            bulkMode={bulkMode}
            onTemplates={onTemplates}
            onArchive={onArchive}
            onPrintShare={onPrintShare}
            onToggleBulk={onToggleBulk}
            onImportExport={onImportExport}
            onHelp={onHelp}
          />
          <button
            type="button"
            className="btn btn-secondary btn-icon"
            onClick={onCommandPalette}
            title="Cmd+K"
            aria-label="Command palette"
          >
            ⌘K
          </button>
        </div>
      </div>
    </>
  );
}

Toolbar.propTypes = {
  searchRef: PropTypes.object,
  searchQuery: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  itemFilter: PropTypes.string.isRequired,
  onItemFilterChange: PropTypes.func.isRequired,
  tagFilter: PropTypes.string.isRequired,
  onTagFilterChange: PropTypes.func.isRequired,
  allTags: PropTypes.array.isRequired,
  filtersActive: PropTypes.bool.isRequired,
  onClearFilters: PropTypes.func.isRequired,
  viewMode: PropTypes.string.isRequired,
  settings: PropTypes.object.isRequired,
  onUpdateSettings: PropTypes.func.isRequired,
  archivedCount: PropTypes.number.isRequired,
  bulkMode: PropTypes.bool.isRequired,
  onTemplates: PropTypes.func.isRequired,
  onArchive: PropTypes.func.isRequired,
  onPrintShare: PropTypes.func.isRequired,
  onToggleBulk: PropTypes.func.isRequired,
  onImportExport: PropTypes.func.isRequired,
  onHelp: PropTypes.func.isRequired,
  onCommandPalette: PropTypes.func.isRequired,
};

export default Toolbar;
