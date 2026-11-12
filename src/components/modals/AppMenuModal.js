import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import Modal from './Modal';
import SettingsPanel from './SettingsPanel';

export const MENU_TABS = [
  { id: 'actions', label: 'Actions' },
  { id: 'library', label: 'Library' },
  { id: 'settings', label: 'Settings' },
  { id: 'data', label: 'Data & help' },
];

function ActionList({ actions, onRun }) {
  return (
    <div className="menu-action-list">
      {actions.map((a) => (
        <button key={a.label} type="button" className="menu-action" onClick={() => onRun(a.action)}>
          <span>{a.label}</span>
          {a.hint ? <span className="menu-action-hint">{a.hint}</span> : null}
        </button>
      ))}
    </div>
  );
}

ActionList.propTypes = {
  actions: PropTypes.arrayOf(
    PropTypes.shape({ label: PropTypes.string.isRequired, hint: PropTypes.string, action: PropTypes.func.isRequired })
  ).isRequired,
  onRun: PropTypes.func.isRequired,
};

/** The app's single menu: actions, library, settings, and data/help, as tabs. */
function AppMenuModal({
  tab,
  onTabChange,
  onClose,
  archivedCount,
  bulkMode,
  onQuickCapture,
  onReview,
  onToggleBulk,
  onPrintShare,
  onCommandPalette,
  onTemplates,
  onItemTemplates,
  onArchive,
  onManageTags,
  onImportExport,
  onHelp,
  settingsProps,
}) {
  const tabRefs = useRef({});

  // Actions open another dialog, so close the menu first.
  const run = (action) => {
    onClose();
    action();
  };

  const actions = {
    actions: [
      { label: 'Quick capture', action: onQuickCapture },
      { label: 'Weekly review', action: onReview },
      { label: bulkMode ? 'Exit bulk select' : 'Bulk select', action: onToggleBulk },
      { label: 'Print / Share', action: onPrintShare },
      { label: 'Search commands', hint: '⌘K', action: onCommandPalette },
    ],
    library: [
      { label: 'List templates', hint: 't', action: onTemplates },
      { label: 'Item templates', action: onItemTemplates },
      { label: `Archived (${archivedCount})`, hint: 'a', action: onArchive },
      { label: 'Manage tags', action: onManageTags },
    ],
    data: [
      { label: 'Import / Export', action: onImportExport },
      { label: 'Keyboard shortcuts', hint: '?', action: onHelp },
    ],
  };

  const onTabKeyDown = (event) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const index = MENU_TABS.findIndex((t) => t.id === tab);
    const next = MENU_TABS[(index + step + MENU_TABS.length) % MENU_TABS.length].id;
    onTabChange(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <Modal isOpen={Boolean(tab)} onClose={onClose} title="Menu" panelClassName="modal-panel--narrow">
      <div className="menu-tabs" role="tablist" aria-label="Menu sections" onKeyDown={onTabKeyDown}>
        {MENU_TABS.map((t) => (
          <button
            key={t.id}
            ref={(el) => {
              tabRefs.current[t.id] = el;
            }}
            type="button"
            role="tab"
            id={`menu-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls="menu-tabpanel"
            tabIndex={tab === t.id ? 0 : -1}
            className={`menu-tab${tab === t.id ? ' is-active' : ''}`}
            onClick={() => onTabChange(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div id="menu-tabpanel" role="tabpanel" aria-labelledby={`menu-tab-${tab}`} className="menu-tabpanel">
        {tab === 'settings' ? (
          <SettingsPanel {...settingsProps} />
        ) : tab ? (
          <ActionList actions={actions[tab]} onRun={run} />
        ) : null}
      </div>
    </Modal>
  );
}

AppMenuModal.propTypes = {
  tab: PropTypes.string,
  onTabChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  archivedCount: PropTypes.number.isRequired,
  bulkMode: PropTypes.bool.isRequired,
  onQuickCapture: PropTypes.func.isRequired,
  onReview: PropTypes.func.isRequired,
  onToggleBulk: PropTypes.func.isRequired,
  onPrintShare: PropTypes.func.isRequired,
  onCommandPalette: PropTypes.func.isRequired,
  onTemplates: PropTypes.func.isRequired,
  onItemTemplates: PropTypes.func.isRequired,
  onArchive: PropTypes.func.isRequired,
  onManageTags: PropTypes.func.isRequired,
  onImportExport: PropTypes.func.isRequired,
  onHelp: PropTypes.func.isRequired,
  settingsProps: PropTypes.object.isRequired,
};

export default AppMenuModal;
