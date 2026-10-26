import React from 'react';
import PropTypes from 'prop-types';
import ToolbarMoreMenu from './ui/ToolbarMoreMenu';
import { VIEW_MODES } from '../utils/constants';
import { SYNC_STATUS_LABELS } from './modals/SyncModal';

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
  savedFilters = [],
  onApplySavedFilter,
  onSaveFilter,
  onDeleteSavedFilter,
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
  onToggleStreaks,
  onToggleDensity,
  onQuickCapture,
  onReview,
  onItemTemplates,
  onManageTags,
  syncStatus = 'disabled',
  onOpenSync,
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
        {filtersActive ? (
          <button type="button" className="btn btn-secondary btn-sm" onClick={onSaveFilter}>
            Save view
          </button>
        ) : null}
        {savedFilters.length > 0 ? (
          <select
            className="style-select saved-filters-select"
            value=""
            onChange={(e) => {
              const id = e.target.value;
              if (!id) return;
              if (id.startsWith('delete:')) {
                onDeleteSavedFilter(id.replace('delete:', ''));
              } else {
                onApplySavedFilter(id);
              }
              e.target.value = '';
            }}
            aria-label="Saved filter views"
          >
            <option value="">Saved views…</option>
            {savedFilters.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
            <option disabled>──────────</option>
            {savedFilters.map((f) => (
              <option key={`del-${f.id}`} value={`delete:${f.id}`}>Delete “{f.name}”</option>
            ))}
          </select>
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
          {settings.streaksEnabled && (settings.streakCurrent || 0) > 0 ? (
            <span className="streak-badge" title={`Longest streak: ${settings.streakLongest || 0} days`}>
              🔥 {settings.streakCurrent} day{(settings.streakCurrent || 0) === 1 ? '' : 's'}
            </span>
          ) : null}
          {syncStatus !== 'disabled' ? (
            <button
              type="button"
              className={`sync-badge sync-badge--${syncStatus}`}
              onClick={onOpenSync}
              aria-label={`Sync: ${SYNC_STATUS_LABELS[syncStatus]}`}
            >
              {SYNC_STATUS_LABELS[syncStatus]}
            </button>
          ) : null}
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
            streaksEnabled={settings.streaksEnabled}
            streakCurrent={settings.streakCurrent}
            density={settings.density || 'comfortable'}
            onTemplates={onTemplates}
            onArchive={onArchive}
            onPrintShare={onPrintShare}
            onToggleBulk={onToggleBulk}
            onImportExport={onImportExport}
            onHelp={onHelp}
            onToggleStreaks={onToggleStreaks}
            onToggleDensity={onToggleDensity}
            onQuickCapture={onQuickCapture}
            onReview={onReview}
            onItemTemplates={onItemTemplates}
            onManageTags={onManageTags}
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
  savedFilters: PropTypes.array,
  onApplySavedFilter: PropTypes.func.isRequired,
  onSaveFilter: PropTypes.func.isRequired,
  onDeleteSavedFilter: PropTypes.func.isRequired,
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
  onToggleStreaks: PropTypes.func.isRequired,
  onToggleDensity: PropTypes.func.isRequired,
  onQuickCapture: PropTypes.func.isRequired,
  onReview: PropTypes.func.isRequired,
  onItemTemplates: PropTypes.func.isRequired,
  onManageTags: PropTypes.func.isRequired,
  syncStatus: PropTypes.string,
  onOpenSync: PropTypes.func,
};

export default Toolbar;
