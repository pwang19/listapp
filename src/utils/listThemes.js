export const LIST_THEMES = [
  { id: 'none', label: 'None' },
  { id: 'gradient', label: 'Gradient' },
  { id: 'dots', label: 'Dots' },
  { id: 'lines', label: 'Lines' },
  { id: 'waves', label: 'Waves' },
];

export const LIST_THEME_IDS = new Set(LIST_THEMES.map((t) => t.id));

/**
 * @param {string} colorValue hex color
 * @param {string} theme
 */
export function getListThemeStyle(colorValue, theme = 'none') {
  if (!theme || theme === 'none') return {};
  return { '--list-accent': colorValue };
}

/**
 * @param {string} theme
 */
export function getListThemeClass(theme = 'none') {
  if (!theme || theme === 'none') return '';
  return `list-card--theme-${theme}`;
}
