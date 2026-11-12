/**
 * Color themes. A theme is a set of CSS color tokens (see styles/tokens.css)
 * applied to <html> as inline custom properties. Built-in presets are fixed;
 * custom themes are user-saved copies stored in settings.customThemes.
 */

/** Editable color tokens, in the order shown in the editor. */
export const THEME_TOKENS = [
  { key: 'bg-page', label: 'Page background' },
  { key: 'bg-page-accent', label: 'Page gradient' },
  { key: 'bg-card', label: 'Card background' },
  { key: 'bg-panel', label: 'Panel background' },
  { key: 'text-primary', label: 'Text' },
  { key: 'text-muted', label: 'Muted text' },
  { key: 'text-on-dark', label: 'Text on page' },
  { key: 'border', label: 'Borders' },
  { key: 'accent', label: 'Accent' },
];

export const PRESET_THEMES = [
  {
    id: 'light',
    name: 'Light',
    colors: {
      'bg-page': '#1a2332',
      'bg-page-accent': '#243447',
      'bg-card': '#f4f6f8',
      'bg-panel': '#ffffff',
      'text-primary': '#1c2430',
      'text-muted': '#6b7785',
      'text-on-dark': '#e8eef4',
      border: '#d0d7de',
      accent: '#2f6fed',
    },
  },
  {
    id: 'dark',
    name: 'Dark',
    colors: {
      'bg-page': '#0f1419',
      'bg-page-accent': '#1a2332',
      'bg-card': '#1e293b',
      'bg-panel': '#1e293b',
      'text-primary': '#e2e8f0',
      'text-muted': '#94a3b8',
      'text-on-dark': '#e2e8f0',
      border: '#334155',
      accent: '#2f6fed',
    },
  },
  {
    id: 'sepia',
    name: 'Sepia',
    colors: {
      'bg-page': '#5b4636',
      'bg-page-accent': '#7a5f48',
      'bg-card': '#f4ecd8',
      'bg-panel': '#fbf6ea',
      'text-primary': '#3b2f25',
      'text-muted': '#7d6b5a',
      'text-on-dark': '#f4ecd8',
      border: '#dccfb4',
      accent: '#b5651d',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    colors: {
      'bg-page': '#0f1a14',
      'bg-page-accent': '#1d3326',
      'bg-card': '#1b2a22',
      'bg-panel': '#1b2a22',
      'text-primary': '#e3efe6',
      'text-muted': '#93ab9b',
      'text-on-dark': '#e3efe6',
      border: '#2f4a3a',
      accent: '#3fae6f',
    },
  },
];

const HEX = /^#[0-9a-f]{6}$/i;

/** Keeps only valid themes with a complete set of #rrggbb colors. */
export function normalizeCustomThemes(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (t) =>
      t &&
      typeof t.id === 'string' &&
      typeof t.name === 'string' &&
      t.colors &&
      THEME_TOKENS.every(({ key }) => HEX.test(t.colors[key]))
  );
}

/**
 * Resolves a theme id ('system', a preset id, or a custom theme id) to a theme.
 * Unknown ids (e.g. a deleted custom theme) fall back to the system theme.
 */
export function resolveTheme(themeId, customThemes, prefersDark) {
  const all = [...PRESET_THEMES, ...customThemes];
  const found = themeId !== 'system' && all.find((t) => t.id === themeId);
  return found || PRESET_THEMES.find((t) => t.id === (prefersDark ? 'dark' : 'light'));
}

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Whether a set of colors should get the dark-mode styling for inputs, alerts, etc. */
export function isDarkColors(colors) {
  return luminance(colors['bg-panel']) < 0.5;
}

/** Applies theme colors to a root element. */
export function applyThemeColors(root, colors) {
  root.setAttribute('data-theme', isDarkColors(colors) ? 'dark' : 'light');
  THEME_TOKENS.forEach(({ key }) => root.style.setProperty(`--${key}`, colors[key]));
  root.style.setProperty('--accent-hover', `color-mix(in srgb, ${colors.accent} 80%, black)`);
}
