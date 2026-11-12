import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { PRESET_THEMES, THEME_TOKENS, resolveTheme } from '../../utils/themes';
import { createId } from '../../utils/ids';

function Swatches({ colors }) {
  return (
    <span className="theme-swatches" aria-hidden="true">
      {['bg-page', 'bg-panel', 'accent'].map((key) => (
        <span key={key} style={{ background: colors[key] }} />
      ))}
    </span>
  );
}

Swatches.propTypes = { colors: PropTypes.object.isRequired };

/** Theme, display and streak preferences; shown as the Settings tab of the app menu. */
function SettingsPanel({
  theme,
  customThemes,
  density,
  streaksEnabled,
  onUpdateSettings,
  onSetStreaksEnabled,
  onPreview,
}) {
  // Draft being edited: { id?, name, colors }. id is set when editing a saved theme.
  const [draft, setDraft] = useState(null);

  // Leaving the panel (closing the menu, switching tabs) discards an unsaved preview.
  useEffect(() => () => onPreview(null), [onPreview]);

  const startEditing = (next) => {
    setDraft(next);
    onPreview(next.colors);
  };

  const cancelEditing = () => {
    setDraft(null);
    onPreview(null);
  };

  const setColor = (key, value) => {
    const colors = { ...draft.colors, [key]: value };
    setDraft({ ...draft, colors });
    onPreview(colors);
  };

  const saveDraft = () => {
    const name = draft.name.trim();
    if (!name) return;
    const saved = { id: draft.id || createId(), name, colors: draft.colors };
    const nextThemes = draft.id
      ? customThemes.map((t) => (t.id === draft.id ? saved : t))
      : [...customThemes, saved];
    onUpdateSettings({ customThemes: nextThemes, theme: saved.id });
    cancelEditing();
  };

  const deleteTheme = (id) => {
    onUpdateSettings({
      customThemes: customThemes.filter((t) => t.id !== id),
      ...(theme === id ? { theme: 'system' } : {}),
    });
  };

  const renderOption = (t, label = t.name) => (
    <button
      type="button"
      className={`theme-option${theme === t.id ? ' is-active' : ''}`}
      aria-pressed={theme === t.id}
      onClick={() => onUpdateSettings({ theme: t.id })}
    >
      {t.colors ? <Swatches colors={t.colors} /> : null}
      {label}
    </button>
  );

  const prefersDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

  return (
    <>
      {draft ? (
        <div className="theme-editor">
          <label className="theme-editor-name">
            Name
            <input
              type="text"
              className="text-input"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && saveDraft()}
              placeholder="My theme"
            />
          </label>
          <div className="theme-editor-colors">
            {THEME_TOKENS.map(({ key, label }) => (
              <label key={key} className="theme-color-field">
                <input
                  type="color"
                  value={draft.colors[key]}
                  onChange={(e) => setColor(key, e.target.value)}
                />
                {label}
              </label>
            ))}
          </div>
          <div className="button-row button-row--wrap">
            <button type="button" className="btn btn-secondary" onClick={cancelEditing}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={saveDraft} disabled={!draft.name.trim()}>
              Save theme
            </button>
          </div>
        </div>
      ) : (
        <>
          <h3 className="settings-section-title">Theme</h3>
          <div className="theme-options" role="group" aria-label="Theme">
            {renderOption({ id: 'system' }, 'System')}
            {PRESET_THEMES.map((t) => (
              <React.Fragment key={t.id}>{renderOption(t)}</React.Fragment>
            ))}
          </div>
          {customThemes.length > 0 ? (
            <>
              <h4 className="theme-section-title">Your themes</h4>
              <ul className="theme-custom-list">
                {customThemes.map((t) => (
                  <li key={t.id}>
                    {renderOption(t)}
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => startEditing({ ...t })}
                      aria-label={`Edit ${t.name}`}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => deleteTheme(t.id)}
                      aria-label={`Delete ${t.name}`}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          <div className="button-row">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() =>
                startEditing({
                  name: '',
                  colors: { ...resolveTheme(theme, customThemes, prefersDark()).colors },
                })
              }
            >
              Customize colors…
            </button>
          </div>

          <h3 className="settings-section-title">Display</h3>
          <div className="theme-options" role="group" aria-label="Density">
            {[
              { id: 'comfortable', label: 'Comfortable' },
              { id: 'compact', label: 'Compact' },
            ].map((d) => (
              <button
                key={d.id}
                type="button"
                className={`theme-option${density === d.id ? ' is-active' : ''}`}
                aria-pressed={density === d.id}
                onClick={() => onUpdateSettings({ density: d.id })}
              >
                {d.label}
              </button>
            ))}
          </div>
          <label className="checkbox-row settings-checkbox">
            <input
              type="checkbox"
              checked={streaksEnabled}
              onChange={(e) => onSetStreaksEnabled(e.target.checked)}
            />
            Completion streaks
          </label>
        </>
      )}
    </>
  );
}

SettingsPanel.propTypes = {
  theme: PropTypes.string.isRequired,
  customThemes: PropTypes.array.isRequired,
  density: PropTypes.string.isRequired,
  streaksEnabled: PropTypes.bool.isRequired,
  onUpdateSettings: PropTypes.func.isRequired,
  onSetStreaksEnabled: PropTypes.func.isRequired,
  onPreview: PropTypes.func.isRequired,
};

export default SettingsPanel;
