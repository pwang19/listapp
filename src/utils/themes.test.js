import { PRESET_THEMES, normalizeCustomThemes, resolveTheme, applyThemeColors } from './themes';
import { SETTINGS_KEY, loadSettings } from './storage';

const custom = { id: 'c1', name: 'Mine', colors: { ...PRESET_THEMES[2].colors, accent: '#ff0000' } };

test('resolveTheme picks presets, custom themes, and falls back to system', () => {
  expect(resolveTheme('sepia', [], false).id).toBe('sepia');
  expect(resolveTheme('c1', [custom], false)).toBe(custom);
  expect(resolveTheme('system', [], true).id).toBe('dark');
  expect(resolveTheme('deleted', [], false).id).toBe('light');
});

test('normalizeCustomThemes drops malformed themes and unsafe colors', () => {
  const bad = { ...custom, id: 'c2', colors: { ...custom.colors, accent: 'red; background: url(x)' } };
  expect(normalizeCustomThemes([custom, bad, null, { id: 'x' }])).toEqual([custom]);
  expect(normalizeCustomThemes('nope')).toEqual([]);
});

test('applyThemeColors sets tokens and dark styling by panel brightness', () => {
  const root = document.createElement('html');
  applyThemeColors(root, PRESET_THEMES.find((t) => t.id === 'forest').colors);
  expect(root.getAttribute('data-theme')).toBe('dark');
  expect(root.style.getPropertyValue('--accent')).toBe('#3fae6f');
  applyThemeColors(root, custom.colors);
  expect(root.getAttribute('data-theme')).toBe('light');
});

test('loadSettings migrates the old darkMode setting to theme', () => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ darkMode: 'dark' }));
  const settings = loadSettings();
  expect(settings.theme).toBe('dark');
  expect(settings.darkMode).toBeUndefined();
  localStorage.removeItem(SETTINGS_KEY);
});
